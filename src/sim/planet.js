// ПЛАНЕТА: (1) клімат на мапі — прибережні регіони поступово затоплює (рівень моря + штормові нагони), люди переселяються,
// від моря захищають дамби; (2) орбітальне сміття — збиті супутники лишають уламки, які нищать чужі супутники;
// понад 85% — синдром Кесслера: орбіта закрита на півтора року.
LORA.sim.register('planet', 99.981, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const S = () => G.v29s('pl', () => ({ fl: {}, surge: {}, dam: {}, damQ: {}, deb: 6, kes: 0, hist: [] }));
  const isH = id => G.isHuman ? G.isHuman(id) : id === G.player;
  // вразливість регіону до моря: детермінована з номера регіону + рельєф (рівнини й пустелі нижчі)
  const LOWT = { plains: 0.7, desert: 0.8, steppe: 0.85, forest: 1, hills: 1.6, mountain: 3, arctic: 1.2 };
  const coast = []; T.forEach((r, i) => { if (r.p && r.p.length) coast.push(i); });
  const thr = i => { const h = ((i * 2654435761) % 1000) / 1000; return (3 + h * 45) * (LOWT[T[i].t] || 1) + (S().dam[i] ? 60 : 0); };
  G.floodOf = i => (S().fl[i] || 0) + (S().surge[i] && S().surge[i].until > G.day ? S().surge[i].v : 0);
  G.floodRisk = i => { const sea = (G.climate && G.climate.sea) || 0; return T[i].p && T[i].p.length ? clamp(sea / thr(i), 0, 1) : 0; };
  // ---- щомісячно: затоплення, нагони, переселення
  function floodMonthly() {
    const P = S(), sea = (G.climate && G.climate.sea) || 0, warm = (G.climate && G.climate.t) || 1.3;
    // будівництво дамб
    for (const k in P.damQ) if (P.damQ[k] <= G.day) { P.dam[k] = 1; delete P.damQ[k]; const o = ter[k].owner; G.say(`🧱 ${N[o].name}: дамбу в регіоні «${T[k].n}» добудовано — море більше не страшне`, isH(o) ? 'good' : 'info', [o]); }
    // постійне затоплення
    coast.forEach(i => { const lvl = clamp((sea - thr(i)) / 40, 0, 0.9); const old = P.fl[i] || 0; if (lvl > old + 0.001) { P.fl[i] = +lvl.toFixed(3); if (old < 0.3 && lvl >= 0.3) { const o = ter[i].owner; G.say(`🌊 ${N[o].name}: море наступає — регіон «${T[i].n}» затоплено на ${(lvl * 100).toFixed(0)}%`, isH(o) ? 'bad' : 'info', [o]); if (isH(o)) G.fx29('flood', { where: T[i].n }); } } });
    // штормові нагони: що тепліше, то частіше
    const nS = Math.floor(G.rnd() * (1 + (warm - 1.2) * 6)); for (let k = 0; k < nS; k++) { const i = pick(coast); if (i == null || P.dam[i]) continue; P.surge[i] = { v: 0.25 + G.rnd() * 0.35, until: G.day + 30 + Math.floor(G.rnd() * 60) }; const o = ter[i].owner; if (isH(o)) G.say(`🌀 Штормовий нагін: «${T[i].n}» (${N[o].name}) під водою на кілька тижнів. Фермери пересідають на човни`, 'bad', [o]); }
    for (const k in P.surge) if (P.surge[k].until <= G.day) delete P.surge[k];
    // наслідки: ВВП падає, люди переїжджають углиб країни або за кордон
    coast.forEach(i => { const f = G.floodOf(i); if (f < 0.05) return; const t = ter[i]; t.gdp *= 1 - 0.012 * f; const mv = t.pop * 0.006 * f; if (mv <= 0) return;
      const inl = T[i].nb.filter(j => ter[j].owner === t.owner && !(T[j].p && T[j].p.length)); const dst = inl.length ? ter[pick(inl)] : null;
      t.pop -= mv; if (dst) dst.pop += mv; else { const ab = T[i].nb.map(j => ter[j]).filter(x => x.owner !== t.owner && x.owner >= 0); const x = pick(ab); if (x) { x.pop += mv; N[x.owner].stab = clamp(N[x.owner].stab - 0.2, 0, 100); } } });
    P.hist.push(+sea.toFixed(1)); if (P.hist.length > 120) P.hist.shift();
  }
  G.damCost = i => +(0.15 + Math.min(4, ter[i].gdp * 0.02)).toFixed(2);
  G.damBuild = function (nid, i) {
    const n = N[nid], t = ter[i]; if (!t || t.owner !== nid || t.ctrl !== nid) return { ok: false, err: 'Лише у власних регіонах' };
    if (!(T[i].p && T[i].p.length)) return { ok: false, err: 'Регіон не має виходу до моря' }; const P = S(); if (P.dam[i]) return { ok: false, err: 'Дамба вже є' }; if (P.damQ[i]) return { ok: false, err: 'Дамба вже будується' };
    const c = G.damCost(i); if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; n.cash -= c; P.damQ[i] = G.day + 365; return { ok: true, msg: `дамба буде готова за рік ($${c} млрд)` };
  };
  G.floodList = nid => coast.filter(i => ter[i].owner === nid && ter[i].ctrl === nid).map(i => ({ i, n: T[i].n, f: G.floodOf(i), risk: G.floodRisk(i), dam: !!S().dam[i], q: S().damQ[i] || 0 })).sort((a, b) => (b.f + b.risk) - (a.f + a.risk));

  // ================= ОРБІТАЛЬНЕ СМІТТЯ =================
  G.debris = () => S().deb; G.kessler = () => S().kes > G.day;
  G.debrisAdd = (v, why) => { const P = S(); const was = P.deb; P.deb = clamp(P.deb + v, 0, 100); if (was < 50 && P.deb >= 50) G.say(`🛰 Орбітальне сміття вже ${P.deb.toFixed(0)}%: страхові компанії відмовляються страхувати супутники${why ? ' (' + why + ')' : ''}`, 'bad', []); };
  if (G.asatStrike) { const b = G.asatStrike; G.asatStrike = function () { const r = b.apply(this, arguments); if (r && r.ok !== false) G.debrisAdd(5 + G.rnd() * 4, 'протисупутниковий удар'); return r; }; }
  const satTot = n => n.sats ? Object.values(n.sats).reduce((a, b) => a + b, 0) : 0;
  function debrisMonthly() {
    const P = S(); const all = N.filter(n => n.alive && n.sats); const tot = all.reduce((s, n) => s + satTot(n), 0);
    P.deb = clamp(P.deb + tot * 0.0004 - 0.25 - (G.unActive && G.unActive('debris') ? 2 : 0), 0, 100);
    // уламки збивають супутники
    const pr = P.deb / 100 * 0.025; let lost = 0; all.forEach(n => { for (const k in n.sats) { let m = 0; for (let j = 0; j < n.sats[k]; j++) if (G.rnd() < pr) m++; if (m) { n.sats[k] -= m; lost += m; if (isH(n.id)) G.say(`💥 Уламок на орбіті розбив ваш супутник (${k}). Страховка: «форс-мажор»`, 'bad', [n.id]); } } });
    if (P.deb >= 85 && P.kes <= G.day) { P.kes = G.day + 540; all.forEach(n => { for (const k in n.sats) n.sats[k] = Math.floor(n.sats[k] * 0.4); }); G.say('☄☄☄ СИНДРОМ КЕССЛЕРА: ланцюгова реакція уламків знищила більшість супутників. Орбіту закрито на 18 місяців, GPS показує, що ви в океані', 'big', []); G.fx29('kessler'); }
  }
  G.debrisCleanCan = nid => { const n = N[nid]; if (!n.space || !(n.space.base || G.has(n, 'reusable') || satTot(n) >= 3)) return 'Потрібен власний космодром або хоча б 3 супутники'; if ((n._cleanT || 0) > G.day) return `Наступна місія через ${n._cleanT - G.day} дн.`; if (n.cash < 1.2) return 'Бракує коштів ($1.2 млрд)'; return ''; };
  G.debrisClean = function (nid) {
    const e = G.debrisCleanCan(nid); if (e) return { ok: false, err: e }; const n = N[nid]; n.cash -= 1.2; n._cleanT = G.day + 180; const v = 8 + G.rnd() * 8; S().deb = clamp(S().deb - v, 0, 100);
    N.forEach(z => { if (z.alive && z.id !== nid && satTot(z) > 2) G.rel[z.id][nid] = clamp(G.rel[z.id][nid] + 3, -100, 100); }); n.stab = clamp(n.stab + 1, 0, 100);
    const joke = pick(['космічний пилосос працює ідеально', 'серед уламків знайшли рукавицю астронавта 1965 року', 'зібрано 3 тонни сміття і один загублений ключ на 12', 'орбітальний двірник отримав медаль']);
    G.say(`🧹 ${n.name}: місія з прибирання орбіти — сміття −${v.toFixed(0)}%, ${joke}`, isH(nid) ? 'good' : 'info', [nid]); if (isH(nid)) G.fx29('cleanup'); return { ok: true, msg: `сміття −${v.toFixed(0)}%` };
  };
  // запуски супутників під час Кесслера неможливі
  if (G.act && G.act.orderSat) { const b = G.act.orderSat; G.act.orderSat = function () { if (G.kessler()) return { ok: false, err: 'Синдром Кесслера: орбіта закрита' }; return b.apply(this, arguments); }; }
  // резолюція ООН про прибирання орбіти
  if (G.UN_RES && !G.UN_RES.debris) G.UN_RES.debris = { n: 'Програма прибирання орбіти', ic: '🧹', bind: false, d: 'орбітальне сміття зменшується щомісяця; космічні держави скидаються', days: 1095 };
  if (G.UN_RES && !G.UN_RES.pineapple) G.UN_RES.pineapple = { n: 'Заборона ананасів на піці', ic: '🍕', bind: false, d: 'нічого не змінює, але половина світу обурена, а половина щаслива', days: 365 };
  // ШІ: космічні держави іноді прибирають, коли сміття багато
  function aiClean() { if (S().deb < 40) return; const c = N.filter(n => n.alive && !isH(n.id) && n.space && n.space.base && n.cash > 20); if (c.length && G.rnd() < 0.25) G.debrisClean(pick(c).id); }
  G.act.damBuild = i => G.damBuild(G.player, i); G.act.debrisClean = () => G.debrisClean(G.player);
  G.h29.m.push(floodMonthly, debrisMonthly, aiClean);
});
