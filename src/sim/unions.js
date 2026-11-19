// ПРОФСПІЛКИ Й СТРАЙКИ: у держави гравця 8 галузевих профспілок (шахтарі, айтішники, таксисти, лікарі, вчителі, фермери,
// далекобійники, пілоти). Задоволеність падає від інфляції, війни, нестабільності й боргів; нижче 30% — ризик страйку.
// Страйк бʼє по ВВП і стабільності, у кожної галузі — свій ефект. Рішення: підняти зарплати, переговори, ігнорувати, роботи.
LORA.sim.register('unions', 99.989, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const isH = id => G.isHuman ? G.isHuman(id) : id === G.player;
  G.UNIONS = {
    miners: { n: 'Шахтарі', ic: '⛏', eff: 'видобуток вугілля й металів падає', d: 'приходять із касками й стукають ними по бруківці' },
    it: { n: 'Айтішники', ic: '💻', eff: 'інтернет-послуги й держзастосунки «лежать»', d: 'страйкують у зумі з вимкненими камерами' },
    taxi: { n: 'Таксисти', ic: '🚕', eff: 'місто стоїть у заторах', d: 'сигналять так, що чути в сусідній державі' },
    doctors: { n: 'Лікарі', ic: '🩺', eff: 'стабільність падає швидше', d: 'приймають лише пацієнтів із підписаною петицією' },
    teachers: { n: 'Вчителі', ic: '📚', eff: 'наука повільніша', d: 'поставили уряду двійку за поведінку' },
    farmers: { n: 'Фермери', ic: '🚜', eff: 'зерно й їжа дорожчають', d: 'блокують дороги тракторами й роздають молоко' },
    truckers: { n: 'Далекобійники', ic: '🚛', eff: 'логістика гальмує', d: 'вишикували фури колоною на 40 км' },
    pilots: { n: 'Пілоти', ic: '✈', eff: 'туризм і бізнес-поїздки зупинені', d: 'літають лише на симуляторах' }
  };
  const S = () => G.v29s('uni', () => ({}));
  G.uniState = nid => { const P = S(); if (!P[nid]) { P[nid] = { sat: {}, strike: {}, cd: 0 }; for (const k in G.UNIONS) P[nid].sat[k] = 55 + Math.floor(G.rnd() * 25); } return P[nid]; };
  function monthly() {
    N.forEach(n => { if (!n.alive || !n.agg || !isH(n.id)) return; const st = G.uniState(n.id); const war = G.enemiesOf(n.id).length > 0;
      for (const k in G.UNIONS) { let d = (n.stab - 55) * 0.04 - (war ? 0.8 : 0) - (n.debt > 1 ? 0.6 : 0) + (n.growth || 0) * 40 + (G.rnd() - 0.5) * 3; st.sat[k] = clamp(st.sat[k] + d, 0, 100);
        const s = st.strike[k]; if (s && s.until > G.day) { n.agg && ter.forEach(t => { if (t.ctrl === n.id) t.gdp *= 0.9985; }); n.stab = clamp(n.stab - 0.25, 0, 100); if (k === 'doctors') n.stab = clamp(n.stab - 0.25, 0, 100); if (k === 'teachers') n.techB = Math.max(0, (n.techB || 0) - 0.002); }
        else if (s) { delete st.strike[k]; G.say(`🤝 ${G.UNIONS[k].ic} ${G.UNIONS[k].n} завершили страйк. Повертаються до роботи з піснями`, 'good', [n.id]); }
        else if (st.sat[k] < 30 && G.rnd() < 0.32) { st.strike[k] = { until: G.day + 45 + Math.floor(G.rnd() * 45) }; const U = G.UNIONS[k];
          G.say(`🪧 СТРАЙК: ${U.ic} ${U.n} ${U.d}. Наслідки: ${U.eff}`, 'bad', [n.id]); G.decisions.push({ id: G.nextId++, ev: 'strike', nid: n.id, ctx: { text: `🪧 ${U.n} оголосили страйк (задоволеність ${st.sat[k].toFixed(0)}%). ${U.d}. Що робимо?`, k }, d: G.day }); G.fx29 && G.fx29('protest', { title: '🪧 ' + U.n.toUpperCase() + ': СТРАЙК' }); } } });
  }
  const EV = G.DEC_EV; if (EV) EV.push({ id: 'strike', adv: 'econ', ok: () => false, t: () => null, o: [
    ['Підняти зарплати', (n, c) => { const st = G.uniState(n.id); const cost = (n.agg ? n.agg.gdp : 100) * 0.002; n.cash -= cost; st.sat[c.k] = clamp(st.sat[c.k] + 35, 0, 100); delete st.strike[c.k]; for (const k in st.sat) if (k !== c.k) st.sat[k] = clamp(st.sat[k] - 3, 0, 100); return `зарплати підняли ($${cost.toFixed(2)} млрд). Інші профспілки заздрять`; }],
    ['Переговори', (n, c) => { const st = G.uniState(n.id); if (G.rnd() < 0.55) { st.sat[c.k] = clamp(st.sat[c.k] + 18, 0, 100); delete st.strike[c.k]; return 'домовилися: печиво на нарадах і +5% до премії'; } return 'переговори зірвано — профспілка образилася на каву'; }],
    ['Ігнорувати', (n, c) => { const st = G.uniState(n.id); st.sat[c.k] = clamp(st.sat[c.k] - 10, 0, 100); n.stab = clamp(n.stab - 2, 0, 100); return 'страйк триває, а журналісти питають «а де уряд?»'; }],
    ['Замінити роботами', (n, c) => { const st = G.uniState(n.id); delete st.strike[c.k]; for (const k in st.sat) st.sat[k] = clamp(st.sat[k] - 8, 0, 100); return pick(['роботи вийшли на роботу… і через тиждень створили власну профспілку', 'робот-таксист повіз пасажира на Марс. Майже доїхав']); }]] });
  G.unionMeet = function () { const nid = G.player; if (nid < 0) return { ok: true, msg: 'профспілковці розповіли про свої проблеми. Ви кивали дуже співчутливо' }; const st = G.uniState(nid); if (st.cd > G.day) return { ok: true, msg: 'профспілки кажуть: «Ви ж щойно були. Де результат?»' };
    st.cd = G.day + 30; const k = Object.keys(st.sat).sort((a, b) => st.sat[a] - st.sat[b])[0]; st.sat[k] = clamp(st.sat[k] + 10, 0, 100); return { ok: true, msg: `найзлішою була профспілка «${G.UNIONS[k].n}» — після зустрічі задоволеність +10` }; };
  G.uniTalk = function (nid, k) { const st = G.uniState(nid), n = N[nid]; const c = (n.agg ? n.agg.gdp : 100) * 0.0003; if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; if ((st.t && st.t[k] || 0) > G.day) return { ok: false, err: 'Нещодавно вже зустрічалися' };
    st.t = st.t || {}; st.t[k] = G.day + 30; n.cash -= c; st.sat[k] = clamp(st.sat[k] + 8, 0, 100); return { ok: true, msg: `${G.UNIONS[k].n}: зустріч пройшла добре, задоволеність +8` }; };
  G.act.uniTalk = k => G.uniTalk(G.player, k);
  G.h29.m.push(monthly);
});
