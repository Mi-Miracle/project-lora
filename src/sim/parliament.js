// ПАРЛАМЕНТИ Й РАДИ ДИРЕКТОРІВ.
// Держави: режим (демократія / гібридний / автократія), фракції, вибори за графіком. У демократіях великі рішення гравця
// (податки, мобілізація, оборонний бюджет, оголошення війни) проходять голосування. Компанії: рада директорів оцінює
// прибутковість; при невдоволенні блокує великі витрати, а в крайньому разі звільняє CEO.
LORA.sim.register('parliament', 93, function (G) {
  const { N, ter } = G; const U = LORA.core, clamp = U.clamp;
  const AUTO = ['RUS', 'CHN', 'PRK', 'IRN', 'SAU', 'BLR', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR', 'TKM', 'TJK', 'UZB', 'ERI', 'CUB', 'VNM', 'LAO', 'SYR', 'AZE', 'NIC', 'VEN', 'AFG', 'MMR', 'BRN', 'SWZ', 'GNQ', 'TCD', 'CMR', 'RWA'];
  const HYB = ['TUR', 'HUN', 'SRB', 'GEO', 'KAZ', 'KGZ', 'EGY', 'PAK', 'BGD', 'THA', 'ARM', 'DZA', 'MAR', 'ETH', 'UGA', 'ZWE', 'TZA', 'KHM', 'IRQ', 'LBN', 'MOZ', 'AGO', 'JOR', 'TUN', 'NGA', 'SDN', 'MLI', 'BFA'];
  const NAMES = { UKR: 'Верховна Рада', USA: 'Конгрес', RUS: 'Державна дума', GBR: 'Парламент', DEU: 'Бундестаг', FRA: 'Національні збори', POL: 'Сейм', CHN: 'Всекитайські збори', JPN: 'Парламент (Кокай)', ISR: 'Кнесет', TUR: 'Велике національне зібрання', IND: 'Лок Сабха', ITA: 'Палата депутатів', ESP: 'Генеральні кортеси', CAN: 'Палата громад', BLR: 'Палата представників', KOR: 'Національні збори', IRN: 'Меджліс', MDA: 'Парламент', GEO: 'Парламент', NOR: 'Стортинг', SWE: 'Риксдаг', FIN: 'Едускунта', LTU: 'Сейм', LVA: 'Сейм', EST: 'Рійгікогу', NLD: 'Генеральні штати', HUN: 'Державні збори', ROU: 'Парламент', BRA: 'Національний конгрес' };
  N.forEach(n => {
    const regime = AUTO.includes(n.a3) ? 'autocracy' : HYB.includes(n.a3) ? 'hybrid' : 'democracy';
    const gov = regime === 'autocracy' ? 0.8 : regime === 'hybrid' ? 0.6 : 0.36 + G.rnd() * 0.16, coal = regime === 'democracy' ? 0.1 + G.rnd() * 0.12 : 0.05;
    const cyc = regime === 'democracy' ? 1460 + Math.floor(G.rnd() * 365) : regime === 'hybrid' ? 1825 : 2190;
    n.parl = { regime, name: NAMES[n.a3] || 'Парламент', seats: n.a3 === 'UKR' ? 450 : regime === 'autocracy' ? 300 : 400, gov, coal, cyc, next: Math.floor(G.rnd() * cyc) + 60, lock: {}, votes: [] };
  });
  if (N[G.nIdx.UKR]) Object.assign(N[G.nIdx.UKR].parl, { gov: 0.53, coal: 0.08, next: 900 }); // воєнний стан: вибори відкладено
  G.parlSupport = n => { const p = n.parl; if (p.regime === 'autocracy') return 0.95; return clamp(p.gov + p.coal + (n.stab - 50) / 400 + (G.enemiesOf(n.id).length ? 0.04 : 0), 0, 1); };
  // голосування за рішення гравця
  G.parlVote = function (n, key, what) {
    const p = n.parl; if (p.regime === 'autocracy') return { ok: true };
    if (p.lock[key] > G.day) return { ok: false, err: `${p.name} нещодавно провалила це рішення — повторне голосування через ${p.lock[key] - G.day} дн.` };
    const sup = G.parlSupport(n) * (p.regime === 'hybrid' ? 1.25 : 1); const yes = clamp(sup + (G.rnd() - 0.5) * 0.16, 0, 1); const votes = Math.round(yes * p.seats), need = Math.floor(p.seats / 2) + 1;
    const ok = votes >= need; p.votes.unshift({ d: G.day, what, yes: votes, need, ok }); p.votes.length = Math.min(p.votes.length, 12);
    if (!ok) p.lock[key] = G.day + 30;
    G.say(`🏛 ${p.name}: «${what}» — ${ok ? 'ухвалено' : 'провалено'} (${votes} із ${need} потрібних)`, ok ? 'good' : 'bad', [n.id]);
    LORA.bus.emit('vote', { n: n.id, what, ok });
    return ok ? { ok: true } : { ok: false, err: `${p.name} не підтримала: ${votes} голосів із ${need}` };
  };
  const BIG = { tax: [0.04, 'Зміна податків'], mob: [0.006, 'Мобілізація'], mil: [0.04, 'Оборонний бюджет'], soc: [0.06, 'Соціальні видатки'] };
  const baseSet = G.act.setPolicy;
  G.act.setPolicy = function (k, v) {
    const n = N[G.player]; const b = BIG[k]; if (n && n.parl && !n.parl.law) n.parl.law = Object.assign({}, n.pol);
    if (n && b && n.parl && Math.abs(v - n.parl.law[k]) >= b[0] && !G.autoPlayer) {
      const r = G.parlVote(n, k, `${b[1]}: ${(v * 100).toFixed(1)}%`); if (!r.ok) return r;
      n.parl.law = n.parl.law || {}; n.parl.law[k] = v;
    }
    return baseSet(k, v);
  };
  const baseWar = G.act.declareWar;
  G.act.declareWar = function (x) { const n = N[G.player]; if (n && n.parl && n.parl.regime !== 'autocracy' && !G.autoPlayer) { const r = G.parlVote(n, 'war' + x, `Оголошення війни: ${N[x].name}`); if (!r.ok) return r; } return baseWar(x); };
  // вибори
  function election(n) {
    const p = n.parl; p.next = G.day + p.cyc;
    if (p.regime === 'autocracy') { if (G.charElection && G.leader && G.leader.cand === n.id && (G.leader.cont[n.id] || 0) >= 80) G.charElection(n.id); return; }
    const before = p.gov + p.coal; const mood = (n.stab - 50) / 100 + (n.growth - 0.02) * 4 - (n.warExh || 0) * 0.15;
    p.gov = clamp(p.gov + mood * 0.35 + (G.rnd() - 0.5) * 0.12, 0.15, p.regime === 'hybrid' ? 0.75 : 0.6); p.coal = clamp(0.08 + G.rnd() * 0.12, 0, 0.25);
    const won = p.gov + p.coal > 0.5; p.lastElection = { d: G.day, gov: p.gov, won };
    if (G.leader && G.leader.role === 'char' && G.leader.cand === n.id) { if (G.charElection(n.id)) { p.gov = 0.45; p.coal = 0.1; } return; }
    if (n.id === G.player) { if (!won) { n.stab = Math.max(0, n.stab - 4); G.say(`🗳 Вибори до ${p.name}: опозиція отримала більшість (${((1 - p.gov - p.coal) * 100).toFixed(0)}%). Ухвалювати рішення стане важче`, 'bad', [n.id]); }
      else G.say(`🗳 Вибори до ${p.name}: ваша коаліція зберегла більшість (${((p.gov + p.coal) * 100).toFixed(0)}%)`, 'good', [n.id]); }
    else if (won !== before > 0.5 && n.agg && n.agg.gdp > 300) G.say(`🗳 ${n.name}: ${won ? 'уряд зберіг владу' : 'опозиція перемогла на виборах'}`, 'info', [n.id]);
  }
  // ---- рада директорів компаній
  const BS = c => { c.board = c.board || { sat: 60, fired: false }; return c.board; };
  G.boardCheck = function (c, cost, what) {
    if (!c || c.id !== G.pc) return { ok: true }; const b = BS(c); const share = cost / Math.max(0.5, G.coValue(c));
    if (share < 0.25 || b.sat >= 55) return { ok: true };
    const ok = G.rnd() < clamp(b.sat / 70 + 0.15 - share * 0.4, 0.05, 0.95);
    G.say(`👔 Рада директорів «${c.name}»: «${what}» — ${ok ? 'схвалено' : 'відхилено (задоволеність ' + b.sat.toFixed(0) + ')'}`, ok ? 'good' : 'bad', [c.home]);
    return ok ? { ok: true } : { ok: false, err: 'Рада директорів відхилила витрату' };
  };
  const bBuild = G.coBuild, bTake = G.coTakeover;
  G.coBuild = function (c, i, type, quiet) { const r = G.boardCheck(c, G.buildCost(ter[i].owner, i, type) * 1.1, 'Будівництво: ' + G.D.buildings[type].n); if (!r.ok) return r; return bBuild(c, i, type, quiet); };
  G.coTakeover = function (c, nid) { const r = G.boardCheck(c, G.takeoverCost(c, nid), 'Політична кампанія'); if (!r.ok) return r; return bTake(c, nid); };
  function boardMonthly(c) {
    const b = BS(c); const v = G.coValue(c), h = c.hist; const g = h.length > 6 ? v / Math.max(0.1, h[h.length - 7]) - 1 : 0.02;
    b.sat = clamp(b.sat + (g * 120 - 1) * 0.8 + (c.cash < 0 ? -3 : 0), 0, 100); b.g = g;
    if (b.sat < 12 && G.player < 0 && !b.warned) { b.warned = G.day; G.say(`👔 Рада директорів «${c.name}» загрожує звільнити CEO: компанія дешевшає`, 'bad', [c.home]); }
    else if (b.sat < 8 && b.warned && G.day - b.warned > 90 && G.player < 0) { b.fired = true; G.gameOver = { text: `Рада директорів «${c.name}» звільнила вас з посади CEO.` }; G.say('👔 ' + G.gameOver.text, 'big', [c.home]); }
    else if (b.sat > 20) b.warned = 0;
  }
  G.parliamentDaily = function () {
    N.forEach(n => { if (n.alive && n.parl && G.day >= n.parl.next) election(n); });
    if (G.day % 30 === 15) { const c = G.myCo && G.myCo(); if (c) boardMonthly(c); }
  };
});
