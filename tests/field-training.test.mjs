import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,renderFieldTraining} from '../public/js/views/field-training.js';

test('training covers the hospital practical roles',()=>{
 assert.ok(lessons.length>=12);
 const groups=new Set(lessons.map(x=>x.category));
 for(const group of ['Интернатура','Практика','Карьера','ОМП','Доказательства'])assert.ok(groups.has(group));
});
test('training lessons have titles and concrete steps',()=>{
 for(const lesson of lessons){
  assert.ok(lesson.title.length>8);
  assert.ok(lesson.steps.length>=4);
  for(const step of lesson.steps)assert.ok(step.length>20);
 }
});
test('rendered guide includes mandatory evidence limits and accessible details',()=>{
 const html=renderFieldTraining();
 assert.match(html,/data-academy-panel="01"/);
 assert.match(html,/data-academy-step="0"/);
 assert.match(html,/data-academy-next/);
 assert.match(html,/id="ems-learning-search"/);
 assert.match(html,/11\.6/);
 assert.match(html,/40 минут/);
 assert.match(html,/30 таблеток/);
 assert.match(html,/Согласно К\.А\./);
 assert.match(html,/Приложение не одобряет отчёты/);
 assert.doesNotMatch(html,/javascript:/i);
});
