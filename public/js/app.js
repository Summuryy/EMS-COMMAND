import {renderUpdatePanel} from './updater-ui.js';
import {request,setCsrf} from './api.js';
import {icon} from './icons.js';
import {esc,dateFmt,duration,catName,statusName} from './util.js';
import {userInitial,noticeRows,statusBadge} from './views/shared.js';
import {renderHome} from './views/home.js';
import {renderEvidence} from './views/evidence.js';
import {renderShift} from './views/shift.js';
import {renderCareer} from './views/career.js';
import {syncDutyTimeline} from './views/experience39.js';
import {renderAcademy} from './views/academy.js';
import {renderProfile} from './views/profile.js';
import {renderAdmin} from './views/admin.js';
import {renderPro} from './views/pro.js';
import {applyMotion,setMotionPreference,installCinematicPointer,installMotionEffects} from './motion.js';
import {ecg} from './views/visual.js';
import {createToastCenter} from './notifications.js';
const $=sel=>document.querySelector(sel);
const state={user:null,page:'home',filter:'all',evidenceSearch:'',dashboard:null,evidence:null,shifts:null,career:null,charter:[],charterSearch:'',queue:[],admin:{},adminTab:'reviews',inviteCode:null,mobile:false,notices:[],authMode:'login',busy:false,health:null,motionEnabled:localStorage.getItem('ems-motion-enabled')!=='false',motionOverride:localStorage.getItem('ems-motion-enabled')==='true'||localStorage.getItem('ems-motion-force')==='true'};
const pages=[['home','Центр управления','home'],['evidence','Доказательства','scan'],['shift','Смена','clock'],['career','Карьера','trophy'],['academy','Устав','book'],['profile','Профиль','user'],['pro','Автозахват · PRO','scan']];
const viewFns={home:renderHome,evidence:renderEvidence,shift:renderShift,career:renderCareer,academy:renderAcademy,profile:renderProfile,admin:renderAdmin,pro:renderPro};
const toastCenter=createToastCenter({getRoot:()=>$('#toast-stack'),icon});
function toast(title,detail='',error=false){toastCenter.notify(title,detail,{tone:error?'error':'success'});}
function authView(){return `<div class="auth-page"><div class="auth-art"><div class="auth-inner"><div class="logo-line"><div class="brandmark">${icon('medical',25)}</div><div><div class="brandtitle">EMS COMMAND</div><div class="branddesc">ГОСБОЛЬНИЦА / RP</div></div></div><h1>Смена.<br>Помощь.<br><span class="ems382-auth-accent">Карьера.</span></h1><p>Личный кабинет сотрудника госбольницы. Смены, доказательства, карьерный прогресс.</p><div class="auth-visual" aria-hidden="true"><div class="core-orbit"></div><div class="core-orbit"></div><div class="core-mark">${icon('medical',48)}</div></div><div class="caps">ГОСУДАРСТВЕННАЯ МЕДИЦИНСКАЯ СЛУЖБА</div></div></div><div class="auth-form-wrap"><div class="auth-form"><div class="eyebrow">EMS / ВХОД ДЛЯ СОТРУДНИКОВ</div><h2>${state.authMode==='login'?'Войти в систему':'Регистрация'}</h2><p>${state.authMode==='login'?'Доступ к персональному командному центру.':'Понадобится одноразовое приглашение от администратора.'}</p><form id="auth-form">${state.authMode==='register'?`<div class="input-group"><label for="displayName">Имя в игре</label><input id="displayName" name="displayName" class="field" required minlength="2" maxlength="60" placeholder="Имя Фамилия"></div>`:''}<div class="input-group"><label for="username">Логин</label><input id="username" name="username" class="field" autocomplete="username" required minlength="3" maxlength="32" pattern="[a-zA-Z0-9_.-]+" placeholder="username"></div><div class="input-group"><label for="password">Пароль</label><input id="password" name="password" class="field" type="password" required minlength="12" autocomplete="${state.authMode==='login'?'current-password':'new-password'}" placeholder="Не менее 12 символов"></div>${state.authMode==='register'?`<div class="input-group"><label for="invite">Код приглашения</label><input id="invite" name="invite" class="field" required maxlength="150" placeholder="Код от администрации"></div>`:''}<button type="submit" class="btn btn-primary btn-block">${icon(state.authMode==='login'?'lock':'shield',16)} ${state.authMode==='login'?'Войти':'Создать аккаунт'}</button></form><div class="auth-switch">${state.authMode==='login'?'Нет аккаунта?':'Уже зарегистрирован?'} <button class="text-btn" data-action="switch-auth">${state.authMode==='login'?'Регистрация по приглашению':'Войти'}</button></div><div class="dotted"></div><div class="tiny muted">Защищённая сессия · учётные записи хранятся на сервере EMS COMMAND.</div></div></div></div>`;}
function shell(){const pageLabel=(pages.find(x=>x[0]===state.page)||['','Администрирование'])[1];const unreads=state.notices.filter(n=>!n.read_at).length;return `<div class="layout ems38-layout ${state.mobile?'menu-open':''}"><aside class="rail"><div class="brand"><div class="brandmark v3-brandmark">${icon('medical',25)}</div><div><div class="brandtitle">EMS COMMAND</div><div class="branddesc">ГОСБОЛЬНИЦА / RP</div></div></div><div class="v3-sidebar-scroll"><div class="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div><nav class="nav-group" aria-label="Основная навигация">${pages.map(([id,title,ic],i)=>`<button class="nav-link ${state.page===id?'active':''}" data-nav="${id}" ${state.page===id?'aria-current="page"':''}>${icon(ic,18)}<span>${title}</span>${id==='evidence'&&state.queue.some(j=>!j.finished)?'<i class="v3-nav-pulse"></i>':''}</button>`).join('')}</nav>${['admin','reviewer'].includes(state.user.role)?`<div class="nav-label v3-nav-admin">УПРАВЛЕНИЕ</div><button class="nav-link ${state.page==='admin'?'active':''}" data-nav="admin">${icon('shield',18)}<span>Администрирование</span></button>`:''}</div><div class="rail-bottom"><div class="ems38-rail-hub" aria-label="Быстрый доступ"><div class="ems38-hub-kicker"><span>БЫСТРЫЙ ДОСТУП</span><span>EMS / CONTROL</span></div><button class="ems38-hub-link" data-nav="shift">${icon('clock',16)}<span>Моя смена</span>${icon('arrow',14)}</button><button class="ems38-hub-link" data-nav="evidence">${icon('file',16)}<span>Архив кадров</span>${icon('arrow',14)}</button></div><button class="rail-person" data-nav="profile" aria-label="Открыть профиль"><div class="avatar">${userInitial(state.user)}</div><div class="v3-person-copy"><strong>${esc(state.user.displayName)}</strong><span>#${esc(state.user.staticId||'—')} · Ранг ${esc(state.user.rank)}</span></div>${icon('chevron',15)}</button></div></aside><main class="main"><header class="topbar ems38-topbar"><div class="v3-crumb-line"><button class="btn btn-ghost btn-icon mobile-menu" data-action="toggle-menu" aria-label="Меню">${icon('menu',20)}</button><span class="station-dot"></span><div class="crumb"><span class="ems38-crumb-label">EMS COMMAND</span> <span class="v3-crumb-divider">/</span> <span>${esc(state.user.serverName||'Кутузовский')}</span> <span class="v3-crumb-divider">/</span> <strong>${esc(pageLabel)}</strong></div></div><div class="top-actions" aria-label="Действия приложения"><span class="online-pill ${state.health?.ok?'':'disconnected'}"><i class="v3-online-ring"></i>${state.health?.ok?'На связи':'Нет связи'}</span><button class="btn btn-ghost btn-icon" data-action="desktop-updates" title="Проверить обновления" aria-label="Проверить обновления">${icon('clock',18)}</button><button class="btn btn-ghost btn-icon v3-bell" data-action="notices" title="Уведомления" aria-label="Уведомления${unreads?' · '+unreads+' непрочитанных':''}">${icon('bell',18)}${unreads?`<span class="icon-count"></span>`:''}</button><button class="btn btn-ghost btn-icon" data-action="logout" title="Выйти" aria-label="Выйти">${icon('out',18)}</button><button class="btn btn-primary v3-upload-top" data-action="upload" aria-label="Добавить скриншоты" title="Горячая клавиша: Ctrl+Shift+U">${icon('plus',17)}<span> Добавить скриншоты</span></button></div></header><div class="page ems391-page-enter" id="page">${(viewFns[state.page]||renderHome)(state)}</div></main></div>`;}
function render(){state.systemReducedMotion=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);const focusId=document.activeElement?.id;let sel=null;try{if(focusId){const el=document.activeElement;sel={start:el.selectionStart,end:el.selectionEnd};}}catch{}$('#app').innerHTML=state.user?shell():authView();setMotionPreference(state.motionEnabled,state.motionOverride);applyMotion($('#app'));if(focusId&&sel){try{let el=document.getElementById(focusId);if(el){el.focus();el.setSelectionRange(sel.start,sel.end);}}catch{}}}
async function refreshPage(){if(!state.user)return;try{
  const p=state.page;
  if(p==='home')state.dashboard=await request('/api/dashboard');
  if(p==='evidence')state.evidence=await request('/api/evidence');
  if(p==='shift')state.shifts=await request('/api/shifts');
  if(p==='career')state.career=await request('/api/career');
  if(p==='academy'&&!state.charter.length){const rsp=await fetch('/data/charter.json');if(!rsp.ok)throw Error('Устав недоступен');state.charter=await rsp.json();}
  if(p==='admin')await refreshAdmin();
  const notices=await request('/api/notices');state.notices=notices.items||[];
 }catch(e){toast('Не удалось загрузить данные',e.message,true)}render();}
