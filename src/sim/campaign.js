// СЮЖЕТНА КАМПАНІЯ «Володар Атласу»: 11 розділів від простої людини до лідера світу. Перший розділ — навчання
// інтерфейсу (підказки-стрілки в UI). Кожен розділ: сюжетна сцена → цілі з прогресом → нагорода → наступний розділ.
LORA.sim.register('campaign', 99.99, function (G) {
  const { N, ter } = G; const L0 = () => G.leader; const home = () => (G.leader ? G.leader.home : -1);
  const sk = L => Math.max(0, ...Object.values(L.sk || {}));
  const techsDone = n => n && n.res ? Object.keys(n.res.done).length : 0;
  const lv = nid => ter.reduce((s, t) => s + (t.owner === nid ? Object.values(t.bld).reduce((q, v) => q + v, 0) : 0), 0);
  G.CAMP = [
    { t: 'Розділ 1. Перший крок', who: 'Наставник', story: 'Вітаю у світі L.O.R.A.! Ти — звичайна людина з великими амбіціями. Колись тебе назвуть Володарем Атласу, але спершу навчимося керувати. Я покажу, що де.',
      goals: [{ n: 'Пройти навчання інтерфейсу', ok: () => G.camp.tut }], rw: { money: 0.01 } },
    { t: 'Розділ 2. Хліб насущний', who: 'Наставник', story: 'Світом правлять гроші й уміння. Знайди роботу, підтягни навички й відклади перші мільйони. Вкладка «Карʼєра» — робота, «Навчання» — курси.',
      goals: [{ n: 'Влаштуватися на роботу', ok: L => !!L.job }, { n: 'Підняти будь-яку навичку до 1', ok: L => sk(L) >= 1 }, { n: 'Заробити $20 млн', ok: L => L.money - (G.camp.m0 || 0) >= 0.02, p: L => (L.money - (G.camp.m0 || 0)) / 0.02 }], rw: { money: 0.01, fame: 2 } },
    { t: 'Розділ 3. Люди вирішують усе', who: 'Наставник', story: 'Без звʼязків ти ніхто. Познайомся з елітами, зʼїзди за кордон і найми першого помічника — секретар уже чекає на співбесіду.',
      goals: [{ n: 'Звʼязки у своїй країні ≥ 30', ok: L => (L.cont[L.home] || 0) >= 30, p: L => (L.cont[L.home] || 0) / 30 }, { n: 'Побувати за кордоном', ok: L => G.camp.abroad }, { n: 'Найняти помічника', ok: L => Object.values(L.staff || {}).some(s => s.hired) }], rw: { money: 0.02 } },
    { t: 'Розділ 4. Власна справа', who: 'Інвесторка Мирослава', story: 'Я бачу в тобі потенціал. Засновуй компанію — і доведи, що вмієш будувати, а не тільки говорити. Перші заводи — найважчі.',
      goals: [{ n: 'Заснувати компанію', ok: () => G.pc >= 0 }, { n: 'Мати 3 рівні активів компанії', ok: () => G.pc >= 0 && G.myCo() && G.myCo().assets.reduce((s, a) => s + a.lvl, 0) >= 3, p: () => G.pc >= 0 && G.myCo() ? G.myCo().assets.reduce((s, a) => s + a.lvl, 0) / 3 : 0 }], rw: { money: 0.05 } },
    { t: 'Розділ 5. Серце', who: 'Наставник', story: 'Успіх без близьких — порожній. Вкладка «Родина»: знайомства, побачення… А може, й весілля? Династії починаються з кохання.',
      goals: [{ n: 'Почати стосунки', ok: L => L.fam && (L.fam.date || L.fam.spouse) }, { n: 'Одружитися', ok: L => L.fam && L.fam.spouse && L.fam.spouse.wed }], rw: { fame: 3 } },
    { t: 'Розділ 6. Голос народу', who: 'Політтехнолог Остап', story: 'Бізнес — це добре, але закони пишуть інші. Створюй партію і завойовуй популярність. Виступи, благодійність, медіа — усе йде в хід.',
      goals: [{ n: 'Заснувати партію', ok: L => !!L.party }, { n: 'Популярність удома ≥ 25', ok: L => (L.popu[L.home] || 0) >= 25, p: L => (L.popu[L.home] || 0) / 25 }], rw: { money: 0.02 } },
    { t: 'Розділ 7. Мандат', who: 'Політтехнолог Остап', story: 'Тепер — до парламенту. Подай свою кандидатуру в депутати й переконай виборців. Теледебати — твій шанс.',
      goals: [{ n: 'Стати депутатом', ok: L => L.mp === L.home || L.role === 'president' }], rw: { fame: 4 } },
    { t: 'Розділ 8. Перша особа', who: 'Політтехнолог Остап', story: 'Країна чекає на лідера. Висувайся на виборах глави держави. Популярність, звʼязки й гроші — твої головні союзники.',
      goals: [{ n: 'Стати главою держави', ok: L => L.role === 'president' }], rw: { fame: 6 } },
    { t: 'Розділ 9. Державник', who: 'Головнокомандувач', story: 'Вітаю, пане/пані президенте. Тепер ти відповідаєш за мільйони. Науку, будівництво й стабільність — у твої руки. Міністри допоможуть.',
      goals: [{ n: 'Дослідити 3 нові технології', ok: () => G.player >= 0 && techsDone(N[G.player]) - (G.camp.t0 || 0) >= 3, p: () => G.player >= 0 ? (techsDone(N[G.player]) - (G.camp.t0 || 0)) / 3 : 0 }, { n: 'Збудувати 5 рівнів будівель', ok: () => G.player >= 0 && lv(G.player) - (G.camp.b0 || 0) >= 5, p: () => G.player >= 0 ? (lv(G.player) - (G.camp.b0 || 0)) / 5 : 0 }, { n: 'Стабільність ≥ 55', ok: () => G.player >= 0 && N[G.player].stab >= 55 }], rw: { cash: 2 } },
    { t: 'Розділ 10. Світова арена', who: 'Генсек ООН', story: 'Світ більший за твою країну. В ООН 2.0 вирішують долю планети: запропонуй резолюцію, знайди союзників — і проведи її.',
      goals: [{ n: 'Мати союзника або угоду', ok: () => G.player >= 0 && N.some(x => x.alive && x.id !== G.player && (G.allied(G.player, x.id) || (G.secrets || []).some(s => !s.leak && (s.a === G.player || s.b === G.player) && (s.a === x.id || s.b === x.id)))) }, { n: 'Провести резолюцію в ООН', ok: () => G.camp.unWin }], rw: { cash: 3 } },
    { t: 'Фінал. Володар Атласу', who: 'Наставник', story: 'Останній крок: стань тим, з ким рахується вся планета. Закріпися на Місяці або Марсі, увійди до топ-10 економік світу — і атлас стане твоїм.',
      goals: [{ n: 'Колонія на Місяці чи Марсі', ok: () => G.colony && ['moon', 'mars'].some(b => G.colony[b].zones.some(z => z.owner === G.player)) }, { n: 'Топ-10 економік світу', ok: () => G.player >= 0 && N.filter(x => x.alive && x.agg).sort((a, b) => b.agg.gdp - a.agg.gdp).slice(0, 10).some(x => x.id === G.player) }], rw: { fame: 20 } }
  ];
  G.campStart = function () { G.camp = { ch: 0, d: G.day, m0: G.leader && G.leader.money || 0, tut: false, abroad: false, unWin: false, done: [], t0: 0, b0: 0 }; LORA.bus.emit('camp', { ch: 0, start: true }); };
  G.act.campTut = () => { if (G.camp) G.camp.tut = true; return { ok: true }; };
  G.campGoals = function () { const C = G.camp; if (!C || C.ch >= G.CAMP.length) return []; const L = L0(); const ch = G.CAMP[C.ch]; return ch.goals.map(g => { let ok = false, p = 0; try { ok = !!g.ok(L); p = ok ? 1 : g.p ? Math.max(0, Math.min(1, g.p(L))) : 0; } catch (e) { } return { n: g.n, ok, p }; }); };
  G.campDaily = function () {
    const C = G.camp; if (!C || C.ch >= G.CAMP.length) return; const L = L0(); if (!L) return;
    if (L.at != null && ter[L.at] && ter[L.at].ctrl !== L.home) C.abroad = true;
    if (G.day % 3) return; const gs = G.campGoals(); if (!gs.length || !gs.every(g => g.ok)) return;
    const ch = G.CAMP[C.ch], rw = ch.rw || {}; if (rw.money && L.money != null) L.money += rw.money; if (rw.fame) L.fame = Math.min(100, (L.fame || 0) + rw.fame); if (rw.cash && G.player >= 0) N[G.player].cash += rw.cash;
    C.done.push(C.ch); C.ch++; C.m0 = L.money || 0; G.say(`📖 Кампанія: «${ch.t}» — виконано!`, 'big', [home()]);
    if (C.ch < G.CAMP.length && C.ch === 8 && G.player >= 0) { C.t0 = techsDone(N[G.player]); C.b0 = lv(G.player); }
    LORA.bus.emit('camp', { ch: C.ch, fin: C.ch >= G.CAMP.length });
  };
});
