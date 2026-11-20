// ВКЛАДКИ «🇺🇳 ООН» і «🪐 Колонії», блок гібридних операцій у панелі країни, сюжетна кампанія з навчанням.
function ggRes(r) { hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
// ---------- ООН 2.0
let unSel = 'carbon', unTgt = null;
TAB_FN.un = function () {
  if (!G || G.player < 0 || !G.un) return ''; const U = G.un, me = G.player;
  const nm = id => esc(nat(id).name); const RS = G.UN_RES;
  let h = `<div class="card small">${t_('ООН 2.0: кожна країна має голос. Звичайні резолюції — простою більшістю. Обовʼязкові (санкції, миротворці, заборона орбітальної зброї) — ще й ≥9 голосів Радбезу без вето постійних членів.')}</div>`;
  h += `<div class="grp">🏛 ${t_('Рада безпеки')}</div><div class="small"><b>${t_('Постійні (вето)')}:</b> ${U.p5.map(nm).join(', ')}<br><b>${t_('Обрані на рік')}:</b> ${U.sc.map(nm).join(', ') || '—'}${[...U.p5, ...U.sc].includes(me) ? `<br><span class="g">★ ${t_('Ви — член Радбезу')}</span>` : ''}</div>`;
  const laws = Object.values(U.laws).filter(l => l.until > G.day); h += `<div class="grp">📜 ${t_('Чинні резолюції')}</div>` + (laws.map(l => `<div class="row small"><span>${RS[l.k].ic} ${esc(t_(RS[l.k].n))}${l.t != null ? ' — ' + nm(l.t) : ''}</span><span class="mut">${t_('ще')} ${l.until - G.day} ${t_('дн.')}</span></div>`).join('') || `<div class="mut small">${t_('Немає')}</div>`);
  h += `<div class="grp">🗳 ${t_('На голосуванні')}</div>` + (U.prop.map(R => { const v = R.votes[me]; const y = Object.values(R.votes).filter(x => x === 'yes').length, n = Object.values(R.votes).filter(x => x === 'no').length;
    return `<div class="card small">${RS[R.k].ic} <b>${esc(t_(RS[R.k].n))}</b>${R.target != null ? ' — ' + nm(R.target) : ''} <span class="mut">(${t_('вносить')} ${nm(R.by)}, ${t_('ще')} ${R.end - G.day} ${t_('дн.')})</span><div class="mut">${esc(t_(RS[R.k].d))}</div><div>✅ ${y} · ❌ ${n} · ${t_('ваш голос')}: <b>${v ? { yes: t_('за'), no: t_('проти'), abs: t_('утрималися') }[v] : '—'}</b></div>
      <div class="btns"><button class="small" onclick="ggRes(G.act.unVote(${R.id},'yes'))">✅ ${t_('За')}</button><button class="small" onclick="ggRes(G.act.unVote(${R.id},'no'))">❌ ${t_('Проти')}</button><button class="small" onclick="ggRes(G.act.unVote(${R.id},'abs'))">⚪ ${t_('Утриматися')}</button></div></div>`; }).join('') || `<div class="mut small">${t_('Немає')}</div>`);
  const R0 = RS[unSel]; const targets = G.N.filter(x => x.alive && x.id !== me).sort((a, b) => a.name.localeCompare(b.name));
  h += `<div class="grp">✍ ${t_('Внести резолюцію')}</div><div class="row"><select onchange="unSel=this.value;renderTab(true)" style="width:100%">${Object.entries(RS).map(([k, R]) => `<option value="${k}" ${k === unSel ? 'selected' : ''}>${R.ic} ${esc(t_(R.n))}${R.bind ? ' ⚖' : ''}</option>`).join('')}</select></div>
    <div class="small mut">${esc(t_(R0.d))}${R0.bind ? ' · ⚖ ' + t_('обовʼязкова (Радбез, вето)') : ''}</div>
    ${R0.target ? `<div class="row"><span>${t_('Проти кого')}</span><select onchange="unTgt=+this.value" style="width:60%"><option value="">—</option>${targets.map(x => `<option value="${x.id}" ${unTgt === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>` : ''}
    <div class="btns"><button class="pri" onclick="ggRes(G.act.unPropose(unSel, ${R0.target ? 'unTgt' : 'null'}))">🇺🇳 ${t_('Внести')}</button></div>`;
  h += `<div class="grp">📚 ${t_('Історія')}</div>` + (U.hist.slice(0, 10).map(x => `<div class="row small"><span>${RS[x.k].ic} ${esc(t_(RS[x.k].n))}${x.t != null ? ' — ' + nm(x.t) : ''}</span><span class="${x.pass ? 'g' : 'r'}">${x.pass ? t_('ухвалено') : x.veto ? t_('вето') : t_('провалено')} ${x.yes}:${x.no}</span></div>`).join('') || `<div class="mut small">—</div>`);
  return h;
};
// ---------- Колонії
let colBody = 'moon', colZone = null;
TAB_FN.colony = function () {
  if (!G || G.player < 0 || !G.colony) return ''; const B = G.colony[colBody], me = G.player, req = G.colReq(me, colBody);
  let h = `<div class="btns">${['moon', 'mars'].map(b => `<button class="${colBody === b ? 'on' : ''}" onclick="colBody='${b}';colZone=null;renderTab(true)">${b === 'moon' ? '🌕 ' + t_('Місяць') : '🔴 ' + t_('Марс')} · ${G.colony[b].zones.filter(z => z.owner === me).length}/${G.colony[b].zones.length}</button>`).join('')}</div>`;
  h += `<canvas id="colcv" width="372" height="300" style="width:100%;border-radius:10px;background:#05080d;cursor:pointer"></canvas>`;
  if (req) h += `<div class="card small y">🔒 ${esc(t_(req))}</div>`;
  const z = colZone != null ? B.zones[colZone] : null;
  if (z) { const own = z.owner >= 0 ? nat(z.owner) : null, o = G.colOut(z);
    h += `<div class="card small"><b>${esc(t_(z.n))}</b> · ${own ? `${t_('власник')}: <b>${esc(own.name)}</b>` : `<span class="g">${t_('вільна зона')}</span>`}<div class="mut">${t_('Ресурси')}: ${Object.entries(z.res).map(([k, v]) => ({ he3: '🌑 ' + t_('гелій-3'), ice: '🧊 ' + t_('лід'), rare: '💎 ' + t_('метали') })[k] + ' ' + '★'.repeat(v)).join(' · ')}</div>
      ${z.owner >= 0 ? `<div>👥 ${Math.round(z.pop)} · 💰 ${money(o.cash)}/${t_('міс.')}${o.sci ? ' · 🔬 +' + (o.sci * 100).toFixed(1) + '%' : ''}</div><div class="mut">${Object.entries(G.COL_MOD).map(([k, M]) => `${M.ic}${z.m[k] || 0}`).join(' ')}</div>` : ''}</div>`;
    if (z.owner === me) h += `<div class="btns">${Object.entries(G.COL_MOD).map(([k, M]) => { const l = z.m[k] || 0; const c = M.c * (1 + l * 0.6) * (colBody === 'mars' ? 1.5 : 1); return `<button class="small" ${l >= 5 ? 'disabled' : ''} data-tip="${esc(t_(M.d))}" onclick="ggRes(G.act.colBuild('${colBody}',${z.id},'${k}'))">${M.ic} ${esc(t_(M.n))} ${l}→${l + 1} · ${money(c)}</button>`; }).join('')}</div>`;
    else if (!req) h += `<div class="btns"><button class="pri" onclick="ggRes(G.act.colClaim('${colBody}',${z.id}))">${z.owner >= 0 ? '⚔ ' + t_('Спробувати захопити') : '🚩 ' + t_('Заснувати колонію')} · ${money(G.colClaimCost(colBody) * (z.owner >= 0 ? 1.5 : 1))}</button></div>${z.owner >= 0 && G.unActive('space') ? `<div class="small y">${t_('Договір про мирний космос забороняє захоплення')}</div>` : ''}`;
  } else h += `<div class="mut small">${t_('Клацніть зону на диску.')}</div>`;
  h += `<div class="grp">🌍 ${t_('Хто де')}</div>` + ['moon', 'mars'].map(b => `<div class="small"><b>${b === 'moon' ? t_('Місяць') : t_('Марс')}:</b> ${G.colony[b].zones.filter(z => z.owner >= 0).map(z => esc(nat(z.owner).name) + ' (' + esc(t_(z.n)) + ')').join(', ') || '—'}</div>`).join('');
  setTimeout(colDraw, 0); return h;
};
function colDraw() {
  const cv = document.getElementById('colcv'); if (!cv || !G || !G.colony) return; const cx = cv.getContext('2d'), W = cv.width, H = cv.height, B = G.colony[colBody], R = H * 0.43, X = W / 2, Y = H / 2;
  cx.clearRect(0, 0, W, H); for (let i = 0; i < 60; i++) { cx.fillStyle = 'rgba(255,255,255,' + (0.2 + (i * 37 % 10) / 15) + ')'; cx.fillRect((i * 97) % W, (i * 53) % H, 1.2, 1.2); }
  const g = cx.createRadialGradient(X - R * 0.3, Y - R * 0.3, R * 0.1, X, Y, R); if (colBody === 'moon') { g.addColorStop(0, '#d8d8d0'); g.addColorStop(1, '#5a5a58'); } else { g.addColorStop(0, '#e8875a'); g.addColorStop(1, '#6a2a14'); }
  cx.fillStyle = g; cx.beginPath(); cx.arc(X, Y, R, 0, 7); cx.fill();
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = R * (0.2 + (i * 0.37 % 0.7)); cx.fillStyle = 'rgba(0,0,0,0.12)'; cx.beginPath(); cx.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.9, 6 + (i % 4) * 5, 0, 7); cx.fill(); }
  B.zones.forEach((z, i) => { const zx = X + z.x * R, zy = Y + z.y * R; const own = z.owner >= 0 ? nat(z.owner) : null; const col = own ? natColor(z.owner) : '#9fb6cc';
    cx.lineWidth = colZone === i ? 4 : 2; cx.strokeStyle = colZone === i ? '#ffd34d' : col; cx.fillStyle = own ? col + '99' : 'rgba(255,255,255,0.12)'; cx.beginPath(); cx.arc(zx, zy, 16, 0, 7); cx.fill(); cx.stroke();
    cx.font = '14px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(own ? (z.m.port ? '🚀' : z.m.hab ? '🏠' : '🚩') : '·', zx, zy);
    cx.font = '600 10px system-ui'; cx.lineWidth = 3; cx.strokeStyle = '#05080d'; const lab = t_(z.n).split(' (')[0]; cx.strokeText(lab, zx, zy + 26); cx.fillStyle = '#e8f0f8'; cx.fillText(lab, zx, zy + 26); });
  cv.onclick = ev => { const r = cv.getBoundingClientRect(), mx = (ev.clientX - r.left) * W / r.width, my = (ev.clientY - r.top) * H / r.height; let best = null, bd = 30 * 30; B.zones.forEach((z, i) => { const d = (X + z.x * R - mx) ** 2 + (Y + z.y * R - my) ** 2; if (d < bd) { bd = d; best = i; } }); if (best != null) { colZone = best; renderTab(true); } };
}
function natColor(id) { try { const c = nat(id).col; return Array.isArray(c) ? '#' + c.map(x => Math.round(x).toString(16).padStart(2, '0')).join('') : (c || '#4fb3ff'); } catch (e) { return '#4fb3ff'; } }
// ---------- рейка: ООН і Колонії для держави
{ const base = window.curTabs; if (base) window.curTabs = function () { const r = base.apply(this, arguments); if (G && G.player >= 0 && G.un && !r.some(x => x[0] === 'un')) { const i = r.findIndex(x => x[0] === 'dipl'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['un', '🇺🇳 ООН']); const j = r.findIndex(x => x[0] === 'tech'); r.splice(j >= 0 ? j + 1 : r.length, 0, ['colony', '🪐 Колонії']); } return r; }; }
// ---------- гібридні операції в панелі країни
{ const base = window.interBlock; if (base) window.interBlock = function (x) { const h = base(x); if (!G || G.player < 0 || x === G.player || !G.HYB) return h; const me = nat(G.player);
  const ops = (G.hops || []).filter(o => o.a === G.player && o.b === x && o.until > G.day).map(o => G.HYB[o.k].ic).join('');
  return h + `<div class="grp">🕶 ${t_('Гібридні операції')}${ops ? ' · ' + ops : ''}</div><div class="small mut">${t_('Ризик викриття росте з рівнем фактчекерів цілі')} (${t_('у цілі')}: ${nat(x).hdef || 0}/5). ${t_('Ваш захист')}: ${me.hdef || 0}/5 <button class="small" onclick="const r=G.act.hdefUp();hint(r.ok?'✅ '+t_(r.msg):'⚠ '+t_(r.err),3000);renderRight()">🛡 ${t_('Посилити')}</button></div><div class="btns">`
    + Object.entries(G.HYB).map(([k, H]) => { const e = G.hybCan(G.player, x, k); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(H.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="const r=G.act.hybDo(${x},'${k}');hint(r.ok?'🕶 '+t_(r.msg):'⚠ '+t_(r.err),3000);renderRight();renderTop()">${H.ic} ${esc(t_(H.n))} · ${money(me.agg.gdp * H.c)}</button>`; }).join('') + '</div>'; }; }

