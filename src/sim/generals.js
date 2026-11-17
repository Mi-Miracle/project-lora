// ГЕНЕРАЛИ: у кожної держави з армією є командувачі з навичкою (1–5) і рисою. Генерала призначають на армію:
// навичка дає до +10% сили, риса — свою особливість. У боях генерали набираються досвіду (навичка росте),
// можуть загинути. ШІ сам ставить найкращих на найбільші армії на фронті. Імена вигадані.
LORA.sim.register('generals', 62, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp;
  const TR = G.D.genTraits = {
    attack:  { n: 'Наступальний', ic: '⚔', d: 'наступ +10%' },
    defense: { n: 'Оборонець', ic: '🛡', d: 'оборона +10%' },
    armor:   { n: 'Танкіст', ic: '🚜', d: 'танки й БМП армії +20%' },
    urban:   { n: 'Штурмовик міст', ic: '🏙', d: 'штраф наступу в містах удвічі менший' },
    logist:  { n: 'Логіст', ic: '📦', d: 'постачання й організованість армії відновлюються швидше' },
    art:     { n: 'Артилерист', ic: '💥', d: 'артпідготовка вдвічі швидша' },
    cautious:{ n: 'Обережний', ic: '🧭', d: 'оборона +6%, наступ −4%, гине рідше' },
    bold:    { n: 'Зухвалий', ic: '🔥', d: 'наступ +14%, оборона −4%, ризикує частіше' }
  };
  const TK = Object.keys(TR);
  const POOL = {
    ua: { f: ['Олег', 'Андрій', 'Віктор', 'Тарас', 'Роман', 'Юрій', 'Богдан', 'Дмитро', 'Василь', 'Ольга', 'Наталія', 'Остап'], l: ['Кравченко', 'Литвин', 'Савчук', 'Мороз', 'Гнатюк', 'Остапенко', 'Дорошенко', 'Яковенко', 'Білик', 'Сидоренко', 'Захарченко', 'Пилипчук', 'Король', 'Ткачук', 'Бойко', 'Гордієнко'] },
    ru: { f: ['Олег', 'Сергій', 'Михайло', 'Ігор', 'Дмитро', 'Павло', 'Микола', 'Віталій', 'Олексій', 'Геннадій'], l: ['Соколов', 'Волков', 'Орлов', 'Лебедєв', 'Морозов', 'Зайцев', 'Павлов', 'Голубєв', 'Виноградов', 'Богданов', 'Воробйов', 'Федоров'] },
    pl: { f: ['Jan', 'Piotr', 'Tomasz', 'Pavel', 'Marek', 'Jiří', 'Stefan', 'Ana', 'Milan', 'Dragan'], l: ['Nowak', 'Kowalski', 'Wiśniewski', 'Dvořák', 'Horvat', 'Novotný', 'Petrović', 'Kováč', 'Zieliński', 'Jovanović'] },
    west: { f: ['James', 'Robert', 'Michael', 'David', 'Thomas', 'Mark', 'Paul', 'Anne', 'Laura', 'Henri', 'Klaus', 'Marco', 'Erik', 'Pierre'], l: ['Harlan', 'Whitford', 'Brenner', 'Castell', 'Moreau', 'Lindqvist', 'Hartmann', 'Rossi', 'Calloway', 'Ashford', 'Delacroix', 'Vance', 'Reinholt', 'Sorensen', 'Barlow', 'Kessler'] },
    asia: { f: ['Wei', 'Jun', 'Hiro', 'Min', 'Arjun', 'Ravi', 'Kenji', 'Li', 'Tae', 'Anh', 'Rahul', 'Bao'], l: ['Zhao', 'Tanaka', 'Park', 'Nguyen', 'Sharma', 'Chen', 'Kato', 'Kim', 'Singh', 'Liu', 'Mori', 'Rao'] },
    mena: { f: ['Ahmad', 'Omar', 'Karim', 'Yusuf', 'Hassan', 'Tariq', 'Leila', 'Samir', 'Murat', 'Emre', 'Reza', 'Amir'], l: ['Haddad', 'Nasser', 'Rahimi', 'Aydin', 'Mansour', 'Khalil', 'Demir', 'Farouk', 'Saleh', 'Yilmaz', 'Karimi', 'Aziz'] },
    lat:  { f: ['Carlos', 'Diego', 'João', 'Luis', 'Mateo', 'Rafael', 'Ana', 'Lucia', 'Pablo', 'Andrés'], l: ['Herrera', 'Mendoza', 'Silva', 'Castro', 'Ortega', 'Navarro', 'Ribeiro', 'Vargas', 'Rojas', 'Campos'] },
    afr:  { f: ['Kwame', 'Abdou', 'Sipho', 'Chidi', 'Moussa', 'Amara', 'Tunde', 'Kofi', 'Zola', 'Ibrahim'], l: ['Mensah', 'Diallo', 'Okafor', 'Ndlovu', 'Traoré', 'Banda', 'Adeyemi', 'Kamara', 'Mwangi', 'Keita'] }
  };
  const UA = ['UKR', 'MDA'], RU = ['RUS', 'BLR', 'KAZ'], SLAV = 'POL CZE SVK BGR SRB HRV SVN MKD MNE BIH'.split(' '), WEST = 'USA GBR CAN AUS NZL DEU FRA ITA ESP PRT NLD BEL CHE AUT SWE NOR DNK FIN IRL ISL GRC LUX EST LVA LTU HUN ROU ISR'.split(' '), ASIA = 'CHN JPN KOR PRK TWN IND PAK BGD VNM THA MMR KHM LAO MYS IDN PHL SGP MNG NPL LKA'.split(' '), LAT = 'BRA ARG CHL COL PER VEN MEX CUB ECU BOL URY PRY GTM HND NIC SLV CRI PAN DOM'.split(' '), MENA = 'TUR IRN IRQ SYR SAU ARE QAT KWT OMN YEM JOR LBN EGY LBY TUN DZA MAR AFG AZE ARM GEO UZB TKM TJK KGZ SDN'.split(' ');
  const poolOf = a3 => UA.includes(a3) ? POOL.ua : RU.includes(a3) ? POOL.ru : SLAV.includes(a3) ? POOL.pl : WEST.includes(a3) ? POOL.west : ASIA.includes(a3) ? POOL.asia : LAT.includes(a3) ? POOL.lat : MENA.includes(a3) ? POOL.mena : POOL.afr;
  G.generals = G.generals || [];
  // транслітерація для англійської версії
  const TL = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', 'ʼ': '' };
  const tl = x => x.split('').map(ch => { const lo = ch.toLowerCase(), r = TL[lo]; if (r == null) return ch; return ch !== lo ? r.charAt(0).toUpperCase() + r.slice(1) : r; }).join('');
  const gn = name => LORA.lang === 'en' ? tl(name) : name;
  function mkGen(n, skill) {
    const P = poolOf(n.a3), r = () => G.rnd(); const used = new Set(G.generals.filter(g => g.n === n.id).map(g => g.name));
    let name; for (let k = 0; k < 12; k++) { name = P.f[Math.floor(r() * P.f.length)][0] + '. ' + P.l[Math.floor(r() * P.l.length)]; if (!used.has(name)) break; }
    name = gn(name); const g = { id: G.nextId++, n: n.id, name, skill: skill || 1 + Math.floor(r() * 3), trait: TK[Math.floor(r() * TK.length)], xp: 0, army: null, wins: 0 };
    G.generals.push(g); return g;
  }
  const want = n => { const k = G.armies.filter(a => a.n === n.id).length; return k ? Math.min(8, Math.max(2, Math.ceil(k * 0.6))) : 0; };
  G.initGenerals = function () { G.generals = []; N.forEach(n => { if (!n.alive) return; const w = want(n); for (let k = 0; k < w; k++) mkGen(n, k === 0 ? 3 + Math.floor(G.rnd() * 2) : 0); }); autoAssign(true); };
  let _gm = null, _gmN = -1; G.generalOf = a => { if (!a || a.gen == null) return null; if (_gmN !== G.generals.length || !_gm || !_gm.has(a.gen)) { _gm = new Map(G.generals.map(g => [g.id, g])); _gmN = G.generals.length; } return _gm.get(a.gen) || null; };
  G.gensOf = nid => G.generals.filter(g => g.n === nid);
  G.assignGeneral = function (armyId, genId) {
    const a = G.armies.find(x => x.id === armyId); if (!a || a.n !== G.player) return { ok: false, err: 'Немає армії' };
    if (genId == null) { const o = G.generalOf(a); if (o) o.army = null; a.gen = null; return { ok: true }; }
    const g = G.generals.find(x => x.id === genId); if (!g || g.n !== a.n) return { ok: false, err: 'Немає генерала' };
    const old = G.generalOf(a); if (old) old.army = null; if (g.army != null) { const b = G.armies.find(x => x.id === g.army); if (b) b.gen = null; }
    g.army = a.id; a.gen = g.id; a.org = Math.min(a.org, 0.85); return { ok: true };
  };
  // множник сили від генерала
  G.genMult = function (a, attack) {
    const g = G.generalOf(a); if (!g) return 1; let m = 1 + g.skill * 0.02;
    const t = g.trait; if (attack) { if (t === 'attack') m *= 1.1; if (t === 'cautious') m *= 0.96; if (t === 'bold') m *= 1.14; if (t === 'urban' && G.urbanDef) m *= 1 + (G.urbanDef(a.t) || 0) * 0.25; }
    else { if (t === 'defense') m *= 1.1; if (t === 'cautious') m *= 1.06; if (t === 'bold') m *= 0.96; }
    if (t === 'armor') { const c = G.armyComp(a); m *= 1 + (c.mbt + c.ifv) * 0.2; }
    return m;
  };
  const basePow = G.armyPower;
  G.armyPower = function (a) { const p = basePow(a); if (a.gen == null) return p; return p * G.genMult(a, G.atWar(ter[a.t].ctrl, a.n)); };
  function autoAssign(all) {
    N.forEach(n => {
      if (!n.alive || (!all && G.isHuman(n.id) && !G.autoPlayer)) return;
      const gens = G.gensOf(n.id).sort((x, y) => y.skill - x.skill); if (!gens.length) return;
      const arms = G.armies.filter(a => a.n === n.id).sort((x, y) => (y.atFront ? 1e6 : 0) + y.k - (x.atFront ? 1e6 : 0) - x.k);
      gens.forEach(g => { g.army = null; }); arms.forEach(a => { a.gen = null; });
      gens.forEach((g, k) => { const a = arms[k]; if (a) { a.gen = g.id; g.army = a.id; } });
    });
  }
  G.generalsDaily = function () {
    const hot = new Set(G.battles || []); const AM = new Map(); for (const a of G.armies) AM.set(a.id, a);
    for (const g of G.generals) {
      const a = g.army != null ? AM.get(g.army) : null;
      if (!a) { g.army = null; continue; }
      if (g.trait === 'logist') { a.org = Math.min(1, a.org + 0.004); a.sup = Math.min(1, (a.sup || 1) + 0.003); }
      if (g.trait === 'art' && a.prep != null && a.prep < 1 && a.atFront) a.prep = Math.min(1, a.prep + 0.01);
      if (hot.has(a.t)) g.xp += 1;
    }
    if (G.day % 30 !== 25) return;
    // щомісяця: досвід → навичка, загибель, нові генерали, перепризначення ШІ
    for (const g of G.generals.slice()) {
      const a = g.army != null ? AM.get(g.army) : null; const P = G.isHuman(g.n);
      if (g.xp >= 20 && g.skill < 5 && G.rnd() < 0.35) { g.skill++; g.xp = 0; g.wins++; if (P || g.skill >= 5) G.say(`🎖 Генерал ${g.name} (${N[g.n].name}) відзначився в боях — навичка ${'★'.repeat(g.skill)}`, P ? 'good' : 'info', [g.n]); }
      if (a && g.xp > 3) { const risk = 0.006 * (g.trait === 'bold' ? 2 : g.trait === 'cautious' ? 0.5 : 1); if (G.rnd() < risk) { G.generals = G.generals.filter(x => x !== g); a.gen = null; a.org = Math.max(0.2, a.org - 0.15); G.say(`🕯 Загинув генерал ${g.name} (${N[g.n].name}), командувач «${a.name}»`, P ? 'bad' : 'war', [g.n]); } }
    }
    N.forEach(n => { if (!n.alive) return; const have = G.gensOf(n.id).length, w = want(n); if (have < w && G.rnd() < 0.5) { const g = mkGen(n); if (G.isHuman(n.id)) G.say(`🎖 Нове призначення: генерал ${g.name} — ${TR[g.trait].n.toLowerCase()}, ${'★'.repeat(g.skill)}`, 'info', [n.id]); } });
    autoAssign(false);
  };
});
