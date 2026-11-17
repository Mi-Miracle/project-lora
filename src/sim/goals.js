// ЦІЛІ Й НОВІ МЕХАНІКИ ГЕЙМПЛЕЮ
// • Цілі (досягнення) для кожного режиму — держава, компанія, персонаж: дають напрям і нагороди.
// • Полонені: капітуляція оточених армій дає полонених; обмін полоненими — стабільність, менше втоми від війни.
// • Іноземні добровольці: держава, що обороняється й має симпатії світу, може оголосити набір у легіон.
LORA.sim.register('goals', 97.5, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  // ---- полонені
  N.forEach(n => { n.pow = {}; });
  G.capturePOW = function (captor, from, k) { if (captor == null || captor < 0 || !N[captor]) return; const c = N[captor]; c.pow = c.pow || {}; c.pow[from] = (c.pow[from] || 0) + k; };
  G.powCan = function (nid, x) { const n = N[nid], o = N[x]; if (!o) return 'Невідома держава'; const a = (n.pow || {})[x] || 0, b = (o.pow || {})[nid] || 0; if (a < 0.2 || b < 0.2) return 'Обидві сторони мають утримувати полонених'; if ((n._powT || 0) > G.day) return `Наступний обмін через ${n._powT - G.day} дн.`; return null; };
  G.exchangePOW = function (nid, x) {
    const e = G.powCan(nid, x); if (e) return { ok: false, err: e }; const n = N[nid], o = N[x];
    if (!G.isHuman(x) && (o.warExh || 0) < 0.25 && G.rnd() < 0.5) { n._powT = G.day + 30; return { ok: false, err: `${o.name} поки відмовляється (спробуйте за місяць)` }; }
    const k = Math.min(n.pow[x], o.pow[nid]); n.pow[x] -= k; o.pow[nid] -= k; n._powT = o._powT = G.day + 60;
    [n, o].forEach(z => { z.stab = Math.min(100, z.stab + 2); z.warExh = Math.max(0, (z.warExh || 0) - 0.02); }); G.rel[nid][x] = clamp(G.rel[nid][x] + 3, -100, 100); G.rel[x][nid] = clamp(G.rel[x][nid] + 3, -100, 100);
    G.say(`🤝 Обмін полоненими: ${n.name} ↔ ${o.name} — повернулись додому ${(k * 1000).toFixed(0)} осіб`, 'good', [nid, x]); return { ok: true, k };
  };
  // ---- іноземні добровольці
  G.sympathy = nid => { let s = 0; N.forEach(x => { if (x.alive && x.id !== nid && G.rel[x.id][nid] > 30) s += Math.min(1, x.agg.pop / 50) * (G.rel[x.id][nid] - 30) / 70; }); return s; };
  G.legionCan = function (nid) { const n = N[nid]; if (!G.enemiesOf(nid).length) return 'Лише під час війни'; if (!ter.some(t => t.owner === nid && t.ctrl !== nid)) return 'Лише для держави, частину якої окуповано'; if (n.legion) return 'Легіон уже створено'; if (G.sympathy(nid) < 1) return 'Замало симпатиків у світі'; return null; };
  G.createLegion = function (nid) { const e = G.legionCan(nid); if (e) return { ok: false, err: e }; const n = N[nid]; n.legion = { since: G.day }; n.cash -= 0.2; G.say(`🌍 ${n.name} оголошує набір іноземних добровольців до Інтернаціонального легіону`, 'good', [nid]); return { ok: true }; };
  function legionMonthly(n) {
    if (!n.legion || !G.enemiesOf(n.id).length) return; const k = Math.min(6, 0.6 * G.sympathy(n.id)); if (k < 0.3) return;
    let a = G.armies.find(x => x.n === n.id && x.legion); const home = n.home != null && ter[n.home].ctrl === n.id ? n.home : ter.findIndex(t => t.owner === n.id && t.ctrl === n.id); if (home < 0) return;
    if (!a) { G._tpl = 'assault'; a = G.newArmy(n.id, home, k, G.isHuman(n.id) || LORA.lang !== 'en' ? 'Інтернаціональний легіон' : 'International Legion'); a.legion = true; a.auto = !G.isHuman(n.id); a.org = 0.6; } else a.k += k;
  }
  // ---- цілі
  const GL = G.D.goals = {
    nation: [
      { id: 'gdp20', n: 'Економічне диво', d: 'ВВП +20% від стартового', r: { cash: 5, stab: 3 }, ok: (n, s) => n.agg.gdp >= s.gdp * 1.2 },
      { id: 'stab70', n: 'Згуртована нація', d: 'стабільність ≥ 70', r: { cash: 2 }, ok: n => n.stab >= 70 },
      { id: 'liberate', n: 'Цілісність', d: 'контролювати всі свої регіони', r: { stab: 6 }, ok: n => !ter.some(t => t.owner === n.id && t.ctrl !== n.id) },
      { id: 'tech5', n: 'Наукова держава', d: 'дослідити 5 нових технологій', r: { cash: 3 }, ok: (n, s) => Object.values(n.res.done).filter(v => v >= 0).length >= 5 },
      { id: 'sat', n: 'Свій супутник', d: 'мати власний супутник на орбіті', r: { stab: 2 }, ok: n => !!(n.space && n.space.launched > 0) },
      { id: 'proj', n: 'Великий проєкт', d: 'завершити національний проєкт', r: { cash: 4 }, ok: n => Object.values(n.proj || {}).some(p => p.ok) },
      { id: 'bloc', n: 'Своя серед своїх', d: 'вступити до нового блоку (ЄС, НАТО…)', r: { stab: 5 }, ok: (n, s) => G.blocsOf(n.id).length > s.blocs },
      { id: 'net80', n: 'Цифрова країна', d: 'інтернет ≥ 80%', r: { cash: 2 }, ok: n => n.net >= 0.8 },
      { id: 'friends', n: 'Друзі по всьому світу', d: '25 держав з відносинами ≥ 60', r: { stab: 3 }, ok: n => N.filter(x => x.alive && x.id !== n.id && G.rel[x.id][n.id] >= 60).length >= 25 },
      { id: 'general5', n: 'Легендарний полководець', d: 'генерал з навичкою ★★★★★', r: { stab: 2 }, ok: n => (G.generals || []).some(g => g.n === n.id && g.skill >= 5) },
      { id: 'peace', n: 'Миротворець', d: 'укласти мир у війні', r: { stab: 5, cash: 3 }, ok: (n, s) => s.wars > 0 && G.enemiesOf(n.id).length < s.wars }
    ],
    company: [
      { id: 'val2', n: 'Подвоїти капітал', d: 'вартість компанії ×2', r: { cash: 1 }, ok: (c, s) => G.coValue(c) >= s.val * 2 },
      { id: 'off5', n: 'Транснаціональна', d: 'офіси в 5 країнах', r: { cash: 1 }, ok: c => new Set(c.offices.map(o => o.n)).size >= 5 },
      { id: 'asset10', n: 'Промислова імперія', d: '10 активів', r: { cash: 2 }, ok: c => c.assets.length >= 10 },
      { id: 'infl', n: 'Сіра кардинал', d: 'вплив ≥ 50 у будь-якій країні', r: { cash: 1 }, ok: c => Object.values(c.infl || {}).some(v => v >= 50) },
      { id: 'profit', n: 'Мільярдний прибуток', d: 'прибуток ≥ $1 млрд/рік', r: { cash: 1 }, ok: c => (c.profitY || 0) >= 1 }
    ],
    char: [
      { id: 'cont3', n: 'Свій у трьох столицях', d: 'звʼязки ≥ 50 у 3 країнах', r: { money: 0.05 }, ok: L => Object.values(L.cont).filter(v => v >= 50).length >= 3 },
      { id: 'fame50', n: 'Світова знаменитість', d: 'слава ≥ 50', r: { money: 0.05 }, ok: L => L.fame >= 50 },
      { id: 'rich', n: 'Статок', d: '$0.5 млрд особистих коштів', r: { money: 0 }, ok: L => L.money >= 0.5 },
      { id: 'cand', n: 'У великій політиці', d: 'стати кандидатом на виборах', r: { money: 0.02 }, ok: L => L.cand != null },
      { id: 'pres', n: 'Президент', d: 'очолити державу', r: { money: 0.1 }, ok: () => G.player >= 0 }
    ]
  };
  G.goalsMode = () => G.player >= 0 ? 'nation' : G.pc >= 0 && G.companies && G.companies[G.pc] ? 'company' : 'char';
  G.goalsInit = function () {
    const m = G.goalsMode(); G.goals = { mode: m, done: {}, start: {} }; const s = G.goals.start;
    if (m === 'nation') { const n = N[G.player]; s.gdp = n.agg.gdp; s.blocs = G.blocsOf(n.id).length; s.wars = G.enemiesOf(n.id).length; }
    if (m === 'company') s.val = G.coValue(G.myCo());
  };
  G.goalsMonthly = function () {
    if (!G.goals || G.goals.mode !== G.goalsMode()) G.goalsInit(); const m = G.goals.mode, L = GL[m];
    const subj = m === 'nation' ? N[G.player] : m === 'company' ? G.myCo() : G.leader; if (!subj) return;
    for (const g of L) { if (G.goals.done[g.id]) continue; let ok = false; try { ok = g.ok(subj, G.goals.start); } catch (e) { } if (!ok) continue;
      G.goals.done[g.id] = G.day; const r = g.r || {};
      if (m === 'nation') { if (r.cash) subj.cash += r.cash; if (r.stab) subj.stab = Math.min(100, subj.stab + r.stab); }
      if (m === 'company' && r.cash) subj.cash += r.cash; if (m === 'char' && r.money) subj.money += r.money;
      G.say(`🏆 Ціль досягнуто: «${g.n}» — ${g.d}`, 'good', [G.player >= 0 ? G.player : -1]); if (LORA.bus) LORA.bus.emit('goal', g); }
  };
  G.monthlyExtra = function () { N.forEach(n => { if (n.alive) legionMonthly(n); });
    // полонені з боїв: частка втрат ворога потрапляє в полон
    N.forEach(n => { if (!n.alive) return; const d = (n.casualties || 0) - (n._casP || 0); n._casP = n.casualties || 0; const en = G.enemiesOf(n.id); if (d > 0 && en.length) G.capturePOW(en[0], n.id, d * 0.04); });
    // ШІ: обмін полоненими й легіон
    for (const w of G.wars.values()) { const a = N[w.a], b = N[w.b]; if ((G.isHuman(a.id) || G.isHuman(b.id)) && !G.autoPlayer) continue; if (!G.powCan(a.id, b.id) && G.rnd() < 0.25) G.exchangePOW(a.id, b.id); }
    N.forEach(n => { if (n.alive && (!G.isHuman(n.id) || G.autoPlayer) && !n.legion && !G.legionCan(n.id) && G.rnd() < 0.2) G.createLegion(n.id); });
    G.goalsMonthly();
  };
  G.act.exchangePOW = x => G.player >= 0 ? G.exchangePOW(G.player, x) : { ok: false, err: 'Лише за державу' };
  G.act.createLegion = () => G.player >= 0 ? G.createLegion(G.player) : { ok: false, err: 'Лише за державу' };
});
