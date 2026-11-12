import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,renderFieldTraining} from '../public/js/views/field-training.js';
import {trainingMediaByCourse,mediaForLesson,renderTrainingStepMedia} from '../public/js/views/training-media.js';

test('visual Academy uses safe, local paths and existing lesson steps',()=>{
 const all=[];
 for(const lesson of lessons){
  const media=mediaForLesson(lesson);
  for(const item of media){
   assert.match(item.file,/^[a-z][a-z0-9-]*$/);
   assert.ok(item.step<lesson.steps.length,'media index must reference real step: '+lesson.title);
   assert.ok(item.caption.length>12);
   assert.doesNotMatch(item.caption,/https?:\/\//);
   all.push(item.file);
  }
 }
 assert.ok(new Set(all).size>=20,'at least twenty unique curated screenshot subjects');
 assert.ok(all.length>=30,'stepwise reuse of relevant shots');
});
test('each image renders with safe local path and accessible caption',()=>{
 const lesson=lessons.find(x=>x.title.startsWith('03'));
 const html=renderTrainingStepMedia(lesson,0);
 assert.match(html,/src="\/assets\/training\/pills-sklif\.webp"/);
 assert.match(html,/src="\/assets\/training\/pills-vorok\.webp"/);
 assert.match(html,/loading="lazy"/);
 assert.match(html,/data-academy-open/);
 assert.doesNotMatch(html,/src="https?:/);
});
test('visual academy keeps course checkboxes compatible with existing stored progress',()=>{
 const html=renderFieldTraining({id:'example'});
 assert.match(html,/data-learn-key="03 · Таблетки:/);
 assert.match(html,/id="ems-learning-search"/);
 assert.match(html,/data-academy-filter="Интернатура"/);
 assert.match(html,/id="ems-training-lightbox"/);
 assert.match(html,/data-academy-panel="03"/);
 assert.match(html,/data-academy-course="03"/);
 assert.match(html,/data-academy-step-navigation|ems-lesson-step-navigation/);
 assert.match(html,/data-academy-section/);
 assert.match(html,/data-academy-complete/);
 assert.match(html,/плашке/);
});
test('course list covers the original twelve topics',()=>{
 assert.equal(lessons.length,12);
 assert.equal(Object.keys(trainingMediaByCourse).length,12);
 assert.ok(trainingMediaByCourse['04'].some(m=>m.file==='pmp-siren'));
});
