import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderHome} from '../public/js/views/home.js';
import {renderEvidence,filterEvidence} from '../public/js/views/evidence.js';
import {renderShift} from '../public/js/views/shift.js';
import {renderCareer} from '../public/js/views/career.js';
import {renderAcademy} from '../public/js/views/academy.js';
import {renderProfile} from '../public/js/views/profile.js';
import {renderPro} from '../public/js/views/pro.js';
import {renderAdmin} from '../public/js/views/admin.js';
const user={displayName:'Тестовый сотрудник',username:'tester',staticId:'12345',serverName:'Кутузовский',rank:3,role:'admin',department:'ОПП',staticVerified:false};
const base={user,dashboard:{stats:{total:10,accepted:5,review:4,rejected:1},shift:null,recent:[],notices:[]},evidence:{items:[]},queue:[],filter:'all',shifts:{shifts:[]},career:{rank:3,goals:[],stats:{categories:[]}},charter:[{number:1,title:'Общее положение',text:'Тест'}],charterSearch:'',motionEnabled:true,adminTab:'reviews',admin:{reviews:{items:[]}},notices:[]};
test('every navigation page renders in isolation',()=>{
  for(const [name,fn] of Object.entries({home:renderHome,evidence:renderEvidence,shift:renderShift,career:renderCareer,academy:renderAcademy,profile:renderProfile,pro:renderPro,admin:renderAdmin})){
    const html=fn(base);assert.ok(html.length>400,name);assert.ok(/(?:<section|<header)/.test(html),name);assert.doesNotMatch(html,/\bundefined\b/,name);
  }
});
test('single evidence drop target and real reporting actions',()=>{
 const html=renderEvidence(base);assert.match(html,/id="dropzone"/);assert.equal((html.match(/id="dropzone"/g)||[]).length,1);assert.match(html,/data-action="export-report"/);assert.match(html,/data-action="refresh"/);
});
test('shift and profile retain functional controls',()=>{
 assert.match(renderShift(base),/data-action="start-shift"/);
 assert.match(renderProfile(base),/id="profile-form"/);
 assert.match(renderProfile(base),/id="password-form"/);
 assert.match(renderProfile(base),/id="motion-switch"/);
});
test('Pro does not invent a running capture or payment integration',()=>{
 const html=renderPro(base);assert.match(html,/Ещё недоступен/);assert.match(html,/Не подключены/);assert.doesNotMatch(html,/data-action="start-capture"/);
});
test('motion implementation honors reduced-motion and user preference',()=>{
 const style=fs.readFileSync(new URL('../public/styles/v3/motion.css',import.meta.url),'utf8');
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(style,/html\[data-motion="off"\]/);
});

test('archive search uses existing evidence fields and status scope',()=>{
 const rows=[
  {id:'1',name:'ПМП_001.PNG',reason:'Оказана помощь',category:'pmp',status:'accepted',patientId:'113104',imageUrl:'/one.png'},
  {id:'2',name:'Hospital_002.jpg',reason:'Ожидает проверки',category:'treatment',status:'review',patientId:'42',imageUrl:'/two.jpg'},
  {id:'3',name:'repeat.jpg',reason:'Повтор',category:'pmp',status:'duplicate',patientId:'',imageUrl:'/three.jpg'}
 ];
 assert.deepEqual(filterEvidence(rows,'all','пмп').map(x=>x.id),['1','3']);
 assert.deepEqual(filterEvidence(rows,'accepted','113104').map(x=>x.id),['1']);
 assert.deepEqual(filterEvidence(rows,'review','лечение').map(x=>x.id),['2']);
 assert.deepEqual(filterEvidence(rows,'rejected','повтор').map(x=>x.id),['3']);
 assert.deepEqual(filterEvidence(rows,'accepted','Hospital').map(x=>x.id),[]);
 const html=renderEvidence({...base,evidence:{items:rows},evidenceSearch:'113104',filter:'all'});
 assert.match(html,/id="evidence-search"/);
 assert.match(html,/id="evidence-results"/);
 assert.match(html,/data-action="clear-evidence-search"/);
 assert.match(html,/Показано 1 из 3 кадров/);
 assert.match(html,/ПМП_001.PNG/);
 assert.doesNotMatch(html,/Hospital_002.jpg/);
});
test('archive search escapes text and gives a functional empty state',()=>{
 const html=renderEvidence({...base,evidenceSearch:'"><script>alert(1)</script>',evidence:{items:[{id:'x',name:'sample.jpg',status:'accepted',category:'pmp',reason:'ok',imageUrl:'/image.jpg'}]}});
 assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
 assert.match(html,/&quot;&gt;&lt;script&gt;/);
 assert.match(html,/Ничего не найдено/);
 assert.match(html,/data-action="clear-evidence-search"/);
});

