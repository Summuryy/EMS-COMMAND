import {db,now} from './db.mjs';
import {lessons} from '../public/js/views/field-training.js';

// Persist personal learning checkmarks only. Never grant ranks, qualifications or evidence approval.
export const academyKeys=new Set(lessons.flatMap(lesson=>lesson.steps.map((_,index)=>lesson.title+':'+index)));
const courses=new Map(lessons.map(lesson=>[lesson.title.slice(0,2),lesson.steps.length]));
const fail=message=>Object.assign(new Error(message),{status:400});

function validateBookmark(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!courses.has(value.course)||
   !Number.isInteger(value.step)||value.step<0||value.step>=courses.get(value.course))throw fail('Некорректный шаг Академии');
 return {course:value.course,step:value.step};
}
function validateProgress(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw fail('Некорректные отметки Академии');
 const keys=Object.keys(value);
 if(keys.length>academyKeys.size)throw fail('Слишком много отметок');
 const next=Object.create(null);
 for(const key of keys){
  if(!academyKeys.has(key)||typeof value[key]!=='boolean')throw fail('Недопустимый пункт обучения');
  if(value[key])next[key]=true;
 }
 return next;
}
function fromRow(row){
 return {initialized:!!row,progress:row?JSON.parse(row.progress):{},bookmark:row?{course:row.course,step:row.step}:{course:'01',step:0},updatedAt:row?.updated_at||null};
}
function readRow(userId){
 return db.prepare('SELECT progress,course,step,updated_at FROM academy_state WHERE user_id=?').get(userId);
}
function initialize(userId){
 db.prepare('INSERT OR IGNORE INTO academy_state(user_id,progress,course,step,updated_at) VALUES(?,?,?,?,?)').run(userId,'{}','01',0,now());
}
export function getAcademyState(userId){return fromRow(readRow(userId));}
export function importLegacyAcademy(userId,progress,bookmark){
 const validatedProgress=validateProgress(progress);
 const validatedBookmark=validateBookmark(bookmark);
 // Only first import wins: a stale browser origin must never overwrite existing server progress.
 db.prepare('INSERT OR IGNORE INTO academy_state(user_id,progress,course,step,updated_at) VALUES(?,?,?,?,?)')
   .run(userId,JSON.stringify(validatedProgress),validatedBookmark.course,validatedBookmark.step,now());
 return getAcademyState(userId);
}
export function setAcademyStep(userId,key,completed){
 if(typeof key!=='string'||!academyKeys.has(key)||typeof completed!=='boolean')throw fail('Некорректная отметка Академии');
 initialize(userId);
 const row=readRow(userId);
 const values=validateProgress(JSON.parse(row.progress));
 if(completed)values[key]=true;else delete values[key];
 db.prepare('UPDATE academy_state SET progress=?,updated_at=? WHERE user_id=?').run(JSON.stringify(values),now(),userId);
 return {ok:true,progress:values};
}
export function setAcademyBookmark(userId,bookmark){
 const value=validateBookmark(bookmark);
 initialize(userId);
 db.prepare('UPDATE academy_state SET course=?,step=?,updated_at=? WHERE user_id=?')
   .run(value.course,value.step,now(),userId);
 return {ok:true,bookmark:value};
}
