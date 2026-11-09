'use strict';
// Only a signed public release feed should be enabled for production.
const {app, ipcMain, dialog} = require('electron');
const {join} = require('node:path');
const {readFileSync} = require('node:fs');
let updater=null, state={status:'unconfigured',percent:0,message:'Для обновлений нужен опубликованный канал подписанных релизов.'};
function initUpdates(getWindow,log){
  const emit=()=>{const win=getWindow();if(win&&!win.isDestroyed())win.webContents.send('ems:update-status',state);};
  const set=(status,message,percent=state.percent)=>{state={status,message,percent};log('update '+status+' '+message);emit();};
  let feed='';
  try{const cfg=JSON.parse(readFileSync(join(__dirname,'release-config.json'),'utf8'));feed=cfg.feedUrl||'';}catch{}
  if(!app.isPackaged){set('dev','Обновления доступны только в установленном приложении.');}
  else if(!isTrustedFeed(feed)){set('unconfigured','Канал обновлений пока не опубликован. Настройте публичный канал релизов.');}
  else{
    try{
      const {autoUpdater}=require('electron-updater');
      updater=autoUpdater;updater.autoDownload=true;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;
      updater.setFeedURL({provider:'generic',url:feed});
      updater.on('checking-for-update',()=>set('checking','Проверяем наличие новой версии…'));
      updater.on('update-available',info=>set('available',`Найдена версия ${info.version}. Загружаем в лаунчере…`));
      updater.on('update-not-available',()=>set('current','Установлена последняя версия.'));
      updater.on('download-progress',p=>set('downloading',`Загрузка ${Math.round(p.percent)}%`,Math.round(p.percent)));
      updater.on('update-downloaded',()=>set('ready','Обновление загружено. Установи его после завершения смены.',100));
      updater.on('error',e=>set('error',e.message));
      set('idle','Лаунчер проверяет обновления при запуске.');
      setTimeout(()=>{updater.checkForUpdates().catch(e=>set('error',e.message));},1800);
    }catch(e){set('error','Не удалось подключить модуль обновлений: '+e.message);}
  }
  ipcMain.handle('ems:updates:status',()=>({...state,version:app.getVersion()}));
  ipcMain.handle('ems:updates:check',async()=>{if(!updater)return {...state};try{await updater.checkForUpdates();}catch(e){set('error',e.message);}return {...state};});
  ipcMain.handle('ems:updates:download',async()=>{if(!updater||state.status!=='available')return {...state};try{await updater.downloadUpdate();}catch(e){set('error',e.message);}return {...state};});
  ipcMain.handle('ems:updates:install',async()=>{if(!updater||state.status!=='ready')return {...state};const {response}=await dialog.showMessageBox(getWindow(),{type:'question',buttons:['Отмена','Перезапустить и обновить'],defaultId:0,cancelId:0,message:'Завершите активную смену перед обновлением.',detail:'EMS COMMAND закроется и установит новую версию.'});if(response===1)updater.quitAndInstall(false,true);return {...state};});
  return {getStatus:()=>({...state})};
}
function isTrustedFeed(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname!=='localhost'&&!/^(127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)&&u.pathname.endsWith('/');}catch{return false;}}
module.exports={initUpdates,isTrustedFeed};
