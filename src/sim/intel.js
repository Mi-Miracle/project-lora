// РОЗВІДКА, КОСМОС, ІНТЕРНЕТ.
// • Космічна програма: запуски з власних стартових майданчиків або комерційні запуски в інших держав;
//   супутники: розвідувальні, звʼязку, навігаційні, раннього попередження. Зношуються (~8 років), їх можна збити (ASAT).
//   Великі програми: орбітальна станція, місячна місія.
// • Супутникова розвідка працює лише з власними розвідсупутниками (≥3) або за угодою: оренда даних чи обмін.
//   Союзники по блоку (НАТО) обмінюються автоматично.
// • Інтернет держави (n.net, 0–1): рівень розвитку + оптоволокно, 5G, кабелі, датацентри + супутниковий інтернет.
//   Дає зростання економіки, але підвищує вразливість до кібератак.
// • РЛС і туман війни: видно свої регіони й сусідні, де стоять ваші війська й агенти, у радіусі РЛС, території союзників;
//   розвідсупутники відкривають весь ворожий тил. ШІ туману не має. Глядачі й вивід на стрім — без туману.
LORA.sim.register('intel', 93.5, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const hav = (a, b) => { const r = Math.PI / 180, [lo1, la1] = T[a].c, [lo2, la2] = T[b].c; const s = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); };
  const ST = G.D.satTypes = {
    recon: { n: 'Розвідувальний', ic: '🔭', price: 0.35, d: 'знімки ворожого тилу: ≥3 супутники відкривають туман війни над ворогами; з дослідженням «Супутникова розвідка» — наступ +3%' },
    comms: { n: 'Звʼязку', ic: '📡', price: 0.15, d: 'інтернет і звʼязок армій (організованість відновлюється швидше)' },
    nav:   { n: 'Навігаційний', ic: '🧭', price: 0.2, d: 'власна навігація (≥10): ракети й КАБ точніші на 10%, не залежите від чужого GPS' },
    ew:    { n: 'Раннього попередження', ic: '🚨', price: 0.4, d: 'бачать пуски ракет: ППО перехоплює балістичні й гіперзвукові на 10% частіше' }
  };
  const SAT0 = { USA: [60, 300, 31, 10], CHN: [50, 90, 45, 6], RUS: [15, 40, 24, 6], FRA: [6, 10, 10, 1], DEU: [5, 6, 0, 0], GBR: [3, 8, 0, 0], ITA: [4, 6, 0, 0], JPN: [8, 10, 4, 1], IND: [10, 20, 8, 0], ISR: [10, 4, 0, 0], KOR: [3, 6, 0, 0], ESP: [2, 4, 0, 0], TUR: [2, 4, 0, 0], ARE: [2, 4, 0, 0], IRN: [1, 1, 0, 0], PRK: [1, 0, 0, 0], BRA: [1, 4, 0, 0], CAN: [2, 6, 0, 0], AUS: [1, 4, 0, 0] };
  const LAUNCH0 = { USA: 120, CHN: 60, RUS: 20, FRA: 8, JPN: 6, IND: 6, ISR: 1, IRN: 2, PRK: 1, KOR: 2 };
  G.initSpace = function () {
    N.forEach(n => { const s = SAT0[n.a3] || [0, 0, 0, 0]; n.sats = { recon: s[0], comms: s[1], nav: s[2], ew: s[3] }; n.sats0 = { recon: s[0], comms: s[1], nav: s[2], ew: s[3] }; n.space = { base: LAUNCH0[n.a3] || 0, used: 0, yr: 0, q: [], station: 0, moon: 0, prest: 0 }; n.intel = {}; n.net = 0; });
    // сценарій війни: Україна на старті отримує розвіддані США за угодою на рік
    if (G.nIdx.UKR != null && G.nIdx.USA != null && G.atWar(G.nIdx.UKR, G.nIdx.RUS)) N[G.nIdx.UKR].intel[G.nIdx.USA] = { kind: 'lease', until: G.day + 365, fee: 0 };
    // стартові РЛС: столиці великих держав, для воюючих — ще й прикордонні регіони
    N.forEach(n => { if (!n.alive || !n.agg) return; const cap = ter.findIndex(t => t.owner === n.id && t.ctrl === n.id && T[t.i].cap) ; const home = cap >= 0 ? cap : n.home; if (home == null || home < 0) return; if (n.agg.gdp > 250 || G.enemiesOf(n.id).length) { ter[home].bld.radar = Math.max(ter[home].bld.radar || 0, 1); ter[home].base.radar = ter[home].bld.radar; G.recalcRegionEffects(ter[home]); }
      if (G.enemiesOf(n.id).length || ['USA', 'CHN', 'RUS', 'IND'].includes(n.a3)) { const fr = ter.filter(t => t.owner === n.id && t.ctrl === n.id && T[t.i].nb.some(j => ter[j].ctrl !== n.id && G.atWar(n.id, ter[j].ctrl))).slice(0, 3); const rr = fr.length ? fr : ter.filter(t => t.owner === n.id).sort((a, b) => b.gdp - a.gdp).slice(1, 4); rr.forEach(t => { t.bld.radar = 1; t.base.radar = 1; G.recalcRegionEffects(t); }); } });
    G.internetMonthly(true);
  };
  // ---- космос: запуски
  G.launchCap = function (nid) { const n = N[nid]; let lv = 0; for (const t of ter) if (t.owner === nid && t.ctrl === nid && t.bld) lv += (t.bld.launch_site || 0) * 4 + (t.bld.spaceport || 0) * 12; return Math.round(((n.space ? n.space.base : 0) + lv) * (G.has(n, 'reusable') ? 1.5 : 1)); };
  G.satMake = nid => { let lv = 0; for (const t of ter) if (t.owner === nid && t.ctrl === nid && t.bld) lv += t.bld.sat_factory || 0; return lv; };
  G.launchProviders = function (nid) { return N.filter(x => x.alive && x.id !== nid && G.launchCap(x.id) >= 4 && !G.atWar(x.id, nid) && G.rel[x.id][nid] > 20 && !G.sanctioned(x.id, nid)).sort((a, b) => G.rel[b.id][nid] - G.rel[a.id][nid]); };
  G.satOffer = function (nid, type, cnt) {
    const n = N[nid], S = ST[type]; if (!S) return null; const ownL = G.launchCap(nid) - (n.space.used || 0) >= Math.ceil(cnt / 4), ownM = G.satMake(nid) > 0 || (n.tech || 0) >= 1.05;
    const prov = ownL ? null : G.launchProviders(nid)[0];
    const satC = cnt * S.price * (G.has(n, 'smallsat') ? 0.6 : 1) * (ownM ? 1 : 1.3), launchC = Math.ceil(cnt / 4) * (ownL ? (G.has(n, 'reusable') ? 0.05 : 0.1) : 0.15);
    return { own: ownL, prov: prov ? prov.id : ownL ? nid : -1, cost: satC + launchC, days: (ownM ? 120 : 200) + (ownL ? 30 : 60), succ: ownL ? clamp(0.85 + (n.tech || 0) * 0.1, 0.85, 0.98) : 0.96 };
  };
  G.orderSat = function (nid, type, cnt) {
    const n = N[nid]; cnt = Math.round(cnt); if (!(cnt > 0) || !ST[type]) return { ok: false, err: 'Невірне замовлення' };
    if (type === 'recon' && !G.has(n, 'sat_net') && !G.has(n, 'launch_vehicles')) return { ok: false, err: 'Потрібне дослідження «Супутникові мережі звʼязку» або «Ракети-носії»' };
    const o = G.satOffer(nid, type, cnt); if (o.prov < 0) return { ok: false, err: 'Немає власних стартів і жодна дружня держава не продає запуски' };
    if (n.cash < o.cost) return { ok: false, err: 'Бракує коштів' };
    n.cash -= o.cost; if (o.own) n.space.used += Math.ceil(cnt / 4); else { N[o.prov].cash += o.cost * 0.5; G.rel[o.prov][nid] = clamp(G.rel[o.prov][nid] + 1, -100, 100); }
    n.space.q.push({ type, cnt, done: G.day + o.days, prov: o.prov, succ: o.succ }); return { ok: true, days: o.days, cost: o.cost, prov: o.prov };
  };
  // великі програми
  G.SPACE_PROG = {
    station: { n: 'Орбітальна станція', ic: '🛰', cost: 30, days: 1460, req: 'heavy_lift', d: 'наука +, престиж (стабільність +4, відносини зі світом +5)' },
    moon:    { n: 'Місячна місія', ic: '🌕', cost: 45, days: 1825, req: 'heavy_lift', d: 'історичний престиж: стабільність +8, відносини +8, технології' },
    mars:    { n: 'Пілотований політ на Марс', ic: '🔴', cost: 120, days: 3650, req: 'orbital_log', d: 'епохальне досягнення людства' }
  };
  G.startProgram = function (nid, k) {
    const n = N[nid], P = G.SPACE_PROG[k]; if (!P) return { ok: false, err: 'Невідома програма' };
    if (!G.has(n, P.req)) return { ok: false, err: 'Потрібне дослідження: ' + (G.D.techs[P.req] ? G.D.techs[P.req].n : P.req) };
    if (G.launchCap(nid) < 4) return { ok: false, err: 'Потрібні власні старти (≥ 4 на рік): стартовий майданчик або космодром' };
    if (n.space.prog && n.space.prog[k]) return { ok: false, err: 'Програма вже йде або завершена' };
    if (n.cash < P.cost * 0.2) return { ok: false, err: 'Потрібно щонайменше 20% вартості на старт' };
    n.space.prog = n.space.prog || {}; n.space.prog[k] = { start: G.day, done: G.day + P.days, paid: 0 }; return { ok: true };
  };
  // ---- угоди про розвіддані
  G.reconOwn = n => (n.sats ? n.sats.recon : 0) >= 3;
  G.hasRecon = function (nid) { const n = N[nid]; if (G.reconOwn(n)) return true; for (const k in n.intel || {}) if (n.intel[k].until > G.day && N[k] && N[k].alive && G.reconOwn(N[k])) return true; return G.blocShareRecon ? G.blocShareRecon(nid) : false; };
  G.blocShareRecon = function (nid) { if (!G.blocsOf) return false; for (const b of G.blocsOf(nid)) if (b.type === 'mil' || /NATO|НАТО/.test(b.n) || b.id === 'nato') { for (const x of b.m) if (x !== nid && N[x] && G.reconOwn(N[x])) return true; } return false; };
  G.intelDeal = function (nid, x, kind) {
    const n = N[nid], o = N[x]; if (!o || !o.alive || x === nid) return { ok: false, err: 'Оберіть державу' };
    if (!G.reconOwn(o)) return { ok: false, err: `${o.name} не має власних розвідсупутників` };
    if (G.atWar(nid, x)) return { ok: false, err: 'Ви воюєте' };
    if (kind === 'share' && !G.reconOwn(n)) return { ok: false, err: 'Для обміну потрібні власні розвідсупутники (≥3); інакше — оренда' };
    const r = G.rel[x][nid], foesOfEnemy = G.enemiesOf(nid).some(e => G.rel[x][e] < -10);
    const need = kind === 'share' ? 25 : 35 - (foesOfEnemy ? 20 : 0);
    if (!G.isHuman(x) && r < need) return { ok: false, err: `${o.name} відмовляє: потрібні відносини ≥ ${need} (зараз ${r.toFixed(0)})` };
    if (G.leaderBlocks && G.leaderBlocks(x, 'treaty')) return { ok: false, err: 'Потрібен візит лідера або дипломат у цій країні' };
    const fee = kind === 'lease' ? +(0.02 + o.sats.recon * 0.001).toFixed(3) : 0;
    n.intel[x] = { kind, until: G.day + 365, fee }; if (kind === 'share') o.intel[nid] = { kind, until: G.day + 365, fee: 0 };
    G.say(`🛰 Угода про розвіддані: ${n.name} ← ${o.name} (${kind === 'lease' ? 'оренда, $' + (fee * 1000).toFixed(0) + ' млн/міс.' : 'обмін'}) на рік`, 'good', [nid, x]);
    return { ok: true, fee };
  };
  G.asatStrike = function (nid, x, cnt) {
    const n = N[nid], o = N[x]; if (!G.has(n, 'asat')) return { ok: false, err: 'Потрібне дослідження «Протисупутникова зброя»' };
    if (!o || !G.atWar(nid, x)) return { ok: false, err: 'Лише проти держави, з якою ви воюєте' };
    cnt = Math.max(1, Math.min(5, Math.round(cnt || 1))); const cost = cnt * 0.3; if (n.cash < cost) return { ok: false, err: 'Бракує коштів' };
    if ((n._asatT || 0) > G.day) return { ok: false, err: `Наступний пуск через ${n._asatT - G.day} дн.` };
    n.cash -= cost; n._asatT = G.day + 30; const tot = Object.values(o.sats).reduce((a, b) => a + b, 0); if (!tot) return { ok: false, err: 'У ворога немає супутників' };
    let hit = 0; for (let k = 0; k < cnt; k++) if (G.rnd() < 0.7) { const ks = Object.keys(o.sats).filter(q => o.sats[q] >= 1); if (!ks.length) break; const q = ks.sort((a, b) => (b === 'recon' ? 1 : 0) - (a === 'recon' ? 1 : 0))[0]; o.sats[q]--; hit++; }
    N.forEach(z => { if (z.alive && z.id !== nid && z.id !== x && z.sats && (z.sats.comms + z.sats.recon) > 5) G.rel[z.id][nid] = clamp(G.rel[z.id][nid] - 3, -100, 100); });
    G.say(`☄ Протисупутниковий удар ${n.name} → ${o.name}: збито супутників ${hit}. Уламки на орбіті — світ засуджує`, G.isHuman(x) ? 'bad' : 'war', [nid, x]);
    return { ok: true, hit };
  };
  // ---- щомісячне: запуски, зношення, програми, оренда, інтернет
  G.spaceMonthly = function () {
    const yr = Math.floor(G.day / 365);
    N.forEach(n => {
      if (!n.alive || !n.sats) return; const sp = n.space;
      if (sp.yr !== yr) { sp.yr = yr; sp.used = 0; }
      // власний завод супутників сам поповнює угруповання (розвідка/звʼязок), якщо є старти
      const mk = G.satMake(n.id); if (mk && G.launchCap(n.id) > sp.used) { n.sats.comms += mk * 0.3; n.sats.recon += mk * 0.15; sp.used += mk * 0.1; }
      for (const k in n.sats) n.sats[k] = Math.max(0, n.sats[k] * (1 - 1 / 96)); // ресурс ~8 років
      if (sp.q.length) sp.q = sp.q.filter(q => { if (G.day < q.done) return true; const ok = G.rnd() < q.succ; if (ok) { n.sats[q.type] += q.cnt; sp.launched = (sp.launched || 0) + q.cnt; } if (n.id === G.player || G.isHuman(n.id)) G.say(ok ? `🚀 Успішний запуск: ${ST[q.type].ic} ${ST[q.type].n.toLowerCase()} супутники ×${q.cnt}${q.prov !== n.id ? ' (ракетою ' + N[q.prov].name + ')' : ''}` : `💥 Аварія ракети: втрачено ${q.cnt} супутників`, ok ? 'good' : 'bad', [n.id]); return false; });
      if (sp.prog) for (const k in sp.prog) { const p = sp.prog[k], P = G.SPACE_PROG[k]; if (p.ok) continue; const m = P.cost / (P.days / 30); const pay = Math.min(m, Math.max(0, n.cash * 0.5)); n.cash -= pay; p.paid += pay; if (G.day >= p.done) { if (p.paid >= P.cost * 0.95) { p.ok = true; sp.prest += k === 'mars' ? 25 : k === 'moon' ? 12 : 6; n.stab = Math.min(100, n.stab + (k === 'station' ? 4 : 8)); N.forEach(z => { if (z.id !== n.id && z.alive) G.rel[z.id][n.id] = clamp(G.rel[z.id][n.id] + (k === 'station' ? 5 : 8), -100, 100); }); n.techB = (n.techB || 0) + 0.02; G.say(`${P.ic} ${n.name}: ${P.n} — успіх! Історичне досягнення`, 'good', [n.id]); } else { p.done = G.day + 90; } } }
      // оренда розвідданих
      for (const k in n.intel) { const d = n.intel[k]; if (d.until <= G.day) { if (n.id === G.player) G.say(`🛰 Угода про розвіддані з ${N[k].name} завершилась — поновіть у вкладці «Розвідка»`, 'bad', [n.id]); delete n.intel[k]; continue; } if (d.fee) { n.cash -= d.fee; N[k].cash += d.fee; } }
      // ШІ: космічні амбіції
      if (!G.isHuman(n.id) || G.autoPlayer) {
        n.spaceGoal = (n.tech || 0) > 1 && n.agg.gdp > 1500 ? 0.4 : 0;
        if ((G.launchCap(n.id) >= 4 || n.agg.gdp > 400) && n.cash > n.agg.gdp * 0.01 && G.rnd() < 0.5) { const s0 = n.sats0 || {}; const lack = q => (n.sats[q] + n.space.q.filter(x => x.type === q).reduce((a, x) => a + x.cnt, 0)) < Math.max(s0[q] || 0, { recon: n.agg.gdp > 600 ? 3 : 0, comms: n.agg.gdp > 300 ? 4 : 0, nav: 0, ew: 0 }[q]) * 0.92; const t = ['recon', 'comms', 'nav', 'ew'].find(lack); if (t) G.orderSat(n.id, t, Math.max(2, Math.min(16, Math.ceil(((s0[t] || 3) - n.sats[t]) * 0.6)))); }
        if (G.enemiesOf(n.id).length && !G.hasRecon(n.id) && G.rnd() < 0.15) { const p = N.filter(x => x.alive && G.reconOwn(x) && !G.atWar(x.id, n.id)).sort((a, b) => G.rel[b.id][n.id] - G.rel[a.id][n.id])[0]; if (p) G.intelDeal(n.id, p.id, G.reconOwn(n) ? 'share' : 'lease'); }
        if (G.has(n, 'heavy_lift') && n.agg.gdp > 5000 && G.rnd() < 0.02) { const k = !(n.space.prog && n.space.prog.station) ? 'station' : !(n.space.prog && n.space.prog.moon) ? 'moon' : null; if (k) G.startProgram(n.id, k); }
      }
    });
    G.internetMonthly();
  };
  G.internetMonthly = function (init) {
    const bn = {}; for (const t of ter) { if (!t.bld || t.owner !== t.ctrl) continue; let v = 0; for (const k in t.bld) { const e = (G.D.buildings[k] || {}).eff; if (e && e.net) v += e.net * t.bld[k]; } if (v) bn[t.owner] = (bn[t.owner] || 0) + v * (1 - (t.dmg || 0)); }
    N.forEach(n => {
      if (!n.alive) return; const base = clamp((Math.log10(Math.max(500, n.pc || 5000)) - 2.7) / 2, 0.08, 0.85);
      const pop = Math.max(1, n.agg ? n.agg.pop : 10); const b = Math.min(0.25, (bn[n.id] || 0) / Math.sqrt(pop) * 0.6);
      const sat = Math.min(G.has(n, 'sat_internet') ? 0.15 : 0.06, (n.sats ? n.sats.comms : 0) / 400) + (G.has(n, 'net6g') ? 0.05 : 0);
      n.net = clamp(base + b + sat + (n.netB || 0) - (n._netCut > G.day ? 0.3 : 0), 0, 1);
      if (!init) { const g = (n.net - 0.55) * 0.00018; if (g) for (const t of ter) if (t.owner === n.id && t.ctrl === n.id) t.gdp *= 1 + g; }
    });
  };
  // ---- РЛС і видимість
  let _radar = null, _radarDay = -99; const _cov = new Map();
  G.radarSet = function () {
    if (_radar && G.day - _radarDay < 7) return _radar; _radar = {}; _radarDay = G.day;
    const src = []; ter.forEach((t, i) => { if (t.radar > 0 && t.ctrl === t.owner) src.push(i); });
    for (const i of src) { const nid = ter[i].ctrl, R = Math.round(ter[i].radar); const s = _radar[nid] || (_radar[nid] = new Set()); const key = i + ':' + R; let cov = _cov.get(key); if (!cov) { cov = []; const [lo, la] = T[i].c; const dLa = R / 111; for (let j = 0; j < ter.length; j++) { const c = T[j].c; if (Math.abs(c[1] - la) > dLa) continue; if (hav(i, j) <= R) cov.push(j); } _cov.set(key, cov); } for (const j of cov) s.add(j); }
    return _radar;
  };
  G.strikeDefBonus = function (nid, i, w) {
    const t = ter[i], n = N[nid]; let b = 0;
    if (w === 'strike' && t.ew) b += t.ew * 0.5; // РЕБ глушить дрони
    const rs = G.radarSet()[nid]; if (rs && rs.has(i)) b += 0.06; // радарне покриття
    if ((w === 'ballistic' || w === 'hyper') && n.sats && n.sats.ew >= 2) b += 0.1;
    return b;
  };
  // туман війни для гравця: що видно
  G.visibleFor = function (nid) {
    const vis = new Uint8Array(ter.length); if (nid < 0) { vis.fill(1); return vis; }
    const friends = new Set([nid]); N.forEach(x => { if (x.alive && x.id !== nid && (G.allied(nid, x.id) || (G.blocShareRecon && false))) friends.add(x.id); });
    ter.forEach((t, i) => { if (friends.has(t.ctrl) || friends.has(t.owner) && t.owner === nid) { vis[i] = 1; for (const j of T[i].nb) vis[j] = 1; } });
    for (const a of G.armies) if (friends.has(a.n)) { vis[a.t] = 1; for (const j of T[a.t].nb) vis[j] = 1; }
    for (const a of (G.agents || [])) if (a.n === nid && !a.mv) { vis[a.at] = 1; for (const j of T[a.at].nb) vis[j] = 1; }
    const rs = G.radarSet(); for (const f of friends) if (rs[f]) for (const j of rs[f]) vis[j] = 1;
    if (G.hasRecon(nid)) { const en = new Set(G.enemiesOf(nid)); ter.forEach((t, i) => { if (en.has(t.ctrl)) vis[i] = 1; }); }
    return vis;
  };
  G.intelDaily = function () {
    for (const a of G.armies) { const n = N[a.n]; if (n.sats && n.sats.comms >= 5 && a.org < 1) a.org = Math.min(1, a.org + 0.0015); }
  };
  G.navBonus = nid => (N[nid].sats && N[nid].sats.nav >= 10) ? 1.1 : 1;
  // нові дії гравця
  G.act.orderSat = (type, cnt) => G.player >= 0 ? G.orderSat(G.player, type, cnt) : { ok: false, err: 'Лише за державу' };
  G.act.startProgram = k => G.player >= 0 ? G.startProgram(G.player, k) : { ok: false, err: 'Лише за державу' };
  G.act.intelDeal = (x, kind) => G.player >= 0 ? G.intelDeal(G.player, x, kind) : { ok: false, err: 'Лише за державу' };
  G.act.asat = (x, cnt) => G.player >= 0 ? G.asatStrike(G.player, x, cnt) : { ok: false, err: 'Лише за державу' };
});
