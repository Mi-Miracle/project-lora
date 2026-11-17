// САМОБАЛАНСУВАННЯ ПІД ЧАС ГРИ. Раз на місяць режисер вимірює стан світу й м'яко підкручує параметри G.B
// в межах min/max з data/balance.js, щоб уникати: вічних «окопних» глухих кутів, блискавичних розгромів,
// надмірних втрат, економічного застою/перегріву, повної відсутності конфліктів чи світової бійні.
// Усі зміни записуються в G.balanceLog (видно у вкладці «Світ → Баланс»).
LORA.sim.register('ai-balance', 85, function (G) {
  const { N, ter } = G; const clamp = LORA.core.clamp; const DB = G.D.balance, TG = G.D.balanceTargets;
  G.metrics = { captures: [], newWars: [], cas: {}, priceHigh: {}, lastAdj: {} };
  G.balanceLog = [];
  LORA.bus.on('capture', e => { if (G.metrics) G.metrics.captures.push({ d: G.day, by: e.by, from: e.from }); });
  function nudge(key, factor, why) {
    if (G.metrics.lastAdj[key] && G.day - G.metrics.lastAdj[key] < 60) return;
    const lim = DB[key]; const old = G.B[key]; const v = clamp(old * factor, lim.min, lim.max);
    if (Math.abs(v - old) / Math.max(1e-9, old) < 0.001) return;
    G.B[key] = v; G.metrics.lastAdj[key] = G.day;
    G.balanceLog.unshift({ d: G.day, key, from: +old.toPrecision(3), to: +v.toPrecision(3), why }); if (G.balanceLog.length > 80) G.balanceLog.length = 80;
  }
  G.balanceMonthly = function () {
    const M = G.metrics; const day = G.day;
    M.captures = M.captures.filter(c => day - c.d < 400);
    // 1) Глухий кут або розгром у кожній війні
    G.wars.forEach(w => {
      const age = day - Math.max(0, w.start); if (age < 200) return;
      const caps = M.captures.filter(c => day - c.d < 365 && ((c.by === w.a && c.from === w.b) || (c.by === w.b && c.from === w.a)));
      const fast = M.captures.filter(c => day - c.d < 120 && ((c.by === w.a && c.from === w.b) || (c.by === w.b && c.from === w.a)));
      const strong = G.troopsOf(w.a) > 80 && G.troopsOf(w.b) > 80;
      if (caps.length < TG.frontRegionsPerYear[0] && strong && age > 365) { nudge('fortDef', 0.96, 'фронт стоїть понад рік'); nudge('attackNeed', 0.98, 'фронт стоїть понад рік'); nudge('attackerLoss', 0.98, 'фронт стоїть понад рік'); }
      if (caps.length > TG.frontRegionsPerYear[1] && fast.length <= TG.frontRegionsPerYear[1] * 1.5) { nudge('attackerLoss', 1.03, 'фронт рухається надто швидко за рік'); nudge('fortDef', 1.03, 'фронт рухається надто швидко за рік'); }
      if (fast.length > TG.frontRegionsPerYear[1] * 1.5) { nudge('defBase', 1.02, 'надто швидкий прорив фронту'); nudge('fortDef', 1.04, 'надто швидкий прорив фронту'); nudge('aidRate', 1.05, 'жертва агресії потребує більше допомоги'); }
    });
    // 2) Втрати
    let ratio = 0, cnt = 0;
    N.forEach(n => { if (!n.alive || !G.enemiesOf(n.id).length) { M.cas[n.id] = n.casualties; return; } const prev = M.cas[n.id] != null ? M.cas[n.id] : n.casualties; const per = (n.casualties - prev) * 12 / Math.max(10, G.troopsOf(n.id)); M.cas[n.id] = n.casualties; if (G.troopsOf(n.id) > 50) { ratio += per; cnt++; } });
    if (cnt) { const avg = ratio / cnt; if (avg > TG.casualtiesPerYearShare[1]) nudge('combatLoss', 0.95, `втрати ${Math.round(avg * 100)}% армії на рік`); else if (avg < TG.casualtiesPerYearShare[0] * 0.5) nudge('combatLoss', 1.04, `втрати лише ${Math.round(avg * 100)}% армії на рік`); }
    // 3) Світове зростання
    let wg = 0, wsum = 0; N.forEach(n => { if (n.alive && n.agg) { wg += n.growth * n.agg.gdp; wsum += n.agg.gdp; } });
    const g = wg / Math.max(1, wsum); G.metrics.worldGrowth = g;
    if (!(G.worldMod.until > day)) { if (g < TG.worldGrowth[0]) nudge('growthBase', 1.08, `світове зростання ${(g * 100).toFixed(1)}%`); else if (g > TG.worldGrowth[1]) nudge('growthBase', 0.93, `світове зростання ${(g * 100).toFixed(1)}%`); }
    // 4) Частота воєн
    const recent = M.newWars.filter(d => day - d < 1825).length;
    if (day > 1095 && recent < TG.newWarsPer5Years[0]) nudge('aggrScale', 1.06, 'світ надто мирний');
    if (recent > TG.newWarsPer5Years[1] * 1.5) nudge('aggrScale', 0.88, `забагато нових воєн (${recent} за 5 років)`);
    // 5) Ринок: ціни-рекордсмени стимулюють інвестиції у видобуток
    G.RES.forEach(r => {
      const hi = G.prices[r] / G.priceBase[r] > TG.maxPrice;
      M.priceHigh[r] = hi ? (M.priceHigh[r] || 0) + 1 : 0;
      if (M.priceHigh[r] >= 2) { ter.forEach(t => { if (t.prod[r] > 0) t.prod[r] *= 1.02; }); G.say(`📈 Рекордні ціни (${G.RI[r].n.toLowerCase()}) — компанії світу нарощують видобуток`, 'info'); }
    });
  };
});
