// Налаштування гри, які зручно міняти без лізання в логіку.
LORA.config = {
  startYear: 2026,
  companyCash: 5,                    // стартовий капітал компанії гравця, $ млрд (фіксований)
  speeds: [0, 0.1, 0.33, 1, 4],      // днів за секунду: ▶ рік ≈ 1 год, ▶▶ ≈ 18 хв, ▶▶▶ ≈ 6 хв, ⏩ ≈ 1.5 хв
  tradeRecalcDays: 7,                 // як часто перераховуються торгові потоки
  aiPolicyDays: 30,                   // як часто ШІ переглядає бюджет і дипломатію
  aiArmyDays: 2,                      // як часто ШІ віддає накази арміям
  autosaveDays: 30,
  map: { relief: 'assets/map/relief.jpg', politicalAlpha: 0.42, maxZoom: 220 },
  stream: { enabled: false, websocketUrl: '' } // див. docs/STREAM.md
};
