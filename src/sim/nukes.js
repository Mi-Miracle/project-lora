// ЯДЕРНА ЗБРОЯ: програма (дослідження → завод збагачення → збройовий центр → випробування), боєголовки,
// стримування й ескалація, тактичні й стратегічні удари з тяжкими наслідками для всього світу.
// Гра абстрактна: жодних технічних подробиць — лише політика, стримування й ціна рішення.
LORA.sim.register('nukes', 94, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // стартові арсенали (відкриті оцінки, округлено)
  const START = { RUS: [5500, 3], USA: [5000, 3], CHN: [500, 3], FRA: [290, 3], GBR: [225, 3], IND: [170, 2], PAK: [170, 2], ISR: [90, 2], PRK: [50, 1] };
  const TECH = ['tactical_bm', 'nuke_enrich', 'nuke_bomb', 'nuke_icbm', 'nuke_sub', 'abm'];
  G.NUKE_KIND = {
    tac: { n: 'Тактичний удар', w: 1, pop: 0.06, gdp: 0.12, army: 0.6, bld: 0.3, rad: 365, rel: -40, d: 'по військах у регіоні: знищує до 60% армій, радіація на рік' },
    str: { n: 'Стратегічний удар', w: 20, pop: 0.35, gdp: 0.6, army: 0.85, bld: 0.9, rad: 1800, rel: -75, d: 'по місту: величезні жертви, руйнування й радіація на роки; світ відвернеться від вас' }
  };
  G.isNuclear = nid => !!(N[nid] && N[nid].nuke && (N[nid].nw || 0) >= 1);
  G.initNukes = function () {
    N.forEach(n => {
      n.nw = 0; n.nk = { tested: false, esc: {}, used: 0 };
      const s = START[n.a3]; if (!s) { n.nuke = false; return; }
      n.nuke = true; n.nw = s[0]; n.nk.tested = true; n.nk.del = s[1];
      n.res = n.res || { done: {} }; n.res.done = n.res.done || {};
      TECH.slice(0, s[1] >= 3 ? 6 : s[1] >= 2 ? 4 : 3).forEach(id => { if (n.res.done[id] == null) n.res.done[id] = -1; });
      if (s[1] >= 2 && n.res.done.nuke_icbm == null) n.res.done.nuke_icbm = -1;
    });
  };
  const cnt = (nid, b) => { let c = 0; for (const t of ter) if (t.owner === nid && t.ctrl === nid && t.bld[b] > 0) c += t.bld[b]; return c; };
  G.nukeStatus = function (nid) {
    const n = N[nid]; if (!n) return null; n.nk = n.nk || { tested: false, esc: {}, used: 0 };
    const enr = cnt(nid, 'enrich_plant'), lab = cnt(nid, 'nuke_lab'), silo = cnt(nid, 'icbm_silo');
    const rate = G.has(n, 'nuke_bomb') && enr > 0 && lab > 0 ? Math.min(enr * 2, lab * 3) : 0; // боєголовок/міс.
    return { w: n.nw || 0, tested: n.nk.tested, enr, lab, silo, rate, icbm: !!(G.has(n, 'nuke_icbm') && (silo > 0 || START[n.a3])), sub: G.has(n, 'nuke_sub'), abm: G.has(n, 'abm'), bomb: G.has(n, 'nuke_bomb') };
  };
  // доставка: тактичний — балістика або бомбардувальники поблизу; стратегічний — МБР або бомбардувальники
  G.nukeCanReach = function (nid, r, kind) {
    const n = N[nid], s = G.nukeStatus(nid); const bmb = n.air && n.air.bmb >= 1;
    if (kind === 'str') return s.icbm || bmb;
    if (s.icbm) return true; const c = T[r].c; const near = ter.some(t => t.ctrl === nid && G.hav(T[t.i].c[0], T[t.i].c[1], c[0], c[1]) < 900); return (G.has(n, 'tactical_bm') || bmb) && near;
  };
  G.nukeCan = function (nid, r, kind) {
    const n = N[nid], K = G.NUKE_KIND[kind]; if (!n || !K) return 'Невідомий удар'; const s = G.nukeStatus(nid);
    if (!s.tested) return 'Спершу потрібне ядерне випробування'; if (s.w < K.w) return `Потрібно ${K.w} боєголовок (є ${s.w})`;
    const t = ter[r]; if (!t) return 'Оберіть регіон на мапі'; if (t.ctrl === nid && t.owner === nid) return 'Це ваш власний регіон';
    if (!G.atWar(nid, t.ctrl) && !G.atWar(nid, t.owner)) return 'Лише по державі, з якою ви воюєте';
    if (!G.nukeCanReach(nid, r, kind)) return kind === 'str' ? 'Потрібні МБР (шахти) або бомбардувальники' : 'Потрібні балістичні ракети або бомбардувальники в радіусі 900 км';
    return '';
  };
  G.nukeTest = function (nid) {
    const n = N[nid], s = G.nukeStatus(nid); if (s.tested) return { ok: false, err: 'Випробування вже проведено' }; if (s.w < 1) return { ok: false, err: 'Немає жодної боєголовки' };
    n.nw -= 1; n.nk.tested = true; n.nuke = true; n.stab = clamp(n.stab + 5, 0, 100);
    N.forEach(m => { if (!m.alive || m.id === nid) return; const d = G.allied(m.id, nid) ? -5 : -18; G.rel[m.id][nid] = G.rel[nid][m.id] = clamp(G.rel[m.id][nid] + d, -100, 100); if (['USA', 'GBR', 'FRA', 'DEU', 'JPN'].includes(m.a3) && !G.allied(m.id, nid)) G.sanctions.add(m.id + '>' + nid); });
    G.say(`☢ ${n.name} провела ядерне випробування! Світ стривожений, Захід запроваджує санкції.`, 'war'); return { ok: true };
  };
  G.nukeStrike = function (nid, r, kind) {
    const e = G.nukeCan(nid, r, kind); if (e) return { ok: false, err: e };
    const n = N[nid], K = G.NUKE_KIND[kind], t = ter[r], victim = t.ctrl, vn = N[victim], owner = N[t.owner];
    n.nw -= K.w; n.nk.used = (n.nk.used || 0) + 1;
    // ПРО цілі перехоплює частину
    const abm = G.has(vn, 'abm') ? (kind === 'tac' ? 0.3 : 0.15) : 0;
    if (G.rnd() < abm) { G.say(`🛡 ПРО ${vn.name} перехопила ядерний удар ${n.name} по регіону ${T[t.i].n}! Світ на межі.`, 'war'); worldReact(nid, K.rel * 0.6, kind); return { ok: true, intercepted: true }; }
    t.pop *= 1 - K.pop; t.gdp *= 1 - K.gdp; t.dmg = clamp((t.dmg || 0) + (kind === 'str' ? 0.85 : 0.4), 0, 1); t.rad = Math.max(t.rad || 0, G.day + K.rad);
    for (const b in t.bld) if (G.rnd() < K.bld) t.bld[b] = Math.max(0, t.bld[b] - 1);
    let killed = 0; G.armies.forEach(a => { if (a.t === r && a.n !== nid) { const d = a.k * K.army; a.k -= d; killed += d; a.org = Math.min(a.org, 0.1); } });
    G.armies = G.armies.filter(a => a.k >= 1);
    if (owner) owner.stab = clamp(owner.stab + (kind === 'str' ? -15 : 6), 0, 100);
    G.say(`☢☢ ${n.name} завдала ${kind === 'str' ? 'СТРАТЕГІЧНОГО' : 'тактичного'} ядерного удару по регіону ${T[t.i].n} (${owner ? owner.name : ''}). Втрати військ: ${Math.round(killed)} тис.`, 'war');
    worldReact(nid, K.rel, kind);
    // відповідь: ядерна жертва з боєголовками б'є у відповідь (взаємне знищення)
    if (victim !== G.player && G.isNuclear(victim) && N[victim].nk.tested && !(G.humans && G.humans.has(victim))) {
      const tgt = ter.filter(x => x.ctrl === nid && x.owner === nid).sort((a, b) => b.gdp - a.gdp)[kind === 'str' ? 0 : 3] || ter.find(x => x.ctrl === nid);
      const k2 = kind === 'str' && N[victim].nw >= 20 ? 'str' : 'tac';
      if (tgt && !G.nukeCan(victim, tgt.i, k2)) setTimeout0(() => G.nukeStrike(victim, tgt.i, k2));
    }
    return { ok: true, killed };
  };
  const later = []; const setTimeout0 = f => later.push(f);
  function worldReact(nid, rel, kind) {
    const n = N[nid];
    N.forEach(m => { if (!m.alive || m.id === nid) return; const d = rel * (G.allied(m.id, nid) ? 0.5 : 1); G.rel[m.id][nid] = G.rel[nid][m.id] = clamp(G.rel[m.id][nid] + d, -100, 100); if (m.agg && m.agg.gdp > 300 && !G.allied(m.id, nid)) G.sanctions.add(m.id + '>' + nid); m.stab = clamp(m.stab - (kind === 'str' ? 4 : 1.5), 0, 100); });
    n.stab = clamp(n.stab - (kind === 'str' ? 15 : 8), 0, 100);
    G.worldMod = { growth: Math.min(G.worldMod.until > G.day ? G.worldMod.growth : 0, 0) - (kind === 'str' ? 0.025 : 0.008), until: G.day + (kind === 'str' ? 720 : 365) };
    G.nukeUsed = (G.nukeUsed || 0) + 1; G.tension = Math.min(3, (G.tension || 1) + (kind === 'str' ? 0.8 : 0.3));
  }
  // ---- щомісяця: виробництво боєголовок, ризик ескалації
  G.nukesMonthly = function () {
    N.forEach(n => {
      if (!n.alive) return; n.nk = n.nk || { tested: false, esc: {}, used: 0 }; const s = G.nukeStatus(n.id);
      if (s.rate > 0) { const cost = s.rate * 0.4; if (n.cash > cost) { n.cash -= cost; n.nw = (n.nw || 0) + s.rate; } }
      // ШІ: держава з бомбою, але без випробування — випробовує
      if (n.id !== G.player && !(G.humans && G.humans.has(n.id)) && !s.tested && n.nw >= 3 && G.rnd() < 0.15) G.nukeTest(n.id);
      // ШІ будує програму, якщо має ворогів-ядерних і технології
      if (n.id !== G.player && !(G.humans && G.humans.has(n.id)) && G.has(n, 'nuke_enrich') && s.enr === 0 && G.enemiesOf(n.id).some(e => G.isNuclear(e)) && G.rnd() < 0.05 && G.startBuild) {
        const r = ter.find(t => t.owner === n.id && t.ctrl === n.id && !t.occ); if (r) G.startBuild(n.id, r.i, 'enrich_plant');
      }
    });
  };
  // ---- щотижня: ескалація. Ядерна держава, що втрачає власні регіони, може вдатися до тактичного удару (рідко).
  G.nukesWeekly = function () {
    while (later.length) later.shift()();
    N.forEach(n => {
      if (!n.alive || !G.isNuclear(n.id) || !n.nk.tested) return; const ai = n.id !== G.player && !(G.humans && G.humans.has(n.id));
      G.enemiesOf(n.id).forEach(e => {
        const core = ter.filter(t => t.owner === n.id), lost = core.filter(t => t.ctrl === e).length, capLost = n.home >= 0 && ter[n.home] && ter[n.home].ctrl !== n.id;
        let esc = n.nk.esc[e] || 0; const share = lost / Math.max(1, core.length);
        esc = clamp(esc * 0.97 + (share > 0.12 ? share * 0.25 : -0.02) + (capLost ? 0.4 : 0), 0, 1.5); n.nk.esc[e] = esc;
        if (esc > 0.6 && !n.nk['warn' + e]) { n.nk['warn' + e] = G.day; G.say(`⚠☢ ${n.name} попереджає ${N[e].name}: подальший наступ на її територію може призвести до застосування ядерної зброї.`, 'war', [e, n.id]); }
        if (ai && esc > 1 && G.rnd() < 0.03 * (G.diff && G.diff.id === 'easy' ? 0.3 : 1)) {
          const tgt = core.filter(t => t.ctrl === e).map(t => ({ t, k: G.armies.filter(a => a.t === t.i && a.n === e).reduce((s, a) => s + a.k, 0) })).sort((a, b) => b.k - a.k)[0];
          if (tgt && tgt.k > 20 && !G.nukeCan(n.id, tgt.t.i, 'tac')) G.nukeStrike(n.id, tgt.t.i, 'tac');
        }
      });
    });
  };
  G.act.nukeTest = () => G.player >= 0 ? G.nukeTest(G.player) : { ok: false, err: 'Лише за державу' };
  G.act.nukeStrike = (r, kind) => G.player >= 0 ? G.nukeStrike(G.player, r, kind) : { ok: false, err: 'Лише за державу' };
});
