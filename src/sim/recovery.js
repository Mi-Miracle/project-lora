// ПІСЛЯ ВІЙНИ: міни у звільнених регіонах, розмінування, відбудова (з корупційними ризиками),
// міжнародний фонд відбудови, окупаційні адміністрації й партизанські повстання.
LORA.sim.register('recovery', 96.6, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.demineCost = i => +(0.05 + ter[i].gdp * 0.02 * (ter[i].mine || 0)).toFixed(3);
  G.rebuildCost = i => +(0.1 + ter[i].gdp * 0.45 * ter[i].dmg).toFixed(3);
  const own = (nid, i) => ter[i] && ter[i].owner === nid && ter[i].ctrl === nid;
  G.demine = function (nid, i) {
    const t = ter[i]; if (!own(nid, i)) return { ok: false, err: 'Лише у власному підконтрольному регіоні' }; if (!(t.mine > 0.02)) return { ok: false, err: 'Регіон не заміновано' };
    const n = N[nid], c = G.demineCost(i); const pay = payFund(n, c); if (pay < 0) return { ok: false, err: 'Бракує коштів: $' + c + ' млрд' };
    t.mine = Math.max(0, t.mine - 0.35); return { ok: true, cost: c };
  };
  G.rebuild = function (nid, i) {
    const t = ter[i]; if (!own(nid, i)) return { ok: false, err: 'Лише у власному підконтрольному регіоні' }; if (t.dmg < 0.05) return { ok: false, err: 'Регіон не потребує відбудови' };
    if (t.rebuild > 0) return { ok: false, err: 'Відбудова вже триває' }; if (t.mine > 0.3) return { ok: false, err: 'Спершу розмінуйте регіон (міни > 30%)' };
    const n = N[nid], c = G.rebuildCost(i); if (payFund(n, c) < 0) return { ok: false, err: 'Бракує коштів: $' + c + ' млрд' };
    // корупція: що нижча стабільність, то більша частка «розчиняється»
    const steal = G.rnd() < (100 - n.stab) / 100 * 0.45 ? 0.2 + G.rnd() * 0.3 : 0; t.rebuild = 6; t.rebK = 1 - steal;
    if (steal) G.say(`🕵 ${T[i].n}: журналісти знайшли схему розкрадання на відбудові — зникло ${Math.round(steal * 100)}% коштів`, 'bad', [nid]);
    return { ok: true, cost: c, steal };
  };
  function payFund(n, c) { const f = Math.min(n.recFund || 0, c); n.recFund = (n.recFund || 0) - f; const rest = c - f; if (rest > 0 && n.cash < rest) { n.recFund += f; return -1; } n.cash -= rest; return c; }
  G.recoveryMonthly = function () {
    N.forEach(n => { if (n.alive) n._liber = 0; });
    for (const t of ter) {
      // окупація → звільнення: міни
      if (t.ctrl !== t.owner && N[t.owner] && N[t.owner].alive && G.atWar(t.ctrl, t.owner)) t.wasOcc = 1;
      else if (t.wasOcc && t.ctrl === t.owner) { t.wasOcc = 0; t.mine = clamp((t.mine || 0) + 0.25 + t.dmg * 0.6, 0, 1); N[t.owner]._liber++; }
      if (t.mine > 0) { t.gdp *= 1 - t.mine * 0.006; t.mine = Math.max(0, t.mine - 0.008); if (t.owner === G.player && G.rnd() < t.mine * 0.05) G.say(`💥 ${T[t.i].n}: підрив на міні — загинули цивільні. Потрібне розмінування.`, 'bad', [t.owner]); }
      if (t.rebuild > 0) { t.rebuild--; t.dmg = Math.max(0, t.dmg - 0.07 * (t.rebK || 1)); t.integ = Math.min(1, (t.integ || 1) + 0.02); if (!t.rebuild && t.owner === G.player) G.say(`🏗 ${T[t.i].n}: етап відбудови завершено`, 'good', [t.owner]); }
      // окупаційна адміністрація: коштує окупанту; без гарнізону партизани можуть підняти повстання
      if (t.ctrl !== t.owner && N[t.ctrl] && G.atWar(t.ctrl, t.owner)) {
        N[t.ctrl].cash -= t.gdp * 0.004 * (1 + (t.part || 0));
        const gar = G.armies.some(a => a.t === t.i && a.n === t.ctrl);
        if (!gar && (t.part || 0) > 0.35 && G.rnd() < 0.04 + (t.part - 0.35) * 0.2) { const occ = t.ctrl; t.ctrl = t.owner; t.occ = null; G.say(`✊ Партизанське повстання: ${T[t.i].n} звільнено від окупантів (${N[occ].name})!`, 'good', [t.owner, occ]); G.refreshNation(t.owner); G.refreshNation(occ); }
      }
    }
    N.forEach(n => {
      if (!n.alive) return; if (n._liber && n.id === G.player) G.say(`🧹 Звільнені території заміновані — розмінуйте їх у панелі регіону`, 'info', [n.id]);
      // міжнародний фонд відбудови: друзі скидаються на постраждалу державу
      const dmg = ter.reduce((s, t) => s + (t.owner === n.id ? t.dmg * t.gdp : 0), 0); if (dmg < 1) return;
      let f = 0; N.forEach(m => { if (m.alive && m.id !== n.id && m.agg && m.agg.gdp > 800 && G.rel[m.id][n.id] > 50) f += m.agg.gdp * 0.00003; });
      f = Math.min(f, dmg * 0.04); if (f > 0) n.recFund = (n.recFund || 0) + f;
      // ШІ витрачає фонд сам
      if (n.id !== G.player && !(G.humans && G.humans.has(n.id)) && G.rnd() < 0.5) { const t = ter.filter(x => x.owner === n.id && x.ctrl === n.id && x.dmg > 0.15 && !x.rebuild).sort((a, b) => b.dmg * b.gdp - a.dmg * a.gdp)[0]; if (t) { if (t.mine > 0.3) G.demine(n.id, t.i); else G.rebuild(n.id, t.i); } }
    });
  };
  G.act.demine = i => G.player >= 0 ? G.demine(G.player, i) : { ok: false, err: 'Лише за державу' };
  G.act.rebuild = i => G.player >= 0 ? G.rebuild(G.player, i) : { ok: false, err: 'Лише за державу' };
});
