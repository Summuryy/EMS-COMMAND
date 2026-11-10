'use strict';
const $=id=>document.getElementById(id);
const buttons=['launch','check','update','repair','rollback'];
let busy=false;let lastChecked=null;let lastState=null;
function showProgress(s){
 $('message').textContent=s.detail||'';
 const percent=Math.max(0,Math.min(100,Number(s.percent)||0));
 $('progress').style.width=percent+'%';
 document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(percent));
 if(s.stage==='error')$('error').textContent=s.detail;
 if(s.stage==='available')$('update').classList.add('primary');
}
async function sync(){
 const r=await window.emsLauncher.status();
 if(!r.ok)throw Error(r.error);
 const s=r.result;lastState=s;
 $('installed').textContent='Установлено: '+(s.current||'не установлено');
 $('available').textContent='Доступно: '+(s.available||'—');
 $('trust').textContent=s.configured?'Канал: защищённый · Ed25519':'Канал не настроен';
 $('last-check').textContent=lastChecked?'Проверено: '+lastChecked.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'Проверка: ещё не выполнялась';
 $('launch').disabled=busy||!s.current||s.appRunning;
 $('update').disabled=busy||!s.configured||!s.canInstall||!s.updateAvailable||s.appRunning;
 $('update').textContent=s.current?(s.updateAvailable?'↓ Обновить до '+s.available:'✓ Последняя версия'):'↓ Установить приложение';
 $('update').classList.toggle('primary',!!s.updateAvailable||!s.current&&s.configured);
 if(!busy&&s.configured&&s.current&&!s.updateAvailable&&lastChecked){$('message').textContent='✓ Установлена актуальная версия '+s.current+'. Обновлений нет.';}
 $('check').disabled=busy||!s.configured;
 $('repair').disabled=busy||!s.current||s.appRunning;
 $('rollback').disabled=busy||!s.previous||s.appRunning;
}
async function action(name){
 if(busy)return;
 busy=true;$('error').textContent='';
 buttons.forEach(id=>$(id).disabled=true);
 try{
   const r=await window.emsLauncher[name]();
   if(!r.ok)throw Error(r.error||'Неизвестная ошибка');
   if(name==='check'){lastChecked=new Date();}
   if(name==='check'&&r.result?.newer)$('message').textContent='Доступна версия '+r.result.version+'. Рекомендуем обновиться.';
   if(name==='check'&&!r.result?.newer)$('message').textContent='✓ Обновлений нет. Установлена последняя доступная версия.';
 }catch(e){$('message').textContent=name==='check'?'Не удалось проверить обновления':'Не удалось выполнить операцию';$('error').textContent=e.message;}
 finally{busy=false;await sync().catch(e=>{$('error').textContent=e.message;});}
}
function showFatal(detail){
 $('message').textContent='Ошибка подключения к внутреннему процессу лаунчера';
 $('error').textContent=detail;
 buttons.forEach(id=>$(id).disabled=true);
}
buttons.forEach(id=>$(id).disabled=true);
for(const [id,action] of [['win-min','minimize'],['win-max','maximize'],['win-close','close']]){
 $(id).addEventListener('click',()=>window.emsLauncher?.[action]?.());
}
if(!window.emsLauncher||typeof window.emsLauncher.status!=='function'){
 showFatal('Не загрузился защищённый мост Electron (preload.cjs). Закройте лаунчер, обновите ветку в GitHub Desktop и запустите снова. Если ошибка повторится, откройте DevTools (Ctrl+Shift+I) и пришлите текст из Console.');
}else{
 window.emsLauncher.onProgress(s=>{showProgress(s);if(['ready','checked','running','stopped'].includes(s.stage))sync().catch(e=>showFatal(e.message));});
 for(const name of buttons)$(name).addEventListener('click',()=>action(name));
 sync().then(()=>{$('message').textContent='Лаунчер готов. '+($('trust').textContent==='Канал не настроен'?'Канал обновлений ещё не настроен.':'Проверяем наличие обновлений…');if($('trust').textContent!=='Канал не настроен')action('check');}).catch(e=>showFatal(e.message));
}
