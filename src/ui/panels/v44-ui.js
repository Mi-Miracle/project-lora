// v4.4 — інтерфейс: своя справа (фонд, назва, офіс + виробництво, допомога через місто), заклади й розробки малого бізнесу,
// меню вкладок блоками (персонаж / компанія / держава / світ) без дублів, контекстне меню правого кліку по мапі.

// ---------------- СВОЯ СПРАВА ----------------
let bizNm = '';
function bizGoCity(pl) { openLoc('city'); setTimeout(() => { if (typeof cityGo === 'function') cityGo(pl); }, 350); }
TAB_FN.biz = function () { const L = G && G.leader; if (!L) return ''; const b = L.biz;
  let h = `<div class="card small">${t_('Своя справа за профілем професії. Дешевий шлях — кроками: фонд від $50 тис., бізнес-план, допомога (її треба здобути в місті: співбесіда, пітч, захист гранту…), купівля офісу й виробництва, ліцензія, команда. «По-старому» — Карʼєра → Заснувати компанію (≥ $500 тис. власних грошей).')}</div>`;
  if (!b) { const ty = L.job && G.JOB_BIZT[L.job.k]; const B = ty && G.BIZT[ty]; return h + (B ? `<div class="card"><b>🚀 ${esc(t_(B.n))}</b><div class="small mut">${t_('Заклади')}: ${B.units.map(u => u[2] + ' ' + t_(u[1])).join(', ')}</div><div class="small mut">${t_('Ліцензія потребує навички')}: ${esc(t_((G.SKILLS[G.BIZ[L.job.k][2]] || {}).n || ''))} 2+</div>${s2B('▶ ' + t_('Почати готуватися'), 's2Res(G.act.bizStart())', G.bizErr(L), 1)}</div>` : ''); }
  const miss = G.bizReady(b), cap = G.bizCapital(b); const st = (d, n) => `<span class="${d ? 'g' : 'mut'}">${d ? '✔' : '◻'}</span> <b>${t_(n)}</b>`; const P = G.bizProd(b);
  h += `<div class="card"><div class="row"><input style="flex:1;margin-right:6px" maxlength="40" placeholder="${t_('Назва справи')}" value="${esc(bizNm || b.name)}" oninput="bizNm=this.value">${s2B('✔', "s2Res(G.act.bizDo('name',bizNm));bizNm=''", '', 0, 'Зберегти назву')}</div>
    <div class="row"><span>${t_('Стартовий капітал')}</span><b>${money(cap)}</b></div>${s2bar(1 - miss.length / 6, '#4cd28a')}<div class="small mut">${miss.length ? t_('Ще потрібно') + ': ' + miss.map(t_).join(', ') : t_('Усе готово — можна відкриватися!')}</div></div>`;
  h += `<div class="card small">${st(b.fund >= 50000 / 1e9, '1. Фонд справи')} <span class="mut">${money(b.fund)} / ${money(50000 / 1e9)}</span><div class="btns">${s2B('+10%', "s2Res(G.act.bizDo('save',0.1))", '')}${s2B('+25%', "s2Res(G.act.bizDo('save',0.25))", '')}${s2B('+50%', "s2Res(G.act.bizDo('save',0.5))", '')}${s2B('+100%', "s2Res(G.act.bizDo('save',1))", '')}${s2B('↩', "s2Res(G.act.bizDo('unsave'))", b.fund <= 0 ? 'Фонд порожній' : '', 0, 'Забрати гроші з фонду')}</div><div class="mut">${t_('з ваших грошей; від розміру фонду залежить кредит і внесок інвестора')}</div></div>`;
  h += `<div class="card small">${st(b.plan, '2. Бізнес-план')}${b.plan ? ` <span class="mut">${t_('якість')} ${(+b.plan).toFixed(1)}/5</span>` : `<div class="btns">${s2B('✍ ' + t_('Самому (5 дн.)'), "s2Res(G.act.bizDo('plan','self'))", (L.busy || 0) > G.day ? 'Ви зайняті' : '')}${s2B('🧑‍💼 ' + t_('Консультант $3 тис.'), "s2Res(G.act.bizDo('plan','consult'))", '')}</div>`}</div>`;
  h += `<div class="card small">${st(Object.keys(b.help).length, '3. Допомога (до двох джерел, за бажанням)')}<div class="mut">${t_('Кожну допомогу треба здобути в місті — пройти випробування. Вдалий результат підвищує шанс.')}</div>`
    + Object.entries(G.BIZ_HELP).map(([k, H]) => { const PP = G.BIZ_HELPP[k]; const e = G.bizHelpErr(L, k); return `<div class="row"><span>${H[0]} ${esc(t_(H[1]))}<br><span class="mut">${esc(t_(H[2]))} · 📍 ${esc(t_(G.LOCS.city.places[PP[0]].n))}</span></span>${b.help[k] ? `<b class="g">+${money(b.help[k].amt)}</b>` : `<button class="small ${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(t_(e || PP[1]))}" onclick="bizGoCity('${PP[0]}')">🚶 ${t_('Піти')}</button>`}</div>`; }).join('') + `</div>`;
  h += `<div class="card small">${st(b.office && b.prod, '4. Офіс і виробництво — купити обидва')}<div class="row"><span>🏢 ${t_('Офіс')} <span class="mut">(${t_('до 4 людей')})</span></span>${b.office ? '<span class="g">✔</span>' : s2B(money(G.bizOfficeCost), "s2Res(G.act.bizDo('office'))", '')}</div><div class="row"><span>🏭 ${esc(t_(P[0]))} <span class="mut">(${t_('до 8 людей')})</span></span>${b.prod ? '<span class="g">✔</span>' : s2B(money(P[1] / 1e9), "s2Res(G.act.bizDo('prod'))", '')}</div></div>`;
  h += `<div class="card small">${st(b.reg, '5. Реєстрація й ліцензія')} ${b.reg ? '' : s2B('📜 $600 · 5 ' + t_('дн.'), "s2Res(G.act.bizDo('reg'))", '')}</div>`;
  h += `<div class="card small">${st(b.team >= 1, '6. Команда')} <span class="mut">${b.team} ${t_('осіб')}</span><div class="btns">${s2B('+1 · $1.5 тис.', "s2Res(G.act.bizDo('team',1))", !b.office ? 'Спершу офіс' : '')}${s2B('+3', "s2Res(G.act.bizDo('team',3))", !b.office ? 'Спершу офіс' : '')}</div></div>`;
  h += `<div class="btns">${s2B('🎉 ' + t_('Відкрити справу'), 's2Res(G.act.bizOpen())', miss.length ? 'Ще потрібно: ' + miss.join(', ') : '', 1)}${s2B('✖ ' + t_('Відкласти задум'), "s2Res(G.act.bizDo('cancel'))", '', 0, 'Повертає 90% фонду й частину вартості майна')}</div>`;
  return h; };

