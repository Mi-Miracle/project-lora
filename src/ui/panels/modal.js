// ВІКНА: меню, довідка, пропозиції миру, кінець гри, збереження.
function openModal(h) { $('#mbox').innerHTML = h; $('#modal').style.display = 'flex'; modalOpen = true; }
function closeModal() { $('#modal').style.display = 'none'; modalOpen = false; }
function checkPopups() {
  if (modalOpen) return;
  if (G.gameOver) { openModal(`<h2>${G.gameOver.win ? '🏆 ' + t_('Перемога') : '☠ ' + t_('Кінець гри')}</h2><p>${esc(t_(G.gameOver.text))}</p><p class="mut">${G.dateStr()} · ${t_('день')} ${G.day}</p><div class="btns">${G.gameOver.cont ? `<button class="pri" onclick="G.gameOver=null;closeModal()">▶ ${t_('Продовжити гру')}</button>` : ''}<button class="${G.gameOver.cont ? '' : 'pri'}" onclick="location.reload()">${t_('Нова гра')}</button></div>`); return; }
  const pi = G.pendingPeace.findIndex(p => p.to == null || p.to === G.player); if (pi < 0) return;
  const p = G.pendingPeace[pi], f = nat(p.from); let t = '';
  if (String(p.type).startsWith('h_')) { const K = { h_alliance: '🛡 Союз', h_treaty: '📑 Торговельна угода', h_access: '🛂 Військовий доступ', h_peace: '🕊 Мир', h_requestAid: '📦 Прохання про допомогу' }; t = `<h2>${K[p.type] || p.type}</h2><p>${t_('Гравець')} <b>${esc(f.name)}</b> ${t_('пропонує вам')}: ${K[p.type] || ''}${p.ptype ? ' (' + esc(p.ptype) + ')' : ''}.</p>`; }
  else   if (p.type === 'ally_call') t = `<h2>🛡 Союзник просить допомоги</h2><p>${esc(f.name)} зазнала нападу з боку ${esc(nat(p.vs).name)} і закликає вас виконати союзні зобов'язання.</p><p class="mut">Відмова сильно погіршить відносини з союзником.</p>`;
  else if (p.type === 'cede_to_ai') t = `<h2>📜 Ультиматум</h2><p>${esc(f.name)} пропонує мир за умови, що ви поступитеся всіма регіонами, які вона контролює.</p>`;
  else if (p.type === 'cede') t = `<h2>📜 Капітуляційні умови</h2><p>${esc(f.name)} пропонує мир і готова віддати вам усі контрольовані вами регіони.</p>`;
  else if (p.type === 'mutual') t = `<h2>⚖ Заморожування фронту</h2><p>${esc(f.name)} пропонує мир по лінії фронту: кожна сторона назавжди залишає собі те, що зараз контролює. Окуповані регіони буде втрачено.</p>`;
  else t = `<h2>🕊 Пропозиція миру</h2><p>${esc(f.name)} пропонує білий мир: усі окуповані регіони повертаються власникам.</p>`;
  setSpeed(0);
  openModal(t + `<div class="btns"><button class="pri" onclick="G.act.answerPending(${pi},true);closeModal();mapDirty=true;renderTab(true)">Погодитись</button><button onclick="G.act.answerPending(${pi},false);closeModal()">Відхилити</button></div>`);
}
function menu() {
  openModal(`<h2>⚙ Меню</h2><div class="btns" style="flex-direction:column;align-items:stretch"><button onclick="saveGame();closeModal()">💾 Зберегти гру</button><button onclick="if(loadGame())closeModal()">📂 Завантажити збереження</button>
  <button onclick="closeModal();help()">❓ Як грати</button><button onclick="closeModal();NEWSCAST.open()">📺 Випуск новин за місяць</button><button onclick="closeModal();streamPanel()">📡 Інтеграція зі стрімом</button>
  <button class="dang" onclick="this.textContent==='Точно? Натисніть ще раз'?location.reload():this.textContent='Точно? Натисніть ще раз'">Нова гра</button><button onclick="closeModal()">Закрити</button></div>
  <div class="grp">🔊 Звук і сповіщення</div>
  <label class="row"><span>Звукові ефекти</span><input type="checkbox" ${AUD.S.sfx ? 'checked' : ''} onchange="AUD.set('sfx',this.checked)"></label>
  <div class="sl"><div class="lab"><span>Гучність ефектів</span></div><input type="range" min="0" max="1" step="0.05" value="${AUD.S.vol}" oninput="AUD.set('vol',+this.value)"></div>
  <label class="row"><span>Музика</span><input type="checkbox" ${AUD.S.music ? 'checked' : ''} onchange="AUD.set('music',this.checked)"></label>
  <div class="row"><span>Стиль музики</span><select onchange="AUD.set('style',this.value)"><option value="auto">Авто (за ситуацією)</option>${Object.entries(AUD.STY).map(([k, v]) => `<option value="${k}" ${AUD.S.style === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>
  <label class="row"><span>Радники з порадами</span><input type="checkbox" ${AUD.S.advisors ? 'checked' : ''} onchange="AUD.set('advisors',this.checked)"></label>
  <div class="sl"><div class="lab"><span>Гучність музики</span></div><input type="range" min="0" max="1" step="0.05" value="${AUD.S.mvol}" oninput="AUD.set('mvol',+this.value)"></div>
  <label class="row"><span>Спливаючі сповіщення</span><input type="checkbox" ${AUD.S.toasts ? 'checked' : ''} onchange="AUD.set('toasts',this.checked)"></label>
  <label class="row"><span>Щомісячний випуск новин</span><input type="checkbox" ${AUD.S.newscast ? 'checked' : ''} onchange="AUD.set('newscast',this.checked)"></label>
  <div class="grp">🟣 Twitch і трансляція</div>
  <div class="btns"><button class="pri" onclick="closeModal();streamMenu()">📺 Вивід на стрім (Shift+F9)</button></div>
  <div class="small mut">Одне джерело OBS з трьома режимами: весь геймплей, лише мапа, лише стрічка новин. F9 — наступний режим, Ctrl+Alt+1/2/3 — напряму.</div>
  <div class="row"><span>Канал для чату</span><input type="text" id="twCh" value="${esc(localStorage.getItem('lora_tw_channel') || (TW.S.user ? TW.S.user.login : ''))}" placeholder="${t_('назва_каналу')}" style="width:45%"></div>
  <div class="btns"><button onclick="TW.connectChat(document.getElementById('twCh').value)">${TW.S.connected ? '🟢 Перепідключити чат' : '🔌 Підключити чат'}</button><button onclick="TW.disconnectChat();closeModal()">Відключити</button></div>
  <div class="small mut">Чат читається без входу. Коли зʼявляється рішення-дилема, можна віддати вибір глядачам: вони пишуть !1, !2 або !3.</div>
  <label class="row"><span>Чат вирішує долю світу (голосування за світову подію)</span><input type="checkbox" ${AUD.S.chatChaos ? 'checked' : ''} onchange="AUD.set('chatChaos',this.checked)"></label>
  <div class="row"><span>Як часто, хвилин</span><input type="number" min="3" max="60" value="${AUD.S.chaosMin || 8}" onchange="AUD.set('chaosMin',+this.value)" style="width:70px"></div>
  <div class="row"><span>Twitch Client ID (для входу)</span><input type="text" id="twId" value="${esc(TW.cfg().id)}" placeholder="dev.twitch.tv/console" style="width:45%"></div>
  <div class="btns"><button onclick="TW.setClient(document.getElementById('twId').value);hint('✅ Збережено',1500)">Зберегти Client ID</button>${TW.S.user ? `<span class="small">Ви: <b>${esc(TW.S.user.name)}</b></span>` : `<button onclick="TW.login()">🟣 Увійти через Twitch</button>`}</div>
  <label class="row"><span>Озвучувати новини голосом (якщо браузер має голос)</span><input type="checkbox" ${AUD.S.tts ? 'checked' : ''} onchange="AUD.set('tts',this.checked)"></label>`);
}
function streamPanel() {
  const st = LORA.stream.status ? LORA.stream.status() : {};
  openModal(`<h2>📡 Інтеграція зі стрімом (заготовка)</h2><p class="small">Гра транслює події (новини, війни, дату, стан держави) у канал <code>lora</code>. Сторінка <b>overlay.html</b> показує їх як оверлей для OBS. Надалі сюди підключаться голосування чату, команди глядачів тощо — див. docs/STREAM.md.</p>
  <div class="row"><span>Локальний канал (BroadcastChannel)</span><b>${st.local ? 'увімкнено' : 'недоступний'}</b></div><div class="row"><span>WebSocket</span><b>${st.ws || 'не налаштовано'}</b></div><div class="row"><span>Подій надіслано</span><b>${st.sent || 0}</b></div>
  <div class="btns"><button onclick="closeModal()">Закрити</button></div>
  <div class="grp">🔊 Звук і сповіщення</div>
  <label class="row"><span>Звукові ефекти</span><input type="checkbox" ${AUD.S.sfx ? 'checked' : ''} onchange="AUD.set('sfx',this.checked)"></label>
  <div class="sl"><div class="lab"><span>Гучність ефектів</span></div><input type="range" min="0" max="1" step="0.05" value="${AUD.S.vol}" oninput="AUD.set('vol',+this.value)"></div>
  <label class="row"><span>Музика</span><input type="checkbox" ${AUD.S.music ? 'checked' : ''} onchange="AUD.set('music',this.checked)"></label>
  <div class="row"><span>Стиль музики</span><select onchange="AUD.set('style',this.value)"><option value="auto">Авто (за ситуацією)</option>${Object.entries(AUD.STY).map(([k, v]) => `<option value="${k}" ${AUD.S.style === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>
  <label class="row"><span>Радники з порадами</span><input type="checkbox" ${AUD.S.advisors ? 'checked' : ''} onchange="AUD.set('advisors',this.checked)"></label>
  <div class="sl"><div class="lab"><span>Гучність музики</span></div><input type="range" min="0" max="1" step="0.05" value="${AUD.S.mvol}" oninput="AUD.set('mvol',+this.value)"></div>
  <label class="row"><span>Спливаючі сповіщення</span><input type="checkbox" ${AUD.S.toasts ? 'checked' : ''} onchange="AUD.set('toasts',this.checked)"></label>
  <label class="row"><span>Щомісячний випуск новин</span><input type="checkbox" ${AUD.S.newscast ? 'checked' : ''} onchange="AUD.set('newscast',this.checked)"></label>
  <label class="row"><span>Озвучувати новини голосом (якщо браузер має голос)</span><input type="checkbox" ${AUD.S.tts ? 'checked' : ''} onchange="AUD.set('tts',this.checked)"></label>`);
}
function help() {
  const sec = (ic, t, d) => `<div class="card"><b>${ic} ${t_(t)}</b><div class="small" style="line-height:1.55">${t_(d)}</div></div>`;
  openModal(`<h2>❓ ${t_('Як грати')}</h2><div class="help-grid">
  ${sec('🗺', 'Мапа', 'Колесо — масштаб, ліва кнопка — вибір регіону чи армії, права — наказ армії рухатися (Shift+ПКМ — морем). Пробіл — пауза, 1–4 — швидкість. Туман війни: видно лише ваші й сусідні регіони, зону РЛС і те, що бачать ваші супутники.')}
  ${sec('🏛', 'Держава', 'Податки, бюджет, мобілізація, закони через парламент (фракції, коаліції, впливи), національні проєкти, цілі (🏆 у верхній панелі).')}
  ${sec('📦', 'Економіка й логістика', '14 ресурсів, ринок і торгівля. Прокладайте залізниці, автомагістралі, трубопроводи й морські лінії між портами — дешевше й швидше постачання.')}
  ${sec('🏗', 'Будівництво й дослідження', '79 типів будівель (енергетика, промисловість, оборонка, інтернет, космос). Дослідження відкривають будівлі, моделі техніки й нові можливості.')}
  ${sec('🪖', 'Армія', 'Оберіть армію на мапі: праворуч — склад військ (кнопка «Змінити склад» — повзунки піхоти, танків, артилерії, ППО…), командувач, досвід. Вкладка «Армія»: авіація, флот, моделі техніки, генерали, полонені й легіон, арсенал, удари (ракети, дрони, КАБ, бомбардування, кібератаки).')}
  ${sec('🌐', 'Дипломатія', 'Відносини, угоди, союзи, блоки (НАТО, ЄС…), санкції, мир. Багато дій можливі лише під час візиту вашого лідера (зірка на мапі) або з дипломатом-агентом у країні. Шпигуни — розвідка, диверсії, викрадення технологій.')}
  ${sec('🛰', 'Розвідка й космос', 'Супутники (розвідка, звʼязок, навігація, раннє попередження), запуски, космічні програми, оренда розвідданих, інтернет і РЛС.')}
  ${sec('📺', 'Стрім і онлайн', 'Хост відкриває кімнату й роздає посилання; гравці обирають держави, глядачі дивляться без туману. Вивід на стрім: F9, Ctrl+Alt+1/2/3. Чат Twitch голосує за рішення.')}
  </div><div class="btns"><button class="pri" onclick="closeModal()">${t_('Зрозуміло')}</button></div>`);
}
function saveGame() { try { localStorage.setItem('lora_save', G.save()); hint('💾 Гру збережено', 2000); } catch (e) { hint('⚠ Не вдалося зберегти', 3000); } }
function autosave() { try { localStorage.setItem('lora_auto', G.save()); } catch (e) { } }
function loadGame() {
  let s = null; try { s = localStorage.getItem('lora_save') || localStorage.getItem('lora_auto'); } catch (e) { }
  if (!s) { hint('Збережень не знайдено', 2500); return false; }
  try { const o = JSON.parse(s); G = LORA.createGame({ seed: Date.now() % 1e9 }); G.init(G.N[o.player].a3, 'peace'); G.load(s); } catch (e) { hint('⚠ Збереження несумісне з цією версією', 3000); return false; }
  $('#start').style.display = 'none'; startUI(); return true;
}
