// ТРАНСПОРТ: маршрути, які прокладають гравець і ШІ — залізниці, автомагістралі, трубопроводи, авіамости.
// Маршрут з'єднує два регіони (можна через кордон, якщо сусід згоден). Він:
//  • здешевлює торгівлю між країнами відповідного режиму (труби — газ; залізниця — навалювальні й контейнерні вантажі; авто — контейнерні);
//  • прискорює пересування армій (залізниця, авто, авіа) — окремі ребра в графі руху;
//  • покращує постачання армій у кінцевих регіонах.
LORA.sim.register('transport', 56, function (G) {
  const { N, ter, T } = G; const U = LORA.core, hav = U.hav, clamp = U.clamp; const LT = G.D.linkTypes;
  G.links = []; G.extraRegAdj = T.map(() => []); G.extraCellAdj = [[], [], []];
  const TF = { plains: 1, steppe: 1, forest: 1.2, hills: 1.35, mountain: 1.9, desert: 1.15, arctic: 2.2 };
  G.linkQuote = function (type, a, b) {
    const L = LT[type]; const km = hav(T[a].c[0], T[a].c[1], T[b].c[0], T[b].c[1]);
    const tf = type === 'air' || type === 'sea' ? 1 : (TF[T[a].t] + TF[T[b].t]) / 2;
    return { km, cost: +(type === 'air' ? 1.5 + km * L.costKm : km * L.costKm * tf).toFixed(2), days: Math.round(L.minDays + km * L.daysKm * tf) };
  };
  G.canLink = function (nid, type, a, b) {
    if (a === b) return 'Оберіть інший регіон';
    const ca = ter[a].ctrl, cb = ter[b].ctrl;
    if (ca !== nid && cb !== nid) return 'Хоча б один кінець має бути на вашій території';
    const other = ca === nid ? cb : ca;
    if (other !== nid && (G.atWar(nid, other) || (G.rel[other][nid] < 40 && !G.allied(nid, other)))) return `${G.nm(other)} не погоджується (потрібні відносини ≥ 40)`;
    const q = G.linkQuote(type, a, b);
    if (type === 'sea') { if (!T[a].p.length || !T[b].p.length) return 'Морська лінія — лише між прибережними регіонами'; if (!(ter[a].bld.port > 0) || !(ter[b].bld.port > 0)) return 'Потрібні морські порти на обох кінцях (будівля «Морський порт»)'; if (q.km > 15000) return 'Задовга морська лінія'; }
    else if (type !== 'air' && q.km > 2500) return 'Задовгий маршрут (понад 2500 км) — розбийте на ділянки';
    if (type === 'air' && q.km > 9000) return 'Задалеко для авіамосту';
    if (G.links.some(l => l.type === type && ((l.a === a && l.b === b) || (l.a === b && l.b === a)))) return 'Такий маршрут уже є';
    return '';
  };
  G.startLink = function (nid, type, a, b, quiet) {
    const err = G.canLink(nid, type, a, b); if (err) return { ok: false, err };
    const q = G.linkQuote(type, a, b), n = N[nid];
    n.cash -= q.cost; if (n.cash < 0) { n.debt -= n.cash; n.cash = 0; }
    const other = ter[a].ctrl === nid ? ter[b].ctrl : ter[a].ctrl;
    if (other !== nid) { G.rel[other][nid] = Math.min(100, G.rel[other][nid] + 4); G.rel[nid][other] = G.rel[other][nid]; }
    G.links.push({ id: G.nextId++, type, a, b, n: nid, done: G.day + q.days, km: q.km, cost: q.cost });
    if (!quiet) G.say(`${LT[type].ic} Прокладання: ${LT[type].n} ${T[a].n} — ${T[b].n} (${Math.round(q.km)} км, ${q.days} дн., $${q.cost} млрд)`, 'good', [nid]);
    return { ok: true, ...q };
  };
  G.rebuildLinkGraph = function () {
    G.extraRegAdj = T.map(() => []); G.extraCellAdj = [[], [], []];
    G.links.forEach(l => {
      if (l.done > G.day || l.cut) return; const L = LT[l.type];
      if (L.speed) { G.extraRegAdj[l.a].push([l.b, l.km, L.speed, l.type]); G.extraRegAdj[l.b].push([l.a, l.km, L.speed, l.type]); }
      const ca = G.cellIdx[T[l.a].cc], cb = G.cellIdx[T[l.b].cc]; if (ca == null || cb == null || ca === cb) return;
      L.modes.forEach(m => { (G.extraCellAdj[m][ca] = G.extraCellAdj[m][ca] || []).push([cb, l.km * L.factor]); (G.extraCellAdj[m][cb] = G.extraCellAdj[m][cb] || []).push([ca, l.km * L.factor]); });
    });
    G._seaEnd = {}; G.links.forEach(l => { if (l.type === 'sea' && l.done <= G.day && !l.cut) { G._seaEnd[l.a] = 1; G._seaEnd[l.b] = 1; } });
    G._routeSig = null; // змусити торгівлю перерахувати маршрути
  };
  G.linksDaily = function () {
    let changed = false;
    G.links.forEach(l => { if (!l.built && l.done <= G.day) { l.built = true; changed = true; if (l.n === G.player) G.say(`✅ Відкрито маршрут: ${LT[l.type].n} ${T[l.a].n} — ${T[l.b].n}`, 'good', [l.n]); } });
    // маршрути через ворожу/окуповану територію не працюють (перевіряємо раз на тиждень)
    if (G.day % 7 === 0) G.links.forEach(l => { if (!l.built) return; const ok = !G.atWar(ter[l.a].ctrl, ter[l.b].ctrl) && !(l.hitUntil > G.day); if (ok !== !l.cut) { l.cut = !ok; changed = true; } });
    if (changed) { G.rebuildLinkGraph(); G.tradeDirty = true; }
  };
  // постачання армій біля маршрутів
  const baseSup = G.supplyTarget;
  G.supplyTarget = function (a) { const near = G.extraRegAdj[a.t].some(e => e[3] === 'rail' || e[3] === 'road' || e[3] === 'air'); const sea = G._seaEnd && G._seaEnd[a.t]; return clamp(baseSup(a) + (near ? 0.06 : 0) + (sea ? 0.04 : 0), 0, 1); };
  G.linkVisible = l => l.done > G.day ? 'build' : l.cut ? 'cut' : 'ok';
});
