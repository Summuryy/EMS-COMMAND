'use strict';
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const https=require('node:https');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {safeVersion,safeRel,verifyEnvelope,installedDir,validRedirect,MAX_ARCHIVE,MAX_UNPACKED}=require('./security.cjs');
const MAX_MANIFEST=2*1024*1024;
function getTrust(){return JSON.parse(fs.readFileSync(path.join(__dirname,'trust.json'),'utf8'));}
function report(fn,stage,detail='',percent=0){fn?.({stage,detail,percent:Math.max(0,Math.min(100,Math.round(percent)))});}
async function request(url,{file,limit,progress,signal}={},depth=0){
 if(depth>6||!validRedirect(url))throw Error('Untrusted release URL or redirect');
 return new Promise((resolve,reject)=>{
   const req=https.get(url,{headers:{'User-Agent':'EMS-COMMAND-Launcher/1.0','Accept':'application/octet-stream'},timeout:20000},async res=>{
     try{
       if([301,302,303,307,308].includes(res.statusCode)){
         const target=new URL(res.headers.location||'',url).href;res.resume();
         resolve(await request(target,{file,limit,progress,signal},depth+1));return;
       }
       if(res.statusCode!==200)throw Error('Release server HTTP '+res.statusCode);
       let received=0;
       const chunks=[];
       const handle=file?await fsp.open(file,'wx'):null;
       try{
         for await(const chunk of res){
           received+=chunk.length;
           if(received>limit)throw Error('Release file exceeds safety limit');
           if(handle){let offset=0;while(offset<chunk.length){const result=await handle.write(chunk,offset,chunk.length-offset);if(result.bytesWritten<=0)throw Error('Failed to write update file');offset+=result.bytesWritten;}}
           else chunks.push(chunk);
           progress?.(received,Number(res.headers['content-length'])||0);
         }
       }finally{await handle?.close();}
       resolve(file?received:Buffer.concat(chunks));
     }catch(e){res.destroy();reject(e);}
   });
   req.on('timeout',()=>req.destroy(Error('Release server timed out')));
   req.on('error',reject);
   signal?.addEventListener('abort',()=>req.destroy(Error('Operation cancelled')),{once:true});
 });
}
async function readState(base){
 try{
   const data=JSON.parse(await fsp.readFile(path.join(base,'state.json'),'utf8'));
   return {current:data.current?safeVersion(data.current):null,previous:data.previous?safeVersion(data.previous):null};
 }catch(e){if(e.code==='ENOENT')return {current:null,previous:null};throw e;}
}
async function saveState(base,data){
 const tmp=path.join(base,'state.'+crypto.randomUUID()+'.tmp');
 try{
   await fsp.writeFile(tmp,JSON.stringify(data),'utf8');
   await fsp.rename(tmp,path.join(base,'state.json'));
 }finally{await fsp.rm(tmp,{force:true}).catch(()=>{});}
}
async function shaFile(p){
 const hash=crypto.createHash('sha256');
 for await(const chunk of fs.createReadStream(p))hash.update(chunk);
 return hash.digest('hex');
}
async function walk(dir,root=dir,items=[]){
 for(const d of await fsp.readdir(dir,{withFileTypes:true})){
   const full=path.join(dir,d.name);
   if(d.isSymbolicLink()||(!d.isDirectory()&&!d.isFile()))throw Error('Unsupported installed file type');
   if(d.isDirectory())await walk(full,root,items);
   else items.push({full,path:path.relative(root,full).split(path.sep).join('/')});
 }
 return items;
}
async function verifyFiles(dir,manifest,onProgress){
 const list=await walk(dir);
 if(list.length!==manifest.files.length)throw Error('Installed file count mismatch');
 const actual=new Map(list.map(x=>[x.path.toLowerCase(),x.full]));
 let done=0;
 for(const file of manifest.files){
   const full=actual.get(file.path.toLowerCase());
   if(!full)throw Error('Missing file: '+file.path);
   const st=await fsp.stat(full);
   if(st.size!==file.size||(await shaFile(full))!==file.sha256)throw Error('File damaged: '+file.path);
   done++;
   if(done%25===0||done===manifest.files.length)report(onProgress,'verifying','Проверено файлов: '+done+'/'+manifest.files.length,done/manifest.files.length*100);
 }
 return true;
}
async function extractVerified(zip,dir,manifest,onProgress){
 const extract=require('extract-zip');
 const known=new Set(manifest.files.map(f=>f.path.toLowerCase()));
 let expanded=0,count=0;
 await extract(zip,{dir,onEntry(entry){
   const name=entry.fileName,folder=name.endsWith('/');
   const rel=safeRel(folder?name.slice(0,-1):name);
   const mode=(entry.externalFileAttributes>>>16)&0o170000;
   if(mode===0o120000)throw Error('Symbolic links are prohibited in app archives');
   if(!folder&&!known.has(rel.toLowerCase()))throw Error('Unexpected archive file: '+rel);
   if(!folder){expanded+=entry.uncompressedSize;count++;}
   if(expanded>MAX_UNPACKED||count>manifest.files.length)throw Error('Excessive extracted content');
 }});
 report(onProgress,'verifying','Проверяем распакованные файлы…',0);
 await verifyFiles(dir,manifest,onProgress);
}
async function readRecord(base,version,trust){
 const envelope=JSON.parse(await fsp.readFile(path.join(base,'records',safeVersion(version)+'.json'),'utf8'));
 const manifest=verifyEnvelope(envelope,trust.publicKeyPem);
 if(manifest.version!==version)throw Error('Stored version mismatch');
 return {envelope,manifest};
}
class LauncherManager{
 constructor(base,onProgress=()=>{}){this.base=base;this.progress=onProgress;this.trust=getTrust();this.child=null;this.latest=null;this.busy=false;}
 async init(){await Promise.all(['versions','records','staging','quarantine'].map(x=>fsp.mkdir(path.join(this.base,x),{recursive:true})));}
 async status(){
   const state=await readState(this.base);
   return {current:state.current,previous:state.previous,available:this.latest?.manifest?.version||null,canInstall:!!this.latest?.manifest?.version,updateAvailable:!!this.latest?.manifest?.version&&(!state.current||compareVersions(this.latest.manifest.version,state.current)>0),configured:!!this.trust.publicKeyPem,appRunning:!!this.child&&this.child.exitCode===null,busy:this.busy};
 }
 async check(){
   if(!this.trust.publicKeyPem)throw Error('Ключ доверия не настроен. Публикация релизов пока недоступна.');
   report(this.progress,'checking','Проверяем подписанный манифест…');
   let bytes;
   try{
     bytes=await request(this.trust.manifestUrl,{limit:MAX_MANIFEST});
   }catch(err){
     if(/Release server HTTP 404/.test(String(err.message))){
       report(this.progress,'unavailable','Первый официальный выпуск EMS COMMAND ещё не опубликован.',0);
       throw Error('Официальный выпуск ещё не опубликован. Установка станет доступна после публикации подписанного релиза.');
     }
     throw err;
   }
   const envelope=JSON.parse(bytes.toString('utf8'));
   const manifest=verifyEnvelope(envelope,this.trust.publicKeyPem);
   const state=await readState(this.base);
   this.latest={envelope,manifest};
   const newer=!state.current||compareVersions(manifest.version,state.current)>0;
   report(this.progress,'checked',newer?'Доступна версия '+manifest.version:'Последняя версия установлена',100);
   return {newer,version:manifest.version,...await this.status()};
 }
 async update({repair=false}={}){
   if(this.busy)throw Error('Лаунчер занят другой операцией');
   this.busy=true;
   try{
     const state=await readState(this.base);
     let envelope,manifest;
     if(repair){
       if(!state.current)throw Error('Нет установленного приложения');
       ({envelope,manifest}=await readRecord(this.base,state.current,this.trust));
       try{await verifyFiles(installedDir(this.base,state.current),manifest,this.progress);report(this.progress,'ready','Файлы в порядке',100);return this.status();}catch{}
     }else{
       if(!this.latest)await this.check();
       ({envelope,manifest}=this.latest);
       if(state.current&&compareVersions(manifest.version,state.current)<0)throw Error('Автоматический откат версии запрещён');
     }
     if(this.child&&this.child.exitCode===null&&manifest.version===state.current)throw Error('Закройте EMS COMMAND перед восстановлением файлов');
     const stage=await fsp.mkdtemp(path.join(this.base,'staging','update-'));
     const archive=path.join(stage,'payload.zip'),extracted=path.join(stage,'unpacked');
     try{
       await fsp.mkdir(extracted);
       report(this.progress,'downloading','Загружаем файлы…',0);
       const count=await request(manifest.url,{file:archive,limit:MAX_ARCHIVE,progress:(read,total)=>report(this.progress,'downloading','Загружено '+(read/1048576).toFixed(1)+' МБ',total?read/total*100:0)});
       if(count!==manifest.size||await shaFile(archive)!==manifest.sha256)throw Error('SHA-256 архива не совпадает с подписанным манифестом');
       report(this.progress,'extracting','Распаковываем файлы…',0);
       await extractVerified(archive,extracted,manifest,this.progress);
       const dest=installedDir(this.base,manifest.version),quarantine=path.join(this.base,'quarantine',manifest.version+'-'+crypto.randomUUID());
       let displaced=false;
       if(fs.existsSync(dest)){await fsp.rename(dest,quarantine);displaced=true;}
       try{
         await fsp.rename(extracted,dest);
         await fsp.writeFile(path.join(this.base,'records',manifest.version+'.json'),JSON.stringify(envelope),'utf8');
         const previous=state.current!==manifest.version?state.current:state.previous;
         await saveState(this.base,{current:manifest.version,previous});
       }catch(e){
         await fsp.rm(dest,{recursive:true,force:true}).catch(()=>{});
         if(displaced)await fsp.rename(quarantine,dest).catch(()=>{});
         throw e;
       }
       if(displaced)await fsp.rm(quarantine,{recursive:true,force:true}).catch(()=>{});
       report(this.progress,'ready','Версия '+manifest.version+' установлена',100);
       return await this.status();
     }finally{await fsp.rm(stage,{recursive:true,force:true}).catch(()=>{});}
   }finally{this.busy=false;}
 }
 async launch(){
   if(this.child&&this.child.exitCode===null)throw Error('EMS COMMAND уже запущен');
   const state=await readState(this.base);
   if(!state.current)throw Error('Сначала установите приложение');
   const {manifest}=await readRecord(this.base,state.current,this.trust);
   const dir=installedDir(this.base,state.current);
   report(this.progress,'verifying','Проверяем установленную версию…',0);
   await verifyFiles(dir,manifest,this.progress);
   const binary=path.join(dir,manifest.entry);
   const child=spawn(binary,[],{cwd:dir,windowsHide:false,stdio:'ignore',detached:false,env:{...process.env,EMS_MANAGED_BY_LAUNCHER:'1'}});
   this.child=child;
   return new Promise((resolve,reject)=>{
     child.once('error',reject);
     child.once('spawn',()=>{child.once('exit',()=>{if(this.child===child)this.child=null;});report(this.progress,'running','EMS COMMAND запущен',100);resolve({running:true,version:state.current});});
   });
 }
 async rollback(){
   if(this.busy||this.child&&this.child.exitCode===null)throw Error('Закройте EMS COMMAND и завершите обновления перед откатом');
   const state=await readState(this.base);
   if(!state.previous)throw Error('Нет предыдущей версии');
   const {manifest}=await readRecord(this.base,state.previous,this.trust);
   await verifyFiles(installedDir(this.base,manifest.version),manifest,this.progress);
   await saveState(this.base,{current:state.previous,previous:state.current});
   report(this.progress,'ready','Восстановлена предыдущая версия '+state.previous,100);
   return this.status();
 }
}
function compareVersions(a,b){const x=safeVersion(a).split(/[.-]/).slice(0,3).map(Number),y=safeVersion(b).split(/[.-]/).slice(0,3).map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return Math.sign(x[i]-y[i]);return 0;}
module.exports={LauncherManager,readState,verifyFiles,extractVerified,request,compareVersions};
