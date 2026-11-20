// v3.4: баланс економіки персонажа, активні підвищення на роботі, бюджет (доходи й витрати), ціни в магазинах міста.
LORA.sim.register('v34', 99.996, function (G) {
  if (!G.LOCS || !G.JOBS) return;
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)]; const R = () => G.rnd();
  const $ = v => v / 1e9; const f$ = v => G.fmt$(v); const sk = (L, k) => G.skill ? G.skill(L, k) : 0;

  // ================= 1. ДОХІДНА НЕРУХОМІСТЬ: реалістична віддача (≈12–25% річних замість ≈100%) =================
  const RATE = { kiosk: 0.02, cafe: 0.018, bar: 0.018, gym: 0.016, club: 0.018, hotel: 0.012, parking: 0.01, media: 0.01, tower: 0.008,
    carwash: 0.018, sto: 0.018, bakery: 0.018, flowers: 0.02, barber: 0.018, cowork: 0.014, hostel: 0.015, solar: 0.011, mall2: 0.01 };
  for (const k in G.ESTATE) G.ESTATE[k].inc = G.ESTATE[k].c * (RATE[k] || 0.015) * 0.7;
  G.estateInc = p => G.ESTATE[p.k].inc * (1 + ((p.lvl || 1) - 1) * 0.5);

  // ================= 2. ЦІНИ В НАЗВАХ І КНОПКАХ =================
  const C = G.LOCS.city.places;
  const setPrice = (A, p) => { if (A && !A.c && p) A.price = p; };
  for (const l in G.LOCS) for (const k in G.LOCS[l].places) for (const a in G.LOCS[l].places[k].acts) { const A = G.LOCS[l].places[k].acts[a];
    if (A.lux && G.LUX[A.lux]) setPrice(A, G.LUX[A.lux].p);
    if (A.est && G.ESTATE[A.est]) setPrice(A, G.ESTATE[A.est].c); }
  if (C.agency) { const A0 = C.agency.acts;
    for (const k in G.ESTATE) if (A0[k]) { const E = G.ESTATE[k]; A0[k].est = k; A0[k].price = E.c; A0[k].n = `Купити: ${E.n} — ${f$(E.c)} (дохід ≈ ${f$(E.inc)}/міс.)`; }
    for (let i = 1; i <= 5; i++) if (A0['h' + i] && G.HOUSE[i]) A0['h' + i].price = $(G.HOUSE[i].c); }
  if (C.petshop) for (const a in C.petshop.acts) if (G.PETS[a]) C.petshop.acts[a].price = $(G.PETS[a].c);
  const D = G.LOCS.dacha.places;
  if (D.shop) for (const a in D.shop.acts) if (G.FARM_SHOP[a]) D.shop.acts[a].price = $(G.FARM_SHOP[a].c);
  if (D.garden) for (const a in D.garden.acts) if (/^p_/.test(a) && G.CROPS[a.slice(2)]) D.garden.acts[a].price = $(G.CROPS[a.slice(2)].seed);
  if (D.garden && D.garden.acts.spray) D.garden.acts.spray.price = $(20);
  const AP = G.LOCS.airport && G.LOCS.airport.places;
  if (AP && AP.gate) { if (AP.gate.acts.vacation) AP.gate.acts.vacation.price = $(3000); if (AP.gate.acts.weekend) AP.gate.acts.weekend.price = $(700); }
  G.actPrice = A => A ? (A.c || A.price || 0) : 0;

  // ================= 3. ПІДРОБІТКИ: раз на день, весілля й випускні — раз на тиждень =================
  const WEEKLY = { photo: 1, dj: 1, extra: 1 };
  const baseCan = G.locCan, baseDo = G.locDo;
  G.locCan = function (loc, k, a) {
    const e = baseCan(loc, k, a); if (e) return e; const L = G.leader; if (!L || !L.city) return e;
    if (loc === 'city' && k === 'jobs') { const A = C.jobs.acts[a]; if (A && A.tab !== 'long') {
      if ((L.city.dn || {})['jobs.' + a]) return 'Сьогодні вже працювали на цьому підробітку — приходьте завтра';
      if (WEEKLY[a] && L.gigW && L.gigW[a] > G.day - 7) return `Таке замовлення буває раз на тиждень (ще ${L.gigW[a] + 7 - G.day} дн.)`;
      if ((L.city.gigs || 0) >= (L.job ? 1 : 2)) return L.job ? 'Ви ж працюєте: на день — лише один підробіток після роботи' : 'Сьогодні вже два підробітки — сили закінчились'; } }
    if (loc === 'city' && k === 'work') { const A = C.work.acts[a]; if (A && A.daily && (L.city.dn || {})['work.' + a]) return 'Сьогодні вже було — завтра'; }
    return '';
  };
  G.locDo = function (loc, k, a) {
    const L = G.leader, m0 = L ? L.money : 0; const r = baseDo(loc, k, a);
    if (r && r.ok && L && L.city) { L.city.dn = L.city.dn || {}; L.city.dn[k + '.' + a] = 1;
      if (loc === 'city' && k === 'jobs' && C.jobs.acts[a] && C.jobs.acts[a].tab !== 'long') { L.city.gigs = (L.city.gigs || 0) + 1; if (WEEKLY[a]) (L.gigW = L.gigW || {})[a] = G.day; L.hp = clamp((L.hp || 80) - 2, 0, 100); }
      led(L, 'city', L.money - m0); }
    return r;
  };
  G.cityCan = (k, a) => G.locCan('city', k, a); G.cityDo = (k, a) => G.locDo('city', k, a);
  G.act.cityDo = (k, a) => G.locDo('city', k, a); G.act.locDo = (loc, k, a) => G.locDo(loc, k, a);

  // ================= 4. АКТИВНІ ПІДВИЩЕННЯ ДЛЯ ВСІХ ПРОФЕСІЙ =================
  // [навичка, складне завдання, спецдія професії, назва атестації]
  const JF = {
    lawyer: ['law', 'Підготувати позов на 80 сторінок', 'Захистити клієнта на засіданні', 'Кваліфікаційний іспит адвоката'],
    journalist: ['media', 'Написати розслідування', 'Взяти інтервʼю в міністра', 'Атестація в редакції'],
    officer: ['mil', 'Провести навчання підрозділу', 'Нічне чергування в частині', 'Іспит на чергове звання'],
    manager: ['biz', 'Врятувати провальний проєкт', 'Переговори з великим клієнтом', 'Оцінка ради директорів'],
    scientist: ['sci', 'Поставити складний експеримент', 'Виступ на конференції', 'Захист дисертації'],
    doctor: ['sci', 'Складна операція', 'Нічне чергування в лікарні', 'Атестація на категорію'],
    engineer: ['tech', 'Розрахувати міст, щоб не впав', 'Аварійний виклик на обʼєкт', 'Атестація інженера'],
    programmer: ['tech', 'Закрити критичний баг у продакшені', 'Нічний реліз', 'Технічна співбесіда на сеньйора'],
    banker: ['eco', 'Закрити велику угоду', 'Нічний звіт для регулятора', 'Оцінка ризик-комітету'],
    economist: ['eco', 'Прогноз інфляції (який збудеться)', 'Коментар для телебачення', 'Атестація аналітика'],
    diplomat: ['diplo', 'Узгодити текст ноти', 'Прийом у посольстві', 'Іспит на дипломатичний ранг'],
    actor: ['media', 'Репетиція головної ролі', 'Вечірня вистава', 'Кастинг на головну роль'],
    athlete: ['mil', 'Тренування до знемоги', 'Офіційні змагання', 'Відбір до збірної'],
    teacher: ['orat', 'Відкритий урок для інспекції', 'Олімпіада з учнями', 'Атестація вчителя'],
    farmer: ['biz', 'Посівна в рекордні строки', 'Ярмарок у районі', 'Конкурс «Фермер року»'],
    pilot: ['tech', 'Посадка в сильний вітер', 'Нічний рейс', 'Іспит на командира екіпажу'],
    architect: ['tech', 'Проєкт житлового кварталу', 'Захист проєкту в мерії', 'Конкурс архітекторів'],
    blogger: ['media', 'Зняти вірусне відео', 'Прямий ефір на 3 години', 'Колаборація з топблогером'],
    judge: ['law', 'Розглянути складну справу', 'Виїзне засідання', 'Кваліфікаційна комісія суддів'],
    professor: ['sci', 'Написати монографію', 'Лекція для іноземних студентів', 'Вчена рада'],
    entrepreneur: ['biz', 'Вийти на новий ринок', 'Нічна інвентаризація', 'Інвестиційний пітч']
  };
  const need = L => 6 * L.job.lvl;
  const relSk = L => { const f = JF[L.job.k]; return f ? sk(L, f[0]) : 0; };
  const addXp = (L, v) => { if (!L.job) return ''; L.job.xp = (L.job.xp || 0) + v; return promoChk(L); };
  function promoChk(L) { const J = G.JOBS[L.job.k]; if (L.job.lvl < 5 && L.job.xp >= need(L)) { L.job.xp -= need(L); L.job.lvl++; const t = `📈 Підвищення: ${J.n}, рівень ${L.job.lvl}! Зарплата ≈ ${f$(J.pay * (1 + (L.job.lvl - 1) * 0.35))}/міс.`; G.say(`${L.name}: ${t}`, 'good', [L.job.nid]); return ' ' + t; } return ''; }
  G.jobInfo = function () { const L = G.leader; if (!L || !L.job) return null; const J = G.JOBS[L.job.k], f = JF[L.job.k] || ['eco']; return { n: J.n, ic: J.ic, lvl: L.job.lvl, xp: L.job.xp || 0, need: need(L), pay: J.pay * (1 + (L.job.lvl - 1) * 0.35), sk: f[0], skN: G.SKILLS && G.SKILLS[f[0]] ? G.SKILLS[f[0]].n : f[0], examCd: Math.max(0, (L.job.exam || -99) + 30 - G.day), courseCd: Math.max(0, (L.job.course || -99) + 30 - G.day) }; };
  const noJob = L => L.job ? '' : 'Спершу влаштуйтеся на роботу (вкладка «Карʼєра» / «Життя»)';
  const hourly = L => G.JOBS[L.job.k].pay * (1 + (L.job.lvl - 1) * 0.35) / 170;
  C.work = { n: 'Ваша робота', ic: '🏢', open: [7, 23], acts: {
    task: { n: 'Складне завдання', h: 4, c: 0, daily: 1, need: noJob, r: L => { const f = JF[L.job.k] || ['eco', 'Складне завдання']; const ok = R() < 0.45 + relSk(L) * 0.1 + (L.mood || 60) / 600;
      if (ok) return [`«${f[1]}»: впоралися блискуче. Керівник помітив (досвід +0,03).${addXp(L, 0.03)}`, { mood: 4 }]; return [`«${f[1]}»: не вийшло. ${pick(['Шеф зітхнув так, що чути на сусідньому поверсі', 'Колега забрав заслуги собі', 'Зате ви багато чого навчилися'])} (досвід +0,005)${addXp(L, 0.005)}`, { mood: -4 }]; } },
    special: { n: 'Робота за профілем', h: 5, c: 0, daily: 1, need: noJob, r: L => { const f = JF[L.job.k] || ['eco', '', 'Позаурочна робота']; const p = hourly(L) * 5 * 1.5; L.money += p;
      const war = L.job.k === 'officer' && G.enemiesOf(L.job.nid).length; return [`«${f[2]}»: ${f$(p)} понаднормових, досвід +${war ? '0,04 (воєнний час)' : '0,02'}.${addXp(L, war ? 0.04 : 0.02)}`, { hp: -3, mood: 1 }]; } },
    course: { n: 'Курси підвищення кваліфікації', h: 8, c: 0, need: L => noJob(L) || ((L.job.course || -99) + 30 > G.day ? `Наступні курси — через ${(L.job.course || -99) + 30 - G.day} дн.` : L.money < $(150 * L.job.lvl) ? `Потрібно ${f$($(150 * L.job.lvl))}` : ''),
      r: L => { L.money -= $(150 * L.job.lvl); L.job.course = G.day; return [`сертифікат отримано! ${pick(['Половину курсу розповідали про командний дух', 'Тест здали з першої спроби', 'Викладач сказав, що ви «перспективні»'])} (досвід +0,5)${addXp(L, 0.5)}`, { mood: 3 }]; } },
    boss: { n: 'Кава з керівництвом', h: 1, c: $(15), daily: 1, need: noJob, r: L => [`${pick(['керівник розповів про свою дачу 40 хвилин. Ви слухали уважно', 'обговорили плани відділу. І погоду. Переважно погоду', 'ви вчасно засміялися з жарту шефа'])} (досвід +0,01)${addXp(L, 0.01)}`, { cont: 0.3 }] },
    exam: { n: 'Атестація на підвищення', h: 3, c: 0, need: L => { if (noJob(L)) return noJob(L); if (L.job.lvl >= 5) return 'Ви вже на вершині професії'; if ((L.job.exam || -99) + 30 > G.day) return `Повторна атестація — через ${(L.job.exam || -99) + 30 - G.day} дн.`; if ((L.job.xp || 0) < need(L) * 0.75) return `Замало досвіду: ${(L.job.xp || 0).toFixed(1)} з ${(need(L) * 0.75).toFixed(1)} потрібних для атестації`; return ''; },
      r: L => { const f = JF[L.job.k] || ['eco', '', '', 'Атестація']; L.job.exam = G.day; const ch = clamp(0.25 + relSk(L) * 0.12 + (L.job.xp / need(L)) * 0.35, 0.1, 0.92);
        if (R() < ch) { L.job.xp = need(L); return [`«${f[3]}»: склали!${promoChk(L)}`, { mood: 12, fame: 0.3 }, 'jackpot']; }
        L.job.xp = Math.max(0, L.job.xp - 1); return [`«${f[3]}»: не склали (шанс був ${Math.round(ch * 100)}%). Підтягніть навичку «${G.SKILLS && G.SKILLS[f[0]] ? G.SKILLS[f[0]].n : f[0]}» і спробуйте через місяць`, { mood: -8 }]; } }
  } };
  C.work.acts.special.night = false;
  // назви дій під професію (міняються з роботою)
  G.workActName = (a) => { const L = G.leader; const f = L && L.job && JF[L.job.k]; if (!f) return null; return { task: `Складне завдання: ${f[1]}`, special: `${f[2]} (понаднормово)`, exam: `${f[3]} (атестація)` }[a] || null; };
  if (G.cityActName) { const b = G.cityActName; G.cityActName = (k, a) => (k === 'work' && G.workActName(a)) || b(k, a); }
  // щомісячний досвід: 1 + навичка за профілем; офіцер у війну ×2; без роботи на місці — повільніше
  { const b = G.careerMonthly; G.careerMonthly = function () { Object.values(G.leaders || {}).forEach(L => { if (L && L.role === 'char' && L.job) L._lvl0 = L.job.lvl; });
      b.apply(this, arguments);
      Object.values(G.leaders || {}).forEach(L => { if (!L || L.role !== 'char' || !L.job || !JF[L.job.k]) return; const f = JF[L.job.k];
        // базовий +1 уже нараховано; додаємо бонус навички й війни
        const war = L.job.k === 'officer' && G.enemiesOf(L.job.nid).length ? 1 : 0; L.job.xp += sk(L, f[0]) * 0.2 + war * 0.5; promoChk(L); }); }; }
  // юрист/суддя: виграна справа в суді — досвід
  if (G.courtTake) { const ct = G.courtTake; G.courtTake = function (role) { const r = ct(role); const L = G.leader; if (r && r.ok && L && L.job && (L.job.k === 'lawyer' || L.job.k === 'judge')) { r.msg += ` (досвід +0,3)${addXp(L, 0.3)}`; } return r; }; }

  // ================= 4б. ПРОЖИТКОВІ ВИТРАТИ: їжа, комуналка й житло (якщо свого нема) =================
  const ownHome = L => !!(L.house || (L.own || []).some(o => G.LUX[o.k] && G.LUX[o.k].c === 'home'));
  G.livingCost = L => { const lux = (L.own || []).length; return { food: $(320 + Math.min(lux, 10) * 40), rent: ownHome(L) ? 0 : $(280) }; };
  G.h29.m.push(() => { Object.values(G.leaders || {}).forEach(L => { if (!L || L.role !== 'char' || L.money == null) return; const c = G.livingCost(L); const v = Math.min(L.money, c.food + c.rent); L.money -= v;
    if (v < c.food + c.rent) { L.hp = clamp((L.hp || 80) - 8, 0, 100); L.mood = clamp((L.mood || 60) - 10, 0, 100); if (G.leader === L) G.say(`🍞 ${L.name}: бракує грошей на їжу й житло — здоровʼя й настрій падають`, 'bad'); } }); });
  // ================= 5. БЮДЖЕТ: прогноз доходів і витрат + фактичний облік =================
  function led(L, cat, d) { if (!L || !d) return; const B = L.bud = L.bud || { cur: {}, hist: [], m0: L.money, d0: G.day }; B.cur[cat] = (B.cur[cat] || 0) + d; }
  G.budLedger = led;
  // обгортаємо всі дії персонажа: скільки грошей пішло/прийшло через дії
  const CAT = { cityDo: 'city', locDo: 'city', cityEncDo: 'city', lifeDo: 'life', lifeStudy: 'life', charDo: 'char', careerDo: 'career', partyDo: 'career', famDo: 'family', shadowDo: 'family', kidEdu: 'family', luxBuy: 'buy', luxSell: 'sell', estateBuy: 'buy', estateUp: 'buy', estateSell: 'sell', estateMgr: 'buy', houseBuy: 'buy', petBuy: 'buy', farmBuy: 'buy', inv2Do: 'invest', inv2Sell: 'invest', investDo: 'invest', staffDo: 'staff', secHire: 'staff', travel: 'char' };
  for (const k of Object.keys(G.act)) { if (k === 'cityDo' || k === 'locDo') continue; const f = G.act[k]; if (typeof f !== 'function') continue;
    G.act[k] = function () { const L = G.leader; const m0 = L && L.role === 'char' ? L.money : null; const r = f.apply(this, arguments); if (m0 != null && L.money !== m0) led(L, CAT[k] || 'other', L.money - m0); return r; }; }
  G.h29.d.push(() => { Object.values(G.leaders || {}).forEach(L => { if (!L || L.role !== 'char') return; const B = L.bud = L.bud || { cur: {}, hist: [], m0: L.money, d0: G.day };
    if (G.day - B.d0 >= 30) { const net = L.money - B.m0; const act = Object.values(B.cur).reduce((s, v) => s + v, 0); B.hist.unshift({ d: G.day, net, cats: B.cur, passive: net - act }); B.hist.length = Math.min(B.hist.length, 12); B.cur = {}; B.m0 = L.money; B.d0 = G.day; } }); });
  G.budget = function (L0) {
    const L = L0 || G.leader; if (!L || L.role !== 'char') return null; const inc = [], exp = []; const add = (arr, ic, n, v) => { if (v > 1e-12) arr.push({ ic, n, v }); };
    if (L.job && G.JOBS[L.job.k]) add(inc, G.JOBS[L.job.k].ic, `Зарплата: ${G.JOBS[L.job.k].n} (рівень ${L.job.lvl})`, G.JOBS[L.job.k].pay * (1 + (L.job.lvl - 1) * 0.35));
    if (L.mp != null) add(inc, '🏛', 'Зарплата депутата', 0.000004);
    if (L.agent) add(inc, '🕶', 'Оклад агента', 0.0000025 * (1 + L.agent.rank * 0.5));
    if (L.uLead) add(inc, '📋', 'Голова профспілки', 0.0000012);
    let est = 0; (L.estate || []).forEach(p => { est += G.estateInc(p) * (p.mgr ? 1.25 : 1); }); add(inc, '🏪', `Бізнес-нерухомість (${(L.estate || []).length} обʼєкт.)`, est);
    let rent = 0, upk = 0; (L.own || []).forEach(o => { const A = G.LUX[o.k]; if (!A) return; upk += o.p0 * (A.upk || 0) / 12; if (A.rent) rent += o.v * A.rent / 12; });
    add(inc, '🔑', 'Оренда вашого житла й бізнесу', rent); add(exp, '🧾', 'Утримання майна (авто, житло, яхти…)', upk);
    let inv = 0; for (const k in (L.inv || {})) if (N[k] && N[k].alive) inv += L.inv[k] * 0.008 * (0.6 + N[k].stab / 150); add(inc, '📈', 'Інвестиції в країни', inv);
    const P2 = L.inv2 || L.pf2; if (P2) add(inc, '🏦', 'Депозит, REIT, P2P (≈)', ((P2.dep || 0) * 0.04 + (P2.reit || 0) * 0.07 + (P2.p2p || 0) * 0.12) / 12);
    { const lc = G.livingCost(L); add(exp, '🍞', 'Їжа й комуналка', lc.food); add(exp, '🛏', 'Оренда кімнати в бабусі Галі', lc.rent); }
    if (L.house && G.HOUSE[L.house.lvl]) add(exp, G.HOUSE[L.house.lvl].ic, `Утримання дому: ${G.HOUSE[L.house.lvl].n}`, $(G.HOUSE[L.house.lvl].upk));
    let pet = 0; (L.pets || []).forEach(p => { pet += G.PETS[p.k] ? G.PETS[p.k].eat : 0; }); add(exp, '🐾', `Улюбленці (${(L.pets || []).length})`, $(pet));
    let st = 0; if (L.staff && G.staffSalary) Object.values(L.staff).forEach(s => { if (s.hired) st += G.staffSalary(s, 'ch'); }); add(exp, '👥', 'Зарплати особистої команди', st);
    const lk = Object.entries(G.leaders || {}).find(([, v]) => v === L); if (lk && G.secContracts) { let sec = 0; G.secContracts.forEach(k => { if (k.cl === 'L' + lk[0]) sec += k.fee; }); add(exp, '🛡', 'Охорона', sec); }
    (L.estate || []).forEach(p => { if (p.mgr) add(exp, '🧑‍💼', `Керуючий: ${p.name}`, G.ESTATE[p.k].inc * 0.1); });
    const sum = a => a.reduce((s, x) => s + x.v, 0); return { inc, exp, tIn: sum(inc), tOut: sum(exp), net: sum(inc) - sum(exp), hist: (L.bud && L.bud.hist) || [], cur: (L.bud && L.bud.cur) || {} };
  };
  G.BUD_CAT = { city: '🏙 Місто й локації (підробітки, покупки, розваги)', life: '🎓 Навчання й життя', char: '🎩 Діяльність персонажа', career: '📈 Карʼєра й партія', family: '👪 Родина', buy: '🛍 Покупки майна', sell: '💰 Продаж майна', invest: '📊 Інвестиції', staff: '👥 Команда й охорона', other: '📦 Інше' };
});
