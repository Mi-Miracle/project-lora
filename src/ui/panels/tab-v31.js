// UI v3.1: мініігри (промова, дебати, агітація-рукостискання), нові локації (дім, аеропорт, база, космодром, парламент),
// панелі дачі-ферми, дому, улюбленців і суперників, нові інвестиції, сцена свята.
if (typeof FX !== 'undefined' && FX.add) FX.add('holiday', { bg: ['#1a0a2a', '#05020a'], items: [['🎆', 'burst', 30, 34], ['🎉', 'rain', 30, 30], ['🎈', 'rise', 14, 36]] }, ['🎉 СВЯТО', 'HOLIDAY']);
// ---------- нові локації в перемикачі
{ const b = window.locAvail; window.locAvail = function () { const r = b(); const add = (k, ic, n) => { if (G.LOCS[k] && G.LOCS[k].can() === '' && !r.some(x => x[0] === k)) r.push([k, ic, n]); };
  add('home', '🏠', t_('Дім')); add('airport', '🛫', t_('Аеропорт')); add('parliament', '🏛', t_('Парламент')); add('base', '🎖', t_('База')); add('spaceport', '🚀', t_('Космодром')); return r; }; }
// ---------- додаткові блоки в бічній панелі локацій
{ const b = window.citySide; window.citySide = function () { b(); if (!locUI) return; const el = $('#citySide'); if (!el) return; const L = G.leader, k = locUI.place; let h = '';
  if (locUI.loc === 'dacha' && G.farmState) { const S = G.farmState(), F = S.F; h += `<div class="grp">🌱 ${t_('Ділянки')} ${F.plots.length}/${S.max} · ${F.sotky} ${t_('соток')}${F.gh ? ' · 🏠 ' + t_('теплиця') : ''}</div>`
      + F.plots.map(p => { const C = G.CROPS[p.k], q = Math.min(1, (G.day - p.d) / Math.max(1, p.ready - p.d)); return `<div class="small">${C.ic} ${esc(t_(C.n))} ${p.pest ? '🐛' : ''}${p.w ? '💧'.repeat(p.w) : ''} ${q >= 1 ? `<b class="g">${t_('достигло!')}</b>` : `${t_('ще')} ${p.ready - G.day} ${t_('дн.')}`}${bar29(q * 100, '#7fd06a')}</div>`; }).join('')
      + (Object.values(F.inv).some(v => v > 0) ? `<div class="small">🧺 ${Object.entries(F.inv).filter(([, v]) => v > 0).map(([c, v]) => `${G.CROPS[c].ic} ${v} ${t_('кг')} (${money(v * G.cropPx(c) / 1e9)})`).join(' · ')}</div>` : '')
      + (Object.keys(F.ani || {}).length ? `<div class="small">🐾 ${Object.entries(F.ani).map(([a, v]) => `${G.FARM_SHOP[a].ic}×${v}`).join(' ')}</div>` : ''); }
  if ((locUI.loc === 'city' && k === 'agency') || locUI.loc === 'home') { h += `<div class="grp">🏠 ${t_('Ваш дім')}</div><div class="small">${L.house ? `${G.HOUSE[L.house.lvl].ic} ${esc(t_(G.HOUSE[L.house.lvl].n))} · ${t_('рівень')} ${L.house.lvl}/5 · ${t_('утримання')} ${money(G.HOUSE[L.house.lvl].upk / 1e9)}/${t_('міс.')}` : t_('Поки що ви орендуєте кімнату в бабусі Галі')}</div>`;
    (L.estate || []).forEach(p => { if (!p.mgr) h += `<div class="row small"><span>${G.ESTATE[p.k].ic} ${esc(p.name)}</span><button class="small" onclick="locEst(G.act.estateMgr(${p.id}))">👔 ${t_('Найняти керуючого')}</button></div>`; }); }
  if (L.pets && L.pets.length && (locUI.loc === 'home' || k === 'petshop')) h += `<div class="grp">🐾 ${t_('Улюбленці')}</div>` + L.pets.map(p => `<div class="small">${G.PETS[p.k].ic} ${esc(p.name)} · ${t_('радість')} ${p.joy.toFixed(0)}%${bar29(p.joy)}</div>`).join('');
  if (h) el.insertAdjacentHTML('beforeend', h); }; }
