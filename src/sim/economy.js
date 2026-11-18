// ЕКОНОМІКА: агрегування регіонів у держави, дефіцити, ВВП, бюджет, борг, технології, стабільність.
LORA.sim.register('economy', 30, function (G) {
  const { N, ter, RES, RI } = G; const U = LORA.core, clamp = U.clamp; const F = G.D.finance;

  // Підсумки по державах (викликається щодня)
  G.aggregate = function () {
    N.forEach(n => { n.agg = { gdpPot: 0, gdp: n.agg ? n.agg.gdp : 0, pop: 0, prod: {}, need: {}, nT: 0, area: 0, occLost: 0, troops: 0 }; RES.forEach(r => { n.agg.prod[r] = 0; n.agg.need[r] = 0; }); });
    const yrs = G.day / 365, grow = Math.pow(1.012, yrs);
    const mul = N.map(n => { const m = {}; RES.forEach(r => m[r] = 1); n.mods.forEach(md => { if (md.r && md.until > G.day) m[md.r] *= md.mul; }); return m; });
    for (const t of ter) {
      const c = N[t.ctrl], o = N[t.owner];
      const eff = (1 - t.dmg) * (t.ctrl === t.owner ? (0.35 + 0.65 * t.integ) : 0.3);
      c.agg.gdpPot += t.gdp * eff; c.agg.pop += t.pop; c.agg.nT++; c.agg.area += t.area;
      if (t.ctrl !== t.owner) o.agg.occLost += t.gdp;
      const needF = Math.pow(Math.max(0.05, t.gdp / Math.max(0.01, t.gdp0)), 0.6) * (t.ctrl === t.owner ? 1 : 0.6);
      for (const r of RES) {
        c.agg.prod[r] += t.prod[r] * eff * grow * mul[t.ctrl][r] * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1);
        c.agg.need[r] += t.need0[r] * needF;
      }
    }
    // військове споживання пального
    const tr = new Float64Array(N.length); for (const a of G.armies) tr[a.n] += a.k;
    N.forEach(n => { if (!n.alive) return; const war = G.enemiesOf(n.id).length > 0; n.agg.troops = tr[n.id]; n.agg.need.oil += tr[n.id] * (war ? 0.00015 : 0.00003); });
  };

  G.economyDaily = function () {
    const worldGDP = N.reduce((a, n) => a + (n.alive ? n.agg.gdpPot : 0), 0); G.worldGDP = worldGDP;
    const sancGDP = new Float64Array(N.length);
    G.sanctions.forEach(k => { const [a, b] = k.split('>'); if (N[+a].alive) sancGDP[+b] += N[+a].agg.gdpPot; });
    const growthOf = new Float64Array(N.length);
    N.forEach(n => {
      if (!n.alive) return;
      const A = n.agg; let shortPen = 0;
      RES.forEach(r => {
        const need = A.need[r]; if (need <= 1e-9) { n.ratio[r] = 1; return; }
        let avail = A.prod[r] - (n.exp[r] || 0) + (n.imp[r] || 0);
        if (n.stock[r] != null) {
          const gap = need - avail;
          if (gap > 1e-9 && n.stock[r] > 0) { const use = Math.min(n.stock[r], gap / need); n.stock[r] -= use; avail += use * need; }
          else if (gap <= 0 && n.stock[r] < n.stockTarget[r]) { const add = Math.min(0.15, n.stockTarget[r] - n.stock[r]); n.stock[r] += add; n.cash -= add * need / 365 * G.prices[r]; }
        }
        n.ratio[r] = clamp(avail / need, 0, 1); shortPen += RI[r].w * (1 - n.ratio[r]);
      });
      n.shortPen = shortPen;
      let stranded = 0, windfall = 0;
      RES.forEach(r => { const un = G.unsold ? G.unsold[r][n.id] : 0; stranded += un * G.prices[r]; windfall += (n.exp[r] || 0) * (G.prices[r] - G.priceBase[r]); });
      const eff = clamp(1 - shortPen * 0.7 - 0.5 * stranded / Math.max(1, A.gdpPot) - (n.stab < 30 ? (30 - n.stab) / 150 : 0), 0.3, 1.05);
      const gdp = A.gdpPot * eff; A.gdp = gdp;
      const pc = gdp / Math.max(0.01, A.pop) * 1000; n.pc = pc;
      // ---- зростання
      let g = G.B.growthBase + 0.055 * Math.pow(1 - Math.min(1, pc / 60000), 2);
      g += (n.infraLvl - 0.6) * 0.012 + (n.tech - 1) * 0.01 + (n.pol.res - 0.015) * 0.15;
      g -= shortPen * 0.4;
      if (n.pol.tax > 0.35) g -= (n.pol.tax - 0.35) * 0.06;
      if (n.pol.mil > 0.04) g -= (n.pol.mil - 0.04) * 0.08;
      const troopsShare = (A.troops || 0) / Math.max(1, A.pop * 1000); if (troopsShare > 0.01) g -= (troopsShare - 0.01) * 0.6;
      const debtR = n.debt / Math.max(1, gdp); if (debtR > 0.9) g -= (debtR - 0.9) * 0.012;
      g -= sancGDP[n.id] / Math.max(1, worldGDP) * 0.03;
      if (n.stab < 40) g -= (40 - n.stab) * 0.0008;
      if (G.worldMod.until > G.day) g += G.worldMod.growth * (G.worldMod.kind === 'pandemic' && G.has(n, 'pandemic_shield') ? 0.5 : 1); if (n.fdiG) g += n.fdiG;
      n.mods.forEach(m => { if (m.growth && m.until > G.day) g += m.growth; });
      g = clamp(g, -0.25, 0.12); n.growth = g; growthOf[n.id] = g;
      // ---- бюджет
      const rev = gdp * n.pol.tax * (n.taxEff || 1) / 365 + windfall * 0.35 / 365;
      const spend = gdp * (n.pol.mil + n.pol.infra + n.pol.soc + n.pol.res) / 365;
      const war = G.enemiesOf(n.id).length > 0;
      const rate = (F.rate[n.a3] != null ? F.rate[n.a3] : 0.012 + 0.045 * (1 - Math.min(1, pc / 40000))) + Math.max(0, debtR - 1.2) * 0.01 + (war ? 0.01 : 0) + (n.stab < 30 ? 0.02 : 0) + (n.defaulted ? 0.04 : 0);
      n.rate = rate;
      const interest = n.debt * rate / 365;
      n.stats.rev = rev * 365; n.stats.spend = (spend + interest) * 365; n.stats.rate = rate; n.stats.interest = interest * 365;
      n.cash += rev - spend - interest;
      if (n.cash < 0) { n.debt += -n.cash; n.cash = 0; }
      else if (n.cash > gdp * 0.08 && n.debt > 0) { const pay = Math.min(n.debt, (n.cash - gdp * 0.08) * 0.01); n.cash -= pay; n.debt -= pay; }
      const limit = pc > 15000 ? 2.6 : 1.5;
      // казначейство ШІ: тримає резерв ≈2.5% ВВП, позичаючи на ринку, поки борг далеко від межі дефолту
      if ((!G.isHuman(n.id) || G.autoPlayer) && !n.defaulted) { const want = gdp * 0.025; if (n.cash < want && debtR < limit * 0.75) { const x = Math.min(want - n.cash, gdp * 0.0015); n.cash += x; n.debt += x; } }
      if (debtR > limit && !n.defaulted && G.day > 60) { n.defaulted = G.day; n.stab -= 20; G.say(`💥 Дефолт — ${n.name}: борг ${(debtR * 100).toFixed(0)}% ВВП, видатки урізано`, 'bad', [n.id]); n.pol.soc *= 0.7; n.pol.infra *= 0.6; n.pol.mil *= 0.8; n.debt *= 0.6; }
      if (n.defaulted && G.day - n.defaulted > 365) n.defaulted = 0;
      // ---- інфраструктура, технології
      n.infraLvl = clamp(n.infraLvl + (n.pol.infra - 0.03) * 0.6 / 365, 0.1, 1.5);
      n.tech = clamp(n.tech + (n.pol.res * 0.6 - 0.004) / 365 * (0.6 + 0.4 * n.ratio.chips) - (n.tech > 1.3 ? (n.tech - 1.3) * 0.05 / 365 : 0), 0.3, 1.8);
      // ---- арсенал і якість армії
      const troops = A.troops || 0;
      const costK = 0.01 * (0.5 + pc / 20000);
      const milFund = gdp * n.pol.mil;
      const upkeep = troops * costK + G.shipsOf(n.id) * 0.25 * (0.5 + pc / 40000);
      n.stats.milFund = milFund; n.stats.upkeep = upkeep;
      const prodEff = Math.pow(n.ratio.chips, 0.5) * Math.pow(n.ratio.metal, 0.25) * Math.pow(n.ratio.machinery, 0.25) * Math.pow(n.ratio.chem, 0.1);
      n.milStock = Math.max(0, n.milStock + (milFund - upkeep) * prodEff / 365 - n.milStock * 0.07 / 365);
      const per = clamp(n.milStock / Math.max(1, troops) / 0.5, 0.03, 40);
      n.q = n.tech * Math.pow(per, 0.3) * (upkeep > milFund ? clamp(milFund / upkeep, 0.5, 1) : 1);
      n.navQ = n.tech * (0.6 + 0.4 * Math.pow(per, 0.2));
      // ---- стабільність
      let st = 50 + (Math.min(n.pol.soc, 0.3) - 0.1) * 140 + g * 300 - (1 - n.ratio.grain) * 50 - (1 - n.ratio.food) * 20 - shortPen * 40 - Math.max(0, n.pol.tax - 0.45) * 60;
      st += (n.infraLvl - 0.5) * 15 - n.warExh * 25 - A.occLost / Math.max(1, A.gdpPot + A.occLost) * 30;
      if (war && n.warStart && G.day - n.warStart < 200) st += 10;
      if (war && [...G.wars.values()].some(w => (w.a === n.id || w.b === n.id) && w.att !== n.id)) st += 12; // захист батьківщини
      if (n.defaulted) st -= 15;
      if ((G.D.countries[n.a3] || [])[6] > 0.3) st += 8; // жорсткий контроль режиму
      st = clamp(st, 0, 100); n.stab += (st - n.stab) * 0.01;
      if (war) n.warExh = clamp(n.warExh + G.B.warExhRate + (n.casualtiesDay || 0) / Math.max(1, A.pop * 1000) * 3, 0, 1); else n.warExh = Math.max(0, n.warExh - 0.002);
      n.casualtiesDay = 0;
      n.stats.gdp = gdp; n.stats.pop = A.pop;
    });
    // зростання регіонів (один прохід)
    for (const t of ter) { const n = N[t.owner]; const rad = t.rad > G.day ? 1 : 0; const g = growthOf[t.owner] - rad * 0.08; t.gdp *= 1 + g / 365; t.pop *= 1 + (0.012 * (1 - Math.min(1, (n.pc || 1000) / 30000)) - 0.001 - rad * 0.05) / 365; }
  };
});
