// UI v3.0: рушій локацій (місто, резиденція, дача, офіс) з випадковим плануванням, перехожими й вуличними зустрічами;
// нерухомість, кар'єра агента й суди в місті; профспілки у вкладці «Думка»; сезони на мапі (сніг, бездоріжжя, пожежі).
// ---------- сезони на мапі
function drawBase29(c, lw, sh, lonL, lonR) {
  if (!G || !G.seasonArr) return; const A = G.seasonArr(); if (!A) return;
  for (let i = 0; i < GEO.paths.length; i++) { const s = A[i]; if (!s || !(s.winter || s.mud)) continue; const bb = GEO.bbox[i]; if (bb[2] + sh < lonL - 2 || bb[0] + sh > lonR + 2) continue; c.fillStyle = s.winter ? 'rgba(240,248,255,0.5)' : 'rgba(120,85,40,0.22)'; c.fill(GEO.paths[i]); }
}
{ const b = window.drawOverlay29; window.drawOverlay29 = function (lw) { if (b) b(lw); if (!G || !G.v29) return; const W = G.v29.wx || { fire: {}, flood: {} }; const em = (e, i, dy) => { const cc = D.regions[i].c; ctx.font = `${16 * lw}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, cc[0], -cc[1] + (dy || 0) * lw); };
  for (const k in W.fire) if (W.fire[k] > G.day) { const i = +k; ctx.fillStyle = `rgba(255,90,20,${0.25 + Math.sin(animT * 6 + i) * 0.1})`; ctx.fill(GEO.paths[i]); em('🔥', i, -2 + Math.sin(animT * 8 + i) * 1.5); }
  for (const k in W.flood) if (W.flood[k] > G.day) em('💧', +k, 0);
  if (view.s > 5 && G.seasonArr) { const A = G.seasonArr(); const [lonL] = toWorld(0, 0), [lonR] = toWorld(innerWidth, 0); ctx.globalAlpha = 0.7; for (let i = 0; i < A.length; i += 1) { const s = A[i]; if (!s || !s.winter) continue; const cc = D.regions[i].c; if (cc[0] < lonL - 360 || cc[0] > lonR + 360) continue; if ((i * 7) % 3) continue; em('❄', i, 12 + Math.sin(animT * 2 + i) * 2); } ctx.globalAlpha = 1; } }; }

// ---------- профспілки у вкладці «Думка»
{ const b = TAB_FN.op; if (b) TAB_FN.op = function () { let h = b.apply(this, arguments); if (!G || G.player < 0 || !G.uniState) return h; const st = G.uniState(G.player), n = nat(G.player); const c = (n.agg ? n.agg.gdp : 100) * 0.0003;
  h += `<div class="grp">🪧 ${t_('Профспілки')}</div><div class="mut small">${t_('Нижче 30% — ризик страйку. Зустріч підвищує задоволеність на 8.')}</div>` + Object.entries(G.UNIONS).map(([k, U]) => { const v = st.sat[k], s = st.strike[k] && st.strike[k].until > G.day;
    return `<div class="row small"><span>${U.ic} ${esc(t_(U.n))}${s ? ` <b class="r">${t_('СТРАЙК')}</b>` : ''}</span><span><b class="${v > 55 ? 'g' : v < 30 ? 'r' : ''}">${v.toFixed(0)}%</b> <button class="small" onclick="v29Res(G.act.uniTalk('${k}'))">🤝 ${money(c)}</button></span></div>${bar29(v)}`; }).join(''); return h; }; }

// ================= ЛОКАЦІЇ =================
const LOC_NPC = ['🚶', '🧓', '🐕', '🧑‍🦯', '🛹', '🐈', '👮', '🧑‍💼', '👩‍🍳', '🧑‍🎤', '🚴', '🧑‍🔧'];
const LOC_SAY = ['Ціни ростуть!', 'Ви по телевізору були?', 'Де тут ЦНАП?', 'Голосуйте за кота!', 'Кава по 100 гривень?!', 'Вже понеділок?!', 'Хто бачив мого голуба?', 'Знову перекрили дорогу', 'Я тут проїздом з 2019', 'А де обіцяні дороги?', 'Слава шаурмі!', 'Я на нараді, не дзвоніть', 'Купіть пилосос!', 'Це той, із білборда!', 'Мій кіт — мер!', 'Дайте автограф!'];
const ROOM_SAY = ['Ще одна нарада?', 'Хто з’їв печиво?', 'Принтер знову...', 'Кава закінчилась!', 'Підпишіть тут', 'Терміново!', 'Я на дзвінку', 'Звіт готовий. Майже'];
let locUI = null;
function locAvail() { const r = [['city', '🏙', t_('Місто')], ['dacha', '🏡', t_('Дача')]]; if (G.LOCS.residence.can() === '') r.push(['residence', '🏛', t_('Резиденція')]); if (G.LOCS.office.can() === '') r.push(['office', '🏢', t_('Офіс')]); return r; }
function locLayout(loc, seed) {
  const L = G.LOCS[loc], keys = Object.keys(L.places); let rs = seed >>> 0; const rnd = () => ((rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296); const pos = {};
  if (L.theme === 'city') { const cells = []; for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) if (!((i === 4 || i === 5) && j <= 1)) cells.push([i, j]); for (let k = cells.length - 1; k > 0; k--) { const q = Math.floor(rnd() * (k + 1)); [cells[k], cells[q]] = [cells[q], cells[k]]; }
    let c = 0; keys.forEach(k => { if (k === 'park') pos[k] = { x: 0.5, y: 0.125 }; else { const [i, j] = cells[c++]; pos[k] = { x: (i + 0.5) / 10, y: (j + 0.5) / 8 }; } }); }
  else if (L.theme === 'rooms') { const n = keys.length, cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols); keys.forEach((k, i) => { const cx = i % cols, cy = Math.floor(i / cols); pos[k] = { x: (cx + 0.5) / cols, y: (cy + 0.5) / rows, w: 1 / cols, h: 1 / rows, cx, cy }; }); }
  else { const spots = [[0.2, 0.3], [0.5, 0.22], [0.8, 0.3], [0.25, 0.7], [0.55, 0.62], [0.82, 0.72], [0.12, 0.5], [0.4, 0.45]]; keys.forEach((k, i) => { const s = spots[i % spots.length]; pos[k] = { x: s[0], y: s[1] }; }); }
  return pos;
}
function openCity() { openLoc('city'); }
function openLoc(loc) {
  if (!G || !G.cityState || !G.cityState()) return; if (G.leader.mv) { hint('⚠ ' + t_('Ви в дорозі'), 2000); return; } const e = G.LOCS[loc].can(); if (e) { hint('⚠ ' + t_(e), 2500); return; }
  const prev = locUI ? locUI.prev : speedIdx; if (!locUI && !G.online && !NET.isGuest()) setSpeed(0);
  let el = document.getElementById('city'); if (!el) { el = document.createElement('div'); el.id = 'city'; document.body.appendChild(el); }
  el.innerHTML = `<div class="city-top"><b id="cityName"></b><span id="cityClock"></span><span id="cityStats"></span><span style="flex:1"></span><span id="locSw"></span><button onclick="cityWait()">⏩ ${t_('Чекати 2 год')}</button><button onclick="cityHome()">🏠 ${t_('Додому')}</button><button onclick="closeCity()">✕</button></div>
    <div class="city-body"><canvas id="citycv"></canvas><div class="city-side" id="citySide"></div></div><div class="city-log" id="cityLog"></div>`;
  el.style.display = 'flex'; const S = G.cityState(); const nm = loc === 'city' ? S.name : loc + S.name; const seed = [...nm].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  if (locUI) cancelAnimationFrame(locUI.raf);
  locUI = cityUI = { loc, prev, place: null, me: { x: 0.5, y: 0.5 }, path: [], fx: [], seed, raf: 0, hov: null, pos: locLayout(loc, seed), npc: [], bub: [], ufo: 0 };
  for (let i = 0; i < (loc === 'city' ? 14 : 6); i++) locUI.npc.push({ e: loc === 'city' ? LOC_NPC[i % LOC_NPC.length] : loc === 'dacha' ? ['🐓', '🐈', '🐝', '🦋', '🐕', '🧓'][i] : ['🧑‍💼', '👩‍💼', '👮', '🐈', '🧹', '🧑‍💻'][i], x: Math.random(), y: Math.random(), dx: 0, dy: 0, t: 0, say: null, st: 0 });
  $('#locSw').innerHTML = locAvail().map(([k, ic, n]) => `<button class="${k === loc ? 'on' : ''}" onclick="openLoc('${k}')">${ic} ${esc(n)}</button>`).join('');
  const cv = document.getElementById('citycv'); const hit = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; let best = null, bd = 0.004; for (const [k, p] of Object.entries(locUI.pos)) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd || (p.w && Math.abs(p.x - x) < p.w / 2 && Math.abs(p.y - y) < p.h / 2)) { bd = d; best = k; } } return best; };
  cv.onclick = e => { const b = hit(e); if (b) cityGo(b); }; cv.onmousemove = e => { const b = hit(e); locUI.hov = b; cv.style.cursor = b ? 'pointer' : 'default'; };
  citySide(); cityTop(); cityLoop();
}
function closeCity() { const el = document.getElementById('city'); if (el) el.style.display = 'none'; if (locUI) { cancelAnimationFrame(locUI.raf); if (!G.online && !NET.isGuest() && locUI.prev) setSpeed(locUI.prev); } locUI = cityUI = null; renderTab(true); renderTop(); }
function cityTop() { const S = G.cityState(); if (!S || !locUI) return; const h = Math.floor(S.h), m = Math.round((S.h - h) * 60); const LC = G.LOCS[locUI.loc]; $('#cityName').textContent = `${LC.ic} ${locUI.loc === 'city' ? S.name : t_(LC.n)}`; $('#cityClock').textContent = `🕐 ${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}${S.h >= 26 ? ' · ' + t_('час спати') : ''}`;
  $('#cityStats').innerHTML = `😊 ${S.mood.toFixed(0)}% · ❤ ${S.hp.toFixed(0)}% · 💰 ${money(S.money)}`; $('#cityLog').innerHTML = S.log.slice(0, 4).map(x => `<div>${esc(t_(x))}</div>`).join(''); }
function cityGo(k) { if (!locUI) return; const p = locUI.pos[k]; const a = locUI.me; locUI.path = locUI.loc === 'city' ? [{ x: Math.round(a.x * 10) / 10, y: a.y }, { x: Math.round(a.x * 10) / 10, y: Math.round(p.y * 8) / 8 }, { x: p.x, y: Math.round(p.y * 8) / 8 }, { x: p.x, y: p.y }] : [{ x: p.x, y: p.y }]; locUI.place = k; locUI.arrive = k; citySide(); }
function locP() { return G.LOCS[locUI.loc].places; }
function locOpen(k, h) { return G.locOpen(locUI.loc, k, h); }
function citySide() {
  const el = $('#citySide'); if (!el || !locUI) return; const k = locUI.place, S = G.cityState(), PL = locP(), L = G.leader;
  if (!k) { let h = `<h3>${t_('Куди підемо?')}</h3><div class="mut small">${locUI.loc === 'city' ? t_('Клацніть заклад на мапі. Деякі відкриті лише вдень, інші — лише ввечері.') : t_('Клацніть кімнату чи місце на мапі.')}</div>`
      + Object.entries(PL).map(([q, P]) => `<div class="row small" style="cursor:pointer" onclick="cityGo('${q}')"><span>${P.ic} ${esc(t_(P.n))}</span><span class="${locOpen(q, S.h) ? 'g' : 'mut'}">${locOpen(q, S.h) ? t_('відчинено') : t_('зачинено')}</span></div>`).join('');
    if (L.agent) h += `<div class="grp">🕵 ${t_('Служба')}</div><div class="small">${esc(t_(G.AGENT_RANKS[L.agent.rank]))} · ${L.agent.svc === 'int' ? t_('СБ') : t_('розвідка')} · ${t_('легенда')}: «${esc(t_(L.agent.cover))}» · ✅ ${L.agent.done} · ❌ ${L.agent.fail}</div>`;
    h += estateBlock(); el.innerHTML = h; return; }
  const P = PL[k]; let h = `<h3>${P.ic} ${esc(t_(P.n))}</h3>` + (P.open ? `<div class="mut small">${t_('Працює')}: ${P.open[0]}:00–${P.open[1] % 24}:00 · ${locOpen(k, S.h) ? `<span class="g">${t_('відчинено')}</span>` : `<span class="r">${t_('зачинено')}</span>`}</div>` : '');
  if (k === 'court' && G.courtCases) { const cs = G.courtCases(); h += `<div class="small">${cs.length ? cs.map(c => `⚖ «${esc(t_(c.t))}» — ${esc(t_(c.k))}`).join('<br>') : t_('Резонансних справ немає')}</div>`; }
  if (k === 'sb' && L.agent) h += `<div class="small">🕵 ${esc(t_(G.AGENT_RANKS[L.agent.rank]))} · ${t_('досвід')} ${L.agent.xp}</div>`;
  let AE = Object.entries(P.acts); const tabs = [...new Set(AE.map(([, A]) => A.tab).filter(Boolean))];
  if (tabs.length > 1) { locUI.tabs = locUI.tabs || {}; const cur = tabs.includes(locUI.tabs[k]) ? locUI.tabs[k] : tabs[0]; const TN = Object.assign({}, G.LUX_TABS || {}, G.JOB_TABS || {});
    h += `<div class="btns city-tabs">${tabs.map(t => `<button class="small ${t === cur ? 'on' : ''}" onclick="locUI.tabs['${k}']='${t}';citySide()">${esc(t_(TN[t] || (G.LUX_CAT && G.LUX_CAT[t] ? G.LUX_CAT[t][1] : t)))}</button>`).join('')}</div>`;
    AE = AE.filter(([, A]) => (A.tab || tabs[0]) === cur); }
  h += AE.map(([a, A]) => { const e = G.locCan(locUI.loc, k, a); const nm = locUI.loc === 'city' ? G.cityActName(k, a) : A.n; return `<button class="city-act" ${e ? 'disabled' : ''} data-tip="${esc(e ? t_(e) : '')}" onclick="cityDo('${k}','${a}')"><b>${esc(t_(nm))}</b><span class="mut">${A.h} ${t_('год')} · ${A.c ? money(A.c) : t_('безкоштовно')}${e && A.need ? ' · ' + esc(t_(e)) : ''}</span></button>`; }).join('');
  if (k === 'agency') h += estateBlock();
  h += `<div class="btns"><button class="small" onclick="locUI.place=null;citySide()">← ${t_('Усі місця')}</button></div>`; el.innerHTML = h;
}
function estateBlock() { const L = G.leader; if (!L.estate || !L.estate.length) return ''; return `<div class="grp">🏠 ${t_('Ваша нерухомість')}</div>` + L.estate.map(p => { const E = G.ESTATE[p.k]; return `<div class="row small"><span>${E.ic} ${esc(t_(E.n))} ${esc(p.name)} · ${t_('рів.')} ${p.lvl}<span class="mut"> · ${esc(G.cityName(p.reg))}</span></span><span><button class="small" onclick="locEst(G.act.estateUp(${p.id}))">⬆</button><button class="small" onclick="locEst(G.act.estateSell(${p.id}))">💲</button></span></div>`; }).join(''); }
function locEst(r) { hint((r && r.ok ? '✅ ' : '⚠ ') + t_(r && (r.msg || r.err) || ''), 3000); cityTop(); citySide(); }
const CITY_BIG_FX = ['jackpot', 'paparazzi', 'busted', 'court', 'spyop', 'council', 'tvshow', 'disco'];
function cityDo(k, a) { const r = G.act.locDo(locUI.loc, k, a); if (!r || r.ok === false) { hint('⚠ ' + t_((r && r.err) || 'Помилка'), 2500); return; }
  const p = locUI.pos[k]; const d = r.d || {}; const good = (d.mood || 0) + (d.popu || 0) + (d.fame || 0) + (d.stab || 0) * 4 + (d.coRep || 0) >= 0;
  const FE = { jackpot: '🪙', paparazzi: '📸', heart: '❤', busted: '🚨', song: '🎵', football: '⚽', disco: '✨', pigeons: '🕊', spyop: '🕶', court: '⚖', council: '📜', speech: '📣', tvshow: '📺', leaflets: '📄', handshake: '🤝', meeting: '📈', party: '🎉', build: '🌱', gym: '💪', exercise: '🚨' };
  locUI.fx.push({ x: p.x, y: p.y, t0: performance.now(), e: FE[r.fx] || (good ? '✨' : '💢') });
  if (CITY_BIG_FX.includes(r.fx)) LORA.bus.emit('fx', { kind: r.fx, sub: r.msg });
  AUD.sfx(good ? 'good' : 'bad'); hint((good ? '😊 ' : '😬 ') + t_(r.msg), 4500); cityTop(); citySide(); }
function cityEncounter() { if (!G.cityEnc) return; const e = G.cityEnc(); openModal(`<h2>🚶 ${t_('На вулиці')}</h2><div>${esc(t_(e.t))}</div><div class="btns">${e.o.map((o, j) => `<button class="${j ? '' : 'pri'}" onclick="closeModal();const r=G.act.cityEncDo(${e.i},${j});if(r&&r.ok){hint('🚶 '+t_(r.msg),4500);cityTop();citySide();}">${esc(t_(o))}</button>`).join('')}</div>`); }
function cityLoop() {
  if (!locUI) return; const cv = document.getElementById('citycv'); if (!cv) return; const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } const cx = cv.getContext('2d'); const S = G.cityState(); if (!S) return;
  const LC = G.LOCS[locUI.loc], th = LC.theme, hh = S.h % 24, night = hh >= 20 || hh < 6, dusk = hh >= 18 && hh < 20; let rs = locUI.seed; const rnd = () => ((rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296); const now = performance.now() / 1000;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  if (th === 'city') {
    cx.fillStyle = night ? '#141b26' : dusk ? '#4a4038' : '#c9c3b2'; cx.fillRect(0, 0, W, H); const nx = 10, ny = 8, bw = W / nx, bh = H / ny; const GRAF = ['ТУТ БУВ СТАЖЕР', 'КІТ — МЕР', 'L.O.R.A.', 'ГУСИ ЗА МИР', 'Я ❤ ШАУРМУ', 'ДЕ ДОРОГИ?'];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const r = rnd(); const park = (i === 4 || i === 5) && j <= 1; cx.fillStyle = park ? (night ? '#1e3324' : '#7fb06a') : night ? `rgb(${40 + r * 20},${44 + r * 20},${58 + r * 20})` : `rgb(${170 + r * 40},${160 + r * 40},${150 + r * 30})`; cx.fillRect(i * bw + 8, j * bh + 8, bw - 16, bh - 16);
      if (park) { cx.font = '20px serif'; for (let q = 0; q < 3; q++) cx.fillText('🌳', i * bw + 20 + q * (bw - 40) / 2, j * bh + bh - 18); }
      if (!park && night) for (let w = 0; w < 6; w++) if (rnd() < 0.5) { cx.fillStyle = '#ffd86a'; cx.fillRect(i * bw + 14 + (w % 3) * (bw - 28) / 3, j * bh + 14 + Math.floor(w / 3) * (bh - 28) / 2, 6, 6); }
      if (!park && r < 0.07) { cx.save(); cx.font = '700 10px system-ui'; cx.fillStyle = night ? '#ff7ad9' : '#b0306a'; cx.translate(i * bw + bw / 2, j * bh + bh - 16); cx.rotate(-0.08); cx.fillText(t_(GRAF[Math.floor(r * 100) % GRAF.length]), 0, 0); cx.restore(); } }
    cx.strokeStyle = night ? '#2a3240' : '#8d8a82'; cx.lineWidth = 8; for (let i = 0; i <= nx; i++) { cx.beginPath(); cx.moveTo(i * bw, 0); cx.lineTo(i * bw, H); cx.stroke(); } for (let j = 0; j <= ny; j++) { cx.beginPath(); cx.moveTo(0, j * bh); cx.lineTo(W, j * bh); cx.stroke(); }
    cx.strokeStyle = night ? '#1d3550' : '#6fa4cf'; cx.lineWidth = H * 0.06; cx.beginPath(); for (let x = 0; x <= W; x += 20) cx.lineTo(x, H * 0.97 - Math.sin(x / W * 5 + locUI.seed % 7) * H * 0.03); cx.stroke();
    cx.font = '18px serif'; for (let q = 0; q < 3; q++) { const x = ((now * 18 + q * 230) % (W + 40)) - 20; cx.fillText('🦆', x, H * 0.97 - Math.sin(x / W * 5 + locUI.seed % 7) * H * 0.03 - 4); }
    for (let c = 0; c < 8; c++) { const horiz = c % 2 === 0, lane = (c * 3 + 1) % (horiz ? ny : nx), p = ((now * (40 + c * 7) + c * 200) % ((horiz ? W : H) + 60)) - 30; cx.fillText(['🚗', '🚕', '🚌', '🚲', '🛵', '🚓', '🚙', '🚎'][c], horiz ? p : lane * bw, horiz ? lane * bh : p); }
    if (night) { const u = (now % 40) / 40; if (u < 0.3) { cx.font = '34px serif'; const x = u / 0.3 * (W + 100) - 50; cx.fillText('🛸', x, H * 0.08 + Math.sin(now * 3) * 8); if (Math.floor(now * 2) % 2) { cx.fillStyle = 'rgba(140,255,170,0.12)'; cx.beginPath(); cx.moveTo(x - 10, H * 0.1); cx.lineTo(x + 10, H * 0.1); cx.lineTo(x + 50, H * 0.4); cx.lineTo(x - 50, H * 0.4); cx.fill(); } } }
  } else if (th === 'rooms') {
    cx.fillStyle = '#2a2420'; cx.fillRect(0, 0, W, H); const pal = locUI.loc === 'residence' ? ['#d9c9a3', '#c9b48a', '#e2d6b8', '#cdbb94'] : ['#cfd8dc', '#b8c6cc', '#dfe7ea', '#c3d0d6'];
    for (const [k, p] of Object.entries(locUI.pos)) { const x0 = (p.x - p.w / 2) * W, y0 = (p.y - p.h / 2) * H; cx.fillStyle = pal[(p.cx + p.cy) % pal.length]; cx.fillRect(x0 + 6, y0 + 6, p.w * W - 12, p.h * H - 12); cx.strokeStyle = '#3a2a1a'; cx.lineWidth = 6; cx.strokeRect(x0 + 6, y0 + 6, p.w * W - 12, p.h * H - 12); cx.fillStyle = '#2a2420'; cx.fillRect(x0 + p.w * W / 2 - 18, y0 + p.h * H - 9, 36, 6);
      cx.font = '22px serif'; const deco = locUI.loc === 'residence' ? ['🪴', '🖼', '🛋', '📚', '🕰', '🏺'] : ['🪴', '🖥', '📠', '🗂', '☕', '📊']; for (let q = 0; q < 3; q++) cx.fillText(deco[(p.cx * 3 + p.cy + q) % deco.length], x0 + 30 + q * (p.w * W - 60) / 2, y0 + p.h * H - 32); }
    if (night) { cx.fillStyle = 'rgba(10,10,40,0.25)'; cx.fillRect(0, 0, W, H); }
  } else {
    cx.fillStyle = night ? '#16261a' : '#8bc06a'; cx.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { cx.fillStyle = night ? 'rgba(30,60,30,0.5)' : 'rgba(110,170,80,0.6)'; cx.beginPath(); cx.arc(rnd() * W, rnd() * H, 20 + rnd() * 40, 0, 7); cx.fill(); }
    cx.fillStyle = night ? '#1d3550' : '#5f9fd0'; cx.beginPath(); cx.ellipse(W * 0.82, H * 0.72, W * 0.1, H * 0.1, 0, 0, 7); cx.fill(); cx.strokeStyle = '#7a5a30'; cx.lineWidth = 4; cx.setLineDash([10, 6]); cx.strokeRect(12, 12, W - 24, H - 24); cx.setLineDash([]);
    cx.font = '26px serif'; ['🌻', '🌳', '🍎', '🌲', '🌻', '🥕'].forEach((e, i) => cx.fillText(e, W * (0.08 + i * 0.17), H * 0.9)); cx.fillText('🏡', W * 0.5, H * 0.45 - 60);
    if (night) { cx.font = '30px serif'; cx.fillText('🌙', W * 0.9, H * 0.1); }
  }
  // місця
  for (const [k, P] of Object.entries(locP())) { const p = locUI.pos[k]; const x = p.x * W, y = p.y * H, open = locOpen(k, S.h); const hov = locUI.hov === k || locUI.place === k; const own = locUI.loc === 'city' && G.leader.estate && G.leader.estate.some(e => e.reg === G.leader.at && ((e.k === 'bar' && k === 'bar') || (e.k === 'gym' && k === 'gym') || (e.k === 'club' && k === 'club')));
    cx.fillStyle = open ? (hov ? '#ffd34d' : '#f4f1e6') : '#6a6f78'; cx.strokeStyle = own ? '#ffd34d' : '#1b2633'; cx.lineWidth = own ? 4 : 2; cx.beginPath(); cx.arc(x, y, hov ? 30 : 26, 0, 7); cx.fill(); cx.stroke();
    cx.globalAlpha = open ? 1 : 0.45; cx.font = `${hov ? 32 : 28}px serif`; cx.fillText(P.ic, x, y + 1); cx.globalAlpha = 1; if (own) { cx.font = '16px serif'; cx.fillText('👑', x + 20, y - 22); }
    if (hov || W > 900) { cx.font = '600 12px system-ui'; const nm = t_(P.n); const w2 = cx.measureText(nm).width + 10; cx.fillStyle = 'rgba(10,14,20,0.8)'; cx.fillRect(x - w2 / 2, y + 30, w2, 18); cx.fillStyle = open ? '#e8f0f8' : '#9aa3ad'; cx.fillText(nm, x, y + 39); } }
  // перехожі
  const SAY = th === 'rooms' ? ROOM_SAY : LOC_SAY;
  locUI.npc.forEach((n, i) => { if (n.t <= now) { n.t = now + 2 + Math.random() * 4; if (th === 'city') { const hz = Math.random() < 0.5; n.dx = hz ? (Math.random() < 0.5 ? -1 : 1) * 0.03 : 0; n.dy = hz ? 0 : (Math.random() < 0.5 ? -1 : 1) * 0.03; if (hz) n.y = Math.round(n.y * 8) / 8; else n.x = Math.round(n.x * 10) / 10; } else { n.dx = (Math.random() - 0.5) * 0.06; n.dy = (Math.random() - 0.5) * 0.06; }
      if (Math.random() < 0.18) { n.say = t_(SAY[Math.floor(Math.random() * SAY.length)]); n.st = now; } }
    n.x = Math.min(0.98, Math.max(0.02, n.x + n.dx / 60)); n.y = Math.min(0.92, Math.max(0.04, n.y + n.dy / 60)); cx.font = '20px serif'; cx.fillText(n.e, n.x * W, n.y * H - Math.abs(Math.sin(now * 8 + i)) * 2);
    if (n.say && now - n.st < 2.6) { cx.font = '600 11px system-ui'; const w = cx.measureText(n.say).width + 12; cx.fillStyle = 'rgba(244,241,230,0.95)'; cx.fillRect(n.x * W - w / 2, n.y * H - 38, w, 18); cx.fillStyle = '#1b2633'; cx.fillText(n.say, n.x * W, n.y * H - 29); } });
  // персонаж
  const me = locUI.me; if (locUI.path.length) { const t = locUI.path[0]; const dx = t.x - me.x, dy = t.y - me.y, d = Math.hypot(dx, dy), sp = 0.012; if (d < sp) { me.x = t.x; me.y = t.y; locUI.path.shift(); if (!locUI.path.length && locUI.arrive && locUI.loc === 'city') { locUI.arrive = null; if (Math.random() < 0.22) cityEncounter(); } } else { me.x += dx / d * sp; me.y += dy / d * sp; } }
  cx.font = '34px serif'; cx.fillText(G.leader.ic && G.leader.ic !== '⭐' ? G.leader.ic : '🧍', me.x * W, me.y * H - 22 - (locUI.path.length ? Math.abs(Math.sin(now * 10)) * 5 : 0));
  locUI.fx = locUI.fx.filter(f => now * 1000 - f.t0 < 1600); locUI.fx.forEach(f => { const q = (now * 1000 - f.t0) / 1600; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; cx.globalAlpha = 1 - q; cx.font = '24px serif'; cx.fillText(f.e, f.x * W + Math.cos(a) * q * 90, f.y * H + Math.sin(a) * q * 90 - q * 30); } cx.globalAlpha = 1; });
  if (night && th === 'city') { cx.fillStyle = 'rgba(10,10,40,0.18)'; cx.fillRect(0, 0, W, H); }
  locUI.raf = requestAnimationFrame(cityLoop);
}
// вкладка «Місто»: усі локації, суди, нерухомість, служба
TAB_FN.city = function () {
  if (!G || !G.cityState) return ''; const S = G.cityState(); if (!S) return `<div class="mut">${t_('Місто доступне лише персонажу з особистими грошима.')}</div>`; const L = G.leader;
  let h = `<div class="card"><h3>🏙 ${esc(S.name)}</h3><div class="mut small">${t_('Вийдіть у місто: магазини, бари, ресторани, нічні клуби, спорт, казино, університет, телестудія. Кожна дія займає кілька годин доби й має випадкові наслідки.')}</div>
    <div class="small">😊 ${t_('Настрій')} ${S.mood.toFixed(0)}% ${bar29(S.mood)} ❤ ${t_('Здоровʼя')} ${S.hp.toFixed(0)}% ${bar29(S.hp)}</div>
    <div class="btns">${locAvail().map(([k, ic, n]) => `<button class="${k === 'city' ? 'pri' : ''}" ${L.mv ? 'disabled' : ''} onclick="openLoc('${k}')">${ic} ${esc(n)}</button>`).join('')}</div></div>`;
  if (L.agent) h += `<div class="grp">🕵 ${t_('Служба')}</div><div class="small">${esc(t_(G.AGENT_RANKS[L.agent.rank]))} · ${L.agent.svc === 'int' ? t_('СБ') : t_('розвідка')} · ✅ ${L.agent.done} · ❌ ${L.agent.fail}</div>`;
  if (L.estate && L.estate.length) h += `<div class="grp">🏠 ${t_('Нерухомість')}</div>` + L.estate.map(p => `<div class="small">${G.ESTATE[p.k].ic} ${esc(t_(G.ESTATE[p.k].n))} ${esc(p.name)} · ${t_('рів.')} ${p.lvl} · ${esc(G.cityName(p.reg))}</div>`).join('');
  const ch = G.courtHist ? G.courtHist() : []; if (ch.length) h += `<div class="grp">⚖ ${t_('Ваші справи')}</div>` + ch.slice(0, 6).map(c => `<div class="small">${c.win ? '🏆' : '❌'} «${esc(t_(c.t))}» · ${c.role === 'pros' ? t_('прокурор') : t_('адвокат')}</div>`).join('');
  if (S.log.length) h += `<div class="grp">📝 ${t_('Сьогодні')}</div>` + S.log.map(x => `<div class="small">${esc(t_(x))}</div>`).join('');
  return h;
};
