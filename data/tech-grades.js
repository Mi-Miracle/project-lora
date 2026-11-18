// ГРЕЙДИ ГАЛУЗЕЙ І НОВІ ДОСЛІДЖЕННЯ (агро, цифрова економіка, будівельні технології).
// Грейд I→II→III підсилює видобуток/виробництво відповідних ресурсів у всій державі та відкриває компаніям
// профільні розробки (нова техніка й методи) — див. data/corp-rd.js, поле st.
(function () {
  const T = LORA.data.techs;
  const GR = [
    // id, гілка, назва, англ., ресурси, назви грейдів
    ['g_oil', 'energy', 'Нафтогазовидобуток', 'Oil & gas extraction', { oil: 1.05, gas: 1.05 }, ['буріння й гідророзрив', 'горизонтальні свердловини', 'цифрові родовища']],
    ['g_coal', 'ind', 'Вугледобування', 'Coal mining', { coal: 1.06 }, ['механізовані лави', 'автоматизовані шахти', 'безлюдний видобуток']],
    ['g_ore', 'ind', 'Гірничорудна справа', 'Ore mining', { metal: 1.05 }, ['карʼєрна техніка', 'збагачення руди', 'роботизовані карʼєри']],
    ['g_nonfer', 'ind', 'Кольорові й рідкісні метали', 'Non-ferrous & rare metals', { nonfer: 1.05, rare: 1.06 }, ['флотація', 'гідрометалургія', 'біовилуговування']],
    ['g_uran', 'energy', 'Видобуток урану', 'Uranium mining', { uranium: 1.08 }, ['підземне вилуговування', 'переробка відвалів', 'уран із морської води']],
    ['g_steel', 'ind', 'Металургія', 'Metallurgy', { metal: 1.03, machinery: 1.02 }, ['конвертерна сталь', 'електродугові печі', 'воднева сталь']],
    ['g_chem', 'ind', 'Хімічна промисловість', 'Chemical industry', { chem: 1.05, fert: 1.04 }, ['каталітичний крекінг', 'тонка хімія', 'зелена хімія']],
    ['g_mach', 'ind', 'Машинобудування', 'Machine building', { machinery: 1.05, goods: 1.03 }, ['верстати з ЧПК', 'гнучкі лінії', 'фабрики без світла']],
    ['g_chip', 'cyber', 'Мікроелектроніка', 'Microelectronics', { chips: 1.06 }, ['28-нм процес', '7-нм процес', '2-нм процес']],
    ['g_grain', 'bio', 'Рослинництво', 'Crop farming', { grain: 1.06 }, ['сівозміни й добрива', 'GPS-техніка', 'автономні поля']],
    ['g_food', 'bio', 'Харчова промисловість', 'Food industry', { food: 1.05 }, ['холодові ланцюги', 'глибока переробка', 'персоналізоване харчування']],
    ['g_goods', 'econ', 'Легка промисловість', 'Light industry', { goods: 1.05 }, ['автоматизовані фабрики', 'кастомізоване виробництво', 'замкнений цикл матеріалів']]
  ];
  const COST = [380, 1300, 4300], ROMAN = ['I', 'II', 'III'];
  GR.forEach(([id, br, n, en, prod, steps]) => steps.forEach((s, k) => {
    const p = {}; for (const r in prod) p[r] = +(1 + (prod[r] - 1) * (1 + k * 0.3)).toFixed(3);
    T[id + (k + 1)] = { br, era: k + 1, n: `${n} ${ROMAN[k]}: ${s}`, en: `${en} ${ROMAN[k]}`, c: COST[k], req: k ? [id + k] : undefined, e: { prod: p }, grade: id, gr: k + 1 };
  }));
  // агро
  Object.assign(T, {
    agro_irrig:   { br: 'bio', era: 1, n: 'Краплинне зрошення', en: 'Drip irrigation', c: 300, e: { prod: { grain: 1.04 } } },
    agro_live:    { br: 'bio', era: 1, n: 'Сучасне тваринництво', en: 'Modern livestock', c: 320, e: { prod: { food: 1.03 } } },
    agro_seed:    { br: 'bio', era: 1, n: 'Національна селекція насіння', en: 'National seed breeding', c: 340, req: ['gene_seeds'], e: { prod: { grain: 1.03 }, stab: 1 } },
    agro_storage: { br: 'bio', era: 1, n: 'Елеватори й зерносховища', en: 'Grain storage', c: 260, e: { prod: { food: 1.02, grain: 1.02 } } },
    agro_aqua:    { br: 'bio', era: 2, n: 'Аквакультура', en: 'Aquaculture', c: 1000, req: ['agro_live'], e: { prod: { food: 1.04 } } },
    agro_soil:    { br: 'bio', era: 2, n: 'Відновлення ґрунтів', en: 'Soil restoration', c: 1100, req: ['agro_irrig'], e: { prod: { grain: 1.05 }, g: 0.001 } },
    agro_robot:   { br: 'bio', era: 2, n: 'Роботизовані ферми', en: 'Robotic farms', c: 1400, req: ['precision_ag', 'agro_live'], e: { prod: { grain: 1.04, food: 1.03 } } },
    agro_wine:    { br: 'bio', era: 2, n: 'Виноробство й крафт', en: 'Winemaking & craft', c: 900, req: ['agro_irrig'], e: { prod: { food: 1.02, goods: 1.01 }, g: 0.0005 } },
    agro_bioeco:  { br: 'bio', era: 3, n: 'Біоекономіка', en: 'Bioeconomy', c: 4100, req: ['agro_soil', 'agro_robot'], e: { prod: { grain: 1.06, chem: 1.03 }, g: 0.002 } },
    // цифрова економіка
    dig_cloud:    { br: 'cyber', era: 1, n: 'Хмарні обчислення', en: 'Cloud computing', c: 320, e: { g: 0.001, tech: 0.01 } },
    dig_it:       { br: 'econ', era: 1, n: 'ІТ-парки й експорт софту', en: 'IT parks & software export', c: 300, e: { g: 0.0015 } },
    dig_games:    { br: 'econ', era: 1, n: 'Індустрія відеоігор', en: 'Video game industry', c: 280, req: ['dig_it'], e: { g: 0.0008, stab: 1 } },
    dig_ai_lab:   { br: 'cyber', era: 2, n: 'Національні ШІ-лабораторії', en: 'National AI labs', c: 1100, req: ['dig_cloud', 'ai_assist'], e: { tech: 0.03, g: 0.0015 } },
    dig_soc:      { br: 'cyber', era: 2, n: 'Власні соцмережі й платформи', en: 'Own platforms', c: 950, req: ['dig_it'], e: { cyber: 0.03, stab: 1 } },
    dig_cyber_c:  { br: 'cyber', era: 2, n: 'Кіберцентри', en: 'Cyber centers', c: 1000, req: ['cyber_def'], e: { cyber: 0.06 } },
    // будівництво
    bld_prefab:   { br: 'ind', era: 1, n: 'Збірне будівництво', en: 'Prefab construction', c: 300, e: { build: 0.05 } },
    bld_3d:       { br: 'ind', era: 2, n: '3D-друк будинків', en: '3D-printed buildings', c: 1000, req: ['bld_prefab'], e: { build: 0.08, stab: 1 } }
  });
})();
