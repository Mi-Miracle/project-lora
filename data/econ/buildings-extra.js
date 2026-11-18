// ДОДАТКОВІ БУДІВЛІ: агро, цифрова економіка (ІТ, ШІ, хмари, ігри, кібербезпека), будівництво.
// Усі профільні будівлі доступні і державі, і компаніям відповідного сектору (data/companies.js).
Object.assign(LORA.data.buildings, {
  livestock:      { g: 'agro', n: 'Тваринницький комплекс', ic: '🐄', in: { grain: 1.2 }, out: { food: 0.09 }, days: 220, req: { fert: 0.25 } },
  dairy:          { g: 'agro', n: 'Молочний завод', ic: '🥛', in: { grain: 0.8 }, out: { food: 0.06 }, days: 200, req: { rt: 'agro_live' } },
  sugar_plant:    { g: 'agro', n: 'Цукровий завод', ic: '🍬', in: { grain: 1, gas: 0.05 }, out: { food: 0.05, chem: 0.02 }, days: 260 },
  winery:         { g: 'agro', n: 'Винзавод', ic: '🍷', in: { grain: 0.2 }, out: { food: 0.02, goods: 0.03 }, days: 300, req: { fert: 0.3, rt: 'agro_wine' } },
  irrigation:     { g: 'agro', n: 'Зрошувальна система', ic: '💧', in: { machinery: 0.01, oil: 0.001 }, out: { grain: 1.4 }, days: 260, req: { rt: 'agro_irrig' } },
  seed_center:    { g: 'agro', n: 'Селекційно-насіннєвий центр', ic: '🌱', in: { chem: 0.01 }, out: { grain: 0.6 }, eff: { tech: 0.0005 }, days: 300, req: { fert: 0.3, rt: 'agro_seed' } },
  elevator:       { g: 'agro', n: 'Елеватор і зерносховище', ic: '🏚', in: { grain: 0.2 }, out: { food: 0.02 }, eff: { stab: 0.1 }, days: 150, req: { rt: 'agro_storage' } },
  aquafarm:       { g: 'agro', n: 'Акваферма', ic: '🦐', in: { grain: 0.3 }, out: { food: 0.05 }, days: 220, req: { coast: 1, rt: 'agro_aqua' } },
  it_park:        { g: 'digital', n: 'ІТ-парк', ic: '🏙', in: { chips: 0.005 }, eff: { grow: 0.0012, tech: 0.0015, net: 0.01 }, days: 240, cost: 1.2, req: { rt: 'dig_it' } },
  cloud_region:   { g: 'digital', n: 'Хмарний регіон', ic: '☁', in: { chips: 0.04 }, eff: { grow: 0.0012, tech: 0.002, net: 0.03 }, days: 320, cost: 3.5, req: { rt: 'dig_cloud' } },
  ai_lab:         { g: 'digital', n: 'ШІ-лабораторія', ic: '🧠', in: { chips: 0.05 }, eff: { tech: 0.005, grow: 0.0012 }, days: 360, cost: 5, req: { rt: 'dig_ai_lab' } },
  game_studio:    { g: 'digital', n: 'Ігрова студія', ic: '🎮', in: { chips: 0.003 }, eff: { grow: 0.0008, stab: 0.2 }, days: 200, cost: 0.6, req: { rt: 'dig_games' } },
  cyber_center:   { g: 'digital', n: 'Кіберцентр', ic: '🛡', in: { chips: 0.01 }, eff: { tech: 0.001, stab: 0.2 }, days: 260, cost: 1.5, req: { rt: 'dig_cyber_c' } },
  platform_hub:   { g: 'digital', n: 'Офіс цифрової платформи', ic: '📱', in: { chips: 0.01 }, eff: { net: 0.02, grow: 0.0008, media: 1 }, days: 240, cost: 1.5, req: { rt: 'dig_soc' } },
  research_center:{ g: 'social', n: 'Приватний R&D-центр', ic: '🧪', in: { chips: 0.01, chem: 0.01 }, eff: { tech: 0.003, grow: 0.0006 }, days: 360, cost: 2 },
  cement_plant:   { g: 'industry', n: 'Цементний завод', ic: '🧱', in: { coal: 0.6, gas: 0.2 }, out: { goods: 0.05, metal: 0.4 }, days: 300 },
  business_center:{ g: 'social', n: 'Бізнес-центр', ic: '🏢', in: { metal: 0.2, goods: 0.01 }, eff: { grow: 0.001, stab: 0.2 }, days: 330, cost: 1.5, req: { rt: 'bld_prefab' } }
});
