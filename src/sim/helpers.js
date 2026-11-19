// ДОПОМІЖНІ ПРАВИЛА: хто з ким у союзі, у війні, під санкціями; новини; дата.
LORA.sim.register('helpers', 20, function (G) {
  const N = G.N;
  const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
  G.warKey = key;
  G.allied = (a, b) => { if (a === b) return true; for (const al of G.alliances) if (al.m.has(a) && al.m.has(b)) return true; return false; };
  G.atWar = (a, b) => a !== b && G.wars.has(key(a, b));
  G.enemiesOf = a => { const out = []; G.wars.forEach(w => { if (w.a === a) out.push(w.b); else if (w.b === a) out.push(w.a); }); return out; };
  G.sanctioned = (a, b) => G.sanctions.has(a + '>' + b) || G.sanctions.has(b + '>' + a);
  G.hasAccess = (a, owner) => G.access.has(a + '>' + owner);
  G.coBelligerent = (a, b) => { if (a === b) return true; const ea = G.enemiesOf(a); if (!ea.length) return false; const eb = new Set(G.enemiesOf(b)); return ea.some(x => eb.has(x)); };
  G.friendlyTo = (nat, ctrl) => ctrl === nat || G.allied(nat, ctrl) || G.hasAccess(nat, ctrl) || (G.coBelligerent(nat, ctrl) && !G.atWar(nat, ctrl));
  G.nm = i => N[i] ? N[i].name : '?';
  G.dateStr = d => { const dt = new Date(G.startDate + (d == null ? G.day : d) * 86400000); return dt.toLocaleDateString(LORA.lang === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }); };
  G.fmt$ = v => { const a = Math.abs(v), s = v < 0 ? '−' : ''; if (a >= 1) return s + '$' + a.toFixed(a >= 100 ? 0 : 1) + ' млрд'; if (a >= 0.001) return s + '$' + (a * 1000).toFixed(a >= 0.1 ? 0 : 1) + ' млн'; if (a >= 0.000001) return s + '$' + (a * 1e6).toFixed(a >= 0.0001 ? 0 : 1) + ' тис.'; return s + '$' + Math.round(a * 1e9); };
  G.news = G.news || [];
  G.say = function (text, kind, nats) {
    const item = { d: G.day, text, kind: kind || 'info', nats: nats || [] };
    G.news.unshift(item); if (G.news.length > 300) G.news.length = 300;
    LORA.bus.emit('news', item);
  };
  G.hav = LORA.core.hav; G.clamp = LORA.core.clamp;
  G.troopsOf = nid => { let s = 0; for (const a of G.armies) if (a.n === nid) s += a.k; return s; };
  G.shipsOf = nid => { let s = 0; for (const f of G.fleets) if (f.n === nid) s += f.s; return s; };
  G.regionsOf = nid => G.ter.filter(t => t.owner === nid);
});
