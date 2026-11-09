import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { config } from './config.mjs';
import { decodePng,cropPPM,redBodycam,greenToast } from './vision.mjs';
const clean=(s)=>String(s||'').replace(/[|]/g,'I').replace(/\s+/g,' ').trim();
export function inferFromText(text){
  const s=clean(text).toLowerCase().replace(/[ё]/g,'е');
  // OCR may merge words or mistake 'ы' for 'ь' or 'и'; no positive classification without a success verb.
  let category='unknown',patientId=null,success=false;
  const rules=[
    ['treatment',/(?:вы\s*)?вы[л1i|]еч[иi1]л[иi1]|вылечили|вьлечили|вывылечили/iu],
    ['pmp',/(?:вы\s*)?реанимиров[а-яa-z]*|реанимировали/iu],
    ['vaccination',/(?:вы\s*)?вакциниров[а-яa-z]*/iu]
  ];
  for(const [type,reg] of rules){
    const m=reg.exec(s);
    if(m){category=type;success=true;
      const tail=s.slice(m.index+m[0].length,m.index+m[0].length+28);
      const id=tail.match(/[#№]\s*(\d{3,9})/);
      if(id)patientId=id[1];
      break;
    }
  }
  return {category,patientId,success};
}
export async function tesseract(input,mode='6'){
  if(!config.ocrEnabled)throw Error('OCR отключён');
  return await new Promise((resolve,reject)=>{
    const proc=spawn(config.ocrPath,['stdin','stdout','-l','rus+eng','--psm',mode],{
      shell:false,env:{...process.env,OMP_THREAD_LIMIT:'1'},stdio:['pipe','pipe','pipe']
    });
    let stdout='',stderr='',timed=false;
    const timer=setTimeout(()=>{timed=true;proc.kill();},16000);
    proc.stdout.on('data',b=>{if(stdout.length<20000)stdout+=b.toString('utf8');});
    proc.stderr.on('data',b=>{if(stderr.length<4000)stderr+=b.toString('utf8');});
    proc.on('error',e=>{clearTimeout(timer);reject(e);});
    proc.on('close',code=>{
      clearTimeout(timer);
      if(timed)return reject(Error('OCR превысил время ожидания'));
      if(code!==0)return reject(Error(stderr.slice(0,120)||`OCR завершился с кодом ${code}`));
      resolve(stdout.slice(0,12000));
    });
    proc.stdin.on('error',()=>{});
    if(input instanceof Buffer){proc.stdin.end(input);}else{
      const stream=fs.createReadStream(input);
      stream.on('error',e=>{proc.kill();reject(e);});
      stream.pipe(proc.stdin);
    }
  });
}
export async function analyzeFile(filePath,info,onProgress=()=>{}){
  const bytes=fs.readFileSync(filePath);
  onProgress('reading');
  let decoded=null;
  try{if(info.mime==='image/png')decoded=decodePng(bytes);}catch(e){throw Error('Не удалось обработать PNG: '+e.message);}
  const bodycam=redBodycam(decoded);
  const toast=greenToast(decoded);
  let ocrText='',toastOCR='',ocrEngine='missing',ocrError='';
  onProgress('ocr');
  if(config.ocrEnabled){
    try{
      // HUD toast: bottom center; chat and full-frame fallback for other event types.
      if(decoded){
        const toastText=await tesseract(cropPPM(decoded,[.36,.906,.645,.973],3),'6');
        ocrText=toastText;toastOCR=toastText;
        let infer=inferFromText(toastText);
        if(!infer.success){
          const wholeText=await tesseract(filePath,'11');
          ocrText=toastText+'\n'+wholeText;
        }
      }else ocrText=await tesseract(filePath,'11');
      ocrEngine='tesseract';
    }catch(e){ocrError=e.message;ocrEngine='missing';}
  }else ocrError='OCR отключён настройкой';
  onProgress('rules');
  // Very important: only toast OCR may confirm success. A chat line is not completion evidence.
  const toastInfer=decoded?inferFromText(toastOCR):{success:false,category:'unknown',patientId:null};
  const chatText=ocrText.toLowerCase();
  let category=toastInfer.category,patientId=toastInfer.patientId;
  if(!toastInfer.success&&/начал\s+оказывать\s+первую|первую\s+медицинск/.test(chatText))category='pmp';
  if(!toastInfer.success&&/вакциниров/.test(chatText))category='vaccination';
  if(!toastInfer.success&&/вылечили/.test(chatText)&&!decoded)category='treatment';
  if(category==='unknown'&&/(?:повышен(?:ие|ы|а)?\b|повышение\s+в\s+должности)/iu.test(chatText))category='promotion';
  if(category==='unknown'&&/(?:bodycam|бодикамера|c начала записи|с начала записи|rec from)/iu.test(chatText)&&/\b\d{1,2}:\d{2}\b/.test(chatText))category='duty';
  let status='review',reason='Не обнаружено подтверждённое уведомление об успешной процедуре';
  if(category==='treatment'&&toastInfer.success&&bodycam.state==='on'&&toast&&ocrEngine==='tesseract'&&patientId){
    status='accepted';reason='Успешное действие, номер пациента и индикатор записи обнаружены';
  }else if(toastInfer.success){
    reason=category!=='treatment'?'Процедура распознана, но её правила ещё требуют проверки':bodycam.state!=='on'?'Нужно подтвердить включённую бодикамеру':!toast?'Не подтверждён блок игрового уведомления':!patientId?'Номер пациента не распознан':'Требуется проверка';
  }else if(ocrEngine==='missing')reason='Модуль OCR недоступен; автоматическое подтверждение невозможно';
  else if(category==='pmp'){status='rejected';reason='Начало ПМП не подтверждает успешную реанимацию';}
  else if(category==='duty')reason='Возможная отметка дежурства; место и игровое время требуют проверки';
  else if(category==='promotion')reason='Возможное повышение; ранг и дата требуют проверки';
  else if(category==='unknown'&&bodycam.state==='on')reason='Бодикамера видна, но тип доказательства не установлен';
  const score=(toastInfer.success?45:0)+(patientId?20:0)+(bodycam.state==='on'?25:0)+(toast?10:0);
  return {category,status,statusDetail:reason,patientId,bodycamState:bodycam.state,
    ocrText:ocrText.slice(0,2500),ocrEngine,score,signals:{bodycamPixels:bodycam.pixels,greenToast:toast,successToast:toastInfer.success,ocrError}};
}
