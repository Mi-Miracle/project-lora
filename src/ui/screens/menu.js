// ГОЛОВНЕ МЕНЮ (як у сучасних іграх), ЕКРАН НАЛАШТУВАНЬ і МЕНЮ ПАУЗИ (Esc).
let _mmRaf = 0, _paused = false, _pauseSpeed = 1;
const MM_NEWS = () => LORA.lang === 'en'
  ? ['Closed-loop world market: you sell only to those who buy', 'Ministers by sector with AI autopilot', 'Hire bodyguards from private military companies', 'Stock exchange 2.0: IPOs, takeovers, bubbles', 'Neural Ukrainian voices offline (Piper)']
  : ['Замкнений світовий ринок: продаєте лише тим, хто купує', 'Міністри по галузях з автокеруванням ШІ', 'Охорона з приватних військових компаній', 'Біржа 2.0: емісії, поглинання, бульбашки', 'Живі українські голоси офлайн (Piper)'];
function hasSaveGame() { try { return !!(localStorage.getItem('lora_save') || localStorage.getItem('lora_auto')); } catch (e) { return false; } }
function mainMenu() {
  let el = document.getElementById('mm'); if (!el) { el = document.createElement('div'); el.id = 'mm'; document.body.appendChild(el); }
  $('#start').style.display = 'none'; el.style.display = 'block';
  const B = [hasSaveGame() ? ['cont', '▶', 'Продовжити', 'останнє збереження'] : null, ['single', '🎮', 'Нова гра', 'персонаж, партія, компанія чи президент'], ['multi', '🌐', 'Мультиплеєр', 'хост, гравець або глядач'],
    ['rada', '🏛', 'Президент і Рада', 'ви — президент, чат Twitch — парламент'], ['load', '📂', 'Завантажити', 'збереження з цього компʼютера'], ['set', '⚙', 'Налаштування', 'звук, озвучка, гра, Twitch, стрім'],
    ['help', '❓', 'Як грати', 'основи й гарячі клавіші'], ['credits', '✨', 'Автори', 'Mi_Miracle і бібліотеки'], ['quit', '⏻', 'Вихід', '']].filter(Boolean);
  el.innerHTML = `<canvas id="mmcv"></canvas><div class="mm-shade"></div>
  <div class="mm-left"><div class="mm-logo"><div class="mm-dev">Mi_Miracle ${t_('представляє')}</div><h1>PROJECT <b>LORA</b></h1><div class="mm-sub">${t_('Глобальна стратегія на реальній мапі світу')}</div></div>
  <nav class="mm-nav">${B.map(([k, ic, n, d], i) => `<button style="animation-delay:${i * 60}ms" onclick="mmGo('${k}')"><i>${ic}</i><span>${t_(n)}${d ? `<small>${t_(d)}</small>` : ''}</span></button>`).join('')}</nav></div>
  <div class="mm-right"><div class="mm-card"><div class="mm-h">🆕 ${t_('Що нового')} · v${LORA.version}</div>${MM_NEWS().map(x => `<div class="mm-n">▸ ${esc(x)}</div>`).join('')}</div>
  <div class="mm-card mm-tw">${typeof twBadge === 'function' ? twBadge() : ''} ${typeof langSwitch === 'function' ? langSwitch() : ''}</div></div>
  <div class="mm-foot">© Mi_Miracle · v${LORA.version} · ${t_('Esc у грі — пауза')}</div>`;
  mmBg();
}
function mmHide() { const el = document.getElementById('mm'); if (el) el.style.display = 'none'; cancelAnimationFrame(_mmRaf); }
function mmGo(k) {
  AUD.sfx && AUD.sfx('click');
  if (k === 'cont' || k === 'load') { if (loadGame()) mmHide(); return; }
  if (k === 'single') { netMode = 'solo'; if (startMode === 'rada') startMode = 'nation'; startTab = 'game'; }
  if (k === 'multi') { netMode = 'host'; if (startMode === 'rada') startMode = 'nation'; startTab = 'game'; }
  if (k === 'rada') { netMode = 'solo'; startMode = 'rada'; startTab = 'game'; }
  if (k === 'set') { settingsScreen(); return; } if (k === 'help') { help(); return; }
  if (k === 'credits') { openModal(`<h2>✨ ${t_('Автори')}</h2><div class="card"><b>Mi_Miracle</b><div class="small mut">${t_('Ідея, геймдизайн, стрім')} · twitch.tv/mi_miracle</div></div><div class="small mut" style="line-height:1.6">${t_('Бібліотеки')}: onnxruntime-web (MIT, Microsoft), seek-bzip (MIT), PeerJS (MIT), Pixelify Sans (OFL). ${t_('Голосова модель')} ukrainian_tts (${t_('датасет')} CC0). eSpeak NG (GPL-3, ${t_('завантажується окремо за бажанням')}). ${t_('Географія')}: Natural Earth (public domain).</div><div class="btns"><button onclick="closeModal()">${t_('Закрити')}</button></div>`); return; }
  if (k === 'quit') { try { window.close(); } catch (e) { } setTimeout(() => hint(t_('Закрийте вкладку браузера'), 2500), 200); return; }
  mmHide(); $('#start').style.display = 'flex'; startScreen();
}
// фон меню: обертовий глобус
function mmBg() {
  const cv = document.getElementById('mmcv'); if (!cv) return; const cx = cv.getContext('2d'); const pts = D.regions.map(r => [r.c[0] * Math.PI / 180, r.c[1] * Math.PI / 180]); const T0 = performance.now();
  const fr = now => { const el = document.getElementById('mm'); if (!el || el.style.display === 'none') return; const W = innerWidth, H = innerHeight; if (cv.width !== W) { cv.width = W; cv.height = H; }
    const u = (now - T0) / 1000, R = Math.min(W, H) * 0.42, X = W * 0.66, Y = H * 0.52, rot = u * 0.06, tilt = 0.3;
    cx.fillStyle = '#05080d'; cx.fillRect(0, 0, W, H);
    const g = cx.createRadialGradient(X - R * 0.3, Y - R * 0.3, R * 0.1, X, Y, R * 1.2); g.addColorStop(0, 'rgba(40,110,200,0.28)'); g.addColorStop(1, 'rgba(5,15,30,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(X, Y, R * 1.2, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(100,180,255,0.35)'; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.stroke();
    const sweep = (u * 0.8) % (Math.PI * 2);
    for (const [lo, la] of pts) { const x0 = Math.cos(la) * Math.sin(lo + rot), y0 = Math.sin(la), z0 = Math.cos(la) * Math.cos(lo + rot); const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt), z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt); if (z < 0.02) continue;
      const px = X + x0 * R, py = Y - y * R; const a = Math.atan2(py - Y, px - X); const dA = (sweep - a + Math.PI * 4) % (Math.PI * 2); const hot = dA < 0.5 ? 1 - dA / 0.5 : 0;
      cx.fillStyle = hot ? `rgba(255,200,90,${0.4 + hot * 0.6})` : `rgba(110,190,255,${0.18 + z * 0.5})`; const s = 1 + z * 1.6 + hot * 1.5; cx.fillRect(px - s / 2, py - s / 2, s, s); }
    for (let k = 0; k < 3; k++) { const ang = u * (0.3 + k * 0.12) + k * 2, rx = R * (1.2 + k * 0.07), ry = R * (0.3 + k * 0.09), x = X + Math.cos(ang) * rx, y = Y + Math.sin(ang) * ry * (k % 2 ? -1 : 1);
      cx.strokeStyle = 'rgba(120,190,255,0.08)'; cx.beginPath(); cx.ellipse(X, Y, rx, ry, 0, 0, 7); cx.stroke(); cx.fillStyle = '#cfe8ff'; cx.fillRect(x - 2, y - 1, 4, 2); }
    _mmRaf = requestAnimationFrame(fr); };
  cancelAnimationFrame(_mmRaf); _mmRaf = requestAnimationFrame(fr);
}
// ---- екран налаштувань (з головного меню й з паузи)
let setTab = 'sound';
function settingsScreen() {
  let el = document.getElementById('setscr'); if (!el) { el = document.createElement('div'); el.id = 'setscr'; document.body.appendChild(el); } el.style.display = 'flex';
  const TB = [['sound', '🔊', 'Звук і музика'], ['voice', '🗣', 'Озвучка'], ['game', '🎮', 'Гра'], ['twitch', '🟣', 'Twitch'], ['stream', '📺', 'Стрім']];
  const S = AUD.S, chk = (k, n, def) => `<label class="row"><span>${t_(n)}</span><input type="checkbox" ${(def ? S[k] !== false : S[k]) ? 'checked' : ''} onchange="AUD.set('${k}',this.checked)"></label>`;
  const rng = (k, n) => `<div class="sl"><div class="lab"><span>${t_(n)}</span><b>${Math.round((S[k] || 0) * 100)}%</b></div><input type="range" min="0" max="1" step="0.05" value="${S[k]}" oninput="AUD.set('${k}',+this.value);this.previousElementSibling.lastElementChild.textContent=Math.round(this.value*100)+'%'"></div>`;
  let body = '';
  if (setTab === 'sound') body = chk('music', 'Музика') + rng('mvol', 'Гучність музики') + `<div class="row"><span>${t_('Стиль музики')}</span><select onchange="AUD.set('style',this.value)"><option value="auto">${t_('Авто: за ситуацією, плейлист змінюється')}</option>${Object.entries(AUD.STY).map(([k, v]) => `<option value="${k}" ${S.style === k ? 'selected' : ''}>${t_(v.n)}</option>`).join('')}</select></div>`
    + chk('sfx', 'Звукові ефекти') + rng('vol', 'Гучність ефектів') + chk('toasts', 'Спливаючі сповіщення') + chk('advisors', 'Радники з порадами') + chk('newscast', 'Щомісячний випуск новин');
  else if (setTab === 'voice') body = chk('tts', 'Озвучка увімкнена') + `<div id="voiceBox">${voiceSettings()}</div>`;
  else if (setTab === 'game') body = `<label class="row"><span>🌫 ${t_('Туман війни')}</span><input type="checkbox" ${LORA.config.fog !== false ? 'checked' : ''} onchange="LORA.config.fog=this.checked;try{localStorage.setItem('lora_fog',this.checked?'1':'0')}catch(e){};if(window.mapDirty!==undefined)mapDirty=true"></label>
    <label class="row"><span>${t_('Заставка при запуску')}</span><input type="checkbox" ${localStorage.getItem('lora_intro') === 'off' ? '' : 'checked'} onchange="localStorage.setItem('lora_intro',this.checked?'on':'off')"></label>
    <label class="row"><span>${t_('Гумористичні новини й події')}</span><input type="checkbox" ${S.humor !== false ? 'checked' : ''} onchange="AUD.set('humor',this.checked)"></label>
    <div class="row"><span>${t_('Мова')}</span>${typeof langSwitch === 'function' ? langSwitch() : ''}</div>
    <div class="card small"><b>${t_('Гарячі клавіші')}</b><div class="mut" style="line-height:1.7">Esc — ${t_('пауза / меню')} · ${t_('Пробіл — стоп/старт часу')} · 1–4 — ${t_('швидкість')} · Alt+1–8 — ${t_('вкладки')} · L — ${t_('до лідера')} · F9 — ${t_('режим стріму')} · F11 — ${t_('повний екран')}</div></div>`;
  else if (setTab === 'twitch') body = typeof twitchBlock === 'function' ? twitchBlock() : '';
  else body = typeof streamBlock === 'function' ? streamBlock() : '';
  el.innerHTML = `<div class="set-box"><div class="set-h"><h2>⚙ ${t_('Налаштування')}</h2><button class="pri" onclick="settingsClose()">✕ ${t_('Готово')}</button></div>
  <div class="set-tabs">${TB.map(([k, ic, n]) => `<button class="${setTab === k ? 'on' : ''}" onclick="setTab='${k}';settingsScreen()">${ic} ${t_(n)}</button>`).join('')}</div><div class="set-body">${body}</div></div>`;
}
function settingsClose() { const el = document.getElementById('setscr'); if (el) el.style.display = 'none'; if (document.getElementById('mm') && document.getElementById('mm').style.display !== 'none') mainMenu(); }
// startScreen() у вкладках Twitch/стріму перемальовує й налаштування, якщо вони відкриті
{ const base = window.startScreen; if (base) window.startScreen = function () { base(); const s = document.getElementById('setscr'); if (s && s.style.display !== 'none') settingsScreen(); if ($('#start').style.display !== 'none' && !document.getElementById('st-back')) { const h = document.querySelector('#sbox .st-head'); if (h) h.insertAdjacentHTML('afterbegin', `<button id="st-back" class="st-back" onclick="mainMenu()">← ${t_('Головне меню')}</button>`); } }; }
// ---- меню паузи
function pauseMenu(on) {
  if (!G || $('#start').style.display !== 'none') return; if (on == null) on = !_paused;
  let el = document.getElementById('pausem'); if (!el) { el = document.createElement('div'); el.id = 'pausem'; document.body.appendChild(el); }
  if (!on) { el.style.display = 'none'; _paused = false; if (!NET.isGuest() && _pauseSpeed) setSpeed(_pauseSpeed); return; }
  _paused = true; if (!NET.isGuest() && !(G.online && NET.S.role === 'host')) { _pauseSpeed = speedIdx; setSpeed(0); } else _pauseSpeed = 0;
  const B = [['▶', 'Продовжити', 'pauseMenu(false)'], ['💾', 'Зберегти гру', "saveGame();pauseMenu(false)"], ['📂', 'Завантажити', "if(loadGame())pauseMenu(false)"], ['⚙', 'Налаштування', 'settingsScreen()'],
    ['📺', 'Випуск новин за місяць', "pauseMenu(false);NEWSCAST.open()"], ['📡', 'Вивід на стрім', "pauseMenu(false);streamMenu()"], ['❓', 'Як грати', 'help()'], ['🏠', 'Головне меню', "pauseConfirm(this,'menu')"], ['⏻', 'Вийти з гри', "pauseConfirm(this,'quit')"]];
  el.innerHTML = `<div class="pm-box"><h2>⏸ ${t_('Пауза')}</h2><div class="mut small">${esc(G.dateStr())}</div>${B.map(([ic, n, f]) => `<button onclick="${f}">${ic} ${t_(n)}</button>`).join('')}<div class="mut small">${t_('Незбережений прогрес буде втрачено при виході')}</div></div>`;
  el.style.display = 'flex';
}
function pauseConfirm(b, what) { if (b.dataset.sure) { try { localStorage.setItem('lora_auto', G.save()); } catch (e) { } if (what === 'quit') { try { window.close(); } catch (e) { } } sessionStorage.setItem('lora_menu', '1'); location.reload(); return; } b.dataset.sure = 1; b.textContent = t_('Точно? Натисніть ще раз (автозбереження)'); }
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
  const ss = document.getElementById('setscr'); if (ss && ss.style.display !== 'none') { settingsClose(); e.stopImmediatePropagation(); return; }
  if (!G || modalOpen || (typeof sel !== 'undefined' && sel) || $('#start').style.display !== 'none' || (document.getElementById('mm') && document.getElementById('mm').style.display !== 'none')) return;
  pauseMenu(); e.stopImmediatePropagation();
}, true);
// при запуску показуємо головне меню замість одразу налаштувань гри
setTimeout(() => { if (!G && !/[?&](room|join|watch)=/.test(location.search) && (typeof netMode === 'undefined' || netMode === 'solo')) mainMenu(); }, 0);
// будь-який старт гри ховає головне меню
['startGame', 'loadGame', 'hostOpen'].forEach(f => { const b = window[f]; if (typeof b === 'function') window[f] = function () { const r = b.apply(this, arguments); if ((f === 'startGame') || (f === 'loadGame' && r) || (f === 'hostOpen' && G)) mmHide(); return r; }; });
