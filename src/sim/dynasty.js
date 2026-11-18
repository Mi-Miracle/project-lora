// ДИНАСТІЯ: вік, стосунки й шлюб, діти та їхня освіта, спадкоємець (після смерті чи відставки граєте за нього).
// ТІНЬОВИЙ СВІТ персонажа: контрабанда, хабарі, компромат — з ризиком штрафів, суду й заборони вʼїзду.
// ТЕЛЕДЕБАТИ перед виборами: три раунди, кожен — вибір тактики (або голосування чату Twitch).
LORA.sim.register('dynasty', 99.9, function (G) {
  const { N, ter } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const MF = ['Олександр', 'Максим', 'Богдан', 'Тарас', 'Дмитро', 'Андрій', 'Остап', 'Матвій', 'Назар', 'Святослав', 'Данило', 'Роман', 'Ярема', 'Захар', 'Лев', 'Марко'];
  const FF = ['Олена', 'Софія', 'Марія', 'Ірина', 'Анна', 'Христина', 'Злата', 'Мирослава', 'Дарина', 'Вероніка', 'Ліля', 'Оксана', 'Соломія', 'Ева', 'Таїсія', 'Уляна'];
  const LN = ['Коваль', 'Бондар', 'Мельник', 'Шевченко', 'Гнатюк', 'Руденко', 'Кравець', 'Лисенко', 'Ткачук', 'Савчук', 'Марченко', 'Олійник'];
  const surname = L => (L.name || '').split(' ').slice(1).join(' ') || pick(LN);
  // хто такий партнер: [ключ, назва, ефект щомісяця]
  G.FAM_PERK = {
    biz: ['Бізнесмен(ка)', 'сімейний дохід +'], star: ['Зірка шоу-бізнесу', 'популярність +'], dipl: ['Дипломат(ка)', 'звʼязки +'], sci: ['Науковець', 'досвід навичок +'],
    doc: ['Лікар(ка)', 'здоровʼя: менший ризик смерті'], mil: ['Офіцер', 'досвід військової справи; армії президента організованіші'], art: ['Художник(ця)', 'слава +'], chef: ['Шеф-кухар(ка)', 'усі в родині щасливіші: кохання не згасає']
  };
  const PK = Object.keys(G.FAM_PERK);
  const person = (fem, sur) => ({ name: pick(fem ? FF : MF) + ' ' + (sur || pick(LN)), fem, ava: 'p' + Math.floor(G.rnd() * 1e9) });
  G.famEnsure = function (L) {
    if (!L || L.money == null) return null;
    if (L.age0 == null) { L.age0 = L.role === 'president' ? 50 + Math.floor(G.rnd() * 10) : L.role === 'ceo' ? 40 + Math.floor(G.rnd() * 8) : 26 + Math.floor(G.rnd() * 8); L.d0 = G.day; }
    L.fam = L.fam || { spouse: null, date: null, kids: [], heir: null, gen: 1, heat: 0, ban: {}, cands: null, health: 100 }; return L.fam;
  };
  G.ageOf = L => L && L.age0 != null ? L.age0 + (G.day - L.d0) / 365 : 0;
  const kAge = k => (G.day - k.born) / 365;
  G.kidAge = kAge;
  const busy = L => L.busy > G.day ? `Зайняті ще ${L.busy - G.day} дн.` : '';
  // ---------- дії родини
  G.FAM_ACT = {
    meet:    { n: 'Знайомства', ic: '💘', cost: L => 0.001, days: 3, d: '3 кандидати для стосунків з різними професіями' },
    date:    { n: 'Побачення', ic: '🌹', cost: L => 0.002 + (L.fame || 0) * 0.00003, days: 2, d: 'кохання +15…25' },
    propose: { n: 'Освідчитися', ic: '💍', cost: L => 0.01, days: 1, d: 'шанс = кохання; далі весілля' },
    wedding: { n: 'Пишне весілля', ic: '💒', cost: L => 0.02 + (L.fame || 0) * 0.0008, days: 7, d: 'популярність +5, слава +3' },
    family:  { n: 'Час із родиною', ic: '🏡', cost: L => 0, days: 3, d: 'кохання +10, діти щасливіші' },
    trip:    { n: 'Сімейна відпустка', ic: '🏝', cost: L => 0.008 + (L.fame || 0) * 0.0002, days: 12, d: 'кохання +25, популярність +1' },
    baby:    { n: 'Дитина', ic: '👶', cost: L => 0.003, days: 5, d: 'шанс поповнення в родині (вік до 52)' },
    adopt:   { n: 'Усиновити дитину', ic: '🧸', cost: L => 0.01, days: 30, d: 'будь-який вік; популярність +2' },
    divorce: { n: 'Розлучення', ic: '💔', cost: L => 0, days: 30, d: 'втрата 40% статків, популярність −5' },
    retire:  { n: 'Передати справу спадкоємцю', ic: '👑', cost: L => 0, days: 0, d: 'граєте за спадкоємця вже зараз' }
  };
  G.famCan = function (k, arg) {
    const L = G.leader, F = G.famEnsure(L); if (!F) return 'Немає персонажа'; const A = G.FAM_ACT[k]; if (!A) return '?';
    if (k !== 'retire' && busy(L)) return busy(L); if (L.money < A.cost(L)) return 'Бракує грошей';
    if (k === 'meet' && F.spouse) return 'Ви вже в шлюбі';
    if (k === 'date' && !F.date && !F.spouse) return 'Спершу познайомтеся';
    if (k === 'propose') { if (F.spouse) return 'Ви вже в шлюбі'; if (!F.date) return 'Немає пари'; if (F.date.love < 50) return `Кохання ${Math.round(F.date.love)} — замало (треба ≥ 50)`; }
    if (k === 'wedding' && !(F.spouse && !F.spouse.wed)) return 'Спершу заручини';
    if ((k === 'family' || k === 'trip') && !F.spouse && !F.kids.length) return 'Немає родини';
    if (k === 'baby') { if (!F.spouse) return 'Потрібен шлюб'; if (G.ageOf(L) > 52) return 'Вік — краще усиновлення'; if (F.kids.length >= 6) return 'Досить, будинок уже повний'; }
    if (k === 'adopt' && F.kids.length >= 6) return 'Досить, будинок уже повний';
    if (k === 'divorce' && !F.spouse) return 'Немає шлюбу';
    if (k === 'retire' && !G.heirOf(L)) return 'Немає спадкоємця (дитина від 16 років або чоловік/дружина)';
    return '';
  };
  G.famDo = function (k, arg) {
    const e = G.famCan(k, arg); if (e) return { ok: false, err: e }; const L = G.leader, F = L.fam, A = G.FAM_ACT[k], home = L.home; L.money -= A.cost(L); if (A.days) L.busy = G.day + A.days; let msg = '';
    if (k === 'meet') { F.cands = [0, 1, 2].map(() => Object.assign(person(!L.fem), { perk: pick(PK), age: Math.round(G.ageOf(L) + (G.rnd() - 0.5) * 10) })); msg = 'є троє цікавих людей — оберіть, з ким зустрічатися'; }
    if (k === 'date') { const v = 15 + G.rnd() * 10; F.date.love = clamp(F.date.love + v, 0, 100); msg = `кохання ${Math.round(F.date.love)}`; }
    if (k === 'propose') { if (G.rnd() * 100 < F.date.love + 10) { F.spouse = Object.assign(F.date, { wed: false, love: Math.min(100, F.date.love + 10) }); F.date = null; msg = `${F.spouse.name} каже «так»! Залишилось весілля`; } else { F.date.love *= 0.6; msg = 'відповідь «мені треба подумати»… кохання −40%'; } }
    if (k === 'wedding') { F.spouse.wed = true; L.popu[home] = clamp((L.popu[home] || 0) + 5, 0, 100); L.fame = clamp((L.fame || 0) + 3, 0, 100); msg = `весілля року з ${F.spouse.name}: популярність +5`; }
    if (k === 'family') { if (F.spouse) F.spouse.love = clamp(F.spouse.love + 10, 0, 100); F.kids.forEach(c => { c.happy = clamp((c.happy || 60) + 10, 0, 100); }); msg = 'вечір настільних ігор, ніхто не посварився'; }
    if (k === 'trip') { if (F.spouse) F.spouse.love = clamp(F.spouse.love + 25, 0, 100); F.kids.forEach(c => { c.happy = clamp((c.happy || 60) + 20, 0, 100); }); L.popu[home] = clamp((L.popu[home] || 0) + 1, 0, 100); msg = 'фото з пляжу зібрали мільйон лайків'; }
    if (k === 'baby') { if (G.rnd() < 0.45) { const c = Object.assign(person(G.rnd() < 0.5, surname(L)), { born: G.day, edu: 0, sk: {}, happy: 70 }); F.kids.push(c); msg = `народився(лась) ${c.name}! 🍼`; } else msg = 'поки що ні — спробуйте пізніше'; }
    if (k === 'adopt') { const c = Object.assign(person(G.rnd() < 0.5, surname(L)), { born: G.day - Math.floor(365 * (2 + G.rnd() * 8)), edu: 0, sk: {}, happy: 60 }); F.kids.push(c); L.popu[home] = clamp((L.popu[home] || 0) + 2, 0, 100); msg = `${c.name} тепер у вашій родині`; }
    if (k === 'divorce') { const lost = L.money * 0.4; L.money -= lost; L.popu[home] = clamp((L.popu[home] || 0) - 5, 0, 100); msg = `розлучення з ${F.spouse.name}: −$${(lost * 1000).toFixed(1)} млн`; F.spouse = null; }
    if (k === 'retire') { const h = G.heirOf(L); G.succession(L, 'retire'); return { ok: true, msg: `${h.name} очолює династію` }; }
    G.say(`${A.ic} ${L.name}: ${A.n.toLowerCase()} — ${msg}`, 'good', [home]); return { ok: true, msg };
  };
  G.famPick = function (i) { const L = G.leader, F = G.famEnsure(L); if (!F || !F.cands || !F.cands[i]) return { ok: false, err: '?' }; F.date = Object.assign(F.cands[i], { love: 20 }); F.cands = null; return { ok: true, msg: `ви зустрічаєтесь з ${F.date.name}` }; };
  G.kidEdu = function (i, kind) {
    const L = G.leader, F = G.famEnsure(L), c = F && F.kids[i]; if (!c) return { ok: false, err: '?' }; const a = kAge(c); if (a < 6) return { ok: false, err: 'Ще замалий(а)' }; if (c.edu >= 5) return { ok: false, err: 'Освіта завершена' };
    const cost = [0.001, 0.003, 0.008, 0.02, 0.05][c.edu] * (kind === 'elite' ? 2.5 : 1); if (L.money < cost) return { ok: false, err: 'Бракує грошей' }; if ((c.eduT || 0) > G.day) return { ok: false, err: `Навчання ще ${c.eduT - G.day} дн.` };
    L.money -= cost; c.edu++; c.eduT = G.day + 365; const sk = pick(Object.keys(G.SKILLS || { eco: 1 })); c.sk[sk] = Math.min(5, (c.sk[sk] || 0) + (kind === 'elite' ? 2 : 1));
    return { ok: true, msg: `${c.name}: ${['школа', 'гімназія', 'університет', 'магістратура', 'стажування за кордоном'][c.edu - 1]}, ${G.SKILLS ? G.SKILLS[sk].n.toLowerCase() : sk} +` };
  };
  G.setHeir = function (i) { const L = G.leader, F = G.famEnsure(L); if (!F) return { ok: false }; F.heir = i; return { ok: true, msg: i === 's' ? 'спадкоємець — подружжя' : `спадкоємець — ${F.kids[i].name}` }; };
  G.heirOf = function (L) {
    const F = L && L.fam; if (!F) return null; const ok = c => c && !c.dead && kAge(c) >= 16;
    if (F.heir === 's' && F.spouse && F.spouse.wed) return F.spouse; if (F.heir != null && F.heir !== 's' && ok(F.kids[F.heir])) return F.kids[F.heir];
    const k = F.kids.filter(ok).sort((a, b) => (b.edu || 0) - (a.edu || 0) || a.born - b.born)[0]; return k || (F.spouse && F.spouse.wed ? F.spouse : null);
  };
  // ---------- спадкування
  G.succession = function (L, why) {
    const F = L.fam, h = G.heirOf(L), home = L.home, old = L.name;
    if (!h) {
      if (L.role === 'char') { G.gameOver = { win: false, text: `${old} пішов(ла) з життя, не залишивши спадкоємця. Династія обірвалася.` }; return; }
      L.name = (LORA.lang === 'en' ? 'Successor ' : 'Наступник ') + surname(L); L.age0 = 48; L.d0 = G.day; L.fam = null; G.famEnsure(L); L.money = Math.max(0.01, L.money * 0.3); L.fame = (L.fame || 0) * 0.4; L.sk = { orat: 1 };
      G.say(`🕯 ${old} ${why === 'retire' ? 'іде у відставку' : 'помирає'}. Владу перебирає наступник: ${L.name}`, 'big', [home]); LORA.bus.emit('succession', { name: L.name }); return;
    }
    const spouseHeir = h === F.spouse; const tax = L.money * 0.3; L.money -= tax;
    L.name = h.name; L.fem = h.fem; L.ava = h.ava; L.sk = Object.assign({}, h.sk || {}); if (!spouseHeir) Object.keys(L.sk).forEach(k => { L.sk[k] = Math.min(5, L.sk[k]); });
    for (const k in L.cont) L.cont[k] *= 0.55; for (const k in L.popu) L.popu[k] *= spouseHeir ? 0.7 : 0.6; L.fame = (L.fame || 0) * 0.5 + (h.edu || 0) * 2;
    L.age0 = spouseHeir ? (h.age || G.ageOf(L) - 2) : kAge(h); L.d0 = G.day; L.busy = G.day + 14;
    const kids = F.kids.filter(c => c !== h && !c.dead); F.spouse = spouseHeir ? null : F.spouse && Object.assign(F.spouse, { name: F.spouse.name, widow: true });
    L.fam = { spouse: null, date: null, kids: spouseHeir ? kids : [], heir: null, gen: (F.gen || 1) + 1, heat: 0, ban: {}, cands: null, health: 100, siblings: spouseHeir ? [] : kids.map(c => c.name) };
    if (L.role === 'president' && G.player >= 0) N[G.player].stab = clamp(N[G.player].stab - (why === 'retire' ? 2 : 6), 0, 100);
    G.say(`👑 ${why === 'retire' ? `${old} передає справу` : `🕯 ${old} пішов(ла) з життя. Спадщину отримує`} ${h.name} — покоління ${L.fam.gen}. Податок на спадщину $${(tax * 1000).toFixed(0)} млн`, 'big', [home]);
    LORA.bus.emit('succession', { name: L.name });
  };
  // ---------- тіньовий світ (лише для персонажа)
  G.SHADOW = {
    smuggle: { n: 'Контрабанда', ic: '📦', cost: 0.004, days: 10, risk: 0.18, heat: 18, d: 'швидкі гроші; ризик спіймання' },
    bribe:   { n: 'Хабар чиновнику', ic: '💵', cost: 0.01, days: 3, risk: 0.14, heat: 14, d: 'звʼязки +10 у країні; ризик' },
    kompro:  { n: 'Компромат на конкурента', ic: '🗂', cost: 0.006, days: 8, risk: 0.12, heat: 12, d: 'популярність +4 (конкуренти слабшають); ризик' },
    offshore:{ n: 'Офшорна схема', ic: '🏝', cost: 0.002, days: 5, risk: 0.1, heat: 10, d: 'частина статків захищена від податків і штрафів; ризик' },
    lay:     { n: 'Залягти на дно', ic: '🕶', cost: 0, days: 30, risk: 0, heat: -40, d: 'підозра −40, але місяць без справ' }
  };
  G.shadowCan = function (k) { const L = G.leader; if (!L || L.role !== 'char') return 'Лише для персонажа'; const F = G.famEnsure(L), A = G.SHADOW[k]; if (!A) return '?'; if (busy(L)) return busy(L); if (L.money < A.cost) return 'Бракує грошей'; if (L.mv) return 'Персонаж у дорозі'; return ''; };
  G.shadowDo = function (k) {
    const e = G.shadowCan(k); if (e) return { ok: false, err: e }; const L = G.leader, F = L.fam, A = G.SHADOW[k], nid = G.leaderNation(); L.money -= A.cost; L.busy = G.day + A.days;
    F.heat = clamp(F.heat + A.heat, 0, 100); const caught = A.risk && G.rnd() < A.risk * (0.5 + F.heat / 100) * (L.lawShield > G.day ? 0.6 : 1) * (1 - Math.min(0.4, (G.lifeSec ? G.lifeSec(L) : 0) * 0.05));
    if (caught) { const fine = Math.max(0.005, L.money * (F.off ? 0.15 : 0.35)); L.money -= fine; L.popu[nid] = clamp((L.popu[nid] || 0) - 15, 0, 100); L.cont[nid] = clamp((L.cont[nid] || 0) - 10, 0, 100); L.busy = G.day + 90; F.ban[nid] = G.day + 365; F.heat = 30;
      G.say(`🚔 ${L.name}: справу «${A.n.toLowerCase()}» розкрито! Штраф $${(fine * 1000).toFixed(1)} млн, суд 3 місяці, вʼїзд до ${N[nid].name} заборонено на рік`, 'bad', [nid]); return { ok: true, msg: 'вас спіймали' }; }
    let msg = '';
    if (k === 'smuggle') { const g = 0.012 + G.rnd() * 0.02 + (L.fame || 0) * 0.0001; L.money += g; msg = `+$${(g * 1000).toFixed(1)} млн`; }
    if (k === 'bribe') { L.cont[nid] = clamp((L.cont[nid] || 0) + 10, 0, 100); msg = `звʼязки в ${N[nid].name} +10`; }
    if (k === 'kompro') { L.popu[nid] = clamp((L.popu[nid] || 0) + 4, 0, 100); msg = 'конкурент пояснюється в ефірі'; }
    if (k === 'offshore') { F.off = true; msg = 'штрафи надалі менші'; }
    if (k === 'lay') msg = 'тихо, як миша';
    G.say(`${A.ic} ${A.n}: ${msg}`, 'info', [nid]); return { ok: true, msg };
  };
  { const b = G.leaderGo; if (b) G.leaderGo = function (to) { const L = G.leader, F = L && L.fam; const nid = ter[to] ? ter[to].ctrl : -1; if (F && F.ban && F.ban[nid] > G.day) return { ok: false, err: `Вʼїзд заборонено ще ${F.ban[nid] - G.day} дн.` }; return b.apply(this, arguments); }; }
  // ---------- теледебати
  const DEB = [
    { q: 'Ведучий: «Що ви зробите з цінами?»', o: [['Факти й цифри', 'eco'], ['Атакувати опонента', 'orat'], ['Пожартувати', 'media']] },
    { q: 'Опонент: «Ваша команда — дилетанти!»', o: [['Спокійно спростувати', 'law'], ['Контратака з компроматом', 'orat'], ['Мем на камеру', 'media']] },
    { q: 'Фінальне слово: 60 секунд', o: [['Візія майбутнього', 'diplo'], ['Емоційна історія з життя', 'orat'], ['Пообіцяти все й одразу', 'media']] }
  ];
  G.debateStart = function (nid) { const L = G.leader; if (!L || L.money == null || L._deb === nid) return; L._deb = nid; L._debS = 0; pushDeb(0, nid); };
  function pushDeb(r, nid) { G.decisions.push({ id: G.nextId++, ev: 'debate' + r, nid, pers: true, ctx: { text: `🎙 Теледебати (${r + 1}/3). ${DEB[r].q}` }, d: G.day }); }
  const EV = G.DEC_EV; if (EV) DEB.forEach((D0, r) => EV.push({ id: 'debate' + r, adv: 'intern', ok: () => false, t: () => null, o: D0.o.map(([lab, sk]) => [lab, n => {
    const L = G.leader; if (!L) return ''; const s = (G.skill ? G.skill(L, sk) : 0) + G.rnd() * 3 - 1.2 + (sk === 'media' ? (G.rnd() < 0.3 ? 2 : -1) : 0); L._debS = (L._debS || 0) + s;
    const msg = s > 2 ? 'зал аплодує!' : s > 0.5 ? 'непогано' : s > -0.5 ? 'так собі' : 'провал — цей момент уже став мемом';
    if (r < 2) pushDeb(r + 1, n.id); else { const v = clamp(L._debS * 2.2, -12, 14); const home = n.id; L.popu[home] = clamp((L.popu[home] || 0) + v, 0, 100); G.say(`🎙 Підсумок дебатів: ${v >= 0 ? 'перемога' : 'поразка'} — популярність ${v >= 0 ? '+' : ''}${v.toFixed(0)}`, v >= 0 ? 'good' : 'bad', [home]); }
    return msg; }]) }));
  // ---------- щомісяця
  G.dynastyMonthly = function () { const keys = Object.keys(G.leaders || {}); if (!keys.length) return famMonth(); const prev = G._lk; keys.forEach(k => { G._lk = isNaN(+k) ? k : +k; try { famMonth(); } catch (e) { } }); G._lk = prev; };
  function famMonth() {
    const L = G.leader; if (!L || L.money == null) return; const F = G.famEnsure(L); const home = L.home;
    if (F.spouse) { const s = F.spouse; s.love = clamp(s.love - (s.perk === 'chef' ? 0.3 : 1.2) - (L.abroad ? 0.6 : 0), 0, 100);
      if (s.wed && s.love < 12) { const lost = L.money * 0.3; L.money -= lost; G.say(`💔 ${s.name} подає на розлучення: «Тебе ніколи немає вдома». −$${(lost * 1000).toFixed(1)} млн`, 'bad', [home]); F.spouse = null; }
      else if (s.wed) { const p = s.perk; if (p === 'biz') L.money += 0.0006; if (p === 'star') L.popu[home] = clamp((L.popu[home] || 0) + 0.4, 0, 100); if (p === 'dipl') L.cont[home] = clamp((L.cont[home] || 0) + 0.4, 0, 100);
        if (p === 'art') L.fame = clamp((L.fame || 0) + 0.15, 0, 100); if (p === 'sci' || p === 'mil') { L.skx = L.skx || {}; const k = p === 'mil' ? 'mil' : pick(['sci', 'tech', 'eco']); L.skx[k] = (L.skx[k] || 0) + 1; }
        if (p === 'mil' && L.role === 'president') G.armies.forEach(a => { if (a.n === home) a.org = Math.min(1, a.org + 0.003); }); } }
    if (F.date && !F.spouse) { F.date.love = clamp(F.date.love - 2, 0, 100); if (F.date.love < 5) { G.say(`💨 ${F.date.name} більше не відповідає на повідомлення`, 'info', [home]); F.date = null; } }
    F.heat = Math.max(0, F.heat - 2);
    F.kids.forEach(c => { if (c.dead) return; const a = kAge(c); c.happy = clamp((c.happy || 60) - 0.6, 0, 100); if (Math.floor(a) === 18 && !c.adult) { c.adult = true; G.say(`🎓 ${c.name} святкує 18-річчя. Тепер може стати спадкоємцем династії`, 'good', [home]); }
      if (a >= 16 && c.happy < 15 && G.rnd() < 0.05) { c.happy = 40; L.popu[home] = clamp((L.popu[home] || 0) - 3, 0, 100); G.say(`📸 Скандал: ${c.name} влаштовує вечірку на яхті. Таблоїди в захваті`, 'bad', [home]); } });
    // здоровʼя й смерть
    const age = G.ageOf(L); if (age > 62) { const p = ((age - 62) * 0.0012 + Math.max(0, age - 80) * 0.004) * (F.spouse && F.spouse.wed && F.spouse.perk === 'doc' ? 0.6 : 1); if (G.rnd() < p) G.succession(L, 'death'); else if (age > 70 && G.rnd() < 0.02) G.say(`🩺 ${L.name} (${Math.floor(age)} р.) тиждень провів(ла) в лікарні. Час подумати про спадкоємця`, 'info', [home]); }
    // теледебати за 2–3 тижні до виборів, де ви кандидат
    const cand = L.role === 'char' ? L.cand : (L.role === 'president' ? home : null); const n = cand != null ? N[cand] : null;
    if (n && n.parl && n.parl.next - G.day <= 35 && n.parl.next - G.day > 0 && L._deb !== cand + ':' + n.parl.next && (G._lk == null || G.leaders[G.player] === L || G.player < 0)) { L._deb = cand + ':' + n.parl.next; L._debS = 0; pushDeb(0, cand); }
  }
  G.act.famDo = (k, a) => G.famDo(k, a); G.act.famPick = i => G.famPick(i); G.act.kidEdu = (i, k) => G.kidEdu(i, k); G.act.setHeir = i => G.setHeir(i); G.act.shadowDo = k => G.shadowDo(k);
});
