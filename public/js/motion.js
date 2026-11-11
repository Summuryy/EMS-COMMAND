// EMS COMMAND motion runtime: state-derived counters; no simulated telemetry.
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let observer=null;
const running=new Set();
let pointerInstalled=false,mouseFrame=0;
let effectsInstalled=false;
let activeRippleTimeouts=new Set();
// An explicit in-app ON choice may override Windows reduced motion.
// Without that opt-in, the OS preference remains authoritative.
function enabled(){const mode=document.documentElement.dataset.motion;return mode!=='off'&&(mode==='force'||!reduced());}
function clearAnimations(){
  observer?.disconnect();observer=null;
  for(const id of running)cancelAnimationFrame(id);
  running.clear();
  for(const timer of activeRippleTimeouts)clearTimeout(timer);
  activeRippleTimeouts.clear();
  document.querySelectorAll('.ems-tap-ripple').forEach(el=>el.remove());
}
export function setMotionPreference(on,force=false){
  document.documentElement.dataset.motion=!on?'off':force?'force':'on';
  if(!enabled())clearAnimations();
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
  const revealTargets=root.querySelectorAll('.panel,.v3-number-card,.v3-home-hero,.v3-shift-hero,.v3-career-hero,.v3-id-card,.v3-pro-hero,.v3-admin-banner,.v3-academy-banner');
  revealTargets.forEach((node,i)=>node.style.setProperty('--ems-stagger',`${Math.min(i%8,7)*48}ms`));
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

// Single delegated interaction layer: survives view re-renders without duplicate listeners.
export function installMotionEffects(){
  if(effectsInstalled)return;
  effectsInstalled=true;
  document.addEventListener('pointerdown',event=>{
    if(!enabled()||event.pointerType==='touch'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const target=event.target?.closest?.('.btn,.nav-link,.v3-number-card,.v3-card-lift');
    if(!target||target.matches(':disabled')||target.getAttribute('aria-disabled')==='true')return;
    const rect=target.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const dot=document.createElement('span');
    dot.className='ems-tap-ripple';dot.setAttribute('aria-hidden','true');
    const diameter=Math.max(rect.width,rect.height)*1.7;
    dot.style.cssText=`width:${diameter}px;height:${diameter}px;left:${event.clientX-rect.left-diameter/2}px;top:${event.clientY-rect.top-diameter/2}px`;
    target.appendChild(dot);
    const timer=setTimeout(()=>{dot.remove();activeRippleTimeouts.delete(timer);},620);
    activeRippleTimeouts.add(timer);
  },{passive:true});
  document.addEventListener('pointermove',event=>{
    if(!enabled()||event.pointerType==='touch')return;
    const card=event.target?.closest?.('.v3-number-card,.v3-id-card,.v3-card-lift');
    if(!card)return;
    const rect=card.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    card.style.setProperty('--ems-pointer-x',`${((event.clientX-rect.left)/rect.width*100).toFixed(1)}%`);
    card.style.setProperty('--ems-pointer-y',`${((event.clientY-rect.top)/rect.height*100).toFixed(1)}%`);
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    document.documentElement.classList.toggle('ems-motion-paused',document.hidden);
  });
}
