import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NAV_SECTIONS,navigationForRole,navTitle} from '../public/js/navigation.js';
import {renderProfile} from '../public/js/views/profile.js';
import {renderHome} from '../public/js/views/home.js';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../public/js/app.js');
const css=read('../public/styles/v3/performance393.css');
const index=read('../public/index.html');
const motion=read('../public/js/motion.js');

test('3.9.3 navigation puts daily tasks before service and admin tools',()=>{
 const worker=navigationForRole('user');
 assert.deepEqual(worker.map(g=>g.label),['МОЯ СЛУЖБА','СПРАВКА И СЕРВИСЫ']);
 assert.deepEqual(worker[0].items.map(i=>i.id),['home','shift','evidence','career']);
 assert.deepEqual(worker[1].items.map(i=>i.id),['academy','pro']);
 assert.ok(!worker.some(g=>g.items.some(i=>i.id==='admin')));
 const reviewer=navigationForRole('reviewer');
 assert.equal(reviewer[2].items[0].id,'admin');
 assert.equal(navTitle('career'),'Повышение');
 assert.equal(navTitle('unknown'),'Обзор');
 assert.equal(NAV_SECTIONS.length,3);
 assert.match(app,/renderSidebarNavigation\(\)/);
 assert.match(app,/data-nav="profile"/);
 assert.match(app,/data-action="upload"/);
 assert.match(app,/behavior:'auto'/);
});

test('3.9.3 decorative movement never requires a permission banner',()=>{
 assert.ok(!app.includes('ems392-motion-alert'));
 assert.ok(!app.includes("if(action==='force-motion')"));
 const user={displayName:'Сотрудник',rank:1,role:'user',serverName:'Россия Онлайн'};
 const screen=renderProfile({user,motionEnabled:true,systemReducedMotion:true,motionOverride:false});
 assert.ok(!screen.includes('force-motion'));
 assert.ok(!screen.includes('Включить полный'));
 assert.ok(screen.includes('Windows использует уменьшенное движение'));
 assert.ok(screen.includes('id="motion-switch"'));
});

test('3.9.3 motion has no per-pointer geometry loops and keeps feedback composited',()=>{
 assert.ok(!motion.includes("addEventListener('pointermove'"));
 assert.ok(!motion.includes('getBoundingClientRect'));
 assert.ok(!motion.includes('requestAnimationFrame'));
 assert.ok(!motion.includes('IntersectionObserver'));
 assert.match(motion,/toLocaleString\('ru-RU'\)/);
 assert.match(css,/\.ems-ecg-moving\{animation:ems-heart-scroll/);
 assert.match(css,/animation:ems391-entry \.18s/);
 assert.match(css,/filter:none!important/);
 assert.match(css,/html\[data-motion="off"\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.ok(index.indexOf('performance393.css')>index.indexOf('motion392.css'));
});

test('3.9.3 OCR resumes pending work after local server can start',()=>{
 const server=read('../server/index.mjs');
 assert.match(server,/const pendingResumeTimer=setTimeout/);
 assert.match(server,/resumePending\(\)/);
 assert.match(server,/12000/);
 assert.match(read('../desktop/main.cjs'),/setPermissionRequestHandler/);
 assert.equal(JSON.parse(read('../package.json')).version,'3.10.0');
});

test('new players see an actionable, truthful first-shift guide',()=>{
 const user={displayName:'Новый игрок',rank:1,role:'user',serverName:'Россия Онлайн',department:'EMS'};
 const initial=renderHome({user,dashboard:{stats:{total:0,accepted:0,review:0,rejected:0},shift:null,recent:[],notices:[]}});
 assert.match(initial,/Три шага для первой смены/);
 assert.match(initial,/data-nav="profile"/);
 assert.match(initial,/data-nav="shift"/);
 assert.match(initial,/data-action="upload"/);
 const already=renderHome({user,dashboard:{stats:{total:10,accepted:2,review:8,rejected:0},shift:null,recent:[],notices:[]}});
 assert.doesNotMatch(already,/Три шага для первой смены/);
});
