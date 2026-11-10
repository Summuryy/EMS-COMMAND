// EMS COMMAND motion runtime: state-derived counters; no simulated telemetry.
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let observer=null;
const running=new Set();
let pointerInstalled=false,mouseFrame=0;
function enabled(){return document.documentElement.dataset.motion!=='off'&&!reduced();}
function clearAnimations(){
  observer?.disconnect();observer=null;
  for(const id of running)cancelAnimationFrame(id);
  running.clear();
}
export function setMotionPreference(on){
  document.documentElement.dataset.motion=on?'on':'off';
  if(!on)clearAnimations();
}
export function applyMotion(root){
  clearAnimations();
  if(!root||!enabled())return;
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){entry.target.classList.add('v3-visible');observer?.unobserve(entry.target);}
      }
    },{threshold:.08});
    root.querySelectorAll('.panel,.v3-number-card,.v3-intro,.v3-home-hero,.v3-shift-hero,.v3-career-hero,.v3-id-card,.v3-pro-hero,.v3-admin-banner,.v3-academy-banner').forEach(node=>{
      node.classList.add('v3-reveal');observer.observe(node);
    });
  }
  root.querySelectorAll('[data-count]').forEach(node=>{
    const end=Number(node.dataset.count||0);
    if(!Number.isFinite(end)||end<=0)return;
    const start=performance.now(),duration=700;
    const frame=now=>{
      if(!enabled()||!node.isConnected)return;
      const progress=Math.min(1,(now-start)/duration);
      const eased=1-(1-progress)**3;
      node.textContent=Math.round(end*eased).toLocaleString('ru-RU');
      if(progress<1){
        const id=requestAnimationFrame(time=>{running.delete(id);frame(time);});
        running.add(id);
      }
    };
    const id=requestAnimationFrame(time=>{running.delete(id);frame(time);});
    running.add(id);
  });
}
// One pointer listener for the lifetime of the application, not one per re-render.
export function installCinematicPointer(){
  if(pointerInstalled)return;
  pointerInstalled=true;
  let nextX=0,nextY=0;
  document.addEventListener('pointermove',event=>{
    if(!enabled()||event.pointerType==='touch')return;
    const hero=document.querySelector('.v3-home-hero');
    if(!hero)return;
    const box=hero.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)return;
    nextX=(event.clientX-box.left)/box.width-.5;
    nextY=(event.clientY-box.top)/box.height-.5;
    if(mouseFrame)return;
    mouseFrame=requestAnimationFrame(()=>{
      mouseFrame=0;
      if(!hero.isConnected||!enabled())return;
      hero.style.setProperty('--ems-scene-x',(nextX*12).toFixed(1)+'px');
      hero.style.setProperty('--ems-scene-y',(nextY*8).toFixed(1)+'px');
    });
  },{passive:true});
  document.addEventListener('pointerout',event=>{
    if(event.target?.closest?.('.v3-home-hero')&&!event.relatedTarget?.closest?.('.v3-home-hero')){
      const hero=event.target.closest('.v3-home-hero');
      hero.style.setProperty('--ems-scene-x','0px');
      hero.style.setProperty('--ems-scene-y','0px');
    }
  },{passive:true});
}
