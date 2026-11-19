// ГРОМАДСЬКА ДУМКА ПО РЕГІОНАХ: настрій кожного регіону (0–100) залежить від стабільності держави, руйнувань, окупації,
// затоплень і місцевих рішень. Низька думка → протести (ВВП і стабільність падають). Місцеві герої зʼявляються самі —
// їх можна нагородити. Дії: інвестиції, мітинг, пропаганда, діалог із протестувальниками, розгін (жорстко).
LORA.sim.register('opinion', 99.982, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const S = () => G.v29s('op', () => ({ mod: {}, prot: {}, heroes: [], cd: {} }));
  const isH = id => G.isHuman ? G.isHuman(id) : id === G.player;
  G.regOp = function (i) {
    const t = ter[i], n = N[t.ctrl]; if (!n || !n.alive) return 50; const P = S();
    let v = n.stab * 0.75 + 14 + (P.mod[i] || 0) - t.dmg * 45 - (t.core !== t.ctrl ? 22 : 0) - (G.floodOf ? G.floodOf(i) * 30 : 0) + (T[i].cap ? 6 : 0) - (t.occ ? 10 : 0);
    if (n.agg && n.growth != null) v += clamp(n.growth * 300, -8, 8);
    return clamp(v, 0, 100);
  };
  G.natOp = nid => { let s = 0, w = 0; ter.forEach((t, i) => { if (t.ctrl === nid) { const k = Math.max(0.01, t.pop); s += G.regOp(i) * k; w += k; } }); return w ? s / w : 50; };
  G.protestIn = i => { const p = S().prot[i]; return p && p.until > G.day ? p : null; };
  const HK = [['волонтерка', 'зібрала 40 тонн допомоги на старому мікроавтобусі'], ['фермер', 'виростив гарбуз на 600 кг і віддав його школі'], ['блогер', 'зняв ролик про місцеві дороги — їх уперше за 20 років відремонтували'],
    ['вчителька', 'тридцять років навчає дітей і досі памʼятає всіх на імʼя'], ['ветеран', 'відкрив безкоштовну майстерню для протезів'], ['айтішник', 'написав застосунок, який рахує ями на дорогах'],
    ['бабуся з пиріжками', 'нагодувала весь блокпост і половину міністерства'], ['пожежник', 'виніс із вогню 12 людей і кота'], ['лікарка', 'приймає пацієнтів у селі, куди не їздить навіть автобус'],
    ['школяр', 'виграв міжнародну олімпіаду з фізики, розвʼязавши задачу на серветці'], ['кіт', 'зловив щура, який погриз кабель обласної ради'], ['водій тролейбуса', 'довіз пасажирів додому під час блекауту, штовхаючи тролейбус']];
  function hero(nid) { const reg = ter.filter(t => t.ctrl === nid && t.core === nid); if (!reg.length) return; const t = pick(reg), k = pick(HK); const name = k[0] === 'кіт' ? pick(['Мурчик', 'Барсик', 'Пушок', 'Рудий']) : G.fakeName();
    const h = { id: G.nextId++, n: nid, reg: t.i, name, kind: k[0], deed: k[1], d: G.day }; S().heroes.push(h); if (isH(nid)) G.say(`🦸 Місцевий герой: ${k[0]} ${name} (${T[t.i].n}) — ${k[1]}`, 'good', [nid]); }
  function monthly() {
    const P = S(); for (const k in P.mod) { P.mod[k] *= 0.9; if (Math.abs(P.mod[k]) < 0.3) delete P.mod[k]; }
    P.heroes = P.heroes.filter(h => G.day - h.d < 90 && N[h.n].alive);
    N.forEach(n => { if (!n.alive || !n.agg) return; const human = isH(n.id);
      ter.forEach((t, i) => { if (t.ctrl !== n.id) return; const v = G.regOp(i), pr = P.prot[i];
        if (pr && pr.until > G.day) { t.gdp *= 1 - 0.006 * pr.sz; n.stab = clamp(n.stab - 0.15 * pr.sz, 0, 100); if (v > 45 || G.rnd() < 0.08) { delete P.prot[i]; if (human) G.say(`🕊 ${T[i].n}: протести вщухли. Люди розійшлися, лишилися лише голуби`, 'info', [n.id]); } }
        else if (v < 28 && G.rnd() < (human ? 0.12 : 0.04)) { const sz = clamp((30 - v) / 10, 0.5, 3); P.prot[i] = { sz: +sz.toFixed(1), until: G.day + 60 + Math.floor(G.rnd() * 90), d: G.day, why: pick(['тарифи', 'дороги', 'корупцію', 'закриття заводу', 'ціни на гречку', 'перенесення свята', 'нового пам’ятника', 'відключення світла', 'податок на котів']) };
          if (human) { G.say(`📢 ${T[i].n}: протести проти «${P.prot[i].why}» — вийшло ${(sz * 10).toFixed(0)} тис. людей. Думка регіону ${v.toFixed(0)}%`, 'bad', [n.id]); G.fx29('protest', { where: T[i].n }); } } });
      if (human && G.rnd() < 0.3) hero(n.id); });
  }
  // дії гравця в регіоні
  G.OP_ACT = {
    invest:   { n: 'Інвестувати в регіон', ic: '🏗', c: i => 0.05 + ter[i].gdp * 0.004, v: 12, d: 'дороги, лікарні, школи: думка +12' },
    rally:    { n: 'Провести мітинг', ic: '📣', c: () => 0.02, v: 6, d: 'думка +6; якщо регіон дуже незадоволений — може освистати' },
    media:    { n: 'Місцева пропаганда', ic: '📺', c: () => 0.015, v: 4, d: 'думка +4, але частина людей бачить наскрізь' },
    talk:     { n: 'Діалог із протестувальниками', ic: '🤝', c: () => 0.01, v: 5, d: 'шанс 60% завершити протест мирно', prot: 1 },
    police:   { n: 'Розігнати протест', ic: '🚓', c: () => 0.005, v: -12, d: 'протест завершено, але думка −12, стабільність −1, сусіди засуджують', prot: 1 }
  };
  G.opAct = function (nid, i, k) {
    const A = G.OP_ACT[k], n = N[nid], t = ter[i], P = S(); if (!A || !t || t.ctrl !== nid) return { ok: false, err: 'Лише у власних регіонах' };
    if (A.prot && !G.protestIn(i)) return { ok: false, err: 'Тут немає протестів' }; const ck = i + k; if ((P.cd[ck] || 0) > G.day) return { ok: false, err: `Можна знову через ${P.cd[ck] - G.day} дн.` };
    const c = +A.c(i).toFixed(3); if (n.cash < c) return { ok: false, err: 'Бракує коштів' }; n.cash -= c; P.cd[ck] = G.day + (k === 'invest' ? 90 : 30);
    let v = A.v, msg = '';
    if (k === 'rally' && G.regOp(i) < 30 && G.rnd() < 0.4) { v = -3; msg = 'натовп освистав промовця й закидав його… квітами? Ні, помідорами'; }
    else if (k === 'media' && G.rnd() < 0.25) { v = -2; msg = 'місцеві впізнали постановку: актор грав і «простого пенсіонера», і «щасливого фермера»'; }
    else if (k === 'talk') { if (G.rnd() < 0.6) { delete P.prot[i]; msg = 'домовилися! Протестувальники пішли пити чай'; } else { v = 1; msg = 'поговорили, але не домовились: протест триває'; } }
    else if (k === 'police') { delete P.prot[i]; n.stab = clamp(n.stab - 1, 0, 100); N.forEach(z => { if (z.alive && z.id !== nid && z.parl && z.parl.regime === 'democracy') G.rel[z.id][nid] = clamp(G.rel[z.id][nid] - 2, -100, 100); }); msg = 'площу очищено. Відео вже в усіх соцмережах'; }
    else msg = pick(['люди задоволені', 'місцева газета написала «нарешті!»', 'навіть найбільший скептик сказав «ну, непогано»', 'бабусі на лавці схвалили']);
    P.mod[i] = clamp((P.mod[i] || 0) + v, -40, 40); if (isH(nid)) G.fx29(k === 'rally' ? 'speech' : k === 'police' ? 'police' : k === 'invest' ? 'build' : 'handshake', { where: T[i].n });
    return { ok: true, msg: `${A.n}: ${msg} (думка ${v >= 0 ? '+' : ''}${v})` };
  };
  G.heroAward = function (nid, hid, k) {
    const P = S(), h = P.heroes.find(x => x.id === hid && x.n === nid); if (!h) return { ok: false, err: 'Героя не знайдено' }; const n = N[nid];
    P.heroes = P.heroes.filter(x => x !== h);
    if (k === 'medal') { n.cash -= 0.001; P.mod[h.reg] = clamp((P.mod[h.reg] || 0) + 10, -40, 40); n.stab = clamp(n.stab + 0.5, 0, 100); return { ok: true, msg: `${h.name} отримує медаль. Регіон пишається: думка +10` }; }
    if (k === 'adv') { P.mod[h.reg] = clamp((P.mod[h.reg] || 0) + 6, -40, 40); n.stab = clamp(n.stab + 1, 0, 100); return { ok: true, msg: h.kind === 'кіт' ? `${h.name} — радник з питань гризунів. Перше рішення: скасувати понеділки` : `${h.name} — тепер радник. Перший день: питає, де тут кавоварка` }; }
    return { ok: true, msg: `${h.name} подякували листом. Лист загубився` };
  };
  G.act.opAct = (i, k) => G.opAct(G.player, i, k); G.act.heroAward = (hid, k) => G.heroAward(G.player, hid, k);
  G.h29.m.push(monthly);
});
