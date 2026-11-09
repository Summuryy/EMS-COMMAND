import {icon} from '../icons.js';
import {esc,dateFmt,catName,statusName,stat,progress} from '../util.js';
export const startUpload=()=>`<button class="btn btn-primary" data-action="upload">${icon('plus',17)} Добавить скриншоты</button>`;
export const head=(eyebrow,title,desc,action='')=>`<header class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${desc?`<p class="sub">${esc(desc)}</p>`:''}</div>${action}</header>`;
export const statusBadge=(x)=>`<span class="badge ${esc(x)}">${statusName(x)}</span>`;
export const statCard=(title,value,ic,sub)=>`<div class="panel stat-card"><div class="stat-top"><span>${esc(title)}</span><div class="stat-icon">${icon(ic,17)}</div></div><div class="stat-value num">${stat(value)}</div><div class="stat-desc">${esc(sub)}</div></div>`;
export const empty=(title,desc,ic='file',action='')=>`<div class="empty">${icon(ic,27)}<strong>${esc(title)}</strong><p>${esc(desc)}</p>${action}</div>`;
export const logoArt=()=>`<div class="hero-art" aria-hidden="true"><div class="core-orbit"></div><div class="core-orbit"></div><div class="core-mark">${icon('medical',48)}</div><div class="wave"><svg viewBox="0 0 280 32"><polyline points="0,18 75,18 90,17 104,9 115,28 128,2 141,18 280,18"></polyline></svg></div></div>`;
export const hero=(label,title,desc,btnLabel,action='upload')=>`<section class="hero"><div class="hero-copy"><div class="hero-badge">${esc(label)}</div><h1>${esc(title)}</h1><p class="sub">${esc(desc)}</p><button class="btn btn-primary" data-action="${esc(action)}">${icon('plus',17)} ${esc(btnLabel)}</button></div>${logoArt()}</section>`;
export function evidenceRows(items,limit){
 const rows=(limit?items.slice(0,limit):items);
 if(!rows.length)return empty('Нет загруженных кадров','Загрузи оригинальные PNG или JPG — категория определится автоматически.','scan');
 return `<div class="evidence-list">${rows.map(item=>`<button class="evidence-row" style="width:100%;border-left:0;border-right:0;border-top:0;background:transparent;color:inherit;text-align:left;cursor:pointer" data-action="detail" data-id="${esc(item.id)}"><img class="thumb" loading="lazy" src="${esc(item.imageUrl)}" alt="Миниатюра"><div style="min-width:0"><span class="name" title="${esc(item.name)}">${esc(item.name)}</span><span class="desc">${esc(item.reason)}</span></div><span class="small muted ev-category">${esc(catName(item.category))}</span>${statusBadge(item.status)}<span class="ev-arrow" style="color:#73958e">${icon('arrow',16)}</span></button>`).join('')}</div>`;
}
export const userInitial=(u)=>esc((u?.displayName||'Э').slice(0,1).toUpperCase());
export const noticeRows=(items)=>items?.length?`<div class="list">${items.map(x=>`<div class="notice"><span class="stat-icon" style="flex-shrink:0">${icon(x.kind==='success'?'check':x.kind==='warning'?'warning':'bell',15)}</span><div style="min-width:0;flex:1"><strong>${esc(x.title)}</strong><p>${esc(x.message)}</p><span class="tiny muted">${dateFmt(x.created_at)}</span></div></div>`).join('')}</div>`:empty('Уведомлений нет','Новые события появятся здесь.','bell');
