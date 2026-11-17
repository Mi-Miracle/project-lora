// АГЕНТИ НА МАПІ: шпигуни й дипломати — окремі одиниці, що подорожують світом (як лідер).
// Шпигун: розвідка (бонус до наступу проти держави, видно склад її армій), викрадення технологій, диверсії,
// розхитування ситуації, підтримка партизанів, контррозвідка вдома. Ризик провалу щодня; спійманий — скандал.
// Дипломат (посол з особливими дорученнями): поки він у країні — відносини поступово ростуть, і можна покращувати
// відносини й укладати торговельні угоди без візиту лідера. До ворожої держави дипломат не поїде.
// ШІ теж веде таємну війну: ворожі агенти зрідка влаштовують диверсії, контррозвідка їх ловить.
LORA.sim.register('agents', 92.5, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const hav = (a, b) => { const r = Math.PI / 180, [lo1, la1] = T[a].c, [lo2, la2] = T[b].c; const s = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); };
  G.D.agentKinds = {
    spy: { n: 'Шпигун', ic: '🕵', px: 'spy', cost: 0.3, max: 3, d: 'Таємні операції в чужих країнах' },
    dip: { n: 'Дипломат', ic: '🎩', px: 'dipl', cost: 0.15, max: 3, d: 'Постійні переговори: відносини ростуть, угоди без візиту лідера' }
  };
  const TASKS = G.D.spyTasks = {
    recon:     { n: 'Розвідка', ic: '🔭', dur: 10, risk: 0.0015, d: 'Наступ проти цієї держави +6% на 45 днів; видно склад її армій' },
    steal:     { n: 'Викрасти технології', ic: '💾', dur: 45, risk: 0.004, d: 'Наближає ваш технологічний рівень до її; якщо ви попереду — продаєте секрети (+$0.2 млрд)' },
    sabotage:  { n: 'Диверсія', ic: '💥', dur: 25, risk: 0.006, d: 'Знищує рівень заводу, електростанції чи військового обʼєкта в регіоні агента' },
    unrest:    { n: 'Розхитати ситуацію', ic: '📢', dur: 30, risk: 0.004, d: 'Стабільність держави −3, внутрішній тиск +5%' },
    partisans: { n: 'Підтримати партизанів', ic: '🔥', dur: 20, risk: 0.003, d: 'Лише на окупованих ворогом територіях: партизанський рух сильнішає' },
    counter:   { n: 'Контррозвідка', ic: '🛡', dur: 0, risk: 0, d: 'Лише вдома: ворожі агенти частіше провалюються, диверсії рідшають' }
  };
  G.agents = G.agents || []; const ANAMES = { spy: ['«Сокіл»', '«Тінь»', '«Ворон»', '«Лис»', '«Сова»', '«Рись»'], dip: ['Посол Гончаренко', 'Посолка Коваль', 'Посол Мельник', 'Посолка Бондар', 'Посол Ткач', 'Посолка Шевчук'] };
  const ownerHome = nid => N[nid].home != null ? N[nid].home : ter.findIndex(t => t.owner === nid);
  G.agentsOf = nid => G.agents.filter(a => a.n === nid);
  G.hireAgent = function (nid, kind) {
    const K = G.D.agentKinds[kind], n = N[nid]; if (!K) return { ok: false, err: 'Невідомий тип агента' };
    if (G.agentsOf(nid).filter(a => a.kind === kind).length >= K.max) return { ok: false, err: `Не більше ${K.max} агентів цього типу` };
    if (n.cash < K.cost) return { ok: false, err: 'Бракує коштів' };
    n.cash -= K.cost; const used = new Set(G.agents.filter(a => a.n === nid).map(a => a.name)); const name = ANAMES[kind].find(x => !used.has(x)) || K.n + ' ' + (G.agents.length + 1);
    const a = { id: G.nextId++, n: nid, kind, name, at: ownerHome(nid), mv: null, task: kind === 'spy' ? 'counter' : null, prog: 0, xp: 0 }; G.agents.push(a); return { ok: true, id: a.id };
  };
  G.agentGo = function (id, to) {
    const a = G.agents.find(x => x.id === id); if (!a || a.n !== G.player) return { ok: false, err: 'Немає агента' }; if (a.mv) return { ok: false, err: 'Агент уже в дорозі' };
    const c = ter[to].ctrl; if (a.kind === 'dip' && c !== a.n && G.atWar(a.n, c)) return { ok: false, err: 'Дипломат не поїде до ворожої держави' };
    const d = hav(a.at, to); const days = Math.max(1, Math.round(1 + d / 3000 + (a.kind === 'spy' && c !== a.n ? 3 : 0)));
    a.mv = { from: a.at, to, start: G.day, arrive: G.day + days }; a.prog = 0; if (a.kind === 'spy') a.task = c === a.n ? 'counter' : 'recon';
    return { ok: true, days };
  };
  G.agentTask = function (id, task) {
    const a = G.agents.find(x => x.id === id); if (!a || a.n !== G.player || a.kind !== 'spy') return { ok: false, err: 'Немає шпигуна' }; if (!TASKS[task]) return { ok: false, err: 'Невідоме завдання' };
    const t = ter[a.at], c = t.ctrl;
    if (task === 'counter' && c !== a.n) return { ok: false, err: 'Контррозвідка — лише на своїй території' };
    if (task !== 'counter' && c === a.n && !(task === 'partisans' && t.owner === a.n)) return { ok: false, err: 'Агент має бути в іншій державі' };
    if (task === 'partisans' && !(t.owner !== t.ctrl && (t.owner === a.n || G.atWar(a.n, c)))) return { ok: false, err: 'Партизанів можна підтримати лише на окупованих територіях' };
    a.task = task; a.prog = 0; return { ok: true };
  };
  G.agentRecall = function (id) { const a = G.agents.find(x => x.id === id); if (!a || a.n !== G.player) return { ok: false, err: 'Немає агента' }; G.agents = G.agents.filter(x => x !== a); return { ok: true }; };
  G.dipIn = (nid, x) => G.agents.some(a => a.n === nid && a.kind === 'dip' && !a.mv && ter[a.at].ctrl === x);
  G.counterIn = nid => G.agents.some(a => a.n === nid && a.kind === 'spy' && !a.mv && a.task === 'counter' && ter[a.at].ctrl === nid);
  // присутність дипломата дозволяє покращувати відносини й укладати торговельні угоди без лідера
  const baseBlocks = G.leaderBlocks;
  G.leaderBlocks = (x, k) => baseBlocks(x, k) && !((k === 'improve' || k === 'treaty') && G.dipIn(G.player, x));
  // розвідка дає бонус до наступу
  const basePow = G.armyPower;
  G.armyPower = function (a) { const p = basePow(a); const c = ter[a.t].ctrl; const r = N[a.n].recon; if (c === a.n || !G.atWar(a.n, c)) return p; return r && r[c] > G.day ? p * 1.06 : G.has(N[a.n], 'sat_recon') && G.hasRecon && G.hasRecon(a.n) ? p * 1.03 : p; };
  const say = (a, txt, kind) => G.say(txt, kind, [a.n]);
  function caught(a, c) {
    G.agents = G.agents.filter(x => x !== a); const n = N[a.n];
    if (!G.atWar(a.n, c)) { G.rel[c][a.n] = clamp(G.rel[c][a.n] - 15, -100, 100); G.rel[a.n][c] = clamp(G.rel[a.n][c] - 8, -100, 100); }
    G.say(`🚨 ${N[c].name}: затримано агента ${n.name} — ${a.name}${G.atWar(a.n, c) ? '' : '. Дипломатичний скандал, відносини −15'}`, G.isHuman(a.n) ? 'bad' : 'info', [a.n, c]);
  }
  function complete(a) {
    const n = N[a.n], t = ter[a.at], c = t.ctrl, x = N[c]; a.xp = Math.min(1, a.xp + 0.1);
    if (a.task === 'recon') { n.recon = n.recon || {}; n.recon[c] = G.day + 45; say(a, `🔭 ${a.name}: розвідка в ${x.name} — розташування й склад військ відомі (наступ +6% на 45 днів)`, 'good'); }
    else if (a.task === 'steal') {
      if ((x.tech || 0) > (n.tech || 0)) { const g = Math.min(0.015, (x.tech - n.tech) * 0.12); n.tech += g; say(a, `💾 ${a.name}: викрадено технології ${x.name} — технологічний рівень +${g.toFixed(3)}`, 'good'); }
      else { n.cash += 0.2; say(a, `💾 ${a.name}: продано промислові секрети ${x.name} — +$0.2 млрд`, 'good'); }
    } else if (a.task === 'sabotage') {
      const K = ['arms_factory', 'drone_factory', 'missile_plant', 'npp', 'coal_plant', 'gas_plant', 'rail_hub', 'depot', 'refinery', 'chip_fab', 'steel_plant', 'military_base'].filter(k => t.bld[k]);
      t.dmg = Math.min(0.5, t.dmg + 0.05); if (K.length) { const k = K[Math.floor(G.rnd() * K.length)]; G.addLevel(a.at, k, -1); say(a, `💥 ${a.name}: диверсія в ${T[a.at].n} — ${G.D.buildings[k].n} −1 рів.`, 'good'); G.say(`💥 Диверсія: ${G.D.buildings[k].n} — ${T[a.at].n}`, 'war', [c]); }
      else say(a, `💥 ${a.name}: диверсія в ${T[a.at].n} — пошкоджено інфраструктуру`, 'good');
    } else if (a.task === 'unrest') { x.stab = Math.max(0, x.stab - 3); x.press = Math.min(1, (x.press || 0) + 0.05); say(a, `📢 ${a.name}: протестні настрої в ${x.name} посилились (стабільність −3)`, 'good'); }
    else if (a.task === 'partisans') { t.partBoost = Math.min(0.4, (t.partBoost || 0) + 0.15); say(a, `🔥 ${a.name}: партизани в ${T[a.at].n} отримали зброю й звʼязок`, 'good'); }
  }
  G.agentsDaily = function () {
    for (const a of G.agents.slice()) {
      if (!N[a.n] || !N[a.n].alive) { G.agents = G.agents.filter(x => x !== a); continue; }
      if (a.mv) { if (G.day >= a.mv.arrive) { a.at = a.mv.to; a.mv = null; if (a.n === G.player || G.isHuman(a.n)) say(a, `${G.D.agentKinds[a.kind].ic} ${a.name} прибув: ${T[a.at].n}, ${N[ter[a.at].ctrl].name}`, 'info'); } continue; }
      const c = ter[a.at].ctrl;
      if (a.kind === 'dip') { if (c !== a.n && !G.atWar(a.n, c)) { if (G.rel[c][a.n] < 70) G.rel[c][a.n] = Math.min(70, G.rel[c][a.n] + 0.12); if (G.rel[a.n][c] < 70) G.rel[a.n][c] = Math.min(70, G.rel[a.n][c] + 0.08); } continue; }
      const K = TASKS[a.task]; if (!K || !K.dur) continue;
      if (a.task !== 'partisans' && c === a.n) continue;
      const x = N[c]; const ci = (0.5 + (x.tech || 0.8) * 0.5) * (G.counterIn(c) ? 2.2 : 1) * (G.atWar(a.n, c) ? 1.3 : 1) * (1 - a.xp * 0.4) * (G.has(N[a.n], 'spec_ops') ? 0.8 : 1);
      if (G.rnd() < K.risk * ci) { caught(a, c); continue; }
      a.prog += (1 + a.xp * 0.5) / K.dur; if (a.prog >= 1) { a.prog = 0; complete(a); }
    }
    if (G.day % 30 === 20) aiCovert();
    if (G.day % 30 === 10) for (const n of N) { if (!n.alive || (G.isHuman(n.id) && !G.autoPlayer) || !G.has(n, 'cyber_war')) continue; const en = G.enemiesOf(n.id); if (!en.length || G.rnd() > 0.5) continue; const x = en[Math.floor(G.rnd() * en.length)]; const g = ['energy', 'finance', 'military'][Math.floor(G.rnd() * 3)]; G.cyberAttack(n.id, x, g); }
    for (const a of G.armies) if (N[a.n]._cyb > G.day) a.sup = Math.max(0.3, (a.sup || 1) - 0.012);
  };
  // таємна війна ШІ: ворожі розвідки зрідка вдаються до диверсій; люди дізнаються з новин
  function aiCovert() {
    for (const w of G.wars.values()) for (const [s, v] of [[w.a, w.b], [w.b, w.a]]) {
      if (G.isHuman(s) && !G.autoPlayer) continue; if (G.rnd() > 0.15) continue; const vic = N[v];
      if (G.counterIn(v) && G.rnd() < 0.6) { if (G.isHuman(v)) G.say(`🛡 Контррозвідка ${vic.name} затримала агентурну мережу ${N[s].name}`, 'good', [v, s]); continue; }
      const own = ter.filter(t => t.ctrl === v && t.owner === v && Object.keys(t.bld).length); if (!own.length) continue; const t = own[Math.floor(G.rnd() * own.length)];
      const K = ['arms_factory', 'drone_factory', 'rail_hub', 'depot', 'refinery', 'gas_plant'].filter(k => t.bld[k]);
      if (K.length && G.rnd() < 0.5) { const k = K[Math.floor(G.rnd() * K.length)]; G.addLevel(t.i, k, -1); if (G.isHuman(v) || G.isHuman(s)) G.say(`💥 Диверсія агентів ${N[s].name}: ${G.D.buildings[k].n} — ${T[t.i].n}`, G.isHuman(v) ? 'bad' : 'war', [v, s]); }
      else { vic.stab = Math.max(0, vic.stab - 1); }
    }
  }
  // ---- кібератаки (дослідження «Кібервійська»): раз на 30 днів; захист — кіберзахист цілі
  G.CYBER = { energy: { n: 'Енергосистема', ic: '⚡', d: 'блекаут у найбагатшому регіоні: ВВП −1%, пошкодження' }, finance: { n: 'Фінанси й банки', ic: '🏦', d: 'резерви −0.2% ВВП, стабільність −1' }, military: { n: 'Військовий звʼязок', ic: '📡', d: 'постачання армій падає на 10 днів' } };
  G.cyberCan = function (nid, x) { const n = N[nid]; if (!G.has(n, 'cyber_war')) return 'Потрібне дослідження «Кібервійська»'; if ((n._cyT || 0) > G.day) return `Кібервійська готуються: ще ${n._cyT - G.day} дн.`; if (x == null || x === nid || !N[x] || !N[x].alive) return 'Оберіть іншу державу на мапі'; if (!G.atWar(nid, x) && G.rel[nid][x] > -30) return 'Кібератаки — лише проти ворогів або дуже ворожих держав (відносини < −30)'; return null; };
  G.cyberAttack = function (nid, x, goal) {
    const err = G.cyberCan(nid, x); if (err) return { ok: false, err }; if (!G.CYBER[goal]) return { ok: false, err: 'Невідома ціль' };
    const n = N[nid], d = N[x]; n._cyT = G.day + 30;
    const block = clamp((d.rx ? d.rx.cyber || 0 : 0) * 0.7 + (G.has(d, 'cyber_war') ? 0.1 : 0) - (G.has(n, 'quantum_comp') ? 0.2 : 0), 0.05, 0.85);
    const P = [nid, x], loud = G.isHuman(nid) || G.isHuman(x);
    if (G.rnd() < block) { if (loud) G.say(`💻 ${d.name} відбила кібератаку ${n.name} (${G.CYBER[goal].n.toLowerCase()})`, G.isHuman(x) ? 'good' : 'war', P); if (!G.atWar(nid, x)) G.rel[x][nid] = clamp(G.rel[x][nid] - 5, -100, 100); return { ok: true, blocked: true }; }
    let txt = '';
    if (goal === 'energy') { const t = ter.filter(t => t.ctrl === x && t.owner === x).sort((a, b) => b.gdp - a.gdp)[0]; if (t) { t.gdp *= 0.99; t.dmg = Math.min(0.5, t.dmg + 0.03); txt = `блекаут — ${T[t.i].n}`; } d.stab = Math.max(0, d.stab - 1); }
    else if (goal === 'finance') { const l = Math.min(d.cash, d.agg.gdp * 0.002); d.cash -= l; d.stab = Math.max(0, d.stab - 1); txt = `збої банків, втрати $${l.toFixed(1)} млрд`; }
    else { d._cyb = G.day + 10; txt = 'звʼязок армій порушено на 10 днів'; }
    if (!G.atWar(nid, x)) G.rel[x][nid] = clamp(G.rel[x][nid] - 8, -100, 100);
    if (loud || G.rnd() < 0.2) G.say(`💻 Кібератака ${n.name} → ${d.name}: ${txt}`, G.isHuman(x) ? 'bad' : G.isHuman(nid) ? 'good' : 'war', P);
    return { ok: true, txt };
  };
  // дії гравця (для мережевої гри йдуть через G.act.*)
  G.act.assignGeneral = (armyId, genId) => G.assignGeneral(armyId, genId);
  G.act.modernize = () => G.player >= 0 ? G.modernize(G.player) : { ok: false, err: 'Лише за державу' };
  G.act.navPrio = k => G.player >= 0 ? G.setNavPrio(G.player, k) : { ok: false, err: 'Лише за державу' };
  G.act.cyber = (x, goal) => G.player >= 0 ? G.cyberAttack(G.player, x, goal) : { ok: false, err: 'Лише за державу' };
  G.act.hireAgent = kind => G.player >= 0 ? G.hireAgent(G.player, kind) : { ok: false, err: 'Агенти доступні лише за державу' };
  G.act.buyAir = (type, cnt) => G.buyAir(G.player, type, cnt);
});
