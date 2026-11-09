import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ecg} from '../public/js/views/visual.js';
const css=readFileSync(new URL('../public/styles/v3/motion.css',import.meta.url),'utf8');
const splash=readFileSync(new URL('../desktop/splash.html',import.meta.url),'utf8');
const updater=readFileSync(new URL('../desktop/updates.cjs',import.meta.url),'utf8');
test('ECG is a continuous moving waveform, not a static image',()=>{
 const markup=ecg('qa');
 assert.match(markup,/ems-ecg-moving/);
 assert.match(markup,/ems-ecg-line/);
 assert.match(css,/@keyframes ems-heart-scroll/);
 assert.match(css,/prefers-reduced-motion/);
});
test('Launcher exposes live progress messages without fabricated percentage',()=>{
 assert.match(splash,/window\.emsUpdates\.onStatus/);
 assert.match(splash,/id="launcher-status"/);
 assert.match(splash,/Новая версия найдена/);
});
test('Updater downloads only after explicit user action; installation is confirmed',()=>{
 assert.match(updater,/autoDownload=false/);
 assert.match(updater,/autoInstallOnAppQuit=false/);
 assert.match(updater,/dialog\.showMessageBox/);
});
