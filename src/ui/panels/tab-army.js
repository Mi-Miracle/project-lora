// ВКЛАДКА «АРМІЯ»: огляд сил, армії, мобілізація, флоти.
TAB_FN.army = function () {
  const n = nat(G.player), A = n.agg, P = G.player; const pool = A.pop * 1000 * n.pol.mob, tr = A.troops || 0;
  const arms = G.armies.filter(a => a.n === P), fl = G.fleets.filter(f => f.n === P);
  const recT = sel && sel.type === 't' && G.ter[sel.id].ctrl === P ? sel.id : n.home;
  const sub = curSub('army', 'land');
  let h = `<div class="kpi"><div><span>Особовий склад</span><b>${people(tr)}</b></div><div><span>Ліміт мобілізації</span><b>${people(pool)}</b></div><div><span>Якість</span><b>${n.q.toFixed(2)}</b></div><div><span>Арсенал</span><b>${money(n.milStock)}</b></div><div><span>Флот</span><b>${G.shipsOf(P).toFixed(0)} кор.</b></div><div data-tip="Бойові літаки. Перевага в повітрі посилює наступ; її знижують ворожа авіація й ППО. Виробляються на оборонних заводах."><span>Авіація</span><b>✈ ${Math.round(G.airTotal ? G.airTotal(n) : 0)}${n.airEdge && n.airEdge !== 1 ? ` <small class="${n.airEdge > 1 ? 'g' : 'r'}">${n.airEdge > 1 ? '+' : ''}${Math.round((n.airEdge - 1) * 100)}%</small>` : ''}</b></div><div><span>Втрати</span><b class="r">${people(n.casualties)}</b></div></div>
  ${n.ratio.chips < 0.9 || n.ratio.metal < 0.9 || n.ratio.machinery < 0.9 ? '<div class="card y">⚠ Дефіцит мікроелектроніки/металу/обладнання сповільнює виробництво озброєнь.</div>' : ''}${n.ratio.oil < 0.9 ? '<div class="card r">⚠ Дефіцит пального погіршує постачання армій.</div>' : ''}`;
  h += subnav('army', [['land', 'Армії'], ['air', 'Авіація'], ['navy', 'Флот'], ['models', 'Техніка'], ['gens', 'Генерали'], ['war', 'Полонені й легіон'], ['units', 'Арсенал'], ['strike', 'Удари'], ['nuke', '☢ Ядерка']]);
  if (sub === 'land') {
    h += arms.map(a => `<div class="card" style="cursor:pointer;${sel && sel.type === 'a' && sel.id === a.id ? 'border-color:#ffd34d' : ''}" onclick="selArmy(${a.id})"><div class="row"><b>${esc(a.name)}</b><span>${G.vetStars ? '<b class="y">' + G.vetStars(a) + '</b> ' : ''}${G.tplOf ? D.armyTemplates[G.tplOf(a)].ic + ' ' : ''}${people(a.k)}</span></div>
      <div class="row small"><span>${esc(regName(a.t))}${a.mv ? ' → ' + esc(regName(a.mv.dst)) : ''}</span><span>${a.train > 0 ? '⏳ ' + a.train + ' дн.' : a.mv ? (a.mv.sea ? '⚓ море' : '🚚 марш') : G.armies.some(x => x.t === a.t && G.atWar(x.n, P)) ? '<span class="r">⚔ бій</span>' : 'стоїть'}</span></div>
      <div class="row small"><span>орг. ${pct(a.org, 0)} · пост. ${pct(a.sup, 0)} · ${a.stance === 'attack' ? '➤ наступ' : '🛡 оборона'}</span><span>${a.auto ? '🤖 авто' : ''}</span></div></div>`).join('') || '<div class="mut">Немає армій</div>';
    h += `<div class="btns"><button onclick="G.armies.filter(a=>a.n===G.player).forEach(a=>a.auto=true);renderTab(true)">🤖 Усім авто</button><button onclick="G.armies.filter(a=>a.n===G.player).forEach(a=>a.auto=false);renderTab(true)">✋ Ручне керування</button></div>
    <div class="grp">Мобілізація нової армії</div><div class="card"><div class="row"><span>Місце формування</span><b>${esc(regName(recT))}</b></div>
    ${slider('recK', 'Чисельність', 10, 300, 5, window._recK || 50, v => v + ' тис.', '')}
    ${D.armyTemplates ? `<div class="row small"><span>Шаблон</span><b>${esc(D.armyTemplates[window._recTpl || 'std'].n)}</b></div><div class="btns tplb">${Object.entries(D.armyTemplates).filter(([k]) => k !== 'mech').map(([k, v]) => `<button class="${(window._recTpl || 'std') === k ? 'on' : ''}" data-tip="${esc(tplTip(v))}" onclick="window._recTpl='${k}';renderTab(true)">${ico(v.ic)} ${esc(v.n.split(' ')[0])}</button>`).join('')}</div>` : ''}
    <div class="btns"><button class="pri" onclick="doRecruit(${recT})">Сформувати</button></div>
    <div class="mut small">≈ ${money((window._recK || 50) * (0.02 * (0.5 + (n.pc || 1000) / 20000) + 0.05))}. Підготовка 45+ днів. Оберіть свій регіон на мапі, щоб змінити місце.</div></div>
    <div class="mut small">Керування: клік по армії → ПКМ по регіону (суходолом) або Shift+ПКМ (морем, потрібен флот).</div>`;
  } else if (sub === 'navy') {
    h += fl.map(f => `<div class="card" style="cursor:pointer;${sel && sel.type === 'f' && sel.id === f.id ? 'border-color:#ffd34d' : ''}" onclick="selFleet(${f.id})"><div class="row"><b>${esc(f.name)}</b><span>${f.s.toFixed(0)} кор.</span></div><div class="row small"><span>${esc(D.sea.nodes[f.node].n)}</span><span>${f.mv ? '⛵ у русі' : 'на позиції'} · орг. ${pct(f.org, 0)}</span></div></div>`).join('') || '<div class="mut">Немає флоту</div>';
    h += `<div class="card">${slider('shipK', 'Нові кораблі', 2, 60, 1, window._shipK || 10, v => v + ' кор.', '')}<div class="btns"><button class="pri" onclick="doShips()">Замовити на верфях</button></div><div class="mut small">≈ ${money((window._shipK || 10) * 1.2 * (0.6 + 0.4 * n.tech))}. Потрібні метал і мікроелектроніка.</div></div>
    ${G.building.filter(b => b.n === P).map(b => `<div class="row small"><span>⚓ ${b.s} кор. на верфі</span><span>${b.done - G.day} дн.</span></div>`).join('')}` + navyMixBlock(n);
  } else {
    h += sub === 'units' ? arsenalTab(n) : sub === 'air' ? airTab(n) : sub === 'models' ? modelsTab(n) : sub === 'gens' ? gensTab(n) : sub === 'war' ? warTab(n) : sub === 'nuke' ? nukeTab(n) : strikeTab(n);
  }
  return h;
};
function doRecruit(t) { const r = G.act.recruit(t, window._recK || 50, window._recTpl || 'std'); hint(r.ok ? 'Армію сформовано' : '⚠ ' + r.err, 3000); renderTab(true); }
function doShips() { const r = G.act.buildFleet(window._shipK || 10); hint(r.ok ? 'Кораблі замовлено' : '⚠ ' + r.err, 3000); renderTab(true); }
function selArmy(id) { sel = { type: 'a', id }; const a = G.armies.find(x => x.id === id); if (a) { const c = D.regions[a.t].c; focusLonLat(c[0], c[1], Math.max(view.s, 6)); } renderRight(); renderTab(true); }
function selFleet(id) { sel = { type: 'f', id }; const f = G.fleets.find(x => x.id === id); if (f) { const s = D.sea.nodes[f.node]; focusLonLat(s.lon, s.lat); } renderRight(); renderTab(true); }

