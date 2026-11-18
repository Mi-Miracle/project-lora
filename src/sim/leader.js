// ЛІДЕР НА МАПІ: персонаж гравця (президент держави, CEO компанії або вільний персонаж), що фізично подорожує світом.
// Домовлятися з країною (союз, торгівля, доступ, покращення відносин, лобізм, офіси) можна лише особисто — коли лідер у ній.
// Режим «за персонажа»: власний геймплей — зв'язки, популярність, гроші, посередництво; мета — стати главою держави на виборах.
LORA.sim.register('leader', 92, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const hav = (a, b) => { const r = Math.PI / 180, [lo1, la1] = T[a].c, [lo2, la2] = T[b].c; const s = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); };
  G.D.charTypes = {
    diplomat: { n: 'Дипломат', ic: '🎩', d: 'Зв\'язки з елітами ростуть удвічі швидше', cash: 0.08, k: { contacts: 2, pop: 1, money: 1 } },
    tycoon:   { n: 'Бізнесмен', ic: '💼', d: 'Більше грошей з консультацій і угод', cash: 0.4, k: { contacts: 1, pop: 0.8, money: 2.2 } },
    star:     { n: 'Медійна зірка', ic: '🎤', d: 'Популярність серед виборців росте вдвічі швидше', cash: 0.15, k: { contacts: 0.8, pop: 2.2, money: 1.2 } },
    general:  { n: 'Генерал у відставці', ic: '🎖', d: 'Повага у країнах, що воюють: звʼязки й популярність там ×2', cash: 0.06, k: { contacts: 1.2, pop: 1.2, money: 0.8 } }
  };
  // кожен гравець-людина має свого лідера; G.leader — лідер «поточного» гравця (G.player або 'me' для персонажа/CEO)
  G.leaders = {}; const lkey = () => G._lk != null ? G._lk : G.player >= 0 ? G.player : 'me';
  Object.defineProperty(G, 'leader', { get: () => G.leaders[lkey()] || null, set: v => { if (v) G.leaders[lkey()] = v; else delete G.leaders[lkey()]; }, configurable: true });
  G.initLeader = function (o) {
    const home = o.home; const at = o.at != null ? o.at : (N[home].home != null ? N[home].home : ter.findIndex(t => t.owner === home));
    G.leader = { name: o.name, role: o.role, home, at, mv: null, lastVisit: {}, abroad: 0, ic: o.ic || '⭐' };
    if (o.role === 'char') { const ct = G.D.charTypes[o.type] || G.D.charTypes.diplomat; Object.assign(G.leader, { type: o.type, money: ct.cash, fame: 5, cont: {}, popu: {}, busy: 0, log: [] }); G.leader.cont[home] = 15; G.leader.popu[home] = 8; }
  };
  G.leaderNation = () => G.leader && !G.leader.mv ? ter[G.leader.at].ctrl : -1;
  G.leaderIn = nid => !G.leader || G.leaderNation() === nid; // без лідера (тести/автопілот) обмежень немає
  G.travelTime = function (to) { const L = G.leader; const d = hav(L.at, to); return Math.max(1, Math.round(0.6 + d / 3500 + (d > 300 ? 0.5 : 0))); };
  G.leaderGo = function (to) {
    const L = G.leader; if (!L) return { ok: false, err: 'Немає лідера' }; if (L.mv) return { ok: false, err: 'Лідер уже в дорозі' };
    const c = ter[to].ctrl, me = G.player >= 0 ? G.player : L.home;
    if (c !== me && G.atWar(me, c)) return { ok: false, err: 'Не можна летіти до ворожої держави' };
    if (L.role === 'char' && L.money < 0.002) return { ok: false, err: 'Немає грошей на переліт' };
    const days = G.travelTime(to); L.mv = { from: L.at, to, start: G.day, arrive: G.day + days }; if (L.role === 'char') L.money -= 0.001 + days * 0.0005;
    return { ok: true, days };
  };
  function arrive(L) {
    L.at = L.mv.to; L.mv = null; const nid = ter[L.at].ctrl; const me = L.role === 'president' ? L.home : -1;
    const fresh = !(L.lastVisit[nid] > G.day - 180); L.lastVisit[nid] = G.day;
    if (me >= 0 && nid !== me && fresh) { G.rel[nid][me] = clamp(G.rel[nid][me] + 6, -100, 100); G.rel[me][nid] = clamp(G.rel[me][nid] + 6, -100, 100); }
    if (L.role === 'char') { L.cont[nid] = L.cont[nid] || 0; L.popu[nid] = L.popu[nid] || 0; }
    const hot = (G.battles || []).includes(L.at);
    if (hot && G.rnd() < 0.25) { if (me >= 0) N[me].stab = Math.max(0, N[me].stab - 3); G.say(`💥 ${L.name} потрапив під обстріл у ${T[L.at].n} — вцілів`, 'bad', [nid]); }
    G.say(`✈ ${L.name} прибув: ${T[L.at].n}, ${N[nid].name}${me >= 0 && nid !== me && fresh ? ' — офіційний візит, відносини +6' : ''}`, 'info', [nid, me >= 0 ? me : nid]);
    LORA.bus.emit('leaderArrive', { nid });
  }
  G.leaderDaily = function () {
    Object.values(G.leaders).forEach(L => {
      if (L.mv && G.day >= L.mv.arrive) arrive(L);
      const me = L.role === 'president' ? L.home : -1; if (me >= 0) { const away = L.mv || ter[L.at].ctrl !== me; L.abroad = away ? L.abroad + 1 : 0; if (L.abroad > 21) N[me].stab = Math.max(0, N[me].stab - 0.03); }
      if (L.role === 'char') charDaily(L);
    });
  };
  // ---- обмеження дипломатії присутністю лідера
  const GATE = { improve: 'покращувати відносини', treaty: 'укладати торговельні угоди', alliance: 'укладати союз', access: 'домовлятися про військовий доступ' };
  const active = (k, x) => k === 'alliance' ? G.allied(G.player, x) : k === 'access' ? G.access.has(G.player + '>' + x) : k === 'treaty' ? G.treaties.has(G.warKey(G.player, x)) : false; // розірвати можна й дистанційно
  Object.keys(GATE).forEach(k => { const base = G.act[k]; if (!base) return; G.act[k] = x => { if (G.leaderBlocks(x, k) && !active(k, x)) return { ok: false, err: `Щоб ${GATE[k]}, ${G.leader.name} має особисто приїхати в ${N[x].name}` }; return base(x); }; });
  G.leaderBlocks = (x) => G.leader && G.leader.role !== 'char' && !G.leaderIn(x);
  // компанія: лобізм і офіси — лише особисто
  const bLob = G.coLobby, bOff = G.coOpenOffice;
  G.coLobby = function (c, nid, amt) { if (c.id === G.pc && G.leader && G.leader.role === 'ceo' && !G.leaderIn(nid)) return { ok: false, err: `CEO має бути в країні: ${N[nid].name}` }; return bLob(c, nid, amt); };
  G.coOpenOffice = function (c, i) { if (c.id === G.pc && G.leader && G.leader.role === 'ceo' && !G.leaderIn(ter[i].ctrl)) return { ok: false, err: `Щоб купити офіс, CEO має приїхати в ${N[ter[i].ctrl].name}` }; return bOff(c, i); };

  // ---- геймплей персонажа
  G.charActions = {
    meet:    { n: 'Зустрічі з елітами', ic: '🤝', days: 5, cost: 0.004, d: '+звʼязки в країні' },
    speech:  { n: 'Публічний виступ', ic: '🎤', days: 3, cost: 0.002, d: '+популярність серед виборців' },
    social:  { n: 'Соцмережі й стріми', ic: '📱', days: 5, cost: 0, d: 'популярність тим вища, чим кращий інтернет у країні' },
    charity: { n: 'Благодійний фонд', ic: '💝', days: 10, cost: 0.03, d: 'популярність і слава; відносини з урядом' },
    book:    { n: 'Написати книгу', ic: '📖', days: 60, cost: 0, d: 'довго, але дає гроші й славу по всьому світу' },
    lecture: { n: 'Лекції й інтервʼю', ic: '🎓', days: 7, cost: 0, d: 'невеликий заробіток будь-де (без звʼязків); трохи популярності' },
    consult: { n: 'Консультувати уряд', ic: '📊', days: 10, cost: 0, d: 'заробіток, потрібні звʼязки ≥ 20' },
    broker:  { n: 'Посередництво в угоді', ic: '📑', days: 14, cost: 0.003, d: 'зблизити дві країни, де маєте звʼязки ≥ 30: гроші й слава' },
    invest:  { n: 'Інвестувати в місцевий бізнес', ic: '🏦', days: 2, cost: 0.05, d: 'пасивний дохід і звʼязки' },
    run:     { n: 'Балотуватися на виборах', ic: '🗳', days: 0, cost: 0.03, d: 'потрібні популярність ≥ 45 і звʼязки ≥ 40; вибори — за графіком парламенту' },
    snap:    { n: 'Вимагати дострокових виборів', ic: '📣', days: 20, cost: 0.06, d: 'ви кандидат, популярність ≥ 55 і звʼязки ≥ 55: мітинги й тиск на парламент; що нижча стабільність, то вищий шанс' }
  };
  G.charCan = function (k, partner) {
    const L = G.leader; if (!L || L.role !== 'char') return 'Немає персонажа'; if (L.mv) return 'Персонаж у дорозі'; if (L.busy > G.day) return `Зайнятий ще ${L.busy - G.day} дн.`;
    const nid = G.leaderNation(), A = G.charActions[k]; if (L.money < A.cost) return 'Бракує грошей';
    const c = L.cont[nid] || 0, p = L.popu[nid] || 0;
    if (k === 'consult' && c < 20) return 'Потрібні звʼязки ≥ 20';
    if (k === 'broker') { if (c < 30) return 'Потрібні звʼязки ≥ 30 тут'; if (partner == null || (L.cont[partner] || 0) < 30 || partner === nid) return 'Оберіть другу країну, де звʼязки ≥ 30'; const bk = G.warKey(nid, partner); if (L.brk && L.brk[bk] > G.day) return `Ці країни щойно уклали угоду — наступна через ${L.brk[bk] - G.day} дн.`; }
    if (k === 'snap') { if (L.cand !== nid) return 'Спершу зареєструйтеся кандидатом тут'; if (p < 55 || c < 55) return `Потрібні популярність ≥ 55 (${p.toFixed(0)}) і зв'язки ≥ 55 (${c.toFixed(0)})`; const pr = N[nid].parl; if (!pr || pr.next - G.day < 90) return 'Вибори й так скоро'; }
    if (k === 'run') { if (G.player >= 0) return 'Ви вже глава держави'; if (p < 45 || c < 40) return `Потрібні популярність ≥ 45 (${p.toFixed(0)}) і зв'язки ≥ 40 (${c.toFixed(0)})`; if (L.cand === nid) return 'Ви вже кандидат'; if (N[nid].parl && N[nid].parl.regime === 'autocracy') return 'В автократії немає вільних виборів — потрібні звʼязки ≥ 80 для «призначення»'; }
    return '';
  };
  G.charDo = function (k, partner) {
    const err = G.charCan(k, partner); if (err && !(k === 'run' && /автократії/.test(err) && (G.leader.cont[G.leaderNation()] || 0) >= 80)) return { ok: false, err };
    const L = G.leader, nid = G.leaderNation(), A = G.charActions[k], ct = G.D.charTypes[L.type], war = G.enemiesOf(nid).length > 0;
    const km = key => ct.k[key] * (L.type === 'general' && war && key !== 'money' ? 2 : 1);
    L.money -= A.cost; L.busy = G.day + A.days; let msg = '';
    const add = (o, v, cap) => { o[nid] = clamp((o[nid] || 0) + v * (1 - (o[nid] || 0) / (cap || 120)), 0, 100); };
    if (k === 'meet') { add(L.cont, 7 * km('contacts')); msg = `зв'язки в ${N[nid].name}: ${L.cont[nid].toFixed(0)}`; }
    if (k === 'speech') { add(L.popu, 6 * km('pop')); L.fame = clamp(L.fame + 0.5, 0, 100); msg = `популярність: ${L.popu[nid].toFixed(0)}`; }
    if (k === 'social') { add(L.popu, (2 + 4 * (N[nid].net || 0.4)) * km('pop')); L.fame = clamp(L.fame + 0.3, 0, 100); msg = `популярність: ${L.popu[nid].toFixed(0)} (інтернет ${Math.round((N[nid].net || 0) * 100)}%)`; }
    if (k === 'charity') { add(L.popu, 5); add(L.cont, 2); L.fame = clamp(L.fame + 2, 0, 100); msg = `популярність: ${L.popu[nid].toFixed(0)}, слава +2`; }
    if (k === 'book') { const pay = 0.02 + L.fame * 0.0015; L.money += pay; L.fame = clamp(L.fame + 4, 0, 100); for (const q in L.popu) L.popu[q] = Math.min(100, L.popu[q] + 1.5); msg = `наклад розійшовся: +$${(pay * 1000).toFixed(0)} млн, слава +4`; }
    if (k === 'lecture') { const pay = (0.003 + L.fame * 0.00008) * km('money'); L.money += pay; add(L.popu, 1); msg = `гонорар $${(pay * 1000).toFixed(0)} млн`; }
    if (k === 'consult') { const pay = (0.004 + N[nid].agg.gdp * 0.00002) * km('money'); L.money += pay; add(L.cont, 2); msg = `гонорар $${(pay * 1000).toFixed(0)} млн`; }
    if (k === 'broker') { const pay = (0.01 + (N[nid].agg.gdp + N[partner].agg.gdp) * 0.000015) * km('money'); L.money += pay; L.fame = clamp(L.fame + 3, 0, 100); G.rel[nid][partner] = clamp(G.rel[nid][partner] + 8, -100, 100); G.rel[partner][nid] = clamp(G.rel[partner][nid] + 8, -100, 100);
      L.brk = L.brk || {}; L.brk[G.warKey(nid, partner)] = G.day + 90; add(L.popu, 3); msg = `угода ${N[nid].name} — ${N[partner].name}: відносини +8, гонорар $${(pay * 1000).toFixed(0)} млн`; }
    if (k === 'invest') { L.inv = L.inv || {}; L.inv[nid] = (L.inv[nid] || 0) + A.cost; add(L.cont, 3); msg = `вкладено $${(A.cost * 1000).toFixed(0)} млн`; }
    if (k === 'snap') { L.snapP = L.snapP || {}; const pr = N[nid].parl, ch = clamp(0.15 + (60 - N[nid].stab) / 80 + (L.popu[nid] - 55) / 60 + (L.snapP[nid] || 0), 0.15, 0.85); if (G.rnd() < ch) { pr.next = G.day + 75; L.snapP[nid] = 0; msg = `парламент призначив дострокові вибори: ${G.dateStr(pr.next)}`; } else { L.popu[nid] = Math.max(0, L.popu[nid] - 3); L.snapP[nid] = (L.snapP[nid] || 0) + 0.06; msg = `влада вистояла (шанс був ${(ch * 100).toFixed(0)}%), популярність −3; тиск на владу росте`; } }
    if (k === 'run') { L.cand = nid; const p = N[nid].parl; msg = `ви — кандидат у ${N[nid].name}. Вибори: ${p ? G.dateStr(p.next) : 'скоро'}`; }
    G.say(`${A.ic} ${L.name}: ${A.n.toLowerCase()} — ${msg}`, 'good', [nid]);
    return { ok: true, msg };
  };
  function charDaily(L) {
    if (G.day % 30 === 0) { let inc = 0; for (const k in (L.inv || {})) if (N[k].alive) inc += L.inv[k] * 0.012 * (0.6 + N[k].stab / 150); L.money += inc;
      for (const k in L.popu) L.popu[k] = Math.max(0, L.popu[k] - 0.6); for (const k in L.cont) L.cont[k] = Math.max(0, L.cont[k] - 0.3); }
  }
  // вибори (кличе парламент): чи переміг персонаж
  G.charElection = function (nid) {
    const L = G.leader; if (!L || L.role !== 'char' || L.cand !== nid || G.player >= 0) return false;
    const p = (L.popu[nid] || 0), c = (L.cont[nid] || 0), chance = clamp((p - 35) / 45 * 0.7 + (c - 40) / 60 * 0.3 + (L.fame / 400), 0.03, 0.92);
    L.cand = null;
    if (G.rnd() < chance) { const key = Object.keys(G.leaders).find(k => G.leaders[k] === L); delete G.leaders[key]; G.leaders[nid] = L; G.humans.add(nid); L.role = 'president'; L.home = nid; G.armies.forEach(a => { if (a.n === nid) a.auto = true; });
      if (key !== 'me') { G.say(`🗳 Сенсація! ${L.name} перемагає на виборах і стає главою держави: ${N[nid].name}`, 'big', [nid]); LORA.bus.emit('guestPresident', { lk: key, n: nid }); return true; } G.player = nid;
      G.say(`🗳 Сенсація! ${L.name} перемагає на виборах і стає главою держави: ${N[nid].name}`, 'big', [nid]); LORA.bus.emit('takeover', { n: nid, char: true }); return true; }
    G.say(`🗳 ${L.name} програє вибори в ${N[nid].name} (шанс був ${(chance * 100).toFixed(0)}%)`, 'bad', [nid]); L.popu[nid] *= 0.7; return false;
  };
  G.leaderSave = () => G.leader;
});
