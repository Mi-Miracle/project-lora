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
    if (p.decree > G.day) { p.votes.unshift({ d: G.day, what: what + ' (указом)', yes: 0, need: 0, ok: true }); p.votes.length = Math.min(p.votes.length, 12); return { ok: true }; }
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
  // ---- вплив на парламент (дії гравця)
  G.PARL_ACT = {
    lobby:    { n: 'Переговори з фракціями', ic: '🤝', d: 'Посади й бюджетні програми для депутатів-позафракційників: +3–6% до коаліції.', cd: 45 },
    campaign: { n: 'Інформаційна кампанія', ic: '📣', d: 'Агітація за курс уряду: +2–4% до партії влади, +1 стабільність.', cd: 60 },
    deal:     { n: 'Коаліційна угода', ic: '📜', d: 'Нова коаліція з поступками: +8–12% до коаліції, але −2 стабільність і збільшені соцвидатки на рік.', cd: 365 },
    whip:     { n: 'Партійна дисципліна', ic: '📏', d: 'Тиск на своїх депутатів: заблоковані рішення можна знову ставити на голосування одразу.', cd: 90 },
    decree:   { n: 'Надзвичайні повноваження', ic: '⚖', d: 'Рішення ухвалюються указами 90 днів без голосувань. Лише під час війни або в гібридному режимі. −4 стабільність, демократії невдоволені.', cd: 365 },
    snap:     { n: 'Розпустити парламент', ic: '🗳', d: 'Дострокові вибори через 60 днів. Ризиковано: результат залежить від стабільності й економіки.', cd: 720 }
  };
  G.parlActCost = (nid, k) => { const g = Math.max(20, N[nid].agg ? N[nid].agg.gdp : 100); return +(k === 'lobby' ? g * 0.0004 : k === 'campaign' ? g * 0.0003 : k === 'deal' ? g * 0.0008 : k === 'snap' ? g * 0.0002 : 0).toFixed(2); };
  G.parlCan = function (nid, k) {
    const n = N[nid]; if (!n || !n.parl) return 'Немає парламенту'; const p = n.parl, A = G.PARL_ACT[k]; if (!A) return '?';
    if (p.regime === 'autocracy') return 'В автократії парламент і так слухняний';
    p.cd = p.cd || {}; if (p.cd[k] > G.day) return `Ще ${p.cd[k] - G.day} дн.`;
    if (k === 'decree' && p.regime !== 'hybrid' && !G.enemiesOf(nid).length) return 'Лише під час війни або в гібридному режимі';
    if (k === 'whip' && !Object.values(p.lock).some(d => d > G.day)) return 'Немає заблокованих рішень';
    if (k === 'snap' && p.next - G.day < 120) return 'Вибори й так скоро';
    if (k === 'snap' && nid === G.nIdx.UKR && G.enemiesOf(nid).length) return 'Воєнний стан: вибори неможливі';
    const c = G.parlActCost(nid, k); if (c > n.cash + 0.01) return 'Бракує коштів (' + c + ' млрд)';
    return '';
  };
  G.parlAct = function (nid, k) {
    const e = G.parlCan(nid, k); if (e) return { ok: false, err: e };
    const n = N[nid], p = n.parl, A = G.PARL_ACT[k]; n.cash -= G.parlActCost(nid, k); p.cd[k] = G.day + A.cd; const room = Math.max(0, 0.62 - p.gov - p.coal); let msg = '';
    if (k === 'lobby') { const d = Math.min(room + 0.02, 0.03 + G.rnd() * 0.03); p.coal = clamp(p.coal + d, 0, 0.35); msg = `коаліція +${(d * 100).toFixed(1)}%`; if (G.rnd() < 0.12) { n.stab = Math.max(0, n.stab - 3); msg += '; журналісти розкопали «домовленості» — скандал, −3 стабільності'; } }
    if (k === 'campaign') { const d = Math.min(room + 0.02, 0.02 + G.rnd() * 0.02); p.gov = clamp(p.gov + d, 0, 0.7); n.stab = Math.min(100, n.stab + 1); msg = `партія влади +${(d * 100).toFixed(1)}%`; }
    if (k === 'deal') { const d = 0.08 + G.rnd() * 0.04; p.coal = clamp(p.coal + d, 0, 0.4); n.stab = Math.max(0, n.stab - 2); n.pol.soc = Math.min(0.35, (n.pol.soc || 0.15) + 0.02); if (p.law) p.law.soc = n.pol.soc; msg = `коаліція +${(d * 100).toFixed(0)}%, соцвидатки +2%`; }
    if (k === 'whip') { p.lock = {}; msg = 'блокування голосувань знято'; }
    if (k === 'decree') { p.decree = G.day + 90; n.stab = Math.max(0, n.stab - 4); N.forEach(m => { if (m.alive && m.id !== nid && m.parl && m.parl.regime === 'democracy' && G.rel[m.id]) { G.rel[m.id][nid] = Math.max(-100, G.rel[m.id][nid] - 2); G.rel[nid][m.id] = G.rel[m.id][nid]; } }); msg = 'рішення ухвалюються указами 90 днів'; }
    if (k === 'snap') { p.next = G.day + 60; msg = 'дострокові вибори через 60 днів'; }
    G.say(`🏛 ${p.name}: ${A.n} — ${msg}`, 'info', [nid]);
    return { ok: true };
  };
  G.act.parlAct = k => G.player >= 0 ? G.parlAct(G.player, k) : { ok: false, err: 'Лише для глави держави' };
  // вибори
  function election(n) {
    const p = n.parl; p.next = G.day + p.cyc;
    if (G.radaOn && G.radaOn() && n.id === G.player) { G.radaElection(n); return; }
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
