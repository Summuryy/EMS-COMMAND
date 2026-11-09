import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {safeVersion,safeRel,validManifest,verifyEnvelope,digest,validRedirect,REPO}=require('../launcher/security.cjs');
const {verifyFiles,compareVersions,readState}=require('../launcher/core.cjs');
function fixture(){
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 const publicPem=publicKey.export({type:'spki',format:'pem'});
 const content=Buffer.from('test payload');
 const manifest={
  schema:1,version:'3.6.0',platform:'win32-x64',
  url:REPO+'v3.6.0/EMS-COMMAND-App-3.6.0-win-x64.zip',
  size:100,sha256:'0'.repeat(64),entry:'EMS COMMAND.exe',
  files:[{path:'EMS COMMAND.exe',size:content.length,sha256:digest(content)}]
 };
 const sign=m=>({manifest:m,signature:crypto.sign(null,Buffer.from(JSON.stringify(m)),privateKey).toString('base64')});
 return {publicPem,sign,manifest,content};
}
test('Ed25519 signature and signed file inventory are required',()=>{
 const f=fixture();
 assert.equal(verifyEnvelope(f.sign(f.manifest),f.publicPem).version,'3.6.0');
 assert.throws(()=>verifyEnvelope({...f.sign(f.manifest),signature:Buffer.alloc(64).toString('base64')},f.publicPem),/signature/i);
 assert.throws(()=>verifyEnvelope(f.sign(f.manifest),''),/key/i);
 const altered={...f.manifest,url:'https://evil.example/archive.zip'};
 assert.throws(()=>verifyEnvelope(f.sign(altered),f.publicPem),/URL/);
});
test('archive paths reject Windows device names, traversal and ADS',()=>{
 for(const p of ['../evil.exe','A/../../B','C:/bad','foo\\bar','CON','x/COM1.txt','file.txt:stream','foo.','/etc/passwd'])assert.throws(()=>safeRel(p),p);
 assert.equal(safeRel('resources/app.asar'),'resources/app.asar');
 assert.throws(()=>safeVersion('../../exe'));
});
test('signed manifest rejects path collisions and unlisted executable',()=>{
 const f=fixture();
 assert.throws(()=>validManifest({...f.manifest,files:[...f.manifest.files,{...f.manifest.files[0],path:'ems command.EXE'}]}),/Duplicate/);
 assert.throws(()=>validManifest({...f.manifest,files:[{...f.manifest.files[0],path:'x.exe'}]}),/Missing executable/);
});
test('redirect hosts and versions are restricted',()=>{
 assert.equal(validRedirect('https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/ems-manifest.json'),true);
 assert.equal(validRedirect('http://github.com/a'),false);
 assert.equal(validRedirect('https://github.com.evil.test/a'),false);
 assert.equal(validRedirect('https://127.0.0.1/a'),false);
 assert.equal(compareVersions('3.6.1','3.6.0'),1);
 assert.equal(compareVersions('3.6.0','3.6.0'),0);
});
test('on-disk files are hashed and extra/modified files rejected',async()=>{
 const f=fixture(),dir=await fs.mkdtemp(path.join(os.tmpdir(),'ems-launcher-'));
 try{
  await fs.writeFile(path.join(dir,'EMS COMMAND.exe'),f.content);
  await verifyFiles(dir,f.manifest);
  await fs.writeFile(path.join(dir,'EMS COMMAND.exe'),'tampered');
  await assert.rejects(verifyFiles(dir,f.manifest),/damaged/);
  await fs.writeFile(path.join(dir,'EMS COMMAND.exe'),f.content);
  await fs.writeFile(path.join(dir,'unlisted.dll'),'bad');
  await assert.rejects(verifyFiles(dir,f.manifest),/count mismatch/);
  assert.deepEqual(await readState(dir),{current:null,previous:null});
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
