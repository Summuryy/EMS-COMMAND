'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const invoke=action=>ipcRenderer.invoke('launcher:'+action);
contextBridge.exposeInMainWorld('emsLauncher',Object.freeze({
  status:()=>invoke('status'),
  check:()=>invoke('check'),
  update:()=>invoke('update'),
  repair:()=>invoke('repair'),
  launch:()=>invoke('launch'),
  rollback:()=>invoke('rollback'),
  onProgress:fn=>{
    if(typeof fn!=='function')return ()=>{};
    const handler=(_event,s)=>fn(s);
    ipcRenderer.on('launcher:progress',handler);
    return ()=>ipcRenderer.removeListener('launcher:progress',handler);
  }
}));