async function refreshAdmin(){const tab=state.adminTab;const k={reviews:'reviews',users:'users',audit:'audit'}[tab];if(k){state.admin[k]=await request('/api/admin/'+(k==='reviews'?'reviews':k==='users'?'users':'audit'));}}
async function goto(page){if(!viewFns[page]||page==='admin'&&!['admin','reviewer'].includes(state.user.role))return;state.page=page;state.mobile=false;state.charterSearch='';render();await refreshPage();window.scrollTo({top:0,behavior:state.motionEnabled&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'smooth':'auto'});}
async function upload(files){if(!state.user)return;const list=[...files].filter(f=>/\.(png|jpg|jpeg)$/i.test(f.name)||['image/png','image/jpeg'].includes(f.type));if(!list.length)return toast('Нет подходящих файлов','Выбери PNG или JPG.',true);
 const invalid=list.filter(f=>f.size>12*1024*1024||f.size<300);if(invalid.length)toast('Часть файлов пропущена',`${invalid.length}: размер не подходит`,true);
 const accepted=list.filter(f=>f.size<=12*1024*1024&&f.size>=300);
 state.page='evidence';state.queue=accepted.map((f,i)=>({id:'local-'+i,name:f.name,percent:0,label:'Ожидает загрузки',finished:false}));render();
 let count=0;for(const [i,file] of accepted.entries()){
  const job=state.queue[i];job.percent=6;job.label='Передача на сервер';updateQueue();
  try{const response=await request('/api/evidence?name='+encodeURIComponent(file.name),{method:'POST',body:file,binary:true});job.id=response.jobId;job.percent=13;job.label='В очереди OCR';count++;updateQueue();}
  catch(e){job.percent=100;job.label='Ошибка: '+e.message;job.finished=true;job.failed=true;updateQueue();toast('Ошибка загрузки',`${file.name}: ${e.message}`,true)}
 }
 if(count)toast('Файлы загружены',`${count} шт. направлено на автоматическую проверку`);
 await pollJobs();
}
function updateQueue(){if(state.page!=='evidence')return;const node=$('#page');if(!node)return;const oldScroll=window.scrollY,active=document.activeElement,restoreSearch=active?.id==='evidence-search',start=restoreSearch?active.selectionStart:null,end=restoreSearch?active.selectionEnd:null;node.innerHTML=renderEvidence(state);applyMotion(node);if(restoreSearch){const input=$('#evidence-search');if(input){input.focus({preventScroll:true});if(start!==null&&end!==null)input.setSelectionRange(start,end);}}window.scrollTo(0,oldScroll);}
let polling=false;
async function pollJobs(){if(polling)return;polling=true;try{for(let round=0;round<180;round++){
 let pending=state.queue.filter(j=>!j.finished&&!j.id.startsWith('local-'));if(!pending.length)break;
 await Promise.all(pending.map(async job=>{try{const r=await request('/api/jobs/'+job.id);job.percent=r.percent;job.label=r.finished?(r.status==='accepted'?'Принято':r.status==='duplicate'?'Дубликат':r.status==='rejected'?'Отклонено':'Нужна проверка'):r.label;job.finished=r.finished;job.status=r.status;}catch{job.label='Ожидаем сервер';}}));
 updateQueue();if(pending.every(j=>j.finished))break;
 await new Promise(resolve=>setTimeout(resolve,900));
 }
 if(state.queue.length&&state.queue.every(x=>x.finished)){const result=state.queue.filter(x=>!x.failed);toast('Проверка завершена',`Обработано: ${result.length}. Открой кадр, чтобы увидеть причины.`);await refreshPage();}
 }finally{polling=false;}}