// ---- арсенал і удари
const UNIT_PX = { shells: 'shells', armor: 'tank', fpv: 'fpv', strike: 'strike', missiles: 'missiles', sam: 'sam', ballistic: 'ballistic', hyper: 'hyper', glide: 'glide' };
const unitName = k => LORA.lang === 'en' ? D.units[k].en : D.units[k].n;
function fmtQ(v) { return v >= 10000 ? (v / 1000).toFixed(0) + 'k' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0); }
function arsenalTab(n) {
  const A = n.ars, M = n.arsM, F = n.arsF; let h = `<div class="mut small">${t_('Запаси озброєнь. Заводи виробляють їх щодня, бої витрачають; під час війни бракуюче докуповується з військового фонду.')}</div><div class="ars">`;
  Object.keys(D.units).forEach(k => { const u = D.units[k], sat = G.arsSat(n, k), lo = u.use && sat < 0.8;
    h += `<div class="${lo ? 'lo' : ''}" title="${esc(u.d)}">${pxi(UNIT_PX[k], 1)}<b>${fmtQ(A[k] || 0)}</b><span>${esc(unitName(k))}${u.u === 'тис.' ? ' (' + t_('тис.') + ')' : ''}</span>${u.rt && !G.has(n, u.rt) ? `<span class="r" data-tip="${esc(t_('Виробництво відкриває дослідження'))}: ${esc(techName(u.rt))}">🔬 ${esc(techName(u.rt))}</span>` : `<span class="${(M.prod[k] || 0) > (M.used[k] || 0) * 12 ? 'g' : 'y'}">+${fmtQ(M.prod[k] || 0)}/${t_('р.')}${M.used[k] ? ' · −' + fmtQ(M.used[k] * 12) : ''}</span>`}</div>`; });
  h += `</div><div class="grp">${pxi('target')} ${t_('Бойовий ефект')}</div>
  <div class="row"><span>${t_('Множник наступу')}</span><b class="${F.att >= 1 ? 'g' : 'r'}">×${F.att.toFixed(2)}</b></div><div class="row"><span>${t_('Множник оборони')}</span><b class="${F.def >= 1 ? 'g' : 'r'}">×${F.def.toFixed(2)}</b></div>
  <div class="row"><span>${t_('Забезпеченість снарядами')}</span><b>${pct(G.arsSat(n, 'shells'), 0)}</b></div><div class="row"><span>${t_('Насичення FPV')}</span><b>${pct(G.arsSat(n, 'fpv'), 0)}</b></div>
  <div class="row"><span>${t_('Військовий фонд')}</span><b>${money(n.milStock)}</b></div>
  <div class="row"><span>${t_('Збито над вашою територією')}</span><b>${fmtQ(M.intercepted || 0)}</b></div><div class="row"><span>${t_('Влучань по вас / ваших')}</span><b>${fmtQ(M.hitsIn || 0)} / ${fmtQ(M.hitsOut || 0)}</b></div>
  <div class="card small">${t_('Більше виробництва: будуйте заводи боєприпасів, дронів і ракет, системи ППО (вкладка «Будівництво» → Оборонка). Дослідження FPV, РЕБ, лазерної ППО та роїв дронів підсилюють армію.')}</div>`;
  return h;
}
function strikeTab(n) {
  const en = G.enemiesOf(n.id); window._stk = window._stk || { w: 'strike', goal: 'energy', cnt: 50 };
  const S = window._stk; let h = `<div class="mut small">${t_('Удари по тилу ворога: енергетика, оборонні заводи, склади й війська. ППО ворога збиває частину цілей.')}</div>`;
  if (!en.length) return h + `<div class="card">${t_('Ви не воюєте.')}</div>`;
  const WL = ['strike', 'missiles', 'ballistic', 'hyper', 'glide', 'bombing'];
  const tgt0 = sel && sel.type === 't' ? sel.id : -1, hg = tgt0 >= 0 && G.strikeGoalsFor ? G.strikeGoalsFor(n.id, tgt0) : null; if (hg && !hg.includes(S.goal)) S.goal = 'military';
  // що стоїть за кожним засобом ураження і як його отримати
  const how = w => { if (w === 'bombing') return (n.air && n.air.bmb >= 1) ? '' : t_('Потрібні бомбардувальники — «Армія → Авіація»'); const u = D.units[w]; if ((n.ars[w] || 0) >= 1) return '';
    const rt = u.rt && !G.has(n, u.rt) ? `${t_('дослідження')} «${esc(D.techs[u.rt] ? techName(u.rt) : u.rt)}»` : ''; const pb = Object.keys(u.prod || {}).map(b => `«${esc(t_(D.buildings[b].n))}»`).join(' / ');
    return (rt ? t_('Потрібне') + ' ' + rt + ', ' + t_('далі') + ' ' : t_('Потрібне виробництво') + ': ') + pb + (w === 'glide' ? ' + ' + t_('штурмовики') : ''); };
  h += `<div class="sub wsel">${WL.map(w => { const q = w === 'bombing' ? (n.air ? n.air.bmb : 0) : (n.ars[w] || 0); return `<button class="${S.w === w ? 'on' : ''}" ${q < 1 ? 'disabled' : ''} data-tip="${esc(w === 'bombing' ? D.airTypes.bmb.d : D.units[w].d)} · ${t_('дальність')} ${G.WP[w].r} ${t_('км')}" onclick="_stk.w='${w}';renderTab(true)">${pxi(w === 'bombing' ? 'bomber' : UNIT_PX[w])} ${esc(w === 'bombing' ? t_('Бомбардування') : unitName(w))} · ${fmtQ(q)}</button>`; }).join('')}</div>
  <div class="sub">${Object.entries(D.strikeGoals).filter(([k]) => !hg || hg.includes(k)).map(([k, g]) => `<button class="${S.goal === k ? 'on' : ''}" title="${esc(g.d)}" onclick="_stk.goal='${k}';renderTab(true)">${ico(g.ic)} ${esc(LORA.lang === 'en' ? g.en : g.n)}</button>`).join('')}</div>
  ${WL.filter(w => how(w)).length ? `<div class="card small"><b>${t_('Недоступні засоби')}</b>${WL.filter(w => how(w)).map(w => `<div class="row"><span>${pxi(w === 'bombing' ? 'bomber' : UNIT_PX[w])} ${esc(w === 'bombing' ? t_('Бомбардування') : unitName(w))}</span><span class="mut">${how(w)}</span></div>`).join('')}</div>` : ''}
  ${slider('stkCnt', t_('Кількість у залпі'), 5, 500, 5, S.cnt, v => v, '')}
  <label class="row" style="cursor:pointer"><span>🤖 ${t_('Автоматичні ударні кампанії (ШІ)')}</span><input type="checkbox" ${n.strikeAuto ? 'checked' : ''} onchange="nat(G.player).strikeAuto=this.checked"></label>`;
  const tgt = sel && sel.type === 't' ? sel.id : -1;
  const home = tgt >= 0 ? G.strikeHome(n.id, tgt) : null;
  if (tgt >= 0 && (home || G.atWar(n.id, G.ter[tgt].ctrl))) { const err = G.canStrike(n.id, tgt, S.w, S.cnt);
    h += `<div class="card"><div class="row"><b>${pxi('target')} ${esc(regName(tgt))}</b><span>${esc(nat(home || G.ter[tgt].ctrl).name)}</span></div><div class="small mut">${home ? '🎯 ' + t_('Ворожі війська на вашій території: удари лише по військах і постачанню, ваша інфраструктура не страждає') : t_('ППО регіону') + ': ' + pct(G.ter[tgt].shield, 0)}</div>
    <div class="btns"><button class="dang" ${err ? `disabled title="${esc(err)}"` : ''} onclick="doStrike(${tgt})">${ico(G.WP[S.w].ic)} ${t_('Удар')}</button></div>${err ? `<div class="small y">${esc(err)}</div>` : ''}</div>`; }
  else h += `<div class="card small">${t_('Оберіть на мапі ворожий регіон або свій регіон із ворожими військами як ціль.')}</div>`;
  const last = (G.strikes || []).filter(x => x.from === n.id || G.ter[x.i].ctrl === n.id).slice(-8).reverse();
  if (last.length) h += `<div class="grp">${t_('Останні удари')}</div>` + last.map(x => `<div class="row small"><span>${x.from === n.id ? '➡' : '⬅'} ${esc(regName(x.i))} · ${ico((G.WP[x.w] || G.WP.missiles).ic)}${x.cnt}</span><span>${t_('збито')} ${x.intc} · ${t_('влучань')} ${x.hits}</span></div>`).join('');
  { const x = tgt >= 0 ? G.ter[tgt].ctrl : null, ce = G.cyberCan(G.player, x);
    h += `<div class="grp">💻 ${t_('Кібератака')}</div><div class="card"><div class="small mut">${x != null && x !== G.player ? t_('Ціль') + ': ' + esc(nat(x).name) + ' · ' + t_('кіберзахист') + ' ' + Math.round(((nat(x).rx || {}).cyber || 0) * 100) + '%' : t_('Оберіть на мапі регіон ворожої держави')}</div>
    <div class="btns">${Object.entries(G.CYBER).map(([k, v]) => `<button ${ce ? 'disabled' : ''} data-tip="${esc(t_(v.d))}" onclick="doCyber(${x},'${k}')">${ico(v.ic)} ${esc(t_(v.n))}</button>`).join('')}</div>${ce ? `<div class="small y">${esc(t_(ce))}</div>` : ''}</div>`; }
  return h;
}
function doStrike(i) { const S = window._stk; const r = G.act.strike(i, S.w, S.cnt, S.goal); hint(r.ok ? `💥 ${t_('влучань')} ${r.hits}, ${t_('збито')} ${r.intc}${r.airLost >= 0.5 ? ' · ' + t_('втрачено літаків') + ' ' + r.airLost.toFixed(0) : ''}` : '⚠ ' + r.err, 3500); renderTab(true); mapDirty = true; }

