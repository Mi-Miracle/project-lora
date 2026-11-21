// v4.6: категорії професій і бізнесу (держслужба окремо; торгівля/їжа/туризм; ВПК/заводи/техніка; інше),
// вибір типу справи, нові типи (туризм, оборонне виробництво, заводи й техніка), виробничі лінії для всіх компаній,
// виробничий план корпорацій, власна армія компанії, конкуренти, персонал, рейтинг ★, перетворення на корпорацію,
// події міста й сезонні пропозиції, ваш заклад у місті, позики між гравцями.
LORA.sim.register('v46', 100.4, function (G) {
  const { ter, T, N } = G; const clamp = LORA.core.clamp; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });
  const sk = (L, k) => G.skill ? G.skill(L, k) : 0; const me = () => G.leader;
  const S = () => G.v29s('v46', () => ({ seq: 1, loans: [], cev: {} }));
  const human = c => c && !c.ai; const pick = a => a[Math.floor(R() * a.length)];

  // ================= КАТЕГОРІЇ =================
  G.JOB_CAT = [['gov', '🏛', 'Державна служба', ['police', 'military', 'doctor', 'teacher', 'diplomat', 'lawyer']],
    ['trade', '🛒', 'Торгівля, їжа й туризм', ['cook', 'seller', 'driver', 'pilot']],
    ['ind', '🏭', 'Виробництво, ВПК і техніка', ['builder', 'farmer', 'scientist', 'programmer']],
    ['other', '🎭', 'Інше: фінанси, медіа, спорт', ['banker', 'journalist', 'actor', 'athlete']]];
  G.jobCat = k => (G.JOB_CAT.find(c => c[3].includes(k)) || G.JOB_CAT[3])[0];
  G.isGovJob = k => G.JOB_CAT[0][3].includes(k);

  // ================= НОВІ ТИПИ СПРАВИ =================
  const U = (k, n, ic, cost, rev, days) => [k, n, ic, cost, rev, days || 20];
  Object.assign(G.BIZT, {
    tour: { n: 'Туризм і готелі', prod: ['Система бронювання й меблі', 30000], units: [U('agency', 'Турагенція', '🧳', 20000, 5000, 7), U('hostel', 'Хостел', '🛏', 50000, 9000), U('tours', 'Екскурсійне бюро', '🗺', 35000, 7500, 10), U('hotel', 'Бутік-готель', '🏨', 400000, 70000, 60)],
      dev: [['ota', 'Онлайн-бронювання', 40000, 0.12, 25], ['resort', 'Курортний комплекс', 300000, 0.25, 80, 'ota']] },
    vpk: { n: 'Оборонне виробництво', prod: ['Верстати й ліцензія на зброю', 150000], units: [U('fpvw', 'Майстерня FPV-дронів', '🛸', 120000, 3000), U('ammo', 'Цех боєприпасів', '💥', 400000, 6000, 40), U('strikew', 'Цех ударних дронів', '✈', 600000, 8000, 45), U('repair', 'Ремзавод бронетехніки', '🛡', 900000, 15000, 60)],
      dev: [['ew', 'Захист від РЕБ', 150000, 0.12, 40], ['accept', 'Військове приймання', 100000, 0.1, 30]] },
    fact: { n: 'Заводи й техніка', prod: ['Цех і верстати', 80000], units: [U('auto', 'Автосервіс і тюнінг', '🔧', 60000, 12000, 15), U('metal', 'Цех металообробки', '⚙', 150000, 26000, 30), U('elec', 'Складання електроніки', '🔌', 250000, 42000, 40), U('agri', 'Завод сільгосптехніки', '🚜', 500000, 80000, 60)],
      dev: [['cnc', 'ЧПК-верстати', 120000, 0.15, 40], ['export', 'Експортна сертифікація', 150000, 0.18, 50, 'cnc']] }
  });
  // сектор і навичка ліцензії для кожного типу
  const SEC = { rest: ['leisure', 'art'], shop: ['leisure', 'biz'], trans: ['logistics', 'drive'], air: ['logistics', 'drive'], constr: ['build', 'build'], farm: ['agro', 'agro'], sec: ['military', 'mil'], pmc: ['military', 'mil'], law: ['leisure', 'law'], clinic: ['health', 'med'],
    school: ['health', 'ped'], it: ['tech', 'tech'], media: ['leisure', 'media'], inv: ['industry', 'eco'], trade: ['logistics', 'diplo'], lab: ['semi', 'sci'], prod: ['leisure', 'art'], club: ['leisure', 'fit'], tour: ['leisure', 'biz'], vpk: ['military', 'mil'], fact: ['industry', 'tech'] };
  for (const [k, v] of Object.entries(SEC)) if (G.BIZT[k]) { G.BIZT[k].sec = v[0]; G.BIZT[k].sk = v[1]; }
  G.BIZ_CAT = [['trade', '🛒', 'Торгівля, їжа й туризм', ['rest', 'shop', 'tour', 'farm', 'trade']],
    ['ind', '🏭', 'ВПК, заводи й техніка', ['vpk', 'fact', 'pmc', 'sec', 'constr']],
    ['serv', '🚚', 'Транспорт і послуги', ['trans', 'air', 'law', 'clinic', 'school', 'inv']],
    ['idea', '💡', 'IT, наука, медіа й спорт', ['it', 'lab', 'media', 'prod', 'club']]];
  G.bizCat = ty => (G.BIZ_CAT.find(c => c[3].includes(ty)) || G.BIZ_CAT[3])[0];
  // вибір типу справи (за замовчуванням — за професією)
  { const b0 = G.bizStart; G.bizStart = function (ty) { const r = b0(); if (!r.ok) return r; const L = me(); const B = ty && G.BIZT[ty];
    if (B) { L.biz.ty = ty; L.biz.sector = B.sec; L.biz.name = `${B.n} «${(L.name.split(' ')[1] || L.name)}»`; return ok(`план: ${B.n.toLowerCase()}. Пройдіть кроки — і відкриєте справу`); } return r; }; }

  // ================= ВИРОБНИЧІ ЛІНІЇ МАЛОГО БІЗНЕСУ =================
  // [ключ, назва, іконка, заклад ('*' — будь-який), к-сть на рівень/міс., собівартість $, ціна $, одиниця, mil=1 — військовий товар на склад компанії]
  const GD = (k, n, ic, unit, q, cost, price, u, mil) => ({ k, n, ic, unit, q, cost, price, u, mil });
  const cg = k => (G.CORP_GOODS || {})[k] || { price: 0 };
  G.BGOODS = {
    rest: [GD('semi', 'Напівфабрикати для мереж', '🥟', '*', 40, 60, 115, 'кг'), GD('cater', 'Кейтеринг-сети', '🍱', 'rest', 30, 90, 170, 'сетів')],
    shop: [GD('pl', 'Товари власної марки', '🏷', '*', 120, 4, 7.5, 'шт.')],
    tour: [GD('pack', 'Турпакети', '🧳', '*', 6, 600, 1050, 'пак.'), GD('event', 'Корпоративні виїзди', '🎉', 'hotel', 2, 2500, 4300, 'подій')],
    farm: [GD('veg', 'Овочі й молоко', '🥛', '*', 900, 0.5, 0.95, 'кг'), GD('jam', 'Консерви й соуси', '🥫', 'mill', 400, 1.6, 3.2, 'банок')],
    trade: [GD('imp', 'Імпортні партії', '📦', '*', 3, 3500, 5600, 'конт.')],
    vpk: [GD('fpv', 'FPV-дрони', '🛸', 'fpvw', 0.03, 0, 0, 'тис.', 1), GD('shells', 'Артснаряди', '💥', 'ammo', 0.004, 0, 0, 'тис.', 1), GD('strike', 'Ударні дрони', '✈', 'strikew', 0.4, 0, 0, 'од.', 1), GD('armor', 'Бронетехніка (ремонт і модернізація)', '🛡', 'repair', 0.02, 0, 0, 'од.', 1)],
    fact: [GD('parts', 'Металеві деталі', '⚙', 'metal', 300, 40, 75, 'шт.'), GD('dev', 'Електроніка й контролери', '🔌', 'elec', 120, 120, 230, 'шт.'), GD('tractor', 'Сільгосптехніка', '🚜', 'agri', 0.6, 40000, 72000, 'од.')],
    pmc: [GD('kits', 'Комплекти спорядження', '🎒', '*', 15, 500, 900, 'компл.')],
    sec: [GD('cams', 'Системи відеонагляду', '📹', '*', 10, 600, 1100, 'компл.')],
    constr: [GD('blocks', 'Блоки й бетон', '🧱', '*', 80, 45, 85, 'м³')],
    trans: [GD('parcel', 'Контракти доставки', '📦', '*', 300, 6, 11, 'посилок')],
    air: [GD('cargo', 'Авіавантажі', '📦', '*', 4, 1500, 2600, 'т')],
    law: [GD('pack', 'Пакети юрпослуг для бізнесу', '📑', '*', 6, 300, 650, 'пак.')],
    clinic: [GD('check', 'Корпоративні медогляди', '🩺', '*', 30, 60, 120, 'оглядів')],
    school: [GD('course', 'Онлайн-курси', '🎓', '*', 60, 15, 40, 'доступів')],
    it: [GD('lic', 'Ліцензії ПЗ', '💿', '*', 50, 30, 95, 'ліц.')],
    media: [GD('ads', 'Рекламні інтеграції', '📣', '*', 8, 250, 600, 'інтегр.')],
    inv: [GD('rep', 'Аналітичні звіти', '📊', '*', 10, 150, 420, 'звітів')],
    lab: [GD('pat', 'Патенти й ліцензії', '📄', '*', 0.5, 8000, 21000, 'патентів')],
    prod: [GD('clip', 'Кліпи й реклама на замовлення', '🎬', '*', 3, 1500, 3400, 'роліків')],
    club: [GD('merch', 'Мерч і спортхарчування', '🧢', '*', 150, 8, 17, 'шт.')]
  };
  G.bgoods = c => (c && G.BGOODS[c.bizType]) || [];
  G.bgoodPrice = g => g.mil ? cg(g.k).price * 1e9 : g.price; G.bgoodCost = g => g.mil ? cg(g.k).price * 1e9 * 0.6 : g.cost;
  G.bgoodRate = (c, g) => (c.bunits || []).filter(u => u.open <= G.day && (g.unit === '*' || u.k === g.unit)).reduce((s, u) => s + u.lvl, 0) * g.q * ((c.bplan || {})[g.k] ?? 1);
  G.bplanSet = function (k, v) { const c = G.myCo(); if (!c || !c.bizType) return no('Лише для малого бізнесу'); if (![0, 0.5, 1, 1.5].includes(+v)) return no('?'); (c.bplan = c.bplan || {})[k] = +v; return ok(`план «${(G.bgoods(c).find(g => g.k === k) || {}).n}»: ${Math.round(v * 100)}%`); };
  G.bkeepSet = function (k, on) { const c = G.myCo(); if (!c) return no('?'); (c.bkeep = c.bkeep || {})[k] = on ? 1 : 0; return ok(on ? 'товар іде на склад' : 'товар продається автоматично'); };
  G.bsell = function (k) { const c = G.myCo(); const g = G.bgoods(c).find(x => x.k === k); if (!g || g.mil) return no('?'); const q = (c.binv || {})[k] || 0; if (q <= 0) return no('Склад порожній'); const v = $(q * g.price * 0.85); c.binv[k] = 0; c.cash += v; return ok(`продано ${q.toFixed(1)} ${g.u} за ${f$(v)}`); };
  G.bsellMil = function (k, nid) { const c = G.myCo(); const g = G.bgoods(c).find(x => x.k === k && x.mil); if (!g) return no('?'); nid = nid == null ? c.home : +nid; const b = N[nid]; const q = (c.inv || {})[k] || 0; if (q <= 1e-9) return no('Склад порожній');
    if (nid !== c.home && (G.rel[c.home][nid] < 20 || G.sanctioned(c.home, nid) || G.atWar(c.home, nid))) return no('Немає експортної ліцензії в цю країну'); const v = q * cg(k).price * (G.enemiesOf(nid).length ? 0.95 : 0.8); if (b.cash < v) return no(`${b.name} не має грошей`);
    c.inv[k] = 0; c.cash += v; b.cash -= v; b.ars[k] = (b.ars[k] || 0) + q; G.rel[nid][c.home] = clamp(G.rel[nid][c.home] + 1, -100, 100); return ok(`${g.n}: ${q.toFixed(3)} ${g.u} → ${b.name}, +${f$(v)}`); };
  function bprod(c) { const gs = G.bgoods(c); if (!gs.length) return; c.binv = c.binv || {}; c.inv = c.inv || {}; let net = 0;
    for (const g of gs) { const q = G.bgoodRate(c, g); if (q <= 0) continue; const over = ((c.bplan || {})[g.k] ?? 1) > 1 ? 1.25 : 1; const cost = $(q * G.bgoodCost(g) * over); c.cash -= cost; net -= cost;
      if (g.mil) { c.inv[g.k] = (c.inv[g.k] || 0) + q; continue; }
      if ((c.bkeep || {})[g.k]) { c.binv[g.k] = (c.binv[g.k] || 0) + q; continue; }
      const dem = (0.8 + R() * 0.25) * (0.85 + (c.brate || 3) * 0.05) * evMul(c, null); const v = $(q * g.price * dem); c.cash += v; net += v; }
    c.bprodNet = net; }

  // ================= ВИРОБНИЧИЙ ПЛАН КОРПОРАЦІЙ =================
  G.PMODE = { eco: ['🌿 Економний', 0.8, 0.75, 0.92], std: ['⚖ Стандарт', 1, 1, 1], max: ['🔥 Максимум', 1.2, 1.3, 1.15] }; // [назва, випуск, сировина, собівартість]
  G.pmodeSet = function (m) { const c = G.myCo(); if (!c || !G.PMODE[m]) return no('?'); c.pmode = m; return ok(`виробничий план: ${G.PMODE[m][0]}`); };
  const pm = c => G.PMODE[(c && !c.ai && c.pmode) || 'std'];
  { const b = G.corpResFlow; G.corpResFlow = function (c) { const f = b(c); const m = pm(c); if (m[1] === 1) return f; for (const r in f.out) f.out[r] *= m[1]; for (const r in f.inn) f.inn[r] *= m[2]; return f; }; }
  if (G.corpRate) { const b = G.corpRate; G.corpRate = (c, k) => b(c, k) * pm(c)[1]; }
  if (G.corpUnitCost) { const b = G.corpUnitCost; G.corpUnitCost = (c, k) => b(c, k) * pm(c)[3]; }

  // ================= ВЛАСНА АРМІЯ КОМПАНІЇ =================
  // на 1 тис. бійців: спорядження (броня, снаряди, дрони) береться зі складу компанії; нестача — нижча організованість загону
  G.ARMY_KIT = { armor: 6, shells: 0.5, fpv: 0.3 };
  const RAISE = 0.003, UPK = 0.00035;
  G.coArmies = c => G.armies.filter(a => a.coArmy === c.id && !a.dead);
  G.coArmyQuote = function (c, k) { let need = 0, have = 0; for (const [g, per] of Object.entries(G.ARMY_KIT)) { const n = per * k; need += n * cg(g).price; have += Math.min(n, (c.inv || {})[g] || 0) * cg(g).price; } return { raise: k * RAISE, eq: need ? have / need : 1, total: k * RAISE }; };
  G.coArmyErr = function (c, k) { if (!c) return 'Немає компанії'; if (!['military'].includes(c.sector) && !['vpk', 'pmc', 'sec'].includes(c.bizType)) return 'Власне військо — лише для ВПК, ПВК чи охоронного бізнесу';
    if (!(k >= 1)) return 'Мінімальний загін — 1 тис. бійців'; const cap = c.bizType ? 2 + (c.bunits || []).length : 10 + (c.assets || []).length * 2; const have = G.coArmies(c).reduce((s, a) => s + a.k, 0); if (have + k > cap) return `Ліміт війська компанії: ${cap} тис. (зараз ${have.toFixed(1)})`;
    const q = G.coArmyQuote(c, k); if (c.cash < q.total) return `Набір і навчання: ${f$(q.total)}`; return ''; };
  G.coArmyRaise = function (k) { const c = G.myCo(); k = +k; const e = G.coArmyErr(c, k); if (e) return no(e); const q = G.coArmyQuote(c, k); c.cash -= q.total; c.inv = c.inv || {};
    for (const [g, per] of Object.entries(G.ARMY_KIT)) c.inv[g] = Math.max(0, ((c.inv || {})[g] || 0) - per * k);
    c.inv = c.inv || {}; const t = (c.bunits && c.bunits[0] && c.bunits[0].t) ?? (c.offices[0] || {}).t; const n = G.coArmies(c).length + 1;
    const a = G.newArmy(c.home, t, k, LORA.lang === 'en' ? `${c.en || c.name} Guard ${n}` : `Загін «${c.name}» №${n}`); a.pmc = c.id; a.coArmy = c.id; a.auto = false; a.org = 0.45 + 0.5 * q.eq; a.xp = 0.1 + (c.bizType === 'pmc' ? 0.15 : 0);
    G.say(`🪖 «${c.name}» сформувала загін: ${k} тис. бійців, оснащення ${Math.round(q.eq * 100)}% зі складу`, 'good', [c.home]); return ok(`загін сформовано (${T[t].n}). Командуйте ним на мапі: оберіть і ПКМ по регіону`); };
  G.coArmyDisband = function (id) { const c = G.myCo(); const i = G.armies.findIndex(a => a.id === id && a.coArmy === (c && c.id)); if (i < 0) return no('Немає такого загону'); const a = G.armies[i]; c.cash += a.k * RAISE * 0.3; G.armies.splice(i, 1); return ok('загін розпущено, повернуто 30% вартості набору'); };
  G.coArmyCtr = function (on) { const c = G.myCo(); if (!c) return no('?'); c.armyCtr = on ? 1 : 0; G.coArmies(c).forEach(a => { a.auto = !!on; }); return ok(on ? 'загони передано під командування армії держави; поки йде війна, держава платить 140% утримання' : 'загони знову під вашим командуванням'); };
  function armyMonthly(c) { const as = G.coArmies(c); if (!as.length) return; const k = as.reduce((s, a) => s + a.k, 0); const upk = k * UPK; c.cash -= upk; c.armyUpk = upk;
    const n = N[c.home]; if (c.armyCtr && n && G.enemiesOf(c.home).length && n.cash > upk * 1.4) { n.cash -= upk * 1.4; c.cash += upk * 1.4; c.armyPay = upk * 1.4; } else c.armyPay = 0;
    if (c.cash < 0) as.forEach(a => { a.k = Math.max(1, a.k * 0.9); a.org = Math.max(0.3, a.org - 0.1); }); }

  // ================= КОНКУРЕНТИ (ідея 1) =================
  const RN = ['Перлина', 'Сонях', 'Добрий Сусід', 'Каштан', 'Бриз', 'Орбіта', 'Зоря', 'Пульс', 'Магістраль', 'Ясен', 'Вежа', 'Лелека', 'Борей', 'Явір', 'Причал', 'Едельвейс'];
  function rivalsInit(c) { if (c.rivals) return; c.rivals = []; const ts = [...new Set((c.bunits || []).map(u => u.t))]; ts.forEach(t => { const n = 1 + Math.floor(R() * 2); for (let i = 0; i < n; i++) c.rivals.push({ id: S().seq++, n: pick(RN), t, str: 1 + Math.floor(R() * 3) }); }); }
  G.rivalShare = (c, t) => { const r = (c.rivals || []).filter(x => x.t === t).reduce((s, x) => s + x.str, 0); const mine = (c.bunits || []).filter(u => u.t === t).reduce((s, u) => s + u.lvl, 0) * (0.6 + (c.brate || 3) * 0.13); return r ? clamp(r / (r + mine + 2) * 0.3, 0, 0.25) : 0; };
  G.rivalPoach = function (id) { const c = G.myCo(); const x = c && (c.rivals || []).find(r => r.id === id); if (!x) return no('Немає такого конкурента'); const cost = $(8000 * x.str); if (c.cash < cost) return no(`Переманити кращих людей: ${f$(cost)}`); c.cash -= cost;
    if (R() < 0.75) { x.str = Math.max(0, x.str - 1); const s = c.bstaff && c.bstaff.spec; if (s) s.sk = Math.min(5, s.sk + 0.5); if (!x.str) c.rivals = c.rivals.filter(r => r !== x); return ok(`«${x.n}» втратила кращих працівників${x.str ? '' : ' і закрилася'}`); }
    c.brate = Math.max(1, (c.brate || 3) - 0.3); return ok(`скандал: «${x.n}» розповіла пресі про переманювання — рейтинг −0.3`); };
  G.rivalBuyCost = x => $(60000 * x.str * x.str);
  G.rivalBuy = function (id) { const c = G.myCo(); const x = c && (c.rivals || []).find(r => r.id === id); if (!x) return no('Немає такого конкурента'); const cost = G.rivalBuyCost(x); if (c.cash < cost) return no(`Купівля «${x.n}»: ${f$(cost)}`); c.cash -= cost;
    const B = G.BIZT[c.bizType]; const free = B.units.find(u => !c.bunits.some(b => b.t === x.t && b.k === u[0])); c.rivals = c.rivals.filter(r => r !== x);
    if (free) c.bunits.push({ k: free[0], t: x.t, lvl: Math.min(G.bunitMax ? G.bunitMax(c) : 5, x.str), d0: G.day, open: G.day + 5 }); else { const u = c.bunits.find(b => b.t === x.t); if (u) u.lvl = Math.min(G.bunitMax ? G.bunitMax(c) : 5, u.lvl + 1); }
    return ok(`«${x.n}» куплено й ребрендовано${free ? ': новий заклад «' + free[1] + '»' : ': розширено ваш заклад'}`); };
  function rivalsMonthly(c) { rivalsInit(c); const ts = new Set((c.bunits || []).map(u => u.t)); ts.forEach(t => { if (!c.rivals.some(r => r.t === t) && R() < 0.3) c.rivals.push({ id: S().seq++, n: pick(RN), t, str: 1 }); });
    c.rivals.forEach(r => { if (R() < 0.2) r.str = Math.min(6, r.str + 1); }); }

  // ================= ПЕРСОНАЛ (ідея 2) =================
  const FN = ['Олена', 'Андрій', 'Ірина', 'Тарас', 'Марта', 'Богдан', 'Оксана', 'Дмитро', 'Соломія', 'Максим', 'Віра', 'Остап', 'Леся', 'Назар', 'Злата', 'Роман'];
  const LN = ['Коваленко', 'Гайдай', 'Мельничук', 'Савчин', 'Гнатюк', 'Ткачук', 'Рибак', 'Дорошенко', 'Кравчук', 'Левицька', 'Бондар', 'Острук', 'Литвин', 'Яремчук'];
  G.STAFF_R = { spec: ['🧑‍🍳', 'Головний фахівець', '+3% доходу за рівень майстерності'], admin: ['🧑‍💼', 'Адміністратор', 'рейтинг ★ і менше поломок'], acc: ['🧮', 'Бухгалтер', 'менше штрафів і крадіжок; нечесний — сам краде'] };
  G.staffCands = function (role) { const c = G.myCo(); if (!c || !c.bizType || !G.STAFF_R[role]) return no('?'); c.bcand = c.bcand || {};
    c.bcand[role] = [0, 1, 2].map(() => { const s = 1 + Math.floor(R() * 5); return { n: `${pick(FN)} ${pick(LN)}`, sk: s, sal: Math.round((900 + s * 700) * (0.8 + R() * 0.5)), hon: +(0.35 + R() * 0.65).toFixed(2) }; }); return ok('кандидати знайшлися'); };
  G.staffHire = function (role, i) { const c = G.myCo(); const x = c && c.bcand && c.bcand[role] && c.bcand[role][i]; if (!x) return no('Немає кандидата'); (c.bstaff = c.bstaff || {})[role] = Object.assign({ d0: G.day }, x); c.bcand[role] = null; return ok(`${x.n} — ${G.STAFF_R[role][1].toLowerCase()}, $${x.sal}/міс.`); };
  G.staffFire = function (role) { const c = G.myCo(); if (!c || !c.bstaff || !c.bstaff[role]) return no('Посада вільна'); const x = c.bstaff[role]; delete c.bstaff[role]; c.cash -= $(x.sal); return ok(`${x.n} звільнено (вихідна допомога ${f$($(x.sal))})`); };
  function staffMonthly(c) { const st = c.bstaff || {}; let sal = 0; for (const r in st) sal += st[r].sal; c.cash -= $(sal); c.bstaffSal = sal;
    const a = st.acc; if (a && a.hon < 0.5 && c.bLast > 0) { const v = c.bLast * 0.04 * (1 - a.hon); c.cash -= v; a.stole = (a.stole || 0) + v; if (R() < 0.2 + (st.admin ? st.admin.sk * 0.05 : 0)) { G.say(`🕵 «${c.name}»: бухгалтер ${a.n} крав із каси (${f$(a.stole)}) — звільнено`, 'bad', [c.home]); delete st.acc; } } }

  // ================= РЕЙТИНГ ★ (ідея 3) =================
  G.brateTarget = c => clamp(2.4 + Object.values(c.bdev || {}).filter(v => v === 'done').length * 0.15 + (G.bfx ? G.bfx(c, 'rev') * 2 : 0) + ((c.bstaff || {}).admin ? c.bstaff.admin.sk * 0.12 : 0) + ((c.bstaff || {}).spec ? c.bstaff.spec.sk * 0.08 : 0)
    - (c.badRev && c.badRev > G.day ? 0.6 : 0) - (c.incLog || []).filter(x => G.day - x.d < 60).length * 0.15 + (c.ownerVis && G.day - c.ownerVis < 45 ? 0.3 : 0), 1, 5);
  function rateMonthly(c) { c.brate = c.brate || 3; c.brate += (G.brateTarget(c) - c.brate) * 0.35; c.brate = clamp(c.brate, 1, 5); }
  // ефекти на дохід закладу: конкуренти, рейтинг, фахівець, події міста, сезонна пропозиція
  { const b = G.unitRev; G.unitRev = function (c, u) { let v = b(c, u); if (!v) return v; const sp = (c.bstaff || {}).spec;
    return v * (1 - G.rivalShare(c, u.t)) * (0.8 + (c.brate || 3) * 0.07) * (1 + (sp ? sp.sk * 0.03 : 0)) * evMul(c, u.t) * (c.smenu && c.smenu === G.seasonAt(u.t) ? 1.06 : 1); }; }
  if (G.ordChance) { const b = G.ordChance; G.ordChance = (c, o) => clamp(b(c, o) + (c.bizType ? ((c.brate || 3) - 3) * 0.05 : 0), 0.05, 0.95); }

  // ================= ПОДІЇ МІСТА Й СЕЗОННЕ МЕНЮ (ідея 5) =================
  G.CITY_EV = [['fest', '🎪', 'Міський фестиваль', ['trade', 'idea'], 0.2, 20], ['holi', '🎄', 'Святковий сезон', ['trade'], 0.25, 25], ['tour', '🧳', 'Туристичний сезон', ['trade', 'serv'], 0.18, 45],
    ['expo', '🏭', 'Промислова виставка', ['ind'], 0.15, 15], ['sport', '🏟', 'Великий матч', ['idea'], 0.2, 7], ['storm', '🌧', 'Негода: люди сидять удома', ['trade', 'serv'], -0.12, 10], ['conf', '💼', 'Бізнес-форум', ['serv', 'idea'], 0.12, 10]];
  G.cityEvOf = nid => { const e = S().cev[nid]; return e && e.until > G.day ? e : null; };
  function evMul(c, t) { const nid = t != null && ter[t] ? ter[t].ctrl : c.home; const e = G.cityEvOf(nid); if (!e) return 1; const D = G.CITY_EV.find(x => x[0] === e.k); return D && D[3].includes(G.bizCat(c.bizType)) ? 1 + D[4] : 1; }
  G.evMul = evMul;
  G.smenuSet = function () { const c = G.myCo(); if (!c || !c.bizType) return no('Лише для малого бізнесу'); const s = G.seasonAt((c.bunits[0] || {}).t ?? c.offices[0].t); if (c.smenu === s) return no('Сезонна пропозиція вже діє'); if (c.cash < $(5000)) return no('Коштує $5 тис.');
    c.cash -= $(5000); c.smenu = s; return ok(`сезонна пропозиція «${G.SEAS[s] || s}»: +6% доходу, поки триває сезон`); };
  function cityEvMonthly() { const hs = new Set(G.companies.filter(c => c.alive && human(c) && c.bizType).map(c => c.home)); hs.forEach(nid => { if (G.cityEvOf(nid) || R() > 0.45) return; const D = pick(G.CITY_EV);
    S().cev[nid] = { k: D[0], until: G.day + D[5] }; G.say(`${D[1]} ${N[nid].name}: ${D[2]} — ${D[4] > 0 ? 'попит на ' + D[3].map(k => G.BIZ_CAT.find(x => x[0] === k)[2].toLowerCase()).join(', ') + ' +' + Math.round(D[4] * 100) + '%' : 'попит ' + Math.round(D[4] * 100) + '%'} (${D[5]} дн.)`, D[4] > 0 ? 'good' : 'bad', [nid]);
    if (D[4] > 0) G.companies.forEach(c => { if (c.alive && human(c) && c.bizType && c.home === nid && D[3].includes(G.bizCat(c.bizType)) && c.ords) c.ords.push({ id: 1e6 + S().seq++, k: 'fest', pay: G.bizMonthly(c) * 0.8 * (1 + D[4]), days: Math.min(10, D[5]), exp: G.day + D[5], rivals: 0, need: 1, ev: D[2] }); }); }); }

  // ================= ПЕРЕТВОРЕННЯ НА КОРПОРАЦІЮ (ідея 4) =================
  G.CORP_NEED = { units: 8, monthly: $(250000), cash: $(1000000) };
  G.toCorpErr = c => { if (!c || !c.bizType) return 'Лише для малого бізнесу'; if (c.corp) return 'Ви вже корпорація'; const n = (c.bunits || []).length;
    if (n < G.CORP_NEED.units && G.bizMonthly(c) < G.CORP_NEED.monthly) return `Потрібно ${G.CORP_NEED.units}+ закладів або дохід ${f$(G.CORP_NEED.monthly)}/міс. (зараз ${n} і ${f$(G.bizMonthly(c))})`; if (c.cash < G.CORP_NEED.cash) return `Реєстрація корпорації й аудит: ${f$(G.CORP_NEED.cash)}`; return ''; };
  G.toCorp = function () { const c = G.myCo(); const e = G.toCorpErr(c); if (e) return no(e); c.cash -= G.CORP_NEED.cash; c.corp = 1; c.sector = G.BIZT[c.bizType].sec || c.sector; c.rep = Math.max(c.rep || 50, 55);
    G.say(`🏢 «${c.name}» стала корпорацією сектору «${(G.D.companySectors[c.sector] || {}).n}»: заводи, тендери, R&D, біржа`, 'good', [c.home]); return ok('вітаємо: тепер вам доступні будівництво профільних активів, тендери, R&D і виробництво сектору; заклади працюють і далі'); };

  // ================= ВАШ ЗАКЛАД У МІСТІ (ідея 6) =================
  const cityP = G.LOCS && G.LOCS.city && G.LOCS.city.places;
  const myCoL = L => { const c = G.pc >= 0 ? G.myCo() : null; return c && c.bizType ? c : null; };
  const unitHere = L => { const c = myCoL(L); return c && (c.bunits || []).find(u => u.t === L.at) ? c : null; };
  if (cityP) cityP.mybiz = { n: 'Ваш заклад', ic: '🏪', open: [7, 23], acts: {
    mb_info: { n: 'ℹ Як отримати тут заклад', h: 0, c: 0, hide: L => !!unitHere(L), need: L => myCoL(L) ? 'Відкрийте заклад у цьому місті: «Бізнес» → вкладка закладів' : 'Спершу відкрийте свою справу: «Робота» → «Своя справа»', r: L => ['', {}] },
    mb_check: { n: '🔍 Перевірити роботу закладу', h: 2, c: 0, mg: 'click', hide: L => !unitHere(L), need: L => unitHere(L) ? '' : 'У цьому місті немає вашого закладу',
      r: L => { const c = unitHere(L); const s = L._mg != null ? clamp(L._mg, 0, 1) : 0.6; L._mg = null; c.ownerVis = G.day; c.brate = clamp((c.brate || 3) + 0.1 + s * 0.2, 1, 5); if (c.badRev > G.day && s > 0.6) c.badRev = G.day; return [`Перевірка «${c.name}»: оцінка ${Math.round(s * 100)}%, рейтинг ★${c.brate.toFixed(1)}`, { mood: 3 }]; } },
    mb_taste: { n: '🍷 Провести дегустацію / презентацію', h: 3, c: $(1500), mg: 'quiz', quiz: 'cook', hide: L => !unitHere(L), need: L => unitHere(L) ? '' : 'У цьому місті немає вашого закладу',
      r: L => { const c = unitHere(L); const s = L._mg != null ? clamp(L._mg, 0, 1) : 0.6; L._mg = null; c.ownerVis = G.day; c.brate = clamp((c.brate || 3) + s * 0.3, 1, 5); L.fame = (L.fame || 0) + 0.1;
        if (s > 0.7 && G.ordRefresh) { c.ords = c.ords || []; c.ords.push({ id: 1e6 + S().seq++, k: 'corp', pay: G.bizMonthly(c) * 0.5, days: 7, exp: G.day + 20, rivals: 0, need: 1 }); return [`Гостям сподобалось! Рейтинг ★${c.brate.toFixed(1)} і нове замовлення в «Можливостях»`, { mood: 8 }, 'jackpot']; }
        return [`Презентація пройшла (оцінка ${Math.round(s * 100)}%), рейтинг ★${c.brate.toFixed(1)}`, { mood: 4 }]; } },
    mb_team: { n: '🤝 Поговорити з командою', h: 1, c: 0, hide: L => !unitHere(L), need: L => unitHere(L) ? '' : 'У цьому місті немає вашого закладу',
      r: L => { const c = unitHere(L); c.ownerVis = G.day; const st = c.bstaff || {}; let txt = 'Команда вдячна за увагу'; if (st.acc && st.acc.hon < 0.5 && R() < 0.4) { txt = `Касирка шепнула: бухгалтер ${st.acc.n} «підкручує» звіти. Звільнено`; delete st.acc; }
        else if (st.spec) st.spec.sk = Math.min(5, st.spec.sk + 0.2); return [txt, { mood: 2 }]; } },
    mb_shift: { n: '🧑‍🍳 Самому відпрацювати зміну', h: 6, c: 0, mg: 'timing', hide: L => !unitHere(L), need: L => unitHere(L) ? '' : 'У цьому місті немає вашого закладу',
      r: L => { const c = unitHere(L); const s = L._mg != null ? clamp(L._mg, 0, 1) : 0.6; L._mg = null; const v = G.bizMonthly(c) / 30 * (0.5 + s); c.cash += v; c.ownerVis = G.day; return [`Зміна у власному закладі: каса +${f$(v)}`, { mood: -2, hp: -2 }]; } }
  } };

  // ================= ПОЗИКИ МІЖ ГРАВЦЯМИ (ідея 7) =================
  G.DEAL_K.loan = ['💰', 'Позика'];
  { const b = G.dealNew; G.dealNew = function (kind, to, terms, price, note) { if (kind === 'loan') { terms = terms || {};
    if (!(terms.amt >= 100)) return no('Сума позики від $100'); if (!(terms.months >= 1 && terms.months <= 36)) return no('Строк 1–36 міс.'); if (!(+price >= 0 && +price <= 20)) return no('Ставка 0–20% на місяць'); terms.lender = terms.lender === 'to' ? 'to' : 'from'; }
    return b.apply(this, arguments); }; }
  { const b = G.dealAccept; G.dealAccept = function (id) { const d = G.v43().deals.find(x => x.id === id && x.st === 'open'); if (!d || d.kind !== 'loan') return b.apply(this, arguments);
    const lk = G.curLk(); if (d.turn !== lk) return no('Зараз не ваш хід'); const lender = d.terms.lender === 'to' ? d.to : d.from, borrower = lender === d.from ? d.to : d.from; const A = G.leaders[lender], B = G.leaders[borrower]; const v = $(d.terms.amt);
    if (!A || !B) return no('Сторона угоди недоступна'); if (A.money < v) return no('У кредитора бракує грошей'); A.money -= v; B.money += v;
    const tot = v * (1 + d.price / 100 * d.terms.months); S().loans.push({ id: S().seq++, lender, borrower, left: tot, pay: tot / d.terms.months, months: d.terms.months, rate: d.price, d0: G.day, late: 0 });
    d.st = 'done'; d.hist.push([lk, d.price, 'згода']); G.say(`💰 ${A.name} позичив ${B.name} ${f$(v)} на ${d.terms.months} міс. під ${d.price}%/міс.`, 'good', []); return ok('позику видано'); }; }
  function loansMonthly() { S().loans = S().loans.filter(l => { if (l.left <= 1e-12) return false; const A = G.leaders[l.lender], B = G.leaders[l.borrower]; if (!A || !B) return false; const p = Math.min(l.pay, l.left);
    let from = B.money >= p ? null : G.coOfLk(l.borrower); if (B.money >= p) { B.money -= p; A.money += p; l.left -= p; l.late = 0; } else if (from && from.cash >= p) { from.cash -= p; A.money += p; l.left -= p; l.late = 0; }
    else { l.late++; B.fame = Math.max(0, (B.fame || 0) - 0.3); G.say(`⚠ ${B.name} прострочив платіж за позикою ${A.name} (${l.late} міс.)`, 'bad', []); if (l.late >= 3 && from) { const v = Math.min(from.cash > 0 ? from.cash : 0, l.left); from.cash -= v; A.money += v; l.left -= v; G.say(`⚖ Суд стягнув ${f$(v)} з компанії «${from.name}» на користь ${A.name}`, 'bad', []); } }
    return l.left > 1e-12; }); }
  G.loansOf = lk => S().loans.filter(l => l.lender === lk || l.borrower === lk);
  G.loanRepay = function (id) { const lk = G.curLk(); const l = S().loans.find(x => x.id === id && x.borrower === lk); if (!l) return no('Немає такої позики'); const B = G.leaders[lk], A = G.leaders[l.lender]; if (B.money < l.left) return no(`Потрібно ${f$(l.left)}`); B.money -= l.left; A.money += l.left; l.left = 0; return ok('позику погашено достроково'); };

  // ================= ЩОМІСЯЧНИЙ ЦИКЛ =================
  G.h29.m.push(() => { cityEvMonthly(); loansMonthly(); G.companies.forEach(c => { if (!c.alive) return; armyMonthly(c); if (!c.bizType) return; bprod(c); if (human(c)) { rivalsMonthly(c); staffMonthly(c); rateMonthly(c); } }); });

  Object.assign(G.act, { bizStart: ty => G.bizStart(ty), bplanSet: (k, v) => G.bplanSet(k, v), bkeepSet: (k, on) => G.bkeepSet(k, on), bsell: k => G.bsell(k), bsellMil: (k, n) => G.bsellMil(k, n), pmodeSet: m => G.pmodeSet(m),
    coArmyRaise: k => G.coArmyRaise(k), coArmyDisband: id => G.coArmyDisband(id), coArmyCtr: on => G.coArmyCtr(on), rivalPoach: id => G.rivalPoach(id), rivalBuy: id => G.rivalBuy(id),
    staffCands: r => G.staffCands(r), staffHire: (r, i) => G.staffHire(r, i), staffFire: r => G.staffFire(r), smenuSet: () => G.smenuSet(), toCorp: () => G.toCorp(), loanRepay: id => G.loanRepay(id) });
});
