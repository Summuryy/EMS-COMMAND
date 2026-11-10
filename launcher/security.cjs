'use strict';
const crypto=require('node:crypto');
const path=require('node:path');
const REPO='https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/download/';
const VERSION=/^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/;
const HEX=/^[a-f0-9]{64}$/;
const MAX_FILES=12000,MAX_UNPACKED=3*1024**3,MAX_ARCHIVE=2*1024**3;
function safeVersion(v){if(typeof v!=='string'||!VERSION.test(v)||v.length>80)throw Error('Invalid release version');return v;}
function safeRel(p){
 if(typeof p!=='string'||p.length>600||p.startsWith('/')||p.includes('\\')||p.includes(':')||p.includes('\0'))throw Error('Invalid file path');
 const items=p.split('/');
 if(!items.length||items.some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)||/[<>|"*?\x00-\x1f]/.test(x)||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(x)))throw Error('Unsafe Windows file path');
 return items.join('/');
}
function validManifest(m){
 if(!m||typeof m!=='object'||Array.isArray(m)||m.schema!==1||m.platform!=='win32-x64')throw Error('Unsupported manifest');
 const version=safeVersion(m.version);
 const expected=REPO+'v'+version+'/EMS-COMMAND-App-'+version+'-win-x64.zip';
 if(m.url!==expected)throw Error('Archive URL does not match official release repository/version');
 if(!Number.isSafeInteger(m.size)||m.size<=0||m.size>MAX_ARCHIVE||typeof m.sha256!=='string'||!HEX.test(m.sha256))throw Error('Invalid archive digest/size');
 if(m.entry!=='EMS COMMAND.exe')throw Error('Unexpected application executable');
 if(!Array.isArray(m.files)||m.files.length<1||m.files.length>MAX_FILES)throw Error('Invalid file inventory');
 const paths=new Set();let total=0;
 for(const f of m.files){
   const p=safeRel(f.path),key=p.toLowerCase();
   if(paths.has(key))throw Error('Duplicate file path');paths.add(key);
   if(!HEX.test(f.sha256)||!Number.isSafeInteger(f.size)||f.size<0)throw Error('Invalid file digest');
   total+=f.size;
   if(total>MAX_UNPACKED)throw Error('Archive contents exceed maximum size');
 }
 if(!paths.has(m.entry.toLowerCase()))throw Error('Missing executable in inventory');
 return m;
}
function verifyEnvelope(envelope,publicKeyPem){
 if(!publicKeyPem||!String(publicKeyPem).includes('BEGIN PUBLIC KEY'))throw Error('No pinned release verification key is configured');
 if(!envelope||typeof envelope!=='object'||!envelope.manifest||typeof envelope.signature!=='string'||!/^[a-zA-Z0-9+/]+=*$/.test(envelope.signature))throw Error('Malformed signed release manifest');
 const signature=Buffer.from(envelope.signature,'base64');
 if(signature.length!==64)throw Error('Invalid Ed25519 signature length');
 const bytes=Buffer.from(JSON.stringify(envelope.manifest),'utf8');
 const key=crypto.createPublicKey(publicKeyPem);
 if(key.asymmetricKeyType!=='ed25519'||!crypto.verify(null,bytes,key,signature))throw Error('Release signature verification failed');
 return validManifest(envelope.manifest);
}
function digest(data){return crypto.createHash('sha256').update(data).digest('hex');}
function installedDir(base,version){return path.join(base,'versions',safeVersion(version));}
function validRedirect(url){
 const u=new URL(url);
 return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&
 ['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname);
}
module.exports={safeVersion,safeRel,validManifest,verifyEnvelope,digest,installedDir,validRedirect,REPO,MAX_ARCHIVE,MAX_UNPACKED};
