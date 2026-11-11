'use strict';
// EMS COMMAND motion preferences live in Electron userData, not localhost localStorage.
// The local backend uses a random port on each launch, so localStorage is not durable.
const {readFileSync,writeFileSync,renameSync,mkdirSync,rmSync} = require('node:fs');
const {join} = require('node:path');
const MODES = Object.freeze(['system','on','off']);
function validMode(mode) { return typeof mode === 'string' && MODES.includes(mode); }
function preferencePath(dir) { return join(dir,'motion-preference.json'); }
function readMotionPreference(dir) {
  try {
    const data = JSON.parse(readFileSync(preferencePath(dir),'utf8'));
    return validMode(data?.mode) ? data.mode : 'system';
  } catch { return 'system'; }
}
function writeMotionPreference(dir,mode) {
  if (!validMode(mode)) throw new TypeError('Invalid motion mode');
  mkdirSync(dir,{recursive:true});
  const target = preferencePath(dir);
  const temp = target + '.tmp';
  try {
    writeFileSync(temp,JSON.stringify({mode})+'\n',{encoding:'utf8',mode:0o600});
    renameSync(temp,target);
  } catch (err) {
    try { rmSync(temp,{force:true}); } catch {}
    throw err;
  }
  return mode;
}
function isTrustedMotionSender(event,mainWebContents,activePort) {
  if (!event || !mainWebContents || !Number.isInteger(activePort) || activePort < 1 ||
      event.sender !== mainWebContents || event.senderFrame !== mainWebContents.mainFrame) return false;
  try {
    const url = new URL(event.senderFrame.url);
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
      url.port === String(activePort) && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}
module.exports={validMode,readMotionPreference,writeMotionPreference,isTrustedMotionSender};