function tplTip(v) { return v.n + ': ' + Object.keys(D.armyTypes).filter(k => v.c[k] > 0).map(k => `${D.armyTypes[k].n.toLowerCase()} ${Math.round(v.c[k] * 100)}%`).join(', '); }
// ---- авіація
function airTab(n) {
  const A = n.air || {}, AT = D.airTypes; window._air = window._air || { t: 'ftr', k: 10 }; const S = window._air; const o = G.airOffer(G.player, S.t, S.k);
  let h = `<div class="mut small">${t_('Авіація держави. Винищувачі виборюють перевагу в повітрі, штурмовики й гелікоптери підтримують наступ і скидають КАБ, бомбардувальники бомблять тил. Літаки гинуть від ворожої ППО й винищувачів.')}</div>
  <div class="kpi"><div data-tip="${t_('Множник наступу від переваги в повітрі')}"><span>${t_('Перевага в повітрі')}</span><b class="${(n.airEdge || 1) >= 1 ? 'g' : 'r'}">×${(n.airEdge || 1).toFixed(2)}</b></div><div data-tip="${t_('Множник наступу від штурмовиків і гелікоптерів')}"><span>${t_('Підтримка з повітря')}</span><b>×${(n.casEdge || 1).toFixed(2)}</b></div></div><div class="ars">`;
  Object.entries(AT).forEach(([k, a]) => { h += `<div data-tip="${esc(a.d)}">${pxi(a.px, 1)}<b>${Math.floor(A[k] || 0)}</b><span>${esc(a.n)}</span><span class="mut">$${(a.price * 1000).toFixed(0)} ${t_('млн/од.')}</span></div>`; });
  h += `</div><div class="grp">${t_('Замовити літаки')}</div><div class="card"><div class="sub">${Object.entries(AT).map(([k, a]) => `<button class="${S.t === k ? 'on' : ''}" onclick="_air.t='${k}';renderTab(true)">${ico(a.ic)} ${esc(a.n)}</button>`).join('')}</div>
  ${slider('airK', t_('Кількість'), 1, 120, 1, S.k, v => v, '')}
  ${o ? `<div class="row small"><span>${o.own ? t_('Власні авіазаводи') : o.seller >= 0 ? t_('Імпорт') + ': ' + esc(nat(o.seller).name) : t_('Немає продавця')}</span><b>${money(o.cost)} · ${o.days} ${t_('дн.')}</b></div>` : ''}
  <div class="btns"><button class="pri" ${o && o.seller >= 0 ? '' : 'disabled'} onclick="doBuyAir()">${t_('Замовити')}</button></div><div class="small mut">${t_('Оплата з військового фонду, решта — з резервів. Власне виробництво — від 2 рівнів оборонних заводів і технологій ≥ 0.9; інакше купівля в дружніх держав (+40%). Бомбардувальники не продають.')}</div></div>`;
  if (n.airQ && n.airQ.length) h += `<div class="grp">${t_('Замовлення')}</div>` + n.airQ.map(q => `<div class="row small"><span>${ico(AT[q.type].ic)} ${esc(AT[q.type].n)} ×${q.cnt}${q.from !== n.id ? ' · ' + esc(nat(q.from).name) : ''}</span><span>${q.done - G.day} ${t_('дн.')}</span></div>`).join('');
  return h;
}
function doBuyAir() { const S = window._air; const r = G.act.buyAir(S.t, S.k); hint(r.ok ? `✈ ${t_('Замовлено')}: ${r.days} ${t_('дн.')}` : '⚠ ' + r.err, 3000); renderTab(true); }

