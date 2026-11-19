// v3.1 (A): ДАЧА-ФЕРМА (насіння, сезони, полив, шкідники, урожай, ринок, тварини, теплиця), ДІМ (5 рівнів, кімнати),
// УЛЮБЛЕНЦІ, НОВІ ІНВЕСТИЦІЇ (депозит, фонд нерухомості, P2P, NFT, «піраміда»), РОЗШИРЕНА ДОХІДНА НЕРУХОМІСТЬ.
// Усі гроші — у $ млрд, ціни реалістичні: насіння — долари, будинок — тисячі, маєток — мільйони.
LORA.sim.register('v31a', 99.992, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)]; const R = () => G.rnd();
  const $ = v => v / 1e9; const can = L => L && L.money != null; const f$ = v => G.fmt$(v);
  const add = (o, k, v) => { if (!o) return; o[k] = clamp((o[k] || 0) + v, 0, 100); };
  const month = () => (G.month ? G.month() : 0);
  // ================= ФЕРМА =================
  // seed — ціна насіння на ділянку; days — до врожаю; kg — урожай з ділянки; px — ціна за кг на ринку; m — місяці посадки (0 = січень)
  G.CROPS = {
    potato: { n: 'Картопля', ic: '🥔', seed: 15, days: 95, kg: 120, px: 0.45, m: [2, 3, 4], pest: 'колорадський жук' },
    tomato: { n: 'Помідори', ic: '🍅', seed: 12, days: 75, kg: 60, px: 1.3, m: [3, 4] },
    cucumber: { n: 'Огірки', ic: '🥒', seed: 8, days: 55, kg: 55, px: 1.0, m: [3, 4, 5] },
    carrot: { n: 'Морква', ic: '🥕', seed: 6, days: 85, kg: 80, px: 0.6, m: [2, 3, 4, 5] },
    cabbage: { n: 'Капуста', ic: '🥬', seed: 10, days: 100, kg: 110, px: 0.4, m: [2, 3, 4], pest: 'гусінь' },
    pumpkin: { n: 'Гарбуз', ic: '🎃', seed: 5, days: 120, kg: 150, px: 0.35, m: [3, 4] },
    strawberry: { n: 'Полуниця', ic: '🍓', seed: 30, days: 65, kg: 20, px: 4.5, m: [2, 3, 7] },
    garlic: { n: 'Часник', ic: '🧄', seed: 25, days: 140, kg: 15, px: 5.5, m: [8, 9, 2] },
    sunflower: { n: 'Соняшник', ic: '🌻', seed: 5, days: 110, kg: 40, px: 0.9, m: [3, 4] },
    watermelon: { n: 'Кавуни', ic: '🍉', seed: 12, days: 95, kg: 90, px: 0.7, m: [3, 4] },
    pepper: { n: 'Перець', ic: '🌶', seed: 15, days: 85, kg: 25, px: 3.2, m: [3, 4] },
    herbs: { n: 'Зелень', ic: '🌿', seed: 4, days: 30, kg: 6, px: 9, m: [2, 3, 4, 5, 6, 7, 8] },
    mushroom: { n: 'Гриби (в погребі)', ic: '🍄', seed: 20, days: 40, kg: 12, px: 6, m: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], cellar: 1 }
  };
  const S = () => G.v29s('farm', () => ({ px: {} }));
  G.cropPx = k => { const P = S(); if (P.px[k] == null) P.px[k] = 1; return G.CROPS[k].px * P.px[k]; };
  const farm = L => { L.farm = L.farm || { plots: [], inv: {}, ani: {}, gh: 0, fert: 0, sotky: 6 }; return L.farm; };
  const maxPlots = L => Math.floor(farm(L).sotky / 1.5) + (L.house ? L.house.lvl : 0);
  G.farmState = () => { const L = G.leader; if (!can(L)) return null; const F = farm(L); return { F, max: maxPlots(L), px: Object.fromEntries(Object.keys(G.CROPS).map(k => [k, G.cropPx(k)])) }; };
  G.cropCan = k => { const L = G.leader, C = G.CROPS[k]; if (!can(L) || !C) return '?'; const F = farm(L); if (F.plots.length >= maxPlots(L)) return `Усі ділянки зайняті (${maxPlots(L)}) — прикупіть сотки або зберіть урожай`;
    const south = T[L.at] && T[L.at].c[1] < 0; const m = south ? (month() + 6) % 12 : month(); if (C.cellar && !(L.house && L.house.lvl >= 2)) return 'Потрібен погріб (будинок рівня 2+)'; if (!C.m.includes(m) && !F.gh) return 'Не сезон — потрібна теплиця'; if (L.money < $(C.seed)) return 'Бракує грошей'; return ''; };
  G.cropPlant = function (k) { const e = G.cropCan(k); if (e) return { ok: false, err: e }; const L = G.leader, C = G.CROPS[k], F = farm(L); L.money -= $(C.seed); F.plots.push({ k, d: G.day, ready: G.day + C.days, w: 0, pest: 0 });
    return { ok: true, msg: `посаджено ${C.ic} ${C.n.toLowerCase()} (насіння ${f$($(C.seed))}). Урожай через ${C.days} дн. ${pick(['Сусід уже заздрить', 'Бабуся сказала, що садите неправильно', 'Кріт стежить за вами'])}` }; };
  G.farmWater = function () { const L = G.leader, F = farm(L); if (!F.plots.length) return { ok: false, err: 'Нічого поливати' }; F.plots.forEach(p => p.w = Math.min(3, p.w + 1)); return { ok: true, msg: pick(['полили все. Шланг двічі втікав', 'полили. Заодно й сусідського кота', 'полили з лійки — як справжній агроном']) }; };
  G.farmSpray = function () { const L = G.leader, F = farm(L); if (L.money < $(20)) return { ok: false, err: 'Бракує грошей' }; L.money -= $(20); let n = 0; F.plots.forEach(p => { if (p.pest) { p.pest = 0; n++; } p.safe = G.day + 60; }); return { ok: true, msg: n ? `шкідників переможено на ${n} ділянках` : 'обробили про всяк випадок. Жуки обурені' }; };
  G.farmHarvest = function () {
    const L = G.leader, F = farm(L); const rd = F.plots.filter(p => G.day >= p.ready); if (!rd.length) return { ok: false, err: 'Ще нічого не достигло' }; let out = [];
    rd.forEach(p => { const C = G.CROPS[p.k]; let kg = C.kg * (0.75 + p.w * 0.12 + R() * 0.3) * (p.pest ? 0.55 : 1) * (F.fert > G.day ? 1.3 : 1); if (p.k === 'pumpkin' && R() < 0.08) { kg += 600; out.push('🎃 ГІГАНТСЬКИЙ гарбуз на 600 кг!'); }
      kg = Math.round(kg); F.inv[p.k] = (F.inv[p.k] || 0) + kg; out.push(`${C.ic} ${kg} кг`); });
    F.plots = F.plots.filter(p => G.day < p.ready); return { ok: true, msg: 'урожай: ' + out.join(', ') };
  };
  G.farmSell = function (mul, where) { const L = G.leader, F = farm(L); let v = 0, kg = 0; for (const k in F.inv) { v += F.inv[k] * G.cropPx(k) * mul; kg += F.inv[k]; F.inv[k] = 0; }
    for (const a in F.prod || {}) { v += F.prod[a] * mul; F.prod[a] = 0; }
    if (v <= 0) return { ok: false, err: 'Нічого продавати' }; L.money += $(v); return { ok: true, msg: `${where}: продано ${kg} кг і продукцію на ${f$($(v))}. ${pick(['Покупці хвалять смак', 'Одна бабуся торгувалася 40 хвилин', 'Ваш кабачок купив шеф-кухар ресторану', 'Знайомий сказав, що «в магазині дешевше». Не дешевше'])}` }; };
  G.FARM_SHOP = {
    gh: { n: 'Теплиця', ic: '🏠', c: 900, d: 'садити можна цілий рік', run: F => { if (F.gh) return 'теплиця вже є'; F.gh = 1; return 'теплиця стоїть! Помідори в січні — тепер реальність'; } },
    sotky: { n: 'Прикупити 2 сотки', ic: '📐', c: 2500, d: '+1 ділянка (до 30 соток)', run: F => { if (F.sotky >= 30) return 'більше землі не продають — сусіди проти'; F.sotky += 2; return `тепер у вас ${F.sotky} соток. Межу позначили кілочками й котом`; } },
    fert: { n: 'Добрива на сезон', ic: '🧪', c: 60, d: 'урожай +30% пів року', run: F => { F.fert = G.day + 180; return 'добрива внесено. Пахне… прогресом'; } },
    hen: { n: 'Курка-несучка', ic: '🐔', c: 15, d: '≈20 яєць на місяць', run: F => { F.ani.hen = (F.ani.hen || 0) + 1; return `курок: ${F.ani.hen}. Півень дивиться скептично`; } },
    hive: { n: 'Вулик з бджолами', ic: '🐝', c: 220, d: 'мед влітку', run: F => { F.ani.hive = (F.ani.hive || 0) + 1; return 'бджоли оселилися. Одна вже вкусила сусіда'; } },
    goat: { n: 'Коза', ic: '🐐', c: 160, d: 'молоко й сир; їсть усе', run: F => { F.ani.goat = (F.ani.goat || 0) + 1; return 'коза приїхала й одразу з’їла табличку «Не годувати козу»'; } },
    cow: { n: 'Корова', ic: '🐄', c: 1200, d: 'молоко щодня, але й турбот багато', run: F => { F.ani.cow = (F.ani.cow || 0) + 1; return 'корова Зірка вже дає молоко і дивиться на вас з повагою'; } }
  };
  G.farmBuy = function (k) { const L = G.leader, I = G.FARM_SHOP[k]; if (!can(L) || !I) return { ok: false, err: '?' }; if (L.money < $(I.c)) return { ok: false, err: 'Бракує грошей' }; const F = farm(L); const msg = I.run(F); if (!/вже|більше/.test(msg)) L.money -= $(I.c); return { ok: true, msg }; };
  function farmMonthly() {
    const P = S(); for (const k in G.CROPS) P.px[k] = clamp((P.px[k] || 1) * (0.9 + R() * 0.2), 0.6, 1.6);
    const L = G.leader; if (!can(L) || !L.farm) return; const F = L.farm; const m = month();
    F.plots.forEach(p => { p.w = Math.max(0, p.w - 1); const C = G.CROPS[p.k]; if (C.pest && !p.pest && (p.safe || 0) < G.day && R() < 0.2) { p.pest = 1; G.say(`🐛 Дача: на ділянці з ${C.n.toLowerCase()} — ${C.pest}! Треба обробити`, 'bad', [L.home]); } });
    F.prod = F.prod || {}; const A = F.ani; if (A.hen) F.prod.eggs = (F.prod.eggs || 0) + A.hen * 20 * 0.15; if (A.goat) F.prod.goat = (F.prod.goat || 0) + A.goat * 30; if (A.cow) F.prod.cow = (F.prod.cow || 0) + A.cow * 180; if (A.hive && m >= 5 && m <= 7) F.prod.honey = (F.prod.honey || 0) + A.hive * 10 * 8;
    const feed = (A.hen || 0) * 1 + (A.goat || 0) * 10 + (A.cow || 0) * 60; if (feed) L.money = Math.max(0, L.money - $(feed));
    if (R() < 0.15 && (A.goat || A.hen || A.cow)) G.say('🐐 ' + pick(['Коза втекла й з’їла квіти в сусіда. Сусід вимагає компенсацію морквою', 'Курка знесла яйце з подвійним жовтком. Вся вулиця приходила дивитися', 'Корова Зірка дивилася на захід сонця 40 хвилин. Сусіди думають, що вона медитує', 'Півень почав кукурікати о 3:40. Сусіди пишуть петицію']), 'info', [L.home]);
  }

  // ================= ДІМ =================
  G.HOUSE = [null,
    { n: 'Хатинка', ic: '🏚', c: 35000, upk: 60 }, { n: 'Будинок', ic: '🏠', c: 120000, upk: 180 }, { n: 'Котедж', ic: '🏡', c: 420000, upk: 500 },
    { n: 'Особняк', ic: '🏘', c: 1800000, upk: 2000 }, { n: 'Маєток', ic: '🏰', c: 12000000, upk: 12000 }];
  G.houseBuy = function (lv) { const L = G.leader, H = G.HOUSE[lv]; if (!can(L) || !H) return { ok: false, err: '?' }; const cur = L.house ? L.house.lvl : 0; if (lv <= cur) return { ok: false, err: 'У вас уже такий або кращий' };
    const credit = cur ? G.HOUSE[cur].c * 0.85 : 0; const cost = $(H.c - credit); if (L.money < cost) return { ok: false, err: `Потрібно ${f$(cost)} (старий дім іде в залік)` }; L.money -= cost; L.house = { lvl: lv, reg: L.at, d: G.day }; L.fame += lv >= 4 ? 1 : 0;
    return { ok: true, msg: `${H.ic} ${H.n} — ваш! ${pick(['Ріелтор плакав від щастя', 'Перша ніч — на коробках', 'Кіт уже обрав найкраще місце'])}`, fx: 'jackpot' }; };
  G.h29.m.push(() => { const L = G.leader; if (can(L) && L.house) { L.money = Math.max(0, L.money - $(G.HOUSE[L.house.lvl].upk)); L.hp = clamp((L.hp || 80) + L.house.lvl * 0.6, 0, 100); L.mood = clamp((L.mood || 60) + L.house.lvl * 0.5, 0, 100); } });

  // ================= УЛЮБЛЕНЦІ =================
  G.PETS = {
    cat: { n: 'Кіт', ic: '🐈', c: 50, eat: 25, b: { mood: 2 }, d: 'настрій +2/міс., часом сідає на документи' },
    dog: { n: 'Пес', ic: '🐕', c: 300, eat: 60, b: { mood: 2, hp: 1 }, d: 'настрій і здоровʼя, гарний охоронець' },
    parrot: { n: 'Папуга', ic: '🦜', c: 200, eat: 15, b: { fame: 0.1 }, d: 'повторює фрази. Іноді не ті' },
    hamster: { n: 'Хом’як', ic: '🐹', c: 10, eat: 5, b: { mood: 1 }, d: 'інвестує краще за брокерів (жарт)' },
    capy: { n: 'Капібара', ic: '🦦', c: 3000, eat: 80, b: { mood: 3, popu: 0.3 }, d: 'найспокійніша тварина світу; люди в захваті', house: 2 },
    raccoon: { n: 'Єнот', ic: '🦝', c: 500, eat: 40, b: { mood: 2 }, d: 'краде печиво й серця' },
    fox: { n: 'Лис', ic: '🦊', c: 800, eat: 50, b: { fame: 0.1, mood: 1 }, d: 'хитрий, як ваш політтехнолог' },
    horse: { n: 'Кінь', ic: '🐴', c: 20000, eat: 600, b: { fame: 0.3, hp: 1 }, d: 'статус і прогулянки верхи', house: 4 },
    penguin: { n: 'Пінгвін', ic: '🐧', c: 60000, eat: 900, b: { fame: 0.5, popu: 0.5 }, d: 'потрібен басейн; зірка соцмереж', house: 4 },
    turtle: { n: 'Черепаха', ic: '🐢', c: 80, eat: 5, b: { hp: 1 }, d: 'живе 100 років, нікуди не поспішає' }
  };
  const PNAME = ['Барсик', 'Мурка', 'Бублик', 'Пиріжок', 'Генерал', 'Бюджет', 'Реформа', 'Сенатор', 'Пончик', 'Кекс', 'Компот', 'Мер'];
  G.petBuy = function (k) { const L = G.leader, P = G.PETS[k]; if (!can(L) || !P) return { ok: false, err: '?' }; L.pets = L.pets || []; if (L.pets.length >= 6) return { ok: false, err: 'Досить тварин — у вас уже зоопарк' }; if (P.house && !(L.house && L.house.lvl >= P.house)) return { ok: false, err: `Потрібен дім рівня ${P.house}+` };
    if (L.money < $(P.c)) return { ok: false, err: 'Бракує грошей' }; L.money -= $(P.c); const nm = pick(PNAME); L.pets.push({ k, name: nm, joy: 80, d: G.day }); return { ok: true, msg: `${P.ic} ${P.n} ${nm} тепер з вами! ${pick(['Перше, що зробив, — ліг на ваше місце', 'Уже підкорив охорону', 'Позує для фото як професіонал'])}`, fx: 'heart' }; };
  G.petPlay = function () { const L = G.leader; if (!L || !L.pets || !L.pets.length) return { ok: false, err: 'Немає улюбленців' }; L.pets.forEach(p => p.joy = clamp(p.joy + 25, 0, 100)); L.mood = clamp((L.mood || 60) + 8, 0, 100);
    const p = pick(L.pets); return { ok: true, msg: `${G.PETS[p.k].ic} ${p.name}: ${pick(['приніс вам тапок. Свій', 'показав новий трюк — «мертвий бюджет»', 'заснув на вас посеред гри', 'з’їв шнурок і щасливий'])}` }; };
  G.h29.m.push(() => { const L = G.leader; if (!can(L) || !L.pets || !L.pets.length) return; let feed = 0; L.pets.forEach(p => { const P = G.PETS[p.k]; feed += P.eat; p.joy = clamp(p.joy - 12, 0, 100); const k = p.joy / 100;
      if (P.b.mood) L.mood = clamp((L.mood || 60) + P.b.mood * k, 0, 100); if (P.b.hp) L.hp = clamp((L.hp || 80) + P.b.hp * k, 0, 100); if (P.b.fame) L.fame += P.b.fame * k; if (P.b.popu) add(L.popu = L.popu || {}, L.home, P.b.popu * k); });
    L.money = Math.max(0, L.money - $(feed)); if (R() < 0.3) { const p = pick(L.pets), P = G.PETS[p.k]; G.say(`${P.ic} ${p.name}: ${pick(['з’явився в новинах — сів на мікрофон під час інтерв’ю', 'набрав мільйон підписників. Більше, ніж ви', 'скинув вазу. Ваза була подарунком посла', 'заснув у валізі — довелося взяти в поїздку', 'вкрав сосиску з банкету. Суд відклали', 'повторив на брифінгу «без коментарів». Журналісти в захваті'])}`, 'info', [L.home]); } });

  // ================= ІНВЕСТИЦІЇ 2 =================
  G.INV2 = {
    dep: { n: 'Банківський депозит', ic: '🏦', d: '≈4% річних, без ризику (майже)', min: 100 },
    reit: { n: 'Фонд нерухомості (REIT)', ic: '🏢', d: '≈7% річних, ціна коливається з економікою', min: 500 },
    p2p: { n: 'P2P-позики', ic: '🤝', d: '≈15% річних, але частина боржників зникає', min: 200 },
    nft: { n: 'NFT з котиками', ic: '🖼', d: 'або ×10, або ×0.05. Переважно друге', min: 50 },
    mmm: { n: 'Фонд «Гарантований Успіх»', ic: '🔺', d: '+20% щомісяця! (це піраміда — колись обвалиться)', min: 100 }
  };
  const pf2 = L => { L.pf2 = L.pf2 || { dep: 0, reit: 0, p2p: 0, nft: 0, mmm: 0, nftPx: 1 }; return L.pf2; };
  G.inv2Val = L => { if (!L || !L.pf2) return 0; const P = L.pf2; return P.dep + P.reit + P.p2p + P.nft * P.nftPx + P.mmm; };
  G.inv2Do = function (k, amt) { const L = G.leader, I = G.INV2[k]; if (!can(L) || !I) return { ok: false, err: '?' }; amt = +amt; if (!(amt >= $(I.min))) return { ok: false, err: `Мінімум ${f$($(I.min))}` }; if (L.money < amt) return { ok: false, err: 'Бракує грошей' };
    const P = pf2(L); L.money -= amt; if (k === 'nft') P.nft += amt / P.nftPx; else P[k] += amt; return { ok: true, msg: `${I.ic} ${I.n}: вкладено ${f$(amt)}${k === 'mmm' ? '. Ведучий семінару обійняв вас і назвав «партнером»' : ''}` }; };
  G.inv2Sell = function (k) { const L = G.leader; const P = L && L.pf2; if (!P) return { ok: false, err: '?' }; let v = k === 'nft' ? P.nft * P.nftPx : P[k]; if (!(v > 0)) return { ok: false, err: 'Нічого продавати' };
    if (k === 'mmm' && R() < 0.3) { P.mmm = 0; return { ok: true, msg: 'офіс фонду зачинено. На дверях — записка «Пішли на обід. Назавжди»' }; } if (k === 'p2p') v *= 0.95; if (k === 'nft') P.nft = 0; else P[k] = 0; L.money += v; return { ok: true, msg: `отримано ${f$(v)}` }; };
  G.h29.m.push(() => { const L = G.leader; if (!L || !L.pf2) return; const P = L.pf2, n = N[L.home]; const g = n ? (n.growth || 0) : 0;
    P.dep *= 1 + 0.04 / 12; P.reit *= 1 + (0.06 + g * 2) / 12 + (R() - 0.5) * 0.02; P.p2p *= 1 + 0.15 / 12; if (P.p2p > 0 && R() < 0.12) { const loss = P.p2p * (0.05 + R() * 0.15); P.p2p -= loss; G.say(`🤝 P2P: позичальник «зник з радарів» разом з ${f$(loss)}. Остання публікація — пляж на Балі`, 'bad', [L.home]); }
    P.nftPx = clamp(P.nftPx * (R() < 0.1 ? 3 + R() * 4 : 0.75 + R() * 0.25), 0.01, 50);
    if (P.mmm > 0) { if (R() < 0.12) { const lost = P.mmm; P.mmm = 0; G.say(`🔺 Фонд «Гарантований Успіх» зник разом із ${f$(lost)}. Засновник надіслав листівку з Мальдів`, 'bad', [L.home]); } else P.mmm *= 1.2; } });

  // ================= ДОХІДНА НЕРУХОМІСТЬ: нові типи й керуючі =================
  if (G.ESTATE) Object.assign(G.ESTATE, {
    carwash: { n: 'Автомийка', ic: '🚿', c: 0.00008, inc: 0.0000045, d: 'взимку та після дощу — аншлаг' },
    sto: { n: 'СТО', ic: '🔧', c: 0.00012, inc: 0.000006, d: '«Ми лише гляньмо» — і рахунок на $800' },
    bakery: { n: 'Пекарня', ic: '🥐', c: 0.00009, inc: 0.0000055, d: 'зранку черга, звʼязки +1', cont: 1 },
    flowers: { n: 'Квітковий магазин', ic: '💐', c: 0.00004, inc: 0.0000028, d: '14 лютого і 8 березня — золоті дні' },
    barber: { n: 'Барбершоп', ic: '💈', c: 0.00005, inc: 0.000003, d: 'плітки міста й популярність +1', popu: 1 },
    cowork: { n: 'Коворкінг', ic: '🧑‍💻', c: 0.0004, inc: 0.000018, d: 'айтішники платять за каву й тишу' },
    hostel: { n: 'Хостел', ic: '🛏', c: 0.0003, inc: 0.000014, d: 'туристи з усього світу (і їхні шкарпетки)' },
    solar: { n: 'Сонячна станція', ic: '☀', c: 0.0015, inc: 0.00002, d: 'стабільний «зелений» тариф' },
    mall2: { n: 'Торговий центр', ic: '🏬', c: 0.02, inc: 0.00015, d: 'великі гроші, великі проблеми' }
  });
  G.estateMgr = function (id) { const L = G.leader; const p = L && (L.estate || []).find(x => x.id === id); if (!p) return { ok: false, err: '?' }; if (p.mgr) return { ok: false, err: 'Керуючий уже є' }; const fee = G.ESTATE[p.k].inc * 2; if (L.money < fee) return { ok: false, err: 'Бракує грошей' };
    L.money -= fee; p.mgr = G.fakeName(); return { ok: true, msg: `керуючий ${p.mgr}: дохід +25%, менше проблем. ${pick(['Перший день — переставив усі стільці', 'Одразу запровадив дрес-код', 'Найняв свою тещу. Вона прекрасна'])}` }; };
  G.h29.m.push(() => { const L = G.leader; if (!can(L) || !L.estate) return; L.estate.forEach(p => { if (p.mgr) L.money += G.ESTATE[p.k].inc * p.lvl * 0.25 - G.ESTATE[p.k].inc * 0.1; }); });

  G.act.cropPlant = k => G.cropPlant(k); G.act.farmWater = () => G.farmWater(); G.act.farmSpray = () => G.farmSpray(); G.act.farmHarvest = () => G.farmHarvest(); G.act.farmSell = (m, w) => G.farmSell(m || 1, w || 'Ринок'); G.act.farmBuy = k => G.farmBuy(k);
  G.act.houseBuy = lv => G.houseBuy(lv); G.act.petBuy = k => G.petBuy(k); G.act.petPlay = () => G.petPlay(); G.act.inv2Do = (k, a) => G.inv2Do(k, a); G.act.inv2Sell = k => G.inv2Sell(k); G.act.estateMgr = id => G.estateMgr(id);
  G.h29.m.push(farmMonthly);
  // статки враховують нові активи
  if (G.lifeWealth) { const b = G.lifeWealth; G.lifeWealth = L => b(L) + G.inv2Val(L) + (L && L.house ? G.HOUSE[L.house.lvl].c / 1e9 * 0.9 : 0) + (L && L.estate ? L.estate.reduce((s, p) => s + G.ESTATE[p.k].c * (0.6 + p.lvl * 0.2), 0) : 0); }
});
