import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PROFILE_SCHEMA_VERSION,PLATFORM_IDS,RUSSIA_ONLINE_KUTUZOVSKY,
 validateServerProfile,createServerProfile,profileKey,mayUsePromotionRules
} from '../server/server-profiles.mjs';

const draft=()=>({
 schemaVersion:PROFILE_SCHEMA_VERSION,
 platformId:'majestic',
 serverId:'example-server',
 serverName:'Пример игрового сервера',
 rulesStatus:'draft',promotionRules:[],evidenceRules:[]
});

test('server profile catalog only marks Russia Online first target as draft',()=>{
 assert.ok(PLATFORM_IDS.includes('russia-online'));
 assert.ok(PLATFORM_IDS.includes('gta5rp'));
 assert.ok(PLATFORM_IDS.includes('majestic'));
 assert.equal(profileKey(RUSSIA_ONLINE_KUTUZOVSKY),'russia-online:kutuzovsky');
 assert.equal(RUSSIA_ONLINE_KUTUZOVSKY.rulesStatus,'draft');
 assert.equal(RUSSIA_ONLINE_KUTUZOVSKY.promotionRules.length,0);
 assert.equal(mayUsePromotionRules(RUSSIA_ONLINE_KUTUZOVSKY),false);
});

test('server profiles reject ambiguous or unapproved cross-server rules',()=>{
 const p=draft();
 assert.equal(validateServerProfile(p).ok,true);
 assert.equal(mayUsePromotionRules(createServerProfile(p)),false);
 assert.throws(()=>createServerProfile({...p,serverId:'../other'}),/invalid serverId/);
 assert.throws(()=>createServerProfile({...p,platformId:'unknown'}),/invalid platformId/);
 assert.throws(()=>createServerProfile({...p,promotionRules:[{id:'test',title:'Не проверено',targetRank:0}]}),/invalid promotion rule/);
 assert.throws(()=>createServerProfile({...p,evidenceRules:[{id:'pmp',title:'ПМП'},{id:'pmp',title:'ПМП повтор'}]}),/duplicate evidence rule/);
 assert.throws(()=>createServerProfile({...p,rulesStatus:'verified'}),/verified profile requires/);
});

test('verified server rules must declare an HTTPS source, version and date',()=>{
 const p={...draft(),rulesStatus:'verified',sourceUrl:'https://example.org/rules',
  rulesVersion:'2026.11',verifiedAt:'2026-11-11T00:00:00Z',
  promotionRules:[{id:'pmp',title:'ПМП — проверено администратором',targetRank:4}],
  evidenceRules:[{id:'pmp',title:'Успешная реанимация'}]};
 const approved=createServerProfile(p);
 assert.equal(mayUsePromotionRules(approved),true);
 assert.equal(profileKey(approved),'majestic:example-server');
 assert.equal(approved.rulesVersion,'2026.11');
 assert.ok(Object.isFrozen(approved));
 assert.ok(Object.isFrozen(approved.promotionRules[0]));
 assert.throws(()=>createServerProfile({...p,sourceUrl:'http://example.org/rules'}),/https source/);
 assert.throws(()=>createServerProfile({...p,verifiedAt:'not-a-date'}),/verifiedAt/);
 const another=createServerProfile({...p,serverId:'another-instance'});
 assert.notEqual(profileKey(another),profileKey(approved));
});
