// КАРʼЄРИ 4.0: професії з карʼєрними сходами (5 посад), вимогами до навичок, реальною роботою на робочому місці в місті
// (обовʼязки змінюються з посадою, мініігри), зарплатою за відпрацьоване, підвищенням і звільненням.
// Також: нові навички, квартали міста й нові робочі місця.
LORA.sim.register('careers', 99.997, function (G) {
  const { N } = G; if (!G.LOCS || !G.SKILLS) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const R = () => G.rnd(); const pick = a => a[Math.floor(R() * a.length)];
  const $ = v => v / 1e9; const f$ = v => G.fmt$(v); const sk = (L, k) => G.skill ? G.skill(L, k) : 0;
  const nidOf = () => (G.leaderNation ? G.leaderNation() : -1);

  // ================= НАВИЧКИ =================
  Object.assign(G.SKILLS, {
    med:   { n: 'Медицина', ic: '🩺', d: 'медбрат, лікар, хірург (з 3-го рівня потрібна Наука 1)' },
    drive: { n: 'Водіння й логістика', ic: '🚚', d: 'права категорій B/C, курʼєр, далекобійник, логіст, пілот' },
    build: { n: 'Будівництво', ic: '🏗', d: 'муляр, виконроб, інженер-будівельник' },
    agro:  { n: 'Агрономія', ic: '🌾', d: 'агроном, керівник агрохолдингу; урожай на дачі більший' },
    fit:   { n: 'Фізпідготовка', ic: '💪', d: 'армія, поліція, спорт; здоровʼя відновлюється швидше' },
    art:   { n: 'Акторство й мистецтво', ic: '🎭', d: 'актор, режисер; виступи переконливіші' },
    ped:   { n: 'Педагогіка', ic: '📚', d: 'вчитель, завуч, директор школи, професор' }
  });
  G.SKILLS.mil.d = 'військова кафедра й академія: офіцерські звання (з 2-го рівня потрібна Фізпідготовка 1)';
  G.SKILLS.law.d = 'юрист, адвокат, суддя, поліція; закони проходять легше';
  // передумови для навчання
  G.SKILL_PRE = { mil: { 2: { fit: 1 }, 4: { fit: 2 } }, med: { 3: { sci: 1 } }, ped: { 3: { orat: 1 } } };
  { const b = G.lifeStudyCan; G.lifeStudyCan = function (k) { const e = b(k); if (e) return e; const L = G.leader, lv = sk(L, k) + 1, P = (G.SKILL_PRE[k] || {})[lv] || (G.SKILL_PRE[k] && Object.entries(G.SKILL_PRE[k]).filter(([l]) => +l <= lv).map(([, v]) => v).reduce((a, v) => Object.assign(a, v), {}));
    if (P) for (const [s, v] of Object.entries(P)) if (sk(L, s) < v) return `Спершу «${G.SKILLS[s].n}» рівня ${v}`; return ''; }; }

  // ================= ПРОФЕСІЇ =================
  // ranks: [посада, вимоги, зарплата $/міс.]; duties: обовʼязки на робочому місці
  // duty: [id, назва, год, від посади, до посади, мінігра, досвід, ніч?]
  const J = (o) => o;
  const JOBS = {
    cook: J({ n: 'Кухар', ic: '🍳', place: 'rest', d: 'ресторан: від помічника до шеф-ресторатора', k: { cont: 0.5 }, sk: 'biz',
      ranks: [['Помічник кухаря', {}, 900], ['Кухар', {}, 1400], ['Су-шеф', { biz: 1 }, 2200], ['Шеф-кухар', { biz: 2 }, 3400], ['Шеф-ресторатор', { biz: 3 }, 5500]],
      duties: [['chop', 'Нарізати овочі на зміну', 4, 1, 2, 'click', 0.06], ['cook', 'Готувати замовлення на кухні', 5, 2, 5, 'timing', 0.08], ['menu', 'Скласти нове меню', 3, 3, 5, 'quiz', 0.1], ['banq', 'Банкет на 200 гостей (до ночі)', 6, 2, 5, 'timing', 0.12, 1]] }),
    seller: J({ n: 'Торгівля', ic: '🛒', place: 'mall', d: 'ТРЦ: продавець → адміністратор → директор магазину → регіональний директор', k: { pop: 0.5 }, sk: 'biz',
      ranks: [['Продавець-консультант', {}, 600], ['Старший продавець', {}, 850], ['Адміністратор залу', { biz: 1 }, 1300], ['Директор магазину', { biz: 2 }, 2400], ['Регіональний директор', { biz: 3, eco: 1 }, 4500]],
      duties: [['serve', 'Обслуговувати покупців', 4, 1, 3, 'quiz', 0.06], ['stock', 'Викласти товар у залі', 3, 1, 2, 'click', 0.05], ['plan', 'План продажів на тиждень', 3, 3, 5, 'quiz', 0.1], ['audit', 'Ревізія магазину', 4, 4, 5, 'click', 0.1]] }),
    driver: J({ n: 'Водій і логістика', ic: '🚚', place: 'logist', d: 'термінал: курʼєр → далекобійник → диспетчер → логіст (будує маршрути) → директор з логістики', k: { cont: 0.4 }, sk: 'drive',
      ranks: [['Курʼєр', { drive: 1 }, 800], ['Далекобійник', { drive: 2 }, 1600], ['Диспетчер', { drive: 2, tech: 1 }, 1800], ['Логіст', { drive: 2, eco: 1 }, 2600], ['Директор з логістики', { biz: 2, eco: 2 }, 5000]],
      duties: [['deliver', 'Рейс по місту: розвезти посилки', 4, 1, 2, 'route', 0.07], ['haul', 'Далекий рейс з вантажем (до ночі)', 7, 2, 2, 'route', 0.12, 1], ['dispatch', 'Скласти маршрути водіям на день', 3, 3, 5, 'route', 0.1], ['net', 'Оптимізувати мережу складів', 4, 4, 5, 'quiz', 0.12]] }),
    builder: J({ n: 'Будівництво', ic: '🏗', place: 'build', d: 'будмайданчик: різноробочий → муляр → виконроб → інженер → головний інженер', k: { cont: 0.4 }, sk: 'build',
      ranks: [['Різноробочий', {}, 700], ['Муляр', { build: 1 }, 1200], ['Виконроб', { build: 2 }, 2000], ['Інженер-будівельник', { build: 3, tech: 1 }, 3000], ['Головний інженер', { build: 4, biz: 1 }, 5000]],
      duties: [['carry', 'Носити цеглу й мішати розчин', 5, 1, 1, 'click', 0.05], ['brick', 'Класти стіну рівно', 5, 2, 3, 'timing', 0.08], ['site', 'Керувати бригадою на обʼєкті', 4, 3, 5, 'quiz', 0.1], ['accept', 'Приймання будинку комісією', 3, 4, 5, 'quiz', 0.12]] }),
    farmer: J({ n: 'Агросектор', ic: '🌾', place: 'agro', d: 'агрофірма: робітник → тракторист → агроном → головний агроном → керівник агрохолдингу', k: { pop: 0.4 }, sk: 'agro',
      ranks: [['Робітник ферми', {}, 600], ['Тракторист', { drive: 1 }, 900], ['Агроном', { agro: 2 }, 1600], ['Головний агроном', { agro: 3 }, 2400], ['Керівник агрохолдингу', { agro: 3, biz: 2 }, 5000]],
      duties: [['field', 'Польові роботи', 6, 1, 2, 'click', 0.06], ['plough', 'Оранка на тракторі', 6, 2, 3, 'timing', 0.08], ['agrnm', 'Обстежити поля й дати рекомендації', 4, 3, 5, 'quiz', 0.1], ['harv', 'Керувати жнивами', 5, 4, 5, 'route', 0.12]] }),
    police: J({ n: 'Поліція', ic: '👮', place: 'police', d: 'відділок: патрульний → дільничний → слідчий → начальник відділу → начальник поліції', k: { pop: 0.5, cont: 0.3 }, sk: 'law',
      ranks: [['Патрульний', { fit: 1, law: 1 }, 900], ['Дільничний', { law: 1, fit: 1 }, 1100], ['Слідчий', { law: 2 }, 1500], ['Начальник відділу', { law: 3, orat: 1 }, 2400], ['Начальник поліції', { law: 4, orat: 2 }, 4000]],
      duties: [['patrol', 'Патрулювання району', 5, 1, 2, 'click', 0.07], ['night', 'Нічне чергування (до ранку)', 8, 1, 3, 'click', 0.1, 1], ['invest', 'Розслідувати справу', 4, 3, 5, 'quiz', 0.1], ['brief', 'Нарада й розподіл нарядів', 2, 4, 5, 'quiz', 0.08]] }),
    military: J({ n: 'Військова служба', ic: '🎖', place: 'milhq', d: 'штаб: рядовий → лейтенант → капітан → полковник → генерал. Офіцерські звання — лише з військовою освітою', k: { pop: 0.4 }, sk: 'mil',
      ranks: [['Рядовий (контракт)', { fit: 1 }, 700], ['Лейтенант', { mil: 2, fit: 1 }, 1200], ['Капітан', { mil: 3, fit: 2 }, 1800], ['Полковник', { mil: 4, orat: 1 }, 3000], ['Генерал', { mil: 5, orat: 2 }, 5500]],
      duties: [['drill', 'Стройова й фізпідготовка', 3, 1, 2, 'timing', 0.06], ['range', 'Стрільби на полігоні', 4, 1, 5, 'click', 0.08], ['guard', 'Добове чергування (до ранку)', 8, 1, 3, 'timing', 0.1, 1], ['exer', 'Командувати підрозділом на навчаннях', 5, 2, 5, 'quiz', 0.1], ['task', 'Отримати й виконати завдання штабу', 6, 3, 5, 'quiz', 0.14]] }),
    lawyer: J({ n: 'Право', ic: '⚖', place: 'court', d: 'суд: помічник юриста → адвокат → старший адвокат → суддя → суддя Верховного суду', k: { cont: 1.2 }, sk: 'law',
      ranks: [['Помічник юриста', { law: 1 }, 900], ['Адвокат', { law: 2 }, 1800], ['Старший адвокат', { law: 3, orat: 1 }, 3200], ['Суддя', { law: 4 }, 3500], ['Суддя Верховного суду', { law: 5 }, 6000]],
      duties: [['docs', 'Підготувати документи до справи', 4, 1, 1, 'quiz', 0.06], ['defend', 'Захищати клієнта в суді (адвокат)', 5, 2, 3, 'quiz', 0.12], ['consult', 'Консультація клієнта', 2, 2, 3, 'quiz', 0.05], ['judge', 'Головувати на засіданні (суддя)', 5, 4, 5, 'quiz', 0.14]] }),
    doctor: J({ n: 'Медицина', ic: '🩺', place: 'hosp', d: 'лікарня: медбрат/медсестра → інтерн → лікар → хірург → головний лікар', k: { pop: 0.8 }, sk: 'med',
      ranks: [['Медбрат / медсестра', { med: 1 }, 700], ['Лікар-інтерн', { med: 2 }, 900], ['Лікар', { med: 3 }, 1600], ['Хірург', { med: 4 }, 2800], ['Головний лікар', { med: 4, biz: 2 }, 4500]],
      duties: [['care', 'Догляд за пацієнтами в палатах', 5, 1, 2, 'click', 0.06], ['recv', 'Прийом пацієнтів', 4, 2, 5, 'quiz', 0.09], ['shift', 'Нічне чергування (до ранку)', 8, 1, 4, 'quiz', 0.1, 1], ['op', 'Операція', 4, 4, 5, 'timing', 0.14]] }),
    teacher: J({ n: 'Освіта', ic: '📚', place: 'school', d: 'школа: вчитель → старший вчитель → завуч → директор школи → професор університету', k: { pop: 0.6 }, sk: 'ped',
      ranks: [['Вчитель', { ped: 1 }, 600], ['Старший вчитель', { ped: 2 }, 800], ['Завуч', { ped: 2, orat: 1 }, 1000], ['Директор школи', { ped: 3, biz: 1 }, 1400], ['Професор університету', { ped: 3, sci: 3 }, 2500]],
      duties: [['lesson', 'Провести уроки', 5, 1, 4, 'quiz', 0.07], ['check', 'Перевірити зошити', 3, 1, 3, 'click', 0.05], ['meet', 'Педрада й батьківські збори', 3, 3, 4, 'quiz', 0.08], ['lect', 'Лекція в університеті', 3, 5, 5, 'quiz', 0.12]] }),
    programmer: J({ n: 'IT', ic: '💻', place: 'ithub', d: 'IT-хаб: стажер → джуніор → мідл → сеньйор → техлід', k: {}, sk: 'tech',
      ranks: [['Стажер', { tech: 1 }, 600], ['Джуніор', { tech: 2 }, 1500], ['Мідл', { tech: 3 }, 3000], ['Сеньйор', { tech: 4 }, 5000], ['Техлід', { tech: 4, biz: 2 }, 7500]],
      duties: [['bug', 'Виправити баги', 4, 1, 5, 'quiz', 0.07], ['feat', 'Написати нову функцію', 6, 2, 5, 'timing', 0.09], ['review', 'Код-рев’ю команди', 2, 3, 5, 'quiz', 0.08], ['release', 'Нічний реліз (до ранку)', 6, 3, 5, 'quiz', 0.12, 1]] }),
    journalist: J({ n: 'Журналістика', ic: '📰', place: 'press', d: 'редакція: стажер → репортер → оглядач → редактор → головний редактор', k: { pop: 0.8, fame: 0.1 }, sk: 'media',
      ranks: [['Стажер редакції', { media: 1 }, 500], ['Репортер', { media: 2 }, 900], ['Оглядач', { media: 3, orat: 1 }, 1500], ['Редактор', { media: 3, law: 1 }, 2200], ['Головний редактор', { media: 4, biz: 1 }, 3800]],
      duties: [['news', 'Написати новини дня', 3, 1, 3, 'quiz', 0.06], ['report', 'Репортаж з місця подій', 5, 2, 4, 'click', 0.09], ['inter', 'Інтерв’ю з політиком', 3, 3, 5, 'quiz', 0.11], ['edit', 'Випустити номер', 4, 4, 5, 'quiz', 0.1]] }),
    banker: J({ n: 'Фінанси', ic: '🏦', place: 'bank', d: 'банк: касир → кредитний аналітик → фінансовий аналітик → директор відділення → голова правління', k: { cont: 0.8 }, sk: 'eco',
      ranks: [['Касир', { eco: 1 }, 700], ['Кредитний аналітик', { eco: 2 }, 1400], ['Фінансовий аналітик', { eco: 3 }, 2600], ['Директор відділення', { eco: 3, biz: 2 }, 4000], ['Голова правління', { eco: 4, biz: 3 }, 9000]],
      duties: [['cash', 'Працювати на касі', 5, 1, 2, 'click', 0.06], ['loan', 'Розглянути кредитні заявки', 4, 2, 4, 'quiz', 0.09], ['fcst', 'Інвестиційний прогноз', 4, 3, 5, 'quiz', 0.11], ['board', 'Засідання правління', 3, 4, 5, 'quiz', 0.12]] }),
    diplomat: J({ n: 'Дипломатія', ic: '🕊', place: 'mfa', d: 'МЗС: аташе → секретар → радник → посол → заступник міністра', k: { cont: 1.5 }, sk: 'diplo',
      ranks: [['Аташе', { diplo: 2 }, 900], ['Третій секретар', { diplo: 2, law: 1 }, 1300], ['Радник', { diplo: 3 }, 2000], ['Посол', { diplo: 4, orat: 2 }, 3500], ['Заступник міністра', { diplo: 5 }, 5000]],
      duties: [['note', 'Підготувати дипломатичну ноту', 4, 1, 3, 'quiz', 0.07], ['recep', 'Прийом іноземної делегації', 4, 2, 5, 'quiz', 0.09], ['talks', 'Переговори', 5, 3, 5, 'quiz', 0.13]] }),
    scientist: J({ n: 'Наука', ic: '🔬', place: 'nii', d: 'НДІ: лаборант → молодший науковий → науковий співробітник → завлаб → академік', k: { fame: 0.1 }, sk: 'sci',
      ranks: [['Лаборант', { sci: 1 }, 500], ['Молодший науковий співробітник', { sci: 2 }, 800], ['Науковий співробітник', { sci: 3 }, 1200], ['Завідувач лабораторії', { sci: 4 }, 2000], ['Академік', { sci: 5 }, 3500]],
      duties: [['exp', 'Поставити дослід', 5, 1, 5, 'timing', 0.07], ['paper', 'Написати статтю', 4, 2, 5, 'quiz', 0.09], ['grant', 'Захистити грант', 3, 4, 5, 'quiz', 0.13]] }),
    pilot: J({ n: 'Авіація', ic: '🛫', place: 'crew', loc: 'airport', d: 'аеропорт: курсант → другий пілот → командир судна → пілот-інструктор → шеф-пілот', k: { fame: 0.05 }, sk: 'drive',
      ranks: [['Курсант льотної школи', { drive: 2, tech: 1 }, 800], ['Другий пілот', { drive: 3, tech: 2 }, 3000], ['Командир повітряного судна', { drive: 4, tech: 2 }, 6000], ['Пілот-інструктор', { drive: 4, ped: 1 }, 6500], ['Шеф-пілот', { drive: 5, biz: 1 }, 9000]],
      duties: [['sim', 'Тренажер і теорія', 4, 1, 2, 'quiz', 0.07], ['flight', 'Рейс (посадка вручну)', 6, 2, 5, 'timing', 0.12], ['teach', 'Навчити курсантів', 4, 4, 5, 'quiz', 0.1]] }),
    actor: J({ n: 'Театр і кіно', ic: '🎭', place: 'theatre', d: 'театр: масовка → актор → провідний актор → режисер → художній керівник', k: { fame: 0.2, pop: 0.4 }, sk: 'art',
      ranks: [['Актор масовки', {}, 400], ['Актор', { art: 1 }, 900], ['Провідний актор', { art: 2, orat: 1 }, 1800], ['Режисер', { art: 3, media: 1 }, 2800], ['Художній керівник', { art: 4, biz: 1 }, 4000]],
      duties: [['reh', 'Репетиція', 4, 1, 5, 'timing', 0.07], ['show', 'Вечірня вистава', 3, 2, 5, 'quiz', 0.1], ['direct', 'Поставити нову виставу', 5, 4, 5, 'quiz', 0.12]] }),
    athlete: J({ n: 'Спорт', ic: '🏅', place: 'stad', d: 'стадіон: аматор → професіонал → гравець збірної → капітан → головний тренер', k: { fame: 0.3, pop: 0.4 }, sk: 'fit',
      ranks: [['Аматор', { fit: 1 }, 300], ['Професіонал', { fit: 2 }, 1500], ['Гравець збірної', { fit: 3 }, 4000], ['Капітан збірної', { fit: 4, orat: 1 }, 7000], ['Головний тренер', { fit: 3, ped: 2 }, 5000]],
      duties: [['train', 'Тренування', 4, 1, 5, 'click', 0.07], ['match', 'Матч', 3, 2, 5, 'timing', 0.12], ['tact', 'Розбір тактики з командою', 2, 4, 5, 'quiz', 0.08]] })
  };
  const OLD = { economist: ['banker', 2], architect: ['builder', 3], blogger: ['journalist', 1], judge: ['lawyer', 4], professor: ['teacher', 5], entrepreneur: ['seller', 3], manager: ['seller', 4], engineer: ['builder', 3], officer: ['military', 2] };
  // збираємо G.JOBS у сумісному вигляді (pay, req, k) — старі модулі продовжують працювати
  G.JOBS = {};
  for (const [k, j] of Object.entries(JOBS)) { j.loc = j.loc || 'city'; j.pay = $(j.ranks[0][2]); j.req = j.ranks[0][1]; j.m = j.m || {}; G.JOBS[k] = j; }
  G.jobFix = L => { if (!L || !L.job) return; if (G.JOBS[L.job.k]) return; const o = OLD[L.job.k] || ['seller', 1]; L.job.k = o[0]; L.job.lvl = Math.max(1, Math.min(L.job.lvl || 1, o[1])); L.job.xp = 0; };
  G.jobRank = L => { G.jobFix(L); const j = L && L.job && G.JOBS[L.job.k]; return j ? j.ranks[clamp(L.job.lvl, 1, 5) - 1] : null; };
  G.jobTitle = L => { const r = G.jobRank(L); return r ? r[0] : ''; };
  G.jobPay = L => { const r = G.jobRank(L); return r ? $(r[2]) : 0; };
  G.jobNeed = L => 3 + 4 * (L.job.lvl || 1);
  const reqErr = (L, req) => { for (const [s, v] of Object.entries(req || {})) if (sk(L, s) < v) return `Потрібна навичка «${G.SKILLS[s] ? G.SKILLS[s].n : s}» рівня ${v} (у вас ${sk(L, s)})`; return ''; };
  G.jobReqErr = (L, k) => { const j = G.JOBS[k]; return j ? reqErr(L, j.ranks[0][1]) : '?'; };
  G.jobNextErr = L => { G.jobFix(L); const j = G.JOBS[L.job.k]; if (L.job.lvl >= 5) return 'Вершина карʼєри'; return reqErr(L, j.ranks[L.job.lvl][1]); };

  // працевлаштування — особисто, на робочому місці (або з вкладки «Карʼєра»)
  G.jobTake = function (k) {
    const L = G.leader; if (!L || L.role !== 'char') return { ok: false, err: 'Лише для персонажа' }; const j = G.JOBS[k]; if (!j) return { ok: false, err: '?' };
    if (L.job && L.job.k === k) return { ok: false, err: 'Ви вже тут працюєте' }; const e = reqErr(L, j.ranks[0][1]); if (e) return { ok: false, err: e };
    const nid = nidOf(); L.job = { k, nid, lvl: 1, xp: 0, dd: 0, warn: 0, d0: G.day }; G.say(`🧳 ${L.name}: нова робота — ${j.ranks[0][0]} (${j.n})`, 'good', [nid]);
    return { ok: true, msg: `вас прийняли: ${j.ranks[0][0]}. Приходьте на роботу — зарплата залежить від відпрацьованих днів` };
  };
  G.jobQuit = function () { const L = G.leader; if (!L || !L.job) return { ok: false, err: 'Ви не працюєте' }; const t = G.jobTitle(L); L.job = null; return { ok: true, msg: `ви звільнилися з посади «${t}»` }; };
  { const b = G.careerCan; G.careerCan = function (k, arg) { if (k === 'job') { const L = G.leader; if (!L || L.role !== 'char') return 'Лише для персонажа'; if (!G.JOBS[arg]) return 'Оберіть професію'; if (L.job && L.job.k === arg) return 'Ви вже тут працюєте'; return G.jobReqErr(L, arg); } return b(k, arg); }; }
  { const b = G.careerDo; G.careerDo = function (k, a, c) { if (k === 'job') return G.jobTake(a); return b(k, a, c); }; }

  // підвищення: досвід + навички наступної посади
  function promo(L, quiet) { G.jobFix(L); const j = G.JOBS[L.job.k]; if (L.job.lvl >= 5 || L.job.xp < G.jobNeed(L)) return '';
    const e = G.jobNextErr(L); if (e) { if (!quiet && !L.job.nag) { L.job.nag = 1; G.say(`📋 ${L.name}: досвіду вистачає на посаду «${j.ranks[L.job.lvl][0]}», але ${e.toLowerCase()}`, 'info', [nidOf()]); } return ''; }
    L.job.xp -= G.jobNeed(L); L.job.lvl++; L.job.nag = 0; const t = `📈 Підвищення: ${j.ranks[L.job.lvl - 1][0]}! Зарплата ${f$(G.jobPay(L))}/міс.`; G.say(`${L.name}: ${t}`, 'good', [nidOf()]); return ' ' + t; }
  G.jobPromo = promo;

  // ================= ЩОМІСЯЦЯ: зарплата за відпрацьоване, досвід, попередження й звільнення =================
  G.jobMonthly = function (L) {
    G.jobFix(L); const j = G.JOBS[L.job.k]; const dd = L.job.dd || 0; const share = clamp(dd / 10, 0.2, 1); const pay = G.jobPay(L) * share; L.money += pay;
    L.job.xp += 0.5 + sk(L, j.sk) * 0.1; const nid = L.job.nid;
    if (j.k.cont) L.cont[nid] = clamp((L.cont[nid] || 0) + 0.3 * j.k.cont, 0, 100); if (j.k.pop) L.popu[nid] = clamp((L.popu[nid] || 0) + 0.3 * j.k.pop, 0, 100); if (j.k.fame) L.fame = (L.fame || 0) + j.k.fame;
    if (dd === 0 && G.day - (L.job.d0 || 0) > 25) { L.job.warn = (L.job.warn || 0) + 1;
      if (L.job.warn >= 2) { const t = G.jobTitle(L); L.job = null; G.say(`🚪 ${L.name}: звільнено з посади «${t}» за прогули`, 'bad', [nid]); return; }
      G.say(`⚠ ${L.name}: догана — за місяць жодного робочого дня. Ще місяць — і звільнення`, 'bad', [nid]); }
    else if (dd > 0) L.job.warn = 0;
    if (G.leader === L && dd > 0 && dd < 10) G.say(`💼 ${L.name}: відпрацьовано ${dd} дн. із 10 — зарплата ${Math.round(share * 100)}% (${f$(pay)})`, 'info', [nid]);
    L.job.dd = 0; promo(L, false);
  };

  // ================= РОБОЧІ МІСЦЯ В МІСТІ =================
  const C = G.LOCS.city.places;
  delete C.work; // старе загальне «Ваша робота» замінено справжніми місцями
  const NEWP = {
    hosp: { n: 'Міська лікарня №1', ic: '🏥', open: [0, 26] }, school: { n: 'Школа №1', ic: '🏫', open: [7, 19] }, police: { n: 'Відділок поліції', ic: '🚓', open: [0, 26] },
    milhq: { n: 'Штаб і військкомат', ic: '🎖', open: [0, 26] }, mfa: { n: 'Міністерство закордонних справ', ic: '🕊', open: [8, 20] }, bank: { n: 'Банк «Гривня-Інвест»', ic: '🏦', open: [8, 19] },
    ithub: { n: 'IT-хаб «Кремнієва балка»', ic: '💻', open: [8, 26] }, nii: { n: 'НДІ «Атом-Квант»', ic: '🔬', open: [8, 20] }, logist: { n: 'Логістичний термінал «Швидка посилка»', ic: '🚚', open: [0, 26] },
    build: { n: 'Будмайданчик ЖК «Мрія»', ic: '🏗', open: [6, 21] }, agro: { n: 'Агрофірма «Колосок»', ic: '🌾', open: [5, 21] }
  };
  for (const [k, p] of Object.entries(NEWP)) if (!C[k]) C[k] = Object.assign({ acts: {} }, p);
  ['rest', 'mall', 'court', 'press', 'theatre', 'stad'].forEach(k => { if (C[k]) { C[k].open = [Math.min((C[k].open || [8])[0], 7), Math.max((C[k].open || [0, 22])[1], 23)]; } });
  if (G.LOCS.airport) G.LOCS.airport.places.crew = { n: 'Льотна школа й екіпажі', ic: '🧑‍✈️', acts: {} };
  if (G.LOCS.airport) G.LOCS.airport.places.crew.ic = '🛫';

  const autoScore = (L, j) => clamp(0.3 + sk(L, j.sk) * 0.11 + (L.mood || 60) / 500 + R() * 0.3, 0, 1);
  const VERB = { quiz: ['відповіли правильно', 'помилилися'], timing: ['ідеально вчасно', 'трохи не встигли'], click: ['спритно впоралися', 'дещо проґавили'], route: ['оптимальний маршрут', 'зайвий кілометраж'] };
  const FUNNY = { good: ['керівник поставив вас у приклад', 'колеги аплодують', 'день вдався', 'клієнти задоволені'], bad: ['керівник зітхнув', 'колега прикрив вас', 'наступного разу вийде', 'кава не допомогла'] };
  for (const [jk, j] of Object.entries(G.JOBS)) {
    const P = (G.LOCS[j.loc] || G.LOCS.city).places[j.place]; if (!P) continue;
    P.acts['apply_' + jk] = { n: `Влаштуватися: ${j.ranks[0][0]} (${j.n})`, h: 1, c: 0, hide: L => !!(L.job && L.job.k === jk), need: L => G.jobReqErr(L, jk), r: () => { const r = G.jobTake(jk); return [r.ok ? r.msg : r.err, { mood: r.ok ? 6 : 0 }]; } };
    j.duties.forEach(([id, n, h, lo, hi, mg, xp, night]) => {
      P.acts[`j_${jk}_${id}`] = { n, h, c: 0, daily: 1, night: !!night, mg, job: jk, quiz: jk, hide: L => !(L.job && L.job.k === jk && L.job.lvl >= lo && L.job.lvl <= hi),
        need: L => !L.job || L.job.k !== jk ? `Лише для: ${j.n}` : L.job.lvl < lo ? `З посади «${j.ranks[lo - 1][0]}»` : '',
        r: (L) => { const s = L._mg != null ? clamp(L._mg, 0, 1) : autoScore(L, j); L._mg = null; const ok = s >= 0.45; L.job.dd = (L.job.dd || 0) + (L.job.ddD === G.day ? 0 : 1); L.job.ddD = G.day;
          const gx = xp * (0.3 + s); L.job.xp = (L.job.xp || 0) + gx; const bonus = G.jobPay(L) / 170 * h * (night ? 1.1 : 0.7) * (0.4 + s); L.money += bonus; const tp = G.jobTips ? G.jobTips(L, jk, id, s, h) : 0; if (tp) L.money += tp;
          let extra = '';
          if (id === 'defend') { const win = R() < 0.25 + s * 0.6; const fee = $(300 + L.job.lvl * 250) * (win ? 2 : 1); L.money += fee; extra = win ? ` Справу виграно! Гонорар ${f$(fee)}.` : ` Справу програно, але гонорар ${f$(fee)} ваш.`; L.popu[L.job.nid] = clamp((L.popu[L.job.nid] || 0) + (win ? 1 : -0.3), 0, 100); }
          if (id === 'judge') extra = ok ? ' Рішення залишилося в силі в апеляції.' : ' Апеляція скасувала ваше рішення.';
          if (id === 'op') extra = ok ? ' Пацієнт одужує.' : ' Ускладнення, але пацієнта врятували колеги.';
          if (id === 'task' && jk === 'military') extra = ok ? ' Завдання виконано, командування задоволене.' : ' Завдання виконано частково.';
          const v = VERB[mg] || VERB.quiz; return [`${ok ? '✅' : '⚠'} ${v[ok ? 0 : 1]} (${Math.round(s * 100)}%) — ${pick(FUNNY[ok ? 'good' : 'bad'])}. Досвід +${gx.toFixed(2)}, премія ${f$(bonus)}${tp ? `, ${G.TIPS[jk][1]} ${f$(tp)}` : ''}.${extra}${promo(L, true)}`, { mood: ok ? 3 : -3, hp: night ? -4 : -1 }, ok && s > 0.85 ? 'jackpot' : null]; } };
    });
    P.acts['exam_' + jk] = { n: 'Атестація на підвищення', h: 3, c: 0, mg: 'quiz', quiz: jk, hide: L => !(L.job && L.job.k === jk), need: L => { if (!L.job || L.job.k !== jk) return 'Лише для працівників'; if (L.job.lvl >= 5) return 'Вершина карʼєри'; if ((L.job.exam || -99) + 30 > G.day) return `Повторно — через ${(L.job.exam || -99) + 30 - G.day} дн.`; if (L.job.xp < G.jobNeed(L) * 0.7) return `Замало досвіду: ${L.job.xp.toFixed(1)} з ${(G.jobNeed(L) * 0.7).toFixed(1)}`; return G.jobNextErr(L); },
      r: L => { const s = L._mg != null ? L._mg : autoScore(L, j); L._mg = null; L.job.exam = G.day; if (s >= 0.6) { L.job.xp = Math.max(L.job.xp, G.jobNeed(L)); return [`атестацію складено (${Math.round(s * 100)}%)!${promo(L, true)}`, { mood: 12 }, 'jackpot']; } L.job.xp = Math.max(0, L.job.xp - 1); return [`атестацію не складено (${Math.round(s * 100)}%). Спроба — через місяць`, { mood: -6 }]; } };
    P.acts['quit_' + jk] = { n: 'Звільнитися', h: 0.5, c: 0, hide: L => !(L.job && L.job.k === jk), r: () => { const r = G.jobQuit(); return [r.ok ? r.msg : r.err, { mood: -2 }]; } };
  }
  // мініігри: результат передає інтерфейс
  G.locDoS = function (loc, k, a, s) { const L = G.leader; if (L) L._mg = s == null ? null : clamp(+s, 0, 1); const r = G.locDo(loc, k, a); if (L) L._mg = null; return r; };
  G.act.locDoS = (loc, k, a, s) => G.locDoS(loc, k, a, s);
  G.act.mgSet = s => { const L = G.leader; if (L) L._mg = s == null ? null : clamp(+s, 0, 1); return { ok: true }; };
  G.act.jobTake = k => G.jobTake(k); G.act.jobQuit = () => G.jobQuit();

  // старі модулі: «Біржа праці» лишається для підробітків; професійні справи в суді — через посаду
  if (C.court) { ['pros', 'def'].forEach(a => { if (C.court.acts[a]) C.court.acts[a].hide = L => !(L.job && L.job.k === 'lawyer' && L.job.lvl >= 2); }); }

  // ================= КВАРТАЛИ МІСТА =================
  G.CITY_DIST = {
    gov:   { n: 'Урядовий квартал', ic: '🏛', col: '#7f8fb5', cells: [[3, 0], [6, 0], [3, 1], [6, 1], [3, 2], [4, 2], [5, 2], [6, 2], [3, 3], [4, 3], [5, 3], [6, 3]], p: ['hall', 'court', 'police', 'milhq', 'mfa', 'sb', 'cnap', 'union', 'hq'] },
    biz:   { n: 'Діловий квартал', ic: '💼', col: '#6aa0b8', cells: [[7, 0], [8, 0], [9, 0], [7, 1], [8, 1], [9, 1], [7, 2], [8, 2], [9, 2], [7, 3], [8, 3], [9, 3]], p: ['bank', 'ithub', 'agency', 'jobs', 'press', 'tv', 'mediah', 'auction', 'sportag', 'marina'] },
    trade: { n: 'Торговий квартал', ic: '🛍', col: '#c99a5b', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3]], p: ['mall', 'market', 'boutique', 'tech', 'cars', 'petshop', 'pawn', 'barber', 'lottery', 'shawarma', 'travel', 'rest'] },
    edu:   { n: 'Освіта й медицина', ic: '🎓', col: '#7fb38a', cells: [[3, 4], [4, 4], [5, 4], [6, 4], [3, 5], [4, 5], [5, 5], [6, 5]], p: ['hosp', 'clinic', 'school', 'uni', 'nii'] },
    fun:   { n: 'Розважальний квартал', ic: '🎭', col: '#b07ab8', cells: [[0, 4], [1, 4], [2, 4], [0, 5], [1, 5], [2, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]], p: ['bar', 'club', 'strip', 'casino', 'cinema', 'karaoke', 'quest', 'standup', 'theatre'] },
    sport: { n: 'Спорт і відпочинок', ic: '🏟', col: '#5fae9a', cells: [[7, 4], [8, 4], [9, 4], [7, 5], [8, 5], [9, 5]], p: ['stad', 'gym', 'zoo', 'aqua'] },
    ind:   { n: 'Промзона й порт', ic: '🏭', col: '#9a8f80', cells: [[5, 6], [6, 6], [7, 6], [8, 6], [9, 6]], p: ['logist', 'build', 'agro'] }
  };
  G.placeDist = k => { for (const [d, D] of Object.entries(G.CITY_DIST)) if (D.p.includes(k)) return d; return null; };
});
