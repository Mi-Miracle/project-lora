// БІРЖА 2: замкнений цикл грошей, емісії (IPO/допемісія) і викуп, контрольні пакети, бульбашки й паніки,
// інсайдерські скандали, індекси країн; індекс впливає на світову економіку (ефект багатства).
LORA.sim.register('stock2', 96.3, function (G) {
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = () => { if (!G.stock) G.stockInit(); const s = G.stock; if (s.pool == null) { s.pool = 50; s.float = {}; s.panic = 0; s.ev = []; } return s; };
  const fl = cid => { const s = S(); return s.float[cid] != null ? s.float[cid] : 49; }; // % акцій у вільному обігу (решта — засновники)
  G.stockFloat = fl;
  { const bi = G.stockInit; G.stockInit = function () { bi(); S(); }; }
  const heldBy = cid => Object.values(S().hold).reduce((a, h) => a + (h[cid] || 0), 0);
  G.stockFree = cid => Math.max(0, fl(cid) - heldBy(cid)); // ще не викуплене з обігу
  const cashOf = w => w[0] === 'n' ? N[+w.slice(1)].cash : w === 'L' ? G.leader.money : G.companies[+w.slice(1)].cash;
  const addCash = (w, v) => { if (w[0] === 'n') N[+w.slice(1)].cash += v; else if (w === 'L') G.leader.money += v; else G.companies[+w.slice(1)].cash += v; };
  // торгівля: купівля з обігу — гроші йдуть інвесторам-продавцям (світовий пул), продаж — назад; гаманці гравців — реальні
  G.stockTrade = function (w, cid, pct) {
    const s = S(), c = G.companies[cid]; if (!c || !c.alive || !w) return { ok: false, err: 'Недоступно' };
    if (w === 'c' + cid) return { ok: false, err: 'Для власних акцій — емісія або викуп (вкладка «Фінанси»)' };
    const p = s.px[cid] * (pct > 0 ? 1.01 : 0.99), cost = p * pct; s.hold[w] = s.hold[w] || {};
    if (pct > 0) { if (G.stockFree(cid) < pct) return { ok: false, err: `У вільному обігу лише ${G.stockFree(cid).toFixed(1)}% — решта в засновників` }; if (cashOf(w) < cost) return { ok: false, err: 'Бракує коштів: потрібно $' + cost.toFixed(3) + ' млрд' }; }
    else { if (G.stockHeld(w, cid) < -pct) return { ok: false, err: 'У вас немає стільки акцій' }; if (s.pool < -cost) return { ok: false, err: 'На ринку зараз немає покупців (паніка)' }; }
    addCash(w, -cost); s.pool += cost; s.hold[w][cid] = +(G.stockHeld(w, cid) + pct).toFixed(3); if (!s.hold[w][cid]) delete s.hold[w][cid];
    s.px[cid] *= 1 + pct * 0.004; G.stockCheckControl(w, cid);
    return { ok: true, cost };
  };
  // контроль: ≥ 50% акцій компанії
  G.stockController = cid => { const s = S(); for (const w in s.hold) if ((s.hold[w][cid] || 0) >= 50) return w; return null; };
  G.stockCheckControl = function (w, cid) {
    const c = G.companies[cid]; if (!c || (S().hold[w] || {})[cid] < 50 || c.ctrlBy === w) return; c.ctrlBy = w;
    const who = w[0] === 'n' ? N[+w.slice(1)].name : w === 'L' ? (G.leader ? G.leader.name : '?') : G.companies[+w.slice(1)].name;
    G.say(`🏦 ${who} отримує контрольний пакет «${c.name}» (≥ 50%): тепер дивіденди визначає новий власник`, 'big', [c.home]);
  };
  G.stockSetDiv = function (w, cid, v) { const c = G.companies[cid]; if (!c || G.stockController(cid) !== w) return { ok: false, err: 'Потрібен контрольний пакет' }; c.divCtl = clamp(+v, 0, 0.8); return { ok: true, msg: `Дивіденди ${Math.round(c.divCtl * 100)}% прибутку` }; };
  // емісія: компанія продає нові акції інвесторам і отримує гроші; викуп — навпаки
  G.stockIssue = function (c, pct) {
    const s = S(); if (!c || !c.alive) return { ok: false, err: '?' }; if (!(pct > 0)) return { ok: false, err: 'Вкажіть обсяг' };
    if (fl(c.id) + pct > 75) return { ok: false, err: 'Засновники мають зберегти щонайменше 25% (інакше втрата контролю)' };
    const raise = s.px[c.id] * pct * 0.96 * clamp(s.mood, 0.5, 1.4); if (s.pool < raise) return { ok: false, err: 'Інвестори зараз не мають стільки грошей (слабкий ринок)' };
    s.pool -= raise; c.cash += raise; s.float[c.id] = fl(c.id) + pct; s.px[c.id] *= 1 - pct * 0.006; c.issued = (c.issued || 0) + pct;
    if (!c.ai) G.say(`📈 «${c.name}» розміщує ${pct}% нових акцій: залучено $${raise.toFixed(2)} млрд`, 'good', [c.home]); return { ok: true, msg: `Залучено $${raise.toFixed(2)} млрд` };
  };
  G.stockBuyback = function (c, pct) {
    const s = S(); if (!c || !(pct > 0)) return { ok: false, err: '?' }; if (G.stockFree(c.id) < pct) return { ok: false, err: 'В обігу немає стільки вільних акцій' };
    const cost = s.px[c.id] * pct * 1.03; if (c.cash < cost) return { ok: false, err: 'Бракує коштів' };
    c.cash -= cost; s.pool += cost; s.float[c.id] = fl(c.id) - pct; s.px[c.id] *= 1 + pct * 0.006; return { ok: true, msg: `Викуплено ${pct}% за $${cost.toFixed(2)} млрд` };
  };
  // дивіденди платить сама компанія
  G.stockMonthly = function () {
    const s = S(); const divOf = c => c.divCtl != null && c.ctrlBy ? c.divCtl : 0.3;
    for (const w in s.hold) { const h = s.hold[w]; for (const cid in h) { const c = G.companies[cid]; if (!c || !c.alive) { delete h[cid]; continue; }
      const d = Math.max(0, c.profitY) * divOf(c) / 12 * h[cid] / 100; if (d > 0 && c.cash > d) { c.cash -= d; try { addCash(w, d); } catch (e) { } } } }
    // дивіденди інвесторам із вільного обігу теж виходять із компанії й повертаються в пул
    G.companies.forEach(c => { if (!c.alive) return; const free = G.stockFree(c.id); const d = Math.max(0, c.profitY) * 0.3 / 12 * free / 100; if (d > 0 && c.cash > d * 2) { c.cash -= d; s.pool += d; } });
    // ШІ-компанії не накопичують гроші безкінечно: надлишок іде акціонерам (дивіденди/викуп) і в інвестиції
    G.companies.forEach(c => { if (!c.alive || !c.ai) return; const v = G.coValue(c), ex = c.cash - v * 0.25; if (ex > 0) { const d = ex * 0.25; c.cash -= d; s.pool += d * 0.5; const n = N[c.home]; if (n && n.alive && n.agg) n.fdiG = Math.min(0.01, (n.fdiG || 0) + d * 0.5 / Math.max(20, n.agg.gdp) * 0.5); } });
    // ШІ-компанії з касовим розривом роблять допемісію
    G.companies.forEach(c => { if (c.alive && c.ai && c.cash < 0 && fl(c.id) < 70) G.stockIssue(c, 5); });
    // інвестори реінвестують: пул підживлює зростання країн, де є біржові компанії
    const out = s.pool * 0.07; if (out > 0) { const caps = {}; let tot = 0; G.companies.forEach(c => { if (c.alive && s.px[c.id]) { caps[c.home] = (caps[c.home] || 0) + s.px[c.id] * 100; tot += s.px[c.id] * 100; } });
      for (const k in caps) { const n = N[k]; if (!n || !n.alive || !n.agg) continue; const v = out * caps[k] / tot; n.cash += v * 0.2; n.fdiG = Math.min(0.01, (n.fdiG || 0) + v / Math.max(20, n.agg.gdp) * 0.5); } s.pool -= out * 0.2; }
    s.pool = Math.max(5, s.pool + G.companies.reduce((a, c) => a + (c.alive ? Math.max(0, c.profitY) * 0.001 : 0), 0)); // нові заощадження
    // ефект багатства: індекс за квартал → світове зростання
    const I = s.idx; if (I.length > 13) { const ch = I[I.length - 1] / I[I.length - 14] - 1; const g = clamp(ch * 0.02, -0.006, 0.004);
      if (Math.abs(g) > 0.0005) N.forEach(n => { if (n.alive) n.mods.push({ growth: g, until: G.day + 31 }); }); s.wealthG = g; }
    // бульбашки й паніки
    if (I.length > 52) { const yr = I[I.length - 1] / I[I.length - 53] - 1; s.bubble = yr > 0.35;
      if (s.bubble && G.rnd() < 0.08) { s.mood *= 0.72; s.panic = G.day + 60; G.say('📉 Біржова паніка: бульбашка луснула, індекси падають на чверть!', 'big'); s.ev.push({ d: G.day, t: 'crash' }); } }
    if (G.rnd() < 0.05) { const L = G.companies.filter(c => c.alive && s.px[c.id]); const c = L[Math.floor(G.rnd() * L.length)]; if (c) { const up = G.rnd() < 0.5;
      s.px[c.id] *= up ? 1.25 : 0.78; G.say(up ? `🚀 Ажіотаж навколо «${c.name}»: акції +25%` : `🕵 Інсайдерський скандал у «${c.name}»: акції −22%`, up ? 'info' : 'bad', [c.home]); s.ev.push({ d: G.day, t: up ? 'hype' : 'scandal', c: c.id }); } }
    if (s.ev.length > 30) s.ev.splice(0, s.ev.length - 30);
  };
  // індекси країн: капіталізація компаній зі штабом у країні
  G.stockCountries = function () { const s = S(), m = {}; G.companies.forEach(c => { if (c.alive && s.px[c.id]) { const k = c.home; m[k] = m[k] || { cap: 0, n: 0, ch: 0 }; m[k].cap += s.px[c.id] * 100; m[k].n++; const h = s.hist[c.id] || []; const p0 = h.length > 4 ? h[h.length - 5] : h[0] || s.px[c.id]; m[k].ch += (s.px[c.id] / p0 - 1) * s.px[c.id] * 100; } });
    return Object.entries(m).map(([k, v]) => ({ nid: +k, cap: v.cap, n: v.n, ch: v.ch / Math.max(1e-9, v.cap) })).sort((a, b) => b.cap - a.cap); };
  // паніка тисне на настрій
  const baseDaily = G.stockDaily; G.stockDaily = function () { baseDaily(); const s = S();
    if (G.day === 90 && !s.rebased) { s.rebased = 1; const cap = G.companies.reduce((a, c) => a + (c.alive && s.px[c.id] ? s.px[c.id] * 100 : 0), 0); s.idx0 = cap; s.idx = [100]; } // базу індексу ставимо після початкової переоцінки ринку
    if (s.panic > G.day) s.mood = Math.max(0.5, s.mood - 0.002); };
  G.act.stockTrade = (cid, pct) => G.stockTrade(G.wallet(), cid, pct);
  G.act.stockIssue = pct => G.pc >= 0 ? G.stockIssue(G.myCo(), pct) : { ok: false };
  G.act.stockBuyback = pct => G.pc >= 0 ? G.stockBuyback(G.myCo(), pct) : { ok: false };
  G.act.stockSetDiv = (cid, v) => G.stockSetDiv(G.wallet(), cid, v);
});
