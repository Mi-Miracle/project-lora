// v4.7: ланцюжки постачання, держзамовлення для війська компанії, податки малої справи (схеми, перевірки, аудит),
// біржа часток компаній (гравці й ШІ-корпорації, дивіденди).
LORA.sim.register('v47', 100.5, function (G) {
  const { ter, T, N } = G; const clamp = LORA.core.clamp; const R = () => G.rnd(); const $ = v => v / 1e9; const f$ = v => G.fmt$(v);
  const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });
  const S = () => G.v29s('v47', () => ({ seq: 1, sh: {}, ord: [] }));
  const human = c => c && !c.ai; const lkL = lk => G.leaders[lk];

  // ================= ЛАНЦЮЖКИ ПОСТАЧАННЯ =================
  // що потрібно кожному типу справи: [тип постачальника, товар]
  G.SUPIN = { rest: ['farm', 'veg'], shop: ['farm', 'jam'], tour: ['rest', 'cater'], trade: ['farm', 'veg'], vpk: ['fact', 'parts'], fact: ['constr', 'blocks'], constr: ['fact', 'parts'], farm: ['fact', 'tractor'],
    pmc: ['sec', 'cams'], sec: ['fact', 'dev'], trans: ['fact', 'parts'], air: ['fact', 'dev'], law: ['inv', 'rep'], inv: ['law', 'pack'], clinic: ['it', 'lic'], school: ['it', 'lic'], it: ['lab', 'pat'], lab: ['fact', 'dev'], media: ['prod', 'clip'], prod: ['media', 'ads'], club: ['shop', 'pl'] };
  G.supGood = c => { const s = c && G.SUPIN[c.bizType]; if (!s) return null; const g = (G.BGOODS[s[0]] || []).find(x => x.k === s[1]); return g ? { ty: s[0], g } : null; };
  G.supNeed = c => { const s = G.supGood(c); if (!s) return 0; return (c.bunits || []).filter(u => u.open <= G.day).reduce((a, u) => a + u.lvl, 0) * s.g.q * 0.5; };
  G.supSellers = c => { const s = G.supGood(c); if (!s) return []; return G.companies.filter(x => x.alive && x !== c && x.bizType === s.ty && (x.whole || {})[s.g.k]); };
  G.SUP_B = { market: 0, coop: 0.05, co: 0.1 };
  G.supSet = function (mode, id) { const c = G.myCo(); const s = G.supGood(c); if (!s) return no('Вашому типу справи постачання не потрібне'); if (!G.SUP_B.hasOwnProperty(mode)) return no('?');
    if (mode === 'co') { const x = G.companies.find(k => k.id === +id); if (!x || !G.supSellers(c).includes(x)) return no('Ця компанія не продає оптом'); c.sup = { mode, co: x.id }; return ok(`постачальник — «${x.name}»: ${s.g.n}, +10% доходу закладів, якщо товару вистачає`); }
    c.sup = { mode }; return ok(mode === 'coop' ? 'контракт із кооперативом: +5% доходу, 2.5% доходу — плата' : 'закупівлі на відкритому ринку'); };
  G.wholeSet = function (k, on) { const c = G.myCo(); if (!c || !(G.BGOODS[c.bizType] || []).some(g => g.k === k)) return no('?'); (c.whole = c.whole || {})[k] = on ? 1 : 0; if (on) (c.bkeep = c.bkeep || {})[k] = 1;
    return ok(on ? 'оптовий продаж відкрито: товар іде на склад, покупці-гравці забирають його щомісяця за ринковою ціною' : 'оптовий продаж закрито'); };
  function supMonthly(c) { const s = G.supGood(c); c.supB = 0; if (!s || !c.sup || c.sup.mode === 'market') return; const m = G.bizMonthly(c);
    if (c.sup.mode === 'coop') { c.cash -= m * 0.025; c.supB = G.SUP_B.coop; c.supLog = `кооператив: −${f$(m * 0.025)}`; return; }
    const x = G.companies.find(k => k.id === c.sup.co && k.alive); const q = G.supNeed(c); if (!x || !q) return; const have = (x.binv || {})[s.g.k] || 0; const take = Math.min(have, q); const v = $(take * s.g.price);
    if (c.cash < v) { c.supLog = 'бракує грошей на закупівлю'; return; } x.binv[s.g.k] = have - take; c.cash -= v; x.cash += v; x.wholeEarn = (x.wholeEarn || 0) + v;
    c.supB = G.SUP_B.co * (take / q); c.supLog = `«${x.name}»: ${take.toFixed(1)}/${q.toFixed(1)} ${s.g.u} за ${f$(v)}`; if (take < q * 0.5 && human(c)) G.say(`⚠ «${c.name}»: постачальник «${x.name}» дав лише ${Math.round(take / q * 100)}% товару`, 'bad', [c.home]); }
  { const b = G.unitRev; G.unitRev = (c, u) => b(c, u) * (1 + (c.supB || 0)); }

  // ================= ДЕРЖЗАМОВЛЕННЯ ДЛЯ ВІЙСЬКА КОМПАНІЇ =================
  const armyIn = (c, t) => G.coArmies(c).some(a => a.t === t);
  function gsoNew(c) { const h = c.home; const en = G.enemiesOf(h); if (!en.length) return; const as = G.coArmies(c); if (!as.length) return; const k = as.reduce((s, a) => s + a.k, 0);
    const front = ter.filter(t => t.ctrl === h && T[t.i].nb.some(j => en.includes(ter[j].ctrl))); if (!front.length) return;
    if (R() < 0.6) { const t = front[Math.floor(R() * front.length)].i; c.gso = { id: S().seq++, kind: 'hold', t, d0: G.day, until: G.day + 30, miss: 0, pay: 0.0015 * k }; }
    else { const f = front[Math.floor(R() * front.length)]; const tg = T[f.i].nb.filter(j => en.includes(ter[j].ctrl)); if (!tg.length) return; const t = tg[Math.floor(R() * tg.length)]; c.gso = { id: S().seq++, kind: 'take', t, d0: G.day, until: G.day + 45, pay: 0.004 * k }; }
    if (human(c)) G.say(`📜 Генштаб → «${c.name}»: ${c.gso.kind === 'hold' ? 'утримати' : 'звільнити'} ${T[c.gso.t].n} до ${G.dateStr(c.gso.until)}. Нагорода ${f$(c.gso.pay)}`, 'good', [h]); }
  G.gsoDecline = function () { const c = G.myCo(); if (!c || !c.gso) return no('Немає замовлення'); c.gso = null; c.gsoCd = G.day + 30; return ok('замовлення генштабу відхилено; нове — не раніше ніж за місяць'); };
  function gsoDaily(c) { const o = c.gso; if (!o) return; if (!G.coArmies(c).length) { gsoEnd(c, false, 'загонів не лишилось'); return; }
    if (o.kind === 'hold') { if (!armyIn(c, o.t) && G.day > o.d0 + 10) o.miss++; if (o.miss > 3 || ter[o.t].ctrl !== c.home) { gsoEnd(c, false, ter[o.t].ctrl !== c.home ? 'регіон втрачено' : 'загону немає на позиції'); return; } if (G.day >= o.until) gsoEnd(c, true); return; }
    if (ter[o.t].ctrl === c.home && armyIn(c, o.t)) { gsoEnd(c, true); return; } if (G.day >= o.until) gsoEnd(c, false, 'строк минув'); }
  function gsoEnd(c, win, why) { const o = c.gso; c.gso = null; c.gsoCd = G.day + 10; const n = N[c.home];
    if (win) { const v = Math.min(o.pay, Math.max(0, n.cash)); n.cash -= v; c.cash += v; c.rep = clamp((c.rep || 50) + 3, 0, 100); c.gsoWins = (c.gsoWins || 0) + 1; const L = c.ownerLk != null ? lkL(c.ownerLk) : null; if (L) L.fame = (L.fame || 0) + 1;
      if (human(c)) G.say(`🎖 «${c.name}» виконала наказ генштабу (${T[o.t].n}): +${f$(v)}, слава власника +1`, 'good', [c.home]); }
    else { c.rep = clamp((c.rep || 50) - 4, 0, 100); if (human(c)) G.say(`✖ «${c.name}»: наказ генштабу провалено — ${why}. Репутація −4`, 'bad', [c.home]); } }

  // ================= ПОДАТКИ МАЛОЇ СПРАВИ =================
  G.TAXM = { honest: ['✅ Чесно', 1, 0.02], optim: ['📐 Оптимізація', 0.7, 0.05], shadow: ['🕶 Схеми', 0.3, 0.15] }; // [назва, частка податку, базовий ризик перевірки/міс.]
  G.taxRateB = c => clamp((N[c.home].pol.tax || 0.2) * 0.55, 0.05, 0.25);
  G.taxRisk = c => { const m = G.TAXM[c.taxMode || 'honest']; const a = (c.bstaff || {}).acc; return m[2] * (1 - (a ? a.sk * 0.1 : 0)) * (a && a.hon < 0.5 ? 1.5 : 1) * (c.audit > G.day ? 0.4 : 1); };
  G.taxModeSet = function (m) { const c = G.myCo(); if (!c || !c.bizType || !G.TAXM[m]) return no('?'); c.taxMode = m; return ok(`податки: ${G.TAXM[m][0]}${m === 'honest' ? '' : ' — ризик перевірки ' + Math.round(G.taxRisk(c) * 100) + '%/міс.'}`); };
  G.auditCost = c => Math.max($(3000), (c.bLast || 0) * 0.3);
  G.auditDo = function () { const c = G.myCo(); if (!c || !c.bizType) return no('Лише для малого бізнесу'); const v = G.auditCost(c); if (c.cash < v) return no(`Аудит: ${f$(v)}`); c.cash -= v; c.audit = G.day + 180;
    const a = (c.bstaff || {}).acc; if (a && a.hon < 0.5) { const back = (a.stole || 0) * 0.5; c.cash += back; delete c.bstaff.acc; return ok(`аудит виявив крадіжки бухгалтера ${a.n}: звільнено, повернуто ${f$(back)}. Ризик перевірок −60% на півроку`); }
    return ok('аудит пройдено: звітність чиста, ризик податкових перевірок −60% на півроку'); };
  function taxMonthly(c) { const inc = Math.max(0, c.bLast || 0) + Math.max(0, c.bprodNet || 0); if (!inc) return; const m = G.TAXM[c.taxMode || 'honest']; const full = inc * G.taxRateB(c); const pay = full * m[1];
    c.cash -= pay; N[c.home].cash += pay; c.taxPaid = pay; c.taxEv = (c.taxEv || 0) + (full - pay);
    if (R() < G.taxRisk(c)) { const L = c.ownerLk != null ? lkL(c.ownerLk) : null;
      if (!c.taxMode || c.taxMode === 'honest') { c.brate = Math.min(5, (c.brate || 3) + 0.1); c.taxEv = 0; if (human(c)) G.say(`🧾 Податкова перевірила «${c.name}»: порушень немає. Рейтинг +0.1`, 'good', [c.home]); return; }
      const k = c.taxMode === 'shadow' ? 4 : 2; const fine = c.taxEv * k; c.cash -= fine; N[c.home].cash += fine; c.taxEv = 0; c.brate = Math.max(1, (c.brate || 3) - (c.taxMode === 'shadow' ? 0.6 : 0.2));
      if (c.taxMode === 'shadow' && L) { L.heat = clamp((L.heat || 0) + 25, 0, 100); L.fame = Math.max(0, (L.fame || 0) - 1); }
      if (human(c)) G.say(`🚨 Податкова викрила ${c.taxMode === 'shadow' ? 'схеми' : 'агресивну оптимізацію'} у «${c.name}»: штраф ${f$(fine)}${c.taxMode === 'shadow' ? ', кримінальна справа на власника (увага поліції +25)' : ''}`, 'bad', [c.home]); } }

  // ================= БІРЖА ЧАСТОК КОМПАНІЙ =================
  // частки в %: S().sh[coId][lk|'ai'] ; власник має решту. Пропозиції S().ord: {id, co, lk, pct, price ($ за 1%)}
  const holds = co => S().sh[co] = S().sh[co] || {};
  G.coProfitM = c => c.bizType ? Math.max(0, (c.bLast || 0) - (c.invCut || 0)) : Math.max(0, (c.profitY || 0) / 12);
  G.coFair = c => Math.max($(500), G.coProfitM(c) * 24 / 100 + Math.max(0, c.cash) / 100 * 0.5); // вартість 1%
  G.ownerPct = c => 100 - Object.values(holds(c.id)).reduce((s, v) => s + v, 0) - (c.invSh || 0) * 100;
  G.exCos = () => G.companies.filter(c => c.alive && (human(c) || (c.ai && !c.bizType && (c.profitY || 0) > 0))).sort((a, b) => G.coFair(b) - G.coFair(a)).slice(0, 40);
  G.myPct = (co, lk) => (holds(co)[lk] || 0);
  G.exList = function (co, pct, price) { const lk = G.curLk(); const c = G.companies.find(x => x.id === +co); pct = +pct; price = +price; if (!c || !(pct > 0) || !(price > 0)) return no('?');
    const mine = c.ownerLk === lk && !c.ai ? G.ownerPct(c) - S().ord.filter(o => o.co === c.id && o.lk === lk).reduce((s, o) => s + o.pct, 0) : G.myPct(c.id, lk) - S().ord.filter(o => o.co === c.id && o.lk === lk).reduce((s, o) => s + o.pct, 0);
    if (c.ownerLk === lk && mine - pct < 51) return no('Власник має лишити собі щонайменше 51%'); if (pct > mine + 1e-9) return no(`У вас ${mine.toFixed(1)}%`);
    S().ord.push({ id: S().seq++, co: c.id, lk, pct, price, d: G.day }); return ok(`виставлено ${pct}% «${c.name}» по ${f$(price)} за 1%`); };
  G.exCancel = function (id) { const lk = G.curLk(); const i = S().ord.findIndex(o => o.id === id && o.lk === lk); if (i < 0) return no('Немає такої заявки'); S().ord.splice(i, 1); return ok('заявку знято'); };
  function transfer(o, buyerLk, pct) { const c = G.companies.find(x => x.id === o.co); const v = pct * o.price; const B = buyerLk === 'ai' ? null : lkL(buyerLk);
    if (B) { if (B.money < v) return no(`Потрібно ${f$(v)}`); B.money -= v; } const S0 = o.lk === 'ai' ? null : lkL(o.lk); if (S0) S0.money += v; else if (o.lk === 'mkt') { }
    const h = holds(o.co); if (o.lk !== 'mkt' && !(c.ownerLk === o.lk && !c.ai)) { h[o.lk] = (h[o.lk] || 0) - pct; if (h[o.lk] <= 1e-9) delete h[o.lk]; } h[buyerLk] = (h[buyerLk] || 0) + pct;
    o.pct -= pct; if (o.pct <= 1e-9) S().ord = S().ord.filter(x => x !== o); return ok(`куплено ${pct}% «${c.name}» за ${f$(v)}`); }
  G.exBuy = function (id, pct) { const lk = G.curLk(); const o = S().ord.find(x => x.id === id); if (!o) return no('Заявку вже виконано'); if (o.lk === lk) return no('Це ваша заявка'); pct = Math.min(o.pct, +pct || o.pct); return transfer(o, lk, pct); };
  // ринок: частки ШІ-корпорацій купуються «з ринку» за справедливою ціною (до 20%), продаються назад за 95%
  G.exMkt = function (co, pct) { const lk = G.curLk(); const c = G.companies.find(x => x.id === +co); pct = +pct; if (!c || !c.ai || !(pct > 0)) return no('?'); const have = Object.values(holds(c.id)).reduce((s, v) => s + v, 0);
    if (have + pct > 20) return no('На ринку вільно лише 20% цієї корпорації'); return transfer({ co: c.id, lk: 'mkt', pct, price: G.coFair(c) }, lk, pct); };
  G.exMktSell = function (co, pct) { const lk = G.curLk(); const c = G.companies.find(x => x.id === +co); pct = Math.min(+pct, G.myPct(+co, lk)); if (!c || !(pct > 0)) return no('Немає часток');
    const v = pct * G.coFair(c) * 0.95; lkL(lk).money += v; const h = holds(c.id); h[lk] -= pct; if (h[lk] <= 1e-9) delete h[lk]; return ok(`продано ${pct}% «${c.name}» ринку за ${f$(v)}`); };
  G.divSet = function (r) { const c = G.myCo(); if (!c || ![0, 0.1, 0.25, 0.5].includes(+r)) return no('?'); c.div = +r; return ok(`дивіденди: ${Math.round(r * 100)}% місячного прибутку`); };
  function exMonthly() { const sh = S().sh;
    for (const id in sh) { const c = G.companies.find(x => x.id === +id); if (!c || !c.alive) { delete sh[id]; continue; } const p = G.coProfitM(c); const r = c.ai ? 0.4 : (c.div || 0); if (!p || !r) continue;
      for (const [lk, pct] of Object.entries(sh[id])) { if (lk === 'ai') continue; const L = lkL(isNaN(+lk) ? lk : +lk); if (!L) continue; const v = p * r * pct / 100; if (!c.ai) { if (c.cash < v) continue; c.cash -= v; } L.money += v; L.divInc = (L.divInc || 0) + v; } }
    // ШІ-інвестори купують недорогі пропозиції гравців
    S().ord.slice().forEach(o => { const c = G.companies.find(x => x.id === o.co); if (!c) return; if (G.day - o.d > 10 && o.price <= G.coFair(c) * 1.1 && R() < 0.5) { const p = Math.min(o.pct, 5); transfer(o, 'ai', p); const L = lkL(o.lk); if (human(c) && L) G.say(`📈 Інвестор купив ${p}% «${c.name}» у ${L.name}`, 'good', [c.home]); } }); }

  // ================= ЦИКЛИ =================
  G.h29.d.push(() => { G.companies.forEach(c => { if (c.alive && c.gso) gsoDaily(c); }); });
  G.h29.m.push(() => { exMonthly(); G.companies.forEach(c => { if (!c.alive) return;
    if (c.bizType) { supMonthly(c); if (human(c)) taxMonthly(c); }
    if (human(c) && !c.gso && (c.gsoCd || 0) <= G.day && G.coArmies && G.coArmies(c).length && R() < 0.7) gsoNew(c); }); });

  Object.assign(G.act, { supSet: (m, id) => G.supSet(m, id), wholeSet: (k, on) => G.wholeSet(k, on), gsoDecline: () => G.gsoDecline(), taxModeSet: m => G.taxModeSet(m), auditDo: () => G.auditDo(),
    exList: (co, p, pr) => G.exList(co, p, pr), exCancel: id => G.exCancel(id), exBuy: (id, p) => G.exBuy(id, p), exMkt: (co, p) => G.exMkt(co, p), exMktSell: (co, p) => G.exMktSell(co, p), divSet: r => G.divSet(r) });
});
