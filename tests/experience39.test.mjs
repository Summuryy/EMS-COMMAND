import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dutyClock,dutyClockText,dutyMilestones,careerRoadmap,commandFeed,syncDutyTimeline} from '../public/js/views/experience39.js';
import {renderShift} from '../public/js/views/shift.js';
import {renderCareer} from '../public/js/views/career.js';
import {renderHome} from '../public/js/views/home.js';

const user={displayName:'Тестовый сотрудник',serverName:'Кутузовский',rank:3,department:'ОПП',staticId:'12345',staticVerified:false};
const base={user,dashboard:{stats:{total:0,accepted:0,review:0,rejected:0},shift:null,recent:[],notices:[]},
 shifts:{shifts:[]},career:{rank:3,goals:[],stats:{categories:[]}}};

test('3.9 duty time boundaries are deterministic and never approve evidence',()=>{
 const started='2026-11-11T10:00:00Z', t=Date.parse(started);
 assert.equal(dutyClock(null,t).active,false);
 assert.deepEqual(dutyMilestones(null,t).map(x=>x.reached),[false,false,false,false]);
 assert.deepEqual(dutyMilestones(started,t).map(x=>x.reached),[true,false,false,false]);
 assert.equal(dutyClock(started,t+19*60000+59000).nextMinute,20);
 assert.equal(dutyClock(started,t+19*60000+59000).secondsLeft,1);
 assert.equal(dutyClockText(1),'00:01');
 assert.equal(dutyClock(started,t+20*60000).nextMinute,40);
 assert.deepEqual(dutyMilestones(started,t+20*60000).map(x=>x.reached),[true,true,false,false]);
 assert.equal(dutyClock(started,t+60*60000).nextMinute,null);
 assert.equal(dutyClock(started,t+60*60000).phasePercent,100);
 assert.equal(dutyClock('bad-date',t).active,false);
 assert.doesNotThrow(()=>syncDutyTimeline(null,started,t));
});

test('3.9 career roadmap uses accepted categories; treatment location remains manual',()=>{
 const goals=[{category:'pmp',needed:40},{category:'vaccination',needed:5},{category:'treatment',needed:20}];
 const categories=[{category:'pmp',count:40},{category:'vaccination',count:4},{category:'treatment',count:99}];
 const road=careerRoadmap(goals,categories,false);
 assert.equal(road.finished,1);
 assert.equal(road.total,2);
 assert.equal(road.hasTreatment,true);
 assert.deepEqual(road.stages.map(x=>x.id),['identity','evidence','location','promotion']);
 assert.equal(road.stages[0].state,'pending');
 assert.equal(road.stages[2].state,'review');
 assert.equal(road.stages[3].state,'manual');
 assert.match(road.stages[2].detail,/Принято лечений: 99/);
 assert.equal(careerRoadmap([{category:'pmp',needed:40}],[{category:'pmp',count:40}],true).stages[1].state,'complete');
 assert.notEqual(careerRoadmap([],[],true).stages[1].state,'complete');
});

test('3.9 command feed contains only actual notices and image events, sorted by real timestamps',()=>{
 assert.deepEqual(commandFeed({notices:[],recent:[]}),[]);
 const feed=commandFeed({notices:[
  {title:'Проверка',message:'На рассмотрении',created_at:'2026-11-11T09:01:00Z',kind:'warning'},
  {title:'Событие без даты'}
 ],recent:[{name:'pmp.png',reason:'Сохранено',status:'accepted',created_at:'2026-11-11T09:02:00Z'}]},4);
 assert.deepEqual(feed.map(x=>x.title),['pmp.png','Проверка','Событие без даты']);
 assert.deepEqual(feed.map(x=>x.kind),['evidence','notice','notice']);
 assert.equal(feed[0].tone,'success');
 assert.equal(feed[1].tone,'warning');
 assert.equal(feed[2].sort,0);
});

test('3.9 Home timeline is actionable, escapes untrusted text and keeps truthful empty state',()=>{
 const empty=renderHome(base);
 assert.match(empty,/ems39-command-handoff/);
 assert.match(empty,/ems39-feed-empty/);
 assert.match(empty,/data-nav="shift"/);
 assert.match(empty,/Нет кадров, ожидающих проверки/);
 const data={...base,dashboard:{stats:{total:2,accepted:1,review:1,rejected:0},
  shift:{start_at:'2026-11-11T10:00:00Z',end_at:null},
  notices:[{title:'<script>unsafe()</script>',message:'Проверить кадр',created_at:'2026-11-11T10:01:00Z'}],
  recent:[{name:'pmp.png',status:'accepted',reason:'Снимок принят',created_at:'2026-11-11T10:02:00Z'}]}};
 const html=renderHome(data);
 assert.match(html,/ems39-feed-list/);
 assert.match(html,/pmp\.png/);
 assert.match(html,/&lt;script&gt;unsafe\(\)&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>unsafe\(\)<\/script>/);
 assert.match(html,/Дежурство активно/);
 assert.match(html,/Ожидают проверки: 1 кадр\(ов\)/);
 assert.match(html,/data-nav="evidence"/);
});

test('3.9 active Duty and Career preserve real handlers with accessible live status',()=>{
 const shift=renderShift({...base,shifts:{shifts:[{id:'sh1',start_at:new Date(Date.now()-25*60000).toISOString(),end_at:null,checklist:{camera:true}}]}});
 assert.match(shift,/id="shift-clock"/);
 assert.match(shift,/data-action="end-shift"/);
 assert.match(shift,/data-check="camera"/);
 assert.match(shift,/data-ems39-minute="20"/);
 assert.match(shift,/id="duty-next-meter"/);
 assert.match(shift,/id="duty-next-clock"/);
 assert.match(shift,/До отметки 40 минут/);
 assert.match(shift,/Время наступило/);
 assert.match(shift,/не считает кадр доказательством только по таймеру/);
 assert.match(shift,/data-action="upload"/);
 const goals=[{category:'pmp',label:'ПМП',needed:40,description:'Проверка'}];
 const career=renderCareer({...base,career:{rank:3,goals,stats:{categories:[{category:'pmp',count:40}]}}});
 assert.match(career,/ems39-career-path/);
 assert.match(career,/Маршрут к повышению/);
 assert.match(career,/data-nav="profile"/);
 assert.match(career,/data-nav="evidence"/);
 assert.match(career,/Решение руководства/);
 assert.match(career,/Ранг изменяется администратором/);
});

test('3.9 motion is composited, cancellable and the existing 1s clock drives updates',()=>{
 const css=fs.readFileSync(new URL('../public/styles/v3/experience39.css',import.meta.url),'utf8');
 const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const app=fs.readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.ok(index.indexOf('experience39.css')>index.indexOf('acceptance382.css'));
 assert.match(css,/@keyframes ems39-enter/);
 assert.match(css,/animation-play-state:paused/);
 assert.match(css,/html\[data-motion="off"\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(app,/syncDutyTimeline\(document,shift\?\.start_at\)/);
 assert.match(app,/setInterval\(\(\)=>\{/);
 assert.match(app,/behavior:'auto'/);
 assert.match(app,/data-action="logout"/);
});
