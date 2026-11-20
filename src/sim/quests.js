// ДОРУЧЕННЯ (квести): завжди 3 активні завдання з терміном і нагородою — для держави, компанії й персонажа.
// Виконав — нагорода й нове завдання; прострочив — завдання змінюється (без штрафу, крім слави для персонажа).
LORA.sim.register('quests', 99.72, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const mine = nid => ter.filter(t => t.owner === nid);
  const lvlSum = (nid, g) => mine(nid).reduce((s, t) => s + Object.entries(t.bld).reduce((a, [k, v]) => a + (G.D.buildings[k] && (!g || G.D.buildings[k].g === g) ? v : 0), 0), 0);
  const GN = { extract: 'видобутку', agro: 'агро', industry: 'промисловості', energy: 'енергетики', military: 'оборонки', logistics: 'логістики', social: 'соціальних', digital: 'інтернету' };
  // шаблони: id, текст(параметри), старт(стан) → base, прогрес(стан, base, q) → 0..1, нагорода
  const QN = [
    ['bld', q => `Збудувати ${q.v} рівнів будівель ${GN[q.g]}`, (n, q) => { q.g = pick(Object.keys(GN)); q.v = 2 + Math.floor(G.rnd() * 3); return lvlSum(n.id, q.g); }, (n, b, q) => (lvlSum(n.id, q.g) - b) / q.v, 'cash'],
    ['stab', q => `Підняти стабільність до ${q.v}`, (n, q) => { q.v = Math.min(95, Math.round(n.stab + 6 + G.rnd() * 6)); return n.stab; }, (n, b, q) => (n.stab - b) / Math.max(1, q.v - b), 'sci'],
    ['res', q => `Завершити ${q.v} досліджень`, (n, q) => { q.v = 2; return Object.keys(n.res.done).length; }, (n, b, q) => (Object.keys(n.res.done).length - b) / q.v, 'cash'],
    ['rel', q => `Покращити відносини з ${N[q.x].name} до 50`, (n, q) => { const L = N.filter(x => x.alive && x.id !== n.id && !G.atWar(x.id, n.id) && G.rel[x.id][n.id] > 0 && G.rel[x.id][n.id] < 40 && x.agg && x.agg.gdp > 100); const x = L.length ? pick(L) : null; q.x = x ? x.id : 0; q.v = 50; return x ? G.rel[x.id][n.id] : 0; }, (n, b, q) => (G.rel[q.x][n.id] - b) / Math.max(1, 50 - b), 'stab'],
    ['cash', q => `Накопичити резерви $${q.v.toFixed(1)} млрд`, (n, q) => { q.v = Math.max(1, n.cash * 1.3 + n.agg.gdp * 0.01); return n.cash; }, (n, b, q) => (n.cash - b) / Math.max(0.01, q.v - b), 'stab'],
    ['grow', q => `Вийти на зростання ВВП ≥ ${(q.v * 100).toFixed(1)}%`, (n, q) => { q.v = Math.max(0.01, (n.growth || 0) + 0.004); return 0; }, (n, b, q) => (n.growth || 0) >= q.v ? 1 : clamp((n.growth || 0) / q.v, 0, 0.99), 'sci'],
    ['war', q => `Звільнити або захопити регіон`, (n, q) => { q.v = 1; return ter.filter(t => t.ctrl === n.id).length; }, (n, b, q) => ter.filter(t => t.ctrl === n.id).length > b ? 1 : 0, 'cash', n => G.enemiesOf(n.id).length > 0]
  ];
  const QC = [
    ['cprof', q => `Заробити ${G.fmt$(q.v)} чистими`, (c, q) => { q.v = Math.max(0.05, Math.abs(c.profitY || 0) * 0.3 + 0.05); return c.cash; }, (c, b, q) => (c.cash - b) / q.v, 'rep'],
    ['cbld', q => `Збудувати ${q.v} нові активи`, (c, q) => { q.v = 1 + Math.floor(G.rnd() * 2); return c.assets.reduce((s, a) => s + a.lvl, 0); }, (c, b, q) => (c.assets.reduce((s, a) => s + a.lvl, 0) - b) / q.v, 'ccash'],
    ['coff', q => `Відкрити офіс у новій країні`, (c, q) => new Set(c.offices.map(o => o.n)).size, (c, b) => new Set(c.offices.map(o => o.n)).size > b ? 1 : 0, 'ccash'],
    ['cinf', q => `Підняти вплив у ${N[q.x].name} до ${q.v}`, (c, q) => { q.x = c.home; q.v = Math.min(95, Math.round((c.infl[c.home] || 0) + 10)); return c.infl[c.home] || 0; }, (c, b, q) => ((c.infl[q.x] || 0) - b) / Math.max(1, q.v - b), 'rep'],
    ['crd', q => `Завершити розробку R&D`, (c, q) => Object.keys((c.rd || {}).done || {}).length, (c, b) => Object.keys((c.rd || {}).done || {}).length > b ? 1 : 0, 'ccash'],
    ['cten', q => `Виграти тендер або контракт`, (c, q) => (c.contracts || []).length + (c.supply || []).length + (c._won || 0), (c, b) => ((c.contracts || []).length + (c.supply || []).length + (c._won || 0)) > b ? 1 : 0, 'rep']
  ];
  const QL = [
    ['lpop', q => `Популярність у ${N[q.x].name} ≥ ${q.v}`, (L, q) => { q.x = L.home; q.v = Math.min(95, Math.round((L.popu[L.home] || 0) + 8)); return L.popu[L.home] || 0; }, (L, b, q) => ((L.popu[q.x] || 0) - b) / Math.max(1, q.v - b), 'fame'],
    ['lmon', q => `Заробити ${G.fmt$(q.v)}`, (L, q) => { q.v = Math.max(0.000005, (L.money || 0) * 0.5); return L.money; }, (L, b, q) => ((L.money || 0) - b) / q.v, 'fame'],
    ['lvis', q => `Відвідати ${q.v} різні країни`, (L, q) => { q.v = 2; return Object.keys(L.lastVisit || {}).length; }, (L, b, q) => (Object.keys(L.lastVisit || {}).length - b) / q.v, 'money'],
    ['lsk', q => `Підвищити будь-яку навичку`, (L, q) => Object.values(L.sk || {}).reduce((a, v) => a + v, 0), (L, b) => Object.values(L.sk || {}).reduce((a, v) => a + v, 0) > b ? 1 : 0, 'money'],
    ['lcon', q => `Звʼязки ≥ ${q.v} у ${N[q.x].name}`, (L, q) => { q.x = L.home; q.v = Math.min(95, Math.round((L.cont[L.home] || 0) + 10)); return L.cont[L.home] || 0; }, (L, b, q) => ((L.cont[q.x] || 0) - b) / Math.max(1, q.v - b), 'fame']
  ];
  function rewardText(q) { return { cash: `+${(q.rv * 1000 >= 1000 ? (q.rv).toFixed(1) + ' млрд' : (q.rv * 1000).toFixed(0) + ' млн')} $ до бюджету`, sci: `+${Math.round(q.rv)} очок науки`, stab: `+${q.rv.toFixed(0)} стабільності`, rep: `репутація +${q.rv.toFixed(0)}`, ccash: `+${G.fmt$(q.rv)} (держгрант)`, fame: `слава +${q.rv.toFixed(0)}`, money: `+${G.fmt$(q.rv)}` }[q.rew]; }
  function mk(tpl, subj, kind) { const [id, txt, start, , rew] = tpl; const q = { id, kind, d: G.day, until: G.day + 270 + Math.floor(G.rnd() * 180), rew }; q.base = start(subj, q); q.text = txt(q);
    const n = kind === 'n' ? subj : null; q.rv = rew === 'cash' ? Math.max(0.2, n.agg.gdp * 0.003) : rew === 'sci' ? 150 + (n ? n.res.pts || 0 : 0) * 0.3 : rew === 'stab' ? 4 : rew === 'rep' ? 6 : rew === 'ccash' ? Math.max(0.05, (subj.cash || 0) * 0.05) : rew === 'fame' ? 4 : Math.max(0.0000005, Math.min((subj.money || 0) * 0.08, 0.00002 + (subj.money || 0) * 0.03)); q.rt = rewardText(q); return q; }
  function fill(list, T, subj, kind) { const have = new Set(list.map(q => q.id)); let g = 0; while (list.length < 3 && g++ < 20) { const tpl = pick(T); if (have.has(tpl[0]) || (tpl[5] && !tpl[5](subj))) continue; list.push(mk(tpl, subj, kind)); have.add(tpl[0]); } }
  function step(list, T, subj, kind, say) {
    for (const q of list.slice()) { const tpl = T.find(x => x[0] === q.id); if (!tpl) { list.splice(list.indexOf(q), 1); continue; } let p = 0; try { p = clamp(tpl[3](subj, q.base, q), 0, 1); } catch (e) { } q.p = p;
      if (p >= 1) { list.splice(list.indexOf(q), 1); give(q, subj, kind); say(`📜 Доручення виконано: ${q.text} — ${q.rt}`); }
      else if (G.day > q.until) { list.splice(list.indexOf(q), 1); if (kind === 'L') subj.fame = Math.max(0, subj.fame - 1); say(`⌛ Доручення прострочено: ${q.text}`); } }
    fill(list, T, subj, kind);
  }
  function give(q, s, kind) { if (q.rew === 'cash') s.cash += q.rv; if (q.rew === 'sci') { const R = G.resEnsure(s); const b = Object.keys(G.D.techBranches); b.forEach(k => { R.bp[k] = (R.bp[k] || 0) + q.rv / b.length; }); } if (q.rew === 'stab') s.stab = Math.min(100, s.stab + q.rv);
    if (q.rew === 'rep') s.rep = clamp((s.rep || 50) + q.rv, 0, 100); if (q.rew === 'ccash') s.cash += q.rv; if (q.rew === 'fame') s.fame += q.rv; if (q.rew === 'money') s.money += q.rv; G.questsDone = (G.questsDone || 0) + 1; }
  G.questsMonthly = function () {
    N.forEach(n => { if (!n.alive || !G.isHuman(n.id) || !n.agg) return; n.quests = n.quests || []; step(n.quests, QN, n, 'n', m => G.say(m, 'good', [n.id])); });
    G.companies.forEach(c => { if (!c.alive || c.ai) return; c.quests = c.quests || []; step(c.quests, QC, c, 'c', m => G.say(m, 'good', [c.home])); });
    Object.values(G.leaders || {}).forEach(L => { if (!L || L.role !== 'char') return; L.quests = L.quests || []; L.quests.forEach(q => { if (q.rew === 'money') { q.rv = Math.max(0.0000005, Math.min((L.money || 0) * 0.08, 0.00002 + (L.money || 0) * 0.03)); q.rt = rewardText(q); } if (q.id === 'lmon' && q.v > Math.max(0.000005, (L.money || 0) * 0.5) * 4) { q.v = Math.max(0.000005, (L.money || 0) * 0.5); q.text = `Заробити ${G.fmt$(q.v)}`; } }); step(L.quests, QL, L, 'L', m => G.say(`${m}`, 'good', [L.home])); });
  };
  G.myQuests = function () { if (G.player >= 0) return N[G.player].quests || []; const L = G.leader; const out = []; if (L && L.role === 'char') (L.quests || []).forEach(q => out.push(q)); const c = G.pc >= 0 && G.companies[G.pc]; if (c) (c.quests || []).forEach(q => out.push(q)); return out; };
  G.questReroll = function (i) { const list = G.player >= 0 ? N[G.player].quests : null; if (!list || !list[i]) return { ok: false, err: '?' }; const n = N[G.player]; const c = Math.max(0.05, n.agg.gdp * 0.0005); if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; n.cash -= c; list.splice(i, 1); fill(list, QN, n, 'n'); return { ok: true, msg: 'Нове доручення' }; };
  G.act.questReroll = i => G.questReroll(i);
});