// ================= КАМПАНІЯ + НАВЧАННЯ =================
const CAMP_TUT = [
  { t: 'Це мапа світу. Покрутіть колесо миші, щоб наблизити або віддалити.', sel: '#map', ok: s => Math.abs(view.s - s.s0) > 0.3 },
  { t: 'Клацніть лівою кнопкою на будь-який регіон — праворуч зʼявиться інформація про нього.', sel: '#map', ok: () => sel && sel.type === 't' },
  { t: 'Унизу — розділи (Персонаж, Робота, Бізнес, Держава, Світ) і пошук, ліворуч — вкладки розділу. Відкрийте «Персонаж».', sel: '#tabs [data-k="char"]', ok: () => tab === 'char' },
  { t: 'Тут керування часом. Натисніть ▶, щоб світ ожив. Пробіл — пауза.', sel: '#top', ok: () => speedIdx > 0 },
  { t: 'Вгорі — ваші гроші, слава і де ви зараз. Карʼєра — у вкладці «Карʼєра».', sel: '#top', next: 1 },
  { t: '📜 Доручення вгорі — короткі завдання з нагородою. А Esc відкриває меню паузи.', sel: '#top', next: 1 },
  { t: 'Готово! Далі — сюжет. Цілі розділу завжди видно в картці кампанії.', sel: '#campCard', next: 1 }
];
let campTut = null;
function campHUD() {
  let el = document.getElementById('campCard'); if (!G || !G.camp) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'campCard'; document.body.appendChild(el); }
  const C = G.camp; if (C.ch >= G.CAMP.length) { el.innerHTML = `<b>📖 ${t_('Кампанію пройдено!')}</b> 👑`; return; }
  const ch = G.CAMP[C.ch], gs = G.campGoals(); const fold = el.classList.contains('fold');
  el.innerHTML = `<div class="cc-h" onclick="this.parentNode.classList.toggle('fold');campHUD()">📖 <b>${esc(t_(ch.t))}</b> <span class="mut">${C.ch + 1}/${G.CAMP.length}</span> ${fold ? '▾' : '▴'}</div>` + (fold ? '' : gs.map(g => `<div class="cc-g ${g.ok ? 'ok' : ''}">${g.ok ? '✅' : '⬜'} ${esc(t_(g.n))}${!g.ok && g.p ? ` <span class="mut">${Math.floor(g.p * 100)}%</span>` : ''}</div>`).join('') + `<div class="cc-b"><button class="small" onclick="campStory()">📜 ${t_('Сюжет')}</button></div>`);
}
function campStory(fin) {
  if (!G || !G.camp) return; const C = G.camp; const ch = fin ? null : G.CAMP[Math.min(C.ch, G.CAMP.length - 1)];
  const txt = fin ? t_('Ти пройшов(ла) шлях від простої людини до Володаря Атласу. Світ памʼятатиме твоє імʼя. Гра триває — тепер правила пишеш ти.') : t_(ch.story);
  const who = fin ? t_('Наставник') : t_(ch.who);
  openModal(`<div class="camp-st"><div class="camp-av">${avatar('mentor-' + who, 72, { fem: /Мирослава|Генсек/.test(who) })}</div><div><div class="mut small" style="letter-spacing:.15em">${fin ? '👑 ФІНАЛ' : esc(t_(ch.t)).toUpperCase()}</div><h2 style="margin:4px 0">${esc(who)}</h2><p>${esc(txt)}</p></div></div><div class="btns"><button class="pri" onclick="closeModal();campAfterStory()">${fin ? '🎉 ' + t_('Дякую!') : '▶ ' + t_('Почати')}</button></div>`);
  try { if (typeof speak === 'function') speak(txt); } catch (e) { }
  if (fin) LORA.bus.emit('fx', { kind: 'party', title: '👑 ' + t_('ВОЛОДАР АТЛАСУ'), sub: G.leader ? G.leader.name : '' });
}
function campAfterStory() { if (G && G.camp && G.camp.ch === 0 && !G.camp.tut) { campTut = { i: 0, s0: view.s }; tutShow(); } campHUD(); }
function tutShow() {
  document.querySelectorAll('.tut-hl,.tut-tip').forEach(e => e.remove()); if (!campTut) return; const S = CAMP_TUT[campTut.i]; if (!S) { campTut = null; G.act.campTut(); campHUD(); return; }
  const tg = document.querySelector(S.sel); const r = tg ? tg.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 40, width: 200, height: 80 };
  const big = S.sel === '#map'; const hl = document.createElement('div'); hl.className = 'tut-hl'; Object.assign(hl.style, big ? { left: '40%', top: '40%', width: '20%', height: '20%' } : { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); document.body.appendChild(hl);
  const tip = document.createElement('div'); tip.className = 'tut-tip'; tip.innerHTML = `<div class="mut small">${t_('Навчання')} ${campTut.i + 1}/${CAMP_TUT.length}</div><div>${esc(t_(S.t))}</div><div class="btns">${S.next ? `<button class="pri small" onclick="campTut.i++;tutShow()">${t_('Далі')} →</button>` : ''}<button class="small" onclick="campTut.i=99;tutShow()">${t_('Пропустити навчання')}</button></div>`;
  document.body.appendChild(tip); const tx = big ? innerWidth * 0.5 - 170 : Math.min(innerWidth - 360, Math.max(10, r.left)), ty = big ? innerHeight * 0.62 : (r.top + r.height + 14 + 160 > innerHeight ? r.top - 150 : r.top + r.height + 14); Object.assign(tip.style, { left: tx + 'px', top: ty + 'px' });
}
setInterval(() => { if (!campTut || !G) return; const S = CAMP_TUT[campTut.i]; if (S && S.ok && S.ok(campTut)) { campTut.i++; campTut.s0 = view.s; AUD.sfx && AUD.sfx('good'); tutShow(); } }, 400);
LORA.bus.on('camp', e => { setTimeout(() => { campHUD(); if (e.fin) campStory(true); else campStory(); if (!e.start) LORA.bus.emit('fx', { kind: 'party', title: '📖 ' + t_('Розділ виконано!'), sub: t_(G.CAMP[e.ch - 1].t) }); }, e.start ? 600 : 300); });
LORA.bus.on('day', () => { if (G && G.camp && G.day % 2 === 0) campHUD(); });
// старт кампанії з головного меню
function campaignStart() {
  const L = ['UKR', 'POL', 'USA', 'DEU', 'GBR', 'FRA', 'JPN', 'CAN', 'BRA', 'IND', 'TUR', 'ITA', 'ESP', 'KOR', 'AUS'].filter(a => G0name(a));
  openModal(`<h2>📖 ${t_('Кампанія «Володар Атласу»')}</h2><p class="mut">${t_('11 розділів: від простої людини до лідера світу. Перший розділ — навчання. Сюжет, наставники, нагороди.')}</p>
    <div class="row"><span>${t_('Імʼя героя')}</span><input id="cmpN" type="text" value="${esc(t_('Олена Коваль'))}" style="width:55%"></div>
    <div class="row"><span>${t_('Країна')}</span><select id="cmpC" style="width:55%">${L.map(a => `<option value="${a}">${esc(G0name(a))}</option>`).join('')}</select></div>
    <div class="btns"><button class="pri" onclick="campaignGo()">▶ ${t_('Почати історію')}</button><button onclick="closeModal()">${t_('Скасувати')}</button></div>`);
}
function G0name(a3) { const c = (D.cells || []).find(x => x.a3 === a3); const n = c && (c.n || c.name); return n ? (LORA.lang === 'en' ? t_(n) : n) : null; }
function campaignGo() {
  const name = (document.getElementById('cmpN').value || '').trim() || t_('Олена Коваль'), home = document.getElementById('cmpC').value; closeModal();
  G = LORA.createGame({ seed: (Date.now() % 1e9) | 0 }); G.init(null, 'world2026', { char: { name, type: 'student', home, stage: null } }); G.campStart();
  $('#start').style.display = 'none'; startUI();
}
