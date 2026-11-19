// СЕЗОНИ Й ПОГОДА: зима (за 45° широти) і бездоріжжя (весна/осінь у помірному поясі) сповільнюють армії;
// влітку — лісові пожежі в лісах і степах; навесні — повені на річках. На мапі: сніг, багнюка, вогонь.
LORA.sim.register('seasons2', 99.99, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const isH = id => G.isHuman ? G.isHuman(id) : id === G.player;
  const S = () => G.v29s('wx', () => ({ fire: {}, flood: {} }));
  let cache = { d: -1, a: null };
  G.seasonArr = function () { if (cache.d === G.day && cache.a) return cache.a; const a = new Array(T.length); if (G.season) for (let i = 0; i < T.length; i++) a[i] = G.season(i); cache = { d: G.day, a }; return a; };
  G.seasonSpeed = i => { const s = G.seasonArr()[i]; if (!s) return 1; return 1 - 0.25 * s.winter - 0.35 * s.mud; };
  G.fireAt = i => (S().fire[i] || 0) > G.day; G.rflood = i => (S().flood[i] || 0) > G.day;
  function monthly() {
    const P = S(), m = G.month ? G.month() : 0; for (const k in P.fire) if (P.fire[k] <= G.day) delete P.fire[k]; for (const k in P.flood) if (P.flood[k] <= G.day) delete P.flood[k];
    const warm = (G.climate && G.climate.t) || 1.3;
    // пожежі: північне літо (черв.–серп.) або південне (груд.–лют.)
    const cand = T.map((r, i) => i).filter(i => { const lat = T[i].c[1], tr = T[i].t; const sum = lat > 0 ? m >= 5 && m <= 7 : (m === 11 || m <= 1); return sum && (tr === 'forest' || tr === 'steppe' || tr === 'plains') && Math.abs(lat) > 25 && Math.abs(lat) < 62; });
    const nF = cand.length ? Math.floor(G.rnd() * (2 + (warm - 1.2) * 8)) : 0;
    for (let k = 0; k < nF; k++) { const i = pick(cand); if (P.fire[i]) continue; P.fire[i] = G.day + 20 + Math.floor(G.rnd() * 25); const t = ter[i]; t.gdp *= 0.994; const o = t.ctrl;
      if (isH(o)) { G.say(`🔥 Лісова пожежа: «${T[i].n}». ${pick(['Пожежники працюють цілодобово', 'Гелікоптери черпають воду з усіх ставків, навіть дачних', 'Місцеві рятують котів і самогонні апарати'])}`, 'bad', [o]); G.fx29 && G.fx29('wildfire', { where: T[i].n }); } }
    // весняні повені
    if (m === 2 || m === 3) { const riv = T.map((r, i) => i).filter(i => T[i].t === 'plains' && Math.abs(T[i].c[1]) > 40); const nR = Math.floor(G.rnd() * 3); for (let k = 0; k < nR; k++) { const i = pick(riv); if (i == null || P.flood[i]) continue; P.flood[i] = G.day + 25; ter[i].gdp *= 0.996; if (isH(ter[i].ctrl)) G.say(`💧 Весняна повінь: «${T[i].n}». Річка вийшла погуляти`, 'bad', [ter[i].ctrl]); } }
    // сезонні жарти для гравця
    if (G.player >= 0 && G.rnd() < 0.35 && !(typeof AUD !== 'undefined' && AUD.S && AUD.S.humor === false)) { const J = { 0: 'Зима: комунальники здивовані, що випав сніг. Щороку', 1: 'Лютий: генерали радять арміям «одягатися тепліше»', 2: 'Березень: бездоріжжя. Танки застрягли, трактори їх витягують', 3: 'Квітень: перші шашлики в парламенті', 4: 'Травень: депутати масово пішли на дачі «працювати з виборцями»', 5: 'Червень: уряд оголосив сезон морозива відкритим', 6: 'Липень: спека, кондиціонер у міністерстві — головний союзник', 7: 'Серпень: урожай гарбузів б’є рекорди. Гарбузи — теж', 8: 'Вересень: усі пишуть «з понеділка почну»', 9: 'Жовтень: осінь, листопад і багнюка по коліно', 10: 'Листопад: сезон чаю з малиною і бюджетних суперечок', 11: 'Грудень: міністерства прикрашають ялинки звітами' }; G.say('🗓 ' + J[m], 'info', []); }
  }
  G.h29.m.push(monthly);
});
