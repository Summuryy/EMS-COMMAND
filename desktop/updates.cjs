'use strict';
const {app,ipcMain,dialog}=require('electron');
const {join}=require('node:path');
const {readFileSync,existsSync}=require('node:fs');
const {spawn}=require('node:child_process');
const {isAbsolute,basename}=require('node:path');

let updater=null;
let state={status:'unconfigured',percent:0,message:'Канал обновлений не настроен.'};
let latestVersion=null;
function isTrustedFeed(value){
  try {
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||!u.pathname.endsWith('/'))return false;
    const host=u.hostname.toLowerCase();
    return host!=='localhost'&&host!=='127.0.0.1'&&host!=='::1'&&
      !/^(?:10|127|169\.254|192\.168)\./.test(host)&&
      !/^172\.(?:1[6-9]|2\d|3[01])\./.test(host)&&
      !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
  }catch{return false;}
}
function initUpdates(getWindow,log,isTrustedSender=()=>false){
  const emit=()=>{
    const win=getWindow();
    if(win&&!win.isDestroyed()&&!win.webContents.isDestroyed())
      win.webContents.send('ems:update-status',snapshot());
  };
  const launcherExe=process.env.EMS_MANAGED_BY_LAUNCHER==='1'?process.env.EMS_LAUNCHER_EXE||'':'';
  const canOpenLauncher=()=>isAbsolute(launcherExe)&&/EMS.*Launcher.*\.exe$/i.test(basename(launcherExe))&&existsSync(launcherExe);
  const snapshot=()=>({...state,version:app.getVersion(),latestVersion,canOpenLauncher:canOpenLauncher()});
  const set=(status,message,percent=state.percent)=>{
    state={status,message,percent};log('update '+status+' '+message);emit();
  };
  const allowed=e=>!!e?.senderFrame&&e.senderFrame===e.sender.mainFrame&&
    e.sender===getWindow()?.webContents&&isTrustedSender(e.senderFrame.url);
  const guard=fn=>async e=>{
    if(!allowed(e))return {status:'error',percent:0,message:'Недоверенный источник запроса.'};
    try{return await fn();}catch(err){set('error',String(err?.message||err));return snapshot();}
  };
  let feed='';
  try{const cfg=JSON.parse(readFileSync(join(__dirname,'release-config.json'),'utf8'));feed=cfg.feedUrl||'';}catch{}
  if(process.env.EMS_MANAGED_BY_LAUNCHER==='1'){
    set('managed','Обновления EMS COMMAND устанавливаются отдельным EMS Launcher. Откройте лаунчер для проверки и восстановления файлов.');
  }else if(!app.isPackaged){
    set('dev','Проверка обновлений доступна только в установленной Windows-версии.');
  }else if(!isTrustedFeed(feed)){
    set('unconfigured','Укажите доверенный публичный HTTPS-канал в release-config.json при сборке. Приватный GitHub Releases без токена в клиенте недоступен.');
  }else {
    try{
      const {autoUpdater}=require('electron-updater');
      updater=autoUpdater;
      updater.autoDownload=false;
      updater.autoInstallOnAppQuit=false;
      updater.allowDowngrade=false;
      updater.allowPrerelease=false;
      updater.setFeedURL({provider:'generic',url:feed});
      updater.on('checking-for-update',()=>set('checking','Проверяем новую версию…',0));
      updater.on('update-available',info=>{latestVersion=info.version;set('available','Доступна версия '+info.version+'. Нажмите «Скачать обновление».',0);});
      updater.on('update-not-available',()=>{latestVersion=null;set('current','Установлена последняя версия.',0);});
      updater.on('download-progress',p=>set('downloading','Загрузка '+Math.round(p.percent)+'%',Math.round(p.percent)));
      updater.on('update-downloaded',()=>set('ready','Файл загружен. Сохраните работу перед установкой.',100));
      updater.on('error',e=>set('error','Ошибка канала обновлений: '+e.message,0));
      set('idle','Проверка при запуске включена. Также можно проверить вручную.');
      setTimeout(()=>{if(state.status==='idle')updater.checkForUpdates().catch(err=>set('error',err.message,0));},2600);
    }catch(err){set('error','Модуль обновлений недоступен: '+err.message);}
  }
  ipcMain.handle('ems:updates:open-launcher',guard(async()=>{
    if(!canOpenLauncher())return {...snapshot(),message:'Лаунчер не найден. Запустите EMS COMMAND через установленный EMS Launcher.'};
    const child=spawn(launcherExe,[],{detached:true,stdio:'ignore',windowsHide:false});
    child.unref();
    return {...snapshot(),message:'EMS Launcher открыт. Проверка и установка обновлений выполняются в нём.'};
  }));
  ipcMain.handle('ems:updates:status',guard(async()=>snapshot()));
  ipcMain.handle('ems:updates:check',guard(async()=>{
    if(!updater)return snapshot();
    if(['checking','downloading','ready'].includes(state.status))return snapshot();
    set('checking','Проверяем HTTPS-канал обновлений…',0);
    await updater.checkForUpdates();
    return snapshot();
  }));
  ipcMain.handle('ems:updates:download',guard(async()=>{
    if(!updater||state.status!=='available')return snapshot();
    set('downloading','Начинаем скачивание…',0);
    await updater.downloadUpdate();
    return snapshot();
  }));
  ipcMain.handle('ems:updates:install',guard(async()=>{
    if(!updater||state.status!=='ready')return snapshot();
    const win=getWindow();
    const {response}=await dialog.showMessageBox(win,{
      type:'question',buttons:['Отмена','Перезапустить и установить'],
      defaultId:0,cancelId:0,
      message:'Установить скачанное обновление?',
      detail:'Сохраните текущую работу и завершите смену. Приложение перезапустится.'
    });
    if(response===1)updater.quitAndInstall(false,true);
    return snapshot();
  }));
  return {getStatus:snapshot};
}
module.exports={initUpdates,isTrustedFeed};
