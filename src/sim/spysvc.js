// СПЕЦСЛУЖБИ: у кожної держави гравця дві служби — внутрішня (СБ: контррозвідка, корупція, вибори, антитерор)
// і зовнішня (розвідка: джерела в чужих урядах, крадіжка планів і технологій, вплив, дезінформація).
// Кожна має керівника (навичка й риса), рівень (місткість операцій), бюджет і лояльність. Завдання тривають кілька тижнів,
// успіх залежить від рівня, керівника й контррозвідки цілі. Подвійна гра: ворожі «кроти» у ваших службах зливають операції,
// ваші джерела можуть бути перевербовані й годувати дезінформацією. Спійманого крота можна арештувати, вислати або перевербувати.
LORA.sim.register('spysvc', 99.983, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const isH = id => G.isHuman ? G.isHuman(id) : id === G.player;
  const S = () => G.v29s('spy', () => ({}));
  const TRAITS = { careful: ['Обережний', 'ризик провалу −30%, але операції на 20% довші'], bold: ['Авантюрист', 'успіх +8%, провали гучніші'], para: ['Параноїк', 'кротів знаходить удвічі частіше, лояльність служби −'], loyal: ['Відданий', 'ніколи не зрадить, лояльність служби +'], chat: ['Балакучий', 'інколи хвалиться в барі — витоки'], tech: ['Технар', 'кібер- і техоперації +12%'] };
  G.SPY_TRAITS = TRAITS;
  const chief = () => { const tr = pick(Object.keys(TRAITS)); return { name: G.fakeName(), sk: 1 + Math.floor(G.rnd() * 4), tr, age: 38 + Math.floor(G.rnd() * 25), nick: pick(['«Тінь»', '«Дід»', '«Професор»', '«Сова»', '«Бухгалтер»', '«Тихий»', '«Мисливець»', '«Шахіст»']) }; };
  const svc = () => ({ ch: chief(), lvl: 1, loy: 70, ops: [], done: 0, fail: 0 });
  G.spyState = nid => { const P = S(); if (!P[nid]) P[nid] = { int: svc(), ext: svc(), moles: [], src: [], log: [], cand: null }; return P[nid]; };
  // ---- завдання
  G.SPY_OPS = {
    int: {
      mole:    { n: 'Полювання на кротів', ic: '🐀', dur: 60, d: 'шукає ворожих агентів у ваших службах і уряді' },
      corr:    { n: 'Боротьба з корупцією', ic: '💼', dur: 90, d: 'стабільність +2, бюджет +0.2% ВВП; можуть «злетіти» чиновники' },
      elect:   { n: 'Захист виборів', ic: '🗳', dur: 120, d: 'захист від гібридних операцій +1 рівень на рік' },
      terror:  { n: 'Антитерор', ic: '🛡', dur: 45, d: 'пів року ворожі диверсії вдвічі рідші' },
      fakes:   { n: 'Протидія фейкам', ic: '🧯', dur: 30, d: 'зриває активні ворожі гібридні операції проти вас' },
      opp:     { n: 'Нагляд за опозицією', ic: '👁', dur: 60, d: 'стабільність +3, але 30% — скандал і падіння думки', dark: 1 },
      guard:   { n: 'Охорона першої особи', ic: '🕶', dur: 30, d: 'рік — замахи й викрадення лідера майже неможливі' },
      audit:   { n: 'Перевірити джерела', ic: '🔍', dur: 30, d: 'виявляє перевербовані ворогом джерела вашої розвідки' }
    },
    ext: {
      recruit: { n: 'Завербувати джерело', ic: '🎣', dur: 60, d: 'зʼявляється джерело в уряді цілі (потрібне для деяких операцій)' },
      plans:   { n: 'Викрасти воєнні плани', ic: '🗺', dur: 45, src: 1, d: '90 днів видно армії цілі, наступ проти неї +6%' },
      tech:    { n: 'Технологічне шпигунство', ic: '💾', dur: 90, src: 1, d: 'технологічний рівень наближається до цілі' },
      elite:   { n: 'Вплив на еліти', ic: '🥂', dur: 90, d: 'відносини цілі до вас +12' },
      oppx:    { n: 'Підтримати опозицію', ic: '✊', dur: 120, d: 'стабільність цілі −5; викриття — великий скандал', dark: 1 },
      disinfo: { n: 'Дезінформація', ic: '🌀', dur: 30, d: 'втома від війни цілі +, її союзники сваряться' },
      econ:    { n: 'Економічна розвідка', ic: '📊', dur: 30, d: 'гроші від інсайдів: +0.02% вашого ВВП за рівень служби' },
      sab:     { n: 'Кібердиверсія', ic: '⚡', dur: 45, d: 'ВВП цілі −0.5%, блекаут у регіоні' }
    }
  };
  G.spyLvlCost = (nid, lv) => +(0.03 + (N[nid].agg ? N[nid].agg.gdp : 100) * 0.00015 * lv * lv).toFixed(3);
  G.spyBudget = (nid, s) => +(s.lvl * 0.004 + (N[nid].agg ? N[nid].agg.gdp : 100) * 0.00002 * s.lvl).toFixed(4); // на місяць
  const cap = s => s.lvl; // одночасних операцій
  G.spyChance = function (nid, side, k, x) {
    const st = G.spyState(nid), s = st[side]; let p = 0.42 + s.lvl * 0.07 + s.ch.sk * 0.04 + (s.ch.tr === 'bold' ? 0.08 : 0) + (s.ch.tr === 'tech' && (k === 'sab' || k === 'tech') ? 0.12 : 0);
    if (x != null && x !== nid) { const xs = S()[x]; const def = xs ? xs.int.lvl : Math.min(4, Math.round((N[x].agg ? Math.log10(N[x].agg.gdp + 1) : 1))); p -= def * 0.06; }
    if (st.moles.some(m => m.svc === side && !m.found)) p -= 0.15; p += (s.loy - 60) / 400;
    return clamp(p, 0.08, 0.95);
  };
  G.spyCan = function (nid, side, k, x) {
    const st = G.spyState(nid), s = st[side], O = G.SPY_OPS[side][k]; if (!O) return 'Невідома операція';
    if (s.ops.length >= cap(s)) return `Служба зайнята: до ${cap(s)} операцій одночасно (підвищте рівень)`;
    if (side === 'ext') { if (x == null || x === nid || !N[x] || !N[x].alive) return 'Оберіть іншу державу'; if (O.src && !st.src.some(r => r.x === x)) return 'Потрібне джерело в цій державі (спершу — вербування)'; if (s.ops.some(o => o.k === k && o.x === x)) return 'Така операція вже триває'; }
    else if (s.ops.some(o => o.k === k)) return 'Така операція вже триває';
    return '';
  };
  G.spyStart = function (nid, side, k, x) {
    const e = G.spyCan(nid, side, k, x); if (e) return { ok: false, err: e }; const s = G.spyState(nid)[side], O = G.SPY_OPS[side][k];
    const dur = Math.round(O.dur * (s.ch.tr === 'careful' ? 1.2 : 1)); s.ops.push({ k, x: side === 'ext' ? x : null, start: G.day, end: G.day + dur, id: G.nextId++ });
    return { ok: true, msg: `${O.n}: старт, ${dur} дн.` };
  };
  G.spyUp = function (nid, side) { const s = G.spyState(nid)[side]; if (s.lvl >= 5) return { ok: false, err: 'Максимальний рівень' }; const c = G.spyLvlCost(nid, s.lvl + 1); if (N[nid].cash < c) return { ok: false, err: 'Бракує коштів' }; N[nid].cash -= c; s.lvl++; return { ok: true, msg: `рівень ${s.lvl}` }; };
  G.spyCands = function (nid) { const st = G.spyState(nid); if (!st.cand || st.cand.d < G.day - 60) st.cand = { d: G.day, L: [chief(), chief(), chief()] }; return st.cand.L; };
  G.spyHire = function (nid, side, idx) {
    const st = G.spyState(nid), c = G.spyCands(nid)[idx]; if (!c) return { ok: false, err: 'Немає кандидата' }; const s = st[side], old = s.ch; s.ch = c; st.cand.L.splice(idx, 1, chief());
    s.loy = clamp(s.loy - 10 + (c.tr === 'loyal' ? 15 : 0), 0, 100); const out = pick(['пише мемуари', 'поїхав на риболовлю', 'став експертом на ТБ', 'відкрив школу шпигунів для котів', 'нарешті розповів дружині, де працював']);
    return { ok: true, msg: `${c.name} ${c.nick} очолює службу. Колишній керівник ${old.name} ${out}` };
  };
  function finish(nid, side, o) {
    const st = G.spyState(nid), s = st[side], O = G.SPY_OPS[side][o.k], n = N[nid], x = o.x != null ? N[o.x] : null; const H = isH(nid);
    const src = x ? st.src.find(r => r.x === o.x) : null; let p = G.spyChance(nid, side, o.k, o.x); if (src && src.turned) p *= 0.3;
    const ok = G.rnd() < p; const L = (txt, kind) => { st.log.unshift({ d: G.day, t: txt, ok }); st.log.length = Math.min(st.log.length, 40); if (H) G.say(txt, kind, [nid]); };
    if (!ok) { s.fail++; const exposed = G.rnd() < (s.ch.tr === 'careful' ? 0.25 : s.ch.tr === 'bold' ? 0.6 : 0.4) + (st.moles.some(m => m.svc === side && !m.found) ? 0.25 : 0);
      if (exposed && x) { G.rel[x.id][nid] = clamp(G.rel[x.id][nid] - (O.dark ? 25 : 12), -100, 100); G.rel[nid][x.id] = G.rel[x.id][nid]; if (src && G.rnd() < 0.5) st.src = st.src.filter(r => r !== src);
        G.say(`🚨 ${x.name} викрила операцію «${O.n}» ${n.name}. ${pick(['Посла викликали «на килим»', 'Агента вислали першим рейсом', 'МЗС обурене, телеканали в захваті', 'Агент попросив політичного притулку в посольстві Ватикану'])}`, H ? 'bad' : 'info', [nid, x.id]); if (H) G.fx29('busted'); }
      else if (exposed && side === 'int' && O.dark) { n.stab = clamp(n.stab - 3, 0, 100); if (G.v29.op) { ter.forEach((t, i) => { if (t.ctrl === nid) G.v29.op.mod[i] = clamp((G.v29.op.mod[i] || 0) - 6, -40, 40); }); } L(`📰 Скандал: журналісти дізналися про «${O.n}». Думка по країні −6`, 'bad'); }
      else L(`🕶 ${O.ic} «${O.n}»${x ? ' (' + x.name + ')' : ''}: провал, але тихо. ${pick(['Агент повернувся з засмагою', 'Звіт на 200 сторінок про нічого', 'Камери записали лише голубів', 'Ціль виявилась манекеном'])}`, 'info');
      return; }
    s.done++; let r = '';
    switch (o.k) {
      case 'mole': { const m = st.moles.find(q => !q.found); if (m) { m.found = G.day; r = `спіймано крота ${N[m.by] ? N[m.by].name : '?'} у ${m.svc === 'int' ? 'СБ' : 'розвідці'}: ${m.name}. Вирішіть його долю`; if (H) G.fx29('mole'); } else r = 'кротів не знайдено. Знайшли лише кота, який спав на секретних документах'; break; }
      case 'corr': { n.stab = clamp(n.stab + 2, 0, 100); n.cash += (n.agg ? n.agg.gdp : 100) * 0.002; r = pick(['затримано заступника міністра з мішком готівки «на ремонт»', 'знайдено 14 тендерів на золоті скріпки', 'розкрито схему «дорога, якої не існує»', 'чиновник пояснив маєток виграшем у лотерею — 12 разів поспіль']) + '. Стабільність +2, бюджет поповнено'; break; }
      case 'elect': n.hdef = Math.min(5, (n.hdef || 0) + 1); st.electUntil = G.day + 365; r = 'захист від гібридних операцій +1'; break;
      case 'terror': st.terrorUntil = G.day + 180; r = 'пів року — диверсії вдвічі рідші'; break;
      case 'fakes': { const before = (G.hops || []).length; if (G.hops) G.hops = G.hops.filter(q => q.b !== nid); const k = before - (G.hops || []).length; r = k ? `зірвано ворожих операцій: ${k}` : 'ворожих фейків не знайдено, лише бабусині групи у вайбері'; break; }
      case 'opp': n.stab = clamp(n.stab + 3, 0, 100); if (G.rnd() < 0.3) { if (G.v29.op) ter.forEach((t, i) => { if (t.ctrl === nid) G.v29.op.mod[i] = clamp((G.v29.op.mod[i] || 0) - 8, -40, 40); }); r = 'стабільність +3, але стеження викрили журналісти: думка −8'; } else r = 'стабільність +3, опозиція нічого не помітила'; break;
      case 'guard': st.guardUntil = G.day + 365; r = 'рік — перша особа під надійною охороною'; break;
      case 'audit': { const bad = st.src.filter(q => q.turned); st.src = st.src.filter(q => !q.turned); r = bad.length ? `виявлено перевербованих джерел: ${bad.length} — їх «звільнено»` : 'усі джерела чисті. Поки що'; break; }
      case 'recruit': { const role = pick(['секретарка міністра оборони', 'водій прем’єра', 'шеф-кухар президента', 'IT-адмін генштабу', 'заступник голови центробанку', 'перекладач на саміті', 'прибиральниця парламенту', 'тренер з йоги генералів']); st.src.push({ x: o.x, name: G.fakeName(), role, rel: 0.6 + G.rnd() * 0.35, turned: false, d: G.day }); r = `нове джерело в ${x.name}: ${role}`; break; }
      case 'plans': n.recon = n.recon || {}; n.recon[o.x] = G.day + 90; r = `плани ${x.name} у нас: 90 днів бачимо її армії`; break;
      case 'tech': { if ((x.tech || 0) > (n.tech || 0)) { const g = Math.min(0.02, (x.tech - n.tech) * 0.15); n.tech += g; r = `технологічний рівень +${g.toFixed(3)}`; } else { n.cash += 0.15; r = 'вони відстають — продали їхні секрети третім країнам (+$0.15 млрд)'; } break; }
      case 'elite': G.rel[o.x][nid] = clamp(G.rel[o.x][nid] + 12, -100, 100); r = `еліти ${x.name} раптом полюбили нашу кухню: відносини +12`; break;
      case 'oppx': x.stab = clamp(x.stab - 5, 0, 100); r = `опозиція ${x.name} отримала «гуманітарку» — стабільність там −5`; break;
      case 'disinfo': x.warExh = (x.warExh || 0) + 0.05; (G.allies ? G.allies(o.x) : []).forEach(a => { if (G.rel[a] && G.rel[a][o.x] != null) G.rel[a][o.x] = clamp(G.rel[a][o.x] - 4, -100, 100); }); r = `${x.name} повірила, що союзники її зраджують`; break;
      case 'econ': { const v = (n.agg ? n.agg.gdp : 100) * 0.0002 * s.lvl; n.cash += v; r = `інсайди про ринки ${x.name}: +$${v.toFixed(2)} млрд`; break; }
      case 'sab': { const reg = ter.filter(t => t.ctrl === o.x); const t = pick(reg); if (t) { t.gdp *= 0.995; t.integ = Math.max(0.3, (t.integ || 1) - 0.05); } x.agg && (x.cash -= x.agg.gdp * 0.001); r = `блекаут у регіоні «${t ? T[t.i].n : '?'}». Офіційна версія — «ворона на трансформаторі»`; break; }
    }
    L(`🕶 ${O.ic} «${O.n}»${x ? ' (' + x.name + ')' : ''}: успіх — ${r}`, 'good');
  }
  // долі кротів
  G.moleDo = function (nid, idx, k) {
    const st = G.spyState(nid), m = st.moles.filter(q => q.found)[idx]; if (!m) return { ok: false, err: 'Немає крота' }; st.moles = st.moles.filter(q => q !== m); const x = N[m.by];
    if (k === 'arrest') { if (x) { G.rel[m.by][nid] = clamp(G.rel[m.by][nid] - 10, -100, 100); G.rel[nid][m.by] = G.rel[m.by][nid]; } N[nid].stab = clamp(N[nid].stab + 1, 0, 100); return { ok: true, msg: `${m.name} заарештовано. Показовий суд у прямому ефірі — рейтинги шоу шалені` }; }
    if (k === 'expel') return { ok: true, msg: `${m.name} висланий. На прощання залишив відгук «сервіс 3/5»` };
    if (k === 'turn') { if (G.rnd() < 0.65) { if (x) { G.doubleAgents = G.doubleAgents || []; G.doubleAgents.push({ by: nid, on: m.by, until: G.day + 365 }); } return { ok: true, msg: `${m.name} тепер подвійний агент: рік ${x ? x.name : 'ворог'} отримує дезінформацію, а ми — її плани` }; }
      return { ok: true, msg: `${m.name} погодився… і втік через вікно туалету. Класика` }; }
    return { ok: false, err: '?' };
  };
  // місячне: бюджет, лояльність, ворожі кроти, перевербування джерел, витоки
  function monthly() {
    const P = S();
    N.forEach(n => { if (!n.alive || !n.agg) return; const H = isH(n.id); if (!P[n.id] && !H && !(n.agg.gdp > 400)) return; const st = G.spyState(n.id);
      ['int', 'ext'].forEach(side => { const s = st[side]; const b = G.spyBudget(n.id, s); n.cash -= b; s.loy = clamp(s.loy + (n.cash > 0 ? 1 : -4) + (s.ch.tr === 'loyal' ? 1 : 0) - (s.ch.tr === 'para' ? 1 : 0), 0, 100);
        if (s.ch.tr === 'chat' && G.rnd() < 0.08 && H) G.say(`🍸 Керівник ${side === 'int' ? 'СБ' : 'розвідки'} ${s.ch.name} розповів у барі «трохи зайвого». Бармен тепер знає всі наші секрети`, 'bad', [n.id]);
        if (s.loy < 25 && G.rnd() < 0.2 && H) { const c = s.ch.name; s.ch = chief(); s.loy = 50; G.say(`🏃 Керівник ${side === 'int' ? 'СБ' : 'розвідки'} ${c} втік за кордон і пише книгу «Як я працював на вас». Призначено нового: ${s.ch.name}`, 'bad', [n.id]); } });
      // ворожі кроти: держави з поганими відносинами насаджують агентів
      const foes = N.filter(x => x.alive && x.agg && x.id !== n.id && (G.atWar(x.id, n.id) || G.rel[x.id][n.id] < -30) && x.agg.gdp > 50);
      if (foes.length && st.moles.length < 3 && G.rnd() < 0.06 * (1 - st.int.lvl * 0.12)) { const f = pick(foes); st.moles.push({ by: f.id, svc: pick(['int', 'ext']), name: G.fakeName(), d: G.day, found: 0 }); }
      // кроти шкодять: ворог бачить ваші армії
      st.moles.forEach(m => { if (!m.found && N[m.by]) { N[m.by].recon = N[m.by].recon || {}; N[m.by].recon[n.id] = G.day + 35; } });
      // параноїк знаходить сам
      if (st.int.ch.tr === 'para' && G.rnd() < 0.15) { const m = st.moles.find(q => !q.found); if (m) { m.found = G.day; if (H) G.say(`🐀 Параноя окупилась: ${st.int.ch.name} викрив крота ${m.name}`, 'good', [n.id]); } }
      // джерела можуть бути перевербовані контррозвідкою цілі
      st.src.forEach(r => { if (!r.turned && G.rnd() < 0.03 * (P[r.x] ? P[r.x].int.lvl : 1.5)) r.turned = G.day; });
      // ШІ теж керує службами (простий автопілот)
      if (!H) { ['int', 'ext'].forEach(side => { const s = st[side]; if (s.ops.length < s.lvl && G.rnd() < 0.3) { if (side === 'int') G.spyStart(n.id, 'int', pick(['mole', 'corr', 'terror'])); else { const t = foes.length ? pick(foes) : null; if (t) G.spyStart(n.id, 'ext', st.src.some(r => r.x === t.id) ? pick(['plans', 'tech', 'disinfo']) : 'recruit', t.id); } } }); if (st.int.lvl < 3 && n.cash > G.spyLvlCost(n.id, st.int.lvl + 1) * 6 && G.rnd() < 0.1) G.spyUp(n.id, 'int'); }
    });
  }
  function daily() { const P = S(); for (const k in P) { const st = P[k], nid = +k; if (!N[nid] || !N[nid].alive) continue; ['int', 'ext'].forEach(side => { const s = st[side]; const due = s.ops.filter(o => o.end <= G.day); if (!due.length) return; s.ops = s.ops.filter(o => o.end > G.day); due.forEach(o => { if (o.x == null || (N[o.x] && N[o.x].alive)) finish(nid, side, o); }); }); } }
  // ворожі ШІ-служби проти людей: інколи підтримують опозицію чи крадуть технології (захист — рівень СБ)
  function aiVsHuman() { N.forEach(n => { if (!n.alive || !isH(n.id)) return; const st = G.spyState(n.id); const foes = N.filter(x => x.alive && x.agg && !isH(x.id) && (G.atWar(x.id, n.id) || G.rel[x.id][n.id] < -40));
    if (!foes.length || G.rnd() > 0.15 * (1 - st.int.lvl * 0.15) * ((st.terrorUntil || 0) > G.day ? 0.5 : 1)) return; const f = pick(foes); const k = pick(['opp', 'tech', 'sab']);
    if (k === 'opp') { n.stab = clamp(n.stab - 2, 0, 100); G.say(`🕵 ${f.name} фінансує вашу опозицію. Стабільність −2. СБ «працює над цим»`, 'bad', [n.id]); }
    else if (k === 'tech') { G.say(`💾 Хакери ${f.name} поцупили креслення. На щастя — креслення тостера`, 'info', [n.id]); }
    else { const reg = ter.filter(t => t.ctrl === n.id); const t = pick(reg); if (t) { t.gdp *= 0.997; G.say(`⚡ Диверсія в регіоні «${T[t.i].n}»: слід веде до ${f.name}. Офіційно — «бобри перегризли кабель»`, 'bad', [n.id]); } } }); }
  // охорона першої особи знижує ризики безпеки персонажа (якщо модуль безпеки питає)
  G.leaderGuarded = nid => { const st = S()[nid]; return !!(st && (st.guardUntil || 0) > G.day); };
  G.act.spyStart = (side, k, x) => G.spyStart(G.player, side, k, x); G.act.spyUp = side => G.spyUp(G.player, side); G.act.spyHire = (side, i) => G.spyHire(G.player, side, i); G.act.moleDo = (i, k) => G.moleDo(G.player, i, k);
  G.h29.d.push(daily); G.h29.m.push(monthly, aiVsHuman);
});
