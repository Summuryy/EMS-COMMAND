// EMS COMMAND 3.9.3 — task-first information architecture.
// Keep core duty workflow visible; move references/experimental tools to secondary space.
// This module does not assume a particular RP server or grant roles.
export const NAV_SECTIONS = Object.freeze([
 {label:'МОЯ СЛУЖБА',items:[
  {id:'home',title:'Обзор',icon:'home'},
  {id:'shift',title:'Моя смена',icon:'clock'},
  {id:'evidence',title:'Доказательства',icon:'scan'},
  {id:'career',title:'Повышение',icon:'trophy'}
 ]},
 {label:'СПРАВКА И СЕРВИСЫ',items:[
  {id:'academy',title:'Обучение',icon:'book'},
  {id:'charter',title:'Устав и правила',icon:'shield'},
  {id:'pro',title:'Автозахват · PRO',icon:'scan'}
 ]},
 {label:'УПРАВЛЕНИЕ',roles:['admin','reviewer'],items:[
  {id:'admin',title:'Проверка и доступ',icon:'shield'}
 ]}
]);
export const navigationForRole=role=>NAV_SECTIONS
 .filter(section=>!section.roles||section.roles.includes(role))
 .map(section=>({label:section.label,items:section.items}));
export const navTitle=id=>NAV_SECTIONS.flatMap(section=>section.items).find(item=>item.id===id)?.title||'Обзор';
