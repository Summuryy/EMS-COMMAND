'use strict';
const {app,BrowserWindow,ipcMain,session,dialog}=require('electron');
const {join}=require('node:path');
const {pathToFileURL}=require('node:url');
const {LauncherManager}=require('./core.cjs');
const fs=require('node:fs/promises');
let window=null,manager=null,working=false;
const page=pathToFileURL(join(__dirname,'index.html')).href;
const safeError=err=>({ok:false,error:String(err?.message||err).slice(0,500)});
const progress=p=>{
 if(window&&!window.isDestroyed()&&!window.webContents.isDestroyed())
   window.webContents.send('launcher:progress',p);
};
async function prefs(){
 try{return JSON.parse(await fs.readFile(join(app.getPath('userData'),'launcher-prefs.json'),'utf8'));}
 catch{return {autoUpdate:true};}
}
async function run(name,fn){
 if(working)return {ok:false,error:'Выполняется другая операция'};
 working=true;
 try{return {ok:true,result:await fn()};}catch(e){progress({stage:'error',detail:e.message,percent:0});return safeError(e);}
 finally{working=false;}
}
async function start(){
 if(!app.requestSingleInstanceLock()){app.quit();return;}
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 app.setName('EMS COMMAND Launcher');
 session.defaultSession.setPermissionRequestHandler((_w,_p,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 window=new BrowserWindow({
   width:960,height:650,minWidth:730,minHeight:500,backgroundColor:'#0b121f',
   title:'EMS COMMAND Launcher',autoHideMenuBar:true,show:false,
   webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,webviewTag:false,
     preload:join(__dirname,'preload.cjs')}
 });
 window.removeMenu();
 window.once('ready-to-show',()=>window.show());
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(e,url)=>{if(url!==page)e.preventDefault();});
 window.webContents.on('will-redirect',(e,url)=>{if(url!==page)e.preventDefault();});
 manager=new LauncherManager(join(app.getPath('userData'),'managed'),progress);
 await manager.init();
 const allowed=e=>e.sender===window?.webContents&&e.senderFrame===e.sender.mainFrame&&e.senderFrame.url===page;
 function handle(action,fn){
   ipcMain.handle('launcher:'+action,async e=>allowed(e)?fn():{ok:false,error:'Недоверенный IPC вызов'});
 }
 handle('status',async()=>({ok:true,result:{...await manager.status(),autoUpdate:(await prefs()).autoUpdate!==false}}));
 handle('check',()=>run('check',()=>manager.check()));
 handle('update',()=>run('update',()=>manager.update()));
 handle('repair',()=>run('repair',()=>manager.update({repair:true})));
 handle('launch',()=>run('launch',()=>manager.launch()));
 handle('rollback',()=>run('rollback',()=>manager.rollback()));
 await window.loadFile(join(__dirname,'index.html'));
 if((await prefs()).autoUpdate!==false&&manager.trust.publicKeyPem){
   setTimeout(()=>{run('auto-update',async()=>{
     const result=await manager.check();
     if(result.newer)await manager.update();
   }).catch(()=>{});},2000);
 }
}
app.whenReady().then(start).catch(e=>{dialog.showErrorBox('Ошибка лаунчера',String(e.message||e));app.quit();});
app.on('window-all-closed',()=>app.quit());
