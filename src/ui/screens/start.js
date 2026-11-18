// СТАРТОВИЙ ЕКРАН: сценарій, складність, режим (держава / компанія), вибір країни, налаштування компанії.
let chName = '', chType = 'diplomat'; const CHAR_T = { diplomat: { n: 'Дипломат', ic: '🎩', d: 'Зв\'язки з елітами ростуть удвічі швидше' }, tycoon: { n: 'Бізнесмен', ic: '💼', d: 'Більше грошей з консультацій і угод' }, star: { n: 'Медійна зірка', ic: '🎤', d: 'Популярність серед виборців росте вдвічі швидше' }, general: { n: 'Генерал у відставці', ic: '🎖', d: 'Повага у країнах, що воюють: звʼязки й популярність там ×2' } };
let startSel = 'UKR', scen = 'war2026', startDiff = 'normal', startMode = 'nation', coSector = 'tech', coName = '', coBudget = null;
let startTab = 'game';
const START_AS = [['char', '🧑', 'Персонаж', 'Почніть із нуля: робота, навчання, звʼязки, популярність. Далі — партія, депутатство, власна компанія і президентство.'], ['party', '🎗', 'Лідер партії', 'Ви очолюєте молоду партію: осередки, спонсори, мітинги, дебати, вибори до парламенту, коаліція і закони.'], ['mp', '🏛', 'Депутат', 'Ви вже депутат парламенту зі своєю партією: голосуйте, вносьте закони, набирайте вплив для президентських виборів.'], ['company', '🏢', 'Компанія (власник)', 'Ви — власник корпорації: виробництво, тендери, R&D, торгівля й вплив на уряди. Як персонаж можете балотуватися, виступати, вступати в партію.'], ['nation', '👑', 'Президент (держава)', 'Класична гра за державу: економіка, армія, дипломатія.']];
function startScreen() {
  if (!window._themed) { window._themed = 1; setTimeout(() => applyTheme(startSel), 0); }
  if (!window._startList) { const tmp = LORA.createGame({ seed: 1 }); tmp.aggregate();
    window._startList = tmp.N.filter(n => n.alive && n.agg.gdpPot > 0.5).sort((a, b) => b.agg.gdpPot - a.agg.gdpPot).map(n => ({ a3: n.a3, col: n.color, name: n.name, gdp: n.agg.gdpPot, pop: n.agg.pop, tr: n.troopsBase, nk: n.nuke, nT: n.agg.nT })); }
  let hasSave = false; try { hasSave = !!(localStorage.getItem('lora_save') || localStorage.getItem('lora_auto')); } catch (e) { }
  const join = netMode === 'guest' || netMode === 'watch', host = netMode === 'host';
  if (join) startTab = 'game'; if (!host && startTab === 'online') startTab = 'game';
  const MAIN = [['single', '🎮', 'Одиночна гра', 'персонаж, депутат, компанія чи президент проти ШІ'], ['multi', '🌐', 'Мультиплеєр', 'хост, гравець або глядач'], ['rada', '🏛', 'Президент і Рада', 'ви — президент, чат Twitch — парламент']];
  const mainOn = k => k === 'rada' ? netMode === 'solo' && startMode === 'rada' : k === 'single' ? netMode === 'solo' && startMode !== 'rada' : netMode !== 'solo';
  const MULTI = [['host', '📡', 'Створити гру (хост)', 'роздати посилання гравцям'], ['guest', '🔗', 'Приєднатися гравцем', 'за кодом або посиланням'], ['watch', '👁', 'Дивитися гру', 'гість-глядач без керування']];
  const TABS = join ? [] : [['game', '🎮', 'Гра'], ['twitch', '🟣', 'Twitch'], ...(host ? [['online', '📡', 'Онлайн і посилання']] : []), ['stream', '📺', 'Стрім і звук']];
  const MOD = $('#start').classList.contains('modern'); const TABS2 = MOD ? TABS.filter(x => x[0] === 'game' || x[0] === 'online' || (x[0] === 'twitch' && startMode === 'rada')) : TABS; if (MOD && !TABS2.some(x => x[0] === startTab)) startTab = 'game';
  $('#sbox').innerHTML = `${MOD ? modHead() : `<div class="st-head"><h1>${pxi('dipl', 1)} L.O.R.A. <small class="mut">v${LORA.version}</small></h1><div class="btns" style="margin:0">${twBadge()}${langSwitch()}</div></div>`}
  ${MOD ? '' : `<div class="feat"><div>${pxi('world', 1)}<span><b>${D.regions.length} ${t_('регіонів')}</b> · ${D.cities.length} ${t_('міст')}</span></div><div>${pxi('factory', 1)}<span><b>${Object.keys(D.buildings).length} ${t_('типів будівель')}</b> · ${Object.keys(D.techs).length} ${t_('технологій')}</span></div><div>${pxi('co', 1)}<span><b>${D.companies.length} ${t_('корпорацій')}</b> ${t_('зі своїми ШІ')}</span></div><div>${pxi('army', 1)}<span><b>${t_('ШІ-агенти')}</b> ${t_('для кожної держави + режисер світу')}</span></div></div>`}
  ${MOD ? '' : `<div class="modeSel main3">${MAIN.map(([k, ic, n, d]) => `<button class="${mainOn(k) ? 'on' : ''}${k === 'rada' ? ' rada-m' : ''}" onclick="${k === 'rada' ? "netMode='solo';startMode='rada';startTab='game';" : k === 'single' ? "netMode='solo';if(startMode==='rada')startMode='nation';" : "if(netMode==='solo')netMode='host';if(startMode==='rada')startMode='nation';"}startScreen()">${ico(ic)} ${t_(n)}<span>${t_(d)}</span></button>`).join('')}</div>`}
  ${netMode !== 'solo' && !MOD ? `<div class="modeSel sub3">${MULTI.map(([k, ic, n, d]) => `<button class="${netMode === k ? 'on' : ''}" onclick="netMode='${k}';startScreen()">${ico(ic)} ${t_(n)}<span>${t_(d)}</span></button>`).join('')}</div>` : ''}
  ${TABS2.length > 1 ? `<div class="st-tabs">${TABS2.map(([k, ic, n]) => `<button class="${startTab === k ? 'on' : ''}" onclick="startTab='${k}';startScreen()">${ico(ic)} ${t_(n)}</button>`).join('')}</div>` : ''}
  <div class="st-body">${join ? joinBlock() : startTab === 'twitch' ? twitchBlock() : startTab === 'online' ? onlineBlock() : startTab === 'stream' ? streamBlock() : gameBlock()}</div>
  <div class="btns st-foot"><div class="btns" style="margin:0">${join ? '' : host ? `<button class="pri big" onclick="hostOpen()">📡 ${t_('Відкрити кімнату')}</button>` : `<button class="pri big" onclick="startGame()">▶ ${t_('Почати гру')}</button>`}${hasSave && !join ? `<button onclick="loadGame()">📂 ${t_('Продовжити збереження')}</button>` : ''}</div><button onclick="help()">❓ ${t_('Як грати')}</button></div>`;
  if (!join && startTab === 'game') renderClist('');
}
function twBadge() { return TW.S.user ? `<span class="tw-u"><img src="${esc(TW.S.user.avatar)}" alt="">${esc(TW.S.user.name)}</span>` : `<button class="tw-b" onclick="startTab='twitch';startScreen()">🟣 ${t_('Twitch')}</button>`; }
function gameBlock() {
  const DF = D.difficulty, SEC = D.companySectors, host = netMode === 'host';
  return `<div class="st-grid"><div>
  <h3>${t_('Сценарій')}</h3><div class="btns">${Object.entries(D.scenarios).map(([k, v]) => `<button class="${scen === k ? 'on' : ''}" onclick="scen='${k}';startScreen()">${esc(t_(v.name))}</button>`).join('')}</div>
  <h3>${t_('Складність')}</h3><div class="btns">${Object.entries(DF).map(([k, v]) => `<button class="${startDiff === k ? 'on' : ''}" data-tip="${esc(t_(v.d))}" onclick="startDiff='${k}';coBudget=null;startScreen()">${esc(t_(v.n))}</button>`).join('')}</div><div class="small mut">${esc(t_(DF[startDiff].d))}</div>
  <label class="row"><span>🌫 ${t_('Туман війни')} <span class="small mut">${t_('(глядачі й вивід на стрім — без туману)')}</span></span><input type="checkbox" ${LORA.config.fog !== false ? 'checked' : ''} onchange="LORA.config.fog=this.checked;try{localStorage.setItem('lora_fog',this.checked?'1':'0')}catch(e){}"></label>
  ${startMode === 'rada' ? '' : `<h3>${t_(host ? 'Ви (хост) граєте як' : 'Почати як')}</h3><div class="btns">${START_AS.map(([k, ic, n]) => `<button class="${startMode === k ? 'on' : ''}" onclick="startMode='${k}';startScreen()">${ico(ic)} ${t_(n)}</button>`).join('')}</div><div class="small mut">${t_((START_AS.find(x => x[0] === startMode) || START_AS[4])[3])}</div>`}
  ${startMode === 'rada' && !host ? radaStartBlock() : ''}
  ${(startMode === 'company') ? `<div class="card"><div class="row"><span>${t_('Назва компанії')}</span><input type="text" id="coname" value="${esc(coName)}" placeholder="${t_('Моя компанія')}" oninput="coName=this.value" style="width:55%"></div>
    <div class="small mut" style="margin-top:6px">${t_('Галузь')}</div><div class="btns">${Object.entries(SEC).map(([k, v]) => `<button class="${coSector === k ? 'on' : ''}" data-tip="${esc(t_(v.d))}" onclick="coSector='${k}';startScreen()">${ico(v.ic)} ${esc(t_(v.n))}</button>`).join('')}</div>
    <div class="small mut">${esc(t_(SEC[coSector].d))}</div><div class="row"><span>${t_('Стартовий капітал')}</span><b>${money(LORA.config.companyCash)}</b></div>
    <div class="small mut">${t_('Штаб-офіс буде у столиці обраної країни. Мета — вирости, набрати вплив і перебрати владу в державі.')}</div></div>` : ''}
  ${(startMode === 'char' || startMode === 'mp' || startMode === 'party' || startMode === 'company') ? `<div class="card"><div class="row"><span>${t_('Імʼя персонажа')}</span><input type="text" value="${esc(chName)}" placeholder="${t_('Олена Коваль')}" oninput="chName=this.value" style="width:55%"></div>
    <div class="small mut" style="margin-top:6px">${t_('Хто ви')}</div><div class="btns">${Object.entries(CHAR_T).map(([k, v]) => `<button class="${chType === k ? 'on' : ''}" onclick="chType='${k}';startScreen()">${ico(v.ic)} ${esc(t_(v.n))}</button>`).join('')}</div>
    <div class="small mut">${esc(t_(CHAR_T[chType].d))}. ${t_('Ви не керуєте ні державою, ні компанією: подорожуйте, здобувайте звʼязки й популярність, заробляйте на посередництві — і виграйте вибори, щоб очолити країну.')}</div></div>` : ''}
  </div><div>
  <h3>${startMode === 'company' ? t_('Країна штаб-офісу') : /char|mp|party/.test(startMode) ? t_('Країна, де ви починаєте') : t_('Оберіть державу')}</h3><input type="text" id="csearch" placeholder="${t_('Пошук країни…')}" style="width:100%" oninput="renderClist(this.value)"><div id="clist"></div>
  </div></div>`;
}
function twitchBlock() {
  const c = TW.cfg();
  return `<div class="st-grid"><div><h3>🟣 ${t_('Обліковий запис')}</h3>
  ${TW.S.user ? `<div class="card"><div class="row"><span class="tw-u"><img src="${esc(TW.S.user.avatar)}" alt="">${esc(TW.S.user.name)}</span><button onclick="TW.logout()">${t_('Вийти')}</button></div><div class="small mut">${t_('Ваш нік і аватарка показуються в лобі, у списку гравців і на стрімі.')}</div></div>`
    : `<div class="card"><button class="tw-b big" onclick="TW.login()">🟣 ${t_('Увійти через Twitch')}</button><div class="small mut">${t_('Потрібен Client ID застосунку Twitch (dev.twitch.tv → Applications) з адресою перенаправлення, як нижче. Токен не зберігається.')}</div></div>`}
  <div class="card"><div class="row"><span>Client ID</span><input type="text" value="${esc(c.id)}" placeholder="abc123…" onchange="TW.setClient(this.value)" style="width:60%"></div><div class="row"><span>Redirect URL</span><input type="text" value="${esc(c.redirect)}" onchange="TW.setClient(TW.cfg().id,this.value)" style="width:60%"></div></div>
  </div><div><h3>💬 ${t_('Чат каналу')}</h3>
  <div class="card"><div class="row"><span>${t_('Канал')}</span><input type="text" id="twCh" value="${esc(TW.S.channel || localStorage.getItem('lora_tw_channel') || (TW.S.user ? TW.S.user.login : ''))}" placeholder="${t_('назва_каналу')}" style="width:50%"><button onclick="TW.connectChat(document.getElementById('twCh').value);setTimeout(startScreen,1500)">${TW.S.connected ? '✓ ' + t_('Підключено') : t_('Підключити')}</button></div>
  <div class="small mut">${t_('Читання чату без входу: голосування глядачів командами !1, !2, !3…')}</div></div>
  <label class="row"><span>${t_('Чат голосує за рішення в кризах (дилеми)')}</span><input type="checkbox" ${AUD.S.chatVotes !== false ? 'checked' : ''} onchange="AUD.set('chatVotes',this.checked)"></label>
  <label class="row"><span>${t_('Команди глядачів: !допомога, !генерал, !шпигун, !дрон')}</span><input type="checkbox" ${AUD.S.chatCmds !== false ? 'checked' : ''} onchange="AUD.set('chatCmds',this.checked)"></label>
  <label class="row"><span>${t_('Чат вирішує долю світу (голосування за світову подію)')}</span><input type="checkbox" ${AUD.S.chatChaos ? 'checked' : ''} onchange="AUD.set('chatChaos',this.checked)"></label>
  <div class="row"><span>${t_('Як часто, хвилин')}</span><input type="number" min="3" max="60" value="${AUD.S.chaosMin || 8}" onchange="AUD.set('chaosMin',+this.value)" style="width:70px"></div>
  <div class="card" style="border-color:#7a5cff"><label class="row"><span>🏛 <b>${t_('Режим «Президент і Рада»')}</b> <span class="mut small">(${t_('для онлайн-хоста; в одиночній грі — плитка на головному меню')})</span></span><input type="checkbox" ${AUD.S.chatRada ? 'checked' : ''} onchange="AUD.set('chatRada',this.checked)"></label>
  <div class="small mut">${t_('Стрімер — президент, чат — Верховна Рада. Ваші закони (податки, бюджет, мобілізація, війна) ухвалює чат: !1 — за, !2 — проти. Глядачі-депутати вносять власні законопроєкти, а ви підписуєте або ветуєте їх. Довіра чату впливає на стабільність.')}</div>
  <div class="row"><span>${t_('Ініціативи депутатів раз на, хвилин')}</span><input type="number" min="2" max="60" value="${AUD.S.radaMin || 6}" onchange="AUD.set('radaMin',+this.value)" style="width:70px"></div>
  <div class="row"><span>${t_('Час на голосування, секунд')}</span><input type="number" min="20" max="180" value="${AUD.S.radaSec || 60}" onchange="AUD.set('radaSec',+this.value)" style="width:70px"></div></div></div></div>`;
}
function linkRow(label, url, tip) { return `<div class="linkrow" data-tip="${esc(tip || '')}"><span>${label}</span><input readonly value="${esc(url)}" onclick="this.select()"><button onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(url)}');hint('📋 ${t_('Скопійовано')}',1200)">📋</button></div>`; }
function roomLinks(code) {
  const base = location.href.split('?')[0].split('#')[0];
  return `${linkRow('🔗 ' + t_('Для гравців'), `${base}?join=${code}`, t_('Глядач відкриває посилання й обирає державу'))}${linkRow('👁 ' + t_('Для глядачів'), `${base}?watch=${code}`, t_('Перегляд без керування й без туману війни'))}${linkRow('📺 ' + t_('Джерело OBS «Браузер»'), `${base}?watch=${code}&obs=1`, t_('1920×1080; перемикається між режимами виводу клавішами F9 / Ctrl+Alt+1/2/3 у грі хоста'))}`;
}
function onlineBlock() {
  return `<div class="st-grid"><div><h3>📡 ${t_('Кімната')}</h3>
  <div class="card"><div class="row"><span>${t_('Ваше імʼя (нік)')}</span><input type="text" value="${esc(netName || (TW.S.user ? TW.S.user.name : ''))}" oninput="netName=this.value" placeholder="Streamer" style="width:55%"></div>
  <div class="row"><span>${t_('Максимум гравців')}</span><input type="number" min="2" max="40" value="${NET.S.maxPlayers || 12}" onchange="NET.S.maxPlayers=+this.value" style="width:70px"></div>
  <label class="row"><span>${t_('Дозволити глядачів')}</span><input type="checkbox" ${NET.S.noSpect ? '' : 'checked'} onchange="NET.S.noSpect=!this.checked"></label>
  <div class="small mut">${t_('Ваш компʼютер рахує світ, гравці бачать його через інтернет (WebRTC). Швидкістю гри керує лише хост.')}</div></div></div>
  <div><h3>🔗 ${t_('Посилання')}</h3>${NET.S.code ? `<div class="lb-code">${NET.S.code}</div>${roomLinks(NET.S.code)}` : `<div class="card small mut">${t_('Посилання для гравців, глядачів і джерело для OBS зʼявляться після натискання «Відкрити кімнату» — і будуть у лобі.')}</div>${linkRow('📺 ' + t_('Джерело OBS (приклад)'), location.href.split('?')[0] + '?watch=КОД&obs=1')}`}</div></div>`;
}
function streamBlock() {
  const SV = typeof SVIEWS !== 'undefined' ? SVIEWS : {};
  return `<div class="st-grid"><div><h3>📺 ${t_('Вивід на стрім')}</h3>
  <div class="small mut">${t_('Одне джерело OBS, яке хост перемикає між режимами: F9 — по колу, Ctrl+Alt+1/2/3 — напряму, кнопка 📺 у верхній панелі.')}</div>
  <div class="btns">${Object.entries(SV).map(([k, v], i) => `<button class="${SOUT.v === k ? 'on' : ''}" onclick="SOUT.v='${k}';saveSOUT();startScreen()">${ico(v.ic)} ${t_(v.n)} <kbd>Ctrl+Alt+${i + 1}</kbd></button>`).join('')}</div>
  <label class="row"><span>${t_('Автокамера на гарячі бої (режим мапи)')}</span><input type="checkbox" ${SOUT.auto ? 'checked' : ''} onchange="SOUT.auto=this.checked;saveSOUT()"></label>
  <label class="row"><span>${t_('Показувати режим і у вікні гри (для захоплення вікна)')}</span><input type="checkbox" ${SOUT.local ? 'checked' : ''} onchange="SOUT.local=this.checked;saveSOUT()"></label>
  <div class="small mut">${t_('Без онлайн-кімнати вивід перемикається прямо у вікні гри. Глядачі й джерело OBS бачать усе без туману війни.')}</div></div>
  <div><h3>🔊 ${t_('Звук і випуски новин')}</h3>
  ${[['music', 'Музика'], ['sfx', 'Звукові ефекти'], ['tts', 'Озвучка подій'], ['newscast', 'Щомісячний випуск новин з ведучою'], ['advisors', 'Радники з порадами'], ['toasts', 'Спливаючі сповіщення']].map(([k, n]) => `<label class="row"><span>${t_(n)}</span><input type="checkbox" ${AUD.S[k] !== false ? 'checked' : ''} onchange="AUD.set('${k}',this.checked)"></label>`).join('')}
  </div></div>`;
}
function joinBlock() {
  const watch = netMode === 'watch';
  return `<div class="st-grid"><div><h3>${watch ? '👁 ' + t_('Дивитися гру') : '🔗 ' + t_('Приєднатися гравцем')}</h3>
  <div class="card"><div class="row"><span>${t_('Ваше імʼя (нік)')}</span><input type="text" value="${esc(netName || (TW.S.user ? TW.S.user.name : ''))}" oninput="netName=this.value" placeholder="viewer123" style="width:55%"></div>
  <div class="row"><span>${t_('Код кімнати')}</span><input type="text" value="${esc(netCode)}" oninput="netCode=this.value.toUpperCase()" placeholder="ABC123" style="width:55%;text-transform:uppercase;font-family:var(--px);font-size:16px;letter-spacing:.2em"></div>
  <div class="btns">${watch ? `<button class="pri big" onclick="if(!netCode){hint('⚠ '+t_('Введіть код кімнати'),2500)}else watchJoin(netCode,false)">👁 ${t_('Дивитися')}</button>` : `<button class="pri big" onclick="guestJoin()">🔗 ${t_('Підключитися')}</button>`}</div></div>
  <div class="small mut">${watch ? t_('Глядач бачить усю мапу без туману війни, але нічим не керує.') : t_('Після підключення оберіть державу в лобі й чекайте, поки хост почне гру. Швидкістю керує хост.')}</div></div>
  <div><h3>🟣 Twitch</h3><div class="card">${TW.S.user ? `<span class="tw-u"><img src="${esc(TW.S.user.avatar)}" alt="">${esc(TW.S.user.name)}</span>` : `<button class="tw-b" onclick="TW.login()">🟣 ${t_('Увійти через Twitch')}</button><div class="small mut">${t_('Необовʼязково: нік і аватарка з Twitch.')}</div>`}</div></div></div>`;
}
function renderClist(q) {
  q = (q || '').toLowerCase(); const L = window._startList.slice().sort((a, b) => (b.a3 === startSel) - (a.a3 === startSel));
  $('#clist').innerHTML = L.filter(c => !q || c.name.toLowerCase().includes(q)).map(c => `<div class="c ${c.a3 === startSel ? 'sel' : ''}" style="--cc:${themeOf(c.a3, c.col).a}" onclick="startSel='${c.a3}';applyTheme('${c.a3}','${c.col}');renderClist(document.getElementById('csearch').value)"><b>${esc(c.name)}${c.nk ? ' ☢' : ''}</b><span>${t_('ВВП')} ${money(c.gdp)} · ${popM(c.pop)} · ${t_('армія')} ${people(c.tr)} · ${t_('регіонів')} ${c.nT}</span></div>`).join('');
}
function startGame() {
  G = LORA.createGame({ seed: (Date.now() % 1e9) | 0 });
  if (/^(char|mp|party|company)$/.test(startMode)) G.init(null, scen, { difficulty: startDiff, char: { name: (chName || '').trim() || t_('Олена Коваль'), type: chType, home: startSel, stage: startMode === 'char' ? null : startMode === 'company' ? 'owner' : startMode, sector: coSector, coName: (coName || '').trim() || null, coCash: startMode === 'company' ? LORA.config.companyCash : 0 } });
  else G.init(startSel, scen, { difficulty: startDiff });
  if (startMode === 'rada' && G.player >= 0) G.radaEnable(true);
  $('#start').style.display = 'none'; startUI(); setTimeout(help, 300);
}

