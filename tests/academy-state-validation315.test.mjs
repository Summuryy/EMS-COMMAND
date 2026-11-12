import test from 'node:test';
import assert from 'node:assert/strict';
import {validAcademyBookmark,loadAcademyAccount,readLegacyAcademy} from '../public/js/academy-state-client.js';

test('Academy rejects array-shaped bookmarks even with valid-looking properties',()=>{
 const bookmark=[];bookmark.course='01';bookmark.step=0;
 assert.equal(validAcademyBookmark(bookmark),false);
});

test('Academy rejects malformed array-shaped server progress',async()=>{
 await assert.rejects(()=>loadAcademyAccount('user-1',async()=>({initialized:true,progress:[],bookmark:{course:'01',step:0}})),/Некорректное состояние Академии/);
});

test('Academy keeps valid server progress and bookmark unchanged',async()=>{
 const saved=await loadAcademyAccount('user-1',async()=>({initialized:true,progress:{},bookmark:{course:'02',step:1}}));
 assert.deepEqual(saved.progress,{});
 assert.deepEqual(saved.bookmark,{course:'02',step:1});
});

test('Academy ignores malformed legacy bookmark array',()=>{
 const value=[];value.course='01';value.step=0;
 const old=readLegacyAcademy('user-1',{getItem:key=>key.startsWith('ems-academy-workspace:')?JSON.stringify(value):null});
 assert.deepEqual(old.bookmark,{course:'01',step:0});
});
