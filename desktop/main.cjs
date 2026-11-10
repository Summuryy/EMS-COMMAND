'use strict';
const {app,BrowserWindow,dialog,session,ipcMain} = require('electron');
const {spawn,spawnSync} = require('node:child_process');
const {join} = require('node:path');
const {mkdirSync,appendFileSync} = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const {initUpdates} = require('./updates.cjs');
let mainWindow, backend, shuttingDown=false;
let activePort=0;let dataDir,root,engineEnv;let settingUp=false;
function log(line){
  try{const dir=join(app.getPath('userData'),'logs');mkdirSync(dir,{recursive:true});appendFileSync(join(dir,'desktop.log'),new Date().toISOString()+' '+String(line)+'\n');}catch{}
}
function error(title,details){log(title+': '+details);dialog.showErrorBox(title, String(details)+'\n\nЛог: '+join(app.getPath('userData'),'logs','desktop.log'));}
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});}
function health(port,token){return new Promise(resolve=>{const req=http.get({host:'127.0.0.1',port,path:'/__ems/ready',timeout:1200,headers:{'X-EMS-Health-Token':token}},res=>{let txt='';res.on('data',c=>txt+=c);res.on('end',()=>{try{resolve(res.statusCode===200&&JSON.parse(txt).ok===true);}catch{resolve(false);}});});req.on('error',()=>resolve(false));req.on('timeout',()=>{req.destroy();resolve(false);});});}
function splash(){
 mainWindow=new BrowserWindow({width:1320,height:860,minWidth:960,minHeight:640,backgroundColor:'#10151c',title:'EMS COMMAND — Госбольница RP',titleBarStyle:'hidden',titleBarOverlay:{color:'#10151c',symbolColor:'#e6edf5',height:36},autoHideMenuBar:true,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,webviewTag:false,preload:join(__dirname,'setup-preload.cjs')}});
 mainWindow.removeMenu();
 mainWindow.once('ready-to-show',()=>mainWindow.show());
 mainWindow.loadFile(join(__dirname,'splash.html'));
 mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 mainWindow.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith(`http://127.0.0.1:${activePort}/`) && ![join(__dirname,'setup.html'),join(__dirname,'splash.html')].some(x=>{try{return decodeURIComponent(new URL(url).pathname).replace(/^\//,'').toLowerCase()===x.replace(/^[a-z]:/i,'').replaceAll('\\','/').replace(/^\//,'').toLowerCase();}catch{return false;}})){e.preventDefault();log('Blocked navigation '+url);}});
 mainWindow.webContents.on('will-redirect',(e,url)=>{if(!url.startsWith(`http://127.0.0.1:${activePort}/`)){e.preventDefault();log('Blocked redirect '+url);}});
 mainWindow.on('closed',()=>{mainWindow=null;});
}
async function launchServer(){
 try{
  activePort=await freePort();
  const healthToken=crypto.randomBytes(32).toString('hex');
  const env={...engineEnv,EMS_PORT:String(activePort),EMS_HOST:'127.0.0.1',EMS_ORIGIN:`http://127.0.0.1:${activePort}`,EMS_HEALTH_TOKEN:healthToken};
  backend=spawn(process.execPath,[join(root,'server','index.mjs')],{cwd:root,env:{...env,ELECTRON_RUN_AS_NODE:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  backend.stdout.on('data',x=>log('server: '+String(x).trim()));
  backend.stderr.on('data',x=>log('server error: '+String(x).trim()));
  backend.on('error',err=>{log('backend startup: '+err.message);});
  backend.on('exit',(code,signal)=>{log('backend exit '+code+' '+signal);if(!shuttingDown){error('Не удалось запустить сервер EMS',`Процесс завершён: ${code ?? signal}. Проверьте лог.`);app.quit();}});
  let ready=false;
  for(let i=0;i<100;i++){
    if(!backend||backend.exitCode!==null)break;
    if(await health(activePort,healthToken)){ready=true;break;}
    await new Promise(r=>setTimeout(r,180));
  }
  if(!ready)throw Error('Локальный сервер не ответил. Проверьте desktop.log.');
  const url=`http://127.0.0.1:${activePort}/`;
  await mainWindow.loadURL(url);
  log('Application ready '+url);
 }catch(e){error('EMS COMMAND — ошибка запуска',e.stack||e.message);app.quit();}
}

function runNode(script,input){return new Promise((resolve)=>{
 const proc=spawn(process.execPath,[join(root,script)],{cwd:root,env:{...engineEnv,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,stdio:['pipe','pipe','pipe']});
 let out='',err='';const timeout=setTimeout(()=>proc.kill(),20000);proc.stdout.on('data',x=>{out=(out+String(x)).slice(-8192);});proc.stderr.on('data',x=>{err=(err+String(x)).slice(-8192);});
 proc.on('error',e=>resolve({ok:false,error:e.message}));
 proc.on('close',code=>{clearTimeout(timeout);resolve({ok:code===0,out,error:err.slice(0,500)});});
 proc.stdin.end(input||'');
 });}
async function start(){
 if(!app.requestSingleInstanceLock()){app.quit();return;}
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.focus();}});
 session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 app.setName('EMS COMMAND');
 root=join(__dirname,'..');dataDir=join(app.getPath('userData'),'database');mkdirSync(dataDir,{recursive:true});
 engineEnv={...process.env,EMS_DATA_DIR:dataDir};
 splash();
 initUpdates(()=>mainWindow,log,(url)=>{try{const parsed=new URL(url);return parsed.protocol==='http:'&&parsed.hostname==='127.0.0.1'&&parsed.port===String(activePort)&&parsed.pathname==='/';}catch{return false;}});
 const has=await runNode('tools/has-admin.mjs');
 if(!has.ok){error('Ошибка базы данных',has.error);app.quit();return;}
 if(has.out.trim()!=='YES'){
    settingUp=true;
    await mainWindow.loadFile(join(__dirname,'setup.html'));
 }else await launchServer();
}
ipcMain.handle('ems:create-admin',async(event,data)=>{
 if(!settingUp || !mainWindow || event.sender!==mainWindow.webContents || event.senderFrame!==event.sender.mainFrame || event.senderFrame.url!==require('node:url').pathToFileURL(join(__dirname,'setup.html')).href)return {ok:false,error:'Доступ запрещён'};
 settingUp=false;
 const result=await runNode('tools/bootstrap-admin.mjs',JSON.stringify({username:data?.username,displayName:data?.displayName,password:data?.password}));
 if(!result.ok){settingUp=true;return {ok:false,error:result.error||'Ошибка создания пользователя'};}
 setImmediate(()=>launchServer());return {ok:true};
});
app.whenReady().then(start);

app.on('before-quit',()=>{shuttingDown=true;if(backend){backend.kill();backend=null;}});
app.on('window-all-closed',()=>app.quit());
