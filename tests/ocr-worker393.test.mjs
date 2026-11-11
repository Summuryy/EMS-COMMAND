import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';

test('OCR executes in isolated worker and reports errors without killing API thread',async()=>{
 const worker=new Worker(new URL('../server/ocr-worker.mjs',import.meta.url));
 let timer;
 try{
  const result=await new Promise((resolve,reject)=>{
   timer=setTimeout(()=>reject(Error('Worker did not reply')),6000);
   worker.once('message',resolve);
   worker.once('error',reject);
   worker.postMessage({filePath:'/this/path/does/not/exist/ems.png',info:{mime:'image/png',width:1,height:1}});
  });
  assert.equal(result.type,'error');
  assert.match(result.message,/ENOENT|no such file/i);
 }finally{
  clearTimeout(timer);
  await worker.terminate();
 }
});
test('recovered OCR queue uses worker and retains manual review fallback',()=>{
 const jobs=fs.readFileSync(new URL('../server/jobs.mjs',import.meta.url),'utf8');
 assert.match(jobs,/new Worker\(new URL\('\.\/ocr-worker\.mjs'/);
 assert.match(jobs,/await analyzeInWorker\(/);
 assert.match(jobs,/Фоновый анализ превысил лимит времени/);
 assert.match(jobs,/status='review'/);
 assert.match(jobs,/resumePending\(/);
});
