import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../.agents/skills/',import.meta.url);
const skills=['emil-design-eng','animate','review-animations','improve-animations','animation-performance','choreograph','find-animation-opportunities','design-taste-frontend','redesign-existing-projects'];
const relative={'animate':['RECIPES.md'],'review-animations':['STANDARDS.md'],'improve-animations':['AUDIT.md','PLAN-TEMPLATE.md'],'choreograph':['RECIPES.md']};
test('vendored agent skills are readable and correctly named',()=>{
 for(const name of skills){
  const file=new URL(name+'/SKILL.md',root);
  const source=readFileSync(file,'utf8');
  assert.match(source,new RegExp('^---\\r?\\nname: '+name+'\\r?\\n'));
  assert.ok(source.length>1000,name+' should contain the actual upstream skill, not a placeholder');
  for(const rel of relative[name]||[])assert.ok(existsSync(new URL(name+'/'+rel,root)),name+' missing '+rel);
 }
});
test('skill provenance, MIT licenses and project safeguards are documented',()=>{
 const read=p=>readFileSync(new URL(p,root),'utf8');
 assert.match(read('README.md'),/715c1807e08c497cfd1dc4feb450a2a3300ef2a9/);
 assert.match(read('README.md'),/37c8c376b92ebc02456f7c70776b514fddda88e1/);
 for(const file of ['_licenses/EMIL-MIT.txt','_licenses/TASTE-MIT.txt'])assert.match(read(file),/MIT License/);
 const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
 assert.match(agents,/\.agents\/skills\/README\.md/);
 assert.match(agents,/not automatically installed ChatGPT capabilities/);
});
