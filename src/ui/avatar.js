// ПІКСЕЛЬНІ АВАТАРКИ: процедурні портрети 20×20 для лідера, генералів і агентів.
// Детерміновані від seed (рядок або число): однаковий seed — однакове обличчя. Вигаданих людей, без схожості з реальними.
const AVA_CACHE = new Map();
function avaHash(s) { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function avaRng(seed) { let a = avaHash(seed) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000; }; }
// opts: { mil: військовий, fem: жінка, spy: агент у капелюсі, bg: колір тла }
function avatarURL(seed, opts) {
  opts = opts || {}; const key = seed + '|' + (opts.mil ? 1 : 0) + (opts.fem ? 1 : 0) + (opts.spy ? 1 : 0) + (opts.bg || '');
  if (AVA_CACHE.has(key)) return AVA_CACHE.get(key);
  const R = avaRng(key), pick = a => a[Math.floor(R() * a.length)];
  const c = document.createElement('canvas'); c.width = c.height = 20; const x = c.getContext('2d');
  const px = (i, j, col, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
  const SK = [['#f1c9a5', '#d9a77f'], ['#e0ac84', '#c08a62'], ['#c68a5e', '#a06a42'], ['#9a6440', '#7a4a2c'], ['#6f4529', '#55331d'], ['#f6d7bd', '#dcb293']];
  const [sk, skd] = pick(SK); const age = R(); const fem = opts.fem != null ? opts.fem : R() < 0.3;
  const HAIR = age > 0.7 ? ['#c9c9c9', '#e8e8e8', '#9a9a9a'] : ['#2a1d14', '#4a3020', '#7a5230', '#1a1a1a', '#b88a4a', '#d8b878', '#6a3a1a'];
  const hair = pick(HAIR); const bg = opts.bg || pick(['#2b4a6f', '#3a5a3a', '#5a3a4a', '#4a4a6a', '#6a5a3a', '#2f5f6f', '#5f3f2f']);
  // тло з легким градієнтом
  px(0, 0, bg, 20, 20); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 0, 20, 7); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 15, 20, 5);
  // плечі й одяг
  const suit = opts.mil ? pick(['#4b5a2f', '#3f4b2a', '#55603a', '#2f3a4a']) : opts.spy ? '#2a2a2e' : pick(['#22293a', '#2e2e2e', '#3a3a4a', '#1f3350', '#4a2f2f', '#5a5a5a']);
  px(3, 16, suit, 14, 4); px(2, 17, suit, 16, 3); px(4, 15, suit, 12, 1);
  if (opts.mil) { px(4, 16, '#c9a227', 2, 1); px(14, 16, '#c9a227', 2, 1); px(8, 15, '#6b7a45', 4, 2); px(5, 18, '#d33', 2, 1); px(5, 18, '#ffd34d', 1, 1); }
  else if (fem && R() < 0.5) { px(8, 15, sk, 4, 2); px(9, 17, skd, 2, 1); px(7, 17, pick(['#e8e8e8', '#d9a', '#9cf', '#fd6']), 1, 1); }
  else { px(8, 15, '#eee', 4, 3); px(9, 15, pick(['#a22', '#226', '#2a6', '#888', '#a62', '#55a']), 2, 4); }
  // шия й голова
  px(8, 13, skd, 4, 2);
  const hw = fem ? 5 : pick([5, 6, 6]); const top = 3, bot = 13, cx = 10;
  for (let j = top; j <= bot; j++) { const t = (j - top) / (bot - top); const w = Math.round(hw * (t < 0.6 ? 1 : 1 - (t - 0.6) * (fem ? 1.4 : 1.1))); px(cx - w, j, sk, w * 2, 1); }
  px(cx - hw, 7, skd, 1, 3); px(cx + hw - 1, 7, skd, 1, 3); // тінь щік
  px(cx - hw - 1, 8, sk, 1, 2); px(cx + hw, 8, sk, 1, 2); px(cx - hw - 1, 9, skd, 1, 1); px(cx + hw, 9, skd, 1, 1); // вуха
  // волосся
  const style = fem ? pick(['long', 'bob', 'bun']) : age > 0.82 ? pick(['bald', 'side']) : pick(['short', 'short', 'part', 'crew', 'side', 'wavy']);
  if (style !== 'bald') {
    if (style !== 'side') { px(cx - hw, top - 1, hair, hw * 2, 2); px(cx - hw + 1, top - 2, hair, hw * 2 - 2, 1); }
    if (style === 'part') { px(cx - 2, top - 1, sk, 1, 1); px(cx - hw, top + 1, hair, 3, 1); }
    if (style === 'wavy') { for (let i = cx - hw; i < cx + hw; i += 2) px(i, top - 2, hair); px(cx + hw - 3, top + 1, hair, 3, 1); }
    if (style === 'crew') px(cx - hw, top + 1, hair, hw * 2, 1);
    px(cx - hw, top, hair, 1, 4); px(cx + hw - 1, top, hair, 1, 4);
    if (style === 'side') { px(cx - hw, 5, hair, 1, 4); px(cx + hw - 1, 5, hair, 1, 4); px(cx - hw - 1, 6, hair, 1, 2); px(cx + hw, 6, hair, 1, 2); }
    if (style === 'long') { px(cx - hw - 1, top, hair, 2, 12); px(cx + hw - 1, top, hair, 2, 12); px(cx - hw + 1, top + 1, hair, 3, 1); }
    if (style === 'bob') { px(cx - hw - 1, top, hair, 2, 8); px(cx + hw - 1, top, hair, 2, 8); px(cx - hw + 1, top + 1, hair, hw * 2 - 2, 1); }
    if (style === 'bun') { px(cx - 2, top - 4, hair, 4, 3); px(cx - hw, top + 1, hair, 2, 2); px(cx + hw - 2, top + 1, hair, 2, 2); }
  } else { px(cx - hw, 6, hair, 1, 3); px(cx + hw - 1, 6, hair, 1, 3); }
  // головний убір
  if (opts.mil) { const cap = pick(['beret', 'cap', 'cap']); if (cap === 'beret') { px(cx - hw - 1, top - 1, '#5a1f2a', hw * 2 + 1, 3); px(cx - hw - 1, top - 2, '#5a1f2a', hw * 2 - 1, 1); px(cx + hw - 3, top, '#c9a227', 1, 1); } else { px(cx - hw - 1, top - 2, '#4b5a2f', hw * 2 + 2, 3); px(cx - hw - 2, top + 1, '#2a2f1a', hw * 2 + 4, 1); px(cx - 1, top - 1, '#c9a227', 2, 1); } }
  if (opts.spy) { px(cx - hw - 2, top, '#1a1a1e', hw * 2 + 4, 1); px(cx - hw, top - 3, '#1a1a1e', hw * 2, 3); px(cx - hw, top - 1, '#6a2a2a', hw * 2, 1); }
  // обличчя
  const eye = pick(['#1a1a1a', '#2a3a5a', '#3a2a1a', '#2a4a2a']);
  px(cx - 3, 6, hair, 2, 1); px(cx + 1, 6, hair, 2, 1); // брови
  px(cx - 3, 8, '#fff', 2, 1); px(cx + 1, 8, '#fff', 2, 1); px(cx - 2, 8, eye); px(cx + 1, 8, eye);
  px(cx - 1, 9, skd, 1, 2); px(cx - 1, 10, skd, 2, 1); // ніс
  px(cx - 2, 12, fem ? '#b5525a' : '#8a4a3a', 4, 1); if (R() < 0.4) px(cx - 2, 11, skd, 1, 1);
  if (fem) { px(cx - 4, 10, 'rgba(230,110,110,.35)', 2, 1); px(cx + 2, 10, 'rgba(230,110,110,.35)', 2, 1); }
  if (!fem && R() < (opts.mil ? 0.35 : 0.25)) { const bt = pick(['full', 'mous', 'goat']); if (bt === 'full') { px(cx - hw + 1, 11, hair, hw * 2 - 2, 2); px(cx - 2, 12, '#8a4a3a', 4, 1); px(cx - hw + 2, 13, hair, hw * 2 - 4, 1); } else if (bt === 'mous') px(cx - 2, 11, hair, 4, 1); else px(cx - 1, 12, hair, 2, 2); }
  if (age > 0.6) { px(cx - 4, 9, skd, 1, 1); px(cx + 3, 9, skd, 1, 1); }
  if (R() < 0.22 && !opts.spy) { const g = '#1c1c1c'; px(cx - 4, 7, g, 4, 1); px(cx, 7, g, 4, 1); px(cx - 4, 8, g, 1, 1); px(cx - 1, 8, g, 1, 1); px(cx, 8, g, 1, 1); px(cx + 3, 8, g, 1, 1); px(cx - 4, 9, g, 4, 1); px(cx, 9, g, 4, 1); px(cx - 2, 8, eye); px(cx + 1, 8, eye); }
  if (opts.spy) { px(cx - 4, 8, '#111', 3, 1); px(cx + 1, 8, '#111', 3, 1); px(cx - 1, 8, '#111', 2, 1); }
  // рамка
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 0, 20, 1); x.fillRect(0, 19, 20, 1); x.fillRect(0, 0, 1, 20); x.fillRect(19, 0, 1, 20);
  const url = c.toDataURL(); AVA_CACHE.set(key, url); return url;
}
// HTML-тег аватарки: size у пікселях (кратне 20 — найчіткіше)
function avatar(seed, size, opts) { if (typeof document === 'undefined') return ''; return `<img class="ava" src="${avatarURL(seed, opts)}" width="${size || 40}" height="${size || 40}" alt="">`; }
// аватарка лідера гравця (можна перегенерувати)
function leaderAva(size) { const L = G && G.leader; if (!L) return ''; return avatar(L.ava || L.name, size, { fem: L.fem }); }
function rerollLeaderAva() { const L = G && G.leader; if (!L) return; L.ava = L.name + '#' + Math.floor(Math.random() * 1e6); if (L.fem == null) L.fem = false; renderTab(true); if (typeof renderTop === 'function') renderTop(); }
function toggleLeaderFem() { const L = G && G.leader; if (!L) return; L.fem = !L.fem; renderTab(true); }
// картинка для канви (мапа)
const AVA_IMG = new Map();
function avatarImg(seed, opts) { const u = avatarURL(seed, opts); let im = AVA_IMG.get(u); if (!im) { im = new Image(); im.src = u; AVA_IMG.set(u, im); } return im.complete ? im : null; }
