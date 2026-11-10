'use strict';
const {app,ipcMain,dialog}=require('electron');
const {join}=require('node:path');
const {readFileSync}=require('node:fs');
const https=require('node:https');
const crypto=require('node:crypto');
const MANIFEST_URL='https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/ems-manifest.json';
function getSignedManifest(url=MANIFEST_URL,depth=0){
 if(depth>5) return Promise.reject(Error('Слишком много перенаправлений'));
 const u=new URL(url);
 if(u.protocol!=='https:'||!['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname)||u.username||u.password)return Promise.reject(Error('Недоверенный адрес релиза'));
 return new Promise((resolve,reject)=>{
  const req=https.get(url,{timeout:15000,headers:{'User-Agent':'EMS-COMMAND/3.7','Accept':'application/json'}},res=>{
   if([301,302,303,307,308].includes(res.statusCode)){const next=new URL(res.headers.location||'',url).href;res.resume();getSignedManifest(next,depth+1).then(resolve,reject);return;}
   if(res.statusCode!==200){res.resume();reject(Error('Сервер обновлений: HTTP '+res.statusCode));return;}
   let size=0,parts=[];
   res.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024){req.destroy(Error('Слишком большой манифест'));return;}parts.push(chunk);});
   res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')));}catch(e){reject(e);}});
   res.on('error',reject);
  });
  req.on('timeout',()=>req.destroy(Error('Тайм-аут проверки обновлений')));req.on('error',reject);
 });
}
function newer(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}


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
  const snapshot=()=>({...state,version:app.getVersion(),latestVersion});
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
  const managed=process.env.EMS_MANAGED_BY_LAUNCHER==='1';
  const managedPublicKey=managed?Buffer.from(process.env.EMS_LAUNCHER_PUBLIC_KEY_PEM_B64||'','base64').toString('utf8'):'';
  const checkManaged=async()=>{
    if(!managedPublicKey.includes('BEGIN PUBLIC KEY'))throw Error('Ключ проверки лаунчера отсутствует. Запустите приложение через новый EMS Launcher.');
    const envelope=await getSignedManifest();
    const bytes=Buffer.from(JSON.stringify(envelope.manifest),'utf8');
    const signature=Buffer.from(envelope.signature||'','base64');
    const key=crypto.createPublicKey(managedPublicKey);
    if(key.asymmetricKeyType!=='ed25519'||signature.length!==64||!crypto.verify(null,bytes,key,signature))throw Error('Цифровая подпись обновления не прошла проверку');
    const version=envelope.manifest?.version;
    if(!/^\d+\.\d+\.\d+$/.test(version)||envelope.manifest.platform!=='win32-x64'||envelope.manifest.url!==`https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/download/v${version}/EMS-COMMAND-App-${version}-win-x64.zip`)throw Error('Неверный манифест релиза');
    latestVersion=version;
    set(newer(version,app.getVersion())?'managed-available':'current',newer(version,app.getVersion())?'Доступна версия '+version+'. Закройте приложение и установите её через EMS Launcher.':'Установлена последняя версия. Проверка Ed25519 пройдена.',0);
    return snapshot();
  };
  if(managed){
    set('managed','Проверка релизов доступна внутри приложения. Установка и восстановление выполняются через EMS Launcher.');
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
  ipcMain.handle('ems:updates:status',guard(async()=>snapshot()));
  ipcMain.handle('ems:updates:check',guard(async()=>{
    if(managed){set('checking','Проверяем подпись официального релиза…',0);return checkManaged();}
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
