// НОВІ РЕСУРСИ (2.7): літій, деревина, ліки — мають природний видобуток і попит; водень, графен і гелій-3 —
// лише з будівель (попит теж лише від будівель). pOf/pK — видобуток країни як частка видобутку іншого ресурсу,
// shOf — розподіл по регіонах як у іншого ресурсу. Плюс будівлі, технології й КОСМІЧНА ЗБРОЯ.
(function () {
  const RI = LORA.data.resources, RO = LORA.data.resourceOrder, RG = LORA.data.resourceGroups, B = LORA.data.buildings, T = LORA.data.techs, SEC = LORA.data.companySectors;
  const res = (id, o, grp) => { if (RI[id]) return; RI[id] = o; RO.push(id); const g = RG.find(x => x.id === grp); if (g) g.list.push(id); };
  res('lithium', { n: 'Літій', u: 'тис. т', price: 0.6, tc: 0.004, mode: 2, wg: 0.9, w: 0.02, ic: '🔋', col: [160, 230, 255], pOf: 'rare', pK: 0.2, shOf: 'rare' }, 'raw');
  res('timber', { n: 'Деревина', u: 'млн м³', price: 0.08, tc: 0.05, mode: 0, wg: 0.5, w: 0.02, ic: '🪵', col: [150, 100, 60], pOf: 'grain', pK: 0.6, shOf: 'grain' }, 'raw');
  res('medicine', { n: 'Ліки', u: '×$10 млрд', price: 10.0, tc: 0.004, mode: 2, wg: 0.4, w: 0.04, ic: '💊', col: [255, 120, 180], pOf: 'chem', pK: 0.25, shOf: 'chem' }, 'industry');
  res('hydrogen', { n: 'Водень', u: 'млн т', price: 2.0, tc: 0.02, mode: 1, wg: 0.8, w: 0.0, ic: '💨', col: [200, 230, 255], only: 1 }, 'energy');
  res('graphene', { n: 'Графен', u: 'тис. т', price: 0.5, tc: 0.002, mode: 2, wg: 0.9, w: 0.0, ic: '🕸', col: [90, 90, 110], only: 1 }, 'tech');
  res('he3', { n: 'Гелій-3', u: 'т', price: 3.0, tc: 0.001, mode: 2, wg: 0.9, w: 0.0, ic: '🌑', col: [210, 210, 240], only: 1 }, 'energy');
  // реальні обсяги (прибл. 2024): літій, тис. т; деревина (круглий ліс), млн м³
  const PR = LORA.data.production;
  if (PR && !PR.lithium) PR.lithium = { AUS: 88, CHL: 44, CHN: 33, ZWE: 15, ARG: 9, BRA: 5, CAN: 3, USA: 1.5, PRT: 0.5, NAM: 2, MLI: 1.5 };
  if (PR && !PR.timber) PR.timber = { USA: 430, IND: 350, CHN: 330, BRA: 280, RUS: 210, CAN: 140, IDN: 120, ETH: 115, COD: 90, NGA: 75, SWE: 75, FIN: 60, DEU: 55, POL: 42, FRA: 48, CHL: 60, VNM: 40, MYS: 25, NZL: 36, AUS: 30, UKR: 18, JPN: 30, TUR: 30, ROU: 18, AUT: 18, CZE: 25, BLR: 25, MEX: 45, ARG: 18, ZAF: 18, THA: 30, TZA: 25, UGA: 50, KEN: 30, MOZ: 18, AGO: 6, PNG: 10, MMR: 40, PAK: 30, BGD: 28, NOR: 11, ESP: 16, ITA: 12, GBR: 10, LVA: 13, EST: 10, LTU: 7, PRT: 12 };
  // ---- технології
  const tech = (id, br, era, n, en, c, req, e) => { if (!T[id]) T[id] = { br, era, n, en, c, req, e: e || {} }; };
  tech('lithium_ext', 'ind', 1, 'Видобуток літію з розсолів', 'Lithium brine extraction', 700, ['adv_mats'], { prod: { lithium: 1.15 } });
  tech('dle', 'ind', 2, 'Пряме вилучення літію', 'Direct lithium extraction', 1800, ['lithium_ext'], { prod: { lithium: 1.25 } });
  tech('forestry_t', 'bio', 1, 'Сталеве лісове господарство', 'Sustainable forestry', 600, ['precision_ag'], { prod: { timber: 1.12 } });
  tech('wood_sky', 'ind', 2, 'Деревʼяні хмарочоси (CLT)', 'Timber skyscrapers (CLT)', 1500, ['forestry_t', 'bld_prefab'], { build: 0.04 });
  tech('pharma_ai', 'bio', 2, 'ШІ-фармацевтика', 'AI drug discovery', 1700, ['mrna', 'ai_assist'], { prod: { medicine: 1.2 }, stab: 2 });
  tech('h2_economy', 'energy', 2, 'Воднева економіка', 'Hydrogen economy', 1900, ['green_h2'], { prod: { hydrogen: 1.25 } });
  tech('graphene_mass', 'ind', 3, 'Масовий графен', 'Mass graphene production', 4300, ['graphene'], { prod: { graphene: 1.3 } });
  tech('he3_refine', 'space', 4, 'Збагачення гелію-3', 'Helium-3 refining', 22000, ['lunar_mining'], { prod: { he3: 1.3 } });
  // космічна зброя
  tech('killer_sats', 'space', 3, 'Супутники-перехоплювачі', 'Killer satellites', 4200, ['asat'], { cyber: 0.05 });
  tech('orbital_laser', 'mil', 4, 'Орбітальні лазери', 'Orbital lasers', 26000, ['orbital_def', 'laser_ad'], { q: 0.05 });
  tech('space_drones', 'space', 4, 'Космічні дрони-рої', 'Space drone swarms', 24000, ['killer_sats', 'swarm_ai3'], { q: 0.04 });
  // ---- будівлі
  const bld = (id, o) => { if (!B[id]) B[id] = o; };
  bld('lithium_mine', { g: 'extract', n: 'Літієва копальня', ic: '🔋', out: { lithium: 0.6 }, days: 360, req: { geo: 'lithium' } });
  bld('dle_plant', { g: 'extract', n: 'Установка прямого вилучення літію', ic: '🧂', in: { chem: 0.01 }, out: { lithium: 1.2 }, days: 420, req: { rt: 'dle' } });
  bld('logging', { g: 'extract', n: 'Лісозаготівля', ic: '🪓', out: { timber: 8 }, days: 200, req: { terrain: ['forest', 'mountain', 'hills', 'taiga', 'arctic'] } });
  bld('sawmill', { g: 'industry', n: 'Деревообробний комбінат', ic: '🪵', in: { timber: 10 }, out: { goods: 0.08, machinery: 0.01 }, days: 240 });
  bld('clt_plant', { g: 'industry', n: 'Завод CLT-панелей', ic: '🏗', in: { timber: 8 }, out: { goods: 0.05 }, eff: { stab: 0.2, grow: 0.0005 }, days: 300, req: { rt: 'wood_sky' } });
  bld('med_plant', { g: 'industry', n: 'Фабрика ліків', ic: '💊', in: { chem: 0.05 }, out: { medicine: 0.12 }, eff: { stab: 0.2 }, days: 360 });
  bld('ai_pharma', { g: 'industry', n: 'ШІ-фармлабораторія', ic: '🧬', in: { chips: 0.02, chem: 0.03 }, out: { medicine: 0.25 }, eff: { stab: 0.3, tech: 0.001 }, days: 420, req: { rt: 'pharma_ai' } });
  bld('electrolyzer', { g: 'energy', n: 'Електролізний завод водню', ic: '💨', in: { nonfer: 0.005 }, out: { hydrogen: 0.4 }, eff: { green: 1 }, days: 360, req: { rt: 'green_h2' } });
  bld('h2_steel', { g: 'industry', n: 'Воднева «зелена» сталь', ic: '⚙', in: { hydrogen: 0.3, metal: 2 }, out: { metal: 2.4, machinery: 0.05 }, eff: { green: 1 }, days: 480, req: { rt: 'h2_economy' } });
  bld('fuelcell_plant', { g: 'industry', n: 'Завод паливних елементів', ic: '🔌', in: { hydrogen: 0.2, nonfer: 0.01 }, out: { machinery: 0.15 }, days: 420, req: { rt: 'h2_economy' } });
  bld('graphene_plant', { g: 'industry', n: 'Графеновий завод', ic: '🕸', in: { coal: 2, chem: 0.02 }, out: { graphene: 0.8 }, days: 420, req: { rt: 'graphene' } });
  bld('graphene_chips', { g: 'industry', n: 'Фабрика графенової електроніки', ic: '💾', in: { graphene: 0.5, rare: 0.05 }, out: { chips: 0.4 }, days: 600, req: { rt: 'graphene_mass' } });
  bld('he3_refinery', { g: 'space', n: 'Переробка гелію-3', ic: '🌑', in: { rare: 0.02 }, out: { he3: 0.2 }, days: 900, req: { rt: 'he3_refine' } });
  // гелій-3 з Місяця живить термоядерні станції; акумулятори — з літієм
  if (B.lunar_mine) B.lunar_mine.out = Object.assign({}, B.lunar_mine.out, { he3: 0.1 });
  if (B.he3_plant) B.he3_plant.in = Object.assign({}, B.he3_plant.in || {}, { he3: 0.05 });
  if (B.battery_plant) B.battery_plant.in = Object.assign({}, B.battery_plant.in, { lithium: 0.4 });
  if (B.solid_battery_plant) B.solid_battery_plant.in = Object.assign({}, B.solid_battery_plant.in, { lithium: 0.5 });
  if (B.lithium_refinery) B.lithium_refinery.in = Object.assign({}, B.lithium_refinery.in, { lithium: 0.3 });
  if (B.housing) B.housing.in = Object.assign({}, B.housing.in, { timber: 0.4 });
  if (B.hospital) B.hospital.in = Object.assign({}, B.hospital.in, { medicine: 0.02 });
  // космічна зброя
  bld('killer_sat_center', { g: 'space', n: 'Центр супутників-перехоплювачів', ic: '🛰', in: { chips: 0.03 }, eff: { shield: 0.1, satc: 1 }, days: 600, cost: 12, req: { rt: 'killer_sats' } });
  bld('orbital_laser_platform', { g: 'space', n: 'Орбітальна лазерна платформа', ic: '🔆', in: { he3: 0.01 }, eff: { shield: 0.35, q: 0.006 }, days: 1200, cost: 45, req: { rt: 'orbital_laser' } });
  bld('kinetic_platform', { g: 'space', n: 'Платформа кінетичних ударів', ic: '☄', in: { metal: 0.5 }, eff: { mil: 1 }, days: 1400, cost: 50, req: { rt: 'kinetic_orbital' } });
  bld('space_drone_hangar', { g: 'space', n: 'Орбітальний ангар дронів', ic: '🛸', in: { chips: 0.05 }, eff: { shield: 0.12, q: 0.005 }, days: 900, cost: 25, req: { rt: 'space_drones' } });
  // ---- сектори компаній
  const as = (s, ids) => { if (SEC && SEC[s]) ids.forEach(k => { if (!SEC[s].assets.includes(k)) SEC[s].assets.push(k); }); };
  as('mining', ['lithium_mine', 'dle_plant', 'logging']); as('industry', ['sawmill', 'clt_plant', 'h2_steel', 'fuelcell_plant', 'graphene_plant']); as('health', ['med_plant', 'ai_pharma']);
  as('energy', ['electrolyzer']); as('semi', ['graphene_chips']); as('space', ['he3_refinery']); as('military', []);
  // ---- космічна зброя в арсеналі
  const U = LORA.data.units; if (U && !U.orbital) U.orbital = { n: 'Орбітальні кінетичні удари', en: 'Orbital kinetic strikes', u: 'од.', ic: '☄', px: 5, prod: { kinetic_platform: 6 }, rt: 'kinetic_orbital', ref: 0, price: 0.06, d: 'Вольфрамові стрижні з орбіти: будь-яка точка світу, майже неперехоплювані, величезна сила удару.' };
  if (U && !U.laser) U.laser = { n: 'Орбітальні лазерні постріли', en: 'Orbital laser shots', u: 'од.', ic: '🔆', px: 6, prod: { orbital_laser_platform: 40 }, rt: 'orbital_laser', ref: 0, price: 0.01, d: 'Лазер з орбіти: точні удари по військах і техніці будь-де у світі; ППО безсила.' };
})();
