// ООН 2.0 · КОЛОНІЇ НА МІСЯЦІ Й МАРСІ · ГІБРИДНА ВІЙНА
LORA.sim.register('globalgov', 99.96, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const alive = () => N.filter(n => n.alive && n.agg); const isH = id => G.humans && G.humans.has(id); const fx = o => LORA.bus.emit('fx', o);
  const gdp = n => n.agg ? n.agg.gdp : 1; const id3 = a3 => G.nIdx[a3];
  // ================= ООН 2.0 =================
  // Генасамблея: 1 країна — 1 голос (простою більшістю). Обовʼязкові резолюції (санкції, миротворці, заборони) — ще й Радбез: 5 постійних членів з вето + 10 обраних на рік.
  G.UN_RES = {
    carbon:   { n: 'Глобальний вуглецевий податок', ic: '🌍', bind: false, d: 'країни з вугіллям і нафтою платять, зелені отримують бонус; потепління сповільнюється', days: 1095 },
    orbital:  { n: 'Заборона орбітальної зброї', ic: '🛰', bind: true, d: 'орбітальні удари й лазери заборонено; порушник — під санкціями', days: 1825 },
    ai_reg:   { n: 'Регулювання штучного інтелекту', ic: '🤖', bind: false, d: 'дослідження ШІ дорожчі на 20%, але стабільність +2 у всіх', days: 1095 },
    vaccine:  { n: 'Світовий фонд вакцин', ic: '💉', bind: false, d: 'багаті платять 0.05% ВВП, пандемії вдвічі слабші', days: 1095 },
    space:    { n: 'Договір про мирний космос', ic: '🌕', bind: false, d: 'на Місяці й Марсі заборонено силове захоплення зон', days: 1825 },
    refugees: { n: 'Квоти для біженців', ic: '🚶', bind: false, d: 'кліматичні мігранти розподіляються рівно; стабільність бідних +2', days: 1095 },
    sanction: { n: 'Санкції проти агресора', ic: '⛔', bind: true, target: true, d: 'торгівля з ціллю обмежена, її відносини з усіма −15', days: 730 },
    peace:    { n: 'Миротворча місія', ic: '🕊', bind: true, target: true, d: 'втома від війни цілі росте, примус до перемовин', days: 365 },
    fun:      { n: 'Міжнародний день котиків', ic: '🐈', bind: false, d: 'нічого не змінює, але всі щасливі: стабільність +1', days: 365 }
  };
  G.un = G.un || { p5: [], sc: [], laws: {}, prop: [], hist: [], year: -1 };
  const P5 = ['USA', 'CHN', 'RUS', 'GBR', 'FRA'];
  function scElect() { const p5 = P5.map(id3).filter(x => x != null && N[x].alive); const rest = alive().filter(n => !p5.includes(n.id)).sort((a, b) => gdp(b) - gdp(a)); const big = rest.slice(0, 25); const sc = []; while (sc.length < 10 && big.length) sc.push(big.splice(Math.floor(G.rnd() * big.length), 1)[0].id); G.un.p5 = p5; G.un.sc = sc; }
  G.unActive = k => G.un.laws[k] && G.un.laws[k].until > G.day;
  function aiVote(nid, R) { const n = N[nid], prop = R.by; if (R.target === nid) return 'no'; let s = (G.rel[nid][prop] || 0) / 40 + (G.rnd() - 0.5);
    if (R.k === 'carbon') s += (n.agg.prod.coal || 0) + (n.agg.prod.oil || 0) * 50 > gdp(n) * 0.5 ? -1.5 : 0.8; if (R.k === 'orbital') s += G.has(n, 'kinetic_orbital') ? -2 : 1; if (R.k === 'ai_reg') s += n.tech > 1.15 ? -1 : 0.5;
    if (R.k === 'vaccine') s += gdp(n) / Math.max(1, n.agg.pop) > 30 ? -0.4 : 1.2; if (R.target != null) { s += (G.rel[nid][R.target] || 0) / -30; if (G.allied(nid, R.target)) s -= 3; } if (R.k === 'fun') s += 2;
    return s > 0.35 ? 'yes' : s < -0.35 ? 'no' : 'abs'; }
  G.unPropose = function (by, k, target) {
    const R0 = G.UN_RES[k]; if (!R0) return { ok: false, err: '?' }; const n = N[by]; if (!n || !n.alive) return { ok: false, err: '?' };
    if (G.un.prop.some(p => p.k === k && p.target === target)) return { ok: false, err: 'Така резолюція вже на розгляді' }; n.unCd = n.unCd || 0; if (n.unCd > G.day && isH(by)) return { ok: false, err: `Нова пропозиція через ${n.unCd - G.day} дн.` };
    if (R0.target && (target == null || !N[target] || !N[target].alive)) return { ok: false, err: 'Оберіть ціль' }; if (G.unActive(k + (target != null ? ':' + target : ''))) return { ok: false, err: 'Вже діє' };
    const R = { id: G.nextId++, k, target, by, d: G.day, end: G.day + 14, votes: {} }; G.un.prop.push(R); n.unCd = G.day + 120;
    G.say(`🇺🇳 ООН: ${n.name} вносить резолюцію «${R0.n}${target != null ? ' — ' + N[target].name : ''}». Голосування 14 днів`, 'big', []);
    alive().forEach(x => { if (isH(x.id)) { if (x.id === by) R.votes[x.id] = 'yes'; else G.decisions.push({ id: G.nextId++, ev: 'un_vote', nid: x.id, ctx: { text: `ООН 2.0: «${R0.n}${target != null ? ' — ' + N[target].name : ''}». ${R0.d}. ${R0.bind ? 'Обовʼязкова: потрібна підтримка Радбезу (вето можливе).' : ''} Ваш голос?`, rid: R.id }, d: G.day }); } else R.votes[x.id] = aiVote(x.id, R); });
    return { ok: true, msg: 'резолюцію внесено' };
  };
  G.act.unPropose = (k, t) => G.unPropose(G.player, k, t);
  G.act.unVote = (rid, v) => { const R = G.un.prop.find(p => p.id === rid); if (!R) return { ok: false }; R.votes[G.player] = v; return { ok: true }; };
  function unClose(R) {
    const R0 = G.UN_RES[R.k]; const vs = Object.entries(R.votes); const yes = vs.filter(([, v]) => v === 'yes').length, no = vs.filter(([, v]) => v === 'no').length;
    let pass = yes > no; let veto = null; if (pass && R0.bind) { const vetoers = G.un.p5.filter(p => R.votes[p] === 'no'); if (vetoers.length) { pass = false; veto = vetoers.map(v => N[v].name).join(', '); } const scY = [...G.un.p5, ...G.un.sc].filter(p => R.votes[p] === 'yes').length; if (scY < 9) pass = false; }
    const key = R.k + (R.target != null ? ':' + R.target : ''); const nm = `«${R0.n}${R.target != null ? ' — ' + N[R.target].name : ''}»`;
    G.un.hist.unshift({ k: R.k, t: R.target, by: R.by, yes, no, pass, veto, d: G.day }); G.un.hist.length = Math.min(G.un.hist.length, 30);
    if (pass) { G.un.laws[key] = { k: R.k, t: R.target, until: G.day + R0.days, by: R.by }; G.say(`🇺🇳 Резолюцію ${nm} УХВАЛЕНО: ${yes} за, ${no} проти`, 'big', []); if (G.camp && isH(R.by)) G.camp.unWin = true; fx({ kind: R.k === 'fun' ? 'catfed' : 'un', title: '🇺🇳 ' + R0.n, sub: `${yes} — ${no}` }); applyNow(R); }
    else G.say(`🇺🇳 Резолюцію ${nm} провалено${veto ? ': ВЕТО ' + veto : ''} (${yes} за, ${no} проти)`, 'info', []);
  }
  function applyNow(R) { if (R.k === 'fun') alive().forEach(n => { n.stab = clamp(n.stab + 1, 0, 100); }); if (R.k === 'sanction') alive().forEach(n => { if (n.id !== R.target) G.rel[n.id][R.target] = clamp(G.rel[n.id][R.target] - 15, -100, 100); }); }
  function unMonthly() {
    const yr = Math.floor(G.day / 365); if (G.un.year !== yr) { G.un.year = yr; scElect(); }
    alive().forEach(n => { const g = gdp(n);
      if (G.unActive('carbon')) { const dirty = ((n.agg.prod.coal || 0) * 0.002 + (n.agg.prod.oil || 0) * 0.3) / Math.max(1, g); n.cash -= g * dirty * 0.002; }
      if (G.unActive('vaccine') && g / Math.max(1, n.agg.pop) > 30) n.cash -= g * 0.0005 / 12;
      if (G.unActive('refugees') && g / Math.max(1, n.agg.pop) < 6) n.stab = clamp(n.stab + 0.15, 0, 100);
      if (G.unActive('ai_reg')) n.stab = clamp(n.stab + 0.15, 0, 100); });
    for (const key in G.un.laws) { const Lw = G.un.laws[key]; if (Lw.until < G.day) { delete G.un.laws[key]; continue; } const t = Lw.t != null ? N[Lw.t] : null;
      if (Lw.k === 'peace' && t) t.weary = Math.min(100, (t.weary || 0) + 2); if (Lw.k === 'sanction' && t) t.mods.push({ growth: -0.004, until: G.day + 31 }); }
    // ШІ-пропозиції
    if (G.rnd() < 0.12) { const by = pick(alive().filter(n => gdp(n) > 200 && !isH(n.id))); if (by) { const ags = alive().filter(n => G.enemiesOf(n.id).length && G.ter.some(t => t.owner !== n.id && t.ctrl === n.id)); const tg = ags.length && G.rnd() < 0.5 ? pick(ags) : null;
      if (tg && tg.id !== by.id && !G.allied(by.id, tg.id)) G.unPropose(by.id, pick(['sanction', 'peace']), tg.id); else G.unPropose(by.id, pick(['carbon', 'orbital', 'ai_reg', 'vaccine', 'space', 'refugees', 'fun'])); } }
  }
  function unDaily() { const due = G.un.prop.filter(p => p.end <= G.day); due.forEach(R => { alive().forEach(x => { if (R.votes[x.id] == null) R.votes[x.id] = isH(x.id) ? 'abs' : aiVote(x.id, R); }); unClose(R); }); G.un.prop = G.un.prop.filter(p => p.end > G.day); }
  // заборона орбітальної зброї
  { const b = G.canStrike; if (b) G.canStrike = function (nid, i, w) { if ((w === 'orbital' || w === 'laser') && G.unActive('orbital')) { const e = b.apply(this, arguments); return e || (isH(nid) ? '' : 'ООН заборонила орбітальну зброю'); } return b.apply(this, arguments); }; }
  { const b = G.strike; if (b) G.strike = function (nid, i, w) { const r = b.apply(this, arguments); if (r && r.ok && (w === 'orbital' || w === 'laser') && G.unActive('orbital')) { alive().forEach(x => { if (x.id !== nid) G.rel[x.id][nid] = clamp(G.rel[x.id][nid] - 10, -100, 100); }); G.say(`🇺🇳 ${N[nid].name} порушує заборону ООН на орбітальну зброю! Світ обурений`, 'big', [nid]); } return r; }; }
  if (G.DEC_EV) G.DEC_EV.push({ id: 'un_vote', adv: 'dipl', ok: () => false, t: () => null, o: [['✅ За', (n, c) => { G.act.unVote(c.rid, 'yes'); return 'ви проголосували «за»'; }], ['❌ Проти', (n, c) => { G.act.unVote(c.rid, 'no'); return 'ви проголосували «проти»'; }], ['⚪ Утриматися', (n, c) => { G.act.unVote(c.rid, 'abs'); return 'ви утрималися'; }]] });

  // ================= КОЛОНІЇ НА МІСЯЦІ Й МАРСІ =================
  const Z = (id, n, x, y, res) => ({ id, n, x, y, res, owner: -1, m: {}, pop: 0, d: 0 });
  G.COL_MOD = {
    hab:   { n: 'Житловий модуль', ic: '🏠', c: 1.5, d: 'населення колонії +200' },
    mine:  { n: 'Шахта', ic: '⛏', c: 2, d: 'видобуток ресурсів зони' },
    solar: { n: 'Сонячна ферма', ic: '🔆', c: 1, d: 'енергія: усі модулі +20%' },
    lab:   { n: 'Лабораторія', ic: '🔬', c: 2.5, d: 'наука для країни' },
    port:  { n: 'Космопорт', ic: '🚀', c: 3, d: 'туризм і логістика: прибуток' },
    def:   { n: 'Оборона', ic: '🛡', c: 2.5, d: 'захист від захоплення' }
  };
  function colInit() { if (G.colony) return; G.colony = {
    moon: { n: 'Місяць', zones: [Z(0, 'Море Спокою', -0.25, -0.1, { he3: 3, rare: 1 }), Z(1, 'Кратер Шеклтон (полюс)', 0, 0.7, { ice: 4, he3: 1 }), Z(2, 'Океан Бур', -0.55, 0.15, { he3: 4 }), Z(3, 'Кратер Коперник', -0.2, 0.3, { rare: 3 }), Z(4, 'Море Ясності', 0.2, -0.3, { he3: 2, rare: 1 }), Z(5, 'Кратер Тихо', 0.05, -0.6, { rare: 2, ice: 1 }), Z(6, 'Море Криз', 0.55, -0.1, { he3: 3 }), Z(7, 'Зворотний бік', 0.45, 0.45, { ice: 2, rare: 2 })] },
    mars: { n: 'Марс', zones: [Z(0, 'Рівнина Утопія', 0.2, -0.45, { ice: 4 }), Z(1, 'Гора Олімп', -0.5, -0.15, { rare: 2 }), Z(2, 'Долини Марінера', 0.05, 0.1, { rare: 4, ice: 1 }), Z(3, 'Кратер Єзеро', 0.45, -0.1, { ice: 2, rare: 1 }), Z(4, 'Полярна шапка', 0, -0.75, { ice: 5 }), Z(5, 'Рівнина Еллада', 0.35, 0.5, { ice: 2, he3: 1 }), Z(6, 'Тарсіс', -0.35, 0.25, { rare: 3 }), Z(7, 'Кратер Гейл', 0.6, 0.25, { rare: 2, ice: 2 })] } }; }
  colInit();
  G.colReq = (nid, body) => { const n = N[nid]; if (!n) return 'Немає'; const pr = n.space && n.space.prog || {}; if (body === 'moon') return (pr.moon && pr.moon.ok) || (pr.lunar_base && pr.lunar_base.ok) || G.has(n, 'moon_base') ? '' : 'Потрібна місія на Місяць або технологія «Місячна база»'; return (pr.mars && pr.mars.ok) || G.has(n, 'mars_colony') ? '' : 'Потрібен політ на Марс або технологія «Колонія на Марсі»'; };
  G.colClaimCost = body => body === 'moon' ? 8 : 20;
  G.colClaim = function (nid, body, zi) {
    const e = G.colReq(nid, body); if (e) return { ok: false, err: e }; const z = G.colony[body].zones[zi]; if (!z) return { ok: false, err: '?' }; const n = N[nid], c = G.colClaimCost(body);
    if (z.owner === nid) return { ok: false, err: 'Зона вже ваша' }; if (n.cash < c) return { ok: false, err: `Потрібно $${c} млрд` };
    if (z.owner >= 0) { if (G.unActive('space')) return { ok: false, err: 'Договір про мирний космос забороняє захоплення' }; const def = (z.m.def || 0) * 2 + (N[z.owner].tech || 1) * 3 + G.rnd() * 3, att = (n.tech || 1) * 3 + (G.has(n, 'space_drones') ? 3 : 0) + (G.has(n, 'orbital_laser') ? 2 : 0) + G.rnd() * 4;
      n.cash -= c * 1.5; G.rel[z.owner][nid] = clamp(G.rel[z.owner][nid] - 30, -100, 100); G.rel[nid][z.owner] = G.rel[z.owner][nid];
      if (att > def) { const old = N[z.owner].name; z.owner = nid; z.m.def = 0; z.pop = Math.floor(z.pop * 0.6); G.say(`🚀⚔ ${n.name} захопила зону «${z.n}» (${G.colony[body].n}) у ${old}!`, 'big', [nid]); fx({ kind: 'battle', title: `⚔ ${G.colony[body].n}: ${z.n}`, sub: `${n.name} перемагає` }); return { ok: true, msg: 'зону захоплено' }; }
      G.say(`🚀🛡 Спроба ${n.name} захопити «${z.n}» (${G.colony[body].n}) відбита`, 'big', [nid, z.owner]); fx({ kind: 'shield', title: `🛡 ${G.colony[body].n}: ${z.n}`, sub: 'атаку відбито' }); return { ok: true, msg: 'атаку відбито' }; }
    n.cash -= c; z.owner = nid; z.d = G.day; z.pop = 20; G.say(`🚩 ${n.name} засновує колонію «${z.n}» на ${body === 'moon' ? 'Місяці' : 'Марсі'}`, 'big', [nid]); fx({ kind: 'rocket', who: n.name, title: '🚩 ' + z.n }); return { ok: true, msg: 'колонію засновано' };
  };
  G.colBuild = function (nid, body, zi, k) { const z = G.colony[body].zones[zi], M = G.COL_MOD[k]; if (!z || !M) return { ok: false, err: '?' }; if (z.owner !== nid) return { ok: false, err: 'Не ваша зона' }; const lvl = z.m[k] || 0; if (lvl >= 5) return { ok: false, err: 'Максимум' }; const c = M.c * (1 + lvl * 0.6) * (body === 'mars' ? 1.5 : 1); if (N[nid].cash < c) return { ok: false, err: `Потрібно $${c.toFixed(1)} млрд` }; N[nid].cash -= c; z.m[k] = lvl + 1; if (k === 'hab') z.pop += 200; return { ok: true, msg: `${M.n} → рівень ${lvl + 1}` }; };
  G.colOut = function (z) { const m = z.m, pw = 1 + (m.solar || 0) * 0.2; return { cash: ((m.mine || 0) * ((z.res.he3 || 0) * 0.06 + (z.res.rare || 0) * 0.05 + (z.res.ice || 0) * 0.02) + (m.port || 0) * 0.04 + z.pop * 0.00004) * pw, sci: (m.lab || 0) * 0.01 * pw, he3: (m.mine || 0) * (z.res.he3 || 0) * 0.02 * pw }; };
  G.act.colClaim = (b, z) => G.colClaim(G.player, b, z); G.act.colBuild = (b, z, k) => G.colBuild(G.player, b, z, k);
  function colMonthly() {
    ['moon', 'mars'].forEach(b => G.colony[b].zones.forEach(z => { if (z.owner < 0) return; const n = N[z.owner]; if (!n || !n.alive) { z.owner = -1; return; } const o = G.colOut(z); n.cash += o.cash; if (o.sci && G.resBoost) G.resBoost(n, Math.min(0.08, o.sci)); z.pop = Math.min(z.pop + (z.m.hab || 0) * 4, 200 + (z.m.hab || 0) * 220); n.stab = clamp(n.stab + 0.03, 0, 100); }));
    // ШІ: колонізація
    if (G.rnd() < 0.25) alive().filter(n => !isH(n.id) && gdp(n) > 800).forEach(n => { ['moon', 'mars'].forEach(b => { if (G.colReq(n.id, b) || G.rnd() > 0.3) return; const free = G.colony[b].zones.filter(z => z.owner < 0); if (free.length && n.cash > G.colClaimCost(b) * 3) G.colClaim(n.id, b, pick(free).id); const mine = G.colony[b].zones.filter(z => z.owner === n.id); if (mine.length && n.cash > 30) G.colBuild(n.id, b, pick(mine).id, pick(Object.keys(G.COL_MOD))); }); });
  }

  // ================= ГІБРИДНА ВІЙНА =================
  G.HYB = {
    bots:   { n: 'Бот-ферми', ic: '🤖', c: 0.0003, m: 6, risk: 0.18, d: 'щомісяця стабільність цілі −0.6 протягом пів року' },
    fakes:  { n: 'Фейкова кампанія', ic: '📰', c: 0.0002, m: 3, risk: 0.22, d: 'відносини цілі з її союзниками −6, стабільність −1' },
    elect:  { n: 'Втручання у вибори', ic: '🗳', c: 0.0008, m: 1, risk: 0.35, d: 'стабільність цілі −4, уряд слабшає; викриття — величезний скандал' },
    hack:   { n: 'Злив листування уряду', ic: '💾', c: 0.0004, m: 1, risk: 0.25, d: 'стабільність цілі −3, міністри втрачають лояльність' },
    memes:  { n: 'Мем-війна', ic: '🐸', c: 0.0001, m: 2, risk: 0.1, d: 'випадково: ціль сміється з вас або з себе' },
    soft:   { n: 'Мовлення й культура за кордоном', ic: '📺', c: 0.0003, m: 6, risk: 0, d: 'мʼяка сила: відносини з ціллю й нейтралами +' }
  };
  G.hops = G.hops || [];
  G.hybCan = function (a, b, k) { if (a < 0 || a === b || !N[b] || !N[b].alive) return 'Немає'; const H = G.HYB[k]; if (!H) return '?'; if (G.hops.some(o => o.a === a && o.b === b && o.k === k && o.until > G.day)) return 'Операція вже триває'; if (N[a].cash < gdp(N[a]) * H.c) return 'Бракує коштів'; return ''; };
  G.hybDo = function (a, b, k) {
    const e = G.hybCan(a, b, k); if (e) return { ok: false, err: e }; const H = G.HYB[k]; N[a].cash -= gdp(N[a]) * H.c; G.hops.push({ a, b, k, until: G.day + H.m * 30, d: G.day });
    const exp = H.risk * (1 + (N[b].hdef || 0) * 0.35) * (G.has(N[a], 'ai_cyber') ? 0.8 : 1);
    if (G.rnd() < exp) { G.hops = G.hops.filter(o => !(o.a === a && o.b === b && o.k === k)); G.rel[b][a] = clamp(G.rel[b][a] - (k === 'elect' ? 35 : 15), -100, 100); G.rel[a][b] = G.rel[b][a];
      if (k === 'elect') alive().forEach(x => { if (x.parl && x.parl.regime === 'democracy' && x.id !== a) G.rel[x.id][a] = clamp(G.rel[x.id][a] - 8, -100, 100); });
      G.say(`🕵 ВИКРИТО: ${N[a].name} стоїть за операцією «${H.n}» проти ${N[b].name}. Фактчекери тріумфують`, 'big', [a, b]); fx({ kind: 'leak', title: '🕵 ' + H.n, sub: `${N[a].name} → ${N[b].name}` }); return { ok: true, msg: 'операцію викрито!' }; }
    if (k === 'elect') { N[b].stab = clamp(N[b].stab - 4, 0, 100); if (N[b].parl) N[b].parl.sup = Math.max(10, (N[b].parl.sup || 50) - 6); }
    if (k === 'hack') { N[b].stab = clamp(N[b].stab - 3, 0, 100); if (N[b].min) Object.values(N[b].min).forEach(m => { m.loyal = clamp(m.loyal - 5, 0, 100); }); G.say(`💾 У мережі зʼявилося листування уряду ${N[b].name}. Найцікавіше — обговорення обідів`, 'info', [b]); }
    if (k === 'memes') { if (G.rnd() < 0.5) { N[b].stab = clamp(N[b].stab - 1.5, 0, 100); N[a].stab = clamp(N[a].stab + 1, 0, 100); G.say(`🐸 Мем-війна: мем про ${N[b].name} став світовим хітом`, 'info', [a, b]); } else { N[a].stab = clamp(N[a].stab - 1, 0, 100); G.say(`🐸 Мем-війна: ${N[b].name} відповіла кращим мемом. ${N[a].name} засмучена`, 'info', [a, b]); } }
    return { ok: true, msg: 'операцію розпочато' };
  };
  G.hdefUp = function (nid) { const n = N[nid], lv = n.hdef || 0; if (lv >= 5) return { ok: false, err: 'Максимум' }; const c = gdp(n) * 0.0004 * (lv + 1); if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; n.cash -= c; n.hdef = lv + 1; return { ok: true, msg: `фактчекери й кіберзахист: рівень ${lv + 1}` }; };
  G.act.hybDo = (b, k) => G.hybDo(G.player, b, k); G.act.hdefUp = () => G.hdefUp(G.player);
  function hybMonthly() {
    G.hops = G.hops.filter(o => o.until > G.day && N[o.a].alive && N[o.b].alive);
    G.hops.forEach(o => { const b = N[o.b], a = N[o.a], dfn = 1 - (b.hdef || 0) * 0.12;
      if (o.k === 'bots') b.stab = clamp(b.stab - 0.6 * dfn, 0, 100);
      if (o.k === 'fakes') { alive().forEach(x => { if (x.id !== o.b && G.allied(x.id, o.b)) G.rel[x.id][o.b] = clamp(G.rel[x.id][o.b] - 2 * dfn, -100, 100); }); b.stab = clamp(b.stab - 0.33 * dfn, 0, 100); }
      if (o.k === 'soft') { G.rel[o.b][o.a] = clamp(G.rel[o.b][o.a] + 1.5, -100, 100); }
      if (o.k !== 'soft' && G.rnd() < 0.03 * (1 + (b.hdef || 0))) { o.until = 0; G.rel[o.b][o.a] = clamp(G.rel[o.b][o.a] - 12, -100, 100); G.say(`🕵 Фактчекери ${b.name} викрили операцію «${G.HYB[o.k].n}» від ${a.name}`, 'info', [o.a, o.b]); } });
    // ШІ: автократії активніші
    if (G.rnd() < 0.2) { const a = pick(alive().filter(n => !isH(n.id) && n.parl && n.parl.regime !== 'democracy' && gdp(n) > 100)); if (a) { const en = G.enemiesOf(a.id); const tg = en.length ? N[pick(en)] : pick(alive().filter(x => G.rel[a.id][x.id] < -30)); if (tg && !G.hybCan(a.id, tg.id, 'bots')) G.hybDo(a.id, tg.id, pick(['bots', 'fakes', 'hack', 'memes'])); } }
    if (G.rnd() < 0.15) alive().filter(n => !isH(n.id) && (n.hdef || 0) < 3 && gdp(n) > 300).slice(0, 3).forEach(n => { if (G.rnd() < 0.3) G.hdefUp(n.id); });
  }
  G.ggDaily = function () { unDaily(); };
  G.ggMonthly = function () { unMonthly(); colMonthly(); hybMonthly(); };
});
