import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCharter} from '../public/js/views/academy.js';
import {esc} from '../public/js/util.js';

const file=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const chapters=JSON.parse(file('public/data/charter.json'));
const render=(query='')=>renderCharter({charter:chapters,charterSearch:query});

test('all 14 charter chapters include readable substantive text in shipped JSON and HTML',()=>{
 assert.equal(chapters.length,14);
 for(const chapter of chapters){
  assert.equal(typeof chapter.number,'number');
  assert.ok(chapter.text.length>100,chapter.title+' should include its actual articles');
  const markup=render();
  const label=chapter.title;
  assert.ok(markup.includes(label),'missing chapter: '+label);
  assert.ok(markup.includes(esc(chapter.text.slice(0,45))), 'missing rules body of '+label);
 }
 assert.equal((render().match(/<details class="rule v3-rule"/g)||[]).length,14);
 assert.equal((render().match(/<div class="v3-rule-body">/g)||[]).length,14);
});

test('search opens matching charter chapter with its real text, not a blank header',()=>{
 const markup=render('2.2 Отделение медицинской подготовки');
 assert.equal((markup.match(/<details class="rule v3-rule" open>/g)||[]).length,1);
 assert.match(markup,/Отделения/);
 assert.match(markup,/Отделение медицинской подготовки/);
 assert.match(markup,/2\.2/);
 const noMatches=render('__not_an_actual_charter_rule__');
 assert.match(noMatches,/Совпадений нет/);
});

test('charter details cannot inherit 1px divider height and clip opened content',()=>{
 const foundation=file('public/styles/v3/foundation.css');
 const screens=file('public/styles/v3/screens.css');
 const cohesion=file('public/styles/v3/cohesion381.css');
 const index=file('public/index.html');
 assert.match(foundation,/\.v3-panel-kicker\s*>\s*\.v3-rule\s*\{height:1px;/);
 assert.doesNotMatch(foundation,/(?:^|\})\s*\.v3-rule\s*\{height:1px;/m);
 assert.match(screens,/\.v3-academy-panel\s+details\.v3-rule\s*\{height:auto;max-height:none;/);
 assert.match(screens,/\.v3-rule-body\s*\{white-space:pre-line;/);
 assert.match(cohesion,/\.v3-academy-panel \.v3-rule-list\s*\{\s*max-height:none;overflow:visible;/);
 assert.ok(index.indexOf('/styles/v3/foundation.css')<index.indexOf('/styles/v3/screens.css'),'CSS override must load after foundation');
});
