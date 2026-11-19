// ІНСАЙДИ НА БІРЖІ: зі звʼязками (або через економічну розвідку) приходять «чутки» про компанії — частина правдива.
// Якщо скористатися правдивою чуткою (купити перед злетом / продати перед падінням), Комісія з цінних паперів
// може почати розслідування: штраф, «винен стажер» або дорогі адвокати. Біржові приколи — у новинах.
LORA.sim.register('insider', 99.984, function (G) {
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const pick = a => a[Math.floor(G.rnd() * a.length)];
  const S = () => G.v29s('ins', () => ({ tips: [], tr: [], cases: 0 }));
  const SRC = ['двоюрідна сестра бухгалтерки', 'прибиральниця з поверху ради директорів', 'таксист, який возив CEO', 'друг друга аудитора', 'бариста біля штаб-квартири', 'анонім у чаті «Біржові котики»', 'сусід по дачі', 'стажер, який усе чує', 'ваш перукар', 'охоронець паркінгу'];
  const UP = ['підписують мегаконтракт', 'отримають держзамовлення', 'винайшли щось неймовірне', 'їх поглинає гігант', 'звітність буде рекордною'];
  const DN = ['звітність — катастрофа', 'CEO тікає на Багами', 'завод зупиняють на перевірку', 'головний продукт вибухає (буквально)', 'аудитори знайшли «чорну діру»'];
  function tipFor(w) {
    if (!G.stock) return; const L = G.companies.filter(c => c.alive && G.stock.px[c.id]); if (!L.length) return; const c = pick(L), dir = G.rnd() < 0.5 ? 1 : -1, real = G.rnd() < 0.7;
    const t = { id: G.nextId++, w, cid: c.id, dir, real, d: G.day, at: G.day + 8 + Math.floor(G.rnd() * 18), src: pick(SRC), what: dir > 0 ? pick(UP) : pick(DN) }; S().tips.push(t); return t;
  }
  G.insTips = w => S().tips.filter(t => t.w === w && G.day - t.d < 40);
  // хто отримує чутки: персонаж зі звʼязками, CEO, держава з економічною розвідкою
  function monthly() {
    const P = S(); P.tips = P.tips.filter(t => G.day - t.d < 60); P.tr = P.tr.filter(t => G.day - t.d < 60);
    const w = G.wallet ? G.wallet() : null; if (!w) return; const L = G.leader; let ch = 0.25;
    if (w === 'L' && L) ch = 0.15 + Math.min(0.5, ((L.cont && L.cont[L.home]) || 0) / 120) + (G.skill ? G.skill(L, 'eco') * 0.05 : 0);
    if (w[0] === 'n') { const st = G.v29.spy && G.v29.spy[G.player]; ch = st ? 0.1 + st.ext.lvl * 0.06 : 0.08; }
    if (G.rnd() < ch) { const t = tipFor(w); if (t) { const c = G.companies[t.cid]; G.say(`🤫 Чутка: ${t.src} каже, що «${c.name}» — ${t.what}. ${t.dir > 0 ? 'Акції можуть злетіти' : 'Акції можуть обвалитися'}`, 'info', [G.pv()]); } }
  }
  // реалізація чуток і перевірка торгів
  function daily() {
    const P = S(); if (!G.stock) return;
    P.tips.forEach(t => { if (t.done || t.at > G.day) return; t.done = 1; if (!t.real) { if (t.w === (G.wallet && G.wallet())) G.say(`🤷 Чутка про «${G.companies[t.cid].name}» виявилася пшиком. ${t.src} більше не довіряємо`, 'info', [G.pv()]); return; }
      const px = G.stock.px[t.cid]; if (!px) return; G.stock.px[t.cid] = px * (t.dir > 0 ? 1.18 + G.rnd() * 0.12 : 0.74 + G.rnd() * 0.1); const c = G.companies[t.cid];
      G.say(t.dir > 0 ? `📈 «${c.name}»: ${t.what} — акції злетіли` : `📉 «${c.name}»: ${t.what} — акції обвалилися`, 'info', []);
      // хто торгував у напрямку чутки
      const sus = P.tr.filter(r => r.cid === t.cid && r.w === t.w && r.d >= t.d && r.d <= t.at && Math.sign(r.pct) === t.dir);
      if (sus.length) { const vol = sus.reduce((s, r) => s + Math.abs(r.pct) * r.px, 0); if (G.rnd() < clamp(0.25 + vol * 0.4, 0.25, 0.8)) { P.cases++; const nid = t.w[0] === 'n' ? +t.w.slice(1) : G.pv(); G.decisions.push({ id: G.nextId++, ev: 'ins_case', nid, pers: t.w === 'L', ctx: { text: `🔎 Комісія з цінних паперів підозрює інсайдерську торгівлю акціями «${c.name}» (≈$${vol.toFixed(2)} млрд). Слідчий уже питає, хто такий «${t.src}».`, w: t.w, vol }, d: G.day }); } } });
    P.tips = P.tips.filter(t => !t.done || G.day - t.at < 5);
  }
  const pay = (w, v) => { if (w === 'L') G.leader.money = Math.max(0, G.leader.money - v); else if (w[0] === 'n') N[+w.slice(1)].cash -= v; else { const c = G.companies[+w.slice(1)]; if (c) c.cash -= v; } };
  const EV = G.DEC_EV; if (EV) EV.push({ id: 'ins_case', adv: 'econ', ok: () => false, t: () => null, o: [
    ['Заплатити штраф', (n, c) => { const f = Math.max(0.002, c.vol * 0.5); pay(c.w, f); return `штраф $${(f * 1000).toFixed(0)} млн. Слідчий побажав «успішних інвестицій»`; }],
    ['Звинуватити стажера', (n, c) => { if (G.rnd() < 0.5) return 'стажер узяв усе на себе. Тепер він легенда офісу'; const f = Math.max(0.003, c.vol); pay(c.w, f); if (G.leader && c.w === 'L') G.leader.fame = Math.max(0, G.leader.fame - 3); else n.stab = Math.max(0, n.stab - 2); return `стажер мав алібі (був у відпустці). Подвійний штраф і ганьба в новинах`; }],
    ['Найняти адвокатів', (n, c) => { pay(c.w, 0.002); return G.rnd() < 0.7 ? 'адвокати знайшли кому в протоколі. Справу закрито' : 'адвокати програли, але виставили рахунок. Все одно штраф'; }]] });
  // відстежуємо торги гравця
  if (G.act && G.act.stockTrade) { const b = G.act.stockTrade; G.act.stockTrade = function (cid, pct) { const r = b.apply(this, arguments); try { if (!(r && r.ok === false) && G.stock) S().tr.push({ w: G.wallet(), cid, pct, px: G.stock.px[cid] || 0, d: G.day }); } catch (e) { } return r; }; }
  // біржові приколи
  const JOKES = ['Акції компанії «Нічого не роблю» зросли на 40% — ринок оцінив стабільність', 'Біржовий робот пішов у відпустку, індекси вперше за рік спокійні', 'Брокер помилково купив 10 тонн гречки замість 10 акцій. Каже — так і задумано',
    'Аналітики радять купувати на падінні, продавати на зростанні і не питати їх нічого', 'Хомʼяк-інвестор знову обіграв фонд із мільярдним капіталом', 'Індекс страху впав: трейдери просто втомились боятися'];
  function weekly() { if (G.rnd() < 0.18 && !(typeof AUD !== 'undefined' && AUD.S && AUD.S.humor === false)) G.say('📊 ' + pick(JOKES), 'info', []); }
  G.h29.d.push(daily, () => { if (G.day % 7 === 3) weekly(); }); G.h29.m.push(monthly);
});
