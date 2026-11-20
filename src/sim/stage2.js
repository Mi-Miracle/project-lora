// ЕТАП 2 (v4.1): реальна участь у житті країни.
//  • Військовий персонаж: іде на фронт, з посади лейтенанта отримує власний підрозділ на мапі світу, сам віддає йому накази,
//    виконує завдання штабу, отримує поранення; досвід і слава — з реальних боїв.
//  • ВПК: компанія сектору «ВПК» бере у воюючих держав контракти й відправляє на фронт власне найняте військо (ПВК).
//  • Видобуток: геологорозвідка → аукціон ліцензії → будівництво → видобуток із запасами, режимом і аваріями.
//    Там, де немає гравця, родовища розробляють ШІ-компанії.
//  • Логістика: компанія прокладає маршрут між регіонами й купує транспорт — вантажівки, потяги, судна видно на мапі.
LORA.sim.register('stage2', 99.998, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav;
  const BD = G.D.buildings; const R = () => G.rnd(); const f$ = v => G.fmt$(v); const $ = v => v / 1e9;
  const S = () => G.v29s('s2', () => ({ dep: {}, surv: [], mode: {}, halt: {}, routes: [], offers: [], pmc: [], seq: 1 }));
  const RN = r => { const I = G.D.resources || LORA.data.resources; return I && I[r] ? I[r].n : r; };
  const sk = (L, k) => G.skill ? G.skill(L, k) : 0;
  G.curLk = () => G._lk != null ? G._lk : G.player >= 0 ? G.player : 'me';
  const cregion = i => { const c = T[i].c; return [c[0], c[1]]; };
  const km = (a, b) => hav(T[a].c[0], T[a].c[1], T[b].c[0], T[b].c[1]);
  const capOf = nid => N[nid].home >= 0 ? N[nid].home : ter.findIndex(t => t.ctrl === nid);
  const ok = (msg, o) => Object.assign({ ok: true, msg }, o || {}), no = err => ({ ok: false, err });

  // =====================================================================================================
  // 1. ВІЙСЬКОВИЙ ПЕРСОНАЖ НА ФРОНТІ
  // =====================================================================================================
  const UNIT_K = [0, 0, 1, 3, 8, 20];             // тис. бійців під командуванням за посадою (1 — рядовий, без підрозділу)
  const UNIT_N = ['', '', 'Батальйон', 'Бригада', 'Дивізія', 'Корпус'];
  const UNIT_EN = ['', '', 'Battalion', 'Brigade', 'Division', 'Corps'];
  const RANGE = [0, 0, 700, 1400, 2800, 1e9];       // як далеко можна вести підрозділ за один наказ (км)
  const milL = L => L && L.role === 'char' && L.job && L.job.k === 'military' ? L.job : null;
  G.unitCap = L => { const j = milL(L); return j ? UNIT_K[clamp(j.lvl, 1, 5)] : 0; };
  G.unitOf = L => L && L.unit != null ? G.armies.find(a => a.id === L.unit && !a.dead) || null : null;
  G.frontArmy = L => L && L.front != null ? G.armies.find(a => a.id === L.front && !a.dead) || null : null;
  const lkOf = L => { for (const k in G.leaders) if (G.leaders[k] === L) return isNaN(+k) ? k : +k; return 'me'; };
  G.canCmd = a => !!a && ((a.pcU && a.cmd === G.curLk()) || (a.pmc != null && a.pmc === G.pc && G.pc >= 0));
  G.myUnit = a => G.canCmd(a);
  const atWarN = nid => G.enemiesOf(nid).length > 0;
  // знайти армію-донора своєї країни (найближчу до точки, не в бою)
  function donor(nid, near, need) {
    const busy = new Set(G.battles || []);
    return G.armies.filter(a => a.n === nid && !a.pcU && a.pmc == null && !a.dead && !(a.mv && a.mv.sea) && a.k > need + 1 && G.friendlyTo(nid, ter[a.t].ctrl) && !busy.has(a.t))
      .sort((x, y) => km(x.t, near) - km(y.t, near))[0] || null;
  }
  G.unitFormErr = function (L) {
    const j = milL(L); if (!j) return 'Лише для військових (робота «Військова служба»)';
    if (j.lvl < 2) return 'Підрозділ дають з посади «Лейтенант»';
    if (G.unitOf(L)) return 'Підрозділ уже під вашим командуванням';
    if (L.mv) return 'Ви в дорозі';
    const d = donor(j.nid, L.at, UNIT_K[j.lvl]); if (!d) return 'У країни немає вільних військ для нового підрозділу';
    return '';
  };
  G.unitForm = function () {
    const L = G.leader; const e = G.unitFormErr(L); if (e) return no(e); const j = L.job, nid = j.nid, k = UNIT_K[j.lvl];
    const d = donor(nid, L.at, k); d.k -= k; const sur = (L.name.split(' ')[1] || L.name);
    const nm = LORA.lang === 'en' ? `${UNIT_EN[j.lvl]} “${sur}”` : `${UNIT_N[j.lvl]} «${sur}»`;
    const a = G.newArmy(nid, d.t, k, nm); a.comp = Object.assign({}, G.armyComp ? G.armyComp(d) : d.comp || a.comp); a.org = Math.min(d.org, 0.8); a.sup = d.sup; a.xp = d.xp || 0;
    a.pcU = 1; a.cmd = lkOf(L); a.auto = !L.front; a.stance = 'hold'; L.unit = a.id;
    G.say(`🎖 ${L.name} прийняв командування: ${nm} (${k.toFixed(0)} тис. бійців) — ${T[a.t].n}`, 'good', [nid]);
    return ok(`під вашим командуванням ${nm}: ${k.toFixed(0)} тис. бійців. Зберіть його на фронті й віддавайте накази на мапі (ПКМ по регіону)`);
  };
  G.unitFill = function () {
    const L = G.leader; const a = G.unitOf(L); if (!a) return no('У вас немає підрозділу'); const cap = G.unitCap(L);
    if (a.k >= cap * 0.97) return no('Підрозділ уже укомплектований'); if (G.battles && G.battles.includes(a.t)) return no('Не під час бою');
    const need = cap - a.k; const d = donor(a.n, a.t, need); if (!d) return no('Немає резервів поблизу');
    const far = km(d.t, a.t); d.k -= need; a.k += need; a.org = Math.max(0.2, a.org - 0.15 - Math.min(0.3, far / 4000)); return ok(`поповнення: +${need.toFixed(1)} тис. (з «${d.name}»), організованість ${Math.round(a.org * 100)}%`);
  };
  G.unitRelease = function (L) {
    L = L || G.leader; const a = G.unitOf(L); if (!a) return no('У вас немає підрозділу');
    a.pcU = 0; a.cmd = null; a.auto = !G.isHuman(a.n); L.unit = null; if (L.front === a.id) L.front = null; return ok(`«${a.name}» передано під загальне командування`);
  };
  G.frontErr = function (L) {
    const j = milL(L); if (!j) return 'Лише для військових';
    if (L.front != null && G.frontArmy(L)) return 'Ви вже на фронті';
    if (!atWarN(j.nid)) return `${N[j.nid].name} зараз не воює — фронту немає (можна служити в штабі)`;
    if (L.mv) return 'Ви в дорозі'; if ((L.hp || 80) < 35) return 'Замало здоровʼя — спершу підлікуйтеся';
    return '';
  };
  G.frontGo = function () {
    const L = G.leader; const e = G.frontErr(L); if (e) return no(e); const nid = L.job.nid; let a = G.unitOf(L);
    if (!a) { const bs = new Set(G.battles || []); a = G.armies.filter(x => x.n === nid && !x.dead && !x.pcU && x.pmc == null).sort((x, y) => (bs.has(y.t) ? 1e6 : 0) + y.k - (bs.has(x.t) ? 1e6 : 0) - x.k)[0]; if (!a) return no('Немає армії, до якої можна приєднатися'); }
    else a.auto = false;
    L.front = a.id; L.frontD = G.day; L.at = a.t;
    G.say(`⚔ ${L.name} вирушив на фронт: ${a.pcU ? 'командує' : 'у складі'} «${a.name}», ${T[a.t].n}`, 'war', [nid]);
    return ok(a.pcU ? `ви з підрозділом «${a.name}». Обирайте його на мапі й віддавайте накази` : `ви воюєте у складі «${a.name}» — рухаєтеся разом з армією, досвід іде з боїв`);
  };
  G.frontBack = function (L, why) {
    L = L || G.leader; if (!L || L.front == null) return no('Ви не на фронті'); const a = G.frontArmy(L); const nid = L.job ? L.job.nid : L.home;
    L.front = null; L.mis = null; if (a && a.pcU) a.auto = !G.isHuman(a.n); L.at = capOf(nid); L.mv = null;
    if (why) G.say(`🚑 ${L.name}: ${why}`, 'bad', [nid]); return ok('ви повернулися з фронту до столиці');
  };
  G.unitMove = function (id, to, sea) {
    const a = G.armies.find(x => x.id === id); if (!G.canCmd(a)) return no('Це не ваш підрозділ');
    if (a.pcU) { const L = G.leaders[a.cmd]; if (!L || L.front !== a.id) return no('Спершу вирушайте на фронт до свого підрозділу'); const lvl = L.job ? L.job.lvl : 2; if (km(a.t, to) > RANGE[lvl]) return no(`Задалеко для вашої посади: до ${RANGE[lvl]} км за наказ`); }
    return G.orderMove(a, to, !!sea);
  };
  G.unitStance = function (id, st) { const a = G.armies.find(x => x.id === id); if (!G.canCmd(a)) return no('Це не ваш підрозділ'); a.stance = st === 'attack' ? 'attack' : 'hold'; return ok(a.stance === 'attack' ? 'наказ: наступ' : 'наказ: оборона'); };
  // завдання штабу під час війни
  function newMission(L, a) {
    const nid = a.n; const en = T[a.t].nb.filter(j => G.atWar(nid, ter[j].ctrl));
    if (en.length) { const pw = j => G.armies.filter(x => x.t === j && G.atWar(x.n, nid)).reduce((s, x) => s + x.k, 0); const t = en.sort((x, y) => pw(x) - pw(y))[0]; return { ty: 'take', t, due: G.day + 35, d0: G.day }; }
    const front = ter.filter(t => t.ctrl === nid && T[t.i].nb.some(j => G.atWar(nid, ter[j].ctrl))).map(t => t.i);
    if (!front.length) return null;
    if (front.includes(a.t)) return { ty: 'hold', t: a.t, due: G.day + 25, d0: G.day, hd: 0 };
    const t = front.sort((x, y) => km(x, a.t) - km(y, a.t))[0]; return { ty: 'move', t, due: G.day + 20 + Math.round(km(t, a.t) / 150), d0: G.day };
  }
  G.misText = m => !m ? '' : m.ty === 'take' ? `Звільнити/захопити регіон ${T[m.t].n}` : m.ty === 'hold' ? `Утримати ${T[m.t].n} 10 днів (${m.hd || 0}/10)` : `Висунутися в район ${T[m.t].n}`;
  function frontDaily(L) {
    const a = G.frontArmy(L); const nid = L.job ? L.job.nid : L.home;
    if (!a) { if (L.unit != null && !G.unitOf(L)) { L.unit = null; L.hp = clamp((L.hp || 80) - 25, 5, 100); return void G.frontBack(L, 'підрозділ розбито, вас евакуювали з пораненням'); }
      const b = G.armies.filter(x => x.n === nid && !x.dead && !x.pcU).sort((x, y) => y.k - x.k)[0]; if (b && atWarN(nid)) { L.front = b.id; return; } return void G.frontBack(L, 'війна для вашої частини завершилася'); }
    if (!(a.mv && a.mv.sea)) L.at = a.t;
    if (L.job && L.job.ddD !== G.day) { L.job.dd = (L.job.dd || 0) + 1; L.job.ddD = G.day; }
    L.mood = clamp((L.mood || 60) - 0.25, 0, 100);
    if (!atWarN(a.n)) return void G.frontBack(L, 'мир! вас демобілізували до столиці');
    const fight = (G.battles || []).includes(a.t);
    if (fight && L.job) { L.job.xp += 0.12 * (1 + sk(L, 'mil') * 0.1); L.fightD = (L.fightD || 0) + 1;
      if (R() < (a.stance === 'attack' ? 0.03 : 0.018) * (1 - sk(L, 'fit') * 0.08)) { const w = 8 + Math.floor(R() * 18); L.hp = clamp((L.hp || 80) - w, 0, 100);
        if (L.hp < 20) { if (a.pcU) a.auto = !G.isHuman(a.n); return void G.frontBack(L, `тяжке поранення в боях за ${T[a.t].n} — евакуація до шпиталю`); }
        G.say(`🩸 ${L.name} поранений у бою (${T[a.t].n}): здоровʼя −${w}`, 'bad', [nid]); } }
    // звільнені/захоплені регіони
    if (a._pt === a.t && a._pc !== a.n && ter[a.t].ctrl === a.n && L.job) { L.job.xp += 1.2; const bonus = G.jobPay(L) * 0.3; L.money += bonus; L.popu[nid] = clamp((L.popu[nid] || 0) + 2, 0, 100); L.fame = (L.fame || 0) + 1;
      G.say(`🏳 ${L.name}${a.pcU ? ` і «${a.name}»` : ''}: регіон ${T[a.t].n} під контролем! Досвід +1.2, премія ${f$(bonus)}, популярність +2`, 'big', [nid]); }
    a._pt = a.t; a._pc = ter[a.t].ctrl;
    // завдання штабу (лише командирам підрозділів)
    if (a.pcU && L.job) {
      if (!L.mis && G.day % 5 === 0) { L.mis = newMission(L, a); if (L.mis) G.say(`📯 Штаб → ${L.name}: ${G.misText(L.mis)} до ${G.dateStr ? G.dateStr(L.mis.due) : 'терміну'}`, 'info', [nid]); }
      const m = L.mis; if (m) {
        let done = m.ty === 'take' ? ter[m.t].ctrl === nid : m.ty === 'move' ? a.t === m.t : false;
        if (m.ty === 'hold') { if (a.t === m.t && ter[m.t].ctrl === nid) m.hd = (m.hd || 0) + 1; else if (ter[m.t].ctrl !== nid) m.hd = -99; done = m.hd >= 10; }
        if (done) { const gx = 1 + L.job.lvl * 0.6, b = G.jobPay(L) * 0.5; L.job.xp += gx; L.money += b; L.popu[nid] = clamp((L.popu[nid] || 0) + 1.5, 0, 100); L.mis = null; L.misOk = (L.misOk || 0) + 1;
          G.say(`🎖 ${L.name}: завдання штабу виконано! Досвід +${gx.toFixed(1)}, премія ${f$(b)}${G.jobPromo ? G.jobPromo(L, true) : ''}`, 'good', [nid]); }
        else if (G.day > m.due || m.hd < 0) { L.job.xp = Math.max(0, L.job.xp - 1); L.mis = null; G.say(`📉 ${L.name}: завдання штабу провалено (${G.misText(m)}). Досвід −1`, 'bad', [nid]); }
      }
    }
  }
  // підрозділ без командира на фронті: ШІ країни ним керує; при звільненні з армії — повертається
  function unitHousekeeping() {
    Object.values(G.leaders).forEach(L => { if (!L || L.role !== 'char') return; const a = G.unitOf(L);
      if (L.unit != null && !a && L.front == null) { L.unit = null; G.say(`🕯 ${L.name}: ваш підрозділ розбито в боях без вас`, 'bad', [L.job ? L.job.nid : L.home]); }
      if (a && !milL(L)) G.unitRelease(L);
      if (L.front != null && !milL(L)) G.frontBack(L);
      if (a) { a.gen = null; if (L.front !== a.id) a.auto = !G.isHuman(a.n); }
      if (L.front != null) frontDaily(L);
    });
  }
  // сила: досвід командира-персонажа / оснащення ПВК
  { const base = G.armyPower; G.armyPower = function (a) { let p = base(a);
    if (a.pcU) { const L = G.leaders[a.cmd]; if (L) p *= 1 + sk(L, 'mil') * 0.04 + (L.front === a.id ? 0.06 : 0) + Math.min(0.1, (L.misOk || 0) * 0.01); }
    else if (a.pmc != null) { const c = G.companies[a.pmc]; if (c) p *= 1.05 + Math.min(10, c.assets.length) * 0.025; }
    return p; }; }
  // на фронті — не до міста й не до перельотів
  { const b = G.locCan; G.locCan = function (loc, k, a) { const L = G.leader; if (L && L.front != null && G.frontArmy(L)) return 'Ви на фронті — спершу поверніться (вкладка «Фронт»)'; return b(loc, k, a); }; }
  { const b = G.leaderGo; G.leaderGo = function (to) { const L = G.leader; if (L && L.front != null && G.frontArmy(L)) return no('Ви на фронті — спершу поверніться'); return b(to); }; }

  // =====================================================================================================
  // 2. ВПК: КОНТРАКТИ НА ВІЙСЬКОВІ ДІЇ (ПВК)
  // =====================================================================================================
  const PMC_RAISE = 0.003, PMC_PAY = 0.0011, PMC_UPK = 0.00035; // $ млрд за 1 тис. бійців: набір / оплата замовника на місяць / утримання
  G.PMC = { raise: PMC_RAISE, pay: PMC_PAY, upk: PMC_UPK };
  function genOffers() {
    const s = S(); s.offers = s.offers.filter(o => o.close > G.day);
    G.wars.forEach(w => [w.a, w.b].forEach(b => { const n = N[b]; if (!n || !n.alive || s.offers.filter(o => o.buyer === b).length >= 2 || R() < 0.5) return;
      const enemy = b === w.a ? w.b : w.a; const k = Math.round(clamp(2 + R() * 10 + (n.agg ? n.agg.gdp / 2500 : 0), 2, 25));
      s.offers.push({ id: s.seq++, buyer: b, enemy, k, pay: +(PMC_PAY * (0.85 + R() * 0.5) * (n.pc > 20000 ? 1.3 : 1)).toFixed(6), bonus: +(0.004 + R() * 0.01).toFixed(4), months: 3 + Math.floor(R() * 4), close: G.day + 30 }); }));
  }
  G.pmcErr = function (c, o) {
    if (!c || c.sector !== 'military') return 'Лише для компаній сектору «ВПК»'; if (!o) return 'Контракт уже неактуальний';
    const h = c.home; if (G.atWar(h, o.buyer)) return 'Країна штабу воює з замовником';
    if (h !== o.buyer && !G.allied(h, o.buyer) && G.rel[h][o.buyer] < 20 && !G.coHasOffice(c, o.buyer)) return `Потрібен офіс у країні ${N[o.buyer].name} або відносини ≥ 20`;
    if (G.allied(h, o.enemy) || h === o.enemy) return 'Не можна воювати проти союзника країни штабу';
    if (!c.assets.length) return 'Потрібен хоча б один виробничий актив (завод, полігон, навчальний центр)';
    if (S().pmc.some(p => p.co === c.id && p.buyer === o.buyer && !p.end)) return 'У вас уже є контракт із цим замовником';
    const cost = o.k * PMC_RAISE; if (c.cash < cost) return `Набір і оснащення: ${f$(cost)} — бракує коштів`;
    return '';
  };
  function startPmc(c, o, ai) {
    const s = S(); const cost = o.k * PMC_RAISE; c.cash -= cost; const at = capOf(o.buyer);
    const a = G.newArmy(o.buyer, at, o.k, LORA.lang === 'en' ? `PMC “${c.en || c.name}”` : `ПВК «${c.name}»`); a.pmc = c.id; a.auto = ai ? !G.isHuman(o.buyer) : false; a.org = 0.85; a.xp = 0.15;
    const p = { id: s.seq++, co: c.id, buyer: o.buyer, enemy: o.enemy, army: a.id, k0: o.k, pay: o.pay, bonus: o.bonus, left: o.months, got: 0, regs: 0, ai: !!ai };
    s.pmc.push(p); s.offers = s.offers.filter(x => x !== o);
    G.rel[o.buyer][c.home] = clamp(G.rel[o.buyer][c.home] + 3, -100, 100);
    G.say(`🛡 «${c.name}» уклала контракт з ${N[o.buyer].name}: ${o.k} тис. бійців ПВК вирушають на фронт (${T[at].n})`, ai ? 'war' : 'good', [o.buyer, c.home]);
    return p;
  }
  G.pmcTake = function (oid) { const c = G.myCo(); const o = S().offers.find(x => x.id === oid); const e = G.pmcErr(c, o); if (e) return no(e); const p = startPmc(c, o, false); return ok(`контракт підписано: «${G.armies.find(a => a.id === p.army).name}» у столиці замовника. Обирайте загін на мапі й віддавайте накази (ПКМ) — або передайте командування замовнику`); };
  function pmcEnd(p, why, kind) {
    const c = G.companies[p.co]; const a = G.armies.find(x => x.id === p.army && !x.dead); p.end = G.day;
    if (a) { if (c) c.cash += a.k * PMC_RAISE * 0.3; G.armies = G.armies.filter(x => x !== a); }
    if (c) G.say(`🛡 «${c.name}» — контракт з ${N[p.buyer].name} завершено: ${why}. Зароблено ${f$(p.got)}, регіонів ${p.regs}`, kind || 'info', [p.buyer, c.home]);
  }
  G.pmcRecall = function (pid) { const c = G.myCo(); const p = S().pmc.find(x => x.id === pid && !x.end); if (!p || !c || p.co !== c.id) return no('Немає такого контракту'); G.rel[p.buyer][c.home] = clamp(G.rel[p.buyer][c.home] - 8, -100, 100); c.cash -= p.pay * p.k0 * 0.5; pmcEnd(p, 'достроково відкликано (неустойка, відносини −8)', 'bad'); return ok('ПВК відкликано'); };
  G.pmcAuto = function (pid, on) { const c = G.myCo(); const p = S().pmc.find(x => x.id === pid && !x.end); if (!p || !c || p.co !== c.id) return no('Немає такого контракту'); const a = G.armies.find(x => x.id === p.army); if (!a) return no('Загін втрачено'); a.auto = !!on && !G.isHuman(p.buyer); p.handed = !!on; return ok(on ? 'командування передано штабу замовника' : 'ви знову командуєте загоном'); };
  function pmcDaily() { const s = S(); s.pmc.forEach(p => { if (p.end) return; const a = G.armies.find(x => x.id === p.army && !x.dead); const c = G.companies[p.co];
    if (!a || !c || !c.alive) return void pmcEnd(p, 'загін ПВК знищено', 'bad');
    if (!G.atWar(p.buyer, p.enemy)) return void pmcEnd(p, 'війна закінчилася — бійці повертаються додому', 'good');
    if (a._pt === a.t && a._pc !== a.n && ter[a.t].ctrl === a.n) { const b = p.bonus; c.cash += b; p.got += b; p.regs++; if (!p.ai) G.say(`🏳 ПВК «${c.name}» взяла під контроль ${T[a.t].n}: бонус ${f$(b)}`, 'good', [p.buyer]); }
    a._pt = a.t; a._pc = ter[a.t].ctrl; }); }
  function pmcMonthly() { const s = S();
    // ШІ-компанії ВПК теж беруть контракти, на які не знайшлося гравця
    s.offers.slice().forEach(o => { if (o.close < G.day || R() > 0.4) return; const cs = G.companies.filter(c => c.alive && c.ai && c.sector === 'military' && !G.pmcErr(c, o)); if (cs.length) startPmc(cs[Math.floor(R() * cs.length)], o, true); });
    genOffers();
    s.pmc.forEach(p => { if (p.end) return; const a = G.armies.find(x => x.id === p.army && !x.dead); const c = G.companies[p.co]; if (!a || !c) return;
      const pay = p.pay * a.k, upk = PMC_UPK * a.k; c.cash += pay - upk; p.got += pay - upk; N[p.buyer].cash -= pay; p.left--;
      if (p.left <= 0) pmcEnd(p, 'термін контракту вичерпано', 'good'); });
    s.pmc = s.pmc.filter(p => !p.end || G.day - p.end < 400);
  }

  // =====================================================================================================
  // 3. ВИДОБУТОК: РОДОВИЩА, РОЗВІДКА, ЛІЦЕНЗІЇ, РЕЖИМ, АВАРІЇ, ШІ
  // =====================================================================================================
  const EXT = Object.keys(BD).filter(k => BD[k].req && BD[k].req.geo); const RES_T = {}; EXT.forEach(k => { RES_T[BD[k].req.geo] = k; });
  G.EXT_TYPES = EXT; G.extOf = type => BD[type] && BD[type].req && BD[type].req.geo || null; G.typeOfRes = r => RES_T[r];
  G.secRes = sec => sec === 'mining' ? ['coal', 'metal', 'nonfer', 'rare', 'uranium'].filter(r => RES_T[r]) : sec === 'oil' ? ['oil', 'gas'].filter(r => RES_T[r]) : [];
  const hasGeo = (i, r) => { const t = ter[i]; if (!t || !RES_T[r]) return false; if ((t.prod[r] || 0) > (G.W_prod0[r] || 0) * 0.003) return true; const e = G.canBuild(t.owner, i, RES_T[r]); return !e || !/покладів/.test(e); };
  G.hasGeo = hasGeo;
  G.dep = function (i, r) { const s = S(); const k = i + ':' + r; let d = s.dep[k]; if (d) return d; if (!hasGeo(i, r)) return null;
    const out = Object.values(BD[RES_T[r]].out || { x: 1 })[0] || 1; const sh = clamp((ter[i].prod[r] || 0) / Math.max(1e-9, (G.W_prod0[r] || 1) * 0.05), 0, 1);
    const h = ((i * 2654435761) ^ (r.length * 97531)) >>> 0; const rr = (h % 1000) / 1000, rq = ((h >>> 10) % 1000) / 1000; // детерміновано від регіону
    d = s.dep[k] = { R: +(out * (18 + 70 * sh) * (0.6 + rr * 0.8)).toFixed(3), R0: 0, q: +(0.6 + rq * 0.8).toFixed(2), f: {}, lic: -1, till: 0 }; d.R0 = d.R; return d; };
  G.licBase = (i, r) => { const d = G.dep(i, r); if (!d) return 0; const type = RES_T[r]; const out = Object.values(BD[type].out)[0] || 1; return +(G.buildCost(ter[i].owner, i, type) * (0.03 + 0.06 * d.q) * clamp(d.R / (out * 40), 0.4, 2.5)).toFixed(5); };
  G.survErr = function (c, i) { if (!c || !G.secRes(c.sector).length) return 'Лише для компаній «Видобуток» або «Нафта й газ»'; const host = ter[i].owner;
    if (!G.coHasOffice(c, host)) return `Потрібен офіс у країні ${N[host].name}`; if (ter[i].ctrl !== host) return 'Регіон окупований';
    if (S().surv.some(s => s.co === c.id && s.t === i)) return 'Розвідка тут уже йде'; if (G.secRes(c.sector).every(r => { const d = G.dep(i, r); return !hasGeo(i, r) || (d && d.f[c.id]); }) && G.secRes(c.sector).some(r => hasGeo(i, r))) return 'Регіон уже розвідано';
    const cost = G.survCost(i); if (c.cash < cost) return `Розвідка коштує ${f$(cost)}`; return ''; };
  G.survCost = i => +(0.003 + ter[i].gdp * 0.000015).toFixed(5);
  G.mineSurvey = function (i) { const c = G.myCo(); const e = G.survErr(c, i); if (e) return no(e); const cost = G.survCost(i); c.cash -= cost; const days = 18 + Math.floor(R() * 14);
    S().surv.push({ co: c.id, t: i, done: G.day + days, d0: G.day }); return ok(`геологи виїхали в ${T[i].n}: буріння й аналіз проб ≈ ${days} дн. (${f$(cost)})`); };
  function survDaily() { const s = S(); s.surv = s.surv.filter(v => { if (G.day < v.done) return true; const c = G.companies[v.co]; if (!c) return false;
    const found = G.secRes(c.sector).filter(r => hasGeo(v.t, r)).map(r => { const d = G.dep(v.t, r); d.f[c.id] = 1; return `${RN(r)} (запаси ≈ ${(d.R / (Object.values(BD[RES_T[r]].out)[0] || 1)).toFixed(0)} р. роботи шахти, якість ${Math.round(d.q * 100)}%)`; });
    if (!c.ai) G.say(found.length ? `🔍 «${c.name}», розвідка ${T[v.t].n}: знайдено — ${found.join('; ')}` : `🔍 «${c.name}», розвідка ${T[v.t].n}: промислових покладів не знайдено`, found.length ? 'good' : 'info', [ter[v.t].owner]);
    return false; }); }
  G.licErr = function (c, i, r, bid) { if (!c || !G.secRes(c.sector).includes(r)) return 'Не профіль компанії'; const d = G.dep(i, r); if (!d) return 'Тут немає покладів';
    if (!d.f[c.id]) return 'Спершу геологорозвідка'; if (d.lic === c.id && d.till > G.day) return 'Ліцензія вже ваша'; if (d.lic >= 0 && d.till > G.day) return `Ліцензія в «${G.companies[d.lic].name}» до ${G.dateStr(d.till)}`;
    if (!G.coHasOffice(c, ter[i].owner)) return 'Потрібен офіс у цій країні'; if (d.R <= 0) return 'Родовище виснажене';
    const base = G.licBase(i, r); if (bid != null && bid < base * 0.7) return `Мінімальна ставка ${f$(base * 0.7)}`; if (c.cash < (bid != null ? bid : base)) return 'Бракує коштів на ставку'; return ''; };
  G.mineLicense = function (i, r, bid) { const c = G.myCo(); bid = bid != null ? +bid : G.licBase(i, r); const e = G.licErr(c, i, r, bid); if (e) return no(e); const d = G.dep(i, r), host = ter[i].owner, base = G.licBase(i, r);
    const rivals = G.companies.filter(x => x.alive && x.ai && x.sector === c.sector && (x.home === host || G.coHasOffice(x, host)) && x.cash > base * 0.8);
    let best = null, bb = 0; rivals.forEach(x => { const b = base * (0.75 + R() * 0.65); if (b > bb) { bb = b; best = x; } });
    const infl = (c.infl[host] || 0) * 0.002; if (best && bb > bid * (1 + infl)) { d.lic = best.id; d.till = G.day + 365 * 25; best.cash -= bb; N[host].cash += bb; d.f[best.id] = 1;
      G.say(`⚖ Аукціон за ліцензію (${T[i].n}): перемогла «${best.name}» зі ставкою ${f$(bb)}`, 'bad', [host]); return no(`аукціон програно: «${best.name}» дала ${f$(bb)} (ваша ставка ${f$(bid)})`); }
    c.cash -= bid; N[host].cash += bid; d.lic = c.id; d.till = G.day + 365 * 25; G.rel[host][c.home] = clamp(G.rel[host][c.home] + 1, -100, 100);
    return ok(`ліцензію виграно за ${f$(bid)}${best ? ` (конкурент «${best.name}» дав ${f$(bb)})` : ' (без конкурентів)'} — 25 років. Тепер будуйте ${BD[RES_T[r]].n.toLowerCase()}`); };
  G.mineBuild = function (i, r) { const c = G.myCo(); if (!c) return no('Немає компанії'); return G.coBuild(c, i, RES_T[r]); };
  { const b = G.coCanBuild; G.coCanBuild = function (c, i, type) { const r = G.extOf(type); if (r && c) { const d = G.dep(i, r);
      if (d) { if (d.R <= 0) return 'Родовище виснажене'; if (!c.ai && !(d.lic === c.id && d.till > G.day)) return 'Потрібна ліцензія на родовище (розвідка → аукціон)'; if (c.ai && d.lic >= 0 && d.lic !== c.id && d.till > G.day) return 'Ліцензія в іншої компанії'; } }
    return b(c, i, type); }; }
  { const b = G.coBuild; G.coBuild = function (c, i, type, q) { const r0 = b(c, i, type, q); const r = G.extOf(type); if (r0 && r0.ok && r && c && c.ai) { const d = G.dep(i, r); if (d && (d.lic < 0 || d.till <= G.day)) { d.lic = c.id; d.till = G.day + 365 * 25; d.f[c.id] = 1; } } return r0; }; }
  const mkey = (c, a) => c.id + ':' + a.t + ':' + a.type;
  G.mineModeOf = (c, a) => S().mode[mkey(c, a)] || 1;
  G.mineHalt = (c, a) => (S().halt[mkey(c, a)] || 0) > G.day ? S().halt[mkey(c, a)] : 0;
  G.mineMode = function (t, type, m) { const c = G.myCo(); const a = c && c.assets.find(x => x.t === t && x.type === type); if (!a) return no('Немає такого обʼєкта'); m = [0.5, 1, 1.5].includes(+m) ? +m : 1; S().mode[mkey(c, a)] = m; return ok(m === 0.5 ? 'щадний режим: менше видобутку, менше аварій, запаси на довше' : m === 1.5 ? 'форсований режим: +50% видобутку, але ризик аварій ×2 і швидке виснаження' : 'нормальний режим'); };
  { const b = G.assetProfit; G.assetProfit = function (c, a) { const p = b(c, a); const r = G.extOf(a.type); if (!r) return p; const d = G.dep(a.t, r); if (!d) return p; if (d.R <= 0 || G.mineHalt(c, a)) return 0; return p * G.mineModeOf(c, a) * (0.75 + 0.25 * d.q); }; }
  // людські компанії отримують фізичну продукцію на склад — режим, простій і виснаження діють і тут
  { const b = G.corpResFlow; if (b) G.corpResFlow = function (c) { const f = b(c); c.assets.forEach(a => { const r = G.extOf(a.type); if (!r) return; const d = G.dep(a.t, r), t = ter[a.t]; if (!d || t.ctrl !== t.owner) return;
      const base = (BD[a.type].out[r] || 0) * (1 - t.dmg) * a.lvl / 12 * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1); const mul = d.R <= 0 || G.mineHalt(c, a) ? 0 : G.mineModeOf(c, a) * (0.75 + 0.25 * d.q);
      f.out[r] = Math.max(0, (f.out[r] || 0) + base * (mul - 1)); }); return f; }; }
  function mineMonthly() { const s = S();
    G.companies.forEach(c => { if (!c.alive) return; c.assets.forEach(a => { const r = G.extOf(a.type); if (!r) return; const d = G.dep(a.t, r); if (!d || d.R <= 0 || ter[a.t].ctrl !== ter[a.t].owner) return; if (G.mineHalt(c, a)) return;
      const m = G.mineModeOf(c, a), out = (Object.values(BD[a.type].out)[0] || 1) * a.lvl * m / 12; const was = d.R / d.R0; d.R = Math.max(0, +(d.R - out).toFixed(4)); const now = d.R / d.R0;
      if (!c.ai) { if (was > 0.15 && now <= 0.15) G.say(`⛏ «${c.name}»: ${BD[a.type].n} (${T[a.t].n}) — лишилося 15% запасів`, 'info', [ter[a.t].owner]); if (d.R <= 0) G.say(`⛏ «${c.name}»: родовище в ${T[a.t].n} виснажене — видобуток зупинено`, 'bad', [ter[a.t].owner]);
        if (R() < 0.008 * m * m * (1.5 - d.q * 0.4)) { const days = 12 + Math.floor(R() * 30), cost = G.buildCost(ter[a.t].owner, a.t, a.type) * 0.03 * a.lvl; s.halt[mkey(c, a)] = G.day + days; c.cash -= cost;
          G.say(`💥 Аварія: ${BD[a.type].n} «${c.name}» (${T[a.t].n}) — ${pick(['обвал у забої', 'затоплення горизонту', 'пожежа на конвеєрі', 'вибух метану', 'прорив дамби хвостосховища'])}. Простій ${days} дн., ремонт ${f$(cost)}`, 'bad', [ter[a.t].owner]); } }
    }); });
    // ШІ розробляє родовища там, де немає гравця-видобувника
    const player = new Set(); G.companies.forEach(c => { if (c.alive && !c.ai && G.secRes(c.sector).length) c.offices.forEach(o => player.add(o.n)); });
    for (let k = 0; k < 3; k++) { const cs = G.companies.filter(c => c.alive && c.ai && G.secRes(c.sector).length && c.cash > 0.5); if (!cs.length) break; const c = cs[Math.floor(R() * cs.length)];
      const hosts = [c.home].concat(c.offices.map(o => o.n)).filter(n => N[n] && N[n].alive && !player.has(n)); if (!hosts.length) continue; const host = hosts[Math.floor(R() * hosts.length)];
      const regs = ter.filter(t => t.owner === host && t.ctrl === host); for (let tries = 0; tries < 6; tries++) { const t = regs[Math.floor(R() * regs.length)]; if (!t) break; const rs = G.secRes(c.sector).filter(r => hasGeo(t.i, r)); if (!rs.length) continue; const r = rs[Math.floor(R() * rs.length)]; const d = G.dep(t.i, r);
        if (!d || d.R <= 0 || (d.lic >= 0 && d.till > G.day && d.lic !== c.id) || c.assets.some(a => a.t === t.i && a.type === RES_T[r]) || c.pend.some(p => p.t === t.i && p.type === RES_T[r])) continue;
        const lb = G.licBase(t.i, r); if (c.cash < lb + G.buildCost(host, t.i, RES_T[r]) * 1.2) break; c.cash -= lb * 0.8; N[host].cash += lb * 0.8; d.lic = c.id; d.till = G.day + 365 * 25; d.f[c.id] = 1; G.coBuild(c, t.i, RES_T[r], true); break; } } }
  const pick = a => a[Math.floor(R() * a.length)];

  // =====================================================================================================
  // 4. ЛОГІСТИКА: МАРШРУТИ Й ТРАНСПОРТ НА МАПІ
  // =====================================================================================================
  const VEH = G.VEH = {
    truck: { n: 'Вантажівки', ic: '🚚', cost: 0.00015, kmd: 650, rev: 2.4e-9, opx: 1.15e-9, risk: 0.03, max: 60, d: 'дешево, будь-який суходіл; ризик на дорогах біля фронту' },
    rail:  { n: 'Вантажні потяги', ic: '🚆', cost: 0.004, kmd: 900, rev: 46e-9, opx: 19e-9, risk: 0.02, max: 20, d: 'дорогі, але возять у 20 разів більше; потрібна розвинена інфраструктура', infra: 0.45 },
    ship:  { n: 'Суховантажі', ic: '🚢', cost: 0.03, kmd: 560, rev: 165e-9, opx: 64e-9, risk: 0.01, max: 12, d: 'найбільший обсяг; лише між прибережними регіонами, морем' }
  };
  // шлях вантажу: обходить країни, що воюють з відправником чи отримувачем, і регіони з боями
  function cargoPath(a, b, na, nb) {
    const NT = T.length, dist = new Float64Array(NT).fill(Infinity), prev = new Int32Array(NT).fill(-1); const h = new U.Heap(); dist[a] = 0; h.push(0, a); const bs = new Set(G.battles || []);
    while (h.size) { const [d, u] = h.pop(); if (d > dist[u]) continue; if (u === b) break;
      for (const v of T[u].nb) { const c = ter[v].ctrl; if (G.atWar(na, c) || G.atWar(nb, c) || (c !== na && G.tradeBan && G.tradeBan(na, c, 'all'))) continue; const w = km(u, v) * (bs.has(v) ? 4 : 1) * (1.6 - (N[c].infraLvl || 0.5) * 0.6); const nd = d + w; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } } }
    if (!isFinite(dist[b])) return null; const p = []; let u = b; while (u !== -1) { p.push(u); u = prev[u]; } p.reverse(); let L = 0; for (let k = 1; k < p.length; k++) L += km(p[k - 1], p[k]); return { path: p, km: L };
  }
  G.routeQuote = function (a, b, m) {
    const V = VEH[m]; if (!V) return no('Оберіть транспорт'); if (a === b || a == null || b == null || a < 0 || b < 0) return no('Оберіть два різні регіони');
    const na = ter[a].ctrl, nb = ter[b].ctrl; if (G.atWar(na, nb)) return no('Між цими країнами війна');
    let P;
    if (m === 'ship') { if (!T[a].p.length || !T[b].p.length) return no('Морем — лише між прибережними регіонами'); const sp = G.seaPath(na, a, b); if (!sp) return no('Немає безпечного морського шляху'); P = { sea: sp.nodes, km: sp.km };
    } else { P = cargoPath(a, b, na, nb); if (!P) return no('Немає сухопутного шляху (море, війна або ембарго)');
      if (m === 'rail') { const low = P.path.find(i => (N[ter[i].ctrl].infraLvl || 0) < V.infra); if (low != null) return no(`Слабка залізнична мережа: ${N[ter[low].ctrl].name}`); } }
    if (P.km < 60) return no('Занадто близько — це вже не логістика'); const days = Math.max(1, P.km / V.kmd);
    const gdp = (N[na].agg ? N[na].agg.gdp : 100) + (N[nb].agg ? N[nb].agg.gdp : 100); const dem = clamp(0.7 + gdp / 9000, 0.7, 1.5) * (na !== nb ? 1.2 : 1);
    const rev = P.km * V.rev * dem * 1.4, cost = P.km * 2 * V.opx; const per = rev - cost; const tripD = days * 2 + 1;
    return { ok: true, m, a, b, path: P.path || null, sea: P.sea || null, km: Math.round(P.km), days: +days.toFixed(1), dem: +dem.toFixed(2), profitTrip: per, monthly: per * 30 / tripD, vcost: V.cost };
  };
  G.routeErr = function (c, a, b, m, n) { if (!c) return 'Немає компанії'; if (c.sector !== 'logistics') return 'Маршрути прокладають компанії сектору «Логістика»';
    if (!G.coHasOffice(c, ter[a].owner) && !G.coHasOffice(c, ter[b].owner)) return 'Потрібен офіс хоча б в одній із країн маршруту';
    if (S().routes.filter(r => r.co === c.id).length >= 12) return 'Забагато маршрутів (до 12)'; const q = G.routeQuote(a, b, m); if (!q.ok) return q.err;
    n = Math.max(1, Math.round(n || 1)); if (n > VEH[m].max) return `До ${VEH[m].max} одиниць на маршрут`; if (c.cash < n * VEH[m].cost) return `Транспорт коштує ${f$(n * VEH[m].cost)}`; return ''; };
  function mkRoute(c, q, n) { const s = S(); const r = { id: s.seq++, co: c.id, a: q.a, b: q.b, m: q.m, n, path: q.path, sea: q.sea, km: q.km, days: q.days, dem: q.dem, u: [], earn: 0, trips: 0, lost: 0, d0: G.day, st: '' };
    for (let k = 0; k < n; k++) r.u.push(+(k * 2 / n).toFixed(3)); c.cash -= n * VEH[q.m].cost; s.routes.push(r); return r; }
  G.routeNew = function (a, b, m, n) { const c = G.myCo(); const e = G.routeErr(c, a, b, m, n); if (e) return no(e); const q = G.routeQuote(a, b, m); n = Math.max(1, Math.round(n || 1)); const r = mkRoute(c, q, n);
    return ok(`маршрут ${T[a].n} → ${T[b].n} (${q.km} км, ${VEH[m].ic}×${n}) відкрито. Транспорт уже в дорозі — дивіться на мапі`, { id: r.id }); };
  G.routeAdd = function (id, n) { const c = G.myCo(); const r = S().routes.find(x => x.id === id); if (!r || !c || r.co !== c.id) return no('Немає маршруту'); n = Math.round(n);
    if (n > 0) { if (r.u.length + n > VEH[r.m].max) return no(`До ${VEH[r.m].max} одиниць`); if (c.cash < n * VEH[r.m].cost) return no('Бракує коштів'); c.cash -= n * VEH[r.m].cost; for (let k = 0; k < n; k++) r.u.push(0); r.n = r.u.length; return ok(`+${n} ${VEH[r.m].ic}`); }
    if (n < 0) { const d = Math.min(-n, r.u.length - 1); if (d <= 0) return no('Лишається остання одиниця — закрийте маршрут'); r.u.splice(0, d); r.n = r.u.length; c.cash += d * VEH[r.m].cost * 0.5; return ok(`продано ${d} (за 50% ціни)`); } return no('?'); };
  G.routeClose = function (id) { const c = G.myCo(); const s = S(); const r = s.routes.find(x => x.id === id); if (!r || !c || r.co !== c.id) return no('Немає маршруту'); c.cash += r.u.length * VEH[r.m].cost * 0.5; s.routes = s.routes.filter(x => x !== r); return ok(`маршрут закрито, транспорт продано за ${f$(r.u.length * VEH[r.m].cost * 0.5)}`); };
  function routesDaily() { const s = S(); const bs = new Set(G.battles || []);
    s.routes.forEach(r => { const c = G.companies[r.co]; if (!c || !c.alive) { r.dead = 1; return; } const V = VEH[r.m];
      if (G.day % 7 === r.id % 7 || r.st) { const q = G.routeQuote(r.a, r.b, r.m); if (!q.ok) { if (!r.st && !c.ai) G.say(`🚧 Маршрут «${c.name}» ${T[r.a].n} → ${T[r.b].n} зупинено: ${q.err}`, 'bad', [ter[r.a].owner]); r.st = q.err; return; } if (r.st && !c.ai) G.say(`🚦 Маршрут «${c.name}» ${T[r.a].n} → ${T[r.b].n} знову працює`, 'good', [ter[r.a].owner]); r.st = ''; Object.assign(r, { path: q.path, sea: q.sea, km: q.km, days: q.days, dem: q.dem }); }
      const hot = r.path ? r.path.some(i => bs.has(i)) : (r.sea || []).some(i => G.seaClosed && G.seaClosed[i] > G.day);
      const step = 1 / Math.max(1, r.days), seas = r.path && G.seasonSpeed ? G.seasonSpeed(r.path[0]) : 1;
      for (let k = r.u.length - 1; k >= 0; k--) { const was = r.u[k]; if (was < 0) { r.u[k] = Math.min(0, was + 1); continue; } // < 0 — розвантаження/навантаження (днів)
        let v = was + step * seas;
        if (was < 1 && v >= 1) { const rev = r.km * V.rev * r.dem; c.cash += rev - r.km * V.opx; r.earn += rev - r.km * V.opx; r.trips++; v = 1.0001; r.u[k] = v; continue; }
        if (v >= 2) { const rev = r.km * V.rev * r.dem * 0.4; c.cash += rev - r.km * V.opx; r.earn += rev - r.km * V.opx; v = -1; }
        r.u[k] = v;
        if (hot && R() < V.risk) { r.u.splice(k, 1); r.lost++; if (!c.ai) G.say(`💥 ${V.ic} «${c.name}» потрапив під обстріл на маршруті ${T[r.a].n} → ${T[r.b].n} — транспорт втрачено`, 'bad', [ter[r.a].owner]); } }
      r.n = r.u.length; if (!r.n) r.dead = 1; });
    s.routes = s.routes.filter(r => !r.dead); }
  function routesMonthly() { const s = S();
    G.companies.forEach(c => { if (!c.alive || !c.ai || c.sector !== 'logistics' || s.routes.filter(r => r.co === c.id).length >= 3 || R() > 0.35) return;
      const offs = c.offices.map(o => o.t).filter(t => t != null); if (!offs.length) return; const a = offs[Math.floor(R() * offs.length)];
      const cand = ter.filter(t => t.ctrl === t.owner && N[t.owner].alive && t.i !== a && !G.atWar(ter[a].ctrl, t.ctrl) && km(a, t.i) > 400 && km(a, t.i) < 3500 && t.gdp > 20); if (!cand.length) return;
      const b = cand[Math.floor(R() * cand.length)].i; const m = T[a].p.length && T[b].p.length && R() < 0.3 ? 'ship' : R() < 0.4 ? 'rail' : 'truck'; const q = G.routeQuote(a, b, m); if (!q.ok || q.profitTrip <= 0) return;
      const n = Math.min(VEH[m].max, Math.max(1, Math.floor(c.cash * 0.02 / VEH[m].cost))); if (n * VEH[m].cost > c.cash * 0.05) return; mkRoute(c, q, n); }); }
  // положення транспорту для мапи: [lon, lat]
  G.routePts = function (r) { if (r._pts && r._pk === (r.path || r.sea || []).join(',')) return r._pts; const P = [];
    if (r.path) r.path.forEach(i => P.push(cregion(i))); else { P.push(cregion(r.a)); (r.sea || []).forEach(n => { const s = G.D.sea.nodes[n]; P.push([s.lon, s.lat]); }); P.push(cregion(r.b)); }
    for (let k = 1; k < P.length; k++) { let x = P[k][0]; while (x - P[k - 1][0] > 180) x -= 360; while (P[k - 1][0] - x > 180) x += 360; P[k] = [x, P[k][1]]; }
    const cum = [0]; for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
    r._pts = { P, cum, L: cum[cum.length - 1] || 1 }; r._pk = (r.path || r.sea || []).join(','); return r._pts; };
  G.routePos = function (r, u) { const X = G.routePts(r); let f = u < 0 ? (u > -0.5 ? 1 : 0) : u <= 1 ? u : 2 - u; f = clamp(f, 0, 1); const d = f * X.L; let k = 1; while (k < X.cum.length - 1 && X.cum[k] < d) k++;
    const a = X.P[k - 1], b = X.P[k] || a, seg = (X.cum[k] - X.cum[k - 1]) || 1, t = clamp((d - X.cum[k - 1]) / seg, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, u > 1 ? -1 : 1]; };

  // =====================================================================================================
  // ДІЇ (через G.act — працюють і в мультиплеєрі)
  // =====================================================================================================
  Object.assign(G.act, {
    unitForm: () => G.unitForm(), unitFill: () => G.unitFill(), unitRelease: () => G.unitRelease(), frontGo: () => G.frontGo(), frontBack: () => G.frontBack(),
    unitMove: (id, t, sea) => G.unitMove(id, t, sea), unitStance: (id, st) => G.unitStance(id, st),
    pmcTake: id => G.pmcTake(id), pmcRecall: id => G.pmcRecall(id), pmcAuto: (id, on) => G.pmcAuto(id, on),
    mineSurvey: i => G.mineSurvey(i), mineLicense: (i, r, b) => G.mineLicense(i, r, b), mineBuild: (i, r) => G.mineBuild(i, r), mineMode: (t, ty, m) => G.mineMode(t, ty, m),
    routeNew: (a, b, m, n) => G.routeNew(a, b, m, n), routeAdd: (id, n) => G.routeAdd(id, n), routeClose: id => G.routeClose(id)
  });
  // штаб у місті: підрозділ і фронт
  { const P = G.LOCS && G.LOCS.city && G.LOCS.city.places.milhq; if (P) {
    P.acts.unit_form = { n: 'Прийняти командування підрозділом', h: 2, c: 0, hide: L => !(milL(L) && L.job.lvl >= 2 && !G.unitOf(L)), need: L => G.unitFormErr(L), r: () => { const r = G.unitForm(); return [r.ok ? r.msg : r.err, { mood: r.ok ? 8 : 0 }, r.ok ? 'jackpot' : null]; } };
    P.acts.unit_fill = { n: 'Поповнити підрозділ до штату', h: 2, c: 0, hide: L => !G.unitOf(L), need: L => { const a = G.unitOf(L); return !a ? 'Немає підрозділу' : a.k >= G.unitCap(L) * 0.97 ? 'Підрозділ укомплектований' : ''; }, r: () => { const r = G.unitFill(); return [r.ok ? r.msg : r.err, {}]; } };
    P.acts.front_go = { n: 'Вирушити на фронт', h: 1, c: 0, hide: L => !milL(L), need: L => G.frontErr(L), r: () => { const r = G.frontGo(); return [r.ok ? r.msg : r.err, { mood: r.ok ? -4 : 0 }]; } };
  } }

  // =====================================================================================================
  G.h29.d.push(() => { unitHousekeeping(); pmcDaily(); survDaily(); routesDaily(); });
  G.h29.m.push(() => { pmcMonthly(); mineMonthly(); routesMonthly(); });
  G.s2 = S;
});
