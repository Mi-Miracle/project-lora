// ВЕЛИКІ ЗАВДАННЯ ПРОФЕСІЙ (v4.2): як фронт у військових — кожна професія має справи з реальним впливом на світ.
// Справа триває кілька днів, персонаж зайнятий (місто й перельоти — після), дні зараховуються як робочі.
// Частина справ — поїздки: персонаж їде/летить мапою (видно на мапі), повертається або лишається в країні призначення.
LORA.sim.register('jobops', 99.999, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const sk = (L, k) => G.skill ? G.skill(L, k) : 0; const km = (a, b) => hav(T[a].c[0], T[a].c[1], T[b].c[0], T[b].c[1]);
  const capOf = nid => N[nid].home >= 0 ? N[nid].home : ter.findIndex(t => t.ctrl === nid);
  const pop = (L, nid, v) => { L.popu[nid] = clamp((L.popu[nid] || 0) + v, 0, 100); };
  const rel = (a, b, v) => { if (a === b || a < 0 || b < 0) return; G.rel[a][b] = clamp(G.rel[a][b] + v, -100, 100); G.rel[b][a] = clamp(G.rel[b][a] + v, -100, 100); };
  const home = L => L.job ? L.job.nid : L.home;
  // ціль: home — на місці; abroad — столиці інших країн; front — прифронтові регіони; build — будови країни; dmg — зруйновані регіони; city — міста країни й сусідів
  // tr: 'go' — лишається в країні призначення, 'round' — повертається; v — транспорт на мапі
  const O = (id, n, lvl, days, cd, o) => Object.assign({ id, n, lvl, days, cd, tg: 'home', xp: 1, d: '' }, o);
  G.JOB_OPS = {
    cook: [O('cater', 'Кейтеринг на державному прийомі', 2, 2, 20, { d: 'гроші й знайомства з елітою', fx: (L, s, t, n) => { const m = $(400 + L.job.lvl * 300) * (0.5 + s); L.money += m; L.cont[n.id] = clamp((L.cont[n.id] || 0) + 2, 0, 100); return `гості в захваті. Гонорар ${f$(m)}, звʼязки +2`; } }),
      O('fest', 'Гастрофестиваль за кордоном', 3, 6, 60, { tg: 'abroad', tr: 'go', v: '✈', d: 'популярність у країні фестивалю, слава', fx: (L, s, t, n) => { pop(L, n.id, 3 + s * 3); L.fame += 1 + s; const m = $(1500) * s; L.money += m; return `${s > 0.6 ? 'перше місце!' : 'гарний виступ'} Популярність у ${n.name} зросла, призові ${f$(m)}`; } })],
    seller: [O('fair', 'Виставка-ярмарок', 1, 3, 20, { d: 'бонус із продажів, звʼязки', fx: (L, s, t, n) => { const m = $(300 + L.job.lvl * 250) * (0.4 + s); L.money += m; L.cont[n.id] = clamp((L.cont[n.id] || 0) + 1, 0, 100); return `продано на ярмарку: бонус ${f$(m)}`; } }),
      O('import', 'Переговори з іноземним постачальником', 3, 5, 45, { tg: 'abroad', tr: 'round', v: '✈', d: 'знижка для мережі, відносини країн', fx: (L, s, t, n) => { const m = $(2500) * s; L.money += m; rel(home(L), n.id, 1); return `контракт з ${n.name}: премія ${f$(m)}, відносини +1`; } })],
    driver: [O('haul', 'Міжнародний рейс з вантажем', 2, 0, 3, { tg: 'city', tr: 'round', v: '🚚', spd: 650, d: 'оплата за кілометри; біля фронту — небезпечно', fx: (L, s, t, n, op) => { const m = $(op.km * 2 * 0.35) * (0.7 + s * 0.4); L.money += m; return `вантаж доставлено в ${T[t].n} (${Math.round(op.km)} км): ${f$(m)}`; } }),
      O('convoy', 'Гуманітарний конвой до фронту', 2, 0, 20, { tg: 'front', tr: 'round', v: '🚚', spd: 500, risk: 0.25, d: 'постачання армії, популярність; ризик обстрілу', fx: (L, s, t, n) => { G.armies.filter(a => a.n === home(L) && a.t === t).forEach(a => { a.sup = Math.min(1, a.sup + 0.15); }); pop(L, home(L), 3); return `конвой дійшов до ${T[t].n}: постачання військ +15%, популярність +3`; } }),
      O('plan', 'Спланувати мережу перевезень країни', 4, 7, 90, { d: 'зростання економіки країни на пів року', fx: (L, s, t, n) => { n.mods.push({ growth: 0.0006 * (0.5 + s), until: G.day + 180 }); pop(L, n.id, 1); return 'уряд затвердив вашу схему: економіка зростатиме швидше пів року'; } })],
    pilot: [O('flight', 'Міжнародний рейс', 2, 0, 3, { tg: 'abroad', tr: 'round', v: '✈', spd: 6000, max: 9000, d: 'оплата за відстань', fx: (L, s, t, n, op) => { const m = $(op.km * 2 * 0.35) * (0.8 + s * 0.4); L.money += m; return `рейс до ${n.name} і назад (${Math.round(op.km)} км): ${f$(m)}${s > 0.85 ? ' — ідеальна посадка, пасажири аплодують' : ''}`; } }),
      O('airlift', 'Гуманітарний авіаміст', 3, 0, 40, { tg: 'abroad', tr: 'round', v: '✈', spd: 5000, max: 9000, d: 'відносини з країною-отримувачем, слава', fx: (L, s, t, n) => { rel(home(L), n.id, 3); L.fame += 2; return `допомогу доставлено в ${n.name}: відносини +3, слава +2`; } }),
      O('school', 'Навчити нових пілотів', 4, 10, 60, { d: 'досвід, гроші', xp: 2, fx: (L, s) => { const m = $(3000) * (0.5 + s); L.money += m; return `курсанти склали іспити: ${f$(m)}`; } })],
    builder: [O('site', 'Прискорити будівництво обʼєкта країни', 2, 7, 15, { tg: 'build', d: 'реальна будова країни завершиться раніше', fx: (L, s, t, n, op) => { const c = G.constructions.find(x => x.id === op.cid); const d = Math.round(12 * (0.5 + s)); if (c) c.done = Math.max(G.day + 1, c.done - d); return c ? `${G.D.buildings[c.type].n} (${T[c.t].n}) буде готова на ${d} дн. раніше` : 'обʼєкт уже здали'; } }),
      O('rebuild', 'Відбудова зруйнованого регіону', 3, 10, 30, { tg: 'dmg', d: 'менше руйнувань, популярність', fx: (L, s, t, n) => { ter[t].dmg = Math.max(0, ter[t].dmg - 0.03 * (0.5 + s)); pop(L, n.id, 2); return `${T[t].n}: руйнування зменшено, популярність +2`; } })],
    farmer: [O('harvest', 'Жнива в регіоні', 2, 7, 60, { d: 'більше зерна в країні на 4 місяці', fx: (L, s, t, n) => { n.mods.push({ r: 'grain', mul: 1 + 0.025 * (0.5 + s), until: G.day + 120 }); pop(L, n.id, 1); return `урожай зібрано: зерно країни +${(2.5 * (0.5 + s)).toFixed(1)}% на 4 міс.`; } }),
      O('agroexp', 'Агроекспорт: переговори за кордоном', 4, 6, 60, { tg: 'abroad', tr: 'round', v: '✈', d: 'гроші, відносини країн', fx: (L, s, t, n) => { const m = $(4000) * s; L.money += m; rel(home(L), n.id, 2); return `контракт на постачання зерна в ${n.name}: ${f$(m)}, відносини +2`; } })],
    police: [O('raid', 'Операція проти контрабанди', 2, 4, 20, { risk: 0.12, d: 'стабільність країни, премія; ризик', fx: (L, s, t, n) => { n.stab = clamp(n.stab + 0.5 * s, 0, 100); const m = $(800) * s; L.money += m; return `канал контрабанди перекрито: стабільність +${(0.5 * s).toFixed(1)}, премія ${f$(m)}`; } }),
      O('corr', 'Розслідування корупції у владі', 3, 12, 60, { d: 'стабільність, популярність; звʼязки з урядом падають', fx: (L, s, t, n) => { n.stab = clamp(n.stab + 1.2 * s, 0, 100); pop(L, n.id, 4 * s); L.cont[n.id] = Math.max(0, (L.cont[n.id] || 0) - 3); return s > 0.5 ? 'справу передано до суду — чиновник під вартою!' : 'докази слабкі, але схему зруйновано'; } }),
      O('interpol', 'Спільна операція з Інтерполом', 4, 7, 60, { tg: 'abroad', tr: 'round', v: '✈', d: 'відносини з країною, слава', fx: (L, s, t, n) => { rel(home(L), n.id, 2); L.fame += 1.5; return `спільна операція з ${n.name}: банду затримано`; } })],
    lawyer: [O('bigcase', 'Резонансна справа', 2, 6, 25, { d: 'великий гонорар, популярність', fx: (L, s, t, n) => { const win = R() < 0.25 + s * 0.6; const m = $(1500 + L.job.lvl * 800) * (win ? 2 : 0.5); L.money += m; pop(L, n.id, win ? 3 : -1); return win ? `перемога в суді! Гонорар ${f$(m)}` : `справу програно, гонорар ${f$(m)}`; } }),
      O('arbit', 'Міжнародний арбітраж', 3, 9, 60, { tg: 'abroad', tr: 'round', v: '✈', d: 'гонорар, слава', fx: (L, s, t, n) => { const m = $(9000) * (0.3 + s); L.money += m; L.fame += 1.5; return `арбітраж у ${n.name}: ${f$(m)}`; } }),
      O('const', 'Конституційне рішення', 5, 5, 90, { d: 'стабільність країни', fx: (L, s, t, n) => { n.stab = clamp(n.stab + 1.5 * (0.5 + s), 0, 100); pop(L, n.id, 2); return 'рішення суду зупинило політичну кризу: стабільність зросла'; } })],
    doctor: [O('field', 'Польовий шпиталь біля фронту', 2, 10, 30, { tg: 'front', tr: 'round', v: '🚑', spd: 500, risk: 0.18, d: 'поранені повертаються в стрій, популярність', fx: (L, s, t, n) => { let back = 0; G.armies.filter(a => a.n === home(L) && a.t === t).forEach(a => { const b = a.k * 0.004 * (0.5 + s); a.k += b; back += b; a.org = Math.min(1, a.org + 0.05); }); pop(L, home(L), 3); return `урятовано життів: у стрій повернулося ≈${Math.round(back * 1000)} бійців`; } }),
      O('mission', 'Медична місія за кордоном', 3, 8, 60, { tg: 'abroad', tr: 'go', v: '✈', d: 'відносини, слава', fx: (L, s, t, n) => { rel(home(L), n.id, 3); L.fame += 2; pop(L, n.id, 3); return `місія в ${n.name}: тисячі прийнятих пацієнтів, відносини +3`; } }),
      O('epid', 'Зупинити спалах епідемії', 4, 9, 90, { d: 'стабільність, популярність', fx: (L, s, t, n) => { n.stab = clamp(n.stab + s, 0, 100); pop(L, n.id, 3); return 'спалах локалізовано'; } })],
    teacher: [O('olymp', 'Підготувати учнів до олімпіади', 2, 6, 40, { d: 'слава, трохи науки країни', fx: (L, s, t, n) => { L.fame += s; if (G.resBoost) G.resBoost(n, 0.004 * s); return s > 0.6 ? 'ваші учні взяли золото!' : 'учні в призерах'; } }),
      O('exch', 'Міжнародний обмін студентами', 3, 6, 60, { tg: 'abroad', tr: 'round', v: '✈', d: 'відносини країн', fx: (L, s, t, n) => { rel(home(L), n.id, 2); return `програму обміну з ${n.name} підписано`; } }),
      O('reform', 'Освітня реформа', 4, 14, 120, { d: 'наука країни, популярність', fx: (L, s, t, n) => { if (G.resBoost) G.resBoost(n, 0.03 * (0.5 + s)); pop(L, n.id, 2); return 'реформа запрацювала: дослідження країни прискорились'; } })],
    programmer: [O('hack', 'Хакатон / власний продукт', 2, 5, 30, { d: 'шанс на великі гроші', fx: (L, s) => { const big = R() < 0.1 + s * 0.2; const m = $(big ? 25000 : 1200) * (0.5 + s); L.money += m; if (big) L.fame += 2; return big ? `продукт вистрілив! ${f$(m)}` : `хакатон: призові ${f$(m)}`; } }),
      O('cyber', 'Кіберзахист державних систем', 3, 7, 45, { d: 'стабільність, наука країни', fx: (L, s, t, n) => { n.stab = clamp(n.stab + 0.4 * s, 0, 100); if (G.resBoost) G.resBoost(n, 0.006 * s); return 'атаку відбито: держреєстри працюють'; } }),
      O('egov', 'Цифровізація держпослуг', 4, 14, 120, { d: 'зростання економіки', fx: (L, s, t, n) => { n.mods.push({ growth: 0.0005 * (0.5 + s), until: G.day + 180 }); pop(L, n.id, 2); return 'державні послуги в смартфоні: економіка зростатиме швидше'; } })],
    journalist: [O('warrep', 'Репортаж з фронту', 2, 0, 25, { tg: 'front', tr: 'round', v: '🚙', spd: 500, risk: 0.2, d: 'слава, популярність; небезпечно', fx: (L, s, t, n) => { L.fame += 2; pop(L, home(L), 3); return `репортаж з ${T[t].n} подивилися мільйони`; } }),
      O('invest', 'Журналістське розслідування', 3, 10, 45, { tg: 'nation', d: 'дестабілізує владу країни-цілі, популярність', fx: (L, s, t, n) => { n.stab = clamp(n.stab - 1.5 * s, 0, 100); pop(L, home(L), 3 * s); L.fame += s; return `розслідування про владу ${n.name}: стабільність там −${(1.5 * s).toFixed(1)}`; } }),
      O('intv', 'Інтервʼю з лідером іншої країни', 4, 4, 60, { tg: 'abroad', tr: 'round', v: '✈', d: 'слава, відносини', fx: (L, s, t, n) => { L.fame += 3; rel(home(L), n.id, 1); return `ексклюзивне інтервʼю з лідером ${n.name}`; } })],
    banker: [O('loan', 'Кредит великій компанії', 2, 4, 20, { d: 'бонус від угоди, звʼязки', fx: (L, s, t, n) => { const m = $(1000 * L.job.lvl) * (0.5 + s); L.money += m; L.cont[n.id] = clamp((L.cont[n.id] || 0) + 1, 0, 100); return `угоду закрито: бонус ${f$(m)}`; } }),
      O('bonds', 'Розміщення державних облігацій', 4, 7, 90, { d: 'гроші в бюджет країни (у борг)', fx: (L, s, t, n) => { const v = (n.agg ? n.agg.gdp : 100) * 0.002 * (0.5 + s); n.cash += v; n.debt = (n.debt || 0) + v; const m = $(8000) * s; L.money += m; return `облігації продано: бюджет +${f$(v)}, ваша премія ${f$(m)}`; } }),
      O('fx', 'Валютні інтервенції', 5, 5, 90, { d: 'стабільність країни', fx: (L, s, t, n) => { n.stab = clamp(n.stab + 0.8 * s, 0, 100); return 'курс стабілізовано'; } })],
    diplomat: [O('visit', 'Дипломатична місія', 2, 6, 25, { tg: 'abroad', tr: 'go', v: '✈', d: 'відносини з країною', fx: (L, s, t, n) => { const v = 4 * (0.5 + s); rel(home(L), n.id, v); return `переговори в ${n.name}: відносини +${v.toFixed(1)}`; } }),
      O('trade', 'Підготувати торговельну угоду', 3, 12, 60, { tg: 'abroad', tr: 'go', v: '✈', d: 'відносини й зростання економіки', fx: (L, s, t, n) => { rel(home(L), n.id, 5 * s); N[home(L)].mods.push({ growth: 0.0003 * s, until: G.day + 365 }); return `угоду з ${n.name} парафовано: торгівля зростатиме рік`; } }),
      O('peace', 'Таємні мирні переговори', 5, 15, 120, { tg: 'enemy', tr: 'go', v: '✈', d: 'покращення відносин з ворогом', fx: (L, s, t, n) => { rel(home(L), n.id, 6 * s); L.fame += 3; return `канал переговорів з ${n.name} відкрито: відносини +${(6 * s).toFixed(1)}`; } })],
    scientist: [O('grant', 'Науковий грант', 2, 10, 40, { d: 'дослідження країни, гроші', fx: (L, s, t, n) => { if (G.resBoost) G.resBoost(n, 0.01 * (0.5 + s)); const m = $(1500) * s; L.money += m; return `результати опубліковано: дослідження країни прискорились, ${f$(m)}`; } }),
      O('conf', 'Міжнародна конференція', 3, 5, 45, { tg: 'abroad', tr: 'round', v: '✈', d: 'слава, відносини', fx: (L, s, t, n) => { L.fame += 1 + s; rel(home(L), n.id, 1); return `доповідь у ${n.name} зібрала повну залу`; } }),
      O('break', 'Проривне дослідження', 4, 30, 180, { d: 'великий поштовх науці країни', xp: 3, fx: (L, s, t, n) => { if (G.resBoost) G.resBoost(n, 0.06 * s); L.fame += 2 + s * 4; return s > 0.7 ? 'ПРОРИВ! Про вас пишуть світові журнали' : 'цікаві результати, але не революція'; } })],
    actor: [O('frontc', 'Концерт для військових', 2, 0, 30, { tg: 'front', tr: 'round', v: '🚐', spd: 500, risk: 0.1, d: 'моральний дух армії, популярність', fx: (L, s, t, n) => { G.armies.filter(a => a.n === home(L) && a.t === t).forEach(a => { a.org = Math.min(1, a.org + 0.06); }); pop(L, home(L), 4); return `концерт у ${T[t].n}: бійці співали разом з вами`; } }),
      O('tour', 'Гастролі за кордоном', 3, 8, 60, { tg: 'abroad', tr: 'go', v: '✈', d: 'популярність у країні, гроші', fx: (L, s, t, n) => { pop(L, n.id, 4 + s * 3); const m = $(5000) * (0.4 + s); L.money += m; L.fame += 1; return `аншлаги в ${n.name}: ${f$(m)}`; } }),
      O('film', 'Зйомки фільму', 4, 25, 180, { d: 'велика слава або провал', fx: (L, s) => { const hit = R() < 0.2 + s * 0.4; const m = $(hit ? 60000 : 8000); L.money += m; L.fame += hit ? 6 : 1; return hit ? `фільм став хітом! ${f$(m)}` : `фільм пройшов непомітно, гонорар ${f$(m)}`; } })],
    athlete: [O('charity', 'Благодійний матч', 1, 1, 14, { d: 'популярність', fx: (L, s, t, n) => { pop(L, n.id, 2); return 'зібрано на благодійність, вболівальники в захваті'; } }),
      O('tourn', 'Міжнародний турнір', 2, 7, 45, { tg: 'abroad', tr: 'round', v: '✈', d: 'призові, слава', fx: (L, s, t, n) => { const place = s > 0.8 ? 1 : s > 0.55 ? 2 : s > 0.35 ? 3 : 0; const m = $([500, 20000, 8000, 3000][place]); L.money += m; L.fame += place ? 4 - place : 0; pop(L, home(L), place ? 3 : 0); return place ? `${place} місце в ${n.name}! Призові ${f$(m)}` : `вибули в чвертьфіналі (${n.name})`; } }),
      O('champ', 'Чемпіонат світу', 4, 14, 365, { tg: 'abroad', tr: 'round', v: '✈', d: 'медаль — гордість країни', xp: 3, fx: (L, s, t, n) => { const gold = s > 0.75; if (gold) { N[home(L)].stab = clamp(N[home(L)].stab + 1, 0, 100); L.fame += 8; pop(L, home(L), 8); } else L.fame += 2; return gold ? '🥇 ЗОЛОТО! Країна святкує' : 'гідний виступ, але без золота'; } })]
  };
  const SK = j => G.JOBS[j] ? G.JOBS[j].sk : null;
  // цілі
  G.opTargets = function (L, op) { const nid = home(L), from = L.at; let out = [];
    if (op.tg === 'abroad' || op.tg === 'enemy') out = N.filter(n => n.alive && n.id !== nid && capOf(n.id) >= 0 && (op.tg === 'enemy' ? G.atWar(nid, n.id) : !G.atWar(nid, n.id) && G.rel[nid][n.id] > -40)).map(n => capOf(n.id)).filter(i => km(from, i) < (op.max || 12000));
    else if (op.tg === 'nation') out = N.filter(n => n.alive && capOf(n.id) >= 0).map(n => capOf(n.id));
    else if (op.tg === 'front') out = ter.filter(t => t.ctrl === nid && T[t.i].nb.some(j => G.atWar(nid, ter[j].ctrl))).map(t => t.i);
    else if (op.tg === 'dmg') out = ter.filter(t => t.ctrl === nid && t.dmg > 0.04).sort((a, b) => b.dmg - a.dmg).map(t => t.i);
    else if (op.tg === 'build') out = [...new Set(G.constructions.filter(c => c.n === nid && c.done - G.day > 5).map(c => c.id))];
    else if (op.tg === 'city') out = ter.filter(t => (t.ctrl === nid || (G.T[t.i] && N[t.ctrl] && !G.atWar(nid, t.ctrl) && G.rel[nid][t.ctrl] > 0)) && t.i !== from && km(from, t.i) > 250 && km(from, t.i) < 2200 && t.gdp > 15).sort((a, b) => b.gdp - a.gdp).map(t => t.i);
    if (op.tg !== 'build') out.sort((a, b) => (op.tg === 'city' || op.tg === 'front' ? 0 : km(from, a) - km(from, b))); return out.slice(0, 24); };
  G.opFind = (L, id) => { const list = L && L.job ? G.JOB_OPS[L.job.k] || [] : []; return list.find(o => o.id === id) || null; };
  G.opErr = function (L, id, t) {
    if (!L || L.role !== 'char' || !L.job) return 'Спершу влаштуйтеся на роботу'; const op = G.opFind(L, id); if (!op) return 'Немає такої справи';
    if (L.op) return 'Ви вже зайняті справою'; if (L.front != null) return 'Ви на фронті'; if (L.mv) return 'Ви в дорозі';
    if (L.job.lvl < op.lvl) return `З посади «${G.JOBS[L.job.k].ranks[op.lvl - 1][0]}»`;
    const cd = L.opCd && L.opCd[L.job.k + ':' + id]; if (cd > G.day) return `Наступна така справа — через ${cd - G.day} дн.`;
    if ((L.hp || 80) < 30) return 'Замало здоровʼя';
    if (op.tg === 'front' && !G.enemiesOf(home(L)).length) return 'Країна не воює';
    if (op.tg === 'enemy' && !G.enemiesOf(home(L)).length) return 'Немає з ким миритися';
    if (op.tg !== 'home') { const ts = G.opTargets(L, op); if (!ts.length) return 'Немає доступних цілей'; if (t != null && !ts.includes(+t)) return 'Ціль недоступна'; }
    return '';
  };
  G.opDays = (L, op, t) => { if (op.days) return op.days; const k = km(L.at, t); return Math.max(1, Math.ceil(k * (op.tr === 'round' ? 2 : 1) / (op.spd || 600))) + 1; };
  G.opStart = function (id, t) {
    const L = G.leader; const op = G.opFind(L, id); if (op && op.tg !== 'home' && t == null) t = G.opTargets(L, op)[0]; const e = G.opErr(L, id, t); if (e) return { ok: false, err: e };
    let cid = null; if (op.tg === 'build') { cid = +t; const c = G.constructions.find(x => x.id === cid); t = c ? c.t : L.at; }
    if (op.tg === 'home') t = L.at; t = +t; const days = op.tg === 'build' ? op.days : G.opDays(L, op, t);
    L.op = { job: L.job.k, id, t, from: L.at, d0: G.day, end: G.day + days, km: km(L.at, t), cid, tr: op.tr || '', v: op.v || '' };
    G.say(`🗂 ${L.name}: ${op.n}${op.tg !== 'home' ? ' — ' + T[t].n : ''} (${days} дн.)`, 'info', [home(L)]);
    return { ok: true, msg: `справу розпочато: ${op.n} — ${days} дн.${op.tr ? ' Стежте за поїздкою на мапі' : ''}` };
  };
  G.act.opStart = (id, t) => G.opStart(id, t);
  // позиція в поїздці (для мапи): [lon, lat] або null
  G.opPos = function (L, frac) { const o = L && L.op; if (!o || !o.tr) return null; let p = (G.day - o.d0 + (frac || 0)) / Math.max(1, o.end - o.d0);
    if (o.tr === 'round') p = p < 0.5 ? p * 2 : 2 - p * 2; else p = Math.min(1, p * 4); const A = T[o.from].c, B = T[o.t].c; let bx = B[0]; if (bx - A[0] > 180) bx -= 360; else if (A[0] - bx > 180) bx += 360; p = clamp(p, 0, 1); return [A[0] + (bx - A[0]) * p, A[1] + (B[1] - A[1]) * p]; };
  function finish(L) { const o = L.op; const op = (G.JOB_OPS[o.job] || []).find(x => x.id === o.id); L.op = null; if (!op || !L.job) return; const n = N[op.tg === 'home' || op.tg === 'build' || op.tg === 'dmg' ? home(L) : ter[o.t].ctrl] || N[home(L)];
    const s = clamp(0.3 + sk(L, SK(o.job)) * 0.09 + (L.mood || 60) / 500 + R() * 0.35, 0, 1);
    const txt = op.fx(L, s, o.t, n, o); const gx = (op.xp || 1) * (0.6 + s) * (0.8 + op.lvl * 0.15); L.job.xp += gx; (L.opCd = L.opCd || {})[o.job + ':' + o.id] = G.day + op.cd; L.opsDone = (L.opsDone || 0) + 1;
    L.at = o.tr === 'go' ? o.t : o.from; L.mood = clamp((L.mood || 60) + (s > 0.5 ? 4 : -3), 0, 100);
    G.say(`${s > 0.5 ? '✅' : '⚠'} ${L.name} — ${op.n}: ${txt}. Досвід +${gx.toFixed(1)}${G.jobPromo ? G.jobPromo(L, true) : ''}`, s > 0.5 ? 'good' : 'info', [home(L)]); }
  function daily() { Object.values(G.leaders).forEach(L => { if (!L || !L.op) return; const o = L.op; const op = (G.JOB_OPS[o.job] || []).find(x => x.id === o.id);
    if (!L.job || L.job.k !== o.job || !op) { L.op = null; return; }
    if (L.job.ddD !== G.day) { L.job.dd = (L.job.dd || 0) + 1; L.job.ddD = G.day; }
    L.hp = clamp((L.hp || 80) - 0.15, 0, 100);
    if (op.risk && R() < op.risk / Math.max(1, o.end - o.d0)) { const w = 8 + Math.floor(R() * 15); L.hp = clamp((L.hp || 80) - w, 0, 100); G.say(`💥 ${L.name} потрапив під обстріл (${T[o.t].n}): здоровʼя −${w}`, 'bad', [home(L)]); }
    if (G.day >= o.end) finish(L); }); }
  G.h29.d.push(daily);
  { const b = G.locCan; G.locCan = function (loc, k, a) { const L = G.leader; if (L && L.op) return `Ви зайняті: ${(G.opFind(L, L.op.id) || {}).n || 'справа'} (ще ${L.op.end - G.day} дн.)`; return b(loc, k, a); }; }
  { const b = G.leaderGo; G.leaderGo = function (to) { const L = G.leader; if (L && L.op) return { ok: false, err: 'Спершу завершіть справу' }; return b(to); }; }
  { const b = G.frontErr; if (b) G.frontErr = L => L && L.op ? 'Ви зайняті іншою справою' : b(L); }
  // нові будівлі — для підсвітки на мапі
  { const b = G.addLevel; G.addLevel = function (i, type, d) { const r = b(i, type, d); if (d > 0 && G.day > 0 && G.v29s) { const NB = G.v29s('newb', {}); NB[i + ':' + type] = G.day; if (G.day % 50 === 0) for (const k in NB) if (NB[k] < G.day - 60) delete NB[k]; } return r; }; }
  // військовим: ще й штабні справи (крім фронту)
  G.JOB_OPS.military = [O('exer', 'Командно-штабні навчання', 2, 7, 45, { d: 'організованість армії країни', fx: (L, s, t, n) => { G.armies.filter(a => a.n === n.id).forEach(a => { a.org = Math.min(1, a.org + 0.03 * s); }); return 'навчання пройшли успішно: організованість військ зросла'; } }),
    O('allyex', 'Спільні навчання з союзником', 3, 10, 90, { tg: 'abroad', tr: 'round', v: '✈', d: 'відносини з країною', fx: (L, s, t, n) => { rel(home(L), n.id, 3 * (0.5 + s)); return `навчання з ${n.name}: відносини зросли`; } })];
});
