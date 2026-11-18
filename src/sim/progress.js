// ЦІЛІ Й СТРАТЕГІЇ: досягнення персонажа й компанії з нагородами; корпоративна стратегія з постійними ефектами.
LORA.sim.register('progress', 99.69, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const W = L => G.lifeWealth ? G.lifeWealth(L) : L.money || 0, own = (L, k) => (L.own || []).some(o => o.k === k);
  G.LIFE_GOALS = [
    ['g_m1', '💵', 'Перший мільйон', L => W(L) >= 0.001, { fame: 1 }], ['g_m10', '💰', '10 мільйонів', L => W(L) >= 0.01, { fame: 2 }],
    ['g_m100', '🏦', '100 мільйонів', L => W(L) >= 0.1, { fame: 4 }], ['g_b1', '👑', 'Мільярдер', L => W(L) >= 1, { fame: 10 }],
    ['g_job5', '📈', 'Вершина професії (рівень 5)', L => L.job && L.job.lvl >= 5, { fame: 3 }], ['g_sk', '🎓', 'Три навички на рівні 3+', L => Object.values(L.sk || {}).filter(v => v >= 3).length >= 3, { fame: 3 }],
    ['g_party', '🎗', 'Власна партія', L => !!L.party, { fame: 2 }], ['g_seats', '🏛', 'Партія в парламенті', L => L.party && L.party.seats > 0, { fame: 5 }],
    ['g_coal', '🤝', 'Коаліція', L => L.party && L.party.coal, { fame: 4 }], ['g_mp', '🗳', 'Депутатський мандат', L => L.mp != null, { fame: 4 }],
    ['g_co', '🏢', 'Власна компанія', L => G.pc >= 0, { fame: 3 }], ['g_club', '⚽', 'Власник спортивного клубу', L => own(L, 'club_f') || own(L, 'club_b') || own(L, 'f1'), { fame: 4 }],
    ['g_media', '📺', 'Медіамагнат', L => own(L, 'tvch') || (L.own || []).filter(o => G.LUX[o.k].c === 'media').length >= 2, { fame: 4 }],
    ['g_jet', '✈', 'Джет-сет', L => (L.own || []).some(o => G.LUX[o.k].c === 'jet'), { fame: 2 }], ['g_world', '🌍', 'Звʼязки в 10 країнах', L => Object.values(L.cont || {}).filter(v => v >= 30).length >= 10, { fame: 5 }],
    ['g_inv', '📊', 'Інвестор (портфель ≥ $50 млн)', L => G.invValue && G.invValue(L).tot >= 0.05, { fame: 2 }], ['g_pres', '🏆', 'Президент', L => G.player >= 0 && L.role !== 'char', { fame: 15 }]
  ];
  G.CO_GOALS = [
    ['c_p1', '💹', 'Прибуток $100 млн/рік', c => c.profitY >= 0.1, { rep: 3 }], ['c_p2', '💎', 'Прибуток $1 млрд/рік', c => c.profitY >= 1, { rep: 6 }],
    ['c_a10', '🏭', '10 рівнів активів', c => c.assets.reduce((s, a) => s + a.lvl, 0) >= 10, { rep: 3 }], ['c_o5', '🌐', 'Офіси в 5 країнах', c => new Set(c.offices.map(o => o.n)).size >= 5, { rep: 4 }],
    ['c_rd', '🔬', '5 власних розробок', c => c.rd && Object.keys(c.rd.done).length >= 5, { rep: 3 }], ['c_v10', '🏙', 'Вартість $10 млрд', c => G.coValue(c) >= 10, { rep: 5 }],
    ['c_u50', '📱', '50 млн користувачів', c => c.dg && c.dg.users >= 50, { rep: 4 }], ['c_ctl', '🦈', 'Контрольний пакет іншої компанії', c => G.companies.some(o => o !== c && G.stockController && G.stockController(o.id) === 'c' + c.id), { rep: 5 }],
    ['c_inf', '🏛', 'Вплив ≥ 50 у країні', c => Object.values(c.infl || {}).some(v => v >= 50), { rep: 3 }]
  ];
  G.CO_STRAT = {
    balanced: { n: 'Збалансована', ic: '⚖', d: 'без особливих ефектів' },
    cost:     { n: 'Лідер за витратами', ic: '✂', d: 'прибуток активів +6%, але репутація поволі падає' },
    premium:  { n: 'Преміум-бренд', ic: '💎', d: 'репутація росте; з репутацією ≥ 60 прибуток +8%, інакше −5%' },
    export:   { n: 'Експансія', ic: '🌍', d: 'вплив у всіх країнах з офісами росте щомісяця' },
    green:    { n: 'Зелена', ic: '🌱', d: 'репутація росте, забруднення країн присутності менше; прибуток −3%' },
    aggressive:{ n: 'Агресивна', ic: '🦈', d: 'вплив росте швидко, але бувають скандали (репутація −8)' }
  };
  const baseAP = G.assetProfit; G.assetProfit = function (c, a) { let p = baseAP(c, a); const s = c && c.strat; if (!s || !p) return p;
    if (s === 'cost') p *= 1.06; else if (s === 'premium') p *= (c.rep || 50) >= 60 ? 1.08 : 0.95; else if (s === 'green') p *= 0.97; return p; };
  G.coSetStrat = function (c, k) { if (!c || !G.CO_STRAT[k]) return { ok: false, err: '?' }; if (c.stratD && G.day - c.stratD < 180) return { ok: false, err: `Стратегію можна міняти раз на пів року (ще ${180 - (G.day - c.stratD)} дн.)` }; c.strat = k; c.stratD = G.day; return { ok: true, msg: G.CO_STRAT[k].n }; };
  G.progressMonthly = function () {
    Object.values(G.leaders || {}).forEach(L => { if (!L || (L.role !== 'char' && !L.goals)) return; L.goals = L.goals || {};
      for (const [id, ic, n, ok, rw] of G.LIFE_GOALS) { if (L.goals[id]) continue; let v = false; try { v = ok(L); } catch (e) { } if (!v) continue; L.goals[id] = G.day; L.fame = (L.fame || 0) + (rw.fame || 0); if (G.leader === L) G.say(`🏅 Досягнення: ${ic} ${n} (слава +${rw.fame})`, 'good', [L.home]); } });
    G.companies.forEach(c => { if (!c.alive) return; const s = c.strat;
      if (s === 'cost') c.rep = clamp((c.rep || 50) - 0.3, 0, 100); if (s === 'premium' || s === 'green') c.rep = clamp((c.rep || 50) + 0.4, 0, 100);
      if (s === 'export' || s === 'aggressive') c.offices.forEach(o => { c.infl[o.n] = clamp((c.infl[o.n] || 0) + (s === 'aggressive' ? 0.35 : 0.2), 0, 100); });
      if (s === 'green') c.offices.forEach(o => { const n = N[o.n]; if (n && n.poll) n.poll = Math.max(0, n.poll - 0.05); });
      if (s === 'aggressive' && G.rnd() < 0.03) { c.rep = clamp((c.rep || 50) - 8, 0, 100); if (!c.ai) G.say(`📰 Скандал навколо агресивних методів «${c.name}»: репутація −8`, 'bad', [c.home]); }
      if (c.ai) return; c.goals = c.goals || {};
      for (const [id, ic, n, ok, rw] of G.CO_GOALS) { if (c.goals[id]) continue; let v = false; try { v = ok(c); } catch (e) { } if (!v) continue; c.goals[id] = G.day; c.rep = clamp((c.rep || 50) + (rw.rep || 0), 0, 100); G.say(`🏅 «${c.name}»: досягнення ${ic} ${n} (репутація +${rw.rep})`, 'good', [c.home]); } });
  };
  G.act.coStrat = k => G.pc >= 0 ? G.coSetStrat(G.myCo(), k) : { ok: false };
});
