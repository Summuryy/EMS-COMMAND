import test from 'node:test';
import assert from 'node:assert/strict';
import {renderUpdatePanel} from '../public/js/updater-ui.js';
test('renders all update states',()=>{for(const status of ['idle','checking','current','available','downloading','ready','error','dev','unconfigured'])assert.match(renderUpdatePanel({status,version:'3.2.0'}),/ems-update-hub/);});
test('progress is clamped and strings escaped',()=>{const html=renderUpdatePanel({status:'downloading',percent:125,message:'<img src=x onerror=alert(1)>',version:'<test>'});assert.match(html,/aria-valuenow="100"/);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/v&lt;test&gt;/);});
test('update installation only presented when ready',()=>{assert.doesNotMatch(renderUpdatePanel({status:'idle'}),/id="update-install"/);assert.match(renderUpdatePanel({status:'ready'}),/id="update-install"/);});

test('3.8.2 managed launcher update view avoids false readiness and inactive progress',()=>{
 const idle=renderUpdatePanel({status:'managed',version:'3.8.2'});
 assert.match(idle,/class="ems-update-hub ems382-update-hub"/);
 assert.match(idle,/data-update-status="managed"/);
 assert.match(idle,/ГОТОВ К ПРОВЕРКЕ/);
 assert.doesNotMatch(idle,/EMS READY/);
 assert.doesNotMatch(idle,/role="progressbar"/);
 assert.match(idle,/id="update-check"/);
 const found=renderUpdatePanel({status:'managed-available',version:'3.8.2',latestVersion:'3.8.3'});
 assert.match(found,/ДОСТУПНО/);
 assert.match(found,/v3.8.3/);
 assert.doesNotMatch(found,/id="update-install"/);
});
test('3.8.2 update progress is accessible only during genuine checking and download',()=>{
 const checking=renderUpdatePanel({status:'checking',version:'3.8.2'});
 assert.match(checking,/role="progressbar"/);
 assert.match(checking,/is-checking/);
 assert.doesNotMatch(checking,/aria-valuenow=/);
 const download=renderUpdatePanel({status:'downloading',version:'3.8.2',percent:43});
 assert.match(download,/aria-valuenow="43"/);
 const done=renderUpdatePanel({status:'current',version:'3.8.2'});
 assert.doesNotMatch(done,/role="progressbar"/);
 assert.match(done,/АКТУАЛЬНО/);
});
