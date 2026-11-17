// ЛОКАЛІЗАЦІЯ. Мова зберігається в localStorage ('lora_lang'): 'uk' (основна) або 'en'.
// t_(рядок) — переклад цілого рядка або за фрагментами. Словники: data/i18n/<мова>.js (LORA.i18n.dict[мова]).
// Інтерфейс перекладається автоматично: спостерігач DOM замінює відомі українські фрагменти в тексті й підказках.
(function () {
  const L = LORA; let lang = 'uk';
  try { lang = localStorage.getItem('lora_lang') || (/^(uk|ru)/.test(navigator.language || '') ? 'uk' : 'en'); } catch (e) { }
  L.lang = lang; const I = L.i18n = { dict: {}, re: null, list: null };
  const CYR = /[а-яіїєґА-ЯІЇЄҐʼ']/;
  I.compile = function () {
    const d = I.dict[L.lang]; if (!d) return;
    const keys = Object.keys(d).filter(k => d[k]).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    I.re = new RegExp('(?<![а-яіїєґА-ЯІЇЄҐ])(' + keys.join('|') + ')(?![а-яіїєґА-ЯІЇЄҐ])', 'g');
  };
  I.tr = function (s) {
    if (L.lang === 'uk' || !s || !/[а-яіїєґА-ЯІЇЄҐ]/.test(s)) return s; const d = I.dict[L.lang]; if (!d) return s;
    if (d[s]) return d[s]; const k = s.trim(); if (d[k]) return s.replace(k, d[k]);
    if (!I.re) I.compile(); return I.re ? s.replace(I.re, m => d[m]) : s;
  };
  (typeof window !== 'undefined' ? window : globalThis).t_ = I.tr;
  I.setLang = function (l) { try { localStorage.setItem('lora_lang', l); } catch (e) { } location.reload(); };
  // ---- автоматичний переклад DOM
  I.translateNode = function (root) {
    if (L.lang === 'uk') return;
    const walk = n => {
      if (n.nodeType === 3) { if (CYR.test(n.nodeValue)) { const v = I.tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } return; }
      if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      if (n.title && CYR.test(n.title)) n.title = I.tr(n.title); if (n.placeholder && CYR.test(n.placeholder)) n.placeholder = I.tr(n.placeholder);
      if (n.tagName === 'OPTGROUP' && CYR.test(n.label)) n.label = I.tr(n.label);
      for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
    };
    walk(root);
  };
  I.observe = function () {
    if (L.lang === 'uk' || typeof MutationObserver === 'undefined') return;
    document.title = I.tr(document.title); I.translateNode(document.body);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') { if (CYR.test(m.target.nodeValue)) I.translateNode(m.target); } else m.addedNodes.forEach(I.translateNode); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  };
})();
function langSwitch() { return `<div class="btns" style="margin:0">${[['uk', 'UA'], ['en', 'EN']].map(([k, v]) => `<button class="${LORA.lang === k ? 'on' : ''}" onclick="LORA.i18n.setLang('${k}')">${v}</button>`).join('')}</div>`; }
