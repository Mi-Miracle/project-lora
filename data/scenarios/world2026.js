// Сценарії. Кожен описує стартові війни, лінію фронту (контроль і наступи в регіонах) та розміщення військ.
// Регіони вказуються назвою (як у data/geo/regions.js) і кодом країни-власника.
LORA.data.scenarios = LORA.data.scenarios || {};
LORA.data.scenarios.war2026 = {
  name: 'Світ-2026: російсько-українська війна триває',
  wars: [{ att: 'RUS', def: 'UKR', name: 'Російсько-українська війна', exh: { RUS: 0.35, UKR: 0.4 } }],
  control: [ // регіони під контролем іншої держави
    { cc: 'UKR', n: 'Автономна Республіка Крим', ctrl: 'RUS', dmg: 0.05 },
    { cc: 'UKR', n: 'Севастополь', ctrl: 'RUS' },
    { cc: 'UKR', n: 'Луганська обл.', ctrl: 'RUS', dmg: 0.4, fort: 0.8 }
  ],
  fronts: [ // наступ у процесі: by — хто наступає, p — % контролю; fort — укріплення 0–1
    { cc: 'UKR', n: 'Донецька обл.', by: 'RUS', p: 72, dmg: 0.45, fort: 0.9 },
    { cc: 'UKR', n: 'Запорізька обл.', by: 'RUS', p: 65, dmg: 0.3, fort: 0.9 },
    { cc: 'UKR', n: 'Херсонська обл.', by: 'RUS', p: 30, dmg: 0.25, fort: 0.8 },
    { cc: 'UKR', n: 'Харківська обл.', dmg: 0.2, fort: 0.6 }, { cc: 'UKR', n: 'Сумська обл.', dmg: 0.08 }
  ],
  deploy: [ // [країна, регіон-власник, назва регіону, частка армії]
    ['RUS', 'UKR', 'Донецька обл.', 0.22], ['RUS', 'UKR', 'Запорізька обл.', 0.12], ['RUS', 'UKR', 'Херсонська обл.', 0.06], ['RUS', 'UKR', 'Луганська обл.', 0.08], ['RUS', 'RUS', 'Бєлгородська обл.', 0.07], ['RUS', 'RUS', 'Курська обл.', 0.05],
    ['UKR', 'UKR', 'Донецька обл.', 0.3], ['UKR', 'UKR', 'Запорізька обл.', 0.18], ['UKR', 'UKR', 'Херсонська обл.', 0.1], ['UKR', 'UKR', 'Харківська обл.', 0.14], ['UKR', 'UKR', 'Сумська обл.', 0.06], ['UKR', 'UKR', 'Київ (місто)', 0.1]
  ],
  policy: { UKR: { soc: 0.12 } },
  aid: { UKR: 45 }
};
LORA.data.scenarios.peace = { name: 'Мирний світ (без активних воєн)', wars: [], control: [], fronts: [], deploy: [] };
// ---- додаткові сценарії (base — сценарій-основа, поверх якого застосовуються зміни)
LORA.data.scenarios.taiwan2027 = {
  name: 'Тайванська криза: Китай атакує Тайвань, війна в Україні триває',
  base: 'war2026',
  wars: [{ att: 'CHN', def: 'TWN', name: 'Тайванська війна', exh: { CHN: 0.05, TWN: 0.05 } }],
  fronts: [{ cc: 'TWN', n: 'Округ Гуалянь', fort: 1 }, { cc: 'TWN', n: 'Цзіньмень', fort: 0.7 }],
  aid: { TWN: 30 },
  rel: [['USA', 'CHN', -70], ['JPN', 'CHN', -65], ['TWN', 'USA', 70], ['TWN', 'JPN', 60], ['PHL', 'CHN', -55]],
  shock: { chips: [2.6, 720], rare: [1.8, 540] },
  worldMod: [-0.012, 365],
  stab: { TWN: -6, CHN: -3 }
};
LORA.data.scenarios.coldwar = {
  name: 'Холодна війна 2.0: два табори, гонка озброєнь',
  base: 'war2026',
  relGroup: [
    [['USA', 'GBR', 'FRA', 'DEU', 'POL', 'ITA', 'CAN', 'JPN', 'KOR', 'AUS', 'NLD', 'ESP', 'TUR'], ['RUS', 'CHN', 'IRN', 'PRK', 'BLR'], -25],
    [['RUS', 'CHN', 'IRN', 'PRK', 'BLR'], ['RUS', 'CHN', 'IRN', 'PRK', 'BLR'], 15]
  ],
  shock: { oil: [1.3, 365], machinery: [1.2, 365] },
  stab: { RUS: -3, CHN: -2 }
};
LORA.data.scenarios.energy = {
  name: 'Енергетична криза: нафта й газ подорожчали вдвічі–втричі (мирний світ)',
  base: 'peace',
  shock: { oil: [2.2, 540], gas: [3, 540], coal: [1.6, 360], fert: [1.8, 360], food: [1.3, 360] },
  worldMod: [-0.018, 540],
  stab: { DEU: -6, FRA: -4, ITA: -5, ESP: -4, GBR: -4, POL: -4, JPN: -4, KOR: -3, IND: -3, TUR: -5, EGY: -6, PAK: -6 }
};
LORA.data.scenarios.mideast = {
  name: 'Велика війна на Близькому Сході + війна в Україні',
  base: 'war2026',
  wars: [{ att: 'IRN', def: 'ISR', name: 'Ірано-ізраїльська війна', exh: { IRN: 0.1, ISR: 0.1 } }],
  rel: [['USA', 'IRN', -95], ['SAU', 'IRN', -70], ['ARE', 'IRN', -55]],
  shock: { oil: [1.9, 450], gas: [1.4, 300] },
  worldMod: [-0.008, 300],
  stab: { ISR: -5, IRN: -6, LBN: -8, JOR: -4 }
};
