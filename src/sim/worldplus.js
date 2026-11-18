// СВІТ+: виснаження родовищ і розвідка надр, екологія (забруднення), кліматичні лиха й міграція,
// торгові війни (мита й ембарго), подвійні агенти, світові події (Олімпіада, Чемпіонат світу, Expo),
// глядачі-генерали й донати чату, імпічмент у режимі «Президент і Рада».
LORA.sim.register('worldplus', 99.7, function (G) {
  const { N, ter, T } = G; const D = G.D, BD = D.buildings; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const EXTR = ['oil', 'gas', 'coal', 'uranium', 'metal', 'nonfer', 'rare'];
  G.tariffs = G.tariffs || {}; G.embargo = G.embargo || {};
  // ---------- 5. виснаження родовищ
  G.deplOf = (t, r) => (t.depl && t.depl[r]) || 0;
  G.depletionMonthly = function () {
    for (const t of ter) {
      for (const r of EXTR) {
        const p = (t.prod[r] || 0); let b = 0; for (const k in t.bld) { const B = BD[k]; if (B && B.out && B.out[r]) b += t.bld[k]; } if (p <= 0 && !b) continue;
        const n = N[t.ctrl]; const slow = n && (G.has(n, 'drilling') || G.has(n, 'auto_mining')) ? 0.7 : 1;
        t.depl = t.depl || {}; t.depl[r] = clamp((t.depl[r] || 0) + 0.0005 * (1 + Math.min(3, b * 0.3)) * slow, 0, 0.6);
      }
    }
  };
  G.exploreCost = i => +(0.15 + ter[i].gdp * 0.01).toFixed(3);
  G.explore = function (nid, i) {
    const t = ter[i]; if (!t || t.owner !== nid || t.ctrl !== nid) return { ok: false, err: 'Лише у власному регіоні' }; if (!t.depl || !Object.values(t.depl).some(v => v > 0.05)) return { ok: false, err: 'Родовища ще не виснажені' };
    const n = N[nid], c = G.exploreCost(i); if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; n.cash -= c;
    const found = G.rnd() < 0.6; for (const r in t.depl) t.depl[r] = Math.max(0, t.depl[r] - (found ? 0.2 : 0.05));
    return { ok: true, msg: found ? 'Геологи знайшли нові поклади: виснаження −20%' : 'Розвідка майже нічого не дала (−5%)' };
  };
  // ---------- 5. екологія: забруднення держави 0..100
  const DIRTY = { coal_mine: 3, coal_plant: 5, refinery: 3, oil_field: 2, gas_plant: 1.5, steel_plant: 3, chem_plant: 2, fert_plant: 1.5, ore_mine: 1.5, nonfer_mine: 1.5 };
  const CLEAN = { solar_farm: 2, wind_farm: 2, offshore_wind: 2, renewables: 2, geothermal: 2, hydro_plant: 1.5, npp: 2, smr: 1, fusion_plant: 3, battery_storage: 1, hydrogen_plant: 1 };
  G.ecologyMonthly = function () {
    const dirt = {}, clean = {}, regs = {};
    for (const t of ter) { const o = t.owner; regs[o] = (regs[o] || 0) + 1; for (const k in t.bld) { if (DIRTY[k]) dirt[o] = (dirt[o] || 0) + DIRTY[k] * t.bld[k]; if (CLEAN[k]) clean[o] = (clean[o] || 0) + CLEAN[k] * t.bld[k]; } }
    let w = 0, wn = 0;
    N.forEach(n => {
      if (!n.alive) return; const d = dirt[n.id] || 0, c = clean[n.id] || 0; const green = (G.has(n, 'green_h2') ? 5 : 0) + (G.has(n, 'perovskite') ? 5 : 0) + (G.has(n, 'fusion') ? 15 : 0);
      const tgt = clamp(d / (d + c * 1.6 + 25) * 95 * Math.min(1, (n.agg.gdp || 0) / 300 + 0.4) - green, 0, 100);
      n.poll = (n.poll == null ? tgt : n.poll + (tgt - n.poll) * 0.08); if (n.poll > 70) { n.stab = Math.max(0, n.stab - (n.poll - 70) * 0.012); } w += n.poll * (n.agg.gdp || 0); wn += (n.agg.gdp || 0);
    });
    G.worldPoll = wn ? w / wn : 30;
  };
  // ---------- 6. кліматичні лиха (частота росте зі світовим забрудненням) + міграція
  G.climateMonthly = function () {
    const k = 0.5 + (G.worldPoll || 30) / 60; if (G.rnd() > 0.35 * k) return;
    const kind = pick(['drought', 'flood', 'fire', 'heat']); const cand = ter.filter(t => t.owner >= 0 && t.owner === t.ctrl && N[t.owner].alive && (kind !== 'drought' || (t.prod.grain || 0) > 1)); const t = pick(cand); if (!t) return; const n = N[t.owner];
    const L = { drought: ['🌵 Кліматична посуха', () => { n.mods.push({ r: 'grain', mul: 0.85, until: G.day + 180 }); }], flood: ['🌊 Катастрофічна повінь', () => { t.dmg = Math.min(0.7, t.dmg + 0.12); t.gdp *= 0.96; }], fire: ['🔥 Лісові пожежі', () => { t.dmg = Math.min(0.7, t.dmg + 0.06); t.gdp *= 0.98; }], heat: ['🌡 Смертельна спека', () => { n.mods.push({ growth: -0.006, until: G.day + 90 }); t.pop *= 0.999; }] }[kind];
    L[1](); n.stab = Math.max(0, n.stab - 2);
    // міграція: частина населення тікає до сусідніх держав
    const mig = t.pop * (kind === 'flood' ? 0.01 : 0.004); t.pop -= mig; const nbs = [...new Set(T[t.i].nb.map(j => ter[j].owner))].filter(x => x !== n.id && x >= 0 && N[x].alive);
    nbs.forEach(x => { const hr = ter.find(q => q.owner === x && q.ctrl === x); if (hr) hr.pop += mig / nbs.length; N[x].stab = Math.max(0, N[x].stab - 0.4); });
    G.say(`${L[0]} — ${n.name} (${T[t.i].n})${nbs.length ? `: ${Math.round(mig * 1000)} тис. кліматичних мігрантів` : ''}`, n.id === G.player ? 'bad' : 'info', [n.id, ...nbs]);
  };
  // ---------- 7. торгові війни
  G.setTariff = function (a, b, rate) {
    rate = clamp(+rate || 0, 0, 1); const k = a + '>' + b; if (!rate) delete G.tariffs[k]; else G.tariffs[k] = rate; G.tradeDirty = true;
    if (rate) { G.rel[a][b] = G.rel[b][a] = clamp(G.rel[a][b] - rate * 20, -100, 100); if (b !== G.player && !(G.humans && G.humans.has(b)) && G.rnd() < 0.6) { G.tariffs[b + '>' + a] = rate; G.say(`⚖ ${N[b].name} відповідає дзеркальними митами ${Math.round(rate * 100)}% проти ${N[a].name}`, 'bad', [a, b]); } }
    return { ok: true };
  };
  G.setEmbargo = function (a, b, r, on) {
    const k = a + '>' + b; const L = new Set(G.embargo[k] || []); if (on) L.add(r); else L.delete(r); if (L.size) G.embargo[k] = [...L]; else delete G.embargo[k]; G.tradeDirty = true;
    if (on) { G.rel[a][b] = G.rel[b][a] = clamp(G.rel[a][b] - 6, -100, 100); G.say(`🚫 ${N[a].name} запроваджує ембарго на ${(G.RI && G.RI[r] ? G.RI[r].n : r).toLowerCase()} з ${N[b].name}`, 'info', [a, b]); }
    return { ok: true };
  };
  G.tradeBan = (exp, imp, r) => { const L = G.embargo[imp + '>' + exp] || G.embargo[exp + '>' + imp]; return !!(L && (L.includes(r) || L.includes('all'))); };
  G.extraTariff = (exp, imp) => G.tariffs[imp + '>' + exp] || 0;
  G.tariffMonthly = function () { (G.flows || []).forEach(f => { const r = G.tariffs[f.to + '>' + f.from]; if (r && f.val) { N[f.to].cash += f.val * r / 12; N[f.from].mods.push({ growth: -0.0004 * r, until: G.day + 31 }); } }); };
  // ---------- 8. подвійні агенти: спійманого ворожого шпигуна можна перевербувати
  G.doubleAgents = G.doubleAgents || [];
  const EV = G.DEC_EV;
  if (EV) EV.push({ id: 'double_agent', adv: 'intern', ok: () => false, t: () => null,
    o: [['Перевербувати: стане подвійним агентом', (n, c) => { G.doubleAgents.push({ by: n.id, on: c.x, until: G.day + 365 }); return `рік розвідданих про ${N[c.x].name}: її війська й плани видно, удари по ній точніші`; }],
        ['Публічно викрити й вислати', (n, c) => { G.rel[n.id][c.x] = G.rel[c.x][n.id] = clamp(G.rel[n.id][c.x] - 10, -100, 100); n.stab = Math.min(100, n.stab + 3); return 'стабільність +3, відносини −10'; }]] });
  G.spyCaught = function (victim, spyNat) { if (victim !== G.player || spyNat === G.player || G.decisions.some(d => d.ev === 'double_agent')) return; G.decisions.push({ id: G.nextId++, ev: 'double_agent', nid: victim, ctx: { x: spyNat, text: `Контррозвідка затримала агента ${N[spyNat].name}. Його можна перевербувати й передавати ворогу дезінформацію або публічно викрити.` }, d: G.day }); };
  const baseRecon = G.hasRecon; if (baseRecon) G.hasRecon = function (a, b) { if (G.doubleAgents.some(x => x.by === a && x.on === b && x.until > G.day)) return true; return baseRecon.apply(this, arguments); };
  // ---------- 9. світові події: Олімпіада, Чемпіонат світу, Expo
  G.WEV = { oly: { n: 'Олімпійські ігри', ic: '🏅', cost: 0.012, stab: 6, grow: 0.003, rel: 6, every: 4 }, cup: { n: 'Чемпіонат світу з футболу', ic: '⚽', cost: 0.008, stab: 5, grow: 0.002, rel: 4, every: 4 }, expo: { n: 'Всесвітня виставка Expo', ic: '🎪', cost: 0.005, stab: 2, grow: 0.004, rel: 3, every: 5 } };
  G.wev = G.wev || [];
  G.wevMonthly = function () {
    const y = Math.floor(G.day / 365);
    for (const [k, E] of Object.entries(G.WEV)) {
      // вибір господаря за 3 роки до події
      if (!G.wev.some(e => e.k === k && e.y >= y) && G.day % 365 < 31 && (y + 2) % E.every === 0) {
        G.wev.push({ k, y: y + 3, host: null, cand: [], vote: G.day + 180 }); G.say(`${E.ic} МОК/ФІФА відкриває прийом заявок: ${E.n} ${2026 + y + 3} року. Заявки — пів року`, 'info');
      }
    }
    G.wev.forEach(e => {
      const E = G.WEV[e.k];
      if (!e.host && G.day >= e.vote) {
        N.forEach(n => { if (n.alive && n.agg && n.agg.gdp > 400 && n.id !== G.player && !(G.humans && G.humans.has(n.id)) && !G.enemiesOf(n.id).length && G.rnd() < 0.08 && !e.cand.includes(n.id)) e.cand.push(n.id); });
        const sc = e.cand.filter(x => N[x].alive && !G.enemiesOf(x).length).map(x => ({ x, s: N[x].stab + Math.min(40, N[x].agg.gdp / 200) + (e.lobby && e.lobby[x] || 0) + G.rnd() * 25 })).sort((a, b) => b.s - a.s);
        e.host = sc.length ? sc[0].x : -1; if (e.host >= 0) { G.say(`${E.ic} ${E.n} ${2026 + e.y}: господар — ${N[e.host].name}!`, e.host === G.player ? 'good' : 'info', [e.host]); const n = N[e.host]; n.cash -= n.agg.gdp * E.cost * 0.5; } else e.host = -1;
      }
      if (e.host >= 0 && !e.done && G.day >= e.y * 365 + 200) {
        e.done = true; const n = N[e.host]; if (!n.alive) return;
        if (G.enemiesOf(n.id).length) { G.say(`${E.ic} ${E.n} у ${n.name} скасовано через війну. Гроші втрачено.`, 'bad', [n.id]); n.stab -= 3; return; }
        n.cash -= n.agg.gdp * E.cost * 0.5; n.stab = Math.min(100, n.stab + E.stab); n.mods.push({ growth: E.grow, until: G.day + 365 }); N.forEach(m => { if (m.alive && m.id !== n.id && G.rel[m.id][n.id] > -30) G.rel[m.id][n.id] = G.rel[n.id][m.id] = clamp(G.rel[m.id][n.id] + E.rel * 0.5, -100, 100); });
        G.say(`${E.ic} ${E.n} у ${n.name} пройшли блискуче: стабільність +${E.stab}, туристи й інвестиції`, n.id === G.player ? 'good' : 'info', [n.id]);
      }
    });
    G.wev = G.wev.filter(e => !e.done || G.day - e.y * 365 < 400);
  };
  G.wevApply = function (nid, idx) { const e = G.wev[idx]; if (!e || e.host != null) return { ok: false, err: 'Прийом заявок закрито' }; if (e.cand.includes(nid)) return { ok: false, err: 'Заявку вже подано' }; if (G.enemiesOf(nid).length) return { ok: false, err: 'Країна у війні — заявку не приймуть' }; const c = 0.2 + N[nid].agg.gdp * 0.0005; if (N[nid].cash < c) return { ok: false, err: 'Бракує коштів' }; N[nid].cash -= c; e.cand.push(nid); return { ok: true, msg: 'Заявку подано' }; };
  G.wevLobby = function (nid, idx) { const e = G.wev[idx]; if (!e || e.host != null || !e.cand.includes(nid)) return { ok: false, err: 'Спершу подайте заявку' }; const c = 0.3 + N[nid].agg.gdp * 0.0005; if (N[nid].cash < c) return { ok: false, err: 'Бракує коштів' }; N[nid].cash -= c; e.lobby = e.lobby || {}; e.lobby[nid] = (e.lobby[nid] || 0) + 8; return { ok: true, msg: 'Делегати задоволені (+8 до шансів)' }; };
  // ---------- 1–2. чат: донати, генерали-глядачі, шпигуни й дрони від глядачів
  G.chatDonate = function (user) { const amt = 0.01 + G.rnd() * 0.02; if (G.player >= 0) N[G.player].cash += amt; else if (G.pc >= 0) G.myCo().cash += amt; else if (G.leader) G.leader.money += amt * 0.05; G.say(`💛 ${user} підтримує: +$${(amt * 1000).toFixed(0)} млн`, 'good', G.player >= 0 ? [G.player] : []); return amt; };
  G.chatGeneral = function (user) {
    if (G.player < 0 || !G.generals) return null; const mine = G.generals.filter(g => g.n === G.player && !g.viewer); if (!mine.length) return null;
    const g = mine.sort((a, b) => a.skill - b.skill)[0]; g.name = user; g.viewer = 1; g.skill = Math.max(g.skill, 2); G.say(`🎖 Глядач ${user} очолив армію як генерал!`, 'good', [G.player]); return g;
  };
  G.chatSpy = function (user) {
    if (G.player < 0) return { ok: false }; const n = N[G.player]; const r = G.hireAgent(G.player, 'spy'); if (!r.ok) { n.cash += 0; return r; } const a = G.agents.find(x => x.id === r.id); a.name = user; a.viewer = 1;
    const en = G.enemiesOf(G.player); const tgt = en.length ? ter.find(t => t.ctrl === en[0]) : null; if (tgt) G.agentGo(a.id, tgt.i); return { ok: true };
  };
  G.chatDrone = function (user) {
    if (G.player < 0) return { ok: false }; const n = N[G.player]; const en = G.enemiesOf(G.player); if (!en.length) return { ok: false, err: 'Немає війни' }; if ((n.ars.strike || 0) < 20) return { ok: false, err: 'Немає ударних дронів' };
    const goal = pick(['energy', 'industry', 'military', 'rail']); const regs = ter.filter(t => en.includes(t.ctrl) && !G.canStrike(G.player, t.i, 'strike', 20)); const t = pick(regs); if (!t) return { ok: false, err: 'Немає досяжних цілей' };
    const r = G.strike(G.player, t.i, 'strike', 20, goal, true); if (r && r.ok !== false) G.say(`🛸 ${user} керує ударом дронів по ${T[t.i].n}!`, 'good', [G.player]); return r;
  };
  // ---------- 4. імпічмент (режим «Президент і Рада»): довіра нижче 20% — чат голосує за усунення
  G.impeachMonthly = function () {
    const R = G.rada; if (!R || !R.on || G.player < 0) return; if (R.trust >= 20 || R.bills.some(b => b.key === 'impeach') || (R.impT || 0) > G.day) return;
    R.impT = G.day + 180; R.bills.push({ id: R.next++, key: 'impeach', what: 'ІМПІЧМЕНТ: усунути президента з посади?', ic: '⚖', by: 'impeach', st: 'vote', d: G.day });
    G.say('⚖ Депутати-глядачі ініціюють імпічмент президента!', 'bad', [G.player]);
  };
  G.act.explore = i => G.player >= 0 ? G.explore(G.player, i) : { ok: false };
  G.act.setTariff = (b, r) => G.player >= 0 ? G.setTariff(G.player, b, r) : { ok: false };
  G.act.setEmbargo = (b, r, on) => G.player >= 0 ? G.setEmbargo(G.player, b, r, on) : { ok: false };
  G.act.wevApply = i => G.player >= 0 ? G.wevApply(G.player, i) : { ok: false };
  G.act.wevLobby = i => G.player >= 0 ? G.wevLobby(G.player, i) : { ok: false };
});
