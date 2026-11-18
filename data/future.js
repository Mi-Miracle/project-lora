// ТЕХНОЛОГІЇ МАЙБУТНЬОГО (2.5): нові дослідження всіх гілок, будівлі до них, покоління техніки й розробки компаній.
// Кожна нова будівля належить рівно одному сектору компаній (або лише державі: укріплення, бази, мегапроєкти).
(function () {
  const T = LORA.data.techs, B = LORA.data.buildings, M = LORA.data.models, SEC = LORA.data.companySectors, RD = LORA.data.corpRD;
  const tech = (id, br, era, n, en, c, req, e, unlock) => { if (!T[id]) T[id] = { br, era, n, en, c, req, e: e || {}, unlock }; };
  // ---- економіка й ШІ
  tech('smart_tax', 'econ', 2, 'Розумне оподаткування', 'Smart taxation', 1200, ['e_gov', 'ai_assist'], { stab: 2, g: 0.001 });
  tech('ai_trading', 'econ', 2, 'Алгоритмічна торгівля', 'Algorithmic trading', 1400, ['fintech', 'ai_assist'], { g: 0.002 });
  tech('robo_services', 'econ', 2, 'Роботизований сервіс', 'Robotic services', 1600, ['robot_fab', 'ai_assist'], { g: 0.003 });
  tech('digital_twin_econ', 'econ', 3, 'Цифровий двійник економіки', 'Digital twin of the economy', 5000, ['ai_planning', 'quantum_comp'], { g: 0.004, tech: 0.02 });
  tech('quantum_finance', 'econ', 3, 'Квантові фінанси', 'Quantum finance', 5200, ['quantum_comp', 'cbdc'], { g: 0.003 });
  tech('auto_corp', 'econ', 4, 'Автономні корпорації', 'Autonomous corporations', 24000, ['agi', 'digital_twin_econ'], { g: 0.01 });
  // ---- промисловість
  tech('self_heal', 'ind', 3, 'Самовідновлювані матеріали', 'Self-healing materials', 4800, ['graphene'], { prod: { machinery: 1.06 }, q: 0.02 });
  tech('space_mfg', 'ind', 4, 'Виробництво в невагомості', 'Zero-gravity manufacturing', 21000, ['orbital_log', 'nanofab'], { prod: { chips: 1.2 } });
  tech('room_supercond', 'ind', 4, 'Надпровідники кімнатної температури', 'Room-temperature superconductors', 26000, ['meta_mats', 'quantum_comp'], { g: 0.006 });
  tech('mol_assembly', 'ind', 4, 'Молекулярне складання', 'Molecular assembly', 32000, ['nanofab', 'agi'], { prod: { goods: 1.3, machinery: 1.2 } });
  // ---- енергетика
  tech('solid_battery', 'energy', 2, 'Твердотільні акумулятори', 'Solid-state batteries', 1800, ['grid_storage'], { g: 0.001 });
  tech('ocean_power', 'energy', 2, 'Енергія хвиль і припливів', 'Wave and tidal power', 1700, ['supergrid'], { g: 0.001 });
  tech('thorium_msr', 'energy', 3, 'Торієві реактори на розплавах солей', 'Thorium molten-salt reactors', 4200, ['thorium'], { g: 0.003 });
  tech('he3_mining', 'energy', 4, 'Гелій-3 з Місяця', 'Lunar helium-3', 24000, ['moon_base', 'fusion'], { g: 0.006 });
  tech('antimatter', 'energy', 4, 'Антиматерійна енергетика', 'Antimatter power', 40000, ['fusion', 'space_power'], { g: 0.01 });
  // ---- озброєння
  tech('smart_mines', 'mil', 1, 'Розумні мінні поля', 'Smart minefields', 700, ['mil_eng'], { q: 0.01 });
  tech('counter_drone', 'mil', 2, 'Комплекси протидії дронам', 'Counter-drone systems', 1600, ['ew', 'interceptor'], { q: 0.03 });
  tech('adapt_camo', 'mil', 3, 'Адаптивний камуфляж', 'Adaptive camouflage', 4600, ['meta_mats'], { q: 0.04 });
  tech('scramjet', 'mil', 3, 'Прямоточні гіперзвукові двигуни', 'Scramjet weapons', 5200, ['hypersonic'], { q: 0.04 });
  tech('ai_commander', 'mil', 3, 'ШІ-штаби', 'AI command staff', 5200, ['ai_targeting', 'agi'], { q: 0.06 });
  tech('plasma_shield', 'mil', 4, 'Плазмовий щит', 'Plasma shield', 27000, ['railgun', 'room_supercond'], { q: 0.08 });
  tech('kinetic_orbital', 'mil', 4, 'Орбітальні кінетичні удари', 'Orbital kinetic strikes', 30000, ['orbital_def'], { q: 0.06 });
  // ---- дрони й роботи
  tech('loitering', 'drone', 1, 'Баражуючі боєприпаси', 'Loitering munitions', 800, ['fpv'], { q: 0.015 });
  tech('drone_hive', 'drone', 2, 'Дронові вулики', 'Drone hives', 1800, ['swarm'], { q: 0.03 });
  tech('humanoid_soldier', 'drone', 3, 'Бойові гуманоїди', 'Combat humanoids', 5600, ['exo', 'auto_army'], { q: 0.08 });
  tech('nano_drones', 'drone', 4, 'Нанодрони', 'Nano-drones', 24000, ['swarm_ai3', 'nanofab'], { q: 0.1 });
  // ---- кібер
  tech('ai_cyber2', 'cyber', 2, 'Автономний кіберзахист', 'Autonomous cyber defence', 1500, ['ai_cyber'], { cyber: 0.15 });
  tech('post_quantum', 'cyber', 3, 'Постквантова криптографія', 'Post-quantum cryptography', 4000, ['quantum_comms'], { cyber: 0.25 });
  tech('brain_firewall', 'cyber', 4, 'Нейрофаєрвол', 'Neural firewall', 22000, ['neurolink', 'quantum_comp'], { cyber: 0.3, stab: 3 });
  // ---- біо
  tech('pandemic_shield', 'bio', 2, 'Протипандемічний щит', 'Pandemic shield', 1500, ['mrna'], { stab: 3 });
  tech('synth_bio', 'bio', 3, 'Синтетична біологія', 'Synthetic biology', 4600, ['bioeng'], { prod: { chem: 1.1, food: 1.05 } });
  tech('cryo', 'bio', 4, 'Кріоконсервація людини', 'Human cryopreservation', 20000, ['gene_therapy'], { stab: 5 });
  tech('photosynth', 'bio', 4, 'Штучний фотосинтез', 'Artificial photosynthesis', 23000, ['synth_bio'], { prod: { grain: 1.3, food: 1.1 } });
  // ---- космос
  tech('space_station', 'space', 2, 'Модульні орбітальні станції', 'Modular orbital stations', 1800, ['heavy_lift'], { tech: 0.01 });
  tech('ion_drive', 'space', 3, 'Іонні двигуни', 'Ion propulsion', 4400, ['reusable'], { tech: 0.02 });
  tech('asteroid_probe', 'space', 3, 'Місії до астероїдів', 'Asteroid missions', 4600, ['heavy_lift', 'ion_drive'], { tech: 0.02 });
  tech('lunar_mining', 'space', 4, 'Видобуток на Місяці', 'Lunar mining', 20000, ['moon_base'], { prod: { rare: 1.15, uranium: 1.1 } });
  tech('orbital_shipyard', 'space', 4, 'Орбітальні верфі', 'Orbital shipyards', 26000, ['orbital_log', 'space_mfg'], { nav: 0.08, tech: 0.03 });
  tech('space_elevator', 'space', 4, 'Космічний ліфт', 'Space elevator', 35000, ['orbital_log', 'meta_mats'], { sup: 0.05, g: 0.004 });
  tech('deep_space', 'space', 4, 'Далекий космос: Юпітер і Сатурн', 'Deep space: Jupiter and Saturn', 30000, ['ion_drive', 'mars_colony'], { tech: 0.06, stab: 4 });
  tech('space_hab', 'space', 4, 'Космічні поселення', 'Space habitats', 34000, ['space_elevator', 'terraform'], { stab: 6, g: 0.004 });
  // ---- флот
  tech('sub_drones', 'navy', 2, 'Підводні дрони', 'Underwater drones', 1700, ['naval_drones'], { nav: 0.06 });
  tech('sea_base_t', 'navy', 3, 'Плавучі морські бази', 'Floating sea bases', 4200, ['usv_fleet'], { nav: 0.06, sup: 0.02 });
  tech('arsenal_ship', 'navy', 3, 'Кораблі-арсенали', 'Arsenal ships', 4500, ['railgun', 'auto_fleet'], { nav: 0.1 });

  // ---- будівлі
  const bld = (id, o) => { if (!B[id]) B[id] = o; };
  bld('quantum_center', { g: 'social', n: 'Квантовий обчислювальний центр', ic: '⚛', in: { chips: 0.05 }, eff: { tech: 0.01, grow: 0.001 }, days: 600, cost: 10, req: { rt: 'quantum_comp' } });
  bld('digital_twin_center', { g: 'digital', n: 'Центр цифрового двійника', ic: '🪞', in: { chips: 0.04 }, eff: { tech: 0.008, grow: 0.002 }, days: 420, cost: 8, req: { rt: 'digital_twin_econ' } });
  bld('ai_trading_hub', { g: 'digital', n: 'Алгоритмічна біржова платформа', ic: '📈', in: { chips: 0.02 }, eff: { grow: 0.0015 }, days: 240, cost: 3, req: { rt: 'ai_trading' } });
  bld('robot_factory', { g: 'industry', n: 'Завод сервісних роботів', ic: '🤖', in: { metal: 0.5, chips: 0.05 }, out: { machinery: 0.3, goods: 0.1 }, days: 420, cost: 6, req: { rt: 'robo_services' } });
  bld('solid_battery_plant', { g: 'industry', n: 'Завод твердотільних батарей', ic: '🔋', in: { rare: 0.08, nonfer: 0.02 }, out: { goods: 0.25 }, eff: { grid: 0.1 }, days: 360, cost: 5, req: { rt: 'solid_battery' } });
  bld('synth_bio_plant', { g: 'industry', n: 'Біофабрика синтетичної біології', ic: '🧫', in: { grain: 0.3 }, out: { chem: 0.12, food: 0.05 }, days: 420, cost: 4, req: { rt: 'synth_bio' } });
  bld('nano_assembler', { g: 'industry', n: 'Молекулярний асемблер', ic: '🔬', in: { rare: 0.05 }, out: { goods: 0.6, machinery: 0.3 }, days: 900, cost: 35, req: { rt: 'mol_assembly' } });
  bld('msr_plant', { g: 'energy', n: 'Торієвий реактор', ic: '☢', in: { uranium: 0.004 }, eff: { grow: 0.004, stab: 0.3 }, days: 1100, cost: 6, req: { rt: 'thorium_msr' } });
  bld('ocean_plant', { g: 'energy', n: 'Хвильова й припливна станція', ic: '🌊', eff: { grow: 0.002, green: 1 }, days: 480, cost: 3, req: { rt: 'ocean_power', coast: 1 } });
  bld('supercond_grid', { g: 'energy', n: 'Надпровідна енергомережа', ic: '🧲', eff: { grid: 0.4, grow: 0.004 }, days: 720, cost: 10, req: { rt: 'room_supercond' } });
  bld('he3_plant', { g: 'energy', n: 'Термоядерна станція на гелії-3', ic: '🌑', eff: { grow: 0.015, stab: 1, green: 1 }, days: 1500, cost: 40, req: { rt: 'he3_mining' } });
  bld('antimatter_plant', { g: 'energy', n: 'Антиматерійний реактор', ic: '✴', eff: { grow: 0.03, stab: 1 }, days: 2000, cost: 120, req: { rt: 'antimatter' } });
  bld('mil_academy', { g: 'military', n: 'Військова академія', ic: '🎓', in: { goods: 0.01 }, eff: { q: 0.006, stab: 0.1 }, days: 360, cost: 2.5, req: { rt: 'mil_train2' } });
  bld('underground_base', { g: 'military', n: 'Підземна база', ic: '⛰', in: { metal: 0.2 }, eff: { fort: 0.35, supply: 0.05, shield: 0.05 }, days: 400, cost: 4, req: { rt: 'fortif' } });
  bld('smart_minefield', { g: 'military', n: 'Розумне мінне поле', ic: '💥', in: { chips: 0.005 }, eff: { fort: 0.25 }, days: 60, cost: 0.8, req: { rt: 'smart_mines' } });
  bld('counter_drone_grid', { g: 'military', n: 'Мережа протидії дронам', ic: '🕸', in: { chips: 0.01 }, eff: { shield: 0.15, ew: 0.1 }, days: 120, cost: 2, req: { rt: 'counter_drone' } });
  bld('drone_hive_base', { g: 'military', n: 'Дроновий вулик', ic: '🐝', in: { chips: 0.03 }, eff: { q: 0.008, shield: 0.05, mil: 0.5 }, days: 180, cost: 3, req: { rt: 'drone_hive' } });
  bld('loiter_plant', { g: 'military', n: 'Завод баражуючих боєприпасів', ic: '🦅', in: { chips: 0.08, chem: 0.02 }, eff: { mil: 1.2, q: 0.004 }, days: 240, cost: 2.5, req: { rt: 'loitering' } });
  bld('hypersonic_plant', { g: 'military', n: 'Завод гіперзвукової зброї', ic: '⚡', in: { chips: 0.2, rare: 0.02 }, eff: { mil: 2, q: 0.005 }, days: 720, cost: 12, req: { rt: 'scramjet' } });
  bld('humanoid_plant', { g: 'military', n: 'Завод бойових гуманоїдів', ic: '🦾', in: { chips: 0.2, machinery: 0.1 }, eff: { mil: 2, q: 0.01 }, days: 720, cost: 12, req: { rt: 'humanoid_soldier' } });
  bld('cyber_command', { g: 'military', n: 'Кіберкомандування', ic: '🛡', in: { chips: 0.02 }, eff: { ew: 0.12, q: 0.002 }, days: 240, cost: 3, req: { rt: 'post_quantum' } });
  bld('sea_base', { g: 'military', n: 'Плавуча морська база', ic: '⚓', in: { metal: 0.5 }, eff: { naval: 1, supply: 0.05 }, days: 600, cost: 5, req: { rt: 'sea_base_t', coast: 1 } });
  bld('vaccine_plant', { g: 'social', n: 'Вакцинний завод', ic: '💉', in: { chem: 0.02 }, eff: { stab: 0.6, grow: 0.0005 }, days: 300, cost: 2, req: { rt: 'pandemic_shield' } });
  bld('cryo_center', { g: 'social', n: 'Кріоцентр', ic: '🧊', eff: { stab: 0.8, tech: 0.001 }, days: 500, cost: 5, req: { rt: 'cryo' } });
  bld('vertical_city', { g: 'social', n: 'Вертикальне місто', ic: '🏙', in: { metal: 0.6, goods: 0.03 }, eff: { stab: 1, grow: 0.002 }, days: 900, cost: 6, req: { rt: 'smart_city' } });
  bld('space_telescope', { g: 'space', n: 'Орбітальний телескоп', ic: '🔭', eff: { tech: 0.006, stab: 0.2 }, days: 720, cost: 6, req: { rt: 'space_station' } });
  bld('space_hotel', { g: 'space', n: 'Орбітальний готель', ic: '🏨', eff: { grow: 0.003, stab: 0.3 }, days: 900, cost: 8, req: { rt: 'space_tour' } });
  bld('space_mfg_station', { g: 'space', n: 'Орбітальна фабрика', ic: '🏭', in: { rare: 0.02 }, out: { chips: 0.3 }, days: 1000, cost: 30, req: { rt: 'space_mfg' } });
  bld('lunar_mine', { g: 'space', n: 'Місячна копальня', ic: '🌕', out: { rare: 0.4, uranium: 0.02 }, days: 1200, cost: 30, req: { rt: 'lunar_mining' } });
  bld('orbital_yard', { g: 'space', n: 'Орбітальна верф', ic: '🛸', in: { metal: 1 }, eff: { space: 4, ships: 1, tech: 0.004 }, days: 1400, cost: 40, req: { rt: 'orbital_shipyard' } });
  bld('deep_space_center', { g: 'space', n: 'Центр далекого космосу', ic: '🪐', eff: { tech: 0.02, stab: 0.5 }, days: 1500, cost: 25, req: { rt: 'deep_space' } });
  bld('space_elevator', { g: 'space', n: 'Космічний ліфт', ic: '🗼', eff: { space: 6, supply: 0.05, tech: 0.01, grow: 0.004 }, days: 2400, cost: 80, req: { rt: 'space_elevator', coast: 1 } });
  bld('space_habitat', { g: 'space', n: 'Космічне поселення', ic: '🌌', eff: { stab: 1.2, grow: 0.004, tech: 0.006 }, days: 2400, cost: 90, req: { rt: 'space_hab' } });

  // ---- сектори компаній (кожна будівля — одному сектору)
  const as = (s, ids) => { if (SEC && SEC[s]) ids.forEach(k => { if (!SEC[s].assets.includes(k)) SEC[s].assets.push(k); }); };
  as('military', ['counter_drone_grid', 'drone_hive_base', 'loiter_plant', 'hypersonic_plant', 'humanoid_plant']);
  as('space', ['space_telescope', 'space_mfg_station', 'lunar_mine', 'orbital_yard', 'deep_space_center']);
  as('energy', ['msr_plant', 'ocean_plant', 'supercond_grid', 'he3_plant', 'antimatter_plant']);
  as('industry', ['robot_factory', 'solid_battery_plant', 'synth_bio_plant', 'nano_assembler']);
  as('tech', ['quantum_center', 'digital_twin_center', 'ai_trading_hub']);
  as('build', ['vertical_city']); as('health', ['vaccine_plant', 'cryo_center']); as('leisure', ['space_hotel']);

  // ---- покоління техніки (додаються в кінець списків — переозброєння триває поступово)
  const mdl = (t, o) => { if (M[t] && !M[t].some(x => x.rt === o.rt)) M[t].push(o); };
  mdl('uav', { n: 'Баражуючі боєприпаси й дронові вулики', ic: '🦅', att: 1.5, def: 1.35, rt: 'drone_hive' });
  mdl('uav', { n: 'Нанодрони', ic: '🦟', att: 1.75, def: 1.5, rt: 'nano_drones' });
  mdl('eng', { n: 'Розумні мінні поля й автономні сапери', ic: '💥', att: 1.25, def: 1.25, rt: 'smart_mines' });
  mdl('inf', { n: 'Силова броня', ic: '🦿', att: 1.42, def: 1.35, rt: 'power_armor' });
  mdl('inf', { n: 'Бойові гуманоїди поруч із людьми', ic: '🤖', att: 1.6, def: 1.5, rt: 'humanoid_soldier' });
  mdl('spec', { n: 'Спецпризначенці з адаптивним камуфляжем', ic: '👻', att: 1.35, def: 1.25, rt: 'adapt_camo' });
  mdl('mbt', { n: 'Танк 5-го покоління: рейкотрон і плазмовий щит', ic: '🛡', att: 1.6, def: 1.55, rt: 'plasma_shield' });
  mdl('ifv', { n: 'Безекіпажні БМП з роєм дронів', ic: '🚙', att: 1.35, def: 1.3, rt: 'drone_hive' });
  mdl('tube', { n: 'Рейкотронна артилерія', ic: '⚡', att: 1.5, def: 1.3, rt: 'railgun' });
  mdl('mlrs', { n: 'РСЗВ з ШІ-наведенням і баражуючими снарядами', ic: '🎯', att: 1.3, def: 1.15, rt: 'loitering' });
  mdl('ad', { n: 'Протидронові комплекси', ic: '🕸', att: 1.2, def: 1.3, rt: 'counter_drone' });
  mdl('ad', { n: 'Плазмовий щит', ic: '🔆', att: 1.4, def: 1.7, rt: 'plasma_shield' });
  mdl('ftr', { n: 'Гіперзвукові безпілотні винищувачі', ic: '✈', att: 1.7, def: 1.6, rt: 'scramjet' });
  mdl('atk', { n: 'Рої ударних безпілотників', ic: '🛩', att: 1.45, def: 1.3, rt: 'swarm_ai3' });
  mdl('bmb', { n: 'Гіперзвуковий бомбардувальник', ic: '🛫', att: 1.4, def: 1.3, rt: 'scramjet' });
  mdl('heli', { n: 'Безпілотні гелікоптери-рої', ic: '🚁', att: 1.3, def: 1.2, rt: 'loyal_wingman' });

  // ---- розробки компаній на основі нових держтехнологій
  const rd = (s, rows) => { if (RD && SEC && SEC[s] && !RD[s]) RD[s] = (RD._ || []).slice(); if (RD && RD[s]) rows.forEach(r => { if (!RD[s].some(x => x[0] === r[0])) RD[s].push(r); }); };
  rd('military', [['c_loiter', 'Баражуючий боєприпас власної розробки', 1200, ['c_ai_drone'], { rate: 0.12, qual: 0.1 }, 'loitering'], ['c_cdrone', 'Протидроновий комплекс', 1400, ['c_ew'], { qual: 0.12, cap: 1 }, 'counter_drone'],
    ['c_humanoid', 'Бойовий гуманоїд', 4500, ['c_swarm', 'c_robotic'], { rate: 0.2, qual: 0.15 }, 'humanoid_soldier'], ['c_scram', 'Прямоточний двигун', 4000, ['c_hyper'], { qual: 0.15 }, 'scramjet']]);
  rd('energy', [['e_msr', 'Торієвий реактор на солях', 2800, ['e_smr'], { profit: 0.2 }, 'thorium_msr'], ['e_wave', 'Хвильові генератори', 1200, ['e_scada'], { profit: 0.08 }, 'ocean_power'],
    ['e_super', 'Надпровідні лінії', 4000, ['e_smartgrid'], { profit: 0.2, qual: 0.1 }, 'room_supercond'], ['e_he3', 'Гелій-3 реактор', 6000, ['e_fusion'], { profit: 0.4 }, 'he3_mining']]);
  rd('space', [['s_ion', 'Іонні буксири', 2400, [], { profit: 0.15 }, 'ion_drive'], ['s_mine', 'Місячні роботи-копачі', 5000, ['s_ion'], { out: 0.15, profit: 0.15 }, 'lunar_mining'],
    ['s_orbfab', 'Орбітальна мікрогравітаційна фабрика', 5500, ['s_ion'], { profit: 0.25 }, 'space_mfg'], ['s_tour', 'Космічні тури', 1800, [], { profit: 0.12, qual: 0.1 }, 'space_tour']]);
  rd('industry', [['i_robot', 'Сервісні роботи', 1500, [], { profit: 0.12 }, 'robo_services'], ['i_ssb', 'Твердотільні елементи', 1600, [], { profit: 0.1, fuel: 0.05 }, 'solid_battery'],
    ['i_nano', 'Молекулярне складання', 7000, ['i_robot'], { profit: 0.35, fuel: 0.15 }, 'mol_assembly']]);
  rd('tech', [['t_quant', 'Квантовий хмарний сервіс', 3500, [], { users: 0.1, arpu: 0.15 }, 'quantum_comp'], ['t_twin', 'Цифрові двійники для бізнесу', 2500, [], { arpu: 0.12, roy: 0.05 }, 'digital_twin_econ'],
    ['t_algo', 'Торгові алгоритми', 1600, [], { arpu: 0.1 }, 'ai_trading']]);
  rd('health', [['h_vacc', 'Платформа вакцин', 1400, [], { profit: 0.1, qual: 0.1 }, 'pandemic_shield'], ['h_cryo', 'Кріопослуги', 3500, ['h_vacc'], { profit: 0.2 }, 'cryo']]);
})();
