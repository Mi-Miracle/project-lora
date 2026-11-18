// ГЕНЕРАТОР КУМЕДНИХ НОВИН (UA/EN). Усі персонажі вигадані. Шаблони збираються з частин, тому варіантів — десятки тисяч.
// LORA.FUN.gen(lang, place?, rnd?) — один заголовок; LORA.FUN.next(lang) — наступний без повторів (памʼятає останні 1500).
(function () {
  const L = (typeof LORA !== 'undefined') ? LORA : (globalThis.LORA = {});
  // ---------- ручні заголовки
  const HAND = [
    ['ТЕРМІНОВО: лідери світу сперечаються, хто перший натиснув червону кнопку. Виявилось — кіт', 'BREAKING: world leaders argue about who pressed the red button first. It was the cat'],
    ['Біржі нервово реагують на те, що біржі нервово реагують', 'Markets react nervously to markets reacting nervously'],
    ['Парламент ухвалив закон про швидше ухвалення законів. Розгляд триватиме три роки', 'Parliament passes a law on passing laws faster. Review will take three years'],
    ['Нафта дорожчає після того, як аналітик чхнув у прямому ефірі', 'Oil prices rise after an analyst sneezes on live TV'],
    ['Курс валют стабільний: стабільно непередбачуваний', 'Exchange rate is stable: stably unpredictable'],
    ['Учені довели: наради, які могли бути листом, справді могли бути листом', 'Scientists prove meetings that could have been an email could have been an email'],
    ['Синоптики: завтра буде погода. Подробиці — після', 'Forecasters: there will be weather tomorrow. Details afterwards'],
    ['Державний застосунок перевіряє, чи працює державний застосунок', 'The state app now checks whether the state app works'],
    ['Центробанк надрукував гроші, щоб оплатити друк грошей', 'Central bank prints money to pay for printing money'],
    ['На саміті G20 закінчилися круасани — переговори під загрозою', 'The G20 summit runs out of croissants — talks in jeopardy'],
    ['НЛО над столицею виявилося рекламним дирижаблем шаурми', 'The UFO over the capital turns out to be a kebab advertising blimp'],
    ['Хакери зламали урядовий сайт і виправили всі помилки', 'Hackers break into a government website and fix all the bugs'],
    ['Тендер на закупівлю здорового глузду не відбувся — жодної заявки', 'Tender for common sense fails — zero bids'],
    ['У міністерстві знайшли принтер, що працює. Його взято під охорону', 'A working printer is found in a ministry. It is now under armed guard'],
    ['Біржа впала. Підняли, обтрусили, торгують далі', 'The stock market fell. Picked up, dusted off, trading resumes'],
    ['Офіційно: понеділок визнано шкідливим для економіки', 'Official: Monday declared harmful to the economy'],
    ['Пенсійний фонд інвестував у мемкоїни. Мемкоїни інвестували в пенсійний фонд', 'Pension fund invests in memecoins. Memecoins invest in the pension fund'],
    ['Новий податок на податки ввели тимчасово. Назавжди', 'A new tax on taxes is introduced temporarily. Forever'],
    ['Морський флот вийшов у море й зрозумів, що забув море', 'The navy sets sail and realises it forgot the sea'],
    ['Економісти розділилися на два табори. Обидва помиляються', 'Economists split into two camps. Both are wrong'],
    ['Прокуратура відкрила справу проти справи', 'Prosecutors open a case against a case'],
    ['Глобальне потепління відклали через погану погоду', 'Global warming postponed due to bad weather'],
    ['Біржовий бот купив сам себе й пішов на пенсію', 'A trading bot buys itself and retires'],
    ['Дипломати домовилися продовжити домовлятися', 'Diplomats agree to keep agreeing'],
    ['Мільярдер запустив ракету на Місяць, щоб краще бачити свій будинок', 'A billionaire launches a rocket to the Moon to get a better view of his house'],
    ['Партія «Ще не вирішили» лідирує в опитуваннях', 'The "Haven’t Decided Yet" party leads the polls'],
    ['Президент сказав «коротко» — і виступав дві години', 'The president said "briefly" — and spoke for two hours'],
    ['Учені знайшли сенс життя, але він на технічному обслуговуванні', 'Scientists find the meaning of life, but it’s down for maintenance'],
    ['Ліфт у парламенті застряг між поверхами. Депутати встигли ухвалити три закони', 'Parliament lift stuck between floors. MPs manage to pass three laws inside'],
    ['В армії запровадили посаду головного по мемах', 'The army creates the post of Chief Meme Officer']
  ];
  // ---------- А: хто + що робить (теперішній час, однина — без родів)
  const SUBJ = [['Міністр вареників', 'The Minister of Dumplings'], ['Генерал у відпустці', 'A general on vacation'], ['Центробанк', 'The central bank'], ['Податкова служба', 'The tax office'],
    ['Кіт президента', 'The president’s cat'], ['Парламентський буфет', 'The parliament canteen'], ['Головний синоптик', 'The chief forecaster'], ['Сусідній диктатор', 'A neighbouring dictator'],
    ['Найстарший депутат', 'The oldest MP'], ['Міністерство цифри', 'The Ministry of Digital'], ['Бойовий гусак', 'A combat goose'], ['Посол у шкарпетках', 'An ambassador in socks'],
    ['Державний бюджет', 'The state budget'], ['Нафтовий магнат', 'An oil tycoon'], ['Прес-секретар уряду', 'The government spokesperson'], ['Урядовий штучний інтелект', 'The government AI'],
    ['Інфляція', 'Inflation'], ['Аналітик з телевізора', 'A TV analyst'], ['Бабуся з черги в ЦНАП', 'A granny from the passport-office queue'], ['Секретний агент', 'A secret agent'],
    ['Біржовий брокер', 'A stockbroker'], ['Генсек ООН', 'The UN chief'], ['Міністр погоди', 'The Minister of Weather'], ['Адмірал без флоту', 'An admiral without a fleet'],
    ['Головний бухгалтер країни', 'The nation’s chief accountant'], ['Пресслужба Генштабу', 'The General Staff press office'], ['Космічне агентство', 'The space agency'], ['Робот-прибиральник Ради', 'The parliament cleaning robot'],
    ['Тіньовий уряд', 'The shadow cabinet'], ['Міська рада столиці', 'The capital city council'], ['Голова антимонопольного комітету', 'The antitrust chief'], ['Відомий блогер-економіст', 'A famous blogger-economist'],
    ['Посольство на Місяці', 'The embassy on the Moon'], ['Директор зоопарку', 'The zoo director'], ['Мер провінційного містечка', 'A small-town mayor'], ['Капітан підводного човна', 'A submarine captain'],
    ['Шеф-кухар президента', 'The president’s chef'], ['Голова виборчої комісії', 'The election commission chief'], ['Міністр оптимізму', 'The Minister of Optimism'], ['Відділ кадрів Пентагону', 'The Pentagon HR department'],
    ['Стратегічний запас гречки', 'The strategic buckwheat reserve'], ['Мовна комісія', 'The language commission'], ['Державний астролог', 'The state astrologer'], ['Охоронець біржі', 'The stock exchange guard'],
    ['Тренер національної збірної', 'The national team coach'], ['Розумний холодильник міністра', 'The minister’s smart fridge'], ['Дрон-кур’єр уряду', 'The government courier drone'], ['Головний санлікар', 'The chief sanitary officer'],
    ['Фонд держмайна', 'The state property fund'], ['Профспілка шпигунів', 'The spies’ union'], ['Віце-прем’єр з питань понеділків', 'The deputy PM for Mondays'], ['Магнат-криптоман', 'A crypto-obsessed tycoon']];
  const PRED = [['вимагає зробити кожен понеділок вихідним', 'demands that every Monday be a day off'], ['таємно вчить TikTok-танці для саміту', 'secretly learns TikTok dances for the summit'],
    ['оголошує війну паперовій бюрократії', 'declares war on paper bureaucracy'], ['продає в інтернеті трохи вживаний танк', 'sells a slightly used tank online'],
    ['просить більше дронів і ще трохи кави', 'asks for more drones and a bit more coffee'], ['пояснює кризу ретроградним Меркурієм', 'blames the crisis on Mercury retrograde'],
    ['вперше дочитує бюджет до кінця й непритомніє', 'finishes reading the budget for the first time and faints'], ['запускає власну криптовалюту «ГречкаКоїн»', 'launches its own cryptocurrency "BuckwheatCoin"'],
    ['обіцяє відремонтувати всі дороги до 2099 року', 'promises to fix every road by 2099'], ['веде переговори з голубами про площу перед урядом', 'negotiates with pigeons over the square outside government'],
    ['збирає підписи за повернення дискет', 'collects signatures to bring back floppy disks'], ['подає до суду на понеділок', 'sues Monday'],
    ['називає ситуацію «стабільно непередбачуваною»', 'calls the situation "stably unpredictable"'], ['переходить на чотириденний робочий тиждень', 'switches to a four-day work week'],
    ['знаходить у кишені $2 млрд і закриває дефіцит', 'finds $2 billion in a pocket and closes the deficit'], ['вчить нейромережу заповнювати декларації', 'teaches a neural network to fill in tax returns'],
    ['пише гімн для курсу валют', 'writes an anthem for the exchange rate'], ['скасовує гравітацію на вихідні', 'cancels gravity for the weekend'],
    ['бере кредит, щоб віддати кредит', 'takes out a loan to repay a loan'], ['приходить на саміт у піжамі', 'shows up at the summit in pyjamas'],
    ['оголошує тендер на закупівлю оптимізму', 'opens a tender to procure optimism'], ['стає блогером і обганяє уряд за підписниками', 'becomes a blogger and overtakes the government in followers'],
    ['вимагає, щоб наради тривали не довше за мем', 'demands that no meeting last longer than a meme'], ['відкриває курси «Як пережити планірку»', 'opens a course on "Surviving the stand-up"'],
    ['пропонує обміняти держборг на смайлики', 'proposes swapping public debt for emojis'], ['вирішує проблему пробок, заборонивши ранок', 'solves traffic jams by banning mornings'],
    ['випадково купує острів замість принтера', 'accidentally buys an island instead of a printer'], ['запускає подкаст про інфляцію під ASMR', 'launches an ASMR podcast about inflation'],
    ['ставить світовий рекорд з підписання указів за хвилину', 'sets a world record for decrees signed per minute'], ['переписує конституцію в стилі мемів', 'rewrites the constitution as memes'],
    ['ховає стратегічний запас печива в сейфі', 'hides the strategic cookie reserve in a safe'], ['вимагає компенсацію за поганий Wi-Fi у бункері', 'demands compensation for bad Wi-Fi in the bunker'],
    ['обіцяє ВВП +300%, якщо всі встануть о 5 ранку', 'promises +300% GDP if everyone wakes up at 5 a.m.'], ['навчає голубів доставляти пошту швидше за пошту', 'trains pigeons to deliver mail faster than the post'],
    ['оголошує конкурс на найкоротшу промову', 'announces a contest for the shortest speech'], ['замовляє 40 тонн скотчу «на всяк випадок»', 'orders 40 tonnes of duct tape "just in case"'],
    ['пропонує платити зарплату компліментами', 'proposes paying salaries in compliments'], ['впроваджує дрес-код «шкарпетки під сандалі»', 'introduces a "socks with sandals" dress code'],
    ['будує стіну з паперу від старих звітів', 'builds a wall from old reports'], ['пропонує перенести Новий рік на липень', 'suggests moving New Year to July'],
    ['вирішує всі проблеми одним наказом — «Розібратися»', 'solves every problem with a single order: "Sort it out"'], ['домовляється з інфляцією про перемир’я', 'negotiates a truce with inflation'],
    ['відкриває посольство в метавсесвіті', 'opens an embassy in the metaverse'], ['дає інтерв’ю з бункера в окулярах VR', 'gives an interview from a bunker wearing VR goggles'],
    ['продає автографи, щоб закрити дефіцит', 'sells autographs to close the deficit'], ['оголошує себе стратегічним ресурсом', 'declares itself a strategic resource'],
    ['вимагає двох понеділків на тиждень для звітності', 'demands two Mondays a week for paperwork'], ['ремонтує дорогу, яку вже ремонтували вчора', 'repairs a road that was repaired yesterday'],
    ['пише указ ручкою, позиченою в журналіста', 'signs a decree with a pen borrowed from a journalist'], ['організовує мітинг на підтримку вихідних', 'holds a rally in support of weekends'],
    ['закуповує дрони, що самі пишуть звіти', 'buys drones that write their own reports'], ['пропонує обкласти податком прокрастинацію', 'proposes a tax on procrastination'],
    ['вимагає ввести у школах урок «Як не панікувати»', 'demands a school lesson on "How not to panic"'], ['оголошує поточний тиждень найкращим в історії', 'declares this week the best in history'],
    ['таємно грає в цю гру замість роботи', 'secretly plays this game instead of working'], ['пропонує замінити звіти коміксами', 'proposes replacing reports with comics']];
  // ---------- Б: опитування
  const GRP = [['пенсіонерів', 'pensioners'], ['студентів', 'students'], ['депутатів', 'MPs'], ['генералів', 'generals'], ['айтішників', 'IT workers'], ['фермерів', 'farmers'], ['котів', 'cats'], ['бухгалтерів', 'accountants'],
    ['таксистів', 'taxi drivers'], ['стрімерів', 'streamers'], ['економістів', 'economists'], ['мерів міст', 'mayors'], ['дипломатів', 'diplomats'], ['шпигунів', 'spies'], ['вчителів', 'teachers'], ['інвесторів', 'investors'],
    ['офіціантів', 'waiters'], ['пілотів', 'pilots'], ['програмістів', 'programmers'], ['міністрів', 'ministers'], ['глядачів чату', 'chat viewers'], ['моряків', 'sailors']];
  const OPIN = [['вірять, що інфляція — вигадка', 'believe inflation is made up'], ['вважають понеділок найгіршим днем економіки', 'consider Monday the worst day for the economy'], ['хочуть президента-кота', 'want a cat for president'],
    ['не розуміють, що таке ВВП, але він їм подобається', 'don’t know what GDP is but like it anyway'], ['вважають, що нарада — це вид спорту', 'think meetings are a sport'], ['готові платити податки, якщо їх назвуть донатами', 'would pay taxes if they were called donations'],
    ['впевнені, що дрони стежать за ними. Дрони підтверджують', 'are sure drones watch them. Drones confirm'], ['хочуть чотириденний тиждень і п’ятиденні вихідні', 'want a four-day week and five-day weekends'], ['вважають гречку валютою', 'consider buckwheat a currency'],
    ['не знають, хто зараз міністр, і цим задоволені', 'don’t know who the minister is and are happy about it'], ['вірять у світле майбутнє, але не цього тижня', 'believe in a bright future, just not this week'], ['вважають, що ракети мають бути екологічними', 'think missiles should be eco-friendly'],
    ['вимагають, щоб новини були смішнішими', 'demand funnier news'], ['вважають біржу казино з краватками', 'think the stock market is a casino with ties'], ['готові воювати, але лише після обіду', 'are ready to fight, but only after lunch'],
    ['хочуть, щоб парламент працював онлайн з вимкненою камерою', 'want parliament to work online with cameras off'], ['вірять астрологу більше, ніж центробанку', 'trust the astrologer more than the central bank'], ['вважають, що бюджет пишуть нейромережі', 'think the budget is written by AI'],
    ['не проти космічної програми, якщо там є Wi-Fi', 'support the space programme if there’s Wi-Fi'], ['вважають дипломатію мистецтвом мовчки їсти круасани', 'think diplomacy is the art of silently eating croissants']];
  // ---------- В: місце + подія (повне речення)
  const PLACE = [['У столиці', 'In the capital'], ['На кордоні', 'At the border'], ['У Брюсселі', 'In Brussels'], ['На біржі', 'On the stock exchange'], ['У парламенті', 'In parliament'], ['На орбіті', 'In orbit'],
    ['У Генштабі', 'At the General Staff'], ['На саміті', 'At the summit'], ['У провінції', 'In the provinces'], ['У порту', 'At the port'], ['На космодромі', 'At the spaceport'], ['У міністерстві фінансів', 'At the finance ministry'],
    ['У посольстві', 'At the embassy'], ['На військовій базі', 'At an army base'], ['У ЦНАПі', 'At the passport office'], ['У бункері', 'In the bunker'], ['На фермі', 'On a farm'], ['У дата-центрі', 'In a data centre']];
  const INC = [['кіт виграв вибори в ОСББ', 'a cat wins the residents’ association election'], ['знайшли склад загублених законопроєктів', 'a warehouse of lost bills is found'], ['пройшла нарада про скорочення нарад', 'a meeting on reducing meetings was held'],
    ['чергу за довідками визнали пам’яткою архітектури', 'the queue for certificates is declared a historic monument'], ['гуси оголосили страйк', 'geese go on strike'], ['робот-прибиральник попросив підвищення', 'a cleaning robot asks for a raise'],
    ['відкрили курси для голубів-розвідників', 'courses for scout pigeons open'], ['принтер нарешті надрукував бюджет. Без помилок не вийшло', 'the printer finally prints the budget. Not without typos'], ['з’явився перший у світі безпілотний бюрократ', 'the world’s first autonomous bureaucrat appears'],
    ['дрон доставив піцу не тому генералу', 'a drone delivers pizza to the wrong general'], ['ракета повернулася — забула документи', 'a missile comes back — it forgot its papers'], ['туристи сплутали танк з атракціоном', 'tourists mistake a tank for an amusement ride'],
    ['закінчилася кава. Оголошено надзвичайний стан', 'the coffee ran out. State of emergency declared'], ['відкрили музей невиконаних обіцянок', 'a museum of broken promises opens'], ['супутник надіслав селфі', 'a satellite sends a selfie'],
    ['посол виголосив промову на чужому весіллі', 'an ambassador gives a speech at a stranger’s wedding'], ['знайшли працюючий факс — його взято під охорону', 'a working fax is found and placed under guard'], ['затримали контрабанду оптимізму', 'smuggled optimism is seized'],
    ['генерал заблукав і знайшовся в кав’ярні', 'a general gets lost and turns up in a café'], ['провели вибори найкращого бюрократа. Переможець досі заповнює анкету', 'a best-bureaucrat contest is held. The winner is still filling in the form'],
    ['депутати годину сперечалися про колір скріпок', 'MPs argue for an hour about paperclip colours'], ['трактор обігнав колону бронетехніки', 'a tractor overtakes an armoured column'], ['ШІ попросив відпустку', 'the AI asks for a holiday'],
    ['запустили державний мем-генератор', 'a state meme generator launches'], ['інфляцію бачили в супермаркеті без маски', 'inflation was spotted in a supermarket without a mask'], ['бабуся пояснила економістам, куди зникають гроші', 'a granny explains to economists where the money goes'],
    ['ліфт застряг з половиною уряду', 'a lift gets stuck with half the cabinet inside'], ['відкрили першу в світі ферму мемів', 'the world’s first meme farm opens'], ['ворон украв печатку міністерства', 'a crow steals the ministry’s seal'], ['пройшов фестиваль бюджетних дірок', 'a festival of budget holes takes place']];
  // ---------- Г: ціни
  const GOOD = [['гречку', 'Buckwheat'], ['нафту', 'Oil'], ['каву', 'Coffee'], ['чипи', 'Chip'], ['скотч', 'Duct tape'], ['дрони', 'Drone'], ['сало', 'Lard'], ['газ', 'Gas'], ['біткоїн', 'Bitcoin'], ['оливки', 'Olive'],
    ['папір для указів', 'Decree paper'], ['батарейки', 'Battery'], ['пельмені', 'Dumpling'], ['цибулю', 'Onion'], ['літій', 'Lithium'], ['шоколад', 'Chocolate']];
  const MOVE = [['зросли', 'rise'], ['впали', 'fall'], ['злетіли', 'soar'], ['обвалилися', 'crash'], ['стрибнули', 'jump'], ['трохи похитнулися', 'wobble']];
  const WHY = [['аналітик чхнув у прямому ефірі', 'an analyst sneezed on live TV'], ['міністр сказав «стабільно»', 'a minister said "stable"'], ['кіт пройшовся по клавіатурі брокера', 'a cat walked across a broker’s keyboard'],
    ['хтось у чаті написав «купуй»', 'someone in chat typed "buy"'], ['синоптик пообіцяв сонце', 'a forecaster promised sunshine'], ['бот біржі прокинувся не в настрої', 'the exchange bot woke up in a bad mood'], ['генерал подивився на мапу', 'a general looked at a map'],
    ['у бункері закінчилося печиво', 'the bunker ran out of cookies'], ['стрімер провів голосування', 'a streamer ran a poll'], ['голуби сіли на біржове табло', 'pigeons landed on the stock ticker'], ['хтось згадав про понеділок', 'someone mentioned Monday']];
  // ---------- Ґ: учені
  const INST = [['Учені', 'Scientists'], ['Британські вчені', 'British scientists'], ['Дослідники з орбітальної станції', 'Researchers on the orbital station'], ['Студенти-економісти', 'Economics students'], ['Аналітики центробанку', 'Central bank analysts'],
    ['Військові науковці', 'Military scientists'], ['Інститут прикладного гумору', 'The Institute of Applied Humour'], ['Лабораторія при Генштабі', 'A General Staff lab']];
  const FACT = [['наради викликають втому навіть у роботів', 'meetings tire out even robots'], ['кава підвищує ВВП на 0,7%', 'coffee raises GDP by 0.7%'], ['коти керують інтернетом', 'cats run the internet'], ['понеділок триває на 20% довше за вівторок', 'Monday lasts 20% longer than Tuesday'],
    ['оптимізм не обкладається податком — поки що', 'optimism isn’t taxed — yet'], ['депутати мають імунітет до сарказму', 'MPs are immune to sarcasm'], ['бюджет можна читати лише разом із валер’янкою', 'the budget can only be read with a sedative'], ['дрон, якого хвалять, літає далі', 'a praised drone flies further'],
    ['гуси — найкращі охоронці складів', 'geese are the best depot guards'], ['найкраща стратегія — вчасно поспати', 'the best strategy is a timely nap'], ['інфляція боїться гучної музики', 'inflation is afraid of loud music'], ['слово «терміново» сповільнює роботу вдвічі', 'the word "urgent" halves work speed'],
    ['гречка — тверда валюта в кризу', 'buckwheat is a hard currency in a crisis'], ['будь-який план витримує зустріч з реальністю лише 5 хвилин', 'no plan survives contact with reality for more than five minutes'], ['вихідні корисні для економіки', 'weekends are good for the economy'], ['мапа світу виглядає краще без кордонів, але це не точно', 'the world map looks better without borders, probably']];
  // ---------- Д: двоє (минулий час, множина — без родів)
  const DUO = [['посварилися через останній круасан на саміті', 'quarrel over the last croissant at the summit'], ['домовилися не домовлятися', 'agree to disagree'], ['обмінялися котами на знак дружби', 'swap cats as a sign of friendship'],
    ['замість переговорів зіграли у футбол — 0:0', 'play football instead of talks — 0:0'], ['уклали угоду про спільне незнання', 'sign a mutual ignorance pact'], ['перепутали посольства й тиждень працювали не там', 'mixed up embassies and worked in the wrong one for a week'],
    ['поділили Місяць навпіл. Місяць не коментує', 'split the Moon in half. The Moon declines to comment'], ['створили союз проти понеділків', 'form an alliance against Mondays'], ['провели спільні навчання з гусями', 'hold joint drills with geese'], ['запустили спільну криптовалюту і загубили пароль', 'launch a joint cryptocurrency and lose the password'],
    ['обмінялися шпигунами. Шпигуни задоволені', 'swap spies. The spies are pleased'], ['сперечалися годину, хто перший сідає', 'argue for an hour over who sits first']];
  const R = Math.random; const pick = (a, r) => a[Math.floor((r || R)() * a.length)];
  function gen(lang, place, r) {
    const k = lang === 'en' ? 1 : 0, f = (r || R)(); let s;
    if (f < 0.08) return pick(HAND, r)[k];
    if (f < 0.42) { const a = pick(SUBJ, r), b = pick(PRED, r); return a[k] + ' ' + b[k]; }
    if (f < 0.55) { const n = 11 + Math.floor((r || R)() * 85), g = pick(GRP, r), o = pick(OPIN, r); return k ? `Poll: ${n}% of ${g[1]} ${o[1]}` : `Опитування: ${n}% ${g[0]} ${o[0]}`; }
    if (f < 0.72) { const p = place ? [place, place] : pick(PLACE, r), i = pick(INC, r); return place ? `${p[k]}: ${i[k]}` : `${p[k]} ${i[k]}`; }
    if (f < 0.82) { const g = pick(GOOD, r), m = pick(MOVE, r), w = pick(WHY, r), n = 2 + Math.floor((r || R)() * 40); return k ? `${g[1]} prices ${m[1]} ${n}% after ${w[1]}` : `Ціни на ${g[0]} ${m[0]} на ${n}% — ${w[0]}`; }
    if (f < 0.92) { const a = pick(INST, r), b = pick(FACT, r); return k ? `${a[1]} prove that ${b[1]}` : `${a[0]} довели: ${b[0]}`; }
    { const a = pick(SUBJ, r); let b = pick(SUBJ, r); if (b === a) b = SUBJ[(SUBJ.indexOf(a) + 1) % SUBJ.length]; const d = pick(DUO, r); return k ? `${a[1]} and ${b[1].replace(/^The /, 'the ').replace(/^A /, 'a ').replace(/^An /, 'an ')} ${d[1]}` : `${a[0]} і ${b[0].charAt(0).toLowerCase() + b[0].slice(1)} ${d[0]}`; }
  }
  const seen = new Set(), order = [];
  function next(lang, place) { for (let i = 0; i < 40; i++) { const s = gen(lang, place); if (!seen.has(s)) { seen.add(s); order.push(s); if (order.length > 1500) seen.delete(order.shift()); return s; } } return gen(lang, place); }
  const count = () => HAND.length + SUBJ.length * PRED.length + 85 * GRP.length * OPIN.length + PLACE.length * INC.length + GOOD.length * MOVE.length * WHY.length * 39 + INST.length * FACT.length + SUBJ.length * (SUBJ.length - 1) * DUO.length;
  L.FUN = { gen, next, count, PLACE, INC };
  L.funNext = (lang) => next(lang); L.funCount = count; L.funNews = (lang) => Array.from({ length: 200 }, () => next(lang));
})();
