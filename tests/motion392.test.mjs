import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {remainingFraction,toastDuration,createToastCenter} from '../public/js/notifications.js';
import {ecg} from '../public/js/views/visual.js';
import {renderProfile} from '../public/js/views/profile.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const css=read('../public/styles/v3/motion392.css');
const motionCss=read('../public/styles/v3/motion.css');
const app=read('../public/js/app.js');
const motion=read('../public/js/motion.js');
const html=read('../public/index.html');
const user={displayName:'Тест',serverName:'Кутузовский',rank:1,role:'member',staticVerified:false};

test('3.9.2 ECG has 9 P-QRS-T cycles, grid, sweep and 72-bpm illustrative cadence',()=>{
 const markup=ecg('monitor');
 assert.equal((markup.match(/class="ems-ecg-line"/g)||[]).length,9);
 assert.match(markup,/ems392-ecg-grid/);
 assert.match(markup,/ems392-ecg-scan/);
 assert.match(markup,/M0 27 L10 27 Q14 27 17 24/);
 assert.match(markup,/L40 6 L44 44/);
 assert.match(markup,/aria-hidden="true"/);
 assert.match(css,/\.ems-ecg-moving\{animation:ems-heart-scroll 2\.5s/);
 assert.match(css,/@keyframes ems392-ecg-scan/);
 assert.ok(html.indexOf('motion392.css')>html.indexOf('motion391.css'));
});

test('3.9.2 user opt-in can override OS motion suppression; no opt-in still respects Windows',()=>{
 assert.match(motion,/mode==='force'\|\|!reduced\(\)/);
 assert.match(motion,/dataset\.motion=!on\?'off':force\?'force':'on'/);
 assert.match(motionCss,/html:not\(\[data-motion="force"\]\) \*/);
 assert.match(css,/html\[data-motion="force"\] \.ems-ecg-moving/);
 assert.match(css,/html\[data-motion="off"\] \.ems392-ecg-scan/);
 assert.match(app,/motionOverride:localStorage\.getItem\('ems-motion-enabled'\)==='true'/);
 assert.match(app,/if\(action==='force-motion'\)/);
 assert.match(app,/if\(action==='respect-system-motion'\)/);
 assert.match(app,/setMotionPreference\(state\.motionEnabled,state\.motionOverride\)/);
 const os=renderProfile({user,motionEnabled:true,motionOverride:false,systemReducedMotion:true});
 assert.match(os,/Включить полный Motion\/VFX/);
 assert.match(os,/aria-disabled="true"/);
 const forced=renderProfile({user,motionEnabled:true,motionOverride:true,systemReducedMotion:true});
 assert.match(forced,/Вернуть режим Windows/);
 assert.match(forced,/aria-disabled="false"/);
 const off=renderProfile({user,motionEnabled:false,motionOverride:false,systemReducedMotion:false});
 assert.match(off,/Эффекты выключены/);
});

test('3.9.2 notification progress is deterministic and bounded',()=>{
 assert.equal(remainingFraction(0,5500),1);
 assert.equal(remainingFraction(2750,5500),.5);
 assert.equal(remainingFraction(5500,5500),0);
 assert.equal(remainingFraction(8000,5500),0);
 assert.equal(remainingFraction(-100,5500),1);
 assert.equal(toastDuration('success'),5500);
 assert.equal(toastDuration('warning'),6500);
 assert.equal(toastDuration('error'),7200);
 assert.match(css,/@keyframes ems392-toast-in/);
 assert.match(css,/@keyframes ems392-toast-out/);
 assert.match(css,/ems392-toast-out \.32s/);
 assert.match(css,/transition:transform \.06s linear/);
 assert.match(app,/toastCenter\.notify/);
 assert.doesNotMatch(app,/setTimeout\(\(\)=>el\.remove\(\),5500\)/);
});

test('3.9.2 actual toast lifecycle pauses, expires, exits, and drains bounded queue',()=>{
 const original=globalThis.document;
 let now=0, interval=null;
 const delayed=[];
 const root={items:[],appendChild(el){this.items.push(el);}};
 class Element {
  constructor(){this.attrs={};this.style={};this.listeners={};this.nodes={};this.classList={add:(x)=>{this.lastClass=x;}};this.hidden=false;this.removed=false;}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  querySelector(k){return this.nodes[k]??(this.nodes[k]=new Element());}
  matches(){return false;}
  contains(){return false;}
  remove(){this.removed=true;root.items=root.items.filter(x=>x!==this);}
 }
 globalThis.document={hidden:false,activeElement:null,createElement:()=>new Element()};
 try{
  const center=createToastCenter({getRoot:()=>root,icon:()=>'<svg></svg>',
   now:()=>now,every:fn=>{interval=fn;return 7;},cancelEvery:()=>{interval=null;},
   after:(fn,ms)=>{delayed.push({fn,ms});}});
  center.notify('<script>danger</script>','Safe text');
  center.notify('Two');
  center.notify('Three');
  center.notify('Four');
  assert.equal(root.items.length,3,'at most three visible notifications');
  assert.equal(root.items[0].querySelector('strong').textContent,'<script>danger</script>','user text never interpolated into HTML');
  now=2750;interval();
  assert.equal(root.items[0].querySelector('.ems392-toast-life i').style.transform,'scaleX(0.5000)');
  root.items[0].listeners.mouseenter();
  now=3750;interval();
  assert.equal(root.items[0].querySelector('.ems392-toast-life i').style.transform,'scaleX(0.5000)','hover pauses life');
  globalThis.document.hidden=true;
  now=6000;interval();
  assert.equal(root.items[0].querySelector('.ems392-toast-life i').style.transform,'scaleX(0.5000)','background pauses life');
  globalThis.document.hidden=false;
  root.items[0].listeners.mouseleave();
  now=9000;interval();
  assert.equal(root.items[0].lastClass,'ems392-toast-leaving','expired toast plays exit');
  assert.equal(delayed[0].ms,340);
  const expired=delayed.splice(0);
  expired.forEach(item=>item.fn());
  assert.equal(root.items.length,2,'queue stays bounded after expiration');
  assert.equal(root.items[1].querySelector('strong').textContent,'Four','queued notification becomes visible');
  root.items[1].querySelector('.ems392-toast-close').listeners.click();
  assert.equal(root.items[1].lastClass,'ems392-toast-leaving','manual close plays exit');
 }finally{globalThis.document=original;}
});

test('3.9.2 version, safety and signed release route are unchanged',()=>{
 const pkg=JSON.parse(read('../package.json'));
 assert.equal(pkg.version,'3.9.2');
 assert.match(pkg.scripts.check,/node --check public\/js\/notifications\.js/);
 assert.match(app,/data-action="upload"/);
 assert.match(app,/data-action="logout"/);
 assert.match(app,/if\(action==='test-motion'\)/);
 assert.match(app,/getComputedStyle\(probe\)\.animationName\.includes\('ems391-motion-check'\)/);
 assert.match(css,/html\[data-motion="off"\]/);
 assert.doesNotMatch(css,/rank-up|fake-evidence|fake-approval/);
});
