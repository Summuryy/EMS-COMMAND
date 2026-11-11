// EMS COMMAND — isolate CPU-heavy PNG decode and Tesseract from the HTTP event loop.
// One worker per queued job (queue concurrency remains one). Never read the app DB here.
import {parentPort} from 'node:worker_threads';
import {analyzeFile} from './classifier.mjs';

if(!parentPort)throw Error('OCR worker requires a parent thread');
parentPort.on('message',async ({filePath,info})=>{
 try{
  const result=await analyzeFile(filePath,info,stage=>{
   parentPort.postMessage({type:'progress',stage});
  });
  parentPort.postMessage({type:'result',result});
 }catch(error){
  parentPort.postMessage({type:'error',message:String(error?.message||'Worker analysis failed').slice(0,400)});
 }
});
