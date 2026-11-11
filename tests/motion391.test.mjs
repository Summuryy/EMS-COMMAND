import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderProfile} from '../public/js/views/profile.js';
import {renderHome} from '../public/js/views/home.js';
import {renderShift} from '../public/js/views/shift.js';
import {renderCareer} from '../public/js/views/career.js';

const css=fs.readFileSync(new URL('../public/styles/v3/motion391.css',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const user={displayName:'Тестер',staticId:'',serverName:'Кутузовский',role:'admin',rank:1,department:'ОПП',staticVerified:false};
const base={user,motionEnabled:true,systemReducedMotion:false,
 dashboard:{stats:{total:0,accepted:0,review:0,rejected:0},shift:null,recent:[],notices:[]},
 shifts:{shifts:[]},career:{rank:1,goals:[{category:'pmp',needed:40,label:'ПМП',description:'Тест'}],stats:{categories:[]}}};

test('3.9.1 fixed root cause: overrides 3.8 hospital animation:none with a continuous visible sweep',()=>{
 const old=fs.readFileSync(new URL('../public/styles/v3/clinical38.css',import.meta.url),'utf8');
 assert.match(old,/\.ems38-home-hero:after\s*\{[^}]*animation:none/);
 assert.match(css,/\.ems38-layout \.ems39-home-scene::after\s*\{[^}]*animation:ems391-hospital-light 6\.6s/s);
 assert.match(css,/@keyframes ems391-hospital-light/);
 assert.match(css,/\.ems38-layout \.ems39-home-scene::before\s*\{[^}]*animation:ems391-hospital-breathe 6\.8s/s);
 assert.match(css,/\.ems38-layout \.ems39-home-scene \.v3-hud-label::before\s*\{[^}]*animation:ems-beacon-heart/s);
 assert.match(renderHome(base),/ems39-home-scene/);
});

test('3.9.1 routes animate clearly and waiting duty cardiogram still moves',()=>{
 assert.match(app,/class="page ems391-page-enter"/);
 assert.match(css,/@keyframes ems391-entry/);
 assert.match(css,/\.ems38-layout \.page\.ems391-page-enter\s*\{\s*animation:ems391-entry \.62s/s);
 assert.match(css,/\.ems38-layout \.page\.ems391-page-enter \.v3-summary-grid>\.v3-number-card/);
 assert.match(css,/@keyframes ems391-stagger/);
 assert.match(css,/\.ems38-layout \.ems391-shift-wave \.ecg\s*\{[^}]*animation:ems391-ecg-presence/s);
 assert.match(renderShift(base),/v3-shift-wave ems391-shift-wave/);
 assert.match(renderShift(base),/РЕЖИМ ОЖИДАНИЯ/);
 assert.match(renderCareer(base),/ems39-path-stages/);
});

test('3.9.1 Profile has a functional accessible test action and honest user/OS motion reasons',()=>{
 const on=renderProfile(base);
 assert.match(on,/id="ems391-motion-test"/);
 assert.match(on,/data-action="test-motion"/);
 assert.match(on,/id="ems391-motion-status" aria-live="polite"/);
 assert.match(on,/Эффекты разрешены/);
 assert.match(on,/id="motion-switch"/);
 assert.match(on,/aria-disabled="false"/);
 const off=renderProfile({...base,motionEnabled:false});
 assert.match(off,/aria-disabled="true"/);
 assert.match(off,/Эффекты выключены/);
 const osOff=renderProfile({...base,systemReducedMotion:true});
 assert.match(osOff,/aria-disabled="true"/);
 assert.match(osOff,/Windows использует уменьшенное движение/);
 assert.match(app,/if\(action==='test-motion'\)/);
 assert.match(app,/!state\.motionEnabled\?'Анимации выключены/);
 assert.match(app,/matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)/);
 assert.match(app,/getComputedStyle\(probe\)\.animationName\.includes\('ems391-motion-check'\)/);
 assert.match(css,/@keyframes ems391-motion-check/);
 assert.match(css,/ems391-motion-check 2\.7s/);
});

test('3.9.1 reduced motion, inactive-window pause and privacy are still respected',()=>{
 assert.ok(html.indexOf('motion391.css')>html.indexOf('experience39.css'));
 assert.match(css,/html\[data-motion="off"\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/html\.ems-motion-paused/);
 assert.match(css,/animation-play-state:paused!important/);
 assert.match(css,/\.ems38-layout \.ems39-command-handoff::after/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/\.ems391-motion-test button:focus-visible/);
 assert.match(app,/localStorage\.setItem\('ems-motion-enabled'/);
 assert.match(app,/setMotionPreference\(state\.motionEnabled,state\.motionOverride\);applyMotion\(\$\('#app'\)\)/);
 assert.doesNotMatch(css,/animation:.*(?:capture-fake|evidence-approve|rank-up)/);
});

test('3.9.1 app version is isolated from release request pending CI',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.version,'3.9.3');
 assert.match(app,/data-action="upload"/);
 assert.match(app,/data-action="logout"/);
 assert.match(renderShift(base),/data-action="start-shift"/);
 assert.match(renderCareer(base),/Ранг изменяется администратором/);
});
