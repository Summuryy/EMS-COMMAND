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
export function renderTrainingStepMedia(lesson,step){
 return mediaForLesson(lesson).filter(item=>item.step===step).map(item=>{
  const src='/assets/training/'+item.file+'.webp';
  return '<button type="button" class="ems-training-shot" data-academy-open="'+esc(src)+'" data-academy-caption="'+esc(item.caption)+'" aria-label="Увеличить скриншот: '+esc(item.caption)+'"><img class="ems-training-image" src="'+esc(src)+'" alt="'+esc(item.caption)+'" loading="lazy" decoding="async"><span>'+esc(item.caption)+'</span></button>';
 }).join('');
}
