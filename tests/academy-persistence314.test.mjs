import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {lessons} from '../public/js/views/field-training.js';
import {readLegacyAcademy,loadAcademyAccount} from '../public/js/academy-state-client.js';

const key=lessons[0].title+':0';
const otherKey=lessons[0].title+':1';

test('Legacy import permits only known completed tasks and a valid course/step',async()=>{
 const data=new Map([
  ['ems-field-lessons:owner',JSON.stringify({[key]:true,[otherKey]:false,'<script>':true})],
  ['ems-academy-workspace:owner',JSON.stringify({course:'02',step:1})]
 ]);
 const storage={getItem:k=>data.get(k)||null};
 assert.deepEqual(readLegacyAcademy('owner',storage),{progress:{[key]:true},bookmark:{course:'02',step:1},hasData:true});
 const calls=[];
 const request=async(url,options)=>{
  calls.push({url,options});
  if(url==='/api/academy/state')return {initialized:false,progress:{},bookmark:{course:'01',step:0}};
  if(url==='/api/academy/import')return {initialized:true,progress:options.body.progress,bookmark:options.body.bookmark};
  throw Error('Unexpected request');
 };
 const restored=await loadAcademyAccount('owner',request,storage);
 assert.equal(restored.progress[key],true);
 assert.deepEqual(restored.bookmark,{course:'02',step:1});
 assert.equal(calls.length,2);
 assert.deepEqual(calls[1].options.body.progress,{[key]:true});
});

test('Existing persistent state wins over stale browser data from any origin',async()=>{
 const storage={getItem:()=>JSON.stringify({[key]:true})};
 const calls=[];
 const result=await loadAcademyAccount('owner',async(url)=>{calls.push(url);return {initialized:true,progress:{[otherKey]:true},bookmark:{course:'03',step:2}};},storage);
 assert.deepEqual(result.progress,{[otherKey]:true});
 assert.deepEqual(result.bookmark,{course:'03',step:2});
 assert.deepEqual(calls,['/api/academy/state']);
});

test('Unknown or corrupted historical progress cannot leak into account state',()=>{
 const old=readLegacyAcademy('owner',{getItem:()=>'{bad json'});
 assert.equal(old.hasData,false);
 assert.deepEqual(old.progress,{});
 assert.deepEqual(old.bookmark,{course:'01',step:0});
});

test('SQLite Academy progress survives a second server process and is user-isolated',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ems-academy-test-'));
 const env={...process.env,EMS_DATA_DIR:dir,EMS_DISABLE_OCR:'1'};
 const run=source=>{
  const child=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:process.cwd(),env,encoding:'utf8',timeout:25000});
  assert.equal(child.status,0,child.stderr||child.stdout);
  return JSON.parse(child.stdout.trim());
 };
 const setup=String.raw`
  import {db} from './server/db.mjs';
  import {getAcademyState,importLegacyAcademy,setAcademyStep,setAcademyBookmark} from './server/academy-state.mjs';
  const users=db.prepare('INSERT INTO users(id,username,display_name,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?)');
  users.run('owner-1','owner-1','One','placeholder','2026-01-01','2026-01-01');
  users.run('owner-2','owner-2','Two','placeholder','2026-01-01','2026-01-01');
  const key=${JSON.stringify(key)},second=${JSON.stringify(otherKey)};
  const first=importLegacyAcademy('owner-1',{[key]:true},{course:'02',step:1});
  if(!first.initialized||!first.progress[key])throw Error('import failed');
  importLegacyAcademy('owner-1',{[second]:true},{course:'03',step:2});
  if(getAcademyState('owner-1').progress[second])throw Error('stale import overwrote progress');
  setAcademyStep('owner-1',second,true);
  setAcademyBookmark('owner-1',{course:'04',step:2});
  let bad=0;
  for(const callback of [
   ()=>setAcademyStep('owner-1','__proto__',true),
   ()=>setAcademyStep('owner-1',key,'yes'),
   ()=>setAcademyBookmark('owner-1',{course:'../../escape',step:1}),
   ()=>importLegacyAcademy('owner-2',{'unknown-key':true},{course:'01',step:0})
  ]){try{callback()}catch(e){if(e.status===400)bad++}}
  if(bad!==4)throw Error('invalid input accepted');
  const result={first:getAcademyState('owner-1'),second:getAcademyState('owner-2')};
  db.close();console.log(JSON.stringify(result));
 `;
 const verify=String.raw`
  import {db} from './server/db.mjs';
  import {getAcademyState,setAcademyStep} from './server/academy-state.mjs';
  const initial=getAcademyState('owner-1');
  const separate=getAcademyState('owner-2');
  const result={initial,separate};
  db.close();console.log(JSON.stringify(result));
 `;
 try{
  const first=run(setup);
  assert.equal(first.first.initialized,true);
  assert.equal(first.second.initialized,false);
  const restored=run(verify);
  assert.equal(restored.initial.progress[key],true);
  assert.equal(restored.initial.progress[otherKey],true);
  assert.deepEqual(restored.initial.bookmark,{course:'04',step:2});
  assert.deepEqual(restored.separate.progress,{});
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Academy endpoints remain session-owned, rate-limited and CSRF protected',()=>{
 const api=readFileSync(new URL('../server/api.mjs',import.meta.url),'utf8');
 const db=readFileSync(new URL('../server/db.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
 assert.match(api,/if\(method!=='GET'&&!loginRoute&&!signupRoute\)/);
 assert.match(api,/verifyCSRF\(req,session\)/);
 assert.match(api,/const owner=session\.user\.id/);
 assert.match(api,/academy-write:/);
 assert.match(db,/CREATE TABLE IF NOT EXISTS academy_state/);
 assert.match(db,/ON DELETE CASCADE/);
 assert.match(app,/loadAcademyAccount\(owner,request\)/);
 assert.match(app,/queueAcademySave\(owner,'\/api\/academy\/step'/);
 assert.match(app,/setAcademyBookmarkListener/);
});
