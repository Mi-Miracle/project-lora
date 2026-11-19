// СВІТОВІ ПОДІЇ 2.6: журналістські розслідування, Олімпіади й чемпіонати світу, кліматичні зміни до 2060,
// космічні перегони (хто перший), катаклізми й прибульці (з анімаціями в інтерфейсі — подія 'fx'),
// а також дії між державами й гравцями: таємні протоколи (з можливістю злити), подарунки, обмін технологіями,
// спільні навчання, ультиматуми, тролінг і товариські матчі.
LORA.sim.register('worldev', 99.95, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const alive = () => N.filter(n => n.alive && n.agg);
  const fx = (kind, o) => LORA.bus.emit('fx', Object.assign({ kind }, o || {}));
  const rel = (a, b, d) => { G.rel[a][b] = clamp(G.rel[a][b] + d, -100, 100); G.rel[b][a] = clamp(G.rel[b][a] + d, -100, 100); };
  const isH = id => G.humans && G.humans.has(id);
  const big = () => alive().filter(n => n.agg.gdp > 150);
  // ---------- журналістські розслідування: міністри-злодії стають світовим скандалом
  function journalists() {
    alive().forEach(n => { if (!n.min) return; Object.values(n.min).forEach(m => { if ((m.stolen || 0) > Math.max(0.05, n.agg.gdp * 0.0015) && G.rnd() < 0.08) {
      const v = m.stolen; m.stolen = 0; n.stab = clamp(n.stab - 5, 0, 100); alive().forEach(x => { if (x.id !== n.id) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] - 2, -100, 100); });
      G.say(`📰 Розслідування журналістів: ${m.name} (${n.name}) вивів $${(v * 1000).toFixed(0)} млн через офшори й кіпрські кавʼярні. Стабільність −5, репутація країни у світі падає`, 'big', [n.id]);
      if (isH(n.id)) G.decisions.push({ id: G.nextId++, ev: 'scandal_min', nid: n.id, ctx: { text: `Журналісти оприлюднили розслідування про ${m.name}. Суспільство вимагає реакції.`, k: m.k }, d: G.day }); } }); });
  }
  // ---------- Олімпіади й чемпіонати світу
  const SPORT = { oly: ['Олімпійські ігри', '🏅'], wc: ['Чемпіонат світу з футболу', '⚽'] };
  function sportsYearly() {
    const yr = new Date(G.startDate + G.day * 86400000).getFullYear(); const kind = yr % 4 === 0 ? 'oly' : yr % 4 === 2 ? 'wc' : null; if (!kind) return;
    const C = big().filter(n => !G.enemiesOf(n.id).length); if (!C.length) return; const host = pick(C);
    G.sport = { kind, host: host.id, start: G.day + 180, yr, boy: [] }; G.say(`${SPORT[kind][1]} ${SPORT[kind][0]} ${yr}: господарка — ${host.name}. Старт через пів року`, 'info', []);
    G.humans.forEach(h => { if (h === host.id) G.decisions.push({ id: G.nextId++, ev: 'sport_host', nid: h, ctx: { text: `Ви приймаєте ${SPORT[kind][0]} ${yr}! Скільки вкласти в підготовку?` }, d: G.day });
      else if (G.rel[h][host.id] < -20 || G.atWar(h, host.id)) G.decisions.push({ id: G.nextId++, ev: 'sport_boy', nid: h, ctx: { text: `${SPORT[kind][0]} ${yr} проходять у ${host.name}, з якою у вас погані відносини. Бойкотувати?` }, d: G.day }); });
  }
  function sportsDaily() {
    const S = G.sport; if (!S || S.done || G.day < S.start) return; S.done = true; const host = N[S.host]; if (!host || !host.alive) return;
    const part = alive().filter(n => !S.boy.includes(n.id)); const sc = n => n.agg.pop * 0.3 + n.agg.gdp * 0.01 + (n.id === S.host ? 15 : 0) + G.rnd() * 40; const rank = part.map(n => ({ n, s: sc(n) })).sort((a, b) => b.s - a.s);
    const top = rank.slice(0, 3).map(x => x.n); top.forEach((n, i) => { n.stab = clamp(n.stab + [5, 3, 2][i], 0, 100); });
    host.stab = clamp(host.stab + 3, 0, 100); host.mods.push({ growth: 0.002 * (S.inv || 1), until: G.day + 365 }); if (S.boy.length) S.boy.forEach(b => { rel(b, S.host, -8); });
    G.say(`${SPORT[S.kind][1]} ${SPORT[S.kind][0]} ${S.yr} завершено! ${S.kind === 'oly' ? 'Медальний залік' : 'Фінал'}: 🥇 ${top[0] ? top[0].name : '—'} · 🥈 ${top[1] ? top[1].name : '—'} · 🥉 ${top[2] ? top[2].name : '—'}${S.boy.length ? `. Бойкот: ${S.boy.map(b => N[b].name).join(', ')}` : ''}`, 'big', top.map(n => n.id));
    fx('sport', { sp: S.kind, win: top[0] ? top[0].name : '' });
  }
  // ---------- клімат до 2060
  function climateYearly() {
    const C = G.climate = G.climate || { t: 1.3, sea: 0 }; const fossil = alive().reduce((s, n) => s + (n.agg.prod.coal || 0) * 0.002 + (n.agg.prod.oil || 0) * 0.3 + (n.agg.prod.gas || 0) * 0.0004, 0) / Math.max(1, alive().reduce((s, n) => s + n.agg.gdp, 0)) * 100;
    const green = ter.reduce((s, t) => s + Object.entries(t.bld).reduce((q, [k, v]) => q + ((G.D.buildings[k] && G.D.buildings[k].eff && G.D.buildings[k].eff.green) ? v : 0), 0), 0);
    C.t = +(C.t + clamp(0.03 + fossil * 0.01 - green * 0.00004, 0.005, 0.07) * (G.unActive && G.unActive('carbon') ? 0.6 : 1)).toFixed(3); C.sea = +(C.sea + Math.max(0, C.t - 1.2) * 0.6).toFixed(2);
    if (C.t > 1.6 && G.rnd() < (C.t - 1.5) * 0.6) { const coast = ter.filter(t => t.owner >= 0 && T[t.i].p.length && ter[t.i].ctrl === t.owner); for (let i = 0; i < 2 + Math.floor((C.t - 1.5) * 4); i++) { const t = pick(coast); if (!t) break; t.dmg = Math.min(0.5, t.dmg + 0.1); t.gdp *= 0.97; N[t.owner].stab = clamp(N[t.owner].stab - 1, 0, 100); }
      G.say(`🌊 Підняття рівня моря (+${C.sea.toFixed(0)} см від 2026): підтоплено прибережні регіони. Потепління +${C.t.toFixed(2)}°C`, 'bad', []); fx('flood'); }
    if (C.t > 1.7 && G.rnd() < 0.4) { const hot = alive().filter(n => n.agg.gdp / Math.max(1, n.agg.pop) < 6 && n.agg.pop > 20), rich = alive().filter(n => n.agg.gdp / Math.max(1, n.agg.pop) > 35); const a = pick(hot), b = pick(rich); if (a && b) { const pa = ter.find(t => t.owner === a.id), pb = ter.find(t => t.owner === b.id); if (pa && pb) { const m = pa.pop * 0.01; pa.pop -= m; pb.pop += m; b.stab = clamp(b.stab - 1.5, 0, 100); G.say(`🚶 Кліматична міграція: ${(m * 1000).toFixed(0)} тис. людей із ${a.name} прямують до ${b.name}`, 'info', [a.id, b.id]); } } }
  }
  // ---------- космічні перегони: перший на Місяці / Марсі / Юпітері — бонус усій країні
  function spaceRace() {
    G.firsts = G.firsts || {}; const P = G.SPACE_PROG || {}; const T0 = { moon: 'Місяць', mars: 'Марс', jupiter: 'Юпітер', habitat: 'космічне місто', lunar_base: 'постійна база на Місяці' };
    alive().forEach(n => { const pr = n.space && n.space.prog; if (!pr) return; for (const k in T0) if (pr[k] && pr[k].ok && G.firsts[k] == null) { G.firsts[k] = n.id; n.stab = clamp(n.stab + 10, 0, 100); n.techB = (n.techB || 0) + 0.04; n.mods.push({ growth: 0.004, until: G.day + 730 });
      alive().forEach(x => { if (x.id !== n.id) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 4, -100, 100); }); G.say(`🏁 КОСМІЧНІ ПЕРЕГОНИ: ${n.name} — ПЕРША у світі (${T0[k]})! Стабільність +10, технології й зростання на 2 роки`, 'big', [n.id]); fx('rocket', { who: n.name }); } });
  }
  // ---------- катаклізми й прибульці
  G.CATA = {
    ufo: { n: '🛸 Контакт з прибульцями', p: 0.00008 }, solar: { n: '☀ Суперспалах на Сонці', p: 0.0001 }, supervolcano: { n: '🌋 Пробудження супервулкана', p: 0.00003 },
    asteroid: { n: '☄ Астероїд летить до Землі', p: 0.00004 }, locust: { n: '🦗 Нашестя сарани', p: 0.0004 }, kraken: { n: '🦑 Гігантський кальмар у морі', p: 0.0002 },
    blackout: { n: '🌐 Глобальний збій інтернету', p: 0.00015 }, robots: { n: '🤖 Страйк роботів', p: 0.00012 }, time: { n: '⏳ Мандрівник у часі', p: 0.0001 }
  };
  G.cata = function (k) {
    const A = alive(); if (!A.length) return;
    if (k === 'ufo') { const n = pick(big()) || pick(A); G.ufo = { nid: n.id, d: G.day }; G.say(`🛸 НАД ${n.name.toUpperCase()} ЗАВИС КОРАБЕЛЬ ПРИБУЛЬЦІВ. Світ затамував подих`, 'big', []); fx('ufo', { where: n.name });
      G.humans.forEach(h => G.decisions.push({ id: G.nextId++, ev: 'ufo_c', nid: h, ctx: { text: `Над ${n.name} завис корабель прибульців. Вони передають сигнал, схожий на… рецепт борщу. Як реагуєте?`, big: true }, d: G.day })); }
    if (k === 'solar') { A.forEach(n => { if (n.sats) for (const s in n.sats) n.sats[s] *= 0.75; n.infraLvl = Math.max(0.1, n.infraLvl - 0.02); }); G.say('☀ Суперспалах на Сонці: чверть супутників світу згоріла, полярне сяйво видно навіть у Києві', 'big', []); fx('solar'); }
    if (k === 'supervolcano') { A.forEach(n => n.mods.push({ r: 'grain', mul: 0.85, until: G.day + 540 }, { growth: -0.006, until: G.day + 365 })); G.say('🌋 Супервулкан прокинувся: попіл закрив сонце, врожаї в усьому світі −15% на півтора року', 'big', []); fx('volcano'); }
    if (k === 'asteroid') { G.asteroid = { d: G.day + 120, fund: {} }; G.say('☄ NASA та ESA: астероїд діаметром 400 м летить до Землі. Удар можливий через 4 місяці. Потрібна спільна місія відхилення', 'big', []); fx('asteroid');
      G.humans.forEach(h => G.decisions.push({ id: G.nextId++, ev: 'ast_c', nid: h, ctx: { text: 'Світ збирає гроші на місію відхилення астероїда. Ваш внесок?', big: true }, d: G.day })); }
    if (k === 'locust') { const n = pick(A.filter(x => (x.agg.prod.grain || 0) > 2)) || pick(A); n.mods.push({ r: 'grain', mul: 0.7, until: G.day + 150 }); n.stab = clamp(n.stab - 2, 0, 100); G.say(`🦗 Сарана зʼїла третину врожаю в ${n.name}. Фермери кажуть, що одна сарана навіть сфотографувалась із міністром`, 'bad', [n.id]); fx('locust', { where: n.name }); }
    if (k === 'kraken') { const n = pick(A.filter(x => ter.some(t => t.owner === x.id && T[t.i].p.length))) || pick(A); n.mods.push({ r: 'oil', mul: 0.95, until: G.day + 60 }); G.seaClosed && G.seaClosed.forEach((v, i) => { if (G.rnd() < 0.08) G.seaClosed[i] = G.day + 10; });
      G.say(`🦑 Біля узбережжя ${n.name} помічено гігантського кальмара. Судноплавство призупинено, туристи в захваті`, 'info', [n.id]); fx('kraken', { where: n.name }); }
    if (k === 'blackout') { A.forEach(n => n.mods.push({ growth: -0.01, until: G.day + 20 })); G.say('🌐 Глобальний збій інтернету: 3 дні без мемів. Продуктивність праці несподівано зросла', 'big', []); fx('blackout'); }
    if (k === 'robots') { const n = pick(A.filter(x => x.tech > 1.05)) || pick(A); n.mods.push({ growth: -0.008, until: G.day + 45 }); G.say(`🤖 У ${n.name} страйкують роботи: вимагають вихідних і мастила преміум-класу`, 'info', [n.id]); fx('robots', { where: n.name }); }
    if (k === 'time') { const n = pick(A); n.techB = (n.techB || 0) + 0.02; G.say(`⏳ У ${n.name} зʼявився «мандрівник у часі» з 2099 року. Каже, що все буде добре, але просить не купувати криптовалюту в березні`, 'info', [n.id]); fx('time', { where: n.name }); }
  };
  function cataDaily() {
    for (const k in G.CATA) if (G.rnd() < G.CATA[k].p) { G.cata(k); break; }
    if (G.asteroid && G.day >= G.asteroid.d) { const A = G.asteroid; G.asteroid = null; const tot = Object.values(A.fund).reduce((s, v) => s + v, 0) + big().filter(n => !isH(n.id)).reduce((s, n) => s + n.agg.gdp * 0.0004, 0);
      if (tot > 20 + G.rnd() * 25) { G.say(`🚀 Місію відхилення виконано! Астероїд пролетів повз Землю. Найщедріші — герої планети`, 'big', []); Object.entries(A.fund).forEach(([id, v]) => { if (v > 0) N[id].stab = clamp(N[id].stab + 4, 0, 100); }); fx('asteroid_ok'); }
      else { const t = pick(ter.filter(t => t.owner >= 0)); const n = N[t.owner]; t.dmg = 0.7; t.gdp *= 0.6; t.pop *= 0.9; N.forEach(x => x.alive && x.mods.push({ growth: -0.01, until: G.day + 365 })); n.stab = clamp(n.stab - 15, 0, 100); G.say(`☄ Астероїд упав у регіоні ${T[t.i].n} (${n.name}). Світова економіка в шоці`, 'big', [n.id]); fx('impact', { where: T[t.i].n }); } }
  }
  // рішення-події
  const EV = G.DEC_EV; if (EV) {
    EV.push({ id: 'scandal_min', adv: 'intern', ok: () => false, t: () => null, o: [['Звільнити міністра й подати до суду', (n, c) => { if (n.min && n.min[c.k]) { n.min[c.k].comp = 0; } if (G.minOf) { n.min[c.k] = null; G.minOf(n.id, c.k); } n.stab = clamp(n.stab + 3, 0, 100); return 'стабільність +3, новий міністр'; }],
      ['Заявити, що це фейк', n => { n.stab = clamp(n.stab - 3, 0, 100); return 'стабільність −3, журналісти пишуть друге розслідування'; }], ['Нагородити журналістів', n => { n.stab = clamp(n.stab + 1, 0, 100); return 'стабільність +1, свобода слова в топі'; }]] });
    EV.push({ id: 'sport_host', adv: 'econ', ok: () => false, t: () => null, o: [['Велике шоу ($ 0.3% ВВП)', n => { n.cash -= n.agg.gdp * 0.003; if (G.sport) G.sport.inv = 2; n.stab = clamp(n.stab + 2, 0, 100); return 'стадіони ростуть, туристи бронюють готелі'; }],
      ['Скромно й ощадливо', n => { n.cash -= n.agg.gdp * 0.0008; if (G.sport) G.sport.inv = 1; return 'без розкоші, зате без боргів'; }]] });
    EV.push({ id: 'sport_boy', adv: 'dipl', ok: () => false, t: () => null, o: [['Бойкотувати', n => { if (G.sport) G.sport.boy.push(n.id); n.stab = clamp(n.stab + 1, 0, 100); return 'спортсмени засмучені, політики задоволені'; }], ['Їхати й перемагати', n => 'команда вже пакує валізи']] });
    EV.push({ id: 'ufo_c', adv: 'sci', ok: () => false, t: () => null, o: [['Привітати й поділитися рецептом', n => { n.techB = (n.techB || 0) + 0.03; n.stab = clamp(n.stab + 2, 0, 100); return 'прибульці в захваті від борщу й передали креслення (наука +3%)'; }],
      ['Засекретити все', n => { if (G.resBoost) G.resBoost(n, 0.15); n.stab = clamp(n.stab - 1, 0, 100); return 'секретна лабораторія щось знайшла (дослідження +15%)'; }], ['Привести ППО в бойову готовність', n => { G.armies.forEach(a => { if (a.n === n.id) a.org = Math.min(1, a.org + 0.1); }); return 'прибульці образилися й полетіли до сусідів'; }]] });
    EV.push({ id: 'ast_c', adv: 'sci', ok: () => false, t: () => null, o: [['Великий внесок (0.2% ВВП)', n => { const v = n.agg.gdp * 0.002; n.cash -= v; if (G.asteroid) G.asteroid.fund[n.id] = (G.asteroid.fund[n.id] || 0) + v; alive().forEach(x => { if (x.id !== n.id) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 3, -100, 100); }); return 'світ дякує'; }],
      ['Символічний внесок', n => { const v = n.agg.gdp * 0.0004; n.cash -= v; if (G.asteroid) G.asteroid.fund[n.id] = (G.asteroid.fund[n.id] || 0) + v; return 'хоч щось'; }], ['Нехай платять інші', n => { alive().forEach(x => { if (x.id !== n.id) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] - 2, -100, 100); }); return 'дипломати червоніють'; }]] });
  }
  // ---------- дії між державами й гравцями
  G.secrets = G.secrets || [];
  G.INTER = {
    secret:  { n: 'Таємний протокол', ic: '🤫', d: 'ненапад і обмін розвідданими; відносини ростуть щомісяця. Будь-хто з двох може злити його', ask: true },
    exercise:{ n: 'Спільні навчання', ic: '🎯', d: 'армії обох +10% організованості, відносини +6, вороги нервують', ask: true },
    techx:   { n: 'Обмін технологіями', ic: '🔬', d: 'кожна сторона отримує одну технологію іншої', ask: true },
    match:   { n: 'Товариський матч', ic: '⚽', d: 'відносини +3, переможець — стабільність +1', ask: true },
    gift:    { n: 'Подарунок ($ 0.05% ВВП)', ic: '🎁', d: 'миттєво: гроші й відносини +8' },
    troll:   { n: 'Публічно потролити', ic: '🤡', d: 'стабільність +1 у вас, відносини −8, світ сміється' },
    ultimatum:{ n: 'Ультиматум: платіть 0.3% ВВП', ic: '📜', d: 'слабший може заплатити; відмова — відносини −20', ask: true }
  };
  G.interCan = function (a, b, k) { if (a < 0 || !N[a] || !N[b] || a === b || !N[b].alive) return 'Немає'; const A = G.INTER[k]; if (!A) return '?'; if (k !== 'troll' && k !== 'ultimatum' && G.atWar(a, b)) return 'Ви воюєте';
    if (k === 'secret' && G.secrets.some(s => !s.leak && ((s.a === a && s.b === b) || (s.a === b && s.b === a)))) return 'Протокол уже є'; N[a].icd = N[a].icd || {}; const cd = N[a].icd[k + b] || 0; if (cd > G.day) return `Ще ${cd - G.day} дн.`;
    if (k === 'gift' && N[a].cash < N[a].agg.gdp * 0.0005) return 'Бракує коштів'; if (G.pendingPeace.some(p => p.type === 'i_' + k && p.from === a && p.to === b)) return 'Пропозицію вже надіслано'; return ''; };
  const CD = { secret: 365, exercise: 180, techx: 365, match: 120, gift: 60, troll: 30, ultimatum: 180 };
  function interApply(k, a, b, yes) {
    const na = N[a], nb = N[b];
    if (!yes) { if (k === 'ultimatum') { rel(a, b, -20); G.say(`📜 ${nb.name} відкидає ультиматум ${na.name}: «Ідіть ви…» — далі нецензурно`, 'bad', [a, b]); } else G.say(`✉ ${nb.name} відхиляє пропозицію ${na.name}: ${G.INTER[k].n.toLowerCase()}`, 'info', [a, b]); return; }
    if (k === 'secret') { G.secrets.push({ id: G.nextId++, a, b, d: G.day, leak: null }); rel(a, b, 10); G.say(`🤫 ${na.name} і ${nb.name} щось підписали за зачиненими дверима. Подробиці невідомі`, 'info', [a, b]); }
    if (k === 'exercise') { G.armies.forEach(x => { if (x.n === a || x.n === b) x.org = Math.min(1, x.org + 0.1); }); rel(a, b, 6); new Set([...G.enemiesOf(a), ...G.enemiesOf(b)]).forEach(e => { G.rel[e][a] -= 3; G.rel[e][b] -= 3; }); G.say(`🎯 Спільні навчання ${na.name} і ${nb.name}: сусіди нервово рахують танки`, 'info', [a, b]); fx('exercise'); }
    if (k === 'techx') { const give = (x, y) => { const R = G.resEnsure ? G.resEnsure(N[x]) : null, Q = G.resEnsure ? G.resEnsure(N[y]) : null; if (!R || !Q) return null; const id = Object.keys(R.done).find(t => Q.done[t] == null && (!G.D.techs[t].req || G.D.techs[t].req.every(r => Q.done[r] != null))); if (id) Q.done[id] = G.day; return id; };
      const t1 = give(a, b), t2 = give(b, a); rel(a, b, 8); G.say(`🔬 Обмін технологіями ${na.name} ↔ ${nb.name}: ${t1 ? G.D.techs[t1].n : '—'} / ${t2 ? G.D.techs[t2].n : '—'}`, 'good', [a, b]); }
    if (k === 'match') { const w = G.rnd() < 0.5 ? na : nb; w.stab = clamp(w.stab + 1, 0, 100); rel(a, b, 3); const g1 = Math.floor(G.rnd() * 4), g2 = Math.floor(G.rnd() * 4); G.say(`⚽ Товариський матч ${na.name} — ${nb.name}: ${w === na ? Math.max(g1, g2) + 1 : Math.min(g1, g2)}:${w === nb ? Math.max(g1, g2) + 1 : Math.min(g1, g2)}. Головний арбітр — кіт президента`, 'info', [a, b]); fx('sport', { sp: 'wc', win: w.name }); }
    if (k === 'ultimatum') { const v = nb.agg.gdp * 0.003; nb.cash -= v; na.cash += v; rel(a, b, -12); nb.stab = clamp(nb.stab - 3, 0, 100); G.say(`📜 ${nb.name} поступається ультиматуму ${na.name}: $${v.toFixed(2)} млрд`, 'bad', [a, b]); }
  }
  G.inter = function (a, b, k) {
    const e = G.interCan(a, b, k); if (e) return { ok: false, err: e }; const na = N[a], nb = N[b], A = G.INTER[k]; na.icd[k + b] = G.day + CD[k];
    if (k === 'gift') { const v = na.agg.gdp * 0.0005; na.cash -= v; nb.cash += v; rel(a, b, 8); G.say(`🎁 ${na.name} дарує ${nb.name} $${(v * 1000).toFixed(0)} млн «просто так»`, 'good', [a, b]); return { ok: true, msg: 'подарунок вручено' }; }
    if (k === 'troll') { na.stab = clamp(na.stab + 1, 0, 100); rel(a, b, -8); const J = ['назвав(ла) їхню армію «музеєм під відкритим небом»', 'запропонував(ла) їм курси економіки для початківців', 'надіслав(ла) в подарунок мапу з підписом «ви тут»', 'виклав(ла) мем із їхнім лідером на тракторі']; G.say(`🤡 ${na.name} публічно ${pick(J)} (${nb.name}). Інтернет у захваті, дипломати — ні`, 'info', [a, b]); return { ok: true, msg: 'світ сміється' }; }
    if (isH(b) && b !== a) { G.pendingPeace.push({ type: 'i_' + k, from: a, to: b }); G.say(`✉ ${na.name} пропонує ${nb.name}: ${A.n.toLowerCase()}`, 'info', [a, b]); return { ok: true, msg: 'пропозицію надіслано гравцю' }; }
    const r = G.rel[b][a]; const yes = k === 'ultimatum' ? (na.agg.gdp > nb.agg.gdp * 2.5 && !G.allied(b, G.enemiesOf(a)[0] ?? -1) && G.rnd() < 0.6) : k === 'secret' ? r > 15 : k === 'techx' ? r > 25 : r > -10;
    interApply(k, a, b, yes); return { ok: true, msg: yes ? 'погодились' : 'відмовили' };
  };
  G.leakSecret = function (a, sid) { const s = G.secrets.find(x => x.id === sid && !x.leak && (x.a === a || x.b === a)); if (!s) return { ok: false, err: '?' }; const o = s.a === a ? s.b : s.a; s.leak = a;
    N[o].stab = clamp(N[o].stab - 6, 0, 100); rel(a, o, -40); alive().forEach(x => { if (x.id !== a && x.id !== o && (G.allied(x.id, o) || G.rel[x.id][o] > 30)) G.rel[x.id][o] = clamp(G.rel[x.id][o] - 10, -100, 100); });
    G.say(`📰 ЗЛИВ! ${N[a].name} оприлюднює таємний протокол із ${N[o].name}. У ${N[o].name} — скандал, союзники в шоці`, 'big', [a, o]); fx('leak'); return { ok: true, msg: 'документи в мережі' }; };
  { const base = G.act.answerPending; G.act.answerPending = function (idx, yes) { const p = G.pendingPeace[idx]; if (!p || !String(p.type).startsWith('i_')) return base(idx, yes); G.pendingPeace.splice(idx, 1); interApply(p.type.slice(2), p.from, p.to, yes); return { ok: true }; }; }
  G.act.inter = (b, k) => G.inter(G.player, b, k); G.act.leakSecret = sid => G.leakSecret(G.player, sid);
  // ---------- розклад
  G.worldevDaily = function () { cataDaily(); sportsDaily(); };
  G.worldevMonthly = function () {
    journalists(); spaceRace();
    G.secrets.forEach(s => { if (s.leak) return; rel(s.a, s.b, 0.5); if (G.rnd() < 0.004) { s.leak = -1; N[s.a].stab -= 3; N[s.b].stab -= 3; G.say(`📰 Журналісти розкопали таємний протокол ${N[s.a].name} — ${N[s.b].name}!`, 'big', [s.a, s.b]); fx('leak'); } });
    // ШІ: інколи пропонує людям дії
    if (G.rnd() < 0.15) { const h = [...(G.humans || [])][0]; const ai = h != null ? pick(alive().filter(x => !isH(x.id) && x.id !== h && !G.atWar(x.id, h))) : null; if (ai) { const k = G.rel[ai.id][h] > 30 ? pick(['exercise', 'match', 'techx', 'secret']) : G.rel[ai.id][h] < -30 ? 'troll' : 'match'; if (k === 'troll') { G.inter(ai.id, h, 'troll'); } else if (!G.interCan(ai.id, h, k)) G.inter(ai.id, h, k); } }
  };
  G.worldevYearly = function () { sportsYearly(); climateYearly(); };
});
