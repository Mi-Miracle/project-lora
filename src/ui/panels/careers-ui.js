// UI карʼєр 4.0: мініігри робочих обовʼязків (вікторина, влучання в момент, клікер, маршрут з вантажівкою),
// панель посади на робочому місці, квартали міста на мапі.
const JMG = {};
function jmgOn() { return !(AUD && AUD.S && AUD.S.minigames === false); }
// ---- запуск: обовʼязок із A.mg → мінігра → G.act.mgSet(score) → звичайний cityDo
{ const base = window.cityDo; window.cityDo = function (k, a) {
    const loc = locUI && locUI.loc; const P = loc && G.LOCS[loc].places[k]; const A = P && P.acts[a];
    if (!A || !A.mg || !jmgOn() || (G.locCan && G.locCan(loc, k, a))) return base(k, a);
    jmgPlay(A.mg, { title: A.n, quiz: A.quiz, job: A.job }, s => { if (G.act.mgSet) G.act.mgSet(s); base(k, a); });
  }; }
function jmgPlay(kind, o, done) { closeModal(); JMG.cur = { kind, o, done, t0: performance.now() }; ({ quiz: jmgQuiz, timing: jmgTiming, click: jmgClick, route: jmgRoute }[kind] || jmgQuiz)(); }
function jmgEnd(score) { const M = JMG.cur; JMG.cur = null; if (!M) return; clearInterval(M.timer); cancelAnimationFrame(M.raf); closeModal(); M.done(Math.max(0, Math.min(1, score))); }
const jmgHead = (ic, t, sub) => `<h2>${ic} ${esc(t_(t))}</h2><div class="mut small">${esc(t_(sub))} · ${t_('мініігри можна вимкнути в Налаштуваннях → Гра')}</div>`;
// 1) ВІКТОРИНА: 3 питання з професії, 8 секунд на кожне
function jmgQuiz() {
  const M = JMG.cur; const pool = (D.jobQuiz && D.jobQuiz[M.o.quiz]) || Object.values(D.jobQuiz || {}).flat(); M.items = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3); M.n = 0; M.ok = 0; jmgQRound();
}
function jmgQRound() {
  const M = JMG.cur; if (!M) return; if (M.n >= M.items.length) { jmgEnd(M.ok / M.items.length); return; } const [q, opts, c] = M.items[M.n]; const order = opts.map((x, i) => i).sort(() => Math.random() - 0.5); M.order = order; M.c = c; M.t1 = performance.now();
  openModal(`${jmgHead('🧠', M.o.title, 'Оберіть правильну відповідь')}<div style="font-size:16px;margin:10px 0">${M.n + 1}/${M.items.length}. ${esc(t_(q))}</div><div id="jmgBar" class="bar"><i style="width:100%"></i></div>
    <div class="mg-opts">${order.map(i => `<button class="city-act" onclick="jmgQPick(${i})"><b>${esc(t_(opts[i]))}</b></button>`).join('')}</div>`);
  clearInterval(M.timer); M.timer = setInterval(() => { const q2 = 1 - (performance.now() - M.t1) / 8000; const b = document.querySelector('#jmgBar i'); if (b) b.style.width = Math.max(0, q2 * 100) + '%'; if (q2 <= 0) jmgQPick(-1); }, 100);
}
function jmgQPick(i) { const M = JMG.cur; if (!M) return; clearInterval(M.timer); if (i === M.c) { M.ok++; AUD.sfx && AUD.sfx('good'); } else AUD.sfx && AUD.sfx('bad'); M.n++; jmgQRound(); }
// 2) МОМЕНТ: зупиніть бігунок у зеленій зоні, 3 спроби
function jmgTiming() {
  const M = JMG.cur; M.n = 0; M.hits = 0; M.tries = 3; M.zone = 0.4 + Math.random() * 0.3; M.w = 0.16; M.pos = 0; M.dir = 1; M.sp = 0.9 + Math.random() * 0.5;
  openModal(`${jmgHead('🎯', M.o.title, 'Натисніть «Зараз!», коли бігунок у зеленій зоні')}<div id="jmgT" style="position:relative;height:34px;background:#0006;border-radius:6px;margin:14px 0;overflow:hidden"><div id="jmgZ" style="position:absolute;top:0;bottom:0;background:#3fbf6a88"></div><div id="jmgP" style="position:absolute;top:0;bottom:0;width:6px;background:#ffd34d"></div></div>
    <div class="row"><span id="jmgS">${t_('Спроба')} 1/3</span><button class="pri big" onclick="jmgTHit()">⚡ ${t_('Зараз!')}</button></div>`);
  const z = document.getElementById('jmgZ'); z.style.left = (M.zone * 100) + '%'; z.style.width = (M.w * 100) + '%';
  let last = performance.now(); const tick = t => { if (!JMG.cur) return; const dt = (t - last) / 1000; last = t; M.pos += M.dir * dt * M.sp; if (M.pos > 1) { M.pos = 1; M.dir = -1; } if (M.pos < 0) { M.pos = 0; M.dir = 1; } const p = document.getElementById('jmgP'); if (p) p.style.left = `calc(${M.pos * 100}% - 3px)`; M.raf = requestAnimationFrame(tick); }; M.raf = requestAnimationFrame(tick);
}
function jmgTHit() { const M = JMG.cur; if (!M) return; const inZ = M.pos >= M.zone && M.pos <= M.zone + M.w; const near = Math.abs(M.pos - (M.zone + M.w / 2)) < M.w; M.hits += inZ ? 1 : near ? 0.5 : 0; AUD.sfx && AUD.sfx(inZ ? 'good' : 'bad'); M.n++;
  if (M.n >= M.tries) { jmgEnd(M.hits / M.tries); return; } M.zone = 0.1 + Math.random() * 0.7; M.sp *= 1.25; const z = document.getElementById('jmgZ'); if (z) z.style.left = (M.zone * 100) + '%'; const s = document.getElementById('jmgS'); if (s) s.textContent = `${t_('Спроба')} ${M.n + 1}/${M.tries}`; }