// ---------- вкладка «Місто»: суперники
{ const b = TAB_FN.city; TAB_FN.city = function () { let h = b(); const L = G && G.leader; if (!L || !L.rivals || !L.rivals.length) return h;
  h += `<div class="grp">⚔ ${t_('Суперники')}</div>` + L.rivals.map((r, i) => `<div class="card small"><b>${r.ic} ${esc(r.name)}</b> · ${esc(t_(r.kind))} · ${t_('сила')} ${r.pow.toFixed(0)} · ${t_('ненависть')} ${r.hate.toFixed(0)}
    <div class="btns">${Object.entries(G.RIVAL_ACT).map(([k, A]) => `<button class="small" data-tip="${esc(t_(A.d))}" onclick="rivalAct(${i},'${k}')">${A.ic} ${esc(t_(A.n))}${A.c ? ' · ' + money(A.c) : ''}</button>`).join('')}</div></div>`).join(''); return h; }; }
function rivalAct(i, k) { const go = sc => { const r = G.act.rivalDo(i, k, sc); hint((r.ok ? '⚔ ' : '⚠ ') + t_(r.msg || r.err), 5000); renderTab(true); }; if (k === 'duel') mgPlay('debate', go); else go(); }
// ---------- нові інвестиції у вкладці «Статки»
{ const b = TAB_FN.life; if (b) TAB_FN.life = function () { let h = b(); if (!G || curSub('life', 'lux') !== 'inv' || !G.INV2) return h; const L = G.leader, P = L.pf2 || {};
  h += `<div class="grp">💼 ${t_('Інші інвестиції')}</div>` + Object.entries(G.INV2).map(([k, A]) => { const v = k === 'nft' ? (P.nft || 0) * (P.nftPx || 1) : (P[k] || 0);
    return `<div class="row small"><span>${A.ic} ${esc(t_(A.n))}<br><span class="mut">${esc(t_(A.d))}</span></span><span>${v > 0 ? `<b>${money(v)}</b> <button class="small" onclick="lifeRes(G.act.inv2Sell('${k}'))">${t_('Продати')}</button>` : ''} <button class="small" onclick="lifeRes(G.act.inv2Do('${k}',invAmt))">+ ${money(invAmt)}</button></span></div>`; }).join(''); return h; }; }

