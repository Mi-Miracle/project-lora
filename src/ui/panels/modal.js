// ВІКНА: меню, довідка, пропозиції миру, кінець гри, збереження.
function openModal(h) { $('#mbox').innerHTML = h; $('#modal').style.display = 'flex'; modalOpen = true; }
function closeModal() { $('#modal').style.display = 'none'; modalOpen = false; $('#mbox').classList.remove('wide'); }
function checkPopups() {
  if (modalOpen) return;
  if (G.gameOver) { openModal(`<h2>${G.gameOver.win ? '🏆 ' + t_('Перемога') : '☠ ' + t_('Кінець гри')}</h2><p>${esc(t_(G.gameOver.text))}</p><p class="mut">${G.dateStr()} · ${t_('день')} ${G.day}</p><div class="btns">${G.gameOver.cont ? `<button class="pri" onclick="G.gameOver=null;closeModal()">▶ ${t_('Продовжити гру')}</button>` : ''}<button class="${G.gameOver.cont ? '' : 'pri'}" onclick="location.reload()">${t_('Нова гра')}</button></div>`); return; }
  const pi = G.pendingPeace.findIndex(p => p.to == null || p.to === G.player); if (pi < 0) return;
  const p = G.pendingPeace[pi], f = nat(p.from); let t = '';
  if (String(p.type).startsWith('i_') && G.INTER) { const A = G.INTER[p.type.slice(2)] || {}; t = `<h2>${A.ic || '✉'} ${esc(t_(A.n || p.type))}</h2><p>${esc(f.name)} ${t_('пропонує вам')}: <b>${esc(t_(A.n || ''))}</b></p><p class="mut">${esc(t_(A.d || ''))}</p>`; }
  else if (String(p.type).startsWith('h_')) { const K = { h_alliance: '🛡 Союз', h_treaty: '📑 Торговельна угода', h_access: '🛂 Військовий доступ', h_peace: '🕊 Мир', h_requestAid: '📦 Прохання про допомогу' }; t = `<h2>${K[p.type] || p.type}</h2><p>${t_('Гравець')} <b>${esc(f.name)}</b> ${t_('пропонує вам')}: ${K[p.type] || ''}${p.ptype ? ' (' + esc(p.ptype) + ')' : ''}.</p>`; }
  else   if (p.type === 'ally_call') t = `<h2>🛡 Союзник просить допомоги</h2><p>${esc(f.name)} зазнала нападу з боку ${esc(nat(p.vs).name)} і закликає вас виконати союзні зобов'язання.</p><p class="mut">Відмова сильно погіршить відносини з союзником.</p>`;
  else if (p.type === 'cede_to_ai') t = `<h2>📜 Ультиматум</h2><p>${esc(f.name)} пропонує мир за умови, що ви поступитеся всіма регіонами, які вона контролює.</p>`;
  else if (p.type === 'cede') t = `<h2>📜 Капітуляційні умови</h2><p>${esc(f.name)} пропонує мир і готова віддати вам усі контрольовані вами регіони.</p>`;
  else if (p.type === 'mutual') t = `<h2>⚖ Заморожування фронту</h2><p>${esc(f.name)} пропонує мир по лінії фронту: кожна сторона назавжди залишає собі те, що зараз контролює. Окуповані регіони буде втрачено.</p>`;
  else t = `<h2>🕊 Пропозиція миру</h2><p>${esc(f.name)} пропонує білий мир: усі окуповані регіони повертаються власникам.</p>`;
  setSpeed(0);
  openModal(t + `<div class="btns"><button class="pri" onclick="G.act.answerPending(${pi},true);closeModal();mapDirty=true;renderTab(true)">Погодитись</button><button onclick="G.act.answerPending(${pi},false);closeModal()">Відхилити</button></div>`);
}
function menu() { if (typeof pauseMenu === 'function') { pauseMenu(true); return; }
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
  <label class="row"><span>${t_('Заставка при запуску')}</span><input type="checkbox" ${localStorage.getItem('lora_intro') === 'off' ? '' : 'checked'} onchange="localStorage.setItem('lora_intro',this.checked?'on':'off')"></label>
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
  <label class="row"><span>Озвучувати новини голосом (якщо браузер має голос)</span><input type="checkbox" ${AUD.S.tts ? 'checked' : ''} onchange="AUD.set('tts',this.checked)"></label><div id="voiceBox">${voiceSettings()}</div>`);
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
  <label class="row"><span>${t_('Заставка при запуску')}</span><input type="checkbox" ${localStorage.getItem('lora_intro') === 'off' ? '' : 'checked'} onchange="localStorage.setItem('lora_intro',this.checked?'on':'off')"></label>
  <label class="row"><span>Щомісячний випуск новин</span><input type="checkbox" ${AUD.S.newscast ? 'checked' : ''} onchange="AUD.set('newscast',this.checked)"></label>
  <label class="row"><span>Озвучувати новини голосом (якщо браузер має голос)</span><input type="checkbox" ${AUD.S.tts ? 'checked' : ''} onchange="AUD.set('tts',this.checked)"></label><div id="voiceBox">${voiceSettings()}</div>`);
}
function help() {
  const sec = (ic, t, d) => `<div class="card"><b>${ic} ${t_(t)}</b><div class="small" style="line-height:1.55">${t_(d)}</div></div>`;
  const nB = Object.keys(D.buildings).length, nT = Object.keys(D.techs).length;
  openModal(`<h2>❓ ${t_('Як грати')}</h2><div class="small mut">${t_('Будівель')}: ${nB} · ${t_('технологій')}: ${nT} · ${t_('компаній')}: ${D.companies.length}</div><div class="help-grid">
  ${sec('🗺', 'Мапа й час', 'Колесо — масштаб, ліва кнопка — вибір регіону, міста чи армії, права — меню дій для регіону (подорож, заклад, маршрут, будівництво), а з обраною армією — наказ рухатися (Shift+ПКМ — морем). Пробіл — стоп/старт, 1–4 — швидкість, Esc — пауза й меню. Туман війни ховає чужі війська поза розвідкою.')}
  ${sec('🎭', 'Ким грати', 'Персонаж (робота, навички, підробітки, розкіш, інвестиції) → партія і депутатство → власна компанія → президент. Почати можна з будь-якого етапу на екрані «Нова гра». Карʼєра — у вкладці «Карʼєра» розділу «Персонаж».')}
  ${sec('🧭', 'Меню', 'Унизу — панель розділів: 🧑 Персонаж, 💼 Робота, 🏢 Бізнес, 🏛 Держава, 🌐 Світ і пошук (клавіша /). Ліворуч — вкладки обраного розділу. Повторний клік по розділу ховає панель. 🛠 вгорі — мод-панель для тестування (F9).')}
  ${sec('🏪', 'Своя справа', 'Фонд від $50 тис., бізнес-план, допомогу здобувають у місті (банк, ЦНАП, IT-хаб, парк, ТБ), далі офіс, виробництво й команда. Після відкриття: заклади, розробки, 🔬 дослідження, 📋 можливості, 👥 команда й ринок (персонал, конкуренти, постачання, податки) і 📈 біржа часток.')}
  ${sec('👔', 'Міністри', 'Ліва панель: на кожній вкладці держави — картка міністра галузі. Дії: нарада, премія, перевірка, звільнення, а також свої дії галузі. Галочка «🤖 Авто» передає галузь ШІ-міністру.')}
  ${sec('📜', 'Доручення', 'Кнопка 📜 вгорі: завжди три завдання з терміном і нагородою — для держави, компанії й персонажа. Невдале можна замінити.')}
  ${sec('📦', 'Економіка й ринок', 'Світовий ринок замкнений: продаєте лише тим, хто купує, а все, чого бракує, треба видобути або купити. Логістика (залізниці, траси, трубопроводи, морські лінії) здешевлює торгівлю.')}
  ${sec('🏗', 'Будівництво й дослідження', 'Вкладайте гроші у сфери науки — отримуєте бали цієї сфери, за які досліджуєте технології й грейди. Технології відкривають будівлі, моделі техніки й нові можливості компаній.')}
  ${sec('🏢', 'Компанії й біржа', 'Компанія: активи, R&D, контракти з державами, тендери за кордоном, охорона, стратегія. Біржа: акції, емісія, викуп, контроль від 50%, дивіденди, бульбашки й паніки.')}
  ${sec('🎖', 'Армія', 'Оберіть армію: склад військ, командувач, досвід. Типи: піхота, танки, артилерія, ППО, дрони, інженери. Удари ракетами й дронами — по ворожих військах і постачанню, також на вашій окупованій землі.')}
  ${sec('🌐', 'Дипломатія й розвідка', 'Відносини, угоди, союзи, блоки, санкції, мир. Візити лідера, шпигуни, супутники, космос.')}
  ${sec('🏛', 'Парламент', 'Закони через фракції й коаліції. У режимі «Президент і Рада» парламентом є чат Twitch: !1 — за, !2 — проти.')}
  ${sec('📺', 'Онлайн і стрім', 'Хост відкриває кімнату й роздає посилання; гравці обирають державу, компанію чи персонажа, або стають генералом/міністром у іншого гравця. Вивід на стрім: F9, Ctrl+Alt+1/2/3.')}
  ${sec('⌨', 'Гарячі клавіші', 'Esc — пауза · Пробіл — час · 1–4 — швидкість · Alt+1–8 — вкладки · L — до лідера · F9 — стрім · F11 — повний екран · Ctrl+F5 — перезапуск.')}
  </div><div class="btns"><button class="pri" onclick="closeModal()">${t_('Зрозуміло')}</button></div>`);
  $('#mbox').classList.add('wide');
}
function saveGame() { try { localStorage.setItem('lora_save', G.save()); hint('💾 Гру збережено', 2000); } catch (e) { hint('⚠ Не вдалося зберегти', 3000); } }
function autosave() { try { localStorage.setItem('lora_auto', G.save()); } catch (e) { } }
function loadGame() {
  let s = null; try { s = localStorage.getItem('lora_save') || localStorage.getItem('lora_auto'); } catch (e) { }
  if (!s) { hint('Збережень не знайдено', 2500); return false; }
  try { const o = JSON.parse(s); G = LORA.createGame({ seed: Date.now() % 1e9 }); G.init(G.N[o.player].a3, 'peace'); G.load(s); } catch (e) { hint('⚠ Збереження несумісне з цією версією', 3000); return false; }
  $('#start').style.display = 'none'; startUI(); return true;
}

