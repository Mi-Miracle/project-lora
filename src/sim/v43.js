// v4.3: тактика на фронті, державні посади з карʼєри, власна справа поетапно, руда з шахт (продаж на місці / перевізник),
// домовленості між гравцями, ситуації-вибори для персонажа, сезони в роботі, пасажирські авіалінії.
LORA.sim.register('v43', 100.2, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const sk = (L, k) => G.skill ? G.skill(L, k) : 0; const km = (a, b) => hav(T[a].c[0], T[a].c[1], T[b].c[0], T[b].c[1]);
  const S = () => G.v29s('v43', () => ({ seq: 1, fc: [], deals: [], postReq: [], seeded: 0 }));
  const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });
  const lkOf = L => { for (const k in G.leaders) if (G.leaders[k] === L) return isNaN(+k) ? k : +k; return 'me'; };
  const me = () => G.leader; const nidOf = L => L.job ? L.job.nid : L.post ? L.post.nid : L.home;
  const pick = a => a[Math.floor(R() * a.length)];
  const capOf = nid => N[nid].home >= 0 ? N[nid].home : ter.findIndex(t => t.ctrl === nid);

  // =====================================================================================================
  // 1. ТАКТИКА В БОЮ: командир обирає тактику, розвідка підказує намір противника (з помилкою)
  // =====================================================================================================
  const POS = { attack: 'готує наступ', defend: 'окопується в обороні', maneuver: 'маневрує, шукає обхід' };
  G.TAC = {
    flank:  { n: 'Фланговий обхід', ic: '↪', d: 'сильно проти оборони; слабко проти маневру', m: { defend: 1.25, attack: 1.05, maneuver: 0.85 }, org: -0.05 },
    arty:   { n: 'Артпідготовка', ic: '💥', d: 'добре проти наступу й оборони; витрачає постачання', m: { defend: 1.15, attack: 1.2, maneuver: 1.0 }, sup: -0.1 },
    trench: { n: 'Окопатися', ic: '🛡', d: 'найкраще проти наступу; марно проти маневру', m: { attack: 1.3, defend: 1.0, maneuver: 0.95 } },
    ambush: { n: 'Засідка', ic: '🌲', d: 'ловить маневр; ризиковано проти оборони', m: { maneuver: 1.3, attack: 1.1, defend: 0.9 } }
  };
  function tacDaily(L) { const a = G.unitOf && G.unitOf(L); if (!a || L.front !== a.id) { L.tacAsk = null; return; }
    const fight = (G.battles || []).includes(a.t); if (!fight) { if (L.tacAsk && G.day - L.tacAsk.d > 2) L.tacAsk = null; return; }
    if (a.tac && a.tac.until > G.day) return;
    if (L.tacAsk) { if (G.day - L.tacAsk.d >= 2) { L.tacAsk = null; a.tac = { k: 'none', until: G.day + 3, m: 0.95 }; G.say(`⌛ ${L.name}: наказ не віддано вчасно — підрозділ діє за статутом (−5% у бою)`, 'bad', [a.n]); } return; }
    const enemy = G.armies.filter(x => x.t === a.t && G.atWar(x.n, a.n)); const eAtt = enemy.some(x => x.stance === 'attack');
    const truth = R() < (eAtt ? 0.5 : 0.2) ? 'attack' : R() < 0.5 ? 'defend' : 'maneuver';
    const right = R() < clamp(0.5 + sk(L, 'mil') * 0.08, 0.5, 0.92); const rep = right ? truth : pick(Object.keys(POS).filter(x => x !== truth));
    L.tacAsk = { aid: a.id, t: a.t, d: G.day, p: truth, rep, acc: Math.round(clamp(0.5 + sk(L, 'mil') * 0.08, 0.5, 0.92) * 100) };
  }
  G.tacChoose = function (k) { const L = me(); const q = L && L.tacAsk; if (!q) return no('Немає бою, що чекає наказу'); const A = G.TAC[k]; if (!A) return no('?'); const a = G.armies.find(x => x.id === q.aid); if (!a) { L.tacAsk = null; return no('Підрозділ втрачено'); }
    const m = A.m[q.p] || 1; a.tac = { k, until: G.day + 4, m }; if (A.sup) a.sup = Math.max(0.1, a.sup + A.sup); if (A.org) a.org = Math.max(0.1, a.org + A.org); L.tacAsk = null;
    const good = m >= 1.1; if (L.job) L.job.xp += good ? 0.25 : 0.05;
    const txt = `${A.ic} ${A.n}: противник справді ${POS[q.p]}${q.rep !== q.p ? ' (розвідка помилилася)' : ''} → ${good ? 'вдале рішення' : m < 1 ? 'невдалий вибір' : 'нейтрально'}, сила в бою ×${m.toFixed(2)} на 4 дні`;
    G.say(`🎯 ${L.name} (${T[a.t].n}): ${txt}`, good ? 'good' : 'info', [a.n]); return ok(txt); };
  { const b = G.armyPower; G.armyPower = function (a) { const p = b(a); return a.tac && a.tac.until > G.day ? p * a.tac.m : p; }; }

  // =====================================================================================================
  // 2. ДЕРЖАВНІ ПОСАДИ З КАРʼЄРИ (персонаж стає міністром, отримує повноваження міністерства)
  // =====================================================================================================
  const gdpC = (n, f) => Math.max(0.05, (n.agg ? n.agg.gdp : 100) * f);
  Object.assign(G.MIN, {
    health: { n: 'Міністр охорони здоровʼя', ic: '🏥', area: 'лікарні, епідемії, тривалість життя' },
    agro:   { n: 'Міністр аграрної політики', ic: '🌾', area: 'урожай, продовольство, експорт зерна' },
    just:   { n: 'Генеральний прокурор', ic: '⚖', area: 'корупція, суди, порядок' },
    info:   { n: 'Міністр інформаційної політики', ic: '📺', area: 'медіа, пропаганда, довіра' },
    cult:   { n: 'Міністр культури й спорту', ic: '🎭', area: 'фестивалі, збірні, туризм' }
  });
  Object.assign(G.MIN_ACT, {
    health: [['reform', 'Медична реформа', '🏥', n => gdpC(n, 0.0006), 120, 'стабільність +2, зростання населення', (n, m, e) => { n.stab = Math.min(100, n.stab + 2 * e); n.mods.push({ growth: 0.0002, until: G.day + 365 }); return 'лікарні отримали обладнання'; }],
      ['vacc', 'Вакцинаційна кампанія', '💉', n => gdpC(n, 0.0002), 180, 'захист від епідемій на рік', (n, m, e) => { n.epiShield = G.day + 365; n.stab = Math.min(100, n.stab + 0.5); return 'черги в поліклініках, зате спокійно'; }]],
    agro: [['subs', 'Субсидії фермерам', '🌾', n => gdpC(n, 0.0004), 90, 'зерно +6% на пів року', (n, m, e) => { n.mods.push({ r: 'grain', mul: 1 + 0.06 * e, until: G.day + 180 }); return 'фермери задоволені'; }],
      ['exp', 'Зернові коридори', '🚢', n => gdpC(n, 0.0001), 120, 'відносини з покупцями +2', (n, m, e) => { N.filter(o => o.alive && o.id !== n.id && G.rel[n.id][o.id] > 20).slice(0, 8).forEach(o => { G.rel[n.id][o.id] = Math.min(100, G.rel[n.id][o.id] + 2); }); return 'зерно пішло на експорт'; }]],
    just: [['anti', 'Антикорупційна чистка', '🧹', n => gdpC(n, 0.0001), 120, 'повернути вкрадене міністрами, стабільність +', (n, m, e) => { let v = 0; for (const k in n.min) { const x = n.min[k]; if (x && x.stolen) { v += x.stolen * 0.7; x.stolen = 0; } } n.cash += v; n.stab = Math.min(100, n.stab + 1.5 * e); return v ? `повернуто ${G.fmt$(v)}` : 'чиновники налякані, гроші цілі'; }],
      ['order', 'Посилення правопорядку', '🚓', n => gdpC(n, 0.0002), 90, 'стабільність +1', (n, m, e) => { n.stab = Math.min(100, n.stab + e); return 'вулиці спокійніші'; }]],
    info: [['camp', 'Інформаційна кампанія', '📣', n => gdpC(n, 0.0002), 60, 'стабільність +1.5', (n, m, e) => { n.stab = Math.min(100, n.stab + 1.5 * e); return 'телемарафон триває'; }],
      ['counter', 'Протидія ворожій пропаганді', '🛰', n => gdpC(n, 0.0002), 120, 'втома від війни −', (n, m, e) => { n.warExh = Math.max(0, (n.warExh || 0) - 0.05 * e); return 'фейки розвінчано'; }]],
    cult: [['fest', 'Національний фестиваль', '🎉', n => gdpC(n, 0.0002), 120, 'стабільність +1, туризм', (n, m, e) => { n.stab = Math.min(100, n.stab + e); n.mods.push({ growth: 0.0001, until: G.day + 120 }); return 'фестиваль зібрав тисячі гостей'; }],
      ['team', 'Підтримка збірних', '🏅', n => gdpC(n, 0.0001), 180, 'шанс медалей, стабільність', (n, m, e) => { n.stab = Math.min(100, n.stab + 0.8 * e); return 'збірні їдуть на турніри'; }]]
  });
  G.POSTS = { army: ['military'], econ: ['banker', 'programmer'], logi: ['driver', 'pilot'], build: ['builder'], dipl: ['diplomat'], tech: ['teacher', 'scientist'], intel: ['police'],
    health: ['doctor'], agro: ['farmer'], just: ['lawyer'], info: ['journalist'], cult: ['actor', 'athlete', 'cook', 'seller'] };
  G.postFor = L => { if (!L || !L.job) return null; for (const k in G.POSTS) if (G.POSTS[k].includes(L.job.k)) return k; return null; };
  G.postErr = function (L) { if (!L || L.role !== 'char') return 'Лише для персонажа'; if (L.post) return 'Ви вже на державній посаді'; const k = G.postFor(L); if (!k) return 'Ваша професія не веде до міністерства';
    const nid = nidOf(L), lvl = L.job.lvl, pp = L.popu[nid] || 0; if (lvl < 4) return 'Потрібна одна з двох найвищих посад у професії'; if (pp < (lvl >= 5 ? 15 : 30)) return `Потрібна популярність ${lvl >= 5 ? 15 : 30}+ (зараз ${Math.round(pp)})`;
    if ((L.postCd || 0) > G.day) return `Наступна спроба — через ${L.postCd - G.day} дн.`; if (S().postReq.some(r => r.lk === lkOf(L) && !r.done)) return 'Заявку вже подано'; if (G.player >= 0 && G.leaders[G.player] === L) return 'Ви президент'; return ''; };
  function appoint(L, nid, k) { const n = N[nid]; n.min = n.min || {}; const old = n.min[k]; const sc = (G.JOBS[L.job ? L.job.k : 'military'] || {}).sk; const comp = clamp(40 + (sc ? sk(L, sc) : 2) * 8 + (L.job ? L.job.lvl : 4) * 2, 30, 98);
    n.min[k] = { k, name: L.name, ava: L.ava || L.name, fem: !!L.fem, comp, loyal: 85, trait: 'honest', auto: false, cd: {}, since: G.day, char: lkOf(L) };
    L.post = { nid, k, d0: G.day, prevJob: L.job || null }; L.job = null; L.front = null; L.op = null;
    G.say(`🏛 ${L.name} призначений: ${G.MIN[k].n} (${n.name})${old && old.name ? ` замість ${old.name}` : ''}`, 'big', [nid]); }
  G.postApply = function () { const L = me(); const e = G.postErr(L); if (e) return no(e); const k = G.postFor(L), nid = nidOf(L), lk = lkOf(L);
    const score = Math.round((L.popu[nid] || 0) + (L.cont[nid] || 0) + L.job.lvl * 8 + (L.fame || 0));
    if (G.isHuman(nid) && !(G.leaders[nid] === L)) { S().postReq.push({ id: S().seq++, nid, k, lk, name: L.name, score, d: G.day }); G.say(`📨 ${L.name} подав заявку на посаду: ${G.MIN[k].n}`, 'info', [nid]); return ok('заявку надіслано президентові — він обирає серед кандидатів'); }
    const ch = clamp(0.2 + (L.popu[nid] || 0) / 150 + (L.cont[nid] || 0) / 150 + (L.job.lvl - 3) * 0.12, 0.08, 0.9);
    if (R() < ch) { appoint(L, nid, k); return ok(`уряд погодив призначення: ${G.MIN[k].n}! Тепер у вас є повноваження міністерства`); }
    L.postCd = G.day + 60; return no(`уряд обрав іншого кандидата (шанс був ${Math.round(ch * 100)}%). Спробуйте за 2 місяці — підніміть популярність і звʼязки`); };
  G.postAnswer = function (rid, yes) { const r = S().postReq.find(x => x.id === rid && !x.done); if (!r) return no('Заявки немає'); if (G.player !== r.nid) return no('Лише президент цієї країни');
    r.done = 1; const L = G.leaders[r.lk]; if (!yes || !L) { if (L) { L.postCd = G.day + 60; G.say(`📭 Президент відхилив кандидатуру ${r.name} (${G.MIN[r.k].n})`, 'info', [r.nid]); } return ok('відхилено'); }
    S().postReq.forEach(x => { if (!x.done && x.nid === r.nid && x.k === r.k) { x.done = 1; const o = G.leaders[x.lk]; if (o) o.postCd = G.day + 60; } }); appoint(L, r.nid, r.k); return ok(`${r.name} — ${G.MIN[r.k].n}`); };
  G.postDo = function (a) { const L = me(); if (!L || !L.post) return no('Ви не на державній посаді'); const r = G.minDo(L.post.nid, L.post.k, a); if (r.ok) { L.fame += 0.3; L.popu[L.post.nid] = clamp((L.popu[L.post.nid] || 0) + 0.5, 0, 100); } return r; };
  G.postResign = function (L) { L = L || me(); if (!L || !L.post) return no('Ви не на посаді'); const p = L.post; const n = N[p.nid]; if (n.min && n.min[p.k] && n.min[p.k].char === lkOf(L)) { delete n.min[p.k]; G.minOf(p.nid, p.k); } L.job = p.prevJob; L.post = null; if (L.job) { L.job.dd = 0; L.job.warn = 0; } return ok('ви пішли у відставку й повернулися до професії'); };
  function postMonthly() { Object.values(G.leaders).forEach(L => { if (!L || !L.post) return; const p = L.post, n = N[p.nid], m = n.min && n.min[p.k];
    if (!m || m.char !== lkOf(L)) { G.say(`📉 ${L.name} більше не ${G.MIN[p.k].n.toLowerCase()} — звільнено`, 'bad', [p.nid]); L.job = p.prevJob; L.post = null; return; }
    L.money += $(12000 + Math.min(30000, ((n.agg && n.agg.pc) || 10000) * 0.3)); if ((L.popu[p.nid] || 0) < 8) { L.lowPop = (L.lowPop || 0) + 1; if (L.lowPop >= 2) { G.postResign(L); G.say(`📉 ${L.name}: відставка через низьку популярність`, 'bad', [p.nid]); } } else L.lowPop = 0; }); }

  // =====================================================================================================
  // 3. ВЛАСНА СПРАВА ПОЕТАПНО: дешево, але кроками (або «по-старому» — одразу за великі гроші)
  // =====================================================================================================
  G.BIZ = { cook: ['leisure', 'Ресторан', 'art'], seller: ['leisure', 'Торгова мережа', 'biz'], driver: ['logistics', 'Перевізник', 'drive'], pilot: ['logistics', 'Авіакомпанія', 'drive'], builder: ['build', 'Будівельна фірма', 'build'],
    farmer: ['agro', 'Фермерське господарство', 'agro'], police: ['military', 'Охоронна агенція', 'mil'], military: ['military', 'Приватна військова компанія', 'mil'], lawyer: ['leisure', 'Юридична фірма', 'law'],
    doctor: ['health', 'Приватна клініка', 'med'], teacher: ['health', 'Приватна школа', 'ped'], programmer: ['tech', 'IT-стартап', 'tech'], journalist: ['leisure', 'Медіахолдинг', 'media'], banker: ['industry', 'Інвестиційна компанія', 'eco'],
    diplomat: ['logistics', 'Зовнішньоторговельна фірма', 'diplo'], scientist: ['semi', 'Наукоємна компанія', 'sci'], actor: ['leisure', 'Продюсерський центр', 'art'], athlete: ['leisure', 'Спортивний клуб', 'fit'] };
  G.BIZ_HELP = { loan: ['🏦', 'Банківський кредит', 'кредит ×6 від фонду, повертати 2%/міс.'], grant: ['🏛', 'Державний грант', '×2 від фонду безповоротно; дають не всім'], investor: ['🤝', 'Інвестор-партнер', '×10 від фонду, але віддаєте частку 40%'],
    family: ['👪', 'Допомога рідних', '+50% від фонду, без умов'], crowd: ['🌐', 'Краудфандинг', 'за рахунок слави; потрібна слава 3+'] };
  G.bizErr = L => { if (!L || L.role !== 'char') return 'Лише для персонажа'; if (G.pc >= 0) return 'У вас уже є компанія'; if (L.biz) return 'Справу вже розпочато'; if (!L.job) return 'Спершу попрацюйте за професією'; if (L.job.lvl < 2) return 'Потрібна друга посада в професії — досвід'; return ''; };
  G.bizStart = function () { const L = me(); const e = G.bizErr(L); if (e) return no(e); const B = G.BIZ[L.job.k]; L.biz = { job: L.job.k, sector: B[0], name: `${B[1]} «${(L.name.split(' ')[1] || L.name)}»`, fund: 0, plan: 0, help: {}, place: null, reg: 0, team: 0, d0: G.day }; return ok(`план: ${B[1].toLowerCase()}. Пройдіть кроки — і відкриєте справу без мільйонів`); };
  const busyErr = L => (L.busy || 0) > G.day ? `Зайняті ще ${L.busy - G.day} дн.` : '';
  G.bizDo = function (step, arg) { const L = me(); const b = L && L.biz; if (!b) return no('Справу не розпочато');
    if (step === 'save') { const v = Math.min(L.money, Math.max($(500), L.money * (+arg || 0.25))); if (v < $(100)) return no('Немає вільних грошей'); L.money -= v; b.fund += v; return ok(`у фонд справи відкладено ${f$(v)} (разом ${f$(b.fund)})`); }
    if (step === 'unsave') { if (b.fund <= 0) return no('Фонд порожній'); L.money += b.fund; const v = b.fund; b.fund = 0; return ok(`з фонду забрано ${f$(v)}`); }
    if (step === 'plan') { if (b.plan) return no('План уже є'); if (arg === 'consult') { if (L.money < $(3000)) return no('Консультант коштує $3 тис.'); L.money -= $(3000); b.plan = 3; return ok('консультанти склали бізнес-план (якість 3/5)'); } const e = busyErr(L); if (e) return no(e); L.busy = G.day + 5; b.plan = clamp(1 + sk(L, 'biz') + sk(L, 'eco') * 0.5, 1, 5); return ok(`5 вечорів над таблицями: бізнес-план якості ${b.plan.toFixed(1)}/5`); }
    if (step === 'help') { const H = G.BIZ_HELP[arg]; if (!H) return no('?'); if (!b.plan) return no('Спершу бізнес-план'); if (b.fund < $(5000)) return no('Відкладіть у фонд хоча б $5 тис.'); if (b.help[arg]) return no('Вже домовились'); if (Object.keys(b.help).filter(k => b.help[k].amt).length >= 2) return no('Не більше двох джерел допомоги');
      if ((b.helpCd || {})[arg] > G.day) return no(`Повторно — через ${b.helpCd[arg] - G.day} дн.`);
      const nid = nidOf(L); let ch = 1, amt = 0, extra = {};
      if (arg === 'loan') { ch = 0.3 + sk(L, 'eco') * 0.08 + b.plan * 0.07; amt = b.fund * 6; extra = { debt: amt }; }
      if (arg === 'grant') { ch = 0.12 + (L.popu[nid] || 0) / 200 + (L.cont[nid] || 0) / 100 + b.plan * 0.05; amt = b.fund * 2; }
      if (arg === 'investor') { ch = 0.35 + b.plan * 0.08 + (L.fame || 0) * 0.01; amt = b.fund * 10; extra = { share: 0.4 }; }
      if (arg === 'family') { amt = b.fund * 0.5; }
      if (arg === 'crowd') { if ((L.fame || 0) < 3) return no('Потрібна слава 3+'); ch = 0.6; amt = b.fund * Math.min(4, (L.fame || 0) * 0.3); }
      if (R() > clamp(ch, 0, 0.95)) { (b.helpCd = b.helpCd || {})[arg] = G.day + 30; return no(`${H[1]}: відмова (шанс ${Math.round(clamp(ch, 0, 0.95) * 100)}%). Покращте план чи навички й спробуйте за місяць`); }
      b.help[arg] = Object.assign({ amt }, extra); return ok(`${H[0]} ${H[1]}: погоджено ${f$(amt)}`); }
    if (step === 'place') { const P = { small: [$(800), 'невеликий офіс'], mid: [$(2500), 'приміщення з виробничою зоною'] }[arg]; if (!P) return no('?'); if (L.money < P[0]) return no(`Перший місяць оренди: ${f$(P[0])}`); L.money -= P[0]; b.place = arg; return ok(`орендовано ${P[1]}`); }
    if (step === 'reg') { if (b.reg) return no('Вже зареєстровано'); const need = G.BIZ[b.job][2]; if (sk(L, need) < 2) return no(`Ліцензія вимагає навичку «${G.SKILLS[need] ? G.SKILLS[need].n : need}» 2+`); if (L.money < $(600)) return no('Збір $600'); const e = busyErr(L); if (e) return no(e); L.money -= $(600); L.busy = G.day + 5; b.reg = 1; return ok('реєстрація й ліцензія — 5 днів черг, але готово'); }
    if (step === 'team') { const n = Math.round(+arg || 1); const cap = b.place === 'mid' ? 12 : 5; if (!b.place) return no('Спершу приміщення'); if (b.team + n > cap) return no(`У приміщення вміститься ${cap} людей`); if (L.money < $(1500) * n) return no(`Найм: ${f$($(1500) * n)}`); L.money -= $(1500) * n; b.team += n; return ok(`найнято ${n} (команда: ${b.team})`); }
    if (step === 'cancel') { L.money += b.fund * 0.9; L.biz = null; return ok('задум відкладено; 90% фонду повернуто'); }
    return no('?'); };
  G.bizReady = b => !b ? ['Справу не розпочато'] : [b.fund < $(20000) ? 'фонд ≥ $20 тис.' : '', !b.plan ? 'бізнес-план' : '', !b.place ? 'приміщення' : '', !b.reg ? 'реєстрація й ліцензія' : '', b.team < 1 ? 'команда' : ''].filter(Boolean);
  G.bizCapital = b => b.fund + Object.values(b.help).reduce((s, h) => s + (h.amt || 0), 0);
  G.bizOpen = function () { const L = me(); const b = L && L.biz; const miss = G.bizReady(b); if (miss.length) return no('Ще потрібно: ' + miss.join(', ')); if (G.pc >= 0) return no('У вас уже є компанія');
    const cap = G.bizCapital(b); const nid = nidOf(L); const c = G.startCompany({ name: b.name, sector: b.sector, home: N[nid].a3, cash: cap, hqRegion: L.at });
    c.owner = 'me'; c.ownerLk = lkOf(L); c.ownShare = b.help.investor ? 0.6 : 1; c.divs = 0.25; c.small = 1; c.infl[nid] = 3 + (L.cont[nid] || 0) * 0.1; if (b.help.loan) c.loan = { left: b.help.loan.debt, pay: b.help.loan.debt * 0.02 }; G.corpInit && G.corpInit(c);
    L.biz = null; L.fame += 1; G.say(`🎉 ${L.name} відкрив власну справу: «${c.name}» (капітал ${f$(cap)}${b.help.investor ? ', інвестор — 40%' : ''})`, 'big', [nid]); return ok(`«${c.name}» відкрито! Капітал ${f$(cap)}. Компанія — у вкладці «Компанія»`); };
  function loanMonthly() { G.companies.forEach(c => { if (!c.loan || c.loan.left <= 0) return; const p = Math.min(c.loan.left, c.loan.pay); c.cash -= p * 1.008; c.loan.left -= p; if (c.loan.left <= 1e-12) { c.loan = null; if (!c.ai) G.say(`🏦 «${c.name}»: кредит на відкриття повністю погашено`, 'good', [c.home]); } }); }
  // «по-старому» лишається: Карʼєра → Заснувати компанію (≥ $500 тис. власних + інвестори). Позначаємо власника для угод
  { const b = G.startCompany; G.startCompany = function (o) { const c = b(o); if (c && !c.ownerLk && G.leader) c.ownerLk = G.curLk ? G.curLk() : 'me'; return c; }; }

  // =====================================================================================================
  // 4. РУДА: продаж на місці (дешевше) або перевезення до ринку найманим перевізником (ШІ — за базовою ціною, гравець — домовленість)
  // =====================================================================================================
  const BD = G.D.buildings;
  function oreOf(c) { const o = {}; c.assets.forEach(a => { const r = G.extOf && G.extOf(a.type); if (!r) return; const d = G.dep(a.t, r), t = ter[a.t]; if (!d || t.ctrl !== t.owner) return;
    const base = (BD[a.type].out[r] || 0) * (1 - t.dmg) * a.lvl / 12 * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1); const mul = d.R <= 0 || G.mineHalt(c, a) ? 0 : G.mineModeOf(c, a) * (0.75 + 0.25 * d.q); o[r] = (o[r] || 0) + base * mul; }); return o; }
  G.oreOf = oreOf;
  { const b = G.corpResFlow; if (b) G.corpResFlow = function (c) { const f = b(c); if (c.ai) return f; const o = oreOf(c); f.ore = o; for (const r in o) f.out[r] = Math.max(0, (f.out[r] || 0) - o[r]); return f; }; }
  G.SITE_K = 0.78; // продаж біля шахти: покупець сам забирає — ціна нижча
  G.fcRate = (a, b) => +clamp(0.04 + km(a, b) / 1000 * 0.055, 0.05, 0.35).toFixed(3); // частка вартості вантажу за перевезення (база ШІ)
  G.fcMarkets = function (c) { const host = c.home; const out = []; const cap = capOf(host); if (cap >= 0) out.push([cap, 'Столиця — внутрішній ринок', 1.0]);
    const port = ter.filter(t => t.ctrl === host && T[t.i].p.length).sort((x, y) => y.gdp - x.gdp)[0]; if (port) out.push([port.i, 'Порт — експорт (+6%)', 1.06]);
    N.filter(n => n.alive && n.id !== host && !G.atWar(host, n.id) && G.rel[host][n.id] > 25 && capOf(n.id) >= 0).sort((x, y) => (y.agg ? y.agg.gdp : 0) - (x.agg ? x.agg.gdp : 0)).slice(0, 6).forEach(n => out.push([capOf(n.id), `${n.name} — покупець за кордоном (+10%)`, 1.1]));
    const mr = mineReg(c); return out.filter(m => m[0] !== mr); };
  const mineReg = c => { const a = c.assets.find(x => G.extOf && G.extOf(x.type)); return a ? a.t : -1; };
  const VCAP = { truck: 0.0004, rail: 0.01, ship: 0.04, air: 0.001 }; // вартість вантажу за рейс ($ млрд)
  const carrierCap = (fc) => { const rs = G.s2().routes.filter(r => r.fc === fc.id); return rs.reduce((s, r) => s + r.u.length * VCAP[r.m] * 30 / (2 * Math.max(1, r.days) + 1), 0); };
  G.fcCap = carrierCap;
  G.fcAI = function (to, mode) { const c = G.myCo(); if (!c) return no('Немає компанії'); const from = mineReg(c); if (from < 0) return no('Немає шахт — нічого возити'); if (S().fc.some(x => x.shipper === c.id && x.st === 'active')) return no('Вже є діючий контракт — спершу завершіть');
    const mk = G.fcMarkets(c).find(m => m[0] === +to); if (!mk) return no('Оберіть ринок збуту'); mode = mode || 'truck'; const q = G.routeQuote(from, mk[0], mode); if (!q.ok) return no(q.err);
    const ais = G.companies.filter(x => x.alive && x.ai && x.sector === 'logistics'); const carrier = ais.length ? ais.sort((x, y) => km(x.offices[0].t, from) - km(y.offices[0].t, from))[0] : null;
    const fc = { id: S().seq++, shipper: c.id, carrier: carrier ? carrier.id : -1, ai: 1, from, to: mk[0], k: mk[2], mode, rate: G.fcRate(from, mk[0]), st: 'active', d0: G.day, got: 0, paid: 0, moved: 0 };
    S().fc.push(fc); c.oreMode = 'ship';
    // видимий транспорт перевізника на мапі
    if (carrier) { const s2 = G.s2(); const r = { id: s2.seq++, co: carrier.id, a: from, b: mk[0], m: mode, n: 4, path: q.path, sea: q.sea, km: q.km, days: q.days, dem: q.dem, u: [0, 0.5, 1, 1.5], earn: 0, trips: 0, lost: 0, d0: G.day, st: '', fc: fc.id }; s2.routes.push(r); }
    return ok(`перевізник «${carrier ? carrier.name : 'ШІ'}» везе руду до ${T[mk[0]].n}: ${Math.round(fc.rate * 100)}% від вартості вантажу`); };
  G.fcEnd = function (id) { const c = G.myCo(); const fc = S().fc.find(x => x.id === id && x.st === 'active'); if (!fc || !c || (fc.shipper !== c.id && fc.carrier !== c.id)) return no('Немає такого контракту'); endFc(fc, 'розірвано'); return ok('контракт розірвано'); };
  function endFc(fc, why) { fc.st = 'ended'; fc.d1 = G.day; const s2 = G.s2(); s2.routes.forEach(r => { if (r.fc === fc.id) { if (fc.ai) r.dead = 1; else r.fc = null; } }); s2.routes = s2.routes.filter(r => !r.dead); const c = G.companies[fc.shipper]; if (c && !S().fc.some(x => x.shipper === c.id && x.st === 'active')) c.oreMode = 'site';
    if (c && !c.ai) G.say(`📦 Контракт на перевезення руди «${c.name}» завершено: ${why}`, 'info', [c.home]); }
  G.setOreMode = function (m) { const c = G.myCo(); if (!c) return no('Немає компанії'); if (m === 'ship' && !S().fc.some(x => x.shipper === c.id && x.st === 'active')) return no('Спершу найміть перевізника'); c.oreMode = m === 'ship' ? 'ship' : 'site'; return ok(m === 'ship' ? 'руду везуть до ринку' : `руду продаєте біля шахти (${Math.round(G.SITE_K * 100)}% ціни)`); };
  function oreMonthly() { G.companies.forEach(c => { if (!c.alive || c.ai) return; const o = oreOf(c); if (!Object.keys(o).length && !c.ore) return; c.ore = c.ore || {};
    for (const r in o) c.ore[r] = (c.ore[r] || 0) + o[r]; const fc = S().fc.find(x => x.shipper === c.id && x.st === 'active');
    const val = Object.keys(c.ore).reduce((s, r) => s + c.ore[r] * G.spotSell(r), 0); if (val <= 0) return; c.oreLog = c.oreLog || {};
    if (c.oreMode !== 'ship' || !fc) { const m = val * G.SITE_K; c.cash += m; c.ore = {}; c.oreLog = { d: G.day, site: m }; return; }
    const cap = fc.ai ? Infinity : carrierCap(fc); const share = Math.min(1, cap / val); const moved = val * share; const fee = moved * fc.rate, gross = moved * fc.k;
    c.cash += gross - fee; fc.got += gross - fee; fc.paid += fee; fc.moved += moved; const car = G.companies[fc.carrier]; if (car) car.cash += fee * (fc.ai ? 0.35 : 1);
    for (const r in c.ore) c.ore[r] *= (1 - share);
    const left = Object.keys(c.ore).reduce((s, r) => s + c.ore[r] * G.spotSell(r), 0); if (left > val * 0.5 && left > 0) { const v = left * 0.6 * G.SITE_K; c.cash += v; c.ore = {}; G.say(`📦 «${c.name}»: перевізник не встигає (${Math.round(share * 100)}% вантажу) — надлишок руди продано біля шахти дешевше`, 'bad', [c.home]); }
    c.oreLog = { d: G.day, moved, fee, gross, share }; }); }

  // =====================================================================================================
  // 5. ДОМОВЛЕНОСТІ МІЖ ГРАВЦЯМИ: пропозиція → зустрічна ціна → згода/відмова
  //    види: freight — перевезення руди (ставка % від вартості), sell — продаж ресурсу зі складу, service — послуга за гроші
  // =====================================================================================================
  G.DEAL_K = { freight: ['🚚', 'Перевезення руди'], sell: ['📦', 'Продаж ресурсу'], service: ['🤝', 'Послуга'] };
  G.humanLks = () => Object.keys(G.leaders).filter(k => G.leaders[k] && (G.leaders[k].role === 'char' || !isNaN(+k)) && (isNaN(+k) ? true : G.isHuman(+k))).map(k => isNaN(+k) ? k : +k);
  const coOf = lk => { const c = G.companies.find(x => x.alive && !x.ai && x.ownerLk === lk); return c || null; };
  G.coOfLk = coOf;
  G.dealNew = function (kind, to, terms, price, note) { const from = G.curLk(); if (!G.DEAL_K[kind]) return no('?'); if (to === from || !G.leaders[to]) return no('Оберіть іншого гравця'); price = +price; if (!(price >= 0)) return no('Вкажіть ціну');
    terms = terms || {}; const mc = coOf(from), oc = coOf(to);
    if (kind === 'freight') { if (!mc || !G.oreOf(mc) || !Object.keys(G.oreOf(mc)).length) return no('Потрібна ваша компанія з шахтами'); if (!oc || oc.sector !== 'logistics') return no('У гравця немає логістичної компанії'); if (price > 0.6) return no('Ставка — частка вартості вантажу (0–60%)'); terms.from = mineReg(mc); if (terms.to == null) terms.to = G.fcMarkets(mc)[0][0]; }
    if (kind === 'sell') { if (!mc) return no('Потрібна ваша компанія'); if (!oc) return no('У гравця немає компанії'); if (!(terms.q > 0) || (mc.res[terms.r] || 0) < terms.q) return no('Немає стільки на складі'); }
    const d = { id: S().seq++, kind, from, to, terms, price, turn: to, st: 'open', hist: [[from, price, note || '']], exp: G.day + 14, d0: G.day }; S().deals.push(d);
    G.say(`✉ ${G.leaders[from].name} → ${G.leaders[to].name}: ${G.DEAL_K[kind][1].toLowerCase()} — пропозиція`, 'info', []); return ok('пропозицію надіслано'); };
  G.dealCounter = function (id, price, note) { const d = S().deals.find(x => x.id === id && x.st === 'open'); const lk = G.curLk(); if (!d || d.turn !== lk) return no('Зараз не ваш хід'); price = +price; if (!(price >= 0)) return no('Вкажіть ціну');
    d.price = price; d.hist.push([lk, price, note || '']); d.turn = lk === d.from ? d.to : d.from; d.exp = G.day + 14; return ok('зустрічну пропозицію надіслано'); };
  G.dealDecline = function (id) { const d = S().deals.find(x => x.id === id && x.st === 'open'); const lk = G.curLk(); if (!d || (lk !== d.from && lk !== d.to)) return no('Немає такої угоди'); d.st = 'no'; d.hist.push([lk, d.price, 'відмова']); return ok('угоду відхилено'); };
  G.dealAccept = function (id) { const d = S().deals.find(x => x.id === id && x.st === 'open'); const lk = G.curLk(); if (!d || d.turn !== lk) return no('Зараз не ваш хід'); const A = G.leaders[d.from], B = G.leaders[d.to]; const ca = coOf(d.from), cb = coOf(d.to);
    if (d.kind === 'freight') { if (!ca || !cb) return no('Компанії сторін недоступні'); const q = G.routeQuote(d.terms.from, d.terms.to, d.terms.mode || 'truck'); if (!q.ok) return no(q.err);
      S().fc.filter(x => x.shipper === ca.id && x.st === 'active').forEach(x => endFc(x, 'новий перевізник'));
      const mk = G.fcMarkets(ca).find(m => m[0] === d.terms.to); const fc = { id: S().seq++, shipper: ca.id, carrier: cb.id, ai: 0, from: d.terms.from, to: d.terms.to, k: mk ? mk[2] : 1, mode: d.terms.mode || 'truck', rate: d.price, st: 'active', d0: G.day, got: 0, paid: 0, moved: 0, deal: d.id };
      S().fc.push(fc); ca.oreMode = 'ship'; d.fc = fc.id; G.say(`🤝 Угода: «${cb.name}» возитиме руду «${ca.name}» за ${Math.round(d.price * 100)}% вартості. Перевізнику — відкрити маршрут ${T[fc.from].n} → ${T[fc.to].n} і привʼязати транспорт`, 'good', []); }
    if (d.kind === 'sell') { if (!ca || !cb) return no('Компанії сторін недоступні'); const r = d.terms.r, q = Math.min(d.terms.q, ca.res[r] || 0); if (q <= 0) return no('У продавця вже немає товару'); if (cb.cash < d.price) return no('У покупця бракує грошей'); ca.res[r] -= q; cb.res[r] = (cb.res[r] || 0) + q; cb.cash -= d.price; ca.cash += d.price; }
    if (d.kind === 'service') { const payer = d.terms.payer === 'to' ? d.to : d.from, payee = payer === d.from ? d.to : d.from; const P = G.leaders[payer], Q = G.leaders[payee]; const pc = d.terms.useCo ? coOf(payer) : null; const v = $(d.price);
      if ((pc ? pc.cash : P.money) < v) return no('У платника бракує грошей'); if (pc) pc.cash -= v; else P.money -= v; Q.money += v; Q.fame += 0.2; G.say(`🤝 ${Q.name} надає послугу ${P.name}: «${d.terms.text || 'послуга'}» за ${f$(v)}`, 'good', []); }
    d.st = 'done'; d.hist.push([lk, d.price, 'згода']); return ok('угоду укладено'); };
  G.fcBind = function (fcId, routeId) { const c = G.myCo(); const fc = S().fc.find(x => x.id === fcId && x.st === 'active'); const r = G.s2().routes.find(x => x.id === routeId); if (!fc || !c || fc.carrier !== c.id) return no('Це не ваш контракт'); if (!r || r.co !== c.id) return no('Оберіть свій маршрут');
    const fits = (r.a === fc.from && r.b === fc.to) || (r.b === fc.from && r.a === fc.to); if (!fits) return no(`Маршрут має йти ${T[fc.from].n} ⇄ ${T[fc.to].n}`); r.fc = fc.id; return ok('транспорт привʼязано до контракту — тепер він возить руду'); };
  function dealsDaily() { S().deals.forEach(d => { if (d.st === 'open' && G.day > d.exp) d.st = 'exp'; }); S().deals = S().deals.filter(d => d.st === 'open' || G.day - d.d0 < 120); S().fc = S().fc.filter(f => f.st === 'active' || G.day - (f.d1 || 0) < 200); }

  // =====================================================================================================
  // 6. СИТУАЦІЇ-ВИБОРИ ДЛЯ ПЕРСОНАЖА (хабарі, тиск, погрози…): впливають на гроші, репутацію й ризик справи
  // =====================================================================================================
  const H = (L, v) => { L.heat = clamp((L.heat || 0) + v, 0, 100); }; const RP = (L, v) => { L.rep = clamp((L.rep || 50) + v, 0, 100); };
  G.CEV = [
    { id: 'customs', jobs: ['driver', 'pilot'], t: 'На кордоні митник натякає: «можна без черги — за $200»', o: [['Дати хабар', L => { L.money -= $(200); H(L, 8); return 'проїхали без черги, але митник запамʼятав обличчя'; }], ['Стояти в черзі', L => { L.mood -= 4; RP(L, 2); return 'шість годин у черзі, зате чисте сумління'; }], ['Записати й повідомити', L => { RP(L, 5); H(L, -3); if (R() < 0.3) { L.hp -= 5; return 'митника звільнили, але шини вам хтось проколов'; } return 'митника звільнили — вам подякували'; }]] },
    { id: 'judge', jobs: ['lawyer'], min: 3, t: 'Невідомий пропонує $20 тис. за «правильне» рішення у справі', o: [['Взяти', L => { L.money += $(20000); H(L, 25); RP(L, -8); return 'гроші в конверті… НАБУ вже щось чує'; }], ['Відмовитись', L => { RP(L, 4); return 'ви чесно розглянули справу'; }], ['Здати в НАБУ', L => { RP(L, 8); L.fame += 1; H(L, -5); if (R() < 0.25) { L.hp -= 10; return 'корупціонера затримали; на вас напали біля дому'; } return 'корупціонера затримали на гарячому'; }]] },
    { id: 'threat', jobs: ['journalist'], min: 2, t: 'Після розслідування вам погрожують: «зупинись, бо пошкодуєш»', o: [['Публікувати далі', L => { L.fame += 2; RP(L, 5); if (R() < 0.35) { L.hp -= 15; return 'матеріал вийшов, але на вас напали — лікарня'; } return 'матеріал вийшов і вистрілив'; }], ['Поставити охорону', L => { L.money -= $(3000); L.fame += 1; return 'охорона дорога, але спокійніше'; }], ['Відступити', L => { RP(L, -5); L.mood -= 6; return 'тема заглохла'; }]] },
    { id: 'kick', jobs: ['builder', 'banker', 'seller'], t: 'Постачальник пропонує «відкат» 10% за вибір його фірми', o: [['Погодитись', L => { L.money += $(1500 * (L.job ? L.job.lvl : 1)); H(L, 15); return 'гроші прийшли; аудит наступного кварталу…'; }], ['Відмовитись', L => { RP(L, 3); return 'обрали найкращу пропозицію'; }]] },
    { id: 'dope', jobs: ['athlete'], t: 'Тренер пропонує «вітаміни», яких немає в жодному списку', o: [['Погодитись', L => { if (R() < 0.4) { L.fame -= 3; H(L, 20); return 'допінг-тест позитивний! Дискваліфікація й скандал'; } L.fame += 1; return 'результати зросли… поки що'; }], ['Відмовитись', L => { RP(L, 3); return 'чесний спорт'; }]] },
    { id: 'sick', jobs: ['doctor'], t: 'Пацієнт просить фіктивний лікарняний за $100', o: [['Виписати', L => { L.money += $(100); H(L, 6); return 'пацієнт «одужав» на рибалці'; }], ['Відмовити', L => { RP(L, 2); return 'пацієнт пішов незадоволений'; }]] },
    { id: 'exam', jobs: ['teacher'], t: 'Батьки пропонують $500 за «пʼятірку» сину', o: [['Взяти', L => { L.money += $(500); H(L, 8); return 'син отримав пʼятірку й нуль знань'; }], ['Відмовити', L => { RP(L, 3); return 'син тепер справді вчиться'; }], ['Запропонувати репетиторство', L => { L.money += $(300); RP(L, 2); return 'законно й корисно'; }]] },
    { id: 'leak', jobs: ['programmer'], t: 'Конкурент пропонує $15 тис. за код вашої компанії', o: [['Продати', L => { L.money += $(15000); H(L, 20); return 'гроші є, сумління — ні'; }], ['Відмовитись', L => { RP(L, 3); return 'код у безпеці'; }], ['Повідомити безпеку', L => { RP(L, 6); if (L.job) L.job.xp += 1; return 'вас відзначили — досвід +1'; }]] },
    { id: 'spy', jobs: ['diplomat', 'military', 'police'], min: 2, t: 'Іноземець на прийомі обережно пропонує «співпрацю»', o: [['Повідомити контррозвідку', L => { RP(L, 8); L.fame += 1; return 'вербувальника вислали з країни'; }], ['Подвійна гра', L => { if (R() < 0.5) { L.fame += 3; if (L.job) L.job.xp += 2; return 'ви передали дезінформацію — розвідка в захваті'; } H(L, 30); return 'гра зірвалась — проти вас відкрили справу'; }], ['Ігнорувати', L => { return 'ви ввічливо пішли до буфету'; }]] },
    { id: 'plag', jobs: ['scientist'], t: 'Аспірант приніс статтю, підозріло схожу на чужу', o: [['Підписати як співавтор', L => { L.fame += 1; H(L, 10); return 'стаття вийшла… а потім зʼявився допис на форумі'; }], ['Перевірити й відхилити', L => { RP(L, 4); return 'академічна доброчесність понад усе'; }]] },
    { id: 'role', jobs: ['actor'], t: 'Пропонують велику роль у скандальному фільмі країни-агресора', o: [['Погодитись', L => { L.money += $(30000); L.popu[nidOf(L)] = clamp((L.popu[nidOf(L)] || 0) - 15, 0, 100); return 'гроші великі, але вдома вас зненавиділи'; }], ['Відмовитись публічно', L => { L.popu[nidOf(L)] = clamp((L.popu[nidOf(L)] || 0) + 6, 0, 100); L.fame += 1; return 'вашу відмову цитують усі медіа'; }]] },
    { id: 'harvest', jobs: ['farmer', 'cook'], t: 'Перекупник пропонує купити все за готівку, без документів', o: [['Продати «в чорну»', L => { L.money += $(2000); H(L, 8); return 'готівка в кишені, податкова в роздумах'; }], ['Тільки офіційно', L => { L.money += $(1200); RP(L, 2); return 'менше грошей, але спокійно'; }]] },
    { id: 'gen', jobs: null, t: 'Друг просить позичити $1000 «до понеділка»', o: [['Позичити', L => { L.money -= $(1000); if (R() < 0.6) { L.money += $(1100); return 'друг повернув із процентами й тортом'; } return 'понеділок так і не настав'; }], ['Відмовити', L => { L.mood -= 2; return 'дружба трохи охолола'; }]] }
  ];
  function evMonthly() { Object.values(G.leaders).forEach(L => { if (!L || L.role !== 'char' || !L.job || (L.evQ || []).length >= 2 || R() > 0.3) return;
    const list = G.CEV.filter(e => (!e.jobs || e.jobs.includes(L.job.k)) && (!e.min || L.job.lvl >= e.min) && !(L.evSeen || {})[e.id + ':' + Math.floor(G.day / 365)]); if (!list.length) return; const e = pick(list);
    (L.evQ = L.evQ || []).push({ id: e.id, d: G.day }); (L.evSeen = L.evSeen || {})[e.id + ':' + Math.floor(G.day / 365)] = 1; });
    // ризик кримінальної справи
    Object.values(G.leaders).forEach(L => { if (!L || L.role !== 'char') return; L.heat = Math.max(0, (L.heat || 0) - 1.5); if ((L.heat || 0) > 40 && R() < (L.heat - 40) / 120) { const fine = Math.min(L.money * 0.4, $(5000 + L.heat * 300)); L.money -= fine; L.heat = 10;
      if (L.job && R() < 0.4) { const t = G.jobTitle(L); L.job = null; G.say(`🚔 ${L.name}: кримінальна справа! Штраф ${f$(fine)} і звільнення з посади «${t}»`, 'bad', [L.home]); } else G.say(`🚔 ${L.name}: проти вас відкрили справу — штраф ${f$(fine)}`, 'bad', [L.home]); RP(L, -10); } }); }
  G.charEvDo = function (i, o) { const L = me(); const q = (L && L.evQ) || []; const ev = q[i]; if (!ev) return no('Немає ситуації'); const E = G.CEV.find(x => x.id === ev.id); const O = E && E.o[o]; if (!O) return no('?'); q.splice(i, 1);
    const txt = O[1](L); L.mood = clamp(L.mood || 60, 0, 100); L.hp = clamp(L.hp || 80, 0, 100); L.money = Math.max(L.money, 0); return ok(`${O[0]}: ${txt}`); };

  // =====================================================================================================
  // 7. СЕЗОНИ: взимку частина справ недоступна/довша, влітку — туристичний сезон
  // =====================================================================================================
  G.seasonAt = function (i) { const m = G.month(); const lat = T[i] ? T[i].c[1] : 50; const north = lat >= 0; const mm = north ? m : (m + 6) % 12;
    if (Math.abs(lat) < 18) return 'tropic'; return mm === 11 || mm <= 1 ? 'winter' : mm >= 5 && mm <= 7 ? 'summer' : mm >= 2 && mm <= 4 ? 'spring' : 'autumn'; };
  G.SEAS = { winter: '❄ Зима', summer: '☀ Літо', spring: '🌱 Весна', autumn: '🍂 Осінь', tropic: '🌴 Тропіки' };
  { const b = G.opErr; if (b) G.opErr = function (L, id, t) { const e = b(L, id, t); if (e) return e; const s = G.seasonAt(L.at); if (s === 'winter' && L.job && ((L.job.k === 'farmer' && id === 'harvest') || (L.job.k === 'builder' && id === 'rebuild'))) return 'Взимку недоступно — чекайте весни'; return ''; }; }
  { const b = G.opDays; if (b) G.opDays = function (L, op, t) { const d = b(L, op, t); return G.seasonAt(L.at) === 'winter' && L.job && ['builder', 'farmer', 'driver'].includes(L.job.k) ? Math.ceil(d * 1.4) : d; }; }
  const SUMMER = ['cook', 'seller', 'actor', 'pilot', 'athlete'], WINTER_SLOW = ['builder', 'farmer'];
  function seasonMonthly() { Object.values(G.leaders).forEach(L => { if (!L || L.role !== 'char' || !L.job || !G.jobPay) return; const s = G.seasonAt(L.at);
    if (s === 'summer' && SUMMER.includes(L.job.k) && (L.job.dd || 0) >= 5) { const v = G.jobPay(L) * 0.25; L.money += v; G.say(`☀ ${L.name}: туристичний сезон — додатковий заробіток ${f$(v)}`, 'good', [nidOf(L)]); }
    if (s === 'winter' && WINTER_SLOW.includes(L.job.k) && (L.job.dd || 0) >= 5) { const v = G.jobPay(L) * 0.15; L.money -= v; G.say(`❄ ${L.name}: зимовий простій — менше замовлень (−${f$(v)})`, 'info', [nidOf(L)]); } }); }

  // =====================================================================================================
  // 8. АВІАЛІНІЇ: ШІ-авіакомпанії літають між великими містами; пілот бере рейси з розкладу
  // =====================================================================================================
  function seedAir() { const s = S(); if (s.seeded) return; s.seeded = 1; const s2 = G.s2(); const al = G.companies.filter(c => c.alive && c.ai && c.sector === 'logistics'); if (!al.length) return;
    const caps = N.filter(n => n.alive && n.home >= 0).sort((x, y) => (y.agg ? y.agg.gdp : 0) - (x.agg ? x.agg.gdp : 0)).slice(0, 26).map(n => n.home); let made = 0;
    for (let k = 0; k < 140 && made < 34; k++) { const a = pick(caps), b = pick(caps); if (a === b || s2.routes.some(r => r.m === 'air' && ((r.a === a && r.b === b) || (r.a === b && r.b === a)))) continue; const q = G.routeQuote(a, b, 'air'); if (!q.ok) continue;
      const c = al[made % al.length]; const n = 1 + Math.floor(R() * 3); s2.routes.push({ id: s2.seq++, co: c.id, a, b, m: 'air', n, path: q.path, sea: null, km: q.km, days: q.days, dem: q.dem, u: Array.from({ length: n }, (_, j) => +(j * 2 / n + R() * 0.3).toFixed(3)), earn: 0, trips: 0, lost: 0, d0: G.day, st: '' }); made++; } }
  // рейси з розкладу для пілота: напрямки авіаліній з поточного міста
  G.airSchedule = function (from) { return G.s2().routes.filter(r => r.m === 'air' && (r.a === from || r.b === from)).map(r => ({ to: r.a === from ? r.b : r.a, co: r.co, id: r.id })); };
  { const b = G.opTargets; if (b) G.opTargets = function (L, op) { const t = b(L, op); if (L && L.job && L.job.k === 'pilot' && op.id === 'flight') { const sch = G.airSchedule(capOf(nidOf(L))).map(x => x.to).filter(i => !t.includes(i)); return sch.concat(t).slice(0, 24); } return t; }; }

  // =====================================================================================================
  Object.assign(G.act, {
    tacChoose: k => G.tacChoose(k), postApply: () => G.postApply(), postAnswer: (id, y) => G.postAnswer(id, y), postDo: a => G.postDo(a), postResign: () => G.postResign(),
    bizStart: () => G.bizStart(), bizDo: (s, a) => G.bizDo(s, a), bizOpen: () => G.bizOpen(),
    fcAI: (to, m) => G.fcAI(to, m), fcEnd: id => G.fcEnd(id), fcBind: (f, r) => G.fcBind(f, r), setOreMode: m => G.setOreMode(m),
    dealNew: (k, to, t, p, n) => G.dealNew(k, to, t, p, n), dealCounter: (id, p, n) => G.dealCounter(id, p, n), dealAccept: id => G.dealAccept(id), dealDecline: id => G.dealDecline(id),
    charEvDo: (i, o) => G.charEvDo(i, o)
  });
  // посада: місто й справи — як у професії; кар'єрні вимоги до міністра
  { const b = G.locCan; G.locCan = function (loc, k, a) { const L = me(); if (L && L.tacAsk) return 'Іде бій — спершу віддайте наказ (вкладка «Фронт»)'; return b(loc, k, a); }; }
  G.h29.d.push(() => { seedAir(); Object.values(G.leaders).forEach(L => { if (!L || L.role !== 'char') return; if (L.hp == null || !isFinite(L.hp)) L.hp = 80; if (L.mood == null || !isFinite(L.mood)) L.mood = 60; if (!isFinite(L.money)) L.money = 0; tacDaily(L); }); dealsDaily(); });
  G.h29.m.push(() => { postMonthly(); loanMonthly(); oreMonthly(); evMonthly(); seasonMonthly(); });
  G.v43 = S;
});