// ---------------- ЗАКЛАДИ Й РОЗРОБКИ ----------------
let s4Reg = null, s4Unit = null;
function bizUnitsHtml(c) { const B = G.BIZT[c.bizType]; if (!B) return ''; const mul = G.bizDevMul(c);
  let h = `<div class="kpi"><div><b>${money(G.bizMonthly(c))}</b><span>${t_('дохід закладів / міс.')}</span></div><div><b>${(c.bunits || []).length}</b><span>${t_('закладів')}</span></div><div><b>+${Math.round(mul * 100)}%</b><span>${t_('від розробок')}</span></div></div>`;
  if (c.loan && c.loan.left > 0) h += `<div class="small mut">🏦 ${t_('Кредит на відкриття')}: ${money(c.loan.left)} · ${money(c.loan.pay)}/${t_('міс.')}</div>`;
  h += `<div class="grp">🏪 ${t_('Ваші заклади')}</div>` + (c.bunits || []).map((u, i) => { const D = B.units.find(x => x[0] === u.k); if (!D) return ''; const op = u.open > G.day;
    return `<div class="card small"><div class="row"><b>${D[2]} ${esc(t_(D[1]))} ${u.lvl > 1 ? '· ' + t_('рів.') + ' ' + u.lvl : ''}</b><span>${esc(regName(u.t))}</span></div>${op ? `<div class="mut">🏗 ${t_('відкриття через')} ${u.open - G.day} ${t_('дн.')}</div>` : `<div class="row"><span>${t_('Дохід')}</span><b class="g">${money(G.unitRev(c, u))}/${t_('міс.')}</b></div>`}
      <div class="btns">${s2B('⬆ ' + t_('Розширити') + ' ' + money(D[3] / 1e9 * u.lvl * 0.8), `s2Res(G.act.bunitUp(${i}))`, u.lvl >= 5 ? 'Максимум' : op ? 'Ще відкривається' : c.cash < D[3] / 1e9 * u.lvl * 0.8 ? 'Бракує коштів' : '')}${s2B('🗺', `focusReg(${u.t})`, '')}${s2B('✖', `s2Res(G.act.bunitClose(${i}))`, (c.bunits || []).length <= 1 ? 'Останній заклад' : '', 0, 'Продати заклад')}</div></div>`; }).join('');
  const regs = [...new Set([c.offices[0].t, G.N[c.home].home].concat(c.offices.map(o => o.t)))].filter(t => t >= 0); if (s4Reg == null || !G.ter[s4Reg]) s4Reg = regs[0];
  h += `<div class="grp">➕ ${t_('Відкрити заклад')}</div><div class="card small"><div class="row"><span>${t_('Місто')}</span><b>${esc(regName(s4Reg))}</b></div><div class="mut">${t_('Інше місто — ПКМ по мапі → «Відкрити заклад тут» (у країнах, де є офіс)')}</div>`
    + B.units.map(D => `<div class="row"><span>${D[2]} ${esc(t_(D[1]))}<br><span class="mut">≈${money(D[4] / 1e9)}/${t_('міс.')} · ${D[5]} ${t_('дн.')}</span></span>${s2B(money(D[3] / 1e9), `s2Res(G.act.bunitOpen('${D[0]}',${s4Reg}))`, G.bunitErr(c, D[0], s4Reg))}</div>`).join('') + `</div>`;
  h += `<div class="grp">💡 ${t_('Розробки')}</div>`; if (c.bres) { const d = G.bizDevs(c).find(x => x[0] === c.bres.k); h += `<div class="card small"><b>⏳ ${esc(t_(d ? d[1] : ''))}</b>${s2bar((G.day - c.bres.d0) / Math.max(1, c.bres.done - c.bres.d0), '#5aa7d8')}<div class="mut">${c.bres.done - G.day} ${t_('дн.')}</div></div>`; }
  h += G.bizDevs(c).map(d => { const done = (c.bdev || {})[d[0]] === 'done'; return `<div class="row small"><span>${done ? '✔' : '💡'} ${esc(t_(d[1]))} <span class="mut">+${Math.round(d[3] * 100)}% · ${d[4]} ${t_('дн.')}</span></span>${done ? '' : s2B(money(d[2] / 1e9), `s2Res(G.act.bdevStart('${d[0]}'))`, G.bdevErr(c, d[0]))}</div>`; }).join('');
  return h; }
{ const base = TAB_FN.coops; TAB_FN.coops = function () { const c = G.myCo(); if (!c) return ''; let h = ''; if (c.bizType) h += bizUnitsHtml(c); const rest = base ? base() : ''; return h + (rest && c.bizType ? `<div class="grp">⚙ ${t_('Можливості сектору')}</div>` : '') + rest; }; }
{ const base = window.curTabs; window.curTabs = function () { const r = base.apply(this, arguments); const c = G && G.pc >= 0 && G.myCo(); if (c && c.bizType) { const B = G.BIZT[c.bizType]; const i = r.findIndex(x => x[0] === 'coops'); const lab = '🏪 ' + (B ? B.n : 'Заклади'); if (i >= 0) r[i] = ['coops', lab]; else { const j = r.findIndex(x => x[0] === 'co'); r.splice(j + 1, 0, ['coops', lab]); } } return r; }; }
// малий бізнес не будує заводи сектору — лише свої заклади
{ const base = window.coSec; window.coSec = function (c) { const s = base(c); return c && c.bizType ? Object.assign({}, s, { assets: [] }) : s; }; }

