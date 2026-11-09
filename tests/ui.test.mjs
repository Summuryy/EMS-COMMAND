import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderHome} from '../public/js/views/home.js';
import {renderEvidence} from '../public/js/views/evidence.js';
import {renderShift} from '../public/js/views/shift.js';
import {renderCareer} from '../public/js/views/career.js';
import {renderAcademy} from '../public/js/views/academy.js';
import {renderProfile} from '../public/js/views/profile.js';
import {renderPro} from '../public/js/views/pro.js';
import {renderAdmin} from '../public/js/views/admin.js';
const user={displayName:'Тестовый сотрудник',username:'tester',staticId:'12345',serverName:'Кутузовский',rank:3,role:'admin',department:'ОПП',staticVerified:false};
const base={user,dashboard:{stats:{total:10,accepted:5,review:4,rejected:1},shift:null,recent:[],notices:[]},evidence:{items:[]},queue:[],filter:'all',shifts:{shifts:[]},career:{rank:3,goals:[],stats:{categories:[]}},charter:[{number:1,title:'Общее положение',text:'Тест'}],charterSearch:'',motionEnabled:true,adminTab:'reviews',admin:{reviews:{items:[]}},notices:[]};
test('every navigation page renders in isolation',()=>{
  for(const [name,fn] of Object.entries({home:renderHome,evidence:renderEvidence,shift:renderShift,career:renderCareer,academy:renderAcademy,profile:renderProfile,pro:renderPro,admin:renderAdmin})){
    const html=fn(base);assert.ok(html.length>400,name);assert.ok(/(?:<section|<header)/.test(html),name);assert.doesNotMatch(html,/\bundefined\b/,name);
  }
});
test('single evidence drop target and real reporting actions',()=>{
 const html=renderEvidence(base);assert.match(html,/id="dropzone"/);assert.equal((html.match(/id="dropzone"/g)||[]).length,1);assert.match(html,/data-action="export-report"/);assert.match(html,/data-action="refresh"/);
});
test('shift and profile retain functional controls',()=>{
 assert.match(renderShift(base),/data-action="start-shift"/);
 assert.match(renderProfile(base),/id="profile-form"/);
 assert.match(renderProfile(base),/id="password-form"/);
 assert.match(renderProfile(base),/id="motion-switch"/);
});
test('Pro does not invent a running capture or payment integration',()=>{
 const html=renderPro(base);assert.match(html,/Ещё недоступен/);assert.match(html,/Не подключены/);assert.doesNotMatch(html,/data-action="start-capture"/);
});
test('motion implementation honors reduced-motion and user preference',()=>{
 const style=fs.readFileSync(new URL('../public/styles/v3/motion.css',import.meta.url),'utf8');
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(style,/html\[data-motion="off"\]/);
});