function doCyber(x, g) { const r = G.act.cyber(x, g); hint(r.ok ? (r.blocked ? '🛡 ' + t_('Атаку відбито') : '💻 ' + t_(r.txt || 'Атака вдалася')) : '⚠ ' + r.err, 3500); renderTab(true); }

// ---- моделі техніки
function modelsTab(n) {
  const MD = D.models; if (!MD) return ''; if (!n.mq) G.initMQ(n);
  let h = `<div class="mut small">${t_('Кожен тип військ має покоління техніки з власними характеристиками. Нові моделі відкривають дослідження, а армія переозброюється поступово (кілька відсотків на місяць).')}</div>`;
  h += `<div class="btns"><button class="pri" ${(n.modBoost || 0) > G.day ? 'disabled' : ''} onclick="doModernize()" data-tip="${t_('Утричі швидше переозброєння на пів року')}">🏭 ${(n.modBoost || 0) > G.day ? t_('Пришвидшено ще') + ' ' + (n.modBoost - G.day) + ' ' + t_('дн.') : t_('Пришвидшити переозброєння') + ' (' + money(Math.max(0.5, n.agg.gdp * 0.003)) + ')'}</button></div>`;
  const TY = Object.assign({}, D.armyTypes, D.airTypes);
  for (const t in MD) { const L = MD[t], q = n.mq[t] || 0, cur = Math.min(L.length - 1, Math.floor(q + 0.001)), best = G.bestModel(n, t), nx = L[cur + 1];
    const st = m => m.air != null ? `${t_('сила')} ×${m.air.toFixed(2)}` : `${t_('наступ')} ×${m.att.toFixed(2)} · ${t_('оборона')} ×${m.def.toFixed(2)}`;
    h += `<div class="card"><div class="row"><b>${ico(TY[t] ? TY[t].ic : L[0].ic)} ${esc(t_(TY[t] ? TY[t].n : t))}</b><span class="y">${st(L[cur])}</span></div><div class="small">${esc(t_(L[cur].n))}</div>`;
    if (cur < best) h += `<div class="bar"><i style="width:${(q - cur) * 100}%"></i></div><div class="small g">${t_('Переозброєння на')}: ${esc(t_(L[cur + 1].n))} · ${Math.round((q - cur) * 100)}%</div>`;
    else if (nx) h += `<div class="small mut">${t_('Далі')}: ${esc(t_(nx.n))} — ${st(nx)} · 🔬 ${esc(techName(nx.rt))}</div>`;
    h += `</div>`; }
  return h;
}
function doModernize() { const r = G.act.modernize(); hint(r.ok ? '🏭 ' + t_('Переозброєння пришвидшено') : '⚠ ' + r.err, 3000); renderTab(true); }
// ---- склад флоту
function navyMixBlock(n) {
  const SC = D.shipClasses; if (!SC) return ''; if (!n.navy) G.initNavy(n);
  return `<div class="grp">${t_('Склад флоту')}</div><div class="compbar">${Object.keys(SC).map((k, i) => `<i style="width:${(n.navy[k] || 0) * 100}%;background:hsl(${i * 55},55%,55%)" data-tip="${esc(t_(SC[k].n))} ${Math.round((n.navy[k] || 0) * 100)}%"></i>`).join('')}</div>
  <div class="ars">${Object.entries(SC).map(([k, v]) => `<div data-tip="${esc(t_(v.d))} · ${t_('бій')} ${v.sea} · ${t_('ППО')} ${v.aa} · ${t_('десант')} ${v.land}">${ico(v.ic)}<b>${Math.round((n.navy[k] || 0) * 100)}%</b><span>${esc(t_(v.n))}</span></div>`).join('')}</div>
  <div class="small mut">${t_('Пріоритет верфей: нові кораблі поступово змінюють склад флоту.')}</div><div class="sub">${[['', t_('Без пріоритету')], ...Object.entries(SC).map(([k, v]) => [k, v.ic + ' ' + t_(v.n)])].map(([k, l]) => `<button class="${(n.navPrio || '') === k ? 'on' : ''}" onclick="G.act.navPrio('${k}');renderTab(true)">${esc(l)}</button>`).join('')}</div>
  <div class="row small"><span>${t_('Сила флоту від складу')}</span><b>×${(G.fleetMult({ n: n.id })).toFixed(2)}</b></div><div class="row small"><span>${t_('Десантна місткість')}</span><b>×${G.landMult(n.id).toFixed(2)}</b></div>`;
}
// ---- генерали
function gensTab(n) {
  const TR = D.genTraits, gs = G.gensOf(G.player).sort((a, b) => b.skill - a.skill);
  let h = `<div class="mut small">${t_('Генерали командують арміями: навичка (★) дає до +10% сили, риса — свою перевагу. Призначайте в панелі армії. У боях генерали ростуть і можуть загинути.')}</div>`;
  gs.forEach(g => { const a = g.army != null ? G.armies.find(x => x.id === g.army) : null; h += `<div class="card gen-row">${avatar('gen' + g.id + g.name, 40, { mil: 1, fem: false })}<div><div class="row"><b>🎖 ${g.viewer ? '🟣 ' : ''}${esc(g.name)} <span class="y">${'★'.repeat(g.skill)}</span></b><span>${TR[g.trait].ic} ${esc(t_(TR[g.trait].n))}</span></div><div class="small mut">${esc(t_(TR[g.trait].d))}</div><div class="row small"><span>${a ? '⚔ ' + esc(a.name) + ' · ' + esc(regName(a.t)) : t_('у резерві')}</span>${a ? `<button onclick="selArmy(${a.id})">🔎</button>` : ''}</div></div></div>`; });
  return h;
}