// ---------------- МЕНЮ ВКЛАДОК БЛОКАМИ ----------------
const RAIL_G = [['me', '🧑', 'Персонаж', ['char', 'lead', 'career', 'ops', 'front', 'post', 'biz', 'skills', 'life', 'family', 'party', 'city']],
  ['co', '🏢', 'Компанія', ['co', 'coops', 'coprod', 'cotrade', 'cotend', 'cord', 'cobuild', 'codipl', 'cofin']],
  ['st', '🏛', 'Держава', ['state', 'op', 'econ', 'logi', 'army', 'build', 'tech', 'colony', 'planet', 'intel', 'spy', 'mins', 'staff']],
  ['wd', '🌐', 'Світ', ['dipl', 'un', 'world', 'deals']]];
const SMALL_HIDE = ['coprod', 'cotrade', 'cotend', 'cord', 'cobuild'];
// дві колонки: зліва розділи (Персонаж/Компанія/Держава/Світ), справа — вкладки обраного розділу
let railSec = (() => { try { return localStorage.getItem('lora_rsec') || 'me'; } catch (e) { return 'me'; } })();
const RSEC_LAST = {};
function railList() { const c = G.pc >= 0 && G.myCo(); const seen = new Set(); return curTabs().filter(([k]) => { if (seen.has(k)) return false; seen.add(k); return !(c && c.bizType && SMALL_HIDE.includes(k)); }); }
function railGOf(k) { return (RAIL_G.find(g => g[3].includes(k)) || RAIL_G[3])[0]; }
function railSecClick(g) { const L = $('#left'); if (railSec === g && !L.classList.contains('hide')) { L.classList.add('hide'); renderTabs(); return; }
  railSec = g; try { localStorage.setItem('lora_rsec', g); } catch (e) { } const l = railList().filter(([k]) => railGOf(k) === g); if (!l.length) return;
  tab = (RSEC_LAST[g] && l.some(([k]) => k === RSEC_LAST[g])) ? RSEC_LAST[g] : l[0][0]; L.classList.remove('hide'); renderTabs(); renderTab(true); }
{ const base = window.renderTabs; window.renderTabs = function () { base.apply(this, arguments); const el = document.getElementById('tabs'); if (!el || !G) return;
  const list = railList(); const btn = ([k, v]) => `<button class="${tab === k ? 'on' : ''}" data-k="${k}" onclick="railClick('${k}')">${tabLabel(k, v)}</button>`;
  const groups = (G.mpRole && ROLE_TABS[G.mpRole]) ? [] : RAIL_G.map(g => [g, list.filter(([k]) => railGOf(k) === g[0])]).filter(([, l]) => l.length);
  if (groups.length < 2) { el.className = 'one'; el.innerHTML = `<div class="rt">${list.map(btn).join('')}</div>`; return; }
  if (list.some(([k]) => k === tab)) { railSec = railGOf(tab); RSEC_LAST[railSec] = tab; }
  if (!groups.some(([g]) => g[0] === railSec)) railSec = groups[0][0][0];
  const cur = groups.find(([g]) => g[0] === railSec); el.className = 'two';
  el.innerHTML = `<div class="rs">${groups.map(([g, l]) => `<div class="rs-b ${g[0] === railSec ? 'on' : ''}" data-s="${g[0]}" onclick="railSecClick('${g[0]}')" data-tip="${esc(t_(g[2]))} · ${l.length}"><b>${g[1]}</b><span>${esc(t_(g[2]))}</span></div>`).join('')}</div>`
    + `<div class="rt"><div class="rt-h">${cur[0][1]} ${esc(t_(cur[0][2]))}</div>${cur[1].map(btn).join('')}</div>`; }; }

