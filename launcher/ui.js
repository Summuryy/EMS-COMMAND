'use strict';
const $=id=>document.getElementById(id);
const buttons=['launch','check','update','repair','rollback'];
let busy=false;
function showProgress(s){
 $('message').textContent=s.detail||'';
 const percent=Math.max(0,Math.min(100,Number(s.percent)||0));
 $('progress').style.width=percent+'%';
 document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(percent));
 if(s.stage==='error')$('error').textContent=s.detail;
}
async function sync(){
 const r=await window.emsLauncher.status();
 if(!r.ok)throw Error(r.error);
 const s=r.result;
 $('installed').textContent='Установлено: '+(s.current||'не установлено');
 $('available').textContent='Доступно: '+(s.available||'—');
 $('trust').textContent=s.configured?'Подпись: Ed25519':'Канал не настроен';
 $('launch').disabled=busy||!s.current;
 $('update').disabled=busy||!s.configured;
 $('check').disabled=busy||!s.configured;
 $('repair').disabled=busy||!s.current;
 $('rollback').disabled=busy||!s.previous;
}
async function action(name){
 if(busy)return;
 busy=true;$('error').textContent='';
 buttons.forEach(id=>$(id).disabled=true);
 try{
   const r=await window.emsLauncher[name]();
   if(!r.ok)throw Error(r.error||'Неизвестная ошибка');
   if(name==='check'&&r.result?.newer)$('message').textContent='Доступна новая версия '+r.result.version;
   if(name==='check'&&!r.result?.newer)$('message').textContent='Обновления не требуются';
 }catch(e){$('error').textContent=e.message;}
 finally{busy=false;await sync().catch(e=>{$('error').textContent=e.message;});}
}
window.emsLauncher.onProgress(s=>{showProgress(s);if(['ready','checked','running'].includes(s.stage))sync().catch(()=>{});});
for(const name of buttons)$(name).addEventListener('click',()=>action(name));
sync().catch(e=>{$('error').textContent=e.message;});