function showModal(title,contents){$('#modal-root')?.remove();const el=document.createElement('div');el.className='modal-backdrop';el.id='modal-root';el.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><h2>${esc(title)}</h2><button class="btn btn-icon btn-ghost" data-action="close-modal" aria-label="Закрыть">${icon('close',18)}</button></div>${contents}</section>`;document.body.append(el);}
function closeModal(){updatePanelOpen=false;$('#modal-root')?.remove();}
async function detail(id){try{let item=state.evidence?.items?.find(x=>x.id===id)||state.dashboard?.recent?.find(x=>x.id===id)||state.admin.reviews?.items?.find(x=>x.id===id);if(!item)item=(await request('/api/evidence/'+id)).item;
 showModal('Карточка доказательства',`<img class="modal-image" src="${esc(item.imageUrl)}" alt="Оригинальный кадр"><div class="tag-row" style="margin-top:15px">${statusBadge(item.status)}<span class="badge">${esc(catName(item.category))}</span><span class="badge">Бодикамера: ${item.bodycam==='on'?'сигнал найден':'не подтверждена'}</span><span class="badge">Пациент: ${esc(item.patientId?'#'+item.patientId:'не найден')}</span></div><p class="modal-desc">${esc(item.reason)}</p><div class="grid g2" style="margin-bottom:14px"><div class="signal"><strong>Дата загрузки</strong><span>${dateFmt(item.createdAt)}</span></div><div class="signal"><strong>Анализ</strong><span>${esc(item.ocrEngine)}</span></div></div><h3 style="margin:16px 0 9px">Найденный текст</h3><div class="raw-text">${esc(item.ocrText||'Текст не распознан')}</div><div style="display:flex;gap:10px;justify-content:space-between;margin-top:16px"><button class="btn btn-red btn-sm" data-action="delete-evidence" data-id="${esc(item.id)}">${icon('trash',14)} Удалить</button><button class="btn btn-sm" data-action="close-modal">Закрыть</button></div>`);
 }catch(e){toast('Ошибка',e.message,true)}}
async function openNotifications(){try{const items=(await request('/api/notices')).items||[];showModal('Уведомления',noticeRows(items));if(items.some(n=>!n.read_at)){await request('/api/notices/read',{method:'POST',body:{}});state.notices=items.map(n=>({...n,read_at:n.read_at||new Date().toISOString()}));document.querySelector('.v3-bell .icon-count')?.remove();}}catch(e){toast('Ошибка',e.message,true)}}
async function handleAction(action,el){
 if(action==='force-motion'){
   state.motionEnabled=true;state.motionOverride=true;
   localStorage.setItem('ems-motion-enabled','true');
   localStorage.setItem('ems-motion-force','true');
   render();toast('Полный Motion/VFX включён','EMS COMMAND теперь показывает эффекты даже при ограничении Windows.');
   return;
  }
  if(action==='respect-system-motion'){
   state.motionEnabled=true;state.motionOverride=false;
   localStorage.removeItem('ems-motion-enabled');
   localStorage.removeItem('ems-motion-force');
   render();toast('Системный режим','EMS COMMAND снова учитывает ограничение движения Windows.');
   return;
  }
  if(action==='test-motion'){
   const box=$('#ems391-motion-test'),label=$('#ems391-motion-status');
   if(!box||!label)return;
   const reduce=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
   const ready=state.motionEnabled&&(!reduce||state.motionOverride)&&!document.hidden;
   box.setAttribute('aria-disabled',String(!ready));
   box.classList.remove('is-testing');
   if(!ready){
    label.textContent=!state.motionEnabled?'Анимации выключены переключателем выше.':reduce?'Windows ограничивает движение. Нажми «Включить полный Motion/VFX», чтобы разрешить эффекты в EMS COMMAND.':'Окно неактивно. Открой приложение для проверки.';
    return;
   }
   const track=box.querySelector('.ems391-motion-track');
   const probe=box.querySelector('.ems391-motion-probe');
   if(!track||!probe)return;
   probe.style.setProperty('--ems391-travel',Math.max(0,track.clientWidth-29)+'px');
   void box.offsetWidth;
   box.classList.add('is-testing');
   const active=window.getComputedStyle(probe).animationName.includes('ems391-motion-check');
   label.textContent=active?'Движение запущено: метка пройдёт линию за 2,7 секунды. Уведомление исчезнет за 5,5 секунды.':'CSS-анимация заблокирована. Проверь разрешение Motion/VFX.';
   if(active)toast('Motion/VFX работает','Проверь движущуюся метку и полосу времени этого уведомления.');
   else toast('Анимация не запустилась','CSS всё ещё запрещает движение. Проверь режим Motion/VFX.',true);
   return;
  }
 if(action==='upload'){ $('#global-files').click();return;}
 if(action==='clear-evidence-search'){state.evidenceSearch='';render();$('#evidence-search')?.focus({preventScroll:true});return;}
 if(action==='close-modal'){closeModal();return;}
 if(action==='toggle-menu'){state.mobile=!state.mobile;render();return;}
 if(action==='switch-auth'){state.authMode=state.authMode==='login'?'register':'login';render();return;}
 if(action==='refresh'){await refreshPage();toast('Обновлено');return;}
 if(action==='export-report'){const items=state.evidence?.items||[];const output={generatedAt:new Date().toISOString(),profile:{name:state.user.displayName,staticId:state.user.staticId,server:state.user.serverName},evidence:items.map(x=>({id:x.id,file:x.name,category:x.category,status:x.status,patientId:x.patientId,reason:x.reason,createdAt:x.createdAt}))};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='EMS_Evidence_Report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Отчёт выгружен',`${items.length} кадров · JSON`);return;}
 if(action==='notices'){await openNotifications();return;}
 if(action==='detail'){await detail(el.dataset.id);return;}
 if(action==='logout'){try{await request('/api/auth/logout',{method:'POST',body:{}});state.user=null;state.queue=[];state.evidenceSearch='';setCsrf(null);render();toast('Вы вышли из аккаунта');}catch(e){toast('Ошибка',e.message,true)}return;}
 if(action==='start-shift'||action==='end-shift'){
 try{if(action==='start-shift')await request('/api/shifts/start',{method:'POST',body:{}});else{const cur=state.shifts?.shifts?.find(s=>!s.end_at);if(!cur)return;await request(`/api/shifts/${cur.id}/end`,{method:'POST',body:{}});}toast(action==='start-shift'?'Смена началась':'Смена завершена');await refreshPage();}catch(e){toast('Не удалось изменить смену',e.message,true)}return;}
 if(action==='delete-evidence'){
 if(!confirm('Удалить этот скриншот из архива? Это действие нельзя отменить.'))return;
 try{await request(`/api/evidence/${el.dataset.id}`,{method:'DELETE',body:{}});closeModal();toast('Скриншот удалён');await refreshPage();}catch(e){toast('Ошибка удаления',e.message,true)}return;}
 if(action==='create-invite'){
 try{const r=await request('/api/admin/invites',{method:'POST',body:{}});state.inviteCode=r.code;render();toast('Код приглашения создан','Действует 48 часов; сохрани его сейчас.');}catch(e){toast('Ошибка',e.message,true)}return;}
 if(action==='copy-invite'){
 try{await navigator.clipboard.writeText(state.inviteCode);toast('Код скопирован');}catch{toast('Не удалось скопировать',state.inviteCode,true)}return;}
 if(action==='decide'){const id=el.dataset.id;const item=state.admin.reviews?.items?.find(x=>x.id===id);showModal('Решение по доказательству',`<p class="small muted" style="margin-bottom:20px">${esc(item?.name||id)}</p><form id="decision-form"><input type="hidden" name="id" value="${esc(id)}"><div class="input-group"><label>Категория доказательства</label><select class="field" name="category">${[['treatment','Лечение'],['pmp','ПМП'],['vaccination','Вакцинация'],['duty','Дежурство'],['promotion','Повышение'],['unknown','Не определено']].map(([v,l])=>`<option value="${v}" ${item?.category===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="input-group" style="margin-top:16px"><label>Решение</label><select class="field" name="decision"><option value="accepted">Принять</option><option value="review">Оставить на проверке</option><option value="rejected">Отклонить</option></select></div><div class="input-group" style="margin-top:16px"><label>Обоснование (от 8 символов)</label><textarea required minlength="8" maxlength="250" class="field" name="reason" rows="3" placeholder="Что проверено и почему принято решение"></textarea></div><button class="btn btn-primary" style="margin-top:17px" type="submit">Сохранить решение</button></form>`);return;}
 if(action==='verify-static'){
 const user=state.admin.users?.items?.find(x=>x.id===el.dataset.id);if(!user)return;
 showModal('Подтверждение Static ID',`<p class="small muted">${esc(user.display_name)} · ${esc(user.server_name)} · #${esc(user.static_id)}<br><br>В системе нет официальной интеграции с Majestic. Перед подтверждением сверь ID с игровыми данными.</p><div class="tag-row" style="margin-top:24px"><button class="btn btn-primary" data-action="static-decision" data-id="${esc(user.id)}" data-value="yes">${icon('check',16)} Подтвердить</button><button class="btn btn-red" data-action="static-decision" data-id="${esc(user.id)}" data-value="no">Отозвать</button></div>`);return;}
 if(action==='static-decision'){try{await request(`/api/admin/users/${el.dataset.id}/static`,{method:'POST',body:{verified:el.dataset.value==='yes'}});closeModal();toast('Статус привязки обновлён');await refreshPage();}catch(e){toast('Ошибка',e.message,true)}return;}
 if(action==='desktop-updates'){desktopUpdates();return;}
 if(action==='change-role'){
 const user=state.admin.users?.items?.find(x=>x.id===el.dataset.id);if(!user)return;
 if(user.role==='admin')return toast('Роль администратора заблокирована','Изменение прав администратора запрещено через веб-интерфейс.',true);
 showModal('Изменить доступ',`<p class="small muted" style="margin-bottom:15px">${esc(user.display_name)} · @${esc(user.username)}. После изменения сотруднику потребуется войти заново.</p><form id="role-form"><input type="hidden" name="id" value="${esc(user.id)}"><label for="new-role">Уровень доступа</label><select class="field" id="new-role" name="role"><option value="user" ${user.role==='user'?'selected':''}>Сотрудник</option><option value="reviewer" ${user.role==='reviewer'?'selected':''}>Проверяющий</option></select><button class="btn btn-primary" style="margin-top:18px" type="submit">Сохранить роль</button></form>`);return;}
 if(action==='change-rank'){const user=state.admin.users?.items?.find(x=>x.id===el.dataset.id);if(!user)return;showModal('Изменение ранга',`<p class="small muted" style="margin-bottom:17px">${esc(user.display_name)} · текущий ранг ${esc(user.rank)}</p><form id="rank-form"><input type="hidden" name="id" value="${esc(user.id)}"><label for="new-rank">Новый ранг (1–20)</label><input id="new-rank" class="field" type="number" min="1" max="20" name="rank" value="${esc(user.rank)}" required><button class="btn btn-primary" style="margin-top:18px" type="submit">Сохранить ранг</button></form>`);return;}
}
let updatePanelOpen=false;
async function desktopUpdates(){
 const u=window.emsUpdates;
 if(!u)return toast('Открывай EMS COMMAND с ярлыка','Обновления доступны только в установленном Windows-приложении.');
 try{const s=await u.status();updatePanelOpen=true;showModal('Центр обновлений',renderUpdatePanel(s));}
 catch(e){toast('Ошибка проверки обновлений',e.message,true);}
}
function paintUpdateStatus(s){
 if(!updatePanelOpen)return;
 const dialogEl=document.querySelector('#modal-root .modal');
 if(!dialogEl){updatePanelOpen=false;return;}
 const body=dialogEl.querySelector('.ems-update-hub');
 if(body)body.outerHTML=renderUpdatePanel(s);
}
if(window.emsUpdates?.onStatus){window.emsUpdates.onStatus(async status=>{
 try{const current=await window.emsUpdates.status();paintUpdateStatus({...current,...status});}
 catch{paintUpdateStatus(status);}
});}
window.addEventListener('click',async e=>{
 const b=e.target.closest('#update-check,#update-download,#update-install');if(!b)return;
 const action=b.id;b.disabled=true;
 try{const u=window.emsUpdates;const s=await (action==='update-check'?u.check():action==='update-download'?u.download():u.install());paintUpdateStatus({...await u.status(),...s});}catch(err){toast('Ошибка обновления',err.message,true);}finally{b.disabled=false;}
});
async function onSubmit(form){const data=Object.fromEntries(new FormData(form));const id=form.id;const btn=form.querySelector('button[type=submit]');if(btn)btn.disabled=true;try{
 if(id==='auth-form'){const route=state.authMode==='login'?'login':'register';const r=await request('/api/auth/'+route,{method:'POST',body:data});state.user=r.user;setCsrf(r.csrf);state.page='home';state.authMode='login';toast('Добро пожаловать',r.user.displayName);await refreshPage();return;}
 if(id==='profile-form'){const r=await request('/api/profile',{method:'PATCH',body:data});state.user=r.user;toast('Профиль обновлён','Если Static ID изменился, нужна новая проверка.');await refreshPage();return;}
 if(id==='password-form'){await request('/api/auth/change-password',{method:'POST',body:data});toast('Пароль обновлён');form.reset();return;}
 if(id==='decision-form'){await request(`/api/admin/evidence/${data.id}/decision`,{method:'POST',body:{decision:data.decision,category:data.category,reason:data.reason}});closeModal();toast('Решение сохранено');await refreshPage();return;}
 if(id==='role-form'){await request(`/api/admin/users/${data.id}/role`,{method:'POST',body:{role:data.role}});closeModal();toast('Доступ обновлён');await refreshPage();return;}
 if(id==='rank-form'){await request(`/api/admin/users/${data.id}/rank`,{method:'POST',body:{rank:Number(data.rank)}});closeModal();toast('Ранг обновлён');await refreshPage();return;}
 }catch(e){toast('Не удалось выполнить действие',e.message,true)}finally{if(btn)btn.disabled=false;}}
