import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderFieldTraining,lessons} from '../public/js/views/field-training.js';
import {academySelect,academyMove} from '../public/js/views/academy-workspace.js';
import {renderAcademy,renderCharter} from '../public/js/views/academy.js';

test('Academy course switch keeps the existing completion keys and restores last step',()=>{
 const old=globalThis.localStorage;
 const existing=new Map([
  ['ems-field-lessons:student',JSON.stringify({[lessons[3].title+':0']:true})],
  ['ems-academy-workspace:student',JSON.stringify({course:'04',step:3})]
 ]);
 globalThis.localStorage={getItem:key=>existing.get(key)||null,setItem:(key,value)=>existing.set(key,value)};
 try{
  const html=renderFieldTraining({id:'student'});
  assert.match(html,/data-academy-current-course="04"/);
  assert.match(html,/data-academy-current-step="3"/);
  assert.match(html,/data-learn-key="04 · ПМП:[^"]*:0" checked/);
  assert.match(html,/data-academy-panel="04"/);
  assert.match(html,/data-academy-goto-step="3"/);
  assert.match(html,/data-academy-thumbnail=/);
  assert.equal((html.match(/data-academy-course="/g)||[]).length,12);
 }finally{globalThis.localStorage=old;}
});
test('Corrupt or expired Academy bookmarks cannot open invalid courses',()=>{
 const old=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>key.startsWith('ems-academy-workspace:')?JSON.stringify({course:'../../etc',step:900}):null};
 try{
  const html=renderFieldTraining({id:'student'});
  assert.match(html,/data-academy-current-course="01"/);
  assert.match(html,/data-academy-current-step="0"/);
  assert.doesNotMatch(html,/data-academy-current-course="\.\./);
 }finally{globalThis.localStorage=old;}
});
const stub=(dataset={})=>({
 dataset,hidden:false,attrs:{},classes:new Set(),focusCalled:false,
 classList:{toggle(){},contains(){return false}},
 setAttribute(key,value){this.attrs[key]=value},
 focus(){this.focusCalled=true}
});
test('Stage navigation makes exactly one step visible and persists the current position',()=>{
 const old=globalThis.localStorage,stored=new Map();
 globalThis.localStorage={setItem:(key,value)=>stored.set(key,value)};
 try{
  const course=stub({academyCourse:'01'}),panel=stub({academyPanel:'01'});
  const steps=[stub({academyStep:'0'}),stub({academyStep:'1'}),stub({academyStep:'2'})];
  const jump=[stub({academyGotoStep:'0'}),stub({academyGotoStep:'1'}),stub({academyGotoStep:'2'})];
  const prev=stub(),next=stub(),counter=stub();
  panel.querySelectorAll=selector=>selector==='[data-academy-step]'?steps:selector==='[data-academy-goto-step]'?jump:[];
  panel.querySelector=selector=>({
   '[data-academy-step-position]':counter,'[data-academy-previous]':prev,'[data-academy-next]':next,'h3':stub()
  })[selector]||null;
  const root={dataset:{academyProfile:'student',academyCurrentCourse:'01',academyCurrentStep:'0'},querySelectorAll(selector){
   return selector==='[data-academy-panel]'?[panel]:selector==='[data-academy-course]'?[course]:[];
  }};
  assert.equal(academySelect(root,'01',1,{focus:true}),true);
  assert.deepEqual(steps.map(x=>x.hidden),[true,false,true]);
  assert.equal(steps[1].focusCalled,true);
  assert.equal(next.disabled,false);
  assert.equal(prev.disabled,false);
  assert.equal(counter.textContent,'Шаг 2 из 3');
  assert.deepEqual(JSON.parse(stored.get('ems-academy-workspace:student')),{course:'01',step:1});
  assert.equal(academyMove(root,1),true);
  assert.deepEqual(steps.map(x=>x.hidden),[true,true,false]);
  assert.equal(next.disabled,true);
  assert.equal(academySelect(root,'../escape',0),false);
 }finally{globalThis.localStorage=old;}
});
test('Charter remains a separate complete page, not hidden below course steps',()=>{
 const state={user:{id:'student'},charterSearch:'',charter:[{number:1,title:'Общие положения',text:'Инструкция'}]};
 const academy=renderAcademy(state),charter=renderCharter(state);
 assert.match(academy,/КУРС 01/);
 assert.doesNotMatch(academy,/id="charter-search"/);
 assert.match(charter,/id="charter-search"/);
 assert.doesNotMatch(charter,/data-academy-course=/);
});
test('Focused learning layout remains responsive and honors reduced-motion',()=>{
 const css=readFileSync(new URL('../public/styles/v3/field-training.css',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns:minmax\(230px,290px\)/);
 assert.match(css,/@media\(max-width:1250px\)/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/html\[data-motion=off\]/);
 assert.match(app,/academyThumbnail\(thumbnail\)/);
 assert.match(app,/academyMove\(root,1\)/);
 assert.match(app,/p==='charter'/);
});
