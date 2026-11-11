// EMS COMMAND 3.9.2 — deterministic, bounded notification lifecycle.
// The progress line reflects elapsed visible time; hover/focus/background pauses it.
// No dependency on CSS animation completion for automatic dismissal.
export function remainingFraction(elapsedMs, durationMs) {
  const duration = Math.max(1, Number(durationMs) || 1);
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  return Math.max(0, Math.min(1, 1 - elapsed / duration));
}
export function toastDuration(tone) {
  return tone === 'error' ? 7200 : tone === 'warning' ? 6500 : 5500;
}
export function createToastCenter({getRoot, icon}) {
  const visible = [];
  const waiting = [];
  let timer = null;
  const maxVisible = 3;
  const maxWaiting = 16;
  const timestamp = () => performance.now();
  const escText = value => String(value ?? '');
  function tick() {
    const now = timestamp();
    for (const entry of [...visible]) {
      if (entry.leaving) continue;
      if (document.hidden || entry.paused) {
        entry.last = now;
        continue;
      }
      entry.elapsed += Math.max(0, now - entry.last);
      entry.last = now;
      const left = remainingFraction(entry.elapsed, entry.duration);
      entry.life.style.transform = 'scaleX(' + left.toFixed(4) + ')';
      if (left <= 0) dismiss(entry);
    }
    if (!visible.some(entry => !entry.leaving) && waiting.length === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }
  function startTimer() {
    if (timer === null) timer = setInterval(tick, 40);
  }
  function dismiss(entry) {
    if (!entry || entry.leaving) return;
    entry.leaving = true;
    entry.el.classList.add('ems392-toast-leaving');
    setTimeout(() => {
      entry.el.remove();
      const index = visible.indexOf(entry);
      if (index !== -1) visible.splice(index, 1);
      flush();
    }, 340);
  }
  function flush() {
    const container = getRoot();
    if (!container) return;
    while (visible.length < maxVisible && waiting.length) {
      const item = waiting.shift();
      const el = document.createElement('article');
      const tone = item.tone;
      el.className = 'toast v3-toast ems392-toast ems392-toast-' + tone;
      el.setAttribute('role', tone === 'error' ? 'alert' : 'status');
      el.setAttribute('aria-atomic', 'true');
      // All external title/detail content uses textContent, never HTML interpolation.
      el.innerHTML = '<div class="ems392-toast-accent" aria-hidden="true"></div>' +
        '<div class="ems392-toast-icon" aria-hidden="true"></div>' +
        '<div class="ems392-toast-copy"><strong></strong><p></p></div>' +
        '<button type="button" class="ems392-toast-close" aria-label="Закрыть уведомление">×</button>' +
        '<div class="ems392-toast-life" aria-hidden="true"><i></i></div>';
      el.querySelector('strong').textContent = escText(item.title);
      const detail = el.querySelector('p');
      detail.textContent = escText(item.detail);
      if (!item.detail) detail.hidden = true;
      el.querySelector('.ems392-toast-icon').innerHTML = icon(tone === 'error' ? 'warning' : tone === 'warning' ? 'clock' : tone === 'info' ? 'activity' : 'check', 19);
      const meter = el.querySelector('.ems392-toast-life i');
      const entry = {el, life: meter, duration: item.duration, elapsed: 0, last: timestamp(), paused: false, leaving: false};
      el.querySelector('.ems392-toast-close').addEventListener('click', () => dismiss(entry));
      el.addEventListener('mouseenter', () => {entry.paused = true;});
      el.addEventListener('mouseleave', () => {entry.paused = el.contains(document.activeElement); entry.last = timestamp();});
      el.addEventListener('focusin', () => {entry.paused = true;});
      el.addEventListener('focusout', () => {
        queueMicrotask(() => {entry.paused = el.matches(':hover') || el.contains(document.activeElement); entry.last = timestamp();});
      });
      container.appendChild(el);
      visible.push(entry);
      startTimer();
    }
  }
  function notify(title, detail = '', options = {}) {
    const tone = ['success', 'error', 'warning', 'info'].includes(options.tone) ? options.tone : 'success';
    const duration = Math.max(1800, Math.min(15000, Number(options.duration) || toastDuration(tone)));
    if (waiting.length >= maxWaiting) waiting.shift();
    waiting.push({title, detail, tone, duration});
    flush();
  }
  return {notify};
}
