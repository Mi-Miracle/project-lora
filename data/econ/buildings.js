// БУДІВЛІ. Кожен рівень будівлі в регіоні споживає in і виробляє out (на рік, у тих самих одиницях, що й ресурси).
// cost — $ млрд за рівень (якщо не задано, рахується як 5 × річна додана вартість); days — термін будівництва.
// req: geo — потрібні поклади ресурсу в регіоні; fert — родючість; coast — вихід до моря; tech — рівень технологій держави.
// eff — особливі ефекти: mil ($ млрд арсеналу на рік), ships (кораблів на рік), q (якість армії, частка), grow (зростання регіону),
//       stab (стабільність), tech (технології на рік), supply (постачання армій у регіоні й поруч), fort (укріплення), infra (інфраструктура регіону),
//       portCost (дешевша перевалка в портах держави), lng (дешевший морський газ), air (авіаміст і постачання з повітря).
LORA.data.buildingGroups = [
  { id: 'extract', n: 'Видобуток', ic: '⛏' },
  { id: 'agro', n: 'Агросектор', ic: '🌾' },
  { id: 'industry', n: 'Промисловість', ic: '🏭' },
  { id: 'energy', n: 'Енергетика', ic: '⚡' },
  { id: 'military', n: 'Оборонка й війська', ic: '🪖' },
  { id: 'logistics', n: 'Логістика', ic: '🚉' },
  { id: 'social', n: 'Наука й суспільство', ic: '🎓' },
  { id: 'digital', n: 'Інтернет і звʼязок', ic: '🌐' },
  { id: 'space', n: 'Космос', ic: '🛰' }
];
LORA.data.buildings = {
  // ---- видобуток
  oil_field:    { g: 'extract', n: 'Нафтопромисел', ic: '🛢', out: { oil: 0.05 }, days: 540, req: { geo: 'oil' } },
  gas_field:    { g: 'extract', n: 'Газовий промисел', ic: '🔥', out: { gas: 5 }, days: 540, req: { geo: 'gas' } },
  coal_mine:    { g: 'extract', n: 'Вугільна шахта', ic: '⚫', out: { coal: 10 }, days: 420, req: { geo: 'coal' } },
  ore_mine:     { g: 'extract', n: 'Залізорудний ГЗК', ic: '⛓', out: { metal: 12 }, days: 480, req: { geo: 'metal' } },
  nonfer_mine:  { g: 'extract', n: 'Мідний/алюмінієвий кар\'єр', ic: '🥉', out: { nonfer: 0.15 }, days: 480, req: { geo: 'nonfer' } },
  uranium_mine: { g: 'extract', n: 'Уранова шахта', ic: '☢', out: { uranium: 0.4 }, days: 600, req: { geo: 'uranium' } },
  rare_mine:    { g: 'extract', n: 'Родовище критичних мінералів', ic: '💎', out: { rare: 1.2 }, days: 600, req: { geo: 'rare' } },
  // ---- агро
  farm:         { g: 'agro', n: 'Агрохолдинг (поля)', ic: '🌾', in: { fert: 0.12, oil: 0.002 }, out: { grain: 2.5 }, days: 200, req: { fert: 0.35 } },
  greenhouse:   { g: 'agro', n: 'Тепличний комплекс', ic: '🥬', in: { gas: 0.3 }, out: { food: 0.05 }, days: 240 },
  food_plant:   { g: 'agro', n: 'Харчовий комбінат', ic: '🥩', in: { grain: 3 }, out: { food: 0.15 }, days: 240 },
  fert_plant:   { g: 'agro', n: 'Завод добрив', ic: '🧪', in: { gas: 1.5 }, out: { fert: 1 }, days: 365 },
  // ---- промисловість
  steel_plant:  { g: 'industry', n: 'Металургійний комбінат', ic: '🏗', in: { coal: 3, metal: 4.5 }, out: { machinery: 0.1, metal: 4.2 }, days: 540 },
  machine_plant:{ g: 'industry', n: 'Машинобудівний завод', ic: '⚙', in: { metal: 2, nonfer: 0.05, chips: 0.3 }, out: { machinery: 0.35 }, days: 400 },
  chem_plant:   { g: 'industry', n: 'Хімічний комбінат', ic: '⚗', in: { oil: 0.03, gas: 1 }, out: { chem: 0.3 }, days: 400 },
  pharma_plant: { g: 'industry', n: 'Фармацевтичний завод', ic: '💊', in: { chem: 0.05 }, out: { chem: 0.2 }, days: 450, req: { tech: 0.9 } },
  goods_factory:{ g: 'industry', n: 'Фабрика споживчих товарів', ic: '📦', in: { chem: 0.05, nonfer: 0.03, metal: 0.5 }, out: { goods: 0.3 }, days: 300 },
  chip_fab:     { g: 'industry', n: 'Фабрика мікрочипів', ic: '💾', in: { rare: 0.5, chem: 0.05, machinery: 0.05 }, out: { chips: 3 }, days: 900, req: { tech: 1.05 }, cost: 20 },
  // ---- енергетика (ефект: зростання та стабільність регіону; споживають паливо)
  npp:          { g: 'energy', n: 'Атомна електростанція', ic: '⚛', in: { uranium: 0.03 }, eff: { grow: 0.004, stab: 0.5 }, days: 1800, cost: 12, req: { tech: 0.9 } },
  smr:          { g: 'energy', n: 'Малий модульний реактор', ic: '🔋', in: { uranium: 0.006 }, eff: { grow: 0.001 }, days: 900, cost: 2.5, req: { tech: 1.1, rt: 'smr_tech' } },
  coal_plant:   { g: 'energy', n: 'ТЕС на вугіллі', ic: '🏭', in: { coal: 5 }, eff: { grow: 0.003 }, days: 720, cost: 3 },
  gas_plant:    { g: 'energy', n: 'ТЕС на газі', ic: '🔥', in: { gas: 3 }, eff: { grow: 0.003 }, days: 540, cost: 2 },
  hydro_plant:  { g: 'energy', n: 'ГЕС', ic: '💧', eff: { grow: 0.002 }, days: 1500, cost: 6, req: { terrain: ['mountain', 'hills', 'forest'] } },
  renewables:   { g: 'energy', n: 'Відновлювана енергетика (змішана)', ic: '☀', in: { nonfer: 0.01 }, eff: { grow: 0.0015 }, days: 300, cost: 1.5 },
  // ---- оборонна промисловість і війська
  arms_factory: { g: 'military', n: 'Завод боєприпасів і техніки', ic: '💣', in: { metal: 1, chem: 0.1, machinery: 0.05 }, eff: { mil: 2.5 }, days: 365, cost: 6 },
  drone_factory:{ g: 'military', n: 'Завод дронів', ic: '🛸', in: { chips: 0.2, nonfer: 0.02, chem: 0.02 }, eff: { mil: 1.5, q: 0.006 }, days: 180, cost: 2 },
  missile_plant:{ g: 'military', n: 'Ракетний завод', ic: '🚀', in: { chips: 0.15, chem: 0.08, nonfer: 0.03 }, eff: { mil: 2, q: 0.004 }, days: 540, cost: 8, req: { tech: 0.95 } },
  enrich_plant: { g: 'military', n: 'Завод збагачення урану', ic: '☢', in: { uranium: 0.02, chem: 0.03 }, eff: { nuk: 1 }, days: 900, cost: 10, req: { tech: 0.95, rt: 'nuke_enrich' } },
  nuke_lab:     { g: 'military', n: 'Ядерний збройовий центр', ic: '💣', in: { chips: 0.05, nonfer: 0.03 }, eff: { nukl: 1 }, days: 1100, cost: 15, req: { tech: 1.0, rt: 'nuke_bomb' } },
  icbm_silo:    { g: 'military', n: 'Шахти МБР', ic: '🚀', in: { metal: 0.05 }, eff: { silo: 1 }, days: 720, cost: 6, req: { tech: 1.0, rt: 'nuke_icbm' } },
  shipyard:     { g: 'military', n: 'Суднобудівна верф', ic: '⚓', in: { metal: 2, machinery: 0.1 }, eff: { ships: 2 }, days: 720, cost: 8, req: { coast: 1 } },
  military_base:{ g: 'military', n: 'Військова база', ic: '🏰', eff: { supply: 0.08, fort: 0.1 }, days: 180, cost: 1.5 },
  fortline:     { g: 'military', n: 'Укріпрайон', ic: '🧱', in: { metal: 0.3 }, eff: { fort: 0.2 }, days: 120, cost: 1 },
  air_defense:  { g: 'military', n: 'Система ППО', ic: '🛡', in: { chips: 0.02 }, eff: { shield: 0.25 }, days: 150, cost: 3 },
  // ---- логістика
  rail_hub:     { g: 'logistics', n: 'Залізничний вузол', ic: '🚉', eff: { infra: 0.15, supply: 0.05 }, days: 365, cost: 2 },
  depot:        { g: 'logistics', n: 'Склади й депо постачання', ic: '🏚', eff: { supply: 0.12 }, days: 90, cost: 0.5 },
  port:         { g: 'logistics', n: 'Морський порт', ic: '🛳', eff: { portCost: 0.1, infra: 0.05 }, days: 540, cost: 3, req: { coast: 1 } },
  lng_terminal: { g: 'logistics', n: 'Термінал СПГ', ic: '🧊', eff: { lng: 0.15 }, days: 720, cost: 4, req: { coast: 1 } },
  airport:      { g: 'logistics', n: 'Вантажний аеропорт', ic: '✈', eff: { air: 1, supply: 0.04, infra: 0.05 }, days: 450, cost: 2.5 },
  // ---- наука й суспільство
  university:   { g: 'social', n: 'Університет і НДІ', ic: '🎓', eff: { tech: 0.003, grow: 0.001 }, days: 540, cost: 2 },
  hospital:     { g: 'social', n: 'Медичний кластер', ic: '🏥', in: { chem: 0.02 }, eff: { stab: 1, grow: 0.0005 }, days: 365, cost: 1.5 },
  housing:      { g: 'social', n: 'Житлове будівництво', ic: '🏘', in: { metal: 0.3, goods: 0.01 }, eff: { stab: 0.6, grow: 0.0008 }, days: 300, cost: 1.2 },
  // ---- майбутні технології (відкриваються дослідженнями, req.rt)
  vertical_farm: { g: 'agro', n: 'Вертикальна ферма', ic: '🏢', in: { gas: 0.1, chips: 0.002 }, out: { food: 0.09 }, days: 300, cost: 4, req: { rt: 'vert_farm' } },
  ai_datacenter: { g: 'social', n: 'ШІ-датацентр', ic: '🖥', in: { chips: 0.08 }, eff: { tech: 0.006, grow: 0.002 }, days: 400, cost: 8, req: { rt: 'ai_planning' } },
  laser_battery: { g: 'military', n: 'Лазерна батарея ППО', ic: '🔆', eff: { shield: 0.35 }, days: 200, cost: 3, req: { rt: 'laser_ad' } },
  fusion_plant:  { g: 'energy', n: 'Термоядерна електростанція', ic: '☀', eff: { grow: 0.01, stab: 1 }, days: 1500, cost: 30, req: { rt: 'fusion' } },
  spaceport:     { g: 'space', n: 'Космодром багаторазових ракет', ic: '🌌', eff: { tech: 0.01, supply: 0.05, space: 3 }, days: 1200, cost: 25, req: { rt: "orbital_log", coast: 1 } },
  // ---- 1.4: альтернативна енергетика
  solar_farm:    { g: 'energy', n: 'Сонячна електростанція', ic: '🌞', in: { nonfer: 0.006, rare: 0.02 }, eff: { grow: 0.0014, green: 1 }, days: 240, cost: 1.2 },
  wind_farm:     { g: 'energy', n: 'Вітрова електростанція', ic: '🌬', in: { nonfer: 0.008, metal: 0.2 }, eff: { grow: 0.0016, green: 1 }, days: 300, cost: 1.5, req: { terrain: ['plains', 'steppe', 'hills', 'arctic'] } },
  offshore_wind: { g: 'energy', n: 'Офшорна вітрова станція', ic: '🌊', in: { nonfer: 0.01, metal: 0.3 }, eff: { grow: 0.0025, green: 1 }, days: 540, cost: 3.5, req: { coast: 1, tech: 0.95 } },
  geothermal:    { g: 'energy', n: 'Геотермальна станція', ic: '🌋', eff: { grow: 0.002, green: 1, stab: 0.2 }, days: 720, cost: 3, req: { terrain: ['mountain', 'hills'] } },
  hydrogen_plant:{ g: 'energy', n: 'Завод зеленого водню', ic: '💨', in: { nonfer: 0.01 }, out: { chem: 0.08 }, eff: { grow: 0.001, green: 1 }, days: 540, cost: 4, req: { rt: 'green_h2' } },
  battery_storage:{ g: 'energy', n: 'Накопичувачі енергії', ic: '🪫', in: { rare: 0.05 }, eff: { grid: 0.25, stab: 0.3 }, days: 200, cost: 1.8, req: { tech: 0.95 } },
  // ---- 1.4: промисловість
  refinery:      { g: 'industry', n: 'Нафтопереробний завод', ic: '⛽', in: { oil: 0.04 }, out: { chem: 0.22 }, days: 600 },
  battery_plant: { g: 'industry', n: 'Завод акумуляторів', ic: '🔋', in: { nonfer: 0.03, rare: 0.3, chem: 0.04 }, out: { goods: 0.18, machinery: 0.08 }, days: 450, req: { tech: 0.95 } },
  auto_plant:    { g: 'industry', n: 'Автозавод', ic: '🚗', in: { metal: 1, chips: 0.08, nonfer: 0.02 }, out: { goods: 0.3, machinery: 0.06 }, days: 500 },
  textile_plant: { g: 'industry', n: 'Текстильна фабрика', ic: '🧵', in: { grain: 0.5, chem: 0.02 }, out: { goods: 0.12 }, days: 200 },
  forestry:      { g: 'agro', n: 'Лісопромисловий комплекс', ic: '🌲', out: { goods: 0.06, metal: 0.4 }, days: 300, req: { terrain: ['forest', 'arctic', 'hills'] } },
  fishery:       { g: 'agro', n: 'Рибний порт', ic: '🐟', out: { food: 0.035 }, days: 240, req: { coast: 1 } },
  // ---- 1.4: оборонні виробництва
  tank_plant:    { g: 'military', n: 'Танковий завод', ic: '🛡', in: { metal: 1.5, machinery: 0.06, chips: 0.02 }, eff: { mil: 1.5, armor: 1 }, days: 540, cost: 7 },
  aircraft_plant:{ g: 'military', n: 'Авіазавод', ic: '🛩', in: { nonfer: 0.06, chips: 0.2, machinery: 0.05 }, eff: { mil: 1.5, airf: 1 }, days: 720, cost: 10, req: { tech: 0.95 } },
  radar:         { g: 'military', n: 'РЛС раннього попередження', ic: '📡', in: { chips: 0.01 }, eff: { radar: 650, shield: 0.04 }, days: 240, cost: 2 },
  ew_station:    { g: 'military', n: 'Станція РЕБ', ic: '📻', in: { chips: 0.015 }, eff: { ew: 0.2 }, days: 120, cost: 1.2, req: { rt: 'ew' } },
  naval_base:    { g: 'military', n: 'Військово-морська база', ic: '⚓', eff: { naval: 1, supply: 0.04 }, days: 400, cost: 3, req: { coast: 1 } },
  // ---- 1.4: інтернет і звʼязок
  fiber_backbone:{ g: 'digital', n: 'Оптоволоконна магістраль', ic: '🌐', in: { nonfer: 0.004 }, eff: { net: 0.06, infra: 0.03, grow: 0.0006 }, days: 240, cost: 1.5 },
  cell_5g:       { g: 'digital', n: 'Мережа 5G', ic: '📶', in: { chips: 0.02 }, eff: { net: 0.05, grow: 0.001 }, days: 200, cost: 2, req: { tech: 0.95 } },
  subsea_cable:  { g: 'digital', n: 'Підводний інтернет-кабель', ic: '🔌', eff: { net: 0.08 }, days: 540, cost: 3, req: { coast: 1 } },
  datacenter:    { g: 'digital', n: 'Датацентр', ic: '🗄', in: { chips: 0.03 }, eff: { net: 0.03, tech: 0.002, grow: 0.0008 }, days: 300, cost: 3 },
  // ---- 1.4: космос
  launch_site:   { g: 'space', n: 'Стартовий майданчик', ic: '🚀', eff: { space: 1, tech: 0.002 }, days: 900, cost: 6, req: { rt: 'launch_vehicles' } },
  sat_factory:   { g: 'space', n: 'Завод супутників', ic: '🛰', in: { chips: 0.08, nonfer: 0.01 }, eff: { satf: 1, tech: 0.002 }, days: 540, cost: 5, req: { rt: 'launch_vehicles' } },
  ground_station:{ g: 'space', n: 'Центр керування польотами', ic: '🗼', eff: { satc: 1 }, days: 300, cost: 1.5, req: { rt: 'launch_vehicles' } },
  // ---- 1.4: суспільство
  media_center:  { g: 'social', n: 'Медіахолдинг', ic: '📺', eff: { stab: 0.4, media: 1 }, days: 200, cost: 1 },
  stadium:       { g: 'social', n: 'Спортивна арена', ic: '🏟', eff: { stab: 0.5 }, days: 400, cost: 1.5 },
  tourism:       { g: 'social', n: 'Туристичний кластер', ic: '🏨', eff: { grow: 0.0012, stab: 0.2 }, days: 300, cost: 1.5, req: { terrain: ['mountain', 'hills', 'forest', 'desert'], coastOr: 1 } }
};
// Транспортні маршрути, які гравець прокладає між регіонами
LORA.data.linkTypes = {
  rail: { n: 'Залізниця', ic: '🚆', costKm: 0.012, daysKm: 1.1, minDays: 120, col: '#222', dash: [6, 4], speed: 450, modes: [0, 2], factor: 0.45 },
  road: { n: 'Автомагістраль', ic: '🛣', costKm: 0.007, daysKm: 0.8, minDays: 90, col: '#6b6b6b', dash: [], speed: 300, modes: [2], factor: 0.6 },
  pipe: { n: 'Трубопровід', ic: '🛢', costKm: 0.006, daysKm: 0.7, minDays: 150, col: '#e67e22', dash: [2, 3], speed: 0, modes: [1], factor: 0.3 },
  sea:  { n: 'Морська лінія (порт — порт)', ic: '🚢', costKm: 0.0004, daysKm: 0.02, minDays: 90, col: '#1f6fb5', dash: [8, 6], speed: 0, modes: [0, 2], factor: 0.25, port: 1 },
  air:  { n: 'Авіаміст', ic: '✈', costKm: 0.0006, daysKm: 0, minDays: 45, col: '#3a8dde', dash: [1, 6], speed: 900, modes: [2], factor: 2.0 }
};
// Пріоритети губернатора регіону / державного радника з розвитку
LORA.data.devPriorities = {
  balanced: { n: 'Збалансовано', w: { extract: 1, agro: 1, industry: 1, energy: 1, military: 0.6, logistics: 0.8, social: 0.8, digital: 0.7, space: 0.25 } },
  industry: { n: 'Промисловість', w: { extract: 1, agro: 0.5, industry: 2, energy: 1.2, military: 0.5, logistics: 0.8, social: 0.6, digital: 0.7, space: 0.2 } },
  agro:     { n: 'Агросектор', w: { extract: 0.6, agro: 2.2, industry: 0.6, energy: 0.8, military: 0.4, logistics: 0.8, social: 0.6, digital: 0.4, space: 0.1 } },
  military: { n: 'Оборона', w: { extract: 0.7, agro: 0.5, industry: 0.9, energy: 0.8, military: 2.5, logistics: 1.2, social: 0.4, digital: 0.5, space: 0.4 } },
  logistics:{ n: 'Логістика', w: { extract: 0.7, agro: 0.6, industry: 0.8, energy: 1, military: 0.6, logistics: 2.2, social: 0.6, digital: 1, space: 0.2 } },
  science:  { n: 'Наука', w: { extract: 0.6, agro: 0.6, industry: 1.1, energy: 1, military: 0.5, logistics: 0.7, social: 2.2, digital: 1.5, space: 1 } }
};
