// ВІЙСЬКА ЗА ТИПАМИ.
// Сухопутні армії складаються з окремих типів підрозділів (частки, сума = 1): мотопіхота, спецпризначенці/ДШВ,
// танки, БМП/БТР, ствольна артилерія, РСЗВ, мобільна ППО. Шаблони задають склад; переформування — 30 днів.
// Авіація держав — окремі типи: винищувачі (перевага в повітрі), штурмовики (підтримка наступу + КАБ),
// бомбардувальники (бомбардування тилу), гелікоптери (підтримка й мобільність). Літаки купують/виробляють, вони гинуть.
// Також: сезони (бездоріжжя навесні й восени гальмує техніку, зима), бойовий досвід армій (★), партизани на окупованих землях.
LORA.sim.register('units', 61, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const TY = G.D.armyTypes = {
    inf:  { n: 'Мотопіхота', ic: '🎖', col: '#8fb36a', d: 'Основа оборони: найкраща в містах, лісах і горах' },
    spec: { n: 'Спецпризначенці / ДШВ', ic: '🎯', col: '#c08ad8', d: 'Штурм міст і лісів, прориви; найкращі бійці, але дорогі' },
    mbt:  { n: 'Танки', ic: '🛡', col: '#c9a24a', d: 'Головна ударна сила в степу й на рівнинах; слабкі в містах і горах; гальмують у бездоріжжя; потребують бронетехніки з арсеналу' },
    ifv:  { n: 'БМП / БТР', ic: '🚙', col: '#a8b07a', d: 'Мобільна піхота: добре і в наступі, і в обороні; теж залежить від бронетехніки' },
    tube: { n: 'Ствольна артилерія', ic: '💥', col: '#d8664a', d: 'Сила оборони й артпідготовки; витрачає снаряди' },
    mlrs: { n: 'РСЗВ', ic: '🎆', col: '#ff8a3b', d: 'Потужний вогневий удар перед штурмом; витрачає багато снарядів' },
    ad:   { n: 'Мобільна ППО', ic: '📡', col: '#5aa7d8', d: 'Прикриває армію від штурмовиків і гелікоптерів ворога' },
    uav:  { n: 'Підрозділи ударних дронів', ic: '🛸', col: '#e05ab0', d: 'FPV і ударні дрони: сильні і в обороні, і в наступі; сила залежить від запасу FPV-дронів в арсеналі' },
    eng:  { n: 'Інженерні війська', ic: '🛠', col: '#9a8f6a', d: 'Розмінування, переправи, прорив укріплень: посилюють штурм і будують оборону' }
  };
  const TK = Object.keys(TY);
  const mk = o => { const c = {}; TK.forEach(k => c[k] = o[k] || 0); return c; };
  const TP = G.D.armyTemplates = {
    std:     { n: 'Загальновійськова', ic: '⚔', c: mk({ inf: 0.5, mbt: 0.1, ifv: 0.12, tube: 0.13, mlrs: 0.05, ad: 0.1 }) },
    inf:     { n: 'Піхотна (оборона)', ic: '🎖', c: mk({ inf: 0.75, mbt: 0.03, ifv: 0.05, tube: 0.1, mlrs: 0.02, ad: 0.05 }) },
    tank:    { n: 'Танкова (прорив)', ic: '🛡', c: mk({ inf: 0.25, mbt: 0.35, ifv: 0.2, tube: 0.1, mlrs: 0.04, ad: 0.06 }) },
    assault: { n: 'Штурмова (ДШВ)', ic: '🎯', c: mk({ inf: 0.3, spec: 0.3, ifv: 0.2, tube: 0.1, mlrs: 0.03, ad: 0.07 }) },
    art:     { n: 'Артилерійська', ic: '💥', c: mk({ inf: 0.4, ifv: 0.05, tube: 0.3, mlrs: 0.15, ad: 0.1 }) },
    shield:  { n: 'Прикриття ППО', ic: '📡', c: mk({ inf: 0.5, mbt: 0.05, ifv: 0.1, tube: 0.08, mlrs: 0.02, ad: 0.25 }) },
    drone:   { n: 'Дронова (сучасна)', ic: '🛸', c: mk({ inf: 0.45, ifv: 0.1, tube: 0.1, ad: 0.1, uav: 0.2, eng: 0.05 }) },
    breach:  { n: 'Інженерно-штурмова', ic: '🛠', c: mk({ inf: 0.35, spec: 0.1, ifv: 0.15, tube: 0.1, ad: 0.08, eng: 0.17, uav: 0.05 }) },
    marine:  { n: 'Морська піхота', ic: '⚓', c: mk({ inf: 0.4, spec: 0.18, ifv: 0.2, tube: 0.1, ad: 0.07, eng: 0.05 }) },
    mountain:{ n: 'Гірсько-піхотна', ic: '⛰', c: mk({ inf: 0.6, spec: 0.15, tube: 0.12, ad: 0.08, uav: 0.05 }) }
  };
  TP.mech = TP.tank; // сумісність зі збереженнями 1.1
  const TA = { plains: 1.15, steppe: 1.25, forest: 0.85, hills: 0.85, mountain: 0.6, desert: 1.1, arctic: 0.7 };
  const TI = { plains: 1.0, steppe: 0.95, forest: 1.15, hills: 1.1, mountain: 1.25, desert: 0.9, arctic: 1.05 };
  // ---- технології моделей техніки (data/tech.js: e.um / e.air / e.ul)
  G.has = (n, id) => !!(n && n.res && n.res.done[id] != null);
  function techMods(n) {
    const k = n.res ? Object.keys(n.res.done).length : 0; if (n._tmK === k && n._tm) return n._tm;
    const um = {}, air = {}; if (n.res) for (const id in n.res.done) { const e = (G.D.techs[id] || {}).e || {}; if (e.um) for (const q in e.um) um[q] = (um[q] || 0) + e.um[q]; if (e.air) for (const q in e.air) air[q] = (air[q] || 0) + e.air[q]; }
    n._tmK = k; return (n._tm = { um, air });
  }
  G.techMods = techMods;
  // ---- моделі техніки (data/military/models.js) і переозброєння
  const MD = G.D.models, SC = G.D.shipClasses;
  G.bestModel = (n, type) => { let b = 0; MD[type].forEach((m, i) => { if (!m.rt || G.has(n, m.rt)) b = i; }); return b; };
  function initMQ(n) { n.mq = {}; const k = 0.45 + 0.55 * Math.min(1, (n.pc || 5000) / 30000); for (const t in MD) n.mq[t] = G.bestModel(n, t) * (G.bestModel(n, t) > 0 ? k : 1); }
  G.initMQ = initMQ;
  G.modelStat = function (n, type, key) { const L = MD[type]; if (!L) return 1; if (!n.mq) initMQ(n); const q = Math.min(n.mq[type] || 0, L.length - 1), i = Math.floor(q), f = q - i; const a = L[i][key] != null ? L[i][key] : 1, b = L[Math.min(i + 1, L.length - 1)][key] != null ? L[Math.min(i + 1, L.length - 1)][key] : 1; return a + (b - a) * f; };
  function modelCache(n) { if (n._mc && n._mcD === G.day) return n._mc; const A = {}, Dd = {}; for (const k of TK) { A[k] = G.modelStat(n, k, 'att'); Dd[k] = G.modelStat(n, k, 'def'); } n._mcD = G.day; return (n._mc = [A, Dd]); }
  G.modelName = (n, type) => { if (!n.mq) initMQ(n); return MD[type][Math.min(MD[type].length - 1, Math.floor((n.mq[type] || 0) + 0.001))].n; };
  G.modernize = function (nid) { const n = N[nid], c = Math.max(0.5, n.agg.gdp * 0.003); if ((n.modBoost || 0) > G.day) return { ok: false, err: 'Переозброєння вже пришвидшено' }; if (n.cash < c) return { ok: false, err: 'Бракує коштів: ' + c.toFixed(1) }; n.cash -= c; n.modBoost = G.day + 180; return { ok: true, cost: c }; };
  function modelsMonthly(n) { if (!n.mq) initMQ(n); const sp = 0.03 + ((n.modBoost || 0) > G.day ? 0.07 : 0) + (G.enemiesOf(n.id).length ? 0.01 : 0); for (const t in MD) { const tg = G.bestModel(n, t); const old = n.mq[t]; if (old < tg) { n.mq[t] = Math.min(tg, old + sp); if (Math.floor(n.mq[t] + 0.001) > Math.floor(old + 0.001) && G.isHuman(n.id)) G.say(`🏭 Переозброєння завершено: ${MD[t][Math.floor(n.mq[t] + 0.001)].n}`, 'good', [n.id]); } } }
  // ---- флот: класи кораблів
  function initNavy(n) { const s = n.ships || 0; n.navy = s > 150 ? { corv: 0.1, frig: 0.2, dest: 0.25, sub: 0.22, carr: 0.08, land: 0.15 } : s > 40 ? { corv: 0.3, frig: 0.3, dest: 0.12, sub: 0.12, carr: 0.02, land: 0.14 } : { corv: 0.6, frig: 0.25, dest: 0, sub: 0.05, carr: 0, land: 0.1 }; n.navPrio = null; }
  G.initNavy = initNavy;
  const DEFN = { corv: 0.3, frig: 0.3, dest: 0.12, sub: 0.12, carr: 0.02, land: 0.14 };
  const seaOf = (n, mix) => { let v = 0; for (const k in SC) { let m = SC[k].sea; if (k === 'sub' && G.has(n, 'nuc_sub')) m *= 1.8; if (k === 'carr' && G.has(n, 'carrier_gen')) m *= 1.4; if ((k === 'frig' || k === 'dest') && G.has(n, 'aegis')) m *= 1.15; v += (mix[k] || 0) * m; } return v; };
  const SEA0 = seaOf({}, DEFN);
  G.fleetMult = f => { const n = N[f.n]; if (!n.navy) initNavy(n); return seaOf(n, n.navy) / SEA0; };
  G.landMult = nid => { const n = N[nid]; if (!n.navy) initNavy(n); return (n.navy.land || 0) / DEFN.land; };
  G.setNavPrio = function (nid, k) { const n = N[nid]; if (k && !SC[k]) return { ok: false, err: 'Невідомий клас' }; n.navPrio = k || null; return { ok: true }; };
  function navyMonthly(n) { if (!n.navy) initNavy(n); const k = n.navPrio; if (!k) return; const sp = Math.min(0.04, 0.01 + (n.shipsProd || 0.5) * 0.002); for (const q in n.navy) n.navy[q] = q === k ? n.navy[q] + sp * (1 - n.navy[q]) : n.navy[q] * (1 - sp); }
  // морські дрони: ворожі флоти біля берегів держави з дослідженням «Морські дрони» зазнають втрат
  function navalDrones() {
    const own = {}; ter.forEach((t, i) => { if (t.ctrl !== t.owner) return; const n = N[t.ctrl]; if (!G.has(n, 'naval_drones')) return; (T[i].p || []).forEach(p => { (own[p[0]] = own[p[0]] || new Set()).add(t.ctrl); }); });
    const hits = {};
    for (const f of G.fleets) { const s = own[f.node]; if (!s) continue; for (const x of s) if (G.atWar(x, f.n)) { const fn = N[f.n]; const aa = fn.navy ? (fn.navy.dest || 0) * 1.6 + (fn.navy.frig || 0) + (fn.navy.carr || 0) * 1.4 : 0.5; const l = f.s * clamp(0.06 - aa * 0.03, 0.01, 0.06); f.s -= l; const k = x + '>' + f.n; hits[k] = (hits[k] || 0) + l; break; } }
    for (const k in hits) { const [a, b] = k.split('>').map(Number); if (hits[k] >= 0.3 && (G.isHuman(a) || G.isHuman(b))) G.say(`🚤 Морські дрони ${N[a].name} атакують флот ${N[b].name}: втрачено кораблів ${hits[k].toFixed(1)}`, G.isHuman(b) ? 'bad' : 'good', [a, b]); }
  }
  function comp(a) {
    let c = a.comp;
    if (!c) c = a.comp = Object.assign({}, TP.std.c);
    else if (c.armor != null) { c = a.comp = mk({ inf: c.inf, mbt: c.armor * 0.5, ifv: c.armor * 0.5, tube: (c.art || 0) * 0.7, mlrs: (c.art || 0) * 0.3, ad: c.ad }); } // міграція 1.1
    for (const k of TK) if (c[k] == null) c[k] = 0;
    return c;
  }
  G.armyComp = comp;
  G.tplOf = function (a) { const c = comp(a); let best = 'std', bd = 9; for (const [k, v] of Object.entries(TP)) { if (k === 'mech') continue; let d = 0; for (const q of TK) d += Math.abs(v.c[q] - (c[q] || 0)); if (d < bd) { bd = d; best = k; } } return best; };
  // ---- сезони
  G.month = () => new Date((G.startDate || Date.UTC(2026, 0, 1)) + G.day * 86400000).getUTCMonth();
  G.season = function (i) {
    const lat = T[i].c[1], m = G.month(), tr = T[i].t; const temperate = Math.abs(lat) > 42 && Math.abs(lat) < 63 && tr !== 'desert' && tr !== 'mountain';
    const south = lat < 0; const mm = south ? (m + 6) % 12 : m;
    const mud = temperate ? (mm === 2 || mm === 3 ? 1 : mm === 9 || mm === 10 ? 0.7 : 0) : 0;
    const winter = Math.abs(lat) > 45 && (mm === 11 || mm === 0 || mm === 1) ? 1 : 0;
    return { mud, winter };
  };
  G.seasonName = function (i) { const s = G.season(i); return s.mud ? '🟤 Бездоріжжя' : s.winter ? '❄ Зима' : ''; };
  // ---- бойовий множник складу
  let _need = {};
  function armorSat(n) { if (!n.ars || n.ars.armor == null) return 1; const need = _need[n.id] || 0; return need > 0 ? clamp(n.ars.armor / need, 0.35, 1) : 1; }
  function mult(c, tr, urb, ao, attack, mud, winter, um, n) {
    um = um || {}; const mm = n ? modelCache(n)[attack ? 0 : 1] : null; const u = mm ? k => (c[k] || 0) * (1 + (um[k] || 0)) * (mm[k] || 1) : k => (c[k] || 0) * (1 + (um[k] || 0));
    const ti = TI[tr] || 1, ta = TA[tr] || 1, md = 1 - 0.4 * mud, wn = attack && winter ? 0.93 : 1;
    if (attack) return wn * (u('inf') * 0.85 * ti + u('spec') * 1.3 * ti * (1 + urb * 0.4) + u('mbt') * 1.9 * ta * (1 - urb * 0.6) * ao * md + u('ifv') * 1.3 * (ta + 1) / 2 * (1 - urb * 0.3) * ao * (1 - 0.25 * mud) + u('tube') * 1.15 + u('mlrs') * 1.45 + u('ad') * 0.55 + u('uav') * 1.5 * (n && n.ars && n.ars.fpv != null ? Math.min(1, 0.35 + n.ars.fpv / 4e4) : 1) + u('eng') * 1.35 * (1 + urb * 0.3));
    return u('inf') * 1.05 * ti * (1 + urb * 0.5) + u('spec') * 1.0 * ti * (1 + urb * 0.3) + u('mbt') * 1.1 * ao + u('ifv') * 1.05 * ao + u('tube') * 1.2 + u('mlrs') * 1.0 + u('ad') * 0.8 + u('uav') * 1.35 * (n && n.ars && n.ars.fpv != null ? Math.min(1, 0.35 + n.ars.fpv / 4e4) : 1) + u('eng') * 1.25;
  }
  G.compMult = function (a, attack) { const n = N[a.n], s = G.season(a.t); return mult(comp(a), T[a.t].t, G.urbanDef ? G.urbanDef(a.t) || 0 : 0, n._armSat != null ? n._armSat : 1, attack, s.mud, s.winter, techMods(n).um, n); };
  const NORM_A = mult(TP.std.c, 'plains', 0, 1, true, 0, 0), NORM_D = mult(TP.std.c, 'plains', 0, 1, false, 0, 0);
  const basePower = G.armyPower;
  G.armyPower = function (a) {
    const atk = G.atWar(ter[a.t].ctrl, a.n), n = N[a.n], c = comp(a); let m = G.compMult(a, atk) / (atk ? NORM_A : NORM_D);
    const air = n.airEdge || 1;
    if (atk) m *= air * (n.casEdge || 1); // перевага в повітрі й штурмова авіація допомагають наступу
    else if (air < 1) m *= 1 - (1 - air) * (1 - Math.min(1, c.ad * 3)); // власна ППО гасить ворожу перевагу
    if (a.retrain) m *= 0.8;
    m *= 1 + 0.15 * (a.xp || 0); // досвід
    return basePower(a) * m;
  };
  const baseNew = G.newArmy;
  G.newArmy = function (nid, t, k, name) { const a = baseNew(nid, t, k, name); a.comp = Object.assign({}, TP[G._tpl || 'std'].c); a.xp = 0; G._tpl = null; return a; };
  G.setArmyTemplate = function (a, tpl) {
    if (typeof a === 'number') a = G.armies.find(x => x.id === a);
    if (tpl === 'mech') tpl = 'tank';
    if (!a || !TP[tpl]) return { ok: false, err: 'Немає шаблону' };
    if (G.tplOf(a) === tpl && !a.retrain) return { ok: false, err: 'Армія вже має такий склад' };
    const n = N[a.n]; const cost = a.k * (tpl === 'assault' ? 0.03 : 0.01); if (n.cash != null) n.cash -= cost;
    a.retrain = { to: tpl, until: G.day + 30 }; a.org = Math.min(a.org, 0.6); return { ok: true, days: 30, cost };
  };
  // власний склад армії: c = { inf, spec, mbt, ifv, tube, mlrs, ad } у частках (нормалізується)
  G.COMP_LIM = { inf: [0.15, 0.9], spec: [0, 0.2], mbt: [0, 0.45], ifv: [0, 0.4], tube: [0, 0.35], mlrs: [0, 0.2], ad: [0, 0.3], uav: [0, 0.25], eng: [0, 0.2] };
  G.normComp = function (c) { const o = {}; let s = 0; for (const k of TK) { o[k] = clamp(+c[k] || 0, G.COMP_LIM[k][0], G.COMP_LIM[k][1]); s += o[k]; } for (const k of TK) o[k] = +(o[k] / (s || 1)).toFixed(3); return o; };
  G.compChange = (a, c) => { const cur = comp(a); let d = 0; for (const k of TK) d += Math.abs((c[k] || 0) - (cur[k] || 0)); return d / 2; };
  G.setArmyComp = function (a, c) {
    if (typeof a === 'number') a = G.armies.find(x => x.id === a);
    if (!a || !c) return { ok: false, err: 'Немає армії' }; if (a.retrain) return { ok: false, err: 'Армія вже переформовується' };
    c = G.normComp(c); const ch = G.compChange(a, c); if (ch < 0.02) return { ok: false, err: 'Склад майже не змінився' };
    const heavy = Math.max(0, (c.mbt + c.ifv + c.mlrs) - (comp(a).mbt + comp(a).ifv + comp(a).mlrs));
    const n = N[a.n]; const cost = +(a.k * (0.004 + ch * 0.02 + heavy * 0.05)).toFixed(2); if (n.cash != null && n.cash < cost) return { ok: false, err: 'Бракує коштів: ' + cost };
    if (n.cash != null) n.cash -= cost; const days = Math.round(10 + ch * 50);
    a.retrain = { to: 'custom', c, until: G.day + days }; a.org = Math.min(a.org, 1 - ch * 0.8); return { ok: true, days, cost };
  };
  G.compQuote = function (a, c) { c = G.normComp(c); const ch = G.compChange(a, c); const cur = comp(a); const heavy = Math.max(0, (c.mbt + c.ifv + c.mlrs) - (cur.mbt + cur.ifv + cur.mlrs)); return { ch, days: Math.round(10 + ch * 50), cost: +(a.k * (0.004 + ch * 0.02 + heavy * 0.05)).toFixed(2), c }; };
  // ---- авіація
  const AT = G.D.airTypes = {
    ftr:  { n: 'Винищувачі', ic: '✈', px: 'jet', price: 0.08, d: 'Перевага в повітрі: посилює наступ, прикриває від ворожої авіації, перехоплює бомбардувальники' },
    atk:  { n: 'Штурмовики', ic: '🛩', px: 'attack', price: 0.04, d: 'Підтримка наступу з повітря та скидання КАБ на прифронтові регіони; гинуть від ППО' },
    bmb:  { n: 'Бомбардувальники', ic: '🛫', px: 'bomber', price: 0.3, d: 'Бомбардування тилу на 1600 км: дуже руйнівні, але вразливі до винищувачів і ППО' },
    heli: { n: 'Гелікоптери', ic: '🚁', px: 'heli', price: 0.02, d: 'Вогнева підтримка біля фронту; вразливі до ПЗРК і мобільної ППО' }
  };
  const AIR = { USA: 2700, RUS: 1500, CHN: 1900, IND: 800, KOR: 600, JPN: 500, EGY: 500, TUR: 450, FRA: 400, GBR: 350, ISR: 330, PAK: 400, DEU: 250, ITA: 250, IRN: 300, PRK: 400, SAU: 350, UKR: 90, POL: 100, GRC: 200, TWN: 300, BRA: 200, AUS: 150, SWE: 100, ESP: 160 };
  const BMB = { USA: 140, RUS: 120, CHN: 180, IND: 0 };
  const HELI = { USA: 5000, RUS: 1500, CHN: 900, IND: 700, JPN: 450, KOR: 600, TUR: 450, FRA: 450, GBR: 250, DEU: 300, ITA: 350, EGY: 300, PAK: 300, UKR: 110, POL: 200, ISR: 150 };
  function initAir(n) {
    const tot = AIR[n.a3] || Math.round(Math.max(0, n.agg ? n.agg.gdp : 50) * 0.02);
    n.air = { ftr: Math.round(tot * 0.6), atk: Math.round(tot * 0.28), bmb: BMB[n.a3] || 0, heli: HELI[n.a3] != null ? HELI[n.a3] : Math.round(tot * 0.7) };
    n.airQ = [];
  }
  const baseInitArs = G.initArsenal;
  G.initArsenal = function () {
    baseInitArs();
    const SB = G.D.startBuildings || {}; const BAL = { RUS: 900, IRN: 3000, PRK: 1000, CHN: 1500, USA: 400, ISR: 300, IND: 400, PAK: 300, UKR: 20, KOR: 300, TUR: 80, SAU: 60 }, HYP = { RUS: 60, CHN: 80, USA: 10 }, GLD = { RUS: 9000, USA: 6000, CHN: 4000, UKR: 300, ISR: 2000, TUR: 800, FRA: 600, GBR: 400 };
    const ST = {
      mbt_mod: 'USA RUS CHN DEU ISR KOR FRA GBR JPN TUR', precision_art: 'USA GBR DEU FRA ISR KOR', glide_kits: 'RUS USA CHN ISR UKR TUR FRA GBR',
      tactical_bm: 'RUS IRN PRK CHN USA ISR IND PAK KOR TUR SAU', attack_heli: 'USA RUS CHN GBR DEU FRA JPN KOR ISR TUR IND ITA', spec_ops: 'USA GBR ISR RUS FRA',
      gen5: 'USA CHN', stealth_bmb: 'USA', bmd: 'USA ISR JPN KOR DEU POL SAU', hypersonic: 'RUS CHN USA', sat_recon: 'USA CHN RUS FRA ISR IND JPN', cyber_war: 'USA RUS CHN ISR PRK IRN GBR UKR',
      sat_net: 'USA CHN RUS FRA ISR IND JPN GBR', launch_vehicles: 'USA CHN RUS FRA JPN IND ISR IRN PRK KOR', smallsat: 'USA CHN', sat_internet: 'USA', reusable: 'USA', heavy_lift: 'USA CHN', asat: 'USA CHN RUS IND', naval_drones: 'UKR TUR USA', ugv: 'USA ISR', fpv: 'UKR RUS USA ISR TUR', recon_swarm: 'USA ISR', aegis: 'USA JPN KOR GBR FRA RUS CHN ESP', nuc_sub: 'USA', carrier_gen: 'USA', cyber_def: 'USA RUS CHN ISR PRK IRN GBR UKR EST', ew: 'USA RUS CHN ISR UKR', adv_mats: 'USA CHN JPN DEU KOR FRA GBR'
    };
    for (const id in ST) ST[id].split(' ').forEach(a3 => { const i = G.nIdx[a3]; if (i != null && N[i].res) N[i].res.done[id] = -1; });
    N.forEach(n => { initAir(n); if (!n.ars) return; n.ars.ballistic = BAL[n.a3] || 0; n.ars.hyper = HYP[n.a3] || 0; n.ars.glide = GLD[n.a3] || Math.round((n.troopsBase || 10) * 2); });
  };
  G.airStrength = n => n.air ? (n.air.ftr || 0) * (n.q || 1) * (1 + (techMods(n).air.ftr || 0)) * G.modelStat(n, 'ftr', 'air') : 0;
  G.airTotal = n => n.air ? (n.air.ftr || 0) + (n.air.atk || 0) + (n.air.bmb || 0) + (n.air.heli || 0) : 0;
  // замовлення літаків: свої оборонні заводи — дешевше й швидше, без них — імпорт у дружніх держав (+40%, довше)
  G.airFactories = function (nid) { if (G._facC) return G._facC[nid] || 0; let lv = 0; for (const t of ter) if (t.owner === nid && t.ctrl === nid) lv += (t.bld && t.bld.arms_factory) || 0; return lv; };
  G.airOffer = function (nid, type, cnt) {
    const n = N[nid], a = AT[type]; if (!a) return null; const fac = G.airFactories(nid), own = fac >= 2 && (n.tech || 0) >= 0.9;
    const seller = own ? nid : N.filter(x => x.alive && x.id !== nid && !G.atWar(x.id, nid) && G.airFactories(x.id) >= 4 && (x.tech || 0) >= 1 && G.rel[x.id][nid] > 35).sort((x, y) => G.rel[y.id][nid] - G.rel[x.id][nid])[0];
    const sid = own ? nid : seller ? seller.id : -1;
    return { own, seller: sid, cost: cnt * a.price * (own ? 1 : 1.4) * (type === 'bmb' && !own ? 1.5 : 1), days: own ? 90 + Math.round(cnt / Math.max(1, fac) * 6) : 150 };
  };
  G.buyAir = function (nid, type, cnt) {
    const n = N[nid]; cnt = Math.round(cnt); if (!(cnt > 0) || !AT[type]) return { ok: false, err: 'Невірне замовлення' };
    const o = G.airOffer(nid, type, cnt); if (o.seller < 0) return { ok: false, err: 'Немає власних авіазаводів (оборонних заводів ≥ 2) і жодна дружня держава не продає літаки' };
    if (type === 'bmb' && !o.own) return { ok: false, err: 'Стратегічні бомбардувальники не продають: потрібне власне виробництво' };
    const pay = Math.min(n.milStock || 0, o.cost); n.milStock = (n.milStock || 0) - pay; n.cash -= o.cost - pay;
    n.airQ = n.airQ || []; n.airQ.push({ type, cnt, done: G.day + o.days, from: o.seller });
    if (!o.own) { G.rel[o.seller][nid] = clamp(G.rel[o.seller][nid] + 2, -100, 100); N[o.seller].cash += o.cost * 0.6; }
    return { ok: true, days: o.days, cost: o.cost, from: o.seller };
  };
  G.unitsDaily = function () {
    const month = G.day % 30 === 0;
    _need = {}; for (const a of G.armies) { const c = comp(a); _need[a.n] = (_need[a.n] || 0) + a.k * (c.mbt * 8 + c.ifv * 5); }
    if (month || !G._facC) { G._facC = {}; for (const t of ter) if (t.owner === t.ctrl && t.bld && (t.bld.arms_factory || t.bld.aircraft_plant)) G._facC[t.owner] = (G._facC[t.owner] || 0) + (t.bld.arms_factory || 0) + (t.bld.aircraft_plant || 0) * 3; }
    N.forEach(n => {
      if (!n.alive) return; if (!n.air) initAir(n);
      n._armSat = armorSat(n); if (month) { modelsMonthly(n); navyMonthly(n); }
      if (n.airQ && n.airQ.length) n.airQ = n.airQ.filter(q => { if (G.day < q.done) return true; n.air[q.type] = (n.air[q.type] || 0) + q.cnt; if (n.id === G.player || G.isHuman(n.id)) G.say(`${AT[q.type].ic} Отримано: ${AT[q.type].n.toLowerCase()} ×${q.cnt}`, 'good', [n.id]); return false; });
      if (month) { // серійне виробництво на власних оборонних заводах
        const lv = G.airFactories(n.id); if (lv && (n.tech || 0) >= 0.95) { const k = lv * 0.35 * (n.ratio ? Math.min(1, n.ratio.chips || 0.5) : 0.5); n.air.ftr += k * 0.45; n.air.atk += k * 0.3; n.air.heli += k * 0.6; }
      }
      const en = G.enemiesOf(n.id); if (!en.length) { n.airEdge = 1; n.casEdge = 1; return; }
      const mine = G.airStrength(n); let theirs = 0, ad = 0, ead = 0;
      for (const e of en) { theirs = Math.max(theirs, G.airStrength(N[e])); ad = Math.max(ad, N[e].ars && N[e].ars.sam ? N[e].ars.sam : 0); ead = Math.max(ead, N[e]._adShare || 0.1); }
      const r = (mine + 1) / (theirs + ad * 0.3 + 1);
      n.airEdge = clamp(1 + 0.035 * Math.log2(r), 0.92, 1.1);
      const tr = Math.max(1, G.troopsOf(n.id)); const casD = ((n.air.atk || 0) * G.modelStat(n, 'atk', 'air') + (n.air.heli || 0) * 0.4 * (1 + (techMods(n).air.heli || 0)) * G.modelStat(n, 'heli', 'air')) / tr * (n.airEdge >= 1 ? 1 : 0.5) * (1 - Math.min(0.8, ead * 2.5));
      n.casEdge = 1 + Math.min(0.05, casD * 0.08);
      if (month) { // бойові втрати авіації
        const fl = Math.min(n.air.ftr * 0.03, (theirs + ad * 0.3) * 0.006); n.air.ftr = Math.max(0, n.air.ftr - fl);
        const al = (n.air.atk || 0) * 0.02 * (0.3 + ead * 3), hl = (n.air.heli || 0) * 0.025 * (0.3 + ead * 3); n.air.atk = Math.max(0, n.air.atk - al); n.air.heli = Math.max(0, n.air.heli - hl);
      }
      // ШІ докуповує літаки під час війни
      if (month && (!G.isHuman(n.id) || G.autoPlayer) && n.milStock > 3 && G.rnd() < 0.5) { const t = n.airEdge < 1 ? 'ftr' : G.rnd() < 0.5 ? 'atk' : 'heli'; const cnt = Math.max(2, Math.round(n.milStock * 0.03 / AT[t].price)); if (cnt <= 200) G.buyAir(n.id, t, cnt); }
    });
    // частка ППО в арміях держави (для ворожих штурмовиків і гелікоптерів)
    const adS = {}, adK = {}; for (const a of G.armies) { const c = comp(a); adS[a.n] = (adS[a.n] || 0) + c.ad * a.k; adK[a.n] = (adK[a.n] || 0) + a.k; }
    N.forEach(n => { n._adShare = adK[n.id] ? adS[n.id] / adK[n.id] : 0.1; });
    const hot = new Set(G.battles || []);
    for (const a of G.armies) {
      const c = comp(a);
      // артилерія пришвидшує артпідготовку й з'їдає снаряди
      const fire = c.tube + c.mlrs * 1.5;
      if (fire > 0.2 && a.atFront && a.stance !== 'attack' && a.prep != null && a.prep < 1) a.prep = Math.min(1, a.prep + 0.02 * (fire - 0.18) * 3);
      if (fire > 0.18 && a.atFront) { const n = N[a.n]; if (n.ars && n.ars.shells > 0) n.ars.shells = Math.max(0, n.ars.shells - a.k * (fire - 0.18) * 0.4 * (G.has(n, 'precision_art') ? 0.75 : 1)); }
      // досвід: росте в боях, розбавляється поповненням
      if (a._k && a.k > a._k * 1.03) a.xp = (a.xp || 0) * a._k / a.k; a._k = a.k;
      if (hot.has(a.t)) a.xp = Math.min(1, (a.xp || 0) + 0.0035);
      if (a.retrain && G.day >= a.retrain.until) {
        a.comp = Object.assign({}, a.retrain.c || TP[a.retrain.to].c); const nm = a.retrain.c ? 'власний склад' : TP[a.retrain.to].n; a.retrain = null;
        if (a.n === G.player || (G.isHuman && G.isHuman(a.n))) G.say(`🎖 «${a.name}» переформовано: ${nm}`, 'good', [a.n]);
      }
    }
    partisansDaily(); if (month) navalDrones();
  };
  G.vetStars = a => (a.xp || 0) >= 0.8 ? '★★★' : (a.xp || 0) >= 0.5 ? '★★' : (a.xp || 0) >= 0.25 ? '★' : '';
  // ---- партизани на окупованих територіях
  function partisansDaily() {
    const month = G.day % 30 === 15;
    for (const t of ter) {
      if (t.owner === t.ctrl || !N[t.owner] || !N[t.owner].alive) { if (t.part) t.part = Math.max(0, t.part - 0.01); continue; }
      const target = 0.15 + Math.min(0.35, (t.pop || 0) / 6) + (t.partBoost || 0); t.part = (t.part || 0) + (target - (t.part || 0)) * 0.01; if (t.partBoost) t.partBoost = Math.max(0, t.partBoost - 0.002);
      for (const a of G.armies) if (a.t === t.i && a.n === t.ctrl) { a.org = Math.max(0.2, a.org - 0.0015 * t.part); a.sup = Math.max(0.2, (a.sup || 1) - 0.001 * t.part); }
      if (month && G.rnd() < t.part * 0.25) {
        const r = G.rnd(); let txt; const occ = N[t.ctrl];
        if (r < 0.4) { const ar = G.armies.find(a => a.t === t.i && a.n === t.ctrl); if (ar) { const l = Math.min(ar.k * 0.01, 1.5); ar.k -= l; occ.casualties += l; } txt = 'атакували колону окупантів'; }
        else if (r < 0.7) { t.logiHit = Math.max(t.logiHit || 0, G.day + 10); txt = 'підірвали залізницю — постачання зірвано'; }
        else { if (occ.ars) occ.ars.shells = Math.max(0, occ.ars.shells - 30); txt = 'знищили склад боєприпасів'; }
        G.say(`🔥 Партизани ${N[t.owner].name} ${txt} — ${T[t.i].n}`, t.owner === G.player ? 'good' : 'war', [t.owner, t.ctrl]);
      }
    }
  }
  // ШІ: шаблон під задачу
  G.aiTemplate = function (n) {
    const war = G.enemiesOf(n.id).length > 0; const sat = n._armSat != null ? n._armSat : 1;
    const r = G.rnd(); G._tpl = !war ? (r < 0.7 ? 'std' : 'inf') : sat > 0.9 && r < 0.3 ? 'tank' : r < 0.5 ? 'std' : r < 0.62 ? 'assault' : r < 0.77 ? 'art' : r < 0.9 ? 'inf' : 'shield';
  };
});