// 3) КЛІКЕР: за 8 секунд клацайте потрібне, оминайте зайве
const JMG_CLICK = { cook: [['🥕', '🧅', '🥔', '🍅'], ['🧦', '🔩']], seller: [['📦', '🛍', '👕'], ['🐈', '🧦']], builder: [['🧱', '🪵'], ['🧸', '🐈']], farmer: [['🌾', '🥔', '🥕'], ['🐛', '🪳']], police: [['🦹', '🚗'], ['👵', '🐕']], military: [['🎯'], ['🕊', '🐄']],
  doctor: [['🤒', '🤧'], ['👨‍⚕️', '💐']], teacher: [['📒', '📗'], ['🍔', '📱']], journalist: [['📸', '🎤'], ['🍰', '🛋']], banker: [['💵', '🪙'], ['🧾', '🍌']], athlete: [['⚽', '🏀'], ['🍟', '🍺']] };
function jmgClick() {
  const M = JMG.cur; const set = JMG_CLICK[M.o.quiz] || [['⭐'], ['💣']]; M.good = 0; M.bad = 0; M.total = 0; M.end = performance.now() + 8000;
  openModal(`${jmgHead('👆', M.o.title, 'Клацайте ' + set[0].join(' ') + ' · оминайте ' + set[1].join(' '))}<div id="jmgA" style="position:relative;height:260px;background:#0006;border-radius:8px;margin:10px 0;overflow:hidden;user-select:none"></div><div class="row"><span id="jmgC">0</span><span id="jmgTm">8.0</span></div>`);
  const A = document.getElementById('jmgA'); const spawn = () => { if (!JMG.cur) return; const good = Math.random() < 0.7; const e = document.createElement('div'); const em = (good ? set[0] : set[1])[Math.floor(Math.random() * (good ? set[0] : set[1]).length)];
    e.textContent = em; e.style.cssText = `position:absolute;font-size:34px;cursor:pointer;left:${5 + Math.random() * 85}%;top:${5 + Math.random() * 75}%;transition:transform .15s`; if (good) M.total++;
    e.onclick = () => { if (good) { M.good++; AUD.sfx && AUD.sfx('click'); } else { M.bad++; AUD.sfx && AUD.sfx('bad'); } e.remove(); const c = document.getElementById('jmgC'); if (c) c.textContent = `✅ ${M.good}  ❌ ${M.bad}`; };
    A.appendChild(e); setTimeout(() => e.remove(), 1100); };
  M.timer = setInterval(() => { const left = (M.end - performance.now()) / 1000; const t = document.getElementById('jmgTm'); if (t) t.textContent = Math.max(0, left).toFixed(1); if (left <= 0) { jmgEnd(Math.max(0, (M.good - M.bad * 0.7) / Math.max(1, M.total * 0.8))); return; } spawn(); }, 420);
}
// 4) МАРШРУТ: клацніть точки доставки в найкоротшому порядку — і дивіться, як їде вантажівка
function jmgRoute() {
  const M = JMG.cur; const n = 5 + Math.floor(Math.random() * 2); M.pts = [{ x: 0.08, y: 0.5, d: 1 }]; for (let i = 0; i < n; i++) M.pts.push({ x: 0.2 + Math.random() * 0.75, y: 0.1 + Math.random() * 0.8 }); M.path = [0];
  openModal(`${jmgHead('🗺', M.o.title, 'Клацайте точки доставки по черзі — що коротший маршрут, то краще')}<canvas id="jmgR" width="520" height="300" style="width:100%;background:#1b2632;border-radius:8px;margin:10px 0;cursor:crosshair"></canvas><div class="row"><span id="jmgRd"></span><button onclick="jmgRUndo()">↶ ${t_('Скасувати')}</button></div>`);
  const cv = document.getElementById('jmgR'); cv.onclick = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; let best = -1, bd = 0.004; M.pts.forEach((p, i) => { if (M.path.includes(i)) return; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } }); if (best < 0) return; M.path.push(best); AUD.sfx && AUD.sfx('click'); if (M.path.length === M.pts.length) jmgRDrive(); };
  jmgRDraw();
}
function jmgRUndo() { const M = JMG.cur; if (M && M.path.length > 1 && !M.driving) { M.path.pop(); jmgRDraw(); } }
const jmgDist = (pts, path) => path.reduce((s, i, k) => k ? s + Math.hypot(pts[i].x - pts[path[k - 1]].x, (pts[i].y - pts[path[k - 1]].y) * 0.58) : 0, 0);
function jmgRBest(pts) { let best = Infinity; const rest = pts.map((p, i) => i).slice(1); const perm = (a, cur) => { if (!a.length) { best = Math.min(best, jmgDist(pts, [0, ...cur])); return; } a.forEach((v, i) => perm(a.filter((_, j) => j !== i), cur.concat(v))); }; perm(rest, []); return best; }
function jmgRDraw(truck) {
  const M = JMG.cur; const cv = document.getElementById('jmgR'); if (!cv || !M) return; const cx = cv.getContext('2d'), W = cv.width, H = cv.height; cx.clearRect(0, 0, W, H);
  cx.strokeStyle = '#2c3a4a'; cx.lineWidth = 1; for (let i = 0; i < 12; i++) { cx.beginPath(); cx.moveTo(i * W / 12, 0); cx.lineTo(i * W / 12, H); cx.stroke(); } for (let j = 0; j < 7; j++) { cx.beginPath(); cx.moveTo(0, j * H / 7); cx.lineTo(W, j * H / 7); cx.stroke(); }
  cx.strokeStyle = '#ffd34d'; cx.lineWidth = 3; cx.beginPath(); M.path.forEach((i, k) => { const p = M.pts[i]; k ? cx.lineTo(p.x * W, p.y * H) : cx.moveTo(p.x * W, p.y * H); }); cx.stroke();
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = '24px serif'; M.pts.forEach((p, i) => { const k = M.path.indexOf(i); cx.fillText(i === 0 ? '🏭' : k > 0 ? '✅' : '📦', p.x * W, p.y * H); if (k > 0) { cx.font = '700 12px system-ui'; cx.fillStyle = '#fff'; cx.fillText(k, p.x * W + 14, p.y * H - 14); cx.font = '24px serif'; } });
  if (truck) { cx.font = '26px serif'; cx.fillText('🚚', truck.x * W, truck.y * H - 4); }
  const d = document.getElementById('jmgRd'); if (d) d.textContent = `${t_('Пройдено')}: ${(jmgDist(M.pts, M.path) * 100).toFixed(0)} ${t_('км')}`;
}
function jmgRDrive() { const M = JMG.cur; M.driving = 1; const best = jmgRBest(M.pts), mine = jmgDist(M.pts, M.path); const score = Math.max(0, Math.min(1, (best / mine - 0.55) / 0.45)); let k = 1, t = 0;
  const step = () => { if (!JMG.cur) return; t += 0.05; if (t >= 1) { t = 0; k++; } if (k >= M.path.length) { const d = document.getElementById('jmgRd'); if (d) d.textContent = `${t_('Ваш маршрут')}: ${(mine * 100).toFixed(0)} ${t_('км')} · ${t_('найкоротший')}: ${(best * 100).toFixed(0)} ${t_('км')}`; setTimeout(() => jmgEnd(score), 1100); return; }
    const a = M.pts[M.path[k - 1]], b = M.pts[M.path[k]]; jmgRDraw({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); M.raf = requestAnimationFrame(step); }; M.raf = requestAnimationFrame(step); }

// ---- приховати чужі обовʼязки на робочих місцях
// (tab-v30 фільтрує дії з A.hide(L) === true)

// ---- панель посади на робочому місці
{ const b = window.citySide; window.citySide = function () { b(); if (!locUI || !G || !G.leader) return; const el = $('#citySide'); if (!el) return; const L = G.leader; const k = locUI.place; if (!k) return;
  const jobs = Object.entries(G.JOBS || {}).filter(([, j]) => j.place === k && (j.loc || 'city') === locUI.loc); if (!jobs.length) return;
  let h = '';
  jobs.forEach(([jk, j]) => { const mine = L.job && L.job.k === jk; h += `<div class="grp">${ico(j.ic)} ${esc(t_(j.n))}${mine ? ` · <span class="g">${esc(t_(G.jobTitle(L)))}</span>` : ''}</div>`;
    if (mine) { const need = G.jobNeed(L), ne = G.jobNextErr(L); h += `<div class="bar"><i style="width:${Math.min(100, L.job.xp / need * 100)}%"></i></div><div class="small">${t_('Досвід')}: ${L.job.xp.toFixed(1)} / ${need} · ${t_('робочих днів цього місяця')}: <b>${L.job.dd || 0}</b>/10 · ${t_('зарплата')} ${money(G.jobPay(L))}/${t_('міс.')}</div>`;
      if (L.job.lvl < 5) h += `<div class="small mut">${t_('Наступна посада')}: <b>${esc(t_(j.ranks[L.job.lvl][0]))}</b> (${money(j.ranks[L.job.lvl][2] / 1e9)}/${t_('міс.')})${ne ? ` · <span class="y">${esc(t_(ne))}</span>` : ' · ✅ ' + t_('навички є')}</div>`;
      if (L.job.warn) h += `<div class="small r">⚠ ${t_('Догана за прогули: ще місяць без роботи — звільнення')}</div>`; }
    else h += `<div class="small mut">${esc(t_(j.d))}</div>`;
    h += `<div class="small">${j.ranks.map((r, i) => `<div class="${mine && L.job.lvl === i + 1 ? 'g' : mine && L.job.lvl > i + 1 ? 'mut' : ''}">${i + 1}. ${esc(t_(r[0]))} · ${money(r[2] / 1e9)} · ${Object.entries(r[1]).map(([s, v]) => `${G.SKILLS[s] ? G.SKILLS[s].ic : s}${v}`).join(' ') || t_('без вимог')}</div>`).join('')}</div>`; });
  h += `<div class="mut small">${t_('Зарплата повна за 10+ робочих днів на місяць. Місяць без роботи — догана, два — звільнення.')}</div>`;
  el.insertAdjacentHTML('beforeend', h); }; }

// ---- квартали міста: розкладка й підкладка
{ const b = window.locLayout; window.locLayout = function (loc, seed) {
    const L = G.LOCS[loc]; if (!L || L.theme !== 'city' || !G.CITY_DIST) return b(loc, seed); const pos = {}, used = new Set(['4,0', '5,0', '4,1', '5,1']); pos.park = { x: 0.5, y: 0.125 };
    const keys = Object.keys(L.places).filter(k => k !== 'park'); const left = [];
    keys.forEach(k => { const d = G.placeDist(k); const D2 = d && G.CITY_DIST[d]; const cell = D2 && D2.cells.find(c => !used.has(c + '')); if (cell) { used.add(cell + ''); pos[k] = { x: (cell[0] + 0.5) / 10, y: (cell[1] + 0.5) / 8, d }; } else left.push(k); });
    const free = []; for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) if (!used.has(i + ',' + j)) free.push([i, j]); left.forEach((k, n) => { const c = free[n % Math.max(1, free.length)] || [9, 6]; used.add(c + ''); pos[k] = { x: (c[0] + 0.5) / 10, y: (c[1] + 0.5) / 8 }; });
    return pos; }; }
function drawDistricts(cx, W, H, night) {
  if (!G.CITY_DIST) return; const bw = W / 10, bh = H / 8; cx.save();
  for (const D2 of Object.values(G.CITY_DIST)) { cx.fillStyle = D2.col + (night ? '33' : '55'); D2.cells.forEach(([i, j]) => cx.fillRect(i * bw + 2, j * bh + 2, bw - 4, bh - 4));
    const xs = D2.cells.map(c => c[0]), ys = D2.cells.map(c => c[1]); const x = (Math.min(...xs)) * bw + 6, y = Math.min(...ys) * bh + 4;
    cx.font = '700 11px system-ui'; cx.textAlign = 'left'; cx.textBaseline = 'top'; const t = `${D2.ic} ${t_(D2.n)}`; const w = cx.measureText(t).width + 10; cx.fillStyle = night ? '#000a' : '#fffc'; cx.fillRect(x, y, w, 16); cx.fillStyle = night ? '#fff' : '#222'; cx.fillText(t, x + 5, y + 2); }
  cx.restore(); cx.textAlign = 'center'; cx.textBaseline = 'middle'; }
