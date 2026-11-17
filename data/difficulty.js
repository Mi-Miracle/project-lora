// РІВНІ СКЛАДНОСТІ. Множники застосовуються на старті гри (src/sim/game.js → G.init).
// cash — стартові резерви гравця (частка ВВП); growth — бонус до зростання гравця; debt — множник стартового боргу;
// aiAggr — схильність ШІ до воєн; aiNeed — зміна потрібної ШІ переваги для наступу (мінус — сміливіший);
// aiQ — якість армій ШІ; aiInvest — інвестиції ШІ в розвиток; badEvents — частота криз і катастроф; companyCash — стартовий капітал компанії гравця, $ млрд.
LORA.data.difficulty = {
  easy:      { n: 'Легко', d: 'Більше грошей, мирніший ШІ, менше криз', cash: 0.15, growth: 0.006, debt: 0.8, aiAggr: 0.5, aiNeed: 0.15, aiQ: 0.95, aiInvest: 0.85, badEvents: 0.6, companyCash: 25 },
  normal:    { n: 'Нормально', d: 'Реалістичний баланс', cash: 0.03, growth: 0, debt: 1, aiAggr: 1, aiNeed: 0, aiQ: 1, aiInvest: 1, badEvents: 1, companyCash: 10 },
  hard:      { n: 'Складно', d: 'ШІ агресивніший і сильніший, частіші кризи', cash: 0, growth: -0.003, debt: 1.15, aiAggr: 1.35, aiNeed: -0.05, aiQ: 1.05, aiInvest: 1.2, badEvents: 1.3, companyCash: 5 },
  nightmare: { n: 'Кошмар', d: 'Світ проти вас: жорсткий ШІ, борги, катастрофи', cash: 0, growth: -0.006, debt: 1.35, aiAggr: 1.8, aiNeed: -0.12, aiQ: 1.1, aiInvest: 1.35, badEvents: 1.7, companyCash: 2 }
};
