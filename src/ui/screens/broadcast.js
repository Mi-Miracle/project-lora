// РЕЖИМ ТРАНСЛЯЦІЇ, ГЛЯДАЧ, РІШЕННЯ-ДИЛЕМИ.
// • Вивід на стрім: одне джерело, три режими (геймплей / мапа / стрічка), перемикає хост — F9, Ctrl+Alt+1/2/3, кнопка 📺.
// • Глядач: підключення до кімнати без держави (index.html?watch=КОД&obs=1 — джерело OBS, що слідує за режимом хоста).
// • Дилеми: подія з вибором, яку подає радник; на стрімі чат може голосувати !1 / !2 / !3.
const ADV_ROW = { econ: 0, mil: 1, dipl: 2, sci: 3, infra: 4, intern: 5 };
// ---------- суттєві події для стрічки трансляції
const SIG_SKIP = /відступає|відходить|Будівництво|будує|Збудовано|Закладено|Сформовано|Дослідження завершено|освоює|прибув|візит|купує офіс|Рада директорів|📜|Шторм|Посуха|Міжнародна допомога/;
const SIG_KEEP = /ВІЙНА|нападає|вступає у війну|встановлює контроль|Звільнено|капітул|оточена|Мир|мир |союз|санкц|ухвалено|Переворот|Повстання|протест|відставку|Вибори|вибори|Землетрус|Цунамі|вулкан|метеорит|Перебрала|перебрала|контролює уряд|новий член|Дефолт|криза|Сенсація|пропонує|приймає пропозицію/i;
function isSignificant(n) { if (SIG_SKIP.test(n.text)) return false; if (/^(✈|🚀) /.test(n.text) && n.text.includes('→')) { const m = n.text.match(/влучань (\d+)/); return m && +m[1] >= 120; } return n.kind === 'big' || n.kind === 'war' || SIG_KEEP.test(n.text); }
function whoTag(n) { const L = NET.S.started ? NET.onlineList() : (G && G.player >= 0 ? [{ name: TW.S.user ? TW.S.user.name : nat(G.player).name, nid: G.player }] : []); const p = L.find(x => n.nats && n.nats.includes(x.nid)); return p ? `<b class="sw-who" style="color:${nat(p.nid).color}">${esc(p.name)}</b> ` : ''; }
// ВИВІД НА СТРІМ: одне джерело OBS, яке перемикається між трьома режимами:
//   game   — увесь геймплей (повний інтерфейс; джерело-глядач повторює вкладку, вибір і камеру хоста)
//   map    — лише мапа: армії, фронти, удари, дата, гравці; автокамера на бої або камера хоста
//   ticker — лише стрічка новин на прозорому тлі
// Хост перемикає режим (F9 — по колу, Ctrl+Alt+1/2/3 — напряму, кнопка 📺 у верхній панелі). Джерело OBS:
// index.html?watch=КОД&obs=1 — воно саме підхоплює вибраний режим. Без онлайн-кімнати режим застосовується у вікні гри (захоплення вікна).
const SVIEWS = { game: { n: 'Весь геймплей', ic: '🎮' }, map: { n: 'Лише мапа', ic: '🗺' }, ticker: { n: 'Лише стрічка новин', ic: '📰' } };
let streamOn = false, streamView = null, autoCam = true, camT = 0;
const SOUT = (() => { let o = {}; try { o = JSON.parse(localStorage.getItem('lora_sout') || '{}'); } catch (e) { } return Object.assign({ v: 'game', local: false, auto: true }, o, { on: false }); })();
function saveSOUT() { try { localStorage.setItem('lora_sout', JSON.stringify(SOUT)); } catch (e) { } }
const hasRoom = () => NET.S.role === 'host' && NET.S.started;
// що застосовувати в ЦЬОМУ вікні: без кімнати — завжди; з кімнатою — лише якщо «також у цьому вікні»
function applyLocalOut() { setStreamView(SOUT.on && (!hasRoom() || SOUT.local) ? SOUT.v : null); }
function setOut(v, on) {
  if (v) SOUT.v = v; SOUT.on = on != null ? on : true; saveSOUT(); applyLocalOut(); renderOutChip();
  hint(SOUT.on ? `📺 ${t_('Вивід')}: ${SVIEWS[SOUT.v].ic} ${t_(SVIEWS[SOUT.v].n)}${hasRoom() && !SOUT.local ? ' · ' + t_('джерело OBS перемкнено') : ''}` : '📺 ' + t_('Вивід вимкнено'), 2200);
}
function cycleOut() { const o = ['game', 'map', 'ticker']; if (!SOUT.on) setOut(SOUT.v, true); else setOut(o[(o.indexOf(SOUT.v) + 1) % 3], true); }
// стан виводу, що йде джерелу OBS разом зі знімком гри
function outState() { if (!SOUT.on) return null; const c = window.view ? { lon: (innerWidth / 2 + 150 - view.ox) / view.s, lat: (view.oy - innerHeight / 2) / view.s, s: view.s } : null; return { v: SOUT.v, auto: SOUT.auto, cam: c, tab: typeof tab !== 'undefined' ? tab : null, sel: typeof sel !== 'undefined' ? sel : null }; }
// джерело OBS: застосувати те, що вибрав хост
let _lastOutV = null;
function followOut(o) {
  if (!window._follow) return; document.body.classList.add('obs'); const v = o ? o.v : null;
  if (v !== _lastOutV) { _lastOutV = v; setStreamView(v || 'ticker'); }
  if (!o) return; autoCam = !!o.auto;
  if ((o.v === 'game' || (o.v === 'map' && !o.auto)) && o.cam && window.focusLonLat) { focusLonLat(o.cam.lon, o.cam.lat, o.cam.s); mapDirty = true; }
  if (o.v === 'game') { let ch = false; if (o.tab && typeof tab !== 'undefined' && tab !== o.tab) { tab = o.tab; ch = true; } if (JSON.stringify(sel) !== JSON.stringify(o.sel)) { sel = o.sel; ch = true; } if (ch) { renderTabs(); renderTab(true); renderRight(); } }
}
function setStreamView(v) {
  if (v && !SVIEWS[v]) v = null; streamView = v; streamOn = v === 'map' || v === 'ticker';
  const B = document.body; B.classList.toggle('stream', streamOn); ['game', 'map', 'ticker'].forEach(k => B.classList.toggle('sv-' + k, v === k));
  let tk = document.getElementById('swTicker'); if (!tk) { tk = document.createElement('div'); tk.id = 'swTicker'; tk.innerHTML = '<div class="sw-l">LORA</div><div class="sw-m"><div id="swRun"></div></div>'; document.body.appendChild(tk); const pl = document.createElement('div'); pl.id = 'swPlayers'; document.body.appendChild(pl); const lv = document.createElement('div'); lv.id = 'swLive'; document.body.appendChild(lv); }
  if (v) renderStreamTicker(true); mapDirty = true; if (window.resize) resize();
}
function setStream(on) { setOut('map', !!on); }
function renderOutChip() { const el = document.getElementById('outChip'); if (el) el.outerHTML = outChip(); }
function outChip() { return `<button id="outChip" class="${SOUT.on ? 'on' : ''}" onclick="streamMenu()" data-tip="${t_('Вивід на стрім: F9 — наступний режим, Ctrl+Alt+1/2/3 — геймплей/мапа/стрічка')}">📺 ${SOUT.on ? SVIEWS[SOUT.v].ic : '—'}</button>`; }
function streamMenu() {
  const code = NET.S.code, base = location.href.split('?')[0].split('#')[0], url = code ? `${base}?watch=${code}&obs=1` : '';
  openModal(`<h2>📺 ${t_('Вивід на стрім')}</h2><div class="mut small">${t_('Одне джерело для OBS, яке показує вибраний режим. Перемикайте тут, клавішею F9 або Ctrl+Alt+1/2/3 — джерело змінюється одразу, без перемикання сцен.')}</div>
  <div class="svm">${Object.entries(SVIEWS).map(([k, v], i) => `<button class="svm-c ${SOUT.on && SOUT.v === k ? 'on' : ''}" onclick="setOut('${k}',true);streamMenu()"><div class="svm-i">${ico(v.ic)}</div><b>${t_(v.n)}</b><div class="small mut">${t_(k === 'game' ? 'Повний інтерфейс: панелі, сповіщення, радники; джерело повторює вашу вкладку й камеру' : k === 'map' ? 'Тільки мапа з арміями й фронтами, дата, гравці; автокамера на бої або ваша камера' : 'Тільки біжучий рядок суттєвих подій на прозорому тлі')}</div><kbd>Ctrl+Alt+${i + 1}</kbd></button>`).join('')}</div>
  <div class="card"><b>${t_('Джерело OBS «Браузер»')}</b> <span class="small mut">1920×1080</span>
  ${url ? `<input readonly class="svm-u" value="${esc(url)}" onclick="this.select();navigator.clipboard&&navigator.clipboard.writeText(this.value);hint('📋 ${t_('Скопійовано')}',1200)">` : `<div class="small y">${t_('Без онлайн-кімнати режим застосовується просто в цьому вікні — захоплюйте його в OBS як «Вікно». Для окремого джерела-браузера відкрийте онлайн-кімнату (хост).')}</div>`}</div>
  <label class="row"><span>${t_('Автокамера на гарячі бої (режим мапи)')}</span><input type="checkbox" ${SOUT.auto ? 'checked' : ''} onchange="SOUT.auto=this.checked;saveSOUT()"></label>
  ${code ? `<label class="row"><span>${t_('Також показувати режим у цьому вікні')}</span><input type="checkbox" ${SOUT.local ? 'checked' : ''} onchange="SOUT.local=this.checked;saveSOUT();applyLocalOut()"></label>` : ''}
  <div class="btns"><button onclick="setOut(null,false);closeModal()">${t_('Вимкнути вивід')}</button><button onclick="closeModal()">${t_('Закрити')}</button></div>`);
}
function renderStreamTicker(force) {
  if (!streamView || !G) return; const run = document.getElementById('swRun'); if (!run) return;
  const L = G.news.filter(isSignificant).slice(0, 14); const key = L.map(n => n.d + n.text).join('|');
  if (force || run.dataset.k !== key) { run.dataset.k = key; run.innerHTML = L.map(n => `<span class="sw-i"><span class="sw-d">${G.dateStr(n.d).replace(/ р\.$/, '')}</span>${whoTag(n)}${esc(t_(n.text))}</span>`).join('<span class="sw-sep">◆</span>') || `<span class="sw-i">${t_('Світ поки що спокійний')}</span>`; }
  const lv = document.getElementById('swLive'); if (lv) lv.innerHTML = streamView === 'game' ? `<b>● LIVE</b> ${G.dateStr()}` : '';
  if (streamView !== 'map') return;
  const pl = document.getElementById('swPlayers'); const P = NET.S.started ? NET.onlineList() : (G.player >= 0 ? [{ name: TW.S.user ? TW.S.user.name : t_('Гравець'), a3: nat(G.player).a3, nid: G.player }] : []);
  const wars = [...G.wars.values()].filter(w => P.some(p => p.nid === w.a || p.nid === w.b)).slice(0, 4);
  pl.innerHTML = `<div class="sw-date">${G.dateStr()}</div>` + P.map(p => { const n = nat(p.nid); return `<div class="sw-p" style="border-left-color:${n.color}"><b>${esc(p.name)}</b><span>${esc(n.name)} · ${t_('ВВП')} ${money(n.agg.gdp)} · ${t_('стаб.')} ${n.stab.toFixed(0)}${G.enemiesOf(p.nid).length ? ' · ⚔' : ''}</span></div>`; }).join('')
    + (wars.length ? `<div class="sw-w">${wars.map(w => `<div>⚔ ${esc(nat(w.a).name)} — ${esc(nat(w.b).name)}</div>`).join('')}</div>` : '');
  if (autoCam && Date.now() - camT > 25000 && G.battles && G.battles.length) {
    camT = Date.now(); const hot = G.battles.filter(i => (G.battleHot || {})[i]); const L2 = hot.length ? hot : G.battles; const i = L2[Math.floor(Math.random() * L2.length)];
    const c = D.regions[i] && D.regions[i].c; if (c && window.focusLonLat) { focusLonLat(c[0], c[1], Math.max(view.s, 5)); mapDirty = true; }
  }
}
document.addEventListener('keydown', e => {
  if (window._follow) return;
  if (e.key === 'F9') { e.preventDefault(); if (e.shiftKey) streamMenu(); else cycleOut(); }
  if (e.altKey && e.ctrlKey && /^Digit[123]$/.test(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); setOut(['game', 'map', 'ticker'][+e.code.slice(5) - 1], true); }
});
// ---------- глядач
async function watchJoin(code, clean, view, obs) {
  try { await NET.join(code, (TW.S.user ? TW.S.user.name : 'Глядач') + ' 👁', null, { spectate: true }); if (clean || view) window._autoView = view || 'map'; if (obs) window._follow = true; renderLobby(); }
  catch (e) { hint('⚠ ' + t_('Не вдалося підключитися') + ': ' + (e.type || e.message || e), 6000); }
}
(function () { const q = new URLSearchParams(location.search); const w = q.get('watch'); if (w) setTimeout(() => { $('#start').style.display = 'none'; watchJoin(w, q.get('clean') === '1', q.get('view'), q.get('obs') === '1'); }, 800); })();
// ---------- дилеми
let decOpen = null;
function checkDecision() {
  if (!G || modalOpen || NET.S.spectator) return; const d = (G.decisions || []).find(x => x.co ? G.pc >= 0 && G.player < 0 : x.nid === G.player); if (!d || decOpen === d.id) return;
  const e = G.decEvents ? G.decEvents.find(x => x.id === d.ev) : null; if (!e) return; decOpen = d.id; const row = ADV_ROW[e.adv] || 0;
  const chat = TW.S.connected && AUD.S.chatVotes !== false;
  openModal(`<div class="dec"><div class="dec-a"><canvas id="decA" width="32" height="32"></canvas></div><div><h2>${d.ctx.big ? '⚡ ' + t_('Розвилка історії') : '📜 ' + t_('Рішення')}</h2><p>${esc(t_(d.ctx.text))}</p>
    <div id="decOpts">${e.o.map((o, i) => `<button class="dec-o" onclick="pickDecision(${d.id},${i})"><b>${i + 1}</b> ${esc(t_(o[0]))}<span class="dec-v" id="decV${i}"></span></button>`).join('')}</div>
    ${chat ? `<div class="btns"><button class="pri" onclick="chatDecide(${d.id},${e.o.length})">🟣 ${t_('Нехай вирішить чат (30 с)')}</button></div><div class="small mut">${t_('Глядачі пишуть у чат')} !1, !2${e.o.length > 2 ? ', !3' : ''}</div>` : ''}</div></div>`);
  const img = new Image(); img.src = 'assets/ui/advisors.png'; img.onload = () => { const c = document.getElementById('decA'); if (!c) return; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, row * 32, 32, 32, 0, 0, 32, 32); };
  AUD.sfx('news');
}
function pickDecision(id, i) { const r = G.decide(id, i); closeModal(); decOpen = null; if (r && r.ok === false) hint('⚠ ' + r.err, 3000); else if (r && r.res) hint('📜 ' + t_(r.res), 4000); AUD.sfx('good'); }
async function chatDecide(id, n) {
  document.querySelectorAll('.dec .btns button').forEach(b => b.disabled = true); let left = 30; const iv = setInterval(() => { left--; const h = document.querySelector('.dec h2'); if (h) h.textContent = `🟣 ${t_('Чат голосує')}: ${left} ${t_('с')}`; }, 1000);
  const r = await TW.poll(n, 30, t => t.forEach((v, i) => { const el = document.getElementById('decV' + i); if (el) el.textContent = ` · ${v} ${t_('голосів')}`; }));
  clearInterval(iv); const pickI = r.best >= 0 ? r.best : 0; hint(`🟣 ${t_('Чат обрав варіант')} ${pickI + 1}`, 3000); setTimeout(() => pickDecision(id, pickI), 1200);
}
setInterval(() => { try { checkDecision(); renderStreamTicker(); } catch (e) { } }, 700);
// ---------- «Чат вирішує долю світу»: раз на N хвилин глядачі обирають світову подію
let chaosT = 0, chaosBusy = false;
async function chaosRound() {
  if (chaosBusy || !G || !TW.S.connected || NET.isGuest() || G.player < 0 && !(G.pc >= 0) || !AUD.S.chatChaos) return; chaosBusy = true;
  const keys = Object.keys(G.CHAOS).sort(() => Math.random() - 0.5).slice(0, 3);
  let box = document.getElementById('chaosBox'); if (!box) { box = document.createElement('div'); box.id = 'chaosBox'; document.body.appendChild(box); }
  const draw = (t, left) => { box.innerHTML = `<b>🟣 ${t_('Чат вирішує долю світу')}</b> <span class="mut">${left} ${t_('с')}</span>` + keys.map((k, i) => `<div><b>!${i + 1}</b> ${esc(t_(G.CHAOS[k].n))} <span class="dec-v">${t ? t[i] : 0}</span></div>`).join(''); };
  box.style.display = 'block'; let left = 45; draw(null, left); const iv = setInterval(() => { left--; draw(window._chT, left); }, 1000);
  const r = await TW.poll(3, 45, t => { window._chT = t; draw(t, left); }); clearInterval(iv); window._chT = null;
  if (r.best >= 0) { if (NET.S.role === 'host' || !NET.S.role) G.chaos(keys[r.best]); box.innerHTML = `<b>🟣 ${t_('Чат обрав')}:</b> ${esc(t_(G.CHAOS[keys[r.best]].n))}`; AUD.sfx('alert'); }
  else box.innerHTML = `<b>🟣</b> ${t_('Ніхто не проголосував')}`;
  setTimeout(() => { box.style.display = 'none'; chaosBusy = false; }, 6000);
}
setInterval(() => { if (AUD.S.chatChaos && TW.S.connected && G && speedIdx && Date.now() - chaosT > (AUD.S.chaosMin || 8) * 60000) { chaosT = Date.now(); chaosRound(); } }, 5000);
// джерело OBS — лише показ: жодних клавіш, коліщатка чи кліків
['keydown', 'keyup', 'wheel', 'mousedown', 'contextmenu'].forEach(ev => window.addEventListener(ev, e => { if (window._follow && NET.S.started) { e.stopImmediatePropagation(); e.preventDefault(); } }, { capture: true, passive: false }));
