// ТЕХНОЛОГІЇ 1990–2025 (епоха 0). У сценаріях 2026 року вони вже вивчені всіма; у сценарії 1991 року — ні:
// їх треба дослідити, щоб відкрити сучасні (епоха 1). Деякі країни й сьогодні стоять на рівні 90-х — і це нормально.
LORA.data.techEras[0] = { n: '1990–2025 · відомі технології', en: '1990–2025 · established technologies' };
Object.assign(LORA.data.techs, {
  market_ref:   { br: 'econ', era: 0, n: 'Ринкові реформи й приватизація', en: 'Market reforms and privatisation', c: 120, e: { g: 0.004 } },
  pc_era:       { br: 'econ', era: 0, n: 'Персональні компʼютери в економіці', en: 'Personal computers in the economy', c: 130, e: { g: 0.002 } },
  internet:     { br: 'econ', era: 0, n: 'Інтернет', en: 'The Internet', c: 180, req: ['pc_era'], e: { g: 0.004 } },
  ecommerce:    { br: 'econ', era: 0, n: 'Електронна комерція й онлайн-банкінг', en: 'E-commerce and online banking', c: 200, req: ['internet', 'market_ref'], e: { g: 0.003 } },
  cnc:          { br: 'ind', era: 0, n: 'Верстати з ЧПК', en: 'CNC machine tools', c: 140, e: { prod: { goods: 1.04, machinery: 1.04 } } },
  just_in_time: { br: 'ind', era: 0, n: 'Сучасний менеджмент виробництва', en: 'Lean manufacturing', c: 160, req: ['cnc'], e: { prod: { goods: 1.03 }, build: 0.03 } },
  ccgt:         { br: 'energy', era: 0, n: 'Парогазові електростанції', en: 'Combined-cycle power plants', c: 150, e: { prod: { gas: 1.03 } } },
  nuc_safety:   { br: 'energy', era: 0, n: 'Безпека АЕС після Чорнобиля', en: 'Post-Chernobyl nuclear safety', c: 150, e: { stab: 2 } },
  precision:    { br: 'mil', era: 0, n: 'Високоточна зброя', en: 'Precision-guided munitions', c: 200, e: { q: 0.03 } },
  modern_armor: { br: 'mil', era: 0, n: 'Сучасні танки й бронетехніка', en: 'Modern tanks and armour', c: 180, e: { q: 0.03 } },
  stealth:      { br: 'mil', era: 0, n: 'Технологія «стелс»', en: 'Stealth technology', c: 260, req: ['precision'], e: { q: 0.02 } },
  sam_new:      { br: 'mil', era: 0, n: 'ППО нового покоління', en: 'Next-generation air defence', c: 220, req: ['precision'], e: { q: 0.02 } },
  uav_recon:    { br: 'drone', era: 0, n: 'Розвідувальні безпілотники 90-х', en: '1990s reconnaissance UAVs', c: 160, e: { q: 0.01, sup: 0.01 } },
  uav_strike:   { br: 'drone', era: 0, n: 'Ударні безпілотники', en: 'Strike UAVs', c: 220, req: ['uav_recon', 'precision'], e: { q: 0.02 } },
  gps:          { br: 'cyber', era: 0, n: 'Супутникова навігація', en: 'Satellite navigation', c: 170, e: { sup: 0.03 } },
  mobile_net:   { br: 'cyber', era: 0, n: 'Мобільний звʼязок', en: 'Mobile networks', c: 170, e: { g: 0.002 } },
  gmo:          { br: 'bio', era: 0, n: 'Інтенсивне землеробство й нові сорти', en: 'Intensive farming and new crop varieties', c: 150, e: { prod: { grain: 1.05 } } },
  launch_comm:  { br: 'space', era: 0, n: 'Комерційні запуски ракет', en: 'Commercial rocket launches', c: 200, e: {} },
  aegis:        { br: 'navy', era: 0, n: 'Корабельні системи ППО', en: 'Naval air-defence systems', c: 200, e: { nav: 0.03 } }
});
