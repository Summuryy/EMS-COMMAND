// EMS COMMAND 3.9.3 — static facts stay readable; CSS handles lightweight feedback.
// Previous version ran per-element RAF counters, an observer for every panel and
// geometry recalculation on every pointer movement. All three competed with startup.
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const enabled=()=>document.documentElement.dataset.motion!=='off'&&
 (document.documentElement.dataset.motion==='force'||!reduced());
let installed=false;
export function setMotionPreference(on,force=false){
 document.documentElement.dataset.motion=!on?'off':force?'force':'on';
}
// Numbers are accurate immediately. No 700ms animated counter before users can read them.
export function applyMotion(root){
 if(!root)return;
 for(const el of root.querySelectorAll('[data-count]')){
  const n=Number(el.dataset.count);
  if(Number.isFinite(n)&&n>=0)el.textContent=n.toLocaleString('ru-RU');
 }
}
// Removed pointer-follow: layout reads and inherited CSS vars repainted whole cards.
export function installCinematicPointer(){/* CSS preserves press states without a global pointer tracker. */}
export function installMotionEffects(){
 if(installed)return;installed=true;
 const update=()=>document.documentElement.classList.toggle('ems-motion-paused',document.hidden);
 document.addEventListener('visibilitychange',update,{passive:true});
 update();
}
