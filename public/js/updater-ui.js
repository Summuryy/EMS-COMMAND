// Safe DOM-only state presenter; all messages are escaped. Real progress comes from Electron.
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages={managed:['Проверка защищённого канала','Проверить новую версию можно здесь. Установка выполняется через EMS Launcher.'], 'managed-available':['Доступна новая версия','Закройте EMS COMMAND и обновитесь через лаунчер.'],unconfigured:['Канал обновлений не настроен','Публикация подписанных релизов ещё не включена.'],dev:['Режим разработки','Обновления работают только в установленной версии.'],idle:['Ожидание проверки','Нажмите кнопку для проверки релизов.'],checking:['Поиск новой версии','Подключение к серверу обновлений…'],current:['Установлена последняя версия','EMS COMMAND обновлён.'],available:['Доступна новая версия','Проверьте версию и скачайте пакет из доверенного канала.'],downloading:['Загрузка обновления','Не закрывай EMS COMMAND до завершения загрузки.'],ready:['Обновление загружено','Сохрани работу и заверши смену перед перезапуском.'],error:['Ошибка обновления','Не удалось завершить операцию.']};
export function renderUpdatePanel(s={}){
 const status=Object.prototype.hasOwnProperty.call(stages,s.status)?s.status:'error';
 const [headline,summary]=stages[status];
 const percentage=Math.max(0,Math.min(100,Number(s.percent)||0));
 const busy=status==='downloading'||status==='checking';
 const action=status==='available'?'<button class="btn btn-primary" id="update-download">Скачать обновление</button>':status==='ready'?'<button class="btn btn-primary" id="update-install">Перезапустить и установить</button>':status==='unconfigured'||status==='dev'?'<button class="btn" disabled title="Сначала опубликуйте доверенный канал релизов">Канал недоступен</button>':busy?'<button class="btn" disabled>Выполняется…</button>':'<button class="btn btn-primary" id="update-check">Проверить обновления</button>';
 const labels={
  'managed':'ГОТОВ К ПРОВЕРКЕ',
  'managed-available':'ДОСТУПНО',
  'checking':'ПРОВЕРЯЕМ',
  'current':'АКТУАЛЬНО',
  'available':'ДОСТУПНО',
  'downloading':'ЗАГРУЗКА',
  'ready':'ГОТОВО',
  'error':'ОШИБКА',
  'dev':'РЕЖИМ РАЗРАБОТКИ',
  'unconfigured':'НЕТ КАНАЛА',
  'idle':'НЕ ПРОВЕРЕНО'
 };
 const message=escapeHtml(s.message||summary);
 const progress=busy?`<div class="ems382-update-progress ${status==='checking'?'is-checking':''}"><div class="ems-update-track" role="progressbar" aria-label="${status==='checking'?'Проверка канала обновлений':'Загрузка обновления'}" aria-valuemin="0" aria-valuemax="100" ${status==='downloading'?`aria-valuenow="${percentage}"`:''}><span style="width:${status==='downloading'?percentage:37}%"></span></div></div>`:'';
 return `<div class="ems-update-hub ems382-update-hub" data-update-status="${status}" role="status" aria-live="polite"><div class="ems-update-version"><div><span class="ems-update-eyebrow">УСТАНОВЛЕНА</span><strong>v${escapeHtml(s.version||'—')}</strong>${s.latestVersion?`<small>Доступна v${escapeHtml(s.latestVersion)}</small>`:''}</div><span class="ems-update-orbit ${busy?'is-running':''}" aria-hidden="true">✚</span><div><span class="ems-update-eyebrow">СТАТУС</span><strong>${labels[status]}</strong></div></div><h3>${escapeHtml(headline)}</h3><p class="muted">${message}</p>${progress}<div class="ems-update-bottom"><span>${status==='downloading'?`${percentage}% загружено`:escapeHtml(summary)}</span>${action}</div><div class="ems-update-safe">Защита данных: профили, смены и доказательства находятся отдельно от файлов программы.</div></div>`;
}
