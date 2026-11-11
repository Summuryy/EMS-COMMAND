// EMS COMMAND 3.9 — pure, data-driven operating-state helpers.
// These functions NEVER infer evidence approval or promotion from a timer.
export const DUTY_MARKS=Object.freeze([0,20,40,60]);
const finiteTime=value=>{
 const time=Date.parse(String(value??''));
 return Number.isFinite(time)?time:null;
};
export function dutyClock(startAt,now=Date.now()){
 const started=finiteTime(startAt);
 if(started===null)return {active:false,elapsedSeconds:0,nextMinute:null,secondsLeft:null,phasePercent:0};
 const elapsedSeconds=Math.max(0,Math.floor((now-started)/1000));
 const nextMinute=DUTY_MARKS.find(minute=>minute>0&&elapsedSeconds<minute*60)??null;
 const lastMinute=nextMinute===null?60:nextMinute-20;
 const phasePercent=nextMinute===null?100:Math.min(100,Math.max(0,Math.round((elapsedSeconds-lastMinute*60)/(20*60)*100)));
 return {active:true,elapsedSeconds,nextMinute,secondsLeft:nextMinute===null?0:Math.max(0,nextMinute*60-elapsedSeconds),phasePercent};
}
export const dutyClockText=seconds=>{
 if(!Number.isFinite(seconds)||seconds<0)return '—';
 const mins=Math.floor(seconds/60),sec=Math.floor(seconds%60);
 return `${String(mins).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};
export function dutyMilestones(startAt,now=Date.now()){
 const clock=dutyClock(startAt,now);
 return DUTY_MARKS.map((minute,index)=>({
  minute,index,
  reached:clock.active&&clock.elapsedSeconds>=minute*60,
  next:clock.active&&clock.nextMinute===minute,
  label:index===0?'Начало':`Отметка ${index}`
 }));
}
export function careerRoadmap(goals=[],categories=[],staticVerified=false){
 const safeGoals=Array.isArray(goals)?goals:[];
 const rows=Array.isArray(categories)?categories:[];
 const counts=Object.fromEntries(rows.filter(x=>x?.category).map(x=>[x.category,Math.max(0,Number(x.count)||0)]));
 const countGoals=safeGoals.filter(g=>g?.category!=='treatment'&&Number(g?.needed)>0);
 const finished=countGoals.filter(g=>(counts[g.category]||0)>=Number(g.needed)).length;
 const treatmentGoals=safeGoals.filter(g=>g?.category==='treatment');
 const stages=[
  {id:'identity',title:'Личное дело',state:staticVerified?'complete':'pending',detail:staticVerified?'Static ID подтверждён':'Static ID требует подтверждения',nav:'profile'},
  {id:'evidence',title:'Нормативы по кадрам',state:countGoals.length>0&&finished===countGoals.length?'complete':'pending',
   detail:countGoals.length?`${finished} из ${countGoals.length} нормативов по принятым кадрам`:'Нормативы по кадрам не загружены',nav:'evidence'}
 ];
 if(treatmentGoals.length)stages.push({id:'location',title:'Проверка места',state:'review',
  detail:`Принято лечений: ${counts.treatment||0}. Место проверяется отдельно`,nav:'evidence'});
 stages.push({id:'promotion',title:'Решение руководства',state:'manual',detail:'Повышение подтверждается администратором',nav:null});
 return {finished,total:countGoals.length,hasTreatment:treatmentGoals.length>0,stages};
}
export function commandFeed(dashboard={},limit=4){
 const events=[];
 const notices=Array.isArray(dashboard?.notices)?dashboard.notices:[];
 const recent=Array.isArray(dashboard?.recent)?dashboard.recent:[];
 for(const x of notices){
  if(!x||!x.title)continue;
  const createdAt=x.created_at||null;
  events.push({kind:'notice',title:String(x.title),detail:String(x.message||''),createdAt,sort:finiteTime(createdAt)??0,
   tone:x.kind==='warning'?'warning':x.kind==='success'?'success':'neutral'});
 }
 for(const x of recent){
  if(!x||!x.name)continue;
  const createdAt=x.created_at||x.createdAt||null;
  events.push({kind:'evidence',title:String(x.name),detail:String(x.reason||'')||'Кадр добавлен в архив',
   createdAt,sort:finiteTime(createdAt)??0,tone:x.status==='accepted'?'success':x.status==='rejected'?'warning':'neutral',
   status:String(x.status||'')});
 }
 return events.map((event,index)=>({...event,index}))
  .sort((a,b)=>b.sort-a.sort||a.index-b.index)
  .slice(0,Math.max(0,Math.min(8,Math.floor(Number(limit)||0))));
}