// ================= МІНІІГРИ =================
const MG_SPEECH = [
  [['Ми збудуємо дороги, яких ще не було!', 1], ['Ну, якось воно буде…', 0.2], ['Мій кіт теж за реформи', 0.5]],
  [['Кожна гривня — під контролем народу!', 1], ['Гроші? Які гроші?', 0], ['Бюджет — це як борщ: головне — пропорції', 0.7]],
  [['Ми разом — і це наша сила!', 1], ['Я сам усе вирішу', 0.2], ['Хто за — підніміть шаурму!', 0.6]],
  [['Освіта — фундамент майбутнього!', 1], ['Учитися — це для слабких', 0], ['Кожному школяру — по котику', 0.5]],
  [['Ми не віддамо жодного метра!', 1], ['Може, домовимося… якось', 0.3], ['Наша армія — найкраща у світі й околицях', 0.7]],
  [['Чесність — це не слово, а дія!', 1], ['Я ніколи не брав хабарів. Цього тижня', 0.1], ['Дивіться, голуб!', 0.3]],
  [['Молодь — це не майбутнє, це вже сьогодення!', 1], ['Молодь має слухати старших', 0.2], ['Вайфай у кожне село!', 0.8]]
];
const MG_DEBATE = [
  ['Опонент: «Ви не виконали жодної обіцянки!»', [['Я виконав 12 з 14 — ось список', 1], ['А ви взагалі хто?', 0.2], ['Зате я гарно виглядаю', 0.4]]],
  ['Опонент: «Звідки у вас ці гроші?»', [['Декларація відкрита — читайте', 1], ['Знайшов на вулиці', 0], ['Бабуся залишила. Усі сім бабусь', 0.3]]],
  ['Ведучий: «Скільки коштує хліб?»', [['Близько 40 гривень, і це забагато', 1], ['Я не їм хліб', 0.1], ['Хліб безцінний, як і демократія', 0.6]]],
  ['Опонент: «Ваша реформа провалилася!»', [['Цифри кажуть інше: +3% до зростання', 1], ['Це ви її провалили', 0.4], ['Яка реформа?', 0]]],
  ['Глядач: «Що ви зробите для пенсіонерів?»', [['Індексація й безкоштовні ліки', 1], ['Пенсіонери — наше все. Наступне питання', 0.3], ['Подарую кожному кота', 0.5]]],
  ['Опонент: «Ви боїтеся чесної відповіді!»', [['Питайте — відповім на будь-яке', 1], ['Я нічого не боюся, крім павуків', 0.6], ['…', 0]]]
];
let mgCur = null;
function mgOn() { return typeof AUD === 'undefined' || !AUD.S || AUD.S.minigames !== false; }
function mgPlay(kind, done) {
  if (!mgOn()) { done(null); return; } closeModal(); const sh = a => a.slice().sort(() => Math.random() - 0.5);
  mgCur = { kind, done, sc: 0, n: 0, rounds: kind === 'rally' ? 1 : 4, t0: 0, timer: 0 };
  if (kind === 'rally') { mgRally(); return; }
  mgCur.items = sh(kind === 'speech' ? MG_SPEECH : MG_DEBATE).slice(0, 4); mgRound();
}
function mgRound() {
  const M = mgCur; if (!M) return; if (M.n >= M.rounds) { mgEnd(); return; } const it = M.items[M.n]; const q = M.kind === 'speech' ? t_('Оберіть найсильнішу фразу!') : esc(t_(it[0])); const opts = (M.kind === 'speech' ? it : it[1]).slice().sort(() => Math.random() - 0.5);
  M.opts = opts; M.t0 = performance.now(); const T = 5000;
  openModal(`<h2>${M.kind === 'speech' ? '🎙 ' + t_('Промова') : '⚔ ' + t_('Дебати')} · ${M.n + 1}/${M.rounds}</h2><div style="font-size:16px;margin:8px 0">${q}</div><div id="mgBar" style="height:8px;background:#0005;border-radius:4px;overflow:hidden"><div style="height:100%;width:100%;background:#ffd34d;transition:width .1s linear"></div></div>
    <div class="mg-opts">${opts.map((o, i) => `<button class="city-act" onclick="mgPick(${i})"><b>${esc(t_(o[0]))}</b></button>`).join('')}</div><div class="mut small">${t_('Оплески')}: ${'👏'.repeat(Math.round(M.sc))} · ${t_('мініігри можна вимкнути в Налаштуваннях → Гра')}</div>`);
  clearInterval(M.timer); M.timer = setInterval(() => { const q2 = 1 - (performance.now() - M.t0) / T; const b = document.querySelector('#mgBar div'); if (b) b.style.width = Math.max(0, q2 * 100) + '%'; if (q2 <= 0) { clearInterval(M.timer); mgPick(-1); } }, 100);
}
function mgPick(i) { const M = mgCur; if (!M) return; clearInterval(M.timer); const v = i >= 0 ? M.opts[i][1] : 0; const fast = Math.max(0, 1 - (performance.now() - M.t0) / 5000);
  M.sc += v * (0.8 + fast * 0.2); M.n++; AUD.sfx(v >= 0.8 ? 'good' : 'bad'); hint(v >= 0.8 ? '👏 ' + t_('Зала аплодує!') : v >= 0.4 ? '🙂 ' + t_('Непогано') : '😬 ' + t_('Хтось кашлянув у тиші'), 1200); setTimeout(mgRound, 350); }
