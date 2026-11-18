// РЕЖИМ «ПРЕЗИДЕНТ І РАДА»: стрімер — президент, чат Twitch — парламент.
// Законопроєкти президента (податки, бюджет, мобілізація, війна) ухвалює чат голосуванням !1 за / !2 проти.
// Чат-депутати також вносять власні ініціативи; ухвалені — президент підписує або ветує.
LORA.sim.register('rada', 93.7, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.radaOn = () => !!(G.rada && G.rada.on && G.rada.live && G.player >= 0);
  G.radaEnable = function (on) { G.rada = G.rada || { on: false, bills: [], log: [], next: 1, trust: 50, vetoes: 0 }; G.rada.on = !!on; };
  // ---- перехоплення голосувань парламенту для гравця
  const baseVote = G.parlVote;
  G.parlVote = function (n, key, what) {
    if (!G.radaOn() || n.id !== G.player) return baseVote(n, key, what);
    const R = G.rada;
    if (R._pass === key) { R._pass = null; n.parl.votes.unshift({ d: G.day, what: what + ' (чат)', yes: R._yes || 0, need: 0, ok: true }); n.parl.votes.length = Math.min(n.parl.votes.length, 12); return { ok: true }; }
    if (R.bills.some(b => b.key === key && (b.st === 'vote' || b.st === 'voting'))) return { ok: false, err: 'Цей законопроєкт уже чекає на голосування чату' };
    R.bills.push({ id: R.next++, key, what, by: 'pres', st: 'vote', replay: R._replay || null, d: G.day }); R._replay = null;
    return { ok: false, pending: true, err: 'Законопроєкт передано до Ради (чату) — дивіться голосування' };
  };
  // щоб повторити дію після ухвалення — обгортки запам'ятовують виклик
  ['setPolicy', 'declareWar'].forEach(fn => { const base = G.act[fn]; G.act[fn] = function (...args) { if (G.rada) G.rada._replay = { fn, args }; const r = base.apply(this, args); if (G.rada) G.rada._replay = null; return r; }; });
  // ---- ініціативи депутатів-глядачів
  const enemies = n => G.enemiesOf(n.id);
  const hostile = n => N.filter(m => m.alive && m.id !== n.id && G.rel[n.id][m.id] < -40 && !G.sanctioned(n.id, m.id)).sort((a, b) => G.rel[n.id][a.id] - G.rel[n.id][b.id]);
  const friends = n => N.filter(m => m.alive && m.id !== n.id && G.rel[n.id][m.id] > 40 && G.enemiesOf(m.id).length).sort((a, b) => G.rel[n.id][b.id] - G.rel[n.id][a.id]);
  G.RADA_INIT = [
    n => ({ what: 'Знизити податки на 2%', ic: '💸', apply: () => setPol(n, 'tax', n.pol.tax - 0.02) }),
    n => ({ what: 'Підвищити податки на 2% для оборони', ic: '🧾', apply: () => { setPol(n, 'tax', n.pol.tax + 0.02); setPol(n, 'mil', n.pol.mil + 0.01); } }),
    n => ({ what: 'Збільшити соціальні виплати на 2% ВВП', ic: '👵', apply: () => { setPol(n, 'soc', n.pol.soc + 0.02); n.stab = clamp(n.stab + 2, 0, 100); } }),
    n => ({ what: 'Збільшити оборонний бюджет на 1% ВВП', ic: '🛡', apply: () => setPol(n, 'mil', n.pol.mil + 0.01) }),
    n => enemies(n).length ? { what: 'Розширити мобілізацію', ic: '🪖', apply: () => setPol(n, 'mob', Math.min(0.06, n.pol.mob + 0.003)) } : null,
    n => enemies(n).length ? { what: 'Демобілізувати тих, хто служить понад 3 роки', ic: '🏠', apply: () => { setPol(n, 'mob', Math.max(0.001, n.pol.mob - 0.002)); n.stab = clamp(n.stab + 3, 0, 100); } } : null,
    n => { const h = hostile(n)[0]; return h ? { what: `Запровадити санкції проти ${h.name}`, ic: '🚫', apply: () => G.sanctions.add(n.id + '>' + h.id) } : null; },
    n => { const f = friends(n)[0]; return f ? { what: `Надати військову допомогу: ${f.name} ($1 млрд)`, ic: '📦', apply: () => { if (n.cash >= 1) { n.cash -= 1; f.cash += 1; G.rel[f.id][n.id] = G.rel[n.id][f.id] = clamp(G.rel[n.id][f.id] + 6, -100, 100); } } } : null; },
    n => ({ what: 'Антикорупційна реформа', ic: '⚖', apply: () => { n.stab = clamp(n.stab + 2, 0, 100); n.mods = n.mods || []; n.mods.push({ growth: 0.003, until: G.day + 730 }); n.cash -= 0.3; } }),
    n => ({ what: 'Програма відбудови регіонів', ic: '🏗', apply: () => { n.cash -= 1.5; ter.forEach(t => { if (t.owner === n.id && t.ctrl === n.id && t.dmg > 0) t.dmg = Math.max(0, t.dmg - 0.15); }); n.stab = clamp(n.stab + 1, 0, 100); } }),
    n => ({ what: 'Підвищити зарплати військовим', ic: '🎖', apply: () => { setPol(n, 'mil', n.pol.mil + 0.004); n.q = Math.min(1.6, n.q + 0.02); } }),
    n => ({ what: 'Резолюція недовіри уряду', ic: '📉', apply: () => { n.stab = clamp(n.stab - 4, 0, 100); if (n.parl) n.parl.coal = Math.max(0, n.parl.coal - 0.05); } }),
    n => ({ what: 'Державна програма підтримки IT і стартапів', ic: '💻', apply: () => { n.cash -= 0.5; n.mods = n.mods || []; n.mods.push({ growth: 0.002, until: G.day + 1095 }); } }),
    n => ({ what: 'Заборонити рекламу казино й азартних ігор', ic: '🎰', apply: () => { n.stab = clamp(n.stab + 1, 0, 100); n.cash -= 0.1; } }),
    n => ({ what: 'День вишиванки — державне свято', ic: '🎉', apply: () => { n.stab = clamp(n.stab + 1.5, 0, 100); } })
  ];
  function setPol(n, k, v) { const L = { tax: [0.05, 0.5], soc: [0.02, 0.35], mil: [0.005, 0.25], mob: [0.0005, 0.08] }[k]; n.pol[k] = clamp(v, L[0], L[1]); if (n.parl && n.parl.law) n.parl.law[k] = n.pol[k]; }
  G.radaInitiative = function () {
    if (!G.radaOn()) return null; const n = N[G.player]; const R = G.rada;
    const recent = new Set(R.log.slice(0, 6).map(l => l.what));
    const opts = G.RADA_INIT.map(f => f(n)).filter(b => b && !recent.has(b.what) && !R.bills.some(x => x.what === b.what));
    if (!opts.length) return null; const b = opts[Math.floor(G.rnd() * opts.length)];
    const k = G.RADA_INIT.findIndex(f => { const x = f(n); return x && x.what === b.what; });
    const bill = { id: R.next++, key: 'init' + k, what: b.what, ic: b.ic, by: 'chat', st: 'vote', init: k, d: G.day }; R.bills.push(bill); return bill;
  };
  // результат голосування чату
  G.radaResolve = function (id, yes, no) {
    const R = G.rada, b = R && R.bills.find(x => x.id === id); if (!b) return null; const n = N[G.player];
    const ok = yes > no && yes > 0; b.yes = yes; b.no = no; R.log.unshift({ d: G.day, what: b.what, yes, no, ok, by: b.by }); R.log.length = Math.min(R.log.length, 30);
    G.say(`🏛 ${t('Рада (чат)')}: «${b.what}» — ${ok ? 'ухвалено' : 'провалено'} (${yes} за / ${no} проти)`, ok ? 'good' : 'bad', [G.player]);
    if (b.by === 'pres') {
      R.trust = clamp(R.trust + (ok ? 2 : -3), 0, 100); R.bills = R.bills.filter(x => x !== b);
      if (ok && b.replay && G.act[b.replay.fn]) { R._pass = b.key; R._yes = yes; const r = G.act[b.replay.fn](...b.replay.args); R._pass = null; return { ok, res: r }; }
      if (!ok && n.parl) n.parl.lock[b.key] = G.day + 30;
      return { ok };
    }
    if (!ok) { R.bills = R.bills.filter(x => x !== b); return { ok }; }
    b.st = 'sign'; return { ok, sign: true };
  };
  // президент підписує або ветує ухвалений чатом закон
  G.radaSign = function (id, sign) {
    const R = G.rada, b = R && R.bills.find(x => x.id === id && x.st === 'sign'); if (!b) return { ok: false }; const n = N[G.player];
    R.bills = R.bills.filter(x => x !== b);
    if (sign) { const f = G.RADA_INIT[b.init]; const x = f && f(n); if (x) x.apply(); R.trust = clamp(R.trust + 3, 0, 100); G.say(`✍ Президент підписав закон «${b.what}»`, 'good', [G.player]); }
    else { R.vetoes++; R.trust = clamp(R.trust - 6, 0, 100); n.stab = clamp(n.stab - 1, 0, 100); G.say(`✋ Президент ветував закон «${b.what}». Чат обурений.`, 'bad', [G.player]); }
    R.log[0] && R.log[0].what === b.what && (R.log[0].sign = sign);
    return { ok: true };
  };
  // довіра чату до президента впливає на стабільність
  G.radaMonthly = function () { const R = G.rada; if (!R || !R.on || G.player < 0) return; const n = N[G.player]; n.stab = clamp(n.stab + (R.trust - 50) * 0.02, 0, 100); };
  function t(s) { return s; }
});
