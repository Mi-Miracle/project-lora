// СТРІЧКА КУМЕДНИХ НОВИН У ГРІ (внизу мапи). По одному заголовку, повільно, з паузами. Вимикається в Налаштуваннях → Гра.
(function () {
  const SPEED = 55, PAUSE = 2500; let el = null, run = 0, timer = 0, anim = null;
  const on = () => typeof AUD === 'undefined' || !AUD.S || (AUD.S.ticker !== false && AUD.S.humor !== false);
  function ensure() {
    if (el) return el; el = document.createElement('div'); el.id = 'funTk';
    el.innerHTML = `<b>${LORA.lang === 'en' ? 'LIVE' : 'НАЖИВО'}</b><div class="tk-w"><span></span></div>`;
    const left = document.getElementById('left'); left && left.parentNode ? left.parentNode.insertBefore(el, left.nextSibling) : document.body.appendChild(el);
    el.addEventListener('click', () => { if (anim) anim.finish(); }); return el;
  }
  function next() {
    clearTimeout(timer); if (!run) return; const w = el.querySelector('.tk-w'), sp = w.firstElementChild;
    if (!on() || !G || document.body.classList.contains('stream')) { el.style.display = 'none'; timer = setTimeout(next, 4000); return; }
    el.style.display = ''; document.body.classList.add('tk-on');
    sp.textContent = LORA.funNext(LORA.lang); const W = w.clientWidth || 600, sw = sp.offsetWidth || 400;
    if (anim) anim.cancel(); anim = sp.animate([{ transform: `translateX(${W}px)` }, { transform: `translateX(${-sw - 20}px)` }], { duration: (W + sw + 20) / SPEED * 1000, easing: 'linear', fill: 'forwards' });
    anim.onfinish = () => { timer = setTimeout(next, PAUSE); };
  }
  LORA.tickerStart = function () { ensure(); if (run) return; run = 1; next(); };
  LORA.tickerRefresh = function () { if (!el) return; if (!on()) { el.style.display = 'none'; document.body.classList.remove('tk-on'); } else if (run) next(); };
  // старт, щойно зʼявилася гра
  const iv = setInterval(() => { if (typeof G !== 'undefined' && G && document.getElementById('start') && document.getElementById('start').style.display === 'none') { LORA.tickerStart(); clearInterval(iv); } }, 1000);
})();