function mgRally() { const M = mgCur; let hits = 0, miss = 0; const DUR = 10000; const start = performance.now();
  openModal(`<h2>🤝 ${t_('Агітація: потисніть якомога більше рук!')}</h2><div class="mut small">${t_('Клацайте на виборців 🙋, не на журналістів 📸 і не на собак 🐕')}</div><div id="mgField" style="position:relative;height:300px;background:#16212e;border-radius:10px;margin-top:8px;overflow:hidden;cursor:pointer"></div><div id="mgInfo" class="small"></div>`);
  const fld = document.getElementById('mgField'); const spawn = () => { if (!mgCur) return; const bad = Math.random() < 0.25; const e = document.createElement('div'); e.textContent = bad ? (Math.random() < 0.5 ? '📸' : '🐕') : ['🙋', '🧓', '👩', '🧑‍🔧', '👨‍🌾', '🧑‍🎓'][Math.floor(Math.random() * 6)];
    Object.assign(e.style, { position: 'absolute', left: (5 + Math.random() * 85) + '%', top: (5 + Math.random() * 80) + '%', fontSize: '34px', transition: 'transform .15s', userSelect: 'none' }); e.onclick = ev => { ev.stopPropagation(); if (bad) miss++; else hits++; e.textContent = bad ? '💢' : '🤝'; e.style.transform = 'scale(1.4)'; setTimeout(() => e.remove(), 180); }; fld.appendChild(e); setTimeout(() => e.remove(), 1100); };
  M.timer = setInterval(() => { const left = DUR - (performance.now() - start); const inf = document.getElementById('mgInfo'); if (inf) inf.textContent = `🤝 ${hits} · 💢 ${miss} · ⏱ ${Math.max(0, left / 1000).toFixed(1)}`; if (left <= 0) { clearInterval(M.timer); clearInterval(M.sp); M.sc = Math.max(0, Math.min(1, (hits - miss * 1.5) / 14)) * M.rounds; mgEnd(); } }, 100); M.sp = setInterval(spawn, 420); }
function mgEnd() { const M = mgCur; mgCur = null; if (!M) return; clearInterval(M.timer); clearInterval(M.sp); closeModal(); const score = Math.max(0, Math.min(1, M.sc / M.rounds)); const r = G.act.mgReward(M.kind, score);
  hint(`🎮 ${t_('Результат')}: ${Math.round(score * 100)}% · ${t_(r && r.msg || '')}`, 4500); if (score > 0.75) LORA.bus.emit('fx', { kind: M.kind === 'rally' ? 'handshake' : 'speech', title: '👏 ' + t_('БЛИСКУЧЕ!'), sub: Math.round(score * 100) + '%' }); try { M.done(score); } catch (e) { } }
// перехоплення дій: спершу мінігра, потім дія
{ const MGA = { charDo: a => a[0] === 'speech' ? 'speech' : a[0] === 'run' ? 'rally' : null, careerDo: a => a[0] === 'mp_speech' ? 'speech' : a[0] === 'campaign' ? 'rally' : null, partyDo: a => a[0] === 'p_debate' ? 'debate' : a[0] === 'p_rally' ? 'rally' : null, leadDo: () => 'speech' };
  const hookMG = () => { if (!G || !G.act || G.act._mg31) return; G.act._mg31 = 1; Object.entries(MGA).forEach(([name, f]) => { const b = G.act[name]; if (typeof b !== 'function') return; G.act[name] = function () { const args = arguments, kind = f(args); if (!kind || !mgOn() || G.act._mgBusy) return b.apply(this, args);
    G.act._mgBusy = 1; mgPlay(kind, () => { G.act._mgBusy = 0; const r = b.apply(G.act, args); if (r && r.ok === false) hint('⚠ ' + t_(r.err), 3000); renderTab(true); renderTop(); }); return { ok: true, pending: true, msg: t_('Мінігра…') }; }; }); };
  setInterval(hookMG, 800);
  // у місті: штаб агітації й дебати у дворі
  const bc = window.cityDo; window.cityDo = function (k, a) { const kind = k === 'hq' ? (a === 'yard' ? 'debate' : a === 'doors' || a === 'leaflets' ? 'rally' : a === 'concert' ? 'speech' : null) : (k === 'hall' && a === 'speech' && locUI && locUI.loc === 'parliament') ? 'speech' : (k === 'union' && a === 'speech') ? 'speech' : null;
    if (!kind || !mgOn()) return bc(k, a); const e = G.locCan(locUI.loc, k, a); if (e) { hint('⚠ ' + t_(e), 2500); return; } mgPlay(kind, () => bc(k, a)); }; }
