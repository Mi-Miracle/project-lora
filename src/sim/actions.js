// ДІЇ ГРАВЦЯ: усе, що гравець може зробити через інтерфейс. Інтерфейс викликає лише G.act.*
LORA.sim.register('actions', 90, function (G) {
  const { N, ter, T } = G; const clamp = LORA.core.clamp; const rel = G.rel;
  const P = G.act = {};
  const pay = (n, amt) => { n.cash -= amt; if (n.cash < 0) { n.debt -= n.cash; n.cash = 0; } };
  P.setPolicy = (k, v) => { N[G.player].pol[k] = v; };
  P.resAlloc = (b, w) => G.resAlloc(G.player, b, w);
  P.resGrant = (b, amt) => G.resGrant(G.player, b, amt);
  P.resAuto = v => { N[G.player].res.auto = !!v; return { ok: true }; };
  P.strike = (i, w, cnt, goal) => G.strike(G.player, i, w, w === 'bombing' ? Math.min(cnt, Math.floor((N[G.player].air || {}).bmb || 0)) : cnt, goal);
  P.recruit = (ti, k, tpl) => {
    const n = N[G.player]; const pool = n.agg.pop * 1000 * n.pol.mob, tr = G.troopsOf(n.id);
    if (ter[ti].ctrl !== n.id) return { ok: false, err: 'Набір можливий лише на власній території' };
    if (tr + k > pool) return { ok: false, err: `Ліміт мобілізації: доступно ${Math.max(0, pool - tr).toFixed(0)} тис. Підвищте рівень мобілізації.` };
    const cost = k * 0.02 * (0.5 + n.pc / 20000) + k * 0.05; pay(n, cost);
    if (tpl && G.D.armyTemplates && G.D.armyTemplates[tpl]) G._tpl = tpl; const a = G.newArmy(n.id, ti, k); a.train = Math.round(45 + k / 10); a.org = 0.5; a.auto = false;
    G.say(`🪖 Сформовано «${a.name}» (${k} тис., ${T[ti].n}). Підготовка ${a.train} днів. Вартість $${cost.toFixed(1)} млрд`, 'good', [n.id]);
    return { ok: true };
  };
  P.buildFleet = s => {
    const n = N[G.player]; const port = G.nationPorts(n.id)[0]; if (!port) return { ok: false, err: 'Немає портів для верфі' };
    if (n.ratio.metal < 0.6 || n.ratio.chips < 0.5) return { ok: false, err: 'Бракує металу або мікроелектроніки для суднобудування' };
    const cost = s * 1.2 * (0.6 + 0.4 * n.tech); pay(n, cost);
    const days = Math.round(120 + s * 6); G.building.push({ n: n.id, s, node: port[0], done: G.day + days });
    G.say(`⚓ Закладено ${s} кораблів. Готовність через ${days} днів. $${cost.toFixed(1)} млрд`, 'good', [n.id]); return { ok: true };
  };
  P.declareWar = x => { if (G.allied(G.player, x)) G.alliances.forEach(al => { if (al.m.has(G.player) && al.m.has(x)) { al.m.delete(G.player); G.say(`❌ ${G.nm(G.player)} виключено з «${al.name}»`, 'bad', [G.player]); } }); G.declareWar(G.player, x); return { ok: true }; };
  P.peace = (x, type) => { if (G.aiPeaceAnswer(x, G.player, type)) { G.makePeace(G.player, x, type); return { ok: true }; } rel[x][G.player] -= 2; return { ok: false, err: `${G.nm(x)} відхиляє пропозицію. Оцінка війни для них: ${(G.warScore(x, G.player) * 100).toFixed(0)}` }; };
  P.improve = x => { const n = N[G.player]; const cost = 0.2 + N[x].agg.gdp * 0.0004; pay(n, cost); const d = 4 + G.rnd() * 4; rel[x][G.player] = clamp(rel[x][G.player] + d, -100, 100); rel[G.player][x] = clamp(rel[G.player][x] + d * 0.5, -100, 100); G.relBase[x][G.player] = clamp(G.relBase[x][G.player] + d * 0.5, -100, 100); return { ok: true, msg: `Відносини +${d.toFixed(0)} (витрачено $${cost.toFixed(2)} млрд)` }; };
  P.sanction = x => { const k = G.player + '>' + x; if (G.sanctions.has(k)) { G.sanctions.delete(k); G.say(`${G.nm(G.player)} знімає санкції (${G.nm(x)})`, 'info', [G.player, x]); } else { G.sanctions.add(k); rel[x][G.player] -= 20; rel[G.player][x] -= 10; G.say(`🚫 ${G.nm(G.player)} запроваджує санкції: ${G.nm(x)}`, 'info', [G.player, x]); } G.tradeDirty = true; return { ok: true }; };
  P.treaty = x => { const k = G.warKey(G.player, x); if (G.treaties.has(k)) { G.treaties.delete(k); return { ok: true, msg: 'Угоду розірвано' }; } if (rel[x][G.player] < 25) return { ok: false, err: 'Потрібні відносини ≥ 25' }; G.treaties.add(k); rel[x][G.player] += 5; G.say(`📑 Зона вільної торгівлі: ${G.nm(G.player)} — ${G.nm(x)}`, 'good', [G.player, x]); G.tradeDirty = true; return { ok: true }; };
  P.alliance = x => {
    if (G.allied(G.player, x)) { G.alliances = G.alliances.filter(al => !(al.m.size === 2 && al.m.has(G.player) && al.m.has(x))); return { ok: true, msg: 'Двосторонній союз розірвано' }; }
    const r = rel[x][G.player]; const need = 60 - (G.enemiesOf(x).length ? 10 : 0) + (N[x].nuke ? 10 : 0);
    if (r < need) return { ok: false, err: `${G.nm(x)} відмовляє: потрібні відносини ≥ ${need} (зараз ${r.toFixed(0)})` };
    if (G.enemiesOf(G.player).some(e => !G.atWar(x, e)) && r < 80) return { ok: false, err: `${G.nm(x)} не хоче втягуватися у ваші війни` };
    G.alliances.push({ name: `Союз ${G.nm(G.player)}–${G.nm(x)}`, m: new Set([G.player, x]) }); G.say(`🛡 Оборонний союз: ${G.nm(G.player)} — ${G.nm(x)}`, 'good', [G.player, x]); return { ok: true };
  };
  P.access = x => { const k = G.player + '>' + x; if (G.access.has(k)) { G.access.delete(k); return { ok: true, msg: 'Доступ скасовано' }; } if (rel[x][G.player] < 40) return { ok: false, err: 'Потрібні відносини ≥ 40' }; G.access.add(k); return { ok: true, msg: 'Військовий доступ надано' }; };
  P.aid = (x, amt) => { const n = N[G.player]; pay(n, amt); N[x].milStock += amt * 0.8; N[x].cash += amt * 0.2; const d = Math.min(25, amt / Math.max(1, N[x].agg.gdp) * 300 + 2); rel[x][G.player] = clamp(rel[x][G.player] + d, -100, 100); G.relBase[x][G.player] = clamp(G.relBase[x][G.player] + d * 0.5, -100, 100); G.say(`📦 Допомога $${amt} млрд: ${G.nm(G.player)} → ${G.nm(x)}`, 'good', [G.player, x]); return { ok: true }; };
  P.build = (i, type) => G.startBuild(G.player, i, type);
  P.link = (type, a, b) => G.startLink(G.player, type, a, b);
  P.contract = (r, partner, q, dir) => { G.contracts.push({ id: G.nextId++, r, partner, q, dir }); G.tradeDirty = true; return { ok: true }; };
  P.cancelContract = id => { G.contracts = G.contracts.filter(c => c.id !== id); G.tradeDirty = true; };
  P.answerPending = (idx, yes) => {
    const p = G.pendingPeace.splice(idx, 1)[0]; if (!p) return;
    if (p.type === 'ally_call') { if (yes) { if (N[p.vs].alive) G.startWar(G.player, p.vs, p.cid, true, p.vs); G.say(`🛡 ${G.nm(G.player)} виконує союзний обов'язок: війна проти ${G.nm(p.vs)}`, 'war', [G.player]); } else { rel[p.from][G.player] -= 35; G.say(`${G.nm(G.player)} ухиляється від союзних зобов'язань (${G.nm(p.from)})`, 'bad', [G.player]); } return; }
    if (!yes || !G.atWar(p.from, G.player)) return;
    if (p.type === 'cede_to_ai') G.makePeace(p.from, G.player, 'cede'); else if (p.type === 'cede') G.makePeace(G.player, p.from, 'cede'); else if (p.type === 'mutual') G.makePeace(G.player, p.from, 'mutual'); else G.makePeace(G.player, p.from, 'white');
  };
});
