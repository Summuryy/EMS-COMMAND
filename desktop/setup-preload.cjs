const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('emsSetup',Object.freeze({create:(v)=>ipcRenderer.invoke('ems:create-admin',v)}));

contextBridge.exposeInMainWorld('emsMotion',Object.freeze({get:()=>ipcRenderer.invoke('ems:motion:get'),set:(mode)=>ipcRenderer.invoke('ems:motion:set',mode)}));

contextBridge.exposeInMainWorld('emsUpdates',Object.freeze({status:()=>ipcRenderer.invoke('ems:updates:status'),check:()=>ipcRenderer.invoke('ems:updates:check'),download:()=>ipcRenderer.invoke('ems:updates:download'),install:()=>ipcRenderer.invoke('ems:updates:install'),onStatus:(fn)=>{if(typeof fn!=='function')return;ipcRenderer.on('ems:update-status',(_event,s)=>fn(s));}}));
