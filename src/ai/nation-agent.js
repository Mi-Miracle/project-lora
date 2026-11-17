// ШІ-АГЕНТ ДЕРЖАВИ. Кожна держава (крім гравця) має свого агента з характером (data/ai/profiles.js).
// Агент: 1) веде бюджет і мобілізацію; 2) командує арміями й флотами; 3) веде дипломатію (війни, мир, санкції).
// Рішення про наступ ухвалюються з розрахунком сил на кілька кроків уперед: чи вистачить сил, хто з союзників ворога втрутиться,
// чи не оголить агент власну столицю. Розширювати поведінку — тут і в профілях.
LORA.sim.register('ai-nations', 70, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav; const rel = G.rel;
  // ---------- профілі ----------
  const PROF = G.D.aiProfiles || {};
  N.forEach(n => {
    const p = PROF[n.a3] || {};
    const inNato = G.alliances.some(a => a.name === 'НАТО' && a.m.has(n.id)), inCsto = G.alliances.some(a => a.name === 'ОДКБ' && a.m.has(n.id));
    n.ai = { aggr: p.aggr != null ? p.aggr : n.aggr, risk: p.risk != null ? p.risk : 0.35, econ: p.econ != null ? p.econ : 0.7, bloc: p.bloc || (inNato ? 'west' : inCsto ? 'east' : 'neutral'), style: p.style || 'unknown', goals: p.goals || [], red: (p.red || []).map(a => G.nIdx[a]).filter(x => x != null), memory: [], learn: 0, ops: [] };
    n.aggr = n.ai.aggr;
  });
  const goalTargets = n => n.ai.goals.map(g => { const m = g.match(/_(\w{3})$/); return m ? G.nIdx[m[1]] : null; }).filter(x => x != null);

  // ---------- бюджет ----------
  G.aiPolicy = function (n) {
    const war = G.enemiesOf(n.id).length > 0;
    // екзистенційна загроза: під окупацією чи наступом понад 4% населення країни (прикордонний рейд — ще ні)
    let lostPop = 0, ownPop = 0; if (war) ter.forEach(t => { if (t.owner !== n.id) return; ownPop += t.pop; if (t.ctrl !== n.id || t.occ) lostPop += t.pop; });
    const exist = war && lostPop > ownPop * 0.04;
    // загроза: сусіди з поганими відносинами і великою армією
    let threat = 0; const myP = G.nationPower(n.id) + 1;
    const neigh = new Set(); ter.forEach((t, i) => { if (t.ctrl === n.id) T[i].nb.forEach(j => { if (ter[j].ctrl !== n.id) neigh.add(ter[j].ctrl); }); });
    neigh.forEach(x => { if (rel[n.id][x] < -40 && !G.allied(n.id, x)) threat = Math.max(threat, G.nationPower(x) / myP); });
    n.ai.threat = threat;
    const targetMil = war ? Math.max(n.basePol.mil, exist ? 0.18 : 0.07) : n.basePol.mil * (threat > 2 ? 1.3 : 1);
    n.pol.mil += clamp(targetMil - n.pol.mil, -0.003, 0.01);
    n.pol.mob = war ? Math.min(0.06, Math.max(n.basePol.mob, exist ? 0.03 : n.basePol.mob * 1.06)) // наступальна війна без загрози — часткова мобілізація
      : n.pol.mob + (n.basePol.mob - n.pol.mob) * 0.1;
    const debtR = n.debt / Math.max(1, n.agg.gdp);
    const deficitTarget = debtR > 1.2 ? -0.005 : debtR > 0.8 ? 0.01 : 0.025;
    const spend = n.pol.mil + n.pol.infra + n.pol.res + (n.dev ? n.dev.invest : 0) + debtR * (n.rate || 0.03) - (n.aidIn || 0) / Math.max(1, n.agg.gdp);
    n.pol.soc = clamp(n.pol.tax + deficitTarget - spend + (n.stab < 35 ? 0.02 : 0), 0.02, 0.4);
    if (n.pol.soc <= 0.02 && n.pol.tax < 0.45) n.pol.tax = +(n.pol.tax + 0.005).toFixed(3);
    if (!war && n.basePol.mil > 0.1) n.basePol.mil = Math.max(0.03, n.basePol.mil - 0.01);
    // економіко-орієнтовані агенти більше вкладають в інфраструктуру й науку
    n.pol.infra = clamp(n.basePol.infra * (0.8 + 0.4 * n.ai.econ), 0.01, 0.06);
    // мобілізація/демобілізація
    const pool = n.agg.pop * 1000 * n.pol.mob, tr = G.troopsOf(n.id);
    if (tr < pool * 0.95 && n.debt < n.agg.gdp * 2.5) {
      const add = Math.min(pool - tr, Math.max(2, pool * 0.04));
      const here = G.armies.filter(a => a.n === n.id && ter[a.t].ctrl === n.id).sort((x, y) => x.k - y.k)[0];
      if (here && here.k < 300) here.k += add; else if (add > 5) { G.aiTemplate(n); G.newArmy(n.id, n.home, add); }
    } else if (tr > pool * 1.25 && !war) { const a = G.armies.filter(x => x.n === n.id).sort((x, y) => y.k - x.k)[0]; if (a) a.k -= Math.min(a.k * 0.1, tr - pool); }
  };

  // ---------- армії ----------
  G.aiArmies = function (n) {
    const enemies = G.enemiesOf(n.id);
    const mine = G.armies.filter(a => a.n === n.id && a.auto);
    const P = a => G.armyPower(a);
    const RAW = a => a.k * N[a.n].q * (0.25 + 0.75 * a.org) * (0.3 + 0.7 * a.sup); // наступальна сила без бонусів оборони
    if (!enemies.length) {
      mine.forEach(a => { if (!a.mv && !G.friendlyTo(n.id, ter[a.t].ctrl)) G.orderMove(a, n.home); });
      // мирний час: зміщення до кордонів із загрозою
      if (n.ai.threat > 1.2 && G.rnd() < 0.2) { const border = ter.filter(t => t.ctrl === n.id && T[t.i].nb.some(j => rel[n.id][ter[j].ctrl] < -40)); const idle = mine.filter(a => !a.mv && a.t === n.home); if (border.length && idle.length > 1) G.orderMove(idle[0], U.pick(border, G.rnd).i); }
      return;
    }
    const enemySet = new Set(enemies);
    // 0) Оспорювані регіони: переходити в наступ лише при перевазі, інакше — тримати позиції
    mine.forEach(a => {
      if (a.mv) return; const here = G.armies.filter(x => x.t === a.t);
      const en = here.filter(x => G.atWar(x.n, n.id)); if (!en.length) return;
      const myP = here.filter(x => !G.atWar(x.n, n.id)).reduce((s, x) => s + P(x), 0), enP = en.reduce((s, x) => s + P(x), 0);
      const was = a.stance;
      a.stance = myP > enP * (G.B.attackNeed + 0.1 + (1 - n.ai.risk) * G.B.attackNeedRisk * 0.8 + n.ai.learn) && a.org > 0.6 && a.sup > 0.55 ? 'attack' : 'hold';
      if (a.stance === 'attack' && was !== 'attack') G.recordOp(n, a.t, [a]);
    });
    // 1) Лінія фронту: свої/союзні регіони поруч із ворожими або з ворогом усередині
    const front = [];
    ter.forEach((t, i) => {
      const mineR = t.ctrl === n.id || (G.allied(t.ctrl, n.id) && enemies.some(e => G.atWar(e, t.ctrl)));
      if (!mineR) return;
      let inside = 0, adj = 0;
      for (const x of G.armies) { if (!G.atWar(x.n, n.id) || (x.mv && x.mv.sea)) continue; if (x.t === i) inside += RAW(x); else if (T[i].nb.includes(x.t)) adj += RAW(x); }
      const border = T[i].nb.some(j => enemySet.has(ter[j].ctrl));
      if (!border && !inside && !(t.occ && enemySet.has(t.occ.by))) return;
      const threat = inside * 1.2 + adj * 0.6 + (border ? 8 : 0) + (t.occ ? t.occ.p : 0);
      let def = 0; for (const x of G.armies) if (x.n === n.id && (x.t === i || (x.mv && x.mv.dst === i))) def += x.k * n.q;
      front.push({ i, threat: threat * (i === n.home ? 1.6 : 1) * (t.ctrl === n.id ? 1 : 0.6), def, inside });
    });
    G._front = G._front || {}; G._front[n.id] = front.map(f => f.i);
    // 2) Розділення великих армій, якщо ділянок фронту більше, ніж армій
    let myIdle = mine.filter(a => !a.mv && a.train <= 0 && !G.armies.some(x => x.t === a.t && G.atWar(x.n, a.n)));
    let guard = 0;
    while (myIdle.length < Math.min(front.length, 14) && guard++ < 6) { const big = myIdle.sort((x, y) => y.k - x.k)[0]; if (!big || big.k < 60) break; const b = G.newArmy(n.id, big.t, big.k / 2, big.name.replace(/(-р|-2)+$/, '') + '-2'); b.comp = Object.assign({}, G.armyComp(big)); b.org = big.org; b.sup = big.sup; b.auto = true; big.k /= 2; myIdle.push(b); }
    // 2б) Прорив у тил: ворог у регіоні без жодного захисника — виділити загін із найближчої армії, що не веде бою
    const pocket = i => { const nb = T[i].nb; return nb.length && nb.filter(j => G.atWar(ter[j].ctrl, n.id)).length / nb.length >= 0.6; }; // не кидати резерви в котел
    const breach = front.filter(f => f.inside > 0 && f.def < f.inside * 0.5 && !pocket(f.i)).sort((x, y) => y.threat - x.threat).slice(0, 3);
    breach.forEach(f => {
      const cand = mine.filter(a => !a.mv && a.k > 40 && !G.armies.some(x => x.t === a.t && G.atWar(x.n, a.n)))
        .map(a => ({ a, d: hav(T[a.t].c[0], T[a.t].c[1], T[f.i].c[0], T[f.i].c[1]) })).filter(o => o.d < 900).sort((x, y) => x.d - y.d)[0];
      if (!cand) return; const a = cand.a; const need = Math.min(a.k * 0.45, f.inside * 1.3 / Math.max(0.3, n.q) + 10);
      const b = G.newArmy(n.id, a.t, need, a.name.replace(/(-р|-2)+$/, '') + '-р'); b.comp = Object.assign({}, G.armyComp(a)); b.org = a.org; b.sup = a.sup; b.auto = true; a.k -= need;
      if (G.orderMove(b, f.i).ok) { f.def += need * n.q; myIdle = myIdle.filter(x => x !== a); } else { a.k += need; G.armies = G.armies.filter(x => x !== b); }
    });
    // 3) Розподіл резервів: армія йде туди, де найбільший дефіцит оборони (з урахуванням відстані)
    const idle = [];
    myIdle.forEach(a => {
      const here = front.find(f => f.i === a.t);
      if (here && here.def - a.k * n.q < here.threat * 1.1) { idle.push(a); return; } // тримає ділянку, але може наступати з неї на сусідній регіон
      let best = null, bv = 0;
      front.forEach(f => { const deficit = f.threat * 1.15 - f.def; if (deficit <= 0) return; const d = hav(T[a.t].c[0], T[a.t].c[1], T[f.i].c[0], T[f.i].c[1]); const v = deficit / (1 + d / 400); if (v > bv) { bv = v; best = f; } });
      if (best && best.i !== a.t && bv > 3) { const r = G.orderMove(a, best.i); if (r.ok) { best.def += a.k * n.q; return; } }
      idle.push(a);
    });
    // наступ: концентрація сил проти найслабшої ділянки з урахуванням підходу ворожих резервів
    const used = new Set(); const targets = new Set();
    idle.forEach(a => T[a.t].nb.forEach(j => { if (enemySet.has(ter[j].ctrl)) targets.add(j); }));
    const goalT = new Set(goalTargets(n));
    const scored = [...targets].map(j => {
      let dp = 0, reserve = 0;
      for (const x of G.armies) { if (!G.atWar(x.n, n.id) || (x.mv && x.mv.sea)) continue; if (x.t === j) dp += G.armyPower(x); else if (T[j].nb.includes(x.t)) reserve += G.armyPower(x) * 0.5; }
      const t = ter[j];
      const v = t.gdp / 300 + (t.core === n.id || t.owner === n.id ? 4 : 0) + (goalT.has(t.owner) ? 2 : 0) + (j === N[t.ctrl].home ? 3 : 0) - (dp + reserve) / 1500 - (G.TERRAIN[T[j].t].def - 1) * 2;
      return { j, dp: dp + reserve, v };
    }).sort((x, y) => y.v - x.v);
    let need = G.B.attackNeed + (1 - n.ai.risk) * G.B.attackNeedRisk + n.ai.learn;
    // тактика виснаження: агресивний агент із перевагою в людях готовий до дорогих штурмів
    const enemyTroops = enemies.reduce((s, e) => s + G.troopsOf(e), 0);
    if (n.ai.aggr > 0.35 && G.troopsOf(n.id) > enemyTroops * 1.25) need *= G.B.attritionNeed;
    n.ai.need = need;
    for (const tg of scored) {
      const avail = idle.filter(a => !used.has(a.id) && T[a.t].nb.includes(tg.j)).sort((x, y) => y.k - x.k);
      let sum = 0; const grp = [];
      for (const a of avail) { sum += a.k * n.q * (0.25 + 0.75 * a.org) * (0.3 + 0.7 * a.sup); grp.push(a); if (sum > tg.dp * need * 1.25) break; }
      if (grp.length && sum > tg.dp * need * G.TERRAIN[T[tg.j].t].def && grp.every(a => a.org > 0.55 && a.sup > 0.5)) { grp.forEach(a => { used.add(a.id); G.orderMove(a, tg.j); }); G.recordOp(n, tg.j, grp); }
    }
    // підтягування резервів до фронту
    for (const a of idle) {
      if (used.has(a.id) || a.mv || T[a.t].nb.some(j => enemySet.has(ter[j].ctrl)) || front.some(f => f.i === a.t)) continue;
      let tgt = null, bd = Infinity;
      ter.forEach((t, i) => { if (!G.friendlyTo(n.id, t.ctrl) || G.atWar(n.id, t.ctrl) || !T[i].nb.some(j => enemySet.has(ter[j].ctrl))) return; const d = hav(T[a.t].c[0], T[a.t].c[1], T[i].c[0], T[i].c[1]); if (d < bd) { bd = d; tgt = i; } });
      if (tgt != null && bd < 7000) G.orderMove(a, tgt);
      else if (G.shipsOf(n.id) > 20 && G.rnd() < 0.3) {
        const e = ter.filter(t => enemySet.has(t.ctrl) && T[t.i].p.length).sort((x, y) => hav(T[a.t].c[0], T[a.t].c[1], T[x.i].c[0], T[x.i].c[1]) - hav(T[a.t].c[0], T[a.t].c[1], T[y.i].c[0], T[y.i].c[1]))[0];
        if (e) G.orderMove(a, e.i, true);
      }
    }
  };
  // ---------- навчання на досвіді ----------
  // Кожен наступ записується; через 25 днів агент оцінює результат і коригує свою обережність (n.ai.learn).
  G.recordOp = function (n, region, armies) {
    if (n.ai.ops.some(o => o.region === region && G.day - o.day < 30)) return;
    const k = armies.reduce((s, a) => s + a.k, 0); const t = ter[region];
    n.ai.ops.push({ day: G.day, region, ids: armies.map(a => a.id), k, occ0: t.occ && t.occ.by === n.id ? t.occ.p : 0, ctrl0: t.ctrl });
  };
  G.evalOps = function (n) {
    const keep = [];
    for (const o of n.ai.ops) {
      if (G.day - o.day < 25) { keep.push(o); continue; }
      const t = ter[o.region]; const alive = G.armies.filter(a => o.ids.includes(a.id)); const kNow = alive.reduce((s, a) => s + a.k, 0);
      const gained = (t.ctrl === n.id && o.ctrl0 !== n.id) || (t.occ && t.occ.by === n.id && t.occ.p - o.occ0 > 15);
      const lossShare = 1 - kNow / Math.max(1, o.k);
      let d = 0.01;
      if (gained && lossShare < 0.25) d = -0.05; else if (gained) d = -0.02; else if (lossShare > 0.2) d = 0.07;
      n.ai.learn = clamp(n.ai.learn + d, -0.25, 0.6);
      n.ai.memory.push({ day: G.day, region: o.region, ok: gained, loss: +lossShare.toFixed(2) }); if (n.ai.memory.length > 20) n.ai.memory.shift();
    }
    n.ai.ops = keep;
    n.ai.learn *= 0.995; // поступово «забуває» старі невдачі
  };
  G.aiFleets = function (n) {
    const enemies = G.enemiesOf(n.id);
    G.fleets.filter(f => f.n === n.id && f.auto && !f.mv).forEach(f => {
      const SN = G.D.sea.nodes;
      if (!enemies.length) { const h = G.nationPorts(n.id)[0]; if (h && f.node !== h[0] && G.rnd() < 0.2) G.orderFleet(f, h[0]); return; }
      let tgt = null, bd = Infinity;
      G.fleets.forEach(e => { if (!enemies.includes(e.n)) return; if (e.s * N[e.n].navQ > f.s * N[f.n].navQ * 0.9) return; const d = hav(SN[f.node].lon, SN[f.node].lat, SN[e.node].lon, SN[e.node].lat); if (d < bd) { bd = d; tgt = e.node; } });
      if (tgt == null) enemies.forEach(e => { const p = G.nationPorts(e)[0]; if (!p) return; const d = hav(SN[f.node].lon, SN[f.node].lat, SN[p[0]].lon, SN[p[0]].lat); if (d < bd) { bd = d; tgt = p[0]; } });
      if (tgt != null && tgt !== f.node && bd < 15000) G.orderFleet(f, tgt);
    });
  };

  // ---------- дипломатія ----------
  G.aiDiplomacy = function (n) {
    if (G.isHuman(n.id)) return;
    const ai = n.ai;
    // рішення про війну (рідко, з розрахунком наперед)
    if (ai.aggr > 0.05 && !G.enemiesOf(n.id).length && G.day - n.lastWarDecl > 720 && G.day > 60 && n.stab > 35) {
      const myP = G.nationPower(n.id);
      const neigh = new Set(); ter.forEach((t, i) => { if (t.ctrl === n.id) T[i].nb.forEach(j => { if (ter[j].ctrl !== n.id) neigh.add(ter[j].ctrl); }); });
      const goalT = new Set(goalTargets(n));
      neigh.forEach(x => {
        if (!N[x].alive || G.allied(n.id, x)) return;
        const want = rel[n.id][x] < -45 || (goalT.has(x) && rel[n.id][x] < -20);
        if (!want || (N[x].nuke && (!n.nuke || ai.risk < 0.8))) return;
        // прогноз: сила цілі + очікувана допомога союзників ворога
        let defP = G.nationPower(x);
        G.alliances.forEach(al => { if (al.m.has(x) && !al.m.has(n.id)) al.m.forEach(m => { if (m !== x) defP += G.nationPower(m) * (al.name === 'НАТО' ? 0.6 : 0.4); }); });
        if (ai.red.some(r => G.allied(r, x))) defP *= 1.5;
        const needRatio = 2.8 - ai.risk;
        const chance = ai.aggr * G.B.aggrScale * 0.05 * (G.tension || 1) * (goalT.has(x) ? 2 : 1);
        if (myP > defP * needRatio && G.rnd() < chance) G.declareWar(n.id, x);
      });
    }
    // мир
    G.enemiesOf(n.id).forEach(e => {
      const w = G.wars.get(G.warKey(n.id, e)); if (!w || G.day - w.start < 120) return;
      const s = G.warScore(n.id, e);
      if (G.isHuman(e)) {
        if (G.rnd() < 0.15 && !G.pendingPeace.some(p => p.from === n.id && p.type !== 'ally_call')) {
          const holdMine = ter.filter(t => t.owner === e && t.ctrl === n.id).length, holdTheirs = ter.filter(t => t.owner === n.id && t.ctrl === e).length;
          const type = s > 0.25 ? 'cede_to_ai' : s < -0.25 ? 'cede' : holdMine > holdTheirs ? 'mutual' : 'white'; // хто тримає чужі землі — пропонує заморозку лінії фронту
          if (n.warExh > 0.3 || Math.abs(s) > 0.25) if (!G.pendingPeace.some(p => p.from === n.id && p.to === e)) G.pendingPeace.push({ type, from: n.id, to: e });
        }
        return;
      }
      if (s > 0.3 && G.aiPeaceAnswer(e, n.id, 'cede') && G.rnd() < 0.3) { G.say(`📜 Мир із поступками: ${G.nm(e)} → ${G.nm(n.id)}`, 'big', [n.id, e]); G.makePeace(n.id, e, 'cede'); }
      else if (Math.abs(s) < 0.2 && G.rnd() < 0.15) { // заморожування: жертва окупації погоджується лише при сильному виснаженні
        const victim = ter.some(t => t.owner === e && t.ctrl === n.id) ? e : ter.some(t => t.owner === n.id && t.ctrl === e) ? n.id : -1;
        if (victim < 0 ? n.warExh + N[e].warExh > 0.6 : N[victim].warExh > 0.8 && n.warExh + N[e].warExh > 1.1) G.makePeace(n.id, e, 'mutual'); }
    });
    // дрейф відносин до базових
    for (let j = 0; j < G.NN; j++) { if (j === n.id || G.atWar(n.id, j)) continue; rel[n.id][j] += (G.relBase[n.id][j] - rel[n.id][j]) * 0.01; }
    if (G.rnd() < 0.05) for (let j = 0; j < G.NN; j++) if (G.sanctions.has(n.id + '>' + j) && rel[n.id][j] > 30 && !G.atWar(n.id, j)) { G.sanctions.delete(n.id + '>' + j); G.say(`🤝 ${n.name} знімає санкції (${G.nm(j)})`, 'info', [n.id, j]); G.tradeDirty = true; }
  };
});
