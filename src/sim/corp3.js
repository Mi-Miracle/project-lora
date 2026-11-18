// КОРПОРАЦІЯ 3: ефекти розробок на видобуток і паливо (out/fuel), електростанції купують паливо,
// цифрові продукти IT-компаній (користувачі × дохід з користувача), ліцензії на розробки, вплив на інтернет і економіку країн.
LORA.sim.register('corp3', 99.655, function (G) {
  const { N, ter } = G; const BD = G.D.buildings; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const human = c => c && !c.ai && c.alive; const fx = (c, k) => c.rd && G.corpFx ? G.corpFx(c, k) : 0;
  // фізичний облік: розробки збільшують випуск і знижують витрати сировини; станції без «out» теж купують паливо
  G.corpResFlow = function (c) {
    const out = {}, inn = {}, kO = 1 + fx(c, 'out'), kF = Math.max(0.5, 1 - fx(c, 'fuel'));
    c.assets.forEach(a => { const b = BD[a.type], t = ter[a.t]; if (!b || !(b.out || b.in) || t.ctrl !== t.owner) return; const eff = (1 - t.dmg) * a.lvl / 12;
      for (const r in (b.out || {})) out[r] = (out[r] || 0) + b.out[r] * eff * kO * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1);
      for (const r in (b.in || {})) inn[r] = (inn[r] || 0) + b.in[r] * eff * kF; });
    return { out, inn };
  };
  // ШІ-компанії та активи без фізичного обліку: ефекти out/fuel через прибуток
  const baseAP = G.assetProfit; G.assetProfit = function (c, a) { let p = baseAP(c, a); if (c && c.rd && p) p *= 1 + fx(c, 'out') * 0.8 + fx(c, 'fuel') * 0.3; return p; };
  // електростанції людської компанії: виручка за електрику; паливо компанія купує сама (corp2Monthly), тож не залежить від дефіциту в країні
  const GEN = new Set(['coal_plant', 'gas_plant', 'npp', 'smr', 'hydrogen_plant']);
  const ap2 = G.assetProfit; G.assetProfit = function (c, a) { if (human(c) && GEN.has(a.type) && !c._est) { const t = ter[a.t], b = BD[a.type]; if (t.ctrl !== t.owner) return 0; let fuel = 0; for (const r in b.in) fuel += b.in[r] * G.prices[r]; return (fuel * 1.18 + b.cost * 0.06) * (1 - t.dmg) * a.lvl * (1 + fx(c, 'profit')) * (0.85 + N[t.owner].stab / 500); } return ap2(c, a); };

  // ---------- ЦИФРОВІ ПРОДУКТИ (сектор «IT і ШІ»)
  const DIG = new Set(['datacenter', 'cloud_region', 'ai_datacenter', 'ai_lab', 'it_park', 'game_studio', 'cyber_center', 'platform_hub', 'research_center']);
  G.digCap = c => c.assets.reduce((s, a) => s + (DIG.has(a.type) ? a.lvl * ({ datacenter: 40, cloud_region: 90, ai_datacenter: 120, platform_hub: 60 }[a.type] || 15) : 0), 0) + 10 + (c.base || 0) * 3; // млн користувачів
  G.digMarket = c => { const seen = new Set(); let m = 0; c.offices.forEach(o => { if (seen.has(o.n)) return; seen.add(o.n); const n = N[o.n]; if (n && n.alive && n.agg) m += n.agg.pop * (n.net || 0.4); });
    const glob = fx(c, 'users') > 0.5 ? 0.15 : 0.05; N.forEach(n => { if (n.alive && n.agg && !seen.has(n.id) && !G.sanctioned(c.home, n.id) && !G.atWar(c.home, n.id)) m += n.agg.pop * (n.net || 0.4) * glob; }); return m; }; // млн людей онлайн
  G.digArpu = c => { const n = N[c.home]; return 22 * (1 + fx(c, 'arpu')) * (0.5 + Math.min(1.5, (n && n.pc ? n.pc : 10000) / 40000)) * (0.6 + (c.rep || 50) / 125); }; // $ на користувача на рік
  G.digInit = c => { if (!c.dg) c.dg = { users: 0.5 + (c.base || 0) * 1.5, mkt: 0.05, hist: [] }; return c.dg; };
  G.digMonthly = function () {
    G.companies.forEach(c => {
      if (!c.alive || c.sector !== 'tech') return; const D = G.digInit(c); if (c.ai) D.mkt = clamp((c.cash || 0) * 0.02, 0.02, 3);
      const mk = G.digMarket(c), cap = G.digCap(c), share = clamp(0.03 + fx(c, 'users') * 0.25 + (c.rep || 50) / 1000, 0.02, 0.6);
      const target = Math.min(cap, mk * share); const g = clamp(0.03 + D.mkt * 0.04 + fx(c, 'users') * 0.05, 0.02, 0.3);
      D.users = Math.max(0.1, D.users + (target - D.users) * g);
      const rev = D.users * G.digArpu(c) / 1000 / 12, serv = D.users * 0.0006 / 12, roy = fx(c, 'roy') * Object.keys(c.rd ? c.rd.done : {}).length * 0.03 / 12;
      const net = rev + roy - serv - D.mkt / 12; c.cash += net; D.revY = (rev + roy) * 12; D.netY = net * 12; D.hist.push(+D.users.toFixed(1)); if (D.hist.length > 36) D.hist.shift();
      c.profitY = (c.profitY || 0) + net * 12;
      // вплив на країни присутності: інтернет +, цифрова економіка +
      const pres = new Set(c.offices.map(o => o.n)); pres.forEach(nid => { const n = N[nid]; if (!n || !n.alive || !n.agg) return; const pen = D.users / Math.max(1, mk); n.netDig = clamp((n.netDig || 0) * 0.98 + pen * 0.02, 0, 0.12); n.cash += rev * 0.05 * (nid === c.home ? 1 : 0.3); });
    });
  };
  G.act.coSet && (() => { const base = G.act.coSet; G.act.coSet = (k, a, v) => { if (k === 'mkt') { const c = G.pc >= 0 && G.myCo(); if (!c) return { ok: false }; G.digInit(c).mkt = clamp(+v, 0, 5); return { ok: true }; } return base(k, a, v); }; })();
});
