import {icon} from '../icons.js';
import {esc} from '../util.js';

// Shared visual primitives. All information is supplied by actual application state.
// Three seamlessly repeated ECG cycles. Clip the SVG viewport, never the moving group.
export const ecg=(id='ecg',compact=false)=>{const beat='M0 25H38L45 24L51 27L58 25H77L87 33L96 7L105 43L114 17L123 25H240';return `<svg class="ecg ems-ecg-live ${compact?'ecg-compact':''}" aria-hidden="true" viewBox="0 0 240 46" preserveAspectRatio="none"><defs><linearGradient id="${id}-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff667b"/><stop offset=".55" stop-color="#ffd2da"/><stop offset="1" stop-color="#ff667b"/></linearGradient></defs><path class="ecg-guide" d="M0 25H240"/><g class="ems-ecg-moving"><path class="ems-ecg-line" stroke="url(#${id}-gradient)" d="${beat}"/><path class="ems-ecg-line" stroke="url(#${id}-gradient)" transform="translate(240 0)" d="${beat}"/><path class="ems-ecg-line" stroke="url(#${id}-gradient)" transform="translate(480 0)" d="${beat}"/></g><circle class="ems-ecg-sensor" cx="96" cy="25" r="2.8"/></svg>`;};
export const eyebrow=(index,label)=>`<div class="v3-eyebrow"><span class="eyebrow-index">${esc(index)}</span><span>${esc(label)}</span><span class="eyebrow-line"></span></div>`;
export const sectionTitle=(num,title,detail='')=>`<div class="v3-section-title"><div><span class="section-index">${esc(num)}</span><h2>${esc(title)}</h2>${detail?`<p>${esc(detail)}</p>`:''}</div><span class="section-rule"></span></div>`;
export const pageIntro=(num,kicker,title,desc,extra='')=>`<header class="v3-intro">${eyebrow(num,kicker)}<div class="intro-line"><div><h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:''}</div>${extra}</div></header>`;
export const signal=(label,detail,tone='neutral')=>`<div class="v3-inline-signal ${tone}"><span class="v3-beacon"></span><div><strong>${esc(label)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div></div>`;
export const ring=(pct,label='')=>{const value=Math.min(100,Math.max(0,Number(pct)||0));return `<div class="v3-progress-ring" role="img" aria-label="${esc(label||'Прогресс')}: ${Math.round(value)}%" style="--ring:${value}"><div class="ring-content"><strong>${Math.round(value)}<small>%</small></strong></div></div>`;};
export const infoChip=(ic,label)=>`<span class="v3-info-chip">${icon(ic,14)} ${esc(label)}</span>`;
