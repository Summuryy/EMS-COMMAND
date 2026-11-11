import {icon} from '../icons.js';
import {esc,dateFmt,stat,duration} from '../util.js';
import {evidenceRows,noticeRows} from './shared.js';
import {ecg,eyebrow,sectionTitle,ring,infoChip} from './visual.js';
export function renderHome(s){
 const d=s.dashboard||{},st=d.stats||{},shift=d.shift||null,active=!!(shift&&!shift.end_at);
 const total=Number(st.total||0),accepted=Number(st.accepted||0),review=Number(st.review||0),rejected=Number(st.rejected||0);
 const r=total?Math.round(accepted/total*100):0;
 return `${eyebrow('EMS / 01','СЛУЖЕБНЫЙ ТЕРМИНАЛ · '+(s.user.serverName||'Кутузовский'))}
 <section class="v3-home-hero v3-shine ems38-home-hero"><div class="v3-hero-content"><div class="v3-hud-label"><span class="v3-beacon"></span> ГОСУДАРСТВЕННАЯ МЕДИЦИНСКАЯ СЛУЖБА</div><h1>Твоя служба.<br><em>Под контролем.</em></h1><p>Добро пожаловать, ${esc(s.user.displayName)}. Доказательства, время дежурства и прогресс по рангу — здесь.</p><div class="v3-hero-actions"><button class="btn btn-primary" data-nav="shift">${icon('activity',18)} ${active?'Открыть активную смену':'Начать дежурство'}</button><button class="btn btn-ghost" data-action="upload">${icon('upload',18)} Загрузить скриншоты</button></div></div><aside class="ems38-home-brief" aria-label="Оперативная сводка">
 <div class="ems38-brief-label">${icon('activity',16)} ОПЕРАТИВНОЕ СОСТОЯНИЕ</div>
 <div class="ems38-brief-row"><span>Дежурство</span><strong class="${active?'ems38-positive':''}">${active?'Активно':'Не начато'}</strong></div>
 <div class="ems38-brief-row"><span>Кадры на проверке</span><strong class="num">${stat(review)}</strong></div>
 <div class="ems38-brief-row"><span>Принято доказательств</span><strong class="num">${stat(accepted)}</strong></div>
 <div class="ems38-brief-signal">${ecg('home-brief',true)}<span>ДАННЫЕ ИЗ АРХИВА EMS</span></div>
 </aside><div class="v3-hero-data"><span>EMERGENCY MEDICAL SERVICE</span><strong>${active?'СМЕНА АКТИВНА':'РЕЖИМ ОЖИДАНИЯ'}</strong>${ecg('home-hero')}</div></section>
 <div class="v3-summary-grid ems38-command-stats" aria-label="Статистика доказательств">
  <div class="v3-number-card"><span class="v3-stat-icon">${icon('file',19)}</span><span>Всего кадров</span><strong class="num" data-count="${total}">${stat(total)}</strong><small>Загружено в архив</small></div>
  <div class="v3-number-card positive"><span class="v3-stat-icon">${icon('check',19)}</span><span>Принято</span><strong class="num" data-count="${accepted}">${stat(accepted)}</strong><small>Подтверждено системой или проверяющим</small></div>
  <div class="v3-number-card amber"><span class="v3-stat-icon">${icon('scan',19)}</span><span>На проверке</span><strong class="num" data-count="${review}">${stat(review)}</strong><small>Требует внимания</small></div>
  <div class="v3-number-card"><span class="v3-stat-icon">${icon('warning',19)}</span><span>Отклонено</span><strong class="num" data-count="${rejected}">${stat(rejected)}</strong><small>Не прошло проверку</small></div>
 </div>
 ${sectionTitle('01','Служба сегодня')}
 <div class="grid g2 v3-gap">
  <section class="panel v3-service v3-card-lift"><div class="v3-panel-kicker">${icon('clock',17)} ДЕЖУРСТВО <span class="v3-rule"></span><span class="v3-state ${active?'online':''}">${active?'На смене':'Не начато'}</span></div><div class="v3-shift-preview"><div><span class="v3-small-muted">${active?'Время на службе':'Время смены'}</span><strong class="v3-display-num num" ${active?'id="home-shift-clock"':''}>${active?duration(shift.start_at):'00:00:00'}</strong><small>${active?'Начало · '+dateFmt(shift.start_at):'Сначала проверь форму и бодикамеру'}</small></div><div class="v3-orbit-icon">${icon('activity',26)}</div></div><button class="v3-text-action" data-nav="shift">Перейти к смене ${icon('arrow',17)}</button></section>
  <section class="panel v3-service v3-card-lift"><div class="v3-panel-kicker">${icon('trophy',17)} ЛИЧНОЕ ДЕЛО <span class="v3-rule"></span><span class="v3-state">Ранг ${esc(s.user.rank)}</span></div><div class="v3-rank-preview"><div class="v3-rank-seal">${esc(s.user.rank)}</div><div><strong>${esc(s.user.department||'EMS')}</strong><small>Static ID: ${s.user.staticId?'#'+esc(s.user.staticId):'не указан'}</small><span class="v3-verify"><span class="v3-beacon"></span> ${s.user.staticVerified?'ID подтверждён':'ID требует подтверждения'}</span></div></div><button class="v3-text-action" data-nav="career">Перейти к карьере ${icon('arrow',17)}</button></section>
 </div>
 ${sectionTitle('02','Контроль доказательств','Статусы учитывают результаты проверки, а не только наличие файла.')}
 <div class="grid g2 v3-gap"><section class="panel v3-pulse-panel v3-card-lift"><div class="v3-panel-kicker">${icon('activity',17)} СИСТЕМА АНАЛИЗА <span class="v3-rule"></span>${icon('scan',18)}</div><div class="v3-pulse-header"><div><span class="v3-small-muted">Доля принятых кадров</span><strong>${total?`${accepted} из ${total}`:'Нет данных'}</strong></div>${ring(r,'Принято') }</div>${ecg('home-card')}<small class="v3-muted">Категории определяются при загрузке. Неподтверждённые кадры не засчитываются автоматически.</small></section><section class="panel"><div class="panel-head"><span class="panel-title">Последние кадры</span><button class="btn btn-sm btn-ghost" data-nav="evidence">Открыть архив ${icon('arrow',15)}</button></div>${evidenceRows(d.recent||[],3)}</section></div>
 <section class="panel section-space"><div class="panel-head"><span class="panel-title">События службы</span><button class="btn btn-sm btn-ghost" data-action="notices">Уведомления ${icon('arrow',15)}</button></div>${noticeRows((d.notices||[]).slice(0,3))}</section><footer class="v3-disclaimer">НЕОФИЦИАЛЬНОЕ ПРИЛОЖЕНИЕ ДЛЯ ИГРОКОВ · НЕ СВЯЗАНО С АДМИНИСТРАЦИЕЙ ИГРЫ</footer>`;
}