window.addEventListener('click',e=>{if(e.target.closest('#dropzone')&&!e.target.closest('[data-action]')){document.querySelector('#global-files')?.click();return;}const nav=e.target.closest('[data-nav]');if(nav){goto(nav.dataset.nav);return;}const filter=e.target.closest('[data-filter]');if(filter){state.filter=filter.dataset.filter;render();return;}const adminTab=e.target.closest('[data-admin-tab]');if(adminTab){state.adminTab=adminTab.dataset.adminTab;refreshPage();return;}const action=e.target.closest('[data-action]');if(action){handleAction(action.dataset.action,action);return;}if(e.target.id==='modal-root')closeModal();});
window.addEventListener('submit',e=>{if(e.target.matches('form')){e.preventDefault();onSubmit(e.target);}});
window.addEventListener('change',async e=>{if(e.target.id==='motion-switch'){
  state.motionEnabled=e.target.checked;
  // Switching ON is an explicit app-level opt-in, even if Windows requests less motion.
  state.motionOverride=e.target.checked;
  localStorage.setItem('ems-motion-enabled',String(state.motionEnabled));
  localStorage.setItem('ems-motion-force',String(state.motionOverride));
  render();
  toast(state.motionEnabled?'Полный Motion/VFX включён':'Анимации отключены',
   state.motionEnabled?'Кардиограмма, кнопки, переходы и уведомления теперь активны.':'Приложение остановило декоративное движение.');
  return;
 }if(e.target.id==='global-files'){const files=e.target.files;e.target.value='';if(files?.length)await upload(files);return;}if(e.target.hasAttribute('data-check')){const shift=state.shifts?.shifts?.find(x=>!x.end_at);if(!shift)return;try{await request(`/api/shifts/${shift.id}/checklist`,{method:'POST',body:{key:e.target.dataset.check,value:e.target.checked}});await refreshPage();}catch(err){toast('Ошибка чек-листа',err.message,true);e.target.checked=!e.target.checked;}}});
