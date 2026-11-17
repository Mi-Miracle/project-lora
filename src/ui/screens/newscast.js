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
    const seen = new Set();
    L.filter(n => !/^(✈|🚀) /.test(n.text)).map(n => ({ n, s: sc(n) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).forEach(({ n }) => { const k = clean(n.text).slice(0, 40); if (seen.has(k) || out.length >= 5) return; seen.add(k); out.push(clean(n.text)); });
    if (onMe.length) { let cnt = 0, hit = 0; onMe.forEach(n => { const m = n.text.match(/: (\d+) .*?(\d+).*?(\d+)/); if (m) { cnt += +m[1]; hit += +m[3]; } });
      out.splice(Math.min(1, out.length), 0, LORA.lang === 'en' ? `${onMe.length} strike waves hit ${nat(P).name} this month: ${cnt} missiles and drones, ${hit} hits.` : `Цього місяця по ${nat(P).name} завдано ${onMe.length} хвиль ударів: ${cnt} ракет і дронів, влучань — ${hit}.`); }
    return { stories: out.slice(0, 5), ticker: L.slice(0, 30).map(n => clean(n.text)) };
  }
  function open() {
    const d = new Date(G.startDate + (G.day - 15) * 86400000); const lang = LORA.lang === 'en' ? 'en' : 'uk';
    const { stories, ticker } = pickStories(G.day - 30, G.day); if (!stories.length) return;
    const intro = lang === 'en' ? `Good evening! This is LORA News with the main stories of ${MON.en[d.getMonth()]} ${d.getFullYear()}.` : `Добрий вечір! З вами LORA News. Головне за ${MON.uk[d.getMonth()]} ${d.getFullYear()} року.`;
    const outro = lang === 'en' ? 'That was LORA News. See you next month!' : 'Це були новини LORA. До зустрічі через місяць!';
    st = { lines: [intro, ...stories, outro], i: 0, ch: 0, talk: false, done: false };
    openModal(`<div class="nc"><div class="nc-top"><span class="nc-live">● ${lang === 'en' ? 'LIVE' : 'НАЖИВО'}</span><b>LORA NEWS</b><span>${G.dateStr()}</span></div>
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
  return { open, next, close };
})();
