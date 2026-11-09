import test from 'node:test';
import assert from 'node:assert/strict';
import {renderUpdatePanel} from '../public/js/updater-ui.js';
test('renders all update states',()=>{for(const status of ['idle','checking','current','available','downloading','ready','error','dev','unconfigured'])assert.match(renderUpdatePanel({status,version:'3.2.0'}),/ems-update-hub/);});
test('progress is clamped and strings escaped',()=>{const html=renderUpdatePanel({status:'downloading',percent:125,message:'<img src=x onerror=alert(1)>',version:'<test>'});assert.match(html,/aria-valuenow="100"/);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/v&lt;test&gt;/);});
test('update installation only presented when ready',()=>{assert.doesNotMatch(renderUpdatePanel({status:'idle'}),/id="update-install"/);assert.match(renderUpdatePanel({status:'ready'}),/id="update-install"/);});
