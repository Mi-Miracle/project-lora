// Профілі поведінки ШІ-агентів держав. Кожна держава має свого агента з характером, близьким до реальної політики.
// aggr — схильність до силових рішень (0–1); risk — готовність ризикувати; econ — пріоритет економіки;
// bloc — геополітичний табір; style — тип режиму; goals — довгострокові цілі (ключі для nation-agent.js);
// red — «червоні лінії» (коди держав, напад на які агент вважає неприйнятним без союзників).
// Країни, яких тут немає, отримують профіль за замовчуванням (src/ai/profiles.js будує його з даних).
LORA.data.aiProfiles = {
  USA: { aggr: 0.15, risk: 0.4, econ: 0.8, bloc: 'west', style: 'democracy', goals: ['global_order', 'contain_CHN', 'contain_RUS', 'tech_lead'], red: ['CHN', 'RUS'] },
  CHN: { aggr: 0.25, risk: 0.3, econ: 0.95, bloc: 'east', style: 'one_party', goals: ['reunify_TWN', 'economic_dominance', 'tech_lead', 'secure_trade'], red: ['USA'] },
  RUS: { aggr: 0.6, risk: 0.65, econ: 0.4, bloc: 'east', style: 'autocracy', goals: ['sphere_UKR', 'sphere_post_soviet', 'energy_leverage', 'weaken_NATO'], red: ['USA'] },
  UKR: { aggr: 0.1, risk: 0.5, econ: 0.6, bloc: 'west', style: 'democracy', goals: ['liberate_territory', 'join_west', 'survive'], red: [] },
  DEU: { aggr: 0.02, risk: 0.2, econ: 0.95, bloc: 'west', style: 'democracy', goals: ['export_economy', 'eu_unity'], red: [] },
  FRA: { aggr: 0.05, risk: 0.35, econ: 0.8, bloc: 'west', style: 'democracy', goals: ['eu_unity', 'strategic_autonomy', 'africa_influence'], red: [] },
  GBR: { aggr: 0.06, risk: 0.4, econ: 0.8, bloc: 'west', style: 'democracy', goals: ['global_trade', 'support_UKR'], red: [] },
  POL: { aggr: 0.05, risk: 0.4, econ: 0.7, bloc: 'west', style: 'democracy', goals: ['deter_RUS', 'support_UKR'], red: [] },
  TUR: { aggr: 0.15, risk: 0.5, econ: 0.7, bloc: 'neutral', style: 'hybrid', goals: ['regional_power', 'control_straits', 'balance_blocs'], red: [] },
  IND: { aggr: 0.08, risk: 0.3, econ: 0.9, bloc: 'neutral', style: 'democracy', goals: ['growth', 'contain_PAK', 'balance_blocs'], red: ['CHN'] },
  PAK: { aggr: 0.2, risk: 0.5, econ: 0.5, bloc: 'east', style: 'hybrid', goals: ['contain_IND'], red: [] },
  IRN: { aggr: 0.35, risk: 0.55, econ: 0.4, bloc: 'east', style: 'theocracy', goals: ['regional_proxies', 'survive_sanctions', 'oppose_ISR'], red: [] },
  ISR: { aggr: 0.2, risk: 0.55, econ: 0.7, bloc: 'west', style: 'democracy', goals: ['security', 'contain_IRN'], red: [] },
  SAU: { aggr: 0.1, risk: 0.35, econ: 0.85, bloc: 'neutral', style: 'monarchy', goals: ['oil_revenue', 'contain_IRN', 'diversify'], red: [] },
  PRK: { aggr: 0.45, risk: 0.7, econ: 0.2, bloc: 'east', style: 'totalitarian', goals: ['regime_survival', 'nuclear_deterrence'], red: [] },
  KOR: { aggr: 0.03, risk: 0.2, econ: 0.95, bloc: 'west', style: 'democracy', goals: ['tech_lead', 'deter_PRK'], red: [] },
  JPN: { aggr: 0.02, risk: 0.2, econ: 0.95, bloc: 'west', style: 'democracy', goals: ['tech_lead', 'deter_CHN'], red: [] },
  TWN: { aggr: 0.02, risk: 0.3, econ: 0.95, bloc: 'west', style: 'democracy', goals: ['survive', 'tech_lead'], red: [] },
  BLR: { aggr: 0.15, risk: 0.4, econ: 0.4, bloc: 'east', style: 'autocracy', goals: ['regime_survival', 'ally_RUS'], red: [] },
  BRA: { aggr: 0.04, risk: 0.3, econ: 0.9, bloc: 'neutral', style: 'democracy', goals: ['growth', 'regional_leader'], red: [] },
  EGY: { aggr: 0.08, risk: 0.3, econ: 0.7, bloc: 'neutral', style: 'autocracy', goals: ['suez_revenue', 'water_NILE'], red: [] },
  ETH: { aggr: 0.15, risk: 0.45, econ: 0.6, bloc: 'neutral', style: 'hybrid', goals: ['sea_access', 'dam_power'], red: [] },
  VEN: { aggr: 0.2, risk: 0.5, econ: 0.3, bloc: 'east', style: 'autocracy', goals: ['regime_survival', 'claim_GUY'], red: [] },
  AZE: { aggr: 0.2, risk: 0.45, econ: 0.6, bloc: 'neutral', style: 'autocracy', goals: ['energy_exports'], red: [] },
  SRB: { aggr: 0.08, risk: 0.35, econ: 0.6, bloc: 'neutral', style: 'hybrid', goals: ['claim_KSV'], red: [] }
};
