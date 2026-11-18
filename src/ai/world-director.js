// ШІ-РЕЖИСЕР СВІТУ: окремий від держав. Керує подіями (кризи, стихії, відкриття, теракти на морі),
// повстаннями на анексованих територіях, переворотами та «напругою» у світі. Додавати нові події — у масив EVENTS.
LORA.sim.register('ai-director', 80, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp; const SN = G.D.sea.nodes; const rel = G.rel;
  const rnd = () => G.rnd();
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const nIdx = G.nIdx;
  // ---- стихійні лиха: удар по регіону (руйнування, ВВП, населення, будівлі, стабільність)
  const inC = list => ter.filter(t => t.owner >= 0 && list.includes(N[t.owner].a3) && t.ctrl === t.owner);
  function disaster(t, sev, label, ic) {
    const n = N[t.owner]; if (!n || !n.alive) return; t.dmg = Math.min(0.6, t.dmg + 0.25 * sev); const lostG = t.gdp * 0.08 * sev; t.gdp = Math.max(0.01, t.gdp - lostG);
    const dead = t.pop * 0.0008 * sev * sev; t.pop = Math.max(0.01, t.pop - dead); n.stab = Math.max(0, n.stab - 4 * sev);
    let lost = 0; for (const k in t.bld) if (rnd() < 0.18 * sev) { G.addLevel(t.i, k, -1); lost++; }
    n.cash -= lostG * 0.3; // відновлення
    G.say(`${ic} ${label} — ${n.name} (${T[t.i].n}): збитки $${lostG.toFixed(1)} млрд${dead > 0.5 ? `, загиблих ≈ ${(dead * 1000).toFixed(0)} тис.` : ''}${lost ? `, зруйновано об'єктів: ${lost}` : ''}`, n.id === G.player ? 'bad' : sev > 1.2 ? 'big' : 'info', [n.id]);
    LORA.bus.emit('disaster', { t: t.i, sev, label });
  }
  const SEISMIC = ['JPN', 'TUR', 'IRN', 'CHL', 'PER', 'IDN', 'PHL', 'MEX', 'CHN', 'NPL', 'ITA', 'GRC', 'NZL', 'PAK', 'AFG', 'ECU', 'GTM', 'TWN', 'USA', 'MMR'];
  const CAT = [
    { id: 'quake', p: 0.0022, f() { const t = pick(inC(SEISMIC)); if (!t) return; const sev = 0.6 + rnd() * rnd() * 1.6; disaster(t, sev, `🌋 Землетрус магнітудою ${(6 + sev * 1.5).toFixed(1)}`, '🌍');
      if (sev > 1.3 && T[t.i].p.length && rnd() < 0.5) T[t.i].nb.filter(j => T[j].p.length && ter[j].owner === t.owner).slice(0, 2).forEach(j => disaster(ter[j], sev * 0.6, '🌊 Цунамі', '🌊')); } },
    { id: 'flood', p: 0.003, f() { const t = pick(inC(['BGD', 'IND', 'PAK', 'CHN', 'VNM', 'THA', 'MMR', 'NGA', 'BRA', 'DEU', 'POL', 'UKR', 'ROU', 'USA', 'IDN'])); if (!t) return; disaster(t, 0.4 + rnd() * 0.7, '🌧 Повінь', '🌊'); N[t.owner].mods.push({ r: 'grain', mul: 0.95, until: G.day + 120 }); } },
    { id: 'wildfire', p: 0.0025, f() { const t = pick(inC(['AUS', 'USA', 'CAN', 'GRC', 'TUR', 'RUS', 'BRA', 'PRT', 'ESP', 'BOL'])); if (!t) return; disaster(t, 0.3 + rnd() * 0.6, '🔥 Масштабні лісові пожежі', '🔥'); } },
    { id: 'typhoon', p: 0.0025, f() { const t = pick(inC(['PHL', 'JPN', 'CHN', 'TWN', 'VNM', 'KOR', 'BGD', 'IND', 'MEX', 'CUB', 'USA']).filter(t => T[t.i].p.length)); if (!t) return; disaster(t, 0.5 + rnd() * 0.8, '🌀 Супертайфун', '🌀'); } },
    { id: 'volcano', p: 0.0004, f() { const t = pick(inC(['ISL', 'IDN', 'ITA', 'JPN', 'PHL', 'CHL', 'USA', 'MEX', 'GTM', 'ECU'])); if (!t) return; disaster(t, 1 + rnd(), '🌋 Виверження вулкана', '🌋');
      if (rnd() < 0.35) { N.forEach(n => n.mods.push({ r: 'grain', mul: 0.95, until: G.day + 365 })); G.say('🌋 Попіл у стратосфері: «рік без літа», світовий урожай зерна −5%', 'big'); } } },
    { id: 'heat', p: 0.0025, f() { const al = N.filter(n => n.alive && n.agg && n.agg.gdp > 50); const n = pick(al); if (!n) return; n.mods.push({ growth: -0.008, until: G.day + 60 }, { r: 'grain', mul: 0.92, until: G.day + 150 }); G.say(`🌡 Аномальна спека — ${n.name}: блекаути, падає врожай`, n.id === G.player ? 'bad' : 'info', [n.id]); } },
    { id: 'solar', p: 0.00035, f() { N.forEach(n => { if (n.alive && n.tech > 1.1) { n.infraLvl = Math.max(0.1, n.infraLvl - 0.03); n.mods.push({ r: 'chips', mul: 0.9, until: G.day + 60 }); } }); G.say('☀ Потужна сонячна буря: збої супутників і енергомереж у розвинених країнах', 'big'); } },
    { id: 'meteor', p: 0.00004, f() { const t = pick(ter.filter(t => t.owner >= 0)); disaster(t, 2.2, '☄ Падіння метеорита', '☄'); } }
  ];
  const EVENTS = [
    { id: 'drought', p: 0.006, f() { const c = ter.filter(t => t.prod.grain > 3); const t = pick(c); const n = N[t.ctrl]; n.mods.push({ r: 'grain', mul: 0.75, until: G.day + 200 }); G.say(`🌵 Посуха — ${n.name} (${T[t.i].n}): урожай зерна падає`, 'bad', [n.id]); } },
    { id: 'storm', p: 0.004, f() { const i = Math.floor(rnd() * SN.length); G.seaClosed[i] = G.day + 5 + Math.floor(rnd() * 10); G.say(`🌀 Шторм: судноплавство через «${SN[i].n}» призупинено`, 'info'); G.tradeDirty = true; } },
    { id: 'redsea', p: 0.0012, f() { const i = SN.findIndex(s => s.id === 'BAB'); G.seaClosed[i] = G.day + 60 + Math.floor(rnd() * 90); G.say('🚀 Атаки на судна в Баб-ель-Мандебі: маршрут через Суец закрито, кораблі йдуть навколо Африки', 'bad'); G.tradeDirty = true; } },
    { id: 'opec', p: 0.0015, f() { ['SAU', 'RUS', 'ARE', 'IRQ', 'KWT', 'KAZ', 'DZA', 'OMN'].map(a => nIdx[a]).filter(x => x != null && N[x].alive && x !== G.player).forEach(x => N[x].mods.push({ r: 'oil', mul: 0.93, until: G.day + 180 })); G.say('🛢 ОПЕК+ скорочує видобуток нафти на 7% на пів року', 'info'); } },
    { id: 'crisis', p: 0.0005, f() { G.worldMod = { growth: -0.015, until: G.day + 270 }; G.say('📉 Світова фінансова криза: зростання сповільнюється', 'bad'); } },
    { id: 'pandemic', p: 0.0003, f() { G.worldMod = { growth: -0.028, until: G.day + 300, kind: 'pandemic' }; N.forEach(n => n.stab -= 5); G.say('🦠 Пандемія: ланцюги постачання порушені, світова економіка падає', 'bad'); } },
    { id: 'breakthrough', p: 0.003, f() { const al = N.filter(n => n.alive && n.pol.res > 0.015); const n = pick(al); if (!n) return; n.tech += 0.03; G.say(`🔬 Технологічний прорив — ${n.name}`, 'good', [n.id]); } },
    { id: 'deposit', p: 0.002, f() { const r = pick(['oil', 'gas', 'metal', 'rare', 'nonfer', 'uranium']); const t = pick(ter); const add = Math.max(G.W_prod0[r] * 0.008, t.prod[r] * 0.2); t.prod[r] += add; G.say(`⛏ Нове родовище (${G.RI[r].n.toLowerCase()}) — ${T[t.i].n}`, 'good', [t.owner]); } },
    { id: 'protests', p: 0.002, f() { const al = N.filter(n => n.alive && n.stab < 35); const n = pick(al); if (!n) return; n.stab -= 6; n.mods.push({ growth: -0.02, until: G.day + 90 }); G.say(`📢 Масові протести — ${n.name}`, 'bad', [n.id]); if (n.stab < 10 && n.id !== G.player) G.coup(n); } },
    { id: 'hurricane', p: 0.0015, f() { const n = N[nIdx.USA]; if (!n || !n.alive) return; n.mods.push({ r: 'oil', mul: 0.9, until: G.day + 25 }); G.say('🌪 Ураган у Мексиканській затоці: видобуток нафти у США тимчасово впав', 'info', [n.id]); } },
    { id: 'cyber', p: 0.0015, f() { const al = N.filter(n => n.alive && n.agg && n.agg.gdp > 300); const n = pick(al); if (!n) return; n.infraLvl = Math.max(0.1, n.infraLvl - 0.03 * (1 - (n.rx ? n.rx.cyber : 0))); G.say(`💻 Кібератака на логістику й енергомережі — ${n.name}`, 'bad', [n.id]); } },
    { id: 'diplo', p: 0.0025, f() { const al = N.filter(n => n.alive); const a = pick(al), b = pick(al); if (a === b) return; const d = rnd() < 0.5 ? -12 : 10; rel[a.id][b.id] = clamp(rel[a.id][b.id] + d, -100, 100); rel[b.id][a.id] = rel[a.id][b.id]; G.say(d < 0 ? `⚡ Дипломатичний скандал: ${a.name} — ${b.name}` : `🤝 Візит на найвищому рівні: ${a.name} — ${b.name}`, 'info', [a.id, b.id]); } }
  ];
  G.EVENTS = EVENTS;
  G.coup = function (n) {
    if (n.id === G.player) { G.gameOver = { win: false, text: `Уряд ${n.name} повалено внаслідок масових протестів. Стабільність впала до критичної позначки.` }; LORA.bus.emit('gameover', G.gameOver); return; }
    n.stab = 45; n.pol = Object.assign({}, n.basePol); G.say(`🔥 Переворот — ${n.name}: до влади прийшов новий уряд`, 'big', [n.id]);
    for (let j = 0; j < G.NN; j++) if (j !== n.id) rel[n.id][j] = rel[j][n.id] = rel[n.id][j] * 0.5;
  };
  G.unrest = function () {
    ter.forEach(t => {
      if (t.owner === t.core || t.ctrl !== t.owner) return;
      const o = N[t.owner];
      if (t.integ < 0.6 && o.stab < 45 && rnd() < 0.0008 * (1 - t.integ)) {
        const c = N[t.core]; t.owner = c.id; t.ctrl = c.id; t.integ = 0.6;
        if (!c.alive) { c.alive = true; c.home = t.i; c.stab = 55; c.cash = t.gdp * 0.02; c.debt = t.gdp * 0.3; }
        G.newArmy(c.id, t.i, Math.max(5, t.pop * 2), 'Повстанська армія');
        G.say(`✊ Повстання! ${c.name} повертає ${T[t.i].n} (вихід зі складу: ${o.name})`, 'big', [c.id, o.id]);
        G.refreshNation(o.id);
      }
    });
  };
  G.directorDaily = function () {
    const bad = G.diff ? G.diff.badEvents : 1; const BAD = { drought: 1, redsea: 1, crisis: 1, pandemic: 1, protests: 1, cyber: 1, hurricane: 1, storm: 1 };
    EVENTS.forEach(e => { if (rnd() < e.p * (BAD[e.id] ? bad : 1)) e.f(); });
    CAT.forEach(e => { if (rnd() < e.p * bad) e.f(); });
    N.forEach(n => { if (n.mods.length) n.mods = n.mods.filter(m => m.until > G.day); });
    G.unrest();
    G.tension = 1 + G.wars.size * 0.05;
    const pn = N[G.player];
    if (pn && pn.alive && pn.stab < 6 && G.day % 10 === 0 && rnd() < 0.15) G.coup(pn);
  };
});
