// СТАРТОВІ БУДІВЛІ: наявна інфраструктура країн на початок гри, щоб нічого не будувати з нуля.
// Виробничі будівлі «вирізаються» з уже наявного видобутку/виробництва регіону (подвійного рахунку немає).
// convert: яку частку виробництва регіону показати як будівлі; max — максимум рівнів на регіон.
LORA.data.startBuildings = {
  convert: {
    oil_field: { r: 'oil', share: 0.6, max: 10 }, gas_field: { r: 'gas', share: 0.6, max: 10 }, coal_mine: { r: 'coal', share: 0.6, max: 10 },
    ore_mine: { r: 'metal', share: 0.5, max: 10 }, nonfer_mine: { r: 'nonfer', share: 0.5, max: 8 }, uranium_mine: { r: 'uranium', share: 0.6, max: 8 },
    rare_mine: { r: 'rare', share: 0.5, max: 8 }, farm: { r: 'grain', share: 0.4, max: 10 }, food_plant: { r: 'food', share: 0.4, max: 8 },
    fert_plant: { r: 'fert', share: 0.4, max: 8 }, machine_plant: { r: 'machinery', share: 0.4, max: 10 }, chem_plant: { r: 'chem', share: 0.4, max: 10 },
    goods_factory: { r: 'goods', share: 0.3, max: 10 }, chip_fab: { r: 'chips', share: 0.4, max: 10 }
  },
  // кількість енергоблоків АЕС (≈2025); 1 рівень АЕС ≈ 4 блоки
  reactors: { USA: 94, FRA: 56, CHN: 57, RUS: 36, KOR: 26, IND: 23, CAN: 19, UKR: 15, JPN: 14, GBR: 9, ESP: 7, SWE: 6, CZE: 6, PAK: 6, BEL: 4, FIN: 5, SVK: 5, HUN: 4, ARE: 4, ZAF: 2, ARG: 3, BRA: 2, BGR: 2, CHE: 4, ROU: 2, IRN: 1, MEX: 2, SVN: 1, NLD: 1, BLR: 2, ARM: 1, TUR: 1, EGY: 0 },
  hydro: { CHN: 6, BRA: 4, CAN: 4, USA: 3, RUS: 3, NOR: 3, IND: 2, TUR: 2, VNM: 1, VEN: 1, COL: 1, SWE: 1, CHE: 1, AUT: 1, PRY: 1, ETH: 1, UKR: 1, KGZ: 1, TJK: 1, LAO: 1 },
  renewables: { CHN: 6, USA: 4, DEU: 3, IND: 3, ESP: 2, BRA: 2, GBR: 2, AUS: 2, FRA: 1, ITA: 1, NLD: 1, DNK: 1, TUR: 1, MEX: 1, CHL: 1, MAR: 1, ZAF: 1, JPN: 2, VNM: 1 },
  drones: { USA: 4, CHN: 4, TUR: 3, UKR: 4, IRN: 3, ISR: 2, RUS: 3, IND: 1, KOR: 1, GBR: 1, FRA: 1, DEU: 1, POL: 1, PAK: 1 },
  missiles: { USA: 3, RUS: 3, CHN: 3, IRN: 2, PRK: 2, ISR: 1, IND: 1, FRA: 1, GBR: 1, KOR: 1, UKR: 1, PAK: 1, JPN: 1, TUR: 1 },
  airDefense: { ISR: 3, UKR: 3, RUS: 3, USA: 2, CHN: 2, KOR: 1, SAU: 2, IRN: 2, ARE: 1, POL: 1, DEU: 1, TWN: 2, JPN: 1, IND: 1 },
  // точні розміщення: [країна-власник, назва регіону, будівля, рівнів]
  place: [
    ['UKR', 'Рівненська обл.', 'npp', 1], ['UKR', 'Хмельницька обл.', 'npp', 1], ['UKR', 'Миколаївська обл.', 'npp', 1], ['UKR', 'Запорізька обл.', 'npp', 2],
    ['UKR', 'Дніпропетровська обл.', 'steel_plant', 2], ['UKR', 'Запорізька обл.', 'steel_plant', 1], ['UKR', 'Донецька обл.', 'steel_plant', 1],
    ['UKR', 'Одеська обл.', 'port', 2], ['UKR', 'Миколаївська обл.', 'port', 1], ['UKR', 'Харківська обл.', 'arms_factory', 1], ['UKR', 'Київ (місто)', 'arms_factory', 1],
    ['UKR', 'Київ (місто)', 'university', 2], ['UKR', 'Харківська обл.', 'university', 1], ['UKR', 'Львівська обл.', 'university', 1],
    ['UKR', 'Донецька обл.', 'fortline', 3], ['UKR', 'Запорізька обл.', 'fortline', 2], ['UKR', 'Харківська обл.', 'fortline', 2], ['UKR', 'Сумська обл.', 'fortline', 1],
    ['UKR', 'Київ (місто)', 'air_defense', 2], ['UKR', 'Дніпропетровська обл.', 'depot', 2], ['UKR', 'Київська обл.', 'rail_hub', 1], ['UKR', 'Львівська обл.', 'rail_hub', 1],
    ['RUS', 'Бєлгородська обл.', 'fortline', 1], ['RUS', 'Ростовська обл.', 'depot', 2], ['RUS', 'Воронезька обл.', 'military_base', 1],
    ['ISR', 'Тель-Авівський округ', 'air_defense', 1], ['KOR', 'Кьонгі-до', 'fortline', 1]
  ]
};
