// СПЛИВАЮЧІ ПІДКАЗКИ: будь-який елемент з атрибутом data-tip (або title на кнопках) показує підказку біля курсора.
(function () {
  const tip = document.createElement('div'); tip.id = 'tip2'; document.body.appendChild(tip); let curEl = null, timer = 0;
  // автоматичні підказки для елементів без data-tip
  const AUTO = { 'speed': 'Швидкість часу: ⏸ пауза · ▶ рік ≈ 1 год · ▶▶ ≈ 18 хв · ▶▶▶ ≈ 6 хв · ⏩ ≈ 1.5 хв. Пробіл — пауза, 1–4 — швидкість' };
  document.addEventListener('mouseover', e => {
    let el = e.target.closest && e.target.closest('[data-tip],[title],#speed,#tabs button,#top .st'); if (!el) { hide(); return; }
    let text = el.getAttribute('data-tip');
    if (!text && el.title) { el.setAttribute('data-tip', el.title); el.removeAttribute('title'); text = el.getAttribute('data-tip'); }
    if (!text && el.id === 'speed') text = AUTO.speed;
    if (!text && el.matches('#tabs button')) text = TIPS_TAB[el.getAttribute('data-k')] || '';
    if (!text && el.matches('#top .st')) { const lab = (el.querySelector('span') || {}).textContent || ''; text = TIPS_TOP[Object.keys(TIPS_TOP).find(k => lab.toLowerCase().includes(t_(k).toLowerCase()))] || ''; }
    if (!text) { hide(); return; } if (el === curEl) return; curEl = el; clearTimeout(timer);
    timer = setTimeout(() => { tip.innerHTML = esc(t_(text)).replace(/\n/g, '<br>'); tip.style.display = 'block'; place(e); }, 280);
  });
  document.addEventListener('mousemove', e => { if (tip.style.display === 'block') place(e); });
  document.addEventListener('mousedown', hide);
  function place(e) { const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY + 16; if (x + w > innerWidth - 6) x = e.clientX - w - 10; if (y + h > innerHeight - 6) y = e.clientY - h - 10; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hide() { clearTimeout(timer); curEl = null; tip.style.display = 'none'; }
})();
const TIPS_TAB = { state: 'Огляд держави, бюджет, політика, запаси й парламент', econ: 'Ресурси, ціни, експорт та імпорт', logi: 'Протоки, торгові маршрути, прокладання залізниць і трубопроводів', army: 'Армії, флот, мобілізація, арсенал і удари по тилу', dipl: 'Відносини, союзи, санкції, війни й мир', build: 'Будівництво заводів, енергетики, оборонки, радник розвитку', tech: 'Дерево досліджень від сучасності до майбутнього', world: 'Світові рейтинги, конфлікти, баланс і ШІ', co: 'Ваша компанія: активи, офіси, вплив, рада директорів', lead: 'Ваш лідер на мапі: перельоти й особисті візити для переговорів', char: 'Ваш персонаж: звʼязки, популярність, дії, вибори' };
const TIPS_TOP = { 'ввп': 'Валовий внутрішній продукт за рік і темп зростання', 'резерви': 'Гроші в казні / державний борг', 'стабільність': 'Внутрішня стабільність: нижче 35 — ризик протестів і переворотів', 'армія': 'Чисельність армії і ліміт мобілізації', 'постачання': 'Середнє постачання армій', 'війни': 'Кількість воєн', 'вартість': 'Вартість компанії: кошти + активи + основний бізнес', 'кошти': 'Вільні гроші', 'слава': 'Світова слава персонажа' };
