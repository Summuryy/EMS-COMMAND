export const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateFmt=(v)=>v?new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
export const duration=(start,end=Date.now())=>{const t=Math.max(0,Math.floor(((typeof end==='number'?end:new Date(end).getTime())-new Date(start).getTime())/1000));return `${String(Math.floor(t/3600)).padStart(2,'0')}:${String(Math.floor((t%3600)/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;};
export const catName=(v)=>({treatment:'Лечение',pmp:'ПМП',vaccination:'Вакцинация',duty:'Дежурство',promotion:'Повышение',unknown:'Не определено'}[v]||v);
export const statusName=(v)=>({accepted:'Принято',review:'На проверку',rejected:'Отклонено',duplicate:'Дубликат',processing:'Анализ'}[v]||v);
export const stat=(v)=>Number(v||0).toLocaleString('ru-RU');
export const sig=(title,details='',tone='')=>`<div class="signal ${tone}"><strong>${esc(title)}</strong><span>${esc(details)}</span></div>`;
export const progress=(x,max)=>`<div class="bar"><span style="width:${Math.max(0,Math.min(100,Math.round(x/Math.max(1,max)*100)))}%"></span></div>`;
