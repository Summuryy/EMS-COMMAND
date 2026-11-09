import path from 'node:path';
import { db, now, notice, audit } from './db.mjs';
import { config } from './config.mjs';
import { analyzeFile } from './classifier.mjs';
const jobs=new Map();const queue=[];let active=false;
export function statusJob(id,userId){const job=jobs.get(id);return job&&job.userId===userId?job:null;}
export function enqueue(evidenceId,userId){
  const job={id:evidenceId,userId,stage:'queued',percent:3,createdAt:Date.now(),error:null};
  jobs.set(evidenceId,job);queue.push(job);setImmediate(processQueue);return job;
}
const stages={queued:['В очереди',3],reading:['Чтение изображения',20],ocr:['Распознавание текста',55],rules:['Проверка правил',87],done:['Готово',100],error:['Ошибка',100]};
async function processQueue(){
  if(active||!queue.length)return;
  active=true;const job=queue.shift();
  const change=(stage)=>{job.stage=stage;job.label=stages[stage][0];job.percent=stages[stage][1];};
  try{
    change('reading');
    const row=db.prepare('SELECT * FROM evidence WHERE id=?').get(job.id);
    if(!row)throw Error('Скриншот удалён');
    const filePath=path.join(config.dataDir,'uploads',row.stored_name);
    const result=await analyzeFile(filePath,{mime:row.mime,width:row.width,height:row.height},change);
    const duplicate=db.prepare(`SELECT id FROM evidence WHERE user_id=? AND sha256=? AND id!=? LIMIT 1`).get(row.user_id,row.sha256,row.id);
    if(duplicate){ result.status='duplicate';result.statusDetail='Такой файл уже был загружен';result.score=0;}
    db.prepare(`UPDATE evidence SET category=?,status=?,status_detail=?,patient_id=?,bodycam_state=?,ocr_text=?,ocr_engine=?,signals=?,score=?,updated_at=? WHERE id=?`)
      .run(result.category,result.status,result.statusDetail,result.patientId,result.bodycamState,
        result.ocrText,result.ocrEngine,JSON.stringify(result.signals),result.score,now(),job.id);
    change('done');
    notice(job.userId,result.status==='accepted'?'success':'info','Проверка завершена',`${row.original_name}: ${result.statusDetail}`);
  }catch(err){
    change('error');job.error=err.message;
    db.prepare(`UPDATE evidence SET status='review',status_detail=?,ocr_engine='error',updated_at=? WHERE id=?`)
      .run('Ошибка обработки: '+err.message.slice(0,130),now(),job.id);
    notice(job.userId,'warning','Нужна ручная проверка','Не удалось автоматически разобрать '+job.id.slice(0,8));
  }finally{
    active=false;
    // Retain recent job statuses for polling, prune after 30 minutes.
    for(const [id,entry] of jobs)if(Date.now()-entry.createdAt>30*60_000)jobs.delete(id);
    if(queue.length)setImmediate(processQueue);
  }
}
export function resumePending(){
  const stuck=db.prepare("SELECT id,user_id FROM evidence WHERE status='processing' ORDER BY created_at LIMIT 150").all();
  for(const r of stuck)enqueue(r.id,r.user_id);
}
