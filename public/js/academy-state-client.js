import {lessons} from './views/field-training.js';

// Previous versions stored data under a random localhost port. Import only data
// accessible to the current origin; never overwrite established server progress.
const keys=new Set(lessons.flatMap(lesson=>lesson.steps.map((_,index)=>lesson.title+':'+index)));
const courses=new Map(lessons.map(lesson=>[lesson.title.slice(0,2),lesson.steps.length]));
const emptyBookmark=()=>({course:'01',step:0});
export function validAcademyBookmark(value){
 return !!value&&typeof value==='object'&&courses.has(value.course)&&
  Number.isInteger(value.step)&&value.step>=0&&value.step<courses.get(value.course);
}
export function readLegacyAcademy(userId,storage=globalThis.localStorage){
 let progress={},bookmark=emptyBookmark();
 try{
  const old=JSON.parse(storage?.getItem('ems-field-lessons:'+userId)||'{}');
  if(old&&typeof old==='object'&&!Array.isArray(old)){
   progress=Object.fromEntries(Object.entries(old).filter(([key,done])=>keys.has(key)&&done===true));
  }
 }catch{}
 try{
  const old=JSON.parse(storage?.getItem('ems-academy-workspace:'+userId)||'{}');
  if(validAcademyBookmark(old))bookmark={course:old.course,step:old.step};
 }catch{}
 return {progress,bookmark,hasData:Object.keys(progress).length>0||bookmark.course!=='01'||bookmark.step!==0};
}
export async function loadAcademyAccount(userId,requestApi,storage=globalThis.localStorage){
 if(!userId||typeof requestApi!=='function')throw Error('Неизвестный аккаунт Академии');
 let saved=await requestApi('/api/academy/state');
 if(!saved||typeof saved!=='object'||!saved.progress||typeof saved.progress!=='object')throw Error('Некорректное состояние Академии');
 if(!saved.initialized){
  const old=readLegacyAcademy(userId,storage);
  if(old.hasData)saved=await requestApi('/api/academy/import',{method:'POST',body:{progress:old.progress,bookmark:old.bookmark}});
 }
 // Server data always wins. Saved progress is scoped to the authenticated account.
 const progress=Object.fromEntries(Object.entries(saved.progress).filter(([key,done])=>keys.has(key)&&done===true));
 const bookmark=validAcademyBookmark(saved.bookmark)?saved.bookmark:emptyBookmark();
 return {initialized:!!saved.initialized,progress,bookmark,updatedAt:saved.updatedAt||null};
}