// налаштування голосу: вибір системного голосу, швидкість, тон; що озвучувати
function voiceSettings() {
  const I = AUD.voiceInfo(), V = AUD.voices().filter(v => AUD.S.vAnyLang || /^(uk|en)/i.test(v.lang)), E = VOICE.state(), S = AUD.S;
  const ENG = [['auto', 'Авто'], ['piper', 'Piper — живий офлайн-голос (укр)'], ['system', 'Системні голоси'], ['espeak', 'eSpeak NG (офлайн)'], ['azure', 'Azure — Поліна/Остап (ваш ключ)'], ['eleven', 'ElevenLabs (ваш ключ)']];
  const inp = (k, ph, w) => `<input type="${/Key$/.test(k) ? 'password' : 'text'}" value="${esc(S[k] || '')}" placeholder="${esc(ph)}" style="width:${w || 55}%" onchange="AUD.set('${k}',this.value.trim());voiceRefresh()">`;
  return `<div class="grp">🗣 ${t_('Озвучка')}</div>
  <div class="row"><span>${t_('Рушій')}</span><select onchange="AUD.set('engine',this.value);voiceRefresh()">${ENG.map(([k, n]) => `<option value="${k}" ${(S.engine || 'auto') === k ? 'selected' : ''}>${t_(n)}</option>`).join('')}</select></div>
  <div class="small ${I.engine ? 'g' : 'y'}">${I.engine ? t_('Зараз говорить') + ': <b>' + esc({ system: t_('системний голос') + ' ' + I.cur, espeak: 'eSpeak NG', azure: 'Azure Speech', eleven: 'ElevenLabs' }[I.engine]) + '</b>' : t_('Немає доступного голосу для цієї мови — оберіть рушій нижче')}${I.err ? ' · <span class="r">' + esc(I.err) + '</span>' : ''}</div>
  <div class="small mut">${t_('Голосів у системі')}: ${I.all} · ${t_('українських')}: ${I.uk} · ${t_('англійських')}: ${I.en}</div>
  <div class="card small"><b>🎧 Piper — ${t_('живий нейронний голос без інтернету (українська)')}</b><div class="mut">${t_('Модель «ukrainian_tts» (датасет CC0, 3 голоси). Один раз завантажується (~80 МБ) з GitHub або HuggingFace і зберігається на компʼютері; далі працює офлайн. Рушій onnxruntime-web (MIT) уже в грі.')}</div>
    <div class="row"><span>${E.ps === 'ready' ? '✅ ' + t_('Встановлено') : E.ps === 'loading' ? '⏳ ' + t_('Завантаження') + ' ' + Math.round(E.pprog * 100) + '%' + (E.pprog > 0.6 && E.pprog < 0.9 ? ' (' + t_('розпаковую') + ')' : '') : E.ps === 'error' ? '⚠ ' + esc(E.perr) : t_('Не встановлено')}</span><button onclick="voicePiper()" ${E.ps === 'loading' ? 'disabled' : ''}>${E.ps === 'ready' ? t_('Увімкнено') : t_('Завантажити й увімкнути')}</button></div>
    <div class="row"><span>${t_('Голос')}</span><select onchange="AUD.set('piperSpk',+this.value);AUD.speak(t_('Привіт! Я ваш диктор новин.'))">${[['0', 'Лада'], ['1', 'Микита'], ['2', 'Тетяна']].map(([k, n]) => `<option value="${k}" ${String(S.piperSpk || 0) === k ? 'selected' : ''}>${t_(n)}</option>`).join('')}</select></div></div>
  <div class="card small"><b>🖥 eSpeak NG — ${t_('офлайн, українська й англійська')}</b><div class="mut">${t_('Роботизований, але працює без інтернету. Не входить до гри: за вашою командою завантажується (~9 МБ) з публічного реєстру npm, перевіряється й зберігається локально. Ліцензія GPL-3.0, код:')} github.com/espeak-ng/espeak-ng</div>
    <div class="row"><span>${E.es === 'ready' ? '✅ ' + t_('Встановлено') : E.es === 'loading' ? '⏳ ' + t_('Завантаження') + ' ' + Math.round(E.prog * 100) + '%' : E.es === 'error' ? '⚠ ' + esc(E.err) : t_('Не встановлено')}</span><button onclick="voiceEsp()" ${E.es === 'loading' ? 'disabled' : ''}>${E.es === 'ready' ? t_('Увімкнено') : t_('Завантажити й увімкнути')}</button></div></div>
  <div class="card small"><b>☁ Microsoft Azure Speech — ${t_('живі нейронні голоси (Поліна, Остап)')}</b><div class="mut">${t_('Офіційний сервіс за вашим власним ключем: portal.azure.com → Speech service → «Keys and Endpoint». Безкоштовний тариф F0 — 0,5 млн символів на місяць. Ключ зберігається лише на цьому компʼютері.')}</div>
    <div class="row"><span>${t_('Ключ')}</span>${inp('azKey', 'Azure key')}</div><div class="row"><span>${t_('Регіон')}</span>${inp('azRegion', 'westeurope')}</div>
    <div class="row"><span>${t_('Голос (укр)')}</span><select onchange="AUD.set('azVoice',this.value)">${['uk-UA-PolinaNeural', 'uk-UA-OstapNeural'].map(v => `<option ${S.azVoice === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="row"><span>${t_('Голос (англ)')}</span><select onchange="AUD.set('azVoiceEn',this.value)">${['en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-GB-SoniaNeural', 'en-GB-RyanNeural'].map(v => `<option ${S.azVoiceEn === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
  <div class="card small"><b>🎙 ElevenLabs — ${t_('найживіші багатомовні голоси')}</b><div class="mut">${t_('Офіційний сервіс за вашим ключем (elevenlabs.io → Profile → API key). Безкоштовний тариф має місячний ліміт символів. Voice ID — з бібліотеки голосів.')}</div>
    <div class="row"><span>${t_('Ключ')}</span>${inp('elKey', 'xi-api-key')}</div><div class="row"><span>Voice ID</span>${inp('elVoice', 'EXAVITQu4vr4xnSDxMaL')}</div></div>
  <div class="row"><span>${t_('Системний голос')}</span><select onchange="AUD.set('voice',this.value)"><option value="">${t_('Авто')}</option>${V.map(v => `<option value="${esc(v.name)}" ${S.voice === v.name ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select></div>
  <div class="sl"><div class="lab"><span>${t_('Гучність голосу')}</span><b>${Math.round((S.voiceVol != null ? S.voiceVol : 0.9) * 100)}%</b></div><input type="range" min="0" max="1" step="0.05" value="${S.voiceVol != null ? S.voiceVol : 0.9}" onchange="AUD.set('voiceVol',+this.value)"></div>
  <div class="sl"><div class="lab"><span>${t_('Швидкість мовлення')}</span><b>${(S.vrate || 1).toFixed(2)}</b></div><input type="range" min="0.6" max="1.6" step="0.05" value="${S.vrate || 1.03}" onchange="AUD.set('vrate',+this.value)"></div>
  <div class="sl"><div class="lab"><span>${t_('Тон голосу')}</span><b>${(S.vpitch || 1).toFixed(2)}</b></div><input type="range" min="0.5" max="1.6" step="0.05" value="${S.vpitch || 1}" onchange="AUD.set('vpitch',+this.value)"></div>
  <label class="row"><span>${t_('Озвучувати важливі події (війни, вибори, катастрофи)')}</span><input type="checkbox" ${S.vEvents ? 'checked' : ''} onchange="AUD.set('vEvents',this.checked)"></label>
  <label class="row"><span>${t_('Озвучувати поради радників')}</span><input type="checkbox" ${S.vAdv ? 'checked' : ''} onchange="AUD.set('vAdv',this.checked)"></label>
  <label class="row"><span>${t_('Читати будь-яким доступним голосом, якщо немає потрібної мови')}</span><input type="checkbox" ${S.vAnyLang ? 'checked' : ''} onchange="AUD.set('vAnyLang',this.checked)"></label>
  <div class="btns"><button onclick="AUD.speak(t_('Перевірка голосу. Проєкт Лора: світ чекає на ваші рішення.'))">🔊 ${t_('Перевірити голос')}</button></div>`;
}
function voiceRefresh() { const el = document.getElementById('voiceBox'); if (el) el.innerHTML = voiceSettings(); }
function voicePiper() { AUD.set('piper', true); if (!AUD.S.engine || AUD.S.engine === 'system' || AUD.S.engine === 'espeak') AUD.set('engine', 'auto'); const t = setInterval(voiceRefresh, 500);
  VOICE.piperInstall().then(() => { clearInterval(t); voiceRefresh(); hint('✅ Piper', 2000); AUD.speak(t_('Голос встановлено. Слава Україні!')); }, e => { clearInterval(t); voiceRefresh(); hint('⚠ ' + e.message, 5000); }); voiceRefresh(); }
function voiceEsp() { AUD.set('espeak', true); if (!AUD.S.engine || AUD.S.engine === 'system') AUD.set('engine', 'auto'); const t = setInterval(voiceRefresh, 400);
  VOICE.esInstall().then(() => { clearInterval(t); voiceRefresh(); hint('✅ eSpeak NG', 2000); AUD.speak(t_('Голос встановлено.')); }, e => { clearInterval(t); voiceRefresh(); hint('⚠ ' + e.message, 4000); }); voiceRefresh(); }
if (window.speechSynthesis) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { }; } catch (e) { }

if (AUD.S.espeak) setTimeout(() => VOICE.esInstall().catch(() => { }), 3000);
if (AUD.S.piper) setTimeout(() => caches.open('lora-voice-v1').then(c => c.match(location.href.replace(/[^/]*([?#].*)?$/, '') + '__cache/piper/uk.onnx')).then(m => { if (m) VOICE.piperInstall().catch(() => { }); }).catch(() => { }), 4000);
