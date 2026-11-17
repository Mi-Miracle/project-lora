// ВНУТРІШНІЙ ТИСК ВІЙНИ (для всіх держав): затяжна війна, втрати, блекаути й санкції накопичують тиск суспільства.
// Наслідки: протести, падіння стабільності, відставка уряду / дострокові вибори (демократії), розкол еліт і загроза
// перевороту (автократії); головне — під тиском держава охочіше погоджується на мир і навіть повертає захоплене.
LORA.sim.register('pressure', 94, function (G) {
  const { N, ter } = G; const U = LORA.core, clamp = U.clamp;
  N.forEach(n => { n.press = 0; });
  G.humans = new Set(); G.isHuman = id => id === G.player || G.humans.has(id); // люди-гравці (локальний + онлайн-гості)
  G.pressureMonthly = function () {
    N.forEach(n => {
      if (!n.alive || !n.agg) return; const en = G.enemiesOf(n.id); const P = n.press || 0;
      if (!en.length) { n.press = Math.max(0, P - 0.05); return; }
      const w = en.map(e => G.wars.get(G.warKey(n.id, e))).filter(Boolean); const age = w.length ? Math.max(...w.map(x => G.day - (x.start || 0))) : 0;
      let sancW = 0; G.sanctions.forEach(k => { if (k.endsWith('>' + n.id)) { const f = +k.split('>')[0]; sancW += N[f] && N[f].agg ? N[f].agg.gdp : 0; } }); const sanc = sancW / Math.max(1, n.agg.gdp) * 0.6; // вага санкцій — частка світового ВВП, що їх запровадив
      const regime = n.parl ? n.parl.regime : 'democracy'; const tol = regime === 'autocracy' ? 0.55 : regime === 'hybrid' ? 0.75 : 1;
      const exist = ter.some(t => t.owner === n.id && t.ctrl !== n.id && G.atWar(t.ctrl, n.id)); // захисники терплять більше
      let d = (n.warExh || 0) * 0.04 + Math.min(1, age / 1460) * 0.02 + Math.min(0.025, sanc * 0.0004) + (n.stab < 40 ? 0.02 : 0) + (n.growth < 0 ? 0.015 : 0);
      d *= tol * (exist ? 0.45 : 1); n.press = clamp(P + d - 0.012, 0, 1);
      if (n.press > 0.45) n.stab = Math.max(0, n.stab - (n.press - 0.45) * 6);
      // події
      if (n.press > 0.55 && G.rnd() < 0.25) G.say(`📢 ${n.name}: антивоєнні протести${regime === 'autocracy' ? ', хвиля арештів' : ''} (тиск ${(n.press * 100).toFixed(0)}%)`, G.isHuman(n.id) ? 'bad' : 'info', [n.id]);
      if (n.press > 0.75 && G.rnd() < 0.12) {
        if (regime === 'democracy' && n.parl) { n.parl.next = Math.min(n.parl.next, G.day + 60); n.parl.gov *= 0.8; G.say(`🏛 ${n.name}: уряд іде у відставку, призначено дострокові вибори`, 'big', [n.id]); }
        else if (G.rnd() < 0.35 && !G.isHuman(n.id)) { G.coup(n); n.press *= 0.5; }
        else G.say(`🕴 ${n.name}: розкол еліт — частина силовиків вимагає завершити війну`, 'big', [n.id]);
      }
    });
  };
});
