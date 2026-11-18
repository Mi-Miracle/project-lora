// КОРПОРАЦІЯ — повноцінний геймплей за компанію: R&D-дерево сектору, виробничі лінії, склад продукції,
// державні тендери й контракти (військові поставки йдуть прямо в арсенал держави-замовника), проєктні контракти,
// кредити, події компанії, каталог будівництва з найкращими місцями.
LORA.sim.register('corp', 99.6, function (G) {
  const { N, ter, T } = G; const D = G.D, U = D.units, BD = D.buildings; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // ---- продукція (товари на склад). ars — ключ арсеналу держави-покупця; from — заводи; rate — од./рік на рівень заводу (як у державних заводах)
  const GOODS = {};
  Object.entries(U).forEach(([k, u]) => { GOODS[k] = { n: u.n, en: u.en, ic: u.ic, u: u.u, ars: k, from: Object.keys(u.prod || {}).filter(b => (u.prod[b] || 0) > 0), rate: u.prod || {}, price: u.price, sector: 'military', rd: { ballistic: 'c_ballistic', hyper: 'c_hyper', glide: 'c_glide', missiles: 'c_missile', sam: 'c_sam' }[k] || null }; });
  G.CORP_GOODS = GOODS;
  // ---- проєктні контракти за секторами: потрібна «потужність» (сума рівнів профільних активів)
  const PROJ = {
    military: [['Модернізація ППО', 3, 1.2, 180], ['Ремонт бронетехніки', 2, 0.6, 120], ['Будівництво фортифікацій', 2, 0.8, 150]],
    tech: [['Цифровізація податкової', 2, 0.7, 180], ['Державний дата-центр', 4, 1.6, 300], ['Система кібербезпеки', 3, 1.0, 200], ['Електронні паспорти', 2, 0.5, 150]],
    energy: [['Будівництво сонячної станції', 3, 1.2, 270], ['Енергоміст між країнами', 4, 2.0, 360], ['Відновлення енергомережі', 2, 0.8, 150], ['Постачання газу в резерв', 2, 0.9, 120]],
    agro: [['Державний резерв зерна', 2, 0.6, 120], ['Продовольча допомога', 2, 0.5, 90], ['Іригаційна система', 3, 1.0, 240]],
    telecom: [['Мережа 5G', 3, 1.2, 240], ['Оптоволокно в села', 2, 0.6, 180], ['Резервний звʼязок для армії', 2, 0.8, 120]],
    space: [['Запуск державного супутника', 2, 1.5, 200], ['Наземна станція', 2, 0.7, 150]],
    leisure: [['Олімпійський обʼєкт', 3, 1.4, 360], ['Відновлення туристичних курортів', 2, 0.6, 180]],
    _: [['Державне замовлення', 2, 0.6, 150], ['Інфраструктурний проєкт', 3, 1.0, 240]]
  };
  // ---- R&D дерева: e.rate (+% виробництва), e.cost (−% собівартості), e.qual (+ якість, перемоги в тендерах), e.profit (+% прибутку активів), e.cap (+ потужність проєктів)
  const RD = G.D.corpRD;
  G.corpTree = c => (RD[c.sector] || RD._).map(([id, n, cost, req, e, st]) => ({ id, n, cost, req, e, st }));
  // держтехнологія-передумова: є в країні штабу або в будь-якій країні з офісом компанії
  G.corpStOk = (c, st) => !st || !G.D.techs[st] || c.offices.some(o => N[o.n] && N[o.n].res && N[o.n].res.done[st] != null) || (N[c.home] && N[c.home].res.done[st] != null);
  G.corpInit = function (c) {
    if (c.rd) return; c.rd = { pts: 0, budget: 0.15, done: {}, cur: null }; c.inv = {}; c.lines = {}; c.debt = 0; c.rep = 50; c.contracts = []; c.bids = [];
  };
  const fx = (c, k) => G.corpTree(c).reduce((s, t) => s + (c.rd.done[t.id] != null && t.e[k] ? t.e[k] : 0), 0);
  G.corpFx = fx;
  G.corpHasGood = (c, k) => { const g = GOODS[k]; if (!g || c.sector !== 'military') return false; if (g.rd && c.rd.done[g.rd] == null) return false; return g.from.some(b => c.assets.some(a => a.type === b)); };
  G.corpCap = c => { const sec = (D.companySectors[c.sector] || {}).assets || []; return c.assets.filter(a => sec.includes(a.type)).reduce((s, a) => s + a.lvl, 0) + Math.round(fx(c, 'cap') * 2); };
  G.corpCapUsed = c => (c.contracts || []).filter(k => k.kind === 'proj').reduce((s, k) => s + k.need, 0);
  // місячне виробництво товару
  const COMM = 5; // приватні лінії працюють у кілька змін: ×5 до державної норми
  G.corpRate = (c, k) => { const g = GOODS[k]; let r = 0; c.assets.forEach(a => { if (g.rate[a.type]) r += g.rate[a.type] * a.lvl / 12; }); return r * COMM * (1 + fx(c, 'rate')); };
  G.corpUnitCost = (c, k) => GOODS[k].price * 0.62 * (1 - fx(c, 'cost'));
  // ---- R&D
  G.corpSetRD = function (c, id) { const t = G.corpTree(c).find(x => x.id === id); if (!t) return { ok: false, err: 'Невідома розробка' }; if (c.rd.done[id] != null) return { ok: false, err: 'Вже розроблено' }; if (t.req.some(r => c.rd.done[r] == null)) return { ok: false, err: 'Спершу потрібні попередні розробки' }; if (!G.corpStOk(c, t.st)) return { ok: false, err: `Держава ще не дослідила «${G.D.techs[t.st].n}»` }; c.rd.cur = id; return { ok: true }; };
  // ---- тендери
  G.tenders = G.tenders || [];
  function genTenders() {
    const sectors = Object.keys(D.companySectors);
    N.forEach(n => {
      if (!n.alive || !n.agg || n.agg.gdp < 60) return; const war = G.enemiesOf(n.id).length > 0;
      // військові поставки: держави у війні або з великим оборонним бюджетом
      const nT = war ? (G.rnd() < 0.9 ? 1 : 0) + (G.rnd() < 0.5 ? 1 : 0) + (n.agg.gdp > 1500 && G.rnd() < 0.5 ? 1 : 0) : (n.pol && n.pol.mil > 0.03 && G.rnd() < 0.12 ? 1 : 0);
      const W = [['fpv', 4], ['shells', 4], ['strike', 3], ['armor', 2], ['sam', 2], ['glide', 1], ['missiles', 1], ['ballistic', 0.5]];
      for (let q = 0; q < nT; q++) {
        let r = G.rnd() * W.reduce((a, x) => a + x[1], 0), k = 'fpv'; for (const [kk, w] of W) { r -= w; if (r <= 0) { k = kk; break; } } const g = GOODS[k]; if (!g) continue;
        const base = Math.max(...Object.values(g.rate).filter(v => v > 0)) * COMM / 12; // місячний випуск одного рівня заводу
        const months = 3 + G.rnd() * 7, size = clamp(n.agg.gdp / 600, 0.5, 4); const qty = Math.max(1, Math.round(base * months * size));
        G.tenders.push({ id: G.nextId++, buyer: n.id, kind: 'good', good: k, qty, price: +(g.price * (1.15 + G.rnd() * 0.3)).toFixed(6), due: G.day + Math.round(months * 30) + 60, close: G.day + 25, sector: 'military', bids: [] });
      }
      if (G.rnd() < 0.12) {
        const sec = sectors[Math.floor(G.rnd() * sectors.length)]; const L = PROJ[sec] || PROJ._; const [nm, need, base, days] = L[Math.floor(G.rnd() * L.length)];
        const val = +(base * clamp(n.agg.gdp / 800, 0.4, 3) * (0.8 + G.rnd() * 0.5)).toFixed(2);
        G.tenders.push({ id: G.nextId++, buyer: n.id, kind: 'proj', name: nm, need, value: val, days, close: G.day + 25, sector: sec, bids: [] });
      }
    });
    if (G.tenders.length > 160) G.tenders = G.tenders.slice(-160);
  }
  G.corpCanBid = function (c, t) {
    if (c.sector !== t.sector) return 'Не ваш сектор'; const b = t.buyer;
    if (!G.coHasOffice(c, b) && b !== c.home) return 'Потрібен офіс у країні-замовнику';
    if (G.atWar(b, c.home) || G.sanctioned(b, c.home)) return 'Країна вашого штабу у війні чи санкціях із замовником';
    if (t.bids.some(x => x.co === c.id)) return 'Ви вже подали заявку';
    if (t.kind === 'good' && !G.corpHasGood(c, t.good)) return 'Немає виробничої лінії цього товару (завод + розробка)';
    if (t.kind === 'proj' && G.corpCap(c) - G.corpCapUsed(c) < t.need) return `Бракує потужностей: потрібно ${t.need}, вільно ${G.corpCap(c) - G.corpCapUsed(c)}`;
    return '';
  };
  G.corpBid = function (c, tid, mul) {
    const t = G.tenders.find(x => x.id === tid); if (!t) return { ok: false, err: 'Тендер закрито' }; const e = G.corpCanBid(c, t); if (e) return { ok: false, err: e };
    t.bids.push({ co: c.id, mul: clamp(mul, 0.6, 1.3) }); return { ok: true };
  };
  function scoreBid(c, t, mul) { const q = 1 + fx(c, 'qual') + (c.rep - 50) / 200; const infl = 1 + (c.infl[t.buyer] || 0) / 120; const home = c.home === t.buyer ? 1.25 : G.allied(c.home, t.buyer) ? 1.1 : 1; return q * infl * home / mul; }
  function closeTenders() {
    G.tenders.filter(t => t.close <= G.day && !t.done && t.kind !== 'res').forEach(t => {
      t.done = true;
      // ШІ-конкуренти
      G.companies.forEach(c => { if (!c.alive || !c.ai || c.sector !== t.sector) return; G.corpInit(c); const e = G.corpCanBid(c, t); if (e && !/офіс|лінії|потужност/.test(e)) return; if (t.kind === 'good' && !c.assets.some(a => GOODS[t.good].from.includes(a.type))) return; if (G.rnd() < 0.55) t.bids.push({ co: c.id, mul: 0.85 + G.rnd() * 0.3 }); });
      if (!t.bids.length) return;
      const best = t.bids.map(b => ({ b, s: scoreBid(G.companies[b.co], t, b.mul) * (0.85 + G.rnd() * 0.3) })).sort((a, b) => b.s - a.s)[0].b; const c = G.companies[best.co];
      G.corpInit(c); const k = t.kind === 'good' ? { id: t.id, kind: 'good', buyer: t.buyer, good: t.good, qty: t.qty, left: t.qty, price: t.price * best.mul, due: t.due } : { id: t.id, kind: 'proj', buyer: t.buyer, name: t.name, need: t.need, value: t.value * best.mul, done: G.day + t.days, start: G.day };
      c.contracts.push(k);
      if (!c.ai) G.say(`📑 Контракт виграно: ${t.kind === 'good' ? `${GOODS[t.good].n} ×${t.qty.toLocaleString()}` : t.name} для ${N[t.buyer].name} (${(k.kind === 'good' ? k.qty * k.price : k.value).toFixed(2)} млрд)`, 'good', [c.home]);
      else if (t.bids.some(b => b.co === G.pc)) G.say(`📑 Тендер ${N[t.buyer].name} програно — переміг «${c.name}»`, 'bad', [G.myCo().home]);
    });
    G.tenders = G.tenders.filter(t => !t.done || t.close > G.day - 1);
  }
  // ---- щомісяця: R&D, виробництво, поставки, проєкти, кредити
  G.corpMonthly = function () {
    genTenders(); closeTenders();
    G.companies.forEach(c => {
      if (!c.alive) return; G.corpInit(c); const human = !c.ai;
      // R&D: бюджет = частка прибутку (мін. $5 млн/міс), очки: $1 млрд ≈ 1000 очок; лабораторії (університети, дата-центри) +20% кожна
      const labs = c.assets.filter(a => a.type === 'university' || a.type === 'datacenter' || a.type === 'ai_datacenter').reduce((s, a) => s + a.lvl, 0);
      if (c.rd.budget < 0.05 || c.rd.budget > 3) c.rd.budget = 0.15; const spend = c.rd.budget / 12; c.rd.pts += 8 * (1 + labs * 0.2); if (c.cash > spend) { c.cash -= spend; c.rd.pts += spend * 3500 * (1 + labs * 0.2); }
      if (!c.rd.cur && !human) { const nx = G.corpTree(c).find(t => c.rd.done[t.id] == null && t.req.every(r => c.rd.done[r] != null) && G.corpStOk(c, t.st)); if (nx) c.rd.cur = nx.id; }
      const cur = c.rd.cur && G.corpTree(c).find(t => t.id === c.rd.cur);
      if (cur && c.rd.pts >= cur.cost) { c.rd.pts -= cur.cost; c.rd.done[cur.id] = G.day; c.rd.cur = null; if (human) G.say(`🔬 R&D «${c.name}»: розроблено «${cur.n}»`, 'good', [c.home]); }
      // виробництво: лінії, увімкнені гравцем (ШІ — під свої контракти)
      if (c.sector === 'military') Object.keys(GOODS).forEach(k => {
        if (!G.corpHasGood(c, k)) return; const on = human ? c.lines[k] !== false : c.contracts.some(x => x.good === k) || G.rnd() < 0.3; if (!on) return;
        const q = Math.floor(G.corpRate(c, k)); if (q < 1) return; const cost = q * G.corpUnitCost(c, k); if (c.cash < cost) return; c.cash -= cost; c.inv[k] = (c.inv[k] || 0) + q;
      });
      // поставки за контрактами
      c.contracts.forEach(k => {
        if (k.kind === 'good') {
          const have = c.inv[k.good] || 0, d = Math.min(have, k.left); if (d > 0) { c.inv[k.good] -= d; k.left -= d; const pay = d * k.price; c.cash += pay; const b = N[k.buyer]; if (b && b.alive) { b.ars[k.good] = (b.ars[k.good] || 0) + d; b.cash -= pay; } }
          if (k.left <= 0) { k.fin = 1; c.rep = clamp(c.rep + 3, 0, 100); c.infl[k.buyer] = Math.min(100, (c.infl[k.buyer] || 0) + 2); if (human) G.say(`✅ Контракт виконано: ${GOODS[k.good].n} для ${N[k.buyer].name}`, 'good', [c.home]); }
          else if (G.day > k.due) { k.fin = 2; const pen = k.left * k.price * 0.2; c.cash -= pen; c.rep = clamp(c.rep - 8, 0, 100); if (human) G.say(`⛔ Зірвано контракт для ${N[k.buyer].name}: штраф ${pen.toFixed(2)} млрд, репутація −8`, 'bad', [c.home]); }
        } else if (G.day >= k.done) { k.fin = 1; c.cash += k.value; c.rep = clamp(c.rep + 2, 0, 100); const b = N[k.buyer]; if (b && b.alive) { b.cash -= k.value; if (/енерг|ППО|фортиф/i.test(k.name)) b.stab = Math.min(100, b.stab + 0.5); } if (human) G.say(`✅ Проєкт «${k.name}» для ${N[k.buyer].name} завершено: +${k.value.toFixed(2)} млрд`, 'good', [c.home]); }
      });
      c.contracts = c.contracts.filter(k => !k.fin);
      // надлишок продукції: держава штабу викуповує за 70% ціни, якщо воює (інакше лежить на складі)
      if (c.sector === 'military' && (!human || c.autoSell)) Object.keys(c.inv).forEach(k => { const v = c.inv[k] - (c.contracts.filter(x => x.good === k).reduce((s, x) => s + x.left, 0)); if (v > 0 && G.enemiesOf(c.home).length) { c.inv[k] -= v; c.cash += v * GOODS[k].price * 0.7; N[c.home].ars[k] = (N[c.home].ars[k] || 0) + v; N[c.home].cash -= v * GOODS[k].price * 0.7; } });
      // кредити
      if (c.debt > 0) { const int = c.debt * 0.075 / 12; c.cash -= int; }
      if (c.cash < -1 && c.debt < G.coValue(c) * 0.6) { c.debt += 1.5; c.cash += 1.5; if (human) G.say(`🏦 «${c.name}»: автоматичний кредит $1.5 млрд через касовий розрив`, 'bad', [c.home]); }
    });
  };
  // прибуток активів зростає від R&D
  const GOODF = new Set(Object.values(GOODS).flatMap(g => g.from)); const baseProfit = G.assetProfit; G.assetProfit = function (c, a) { let p = baseProfit(c, a); if (c.sector === 'military' && GOODF.has(a.type) && !c.ai) p *= 0.35; return c.rd ? p * (1 + fx(c, 'profit')) : p; };
  // ---- прямий продаж зі складу державі (поза тендером): 85% ціни
  G.corpSellTo = function (c, nid, k) {
    const b = N[nid], g = GOODS[k]; if (!b || !b.alive || !g) return { ok: false, err: 'Недоступно' }; const q = Math.floor(c.inv[k] || 0) - c.contracts.filter(x => x.good === k).reduce((s, x) => s + x.left, 0); if (q < 1) return { ok: false, err: 'Склад порожній (або все під контракти)' };
    if (nid !== c.home && (G.rel[c.home][nid] < 20 || G.sanctioned(c.home, nid) || G.atWar(c.home, nid))) return { ok: false, err: 'Уряд вашого штабу не дає ліцензії на експорт у цю країну' };
    const pay = q * g.price * 0.85; if (b.cash < pay) return { ok: false, err: `${b.name} не має грошей на таку закупівлю` };
    c.inv[k] -= q; c.cash += pay; b.cash -= pay; b.ars[k] = (b.ars[k] || 0) + q; c.infl[nid] = Math.min(100, (c.infl[nid] || 0) + 1); G.rel[nid][c.home] = clamp(G.rel[nid][c.home] + Math.min(4, pay * 3), -100, 100);
    return { ok: true, msg: `Продано ${q.toLocaleString()} → ${b.name}: +$${pay.toFixed(3)} млрд` };
  };
  G.corpBuyers = c => N.filter(n => n.alive && (n.id === c.home || (G.rel[c.home][n.id] >= 20 && !G.sanctioned(c.home, n.id) && !G.atWar(c.home, n.id))) && (G.enemiesOf(n.id).length || n.id === c.home)).map(n => n.id);
  G.act.corpSell = (nid, k) => G.pc >= 0 ? G.corpSellTo(G.myCo(), nid, k) : { ok: false };
  // ---- фінанси
  G.corpLoan = function (c, amt) { if (amt > 0) { if (c.debt + amt > G.coValue(c) * 0.6) return { ok: false, err: 'Банк відмовляє: борг перевищить 60% вартості компанії' }; c.debt += amt; c.cash += amt; return { ok: true }; } const r = Math.min(-amt, c.debt, c.cash); if (r <= 0) return { ok: false, err: 'Немає чим гасити' }; c.debt -= r; c.cash -= r; return { ok: true }; };
  // ---- найкраще місце для активу
  G.coBestSpot = function (c, type) {
    let best = null, roi = -1, why = '';
    c.offices.forEach(o => { ter.forEach(t => { if (t.owner !== o.n || t.ctrl !== o.n) return; const e = G.coCanBuild(c, t.i, type); if (e) { why = why || e; return; } const r = G.assetProfit(c, { t: t.i, type, lvl: 1 }) / (G.buildCost(o.n, t.i, type) * 1.1); if (r > roi) { roi = r; best = t.i; } }); });
    return { i: best, roi, err: best == null ? (/покладів/.test(why) ? 'У ваших країнах немає потрібних покладів' : why || 'Немає підходящого регіону') : '' };
  };
  // ---- поглинання конкурента
  G.corpAcquire = function (c, tid) {
    const x = G.companies[tid]; if (!x || !x.alive || x.id === c.id) return { ok: false, err: 'Недоступно' }; const price = G.coValue(x) * 1.35;
    if (G.coValue(x) > G.coValue(c) * 0.6) return { ok: false, err: 'Компанія завелика для поглинання (до 60% вашої вартості)' }; if (c.cash < price) return { ok: false, err: 'Потрібно $' + price.toFixed(2) + ' млрд' };
    c.cash -= price; c.base += x.base; x.assets.forEach(a => c.assets.push(a)); x.offices.forEach(o => { if (!c.offices.some(q => q.n === o.n)) c.offices.push(Object.assign({}, o, { hq: false })); }); x.alive = false; x.assets = []; x.offices = [];
    G.say(`🤝 «${c.name}» поглинула компанію «${x.name}» за $${price.toFixed(2)} млрд`, 'info', [c.home]); return { ok: true };
  };
  // ---- події компанії (через систему рішень)
  const EV = G.DEC_EV || [];
  const coEv = (id, ok, text, o) => EV.push({ id, adv: 'econ', co: true, ok: () => false, okCo: ok, t: () => ({ text }), o });
  coEv('co_defect', c => c.sector === 'military' && c.contracts.some(k => k.kind === 'good'), 'Партія продукції має брак: частина виробів не пройшла контроль якості. Замовник ще не знає.',
    [['Відкликати й замінити за свій рахунок', () => { const c = G.myCo(); c.cash -= Math.max(0.05, G.coValue(c) * 0.01); c.rep = Math.min(100, c.rep + 5); return 'витрати 1% вартості, репутація +5'; }],
     ['Промовчати', () => { const c = G.myCo(); if (G.rnd() < 0.5) { c.rep -= 15; return 'брак викрили журналісти: репутація −15'; } return 'пронесло… цього разу'; }]]);
  coEv('co_hack', c => true, 'Хакери зламали внутрішню мережу компанії й вимагають викуп у криптовалюті.',
    [['Заплатити викуп', () => { const c = G.myCo(); c.cash -= Math.max(0.02, c.cash * 0.03); return 'гроші втрачено, дані повернули'; }], ['Відновитися з резервних копій', () => { const c = G.myCo(); c.rd.pts *= 0.8; return 'втрачено 20% очок R&D'; }]]);
  coEv('co_poach', c => c.rd.cur, 'Конкурент переманює ваших провідних інженерів удвічі більшою зарплатою.',
    [['Підвищити зарплати', () => { const c = G.myCo(); c.cash -= 0.1 + G.coValue(c) * 0.004; c.rd.pts += 150; return 'інженери лишилися й працюють з натхненням: +150 очок R&D'; }], ['Відпустити', () => { const c = G.myCo(); c.rd.pts = Math.max(0, c.rd.pts - 200); return '−200 очок R&D'; }]]);
  coEv('co_gov', c => (c.infl[c.home] || 0) > 20, 'Уряд пропонує податкові пільги в обмін на будівництво заводу в депресивному регіоні.',
    [['Погодитися', () => { const c = G.myCo(); c.infl[c.home] = Math.min(100, (c.infl[c.home] || 0) + 10); c.cash -= 0.3; return 'вплив удома +10, −$0.3 млрд'; }], ['Відмовитися', () => 'нічого не змінилося']]);
  coEv('co_takeover_offer', c => G.coValue(c) > 2, 'Транснаціональний гігант пропонує купити вашу компанію з премією 40%.',
    [['Відмовити — ми будуємо імперію', () => { const c = G.myCo(); c.rep += 4; return 'репутація +4'; }], ['Продати частку 20% і отримати гроші', () => { const c = G.myCo(); const v = G.coValue(c) * 0.28; c.cash += v; c.base *= 0.8; return `+$${v.toFixed(2)} млрд, база бізнесу −20%`; }]]);
  coEv('co_ethics', c => c.sector === 'military', 'Правозахисники вимагають заборонити експорт вашої зброї до країн із сумнівною репутацією.',
    [['Обмежити експорт', () => { const c = G.myCo(); c.rep += 6; return 'репутація +6'; }], ['Ігнорувати', () => { const c = G.myCo(); c.rep -= 4; c.cash += 0.2; return 'репутація −4, +$0.2 млрд'; }]]);
  G.corpEventsMonthly = function () {
    const c = G.myCo && G.myCo(); if (!c || !c.alive || G.player >= 0 || G.day < 45 || G.rnd() > 0.3) return; if (G.decisions.some(d => d.co)) return;
    const cand = EV.filter(e => e.co && e.okCo(c) && !(c._dec && c._dec[e.id] > G.day)); if (!cand.length) return; const e = cand[Math.floor(G.rnd() * cand.length)];
    c._dec = c._dec || {}; c._dec[e.id] = G.day + 400; G.decisions.push({ id: G.nextId++, ev: e.id, nid: c.home, co: true, ctx: e.t(), d: G.day });
  };
  G.act.corpBid = (tid, mul) => G.pc >= 0 ? G.corpBid(G.myCo(), tid, mul) : { ok: false, err: 'Лише за компанію' };
  G.act.corpRD = id => G.pc >= 0 ? G.corpSetRD(G.myCo(), id) : { ok: false };
  G.act.corpLoan = amt => G.pc >= 0 ? G.corpLoan(G.myCo(), amt) : { ok: false };
  G.act.corpAcquire = id => G.pc >= 0 ? G.corpAcquire(G.myCo(), id) : { ok: false };
});
