// v4.5: дослідження для малого бізнесу (5 гілок × 3 рівні), можливості компаній — замовлення/тендери, кредитна лінія,
// керуючий (автокерування), спонсорство, продаж частки інвестору (кредит — у «Фінансах», держтендери великих компаній — у «Тендерах»); інциденти малого бізнесу (страхування зменшує ризик).
LORA.sim.register('v45', 100.3, function (G) {
  const { ter, T, N } = G; const clamp = LORA.core.clamp; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });
  const S = () => G.v29s('v45', () => ({ seq: 1 }));
  const human = c => c && !c.ai;

  // ---------------- ДОСЛІДЖЕННЯ МАЛОГО БІЗНЕСУ ----------------
  // [ключ, гілка, назва, $ (у доларах), днів, ефекти, потрібне дослідження, мін. закладів]
  G.BRES_B = { prod: ['🍳', 'Продукт'], mkt: ['📣', 'Маркетинг'], ops: ['⚙', 'Процеси'], scale: ['📈', 'Масштаб'], safe: ['🛡', 'Надійність'] };
  G.BRES = [
    ['p1', 'prod', 'Стандарти якості', 30000, 20, { rev: 0.05 }],
    ['p2', 'prod', 'Власна технологія', 90000, 40, { rev: 0.08 }, 'p1'],
    ['p3', 'prod', 'Фірмовий продукт', 250000, 70, { rev: 0.12 }, 'p2', 2],
    ['m1', 'mkt', 'Аналітика клієнтів', 25000, 15, { ord: 0.15 }],
    ['m2', 'mkt', 'Соцмережі й інфлюенсери', 70000, 30, { rev: 0.05, ord: 0.15 }, 'm1'],
    ['m3', 'mkt', 'Національна реклама', 220000, 60, { rev: 0.1, ord: 0.1 }, 'm2', 3],
    ['o1', 'ops', 'Стандарти операцій', 30000, 20, { up: 0.1, open: 0.2 }],
    ['o2', 'ops', 'Автоматизація', 110000, 45, { up: 0.15, open: 0.2, rev: 0.03 }, 'o1'],
    ['o3', 'ops', 'Централізоване постачання', 260000, 70, { rev: 0.06, up: 0.1 }, 'o2', 3],
    ['s1', 'scale', 'Масштабована модель', 60000, 30, { lvl: 1 }],
    ['s2', 'scale', 'Регіональна мережа', 180000, 60, { lvl: 1, ord: 0.1 }, 's1', 3],
    ['s3', 'scale', 'Міжнародний формат', 400000, 90, { rev: 0.1, abroad: 1 }, 's2', 4],
    ['r1', 'safe', 'Страхування закладів', 20000, 10, { risk: 0.45 }],
    ['r2', 'safe', 'Юридичний супровід', 50000, 20, { risk: 0.25, fine: 0.5 }, 'r1'],
    ['r3', 'safe', 'Служба якості', 120000, 40, { risk: 0.2, rev: 0.03 }, 'r2']
  ];
  const RB = k => G.BRES.find(x => x[0] === k);
  G.bfx = (c, e) => { let v = 0; const t = c && c.btech; if (!t) return 0; for (const k in t) { const d = RB(k); if (d && d[5][e]) v += d[5][e]; } return v; };
  G.bresErr = function (c, k) { if (!c || !c.bizType) return 'Лише для малого бізнесу'; const d = RB(k); if (!d) return '?'; if ((c.btech || {})[k]) return 'Вже досліджено';
    if (c.blab) return `Лабораторія зайнята: «${(RB(c.blab.k) || [0, 0, '?'])[2]}»`; if (d[6] && !(c.btech || {})[d[6]]) return `Спершу «${RB(d[6])[2]}»`;
    if (d[7] && (c.bunits || []).length < d[7]) return `Потрібно закладів: ${d[7]}+`; if (c.cash < $(d[3])) return `Коштує ${f$($(d[3]))}`; return ''; };
  G.bresStart = function (k) { const c = G.myCo(); const e = G.bresErr(c, k); if (e) return no(e); const d = RB(k); c.cash -= $(d[3]); c.blab = { k, d0: G.day, done: G.day + d[4] }; return ok(`дослідження «${d[2]}»: ${d[4]} дн.`); };
  G.bresCancel = function () { const c = G.myCo(); if (!c || !c.blab) return no('Немає дослідження'); const d = RB(c.blab.k); c.cash += $(d[3]) * 0.5; c.blab = null; return ok('дослідження скасовано, повернуто 50%'); };
  G.h29.d.push(() => { G.companies.forEach(c => { if (!c.blab || G.day < c.blab.done) return; const d = RB(c.blab.k); (c.btech = c.btech || {})[c.blab.k] = 1; c.blab = null; if (human(c) && d) G.say(`🔬 «${c.name}»: досліджено «${d[2]}»`, 'good', [c.home]); }); });
  // ефекти: дохід (+спонсорство, −поганий відгук), макс. рівень, дешевше розширення, швидше відкриття
  { const b = G.bizDevMul; G.bizDevMul = c => b(c) + G.bfx(c, 'rev') + (c.spons && c.spons.until > G.day ? 0.04 : 0) - (c.badRev && c.badRev > G.day ? 0.12 : 0); }
  G.bunitMax = c => 5 + G.bfx(c, 'lvl');
  { const unitDef = (c, k) => (G.BIZT[c.bizType] || { units: [] }).units.find(u => u[0] === k);
    G.bunitUpCost = (c, u) => { const D = unitDef(c, u.k); return D ? $(D[3]) * u.lvl * 0.8 * (1 - Math.min(0.4, G.bfx(c, 'up'))) : 0; };
    G.bunitUp = function (i) { const c = G.myCo(); const u = c && c.bunits && c.bunits[i]; if (!u) return no('Немає закладу'); const D = unitDef(c, u.k); if (u.lvl >= G.bunitMax(c)) return no(`Максимальний рівень ${G.bunitMax(c)} (більше — дослідження «Масштаб»)`);
      if (u.open > G.day) return no('Ще відкривається'); const cost = G.bunitUpCost(c, u); if (c.cash < cost) return no(`Розширення: ${f$(cost)}`); c.cash -= cost; u.lvl++; u.open = G.day + Math.ceil(D[5] / 2 * (1 - Math.min(0.5, G.bfx(c, 'open')))); return ok(`${D[1]} розширюється до рівня ${u.lvl}`); };
    const bo = G.bunitOpen; G.bunitOpen = function (k, t) { const c = G.myCo(); let tmp = false;
      // «Міжнародний формат» — можна відкриватись у країнах без офісу (якщо не війна)
      if (c && G.bfx(c, 'abroad') && t != null && ter[t] && !G.coHasOffice(c, ter[t].ctrl) && ter[t].ctrl !== c.home && !G.atWar(c.home, ter[t].ctrl)) { c.offices.push({ n: ter[t].ctrl, t, tmp: 1 }); tmp = true; }
      const r = bo(k, t); if (tmp) c.offices = c.offices.filter(o => !o.tmp);
      if (r.ok && c) { const u = c.bunits[c.bunits.length - 1]; const f = Math.min(0.5, G.bfx(c, 'open')); if (u && f) u.open = G.day + Math.ceil((u.open - G.day) * (1 - f)); } return r; }; }

  // ---------------- МОЖЛИВОСТІ: ЗАМОВЛЕННЯ Й ТЕНДЕРИ ----------------
  G.ORD_T = [['corp', '🏢', 'Корпоративне замовлення', 0.6, 10], ['gov', '🏛', 'Державна закупівля', 1.3, 30, 'тендер'], ['fest', '🎪', 'Обслуговування фестивалю', 0.9, 7], ['chain', '🔗', 'Контракт із мережею', 1.7, 45, 'тендер'], ['rush', '⚡', 'Термінове замовлення', 0.45, 3], ['exp', '🌍', 'Експортна партія', 1.2, 25]];
  const coMonthly = c => c.bizType ? G.bizMonthly(c) : Math.max($(2e6), (c.profitY || 0) / 12);
  G.ordCap = c => c.bizType ? 1 + Math.floor((c.bunits || []).length / 3) : 2 + Math.floor((c.offices || []).length / 3);
  function genOrders(c) { const s = S(); const m = coMonthly(c); if (m <= 0) return; c.ords = (c.ords || []).filter(o => o.exp > G.day);
    const pool = c.bizType ? G.ORD_T : G.ORD_T.filter(t => !t[5] && t[0] !== 'fest');
    while (c.ords.length < 3) { const t = pool[Math.floor(R() * pool.length)]; if (t[0] === 'exp' && c.bizType && !G.bfx(c, 'abroad') && (c.offices || []).length < 2) continue;
      const pay = m * t[3] * (0.8 + R() * 0.5) * (1 + (c.bizType ? G.bfx(c, 'ord') : 0)); const rivals = t[5] ? 1 + Math.floor(R() * 4) : 0;
      c.ords.push({ id: s.seq++, k: t[0], pay, days: t[4], exp: G.day + 20 + Math.floor(R() * 20), rivals, need: t[5] ? Math.min(3, 1 + Math.floor(R() * Math.max(1, c.bizType ? (c.bunits || []).length : (c.assets || []).length))) : 1 }); } }
  G.ordChance = (c, o) => { if (!o.rivals) return 1; const q = c.bizType ? 0.45 + G.bfx(c, 'ord') + G.bfx(c, 'rev') * 0.5 + (c.bunits || []).reduce((s, u) => s + u.lvl, 0) * 0.02 : 0.45 + Math.min(0.3, (c.assets || []).length * 0.02) + ((c.infl || {})[c.home] || 0) / 300; return clamp(q / (0.5 + o.rivals * 0.25), 0.08, 0.92); };
  G.ordErr = (c, o) => { if (!c) return 'Немає компанії'; if (!o) return 'Пропозицію вже знято'; if ((c.ordAct || []).length >= G.ordCap(c)) return `Одночасно не більше ${G.ordCap(c)} замовлень`;
    if (c.bizType && (c.bunits || []).filter(u => u.open <= G.day).length < o.need) return `Потрібно працюючих закладів: ${o.need}`; if (!c.bizType && (c.assets || []).length < o.need) return `Потрібно активів: ${o.need}`; return ''; };
  G.ordTake = function (id) { const c = G.myCo(); const o = c && (c.ords || []).find(x => x.id === id); const e = G.ordErr(c, o); if (e) return no(e); c.ords = c.ords.filter(x => x !== o); const t = G.ORD_T.find(x => x[0] === o.k);
    if (o.rivals) { const fee = o.pay * 0.03; c.cash -= fee; if (R() > G.ordChance(c, o)) return ok(`${t[2]}: тендер програно (суперників ${o.rivals}); внесок ${f$(fee)} не повертається`, { lost: 1 }); }
    (c.ordAct = c.ordAct || []).push({ id: o.id, k: o.k, pay: o.pay, done: G.day + o.days }); return ok(`${t[2]}: ${o.rivals ? 'тендер виграно! ' : ''}виконання ${o.days} дн., оплата ${f$(o.pay)}`); };
  G.h29.d.push(() => { G.companies.forEach(c => { if (!c.ordAct || !c.ordAct.length) return; c.ordAct = c.ordAct.filter(o => { if (G.day < o.done) return true; const t = G.ORD_T.find(x => x[0] === o.k);
    const fail = c.bizType ? 0.08 * (1 - Math.min(0.8, G.bfx(c, 'risk') * 1.5)) : 0.04; const paid = R() < fail ? o.pay * 0.5 : o.pay; c.cash += paid; c.ordEarn = (c.ordEarn || 0) + paid;
    if (human(c)) G.say(paid < o.pay ? `⚠ «${c.name}»: ${t[2]} — претензії замовника, оплачено лише ${f$(paid)}` : `✅ «${c.name}»: ${t[2]} виконано, +${f$(paid)}`, paid < o.pay ? 'bad' : 'good', [c.home]); return false; }); }); });

  // ---------------- КЕРУЮЧИЙ (автокерування малим бізнесом) ----------------
  G.mgrSet = function (on) { const c = G.myCo(); if (!c || !c.bizType) return no('Лише для малого бізнесу'); c.mgr = on ? { d0: G.day } : null; return ok(on ? 'керуючого найнято: 10% доходу закладів, розширює заклади й запускає розробки' : 'керуючого звільнено'); };
  function mgrRun(c) { const inc = c.bLast || 0; const fee = inc * 0.1; c.cash -= fee; c.mgrFee = fee; const keep = Math.max($(20000), inc);
    const us = (c.bunits || []).filter(u => u.open <= G.day && u.lvl < G.bunitMax(c)).sort((a, b) => a.lvl - b.lvl);
    for (const u of us) { const cost = G.bunitUpCost(c, u); if (c.cash - cost < keep) break; const i = c.bunits.indexOf(u); const D = (G.BIZT[c.bizType].units.find(x => x[0] === u.k)); c.cash -= cost; u.lvl++; u.open = G.day + Math.ceil(D[5] / 2); c.mgrLog = `розширив ${D[1]} до рів. ${u.lvl}`; break; }
    if (!c.bres) { const d = G.bizDevs(c).filter(d => !(c.bdev || {})[d[0]] && (!d[5] || (c.bdev || {})[d[5]] === 'done') && (!d[6] || c.bunits.length >= d[6])).sort((a, b) => a[2] - b[2])[0];
      if (d && c.cash - $(d[2]) > keep) { c.cash -= $(d[2]); c.bres = { k: d[0], d0: G.day, done: G.day + d[4] }; c.mgrLog = `запустив розробку «${d[1]}»`; } }
    if (!c.blab) { const d = G.BRES.filter(d => !(c.btech || {})[d[0]] && (!d[6] || (c.btech || {})[d[6]]) && (!d[7] || c.bunits.length >= d[7])).sort((a, b) => a[3] - b[3])[0];
      if (d && c.cash - $(d[3]) > keep * 1.5) { c.cash -= $(d[3]); c.blab = { k: d[0], d0: G.day, done: G.day + d[4] }; c.mgrLog = `почав дослідження «${d[2]}»`; } } }

  // ---------------- СПОНСОРСТВО ----------------
  G.sponsCost = c => c.bizType ? $(20000) : $(5e7);
  G.sponsDo = function () { const c = G.myCo(); if (!c) return no('Немає компанії'); if (c.spons && c.spons.until > G.day) return no(`Уже спонсоруєте (ще ${c.spons.until - G.day} дн.)`); const cost = G.sponsCost(c); if (c.cash < cost) return no(`Коштує ${f$(cost)}`);
    c.cash -= cost; c.spons = { until: G.day + 90 }; const L = G.leader && (G.leader.pc === G.pc || c.ownerLk != null) ? G.leader : null;
    if (c.bizType) { if (L) { L.fame = (L.fame || 0) + 1; const n = L.job ? L.job.nid : L.home; if (L.popu) L.popu[n] = clamp((L.popu[n] || 0) + 3, 0, 100); } return ok('спонсорство місцевих подій: +4% доходу закладів на 90 днів, слава власника +1'); }
    c.infl = c.infl || {}; c.infl[c.home] = clamp((c.infl[c.home] || 0) + 5, 0, 100); return ok('спонсорство: вплив у країні штабу +5, імідж на 90 днів'); };

  // ---------------- ЧАСТКА ІНВЕСТОРУ ----------------
  G.shareVal = c => G.bizMonthly(c) * 12 * 0.2 * 1.5;
  G.shareSell = function () { const c = G.myCo(); if (!c || !c.bizType) return no('Лише для малого бізнесу'); if ((c.invSh || 0) >= 0.6 - 1e-9) return no('Інвесторам уже продано 60% — більше не можна'); const v = G.shareVal(c); if (v < $(10000)) return no('Бізнес ще надто малий для інвестора');
    c.invSh = (c.invSh || 0) + 0.2; c.cash += v; return ok(`продано 20% інвестору за ${f$(v)}; тепер інвестори отримують ${Math.round(c.invSh * 100)}% доходу закладів`); };
  G.shareBuy = function () { const c = G.myCo(); if (!c || !c.invSh) return no('Немає проданих часток'); const v = G.shareVal(c) * 1.2; if (c.cash < v) return no(`Викуп 20%: ${f$(v)}`); c.cash -= v; c.invSh = Math.max(0, c.invSh - 0.2); return ok(`викуплено 20% за ${f$(v)}`); };

  // ---------------- ІНЦИДЕНТИ МАЛОГО БІЗНЕСУ ----------------
  G.INC = [['insp', '🧾', 'Санінспекція виписала штраф'], ['review', '⭐', 'Хвиля поганих відгуків: −12% доходу на місяць'], ['break', '🔧', 'Поломка обладнання — заклад закрито на тиждень'], ['theft', '🕵', 'Крадіжка з каси']];
  function incident(c) { const n = (c.bunits || []).length; if (!n) return; const p = Math.min(0.3, 0.06 + n * 0.015) * (1 - Math.min(0.85, G.bfx(c, 'risk'))); if (R() > p) return;
    const t = G.INC[Math.floor(R() * G.INC.length)]; const m = Math.max($(3000), G.bizMonthly(c)); let txt = t[2];
    if (t[0] === 'insp') { const f = m * (0.05 + R() * 0.1) * (1 - G.bfx(c, 'fine')); c.cash -= f; txt += ` (${f$(f)})`; }
    if (t[0] === 'review') c.badRev = G.day + 30;
    if (t[0] === 'break') { const u = c.bunits[Math.floor(R() * n)]; u.open = Math.max(u.open, G.day + 7); txt += ` (${G.BIZT[c.bizType].units.find(x => x[0] === u.k)[1]}, ${T[u.t].n})`; }
    if (t[0] === 'theft') { const f = m * (0.03 + R() * 0.07); c.cash -= f; txt += ` (${f$(f)})`; }
    c.incLog = (c.incLog || []).concat([{ d: G.day, k: t[0], txt }]).slice(-6); if (human(c)) G.say(`${t[1]} «${c.name}»: ${txt}${G.bfx(c, 'risk') ? '' : '. Порада: «Страхування закладів» зменшує ризик'}`, 'bad', [c.home]); }

  // ---------------- МІСЯЧНИЙ ЦИКЛ ----------------
  G.h29.m.push(() => { G.companies.forEach(c => { if (!c.alive) return;
    if (c.invSh && c.bLast > 0) { const cut = c.bLast * c.invSh; c.cash -= cut; c.invCut = cut; }
    if (c.bizType && c.mgr) mgrRun(c);
    if (c.bizType) incident(c);
    if (human(c)) genOrders(c); }); });
  G.ordRefresh = c => genOrders(c);

  Object.assign(G.act, { bresStart: k => G.bresStart(k), bresCancel: () => G.bresCancel(), ordTake: id => G.ordTake(id), mgrSet: on => G.mgrSet(on), sponsDo: () => G.sponsDo(), shareSell: () => G.shareSell(), shareBuy: () => G.shareBuy() });
});
