import test from 'node:test';
import assert from 'node:assert/strict';
import {loadAcademyAccount,readLegacyAcademy} from '../public/js/academy-state-client.js';
import {lessons} from '../public/js/views/field-training.js';

const key=lessons[0].title+':0';
const storage=(data)=>({getItem:k=>data[k]??null});

test('existing server Academy progress is authoritative over stale local data',async()=>{
 const local=storage({'ems-field-lessons:alice':JSON.stringify({[key]:true})});
 const calls=[];
 const saved=await loadAcademyAccount('alice',async(url,opts)=>{
  calls.push([url,opts?.method]);
  return {initialized:true,progress:{},bookmark:{course:'02',step:1}};
 },local);
 assert.deepEqual(saved.progress,{});
 assert.deepEqual(saved.bookmark,{course:'02',step:1});
 assert.deepEqual(calls,[['/api/academy/state',undefined]]);
});

test('legacy Academy progress is imported once for an uninitialized account',async()=>{
 const local=storage({'ems-field-lessons:alice':JSON.stringify({[key]:true,'invalid':true}),
  'ems-academy-workspace:alice':JSON.stringify({course:'01',step:2})});
 let imported;
 const saved=await loadAcademyAccount('alice',async(url,opts)=>{
  if(url==='/api/academy/state')return {initialized:false,progress:{},bookmark:{course:'01',step:0}};
  assert.equal(url,'/api/academy/import');
  imported=opts.body;
  return {initialized:true,progress:opts.body.progress,bookmark:opts.body.bookmark};
 },local);
 assert.deepEqual(imported.progress,{[key]:true});
 assert.deepEqual(saved.progress,{[key]:true});
 assert.deepEqual(saved.bookmark,{course:'01',step:2});
});

test('malformed legacy Academy data cannot create fake completion',()=>{
 const old=readLegacyAcademy('alice',storage({'ems-field-lessons:alice':'{broken',
  'ems-academy-workspace:alice':JSON.stringify({course:'01',step:999})}));
 assert.deepEqual(old.progress,{});
 assert.deepEqual(old.bookmark,{course:'01',step:0});
 assert.equal(old.hasData,false);
});
