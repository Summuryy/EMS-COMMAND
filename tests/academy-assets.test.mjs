import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {trainingMediaByCourse} from '../public/js/views/training-media.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assets=resolve(root,'public/assets/training');
test('all Academy screenshots are included in the signed app payload',()=>{
 const names=[...new Set(Object.values(trainingMediaByCourse).flatMap(items=>items.map(item=>item.file)))];
 assert.equal(names.length,25,'ship the full curated set, not broken links');
 for(const name of names){
  assert.match(name,/^[a-z][a-z0-9-]*$/);
  const path=resolve(assets,name+'.webp');
  const rel=relative(assets,path);
  assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'no path traversal');
  assert.ok(existsSync(path),'missing media: '+name);
  const body=readFileSync(path);
  assert.equal(body.toString('ascii',0,4),'RIFF','invalid RIFF image: '+name);
  assert.equal(body.toString('ascii',8,12),'WEBP','invalid WEBP image: '+name);
  assert.ok(body.length>3000&&body.length<250000,'unexpected image size: '+name);
 }
});
test('the two reception zones have distinct screenshot assets',()=>{
 const a=readFileSync(resolve(assets,'pills-sklif.webp'));
 const b=readFileSync(resolve(assets,'pills-vorok.webp'));
 assert.notDeepEqual(a,b,'do not confuse hospitals in the training course');
});