// ---------------- ПРАВИЙ КЛІК ПО МАПІ ----------------
function mapCtxClose() { const m = document.getElementById('mctx'); if (m) m.remove(); }
function mapCtx(e) { mapCtxClose(); if (!G || G.gameOver) return; const t = pickTerritory(e.clientX, e.clientY); if (t < 0) return; const L = G.leader, ter = G.ter[t], nid = ter.ctrl; const items = [];
  const it = (ic, n, fn, err) => items.push({ ic, n, fn, err });
  window._mctx = [];
  const add = (ic, n, f, err) => { window._mctx.push(f); it(ic, n, window._mctx.length - 1, err); };
  add('🔎', 'Про регіон', () => { sel = { type: 't', id: t }; renderRight(); });
  if (L && L.role === 'char') {
    if (L.at !== t) add('✈', 'Поїхати сюди', () => { if (typeof ldGo === 'function') ldGo(t); else s2Res(G.leaderGo(t)); }, L.front != null || L.op ? 'Ви зайняті' : '');
    else add('🏙', 'Відкрити місто', () => openLoc('city'));
    const u = G.unitOf && G.unitOf(L); if (u && L.front === u.id) add('🎖', `«${u.name}» — сюди`, () => s2Res(G.act.unitMove(u.id, t)));
    if (L.job && G.JOB_OPS[L.job.k] && !L.op) G.JOB_OPS[L.job.k].forEach(op => { if (op.tg === 'home' || op.tg === 'build') return; const ts = G.opTargets(L, op); if (!ts.includes(t)) return; add('🗂', op.n, () => s2Res(G.act.opStart(op.id, t)), G.opErr(L, op.id, t)); });
  }
  const c = G.pc >= 0 && G.myCo(); if (c) {
    if (!G.coHasOffice(c, nid)) add('🏢', 'Відкрити офіс компанії тут', () => s2Res(G.act.coOffice(t)));
    if (c.bizType) add('🏪', 'Відкрити заклад тут', () => { s4Reg = t; tab = 'coops'; $('#left').classList.remove('hide'); renderTabs(); renderTab(true); });
    if (c.sector === 'logistics') { add('🚚', 'Маршрут: звідси', () => { s2R.a = t; tab = 'coops'; $('#left').classList.remove('hide'); renderTabs(); renderTab(true); }); add('🏁', 'Маршрут: сюди', () => { s2R.b = t; tab = 'coops'; $('#left').classList.remove('hide'); renderTabs(); renderTab(true); }); }
    if (G.secRes(c.sector).length) add('🔍', 'Геологорозвідка тут', () => s2Res(G.act.mineSurvey(t)), G.survErr(c, t));
  }
  if (G.player >= 0 && ter.owner === G.player) add('🏗', 'Будувати тут', () => { sel = { type: 't', id: t }; tab = 'build'; $('#left').classList.remove('hide'); renderTabs(); renderTab(true); renderRight(); });
  add('🎯', 'Центрувати мапу', () => focusReg(t));
  const m = document.createElement('div'); m.id = 'mctx'; m.className = 'mctx';
  m.innerHTML = `<div class="mctx-h">${esc(regName(t))} <span class="mut">${esc(G.N[nid].name)}</span></div>` + items.map(x => `<button ${x.err ? 'disabled' : ''} data-tip="${esc(t_(x.err || ''))}" onclick="mapCtxClose();_mctx[${x.fn}]()">${x.ic} ${esc(t_(x.n))}</button>`).join('');
  document.body.appendChild(m); const W = m.offsetWidth, H = m.offsetHeight; m.style.left = Math.min(e.clientX, innerWidth - W - 8) + 'px'; m.style.top = Math.min(e.clientY, innerHeight - H - 8) + 'px'; }
