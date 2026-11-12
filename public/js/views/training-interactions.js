// Standalone UI bindings for EMS Academy. No backend/Discord writes.
import {TRAINING_LESSONS,GNEWS_TEMPLATES,PHOTO_HOSTS} from './training-data.js';
const shots=new Map();
export function getTrainingMedia(filename){return shots.get(filename)||'';}
export function allowedEvidenceUrl(raw){try{const u=new URL(String(raw).trim());return u.protocol==='https:'&&PHOTO_HOSTS.some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}}
const field=id=>document.getElementById(id)?.value?.trim()||'';
const missing=x=>x||'[ВСТАВИТЬ ССЫЛКУ ИЛИ ДАННЫЕ]';
const photo=x=>!x?'[ВСТАВИТЬ ССЫЛКУ НА ФОТОХОСТИНГ]':allowedEvidenceUrl(x)?x:'[НЕРАЗРЕШЁННЫЙ ФОТОХОСТИНГ — ИСПРАВЬТЕ]';
export function makeInternReport({type='1-2',name='',staticId='',first='',second='',test='',pmp='',last=''}){
 const who=missing(name),id=missing(staticId),t=missing(test);
 if(type==='2-3')return `1. Имя Фамилия (написаны вручную): ${who}\n2. Static: ${id}\n3. Вылечить 30 пациентов в больнице им. Склифосовского: ${photo(first)}\n4. Вылечить 20 пациентов в ГКБ №67: ${photo(second)}\n5. Сдача теста «Выезды на ПМП»: ${t}\n6. 10 вызовов на ПМП с сотрудником ОМП или 8+ ранга: ${photo(pmp)}\n7. Скриншот с планшета последнего повышения: ${photo(last)}\n\n@Отдел медицинской подготовки`;
 return `1. Имя Фамилия (написаны вручную): ${who}\n2. Static: ${id}\n3. Скриншот удостоверения: ${photo(first)}\n4. Инструктаж «Знакомство с работой в Больнице» у сотрудника ОМП (ссылка на заявку): ${missing(second)}\n5. Сдача теста «Знакомство с работой в Больнице» (ссылка на результат): ${t}\n\n@Отдел медицинской подготовки`;
}
export function makeGnews({template=0,start='',end=''}){
 const ix=Math.max(0,Math.min(GNEWS_TEMPLATES.length-1,Number(template)||0));
 if(!/^\d\d:\d\d$/.test(start)||!/^\d\d:\d\d$/.test(end))return 'УКАЖИТЕ ВРЕМЯ НАЧАЛА И ОКОНЧАНИЯ СОБЕСЕДОВАНИЯ';
 return '/gnews '+GNEWS_TEMPLATES[ix].replaceAll('{start}',start).replaceAll('{end}',end);
}
function updateReport(){const out=document.getElementById('training-report-preview');if(!out)return;
 const type=field('training-report-type');document.querySelectorAll('[data-report-second-only]').forEach(el=>{el.hidden=type!=='2-3';});
 out.value=makeInternReport({type,name:field('training-report-name'),staticId:field('training-report-static'),first:field('training-report-first'),second:field('training-report-second'),test:field('training-report-test'),pmp:field('training-report-pmp'),last:field('training-report-last')});
}
function updateGnews(){const out=document.getElementById('training-gnews-preview');if(out)out.value=makeGnews({template:field('training-gnews-template'),start:field('training-gnews-start'),end:field('training-gnews-end')});}
export function filterLessons(root=document){const query=(field('training-search')||'').toLocaleLowerCase('ru-RU').replaceAll('ё','е'),active=root.querySelector('.ems-learning-tag.is-active')?.dataset.trainingFilter||'all';let visible=0;
 root.querySelectorAll('[data-training-lesson]').forEach(el=>{const lesson=TRAINING_LESSONS.find(x=>x.id===el.dataset.trainingLesson);const match=(!query||(el.dataset.trainingText||'').replaceAll('ё','е').includes(query))&&(active==='all'||lesson?.category===active);el.hidden=!match;if(match)visible++;});
 const empty=root.querySelector('#training-no-match');if(empty)empty.hidden=visible>0;return visible;}
function syncMedia(){const root=document.getElementById('ems-learning-root');if(!root)return;
 root.querySelectorAll('[data-training-figure]').forEach(fig=>{const file=fig.dataset.trainingFigure,url=shots.get(file),picture=fig.querySelector('.ems-learning-picture');if(!url||!picture)return;
  picture.replaceChildren();const img=document.createElement('img');img.src=url;img.alt='Учебный скриншот';img.loading='lazy';picture.append(img);
 });const el=document.getElementById('training-media-status');if(el)el.textContent=`Загружено примеров: ${shots.size}. Кадры только в памяти текущего запуска.`;}
async function copy(kind){const target=document.getElementById(kind==='gnews'?'training-gnews-preview':'training-report-preview');const status=document.getElementById(kind==='gnews'?'training-gnews-feedback':'training-report-feedback');if(!target)return;
 try{await navigator.clipboard.writeText(target.value);if(status)status.textContent='Текст скопирован. Проверьте и отправьте в Discord вручную.';}
 catch{target.focus();target.select();if(status)status.textContent='Выделено. Нажмите Ctrl+C.';}
}
if(typeof document!=='undefined'){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-training-filter]');if(b){const root=b.closest('#ems-learning-root');root?.querySelectorAll('[data-training-filter]').forEach(el=>el.classList.toggle('is-active',el===b));if(root)filterLessons(root);return;}
 const copyBtn=e.target.closest('[data-training-copy]');if(copyBtn){e.preventDefault();copy(copyBtn.dataset.trainingCopy);}});
 document.addEventListener('input',e=>{if(e.target.id==='training-search'){const root=document.getElementById('ems-learning-root');if(root)filterLessons(root);return;}
 if(e.target.closest('#ems-learning-root')){if(e.target.id?.startsWith('training-report-'))updateReport();else if(e.target.id?.startsWith('training-gnews-'))updateGnews();}});
 document.addEventListener('change',e=>{if(e.target.id==='training-media-files'){
  const files=[...(e.target.files||[])].filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type)&&f.size<=9*1024*1024).slice(0,120);
  for(const f of files){if(!TRAINING_LESSONS.some(x=>x.media?.includes(f.name)))continue;const old=shots.get(f.name);if(old)URL.revokeObjectURL(old);shots.set(f.name,URL.createObjectURL(f));}syncMedia();e.target.value='';return;
 }if(e.target.closest('#ems-learning-root')){if(e.target.id?.startsWith('training-report-'))updateReport();else if(e.target.id?.startsWith('training-gnews-'))updateGnews();}});
 // The academy page is built by the existing router. Inputs are filled on first focus if needed.
 document.addEventListener('focusin',e=>{if(e.target.id==='training-report-preview'&&!e.target.value)updateReport();if(e.target.id==='training-gnews-preview'&&!e.target.value)updateGnews();});
}