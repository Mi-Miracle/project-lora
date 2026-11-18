// УМОВИ ПЕРЕМОГИ: кілька шляхів до перемоги для держави-гравця. Перевірка раз на тиждень.
// Після перемоги гру можна продовжити (G.victory.won[k] = день перемоги).
LORA.sim.register('victory', 98, function (G) {
  const { N, ter } = G;
  const own = nid => { let c = 0; for (const t of ter) if (t.ctrl === nid) c++; return c; };
  G.VICTORY = {
    war:   { n: 'Військова', ic: '🎖', d: 'Контролюйте вдвічі більше регіонів, ніж на старті (і щонайменше +40 регіонів).' },
    econ:  { n: 'Економічна', ic: '💰', d: 'Збільште ВВП у 2,5 раза від стартового, тримаючи борг нижче 80% ВВП.' },
    diplo: { n: 'Дипломатична', ic: '🤝', d: 'Відносини ≥ 60 з 50 державами й членство щонайменше у 2 блоках.' },
    space: { n: 'Космічна', ic: '🚀', d: 'Завершіть космічну програму «Марс».' },
    scen:  { n: 'Сценарна', ic: '🛡', d: 'Завершіть стартову війну миром, повернувши всі свої регіони.' }
  };
  G.victoryInit = function () {
    if (G.victory || G.player < 0) return; const n = N[G.player];
    G.victory = { won: {}, st: { reg: own(G.player), gdp: Math.max(1, n.agg.gdp || 1), wars: G.enemiesOf(G.player).length > 0, origin: ter.filter(t => t.owner === G.player).map(t => t.i) } };
  };
  // прогрес 0..1 і підпис
  G.victoryProgress = function (k) {
    const v = G.victory; if (!v || G.player < 0) return { p: 0, t: '' }; const n = N[G.player], st = v.st;
    if (k === 'war') { const need = Math.max(st.reg * 2, st.reg + 40), c = own(G.player); return { p: Math.min(1, c / need), t: `${c}/${need} ${'регіонів'}` }; }
    if (k === 'econ') { const need = st.gdp * 2.5, dr = n.debt / Math.max(1, n.agg.gdp); return { p: Math.min(1, n.agg.gdp / need) * (dr < 0.8 ? 1 : 0.95), t: `ВВП ${Math.round(n.agg.gdp)}/${Math.round(need)} · борг ${Math.round(dr * 100)}%` }; }
    if (k === 'diplo') { let f = 0; N.forEach(m => { if (m.alive && m.id !== n.id && G.rel[n.id][m.id] >= 60) f++; }); const b = G.blocsOf ? G.blocsOf(n.id).length : 0; return { p: Math.min(1, f / 50) * 0.8 + Math.min(1, b / 2) * 0.2, t: `${f}/50 · блоків ${b}/2` }; }
    if (k === 'space') { const P = n.space && n.space.prog && n.space.prog.mars; if (!P) return { p: 0, t: 'програму не розпочато' }; if (P.ok) return { p: 1, t: 'завершено' }; return { p: Math.min(0.99, (G.day - P.start) / Math.max(1, P.done - P.start)), t: `до ${G.dateStr(P.done)}` }; }
    if (k === 'scen') { if (!st.wars) return { p: 0, t: 'на старті немає війни' }; const back = st.origin.filter(i => ter[i].ctrl === G.player).length, war = G.enemiesOf(G.player).length; return { p: (back / st.origin.length) * (war ? 0.9 : 1), t: `${back}/${st.origin.length} регіонів${war ? ' · війна триває' : ''}` }; }
    return { p: 0, t: '' };
  };
  G.victoryWeekly = function () {
    if (G.player < 0 || !N[G.player] || !N[G.player].alive) return; G.victoryInit(); const v = G.victory; if (G.day < 60) return;
    for (const k in G.VICTORY) {
      if (v.won[k] != null) continue; const pr = G.victoryProgress(k);
      if (pr.p >= 1 || (k === 'scen' && v.st.wars && pr.p >= 1 && !G.enemiesOf(G.player).length)) {
        v.won[k] = G.day; const V = G.VICTORY[k];
        G.say(`🏆 ${N[G.player].name}: ${V.n.toLowerCase()} перемога!`, 'info', [G.player]);
        if (!G.gameOver) G.gameOver = { win: true, cont: true, kind: k, text: `${V.ic} ${V.n} перемога. ${V.d} Можна продовжити гру й досягти інших перемог.` };
      }
    }
  };
});