test('duty operations renders real readiness and history without proof claims',()=>{
 const started=new Date(Date.now()-45*60*1000).toISOString(),ended=new Date(Date.now()-90*60*1000).toISOString();
 const html=renderShift({...base,shifts:{shifts:[
  {start_at:started,end_at:null,checklist:{camera:true,uniform:true}},
  {start_at:new Date(Date.now()-120*60*1000).toISOString(),end_at:ended,checklist:{}}
 ]}});
 assert.match(html,/Дежурство продолжается/);
 assert.match(html,/2 <small>\/ 6<\/small>/);
 assert.match(html,/aria-valuenow="33"/);
 assert.match(html,/Следующий пункт: Связь с отделением установлена/);
 assert.match(html,/Завершённые из последних 2 записей/);
 assert.match(html,/data-action="end-shift"/);
 assert.match(html,/data-nav="evidence"/);
 assert.match(html,/не считает кадр доказательством только по таймеру/);
 const idle=renderShift(base);
 assert.match(idle,/Ожидание начала смены/);
 assert.match(idle,/data-action="start-shift"/);
 assert.match(idle,/aria-valuenow="0"/);
});
test('career only counts accepted non-location-sensitive goals as complete',()=>{
 const html=renderCareer({...base,career:{rank:3,goals:[
  {category:'pmp',needed:2,label:'ПМП',description:'Подтверждённые кадры'},
  {category:'treatment',needed:4,label:'Лечение',description:'Проверить место'}
 ],stats:{categories:[{category:'pmp',count:2},{category:'treatment',count:5}]} }});
 assert.match(html,/Нормативы по кадрам/);
 assert.match(html,/1 <small>\/ 2<\/small>/);
 assert.match(html,/Норматив по кадрам выполнен/);
 assert.match(html,/Нужна проверка места/);
 assert.match(html,/Принято лечений: 5\. Место не подтверждено/);
 assert.match(html,/data-nav="evidence"/);
 assert.match(html,/Ранг изменяется администратором/);
 assert.doesNotMatch(html,/Место подтверждено/);
});
test('duty and career motion respects reduced-motion and in-app toggle',()=>{
 const css=fs.readFileSync(new URL('../public/styles/v3/operations375.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/html\[data-motion="off"\]/);
 assert.match(css,/@keyframes ems375-bar/);
});

test('3.8 command center keeps state-driven readout, functional navigation and no fake evidence',()=>{
 const html=renderHome({...base,dashboard:{...base.dashboard,stats:{total:11,accepted:6,review:3,rejected:2}}});
 assert.match(html,/ems38-home-hero/);
 assert.match(html,/ems38-home-brief/);
 assert.match(html,/Кадры на проверке/);
 assert.match(html,/Принято доказательств/);
 assert.match(html,/ems38-command-stats/);
 assert.match(html,/data-nav="shift"/);
 assert.match(html,/data-action="upload"/);
 assert.match(html,/>3<\/strong>/);
 assert.match(html,/>6<\/strong>/);
 assert.match(html,/Не начато/);
 assert.doesNotMatch(html,/СМЕНА АКТИВНА/);
});
test('3.8 all page redesign preserves actual shift and career event contracts',()=>{
 const shift=renderShift(base),career=renderCareer(base);
 assert.match(shift,/ems38-shift-command/);
 assert.match(shift,/ems38-duty-overview/);
 assert.match(shift,/data-action="start-shift"/);
 assert.match(shift,/Время наступления точки не означает/);
 assert.match(career,/ems38-personnel-file/);
 assert.match(career,/ems38-career-brief/);
 assert.match(career,/Нужна проверка места|Нормативы не найдены/);
 assert.match(career,/Ранг изменяется администратором/);
});
test('3.8 shared UI system loads last and protects Windows caption and motion',()=>{
 const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const style=fs.readFileSync(new URL('../public/styles/v3/clinical38.css',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
 assert.ok(index.lastIndexOf('clinical38.css')>index.lastIndexOf('operations375.css'));
 assert.match(index,/padding-right: 148px/);
 assert.match(style,/\.ems38-topbar\s*\{/);
 assert.match(style,/padding:0 148px 0/);
 assert.match(style,/@media\(max-width:1170px\)/);
 assert.match(style,/@media\(max-width:800px\)/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(style,/html\[data-motion="off"\]/);
 assert.match(js,/aria-label="Добавить скриншоты"/);
 assert.match(js,/data-nav="shift"/);
 assert.match(js,/data-nav="evidence"/);
 assert.match(js,/data-action="desktop-updates"/);
 assert.match(js,/data-action="logout"/);
});
