'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {validManifest,safeRel}=require('./security.cjs');
const {createHash,createPrivateKey,createPublicKey,sign}=crypto;
const root=path.resolve(__dirname,'..');
const version=require(path.join(root,'package.json')).version;
const folder=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'dist','win-unpacked');
const archive=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'dist','EMS-COMMAND-App-'+version+'-win-x64.zip');
function fileHash(p){const h=createHash('sha256');const fd=fs.openSync(p,'r');const buf=Buffer.alloc(1024*1024);try{let len;while((len=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,len));}finally{fs.closeSync(fd);}return h.digest('hex');}
function walk(directory,base=directory,result=[]){
 for(const d of fs.readdirSync(directory,{withFileTypes:true})){
  const full=path.join(directory,d.name);
  if(d.isSymbolicLink()||(!d.isFile()&&!d.isDirectory()))throw Error('Unsupported payload file: '+d.name);
  if(d.isDirectory())walk(full,base,result);
  else{const rel=safeRel(path.relative(base,full).split(path.sep).join('/'));const stat=fs.statSync(full);result.push({path:rel,size:stat.size,sha256:fileHash(full)});}
 }
 return result;
}
if(process.platform!=='win32')throw Error('Release ZIP assembly/signing must run on Windows');
if(!fs.existsSync(archive)||!fs.existsSync(folder))throw Error('Application payload archive/directory missing');
const key64=process.env.EMS_MANIFEST_SIGNING_KEY_PEM_B64;
const public64=process.env.EMS_LAUNCHER_PUBLIC_KEY_PEM_B64;
if(!key64||!public64)throw Error('Signing private/public key secrets required for signed release');
const privateKey=createPrivateKey(Buffer.from(key64,'base64').toString('utf8'));
const publicPem=Buffer.from(public64,'base64').toString('utf8');
const publicKey=createPublicKey(publicPem);
if(privateKey.asymmetricKeyType!=='ed25519'||publicKey.asymmetricKeyType!=='ed25519')throw Error('Ed25519 keys required');
const sourcePub=createPublicKey(privateKey).export({type:'spki',format:'pem'});
if(sourcePub.trim()!==publicPem.trim())throw Error('Signing/public key mismatch');
const stat=fs.statSync(archive);
const manifest={
 schema:1,version,platform:'win32-x64',
 url:'https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/download/v'+version+'/EMS-COMMAND-App-'+version+'-win-x64.zip',
 size:stat.size,sha256:fileHash(archive),entry:'EMS COMMAND.exe',
 files:walk(folder).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)
};
validManifest(manifest);
const signature=sign(null,Buffer.from(JSON.stringify(manifest),'utf8'),privateKey).toString('base64');
const envelope={manifest,signature};
const output=path.join(path.dirname(archive),'ems-manifest.json');
fs.writeFileSync(output,JSON.stringify(envelope,null,2));
const trust={schema:1,manifestUrl:'https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/ems-manifest.json',publicKeyPem:publicPem};
fs.writeFileSync(path.join(__dirname,'trust.json'),JSON.stringify(trust,null,2));
console.log('Signed release:',version,'files:',manifest.files.length,'archive SHA256:',manifest.sha256,'manifest:',output);
