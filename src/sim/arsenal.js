// АРСЕНАЛ І УДАРИ: запаси снарядів, бронетехніки, FPV, ударних дронів, ракет і перехоплювачів ППО;
// виробництво на заводах, закупівля з військового фонду, витрата в боях, вплив на бойову силу;
// далекобійні удари по тилу (енергетика, оборонка, війська) з перехопленням ППО. ШІ веде ударні кампанії сам.
LORA.sim.register('arsenal', 59, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp; const UN = G.D.units, BD = G.D.buildings; const KEYS = Object.keys(UN);
  const hav = U.hav || ((lo1, la1, lo2, la2) => { const r = Math.PI / 180, dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r; const s = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); });
  const SB = G.D.startBuildings || {};
  const big = { RUS: 3, USA: 2.5, CHN: 2, PRK: 2, IND: 1.3 }; // радянські/великі запаси
  G.initArsenal = function () {
    N.forEach(n => {
      const tr = n.troopsBase || 10, tech = n.tech || 0.8, k = big[n.a3] || 1;
      n.ars = { shells: tr * 3 * k, armor: tr * 1.6 * (0.5 + tech / 2) * Math.sqrt(k), fpv: ((SB.drones || {})[n.a3] || 0) * 90 + tr * 0.05,
        strike: ((SB.drones || {})[n.a3] || 0) * 600, missiles: ((SB.missiles || {})[n.a3] || 0) * 350 * k, sam: ((SB.airDefense || {})[n.a3] || 0) * 450 + tr * 0.3 };
      n.arsF = { att: 1, def: 1, sat: {} }; n.arsM = { prod: {}, used: {}, bought: 0, hitsIn: 0, hitsOut: 0, intercepted: 0 }; n._cas = n.casualties || 0;
    });
  };
  N.forEach(n => { n.ars = {}; n.arsF = { att: 1, def: 1, sat: {} }; n.arsM = { prod: {}, used: {} }; });

  // ---- бойова сила: множник від забезпеченості
  const basePower = G.armyPower;
  G.armyPower = function (a) {
    const p = basePower(a); const n = N[a.n], f = n.arsF; if (!f) return p;
    const atk = G.atWar(ter[a.t].ctrl, a.n); let m = atk ? f.att * (1 + 0.35 * (a.prep || 0)) * (f.droneEdge || 1) : f.def;
    if (!atk) { const nb = T[a.t].nb; if (nb.length >= 2) { let h = 0; for (const j of nb) if (G.atWar(ter[j].ctrl, a.n)) h++; if (h / nb.length >= 0.7) m *= 0.8; } } // напівоточення
    return p * m;
  };
  const baseSupT = G.supplyTarget;
  G.supplyTarget = function (a) { let v = baseSupT(a); const t = ter[a.t]; if (t.logiHit > G.day) v -= 0.15; else if (T[a.t].nb.some(j => ter[j].logiHit > G.day && ter[j].ctrl === a.n)) v -= 0.06; return clamp(v, 0, 1); };
  G.arsSat = (n, k) => n.arsF && n.arsF.sat[k] != null ? n.arsF.sat[k] : 1;

  G.strikeAgg = {};
  G.flushStrikes = function () {
    for (const k in G.strikeAgg) {
      const A = G.strikeAgg[k]; if (!N[A.a] || !N[A.v]) continue;
      const ws = Object.entries(A.w).map(([w, c]) => `${(WP[w] || WP.missiles).ic}${c}`).join(' ');
      const top = Object.entries(A.reg).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([i]) => T[i].n).join(', ');
      const P = G.player, mine = A.v === P || G.isHuman(A.v), my = A.a === P || G.isHuman(A.a);
      G.say(`💥 Авіаудари за тиждень: ${N[A.a].name} → ${N[A.v].name}: ${ws} · влучань ${A.hits}, збито ${A.intc}${A.lost >= 1 ? ` · втрачено літаків ${A.lost.toFixed(0)}` : ''}${top ? ' · найбільше: ' + top : ''}`, mine ? 'bad' : my ? 'good' : 'war', [A.a, A.v]);
    }
    G.strikeAgg = {};
  };
  G.arsenalDaily = function () {
    if (G.day % 7 === 6) G.flushStrikes();
    const month = G.day % 30 === 0;
    // задіяні війська: у боях і на лінії зіткнення
    const hotT = new Set((G.battles || []).filter(i => (G.battleHot || {})[i])), battleT = new Set(G.battles || []);
    const eng = new Float64Array(N.length), engHot = new Float64Array(N.length), troops = new Float64Array(N.length);
    for (const a of G.armies) { troops[a.n] += a.k; const atk = G.atWar(ter[a.t].ctrl, a.n);
      if (battleT.has(a.t)) { if (hotT.has(a.t)) engHot[a.n] += a.k; else eng[a.n] += a.k; } else if (a.atFront) eng[a.n] += a.k * 0.5;
      // артпідготовка: позиційна підготовка перед штурмом накопичує бонус, штурм його витрачає
      if (atk && hotT.has(a.t)) a.prep = Math.max(0, (a.prep || 0) - 0.04); else if (a.atFront && a.stance !== 'attack' && (!N[a.n].arsF || N[a.n].arsF.sat.shells == null || N[a.n].arsF.sat.shells > 0.7)) a.prep = Math.min(1, (a.prep || 0) + 0.025); else if (a.prep) a.prep = Math.max(0, a.prep - 0.01);
      a.atFront = false; }
    // виробництво
    const prod = N.map(() => ({}));
    for (const t of ter) { if (t.ctrl !== t.owner) continue; const n = N[t.owner]; for (const k in t.bld) { const lvl = t.bld[k]; const b = BD[k];
      let inR = 1; if (b.in) for (const r in b.in) inR = Math.min(inR, n.ratio[r] != null ? n.ratio[r] : 1);
      for (const u of KEYS) { const q = UN[u].prod[k]; if (q && !(UN[u].rt && !(n.res && n.res.done[UN[u].rt] != null))) prod[n.id][u] = (prod[n.id][u] || 0) + q * lvl * inR * (1 - t.dmg) / 365; } } }
    N.forEach(n => {
      if (!n.alive || !n.ars) return; const A = n.ars, war = G.enemiesOf(n.id).length > 0, P = prod[n.id];
      for (const u in P) { A[u] += P[u]; if (month) n.arsM.prod[u] = P[u] * 365; }
      // витрата
      const use = {};
      for (const u of KEYS) { const us = UN[u].use; if (!us) continue; const need = engHot[n.id] * us[0] + eng[n.id] * us[1]; use[u] = need; const got = Math.min(A[u], need); A[u] -= got; n.arsF.sat[u] = need > 0 ? clamp(0.25 + 0.75 * got / need, 0, 1) * clamp(A[u] / Math.max(1e-6, need * 20), 0.6, 1) : 1; }
      const dc = (n.casualties || 0) - (n._cas || 0); n._cas = n.casualties || 0; if (dc > 0) A.armor = Math.max(0, A.armor - dc * UN.armor.lossK * Math.min(3, A.armor / Math.max(1, troops[n.id])));
      // закупівля з військового фонду під час війни (власні запаси + допомога партнерів)
      if (war && n.milStock > 1) { let spend = 0; ['shells', 'fpv', 'sam', 'armor'].forEach(u => { const need = u === 'sam' ? 300 : u === 'armor' ? troops[n.id] * UN.armor.ref : (use[u] || 0) * 60; if (A[u] >= need) return;
        const buy = Math.min(need - A[u], n.milStock * 0.0006 / UN[u].price); A[u] += buy; spend += buy * UN[u].price; }); n.milStock -= spend; n.arsM.bought = (n.arsM.bought || 0) * 0.97 + spend; }
      // множники
      const dens = A.armor / Math.max(1, troops[n.id]) / UN.armor.ref, arm = 0.85 + 0.25 * clamp(dens, 0, 1.2);
      const sh = G.arsSat(n, 'shells'), fp = G.arsSat(n, 'fpv'); const fpvD = clamp(A.fpv / Math.max(1, troops[n.id]) / UN.fpv.ref, 0, 1.5);
      n.arsF.att = (0.75 + 0.25 * sh) * arm * (0.95 + 0.1 * Math.min(1, fpvD) * fp);
      n.arsF.def = (0.75 + 0.25 * sh) * (0.95 + 0.05 * dens) * (0.92 + 0.22 * Math.min(1, fpvD) * fp);
      n.fpvD = fpvD * fp;
      if (month) { n.arsM.used = {}; for (const u in use) n.arsM.used[u] = use[u] * 30; }
    });
    // перевага в дронах над найсильнішим (за дронами) ворогом
    N.forEach(n => { if (!n.alive || !n.arsF) return; const en = G.enemiesOf(n.id); if (!en.length) { n.arsF.droneEdge = 1; return; } const e = Math.max(...en.map(j => N[j].fpvD || 0.05)); n.arsF.droneEdge = clamp(0.88 + 0.12 * (n.fpvD || 0.05) / Math.max(0.05, e), 0.85, 1.2); });
    if (G.day % 7 === 3) N.forEach(n => { if (n.alive && (!G.isHuman(n.id) || G.autoPlayer || n.strikeAuto)) aiStrikes(n); });
  };

  // ---- удари по тилу
  const ENERGY = ['npp', 'smr', 'coal_plant', 'gas_plant', 'hydro_plant', 'renewables', 'fusion_plant', 'solar_farm', 'wind_farm', 'offshore_wind', 'geothermal', 'hydrogen_plant', 'battery_storage'], INDUSTRY = ['arms_factory', 'drone_factory', 'missile_plant', 'shipyard', 'steel_plant', 'machine_plant', 'chip_fab', 'tank_plant', 'aircraft_plant', 'refinery', 'sat_factory', 'auto_plant'], MILT = ['depot', 'military_base', 'rail_hub', 'air_defense', 'radar', 'ew_station', 'naval_base'];
  G.STRIKE_SETS = { ENERGY, INDUSTRY, MILT };
  // таблиця засобів ураження: дальність, легкість перехоплення (ik), витрата перехоплювачів, «вага» удару, значок
  const WP = G.WP = {
    missiles:  { r: 2500, ik: 0.75, sc: 1.6, cov: 2, pow: 1, ic: '🚀', noun: 'крилатих ракет' },
    strike:    { r: 1800, ik: 1.15, sc: 0.5, cov: 0.6, pow: 0.18, ic: '✈', noun: 'дронів' },
    ballistic: { r: 900, ik: 0.4, sc: 3, cov: 3, pow: 1.5, ic: '☄', noun: 'балістичних ракет' },
    hyper:     { r: 2000, ik: 0.12, sc: 3, cov: 3, pow: 2.2, ic: '⚡', noun: 'гіперзвукових ракет' },
    glide:     { r: 90, ik: 0.25, sc: 0.3, cov: 0.4, pow: 0.035, ic: '💣', noun: 'КАБ', air: 'atk' },
    bombing:   { r: 1600, ik: 0.9, sc: 1, cov: 1.5, pow: 3.2, ic: '🛩', noun: 'бомбардувальників', air: 'bmb', sortie: true }
  };
  const RANGE = new Proxy({}, { get: (o, k) => (WP[k] || WP.missiles).r });
  G.strikeRange = function (nid, i, w, own) { if (w === 'glide') return T[i].nb.some(j => ter[j].ctrl === nid); const c = T[i].c; let best = 1e9; for (const t of (own || ter)) { if (t.ctrl !== nid) continue; const d = hav(T[t.i].c[0], T[t.i].c[1], c[0], c[1]); if (d < best) best = d; if (best < 50) break; } return best <= RANGE[w]; };
  G.canStrike = function (nid, i, w, cnt) {
    const t = ter[i], n = N[nid]; if (!G.atWar(nid, t.ctrl)) return 'Удари можливі лише по державі, з якою ви воюєте';
    const wp = WP[w]; if (!wp) return 'Невідомий засіб';
    if (wp.sortie) { const av = n.air ? Math.floor(n.air.bmb || 0) : 0; if (!(cnt > 0) || av < cnt) return `Недостатньо бомбардувальників: ${av}`; if ((n._raidT || 0) > G.day) return `Бомбардувальники повертаються на бази: ще ${n._raidT - G.day} дн.`; }
    else if (!(cnt > 0) || (n.ars[w] || 0) < cnt) return `Недостатньо: ${UN[w].n.toLowerCase()} ${Math.floor(n.ars[w] || 0)}`;
    if (wp.air === 'atk' && !(n.air && n.air.atk >= 4)) return 'Потрібні штурмовики (щонайменше 4) — замовте авіацію у вкладці «Армія → Авіація»';
    if (!G.strikeRange(nid, i, w)) return w === 'glide' ? 'КАБ скидають лише на прифронтові регіони (сусідні з вашими)' : `Поза дальністю (${RANGE[w]} км від вашої території)`;
    return '';
  };
  G.strike = function (nid, i, w, cnt, goal, quiet) {
    const err = G.canStrike(nid, i, w, cnt); if (err) return { ok: false, err };
    const n = N[nid], t = ter[i], d = N[t.ctrl], wp = WP[w]; if (wp.sortie) n._raidT = G.day + 7; else n.ars[w] -= cnt;
    // перехоплення: ППО регіону/сусідів + запас перехоплювачів + лазери
    const shield = Math.max(t.shield, ...T[i].nb.map(j => ter[j].ctrl === t.ctrl ? ter[j].shield * 0.6 : 0));
    const samCov = clamp(d.ars.sam / Math.max(1, cnt * wp.cov), 0, 1);
    // бомбардувальників і штурмовиків, крім ППО, перехоплюють винищувачі ворога
    const ftr = wp.air ? clamp((d.air ? d.air.ftr || 0 : 0) / Math.max(1, (n.air ? n.air.ftr || 0 : 0) + 20), 0, 2) * 0.12 : 0;
    const ikT = wp.ik * ((w === 'ballistic' && G.has(d, 'bmd')) ? 2.2 : (w === 'hyper' && G.has(d, 'bmd')) ? 1.6 : 1) * (w === 'bombing' && G.has(n, 'stealth_bmb') ? 0.5 : 1);
    const pInt = clamp((G.strikeDefBonus ? G.strikeDefBonus(t.ctrl, i, w) : 0) + (0.15 + shield) * (0.35 + 0.65 * samCov) * ikT + ((t.bld.laser_battery || 0) && w !== 'hyper' ? 0.15 * wp.ik : 0) + ftr * (w === 'bombing' && G.has(n, 'stealth_bmb') ? 0.4 : 1), 0, 0.92);
    const intc = Math.round(cnt * pInt), hits = cnt - intc; d.ars.sam = Math.max(0, d.ars.sam - intc * wp.sc);
    let airLost = 0;
    if (wp.sortie) { airLost = Math.min(n.air.bmb, intc * 0.35); n.air.bmb -= airLost; }
    else if (wp.air === 'atk') { airLost = Math.min(n.air.atk, cnt * 0.0015 * (0.3 + shield * 3) * (1 + ftr * 4)); n.air.atk -= airLost; }
    d.arsM.intercepted = (d.arsM.intercepted || 0) + intc; d.arsM.hitsIn = (d.arsM.hitsIn || 0) + hits; n.arsM.hitsOut = (n.arsM.hitsOut || 0) + hits;
    const pow = hits * wp.pow * (w !== 'strike' && w !== 'bombing' && G.navBonus ? G.navBonus(nid) : 1); let res = '';
    if (goal === 'energy') {
      const pe = pow * (1 - (t.grid || 0)); // накопичувачі енергії гасять частину удару
      const lost = Math.min(t.gdp * 0.02, pe * 0.003); t.gdp = Math.max(0.01, t.gdp - lost); t.dmg = Math.min(0.45, t.dmg + pe * 0.0018); // переважно тимчасові збитки (відновлюються)
      d.stab = Math.max(0, d.stab - pe * 0.003); d.warExh = Math.min(1, (d.warExh || 0) + pe * 0.0001); // блекаути виснажують суспільство
      const tg = ENERGY.filter(k => t.bld[k]); if (tg.length && G.rnd() < pe / 300) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = ', ' + BD[k].n + ' −1'; }
      res = `ВВП регіону −$${lost.toFixed(2)} млрд` + res;
    } else if (goal === 'industry') {
      const tg = INDUSTRY.filter(k => t.bld[k]); t.dmg = Math.min(0.5, t.dmg + pow * 0.001);
      if (tg.length && G.rnd() < pow / 250) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = BD[k].n + ' −1 рів.'; } else res = 'пошкодження без знищення';
    } else if (goal === 'rail') {
      t.logiHit = G.day + Math.min(45, Math.round(10 + pow * 0.6)); let cut = 0;
      G.links.forEach(l => { if (l.built && (l.a === i || l.b === i) && (l.type === 'rail' || l.type === 'road') && G.rnd() < 0.3 + pow / 60) { l.hitUntil = G.day + Math.min(40, 14 + Math.round(pow)); l.cut = true; cut++; } }); if (cut) G.rebuildLinkGraph && G.rebuildLinkGraph();
      const tg = ['rail_hub', 'depot'].filter(k => t.bld[k]); if (tg.length && G.rnd() < pow / 120) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = BD[k].n + ' −1 рів.; '; }
      res += `постачання зірвано на ${t.logiHit - G.day} дн.` + (cut ? `, перерізано маршрутів: ${cut}` : '');
    } else if (goal === 'ports') {
      const tg = ['port', 'lng_terminal', 'shipyard'].filter(k => t.bld[k]); t.portHit = G.day + Math.min(45, Math.round(10 + pow * 0.5));
      if (tg.length && G.rnd() < pow / 120) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = BD[k].n + ' −1 рів.; '; }
      const nodes = new Set((T[i].p || []).map(p => p[0])); let sunk = 0; G.fleets.forEach(f => { if (f.n === t.ctrl && nodes.has(f.node) && !f.mv) { const l = Math.min(f.s * 0.1, pow * 0.04); f.s -= l; sunk += l; } });
      res += `порт паралізовано на ${t.portHit - G.day} дн.` + (sunk >= 0.5 ? `, уражено кораблів: ${sunk.toFixed(1)}` : ''); G.tradeDirty = true;
    } else if (goal === 'airfields') {
      const tg = ['airport', 'military_base'].filter(k => t.bld[k]); if (tg.length && G.rnd() < pow / 120) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = BD[k].n + ' −1 рів.; '; }
      const lostM = Math.min(d.ars.missiles * 0.05, pow * 0.8); d.ars.missiles -= lostM; t.airHit = G.day + 20;
      res += `знищено авіації й ракет: ${lostM.toFixed(0)}`;
    } else {
      const ar = G.armies.filter(a => a.t === i && a.n === t.ctrl); ar.forEach(a => { a.org = Math.max(0.1, a.org - pow * 0.004); const l = Math.min(a.k * 0.02, pow * 0.05); a.k -= l; d.casualties += l; });
      d.milStock = Math.max(0, d.milStock - pow * 0.03); const tg = MILT.filter(k => t.bld[k]); if (tg.length && G.rnd() < pow / 100) { const k = tg[Math.floor(G.rnd() * tg.length)]; G.addLevel(i, k, -1); res = BD[k].n + ' −1; '; }
      res += ar.length ? 'війська дезорганізовано' : 'склади пошкоджено';
    }
    G.strikes = G.strikes || []; G.strikes.push({ d: G.day, from: nid, i, w, cnt, hits, intc });
    if (G.strikes.length > 60) G.strikes.shift();
    const P = G.pv ? G.pv() : G.player;
    const lostTxt = airLost >= 0.5 ? ` · втрачено літаків: ${airLost.toFixed(0)}` : '';
    if (!quiet) G.say(`${wp.ic} ${N[nid].name} → ${T[i].n}: ${cnt} ${wp.noun}, ${wp.sortie ? 'збито/повернули' : 'збито'} ${intc}, влучань ${hits}${hits ? ' · ' + res : ''}${lostTxt}`, 'war', [nid, t.ctrl]);
    else { // удари ШІ збираються в одне зведення на тиждень для кожної пари «хто → кого»
      const key = nid + '>' + t.ctrl; const A = G.strikeAgg[key] || (G.strikeAgg[key] = { a: nid, v: t.ctrl, w: {}, hits: 0, intc: 0, lost: 0, reg: {}, gdp: 0, n: 0 });
      A.w[w] = (A.w[w] || 0) + cnt; A.hits += hits; A.intc += intc; A.lost += airLost; A.reg[i] = (A.reg[i] || 0) + hits; A.n++;
    }
    return { ok: true, hits, intc, res, airLost };
  };
  // ---- ШІ: ударні кампанії (раз на тиждень)
  function aiStrikes(n) {
    const en = G.enemiesOf(n.id); if (!en.length) return; const own = ter.filter(t => t.ctrl === n.id);
    ['missiles', 'strike', 'ballistic', 'hyper', 'glide', 'bombing'].forEach(w => {
      const wp = WP[w]; let cnt;
      if (w === 'bombing') { const b = n.air ? n.air.bmb || 0 : 0; if (b < 8 || (n.airEdge || 1) < 1.02 || G.rnd() > 0.35 || (n._raidT || 0) > G.day) return; cnt = Math.floor(b * 0.3); }
      else { const stock = n.ars[w] || 0; const minS = { missiles: 20, strike: 80, ballistic: 15, hyper: 6, glide: 60 }[w]; if (stock < minS) return;
        if (w === 'glide' && !(n.air && n.air.atk >= 4)) return; cnt = Math.floor(stock * { missiles: 0.025, strike: 0.1, ballistic: 0.03, hyper: 0.12, glide: 0.18 }[w]); if (w === 'glide') cnt = Math.min(cnt, Math.floor(n.air.atk * 1.5)); }
      if (cnt < (w === 'hyper' ? 1 : w === 'bombing' ? 3 : 5)) return;
      const rr = G.rnd(); const goal = w === 'glide' ? (rr < 0.7 ? 'military' : 'rail') : w === 'missiles' || w === 'ballistic' || w === 'hyper' || w === 'bombing' ? (rr < 0.4 ? 'energy' : rr < 0.7 ? 'industry' : rr < 0.85 ? 'airfields' : 'ports') : (rr < 0.45 ? 'energy' : rr < 0.7 ? 'military' : 'rail');
      const want = { energy: ENERGY, industry: INDUSTRY, military: MILT, rail: ['rail_hub', 'depot'], ports: ['port', 'lng_terminal', 'shipyard'], airfields: ['airport', 'military_base'] }[goal];
      let best = null; for (const t of ter) { if (!en.includes(t.ctrl) || (t.ctrl !== t.owner && w !== 'glide')) continue; let v = 0; for (const k of want) if (t.bld[k]) v += t.bld[k] * BD[k].cost; if (goal === 'energy') v += t.gdp * 0.05; if (w === 'glide') v += G.armies.filter(a => a.t === t.i && a.n === t.ctrl).reduce((s, a) => s + a.k, 0) * 0.3; if (!v) continue; if (w === 'bombing' && t.shield > 0.25) continue; v *= 1 - t.shield * 0.6; if (!best || v > best.v) { if (G.strikeRange(n.id, t.i, w, own)) best = { i: t.i, v }; } }
      if (best) G.strike(n.id, best.i, w, cnt, goal, true);
    });
  }
});