// ---- полонені й іноземні добровольці
function warTab(n) {
  let h = `<div class="grp">🤝 ${t_('Полонені')}</div>`; const en = G.enemiesOf(G.player); const keys = new Set([...Object.keys(n.pow || {}), ...en.map(String)]);
  if (!keys.size) h += `<div class="small mut">${t_('Полонених немає.')}</div>`;
  keys.forEach(k => { const x = +k, o = nat(x); if (!o) return; const mine = (n.pow || {})[x] || 0, theirs = (o.pow || {})[G.player] || 0; const e = G.powCan(G.player, x);
    h += `<div class="card"><div class="row"><b>${esc(o.name)}</b><button ${e ? 'disabled' : ''} onclick="doPOW(${x})">🤝 ${t_('Обміняти')}</button></div><div class="row small"><span>${t_('Утримуємо')}: ${(mine * 1000).toFixed(0)}</span><span>${t_('Наших у полоні')}: ${(theirs * 1000).toFixed(0)}</span></div>${e ? `<div class="small mut">${esc(t_(e))}</div>` : ''}</div>`; });
  h += `<div class="small mut">${t_('Полонені зʼявляються з боїв і від капітуляції оточених армій. Обмін підвищує стабільність і знижує втому від війни.')}</div>`;
  const le = G.legionCan(G.player); const lg = G.armies.find(a => a.n === G.player && a.legion);
  h += `<div class="grp">🌍 ${t_('Інтернаціональний легіон')}</div><div class="card"><div class="row small"><span>${t_('Симпатики у світі')}</span><b>${G.sympathy(G.player).toFixed(1)}</b></div>${n.legion ? `<div class="g small">✓ ${t_('Набір триває')}${lg ? ': ' + people(lg.k) : ''}</div>` : `<div class="btns"><button class="pri" ${le ? 'disabled' : ''} onclick="doLegion()">🌍 ${t_('Оголосити набір')} ($0.2 ${t_('млрд')})</button></div>${le ? `<div class="small y">${esc(t_(le))}</div>` : ''}`}<div class="small mut">${t_('Держава, яка обороняється, може щомісяця отримувати добровольців з дружніх країн — штурмові підрозділи легіону.')}</div></div>`;
  return h;
}
function doPOW(x) { const r = G.act.exchangePOW(x); hint(r.ok ? '🤝 ' + t_('Обмін відбувся') : '⚠ ' + r.err, 3000); renderTab(true); }
function doLegion() { const r = G.act.createLegion(); hint(r.ok ? '🌍 ' + t_('Набір оголошено') : '⚠ ' + r.err, 3000); renderTab(true); }

