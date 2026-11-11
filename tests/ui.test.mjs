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