document.addEventListener('mousedown', e => { const m = document.getElementById('mctx'); if (m && !m.contains(e.target)) mapCtxClose(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') mapCtxClose(); });
{ const st = document.createElement('style'); st.textContent = `.mctx{position:fixed;z-index:950;min-width:220px;background:#141c27f5;border:1px solid #3a4a60;border-radius:10px;padding:6px;box-shadow:0 8px 24px #0008;display:flex;flex-direction:column;gap:2px}
.mctx-h{font-weight:700;padding:4px 8px 6px;border-bottom:1px solid #2a3646;margin-bottom:4px}.mctx button{text-align:left;background:none;border:0;padding:6px 8px;border-radius:6px;color:inherit;cursor:pointer}.mctx button:hover:not([disabled]){background:#24324a}.mctx button[disabled]{opacity:.45;cursor:default}
`; document.head.appendChild(st); }
// підробітки за фахом — у вкладці «Справи»
{ const base = TAB_FN.ops; TAB_FN.ops = function () { let h = base(); const L = G.leader; if (!L || !L.job || !G.SIDE[L.job.k]) return h; const j = G.JOBS[L.job.k];
  h += `<div class="grp">💵 ${t_('Підробітки за фахом')}</div><div class="small mut">${t_('Разові замовлення за професією — що вища посада, то дорожчі. Виконуються на робочому місці в місті.')}</div>`;
  h += G.SIDE[L.job.k].map(([lvl, key, n, hh, lo, hi, cd]) => { const c = (L.side || {})[L.job.k + ':' + key] || 0; const lock = L.job.lvl < lvl; return `<div class="row small"><span>${lock ? '🔒' : '💵'} ${esc(t_(n))}<br><span class="mut">$${lo}–${hi} · ${hh} ${t_('год')}${lock ? ' · ' + t_('з посади') + ' «' + esc(t_(j.ranks[lvl - 1][0])) + '»' : c > G.day ? ' · ' + t_('через') + ' ' + (c - G.day) + ' ' + t_('дн.') : ''}</span></span>${lock || c > G.day ? '' : `<button class="small pri" onclick="bizGoCity('${j.place}')">🚶 ${t_('Піти')}</button>`}</div>`; }).join('');
  return h; }; }
