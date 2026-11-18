// КОМАНДА: директори компанії гравця й особисті помічники персонажа (а також президента/CEO) — як міністри в держави.
// Кожен має компетентність, лояльність, рису, зарплату, власні дії з перезарядкою та галочку «Авто» (ШІ виконує дії сам).
LORA.sim.register('staff', 99.85, function (G) {
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const FN = ['Андрій', 'Ірина', 'Максим', 'Оксана', 'Тарас', 'Вікторія', 'Денис', 'Юлія', 'Артем', 'Олена', 'Сергій', 'Марта', 'Ярослав', 'Леся', 'Роман', 'Христина', 'Богдана', 'Назар', 'Софія', 'Ілля'];
  const FEM = new Set(['Ірина', 'Оксана', 'Вікторія', 'Юлія', 'Олена', 'Марта', 'Леся', 'Христина', 'Богдана', 'Софія']);
  const LN = ['Гончаренко', 'Литвин', 'Клименко', 'Петренко', 'Зайченко', 'Рибак', 'Олійник', 'Стасюк', 'Бойко', 'Кушнір', 'Тимошенко', 'Вовк', 'Сидоренко', 'Павлюк', 'Дячук', 'Мороз'];
  const TR = { star: ['Зірка', 'ефект дій +30%, зарплата +50%'], loyal: ['Відданий', 'лояльність майже не падає'], cheap: ['Економний', 'дії дешевші на 30%'], lazy: ['Лінивий', 'ефект −25%, але й зарплата нижча'], shark: ['Акула', 'ефект +20%, лояльність падає швидше'], fun: ['Душа компанії', 'лояльність усієї команди +']};
  G.STAFF_TR = TR;
  G.STAFF = {
    co: {
      cfo: { n: 'Фінансовий директор (CFO)', ic: '💰', area: 'гроші, борги, податки', tab: 'cofin' },
      coo: { n: 'Операційний директор (COO)', ic: '⚙', area: 'активи, виробництво, постачання', tab: 'coprod' },
      cmo: { n: 'Комерційний директор', ic: '📣', area: 'продажі, реклама, репутація', tab: 'cotrade' },
      cto: { n: 'Технічний директор (CTO)', ic: '🔬', area: 'R&D, інженери, патенти', tab: 'cord' },
      gr:  { n: 'Директор з GR', ic: '🏛', area: 'відносини з урядами, лобізм, держгранти', tab: 'codipl' },
      sec: { n: 'Секретар-референт', ic: '📇', area: 'розклад, пошта, атмосфера в офісі', tab: 'co' }
    },
    ch: {
      sec:   { n: 'Особистий секретар', ic: '📇', area: 'розклад, пошта, зустрічі', tab: 'char' },
      pr:    { n: 'PR-менеджер', ic: '📺', area: 'інтервʼю, соцмережі, репутація', tab: 'char' },
      coach: { n: 'Коуч і репетитор', ic: '🎓', area: 'навички, курси', tab: 'skills' },
      fin:   { n: 'Фінансовий радник', ic: '📈', area: 'інвестиції, податки, кеш', tab: 'life' },
      law:   { n: 'Особистий адвокат', ic: '⚖', area: 'контракти, скандали, захист', tab: 'career' },
      agent: { n: 'Агент-імпресаріо', ic: '🎟', area: 'гонорари, турне, слава', tab: 'career' }
    }
  };
  const newStaff = (k, seed) => { const f = pick(FN); return { k, name: f + ' ' + pick(LN), ava: (seed || '') + f + G.rnd(), fem: FEM.has(f), comp: Math.round(35 + G.rnd() * 55), loyal: Math.round(55 + G.rnd() * 35), trait: pick(Object.keys(TR)), auto: false, cd: {}, hired: false }; };
  const eff = s => (0.6 + s.comp / 100 * 0.8) * (s.trait === 'star' ? 1.3 : s.trait === 'lazy' ? 0.75 : s.trait === 'shark' ? 1.2 : 1);
  const salary = (s, kind) => (kind === 'co' ? 0.0004 + s.comp * 0.00002 : 0.00008 + s.comp * 0.000004) * (s.trait === 'star' ? 1.5 : s.trait === 'lazy' ? 0.7 : 1);
  G.staffSalary = salary;
  // власник «команди»: компанія гравця або персонаж (персонаж, президент, CEO)
  const owner = kind => kind === 'co' ? (G.pc >= 0 && G.companies[G.pc] ? G.companies[G.pc] : null) : (G.leader && G.leader.money != null ? G.leader : null);
  const purse = (kind, o) => kind === 'co' ? { get: () => o.cash, add: v => { o.cash += v; } } : { get: () => o.money, add: v => { o.money += v; } };
  G.staffOf = function (kind, k, o) { o = o || owner(kind); if (!o) return null; o.staff = o.staff || {}; if (!o.staff[k]) { o.staff[k] = newStaff(k, (o.name || '') + k); if (kind === 'co') o.staff[k].hired = true; } return o.staff[k]; };
  const L0 = () => G.leader;
  // дії: [id, назва, іконка, вартість (функція), перезарядка днів, опис, дія(o, s, e) → повідомлення]
  G.STAFF_ACT = {
    co: {
      cfo: [['refi', 'Рефінансування боргу', '🏦', c => 0, 120, 'борг компанії −10%', (c, s, e) => { const d = (c.debt || 0) * 0.1 * e; c.debt = Math.max(0, (c.debt || 0) - d); return d > 0 ? `борг −${(d * 1000).toFixed(0)} млн` : 'боргів немає — CFO нудьгує'; }],
        ['taxplan', 'Податкове планування', '🧾', c => 0.003, 180, 'повернути частину податків за рік', (c, s, e) => { const v = Math.max(0.005, (c.taxY || 0) * 0.08 * e); c.cash += v; return `повернуто $${(v * 1000).toFixed(0)} млн`; }],
        ['cut', 'Оптимізація витрат', '✂', c => 0, 150, 'кеш +, репутація −1', (c, s, e) => { const v = (0.01 + c.assets.reduce((q, a) => q + a.lvl, 0) * 0.004) * e; c.cash += v; c.rep = clamp((c.rep || 50) - 1, 0, 100); return `зекономлено $${(v * 1000).toFixed(0)} млн (кавомашину продали)`; }]],
      coo: [['maint', 'Планове ТО активів', '🔧', c => 0.01 + c.assets.length * 0.002, 180, 'прибуток активів +8% на пів року', (c, s, e) => { c.stfBoost = { k: 0.08 * e, until: G.day + 180 }; return 'усе змащено й працює'; }],
        ['lean', 'Ощадливе виробництво', '📉', c => 0.005, 150, 'очки R&D + і прибуток +3% на 3 міс.', (c, s, e) => { if (c.rd) c.rd.pts += 40 * e; c.stfBoost = { k: Math.max(0.03 * e, (c.stfBoost && c.stfBoost.until > G.day ? c.stfBoost.k : 0)), until: G.day + 90 }; return 'зайві наради скасовано'; }],
        ['supply', 'Аудит постачань', '📦', c => 0.004, 120, 'менше нестач сировини', (c, s, e) => { c.lack = 0; c.rep = clamp((c.rep || 50) + 1, 0, 100); return 'склади перераховано, знайшли три загублені вагони'; }]],
      cmo: [['ads', 'Рекламна кампанія', '📺', c => 0.02, 90, 'репутація +4', (c, s, e) => { c.rep = clamp((c.rep || 50) + 4 * e, 0, 100); return 'ролик став мемом'; }],
        ['expo', 'Міжнародна виставка', '🎪', c => 0.015, 150, 'вплив +2 у країнах ваших офісів', (c, s, e) => { c.offices.forEach(o => { c.infl[o.n] = clamp((c.infl[o.n] || 0) + 2 * e, 0, 100); }); return 'стенд з безкоштовними пончиками зібрав натовп'; }],
        ['promo', 'Розпродаж і знижки', '🏷', c => 0, 120, 'прибуток +5% на 3 міс., репутація +1', (c, s, e) => { c.stfBoost = { k: 0.05 * e, until: G.day + 90 }; c.rep = clamp((c.rep || 50) + 1, 0, 100); return 'черги біля магазинів'; }]],
      cto: [['hack', 'Корпоративний хакатон', '💻', c => 0.006, 90, 'очки R&D +', (c, s, e) => { if (c.rd) c.rd.pts += 90 * e; return 'піца зʼїдена, прототип працює (майже)'; }],
        ['hunt', 'Хантинг інженерів', '🎯', c => 0.02, 180, 'очки R&D + щомісяця пів року', (c, s, e) => { c.rdBoost = { k: 30 * e, until: G.day + 180 }; return 'інженерів переманили печивом'; }],
        ['patent', 'Патентний пакет', '📜', c => 0.004, 240, 'дохід від ліцензій', (c, s, e) => { const nd = c.rd ? Object.keys(c.rd.done).length : 0; const v = (0.005 + nd * 0.004) * e; c.cash += v; return `ліцензії: $${(v * 1000).toFixed(0)} млн`; }]],
      gr: [['lobby', 'Лобістський обід', '🍷', c => 0.01, 90, 'вплив у домашній країні +3', (c, s, e) => { c.infl[c.home] = clamp((c.infl[c.home] || 0) + 3 * e, 0, 100); return 'обід затягнувся до ночі'; }],
        ['grant', 'Державний грант', '🏛', c => 0, 240, 'грошова підтримка від держави, вплив −1', (c, s, e) => { const n = N[c.home]; const v = Math.min(0.2, (n && n.agg ? n.agg.gdp : 50) * 0.00006 * e); if (n) n.cash -= v; c.cash += v; c.infl[c.home] = clamp((c.infl[c.home] || 0) - 1, 0, 100); return `грант $${(v * 1000).toFixed(0)} млн`; }],
        ['abroad', 'Візит до іноземного уряду', '✈', c => 0.012, 150, 'вплив +3 у найбільшій країні з офісом', (c, s, e) => { const o = c.offices.map(o => o.n).filter(x => x !== c.home).sort((a, b) => (N[b].agg ? N[b].agg.gdp : 0) - (N[a].agg ? N[a].agg.gdp : 0))[0]; const t = o != null ? o : c.home; c.infl[t] = clamp((c.infl[t] || 0) + 3 * e, 0, 100); return `вплив у ${N[t].name} +3`; }]],
      sec: [['plan', 'Оптимізувати розклад', '🗓', c => 0, 90, 'перезарядка інших директорів −20 днів', (c, s, e) => { Object.values(c.staff || {}).forEach(x => { if (x !== s) for (const a in x.cd) x.cd[a] -= Math.round(20 * e); }); return 'календар перефарбовано в зелений'; }],
        ['coffee', 'Кава для всієї команди', '☕', c => 0.001, 60, 'лояльність усіх +5', (c, s, e) => { Object.values(c.staff || {}).forEach(x => { x.loyal = clamp(x.loyal + 5, 0, 100); }); return 'офіс пахне надією'; }],
        ['party', 'Корпоратив', '🎉', c => 0.008, 240, 'лояльність усіх +10, репутація +1', (c, s, e) => { Object.values(c.staff || {}).forEach(x => { x.loyal = clamp(x.loyal + 10, 0, 100); }); c.rep = clamp((c.rep || 50) + 1, 0, 100); return 'CFO танцював на столі. Є відео'; }]]
    },
    ch: {
      sec: [['meet', 'Розклад зустрічей', '🗓', L => 0, 60, 'звʼязки в домашній країні +4', (L, s, e) => { const k = L.home; L.cont[k] = clamp((L.cont[k] || 0) + 4 * e, 0, 100); return 'зустрічі розписано до хвилини'; }],
        ['mail', 'Розібрати пошту', '📬', L => 0, 45, 'зайнятість −5 днів', (L, s, e) => { L.busy = Math.max(G.day, (L.busy || 0) - Math.round(5 * e)); return '3 000 листів, з них 2 990 — спам'; }]],
      pr: [['interview', 'Інтервʼю в прайм-тайм', '🎙', L => 0.002, 60, 'популярність +4, слава +1', (L, s, e) => { const k = L.home; L.popu[k] = clamp((L.popu[k] || 0) + 4 * e, 0, 100); L.fame = clamp((L.fame || 0) + 1, 0, 100); return 'ведучий сміявся з ваших жартів'; }],
        ['viral', 'Вірусний пост', '📱', L => 0, 45, 'популярність +0…8 (як пощастить)', (L, s, e) => { const v = Math.round(G.rnd() * 8 * e); L.popu[L.home] = clamp((L.popu[L.home] || 0) + v, 0, 100); return v > 4 ? `пост розлетівся: +${v}` : `лайкнула лише мама: +${v}`; }],
        ['clean', 'Чистка репутації', '🧽', L => 0.005, 120, 'популярність +2, звʼязки +2', (L, s, e) => { L.popu[L.home] = clamp((L.popu[L.home] || 0) + 2 * e, 0, 100); L.cont[L.home] = clamp((L.cont[L.home] || 0) + 2 * e, 0, 100); return 'старі фото з вечірок зникли з інтернету'; }]],
      coach: [['intensive', 'Інтенсив з найслабшої навички', '📚', L => 0.008, 150, 'досвід навички +', (L, s, e) => { if (!G.SKILLS) return '—'; L.sk = L.sk || {}; L.skx = L.skx || {}; const k = Object.keys(G.SKILLS).sort((a, b) => G.skill(L, a) - G.skill(L, b))[0]; L.skx[k] = (L.skx[k] || 0) + Math.round(9 * e); if (L.skx[k] >= 18 && G.skill(L, k) < 5) { L.skx[k] = 0; L.sk[k] = G.skill(L, k) + 1; return `${G.SKILLS[k].n}: рівень ${L.sk[k]}!`; } return `${G.SKILLS[k].n}: досвід +${Math.round(9 * e)}`; }],
        ['speech', 'Тренування промов', '🎤', L => 0.003, 90, 'популярність +2, досвід ораторства', (L, s, e) => { L.skx = L.skx || {}; L.skx.orat = (L.skx.orat || 0) + 4; L.popu[L.home] = clamp((L.popu[L.home] || 0) + 2 * e, 0, 100); return 'дзеркало в захваті'; }]],
      fin: [['rebalance', 'Перебалансувати портфель', '⚖', L => 0, 120, 'дохід від інвестицій', (L, s, e) => { const v = G.invValue ? G.invValue(L).tot : 0; const g = Math.max(0.001, v * 0.012 * e); L.money += g; return `+$${(g * 1000).toFixed(1)} млн`; }],
        ['tax', 'Податкова декларація', '🧾', L => 0, 365, 'податкове повернення', (L, s, e) => { const g = (0.001 + Math.max(0, L.money) * 0.006) * e; L.money += g; return `повернуто $${(g * 1000).toFixed(1)} млн`; }]],
      law: [['contract', 'Перевірка контрактів', '📑', L => 0, 120, 'знайдено вигідні пункти: гроші', (L, s, e) => { const g = (0.002 + (L.fame || 0) * 0.00003) * e; L.money += g; return `+$${(g * 1000).toFixed(1)} млн за неустойки`; }],
        ['shield', 'Захист від скандалів', '🛡', L => 0.004, 180, 'пів року скандали слабші', (L, s, e) => { L.lawShield = G.day + 180; return 'усі NDA підписано'; }]],
      agent: [['deal', 'Вигідна угода', '🤝', L => 0, 90, 'гонорар залежить від слави', (L, s, e) => { const g = (0.003 + (L.fame || 0) * 0.00012) * e; L.money += g; return `гонорар $${(g * 1000).toFixed(1)} млн`; }],
        ['tour', 'Турне країнами', '🌍', L => 0.006, 180, 'слава +2, звʼязки за кордоном', (L, s, e) => { L.fame = clamp((L.fame || 0) + 2 * e, 0, 100); N.filter(x => x.alive && x.id !== L.home && x.agg && x.agg.gdp > 300).slice(0, 4).forEach(x => { L.cont[x.id] = clamp((L.cont[x.id] || 0) + 3 * e, 0, 100); }); return 'аеропорти, готелі, автографи'; }]]
    }
  };
  const common = kind => [['bonus', 'Премія', '💵', o => kind === 'co' ? 0.004 : 0.0008, 90, 'лояльність +12', (o, s) => { s.loyal = clamp(s.loyal + 12, 0, 100); return 'дуже вдячні'; }],
    ['fire', 'Звільнити й найняти іншого', '🔄', o => 0, 120, 'новий випадковий кандидат', (o, s) => { const k = s.k; const nw = newStaff(k, (o.name || '') + k + G.day); nw.hired = s.hired; nw.auto = s.auto; o.staff[k] = nw; return `новий: ${nw.name}`; }]];
  G.staffActions = (kind, k) => ((G.STAFF_ACT[kind] || {})[k] || []).concat(common(kind));
  G.staffCan = function (kind, k, a) {
    const o = owner(kind); if (!o) return 'Немає'; const s = G.staffOf(kind, k, o); if (!s.hired && a !== 'hire') return 'Спершу найміть';
    const A = G.staffActions(kind, k).find(x => x[0] === a); if (!A) return '?'; if ((s.cd[a] || 0) > G.day) return `Ще ${s.cd[a] - G.day} дн.`;
    if (kind === 'ch' && o.busy > G.day && a !== 'mail' && a !== 'fire' && a !== 'bonus') { /* помічники працюють і поки ви зайняті */ }
    const c = A[3](o) * (s.trait === 'cheap' ? 0.7 : 1); if (purse(kind, o).get() < c) return 'Бракує грошей'; return '';
  };
  G.staffDo = function (kind, k, a, quiet) {
    const o = owner(kind); if (!o) return { ok: false, err: 'Немає' }; if (kind === 'co' && G.corpInit) G.corpInit(o); const s = G.staffOf(kind, k, o);
    if (a === 'hire') { if (s.hired) return { ok: false, err: 'Уже в команді' }; const fee = salary(s, kind) * 2; if (purse(kind, o).get() < fee) return { ok: false, err: 'Бракує грошей' }; purse(kind, o).add(-fee); s.hired = true; return { ok: true, msg: `${s.name} у команді (зарплата $${(salary(s, kind) * 1e6).toFixed(0)} тис./міс)` }; }
    if (a === 'dismiss') { s.hired = false; s.auto = false; return { ok: true, msg: 'звільнено' }; }
    const e0 = G.staffCan(kind, k, a); if (e0) return { ok: false, err: e0 }; const A = G.staffActions(kind, k).find(x => x[0] === a);
    const c = A[3](o) * (s.trait === 'cheap' ? 0.7 : 1); purse(kind, o).add(-c); const cur = o.staff[k]; cur.cd[a] = G.day + A[4];
    const msg = A[6](o, cur, eff(cur)); if (!quiet) G.say(`${A[2]} ${cur.name}: ${A[1].toLowerCase()} — ${msg}`, 'good', [kind === 'co' ? o.home : o.home]);
    return { ok: true, msg };
  };
  G.act.staffDo = (kind, k, a) => G.staffDo(kind, k, a);
  G.act.staffAuto = (kind, k, v) => { const s = G.staffOf(kind, k); if (!s) return { ok: false }; if (!s.hired) return { ok: false, err: 'Спершу найміть' }; s.auto = !!v; return { ok: true }; };
  // бонуси директорів до прибутку й R&D
  { const b = G.assetProfit; if (b) G.assetProfit = function (c, a) { const p = b(c, a); return c && c.stfBoost && c.stfBoost.until > G.day && p > 0 ? p * (1 + c.stfBoost.k) : p; }; }
  G.staffMonthly = function () {
    ['co', 'ch'].forEach(kind => { const o = owner(kind); if (!o || !o.staff) return;
      Object.values(o.staff).forEach(s => { if (!s.hired) return; purse(kind, o).add(-salary(s, kind));
        s.loyal = clamp(s.loyal - (s.trait === 'loyal' ? 0.2 : s.trait === 'shark' ? 1.6 : 0.8) + (Object.values(o.staff).some(x => x.hired && x.trait === 'fun') ? 0.4 : 0), 0, 100);
        s.comp = clamp(s.comp + 0.15, 0, 100);
        if (s.loyal < 25 && G.rnd() < 0.12) { const v = kind === 'co' ? Math.min(o.cash * 0.02, 0.05) : Math.min(o.money * 0.03, 0.01); purse(kind, o).add(-Math.max(0, v)); if (o === L0() || kind === 'co') G.say(`🙈 ${s.name} ${s.fem ? 'зникла' : 'зник'} разом із $${(Math.max(0, v) * 1000).toFixed(1)} млн «на відрядження». Повернення не планується`, 'bad', [o.home]); o.staff[s.k] = newStaff(s.k, (o.name || '') + s.k + G.day); o.staff[s.k].hired = true; return; }
        if (s.auto && G.rnd() < 0.6) { const A = G.staffActions(kind, s.k).filter(x => x[0] !== 'fire' && x[0] !== 'bonus').find(x => !G.staffCan(kind, s.k, x[0])); if (A) G.staffDo(kind, s.k, A[0], true); if (s.loyal < 40 && !G.staffCan(kind, s.k, 'bonus')) G.staffDo(kind, s.k, 'bonus', true); }
      });
      if (kind === 'co' && o.rdBoost && o.rdBoost.until > G.day && o.rd) o.rd.pts += o.rdBoost.k;
    });
  };
});
