// НАЦІОНАЛЬНІ ПРОЄКТИ: великі багаторічні програми держави. Одночасно — до двох.
// Платіж щомісяця з бюджету; після завершення — постійний ефект. ШІ теж запускає проєкти.
LORA.sim.register('projects', 96.5, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const PR = G.D.projects = {
    energy_indep: { n: 'Енергонезалежність', ic: '⚡', yrs: 3, k: 0.025, d: 'менше імпорту палива: +10% власного видобутку нафти й газу, стабільність +2' },
    digital_state:{ n: 'Цифрова держава', ic: '📱', yrs: 2, k: 0.01, d: 'держпослуги онлайн: інтернет +8%, податки збираються на 3% краще, стабільність +2' },
    army_reform:  { n: 'Військова реформа', ic: '🪖', yrs: 2, k: 0.015, d: 'якість армії +5%, переозброєння швидше' },
    infra_boom:   { n: 'Велике будівництво доріг і мостів', ic: '🛣', yrs: 3, k: 0.02, d: 'інфраструктура +0.15: швидше будівництво й логістика' },
    education:    { n: 'Освітня реформа', ic: '🎓', yrs: 4, k: 0.012, d: 'наука +12% назавжди' },
    anticorr:     { n: 'Антикорупційна реформа', ic: '⚖', yrs: 2, k: 0.006, d: 'стабільність +4, західні партнери +10, інвестори приходять (зростання)' },
    industrial:   { n: 'Індустріальні парки', ic: '🏭', yrs: 3, k: 0.018, d: 'будівництво заводів −15% вартості, зростання +0.2%' },
    olympics:     { n: 'Олімпійські ігри', ic: '🏅', yrs: 5, k: 0.02, d: 'світовий престиж: стабільність +6, відносини зі світом +6, туризм', peace: 1 },
    green_deal:   { n: 'Зелений курс', ic: '🌱', yrs: 4, k: 0.015, d: 'зелена енергетика й екологія: ЄС +8, зростання +0.1%, стабільність +2' },
    rebuild:      { n: 'Відбудова', ic: '🏗', yrs: 3, k: 0.03, d: 'ремонт зруйнованого: пошкодження регіонів −80%, стабільність +4', needDmg: 1 }
  };
  N.forEach(n => { n.proj = {}; });
  G.projCan = function (nid, k) {
    const n = N[nid], P = PR[k]; if (!P) return 'Невідомий проєкт';
    if (n.proj[k]) return n.proj[k].ok ? 'Вже завершено' : 'Вже триває';
    if (Object.values(n.proj).filter(p => !p.ok).length >= 2) return 'Одночасно — не більше двох проєктів';
    if (P.peace && G.enemiesOf(nid).length) return 'Лише в мирний час';
    if (P.needDmg && !ter.some(t => t.owner === nid && t.ctrl === nid && t.dmg > 0.05)) return 'Немає що відбудовувати';
    return null;
  };
  G.projCost = (nid, k) => N[nid].agg.gdp * PR[k].k * PR[k].yrs;
  G.startProject = function (nid, k) { const e = G.projCan(nid, k); if (e) return { ok: false, err: e }; const P = PR[k]; N[nid].proj[k] = { start: G.day, done: G.day + P.yrs * 365, paid: 0, cost: G.projCost(nid, k) }; if (G.isHuman(nid)) G.say(`${P.ic} Старт національного проєкту: ${P.n}`, 'good', [nid]); return { ok: true }; };
  G.cancelProject = function (nid, k) { const p = N[nid].proj[k]; if (!p || p.ok) return { ok: false, err: 'Немає проєкту' }; delete N[nid].proj[k]; N[nid].stab = Math.max(0, N[nid].stab - 2); return { ok: true }; };
  function apply(n, k) {
    const ownT = () => ter.filter(t => t.owner === n.id && t.ctrl === n.id);
    if (k === 'energy_indep') { n.prodK = n.prodK || {}; n.prodK.oil = (n.prodK.oil || 1) * 1.1; n.prodK.gas = (n.prodK.gas || 1) * 1.1; n.stab += 2; }
    if (k === 'digital_state') { n.taxEff = (n.taxEff || 1) * 1.03; n.netB = (n.netB || 0) + 0.08; n.stab += 2; }
    if (k === 'army_reform') { n.q = (n.q || 1) * 1.05; n.modBoost = Math.max(n.modBoost || 0, G.day + 365); }
    if (k === 'infra_boom') n.infraLvl = Math.min(1.6, n.infraLvl + 0.15);
    if (k === 'education') n.sciK = (n.sciK || 1) * 1.12;
    if (k === 'anticorr') { n.stab += 4; N.forEach(x => { if (x.alive && x.id !== n.id && (x.pc || 0) > 25000) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 10, -100, 100); }); n.growB = (n.growB || 0) + 0.001; }
    if (k === 'industrial') { n.buildK = (n.buildK || 1) * 0.85; n.growB = (n.growB || 0) + 0.002; }
    if (k === 'olympics') { n.stab += 6; N.forEach(x => { if (x.alive && x.id !== n.id) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 6, -100, 100); }); n.growB = (n.growB || 0) + 0.001; }
    if (k === 'green_deal') { n.growB = (n.growB || 0) + 0.001; n.stab += 2; n.greenGoal = 0.6; (G.blocsOf ? G.blocsOf(n.id) : []).forEach(() => { }); N.forEach(x => { if (x.alive && x.id !== n.id && G.blocsOf && G.blocsOf(x.id).some(b => /ЄС|EU/.test(b.n))) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 8, -100, 100); }); }
    if (k === 'rebuild') { ownT().forEach(t => { t.dmg *= 0.2; }); n.stab += 4; }
    n.stab = Math.min(100, n.stab);
  }
  G.projectsMonthly = function () {
    N.forEach(n => {
      if (!n.alive) return;
      for (const k in n.proj) { const p = n.proj[k]; if (p.ok) continue; const m = p.cost / (PR[k].yrs * 12); n.cash -= m; p.paid += m; if (n.cash < 0) { n.debt -= n.cash; n.cash = 0; }
        if (G.day >= p.done) { p.ok = true; apply(n, k); G.say(`${PR[k].ic} ${n.name}: національний проєкт «${PR[k].n}» завершено`, G.isHuman(n.id) ? 'good' : 'info', [n.id]); } }
      // постійні бонуси зростання
      if (n.growB) for (const t of ter) if (t.owner === n.id && t.ctrl === n.id) t.gdp *= 1 + n.growB / 12;
      // ШІ
      if ((!G.isHuman(n.id) || G.autoPlayer) && G.rnd() < 0.04 && n.agg.gdp > 50) {
        const war = G.enemiesOf(n.id).length > 0, dmg = ter.some(t => t.owner === n.id && t.dmg > 0.08);
        const opts = Object.keys(PR).filter(k => !G.projCan(n.id, k)); if (!opts.length) return;
        const w = k => (k === 'army_reform' && war ? 4 : 0) + (k === 'rebuild' && dmg ? 5 : 0) + (k === 'digital_state' ? 1.2 : 0) + (k === 'education' ? 1 : 0) + (k === 'anticorr' && n.stab < 50 ? 2 : 0.3) + (k === 'olympics' && n.agg.gdp > 1500 ? 0.6 : 0) + (k === 'green_deal' && (n.pc || 0) > 20000 ? 1 : 0) + (k === 'energy_indep' && (n.ratio.oil < 0.9 || n.ratio.gas < 0.9) ? 2 : 0.2) + 0.3;
        let best = null, bw = 0; for (const k of opts) { const v = w(k) * (0.6 + 0.8 * G.rnd()); if (v > bw) { bw = v; best = k; } }
        if (best && n.cash > G.projCost(n.id, best) * 0.05) G.startProject(n.id, best);
      }
    });
  };
  G.act.startProject = k => G.player >= 0 ? G.startProject(G.player, k) : { ok: false, err: 'Лише за державу' };
  G.act.cancelProject = k => G.player >= 0 ? G.cancelProject(G.player, k) : { ok: false, err: 'Лише за державу' };
});
