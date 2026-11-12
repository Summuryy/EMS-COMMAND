import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderFieldTraining,lessons} from '../public/js/views/field-training.js';
import {renderTrainingStepMedia} from '../public/js/views/training-media.js';
import {hydrateAcademyStep} from '../public/js/views/academy-workspace.js';

test('Academy initially requests only images from the visible lesson stage',()=>{
 const old=globalThis.localStorage;
 globalThis.localStorage={getItem:()=>null};
 try{
  const html=renderFieldTraining({id:'perf-check'});
  const loaded=(html.match(/\ssrc="\/assets\/training\//g)||[]).length;
  const deferred=(html.match(/\sdata-src="\/assets\/training\//g)||[]).length;
  assert.equal(loaded,3,'first course step has one image and two thumbnails');
  assert.ok(deferred>20,'unseen images must not be network-requested at page entry');
  assert.equal((html.match(/data-academy-panel="/g)||[]).length,12);
  assert.equal((html.match(/data-learn-key="/g)||[]).length,70);
 }finally{globalThis.localStorage=old;}
});

test('An inactive image gallery keeps captions and safe paths without browser src attributes',()=>{
 const item=lessons.find(l=>l.title.startsWith('04'));
 const html=renderTrainingStepMedia(item,5,{active:false});
 assert.match(html,/data-src="\/assets\/training\/pmp-interact\.webp"/);
 assert.match(html,/data-src="\/assets\/training\/pmp-minigame\.webp"/);
 assert.doesNotMatch(html,/\ssrc="/);
 assert.match(html,/aria-label="Увеличить скриншот/);
 const open=renderTrainingStepMedia(item,5,{active:true});
 assert.match(open,/\ssrc="\/assets\/training\/pmp-interact\.webp"/);
});

test('Selected stage hydrates only validated local WebP URLs once',()=>{
 function makeImg(path){
  const attrs=new Map([['data-src',path]]);
  return {getAttribute:key=>attrs.get(key)||null,setAttribute:(key,value)=>attrs.set(key,value),removeAttribute:key=>attrs.delete(key),attrs};
 }
 const good=makeImg('/assets/training/pmp-kits.webp');
 const bad=makeImg('https://example.net/unsafe.png');
 const step={querySelectorAll:selector=>selector==='img[data-src]'?[good,bad]:[]};
 assert.equal(hydrateAcademyStep(step),1);
 assert.equal(good.attrs.get('src'),'/assets/training/pmp-kits.webp');
 assert.equal(good.attrs.has('data-src'),false);
 assert.equal(bad.attrs.has('src'),false);
 assert.equal(hydrateAcademyStep(step),0);
});

test('Course search is indexed and app navigation skips Academy double rendering',()=>{
 const ws=readFileSync(new URL('../public/js/views/academy-workspace.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
 assert.match(ws,/const searchIndex=new Map\(lessons\.map/);
 assert.doesNotMatch(ws,/panel\?\.textContent/);
 assert.match(app,/if\(page==='academy'\)\{/);
 assert.match(app,/if\(root\?\.isConnected\)academyFilter\(root\)/);
 assert.match(app,/if\(state\.page==='shift'\)syncDutyTimeline/);
});
