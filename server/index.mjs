import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config } from './config.mjs';
import { db } from './db.mjs';
import { api } from './api.mjs';
import { resumePending } from './jobs.mjs';

const publicRealDir=fs.realpathSync(config.publicDir);
const extTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
const headers={
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer','Cross-Origin-Opener-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob: data:; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'"
};
if(config.secureCookies)headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains';
const ocrProbe=config.ocrEnabled?spawnSync(config.ocrPath,['--version'],{timeout:1800,encoding:'utf8'}):null;
const ocrAvailable=!!ocrProbe&&!ocrProbe.error&&ocrProbe.status===0;
if(!ocrAvailable)console.warn('OCR: Tesseract не найден. Скриншоты будут уходить на ручную проверку.');
// Recovered OCR tasks can saturate a Windows CPU for minutes. Let the local
// server answer auth/dashboard first, then resume unfinished work in the background.
// Evidence data is not discarded or auto-approved by this delay.
const pendingResumeTimer=setTimeout(()=>{
  try{resumePending();}catch(err){console.error('[ocr-resume]',err.message);}
},12000);
pendingResumeTimer.unref?.();
const server=http.createServer(async(req,res)=>{
  for(const [name,value] of Object.entries(headers))res.setHeader(name,value);
  // Reject DNS-rebinding / foreign-Host requests to the locally bound API.
  if(['127.0.0.1','localhost','::1'].includes(config.host)){
    const expectedHost=new URL(config.origin).host.toLowerCase();
    if(typeof req.headers.host!=='string'||req.headers.host.toLowerCase()!==expectedHost){
      res.writeHead(421,{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'});
      res.end('Недоверенный адрес запроса');
      return;
    }
  }
  try{
    const url=new URL(req.url,config.origin);
    // Desktop launcher readiness check uses a per-launch secret, not a forgeable public /api/health response.
    if(url.pathname==='/__ems/ready'){
      const expected=process.env.EMS_HEALTH_TOKEN;
      if(!expected||req.headers['x-ems-health-token']!==expected){
        res.writeHead(403,{'Cache-Control':'no-store'});res.end();return;
      }
      res.setHeader('Cache-Control','no-store');
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.end(JSON.stringify({ok:true}));return;
    }
    if(url.pathname==='/api/health'){
      res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
      res.end(JSON.stringify({ok:true,version:'3.6.0',ocrAvailable,mode:config.host==='127.0.0.1'?'local':'server'}));return;
    }
    if(await api(req,res,url))return;
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    let requested=decodeURIComponent(url.pathname);
    if(requested==='/'||requested==='/index.html')requested='/index.html';
    // No arbitrary filesystem paths, even on Windows. Only static directory assets.
    const safe=path.normalize(requested).replace(/^([/\\])+/, '');
    const absolute=path.resolve(config.publicDir,safe);
    if(!absolute.startsWith(config.publicDir+path.sep)&&absolute!==config.publicDir){res.writeHead(404);res.end();return;}
    if(!fs.existsSync(absolute)||!fs.statSync(absolute).isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Не найдено');return;
    }
    // Reject symlinks that escape the static asset directory.
    const resolvedFile=fs.realpathSync(absolute);
    if(!resolvedFile.startsWith(publicRealDir+path.sep)){res.writeHead(404);res.end();return;}
    const ext=path.extname(resolvedFile);
    if(!extTypes[ext]){res.writeHead(403);res.end();return;}
    res.setHeader('Content-Type',extTypes[ext]);
    res.setHeader('Cache-Control',ext==='.html'?'no-store':'public,max-age=120');
    fs.createReadStream(resolvedFile).on('error',()=>res.destroy()).pipe(res);
  }catch(e){
    console.error('[http]',e.message);
    if(!res.headersSent){res.writeHead(400);res.end('Некорректный запрос');}else res.destroy();
  }
});
server.headersTimeout=12000;
server.requestTimeout=30000;
server.keepAliveTimeout=5000;
server.maxRequestsPerSocket=100;
server.listen(config.port,config.host,()=>{
  const users=db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  console.log(`\nEMS COMMAND v3.6 · ${config.origin}\nПользователей: ${users} | OCR: ${ocrAvailable?'доступен':'недоступен'}\n`);
  if(!users)console.log('Сначала остановите сервер и запустите: npm run setup');
});
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0);}));
