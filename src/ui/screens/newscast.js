// ЩОМІСЯЧНИЙ ВИПУСК НОВИН «LORA NEWS»: піксельна ведуча розповідає головне за місяць (друк тексту, озвучування браузером, біжучий рядок).
const NEWSCAST = (() => {
  let lastMonth = -1, st = null;
  const MON = { uk: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
  const clean = s => t_(s).replace(/^[\p{Extended_Pictographic}️\s]+/u, '').replace(/[\p{Extended_Pictographic}️]/gu, '').trim();
  function pickStories(from, to) {
    const P = G.pv(), L = G.news.filter(n => n.d > from && n.d <= to); const out = [];
    // удари — одним сюжетом
    const strikes = L.filter(n => /^(✈|🚀) /.test(n.text) && n.text.includes('→')); const onMe = strikes.filter(n => n.nats.includes(P) && !n.text.replace(/^\S+\s/, '').startsWith(nat(P).name));
    const sc = it => (it.kind === 'big' ? 6 : 0) + (it.nats.includes(P) ? 4 : 0) + (it.kind === 'war' ? 2 : 0) + (/Землетрус|Цунамі|вулкана|метеорита|Пандемія|криза|капітул|перебрала|Переворот|Повстання/.test(it.text) ? 3 : 0) - (/Шторм|Міжнародна допомога|Будівництво|Збудовано|будує|Посуха/.test(it.text) ? 3 : 0);
    const seen = new Set(); const L0 = G.leader, co = G.pc >= 0 && G.myCo ? G.myCo() : null;
    const isMine = n => n.nats.includes(P) || (L0 && L0.name && n.text.includes(L0.name)) || (co && n.text.includes(co.name));
    const mine = [], world = [];
    L.filter(n => !/^(✈|🚀|😄) /.test(n.text)).map(n => ({ n, s: sc(n) + (isMine(n) ? 3 : 0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).forEach(({ n }) => { const k = clean(n.text).slice(0, 40); if (seen.has(k)) return; seen.add(k); const m = isMine(n); if (m && mine.length < 4) mine.push(clean(n.text)); else if (!m && world.length < 4) world.push(clean(n.text)); });
    if (onMe.length) { let cnt = 0, hit = 0; onMe.forEach(n => { const m = n.text.match(/: (\d+(?:\.\d+)?) [^,]*, [^0-9]*(\d+(?:\.\d+)?), влучань (\d+(?:\.\d+)?)/); if (m) { cnt += Math.round(+m[1]); hit += Math.round(+m[3]); } });
      mine.splice(Math.min(1, mine.length), 0, LORA.lang === 'en' ? `${onMe.length} strike waves hit ${nat(P).name} this month: ${cnt} missiles and drones, ${hit} hits.` : `Цього місяця по ${nat(P).name} завдано ${onMe.length} хвиль ударів: ${cnt} ракет і дронів, ${hit} влучань.`); }
    const stor = mine.concat(world);
    return { stories: stor, mine, world, ticker: L.slice(0, 30).map(n => clean(n.text)) };
  }
  function open() {
    const d = new Date(G.startDate + (G.day - 15) * 86400000); const lang = LORA.lang === 'en' ? 'en' : 'uk';
    const { stories, mine, world, ticker } = pickStories(G.day - 30, G.day); if (!stories.length) return;
    const intro = lang === 'en' ? `Good evening! This is LORA News with the main stories of ${MON.en[d.getMonth()]} ${d.getFullYear()}.` : `Добрий вечір! З вами LORA News. Головне за ${MON.uk[d.getMonth()]} ${d.getFullYear()} року.`;
    const outro = lang === 'en' ? 'That was LORA News. See you next month!' : 'Це були новини LORA. До зустрічі через місяць!';
    const en = lang === 'en', fun = LORA.FUN ? LORA.FUN.next(lang) : '';
    const lines = [intro, en ? 'First — news about you.' : 'Спершу — новини про вас.', ...(mine.length ? mine : [en ? 'A quiet month for you — and that is news too.' : 'Місяць без гучних подій для вас — і це теж новина.']),
      en ? 'Meanwhile, around the world.' : 'Тим часом у світі.', ...world, ...(fun ? [(en ? 'And finally, something funny: ' : 'І наостанок — кумедне: ') + fun] : []), outro];
    show(lines, ticker, 'LORA NEWS');
  }
  function show(lines, ticker, title) {
    const lang = LORA.lang === 'en' ? 'en' : 'uk';
    st = { lines, i: 0, ch: 0, talk: false, done: false };
    openModal(`<div class="nc"><div class="nc-top"><span class="nc-live">● ${lang === 'en' ? 'LIVE' : 'НАЖИВО'}</span><b>${esc(title)}</b><span>${G.dateStr()}</span></div>
      <div class="nc-studio"><canvas id="ncA" width="32" height="32"></canvas><div class="nc-desk">LORA</div><div class="nc-screen"><div id="ncTxt"></div></div></div>
      <div class="nc-ticker"><div>${ticker.map(x => esc(x)).join(' &nbsp;◆&nbsp; ')}</div></div>
      <div class="btns" style="justify-content:space-between"><label class="small mut"><input type="checkbox" ${AUD.S.newscast ? 'checked' : ''} onchange="AUD.set('newscast',this.checked)"> ${t_('Показувати щомісяця')}</label>
      <div class="btns" style="margin:0"><button onclick="NEWSCAST.next()">⏭ ${t_('Далі')}</button><button class="pri" onclick="NEWSCAST.close()">${t_('Продовжити гру')}</button></div></div></div>`);
    $('#mbox').classList.add('ncbox'); AUD.sfx('news'); setTimeout(say, 900); anim();
  }
  const img = new Image(); img.src = 'assets/ui/anchor.png';
  function anim() { const cv = document.getElementById('ncA'); if (!cv || !st) return; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 32, 32);
    const open = st.talk && (Math.floor(performance.now() / 140) % 2 === 0); if (img.complete) c.drawImage(img, open ? 32 : 0, 0, 32, 32, 0, 0, 32, 32); requestAnimationFrame(anim); }
  function say() {
    if (!st || st.done) return; const line = st.lines[st.i]; const el = document.getElementById('ncTxt'); if (!el) return;
    el.innerHTML = st.lines.slice(0, st.i).map(l => `<p class="old">${esc(l)}</p>`).join('') + `<p id="ncCur"></p>`; el.scrollTop = 1e9;
    st.ch = 0; st.talk = true; let spoken = AUD.speak(line, () => { st.spoken = true; }); st.spoken = !spoken;
    const cur = document.getElementById('ncCur'); const iv = setInterval(() => { if (!st || !document.getElementById('ncCur')) { clearInterval(iv); return; } st.ch += 2; cur.textContent = line.slice(0, st.ch); el.scrollTop = 1e9;
      if (st.ch >= line.length) { clearInterval(iv); const wait = () => { if (!st) return; if (st.spoken) { st.talk = false; setTimeout(() => { if (st && !st.done && st.lines[st.i] === line) next(); }, 1100); } else setTimeout(wait, 200); }; wait(); } }, 28);
  }
  function next() { if (!st) return; if (window.speechSynthesis) speechSynthesis.cancel(); st.i++; if (st.i >= st.lines.length) { st.done = true; st.talk = false; return; } say(); }
  function close() { st = null; if (window.speechSynthesis) speechSynthesis.cancel(); $('#mbox').classList.remove('ncbox'); closeModal(); }
  LORA.bus.on('day', day => { if (!G || G.gameOver || !AUD.S.newscast) return; const m = Math.floor(day / 30); if (day % 30 === 1 && m !== lastMonth && day > 20) { lastMonth = m; setTimeout(() => { if (!modalOpen) open(); }, 50); } });
  // ПІДСУМКИ РОКУ
  let lastYear = -1;
  function openYear() {
    const Y = G.yearRep; if (!Y) return; const en = LORA.lang === 'en', P = G.player >= 0 ? G.player : (G.leader && G.leader.home != null ? G.leader.home : G.pv()); const R = Y.r[P] || Object.values(Y.r)[0]; if (!R || !R.a || !R.b) return;
    const yr = new Date(G.startDate + (Y.day - 30) * 86400000).getFullYear(), n = nat(P), pc = (a, b) => (b / Math.max(0.01, a) - 1) * 100, sg = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%', dn = v => (v >= 0 ? '+' : '') + Math.round(v);
    const lines = [en ? `LORA News: the results of ${yr}.` : `LORA News: підсумки ${yr} року.`];
    lines.push(en ? `${n.name}: GDP $${R.b.gdp.toFixed(0)} bn (${sg(pc(R.a.gdp, R.b.gdp))}), stability ${Math.round(R.a.stab)} → ${Math.round(R.b.stab)}.` : `${n.name}: ВВП $${R.b.gdp.toFixed(0)} млрд (${sg(pc(R.a.gdp, R.b.gdp))}), стабільність ${Math.round(R.a.stab)} → ${Math.round(R.b.stab)}.`);
    lines.push(en ? `Regions under control: ${dn(R.b.reg - R.a.reg)}, new technologies: ${dn(R.b.techs - R.a.techs)}, building levels: ${dn(R.b.bld - R.a.bld)}, army: ${dn((R.b.troops - R.a.troops) / 1000)}k.` : `Регіонів під контролем: ${dn(R.b.reg - R.a.reg)}, нових технологій: ${dn(R.b.techs - R.a.techs)}, рівнів будівель: ${dn(R.b.bld - R.a.bld)}, армія: ${dn((R.b.troops - R.a.troops) / 1000)} тис.`);
    if (R.me) lines.push(en ? `Your personal fortune: $${(R.me.m0 * 1000).toFixed(0)}m → $${(R.me.m1 * 1000).toFixed(0)}m, fame ${Math.round(R.me.f0)} → ${Math.round(R.me.f1)}.` : `Ваші особисті статки: $${(R.me.m0 * 1000).toFixed(0)} млн → $${(R.me.m1 * 1000).toFixed(0)} млн, слава ${Math.round(R.me.f0)} → ${Math.round(R.me.f1)}.`);
    if (R.co) lines.push(en ? `Your company: cash $${R.co.c0.toFixed(2)} bn → $${R.co.c1.toFixed(2)} bn, assets ${R.co.a0} → ${R.co.a1}.` : `Ваша компанія: каса $${R.co.c0.toFixed(2)} млрд → $${R.co.c1.toFixed(2)} млрд, активів ${R.co.a0} → ${R.co.a1}.`);
    lines.push(en ? `Fastest growth: ${R.top.map(x => t_(x[0]) + ' ' + sg(x[1] * 100)).join(', ')}.` : `Найшвидше зростали: ${R.top.map(x => x[0] + ' ' + sg(x[1] * 100)).join(', ')}.`);
    lines.push(en ? `Toughest year: ${R.worst.map(x => t_(x[0]) + ' ' + sg(x[1] * 100)).join(', ')}. Wars still going: ${R.wars}.` : `Найважчий рік: ${R.worst.map(x => x[0] + ' ' + sg(x[1] * 100)).join(', ')}. Воєн триває: ${R.wars}.`);
    if (LORA.FUN) lines.push((en ? 'Headline of the year: ' : 'Заголовок року: ') + LORA.FUN.next(en ? 'en' : 'uk'));
    lines.push(en ? 'Happy New Year! See you in a year.' : 'З Новим роком! Побачимося за рік.');
    show(lines, LORA.FUN ? Array.from({ length: 10 }, () => LORA.FUN.next(en ? 'en' : 'uk')) : [], en ? `LORA NEWS · ${yr}` : `LORA NEWS · ${yr} РІК`);
  }
  LORA.bus.on('day', day => { if (!G || G.gameOver || !G.yearRep || G.yearRep.day === lastYear || day - G.yearRep.day > 20 || AUD.S.yearcast === false || modalOpen) return; lastYear = G.yearRep.day; setTimeout(() => { if (!modalOpen) openYear(); else lastYear = -1; }, 300); });
  return { open, next, close, openYear };
})();
