// v4.4: чайові й підробітки за фахом на кожному рівні професії; своя справа — фонд $50 тис., допомогу треба здобути в місті
// (співбесіда в банку, захист гранту, пітч інвестору, розмова з рідними, відео для краудфандингу), купівля офісу й виробництва,
// власна назва; малий бізнес має свої заклади (ресторани, кафе, клініки, студії…) і розробки замість заводів сектору.
LORA.sim.register('v44', 100.25, function (G) {
  const { N, ter, T } = G; const clamp = LORA.core.clamp; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const sk = (L, k) => G.skill ? G.skill(L, k) : 0; const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });
  const me = () => G.leader; const nidOf = L => L.job ? L.job.nid : L.home;
  const autoScore = (L, k) => clamp(0.3 + sk(L, k) * 0.11 + (L.mood || 60) / 500 + R() * 0.3, 0, 1);

  // ---------------- ЧАЙОВІ ----------------
  G.TIPS = { cook: [28, 'чайові'], seller: [14, 'бонус від покупців'], driver: [12, 'чайові'], actor: [45, 'гонорар від глядачів'], athlete: [30, 'призові'], doctor: [18, 'подяка пацієнтів'], teacher: [8, 'подарунки від батьків'], pilot: [10, 'подяка пасажирів'] };
  G.jobTips = function (L, jk, id, s, h) { const T0 = G.TIPS[jk]; if (!T0 || s < 0.3) return 0; let v = T0[0] * (1 + 0.45 * (L.job.lvl - 1)) * (s * s * 2.2) * (h / 4); if (s > 0.92 && R() < 0.25) v *= 5; return $(v); };

  // ---------------- ПІДРОБІТКИ ЗА ФАХОМ (від рівня посади) ----------------
  // [мін. посада, ключ, назва, годин, $мін, $макс, перезарядка днів, мініігра]
  G.SIDE = {
    cook: [[1, 'wash', 'Мити посуд у вихідні', 4, 60, 90, 3, 'click'], [2, 'cake', 'Приватне замовлення: торт на свято', 3, 150, 300, 4, 'timing'], [3, 'mclass', 'Кулінарний майстер-клас', 3, 400, 800, 7, 'quiz'], [4, 'wed', 'Кейтеринг весілля', 7, 1200, 2500, 10, 'timing'], [5, 'consult', 'Консультація іншому ресторану', 4, 2500, 5000, 14, 'quiz']],
    seller: [[1, 'promo', 'Промоутер на вихідних', 4, 50, 80, 3, 'click'], [2, 'flip', 'Перепродаж техніки з оголошень', 2, 100, 300, 5, 'quiz'], [3, 'b2b', 'Корпоративний продаж', 4, 500, 1000, 7, 'quiz'], [4, 'fair', 'Організувати ярмарок', 6, 1500, 3000, 10, 'click']],
    driver: [[1, 'taxi', 'Вечір у таксі', 4, 40, 90, 2, 'route'], [2, 'move', 'Перевезти меблі (переїзд)', 4, 120, 250, 4, 'route'], [3, 'intl', 'Перегнати авто з-за кордону', 8, 500, 900, 7, 'route'], [4, 'tender', 'Логістичний тендер на склад', 4, 1500, 3000, 10, 'quiz']],
    pilot: [[2, 'charter', 'Приватний чартер', 6, 800, 1500, 6, 'timing'], [3, 'ferry', 'Перегін літака', 8, 1500, 2500, 8, 'timing'], [4, 'vip', 'VIP-рейс бізнесмена', 6, 3000, 6000, 10, 'timing']],
    builder: [[1, 'repair', 'Ремонт квартири сусіда', 6, 100, 250, 3, 'click'], [2, 'bath', 'Ванна «під ключ»', 6, 300, 600, 5, 'click'], [3, 'house', 'Каркас приватного будинку', 8, 1000, 2000, 8, 'quiz'], [4, 'expert', 'Технічна експертиза будівлі', 3, 1500, 3500, 10, 'quiz']],
    farmer: [[1, 'market', 'Продаж овочів на ринку', 4, 50, 120, 3, 'click'], [2, 'bees', 'Пасіка: продаж меду', 3, 150, 300, 5, 'click'], [3, 'consult', 'Агроконсультація фермеру', 3, 500, 900, 7, 'quiz'], [4, 'lot', 'Експортна партія зерна', 5, 2000, 4000, 12, 'quiz']],
    police: [[2, 'guard', 'Охорона концерту', 6, 150, 300, 4, 'click'], [3, 'train', 'Тренінг із самооборони', 3, 300, 600, 7, 'quiz'], [4, 'audit', 'Аудит безпеки бізнесу', 4, 1500, 3000, 10, 'quiz']],
    military: [[2, 'instr', 'Інструктор з тактичної медицини', 4, 200, 400, 5, 'quiz'], [3, 'club', 'Тренування страйкбольного клубу', 4, 300, 600, 7, 'timing'], [4, 'consult', 'Консультація оборонного заводу', 4, 2000, 4000, 12, 'quiz']],
    lawyer: [[1, 'claim', 'Скласти позов сусідам', 2, 80, 150, 3, 'quiz'], [2, 'consult', 'Юрконсультація бізнесу', 3, 300, 600, 5, 'quiz'], [3, 'deal', 'Супровід угоди', 4, 800, 1600, 7, 'quiz'], [4, 'expert', 'Експертний висновок для суду', 4, 2500, 5000, 12, 'quiz']],
    doctor: [[2, 'night', 'Чергування у приватній клініці', 8, 250, 500, 4, 'click'], [3, 'consult', 'Платна консультація', 2, 300, 600, 5, 'quiz'], [4, 'surgery', 'Складна планова операція', 6, 2500, 5000, 10, 'timing']],
    teacher: [[1, 'tutor', 'Репетиторство', 2, 40, 80, 2, 'quiz'], [2, 'exam', 'Підготовка до вступних тестів', 3, 150, 300, 4, 'quiz'], [3, 'book', 'Написати підручник', 6, 800, 1500, 14, 'quiz'], [4, 'lecture', 'Лекція в бізнес-школі', 3, 1500, 3000, 10, 'quiz']],
    programmer: [[1, 'site', 'Сайт для кавʼярні', 4, 150, 300, 4, 'click'], [2, 'bot', 'Чат-бот на замовлення', 4, 400, 800, 5, 'quiz'], [3, 'freelance', 'Фриланс-проєкт', 6, 1500, 3000, 8, 'quiz'], [4, 'audit', 'Аудит безпеки коду', 4, 3000, 6000, 12, 'quiz']],
    journalist: [[1, 'smm', 'Вести соцмережі кафе', 3, 60, 120, 3, 'click'], [2, 'pr', 'PR-текст для компанії', 3, 200, 400, 4, 'quiz'], [3, 'docu', 'Документальний фільм', 8, 1500, 3000, 14, 'click'], [4, 'host', 'Модерувати конференцію', 4, 2500, 5000, 10, 'quiz']],
    banker: [[2, 'advice', 'Фінансова консультація', 2, 200, 400, 4, 'quiz'], [3, 'deal', 'Структурувати угоду', 4, 1500, 3000, 8, 'quiz'], [4, 'board', 'Засідання наглядової ради', 3, 4000, 8000, 14, 'quiz']],
    diplomat: [[2, 'transl', 'Переклад переговорів', 3, 200, 400, 4, 'quiz'], [3, 'market', 'Консультація з виходу на ринок', 4, 1500, 3000, 8, 'quiz'], [4, 'speech', 'Лекція в Академії дипломатії', 3, 3000, 6000, 12, 'quiz']],
    scientist: [[2, 'review', 'Рецензування статей', 3, 150, 300, 4, 'quiz'], [3, 'patent', 'Патент і ліцензія', 5, 1500, 3500, 12, 'quiz'], [4, 'expert', 'Експертиза держпроєкту', 4, 3000, 6000, 14, 'quiz']],
    actor: [[1, 'corp', 'Ведучий корпоративу', 5, 150, 350, 4, 'timing'], [2, 'ad', 'Зйомка в рекламі', 4, 500, 1200, 6, 'timing'], [3, 'voice', 'Озвучка мультфільму', 4, 1500, 3000, 8, 'timing'], [4, 'show', 'Зірковий гість шоу', 3, 4000, 9000, 12, 'timing']],
    athlete: [[1, 'pt', 'Персональні тренування', 2, 50, 120, 2, 'click'], [2, 'camp', 'Дитячий спортивний табір', 6, 300, 600, 6, 'click'], [3, 'ad', 'Реклама спортивного бренду', 3, 2000, 4000, 10, 'timing'], [4, 'exhib', 'Показовий матч', 4, 5000, 10000, 14, 'timing']]
  };
  for (const [jk, list] of Object.entries(G.SIDE)) { const j = G.JOBS[jk]; if (!j) continue; const P = (G.LOCS[j.loc] || G.LOCS.city).places[j.place]; if (!P) continue;
    list.forEach(([lvl, key, n, h, lo, hi, cd, mg]) => { const K = jk + ':' + key;
      P.acts[`x_${jk}_${key}`] = { n: `💵 ${n}`, h, c: 0, mg, job: jk, quiz: jk, hide: L => !(L.job && L.job.k === jk && L.job.lvl >= lvl),
        need: L => { const c = (L.side || {})[K] || 0; return c > G.day ? `Наступне замовлення — через ${c - G.day} дн.` : ''; },
        r: L => { const s = L._mg != null ? clamp(L._mg, 0, 1) : autoScore(L, j.sk); L._mg = null; (L.side = L.side || {})[K] = G.day + cd;
          const pay = $((lo + (hi - lo) * s) * (1 + 0.15 * (L.job.lvl - lvl))); L.money += pay; L.job.xp += 0.05 + s * 0.08; if (L.job.ddD !== G.day) { L.job.dd = (L.job.dd || 0) + 1; L.job.ddD = G.day; }
          return [`${s >= 0.45 ? '✅' : '⚠'} ${n} (${Math.round(s * 100)}%): замовник заплатив ${f$(pay)}`, { mood: s >= 0.45 ? 4 : -2, hp: -1 }, s > 0.85 ? 'jackpot' : null]; } }; }); }
  G.SIDE_TAB = 1;

  // ---------------- МАЛИЙ БІЗНЕС: типи, заклади, виробництво, розробки ----------------
  // заклад: [ключ, назва, іконка, вартість $, дохід $/міс., днів відкриття]
  const U = (k, n, ic, cost, rev, days) => [k, n, ic, cost, rev, days || 20];
  G.BIZT = {
    rest:   { n: 'Ресторанний бізнес', prod: ['Кухня й обладнання', 30000], units: [U('ftruck', 'Фудтрак', '🚚', 25000, 5500, 10), U('cafe', 'Кавʼярня', '☕', 40000, 9000), U('rest', 'Ресторан', '🍽', 150000, 32000, 40), U('dark', 'Кухня доставки', '🛵', 60000, 14000), U('cater', 'Кейтеринг-цех', '🥂', 90000, 20000, 30)],
      dev: [['menu', 'Авторське меню', 30000, 0.12, 25], ['star', 'Боротьба за зірку Мішлен', 250000, 0.3, 90, 'menu']] },
    shop:   { n: 'Торгівля', prod: ['Склад і касове обладнання', 25000], units: [U('kiosk', 'Кіоск', '🏪', 15000, 3200, 7), U('store', 'Магазин біля дому', '🛒', 60000, 12000), U('super', 'Супермаркет', '🏬', 300000, 60000, 60), U('eshop', 'Інтернет-магазин', '📦', 40000, 9000), U('outlet', 'Аутлет', '🛍', 120000, 24000, 40)],
      dev: [['logi', 'Власна логістика', 60000, 0.12, 30], ['priv', 'Власна торгова марка', 150000, 0.2, 60, 'logi']] },
    trans:  { n: 'Перевезення', prod: ['Гараж і СТО', 35000], units: [U('vans', 'Курʼєрська служба', '📦', 30000, 6500, 10), U('taxi', 'Таксопарк', '🚕', 80000, 16000), U('bus', 'Автобусний маршрут', '🚌', 120000, 22000, 30), U('wh', 'Складський хаб', '🏭', 200000, 38000, 45)],
      dev: [['gps', 'GPS-диспетчеризація', 40000, 0.12, 20], ['ev', 'Електрофлот', 180000, 0.2, 60, 'gps']] },
    air:    { n: 'Авіаційний бізнес', prod: ['Ангар і техобслуговування', 80000], units: [U('charter', 'Чартерний літак', '🛩', 400000, 70000, 40), U('school', 'Авіашкола', '🎓', 120000, 20000, 30), U('heli', 'Гелікоптерні тури', '🚁', 250000, 42000, 40)],
      dev: [['sim', 'Тренажер-симулятор', 150000, 0.12, 40], ['vip', 'VIP-сервіс', 200000, 0.2, 50]] },
    constr: { n: 'Будівництво', prod: ['Техніка й інструмент', 40000], units: [U('crew', 'Ремонтна бригада', '🧰', 20000, 5000, 7), U('concrete', 'Бетонний вузол', '🏗', 150000, 30000, 40), U('dev', 'Житловий проєкт', '🏘', 600000, 120000, 120), U('roads', 'Дорожня бригада', '🛣', 200000, 38000, 45)],
      dev: [['bim', 'Цифрове проєктування', 50000, 0.12, 30], ['green', 'Енергоефективні будинки', 150000, 0.2, 60, 'bim']] },
    farm:   { n: 'Фермерство', prod: ['Трактор і сівалка', 45000], units: [U('field', 'Поле 100 га', '🌾', 40000, 7500, 30), U('green', 'Теплиця', '🍅', 60000, 11000), U('cows', 'Молочна ферма', '🐄', 120000, 22000, 40), U('mill', 'Переробний цех', '🏭', 180000, 34000, 45), U('elev', 'Елеватор', '🛢', 250000, 45000, 60)],
      dev: [['drip', 'Крапельне зрошення', 40000, 0.12, 30], ['organic', 'Органічний сертифікат', 90000, 0.18, 60]] },
    sec:    { n: 'Охоронний бізнес', prod: ['Пульт і екіпіровка', 30000], units: [U('post', 'Охоронні пости', '👮', 20000, 5000, 7), U('mon', 'Пульт моніторингу', '📡', 80000, 16000), U('cash', 'Інкасація', '🚐', 150000, 30000, 40), U('vip', 'Охорона VIP', '🕶', 100000, 22000)],
      dev: [['cams', 'Розумні камери', 50000, 0.12, 25], ['drones', 'Дрони-патрулі', 120000, 0.18, 50, 'cams']] },
    pmc:    { n: 'ПВК', prod: ['Полігон і склад спорядження', 120000], units: [U('range', 'Навчальний полігон', '🎯', 150000, 25000, 40), U('convoy', 'Супровід вантажів', '🚛', 100000, 20000, 30), U('train', 'Підготовка охорони', '🎖', 60000, 12000)],
      dev: [['med', 'Тактична медицина', 50000, 0.1, 25], ['uav', 'Підрозділ БпЛА', 200000, 0.2, 60]] },
    law:    { n: 'Юридична практика', prod: ['Офіс практики й бібліотека', 20000], units: [U('consult', 'Юридична консультація', '⚖', 15000, 4500, 7), U('firm', 'Офіс практики', '🏛', 80000, 18000), U('notary', 'Нотаріальна контора', '📜', 60000, 13000), U('arb', 'Арбітражна група', '🌐', 150000, 32000, 40)],
      dev: [['ai', 'Юридичний ШІ-помічник', 60000, 0.14, 30], ['intl', 'Міжнародна практика', 150000, 0.2, 60]] },
    clinic: { n: 'Приватна медицина', prod: ['Медичне обладнання', 60000], units: [U('room', 'Кабінет лікаря', '🩺', 25000, 6000, 10), U('clinic', 'Клініка', '🏥', 200000, 40000, 45), U('lab', 'Лабораторія аналізів', '🧪', 90000, 18000), U('dent', 'Стоматологія', '🦷', 80000, 17000), U('pharm', 'Аптека', '💊', 40000, 9000)],
      dev: [['tele', 'Телемедицина', 50000, 0.12, 25], ['mri', 'МРТ-центр', 300000, 0.25, 70]] },
    school: { n: 'Приватна освіта', prod: ['Класи й обладнання', 25000], units: [U('tutor', 'Репетиторський центр', '📚', 15000, 4000, 7), U('lang', 'Мовні курси', '🗣', 40000, 9000), U('school', 'Приватна школа', '🏫', 250000, 45000, 60), U('online', 'Онлайн-академія', '💻', 60000, 14000)],
      dev: [['method', 'Авторська методика', 40000, 0.12, 30], ['accr', 'Міжнародна акредитація', 150000, 0.22, 60, 'method']] },
    it:     { n: 'IT-бізнес', prod: ['Сервери й ліцензії', 30000], units: [U('team', 'Команда розробки', '👩‍💻', 40000, 10000), U('saas', 'SaaS-продукт', '☁', 120000, 28000, 45), U('app', 'Мобільний застосунок', '📱', 80000, 18000, 30), U('dc', 'Дата-центр', '🗄', 500000, 95000, 90)],
      dev: [['ai', 'Власна модель ШІ', 200000, 0.25, 60], ['sec', 'Сертифікація безпеки', 60000, 0.12, 30]] },
    media:  { n: 'Медіа', prod: ['Студія й камери', 25000], units: [U('site', 'Онлайн-видання', '📰', 20000, 5000, 10), U('yt', 'Відеоканал', '▶', 30000, 7500), U('pod', 'Подкаст-студія', '🎙', 25000, 6000), U('radio', 'Радіостанція', '📻', 150000, 30000, 45), U('tv', 'Телеканал', '📺', 600000, 110000, 90)],
      dev: [['paywall', 'Платна підписка', 40000, 0.12, 25], ['invest', 'Розслідувальний відділ', 90000, 0.18, 45]] },
    inv:    { n: 'Інвестиції', prod: ['Торговий термінал і ліцензія', 50000], units: [U('broker', 'Брокерський офіс', '📈', 60000, 13000), U('fund', 'Інвестиційний фонд', '💼', 250000, 50000, 45), U('cu', 'Кредитна спілка', '🏦', 120000, 24000, 40)],
      dev: [['algo', 'Алгоритмічна торгівля', 120000, 0.18, 45], ['wm', 'Управління статками', 80000, 0.12, 30]] },
    trade:  { n: 'Зовнішня торгівля', prod: ['Склад тимчасового зберігання', 40000], units: [U('exp', 'Експортний офіс', '🌍', 40000, 9000), U('broker', 'Митний брокер', '🛃', 30000, 7000), U('house', 'Торговий дім', '🏢', 200000, 40000, 45)],
      dev: [['fta', 'Знання торговельних угод', 50000, 0.12, 30], ['net', 'Мережа партнерів за кордоном', 120000, 0.2, 60]] },
    lab:    { n: 'Наукоємний бізнес', prod: ['Лабораторне обладнання', 60000], units: [U('lab', 'Приватна лабораторія', '🔬', 80000, 16000, 30), U('incub', 'Стартап-інкубатор', '🐣', 120000, 22000, 40), U('patent', 'Патентне бюро', '📄', 40000, 9000)],
      dev: [['grant', 'Грантовий відділ', 40000, 0.1, 25], ['spin', 'Спін-оф компанії', 200000, 0.25, 70]] },
    prod:   { n: 'Продакшн', prod: ['Камери, світло, звук', 40000], units: [U('studio', 'Студія звукозапису', '🎚', 40000, 9000), U('prod', 'Відеопродакшн', '🎬', 90000, 19000), U('troupe', 'Театральна трупа', '🎭', 60000, 12000), U('cast', 'Кастинг-агенція', '⭐', 30000, 7000)],
      dev: [['stars', 'Контракти з зірками', 120000, 0.2, 45], ['fest', 'Власний фестиваль', 200000, 0.22, 60]] },
    club:   { n: 'Спорт', prod: ['Тренажери й інвентар', 35000], units: [U('gym', 'Фітнес-клуб', '🏋', 60000, 13000), U('school', 'Спортивна школа', '⚽', 40000, 8500), U('team', 'Професійна команда', '🏟', 400000, 70000, 90), U('food', 'Спортивне харчування', '🥤', 50000, 11000)],
      dev: [['academy', 'Академія талантів', 100000, 0.15, 45], ['stream', 'Трансляції матчів', 150000, 0.2, 50]] }
  };
  G.BIZDEV = [['mkt', 'Маркетингова кампанія', 20000, 0.08, 20], ['crm', 'CRM і програма лояльності', 35000, 0.1, 30], ['staff', 'Навчання персоналу', 25000, 0.08, 20], ['online', 'Онлайн-продажі', 50000, 0.12, 30], ['brand', 'Преміум-бренд', 120000, 0.18, 45, null, 3], ['franch', 'Франшиза', 200000, 0.25, 60, 'brand', 5]];
  G.JOB_BIZT = { cook: 'rest', seller: 'shop', driver: 'trans', pilot: 'air', builder: 'constr', farmer: 'farm', police: 'sec', military: 'pmc', lawyer: 'law', doctor: 'clinic', teacher: 'school', programmer: 'it', journalist: 'media', banker: 'inv', diplomat: 'trade', scientist: 'lab', actor: 'prod', athlete: 'club' };
  G.bizDevs = c => { const B = G.BIZT[c.bizType]; return B ? B.dev.concat(G.BIZDEV) : []; };
  // ---------------- КРОКИ ВІДКРИТТЯ (перевизначення v4.3) ----------------
  const FUND_MIN = 50000;
  const typeOf = b => b.ty || G.JOB_BIZT[b.job];
  G.bizReady = b => !b ? ['Справу не розпочато'] : [b.fund < $(FUND_MIN) ? 'фонд ≥ $50 тис.' : '', !b.plan ? 'бізнес-план' : '', !b.office ? 'офіс' : '', !b.prod ? 'виробництво' : '', !b.reg ? 'реєстрація й ліцензія' : '', b.team < 1 ? 'команда' : ''].filter(Boolean);
  G.bizOfficeCost = $(15000); G.bizProd = b => { const B = G.BIZT[typeOf(b)]; return B ? B.prod : ['Обладнання', 30000]; };
  // допомогу не дають «просто так»: треба піти в місто й пройти випробування
  G.BIZ_HELPP = { loan: ['bank', 'Співбесіда в банку щодо кредиту для справи', 'quiz', 'banker', 3], grant: ['cnap', 'Захистити заявку на грант', 'quiz', 'lawyer', 4], investor: ['ithub', 'Пітч перед інвестором', 'timing', 'banker', 3], family: ['park', 'Сімейна рада в парку: розповісти про план', null, null, 2], crowd: ['tv', 'Записати відео для краудфандингу', 'click', 'journalist', 4] };
  const helpErr = (L, k) => { const b = L.biz; if (!b) return 'Справу не розпочато'; if (!b.plan) return 'Спершу бізнес-план'; if (b.fund < $(10000)) return 'Відкладіть у фонд хоча б $10 тис.'; if (b.help[k]) return 'Вже домовились';
    if (Object.keys(b.help).filter(x => b.help[x].amt).length >= 2) return 'Не більше двох джерел допомоги'; if ((b.helpCd || {})[k] > G.day) return `Повторно — через ${b.helpCd[k] - G.day} дн.`;
    if (k === 'loan' && L.job && G.day - (L.job.d0 || 0) < 60) return 'Банк хоче бачити 2+ місяці стабільної роботи'; if (k === 'crowd' && (L.fame || 0) < 3) return 'Потрібна слава 3+';
    if (k === 'grant' && (L.popu[nidOf(L)] || 0) < 10) return 'Грант дають відомим: популярність 10+'; return ''; };
  G.bizHelpErr = helpErr;
  for (const [k, [pl, n, mg, quiz, h]] of Object.entries(G.BIZ_HELPP)) { const P = G.LOCS.city.places[pl]; if (!P) continue;
    P.acts['bh_' + k] = { n: `🚀 ${n}`, h, c: k === 'family' ? 0.00000008 : 0, mg: mg || undefined, quiz: quiz || undefined, hide: L => !(L.biz && L.biz.plan && !L.biz.help[k]), need: L => helpErr(L, k),
      r: L => { const s = mg ? (L._mg != null ? clamp(L._mg, 0, 1) : autoScore(L, 'biz')) : 0.6; L._mg = null; const b = L.biz; let ch = 0, amt = 0, extra = {};
        if (k === 'loan') { ch = 0.15 + sk(L, 'eco') * 0.06 + b.plan * 0.05 + s * 0.45; amt = b.fund * 6; extra = { debt: amt }; }
        if (k === 'grant') { ch = 0.05 + (L.popu[nidOf(L)] || 0) / 250 + b.plan * 0.05 + s * 0.4; amt = b.fund * 2; }
        if (k === 'investor') { ch = 0.1 + b.plan * 0.07 + (L.fame || 0) * 0.01 + s * 0.45; amt = b.fund * 10; extra = { share: 0.4 }; }
        if (k === 'family') { ch = 0.9; amt = b.fund * 0.5; }
        if (k === 'crowd') { ch = 0.25 + s * 0.5; amt = b.fund * Math.min(4, (L.fame || 0) * 0.3); }
        ch = clamp(ch, 0.05, 0.95);
        if (R() > ch) { (b.helpCd = b.helpCd || {})[k] = G.day + 30; return [`❌ ${G.BIZ_HELP[k][1]}: відмова (оцінка ${Math.round(s * 100)}%, шанс був ${Math.round(ch * 100)}%). Покращте план і спробуйте за місяць`, { mood: -6 }]; }
        b.help[k] = Object.assign({ amt }, extra); return [`✅ ${G.BIZ_HELP[k][1]}: погоджено ${f$(amt)}! (оцінка ${Math.round(s * 100)}%)`, { mood: 10 }, 'jackpot']; } }; }
  { const base = G.bizDo; G.bizDo = function (step, arg) { const L = me(); const b = L && L.biz; if (!b) return no('Справу не розпочато');
    if (step === 'help') { const P = G.BIZ_HELPP[arg]; return no(`Допомогу треба здобути: місто → ${G.LOCS.city.places[P[0]].n} → «${P[1]}»`); }
    if (step === 'place') return no('Купіть офіс і виробництво');
    if (step === 'office') { if (b.office) return no('Офіс уже куплено'); if (L.money < G.bizOfficeCost) return no(`Офіс коштує ${f$(G.bizOfficeCost)}`); L.money -= G.bizOfficeCost; b.office = 1; return ok('офіс куплено — є де приймати клієнтів'); }
    if (step === 'prod') { const P = G.bizProd(b); if (b.prod) return no('Вже куплено'); if (L.money < $(P[1])) return no(`${P[0]}: ${f$($(P[1]))}`); L.money -= $(P[1]); b.prod = 1; return ok(`куплено: ${P[0].toLowerCase()}`); }
    if (step === 'name') { const nm = String(arg || '').replace(/[<>"`]/g, '').trim().slice(0, 40); if (nm.length < 2) return no('Назва надто коротка'); b.name = nm; return ok(`назва: «${nm}»`); }
    if (step === 'team') { const n = Math.round(+arg || 1); const cap = (b.office ? 4 : 0) + (b.prod ? 8 : 0); if (!b.office) return no('Спершу офіс'); if (b.team + n > cap) return no(`Вміститься ${cap} людей (офіс 4 + виробництво 8)`); if (L.money < $(1500) * n) return no(`Найм: ${f$($(1500) * n)}`); L.money -= $(1500) * n; b.team += n; return ok(`найнято ${n} (команда: ${b.team})`); }
    if (step === 'cancel') { const back = b.fund * 0.9 + (b.office ? G.bizOfficeCost * 0.6 : 0) + (b.prod ? $(G.bizProd(b)[1]) * 0.5 : 0); L.money += back; L.biz = null; return ok(`задум відкладено; повернуто ${f$(back)} (фонд 90%, майно — частково)`); }
    return base(step, arg); }; }
  { const base = G.bizOpen; G.bizOpen = function () { const L = me(); const b = L && L.biz; const miss = G.bizReady(b); if (miss.length) return no('Ще потрібно: ' + miss.join(', ')); const ty = typeOf(b); b.place = b.place || 'own';
    const r = base(); if (!r.ok) return r; const c = G.myCo(); if (c) { c.base = 0; c.small = 1; c.bizType = ty; c.bunits = [{ k: G.BIZT[ty].units[0][0], t: c.offices[0].t, lvl: 1, d0: G.day, open: G.day }]; c.bdev = {}; c.bres = null; } return r; }; }
  // ---------------- ЗАКЛАДИ Й РОЗРОБКИ ----------------
  const unitDef = (c, k) => (G.BIZT[c.bizType] || { units: [] }).units.find(u => u[0] === k);
  const loc = t => clamp(0.6 + (ter[t] ? ter[t].gdp : 20) / 150, 0.6, 1.8);
  G.bizDevMul = c => G.bizDevs(c).reduce((s, d) => s + ((c.bdev || {})[d[0]] === 'done' ? d[3] : 0), 0);
  G.unitRev = (c, u) => { const D = unitDef(c, u.k); if (!D || u.open > G.day) return 0; const occ = ter[u.t] && ter[u.t].ctrl !== ter[u.t].owner; return occ ? 0 : $(D[4]) * u.lvl * (1 + G.bizDevMul(c)) * loc(u.t) * (1 - (ter[u.t] ? ter[u.t].dmg : 0)); };
  G.bizMonthly = c => (c.bunits || []).reduce((s, u) => s + G.unitRev(c, u), 0);
  G.bunitErr = function (c, k, t) { if (!c || !c.bizType) return 'Лише для малого бізнесу'; const D = unitDef(c, k); if (!D) return '?'; if (t == null || !ter[t]) return 'Оберіть місто';
    const n = ter[t].ctrl; if (n !== c.home && !G.coHasOffice(c, n)) return 'Потрібен офіс у цій країні'; if (G.atWar(c.home, n)) return 'Війна'; if ((c.bunits || []).filter(u => u.t === t && u.k === k).length) return 'Тут такий заклад уже є — розширте його';
    if (c.cash < $(D[3])) return `Коштує ${f$($(D[3]))}`; return ''; };
  G.bunitOpen = function (k, t) { const c = G.myCo(); const e = G.bunitErr(c, k, t); if (e) return no(e); const D = unitDef(c, k); c.cash -= $(D[3]); c.bunits.push({ k, t, lvl: 1, d0: G.day, open: G.day + D[5] }); return ok(`${D[2]} ${D[1]} — ${T[t].n}: відкриття через ${D[5]} дн.`); };
  G.bunitUp = function (i) { const c = G.myCo(); const u = c && c.bunits && c.bunits[i]; if (!u) return no('Немає закладу'); const D = unitDef(c, u.k); if (u.lvl >= 5) return no('Максимальний рівень'); if (u.open > G.day) return no('Ще відкривається'); const cost = $(D[3]) * u.lvl * 0.8; if (c.cash < cost) return no(`Розширення: ${f$(cost)}`); c.cash -= cost; u.lvl++; u.open = G.day + Math.ceil(D[5] / 2); return ok(`${D[1]} розширюється до рівня ${u.lvl}`); };
  G.bunitClose = function (i) { const c = G.myCo(); const u = c && c.bunits && c.bunits[i]; if (!u) return no('Немає закладу'); if (c.bunits.length <= 1) return no('Це останній заклад'); const D = unitDef(c, u.k); const back = $(D[3]) * u.lvl * 0.35; c.cash += back; c.bunits.splice(i, 1); return ok(`${D[1]} продано за ${f$(back)}`); };
  G.bdevErr = function (c, k) { if (!c || !c.bizType) return 'Лише для малого бізнесу'; const d = G.bizDevs(c).find(x => x[0] === k); if (!d) return '?'; const st = (c.bdev || {})[k]; if (st === 'done') return 'Вже впроваджено'; if (c.bres) return 'Вже йде інша розробка';
    if (d[5] && (c.bdev || {})[d[5]] !== 'done') return `Спершу «${(G.bizDevs(c).find(x => x[0] === d[5]) || [0, d[5]])[1]}»`; if (d[6] && (c.bunits || []).length < d[6]) return `Потрібно закладів: ${d[6]}+`; if (c.cash < $(d[2])) return `Коштує ${f$($(d[2]))}`; return ''; };
  G.bdevStart = function (k) { const c = G.myCo(); const e = G.bdevErr(c, k); if (e) return no(e); const d = G.bizDevs(c).find(x => x[0] === k); c.cash -= $(d[2]); c.bres = { k, d0: G.day, done: G.day + d[4] }; return ok(`розробка «${d[1]}»: ${d[4]} дн.`); };
  G.h29.d.push(() => { G.companies.forEach(c => { if (!c.bres || G.day < c.bres.done) return; const d = G.bizDevs(c).find(x => x[0] === c.bres.k); (c.bdev = c.bdev || {})[c.bres.k] = 'done'; c.bres = null; if (!c.ai && d) G.say(`💡 «${c.name}»: впроваджено «${d[1]}» — дохід закладів +${Math.round(d[3] * 100)}%`, 'good', [c.home]); }); });
  G.h29.m.push(() => { G.companies.forEach(c => { if (!c.alive || !c.bunits || !c.bunits.length) return; const v = G.bizMonthly(c) * (0.85 + R() * 0.3); c.cash += v; c.bLast = v; c.bEarn = (c.bEarn || 0) + v; }); });
  Object.assign(G.act, { bunitOpen: (k, t) => G.bunitOpen(k, t), bunitUp: i => G.bunitUp(i), bunitClose: i => G.bunitClose(i), bdevStart: k => G.bdevStart(k) });
});