function radaStartBlock() {
  return `<div class="card" style="border-color:#7a5cff"><b>🏛 ${t_('Режим «Президент і Рада»')}</b><div class="small mut">${t_('Ви — президент обраної держави. Парламент — це ваш чат Twitch: кожен ваш великий закон (податки, бюджет, мобілізація, оголошення війни) ухвалюють глядачі командами !1 — за, !2 — проти. Депутати-глядачі вносять власні законопроєкти — ви підписуєте або ветуєте. ШІ парламентом не керує.')}</div>
  <div class="row"><span>${t_('Канал')}</span><input type="text" id="twChR" value="${esc(TW.S.channel || localStorage.getItem('lora_tw_channel') || (TW.S.user ? TW.S.user.login : ''))}" placeholder="${t_('назва_каналу')}" style="width:45%"><button onclick="TW.connectChat(document.getElementById('twChR').value);setTimeout(startScreen,1500)">${TW.S.connected ? '✔ ' + t_('Підключено') : t_('Підключити чат')}</button></div>
  <div class="row"><span>${t_('Ініціативи депутатів раз на, хвилин')}</span><input type="number" min="2" max="60" value="${AUD.S.radaMin || 6}" onchange="AUD.set('radaMin',+this.value)" style="width:70px"></div>
  <div class="row"><span>${t_('Час на голосування, секунд')}</span><input type="number" min="20" max="180" value="${AUD.S.radaSec || 60}" onchange="AUD.set('radaSec',+this.value)" style="width:70px"></div>
  ${TW.S.connected ? '' : `<div class="small y">⚠ ${t_('Без підключеного чату законопроєкти чекатимуть — ви зможете ухвалити їх вручну у вкладці «Держава → Парламент».')}</div>`}</div>`;
}
