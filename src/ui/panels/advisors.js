// РАДНИКИ: шість піксельних радників (економіка, армія, дипломатія, наука, інфраструктура, внутрішня політика).
// Коли виникає проблема чи успіх у їхній галузі — радник «вискакує» знизу, говорить (друк тексту + голос/«бурмотіння»)
// і пропонує відкрити потрібну вкладку.
const ADV = (() => {
  const A = {
    econ:   { r: 0, n: 'Мінфін', who: 'Радник з економіки', tab: 'econ', pitch: 1.0, re: /дефіцит|борг|бюджет|Економічний бум|Резерви|криза|Дефолт|ціни|Рекордні/i },
    mil:    { r: 1, n: 'Генштаб', who: 'Начальник Генштабу', tab: 'army', pitch: 0.7, re: /війн|нападає|встановлює контроль|Звільнено|оточен|удар|ракет|дронів|Повстан|армі|мобіліз/i },
    dipl:   { r: 2, n: 'МЗС', who: 'Міністр закордонних справ', tab: 'dipl', pitch: 1.35, re: /мир|союз|санкці|візит|прибув|ультиматум|відносин|Вільна торгівля|доступ/i },
    sci:    { r: 3, n: 'Наука', who: 'Головний науковець', tab: 'tech', pitch: 0.85, re: /Дослідження|освоює|Технологічний/i },
    infra:  { r: 4, n: 'Інфраструктура', who: 'Міністр інфраструктури', tab: 'build', pitch: 1.2, re: /Дефіцит:|енерг|Збудовано|Будівництво зупинено|порт|залізни|маршрут|Землетрус|Повінь|пожежі|тайфун|вулкан|спека|буря/i },
    intern: { r: 5, n: 'Внутрішня політика', who: 'Радник з внутрішньої політики', tab: 'state', pitch: 1.1, re: /Стабільність|протест|Переворот|Рада|Сейм|Конгрес|парламент|Вибори|ухвалено|провалено|🗳|🏛/i }
  };
  const INTRO = { econ: ['Пане президенте, цифри тривожні.', 'Маю новину з Мінфіну.'], mil: ['Доповідаю!', 'Обстановка на фронті змінилася.'], dipl: ['Дипломатична депеша.', 'Новини з-за кордону.'], sci: ['Чудові новини з лабораторій!', 'Наука звітує.'], infra: ['Тривога в інфраструктурі.', 'Новини з обʼєктів.'], intern: ['Настрої в суспільстві змінюються.', 'Новини з парламенту.'] };
  const INTRO_EN = { econ: ['Mr President, the numbers are worrying.', 'News from the Ministry of Finance.'], mil: ['Reporting!', 'The situation at the front has changed.'], dipl: ['A diplomatic dispatch.', 'News from abroad.'], sci: ['Great news from the labs!', 'Science reports.'], infra: ['Alarm in the infrastructure.', 'News from the sites.'], intern: ['The public mood is shifting.', 'News from parliament.'] };
  const box = document.createElement('div'); box.id = 'adv'; box.innerHTML = '<canvas width="32" height="32"></canvas><div class="adv-b"><div class="adv-n"></div><div class="adv-t"></div><div class="btns"></div></div>'; document.body.appendChild(box);
  const cv = box.querySelector('canvas'), cx = cv.getContext('2d'); const img = new Image(); img.src = 'assets/ui/advisors.png';
  let q = [], cur = null, talk = false, cool = {}, hideT = 0;
  const pick = it => { for (const k of ['mil', 'intern', 'dipl', 'sci', 'infra', 'econ']) if (A[k].re.test(it.text)) return k; return null; };
  function handles(it) {
    if (!AUD.S.advisors || !G || G.player < 0 || G.day < 2) return false; const P = G.player; if (!it.nats.includes(P) || !/bad|war|good|big/.test(it.kind)) return false;
    if ((/^(✈|🚀) /.test(it.text) && it.text.includes('→')) && it.text.replace(/^\S+\s/, '').startsWith(nat(P).name)) return false; // наші власні удари
    if (/Будівництво:|будує|Закладено|Сформовано/.test(it.text)) return false;
    const k = pick(it); if (!k) return false; const urgent = it.kind === 'war' || /нападає|війн/.test(it.text);
    if (!urgent && cool[k] > G.day) return 'skip'; cool[k] = G.day + (it.kind === 'good' ? 25 : 12); return k;
  }
  function say(k, it) {
    const intro = (LORA.lang === 'en' ? INTRO_EN : INTRO)[k]; const tx = t_(it.text).replace(/^[\p{Extended_Pictographic}️\s]+/u, '');
    q.push({ k, text: intro[Math.floor(Math.random() * intro.length)] + ' ' + tx, kind: it.kind }); if (!cur) next();
  }
  function next() {
    cur = q.shift(); if (!cur) { box.classList.remove('on'); return; } const a = A[cur.k];
    box.className = 'on ' + (cur.kind === 'good' ? 'good' : cur.kind === 'bad' ? 'bad' : cur.kind === 'war' ? 'war' : '');
    box.querySelector('.adv-n').innerHTML = `<b>${esc(t_(a.who))}</b> · ${esc(t_(a.n))}`;
    box.querySelector('.btns').innerHTML = `<button class="pri" onclick="ADV.open()">${t_('Відкрити')} →</button><button onclick="ADV.skip()">✕</button>`;
    const el = box.querySelector('.adv-t'); el.textContent = ''; let i = 0; talk = true; clearTimeout(hideT);
    const text = cur.text; AUD.sfx(cur.kind === 'war' ? 'alert' : 'pop');
    const iv = setInterval(() => { if (!cur || cur.text !== text) { clearInterval(iv); return; } i += 2; el.textContent = text.slice(0, i); if (i % 6 === 0) AUD.blip(a.pitch);
      if (i >= text.length) { clearInterval(iv); talk = false; hideT = setTimeout(() => { box.classList.remove('on'); setTimeout(() => { cur = null; next(); }, 450); }, 6500); } }, 32);
  }
  function anim() { cx.clearRect(0, 0, 32, 32); if (cur && img.complete) { const r = A[cur.k].r, open = talk && Math.floor(performance.now() / 110) % 2 === 0; cx.imageSmoothingEnabled = false; cx.drawImage(img, open ? 32 : 0, r * 32, 32, 32, 0, 0, 32, 32); } requestAnimationFrame(anim); }
  anim();
  LORA.bus.on('news', it => { try { const k = handles(it); if (k && k !== 'skip') say(k, it); } catch (e) { } });
  return {
    handles: it => { try { const P = G && G.player; return !!(AUD.S.advisors && G && P >= 0 && it.nats.includes(P) && /bad|war|good/.test(it.kind) && pick(it)); } catch (e) { return false; } },
    open() { if (!cur) return; tab = A[cur.k].tab; renderTabs(); renderTab(true); $('#left').classList.remove('hide'); this.skip(); },
    skip() { clearTimeout(hideT); box.classList.remove('on'); setTimeout(() => { cur = null; next(); }, 300); },
    test(k) { say(k || 'econ', { text: '📉 Бюджетний дефіцит 7.2% ВВП — скоротіть видатки або підвищте податки', kind: 'bad', nats: [] }); }
  };
})();
