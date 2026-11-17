// МІЖНАРОДНІ БЛОКИ: НАТО, ЄС, ОДКБ, ШОС, БРІКС, G7, АСЕАН, АС, ОПЕК+, Ліга арабських держав.
// Кожен блок має раду (а ЄС — ще й Європарламент), правило ухвалення рішень і порядок денний: пакети допомоги, санкції,
// посилена присутність військ, оборонні витрати, вступ нових членів, квоти ОПЕК+. Члени (ШІ) голосують за своїми інтересами,
// гравець-член голосує сам, може вносити пропозиції, а не-член — подавати заявку на вступ (лідер має бути в штаб-квартирі блоку).
LORA.sim.register('blocs', 96, function (G) {
  const { N, ter } = G; const U = LORA.core, clamp = U.clamp; const ix = a3 => G.nIdx[a3];
  const DEF = {
    nato:  { n: 'НАТО', type: 'mil', hq: 'BEL', council: 'Північноатлантична рада', rule: 'consensus', ic: '🛡', all: 'НАТО' },
    eu:    { n: 'Європейський Союз', type: 'econ', hq: 'BEL', council: 'Рада ЄС', parl: 'Європарламент', rule: 'unanimity_sanctions', ic: '🇪🇺', m: G.D.eu },
    csto:  { n: 'ОДКБ', type: 'mil', hq: 'RUS', council: 'Рада колективної безпеки', rule: 'leader', ic: '🔺', all: 'ОДКБ' },
    sco:   { n: 'ШОС', type: 'pol', hq: 'CHN', council: 'Рада глав держав ШОС', rule: 'consensus', ic: '🔶', m: 'CHN RUS IND PAK KAZ KGZ TJK UZB IRN BLR' },
    brics: { n: 'БРІКС', type: 'econ', hq: 'CHN', council: 'Саміт БРІКС', rule: 'consensus', ic: '🟡', m: 'BRA RUS IND CHN ZAF EGY ETH IRN ARE IDN' },
    g7:    { n: 'G7', type: 'pol', hq: 'USA', council: 'Саміт G7', rule: 'consensus', ic: '⚪', m: 'USA CAN GBR FRA DEU ITA JPN' },
    asean: { n: 'АСЕАН', type: 'econ', hq: 'IDN', council: 'Саміт АСЕАН', rule: 'consensus', ic: '🟢', m: 'IDN THA MYS SGP PHL VNM LAO KHM MMR BRN' },
    au:    { n: 'Африканський союз', type: 'pol', hq: 'ETH', council: 'Асамблея АС', rule: 'majority', ic: '🟤', m: 'NGA ZAF EGY ETH KEN DZA MAR GHA AGO TZA COD SEN CIV CMR UGA SDN TUN LBY ZMB ZWE MOZ MDG MLI NER TCD BFA SOM RWA' },
    opec:  { n: 'ОПЕК+', type: 'econ', hq: 'AUT', council: 'Конференція ОПЕК+', rule: 'leader', ic: '🛢', m: 'SAU RUS IRQ ARE KWT IRN NGA DZA LBY KAZ OMN AZE VEN AGO' },
    arab:  { n: 'Ліга арабських держав', type: 'pol', hq: 'EGY', council: 'Рада Ліги', rule: 'majority', ic: '🟩', m: 'EGY SAU ARE KWT QAT BHR OMN JOR IRQ SYR LBN YEM LBY TUN DZA MAR SDN' }
  };
  G.blocs = {};
  Object.entries(DEF).forEach(([id, d]) => {
    let m = []; if (d.all) { const al = G.alliances.find(a => a.name === d.all); m = al ? [...al.m] : []; } else m = (d.m || '').split(' ').map(ix).filter(x => x != null);
    G.blocs[id] = { id, n: d.n, type: d.type, hq: ix(d.hq), council: d.council, parl: d.parl || null, rule: d.rule, ic: d.ic, m, agenda: [], hist: [], apps: [], presence: {} };
  });
  G.blocsOf = nid => Object.values(G.blocs).filter(b => b.m.includes(nid));
  G.blocLeader = b => b.m.reduce((best, x) => !best || (N[x].agg && N[best].agg && N[x].agg.gdp > N[best].agg.gdp) ? x : best, null);
  const syncAlliance = b => { const d = DEF[b.id]; if (!d.all) return; let al = G.alliances.find(a => a.name === d.all); if (!al) { al = { name: d.all, m: new Set() }; G.alliances.push(al); } al.m = new Set(b.m); };

  // ---- пропозиції
  const KINDS = {
    aid:      { n: 'Пакет допомоги', d: 'Члени передають зброю й гроші' },
    sanction: { n: 'Пакет санкцій', d: 'Усі члени запроваджують санкції' },
    presence: { n: 'Посилена присутність військ', d: 'Союзні війська й ППО на кордоні члена: оборона +20%' },
    defense:  { n: 'Підвищення оборонних витрат', d: 'Члени збільшують оборонний бюджет' },
    join:     { n: 'Вступ нового члена', d: 'Прийняти державу до блоку' },
    oilcut:   { n: 'Скорочення видобутку нафти', d: 'Квоти: нафта дорожчає' },
    trade:    { n: 'Спільний ринок / торговельна угода', d: 'Торговельні угоди між усіма членами' }
  };
  G.blocKinds = KINDS;
  G.blocPropose = function (bid, kind, target, by, quiet) {
    const b = G.blocs[bid]; if (!b) return { ok: false, err: 'Немає блоку' };
    const selfAid = kind === 'aid' && target === by && !b.m.includes(by); // партнер просить допомоги в блоку — особисто в штаб-квартирі
    if (selfAid && G.leader && by === G.player && G.leader.role === 'president' && G.leaderNation() !== b.hq) return { ok: false, err: `Лідер має бути в штаб-квартирі: ${N[b.hq].name}` };
    if (kind !== 'join' && !selfAid && !b.m.includes(by)) return { ok: false, err: 'Ви не член блоку' };
    if (b.agenda.some(a => a.kind === kind && a.target === target)) return { ok: false, err: 'Таке питання вже на порядку денному' };
    b.cool = b.cool || {}; if (b.cool[kind + target] > G.day) return { ok: false, err: `Повторно — після ${G.dateStr(b.cool[kind + target])}` }; b.cool[kind + target] = G.day + (kind === 'aid' ? 90 : 150);
    if (kind === 'join' && b.m.includes(target)) return { ok: false, err: 'Вже член' };
    const it = { id: G.nextId++, kind, target, by, d: G.day, due: G.day + (kind === 'join' ? 60 : 21), votes: {} };
    b.agenda.push(it); if (!quiet) G.say(`${b.ic} ${b.n}: на порядку денному — «${KINDS[kind].n}${target != null ? ': ' + N[target].name : ''}»`, 'info', [...(target != null ? [target] : []), by]);
    return { ok: true };
  };
  G.blocApply = function (bid, nid) {
    const b = G.blocs[bid]; if (G.leader && nid === G.player && G.leader.role === 'president' && G.leaderNation() !== b.hq) return { ok: false, err: `Щоб подати заявку, лідер має приїхати до штаб-квартири: ${N[b.hq].name}` };
    return G.blocPropose(bid, 'join', nid, nid);
  };
  // голос ШІ-члена
  function aiVote(b, it, x) {
    const n = N[x], t = it.target, R = t != null ? G.rel[x][t] : 0; const prof = n.ai && n.ai.p ? n.ai.p : {};
    switch (it.kind) {
      case 'aid': return R > 25 && !G.atWar(x, t) && n.stab > 30 && (n.a3 !== 'HUN' || R > 55) ? 1 : R > 0 ? 0 : -1;
      case 'sanction': { const trade = (n.imp && n.imp[t] || 0) + (n.exp && n.exp[t] || 0); return R < -10 && !(trade > (n.agg ? n.agg.gdp * 0.02 : 1)) ? 1 : R < 15 ? 0 : -1; }
      case 'presence': return R > 30 ? 1 : 0;
      case 'defense': return n.ai && n.ai.threat > 1 ? 1 : n.agg && n.agg.gdp > 3000 ? 1 : G.rnd() < 0.5 ? 1 : 0;
      case 'join': { const enemies = G.enemiesOf(t); const risk = b.type === 'mil' && enemies.some(e => N[e].nuke); return R > 42 && !(risk && R < 65) ? 1 : R < 0 ? -1 : 0; }
      case 'oilcut': return n.a3 === 'SAU' || n.a3 === 'RUS' || G.rnd() < 0.6 ? 1 : 0;
      case 'trade': return 1;
    }
    return 0;
  }
  function decide(b, it) {
    const yes = Object.values(it.votes).filter(v => v > 0).length, no = Object.values(it.votes).filter(v => v < 0).length, all = b.m.length || 1;
    const lead = G.blocLeader(b);
    if (b.rule === 'leader') return it.votes[lead] > 0 && yes > no;
    if (b.rule === 'majority') return yes > all / 2;
    if (b.rule === 'unanimity_sanctions' && (it.kind === 'sanction' || it.kind === 'join')) return no === 0 && yes > all * 0.6;
    if (b.rule === 'unanimity_sanctions') { const pop = x => N[x].agg ? N[x].agg.pop : 1, tp = b.m.reduce((s, x) => s + pop(x), 0), yp = b.m.filter(x => it.votes[x] > 0).reduce((s, x) => s + pop(x), 0); return yes >= all * 0.55 && yp >= tp * 0.65; }
    return no === 0 && yes >= all * 0.7; // консенсус
  }
  function apply(b, it) {
    const t = it.target, tn = t != null ? N[t] : null;
    if (it.kind === 'aid') { let tot = 0; b.m.forEach(x => { if (x === t || !N[x].agg || G.atWar(x, t)) return; const a = N[x].agg.gdp * (b.type === 'mil' ? 0.00025 : 0.00018); N[x].cash -= a; tot += a; G.rel[t][x] = clamp(G.rel[t][x] + 2, -100, 100); }); tn.milStock += tot * 0.65; tn.cash += tot * 0.35; return `$${tot.toFixed(1)} млрд для ${tn.name}`; }
    if (it.kind === 'sanction') { b.m.forEach(x => { if (x !== t) G.sanctions.add(x + '>' + t); }); G.tradeDirty = true; tn.press = clamp((tn.press || 0) + 0.04, 0, 1); return `санкції проти ${tn.name}`; }
    if (it.kind === 'presence') { b.presence[t] = G.day + 365; ter.forEach(r => { if (r.owner === t && G.T[r.i].nb.some(j => ter[j].owner !== t && !b.m.includes(ter[j].owner))) { r.bfort = (r.bfort || 0) + 0.2; r.shield = Math.min(0.9, r.shield + 0.1); } }); return `війська союзників у ${tn.name}`; }
    if (it.kind === 'defense') { b.m.forEach(x => { if (!G.isHuman(x)) N[x].pol.mil = Math.min(0.12, N[x].pol.mil + 0.005); }); return 'оборонні витрати +0.5% ВВП'; }
    if (it.kind === 'join') { b.m.push(t); syncAlliance(b); b.m.forEach(x => { if (x !== t) { G.rel[x][t] = clamp(G.rel[x][t] + 5, -100, 100); G.rel[t][x] = clamp(G.rel[t][x] + 5, -100, 100); } }); if (b.type === 'econ') b.m.forEach(x => { if (x !== t) G.treaties.add(G.warKey(x, t)); }); G.tradeDirty = true; return `${tn.name} — новий член`; }
    if (it.kind === 'oilcut') { b.m.forEach(x => N[x].mods.push({ r: 'oil', mul: 0.95, until: G.day + 180 })); return 'видобуток −5% на пів року'; }
    if (it.kind === 'trade') { b.m.forEach(x => b.m.forEach(y => { if (x < y) G.treaties.add(G.warKey(x, y)); })); G.tradeDirty = true; return 'торговельні угоди між членами'; }
  }
  G.blocVote = function (bid, itId, nid, v) { const b = G.blocs[bid]; const it = b && b.agenda.find(a => a.id === itId); if (!it || !b.m.includes(nid)) return { ok: false, err: 'Голосувати можуть лише члени' }; it.votes[nid] = v; return { ok: true }; };
  // ---- автоматичний порядок денний (раз на місяць)
  function autoAgenda(b) {
    const lead = G.blocLeader(b); if (lead == null) return;
    const attacked = [...G.wars.values()].filter(w => w.att != null);
    attacked.forEach(w => {
      const a = w.att, v = w.a === w.att ? w.b : w.a; if (!N[v].alive || !N[a].alive || b.m.includes(a)) return;
      const care = b.m.includes(v) || b.m.filter(x => G.rel[x][v] > 28).length > b.m.length * 0.5;
      if (!care || G.rnd() > 0.35) return;
      if (b.type !== 'pol' || b.id === 'g7') { if (G.rnd() < 0.6) G.blocPropose(b.id, 'aid', v, lead, true); else if (b.type === 'econ' || b.id === 'g7') G.blocPropose(b.id, 'sanction', a, lead, true); }
      if (b.type === 'mil' && b.m.includes(v) === false) b.m.filter(x => G.T && ter.some(r => r.owner === x && G.T[r.i].nb.some(j => ter[j].owner === a))).slice(0, 1).forEach(x => { if (!b.presence[x]) G.blocPropose(b.id, 'presence', x, lead, true); });
    });
    if (b.type === 'mil' && G.rnd() < 0.05) G.blocPropose(b.id, 'defense', null, lead, true);
    if (b.id === 'opec' && G.prices && G.priceBase && G.prices.oil < G.priceBase.oil * 0.85 && G.rnd() < 0.4) G.blocPropose(b.id, 'oilcut', null, lead, true);
  }
  G.blocsMonthly = function () {
    Object.values(G.blocs).forEach(b => {
      b.m = b.m.filter(x => N[x] && N[x].alive); if (G.day % 30 === 0) autoAgenda(b);
      b.agenda.forEach(it => { b.m.forEach(x => { if (it.votes[x] == null && !G.isHuman(x)) it.votes[x] = aiVote(b, it, x); }); });
      const done = b.agenda.filter(it => G.day >= it.due);
      done.forEach(it => { b.m.forEach(x => { if (it.votes[x] == null) it.votes[x] = 0; }); const ok = decide(b, it); const res = ok ? apply(b, it) : '';
        const yes = Object.values(it.votes).filter(v => v > 0).length, no = Object.values(it.votes).filter(v => v < 0).length;
        b.hist.unshift({ d: G.day, kind: it.kind, target: it.target, ok, yes, no, res }); b.hist.length = Math.min(b.hist.length, 15);
        const rel = it.target != null && (G.isHuman(it.target) || it.kind === 'join') ? [it.target] : [];
        G.say(`${b.ic} ${b.council}: «${KINDS[it.kind].n}${it.target != null ? ': ' + N[it.target].name : ''}» — ${ok ? 'ухвалено' : 'відхилено'} (${yes} за, ${no} проти)${ok && res ? ' · ' + res : ''}`, ok ? (rel.length ? 'good' : 'info') : (rel.length ? 'bad' : 'info'), rel.concat(b.m.filter(x => G.isHuman(x))));
      });
      b.agenda = b.agenda.filter(it => G.day < it.due);
    });
  };
  // ШІ-держави самі подають заявки (рідко)
  G.blocsAiApply = function () { Object.values(G.blocs).forEach(b => { if (G.rnd() > 0.02) return; const cand = N.filter(n => n.alive && !G.isHuman(n.id) && !b.m.includes(n.id) && b.m.length && b.m.filter(x => G.rel[x][n.id] > 50).length > b.m.length * 0.7); const n = cand[Math.floor(G.rnd() * cand.length)]; if (n) G.blocPropose(b.id, 'join', n.id, n.id); }); };
});
// прохання про допомогу до окремої держави (лише під час особистого візиту лідера)
LORA.sim.register('aidRequest', 97, function (G) {
  const { N } = G;
  G.act.requestAid = function (x) {
    const me = G.player, n = N[x]; if (G.leaderBlocks && G.leaderBlocks(x)) return { ok: false, err: `Попросити допомоги можна лише особисто: лідер має бути в ${n.name}` };
    n._aidAsk = n._aidAsk || {}; if (n._aidAsk[me] > G.day) return { ok: false, err: `${n.name} повернеться до питання після ${G.dateStr(n._aidAsk[me])}` }; n._aidAsk[me] = G.day + 120;
    const r = G.rel[x][me], war = G.enemiesOf(me).length > 0, theirEnemy = G.enemiesOf(me).some(e => G.rel[x][e] < -20);
    const p = Math.max(0, Math.min(0.95, (r - 20) / 60 + (war ? 0.15 : -0.3) + (theirEnemy ? 0.2 : 0)));
    if (G.rnd() > p) { G.say(`🤝 ${n.name} чемно відмовляє в допомозі (шанс був ${(p * 100).toFixed(0)}%)`, 'bad', [me, x]); return { ok: true, refused: true }; }
    const amt = n.agg.gdp * (0.0008 + r / 100000); n.cash -= amt; N[me].milStock += amt * 0.7; N[me].cash += amt * 0.3; G.rel[me][x] = Math.min(100, G.rel[me][x] + 5);
    G.say(`📦 ${n.name} надає допомогу: $${amt.toFixed(1)} млрд (зброя й фінанси)`, 'good', [me, x]); return { ok: true, amt };
  };
});
// ДИПЛОМАТІЯ МІЖ ЛЮДЬМИ (онлайн): союз, торгова угода, доступ, мир і прохання про допомогу до іншого гравця-людини
// стають пропозицією, на яку він відповідає сам.
LORA.sim.register('humanDiplo', 98, function (G) {
  const { N } = G; const KIND = { alliance: 'союз', treaty: 'торговельну угоду', access: 'військовий доступ', peace: 'мир', requestAid: 'допомогу' };
  Object.keys(KIND).forEach(k => { const base = G.act[k]; if (!base) return;
    G.act[k] = function (x, ...rest) {
      if (!G._hExec && G.humans && G.humans.has(x) && x !== G.player) {
        if (k !== 'peace' && G.leaderBlocks && G.leaderBlocks(x)) return base(x, ...rest); // хай базова функція поверне помилку про візит
        if (G.pendingPeace.some(p => p.type === 'h_' + k && p.from === G.player && p.to === x)) return { ok: false, err: 'Пропозицію вже надіслано' };
        G.pendingPeace.push({ type: 'h_' + k, from: G.player, to: x, ptype: rest[0] });
        G.say(`✉ ${N[G.player].name} пропонує ${N[x].name}: ${KIND[k]}${k === 'peace' ? ` (${rest[0]})` : ''}`, 'info', [G.player, x]);
        return { ok: true, msg: 'Пропозицію надіслано гравцю' };
      }
      return base(x, ...rest);
    }; });
  const baseAns = G.act.answerPending;
  G.act.answerPending = function (idx, yes) {
    const p = G.pendingPeace[idx]; if (!p || !String(p.type).startsWith('h_')) return baseAns(idx, yes);
    G.pendingPeace.splice(idx, 1); const k = p.type.slice(2), a = p.from, b = p.to;
    if (!yes) { G.say(`✉ ${N[b].name} відхиляє пропозицію ${N[a].name}`, 'bad', [a, b]); return { ok: true }; }
    if (k === 'alliance') G.alliances.push({ name: `Союз ${G.nm(a)}–${G.nm(b)}`, m: new Set([a, b]) });
    if (k === 'treaty') { G.treaties.add(G.warKey(a, b)); G.tradeDirty = true; }
    if (k === 'access') { G.access.add(a + '>' + b); G.access.add(b + '>' + a); }
    if (k === 'peace') G.makePeace(a, b, p.ptype || 'white');
    if (k === 'requestAid') { const amt = N[b].agg.gdp * 0.0015; N[b].cash -= amt; N[a].milStock += amt * 0.7; N[a].cash += amt * 0.3; }
    G.rel[a][b] = Math.min(100, G.rel[a][b] + 5); G.rel[b][a] = Math.min(100, G.rel[b][a] + 5);
    G.say(`🤝 ${N[b].name} приймає пропозицію ${N[a].name}: ${KIND[k]}`, 'good', [a, b]); return { ok: true };
  };
});
