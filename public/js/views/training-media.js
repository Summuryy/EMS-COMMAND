import {esc} from '../util.js';

// Safe, curated illustrations derived from owner-provided RP screenshots.
// Their binary WebP companions MUST be installed under public/assets/training/.
// Never fall back to a third-party host or expose raw Discord/profile screenshots.
export const trainingMediaByCourse={
 '01':[
  {step:0,file:'interview-204',caption:'Кабинет 204 — педиатр, место собеседования'},
  {step:0,file:'interview-205',caption:'Кабинет 205 — кардиолог, место собеседования'},
  {step:3,file:'gov-map',caption:'Где находится Правительство на карте'},
  {step:3,file:'gov-entrance',caption:'Главный вход в Правительство'},
  {step:3,file:'gov-security',caption:'Проход через рамки'},
  {step:3,file:'gov-office',caption:'Кабинет оформления документов'},
  {step:3,file:'gov-npc',caption:'NPC Мария Смирнова'},
  {step:3,file:'gov-dialogue',caption:'Открыть раздел «Получение документов»'},
  {step:3,file:'gov-credential',caption:'Выбрать удостоверение фракции'}
 ],
 '02':[
  {step:1,file:'instruct-slides',caption:'В презентации нажать «Слайд-шоу»'}
 ],
 '03':[
  {step:0,file:'pills-sklif',caption:'Склифосовского — зона выдачи у стойки регистратуры'},
  {step:0,file:'pills-vorok',caption:'ГКБ №67 им. Ворохобова — зона выдачи у стойки регистратуры'},
  {step:1,file:'pills-kits',caption:'Быстрые наборы: парацетамол'},
  {step:2,file:'pills-action',caption:'Меню G → Фракционное → Продать таблетку / Вылечить игрока'}
 ],
 '04':[
  {step:0,file:'pmp-kits',caption:'Быстрые наборы: дефибриллятор и эпинефрины'},
  {step:2,file:'pmp-parking',caption:'Маркер вызова АСМП на парковке'},
  {step:2,file:'pmp-transport',caption:'Планшет: доставка автомобиля'},
  {step:3,file:'pmp-tablet',caption:'Меню больницы в планшете'},
  {step:3,file:'pmp-call-section',caption:'Пункт «Вызовы»'},
  {step:3,file:'pmp-ambulance',caption:'АСМП возле больницы'},
  {step:4,file:'pmp-siren-menu',caption:'G → Открыть СГУ'},
  {step:4,file:'pmp-siren',caption:'Пульт управления спецсигналами'},
  {step:5,file:'pmp-interact',caption:'G → Реанимировать'},
  {step:5,file:'pmp-minigame',caption:'Мини-игра: остановить индикатор в зелёной зоне'}
 ],
 '05':[{step:0,file:'gov-credential',caption:'Получение удостоверения в Правительстве'},
       {step:1,file:'instruct-slides',caption:'Прохождение инструктажа'}],
 '06':[{step:0,file:'pmp-interact',caption:'ПМП — выполнение реанимации'},
       {step:1,file:'pills-sklif',caption:'Таблетки выдаются возле регистратуры'}],
 '07':[{step:1,file:'instruct-slides',caption:'Материалы для инструктажа под куратором'}],
 '08':[{step:0,file:'interview-204',caption:'Кабинет 204 — педиатр'},
       {step:0,file:'interview-205',caption:'Кабинет 205 — кардиолог'}],
 '09':[{step:4,file:'review-promotion',caption:'Повышение в планшете: причина «Согласно К.А.»'}],
 '10':[{step:2,file:'interview-205',caption:'Собеседования проходят на втором этаже'}],
 '11':[{step:1,file:'pmp-interact',caption:'Реанимация — действие, которое требуется подтвердить скриншотом'},
       {step:1,file:'pills-action',caption:'Выдача таблетки — отдельный вид доказательства'}],
 '12':[]
};
const safeFile=/^[a-z][a-z0-9-]*$/;
export function mediaForLesson(lesson){
 const key=String(lesson?.title||'').slice(0,2);
 return (trainingMediaByCourse[key]||[]).filter(item=>safeFile.test(item.file)&&Number.isInteger(item.step)&&item.step>=0);
}
// Each learning step shows one large, legible image; the other images
// are selected from compact thumbnails rather than stacking huge cards.
export function renderTrainingStepMedia(lesson,step){
 const images=mediaForLesson(lesson).filter(item=>item.step===step);
 if(!images.length)return '';
 const first=images[0],firstSrc='/assets/training/'+first.file+'.webp';
 let out='<div class="ems-training-gallery" data-academy-gallery>';
 out+='<button type="button" class="ems-training-shot ems-training-focus" data-academy-open="'+esc(firstSrc)+'" data-academy-caption="'+esc(first.caption)+'" aria-label="Увеличить скриншот: '+esc(first.caption)+'"><img class="ems-training-image" src="'+esc(firstSrc)+'" alt="'+esc(first.caption)+'" loading="lazy" decoding="async"><span class="ems-training-caption">'+esc(first.caption)+'</span><span class="ems-training-zoom">Увеличить ↗</span></button>';
 if(images.length>1){
  out+='<div class="ems-training-thumbnails" role="group" aria-label="Другие скриншоты к этому шагу">';
  out+=images.map((item,i)=>{const src='/assets/training/'+item.file+'.webp';return '<button type="button" class="ems-training-thumb'+(i===0?' is-active':'')+'" data-academy-thumbnail="'+esc(src)+'" data-academy-caption="'+esc(item.caption)+'" aria-label="Показать: '+esc(item.caption)+'" aria-pressed="'+(i===0?'true':'false')+'"><img src="'+esc(src)+'" alt="" loading="lazy" decoding="async"><span>'+(i+1)+'</span></button>';}).join('');
  out+='</div><p class="ems-training-gallery-help">Выберите миниатюру или нажмите на большой кадр для увеличения.</p>';
 }
 return out+'</div>';
}
