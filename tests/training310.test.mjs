import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TRAINING_LESSONS,TRAINING_RESOURCES,INTERN_RANKS,OMP_RANKS,OPP_RANKS,GNEWS_TEMPLATES,TRAINING_CAPTIONS} from '../public/js/views/training-data.js';
import {makeInternReport,makeGnews,allowedEvidenceUrl} from '../public/js/views/training-interactions.js';
import {renderAcademy} from '../public/js/views/academy.js';

const s={charterSearch:'',charter:[{number:'1',title:'Устав',text:'Пример устава'}]};
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('training covers distinct intern, OMP and OPP promotion systems',()=>{
 assert.deepEqual(INTERN_RANKS.map(x=>[x.from,x.to]),[[1,2],[2,3]]);
 assert.equal(INTERN_RANKS[1].requirements.find(x=>x[0]==='sklif')[2],30);
 assert.equal(INTERN_RANKS[1].requirements.find(x=>x[0]==='67')[2],20);
 assert.equal(INTERN_RANKS[1].requirements.find(x=>x[0]==='pmpMentor')[2],10);
 assert.deepEqual(OMP_RANKS.map(x=>x.interviews),[7,10,13,15]);
 assert.deepEqual(OMP_RANKS.map(x=>x.pmpWithIntern),[20,20,20,30]);
 assert.equal(OMP_RANKS[3].qualifications.length,2);
 assert.deepEqual(OPP_RANKS.map(x=>x.pmp),[40,60,75,90,105,120]);
 assert.equal(OPP_RANKS[5].tablets,300);
 assert.equal(TRAINING_LESSONS.length>=14,true);
 const ids=new Set(TRAINING_LESSONS.map(x=>x.id));assert.equal(ids.size,TRAINING_LESSONS.length);
 for(const lesson of TRAINING_LESSONS){assert.ok(lesson.steps.length>=3,lesson.title);assert.ok(lesson.note);}
});

test('training report uses manual entry, forbids invented evidence and includes OMP tag',()=>{
 const first=makeInternReport({type:'1-2',name:'Тестовый Игрок',staticId:'12345',first:'https://disk.yandex.ru/i/TEST',second:'https://discord.com/channels/demo',test:'https://onlinetestpad.com/abc'});
 assert.match(first,/Тестовый Игрок/);assert.match(first,/12345/);
 assert.match(first,/@Отдел медицинской подготовки/);
 assert.match(first,/https:\/\/disk.yandex.ru/);
 assert.doesNotMatch(first,/10 вызовов/);
 const second=makeInternReport({type:'2-3',name:'',first:'https://evil.example.com/fake'});
 assert.match(second,/10 вызовов/);assert.match(second,/30 пациентов/);
 assert.match(second,/НЕРАЗРЕШЁННЫЙ/);assert.match(second,/ВСТАВИТЬ/);
 assert.ok(allowedEvidenceUrl('https://fotora.ru/u/1'));
 assert.ok(allowedEvidenceUrl('https://drive.google.com/file/d/1'));
 assert.ok(!allowedEvidenceUrl('http://disk.yandex.ru/abc'));
 assert.ok(!allowedEvidenceUrl('https://disk.yandex.ru.evil.com/x'));
 assert.ok(!allowedEvidenceUrl('javascript:alert(1)'));
});

test('state news generator requires real times and never posts automatically',()=>{
 assert.equal(GNEWS_TEMPLATES.length,10);
 assert.match(makeGnews({template:1,start:'15:00',end:'16:15'}),/^\/gnews/);
 assert.match(makeGnews({template:1,start:'15:00',end:'16:15'}),/15:00/);
 assert.match(makeGnews({template:1,start:'15:00',end:'16:15'}),/16:15/);
 assert.doesNotMatch(makeGnews({template:1,start:'15:00',end:'16:15'}),/\{start\}/);
 assert.match(makeGnews({template:0,start:'',end:''}),/УКАЖИТЕ ВРЕМЯ/);
});

test('academy is integrated but original charter remains functional',()=>{
 const html=renderAcademy(s);
 assert.match(html,/ems-learning-root/);assert.match(html,/Первый день в больнице/);
 assert.match(html,/Бодикамера/);assert.match(html,/training-media-files/);
 assert.match(html,/training-report-preview/);
 assert.match(html,/charter-search/);assert.match(html,/Пример устава/);
 assert.match(html,/Справочная копия/);
 assert.ok(html.indexOf('ems-learning-root')<html.indexOf('charter-search'));
});

test('training screenshot policy is local-only and respects reduced motion',()=>{
 const interactions=read('../public/js/views/training-interactions.js');
 const styles=read('../public/styles/v3/training310.css');
 const index=read('../public/index.html');
 assert.match(interactions,/URL.createObjectURL/);
 assert.doesNotMatch(interactions,/fetch\(|XMLHttpRequest|sendBeacon\(/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/html\[data-motion="off"\]/);
 assert.ok(index.indexOf('training310.css')>index.indexOf('performance393.css'));
 for(const lesson of TRAINING_LESSONS){for(const f of lesson.media||[]){assert.match(f,/^image\(\d{8}-\d{6}(?:-\d+)?\)\.png$/);}}
 assert.match(TRAINING_CAPTIONS['image(20261112-000655).png'],/бодикамера/);
 assert.ok(TRAINING_RESOURCES.intro.startsWith('https://docs.google.com/'));
});