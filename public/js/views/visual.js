import {icon} from '../icons.js';
import {esc} from '../util.js';

// Shared visual primitives. All information is supplied by actual application state.
// The monitor is illustrative, never patient telemetry: a repeating 72-bpm
// P-QRS-T pattern (three beats per 2.5-second cycle) with a traveling scan.
export const ecg=(id='ecg',compact=false)=>{
 const beat='M0 27 L10 27 Q14 27 17 24 Q21 21 25 27 L31 27 L35 32 L40 6 L44 44 L48 20 L52 27 L57 27 Q64 18 69 22 Q74 27 80 27';
 const paths=Array.from({length:9},(_,i)=>'<path class="ems-ecg-line" stroke="url(#'+id+'-gradient)" transform="translate('+(i*80)+' 0)" d="'+beat+'"/>').join('');
 return '<svg class="ecg ems-ecg-live '+(compact?'ecg-compact':'')+'" aria-hidden="true" viewBox="0 0 240 46" preserveAspectRatio="none">'+
  '<defs><linearGradient id="'+id+'-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7189"/><stop offset=".55" stop-color="#ffd6de"/><stop offset="1" stop-color="#ff7189"/></linearGradient>'+
  '<linearGradient id="'+id+'-scan"><stop offset="0" stop-color="#ff8ca000"/><stop offset=".65" stop-color="#ffd3df30"/><stop offset="1" stop-color="#fff4f780"/></linearGradient>'+
  '<pattern id="'+id+'-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#fa839f25" stroke-width=".6"/></pattern></defs>'+
  '<rect class="ems392-ecg-grid" x="0" y="0" width="240" height="46" fill="url(#'+id+'-grid)"/>'+
  '<path class="ecg-guide" d="M0 27H240"/><g class="ems-ecg-moving">'+paths+'</g>'+
  '<rect class="ems392-ecg-scan" x="0" y="0" width="7" height="46" fill="url(#'+id+'-scan)"/></svg>';
};
export const eyebrow=(index,label)=>`<div class="v3-eyebrow"><span class="eyebrow-index">${esc(index)}</span><span>${esc(label)}</span><span class="eyebrow-line"></span></div>`;
export const sectionTitle=(num,title,detail='')=>`<div class="v3-section-title"><div><span class="section-index">${esc(num)}</span><h2>${esc(title)}</h2>${detail?`<p>${esc(detail)}</p>`:''}</div><span class="section-rule"></span></div>`;
export const pageIntro=(num,kicker,title,desc,extra='')=>`<header class="v3-intro">${eyebrow(num,kicker)}<div class="intro-line"><div><h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:''}</div>${extra}</div></header>`;
export const signal=(label,detail,tone='neutral')=>`<div class="v3-inline-signal ${tone}"><span class="v3-beacon"></span><div><strong>${esc(label)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div></div>`;
export const ring=(pct,label='')=>{const value=Math.min(100,Math.max(0,Number(pct)||0));return `<div class="v3-progress-ring" role="img" aria-label="${esc(label||'Прогресс')}: ${Math.round(value)}%" style="--ring:${value}"><div class="ring-content"><strong>${Math.round(value)}<small>%</small></strong></div></div>`;};
export const infoChip=(ic,label)=>`<span class="v3-info-chip">${icon(ic,14)} ${esc(label)}</span>`;
