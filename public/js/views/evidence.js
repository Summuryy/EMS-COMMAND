import {icon} from '../icons.js';import {esc,stat,catName,statusName} from '../util.js';import {evidenceRows,empty} from './shared.js';import {pageIntro,sectionTitle,ecg,ring} from './visual.js';
const filters=[['all','Все'],['accepted','Принятые'],['review','На проверке'],['rejected','Отклонены']];

const foldEvidence=v=>String(v??'').toLocaleLowerCase('ru-RU').trim();
export function filterEvidence(items,status='all',search=''){
 const terms=foldEvidence(search).split(/\s+/).filter(Boolean);
 return items.filter(item=>{
  if(status!=='all'&&(status==='rejected'?!['rejected','duplicate'].includes(item.status):item.status!==status))return false;
  if(!terms.length)return true;
  const text=foldEvidence([item.name,item.reason,item.category,catName(item.category),item.status,statusName(item.status),item.patientId,item.createdAt].join(' '));
  return terms.every(term=>text.includes(term));
 });
}

export function renderEvidence(s){const items=s.evidence?.items||[],search=String(s.evidenceSearch||''),filtered=filterEvidence(items,s.filter||'all',search);
 const jobs=s.queue||[],total=jobs.length,finished=jobs.filter(j=>j.finished).length,pending=total-finished,accepted=items.filter(x=>x.status==='accepted').length;
 const overall=total?Math.round(jobs.reduce((a,j)=>a+Math.min(100,Math.max(0,j.percent||0)),0)/total):0;
 const archiveEmpty=search.trim()?empty('Ничего не найдено','Измени запрос или очисти поиск по архиву.','scan','<button class="btn btn-sm btn-ghost" data-action="clear-evidence-search">Очистить поиск</button>'):items.length?empty('Нет кадров с таким статусом','Выбери другой статус или вернись к общему списку.','scan'):empty('Кадров пока нет','Добавь PNG или JPG, чтобы запустить проверку.','scan','<button class="btn btn-sm btn-primary" data-action="upload">Добавить скриншоты</button>');
 const reviewCount=items.filter(x=>x.status==='review').length;
 const rejectedCount=items.filter(x=>['rejected','duplicate'].includes(x.status)).length;
 return `${pageIntro('02 / ДОКАЗАТЕЛЬСТВА','ЭЛЕКТРОННЫЙ АРХИВ','Доказательства','Загрузи кадры один раз. Приложение определит тип и запустит проверку.')}
 <section class="v3-evidence-hero panel"><div class="v3-evidence-drop" id="dropzone" role="button" tabindex="0" aria-label="Перетащить или выбрать изображения"><div class="v3-drop-icon">${icon('upload',29)}</div><div><h2>Перетащи скриншоты сюда</h2><p>Или нажми здесь, чтобы выбрать PNG / JPG · до 12 МБ</p></div><span class="v3-drop-hint">${icon('scan',16)} Тип определяется автоматически</span></div><div class="v3-evidence-aside"><div class="v3-panel-kicker">${icon('scan',18)} ПРОВЕРКА <span class="v3-rule"></span><span class="v3-beacon"></span></div>${ecg('evidence-head')}<strong>Один архив.<br><span>Все процедуры.</span></strong><p>Распознавание текста → проверка бодикамеры → решение по правилам.</p><div class="v3-chip-row"><span>ПМП</span><span>Лечение</span><span>Вакцинация</span><span>Смена</span></div></div></section>
 ${jobs.length?`<section class="panel section-space v3-processing-panel" role="status" aria-live="polite"><div class="v3-progress-head"><div><div class="v3-panel-kicker">${icon('activity',16)} ОЧЕРЕДЬ АНАЛИЗА</div><h2>${pending?'Проверяем кадры':'Обработка завершена'}</h2><p>${finished} из ${total} файлов · ${pending?'идёт распознавание':'результаты сохранены'}</p></div><div class="v3-process-percentage num">${overall}<span>%</span></div></div><div class="v3-meter" role="progressbar" aria-label="Прогресс проверки файлов" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overall}"><span style="width:${overall}%"></span></div><div class="v3-process-steps">${['Приём','Распознавание','Проверка правил','Результат'].map((x,i)=>`<div class="${overall>=([10,35,72,100][i])?'done':(overall>=[0,10,35,72][i]?'active':'')}"><span>${String(i+1).padStart(2,'0')}</span>${x}</div>`).join('')}</div><div class="queue v3-job-list">${jobs.map(j=>{const p=Math.min(100,Math.max(0,j.percent||0));return `<div class="queue-item v3-job ${j.failed?'job-failed':''}"><span class="stat-icon">${icon(j.failed?'warning':j.finished?'check':'scan',17)}</span><div class="grow"><strong title="${esc(j.name)}">${esc(j.name)}</strong><p>${esc(j.label||'Ожидание')}</p><div class="bar"><span style="width:${p}%"></span></div></div><span class="v3-job-pct num">${Math.round(p)}%</span></div>`}).join('')}</div></section>`:''}
 ${sectionTitle('01','Личный архив')}
 <section class="panel ems-archive"><div class="v3-archive-toolbar"><div class="v3-archive-summary"><span class="v3-mini-medallion">${icon('file',21)}</span><div><strong class="num">${stat(items.length)}</strong><small>сохранено · <span class="v3-success-text">${accepted} принято</span></small></div></div><div class="v3-toolbar-actions"><button class="btn btn-sm btn-ghost" data-action="export-report">${icon('file',15)} Экспорт JSON</button><button class="btn btn-sm btn-ghost" data-action="refresh">${icon('refresh',15)} Обновить</button></div></div>
 <div class="ems-archive-control">
   <label class="ems-archive-search" for="evidence-search"><span class="ems-archive-search-label">${icon('scan',16)} ПОИСК ПО АРХИВУ</span><input id="evidence-search" type="search" class="field" value="${esc(search)}" placeholder="Имя файла, причина, категория, ID…" autocomplete="off" spellcheck="false" aria-controls="evidence-results"></label>
   <button class="btn btn-sm btn-ghost ems-archive-clear" data-action="clear-evidence-search" ${search?'':'disabled'}>Сбросить поиск</button>
 </div>
 <div class="ems-archive-quickstats" aria-label="Результаты обработки"><span><strong class="num">${stat(accepted)}</strong> принято</span><span><strong class="num">${stat(reviewCount)}</strong> на проверке</span><span><strong class="num">${stat(rejectedCount)}</strong> отклонено</span></div>
<div class="tabs v3-tabs" aria-label="Фильтр результатов">${filters.map(([k,v])=>`<button class="tab ${s.filter===k?'active':''}" data-filter="${k}" aria-pressed="${s.filter===k}">${v}${k==='all'?` <span>${items.length}</span>`:''}</button>`).join('')}</div><div class="ems-archive-results-caption" role="status" aria-live="polite">Показано ${stat(filtered.length)} из ${stat(items.length)} кадров${search.trim()?' по запросу «'+esc(search.trim())+'»':''}</div><div id="evidence-results">${filtered.length?evidenceRows(filtered):archiveEmpty}</div></section>`;
}
