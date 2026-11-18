// ХРОНІКА ДЛЯ СТРІМУ: що відбувалося з державою гравця — щомісячні показники й ключові події.
LORA.sim.register('chronicle', 99.8, function (G) {
  const { N, ter } = G;
  const snap = nid => { const n = N[nid]; return { d: G.day, gdp: +(n.agg.gdp || 0).toFixed(1), stab: +n.stab.toFixed(1), reg: ter.filter(t => t.ctrl === nid).length, cash: +n.cash.toFixed(1), tr: Math.round(G.troopsOf ? G.troopsOf(nid) : 0) }; };
  G.chronInit = function () { const nid = G.player; if (nid < 0 || G.chron) return; G.chron = { nid, start: snap(nid), ser: [], ev: [] }; };
  const KEY = /☢|війн|нападає|капітул|Переворот|Повстання|мир|Мир|угод|союз|Звільнено|звільнено|встановлює контроль|🏆|перемога|Розвилка|закон|Обвал|вибори|Вибори|ухвалено|санкц/;
  LORA.bus.on && LORA.bus.on('news', it => {
    const C = G.chron; if (!C || !G.N) return; const mine = it.nats && it.nats.includes(C.nid);
    if ((mine || /☢|капітул|Обвал/.test(it.text)) && KEY.test(it.text) && !/Будівництво|будує/.test(it.text)) { if (C.ev.length && C.ev[C.ev.length - 1].text === it.text) return; C.ev.push({ d: it.d, text: it.text, k: it.kind }); if (C.ev.length > 400) C.ev.shift(); }
  });
  G.chronMonthly = function () { G.chronInit(); const C = G.chron; if (!C || !N[C.nid]) return; C.ser.push(snap(C.nid)); if (C.ser.length > 600) C.ser.shift(); };
  G.chronNow = () => G.chron && N[G.chron.nid] ? snap(G.chron.nid) : null;
});
