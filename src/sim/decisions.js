// РІШЕННЯ-ДИЛЕМИ: раз на кілька місяців гравцю-людині (і онлайн-гостям) випадає подія з вибором — як у великих стратегіях.
// Подію подає профільний радник; на стрімі за варіант може проголосувати чат (!1 / !2 / !3).
LORA.sim.register('decisions', 99, function (G) {
  const { N, ter } = G; const U = LORA.core, clamp = U.clamp;
  const nb = n => [...new Set(ter.filter(t => t.owner === n.id).flatMap(t => G.T[t.i].nb.map(j => ter[j].owner)))].filter(x => x !== n.id && x >= 0 && N[x].alive);
  const pick = a => a[Math.floor(G.rnd() * a.length)];
  const EV = [
    { id: 'refugees', adv: 'intern', ok: n => nb(n).some(x => G.enemiesOf(x).length), t: n => { const x = nb(n).find(x => G.enemiesOf(x).length); return { x, text: `Через кордон з ${N[x].name} іде хвиля біженців від війни. Сотні тисяч людей просять прихистку.` }; },
      o: [['Прийняти всіх', (n, c) => { n.cash -= n.agg.gdp * 0.003; G.rel[c.x][n.id] = clamp(G.rel[c.x][n.id] + 12, -100, 100); n.stab -= 2; return 'відносини +12, бюджет −0.3% ВВП'; }],
          ['Квоти й фільтрація', (n, c) => { n.cash -= n.agg.gdp * 0.001; G.rel[c.x][n.id] += 4; return 'відносини +4'; }],
          ['Закрити кордон', (n, c) => { G.rel[c.x][n.id] = clamp(G.rel[c.x][n.id] - 10, -100, 100); n.stab += 2; return 'відносини −10, стабільність +2'; }]] },
    { id: 'oligarch', adv: 'econ', ok: n => true, t: n => ({ text: 'Впливовий олігарх пропонує «пожертву» до бюджету в обмін на податкові пільги для своїх компаній.' }),
      o: [['Взяти гроші', n => { const a = n.agg.gdp * 0.006; n.cash += a; n.stab -= 4; n.press = clamp((n.press || 0) + 0.03, 0, 1); return `+$${a.toFixed(1)} млрд, стабільність −4`; }],
          ['Відмовити й оприлюднити', n => { n.stab += 3; return 'стабільність +3'; }]] },
    { id: 'scandal', adv: 'mil', ok: n => n.milStock > 5, t: () => ({ text: 'Журналісти викрили корупцію в оборонних закупівлях: завищені ціни на харчі й бронежилети.' }),
      o: [['Звільнити міністра й провести аудит', n => { G.armies.filter(a => a.n === n.id).forEach(a => a.org = Math.max(0.2, a.org - 0.05)); n.stab += 4; n.milStock *= 1.03; return 'стабільність +4, організованість армій −5%'; }],
          ['Зам’яти справу', n => { n.stab -= 2; n.milStock *= 0.95; if (G.rnd() < 0.4) { n.stab -= 6; return 'справа випливла знову: стабільність −8'; } return 'стабільність −2, втрати фонду −5%'; }]] },
    { id: 'espionage', adv: 'sci', ok: n => n.res && n.res.cur, t: n => { const v = pick(N.filter(x => x.alive && x.tech > n.tech + 0.05)); return v ? { x: v.id, text: `Розвідка пропонує купити викрадені креслення технологій ${v.name}.` } : null; },
      o: [['Купити', (n, c) => { n.cash -= 1.5; G.resBoost(n, 0.4); if (G.rnd() < 0.35) { G.rel[c.x][n.id] -= 25; return 'прогрес дослідження +40%, але операцію викрито: відносини −25'; } return 'прогрес дослідження +40%'; }],
          ['Відмовитись', () => 'нічого не змінилося']] },
    { id: 'pmc', adv: 'mil', ok: n => G.enemiesOf(n.id).length > 0, t: () => ({ text: 'Приватна військова компанія пропонує контракт: 20 тисяч досвідчених бійців за гроші.' }),
      o: [['Найняти ($4 млрд)', n => { n.cash -= 4; const h = n.home != null ? n.home : ter.findIndex(t => t.ctrl === n.id); const a = G.newArmy(n.id, h, 20, 'ПВК «Вовки»'); a.org = 0.9; a.auto = true; return '+20 тис. бійців біля столиці'; }],
          ['Ні, лише регулярна армія', n => { n.stab += 1; return 'стабільність +1'; }]] },
    { id: 'farmers', adv: 'econ', ok: n => true, t: () => ({ text: 'Фермери блокують дороги тракторами: вимагають субсидій через дорогі добрива й пальне.' }),
      o: [['Дати субсидії', n => { n.cash -= n.agg.gdp * 0.002; n.stab += 2; n.mods.push({ r: 'grain', mul: 1.04, until: G.day + 365 }); return 'стабільність +2, урожай +4% на рік'; }],
          ['Ігнорувати', n => { n.stab -= 3; n.mods.push({ r: 'grain', mul: 0.96, until: G.day + 180 }); return 'стабільність −3, урожай −4%'; }]] },
    { id: 'breakthrough', adv: 'sci', ok: n => n.res && n.res.cur, t: () => ({ text: 'Наші науковці на порозі прориву. Можна вкласти додаткові кошти або продати патент корпорації.' }),
      o: [['Вкласти $2 млрд', n => { n.cash -= 2; G.resBoost(n, 0.5); return 'прогрес дослідження +50%'; }],
          ['Продати патент', n => { n.cash += 1.5; return '+$1.5 млрд'; }]] },
    { id: 'base', adv: 'dipl', ok: n => true, t: n => { const s = pick(N.filter(x => x.alive && x.id !== n.id && x.agg && x.agg.gdp > 3000 && G.rel[x.id][n.id] > 10)); return s ? { x: s.id, text: `${s.name} пропонує розмістити на вашій території військову базу.` } : null; },
      o: [['Погодитись', (n, c) => { G.rel[c.x][n.id] = clamp(G.rel[c.x][n.id] + 15, -100, 100); ter.filter(t => t.owner === n.id).forEach(t => t.shield = Math.min(0.9, t.shield + 0.05)); N.forEach(o => { if (G.rel[o.id][c.x] < -30) G.rel[o.id][n.id] -= 8; }); return 'відносини +15, ППО +5%, вороги цієї держави невдоволені'; }],
          ['Відмовитись', (n, c) => { G.rel[c.x][n.id] -= 5; return 'відносини −5'; }]] },
    { id: 'hack', adv: 'infra', ok: n => G.enemiesOf(n.id).length > 0, t: n => { const e = G.enemiesOf(n.id)[0]; return { x: e, text: `Хакери ${N[e].name} атакували енергосистему. Генштаб пропонує відповісти кібератакою.` }; },
      o: [['Відповісти', (n, c) => { N[c.x].infraLvl = Math.max(0.1, N[c.x].infraLvl - 0.03); N[c.x].press = clamp((N[c.x].press || 0) + 0.02, 0, 1); n.infraLvl = Math.max(0.1, n.infraLvl - 0.01); return 'інфраструктура ворога −3%'; }],
          ['Посилити захист ($1 млрд)', n => { n.cash -= 1; n.rx.cyber = Math.min(0.95, (n.rx.cyber || 0) + 0.1); return 'кіберзахист +10%'; }]] },
    { id: 'games', adv: 'dipl', ok: n => G.enemiesOf(n.id).length === 0 && n.agg.gdp > 200, t: () => ({ text: 'Вам пропонують прийняти великий міжнародний спортивний чемпіонат.' }),
      o: [['Прийняти ($3 млрд)', n => { n.cash -= 3; n.stab += 5; N.forEach(o => { if (o.id !== n.id && G.rel[o.id][n.id] > 0) G.rel[o.id][n.id] += 2; }); return 'стабільність +5, світ симпатизує'; }],
          ['Відмовитись', () => 'нічого не змінилося']] },
    { id: 'volunteers', adv: 'intern', ok: n => G.enemiesOf(n.id).length > 0, t: () => ({ text: 'Волонтери зібрали рекордний збір на дрони й просять державу подвоїти суму.' }),
      o: [['Подвоїти', n => { n.cash -= 0.5; n.ars.fpv += 120; n.stab += 3; return '+120 тис. FPV, стабільність +3'; }],
          ['Подякувати', n => { n.ars.fpv += 60; return '+60 тис. FPV'; }]] }
  ];
  G.decEvents = EV; G.decisions = [];
  G.DEC_EV = EV;
  G.decisionsMonthly = function () {
    if (G.day < 40) return;
    G.humans.forEach(nid => {
      const n = N[nid]; if (!n || !n.alive || G.decisions.some(d => d.nid === nid) || G.rnd() > 0.45) return;
      const cand = EV.filter(e => e.ok(n) && !(n._dec && n._dec[e.id] > G.day)); const big = cand.filter(e => e.big); const e = big.length && G.rnd() < 0.5 ? pick(big) : pick(cand); if (!e) return; const c = e.t(n); if (!c) return;
      n._dec = n._dec || {}; n._dec[e.id] = e.big ? 1e9 : G.day + 540; if (e.big) c.big = true; G.decisions.push({ id: G.nextId++, ev: e.id, nid, ctx: c, d: G.day });
    });
  };
  G.decide = function (did, opt) {
    const i = G.decisions.findIndex(d => d.id === did); if (i < 0) return { ok: false, err: 'Немає події' }; const d = G.decisions[i], e = EV.find(x => x.id === d.ev), n = N[d.nid];
    if (G.player !== d.nid && G.humans.has(G.player)) return { ok: false, err: 'Це не ваша подія' };
    const o = e.o[opt] || e.o[0]; G.decisions.splice(i, 1); const res = o[1](n, d.ctx) || '';
    G.say(`📜 ${n.name}: «${o[0]}» — ${res}`, 'info', [n.id]); return { ok: true, res };
  };
});
// «ЧАТ ВИРІШУЄ ДОЛЮ СВІТУ»: події, які глядачі стріму можуть викликати голосуванням
LORA.sim.register('chaos', 99, function (G) {
  const { N, ter } = G; const pick = a => a[Math.floor(G.rnd() * a.length)];
  G.CHAOS = {
    quake:   { n: '🌋 Стихійне лихо у випадковій країні', f() { const t = pick(ter.filter(t => t.owner >= 0 && N[t.owner].alive)); t.dmg = Math.min(0.6, t.dmg + 0.3); t.gdp *= 0.9; N[t.owner].stab -= 4; G.say(`🌋 Чат обрав катастрофу: ${G.T[t.i].n}, ${N[t.owner].name} — руйнування й збитки`, 'big', [t.owner]); } },
    crash:   { n: '📉 Світова фінансова криза', f() { N.forEach(n => n.mods.push({ growth: -0.01, until: G.day + 120 })); G.say('📉 Чат обрав кризу: світові біржі обвалилися, зростання сповільнюється на 4 місяці', 'big'); } },
    boom:    { n: '📈 Світовий економічний бум', f() { N.forEach(n => n.mods.push({ growth: 0.008, until: G.day + 120 })); G.say('📈 Чат обрав бум: світова економіка прискорюється на 4 місяці', 'big'); } },
    tech:    { n: '🔬 Технологічний прорив гравцям', f() { G.humans.forEach(h => { const n = N[h]; if (n.res && n.res.cur) G.resBoost(n, 0.5); }); G.say('🔬 Чат обрав прорив: дослідження всіх гравців просунулися на 50%', 'big'); } },
    peace:   { n: '🕊 Світовий мирний саміт', f() { N.forEach(n => { if (n.alive) n.warExh = Math.min(1, (n.warExh || 0) + 0.08); }); G.say('🕊 Чат обрав мирний саміт: втома від воєн по всьому світу зростає', 'big'); } },
    oil:     { n: '🛢 Нафтовий шок', f() { N.forEach(n => n.mods.push({ r: 'oil', mul: 0.88, until: G.day + 150 })); G.say('🛢 Чат обрав нафтовий шок: видобуток −12%, ціни злітають', 'big'); } },
    pandemic:{ n: '🦠 Нова пандемія', f() { N.forEach(n => { n.mods.push({ growth: -0.012, until: G.day + 150 }); n.stab -= 2; }); G.say('🦠 Чат обрав пандемію: світ зупиняється на 5 місяців', 'big'); } }
  };
  G.chaos = k => { const c = G.CHAOS[k]; if (c) c.f(); return { ok: !!c }; };
});
