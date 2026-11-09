'use strict';
// Only a signed public release feed should be enabled for production.
const {app, ipcMain, dialog} = require('electron');
const {join} = require('node:path');
const {readFileSync} = require('node:fs');
let updater=null, state={status:'unconfigured',percent:0,message:'Автообновления появятся после публикации подписанных сборок.'};
function initUpdates(getWindow,log){
  const emit=()=>{const win=getWindow();if(win&&!win.isDestroyed())win.webContents.send('ems:update-status',state);};
  const set=(status,message,percent=state.percent)=>{state={status,message,percent};log('update '+status+' '+message);emit();};
  let feed='';
  try{const cfg=JSON.parse(readFileSync(join(__dirname,'release-config.json'),'utf8'));feed=cfg.feedUrl||'';}catch{}
  if(!app.isPackaged){set('dev','Обновления доступны только в установленном приложении.');}
  else if(!/^https:\/\/[a-z0-9.-]+(?::443)?\/[a-z0-9_./-]+\/?$/i.test(feed)){set('unconfigured','Канал обновлений ещё не опубликован.');}
  else{
    try{
      const {autoUpdater}=require('electron-updater');
      updater=autoUpdater;updater.autoDownload=false;updater.autoInstallOnAppQuit=false;
      updater.setFeedURL({provider:'generic',url:feed});
      updater.on('checking-for-update',()=>set('checking','Проверяем наличие новой версии…'));
      updater.on('update-available',info=>set('available',`Доступна версия ${info.version}.`));
      updater.on('update-not-available',()=>set('current','Установлена последняя версия.'));
      updater.on('download-progress',p=>set('downloading',`Загрузка ${Math.round(p.percent)}%`,Math.round(p.percent)));
      updater.on('update-downloaded',()=>set('ready','Обновление загружено. Можно установить после смены.',100));
      updater.on('error',e=>set('error',e.message));
      set('idle','Проверка обновлений доступна.');
      setTimeout(()=>{updater.checkForUpdates().catch(e=>set('error',e.message));},4500);
    }catch(e){set('error','Не удалось подключить модуль обновлений: '+e.message);}
  }
  ipcMain.handle('ems:updates:status',()=>({...state,version:app.getVersion()}));
  ipcMain.handle('ems:updates:check',async()=>{if(!updater)return {...state};try{await updater.checkForUpdates();}catch(e){set('error',e.message);}return {...state};});
  ipcMain.handle('ems:updates:download',async()=>{if(!updater||state.status!=='available')return {...state};try{await updater.downloadUpdate();}catch(e){set('error',e.message);}return {...state};});
  ipcMain.handle('ems:updates:install',async()=>{if(!updater||state.status!=='ready')return {...state};const {response}=await dialog.showMessageBox(getWindow(),{type:'question',buttons:['Отмена','Перезапустить и обновить'],defaultId:0,cancelId:0,message:'Завершите активную смену перед обновлением.',detail:'EMS COMMAND закроется и установит новую версию.'});if(response===1)updater.quitAndInstall(false,true);return {...state};});
  return {getStatus:()=>({...state})};
}
module.exports={initUpdates};
