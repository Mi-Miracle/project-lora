// МІНІСТРИ: кожна галузь держави гравця має міністра (компетентність, лояльність, риса). Міністр може керувати галуззю
// сам (автокерування ШІ), має власні дії й наради. Низька лояльність — ризик крадіжок і скандалів (часто кумедних).
LORA.sim.register('ministers', 99.7, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const FN = ['Олександр', 'Ірина', 'Богдан', 'Оксана', 'Тарас', 'Наталія', 'Дмитро', 'Юлія', 'Андрій', 'Олена', 'Сергій', 'Марія', 'Віктор', 'Леся', 'Роман', 'Христина', 'Остап', 'Галина'];
  const LN = ['Коваленко', 'Бондар', 'Ткаченко', 'Кравчук', 'Мельник', 'Шевчук', 'Поліщук', 'Гнатюк', 'Лисенко', 'Савчук', 'Руденко', 'Марченко', 'Захарченко', 'Дорошенко', 'Яременко', 'Кушнір', 'Остапчук', 'Литвиненко'];
  G.MIN = {
    state: { n: 'Премʼєр-міністр', ic: '🏛', area: 'бюджет, податки, стабільність' },
    econ:  { n: 'Міністр економіки', ic: '📦', area: 'ринок, торгівля, контракти' },
    logi:  { n: 'Міністр інфраструктури', ic: '🚢', area: 'маршрути, порти, постачання' },
    army:  { n: 'Міністр оборони', ic: '🎖', area: 'армії, удари, закупівлі' },
    dipl:  { n: 'Міністр закордонних справ', ic: '🌐', area: 'відносини, угоди, союзи' },
    build: { n: 'Міністр розвитку громад', ic: '🏗', area: 'будівництво, житло, регіони' },
    tech:  { n: 'Міністр освіти й науки', ic: '🔬', area: 'дослідження, університети' },
    intel: { n: 'Голова розвідки', ic: '🛰', area: 'агенти, супутники, контррозвідка' }
  };
  const TRAITS = { honest: ['Чесний', 'лояльність падає повільніше, не краде'], tech: ['Технократ', 'ефекти дій +25%'], pop: ['Популіст', 'стабільність від дій +, бюджет −'], hawk: ['Яструб', 'армія й розвідка сильніші'], lazy: ['Лінивий', 'ефекти −25%, але дешевий'], greedy: ['Жадібний', 'краде частіше'], star: ['Медійний', 'кожна дія — новина, популярність +'] };
  const newMin = (n, k, seed) => { const fem = G.rnd() < 0.45; let f = pick(FN); return { k, name: f + ' ' + pick(LN), ava: (seed || '') + f + G.rnd(), fem, comp: Math.round(35 + G.rnd() * 50), loyal: Math.round(50 + G.rnd() * 40), trait: pick(Object.keys(TRAITS)), auto: false, cd: {}, since: G.day }; };
  G.minOf = function (nid, k) { const n = N[nid]; if (!n) return null; n.min = n.min || {}; if (!n.min[k]) n.min[k] = newMin(n, k, n.a3 + k); return n.min[k]; };
  const eff = m => (0.6 + m.comp / 100 * 0.8) * (m.trait === 'tech' ? 1.25 : m.trait === 'lazy' ? 0.75 : 1);
  // дії міністрів: [назва, іконка, вартість ($ млрд або частка ВВП), перезарядка днів, опис, дія]
  const gdpC = (n, f) => Math.max(0.05, (n.agg ? n.agg.gdp : 100) * f);
  G.MIN_ACT = {
    common: [
      ['meet', 'Нарада', '📋', n => 0, 30, 'компетентність +3 на рік, лояльність +2', (n, m) => { m.comp = clamp(m.comp + 3, 0, 100); m.loyal = clamp(m.loyal + 2, 0, 100); return 'нарада пройшла продуктивно (майже)'; }],
      ['bonus', 'Премія', '💵', n => gdpC(n, 0.0002), 60, 'лояльність +12', (n, m) => { m.loyal = clamp(m.loyal + 12, 0, 100); return 'міністр дуже вдячний'; }],
      ['audit', 'Перевірка НАБУ', '🔍', n => gdpC(n, 0.0001), 120, 'виявити крадіжки; лояльність −8', (n, m) => { m.loyal = clamp(m.loyal - 8, 0, 100); if ((m.stolen || 0) > 0) { const v = m.stolen * 0.6; n.cash += v; m.stolen = 0; n.stab = Math.min(100, n.stab + 2); return `знайдено й повернуто $${v.toFixed(2)} млрд!`; } return 'порушень не виявлено (або добре сховали)'; }],
      ['fire', 'Звільнити й призначити нового', '🔄', n => 0, 180, 'новий випадковий міністр; стабільність −1', (n, m) => { const nm = newMin(n, m.k, n.a3 + m.k + G.day); nm.auto = m.auto; n.min[m.k] = nm; n.stab = Math.max(0, n.stab - 1); return `новий міністр: ${nm.name}`; }]
    ],
    state: [['pressc', 'Пресконференція', '🎙', n => 0, 30, 'стабільність +1…3', (n, m, e) => { const v = 1 + 2 * e * G.rnd(); n.stab = Math.min(100, n.stab + v); return `стабільність +${v.toFixed(1)}`; }],
      ['reform', 'Податкова реформа', '🧾', n => gdpC(n, 0.001), 365, 'збирання податків +3%', (n, m, e) => { n.taxEff = (n.taxEff || 1) * (1 + 0.03 * e); return 'податки збираються краще'; }],
      ['austerity', 'Режим економії', '✂', n => 0, 180, 'бюджет + (видатки −), стабільність −2', (n, m, e) => { n.cash += gdpC(n, 0.004) * e; n.stab = Math.max(0, n.stab - 2); return 'кабінети без кави, бюджет +'; }]],
    econ: [['stim', 'Пакет стимулів', '📈', n => gdpC(n, 0.004), 180, 'зростання +0.4% на рік', (n, m, e) => { n.mods.push({ growth: 0.004 * e, until: G.day + 365 }); return 'бізнес оживає'; }],
      ['fdi', 'Форум інвесторів', '🤝', n => gdpC(n, 0.0006), 120, 'іноземні інвестиції → зростання', (n, m, e) => { n.fdiG = Math.min(0.01, (n.fdiG || 0) + 0.002 * e); return 'інвестори в захваті від фуршету'; }],
      ['export', 'Експортна місія', '🚢', n => gdpC(n, 0.0004), 90, 'ціни на ваш експорт вигідніші, відносини +', (n, m, e) => { G.N.forEach(x => { if (x.alive && x.id !== n.id && G.rel[x.id][n.id] > 0) G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 1 * e, -100, 100); }); n.cash += gdpC(n, 0.0008) * e; return 'контракти підписано'; }]],
    logi: [['roads', 'Ремонт доріг', '🛣', n => gdpC(n, 0.002), 180, 'інфраструктура +', (n, m, e) => { n.infraLvl = Math.min(1.6, (n.infraLvl || 0.6) + 0.02 * e); return 'ями засипано (цього разу — по-справжньому)'; }],
      ['supply', 'Логістичний прорив', '📦', n => gdpC(n, 0.0008), 90, 'постачання армій +10% на 2 міс.', (n, m, e) => { G.armies.forEach(a => { if (a.n === n.id) a.sup = Math.min(1, (a.sup || 1) + 0.1 * e); }); return 'вантажівки на маршрутах'; }],
      ['ports', 'Модернізація портів', '⚓', n => gdpC(n, 0.0015), 240, 'дешевша перевалка', (n, m, e) => { n.portB = Math.min(0.4, (n.portB || 0) + 0.05 * e); return 'крани нові, черги коротші'; }]],
    army: [['mobc', 'Мобілізаційна кампанія', '📣', n => gdpC(n, 0.0005), 120, 'ліміт мобілізації +, стабільність −1', (n, m, e) => { n.pol.mob = Math.min(0.12, (n.pol.mob || 0) + 0.003 * e); n.stab = Math.max(0, n.stab - 1); return 'військкомати працюють'; }],
      ['drill', 'Навчання військ', '🎯', n => gdpC(n, 0.0008), 120, 'організованість армій +', (n, m, e) => { G.armies.forEach(a => { if (a.n === n.id) a.org = Math.min(1, a.org + 0.12 * e * (m.trait === 'hawk' ? 1.3 : 1)); }); return 'полігони гудуть'; }],
      ['procure', 'Оборонний тендер', '🏭', n => gdpC(n, 0.003), 90, 'арсенал + (дрони, снаряди)', (n, m, e) => { n.ars.fpv = (n.ars.fpv || 0) + 8000 * e; n.ars.shells = (n.ars.shells || 0) + 40000 * e; return 'дрони й снаряди їдуть на фронт'; }]],
    dipl: [['tour', 'Турне по столицях', '✈', n => gdpC(n, 0.0003), 90, 'відносини з 5 країнами +5', (n, m, e) => { G.N.filter(x => x.alive && x.id !== n.id && !G.atWar(x.id, n.id)).sort((a, b) => G.rel[b.id][n.id] - G.rel[a.id][n.id]).slice(0, 5).forEach(x => { G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 5 * e, -100, 100); }); return 'пʼять столиць, пʼять банкетів'; }],
      ['aid', 'Гуманітарна допомога', '📦', n => gdpC(n, 0.001), 120, 'відносини +, слава країни', (n, m, e) => { G.N.filter(x => x.alive && x.stab < 40 && x.id !== n.id).slice(0, 4).forEach(x => { G.rel[x.id][n.id] = clamp(G.rel[x.id][n.id] + 8 * e, -100, 100); }); n.stab = Math.min(100, n.stab + 0.5); return 'вантажі доставлено'; }],
      ['demarche', 'Демарш ворогам', '📜', n => 0, 60, 'стабільність +, відносини з ворогами −', (n, m, e) => { G.enemiesOf(n.id).forEach(x => { G.rel[x][n.id] -= 5; }); n.stab = Math.min(100, n.stab + 1 * e); return 'ноту вручено, посол образився'; }]],
    build: [['housing', 'Нацпрограма житла', '🏘', n => gdpC(n, 0.003), 240, 'стабільність +3', (n, m, e) => { n.stab = Math.min(100, n.stab + 3 * e); return 'черга на житло скоротилась'; }],
      ['speed', 'Будівельний марафон', '⏩', n => gdpC(n, 0.001), 180, 'поточні будови швидше на 20%', (n, m, e) => { G.constructions.forEach(c => { if (c.n === n.id && c.done > G.day) c.done = G.day + Math.round((c.done - G.day) * (1 - 0.2 * e)); }); return 'бетон не встигає застигати'; }],
      ['regions', 'Субвенції регіонам', '🗺', n => gdpC(n, 0.0015), 180, 'зростання регіонів +', (n, m, e) => { ter.forEach(t => { if (t.owner === n.id && t.ctrl === n.id) t.gdp *= 1 + 0.004 * e; }); return 'громади задоволені'; }]],
    tech: [['grant', 'Грант університетам', '🎓', n => gdpC(n, 0.001), 90, 'очки науки в усі сфери', (n, m, e) => { const R = G.resEnsure(n); Object.keys(G.D.techBranches).forEach(b => { R.bp[b] = (R.bp[b] || 0) + 40 * e * (n.tech || 1); }); return 'науковці отримали гранти (і нові чайники)'; }],
      ['brains', 'Повернення вчених', '🧠', n => gdpC(n, 0.0012), 240, 'наука +15% на рік', (n, m, e) => { n.sciK = Math.min(1.6, (n.sciK || 1) * (1 + 0.15 * e)); n._sciUntil = G.day + 365; return 'діаспора повертається'; }],
      ['hack', 'Державний хакатон', '💻', n => gdpC(n, 0.0003), 120, 'прогрес поточного дослідження +20%', (n, m, e) => { G.resBoost(n, 0.2 * e); return 'піца зʼїдена, прототип готовий'; }]],
    intel: [['op', 'Операція під прикриттям', '🕶', n => gdpC(n, 0.0006), 120, 'розвідка на ворога на 3 міс.', (n, m, e) => { const en = G.enemiesOf(n.id)[0]; if (en == null) return 'ворогів немає — шпигуни на курсах англійської'; G.doubleAgents = G.doubleAgents || []; G.doubleAgents.push({ by: n.id, on: en, until: G.day + 90 }); return `агенти в ${N[en].name}`; }],
      ['counter', 'Контррозвідка', '🛡', n => gdpC(n, 0.0004), 120, 'ворожі агенти ловляться частіше', (n, m, e) => { n.counterIntel = G.day + 180; n.stab = Math.min(100, n.stab + 0.5); return 'кротів шукають навіть у бухгалтерії'; }],
      ['leak', 'Злив компромату на ворога', '📰', n => 0, 180, 'стабільність ворога −3', (n, m, e) => { const en = G.enemiesOf(n.id)[0]; if (en == null) return 'зливати нікого'; N[en].stab = Math.max(0, N[en].stab - 3 * e); return `компромат на уряд ${N[en].name} опубліковано`; }]]
  };
  const listFor = k => (G.MIN_ACT[k] || []).concat(G.MIN_ACT.common);
  G.minActions = listFor;
  G.minCan = function (nid, k, a) { const n = N[nid], m = G.minOf(nid, k), A = listFor(k).find(x => x[0] === a); if (!A) return '?'; if ((m.cd[a] || 0) > G.day) return `Ще ${m.cd[a] - G.day} дн.`; const c = A[3](n); if (n.cash < c) return 'Бракує коштів у бюджеті'; return ''; };
  G.minDo = function (nid, k, a) {
    const e0 = G.minCan(nid, k, a); if (e0) return { ok: false, err: e0 }; const n = N[nid], m = G.minOf(nid, k), A = listFor(k).find(x => x[0] === a);
    const c = A[3](n) * (m.trait === 'lazy' ? 0.7 : 1) * (m.trait === 'pop' ? 1.15 : 1); n.cash -= c; m.cd[a] = G.day + A[4]; const msg = A[6](n, m, eff(m)); if (m.trait === 'pop' || m.trait === 'star') n.stab = Math.min(100, n.stab + 0.3);
    if (m.trait === 'star' || G.rnd() < 0.3) G.say(`${G.MIN[k].ic} ${m.name} (${G.MIN[k].n.toLowerCase()}): ${A[1].toLowerCase()} — ${msg}`, 'info', [nid]);
    return { ok: true, msg };
  };
  G.minSetAuto = function (nid, k, v) { const m = G.minOf(nid, k); m.auto = !!v; const n = N[nid];
    if (k === 'tech') n.res.auto = !!v || n.res.auto; if (k === 'build') n.dev.auto = !!v; if (k === 'army') { n.strikeAuto = !!v; if (v) G.armies.forEach(a => { if (a.n === nid && !a.train) a.auto = true; }); } if (k === 'econ' || k === 'logi') n.autoTrade = n.autoTrade || !!v;
    return { ok: true }; };
  // щомісяця: автокерування, лояльність, крадіжки й кумедні скандали
  const FUN = [['обідав', 'обідала', 'у ресторані за рахунок бюджету й переплутав рахунок з кошторисом'], ['купив', 'купила', '«стратегічний запас» кави на пʼять років'], ['провів', 'провела', 'нараду в сауні «для зміцнення команди»'], ['замовив', 'замовила', 'тендер на золоті скріпки'], ['пояснив', 'пояснила', 'зниклі мільйони «бухгалтерським лагом»'], ['загубив', 'загубила', 'флешку з бюджетом у таксі'], ['оформив', 'оформила', 'службовий гелікоптер для поїздок на дачу'], ['найняв', 'найняла', 'пʼять радників з питань найму радників']];
  const fun = m => { const f = pick(FUN); return (m.fem ? f[1] : f[0]) + ' ' + (m.fem ? f[2].replace('переплутав', 'переплутала') : f[2]); };
  G.ministersMonthly = function () {
    N.forEach(n => {
      if (!n.alive || !G.isHuman(n.id) || !n.min) return;
      for (const k in n.min) { const m = n.min[k]; if (!m) continue;
        m.loyal = clamp(m.loyal - (m.trait === 'honest' ? 0.2 : 0.6) + (n.stab - 50) / 100, 0, 100); if (m.comp < 95) m.comp += 0.1;
        if (n._sciUntil && n._sciUntil < G.day) { n.sciK = Math.max(1, (n.sciK || 1) / 1.15); n._sciUntil = 0; }
        const thief = m.trait === 'honest' ? 0 : (m.trait === 'greedy' ? 0.08 : 0.03) * (1 - m.loyal / 100) * 2;
        if (G.rnd() < thief) { const v = Math.min(n.cash * 0.01, gdpC(n, 0.0008)); n.cash -= v; m.stolen = (m.stolen || 0) + v; if (G.rnd() < 0.5) G.say(`🤡 Скандал: ${m.name} (${G.MIN[k].n.toLowerCase()}) ${fun(m)}. Зникло ~${G.fmt$(v)}`, 'bad', [n.id]); }
        if (m.auto) { // автокерування: ШІ-міністр користується своїми діями
          if (k === 'state' && (G.day + n.id) % 60 === 0 && G.aiPolicy) { const keep = { mil: n.pol.mil, mob: n.pol.mob }; G.aiPolicy(n); Object.assign(n.pol, keep); }
          if (k === 'dipl' && (G.day + n.id) % 60 === 0 && G.aiDiplomacy && !G.enemiesOf(n.id).length) { try { G.aiDiplomacy(n); } catch (e) { } }
          if (k === 'army') { n.strikeAuto = true; G.armies.forEach(a => { if (a.n === n.id && !a.train && !a.mv) a.auto = true; }); }
          if (k === 'tech') n.res.auto = true; if (k === 'build') n.dev.auto = true; if (k === 'econ' || k === 'logi') n.autoTrade = true;
          const acts = (G.MIN_ACT[k] || []).filter(x => !G.minCan(n.id, k, x[0])); if (acts.length && G.rnd() < 0.35) { const A = acts[Math.floor(G.rnd() * acts.length)]; if (A[3](n) < n.cash * 0.1) G.minDo(n.id, k, A[0]); }
        } }
    });
  };
  G.act.minDo = (k, a) => G.minDo(G.player, k, a);
  G.act.minAuto = (k, v) => G.minSetAuto(G.player, k, v);
});
