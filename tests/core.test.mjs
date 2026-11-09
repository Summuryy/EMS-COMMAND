import test from 'node:test';
import assert from 'node:assert/strict';
import {inferFromText} from '../server/classifier.mjs';
import {imageInfo,decodePng,redBodycam,greenToast} from '../server/vision.mjs';
import {hashPassword,verifyPassword} from '../server/security.mjs';
import fs from 'node:fs';import path from 'node:path';
const source=process.env.EMS_TEST_FIXTURES || ''; // Optional local screenshot fixtures
test('classifier requires positive action and patient ID',()=>{
  assert.deepEqual(inferFromText('Вы вылечили #108175'),{category:'treatment',patientId:'108175',success:true});
  assert.equal(inferFromText('Виктор Киба начал оказывать первую медицинскую помощь').success,false);
  assert.equal(inferFromText('Вы реанимировали #12456').category,'pmp');
  assert.equal(inferFromText('Вы вакцинировали #12456').category,'vaccination');
});
test('only actual image signatures accepted',()=>{
  assert.throws(()=>imageInfo(Buffer.from('<script>not an image</script>')));
});
test('scrypt password validation',async()=>{
  const hashed=await hashPassword('VeryStrongTestPassword_2348');
  assert.equal(await verifyPassword('VeryStrongTestPassword_2348',hashed),true);
  assert.equal(await verifyPassword('wrong-password-here',hashed),false);
  await assert.rejects(()=>hashPassword('short'));
});
test('positive PNG screenshot bodycam, toast',()=>{
  const names=source && fs.existsSync(source)?fs.readdirSync(source).filter(x=>x.startsWith('Grand Theft Auto V Screenshot')):[];
  if(!names.length)return;
  const name=names.find(x=>x.includes('20.50.22'))||names[0];
  const image=decodePng(fs.readFileSync(path.join(source,name)));
  assert.equal(image.width,1536);
  assert.equal(redBodycam(image).state,'on');
  assert.equal(greenToast(image),true);
});
