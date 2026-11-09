#!/usr/bin/env node
'use strict';
// Run on the maintainer's own Windows computer, never in CI.
// Generates one persistent Ed25519 signing identity outside the source tree,
// encrypts the secret transport in GitHub CLI and preserves an offline backup.
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const repo='Summuryy/EMS-COMMAND';
const releaseRepo='Summuryy/EMS-COMMAND-RELEASES';
const keyDir=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'EMS-COMMAND-SIGNING');
const privatePath=path.join(keyDir,'ed25519-release-private.pem');
const publicPath=path.join(keyDir,'ed25519-release-public.pem');
function gh(args,input){
  const r=cp.spawnSync('gh',args,{encoding:'utf8',input,windowsHide:true,stdio:['pipe','pipe','pipe']});
  if(r.error)throw Error('GitHub CLI is not available: '+r.error.message);
  if(r.status!==0)throw Error('GitHub CLI request failed ('+args.slice(0,3).join(' ')+'): '+(r.stderr||r.stdout).slice(0,400));
  return r.stdout.trim();
}
function main(){
  if(process.platform!=='win32')throw Error('This signing setup script is intended for the maintainer\'s Windows computer.');
  gh(['auth','status']);
  const info=JSON.parse(gh(['repo','view',releaseRepo,'--json','isPrivate,nameWithOwner']));
  if(info.isPrivate||info.nameWithOwner!==releaseRepo)throw Error('Release repo must be the expected public binary-only repository.');
  fs.mkdirSync(keyDir,{recursive:true});
  const privateExists=fs.existsSync(privatePath),publicExists=fs.existsSync(publicPath);
  if(privateExists!==publicExists)throw Error('Only one key file exists. Restore the matching private/public key pair from the offline backup.');
  if(!privateExists){
    const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519');
    const privatePem=privateKey.export({type:'pkcs8',format:'pem'});
    const publicPem=publicKey.export({type:'spki',format:'pem'});
    // New files must never be overwritten by re-running the setup.
    fs.writeFileSync(privatePath,privatePem,{flag:'wx',mode:0o600});
    fs.writeFileSync(publicPath,publicPem,{flag:'wx',mode:0o644});
    console.log('A new Ed25519 key pair was generated.');
  }else console.log('Existing Ed25519 release keys found; reusing them.');
  const privatePem=fs.readFileSync(privatePath,'utf8'),publicPem=fs.readFileSync(publicPath,'utf8');
  const priv=crypto.createPrivateKey(privatePem),pub=crypto.createPublicKey(publicPem);
  if(priv.asymmetricKeyType!=='ed25519'||pub.asymmetricKeyType!=='ed25519')throw Error('Invalid key type.');
  const canonical=crypto.createPublicKey(priv).export({type:'spki',format:'pem'});
  if(canonical.trim()!==publicPem.trim())throw Error('Private/public keys do not match.');
  const sig=crypto.sign(null,Buffer.from('EMS-COMMAND-key-check'),priv);
  if(!crypto.verify(null,Buffer.from('EMS-COMMAND-key-check'),pub,sig))throw Error('Key self-test failed.');
  const fingerprint=crypto.createHash('sha256').update(pub.export({type:'spki',format:'der'})).digest('hex');
  console.log('Verification key fingerprint SHA-256: '+fingerprint);
  console.log('Keep the private PEM backed up securely outside the GitHub repository.');
  if(!process.argv.includes('--upload')){
    console.log('No credentials were uploaded. Re-run with --upload after confirming the private-key backup and production environment.');
    return;
  }
  // GitHub CLI reads the secret through stdin; it is not exposed in command-line arguments.
  gh(['secret','set','EMS_MANIFEST_SIGNING_KEY_PEM_B64','--repo',repo,'--env','production'],
    Buffer.from(privatePem,'utf8').toString('base64'));
  gh(['variable','set','EMS_LAUNCHER_PUBLIC_KEY_PEM_B64','--repo',repo,'--env','production'],
    Buffer.from(publicPem,'utf8').toString('base64'));
  console.log('Ed25519 secret and public verification variable uploaded to GitHub Actions production environment.');
  console.log('Next: set EMS_RELEASES_TOKEN in the same environment, and protect production with required reviewers.');
}
try{main();}catch(err){console.error('Signing setup failed: '+err.message);process.exitCode=1;}
