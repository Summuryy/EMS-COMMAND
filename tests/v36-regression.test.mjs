import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const read=p=>readFileSync(join(root,p),'utf8');
test('v3.6 update panel has separate check, download and install actions',()=>{
 const ui=read('public/js/updater-ui.js');
 for(const id of ['update-check','update-download','update-install'])assert.ok(ui.includes(id),id);
});
test('update IPC must validate top-level application window and origin',()=>{
 const updates=read('desktop/updates.cjs');
 const main=read('desktop/main.cjs');
 assert.match(updates,/senderFrame===e\.sender\.mainFrame/);
 assert.match(updates,/isTrustedSender\(e\.senderFrame\.url\)/);
 assert.match(main,/parsed\.hostname==='127\.0\.0\.1'/);
});
test('automatic downloads are disabled before user confirmation',()=>{
 const updates=read('desktop/updates.cjs');
 assert.match(updates,/autoDownload=false/);
 assert.match(updates,/status!=='available'/);
 assert.match(updates,/status!=='ready'/);
});
test('cinematic motion retains reduced-motion option and stateful navigation',()=>{
 const css=read('public/styles/v3/cinematic36.css');
 const html=read('public/index.html');
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/html\[data-motion=off\]/);
 assert.match(html,/cinematic36\.css/);
 const app=read('public/js/app.js');
 for(const view of ['renderHome','renderEvidence','renderShift','renderCareer','renderAcademy','renderProfile','renderPro','renderAdmin'])assert.ok(app.includes(view),view);
});
