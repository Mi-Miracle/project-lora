// БІГУЧИЙ РЯДОК УНИЗУ МАПИ: новини гри (важливі для вас — першими) чергуються з кумедними заголовками.
// Клік по рядку розгортає панель «Стрічка новин» з історією, щоб згадати, що було. Якщо рядок вимкнено в налаштуваннях —
// стрічка новин показується постійно, як раніше.
(function () {
  const SPEED = 70, PAUSE = 900; let el = null, run = 0, timer = 0, anim = null, lastJoke = false, newsInRow = 0; const shown = new WeakSet(); let startDay = -1;
  const tkOn = () => typeof AUD === 'undefined' || !AUD.S || AUD.S.ticker !== false;
  const humorOn = () => typeof AUD === 'undefined' || !AUD.S || AUD.S.humor !== false;
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  function ensure() {
    if (el) return el; el = document.createElement('div'); el.id = 'funTk';
    el.innerHTML = `<b>${LORA.lang === 'en' ? 'NEWS' : 'НОВИНИ'}</b><div class="tk-w"><span></span></div><i class="tk-x" title="">▴</i>`;
    const left = document.getElementById('left'); left && left.parentNode ? left.parentNode.insertBefore(el, left.nextSibling) : document.body.appendChild(el);
    el.addEventListener('click', () => { document.body.classList.toggle('news-open'); if (typeof renderNews === 'function') renderNews(); el.querySelector('.tk-x').textContent = document.body.classList.contains('news-open') ? '▾' : '▴'; }); return el;
  }
  function pickNews() {
    if (!G || !G.news) return null; const P = G.pv(); if (startDay < 0) startDay = G.day;
    const fresh = G.news.filter(n => !shown.has(n) && n.d >= Math.max(startDay, G.day - 20) && !/^😄 /.test(n.text));
    if (!fresh.length) return null; const sc = n => (n.nats.includes(P) ? 5 : 0) + (n.kind === 'big' ? 4 : n.kind === 'bad' || n.kind === 'war' ? 2 : n.kind === 'good' ? 1 : 0) + (G.day - n.d < 3 ? 1 : 0);
    fresh.sort((a, b) => sc(b) - sc(a) || b.d - a.d); const n = fresh[0]; if (sc(n) < 1 && Math.random() < 0.5) { shown.add(n); return null; } shown.add(n); return n;
  }
  function next() {
    clearTimeout(timer); if (!run) return; const w = el.querySelector('.tk-w'), sp = w.firstElementChild;
    if (!G || document.body.classList.contains('stream')) { el.style.display = 'none'; timer = setTimeout(next, 4000); return; }
    if (!tkOn()) { el.style.display = 'none'; document.body.classList.remove('tk-on'); document.body.classList.add('news-fixed'); timer = setTimeout(next, 4000); return; }
    el.style.display = ''; document.body.classList.add('tk-on'); document.body.classList.remove('news-fixed');
    let txt = '', cls = '';
    const wantJoke = humorOn() && (newsInRow >= 2 || (!lastJoke && Math.random() < 0.35));
    const n = wantJoke ? null : pickNews();
    if (n) { txt = `${G.dateStr ? G.dateStr(n.d).replace(/ \d{4}.*$/, '') : ''} · ${clean(LORA.lang === 'en' && typeof t_ === 'function' ? t_(n.text) : n.text)}`; cls = n.nats.includes(G.pv()) ? 'tk-me ' + n.kind : n.kind; lastJoke = false; newsInRow++; }
    else if (humorOn()) { let pl; if (Math.random() < 0.3) { const L2 = G.N.filter(x => x.alive && x.agg && x.agg.gdp > 40); const c = L2[Math.floor(Math.random() * L2.length)]; if (c) pl = LORA.lang === 'en' ? t_(c.name) : c.name; } txt = '😄 ' + (LORA.FUN ? LORA.FUN.next(LORA.lang, pl) : LORA.funNext(LORA.lang)); cls = 'tk-fun'; lastJoke = true; newsInRow = 0; }
    else { timer = setTimeout(next, 2000); return; }
    sp.textContent = txt; sp.className = cls; const W = w.clientWidth || 600, sw = sp.offsetWidth || 400;
    if (anim) anim.cancel(); anim = sp.animate([{ transform: `translateX(${W}px)` }, { transform: `translateX(${-sw - 20}px)` }], { duration: (W + sw + 20) / SPEED * 1000, easing: 'linear', fill: 'forwards' });
    anim.onfinish = () => { timer = setTimeout(next, PAUSE); };
  }
  LORA.tickerStart = function () { ensure(); if (run) return; run = 1; startDay = -1; next(); };
  LORA.tickerRefresh = function () { if (!el) return; if (run) next(); };
  const iv = setInterval(() => { if (typeof G !== 'undefined' && G && document.getElementById('start') && document.getElementById('start').style.display === 'none') { LORA.tickerStart(); clearInterval(iv); } }, 1000);
})();
