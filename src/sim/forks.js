// РОЗВИЛКИ ІСТОРІЇ: великі рішення раз на гру з довгими наслідками (роки).
// Додаються до рішень-дилем (decisions.js) з позначкою big — з'являються частіше й лише раз.
LORA.sim.register('forks', 99.5, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const EV = G.DEC_EV; if (!EV) return;
  const A3 = a => G.nIdx[a]; const rich = n => N.filter(m => m.alive && m.id !== n.id && m.agg && m.agg.gdp > 2500 && G.rel[m.id][n.id] > 30).sort((a, b) => b.agg.gdp - a.agg.gdp);
  const mod = (n, o) => { n.mods = n.mods || []; n.mods.push(o); };
  const rel = (a, b, d) => { if (a == null || b == null || a === b) return; G.rel[a][b] = G.rel[b][a] = clamp(G.rel[a][b] + d, -100, 100); };
  const yrs = () => G.day / 365;
  const F = [
    { id: 'lendlease', adv: 'dipl', big: 1, ok: n => G.enemiesOf(n.id).length && rich(n).length, t: n => { const r = rich(n)[0]; return { x: r.id, text: `${r.name} пропонує програму ленд-лізу: зброя й техніка зараз, оплата — після війни. Це прив'яже вас до союзника на роки.` }; },
      o: [['Прийняти ленд-ліз', (n, c) => { n.milStock += n.agg.gdp * 0.08; n.debt += n.agg.gdp * 0.05; rel(n.id, c.x, 15); return 'великий запас озброєнь, борг +5% ВВП, відносини +15'; }],
          ['Лише кредит на власне виробництво', n => { n.debt += n.agg.gdp * 0.03; mod(n, { growth: 0.004, until: G.day + 1095 }); n.q = Math.min(1.6, n.q + 0.03); return 'борг +3% ВВП, власна оборонка: зростання +0.4% на 3 роки'; }],
          ['Відмовитись — повна незалежність', n => { n.stab += 4; return 'стабільність +4'; }]] },
    { id: 'new_yalta', adv: 'dipl', big: 1, ok: n => G.enemiesOf(n.id).length && yrs() > 1.5 && ter.some(t => t.owner === n.id && t.ctrl !== n.id), t: n => { const e = G.enemiesOf(n.id)[0]; return { x: e, text: `Великі держави пропонують «Нову Ялту»: заморозити війну з ${N[e].name} по лінії фронту. Окуповані регіони лишаються окупованими, а санкції частково знімуть.` }; },
      o: [['Погодитися на заморозку', (n, c) => { const held = ter.filter(t => t.owner === n.id && t.ctrl === c.x); G.makePeace(n.id, c.x, 'white'); held.forEach(t => { t.ctrl = c.x; }); G.refreshNation(n.id); G.refreshNation(c.x); n.stab -= 8; n.warExh = 0; return 'війна зупинена, але стабільність −8: суспільство вважає це зрадою'; }],
          ['Відмовитись і боротися далі', n => { n.stab += 3; n.aidIn = (n.aidIn || 0) + 10; return 'стабільність +3, союзники збільшують допомогу'; }]] },
    { id: 'nuke_choice', adv: 'mil', big: 1, ok: n => !n.nuke && G.enemiesOf(n.id).some(e => N[e].nuke) && G.has(n, 'tactical_bm'), t: n => ({ text: 'Генштаб пропонує таємну ядерну програму як гарантію виживання. Західні партнери застерігають: це зруйнує довіру.' }),
      o: [['Розпочати програму', n => { n.res.done.nuke_enrich = G.day; N.forEach(m => { if (m.alive && ['USA', 'GBR', 'FRA', 'DEU'].includes(m.a3)) rel(n.id, m.id, -20); }); return 'відкрито «Військове збагачення урану», відносини із Заходом −20'; }],
          ['Вимагати гарантій безпеки від союзників', n => { const u = A3('USA'); rel(n.id, u, 8); n.aidIn = (n.aidIn || 0) + 5; return 'відносини зі США +8, допомога збільшилася'; }]] },
    { id: 'capital_move', adv: 'intern', big: 1, ok: n => n.home >= 0 && G.enemiesOf(n.id).length && G.armies.some(a => G.atWar(a.n, n.id) && G.T[a.t].nb.includes(n.home)), t: () => ({ text: 'Ворог біля столиці. Уряд пропонує тимчасово перенести столицю вглиб країни.' }),
      o: [['Перенести столицю', n => { const far = ter.filter(t => t.owner === n.id && t.ctrl === n.id && !G.T[t.i].nb.some(j => G.atWar(ter[j].ctrl, n.id))).sort((a, b) => b.gdp - a.gdp)[0]; if (far) n.home = far.i; n.stab -= 3; return 'столицю перенесено, стабільність −3'; }],
          ['Президент лишається в столиці', n => { n.stab += 6; G.armies.filter(a => a.n === n.id && a.t === n.home).forEach(a => a.org = Math.min(1, a.org + 0.2)); return 'стабільність +6, оборонці столиці надихнулися'; }]] },
    { id: 'ai_age', adv: 'sci', big: 1, ok: n => yrs() > 2.5, t: () => ({ text: 'Настає епоха штучного інтелекту: роботизація може здійняти економіку, але мільйони втратять роботу.' }),
      o: [['Повна автоматизація', n => { mod(n, { growth: 0.012, until: G.day + 1825 }); n.stab -= 6; return 'зростання +1.2% на 5 років, стабільність −6'; }],
          ['Обережне регулювання', n => { mod(n, { growth: 0.005, until: G.day + 1825 }); return 'зростання +0.5% на 5 років'; }],
          ['Заборонити ШІ в ключових галузях', n => { n.stab += 3; mod(n, { growth: -0.003, until: G.day + 1095 }); return 'стабільність +3, зростання −0.3% на 3 роки'; }]] },
    { id: 'green_deal', adv: 'econ', big: 1, ok: n => yrs() > 1.5 && n.agg.gdp > 200, t: () => ({ text: 'Кліматичний саміт вимагає швидкої відмови від вугілля й нафти. Хто першим перейде на зелену енергетику — отримає інвестиції.' }),
      o: [['Зелений перехід', n => { n.cash -= n.agg.gdp * 0.01; mod(n, { growth: 0.004, until: G.day + 2555 }); N.forEach(m => { if (m.alive && ['DEU', 'FRA', 'NLD', 'SWE', 'DNK'].includes(m.a3)) rel(n.id, m.id, 6); }); return 'бюджет −1% ВВП, зростання +0.4% на 7 років, ЄС задоволений'; }],
          ['Залишитись на викопному паливі', n => { n.cash += n.agg.gdp * 0.004; return 'бюджет +0.4% ВВП'; }]] },
    { id: 'east_west', adv: 'dipl', big: 1, ok: n => !['USA', 'CHN', 'RUS'].includes(n.a3) && yrs() > 1, t: () => ({ text: 'США й Китай змушують обирати: великий інфраструктурний пакет від Пекіна чи технологічний альянс зі Заходом.' }),
      o: [['Китайські інвестиції', n => { rel(n.id, A3('CHN'), 20); rel(n.id, A3('USA'), -15); n.cash += n.agg.gdp * 0.02; n.debt += n.agg.gdp * 0.02; return 'бюджет +2% ВВП (у борг), Китай +20, США −15'; }],
          ['Технологічний альянс із Заходом', n => { rel(n.id, A3('USA'), 15); rel(n.id, A3('CHN'), -15); mod(n, { growth: 0.003, until: G.day + 1825 }); return 'США +15, Китай −15, зростання +0.3% на 5 років'; }],
          ['Нейтралітет', n => { n.stab += 2; return 'стабільність +2'; }]] },
    { id: 'moon_race', adv: 'sci', big: 1, ok: n => n.agg.gdp > 2000 && yrs() > 2, t: () => ({ text: 'Почалася нова місячна гонка. Національна програма коштуватиме дорого, але підніме престиж.' }),
      o: [['Летимо на Місяць', n => { n.cash -= 5; n.stab += 4; if (G.startProgram) G.startProgram(n.id, 'moon'); return '−$5 млрд, стабільність +4, програму «Місяць» запущено'; }],
          ['Гроші — на економіку', n => { mod(n, { growth: 0.002, until: G.day + 1095 }); return 'зростання +0.2% на 3 роки'; }]] },
    { id: 'pandemic2', adv: 'intern', big: 1, ok: n => yrs() > 3, t: () => ({ text: 'Новий небезпечний вірус. Науковці радять жорсткий карантин, бізнес благає не закривати економіку.' }),
      o: [['Жорсткий карантин', n => { mod(n, { growth: -0.02, until: G.day + 180 }); n.stab -= 2; return 'зростання −2% на пів року, епідемію зупинено'; }],
          ['М’які обмеження', n => { mod(n, { growth: -0.006, until: G.day + 365 }); n.stab -= 4; ter.forEach(t => { if (t.owner === n.id) t.pop *= 0.997; }); return 'зростання −0.6% на рік, стабільність −4, втрати населення'; }]] },
    { id: 'referendum_eu', adv: 'dipl', big: 1, ok: n => G.blocsOf && !G.blocsOf(n.id).some(b => /ЄС|EU/.test(b.n)) && ['UKR', 'MDA', 'GEO', 'SRB', 'ALB', 'MNE', 'MKD', 'BIH', 'TUR', 'NOR', 'ISL', 'GBR'].includes(n.a3), t: () => ({ text: 'Опозиція й громадськість вимагають референдуму щодо курсу на ЄС. Його результат визначить політику на роки.' }),
      o: [['Провести референдум', n => { const yes = n.stab / 100 + 0.2 > G.rnd(); N.forEach(m => { if (m.alive && G.blocsOf(m.id).some(b => /ЄС|EU/.test(b.n))) rel(n.id, m.id, yes ? 12 : -5); }); n.stab += yes ? 4 : -4; return yes ? 'народ сказав «так»: ЄС +12, стабільність +4' : 'народ сказав «ні»: ЄС −5, стабільність −4'; }],
          ['Відкласти', n => { n.stab -= 1; return 'стабільність −1'; }]] }
  ];
  F.forEach(e => EV.push(e));
});
