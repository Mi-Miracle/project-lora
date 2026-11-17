// КОМПАНІЇ. Сектори визначають, які активи (будівлі) компанія може будувати в регіонах, де має офіс.
// Назви ШІ-компаній вигадані. Формат компанії: [назва укр, назва англ, сектор, країна штабу, стартовий капітал $ млрд]
LORA.data.companySectors = {
  military:  { n: 'ВПК', en: 'Defense', ic: '🛡', assets: ['arms_factory', 'drone_factory', 'missile_plant', 'shipyard', 'air_defense', 'tank_plant', 'aircraft_plant', 'radar', 'ew_station'], d: 'Зброя для урядів: дохід — державні замовлення' },
  agro:      { n: 'Агро й продовольство', en: 'Agro & Food', ic: '🌾', assets: ['farm', 'food_plant', 'fert_plant', 'greenhouse', 'fishery', 'forestry', 'vertical_farm'], d: 'Зерно, продукти, добрива' },
  tech:      { n: 'Технології', en: 'Technology', ic: '💾', assets: ['chip_fab', 'machine_plant', 'university', 'drone_factory', 'datacenter', 'battery_plant', 'ai_datacenter'], d: 'Чипи, обладнання, R&D' },
  energy:    { n: 'Енергетика', en: 'Energy', ic: '⚡', assets: ['oil_field', 'gas_field', 'coal_mine', 'renewables', 'gas_plant', 'lng_terminal', 'solar_farm', 'wind_farm', 'offshore_wind', 'geothermal', 'battery_storage', 'refinery', 'hydrogen_plant'], d: 'Нафта, газ, електроенергія' },
  mining:    { n: 'Видобуток', en: 'Mining', ic: '⛏', assets: ['ore_mine', 'nonfer_mine', 'rare_mine', 'uranium_mine', 'coal_mine', 'steel_plant'], d: 'Руди, метали, критичні мінерали' },
  industry:  { n: 'Промисловість', en: 'Industry', ic: '🏭', assets: ['goods_factory', 'chem_plant', 'pharma_plant', 'steel_plant', 'machine_plant', 'auto_plant', 'textile_plant', 'battery_plant', 'refinery'], d: 'Товари, хімія, фармацевтика' },
  telecom:   { n: 'Телеком і медіа', en: 'Telecom & Media', ic: '📶', assets: ['fiber_backbone', 'cell_5g', 'subsea_cable', 'datacenter', 'media_center'], d: 'Інтернет, звʼязок, медіа: дохід росте з розвитком інтернету в країні' },
  space:     { n: 'Космос', en: 'Space', ic: '🚀', assets: ['launch_site', 'sat_factory', 'ground_station', 'spaceport'], d: 'Комерційні запуски й супутники: дорого, але дохідно; потрібні дослідження країни-господаря' },
  leisure:   { n: 'Туризм і розваги', en: 'Leisure', ic: '🏨', assets: ['tourism', 'stadium', 'media_center'], d: 'Готелі, арени, медіа: стабільний дохід у мирних країнах' },
  logistics: { n: 'Логістика', en: 'Logistics', ic: '🚢', assets: ['port', 'rail_hub', 'depot', 'airport', 'lng_terminal'], d: 'Порти, вузли, склади — дохід від торгових потоків' }
};
LORA.data.companies = [
  ['Атлант Дефенс', 'Atlant Defense', 'military', 'USA', 140], ['Сіверська Зброярня', 'Siverska Arms', 'military', 'UKR', 6], ['Анадолу Савунма', 'Anadolu Savunma', 'military', 'TUR', 18],
  ['Урал-Щит', 'Ural-Shield', 'military', 'RUS', 30], ['Ліндвурм Рюстунг', 'Lindwurm Rüstung', 'military', 'DEU', 35], ['Хуанхе Оборона', 'Huanghe Defense', 'military', 'CHN', 80],
  ['Преріал Грейн', 'Prairial Grain', 'agro', 'USA', 60], ['Чорнозем Агро', 'Chornozem Agro', 'agro', 'UKR', 9], ['Серрадо Алімент', 'Cerrado Alimentos', 'agro', 'BRA', 25], ['Полдер Фудс', 'Polder Foods', 'agro', 'NLD', 30],
  ['Формоза Сілікон', 'Formosa Silicon', 'tech', 'TWN', 200], ['Ханган Електронікс', 'Hangang Electronics', 'tech', 'KOR', 150], ['Сьєрра Компʼют', 'Sierra Compute', 'tech', 'USA', 300], ['Шеньчжень Чипс', 'Shenzhen Chips', 'tech', 'CHN', 120], ['Кепрон Інжиніринг', 'Kepron Engineering', 'tech', 'JPN', 90],
  ['Пустельна Енергія', 'Desert Energy', 'energy', 'SAU', 400], ['Нордлайт Енерджі', 'Nordlight Energy', 'energy', 'NOR', 80], ['Сибнафта Холдинг', 'Sibneft Holding', 'energy', 'RUS', 90], ['Галф Пасифік Ойл', 'Gulf Pacific Oil', 'energy', 'USA', 250],
  ['Пілбара Майнінг', 'Pilbara Mining', 'mining', 'AUS', 110], ['Атакама Літій', 'Atacama Lithium', 'mining', 'CHL', 30], ['Катанга Мінерали', 'Katanga Minerals', 'mining', 'COD', 8], ['Криворіжсталь Груп', 'Kryvbas Steel Group', 'mining', 'UKR', 5],
  ['Рейн Хемі', 'Rhein Chemie', 'industry', 'DEU', 70], ['Ганг Фарма', 'Ganges Pharma', 'industry', 'IND', 25], ['Ямато Індастріз', 'Yamato Industries', 'industry', 'JPN', 60],
  ['Орбіта Дайнемікс', 'Orbita Dynamics', 'space', 'USA', 120], ['Хуася Космос', 'Huaxia Space', 'space', 'CHN', 50], ['Зоряний Шлях', 'Zoryanyi Shlyakh', 'space', 'UKR', 2], ['Мережа Атлантика', 'Atlantica Networks', 'telecom', 'USA', 150], ['Карпатнет', 'Karpatnet', 'telecom', 'UKR', 2], ['Балтік Файбер', 'Baltic Fiber', 'telecom', 'EST', 5], ['Рівʼєра Резортс', 'Riviera Resorts', 'leisure', 'FRA', 30], ['Сонячний Дім', 'Sonyachnyi Dim', 'energy', 'UKR', 3],
  ['Сінгапур Марітайм', 'Singapore Maritime', 'logistics', 'SGP', 40], ['Босфор Лоджистікс', 'Bosphorus Logistics', 'logistics', 'TUR', 12], ['Дніпро Транзит', 'Dnipro Transit', 'logistics', 'UKR', 3]
];
