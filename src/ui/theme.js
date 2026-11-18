// ТЕМА ІНТЕРФЕЙСУ: кольори держави гравця (або країни штабу компанії) та піксельні іконки.
function pxi(name, x2) { const p = PX_ICONS[name]; if (!p) return ''; const s = x2 ? 32 : 16; return `<i class="pxi${x2 ? ' x2' : ''}" style="background-position:${-p[0] * s}px ${-p[1] * s}px;${x2 ? `background-size:${PX_COLS * 32}px auto` : ''}"></i>`; }
// піксельні іконки з емодзі (assets/ui/emoji.png, згенеровано tools/art/emoji-icons.py); якщо іконки немає — емодзі як є
function ico(e, x2) { const m = typeof PX_EMO !== "undefined" ? PX_EMO : null, p = m && m[e]; if (!p) return e || ''; const s = x2 ? 32 : 16; return `<i class="pxe${x2 ? ' x2' : ''}" title="" style="background-position:${-p[0] * s}px ${-p[1] * s}px;${x2 ? `background-size:${PX_ECOLS * 32}px auto` : ''}"></i>`; }
function themeOf(a3, fallback) { const t = (D.themes || {})[a3]; return t ? { a: t[0], b: t[1], motto: t[2] } : { a: fallback || '#4fb3ff', b: '#ffd34d', motto: '' }; }
function applyTheme(a3, fallback) {
  const t = themeOf(a3, fallback), r = document.documentElement.style;
  r.setProperty('--acc', t.a); r.setProperty('--acc2', t.b); r.setProperty('--accT', `color-mix(in srgb, ${t.a} 22%, transparent)`);
  window._theme = t;
}
const TAB_ICON = { state: 'state', econ: 'econ', logi: 'logi', army: 'army', dipl: 'dipl', build: 'build', tech: 'tech', intel: 'sat', world: 'world', co: 'co', lead: 'star', char: 'star' };
const tabLabel = (k, v) => (TAB_ICON[k] ? (PX_ICONS[TAB_ICON[k]] ? pxi(TAB_ICON[k], 1) : ico(v.split(' ')[0], 1)) : ico(v.split(' ')[0], 1)) + `<span>${t_(v).replace(/^[^\p{L}]+/u, '')}</span>`;
