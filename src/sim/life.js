// ЖИТТЯ ПЕРСОНАЖА: професії, навички (дослідження персонажа), підробітки, розкіш (нерухомість, авто, літаки, яхти…),
// інвестиції (облігації, фонди, крипта, венчур, золото, прямі інвестиції в регіони) з впливом на світову економіку, партія.
LORA.sim.register('life', 99.67, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const isChar = L => L && (L.role === 'char' || ((L.role === 'president' || L.role === 'ceo') && L.money != null)); // особисте життя є і в президента/CEO
  const nidOf = () => G.leaderNation();
  const add = (o, nid, v) => { o[nid] = clamp((o[nid] || 0) + v * (v > 0 ? 1 - (o[nid] || 0) / 120 : 1), 0, 100); };

  // ---------- НАВИЧКИ (дослідження персонажа)
  G.SKILLS = {
    orat:  { n: 'Ораторство', ic: '🎙', d: 'виступи, кампанії й дебати дають більше популярності' },
    law:   { n: 'Право', ic: '⚖', d: 'вищий шанс ухвалення ваших законопроєктів; професії юриста й судді' },
    eco:   { n: 'Економіка й фінанси', ic: '📈', d: 'дохідність інвестицій +; професії банкіра й економіста' },
    biz:   { n: 'Менеджмент', ic: '💼', d: 'витрати вашої компанії −2% за рівень; топменеджер' },
    diplo: { n: 'Дипломатія', ic: '🤝', d: 'звʼязки з урядами ростуть швидше; дипломат' },
    media: { n: 'Медіа й PR', ic: '📺', d: 'популярність щомісяця +, менше шкоди від скандалів' },
    sci:   { n: 'Наука', ic: '🔬', d: 'R&D вашої компанії швидше; лікар, професор' },
    tech:  { n: 'Технології й ІТ', ic: '💻', d: 'програміст, інженер, пілот; вдаліші венчурні інвестиції' },
    mil:   { n: 'Військова справа', ic: '🎖', d: 'офіцерська карʼєра; у війну популярність вища' }
  };
  G.skill = (L, k) => (L && L.sk && L.sk[k]) || 0;
  const stud = () => !!(G.leader && G.leader.type === 'student'); const studyCost = lv => 0.000004 * (lv + 1) * (lv + 1) * (stud() ? 0.5 : 1), studyDays = lv => Math.round((15 + lv * 12) / (stud() ? 2 : 1));
  G.lifeStudyCan = function (k) {
    const L = G.leader; if (!isChar(L)) return 'Лише для персонажа'; if (!G.SKILLS[k]) return '?'; const lv = G.skill(L, k);
    if (lv >= 5) return 'Максимальний рівень'; if (L.mv) return 'Персонаж у дорозі'; if (L.busy > G.day) return `Зайнятий ще ${L.busy - G.day} дн.`;
    if (L.money < studyCost(lv)) return 'Бракує грошей'; return '';
  };
  G.lifeStudy = function (k) {
    const e = G.lifeStudyCan(k); if (e) return { ok: false, err: e }; const L = G.leader; L.sk = L.sk || {}; const lv = G.skill(L, k);
    L.money -= studyCost(lv); L.busy = G.day + studyDays(lv); L.sk[k] = lv + 1; L.fame += 0.2;
    const msg = `${G.SKILLS[k].n}: рівень ${lv + 1}`; G.say(`🎓 ${L.name}: курс завершено — ${msg}`, 'good', [nidOf()]); return { ok: true, msg };
  };
  G.lifeStudyPrice = k => { const lv = G.skill(G.leader, k); return { cost: studyCost(lv), days: studyDays(lv) }; };

  // ---------- ПРОФЕСІЇ (доповнення до career.js)
  Object.assign(G.JOBS, {
    doctor:     { n: 'Лікар', ic: '🩺', pay: 0.000009, d: 'повага людей: популярність щомісяця +', k: { pop: 1.2 }, req: { sci: 1 }, m: { pop: 0.25 } },
    engineer:   { n: 'Інженер', ic: '🛠', pay: 0.000006, d: 'стабільний дохід, звʼязки в промисловості', k: { cont: 1.1 }, req: { tech: 1 } },
    programmer: { n: 'Програміст', ic: '💻', pay: 0.000008, d: 'високий дохід, можна працювати з будь-якої країни', k: { money: 1.3 }, req: { tech: 2 } },
    banker:     { n: 'Банкір', ic: '🏦', pay: 0.000018, d: 'дуже високий дохід, звʼязки з елітами; популярність повільно падає', k: { money: 2, cont: 1.3 }, req: { eco: 2 }, m: { pop: -0.15, cont: 0.3 } },
    economist:  { n: 'Економіст', ic: '📊', pay: 0.000006, d: 'експертні коментарі: слава й звʼязки з урядом', k: { cont: 1.2 }, req: { eco: 1 }, m: { cont: 0.2 } },
    diplomat:   { n: 'Дипломат', ic: '🕊', pay: 0.000007, d: 'звʼязки за кордоном ростуть самі', k: { cont: 1.6 }, req: { diplo: 2 }, m: { abroad: 0.4 } },
    actor:      { n: 'Актор', ic: '🎬', pay: 0.000005, d: 'слава й популярність, але нестабільний дохід', k: { pop: 1.6, fame: 1.4 }, req: { media: 1 }, m: { fame: 0.15, pop: 0.2 } },
    athlete:    { n: 'Спортсмен', ic: '🏅', pay: 0.00001, d: 'світова слава; пік карʼєри недовгий', k: { fame: 1.6, pop: 1.3 }, m: { fame: 0.2 } },
    teacher:    { n: 'Вчитель', ic: '📚', pay: 0.0000022, d: 'низька зарплата, але довіра людей', k: { pop: 1.3 }, m: { pop: 0.2 } },
    farmer:     { n: 'Фермер', ic: '🌾', pay: 0.0000035, d: 'дохід залежить від урожаю; популярність у регіонах', k: { pop: 1.2 }, m: { pop: 0.1 } },
    pilot:      { n: 'Пілот', ic: '🛫', pay: 0.000009, d: 'перельоти вдвічі дешевші й швидші', k: { money: 1.1 }, req: { tech: 1 } },
    architect:  { n: 'Архітектор', ic: '📐', pay: 0.000006, d: 'нерухомість для вас дешевша на 10%', k: { money: 1.2 }, req: { tech: 1 } },
    blogger:    { n: 'Блогер', ic: '📱', pay: 0.0000015, d: 'дохід росте зі славою; популярність +', k: { pop: 1.5 }, m: { pop: 0.2, fameInc: 1 } },
    judge:      { n: 'Суддя', ic: '⚖', pay: 0.00001, d: 'вплив на уряд; слабкий шанс скандалу', k: { cont: 1.5 }, req: { law: 3 }, m: { cont: 0.3 } },
    professor:  { n: 'Професор', ic: '🎓', pay: 0.000007, d: 'світова слава, навчання вдвічі дешевше', k: { fame: 1.3 }, req: { sci: 3 }, m: { fame: 0.1 } },
    entrepreneur:{ n: 'Підприємець (малий бізнес)', ic: '🏪', pay: 0.000005, d: 'дохід коливається; легше заснувати компанію', k: { money: 1.4 }, req: { biz: 1 }, m: { varPay: 1 } }
  });
  Object.assign(G.JOBS.lawyer, { req: { law: 1 } }); Object.assign(G.JOBS.manager, { req: { biz: 2 } }); Object.assign(G.JOBS.scientist, { req: { sci: 2 } }); Object.assign(G.JOBS.officer, { req: { mil: 1 } });
  G.jobReqErr = (L, k) => { const J = G.JOBS[k]; if (!J || !J.req) return ''; for (const [s, v] of Object.entries(J.req)) if (G.skill(L, s) < v) return `Потрібна навичка «${G.SKILLS[s].n}» рівня ${v}`; return ''; };
  { const base = G.careerCan; G.careerCan = function (k, arg) { const e = base(k, arg); if (e) return e; if (k === 'job') return G.jobReqErr(G.leader, arg); return ''; }; }
  // бонуси навичок до кар'єрних дій
  { const base = G.careerDo; G.careerDo = function (k, a, b) { const L = G.leader, nid = nidOf(); const r = base(k, a, b); if (r && r.ok && L && nid >= 0) {
      if (k === 'mp_speech' || k === 'campaign') add(L.popu, nid, G.skill(L, 'orat') * 0.6); if (k === 'campaign' && L.party) L.party.r = clamp(L.party.r + G.skill(L, 'orat') * 0.1, 0, 45); }
    return r; }; }
  { const base = G.charDo; if (base) G.charDo = function (k, p) { const L = G.leader, nid = nidOf(); const r = base(k, p); if (r && r.ok && L && nid >= 0) { add(L.cont, nid, G.skill(L, 'diplo') * 0.4); add(L.popu, nid, G.skill(L, 'media') * 0.2); } return r; }; }
  { const base = G.travelTime; G.travelTime = function (to) { const L = G.leader; const d = base(to); if (!isChar(L)) return d; const m = Math.min(G.lifeTravelMul(L), L.job && L.job.k === 'pilot' ? 0.5 : 1); return Math.max(1, Math.round(d * m)); }; }
  { const base = G.coCostMul; if (base) G.coCostMul = function (c, nid) { const v = base(c, nid); const L = G.leader; return c && c.owner === 'me' && isChar(L) ? v * (1 - 0.02 * G.skill(L, 'biz')) : v; }; }

  // ---------- ПІДРОБІТКИ (разові)
  G.GIGS = {
    lecture:  { n: 'Платна лекція', ic: '🎤', days: 2, need: { fame: 8 }, d: 'гонорар росте зі славою', run: L => { const pay = 0.0000015 + L.fame * 0.0000003; L.money += pay; return `гонорар ${G.fmt$(pay)}`; } },
    ad:       { n: 'Реклама бренду', ic: '📸', days: 3, need: { fame: 15 }, d: 'великі гроші, але популярність трохи падає', run: (L, nid) => { const pay = 0.000003 + L.fame * 0.000002; L.money += pay; add(L.popu, nid, -1); return `контракт ${G.fmt$(pay)}`; } },
    book:     { n: 'Написати книгу', ic: '📖', days: 45, need: {}, d: 'слава й роялті; бестселер можливий', run: (L, nid) => { const best = G.rnd() < 0.15 + G.skill(L, 'media') * 0.05; L.fame += best ? 6 : 1.5; add(L.popu, nid, best ? 6 : 2); const pay = best ? 0.00008 : 0.000006; L.money += pay; return best ? 'бестселер! слава +6' : 'книга вийшла, слава +1.5'; } },
    consult:  { n: 'Консалтинг для корпорації', ic: '📑', days: 10, need: { cont: 20 }, d: 'потрібні звʼязки', run: (L, nid) => { const pay = 0.000004 + (L.cont[nid] || 0) * 0.0000002 + G.skill(L, 'eco') * 0.000002; L.money += pay; add(L.cont, nid, 1); return G.fmt$(pay); } },
    stream:   { n: 'Стрим / подкаст', ic: '🎧', days: 1, need: {}, d: 'популярність серед молоді, донати', run: (L, nid) => { add(L.popu, nid, 1 + G.skill(L, 'media') * 0.3); const don = 0.00000005 * (1 + L.fame * L.fame / 20); L.money += don; return `аудиторія росте, донати ${G.fmt$(don)}`; } },
    tv:       { n: 'Ефір на ТБ (ток-шоу)', ic: '📺', days: 1, need: { fame: 10 }, d: 'популярність; ризик провалу', run: (L, nid) => { const ok = G.rnd() < 0.7 + G.skill(L, 'orat') * 0.05; add(L.popu, nid, ok ? 3 : -2); return ok ? 'вдалий ефір' : 'невдалий виступ, популярність −2'; } },
    charity:  { n: 'Благодійний аукціон', ic: '🎗', days: 5, need: { money: 0.000002 }, d: 'віддаєте 1% статків: популярність і слава', run: (L, nid) => { const g = Math.max(0.0000005, G.lifeWealth(L) * 0.01); L.money -= g; add(L.popu, nid, 2 + Math.log10(1 + g * 1e6)); L.fame += 1; return `пожертвувано ${G.fmt$(g)}`; } }
  };
  G.gigCan = function (k) { const L = G.leader, A = G.GIGS[k]; if (!L || L.role !== 'char' || !A) return 'Лише для персонажа'; if (L.mv) return 'Персонаж у дорозі'; if (L.busy > G.day) return `Зайнятий ще ${L.busy - G.day} дн.`;
    const nid = nidOf(); if (A.need.fame && L.fame < A.need.fame) return `Потрібна слава ≥ ${A.need.fame}`; if (A.need.cont && (L.cont[nid] || 0) < A.need.cont) return `Потрібні звʼязки ≥ ${A.need.cont}`; if (A.need.money && L.money < A.need.money) return 'Бракує грошей';
    if ((L.gigT || {})[k] > G.day) return `Можна знову через ${L.gigT[k] - G.day} дн.`; return ''; };
  G.gigDo = function (k) { const e = G.gigCan(k); if (e) return { ok: false, err: e }; const L = G.leader, A = G.GIGS[k], nid = nidOf(); L.busy = G.day + A.days; L.gigT = L.gigT || {}; L.gigT[k] = G.day + A.days + 14; const msg = A.run(L, nid); G.say(`${A.ic} ${L.name}: ${A.n.toLowerCase()} — ${msg}`, 'info', [nid]); return { ok: true, msg }; };

  // ---------- РОЗКІШ: каталог (ціни у $ млрд)
  // fame — разово при купівлі; pop/cont — щомісяця в країні; trav — множник часу перельотів; rent — річна дохідність;
  // apr — дорожчає з ростом економіки країни; upk — річне утримання; sec — охорона (менше скандалів і замахів); media — сила PR
  G.LUX_CAT = { home: ['🏠', 'Нерухомість'], biz: ['🏨', 'Дохідна нерухомість'], car: ['🚗', 'Автомобілі'], heli: ['🚁', 'Гелікоптери'], jet: ['✈', 'Літаки'], yacht: ['🛥', 'Яхти'], art: ['🖼', 'Мистецтво й колекції'], sport: ['⚽', 'Спорт'], media: ['📺', 'Медіа'], fun: ['🌟', 'Враження'] };
  G.LUX = {
    flat:      { c: 'home', n: 'Квартира в столиці', p: 0.0006, fame: 0, pop: 0, cont: 0.1, apr: 1, upk: 0.01, rent: 0.03 },
    house:     { c: 'home', n: 'Заміський будинок', p: 0.0015, fame: 0.3, cont: 0.15, apr: 1, upk: 0.015, rent: 0.025 },
    penthouse: { c: 'home', n: 'Пентхаус у хмарочосі', p: 0.025, fame: 2, cont: 0.4, apr: 1.2, upk: 0.012, rent: 0.03 },
    villa:     { c: 'home', n: 'Вілла на узбережжі', p: 0.012, fame: 1.5, cont: 0.3, apr: 1.1, upk: 0.02, rent: 0.035, coast: 1 },
    mansion:   { c: 'home', n: 'Маєток з парком', p: 0.05, fame: 3, cont: 0.6, apr: 1, upk: 0.02 },
    castle:    { c: 'home', n: 'Історичний замок', p: 0.08, fame: 5, cont: 0.8, apr: 0.8, upk: 0.03, pop: -0.05 },
    island:    { c: 'home', n: 'Приватний острів', p: 0.25, fame: 8, cont: 0.5, apr: 1.3, upk: 0.02, coast: 1, sec: 2 },
    bunker:    { c: 'home', n: 'Елітний бункер', p: 0.02, fame: 0.5, sec: 3, upk: 0.01 },
    hotel:     { c: 'biz', n: 'Бутік-готель', p: 0.06, fame: 1, cont: 0.2, apr: 1, upk: 0.01, rent: 0.07, pop: 0.05 },
    tower:     { c: 'biz', n: 'Офісна вежа', p: 0.4, fame: 3, cont: 0.6, apr: 1.1, upk: 0.008, rent: 0.065 },
    mall:      { c: 'biz', n: 'Торговий центр', p: 0.25, fame: 2, pop: 0.1, apr: 1, upk: 0.01, rent: 0.075 },
    vineyard:  { c: 'biz', n: 'Виноградник і винарня', p: 0.015, fame: 1, pop: 0.05, apr: 0.8, upk: 0.02, rent: 0.05 },
    resort:    { c: 'biz', n: 'Гірськолижний курорт', p: 0.18, fame: 3, pop: 0.1, apr: 1, upk: 0.015, rent: 0.06 },
    sedan:     { c: 'car', n: 'Бізнес-седан', p: 0.00008, fame: 0, cont: 0.02, upk: 0.08 },
    suv:       { c: 'car', n: 'Броньований позашляховик', p: 0.0005, fame: 0.1, sec: 1, upk: 0.08 },
    sport:     { c: 'car', n: 'Спорткар', p: 0.0003, fame: 0.4, pop: -0.02, upk: 0.06 },
    hyper:     { c: 'car', n: 'Гіперкар', p: 0.003, fame: 1.5, pop: -0.05, upk: 0.04, apr: 1 },
    classic:   { c: 'car', n: 'Колекція класичних авто', p: 0.02, fame: 2, apr: 1.4, upk: 0.03 },
    ev:        { c: 'car', n: 'Електромобіль', p: 0.0001, fame: 0.1, pop: 0.03, upk: 0.04 },
    heli_l:    { c: 'heli', n: 'Легкий гелікоптер', p: 0.003, fame: 0.5, trav: 0.9, upk: 0.1 },
    heli_v:    { c: 'heli', n: 'VIP-гелікоптер', p: 0.015, fame: 1.5, trav: 0.85, sec: 1, upk: 0.1 },
    jet_l:     { c: 'jet', n: 'Легкий бізнес-джет', p: 0.008, fame: 1, trav: 0.75, upk: 0.12 },
    jet_m:     { c: 'jet', n: 'Середній бізнес-джет', p: 0.025, fame: 2, trav: 0.6, upk: 0.1, cont: 0.1 },
    jet_h:     { c: 'jet', n: 'Важкий міжконтинентальний джет', p: 0.07, fame: 3, trav: 0.5, upk: 0.09, cont: 0.2 },
    airliner:  { c: 'jet', n: 'VIP-лайнер', p: 0.3, fame: 6, trav: 0.45, upk: 0.08, cont: 0.4, pop: -0.1 },
    boat:      { c: 'yacht', n: 'Моторна яхта', p: 0.005, fame: 1, upk: 0.1 },
    sailing:   { c: 'yacht', n: 'Вітрильна яхта для регат', p: 0.02, fame: 2, upk: 0.08, cont: 0.1 },
    superyacht:{ c: 'yacht', n: 'Суперяхта', p: 0.15, fame: 5, upk: 0.1, cont: 0.4, pop: -0.08 },
    gigayacht: { c: 'yacht', n: 'Гігаяхта з гелікоптером', p: 0.6, fame: 10, upk: 0.1, cont: 0.7, sec: 2, pop: -0.15, trav: 0.9 },
    painting:  { c: 'art', n: 'Картина сучасного художника', p: 0.005, fame: 0.5, apr: 1.5, upk: 0.005 },
    master:    { c: 'art', n: 'Шедевр старих майстрів', p: 0.15, fame: 5, apr: 1.6, upk: 0.004, cont: 0.2 },
    watches:   { c: 'art', n: 'Колекція годинників', p: 0.003, fame: 0.3, apr: 1.3, upk: 0.003 },
    wine:      { c: 'art', n: 'Колекційне вино', p: 0.002, fame: 0.2, apr: 1.4, upk: 0.01 },
    museum:    { c: 'art', n: 'Приватний музей (відкритий для всіх)', p: 0.08, fame: 4, pop: 0.3, upk: 0.04 },
    horse:     { c: 'sport', n: 'Скакові коні', p: 0.003, fame: 0.8, upk: 0.1, cont: 0.1 },
    club_f:    { c: 'sport', n: 'Футбольний клуб', p: 0.5, fame: 8, pop: 0.6, upk: 0.06, apr: 1, rent: 0.02 },
    club_b:    { c: 'sport', n: 'Баскетбольна команда', p: 0.2, fame: 4, pop: 0.3, upk: 0.06, apr: 1 },
    esport:    { c: 'sport', n: 'Кіберспортивна команда', p: 0.01, fame: 1.5, pop: 0.15, upk: 0.1 },
    f1:        { c: 'sport', n: 'Команда Формули-1', p: 0.8, fame: 12, upk: 0.1, cont: 0.5, apr: 1 },
    paper:     { c: 'media', n: 'Газета', p: 0.03, fame: 1, media: 1, pop: 0.15, upk: 0.08 },
    radio:     { c: 'media', n: 'Радіостанція', p: 0.02, fame: 0.8, media: 1, pop: 0.15, upk: 0.06 },
    tvch:      { c: 'media', n: 'Телеканал', p: 0.35, fame: 4, media: 3, pop: 0.5, upk: 0.07, cont: 0.3 },
    portal:    { c: 'media', n: 'Новинний інтернет-портал', p: 0.015, fame: 0.8, media: 1, pop: 0.2, upk: 0.06 },
    space:     { c: 'fun', n: 'Політ у космос', p: 0.05, fame: 8, once: 1 },
    gala:      { c: 'fun', n: 'Благодійний бал для еліти', p: 0.003, fame: 1, cont: 3, once: 1 },
    concert:   { c: 'fun', n: 'Безкоштовний концерт зірок для міста', p: 0.008, fame: 1.5, pop: 5, once: 1 },
    safari:    { c: 'fun', n: 'Експедиція в Антарктиду', p: 0.002, fame: 1.2, once: 1 }
  };
  const coastOf = i => (T[i].p || []).length > 0;
  G.lifeTravelMul = L => (L.own || []).reduce((m, o) => Math.min(m, G.LUX[o.k].trav || 1), 1);
  G.lifeSec = L => (L.own || []).reduce((s, o) => s + (G.LUX[o.k].sec || 0), 0);
  G.lifeMedia = L => (L.own || []).reduce((s, o) => s + (G.LUX[o.k].media || 0), 0);
  G.luxPrice = (k, nid) => { const A = G.LUX[k]; const n = N[nid]; const loc = A.c === 'home' || A.c === 'biz' ? clamp(0.35 + (n && n.pc ? n.pc : 10000) / 30000, 0.35, 2.2) : 1; const L = G.leader; return A.p * loc * (L && L.job && L.job.k === 'architect' && (A.c === 'home' || A.c === 'biz') ? 0.9 : 1); };
  G.luxCan = function (k) { const L = G.leader, A = G.LUX[k]; if (!isChar(L) || !A) return 'Лише для персонажа'; if (L.mv) return 'Персонаж у дорозі'; const nid = nidOf(); if (nid < 0) return '?';
    if (L.money < G.luxPrice(k, nid)) return 'Бракує грошей'; if (A.coast && !coastOf(L.at)) return 'Потрібне узбережжя (перелетіть у приморський регіон)';
    if (!A.once && (L.own || []).filter(o => o.k === k).length >= 3) return 'Досить трьох однакових'; return ''; };
  G.luxBuy = function (k) {
    const e = G.luxCan(k); if (e) return { ok: false, err: e }; const L = G.leader, A = G.LUX[k], nid = nidOf(), p = G.luxPrice(k, nid); L.money -= p; L.fame += A.fame || 0;
    const n = N[nid]; if (n) n.cash += p * 0.08; // податки й мита на покупку
    if (A.once) { if (A.cont) add(L.cont, nid, A.cont); if (A.pop) add(L.popu, nid, A.pop); }
    else { L.own = L.own || []; L.own.push({ k, nid, at: L.at, v: p, p0: p, d: G.day }); }
    if (p >= 0.1) G.say(`💎 ${L.name} купує: ${A.n} ($${p >= 1 ? p.toFixed(2) + ' млрд' : (p * 1000).toFixed(0) + ' млн'})`, 'info', [nid]);
    return { ok: true, msg: A.n };
  };
  G.luxSell = function (idx) { const L = G.leader; if (!isChar(L) || !L.own || !L.own[idx]) return { ok: false, err: '?' }; const o = L.own[idx], A = G.LUX[o.k];
    const rate = A.c === 'home' || A.c === 'biz' || A.c === 'art' ? 0.95 : A.c === 'sport' || A.c === 'media' ? 0.9 : 0.7; const v = o.v * rate; L.money += v; L.own.splice(idx, 1);
    return { ok: true, msg: `${A.n}: продано за ${G.fmt$(v)}` }; };

  // ---------- ІНВЕСТИЦІЇ
  // b: держоблігації {nid: сума}, f: світовий індексний фонд, c: крипта (кількість «монет»), g: золото (унції у млн), v: венчур [], d: прямі інвестиції в регіони []
  G.lifeInit = function () { if (!G.mkt) G.mkt = { crypto: 1, gold: 1, cryptoH: [1], goldH: [1], cap: 0, crash: 0 }; };
  const inv = L => L.pf || (L.pf = { b: {}, f: 0, c: 0, g: 0, v: [], d: [] });
  G.bondYield = nid => { const n = N[nid]; if (!n) return 0; const debt = (n.debt || 0) / Math.max(1, n.agg ? n.agg.gdp : 100); return clamp(0.025 + debt * 0.035 + (G.enemiesOf(nid).length ? 0.05 : 0) + (n.stab < 40 ? 0.03 : 0) - (n.tech || 0.5) * 0.01, 0.01, 0.25); };
  G.INV = {
    bond:   { n: 'Держоблігації', ic: '🏛', d: 'гроші йдуть у бюджет країни; дохідність залежить від боргу й війни; можливий дефолт' },
    fund:   { n: 'Світовий індексний фонд', ic: '🌐', d: 'повторює світовий біржовий індекс' },
    crypto: { n: 'Криптовалюта', ic: '💰', d: 'висока волатильність; бульбашки й обвали впливають на світ' },
    gold:   { n: 'Золото', ic: '🥇', d: 'дорожчає під час воєн і криз' },
    venture:{ n: 'Венчурний стартап', ic: '🚀', d: 'через 1–3 роки: більшість згорає, але кожен десятий — ×10 і більше' },
    direct: { n: 'Пряма інвестиція в регіон', ic: '🏗', d: 'ВВП регіону росте, ви отримуєте дивіденди й популярність у країні' }
  };
  G.invCan = function (k, amt) { const L = G.leader; if (!isChar(L)) return 'Лише для персонажа'; if (!(amt > 0)) return 'Вкажіть суму'; if (L.money < amt) return 'Бракує грошей';
    const nid = nidOf(); if ((k === 'bond' || k === 'direct' || k === 'venture') && nid < 0) return 'Персонаж у дорозі'; if (k === 'venture' && amt < 0.00001) return 'Мінімум $10 тис.'; if (k === 'direct' && amt < 0.0001) return 'Мінімум $100 тис.'; return ''; };
  G.invest = function (k, amt) {
    const e = G.invCan(k, amt); if (e) return { ok: false, err: e }; G.lifeInit(); const L = G.leader, I = inv(L), nid = nidOf(); L.money -= amt; let msg = '';
    if (k === 'bond') { I.b[nid] = (I.b[nid] || 0) + amt; N[nid].cash += amt; N[nid].debt = (N[nid].debt || 0) + amt; msg = `облігації ${N[nid].name}, ${(G.bondYield(nid) * 100).toFixed(1)}% річних`; }
    if (k === 'fund') { I.f += amt / idxNow(); msg = 'частки фонду'; }
    if (k === 'crypto') { I.c += amt / G.mkt.crypto; G.mkt.cap += amt; msg = 'монети'; }
    if (k === 'gold') { I.g += amt / G.mkt.gold; msg = 'золото'; }
    if (k === 'venture') { const secs = ['ШІ-асистент', 'біотех', 'фінтех', 'дрони', 'агротех', 'космос', 'кібербезпека', 'ігри', 'чиста енергія']; I.v.push({ amt, nid, d: G.day, end: G.day + 365 + Math.floor(G.rnd() * 730), name: pick(secs) }); msg = `стартап (${I.v[I.v.length - 1].name})`; }
    if (k === 'direct') { const i = L.at; ter[i].gdp += amt * 0.6; I.d.push({ t: i, amt, d: G.day }); add(L.popu, nid, 1 + amt * 60); N[nid].fdiG = Math.min(0.01, (N[nid].fdiG || 0) + amt / Math.max(5, N[nid].agg.gdp) * 0.8); msg = `${T[i].n}: нові робочі місця`; }
    return { ok: true, msg };
  };
  const idxNow = () => { const S = G.stock; return S && S.idx && S.idx.length ? S.idx[S.idx.length - 1] / 100 : 1; };
  G.invValue = function (L) { const I = L && L.pf; if (!I) return { b: 0, f: 0, c: 0, g: 0, v: 0, d: 0, tot: 0 }; G.lifeInit();
    const r = { b: Object.values(I.b).reduce((s, v) => s + v, 0), f: I.f * idxNow(), c: I.c * G.mkt.crypto, g: I.g * G.mkt.gold, v: I.v.reduce((s, x) => s + x.amt, 0), d: I.d.reduce((s, x) => s + x.amt, 0) }; r.tot = r.b + r.f + r.c + r.g + r.v + r.d; return r; };
  G.invSell = function (k, nid) { const L = G.leader; if (!isChar(L) || !L.pf) return { ok: false, err: '?' }; const I = L.pf; let v = 0;
    if (k === 'bond') { v = I.b[nid] || 0; delete I.b[nid]; const n = N[nid]; if (n) { n.cash -= v; if (n.cash < 0) { n.debt += -n.cash; n.cash = 0; } } }
    if (k === 'fund') { v = I.f * idxNow(); I.f = 0; } if (k === 'crypto') { v = I.c * G.mkt.crypto * 0.99; G.mkt.cap = Math.max(0, G.mkt.cap - v); I.c = 0; } if (k === 'gold') { v = I.g * G.mkt.gold * 0.99; I.g = 0; }
    if (k === 'direct') { const x = I.d.splice(nid, 1)[0]; if (x) v = x.amt * 0.8; }
    if (!(v > 0)) return { ok: false, err: 'Нічого продавати' }; L.money += v; return { ok: true, msg: `отримано ${G.fmt$(v)}` }; };
  G.lifeWealth = L => !L ? 0 : (L.money || 0) + (L.own || []).reduce((s, o) => s + o.v, 0) + G.invValue(L).tot;

  // ---------- ПАРТІЯ
  G.IDEOS = {
    center: { n: 'Центристи', ic: '⚪', pol: {} },
    left:   { n: 'Соціал-демократи', ic: '🔴', pol: { soc: 0.004, tax: 0.003 } },
    right:  { n: 'Консерватори', ic: '🔵', pol: { tax: -0.003, mil: 0.001 } },
    lib:    { n: 'Ліберали', ic: '🟡', pol: { tax: -0.004, res: 0.001 } },
    green:  { n: 'Зелені', ic: '🟢', pol: { res: 0.002, infra: 0.002 } },
    nat:    { n: 'Патріоти', ic: '🟠', pol: { mil: 0.003, mob: 0.002 } },
    tech:   { n: 'Партія прогресу', ic: '🟣', pol: { res: 0.003, infra: 0.001 } }
  };
  G.PARTY = {
    p_ideo:   { n: 'Змінити ідеологію', ic: '🧭', cost: 0, pc: 0, days: 5, d: 'визначає, які закони просуває фракція' },
    p_branch: { n: 'Відкрити осередок у регіоні', ic: '🏢', cost: 0, pc: 0.004, days: 7, d: 'рейтинг у країні +, члени партії +; оберіть регіон на мапі (персонаж має бути в країні)' },
    p_fund:   { n: 'Зустріч зі спонсорами', ic: '💰', cost: 0, pc: 0, days: 5, d: 'каса партії + (залежить від звʼязків); великі донори — ризик скандалу' },
    p_ads:    { n: 'Рекламна кампанія партії', ic: '📣', cost: 0, pc: 0.01, days: 10, d: 'рейтинг + за рахунок каси партії; телеканал/газета посилюють' },
    p_rally:  { n: 'Мітинг', ic: '✊', cost: 0, pc: 0.001, days: 3, d: 'популярність лідера й рейтинг; у кризу — ризик сутичок' },
    p_congress:{ n: 'Зʼїзд партії', ic: '🎪', cost: 0, pc: 0.006, days: 14, d: 'раз на рік: єдність, рейтинг, нова програма' },
    p_debate: { n: 'Теледебати', ic: '🎙', cost: 0, pc: 0, days: 2, d: 'ораторство вирішує: виграш — рейтинг +, програш — −' },
    p_coal:   { n: 'Увійти в коаліцію / вийти', ic: '🤝', cost: 0, pc: 0, days: 10, d: 'у коаліції фракція тягне політику країни до своєї ідеології й отримує посаду міністра' },
    p_bill:   { n: 'Фракційний законопроєкт', ic: '📜', cost: 0, pc: 0.003, days: 14, d: 'шанс = частка місць + коаліція + ваш вплив' },
    p_primary:{ n: 'Висунути лідера в президенти', ic: '👑', cost: 0, pc: 0.02, days: 0, d: 'ви — кандидат від партії: бонус до популярності на виборах' }
  };
  Object.values(G.PARTY).forEach(A => { A.pc = +(A.pc / 400).toFixed(9); });
  G.PARTY_BILLS = {
    center: [['Реформа держслужби', n => { n.stab += 2; }], ['Цифрова держава', n => { n.mods.push({ growth: 0.002, until: G.day + 720 }); }]],
    left:   [['Мінімальна зарплата +', n => { n.pol.soc = Math.min(0.35, n.pol.soc + 0.01); n.stab += 2; }], ['Безкоштовна медицина', n => { n.pol.soc = Math.min(0.35, n.pol.soc + 0.015); n.stab += 3; }]],
    right:  [['Зниження податків', n => { n.pol.tax = Math.max(0.05, n.pol.tax - 0.015); }], ['Посилення поліції й армії', n => { n.pol.mil = Math.min(0.25, n.pol.mil + 0.006); n.stab += 1; }]],
    lib:    [['Дерегуляція бізнесу', n => { n.mods.push({ growth: 0.004, until: G.day + 540 }); n.stab -= 1; }], ['Приватизація держмайна', n => { n.cash += n.agg.gdp * 0.01; n.stab -= 1; }]],
    green:  [['Програма відновлюваної енергії', n => { n.pol.infra = Math.min(0.12, n.pol.infra + 0.006); n.poll = Math.max(0, (n.poll || 0) - 8); }], ['Захист довкілля', n => { n.poll = Math.max(0, (n.poll || 0) - 12); n.mods.push({ growth: -0.001, until: G.day + 365 }); }]],
    nat:    [['Оборонне замовлення', n => { n.pol.mil = Math.min(0.25, n.pol.mil + 0.01); }], ['Підтримка вітчизняного виробника', n => { n.mods.push({ growth: 0.002, until: G.day + 540 }); }]],
    tech:   [['Інвестиції в науку', n => { n.pol.res = Math.min(0.08, n.pol.res + 0.004); }], ['Закон про ШІ й стартапи', n => { n.mods.push({ growth: 0.003, until: G.day + 720 }); }]]
  };
  const partyOf = L => L && L.party ? Object.assign(L.party, { cash: L.party.cash || 0, mem: L.party.mem || 2, br: L.party.br || {}, seats: L.party.seats || 0, ideo: L.party.ideo || 'center' }) : null;
  G.partyOf = partyOf;
  G.partyCan = function (k, arg) {
    const L = G.leader, A = G.PARTY[k]; if (!isChar(L) || !A) return 'Лише для персонажа'; const P = partyOf(L); if (!P) return 'Спершу заснуйте партію'; const nid = nidOf();
    if (L.mv) return 'Персонаж у дорозі'; if (nid !== P.nid) return 'Партія діє в іншій країні — прилетіть туди'; if (A.days && L.busy > G.day) return `Зайнятий ще ${L.busy - G.day} дн.`;
    if (P.cash < A.pc) return `Бракує коштів у касі партії (${G.fmt$(A.pc)})`; const parl = N[nid].parl;
    if (k === 'p_ideo' && !G.IDEOS[arg]) return 'Оберіть ідеологію';
    if (k === 'p_branch') { if (arg == null || ter[arg].ctrl !== nid) return 'Оберіть регіон цієї країни на мапі'; if ((P.br[arg] || 0) >= 3) return 'Осередок уже максимальний'; }
    if (k === 'p_congress' && (P.cong || -999) > G.day - 330) return 'Зʼїзд — раз на рік';
    if (k === 'p_coal') { if (!P.coal && P.seats < (parl ? parl.seats * 0.03 : 12)) return 'Потрібно ≥ 3% місць у парламенті'; }
    if (k === 'p_bill' && !(P.seats > 0)) return 'Потрібні місця в парламенті';
    if (k === 'p_primary') { if (L.cand === nid) return 'Ви вже кандидат'; if (P.r < 8) return 'Потрібен рейтинг партії ≥ 8%'; if (!parl || parl.regime === 'autocracy') return 'Тут немає вільних виборів'; }
    return '';
  };
  G.partyDo = function (k, arg) {
    const e = G.partyCan(k, arg); if (e) return { ok: false, err: e }; const L = G.leader, P = partyOf(L), A = G.PARTY[k], nid = P.nid, n = N[nid]; P.cash -= A.pc; if (A.days) L.busy = G.day + A.days; let msg = '';
    const media = 1 + G.lifeMedia(L) * 0.15 + G.skill(L, 'media') * 0.08, orat = G.skill(L, 'orat');
    if (k === 'p_ideo') { P.ideo = arg; P.r = Math.max(0.5, P.r * 0.85); msg = G.IDEOS[arg].n; }
    if (k === 'p_branch') { P.br[arg] = (P.br[arg] || 0) + 1; P.mem += 1.5; P.r = clamp(P.r + 0.3 + ter[arg].pop / Math.max(1, n.agg.pop) * 4, 0, 45); msg = `${T[arg].n}: осередок рівня ${P.br[arg]}`; }
    if (k === 'p_fund') { const g = 0.000005 + (L.cont[nid] || 0) * 0.0000004 + P.r * 0.000002; P.cash += g; if (g > 0.00006 && G.rnd() < 0.15 - G.lifeSec(L) * 0.01) { P.r = Math.max(0.5, P.r - 2); add(L.popu, nid, -4); msg = 'скандал через олігархічних донорів! рейтинг −2'; } else msg = `каса +${G.fmt$(g)}`; }
    if (k === 'p_ads') { P.r = clamp(P.r + 1.2 * media, 0, 45); msg = `рейтинг ${P.r.toFixed(1)}%`; }
    if (k === 'p_rally') { add(L.popu, nid, 2 + orat * 0.5); P.r = clamp(P.r + 0.4 + orat * 0.1, 0, 45); P.mem += 0.5; if (n.stab < 35 && G.rnd() < 0.25) { n.stab -= 1; msg = 'мітинг переріс у сутички, стабільність −1'; } else msg = 'тисячі прихильників на площі'; }
    if (k === 'p_congress') { P.cong = G.day; P.r = clamp(P.r + 1.5, 0, 45); P.mem += 2; msg = 'нова програма, партія згуртована'; }
    if (k === 'p_debate') { const win = G.rnd() < 0.35 + orat * 0.1 + (L.popu[nid] || 0) / 300; P.r = clamp(P.r + (win ? 1.5 : -1), 0, 45); add(L.popu, nid, win ? 3 : -2); msg = win ? 'перемога в дебатах' : 'поразка в дебатах'; }
    if (k === 'p_coal') { P.coal = !P.coal; if (P.coal) { L.cont[nid] = clamp((L.cont[nid] || 0) + 8, 0, 100); msg = 'фракція в коаліції: міністерський портфель і вплив на політику'; } else { add(L.popu, nid, 3); msg = 'фракція переходить в опозицію'; } }
    if (k === 'p_bill') { const B = pick(G.PARTY_BILLS[P.ideo] || G.PARTY_BILLS.center), share = P.seats / Math.max(1, n.parl.seats); const ch = clamp(share * 1.6 + (P.coal ? 0.3 : 0) + (L.mpInfl || 0) / 200 + G.skill(L, 'law') * 0.04, 0.05, 0.92);
      if (G.rnd() < ch) { B[1](n); P.r = clamp(P.r + 1, 0, 45); add(L.popu, nid, 3); msg = `ухвалено: «${B[0]}»`; } else msg = `провалено: «${B[0]}» (шанс ${Math.round(ch * 100)}%)`; }
    if (k === 'p_primary') { L.cand = nid; L.popu[nid] = clamp((L.popu[nid] || 0) + P.r * 0.4, 0, 100); msg = `кандидат у президенти, вибори ${n.parl ? G.dateStr(n.parl.next) : ''}`; }
    G.say(`${A.ic} ${P.name}: ${msg}`, k === 'p_bill' || k === 'p_coal' ? 'big' : 'info', [nid]); return { ok: true, msg };
  };
  G.partyStart = function (L, nid) { L.party = { nid, name: 'Партія «' + (L.name.split(' ')[1] || L.name) + '»', r: 5, cash: 0.00003, mem: 15, br: {}, seats: 0, ideo: 'center' }; const cap = N[nid].home != null ? N[nid].home : L.at; L.party.br[cap] = 2; L.popu[nid] = 30; L.cont[nid] = 20; L.fame = 8; L.money = Math.max(L.money, 0.03); };
  // місця партії на виборах до парламенту
  { const base = G.careerParlElection; G.careerParlElection = function (nid) { base(nid); const pl = N[nid].parl; if (!pl || pl.next !== G.day + pl.cyc) return; Object.values(G.leaders || {}).forEach(L => { const P = isChar(L) ? partyOf(L) : null; if (!P || P.nid !== nid) return; const parl = N[nid].parl;
      const brB = Object.values(P.br).reduce((s, v) => s + v, 0) * 0.15; const vote = clamp(P.r + brB + (G.rnd() - 0.5) * 2, 0, 60); const brS = Object.values(P.br).reduce((s, v) => s + v, 0); const seats = (vote >= 5 ? Math.round(parl.seats * vote / 100) : 0) + Math.round(brS * (0.6 + G.rnd()) * (1 + (L.popu[nid] || 0) / 60));
      P.seats = seats; if (seats === 0) P.coal = false; if (G.leader === L) G.say(`🗳 ${P.name}: ${vote.toFixed(1)}%${vote < 5 ? ' (нижче 5% барʼєру)' : ''} — ${seats} місць у парламенті (з них мажоритарних ${seats - (vote >= 5 ? Math.round(parl.seats * vote / 100) : 0)})`, 'big', [nid]); }); }; }

  // ---------- ЩОМІСЯЧНО
  G.lifeMonthly = function () {
    G.lifeInit(); const M = G.mkt;
    // ринки: золото росте з кількістю воєн, крипта — випадкове блукання з бульбашками
    const wars = G.wars ? G.wars.size : 0; M.gold *= 1 + (0.003 + wars * 0.002 + (G.rnd() - 0.5) * 0.03); M.gold = clamp(M.gold, 0.4, 6);
    const hype = M.cap > 2 ? 0.02 : 0; let dc = (G.rnd() - 0.48) * 0.22 + hype; if (M.crypto > 3 && G.rnd() < 0.08) dc = -0.45 - G.rnd() * 0.2;
    M.crypto = clamp(M.crypto * (1 + dc), 0.05, 50); if (dc < -0.35) { M.crash++; if (M.cap > 0.05) G.say(`💰 Обвал криптовалют: −${Math.round(-dc * 100)}%`, 'bad', []); if (M.cap > 1) G.worldMod = Object.assign(G.worldMod || {}, { growth: (G.worldMod && G.worldMod.until > G.day ? G.worldMod.growth : 0) - Math.min(0.006, M.cap * 0.001), until: G.day + 180 }); }
    M.cryptoH.push(+M.crypto.toFixed(3)); M.goldH.push(+M.gold.toFixed(3)); if (M.cryptoH.length > 60) { M.cryptoH.shift(); M.goldH.shift(); }
    N.forEach(n => { if (n.fdiG) n.fdiG *= 0.97; });
    Object.values(G.leaders || {}).forEach(L => {
      if (!isChar(L)) return; const home = L.home; const where = L.mv ? -1 : ter[L.at].ctrl;
      // професія: щомісячні ефекти
      if (L.job) { const J = G.JOBS[L.job.k], m = J.m || {}, jn = L.job.nid; if (m.pop) add(L.popu, jn, m.pop); if (m.cont) add(L.cont, jn, m.cont); if (m.fame) L.fame += m.fame; if (m.abroad) N.forEach(x => { if (x.id !== jn && (L.cont[x.id] || 0) > 5) add(L.cont, x.id, m.abroad * 0.3); });
        if (m.fameInc) L.money += L.fame * L.fame * 0.000000004; if (m.varPay) L.money += J.pay * (G.rnd() * 2 - 0.6);
        L.sk = L.sk || {}; L.skx = L.skx || {}; const rk = J.req ? Object.keys(J.req)[0] : null; if (rk) { L.skx[rk] = (L.skx[rk] || 0) + 1; if (L.skx[rk] >= 18 && G.skill(L, rk) < 5) { L.skx[rk] = 0; L.sk[rk] = G.skill(L, rk) + 1; if (G.leader === L) G.say(`🎓 ${L.name}: досвід роботи — ${G.SKILLS[rk].n} рівень ${L.sk[rk]}`, 'good', [jn]); } } }
      if (G.skill(L, 'media')) add(L.popu, home, G.skill(L, 'media') * 0.1);
      // розкіш: утримання, оренда, переоцінка, вплив на популярність і звʼязки
      let showoff = 0;
      (L.own || []).forEach(o => { const A = G.LUX[o.k], n = N[o.nid]; L.money -= o.p0 * (A.upk || 0) / 12; if (A.rent) L.money += o.v * A.rent / 12 * (n && G.enemiesOf(n.id).length ? 0.5 : 1);
        if (A.apr) o.v *= 1 + ((n ? n.growth || 0 : 0) * A.apr + (A.c === 'art' ? 0.004 : 0) + (G.rnd() - 0.5) * 0.01) / 12 * 12 / 12; else o.v *= 0.995;
        if (A.pop) add(L.popu, o.nid, A.pop); if (A.cont) add(L.cont, o.nid, A.cont); if ((A.pop || 0) < 0) showoff += -A.pop; });
      if (showoff && where >= 0 && (N[where].pc || 0) < 15000 && G.rnd() < showoff * (1 - G.lifeSec(L) * 0.1) * (L.lawShield > G.day ? 0.4 : 1)) { add(L.popu, where, -3 + G.skill(L, 'media') * 0.4); if (G.leader === L) G.say(`📰 Скандал: ЗМІ пишуть про розкішне життя ${L.name} — популярність падає`, 'bad', [where]); }
      // інвестиції
      const I = L.pf; if (I) { const eco = 1 + G.skill(L, 'eco') * 0.08;
        Object.entries(I.b).forEach(([k, v]) => { const nid = +k, n = N[nid]; if (!n || !v) return; L.money += v * G.bondYield(nid) * eco / 12; n.cash -= v * G.bondYield(nid) / 12;
          if (n.stab < 20 && (n.debt || 0) > n.agg.gdp * 1.2 && G.rnd() < 0.03) { I.b[k] = v * 0.4; if (G.leader === L) G.say(`💥 Дефолт ${n.name}: облігації втратили 60%`, 'bad', [nid]); } });
        I.v = I.v.filter(x => { if (G.day < x.end) return true; const r = G.rnd() - G.skill(L, 'tech') * 0.03; const mul = r < 0.6 ? 0 : r < 0.85 ? 1 + G.rnd() * 2 : r < 0.95 ? 3 + G.rnd() * 5 : 10 + G.rnd() * 25; const got = x.amt * mul; L.money += got;
          if (mul >= 3 && N[x.nid]) N[x.nid].fdiG = Math.min(0.01, (N[x.nid].fdiG || 0) + got / Math.max(5, N[x.nid].agg.gdp)); if (G.leader === L) G.say(`🚀 Стартап «${x.name}»: ${mul === 0 ? 'збанкрутував' : '×' + mul.toFixed(1) + ' — отримано $' + (got * 1000).toFixed(1) + ' млн'}`, mul >= 3 ? 'big' : mul ? 'info' : 'bad', []); if (mul >= 10) L.fame += 3; return false; });
        I.d.forEach(x => { const n = N[ter[x.t].owner]; const y = clamp(0.06 + (n ? n.growth || 0 : 0), -0.05, 0.2) * eco; L.money += x.amt * y / 12; if (ter[x.t].ctrl !== ter[x.t].owner) x.amt *= 0.97; }); }
      // партія: члени, внески, вплив на політику країни
      const P = partyOf(L); if (P) { P.r = clamp(P.r + Object.values(P.br).reduce((s, v) => s + v, 0) * 0.015, 0, 45); P.cash += P.mem * 0.0000003 + P.seats * 0.0000004; P.mem = Math.max(1, P.mem + (P.r - 3) * 0.05); const n = N[P.nid];
        if (P.coal && P.seats > 0 && n) { const I2 = G.IDEOS[P.ideo] || G.IDEOS.center, sh = P.seats / Math.max(1, n.parl.seats); Object.entries(I2.pol).forEach(([k, v]) => { n.pol[k] = clamp((n.pol[k] || 0) + v * sh, k === 'tax' ? 0.05 : 0, k === 'tax' ? 0.6 : k === 'soc' ? 0.35 : k === 'mil' ? 0.25 : 0.12); }); P.r = clamp(P.r - 0.05, 0, 45); add(L.cont, P.nid, 0.5); }
        if (!P.coal && P.seats > 0) P.r = clamp(P.r + 0.05, 0, 45); }
    });
  };
  // стартові етапи: партія
  { const base = G.initCareer; G.initCareer = function (o) { base(o); const L = G.leader; if (!L) return; L.sk = Object.assign(L.sk || {}, { owner: { biz: 2, eco: 1 }, mp: { law: 1, orat: 1 }, party: { orat: 1, media: 1 } }[o.stage] || {}); if (o.stage === 'party') { G.partyStart(L, L.home); G.say(`🎗 ${L.name} очолює ${L.party.name}: попереду вибори до парламенту`, 'big', [L.home]); } }; }
  G.act.lifeStudy = k => G.lifeStudy(k);
  G.act.gigDo = k => G.gigDo(k);
  G.act.luxBuy = k => G.luxBuy(k);
  G.act.luxSell = i => G.luxSell(i);
  G.act.invest = (k, a) => G.invest(k, a);
  G.act.invSell = (k, n) => G.invSell(k, n);
  G.act.partyDo = (k, a) => G.partyDo(k, a);
});
