// 2.5: знесення будівель, нові супутники (наукові, спостереження Землі), особисте життя президента й CEO
// (навички, статки, інвестиції, партія — як у персонажа), щорічні знімки для підсумків року.
LORA.sim.register('future', 99.8, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const BD = G.D.buildings;
  // ---------- знесення
  G.coLevels = (i, type) => (G.companies || []).reduce((s, c) => s + (c.alive ? c.assets.filter(a => a.t === i && a.type === type).reduce((q, a) => q + a.lvl, 0) : 0), 0);
  G.demolishCan = function (nid, i, type) {
    const t = ter[i]; if (!t || !BD[type]) return '?'; if (t.owner !== nid || t.ctrl !== nid) return 'Лише на власній підконтрольній території';
    const lvl = t.bld[type] || 0; if (!lvl) return 'Такої будівлі тут немає'; if (lvl - G.coLevels(i, type) <= 0) return 'Ці рівні належать компаніям';
    return '';
  };
  G.demolish = function (nid, i, type) {
    const e = G.demolishCan(nid, i, type); if (e) return { ok: false, err: e };
    const n = N[nid], back = G.buildCost(nid, i, type) * 0.12; G.addLevel(i, type, -1); n.cash += back;
    G.say(`🧹 Знесено: ${BD[type].n} — ${T[i].n} (повернуто $${back.toFixed(2)} млрд за матеріали)`, 'info', [nid]); return { ok: true, msg: `знесено, +$${back.toFixed(2)} млрд` };
  };
  G.coDemolish = function (c, i, type) {
    const a = c && c.assets.find(x => x.t === i && x.type === type); if (!a) return { ok: false, err: 'Немає такого активу' };
    const host = ter[i].owner, back = G.buildCost(host, i, type) * 0.15; a.lvl--; if (a.lvl <= 0) c.assets = c.assets.filter(x => x !== a); if ((ter[i].bld[type] || 0) > 0) G.addLevel(i, type, -1); c.cash += back;
    if (!c.ai) G.say(`🧹 «${c.name}»: знесено ${BD[type].n} — ${T[i].n} (+$${back.toFixed(2)} млрд)`, 'info', [host]); return { ok: true, msg: `+$${back.toFixed(2)} млрд` };
  };
  G.act.presParty = () => { const L = G.leader; if (!L || L.money == null || L.role === 'char') return { ok: false, err: '?' }; if (L.party) return { ok: false, err: 'Партія вже є' }; const keep = [L.popu[L.home], L.cont[L.home], L.fame, L.money]; G.partyStart(L, L.home); [L.popu[L.home], L.cont[L.home], L.fame, L.money] = keep; L.party.r = clamp(10 + N[L.home].stab * 0.25, 5, 40); L.party.mem = 60; L.party.cash = 0.05; return { ok: true, msg: L.party.name + ': рейтинг ' + L.party.r.toFixed(0) + '%' }; };
  G.act.demolish = (i, type) => G.demolish(G.player, i, type);
  G.act.coDemolish = (i, type) => G.pc >= 0 ? G.coDemolish(G.myCo(), i, type) : { ok: false };
  G.act.cancelBuild2 = id => { const c = G.constructions.find(x => x.id === id && x.n === G.player && x.co == null); if (!c) return { ok: false, err: '?' }; G.constructions = G.constructions.filter(x => x !== c); N[G.player].cash += c.cost * 0.5; return { ok: true, msg: `повернуто $${(c.cost * 0.5).toFixed(2)} млрд` }; };

  // ---------- нові супутники
  const ST = G.D.satTypes;
  if (ST && !ST.sci) {
    ST.sci = { n: 'Науковий', ic: '🔬', price: 0.3, d: 'космічні експерименти: щомісяця прискорюють поточне дослідження (до +3%)' };
    ST.geo = { n: 'Спостереження Землі', ic: '🌍', price: 0.25, d: 'агромоніторинг і прогноз погоди: врожаї й продовольство до +5%' };
  }
  const satFix = n => { if (n.sats) { n.sats.sci = n.sats.sci || 0; n.sats.geo = n.sats.geo || 0; } };
  { const b = G.initSpace; if (b) G.initSpace = function () { b.apply(this, arguments); N.forEach(n => { satFix(n); if (['USA', 'CHN', 'JPN', 'IND'].includes(n.a3) && n.sats) { n.sats.sci = n.a3 === 'USA' ? 20 : 8; n.sats.geo = n.a3 === 'USA' ? 30 : 12; } }); }; }
  function satMonthly(n) {
    if (!n.sats) return; satFix(n);
    if (n.sats.sci >= 1 && G.resBoost) G.resBoost(n, Math.min(0.03, n.sats.sci * 0.003));
    const k = 1 + Math.min(0.05, n.sats.geo * 0.005), old = n._geoK || 1; if (Math.abs(k - old) > 1e-4) { n.prodK = n.prodK || {}; ['grain', 'food'].forEach(r => { n.prodK[r] = (n.prodK[r] || 1) / old * k; }); n._geoK = k; }
  }

  // ---------- особисте життя президента / CEO
  G.persona = function (L, role) {
    if (!L || L.money != null) return; const pres = role === 'president';
    Object.assign(L, { type: L.type || 'diplomat', money: pres ? 0.0006 : 0.003, fame: pres ? 40 : 15, cont: {}, popu: {}, busy: 0, log: [], sk: Object.assign({ orat: pres ? 1 : 0, diplo: pres ? 1 : 0, biz: pres ? 0 : 2, eco: 1 }, L.sk || {}) });
    L.cont[L.home] = pres ? 55 : 25; L.popu[L.home] = pres ? Math.round(N[L.home] ? N[L.home].stab * 0.8 : 40) : 10;
  };
  { const b = G.initLeader; G.initLeader = function (o) { b.apply(this, arguments); if (o.role === 'president' || o.role === 'ceo') G.persona(G.leader, o.role); }; }
  function personaMonthly(key, L) {
    if (!L || L.money == null || L.role === 'char') return; const nid = L.home, n = N[nid];
    if (L.role === 'president' && n && n.alive) {
      L.money += 0.0015; // зарплата й представницькі
      L.popu[nid] = clamp((L.popu[nid] || 0) * 0.85 + n.stab * 0.15, 0, 100); L.cont[nid] = Math.max(L.cont[nid] || 0, 40);
      const sk = k => G.skill ? G.skill(L, k) : 0;
      if (sk('orat') || sk('media')) n.stab = clamp(n.stab + 0.04 * sk('orat') + 0.03 * sk('media'), 0, 100);
      if (sk('eco') && n.agg) n.cash += n.agg.gdp * 0.00002 * sk('eco');
      if (sk('mil')) G.armies.forEach(a => { if (a.n === nid) a.org = Math.min(1, a.org + 0.004 * sk('mil')); });
      if (sk('diplo')) G.N.forEach(x => { if (x.alive && x.id !== nid && !G.atWar(x.id, nid) && G.rel[x.id][nid] > 0) G.rel[x.id][nid] = clamp(G.rel[x.id][nid] + 0.08 * sk('diplo'), -100, 100); });
      if (sk('sci') && G.resBoost) G.resBoost(n, 0.006 * sk('sci'));
    }
    if (L.role === 'ceo') { const c = G.companies && G.companies[G.pc]; L.money += 0.0012 + (c && c.profitY > 0 ? c.profitY * 0.0005 : 0); }
  }

  // ---------- дії глави держави
  const gdpC = (n, f) => Math.max(0.03, (n.agg ? n.agg.gdp : 100) * f);
  G.LEAD_ACT = [
    ['address', 'Звернення до нації', '📢', n => 0, 30, 'стабільність +2 (у війну +3)', n => { const v = G.enemiesOf(n.id).length ? 3 : 2; n.stab = clamp(n.stab + v, 0, 100); return `стабільність +${v}`; }],
    ['front', 'Поїздка на фронт', '🎖', n => gdpC(n, 0.00005), 60, 'організованість армій +15%, стабільність +1 (лише під час війни)', n => { if (!G.enemiesOf(n.id).length) return null; G.armies.forEach(a => { if (a.n === n.id) a.org = Math.min(1, a.org + 0.15); }); n.stab = clamp(n.stab + 1, 0, 100); return 'бійці побачили президента в окопі'; }],
    ['ambass', 'Прийом послів', '🎩', n => gdpC(n, 0.00005), 45, 'відносини з 6 країнами +3', n => { N.filter(x => x.alive && x.id !== n.id && !G.atWar(x.id, n.id)).sort((a, b) => G.rel[b.id][n.id] - G.rel[a.id][n.id]).slice(0, 6).forEach(x => { G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 3, -100, 100); }); return 'фуршет удався, ніхто не переплутав виделки'; }],
    ['awards', 'Вручення державних нагород', '🎖', n => gdpC(n, 0.00003), 90, 'стабільність +1, армії й міністри лояльніші', n => { n.stab = clamp(n.stab + 1, 0, 100); if (n.min) Object.values(n.min).forEach(m => { m.loyal = clamp(m.loyal + 4, 0, 100); }); G.armies.forEach(a => { if (a.n === n.id) a.org = Math.min(1, a.org + 0.05); }); return 'медалей вистачило всім'; }],
    ['forum', 'Інвестиційний форум', '💼', n => gdpC(n, 0.0005), 120, 'іноземні інвестиції → зростання', n => { n.fdiG = Math.min(0.01, (n.fdiG || 0) + 0.0015); return 'інвестори підписали меморандуми (і забрали ручки)'; }],
    ['jog', 'Ранкова пробіжка з журналістами', '🏃', n => 0, 30, 'популярність +, іноді кумедний конфуз', n => { const L = G.leader; if (L && L.popu) L.popu[n.id] = clamp((L.popu[n.id] || 0) + 3, 0, 100); if (G.rnd() < 0.3) { n.stab = clamp(n.stab + 0.5, 0, 100); return 'президент упав у калюжу — рейтинг виріс: «він такий, як ми»'; } return 'журналісти задихалися вже на першому кілометрі'; }],
    ['telethon', 'Благодійний телемарафон', '📺', n => 0, 180, 'пожертви в бюджет, стабільність +1', n => { const v = gdpC(n, 0.0004) * (0.6 + n.stab / 100); n.cash += v; n.stab = clamp(n.stab + 1, 0, 100); return `зібрано ${G.fmt$(v)}`; }],
    ['lab', 'Візит до лабораторії', '🔬', n => gdpC(n, 0.00005), 90, 'поточне дослідження +10%', n => { if (G.resBoost) G.resBoost(n, 0.1); return 'президент натиснув не ту кнопку, але експеримент вдався'; }],
    ['summit', 'Скликати міжнародний саміт', '🌐', n => gdpC(n, 0.001), 365, 'відносини з усіма мирними країнами +2, престиж', n => { N.forEach(x => { if (x.alive && x.id !== n.id && !G.atWar(x.id, n.id)) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 2, -100, 100); }); n.stab = clamp(n.stab + 1, 0, 100); return 'усі приїхали, круасанів вистачило'; }],
    ['reshuffle', 'Кадрова перезавантаження', '🔄', n => 0, 365, 'усі міністри: компетентність +5, лояльність −5', n => { if (n.min) Object.values(n.min).forEach(m => { m.comp = clamp(m.comp + 5, 0, 100); m.loyal = clamp(m.loyal - 5, 0, 100); }); return 'кабінет нервово перевіряє телефони'; }]
  ];
  G.leadCan = function (k) { const L = G.leader; if (!L || L.role !== 'president' || G.player < 0) return 'Лише для глави держави'; const A = G.LEAD_ACT.find(x => x[0] === k); if (!A) return '?'; if (L.mv) return 'Лідер у дорозі'; L.lcd = L.lcd || {}; if ((L.lcd[k] || 0) > G.day) return `Ще ${L.lcd[k] - G.day} дн.`; if (k === 'front' && !G.enemiesOf(G.player).length) return 'Лише під час війни'; if (N[G.player].cash < A[3](N[G.player])) return 'Бракує коштів у бюджеті'; return ''; };
  G.leadDo = function (k) { const e = G.leadCan(k); if (e) return { ok: false, err: e }; const L = G.leader, n = N[G.player], A = G.LEAD_ACT.find(x => x[0] === k); n.cash -= A[3](n); L.lcd[k] = G.day + A[4]; const msg = A[6](n) || ''; G.say(`${A[2]} ${A[1]}: ${msg}`, 'good', [n.id]); return { ok: true, msg }; };
  G.act.leadDo = k => G.leadDo(k);
  // ---------- знімки на початок року (для щорічних підсумків)
  function snap(n) { return { gdp: n.agg ? n.agg.gdp : 0, stab: n.stab, cash: n.cash, debt: n.debt || 0, reg: ter.filter(t => t.ctrl === n.id).length, techs: n.res ? Object.keys(n.res.done).length : 0, troops: G.armies.filter(a => a.n === n.id).reduce((s, a) => s + a.k, 0), bld: ter.reduce((s, t) => s + (t.owner === n.id ? Object.values(t.bld).reduce((q, v) => q + v, 0) : 0), 0), pop: n.agg ? n.agg.pop : 0 }; }
  G.yearSnapAll = function () { G.ysnap = { day: G.day, n: {}, me: null, co: null }; N.forEach(n => { if (n.alive) G.ysnap.n[n.id] = snap(n); }); const L = G.leader; if (L && L.money != null) G.ysnap.me = { money: L.money, fame: L.fame || 0, pop: L.popu ? (L.popu[L.home] || 0) : 0 }; const c = G.companies && G.pc >= 0 ? G.companies[G.pc] : null; if (c) G.ysnap.co = { cash: c.cash, assets: c.assets.reduce((s, a) => s + a.lvl, 0), rep: c.rep || 50 }; };
  G.yearReport = function (nid) {
    const Y = G.ysnap; if (!Y) return null; const n = N[nid]; const a = Y.n[nid], b = n && n.alive ? snap(n) : null; const L = G.leader, c = G.companies && G.pc >= 0 ? G.companies[G.pc] : null;
    const top = N.filter(x => x.alive && Y.n[x.id] && x.agg).map(x => ({ x, g: x.agg.gdp / Math.max(0.1, Y.n[x.id].gdp) - 1 })).sort((p, q) => q.g - p.g);
    return { a, b, top: top.slice(0, 3).map(o => [o.x.name, o.g]), worst: top.slice(-3).reverse().map(o => [o.x.name, o.g]), wars: G.wars ? G.wars.size : 0,
      me: L && L.money != null && Y.me ? { m0: Y.me.money, m1: L.money, f0: Y.me.fame, f1: L.fame || 0 } : null, co: c && Y.co ? { c0: Y.co.cash, c1: c.cash, a0: Y.co.assets, a1: c.assets.reduce((s, x) => s + x.lvl, 0) } : null };
  };
  G.futureMonthly = function () {
    N.forEach(n => { if (n.alive) satMonthly(n); });
    if (G.leaders) Object.keys(G.leaders).forEach(k => personaMonthly(k, G.leaders[k]));
    G.futureYear();
  };
  G.futureYear = function () {
    if (!G.ysnap || Math.floor(G.day / 365) > Math.floor(G.ysnap.day / 365)) { if (G.ysnap) { const r = {}; const hs = new Set([...(G.humans || [])]); if (G.player >= 0) hs.add(G.player); const L = G.leader; if (L && L.home != null) hs.add(L.home); hs.forEach(h => { r[h] = G.yearReport(h); }); G.yearRep = { day: G.day, r }; } G.yearSnapAll(); }
  };
});
