// UI-only animation helpers. No timers for fake progress or invented data.
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export function setMotionPreference(on){document.documentElement.dataset.motion=on?'on':'off';}
export function applyMotion(root){if(!root||document.documentElement.dataset.motion==='off'||reduced())return;
  // Motion occurs when a section enters view; real counters always end at actual values.
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){e.target.classList.add('v3-visible');observer.unobserve(e.target);}}},{threshold:.08});root.querySelectorAll('.panel,.v3-number-card,.v3-intro,.v3-home-hero,.v3-shift-hero,.v3-career-hero,.v3-id-card,.v3-pro-hero,.v3-admin-banner,.v3-academy-banner').forEach(x=>{x.classList.add('v3-reveal');observer.observe(x);});}
  root.querySelectorAll('[data-count]').forEach(el=>{const end=Number(el.dataset.count||0);if(!Number.isFinite(end)||end<=0)return;const started=performance.now();const dur=600;const frame=now=>{if(!el.isConnected)return;const p=Math.min(1,(now-started)/dur);const x=1-(1-p)**3;el.textContent=Math.round(end*x).toLocaleString('ru-RU');if(p<1)requestAnimationFrame(frame);};requestAnimationFrame(frame);});
}
