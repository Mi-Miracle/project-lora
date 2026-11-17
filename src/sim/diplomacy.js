// ДИПЛОМАТІЯ: оголошення війни, союзні зобов'язання, мир, оцінка війни, міжнародна допомога.
LORA.sim.register('diplomacy', 60, function (G) {
  const { N, ter, T } = G; const clamp = LORA.core.clamp; const rel = G.rel;
  G.startWar = function (att, def, cid, quiet, aggressor) {
    if (att === def || G.atWar(att, def)) return;
    G.wars.set(G.warKey(att, def), { a: att, b: def, att: aggressor != null ? aggressor : att, start: G.day, cid });
    [att, def].forEach(x => { if (!N[x].warStart) N[x].warStart = G.day; });
    if (!quiet) G.say(`⚔ ВІЙНА: ${G.nm(att)} нападає на країну ${G.nm(def)}!`, 'big', [att, def]);
    G.tradeDirty = true; LORA.bus.emit('war', { att, def });
  };
  G.declareWar = function (att, def) {
    if (G.atWar(att, def)) return;
    const cid = G.conflicts.length; G.conflicts.push({ id: cid, name: `Війна: ${G.nm(att)} — ${G.nm(def)}`, start: G.day, att, def });
    G.startWar(att, def, cid); N[att].lastWarDecl = G.day; if (G.metrics) G.metrics.newWars.push(G.day);
    N.forEach(o => { if (!o.alive || o.id === att || o.id === def) return; const d = -6 - Math.max(0, rel[o.id][def]) * 0.25; rel[o.id][att] = clamp(rel[o.id][att] + d, -100, 100); rel[att][o.id] = rel[o.id][att]; });
    rel[att][def] = rel[def][att] = -100;
    const defAlly = new Set(); G.alliances.forEach(al => { if (al.m.has(def) && !al.m.has(att)) al.m.forEach(m => defAlly.add(m)); });
    defAlly.forEach(m => { if (m === def || m === att || !N[m].alive || G.allied(m, att)) return;
      if (G.isHuman(m)) { G.pendingPeace.push({ type: 'ally_call', from: def, vs: att, cid, to: m }); return; }
      if (rel[m][def] > 25 || G.alliances.some(al => al.name === 'НАТО' && al.m.has(m) && al.m.has(def))) { G.startWar(m, att, cid, true, att); G.say(`🛡 ${G.nm(m)} вступає у війну на захист союзника (${G.nm(def)})`, 'war', [m, att]); } });
    N.forEach(o => { if (!o.alive || o.id === att || G.isHuman(o.id)) return; if (rel[o.id][def] > 50 && rel[o.id][att] < 20) G.sanctions.add(o.id + '>' + att); });
    G.tradeDirty = true;
  };
  G.endWar = function (a, b, quiet) { G.wars.delete(G.warKey(a, b)); ter.forEach(t => { if (t.occ && ((t.occ.by === a && t.ctrl === b) || (t.occ.by === b && t.ctrl === a))) t.occ = null; }); if (!quiet) G.say(`🕊 Підписано мир: ${G.nm(a)} — ${G.nm(b)}`, 'big', [a, b]); [a, b].forEach(x => { if (!G.enemiesOf(x).length) N[x].warStart = 0; }); G.tradeDirty = true; LORA.bus.emit('peace', { a, b }); };
  // type: 'white' — повернення окупованого; 'cede' — b віддає a все, що a контролює; 'mutual' — кожен зберігає контрольоване
  G.makePeace = function (a, b, type) {
    ter.forEach(t => {
      if (t.owner === b && t.ctrl === a) { if (type === 'cede' || type === 'mutual') { t.owner = a; t.integ = 0.15; } else t.ctrl = b; }
      else if (t.owner === a && t.ctrl === b) { if (type === 'mutual') { t.owner = b; t.integ = 0.15; } else t.ctrl = a; }
      if (t.occ && (t.occ.by === a || t.occ.by === b)) t.occ = null;
    });
    G.endWar(a, b);
    G.armies.forEach(x => { if ((x.n === a || x.n === b) && !G.friendlyTo(x.n, ter[x.t].ctrl)) { x.t = N[x.n].home; x.mv = null; } });
    rel[a][b] = rel[b][a] = -50; G.refreshNation(a); G.refreshNation(b);
  };
  G.warScore = function (a, b) {
    let gain = 0, loss = 0; ter.forEach(t => { if (t.owner === b && t.ctrl === a) gain += t.gdp; if (t.owner === a && t.ctrl === b) loss += t.gdp; if (t.occ && t.occ.by === a && t.ctrl === b) gain += t.gdp * t.occ.p / 200; if (t.occ && t.occ.by === b && t.ctrl === a) loss += t.gdp * t.occ.p / 200; });
    const pa = G.armies.filter(x => x.n === a).reduce((s, x) => s + G.armyPower(x), 0), pb = G.armies.filter(x => x.n === b).reduce((s, x) => s + G.armyPower(x), 0);
    const ga = (N[a].agg ? N[a].agg.gdpPot : 0) + 1, gb = (N[b].agg ? N[b].agg.gdpPot : 0) + 1;
    return clamp((gain / gb - loss / ga) * 2.5 + (pa - pb) / Math.max(1, pa + pb) * 0.4 + (N[b].warExh - N[a].warExh) * 0.5, -1, 1);
  };
  G.aiPeaceAnswer = function (ai, other, type) {
    const s = G.warScore(ai, other), ex = N[ai].warExh;
    if (type === 'white') { const pr = N[ai].press || 0; const holds = ter.some(t => t.owner === other && t.ctrl === ai); return holds ? s < -0.05 + ex * 0.25 + pr * 0.35 && ex > 0.5 && pr > 0.62 : s < 0.15 + ex * 0.5 + pr * 0.3; } // віддати захоплене — лише під сильним виснаженням і тиском // віддати захоплене — лише з виснаження
    if (type === 'cede') return s < -0.25 + ex * 0.3 && (ex > 0.65 || (N[ai].press || 0) > 0.7) && ter.some(t => t.owner === ai && t.ctrl === other); // поступитися землею — лише зі сильного виснаження
    if (type === 'mutual') return s < 0.05 + ex * 0.4;
    return false;
  };
  G.nationPower = nid => G.armies.reduce((s, a) => a.n === nid ? s + a.k * N[a.n].q : s, 0);
  // Допомога жертвам агресії від дружніх держав (щомісяця)
  G.foreignAid = function () {
    N.forEach(n => n.aidIn = 0);
    const victims = new Set(); G.wars.forEach(w => { victims.add(w.att === w.a ? w.b : w.a); });
    victims.forEach(v => {
      const V = N[v]; if (!V.alive) return; let total = 0; const donors = [];
      N.forEach(d => { if (!d.alive || d.id === v || G.isHuman(d.id) || G.atWar(d.id, v) || rel[d.id][v] < 45) return; if (G.enemiesOf(v).some(a => rel[d.id][a] > rel[d.id][v])) return;
        const amt = d.agg.gdp * G.B.aidRate / 12 * (rel[d.id][v] / 100); if (amt < 0.05) return; d.cash -= amt; if (d.cash < 0) { d.debt -= d.cash; d.cash = 0; } total += amt; donors.push(d.id); });
      if (total > 0) { V.cash += total * 0.55; V.milStock += total * 0.45; V.aidIn = total * 12; if (v === G.player) G.say(`📦 Міжнародна допомога: $${total.toFixed(1)} млрд за місяць від ${donors.length} країн`, 'good', [v]); }
    });
  };
});
