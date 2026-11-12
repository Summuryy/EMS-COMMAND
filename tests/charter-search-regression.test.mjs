import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCharter} from '../public/js/views/academy.js';

const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
const chapters=JSON.parse(readFileSync(new URL('../public/data/charter.json',import.meta.url),'utf8'));

test('charter search redraws charter instead of Academy',()=>{
 const handler=app.match(/if\(e\.target\.id==='charter-search'\)\{[^\n]+/);
 assert.ok(handler,'charter search handler exists');
 assert.match(handler[0],/innerHTML=renderCharter\(state\)/);
 assert.doesNotMatch(handler[0],/innerHTML=renderAcademy\(state\)/);
 assert.match(handler[0],/setSelectionRange\(caret,caret\)/);
});

test('charter search preserves relevant chapter content',()=>{
 const html=renderCharter({charter:chapters,charterSearch:'2.2 Отделение медицинской подготовки'});
 assert.match(html,/Отделение медицинской подготовки/);
 assert.match(html,/id="charter-search"/);
 assert.match(html,/<details class="rule v3-rule" open>/);
 assert.doesNotMatch(html,/ems-learning-course-list/);
});
