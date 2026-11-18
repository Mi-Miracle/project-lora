// КАР'ЄРА (RPG): персонаж → робота, партія, депутат → власна компанія → президент. Етапи можна пропускати.
// Депутат голосує в парламенті, вносить законопроєкти, робить запити, лобіює; власник компанії отримує дивіденди.
LORA.sim.register('career', 99.66, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const isChar = () => G.leader && G.leader.role === 'char';
  G.JOBS = {
    lawyer:     { n: 'Юрист', ic: '⚖', pay: 0.0015, d: 'звʼязки +, корисно для депутата', k: { cont: 1.5 } },
    journalist: { n: 'Журналіст', ic: '📰', pay: 0.001, d: 'популярність +, запити й розслідування сильніші', k: { pop: 1.5 } },
    officer:    { n: 'Офіцер', ic: '🎖', pay: 0.0012, d: 'повага військових: у війну популярність ×1.5', k: { pop: 1.2 } },
    manager:    { n: 'Топменеджер', ic: '💼', pay: 0.0035, d: 'найбільша зарплата, легше заснувати компанію', k: { money: 1.5 } },
    scientist:  { n: 'Науковець', ic: '🔬', pay: 0.0012, d: 'слава у світі; компанія отримує бонус до R&D', k: { fame: 1.5 } }
  };
  G.CAREER = {
    job:      { n: 'Влаштуватися на роботу', ic: '🧳', cost: 0, days: 3, d: 'щомісячна зарплата, кар\'єрне зростання' },
    party:    { n: 'Заснувати партію', ic: '🎗', cost: 0.05, days: 20, d: 'потрібна популярність ≥ 15; партія — шлях у парламент' },
    campaign: { n: 'Партійна кампанія', ic: '📣', cost: 0.02, days: 10, d: 'рейтинг партії +' },
    mp_run:   { n: 'Балотуватися в депутати', ic: '🗳', cost: 0.01, days: 0, d: 'рейтинг партії ≥ 3% або популярність ≥ 25; вибори — за графіком парламенту' },
    mp_speech:{ n: 'Виступ з трибуни парламенту', ic: '🎙', cost: 0, days: 2, d: 'популярність і вплив у Раді' },
    mp_bill:  { n: 'Внести законопроєкт', ic: '📜', cost: 0.005, days: 14, d: 'шанс ухвалення залежить від вашого впливу й партії' },
    mp_inquiry:{ n: 'Депутатський запит (розслідування)', ic: '🔍', cost: 0, days: 10, d: 'популярність +, звʼязки з урядом −' },
    mp_faction:{ n: 'Створити міжфракційне обʼєднання', ic: '👥', cost: 0.03, days: 30, d: 'вплив у Раді +10' },
    mp_lobby: { n: 'Лобіювати свою компанію', ic: '🏢', cost: 0, days: 7, d: 'вплив вашої компанії в цій країні +' },
    found_co: { n: 'Заснувати компанію', ic: '🏗', cost: 0.2, days: 30, d: 'потрібно ≥ $200 млн: ви стаєте власником, компанія платить вам дивіденди' }
  };
  G.MP_BILLS = [['Знизити податки малому бізнесу', n => { n.pol.tax = Math.max(0.05, n.pol.tax - 0.01); }, 6], ['Підвищити пенсії', n => { n.pol.soc = Math.min(0.35, n.pol.soc + 0.01); n.stab += 1; }, 8], ['Посилити оборону', n => { n.pol.mil = Math.min(0.25, n.pol.mil + 0.005); }, 4], ['Антикорупційний закон', n => { n.stab += 2; }, 5], ['Закон про цифрові послуги', n => { n.mods.push({ growth: 0.001, until: G.day + 730 }); }, 3]];
  G.careerCan = function (k, arg) {
    const L = G.leader; if (!isChar()) return 'Лише для персонажа'; const A = G.CAREER[k]; if (!A) return '?'; if (L.mv) return 'Персонаж у дорозі'; if (L.busy > G.day && A.days) return `Зайнятий ще ${L.busy - G.day} дн.`;
    if (L.money < A.cost) return 'Бракує грошей'; const nid = G.leaderNation(), p = (L.popu[nid] || 0), parl = N[nid] && N[nid].parl;
    if (k === 'job' && (!arg || !G.JOBS[arg])) return 'Оберіть професію'; if (k === 'job' && L.job && L.job.k === arg && L.job.nid === nid) return 'Ви вже тут працюєте';
    if (k === 'party') { if (L.party) return 'У вас уже є партія'; if (p < 15) return `Потрібна популярність ≥ 15 (${p.toFixed(0)})`; }
    if (k === 'campaign' && (!L.party || L.party.nid !== nid)) return 'Партія діє в іншій країні';
    if (k === 'mp_run') { if (L.mp === nid) return 'Ви вже депутат'; if (!parl || parl.regime === 'autocracy') return 'Тут немає вільних виборів'; if (L.mpCand === nid) return 'Ви вже кандидат'; if (!((L.party && L.party.nid === nid && L.party.r >= 3) || p >= 25)) return 'Потрібен рейтинг партії ≥ 3% або популярність ≥ 25'; }
    if (/^mp_(speech|bill|inquiry|faction|lobby)/.test(k) && L.mp !== nid) return 'Лише депутат цієї країни (у ній)';
    if (k === 'mp_lobby' && G.pc < 0) return 'У вас немає компанії';
    if (k === 'mp_faction' && (L.mpF || 0) >= 2) return 'Обʼєднань уже достатньо';
    if (k === 'found_co' && G.pc >= 0) return 'У вас уже є компанія';
    return '';
  };
  G.careerDo = function (k, arg, arg2) {
    const e = G.careerCan(k, arg); if (e) return { ok: false, err: e }; const L = G.leader, A = G.CAREER[k], nid = G.leaderNation(), n = N[nid]; L.money -= A.cost; if (A.days) L.busy = G.day + A.days; let msg = '';
    const add = (o, v) => { o[nid] = clamp((o[nid] || 0) + v * (1 - (o[nid] || 0) / 120), 0, 100); };
    const jk = key => (L.job && G.JOBS[L.job.k].k[key]) || 1;
    if (k === 'job') { L.job = { k: arg, nid, lvl: 1, xp: 0 }; msg = `${G.JOBS[arg].n} у ${n.name}`; }
    if (k === 'party') { L.party = { nid, name: arg || ('Партія «' + (L.name.split(' ')[1] || L.name) + '»'), r: 1 + (L.popu[nid] || 0) * 0.08 }; msg = `засновано ${L.party.name}, рейтинг ${L.party.r.toFixed(1)}%`; }
    if (k === 'campaign') { L.party.r = clamp(L.party.r + 0.6 + (L.popu[nid] || 0) * 0.02, 0, 45); add(L.popu, 1.5); msg = `рейтинг партії ${L.party.r.toFixed(1)}%`; }
    if (k === 'mp_run') { L.mpCand = nid; if (n.parl.next - G.day > 240) { L.mpBy = G.day + 60; msg = `до чергових виборів далеко — ви йдете на довибори в окрузі: ${G.dateStr(L.mpBy)}`; } else msg = `ви кандидат у депутати. Вибори: ${G.dateStr(n.parl.next)}`; }
    if (k === 'mp_speech') { add(L.popu, 3 * jk('pop')); L.mpInfl = clamp((L.mpInfl || 5) + 1.5, 0, 100); msg = `популярність ${L.popu[nid].toFixed(0)}, вплив у Раді ${L.mpInfl.toFixed(0)}`; }
    if (k === 'mp_bill') { const B = G.MP_BILLS[arg != null ? +arg : Math.floor(G.rnd() * G.MP_BILLS.length)]; const ch = clamp(0.15 + (L.mpInfl || 5) / 100 + (L.party ? L.party.r / 60 : 0), 0.1, 0.85); if (G.rnd() < ch) { B[1](n); add(L.popu, B[2]); L.fame = clamp(L.fame + 1, 0, 100); msg = `«${B[0]}» ухвалено! популярність +${B[2]}`; } else { add(L.popu, 1); msg = `«${B[0]}» провалено (шанс був ${(ch * 100).toFixed(0)}%)`; } }
    if (k === 'mp_inquiry') { add(L.popu, 4 * jk('pop')); L.cont[nid] = Math.max(0, (L.cont[nid] || 0) - 4); if (G.rnd() < 0.3) { n.stab -= 1; msg = 'запит викрив корупційну схему! популярність +4'; } else msg = 'запит направлено, популярність +4'; }
    if (k === 'mp_faction') { L.mpF = (L.mpF || 0) + 1; L.mpInfl = clamp((L.mpInfl || 5) + 10, 0, 100); msg = `вплив у Раді ${L.mpInfl.toFixed(0)}`; }
    if (k === 'mp_lobby') { const c = G.myCo(); c.infl[nid] = clamp((c.infl[nid] || 0) + 2 + (L.mpInfl || 5) * 0.08, 0, 100); msg = `вплив «${c.name}» тут ${c.infl[nid].toFixed(0)}`; }
    if (k === 'found_co') { L.money += A.cost; const cash = clamp(arg2 || L.money * 0.85, 0.2, L.money); L.money -= cash; const c = G.startCompany({ name: arg || 'Компанія ' + L.name, sector: G.D.companySectors[arg2s(L)] ? arg2s(L) : 'industry', home: N[nid].a3, cash, hqRegion: L.at }); c.owner = 'me'; c.divs = 0.2; c.infl[nid] = 5 + (L.cont[nid] || 0) * 0.2; G.corpInit && G.corpInit(c); msg = `засновано «${c.name}» з капіталом $${cash.toFixed(2)} млрд`; LORA.bus.emit('takeover', { co: c.id }); }
    G.say(`${A.ic} ${L.name}: ${A.n.toLowerCase()} — ${msg}`, 'good', [nid]); return { ok: true, msg };
  };
  const arg2s = L => L._sector || 'industry';
  G.careerFound = (name, sector, cash) => { if (G.leader) G.leader._sector = sector; return G.careerDo('found_co', name, cash); };
  // щомісяця: зарплата, кар'єра, рейтинг партії, депутатська зарплата, голосування в Раді, дивіденди
  G.careerMonthly = function () {
    Object.values(G.leaders || {}).forEach(L => {
      if (!L || L.role !== 'char') return;
      if (L.job) { const J = G.JOBS[L.job.k]; L.money += J.pay * (1 + (L.job.lvl - 1) * 0.6); L.job.xp += 1; if (L.job.xp >= 6 * L.job.lvl && L.job.lvl < 5) { L.job.lvl++; L.job.xp = 0; if (G.leader === L) G.say(`📈 ${L.name}: підвищення — ${J.n}, рівень ${L.job.lvl}`, 'good'); } const nid = L.job.nid; if (J.k.cont) L.cont[nid] = clamp((L.cont[nid] || 0) + 0.4 * J.k.cont, 0, 100); if (J.k.pop) L.popu[nid] = clamp((L.popu[nid] || 0) + 0.3 * J.k.pop, 0, 100); if (J.k.fame) L.fame = clamp(L.fame + 0.2 * J.k.fame, 0, 100); }
      if (L.mpBy && G.day >= L.mpBy && L.mpCand != null) { L.mpBy = null; const nid = L.mpCand; const save = L.mp; G.careerParlElection(nid); }
      if (L.party) { const P = L.party; P.r = clamp(P.r + ((L.popu[P.nid] || 0) * 0.15 - P.r) * 0.05, 0, 45); }
      if (L.mp != null) { L.money += 0.0006; L.mpInfl = clamp((L.mpInfl || 5) + 0.3, 0, 100); }
      if (G.pc >= 0 && G.companies[G.pc] && G.companies[G.pc].owner === 'me') { const c = G.companies[G.pc]; const d = Math.max(0, c.profitY) * (c.divs || 0) / 12; if (d > 0 && c.cash > d) { c.cash -= d; L.money += d; } }
      // голосування в Раді для депутата: дилема раз на 2–3 місяці
      if (L.mp != null && G.leader === L && G.rnd() < 0.4 && !G.decisions.some(d => d.mp)) {
        const b = pick([['Закон про підвищення податків на оборону', 'tax+'], ['Закон про продовження воєнного стану', 'war'], ['Бюджет на наступний рік', 'budget'], ['Закон про скасування депутатської недоторканності', 'immun'], ['Ратифікація угоди з МВФ', 'imf'], ['Закон про мову й освіту', 'lang']]);
        G.decisions.push({ id: G.nextId++, ev: 'mp_vote', nid: L.mp, mp: true, ctx: { text: `Рада голосує: «${b[0]}». Як голосуєте ви, депутате ${L.name}?`, k: b[1] }, d: G.day });
      }
    });
  };
  // вибори до парламенту: персонаж-кандидат у депутати
  G.careerParlElection = function (nid) {
    Object.values(G.leaders || {}).forEach(L => {
      if (!L || L.role !== 'char') return;
      if (L.mp === nid) { const keep = clamp(0.4 + (L.popu[nid] || 0) / 150 + (L.party && L.party.nid === nid ? L.party.r / 50 : 0), 0.2, 0.95); if (G.rnd() > keep) { L.mp = null; G.say(`🗳 ${L.name} втрачає депутатський мандат`, 'bad'); } else G.say(`🗳 ${L.name} переобраний(а) до парламенту`, 'good'); }
      if (L.mpCand === nid) { L.mpCand = null; const ch = clamp(0.2 + (L.popu[nid] || 0) / 90 + (L.party && L.party.nid === nid ? L.party.r / 25 : 0) + (L.cont[nid] || 0) / 300, 0.08, 0.95);
        if (G.rnd() < ch) { L.mp = nid; L.mpInfl = 5 + (L.party ? L.party.r / 2 : 0); G.say(`🗳 ${L.name} стає депутатом: ${N[nid].parl.name}!`, 'big', [nid]); } else G.say(`🗳 ${L.name} не проходить до парламенту (шанс ${(ch * 100).toFixed(0)}%)`, 'bad', [nid]); }
    });
  };
  // депутатське голосування як рішення
  const EV = G.DEC_EV; if (EV) EV.push({ id: 'mp_vote', adv: 'intern', ok: () => false, t: () => null,
    o: [['За', (n, c) => { const L = G.leader; if (!L) return ''; const pop = { 'tax+': -3, war: 2, budget: 1, immun: 5, imf: -1, lang: 2 }[c.k] || 0; L.popu[n.id] = clamp((L.popu[n.id] || 0) + pop, 0, 100); L.cont[n.id] = clamp((L.cont[n.id] || 0) + 2, 0, 100); return `популярність ${pop >= 0 ? '+' : ''}${pop}, звʼязки з урядом +2`; }],
        ['Проти', (n, c) => { const L = G.leader; if (!L) return ''; const pop = { 'tax+': 3, war: -3, budget: -1, immun: -4, imf: 2, lang: -1 }[c.k] || 0; L.popu[n.id] = clamp((L.popu[n.id] || 0) + pop, 0, 100); L.cont[n.id] = clamp((L.cont[n.id] || 0) - 2, 0, 100); return `популярність ${pop >= 0 ? '+' : ''}${pop}, звʼязки з урядом −2`; }],
        ['Утриматися', () => { const L = G.leader; if (L) L.mpInfl = Math.max(0, (L.mpInfl || 5) - 1); return 'вплив у Раді −1'; }]] });
  // бонус депутата й партії до президентських виборів
  const baseElect = G.charElection;
  G.charElection = function (nid) { const L = G.leader; if (L && L.role === 'char' && L.cand === nid) { const b = (L.mp === nid ? 12 : 0) + (L.party && L.party.nid === nid ? L.party.r * 0.5 : 0); L.popu[nid] = Math.min(100, (L.popu[nid] || 0) + b); } return baseElect(nid); };
  // старт за депутата або за власника компанії
  G.initCareer = function (o) {
    const L = G.leader; if (!L) return; const nid = L.home;
    if (o.stage === 'mp' || o.stage === 'owner') { L.money = Math.max(L.money, o.stage === 'owner' ? 0.5 : 0.25); L.popu[nid] = 30; L.cont[nid] = 30; L.fame = 12; }
    if (o.stage === 'mp') { L.party = { nid, name: 'Партія «' + (L.name.split(' ')[1] || L.name) + '»', r: 6 }; L.mp = nid; L.mpInfl = 12; L.job = { k: 'lawyer', nid, lvl: 2, xp: 0 }; G.say(`🗳 ${L.name} — депутат парламенту: ${N[nid].name}`, 'big', [nid]); }
    if (o.stage === 'owner') { L.job = { k: 'manager', nid, lvl: 3, xp: 0 }; L._sector = o.sector || 'tech'; L.money = 2.2; G.careerDo('found_co', o.coName || null, 1.8); L.busy = 0; }
  };
  G.act.careerDo = (k, a, b) => G.careerDo(k, a, b);
  G.act.charDo = (k, p) => G.charDo(k, p);
  G.act.careerFound = (n, s, c) => G.careerFound(n, s, c);
});
