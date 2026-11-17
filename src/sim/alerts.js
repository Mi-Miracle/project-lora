// СПОВІЩЕННЯ ДЛЯ ГРАВЦЯ: щомісячна перевірка стану держави (дефіцити, борг, стабільність, зростання) → новини з позначкою alert.
LORA.sim.register('alerts', 95, function (G) {
  const { N } = G; const RI = G.RI || G.D.resources;
  G.alertsMonthly = function () {
    const n = N[G.player]; if (!n || !n.alive || !n.agg) return; const P = n.id; const prev = n._al || {}; const cur = {};
    const say = (t, k) => G.say(t, k, [P]);
    const bal = n.stats.rev - n.stats.spend, debtR = n.debt / Math.max(1, n.agg.gdp);
    cur.deficit = bal < -n.agg.gdp * 0.05; if (cur.deficit && !prev.deficit) say(`📉 Бюджетний дефіцит ${(bal / n.agg.gdp * 100).toFixed(1)}% ВВП — скоротіть видатки або підвищте податки`, 'bad');
    cur.debt = debtR > 1; if (cur.debt && !prev.debt) say(`💳 Держборг перевищив 100% ВВП — ставки зростатимуть`, 'bad');
    const short = Object.keys(n.ratio).filter(r => n.ratio[r] < 0.8 && n.agg.need[r] > 0); cur.short = short.join(',');
    short.filter(r => !(prev.short || '').split(',').includes(r)).slice(0, 2).forEach(r => say(`⚠ Дефіцит: ${(G.D.resources[r] || {}).n || r} — забезпечено лише ${(n.ratio[r] * 100).toFixed(0)}%`, 'bad'));
    cur.stab = n.stab < 35; if (cur.stab && !prev.stab) say(`📢 Стабільність падає (${n.stab.toFixed(0)}): ризик протестів`, 'bad');
    cur.growth = n.growth > 0.04; if (cur.growth && !prev.growth) say(`📈 Економічний бум: зростання ${(n.growth * 100).toFixed(1)}% на рік`, 'good');
    cur.rich = n.cash > n.agg.gdp * 0.15; if (cur.rich && !prev.rich) say(`💰 Резерви перевищили 15% ВВП — є гроші на великі проєкти`, 'good');
    n._al = cur;
  };
});
