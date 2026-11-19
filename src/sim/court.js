// ГУЧНІ СУДИ: у країні, де перебуває персонаж, щомісяця зʼявляються резонансні справи. Персонаж бере справу
// як прокурор або адвокат (у будівлі суду в місті) — процес із трьох етапів: вступна промова, свідки, фінал.
// Тактика + навички «Право» та «Ораторство» + удача → вердикт: слава, популярність, гонорар. Держава-гравець отримує
// новини про вироки (стабільність ±), а може й «натиснути на суд» — тоді демократії ображаються.
LORA.sim.register('court', 99.988, function (G) {
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const S = () => G.v29s('court', () => ({ cases: [], hist: [], cur: null }));
  const CASES = [
    ['Міністр і 14 тендерів на золоті скріпки', 'корупція'], ['Олігарх проти голубів, що обсідають його яхту', 'цивільна'], ['Кіт, який украв сосиску з урядового банкету', 'дрібна крадіжка'],
    ['Шпигун у костюмі бабусі', 'шпигунство'], ['Депутат, що голосував за шістьох колег', 'кнопкодавство'], ['Блогер, що назвав генерала пончиком', 'наклеп'],
    ['Компанія, що продавала повітря в банках', 'шахрайство'], ['Мер, що побудував міст уздовж річки', 'розтрата'], ['Хакер, що змінив гімн на рингтон', 'кіберзлочин'],
    ['Пекар, що спік торт у формі парламенту — і зʼїв його', 'хуліганство'], ['Таксист, що возив туристів «найкоротшим шляхом» через три країни', 'шахрайство'], ['Бобер, який перегриз урядовий кабель', 'диверсія']
  ];
  const STAGES = [
    { q: 'Вступна промова. Як почнете?', o: [['Емоційна промова', 'orat', 1.2], ['Факти й цифри', 'law', 1.1], ['Жарт для присяжних', 'media', 0.9]] },
    { q: 'Допит свідків. Ваша тактика?', o: [['Викликати експерта', 'sci', 1.0], ['Перехресний допит', 'law', 1.2], ['Свідок-кіт (так, справді)', 'media', 0.8]] },
    { q: 'Фінальне слово. Що скажете?', o: [['Пристрасна фінальна промова', 'orat', 1.2], ['Несподіваний новий доказ', 'law', 1.1], ['Апеляція до совісті суду', 'diplo', 1.0]] }
  ];
  const nidOf = () => { const L = G.leader; return L && !L.mv ? G.ter[L.at].ctrl : -1; };
  function monthly() {
    const P = S(); P.cases = P.cases.filter(c => G.day - c.d < 90 && !c.done);
    const nid = nidOf(); if (nid < 0) return; if (P.cases.filter(c => c.nid === nid).length < 3 && G.rnd() < 0.7) { const [t, k] = pick(CASES); P.cases.push({ id: G.nextId++, t, k, nid, d: G.day, def: G.fakeName() }); }
    // вироки в державі гравця (без участі персонажа)
    if (G.player >= 0 && G.rnd() < 0.3) { const [t] = pick(CASES); const guilty = G.rnd() < 0.6; const n = N[G.player]; n.stab = clamp(n.stab + (guilty ? 0.5 : -0.3), 0, 100); G.say(`⚖ Резонансна справа «${t}»: ${guilty ? 'винний — суспільство задоволене' : 'виправдано — суспільство обурене, адвокати купують яхти'}`, 'info', [G.player]); }
  }
  G.courtCases = () => { const nid = nidOf(); return S().cases.filter(c => c.nid === nid && !c.done); };
  G.courtCan = () => { const L = G.leader; if (!L || L.role !== 'char') return 'Лише для персонажа'; if (S().cur) return 'Ви вже ведете справу'; if (!G.courtCases().length) return 'Зараз немає резонансних справ'; return ''; };
  G.courtTake = function (role) {
    const e = G.courtCan(); if (e) return { ok: false, err: e }; const c = G.courtCases()[0]; const P = S(); P.cur = { cid: c.id, t: c.t, role, st: 0, sc: 0, opp: 1.5 + G.rnd() * 1.5 }; c.done = 1;
    push(0); return { ok: true, msg: `ви ${role === 'pros' ? 'прокурор' : 'адвокат'} у справі «${c.t}». Суд починається` };
  };
  function push(st) { const P = S(), cu = P.cur; G.decisions.push({ id: G.nextId++, ev: 'court' + st, nid: G.leader.home, pers: true, ctx: { text: `⚖ «${cu.t}» (${cu.role === 'pros' ? 'ви — прокурор' : 'ви — адвокат'}), етап ${st + 1}/3. ${STAGES[st].q}` }, d: G.day }); }
  const EV = G.DEC_EV; if (EV) STAGES.forEach((Sg, st) => EV.push({ id: 'court' + st, adv: 'intern', ok: () => false, t: () => null, o: Sg.o.map(([lab, sk, w]) => [lab, () => {
    const P = S(), cu = P.cur, L = G.leader; if (!cu || !L) return 'справу закрито'; const v = (G.skill(L, sk) * 0.35 + G.skill(L, 'law') * 0.15 + G.rnd() * 1.6) * w; cu.sc += v; cu.st++;
    const note = v > 1.4 ? pick(['присяжні кивають', 'суддя навіть відклав телефон', 'зал аплодує (суддя стукає молотком)']) : v > 0.8 ? pick(['непогано, але опонент тримається', 'присяжні задумались']) : pick(['кіт-свідок заснув', 'суддя позіхнув', 'опонент посміхається']);
    if (cu.st < 3) { push(cu.st); return note; }
    const win = cu.sc > cu.opp * 1.6; P.cur = null; P.hist.unshift({ t: cu.t, role: cu.role, win, d: G.day }); P.hist.length = Math.min(P.hist.length, 20);
    if (win) { L.fame += 4; L.popu = L.popu || {}; L.popu[L.home] = clamp((L.popu[L.home] || 0) + 4, 0, 100); const fee = 0.0002 + G.skill(L, 'law') * 0.0002; L.money += fee; LORA.bus.emit('fx', { kind: 'court', title: '⚖ ПЕРЕМОГА В СУДІ', sub: cu.t });
      return `${note}. ВЕРДИКТ НА ВАШУ КОРИСТЬ! Слава +4, гонорар $${(fee * 1e6).toFixed(0)} тис.`; }
    L.fame += 1; return `${note}. Вердикт не на вашу користь. ${pick(['Але про вас написали всі газети', 'Апеляція? Може, наступного разу', 'Опонент купив яхту. Ви — морозиво'])}`;
  }]) }));
  G.courtHist = () => S().hist;
  G.h29.m.push(monthly);
});