// ---- ядерна програма
let nukeConfirm = null;
function nukeTab(n) {
  const s = G.nukeStatus(n.id); if (!s) return ''; const ck = ok => ok ? '<span class="g">✔</span>' : '<span class="mut">○</span>';
  let h = `<div class="mut small">${t_('Ядерна зброя — це насамперед стримування: держава з бомбою рідко стає ціллю. Застосування — крайній крок, після якого світ відвернеться від вас, а ворог із бомбою відповість.')}</div>`;
  h += `<div class="kpis"><div class="kpi"><span>${t_('Боєголовки')}</span><b>☢ ${s.w.toLocaleString()}</b></div><div class="kpi"><span>${t_('Виробництво')}</span><b>${s.rate ? '+' + s.rate + ' / ' + t_('міс.') : '—'}</b></div><div class="kpi"><span>${t_('Статус')}</span><b>${s.tested ? t_('ядерна держава') : s.w ? t_('бомба є, без випробування') : t_('немає')}</b></div><div class="kpi"><span>${t_('ПРО')}</span><b>${s.abm ? '✔' : '—'}</b></div></div>`;
  if (!START_NUKE(n)) {
    h += `<div class="grp">${t_('Ядерна програма')}</div><div class="card small">`;
    h += `<div class="row"><span>${ck(G.has(n, 'nuke_enrich'))} ${t_('Дослідження «Військове збагачення урану»')}</span></div>`;
    h += `<div class="row"><span>${ck(s.enr > 0)} ${t_('Будівля «Завод збагачення урану»')}</span><b>${s.enr}</b></div>`;
    h += `<div class="row"><span>${ck(s.bomb)} ${t_('Дослідження «Ядерний заряд»')}</span></div>`;
    h += `<div class="row"><span>${ck(s.lab > 0)} ${t_('Будівля «Ядерний збройовий центр»')}</span><b>${s.lab}</b></div>`;
    h += `<div class="row"><span>${ck(s.tested)} ${t_('Ядерне випробування')}</span>${!s.tested && s.w >= 1 ? `<button onclick="if(confirm(t_('Провести ядерне випробування? Відносини з усім світом погіршаться, Захід запровадить санкції.'))){const r=G.act.nukeTest();hint(r.ok?'☢ '+t_('Випробування проведено'):'⚠ '+t_(r.err),3000);renderTab(true)}">☢ ${t_('Випробувати')}</button>` : ''}</div>`;
    h += `<div class="row"><span>${ck(s.icbm)} ${t_('МБР: дослідження й «Шахти МБР»')}</span><b>${s.silo}</b></div></div>`;
    h += `<div class="mut small">${t_('Кожна боєголовка коштує $0.4 млрд. Виробництво: до 2 на місяць за кожен завод збагачення й до 3 за кожен збройовий центр.')}</div>`;
  } else h += `<div class="card small">${t_('Ваша держава має повну ядерну тріаду: МБР, бомбардувальники й підводні човни.')}</div>`;
  // ескалація
  const esc = Object.entries(n.nk && n.nk.esc || {}).filter(([e, v]) => v > 0.05);
  const theirs = G.N.filter(m => m.alive && m.nk && m.nk.esc && m.nk.esc[n.id] > 0.05);
  if (esc.length || theirs.length) {
    h += `<div class="grp">${t_('Ескалація')}</div>`;
    theirs.forEach(m => { const v = m.nk.esc[n.id]; h += `<div class="card small ${v > 1 ? 'r' : ''}"><div class="row"><b>☢ ${esc_(m.name)} ${t_('проти вас')}</b><b class="${v > 0.6 ? 'r' : 'y'}">${Math.round(v * 100)}%</b></div><div class="bar"><i style="width:${Math.min(100, v / 1.5 * 100)}%;background:#d33"></i></div><div class="mut">${t_('Росте, коли ви захоплюєте її власні регіони чи загрожуєте столиці. Понад 100% — ризик ядерного удару по ваших військах.')}</div></div>`; });
    esc.forEach(([e, v]) => { h += `<div class="row small"><span>${t_('Ваша ескалація проти')} ${esc_(nat(+e).name)}</span><b>${Math.round(v * 100)}%</b></div>`; });
  }
  // удар
  if (s.tested && s.w >= 1) {
    const r = sel && sel.type === 't' ? sel.id : null; h += `<div class="grp">${t_('Застосування')}</div>`;
    h += `<div class="card small">${t_('Ціль')}: <b>${r != null ? esc_(regName(r)) : t_('оберіть регіон на мапі')}</b></div>`;
    for (const [k, K] of Object.entries(G.NUKE_KIND)) {
      const e = r != null ? G.nukeCan(n.id, r, k) : t_('Оберіть регіон на мапі');
      h += `<div class="card small"><div class="row"><b>☢ ${esc_(t_(K.n))} · ${K.w} ${t_('бг.')}</b>${nukeConfirm === k + r ? `<button class="pri" style="background:#a11" onclick="doNuke(${r},'${k}')">${t_('ПІДТВЕРДИТИ')}</button>` : `<button ${e ? 'disabled' : ''} onclick="nukeConfirm='${k}'+${r};renderTab(true)">${t_('Удар')}</button>`}</div><div class="mut">${esc_(t_(K.d))}</div>${e ? `<div class="r">${esc_(t_(e))}</div>` : nukeConfirm === k + r ? `<div class="r">${t_('Це незворотно. Натисніть ще раз, щоб підтвердити.')}</div>` : ''}</div>`;
    }
  }
  h += `<div class="grp">${t_('Ядерний клуб')}</div>` + G.N.filter(m => m.alive && m.nuke && m.nw >= 1).sort((a, b) => b.nw - a.nw).map(m => `<div class="row small"><span>${nlink(m.id)}${m.nk && !m.nk.tested ? ' <span class="mut">(' + t_('без випробування') + ')</span>' : ''}</span><b>☢ ${m.nk && m.nk.tested || m.id === n.id ? m.nw.toLocaleString() : '?'}</b></div>`).join('');
  return h;
}
function START_NUKE(n) { return ['RUS', 'USA', 'CHN', 'FRA', 'GBR'].includes(n.a3) && n.nk && n.nk.tested; }
const esc_ = s => esc(String(s));
function doNuke(r, k) { nukeConfirm = null; const res = G.act.nukeStrike(r, k); hint(res && res.ok ? (res.intercepted ? '🛡 ' + t_('Удар перехоплено ПРО') : '☢ ' + t_('Удар завдано')) : '⚠ ' + t_((res && res.err) || 'Помилка'), 4000); renderTab(true); renderRight && renderRight(); }