window.addEventListener('input',e=>{
 if(e.target.id==='evidence-search'){
  state.evidenceSearch=e.target.value;
  const start=e.target.selectionStart,end=e.target.selectionEnd,scroll=window.scrollY,node=$('#page');
  if(!node)return;
  node.innerHTML=renderEvidence(state);
  const input=$('#evidence-search');
  if(input){input.focus({preventScroll:true});if(start!==null&&end!==null)input.setSelectionRange(start,end);}
  window.scrollTo(0,scroll);
  return;
 }
 if(e.target.id==='charter-search'){const caret=e.target.selectionStart;state.charterSearch=e.target.value;const scroll=window.scrollY;$('#page').innerHTML=renderAcademy(state);const el=$('#charter-search');el.focus();el.setSelectionRange(caret,caret);window.scrollTo(0,scroll);}
});
window.addEventListener('dragover',e=>{e.preventDefault();$('#dropzone')?.classList.add('dragover');});
window.addEventListener('dragleave',e=>{if(!e.relatedTarget||!document.contains(e.relatedTarget))$('#dropzone')?.classList.remove('dragover');});
window.addEventListener('drop',e=>{e.preventDefault();$('#dropzone')?.classList.remove('dragover');if(e.dataTransfer?.files?.length)upload(e.dataTransfer.files);});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='u'&&state.user){e.preventDefault();$('#global-files')?.click();}if(e.key==='Enter'&&(e.target.id==='dropzone'||e.target.closest('.rail-person'))){e.target.id==='dropzone'?$('#global-files').click():goto('profile');}});
let lastNotices=null;
setInterval(async()=>{if(!state.user)return;try{const r=await request('/api/notices');const items=r.items||[];const newer=lastNotices===null?[]:items.filter(n=>!n.read_at&&!lastNotices.has(n.id));lastNotices=new Set(items.map(n=>n.id));state.notices=items;for(const n of newer.slice(0,2))toast(n.title,n.message);const bell=document.querySelector('[data-action=notices]');if(bell&&items.some(n=>!n.read_at)&&!bell.querySelector('.icon-count'))bell.insertAdjacentHTML('beforeend','<span class="icon-count"></span>');}catch{}},20000);
setInterval(()=>{const el=$('#shift-clock');const shift=state.shifts?.shifts?.find(x=>!x.end_at);if(el&&shift)el.textContent=duration(shift.start_at);const home=$('#home-shift-clock');if(home&&state.dashboard?.shift&&!state.dashboard.shift.end_at)home.textContent=duration(state.dashboard.shift.start_at);syncDutyTimeline(document,shift?.start_at);},1000);
installCinematicPointer();installMotionEffects();
(async function start(){try{state.health=await request('/api/health');const r=await request('/api/auth/me');state.user=r.user;setCsrf(r.csrf);if(state.user){await refreshPage();if(state.user.mustChangePassword)toast('Обнови пароль','Пароль необходимо сменить в профиле.');}else render();}catch(e){render();toast('Не удалось связаться с сервером',e.message,true);}})();
