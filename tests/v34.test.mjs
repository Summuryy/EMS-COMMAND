import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ecg} from '../public/js/views/visual.js';
const motion=readFileSync(new URL('../public/styles/v3/motion.css',import.meta.url),'utf8');
const updater=readFileSync(new URL('../desktop/updates.cjs',import.meta.url),'utf8');
test('ECG repeats three seamless beats and does not move the clipping region',()=>{const svg=ecg('check');assert.equal((svg.match(/class="ems-ecg-line"/g)||[]).length,3);assert.doesNotMatch(svg,/clip-path=/);assert.ok(motion.includes('translateX(-33.333333%)'), 'ECG animation must scroll by exactly one repeated segment');});
test('update service requires HTTPS and prevents silent install',()=>{assert.match(updater,/function isTrustedFeed/);assert.match(updater,/autoDownload=false/);assert.match(updater,/autoInstallOnAppQuit=false/);});
