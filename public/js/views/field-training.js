import {esc} from '../util.js';
import {renderTrainingStepMedia,mediaForLesson} from './training-media.js';
// Source: owner-supplied Discord materials, September-November 2026.
// This is a reference course, not automatic permission to approve or promote.
export const lessons = [
 {category:'Интернатура',title:'01 · Первый день и трудоустройство',steps:[
 'Собеседование по одному человеку во 2-м этаже Склифосовского: кабинеты 204 (педиатр) и 205 (кардиолог).',
 'Потребуются возраст 18+, паспорт, категория B, медсправки не старше 30 дней, отсутствие активных судимостей и спецсвязь Discord.',
 'После собеседования сменить ник Discord на ИН | Имя Фамилия | Статик; ОМП заполняет /принятие в К.А., затем контракт и отдел Интерн.',
 'В Правительстве через главный вход и рамки найти Марию Смирнову → E → Получение документов → Мне нужно получить удостоверение → Да.',
 'Подать заявку на инструктаж. Удостоверение, инструктаж и тест — разные обязательные этапы.'
 ]},
 {category:'Интернатура',title:'02 · Инструктаж и тест 1 → 2',steps:[
 'Оставить заявку в Discord; ОМП ставит ⏱️, приглашает в голосовой канал и запускает демонстрацию презентации.',
 'Лектор объясняет работу больницы, повышение, отчётность, показывает необходимые каналы, отвечает на вопросы.',
 'Длительность не менее 5 минут, скриншоты начала и конца с участниками, трансляцией и временем.',
 'Изучить устав и пройти тест Знакомство с работой в больнице.',
 'Отчёт 1 → 2: вручную имя, Static, удостоверение, ссылка на инструктаж, тест и в конце @Отдел медицинской подготовки.'
 ],links:[['Презентация','https://docs.google.com/presentation/d/1z9-82j3kgKC7aCIpJORhvNjODHp7R_ISvJjQou8l9I0/edit'],['Устав','https://forum.russia.online/threads/ustav.5293/']]},
 {category:'Практика',title:'03 · Таблетки: разрешённые зоны и доказательства',steps:[
 'Выдавать таблетки только у окна регистратуры в Склифосовского и в главном холле ГКБ №67.',
 'Парацетамол брать в Быстрых наборах, максимум 48 шт. при себе.',
 'Через G → Фракционное выбрать Продать таблетку или Вылечить игрока (госслужащего с удостоверением).',
 'Снимать весь экран с видимой плашкой Вы вылечили…, включённой боди-камерой, формой и местом.',
 '1 скриншот = 1 таблетка, даже если плашек несколько. Фото монитора и обрезанный кадр недопустимы.',
 'Сохранять кадры только после последнего повышения, в отдельной папке Таблетки.'
 ]},
 {category:'Практика',title:'04 · ПМП: подготовка и реанимация',steps:[
 'Доступно с 3-го ранга. Дефибриллятор обязателен: 1 шт. раз в 40 минут; эпинефрины — 20 шт. раз в 5 минут.',
 'Препараты только в инвентаре или рюкзаке, не в багажнике или бардачке АСМП.',
 'АСМП: задняя парковка → E либо планшет → Больница → Доставка транспорта.',
 'Планшет → Больница → Вызовы, принять вызов или включить В патруле; оповещение принимается Y.',
 'СГУ: G → Открыть СГУ → Power либо Alt+G; режимы Alt+1/2/3.',
 'Возле пациента G → Реанимировать; пройти мини-игру, сохранить полный скрин с Вы реанимировали…',
 'Отменять ложные/перехваченные вызовы и опасные ситуации; на ПМП запрещены таблетки, вакцинации, справки, перевозка граждан вне госпитализации.'
 ]},
 {category:'Карьера',title:'05 · Повышение интернатуры 1 → 3',steps:[
 '1 → 2: удостоверение, инструктаж ОМП, устав, тест и отчёт.',
 '2 → 3: 30 таблеток в Склифосовского, 20 в ГКБ №67, обучение и тест ПМП, 10 ПМП с сотрудником ОМП или 8+.',
 'Для 2 → 3 приложить скрин последнего повышения из планшета.',
 'Правило 11.6: учитываются только скриншоты, сделанные после последнего повышения.',
 'Полностью скопировать закреплённую форму, написать имя и Static вручную, не редактировать отправленный отчёт.',
 'В конце обязательно @Отдел медицинской подготовки. Допустимые хосты: Яндекс Диск, Imgur, Yapx, Google Drive, Fotora.'
 ],links:[['Тест ПМП','https://onlinetestpad.com/ozudtn3cbl5yi']]},
 {category:'Карьера',title:'06 · ОПП: нормативы 3 → 9',steps:[
 '3 → 4: 40 ПМП, канал Госфракций, подтверждение последнего повышения.',
 '4 → 5: 60 ПМП, 100 таблеток, два дежурства по часу, квалификация вакцинации.',
 '5 → 6: 75 ПМП, 150 таблеток, 10 вакцинаций, по часу в двух больницах.',
 '6 → 7: 90 ПМП, 200 таблеток, 15 вакцинаций, 1 час в основной и 2 часа в нижней больнице.',
 '7 → 8: 105 ПМП, 250 таблеток, 20 вакцинаций, по 2 часа в обеих больницах.',
 '8 → 9: 120 ПМП, 300 таблеток, 25 вакцинаций, по 2 часа дежурства, квалификации хирургии и медкарт.',
 'Для повышения ОПП минимум 80% ПМП вне территории больницы. Только новые кадры с боди-камерой.'
 ]},
 {category:'ОМП',title:'07 · Стажировка ОМП и нормативы',steps:[
 'Стажёры не могут самостоятельно проводить собеседования, инструктажи и проверки отчётов.',
 'Под куратором провести собеседование, инструктаж куратору, проверить отчёт и заполнить К.А.',
 '5 → 6: 7 собеседований, 7 инструктажей, 20 ПМП с интерном, 10 проверок отчётов.',
 '6 → 7: 10 собеседований, 10 инструктажей, 20 ПМП с интерном, 10 проверок.',
 '7 → 8: 13 собеседований, 13 инструктажей, 20 ПМП с интерном, 10 проверок.',
 '8 → 9: 15 собеседований, 15 инструктажей, 30 ПМП с интерном, 10 проверок + Хирург и Выдача мед. карт.',
 'На скриншотах ПМП должен быть виден интерн; собеседования подтверждаются К.А.; проверки могут быть одобрены или отклонены.'
 ]},
 {category:'ОМП',title:'08 · Собеседование и оформление интерна',steps:[
 'На втором этаже в кабинетах 204/205 представиться и задать вопросы о мотивации, опыте, судимостях и Discord.',
 'Проверить F2 → Персонаж → Статистика, паспорт, RP-имя, права B, медсправки 30 дней, служебный внешний вид.',
 'Проверить RP-логику на примере часов, действия за спиной и минимум двух аббревиатур; две ошибки допускают отказ.',
 'Успешного кандидата пригласить в Discord, ник ИН | Имя Фамилия | Статик, /принятие (ранг 1; Собеседование).',
 'Выдать контракт через G → Фракционное → Пригласить во фракцию либо запросить старших по /f.',
 'Назначить через планшет отдел Интерн с причиной Трудоустройство. Самостоятельное назначение возможно с 9 ранга.'
 ]},
 {category:'ОМП',title:'09 · Проверка отчёта и кадровый аудит',steps:[
 'Полученный отчёт отметить ⏱️. Проверить форму, ручные имя/Static, ссылки только на допустимые хосты.',
 'Сопоставить количество и даты кадров, места таблеток, плашки реанимации, сопровождение ПМП и боди-камеру.',
 'При действующем взыскании не повышать. Если сегодня уже повысили — ждать 00:00 следующего дня.',
 'Отклонение: проверить всё, создать ветку со всеми ошибками, поставить ❌ и убрать ⏱️.',
 'Одобрение: ✅, убрать ⏱️, /повышение в К.А. со ссылкой на отчёт.',
 'В игре: планшет → Больница → Коллеги → Повысить; причина Согласно К.А. Без прав — заявка старшему составу.'
 ]},
 {category:'ОМП',title:'10 · Госволна о наборе',steps:[
 'Уточнить время начала и конца собеседования; вместо 00:00 указать своё.',
 'Выдержать 15 минут между госволнами, в том числе волнами других фракций, по присланной памятке.',
 'В тексте сообщить Склифосовского, 2-й этаж, возраст 18+, действующие справки и категорию B.',
 'Для согласования допустимо /report Здравствуйте. Одобрите пожалуйста гос.волну Больницы.',
 'После публикации сделать скриншот и отправить в отчётный Discord-канал.'
 ]},
 {category:'Доказательства',title:'11 · Боди-камера, скриншоты и архив',steps:[
 'Боди-камера должна быть включена, на полном экране виден красный индикатор записи.',
 'Таблетка подтверждается плашкой Вы вылечили… и местом у окна; ПМП — Вы реанимировали…',
 'Не засчитывать старые, обрезанные, смешанные по категориям и сделанные не в форме кадры.',
 'Разделять архивы Таблетки, ПМП, Вакцины, Дежурства и Квалификации.',
 'Окончательное решение принимает сотрудник, не автоматическая проверка.'
 ]},
 {category:'Практика',title:'12 · Вакцинация, медкарты и хирургия RP',steps:[
 'Проверять игровую квалификацию и место процедуры; включать боди-камеру.',
 'Для вакцинации выяснить симптомы и применить игровой сценарий; госслужащему по удостоверению бесплатно, остальным по актуальному тарифу.',
 'Для медицинских справок проверять паспорт и предыдущие документы; задавать вопросы о физическом и психическом состоянии.',
 'Для хирургических RP-сценариев нужны квалификация, согласие и отчёт; не смешивать их прейскурант с обычными справками.',
 'Все процедуры являются игровыми RP-механиками, не руководством к реальной медпомощи.'
 ]}
];
// Compact course catalog + single visible learning stage.
// Legacy ems-field-lessons keys remain unchanged across 3.11 -> 3.12.
const categories=['Интернатура','Практика','Карьера','ОМП','Доказательства'];
const courseId=lesson=>String(lesson.title).slice(0,2);
const countFinished=(lesson,done)=>lesson.steps.filter((_,step)=>done[lesson.title+':'+step]).length;
const stepTips={
 '01':{3:'Удостоверение получают в Правительстве. Это отдельное требование — оно не заменяет инструктаж ОМП.'},
 '02':{2:'Для отчётности нужны два скриншота из Discord: начало и конец инструктажа с временем, участниками и демонстрацией.'},
 '03':{3:'Плашка о лечении, форма, красный индикатор боди-камеры и место выдачи должны попадать в полный кадр.'},
 '04':{0:'На выезд без дефибриллятора нельзя. Запас медикаментов хранится только в инвентаре или рюкзаке.',5:'Нужен полный скриншот с игровой плашкой «Вы реанимировали…».'},
 '05':{4:'Отчёт после отправки не редактируют. При отклонении создают новый по полной форме.'},
 '06':{6:'Для отчёта на повышение ОПП минимум 80% ПМП должны быть выполнены вне больницы.'},
 '07':{0:'До завершения стажировки самостоятельная проверка отчётов и собеседования запрещены.'},
 '09':{2:'Наличие действующего дисциплинарного взыскания блокирует повышение.'},
 '11':{0:'Фото с выключенной боди-камерой не засчитывается.'}
};
export function renderFieldTraining(user,persisted=null){
 const profile=String((user&&user.id)||'local');
 let done={};let last={};
 if(persisted){
  done=persisted.progress||{};
  last=persisted.bookmark||{};
 }else{
  try{done=JSON.parse(globalThis.localStorage?.getItem('ems-field-lessons:'+profile)||'{}')||{}}catch{}
  try{last=JSON.parse(globalThis.localStorage?.getItem('ems-academy-workspace:'+profile)||'{}')||{}}catch{}
 }
 const valid=lessons.some(l=>courseId(l)===last.course);
 const currentCourse=valid?last.course:courseId(lessons[0]);
 const currentLesson=lessons.find(l=>courseId(l)===currentCourse);
 const firstUnfinished=currentLesson.steps.findIndex((_,i)=>!done[currentLesson.title+':'+i]);
 const requestedStep=Number(last.step);
 const currentStep=valid&&Number.isInteger(requestedStep)&&requestedStep>=0&&requestedStep<currentLesson.steps.length?requestedStep:Math.max(0,firstUnfinished);
 const total=lessons.reduce((n,l)=>n+l.steps.length,0);
 const completed=lessons.reduce((n,l)=>n+countFinished(l,done),0);
 let out='<section class="ems-learning" aria-label="Академия EMS" data-academy-profile="'+esc(profile)+'" data-academy-current-course="'+esc(currentCourse)+'" data-academy-current-step="'+currentStep+'">';
 out+='<header class="ems-learning-head"><div class="v3-panel-kicker">EMS ACADEMY / ОБУЧЕНИЕ НА ПРАКТИКЕ</div><div class="ems-learning-head-grid"><div><h2>От первого дня до уверенной смены</h2><p>Выберите маршрут, изучайте по одному шагу и смотрите, куда нажимать в игре. Без длинных списков и смешивания инструкций.</p></div><div class="ems-learning-summary" aria-live="polite"><span>Ваш прогресс</span><strong><span data-academy-complete>'+completed+'</span> / '+total+'</strong><progress data-academy-global-progress max="'+total+'" value="'+completed+'"></progress></div></div></header>';
 out+='<p class="ems-learning-save-state" role="status" data-academy-save-status>'+ (persisted?'Прогресс сохраняется в вашем аккаунте EMS COMMAND.':'Локальный режим: прогресс может не сохраниться после перезапуска.')+'</p>';
 out+='<div class="ems-learning-layout"><aside class="ems-learning-index" aria-label="Выбор учебного маршрута"><div class="ems-learning-index-head"><h3>Маршруты</h3><p>'+lessons.length+' курсов · от интерна до ОМП</p><label for="ems-learning-search">Поиск по темам и шагам</label><input id="ems-learning-search" type="search" placeholder="Например: ПМП, таблетки, К.А." autocomplete="off"></div>';
 out+='<div class="ems-learning-filters" role="group" aria-label="Направление обучения"><button type="button" data-academy-filter="all" aria-pressed="true" class="is-active">Все</button>'+categories.map(cat=>'<button type="button" data-academy-filter="'+esc(cat)+'" aria-pressed="false">'+esc(cat)+'</button>').join('')+'</div>';
 out+='<p class="ems-learning-results" id="ems-learning-results" aria-live="polite">'+lessons.length+' курсов доступно</p><nav class="ems-learning-course-list" aria-label="Курсы Академии">';
 for(const cat of categories){
  out+='<div class="ems-learning-section" data-academy-section="'+esc(cat)+'"><h4 class="ems-learning-group">'+esc(cat)+'</h4>';
  for(const l of lessons.filter(x=>x.category===cat)){
   const id=courseId(l),finished=countFinished(l,done),active=id===currentCourse;
   out+='<button type="button" class="ems-learning-course-btn'+(active?' is-active':'')+'" data-academy-course="'+esc(id)+'" data-academy-category="'+esc(cat)+'" aria-current="'+(active?'true':'false')+'"><span class="ems-course-code">'+esc(id)+'</span><span class="ems-course-copy"><strong>'+esc(l.title.slice(5))+'</strong><small><span data-academy-count="'+esc(id)+'">'+finished+'</span> из '+l.steps.length+' шагов</small><progress data-academy-course-progress="'+esc(id)+'" value="'+finished+'" max="'+l.steps.length+'"></progress></span></button>';
  }
  out+='</div>';
 }
 out+='</nav><p class="ems-learning-empty" id="ems-learning-empty" hidden>Маршрут не найден. Попробуйте другое слово или раздел.</p></aside>';
 out+='<div class="ems-learning-workspace" aria-label="Текущий урок">';
 for(const l of lessons){
  const id=courseId(l),active=id===currentCourse,doneCount=countFinished(l,done),stepActive=active?currentStep:0;
  out+='<article class="ems-learning-card" data-academy-panel="'+esc(id)+'" '+(active?'':'hidden')+' aria-labelledby="ems-lesson-title-'+esc(id)+'">';
  out+='<header class="ems-lesson-header"><div class="ems-lesson-topline"><span>'+esc(l.category)+' / КУРС '+esc(id)+'</span><span class="ems-learning-completion">'+doneCount+'/'+l.steps.length+' выполнено</span></div><h3 id="ems-lesson-title-'+esc(id)+'" tabindex="-1">'+esc(l.title.slice(5))+'</h3><progress class="ems-lesson-progress" data-academy-reader-progress="'+esc(id)+'" value="'+doneCount+'" max="'+l.steps.length+'"></progress><p class="ems-lesson-subtitle">Двигайтесь шаг за шагом. Отметка выполнения — только личный чек-лист, не официальное подтверждение.</p></header>';
  out+='<div class="ems-lesson-step-navigation" role="group" aria-label="Выбрать шаг курса">'+l.steps.map((_,step)=>'<button type="button" data-academy-goto-step="'+step+'" class="'+(step===stepActive?'is-active':'')+(done[l.title+':'+step]?' is-complete':'')+'" aria-current="'+(step===stepActive?'step':'false')+'" aria-label="Шаг '+(step+1)+(done[l.title+':'+step]?' выполнен':'')+'">'+(step+1)+'</button>').join('')+'</div>';
  for(const [step,txt] of l.steps.entries()){
   const media=renderTrainingStepMedia(l,step,{active:active&&step===stepActive}),tip=stepTips[id]?.[step]||'';
   out+='<section class="ems-lesson-step" tabindex="-1" data-academy-step="'+step+'" '+(step===stepActive?'':'hidden')+' aria-label="Шаг '+(step+1)+' из '+l.steps.length+'"><div class="ems-lesson-step-kicker">ШАГ <span>'+(step+1)+'</span> ИЗ '+l.steps.length+'</div><div class="ems-lesson-stage'+(media?' has-media':'')+'"><div class="ems-lesson-instructions"><h4>Что нужно сделать</h4><p>'+esc(txt)+'</p>'+(tip?'<aside class="ems-lesson-tip"><strong>На что обратить внимание</strong><p>'+esc(tip)+'</p></aside>':'')+'<label class="ems-lesson-check"><input type="checkbox" data-learn-key="'+esc(l.title+':'+step)+'" '+(done[l.title+':'+step]?'checked':'')+'><span>Я выполнил этот шаг</span></label></div>'+(media?'<div class="ems-lesson-visual"><div class="ems-lesson-visual-label">ПОСМОТРЕТЬ В ИГРЕ</div>'+media+'</div>':'')+'</div></section>';
  }
  out+='<footer class="ems-lesson-footer"><span class="ems-lesson-step-status" data-academy-step-position aria-live="polite">Шаг '+(stepActive+1)+' из '+l.steps.length+'</span><div class="ems-lesson-actions"><button type="button" data-academy-previous '+(stepActive===0?'disabled':'')+'>Назад</button><button type="button" data-academy-next '+(stepActive===l.steps.length-1?'disabled':'')+'>Следующий шаг <span aria-hidden="true">→</span></button></div></footer>';
  if(l.links)out+='<div class="ems-learning-links"><strong>Полезные источники</strong>'+l.links.map(p=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(p[1])+'">'+esc(p[0])+' ↗</a>').join('')+'</div>';
  out+='</article>';
 }
 out+='</div></div><p class="ems-learning-disclaimer">Справочник основан на присланных игровых регламентах. Действующий устав и закреплённые сообщения Discord имеют приоритет. Приложение не одобряет отчёты и не повышает сотрудников автоматически.</p>';
 out+='<dialog class="ems-training-lightbox" id="ems-training-lightbox" aria-label="Увеличенный учебный скриншот"><button type="button" data-academy-close aria-label="Закрыть увеличенный скриншот">Закрыть ×</button><img id="ems-training-enlarged" alt=""><p id="ems-training-caption"></p></dialog></section>';
 return out;
}
