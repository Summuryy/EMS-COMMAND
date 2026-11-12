// Academy UI controller: only local state. No game/API permissions.
const normalized=value=>String(value||'').toLocaleLowerCase('ru').replaceAll('ё','е');
const asArray=nodes=>Array.from(nodes||[]);
const getPanel=(root,id)=>asArray(root.querySelectorAll('[data-academy-panel]')).find(p=>p.dataset.academyPanel===id);
const getCourse=(root,id)=>asArray(root.querySelectorAll('[data-academy-course]')).find(b=>b.dataset.academyCourse===id);

export function academySelect(root,id,step=0,{focus=false,persist=true}={}){
 if(!root||!/^\d{2}$/.test(String(id)))return false;
 const button=getCourse(root,id),panel=getPanel(root,id);
 if(!button||!panel)return false;
 const steps=asArray(panel.querySelectorAll('[data-academy-step]'));
 const requested=Number(step);
 const index=Number.isInteger(requested)?Math.max(0,Math.min(steps.length-1,requested)):0;
 if(!steps.length)return false;
 root.dataset.academyCurrentCourse=id;
 root.dataset.academyCurrentStep=String(index);
 asArray(root.querySelectorAll('[data-academy-course]')).forEach(b=>{
  const current=b===button;
  b.classList.toggle('is-active',current);
  b.setAttribute('aria-current',String(current));
 });
 asArray(root.querySelectorAll('[data-academy-panel]')).forEach(p=>{p.hidden=p!==panel});
 steps.forEach((p,i)=>{p.hidden=i!==index});
 asArray(panel.querySelectorAll('[data-academy-goto-step]')).forEach(b=>{
  const current=Number(b.dataset.academyGotoStep)===index;
  b.classList.toggle('is-active',current);
  b.setAttribute('aria-current',current?'step':'false');
 });
 const position=panel.querySelector('[data-academy-step-position]');
 if(position)position.textContent='Шаг '+(index+1)+' из '+steps.length;
 const back=panel.querySelector('[data-academy-previous]'),next=panel.querySelector('[data-academy-next]');
 if(back)back.disabled=index===0;
 if(next)next.disabled=index===steps.length-1;
 if(persist){
  try{globalThis.localStorage?.setItem('ems-academy-workspace:'+root.dataset.academyProfile,JSON.stringify({course:id,step:index}))}catch{}
 }
 if(focus){
  const heading=panel.querySelector('h3');
  steps[index]?.focus({preventScroll:false});
 }
 return true;
}
export function academyMove(root,offset){
 if(!root)return false;
 return academySelect(root,root.dataset.academyCurrentCourse,Number(root.dataset.academyCurrentStep)+offset,{focus:true});
}
export function academyFilter(root){
 if(!root)return 0;
 const value=normalized(root.querySelector('#ems-learning-search')?.value.trim());
 const category=root.querySelector('[data-academy-filter][aria-pressed="true"]')?.dataset.academyFilter||'all';
 let matching=0;
 const buttons=asArray(root.querySelectorAll('[data-academy-course]'));
 buttons.forEach(button=>{
  const panel=getPanel(root,button.dataset.academyCourse);
  const searchable=normalized(button.textContent+' '+(panel?.textContent||''));
  const match=(category==='all'||button.dataset.academyCategory===category)&&(!value||searchable.includes(value));
  button.hidden=!match;
  if(match)matching++;
 });
 asArray(root.querySelectorAll('[data-academy-section]')).forEach(group=>{
  group.hidden=!group.querySelector('[data-academy-course]:not([hidden])');
 });
 const counter=root.querySelector('#ems-learning-results');
 if(counter)counter.textContent=matching+' курсов доступно';
 const empty=root.querySelector('#ems-learning-empty');
 if(empty)empty.hidden=matching!==0;
 if(matching){
  const current=getCourse(root,root.dataset.academyCurrentCourse);
  if(!current||current.hidden){
   const first=buttons.find(b=>!b.hidden);
   if(first)academySelect(root,first.dataset.academyCourse,0,{focus:false});
  }
 }
 return matching;
}
export function academyProgress(root){
 if(!root)return;
 let completed=0;
 asArray(root.querySelectorAll('[data-academy-panel]')).forEach(panel=>{
  const id=panel.dataset.academyPanel,checks=asArray(panel.querySelectorAll('[data-learn-key]'));
  const count=checks.filter(c=>c.checked).length;
  completed+=count;
  const navCount=asArray(root.querySelectorAll('[data-academy-count]')).find(n=>n.dataset.academyCount===id);
  if(navCount)navCount.textContent=String(count);
  const progress=asArray(root.querySelectorAll('[data-academy-course-progress]')).find(n=>n.dataset.academyCourseProgress===id);
  if(progress)progress.value=count;
  const readerProgress=panel.querySelector('[data-academy-reader-progress]');
  if(readerProgress)readerProgress.value=count;
  const text=panel.querySelector('.ems-learning-completion');
  if(text)text.textContent=count+'/'+checks.length+' выполнено';
  asArray(panel.querySelectorAll('[data-academy-goto-step]')).forEach((button,i)=>{
   const checked=checks[i]?.checked===true;
   button.classList.toggle('is-complete',checked);
   button.setAttribute('aria-label','Шаг '+(i+1)+(checked?' выполнен':''));
  });
 });
 const sum=root.querySelector('[data-academy-complete]');
 if(sum)sum.textContent=String(completed);
 const overall=root.querySelector('[data-academy-global-progress]');
 if(overall)overall.value=completed;
}
export function academyThumbnail(thumb){
 const gallery=thumb?.closest('[data-academy-gallery]');
 const focus=gallery?.querySelector('[data-academy-open]');
 const image=focus?.querySelector('img');
 const caption=focus?.querySelector('.ems-training-caption');
 const src=thumb?.dataset.academyThumbnail;
 if(!gallery||!image||!caption||!/^\/assets\/training\/[a-z][a-z0-9-]*\.webp$/.test(src||''))return false;
 const name=thumb.dataset.academyCaption||'Учебный скриншот';
 image.src=src;image.alt=name;
 caption.textContent=name;
 focus.dataset.academyOpen=src;focus.dataset.academyCaption=name;
 focus.setAttribute('aria-label','Увеличить скриншот: '+name);
 asArray(gallery.querySelectorAll('[data-academy-thumbnail]')).forEach(b=>{
  const selected=b===thumb;
  b.classList.toggle('is-active',selected);
  b.setAttribute('aria-pressed',String(selected));
 });
 return true;
}
