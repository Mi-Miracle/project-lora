// МАПА: керування мишею, дотиком і клавіатурою; вибір регіонів, військ, накази.
function pickTerritory(sx, sy) {
  let [lon, lat] = toWorld(sx, sy);
  for (const shift of [0, 360, -360]) {
    const L = ((lon + 180) % 360 + 360) % 360 - 180 + shift;
    for (let i = 0; i < GEO.paths.length; i++) { const b = GEO.bbox[i]; if (L < b[0] || L > b[2] || lat < b[1] || lat > b[3]) continue; if (pickCtx.isPointInPath(GEO.paths[i], L, -lat)) return i; }
  }
  return -1;
}
function pickUnit(sx, sy) { for (let k = unitHit.length - 1; k >= 0; k--) { const u = unitHit[k]; if (Math.abs(sx - u.x) <= u.w / 2 + 2 && Math.abs(sy - u.y) <= u.h / 2 + 2) return u; } return null; }
function nearestSea(sx, sy) { let [lon, lat] = toWorld(sx, sy); lon = ((lon + 180) % 360 + 360) % 360 - 180; let best = -1, bd = 1e9; D.sea.nodes.forEach((s, i) => { const d = LORA.core.hav(lon, lat, s.lon, s.lat); if (d < bd) { bd = d; best = i; } }); return best; }
let drag = null, moved = false;
cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, ox: view.ox, oy: view.oy, b: e.button }; moved = false; });
addEventListener('mousemove', e => {
  if (drag && drag.b === 0) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; cv.classList.add('drag'); } view.ox = drag.ox + dx; view.oy = drag.oy + dy; clampView(); }
  if (e.target === cv && G && !drag) { hoverT = pickTerritory(e.clientX, e.clientY); showTip(e, hoverT); } else if (e.target !== cv) $('#tip').style.display = 'none';
});
addEventListener('mouseup', e => { if (drag && !moved && e.target === cv && G && drag.b === 0) onClick(e); drag = null; cv.classList.remove('drag'); });
cv.addEventListener('contextmenu', e => { e.preventDefault(); if (G) onRightClick(e); });
cv.addEventListener('wheel', e => { e.preventDefault(); const f = Math.exp(-e.deltaY * 0.0015); const [lon, lat] = toWorld(e.clientX, e.clientY); view.s = Math.max(innerHeight / 170, Math.min(LORA.config.map.maxZoom, view.s * f)); view.ox = e.clientX - lon * view.s; view.oy = e.clientY + lat * view.s; clampView(); }, { passive: false });
let tp = null;
cv.addEventListener('touchstart', e => { if (e.touches.length === 1) tp = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: view.ox, oy: view.oy, t: Date.now() }; else if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); tp = { pinch: d, s: view.s, cx: (e.touches[0].clientX + e.touches[1].clientX) / 2, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 }; tp.w = toWorld(tp.cx, tp.cy); } }, { passive: true });
cv.addEventListener('touchmove', e => { e.preventDefault(); if (!tp) return; if (tp.pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); view.s = Math.max(innerHeight / 170, Math.min(LORA.config.map.maxZoom, tp.s * d / tp.pinch)); view.ox = tp.cx - tp.w[0] * view.s; view.oy = tp.cy + tp.w[1] * view.s; } else if (!tp.pinch) { view.ox = tp.ox + e.touches[0].clientX - tp.x; view.oy = tp.oy + e.touches[0].clientY - tp.y; } clampView(); }, { passive: false });
cv.addEventListener('touchend', e => { if (tp && !tp.pinch && Date.now() - tp.t < 300 && e.changedTouches[0] && Math.hypot(e.changedTouches[0].clientX - tp.x, e.changedTouches[0].clientY - tp.y) < 8) onClick({ clientX: tp.x, clientY: tp.y, shiftKey: false }); tp = null; });
addEventListener('keydown', e => {
  if (!G || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); setSpeed(speedIdx ? 0 : (lastSpeed || 1)); }
  if (e.key >= '1' && e.key <= '4') setSpeed(+e.key);
  if (e.key === 'Escape') { sel = null; orderMode = null; hint(''); renderRight(); }
});
function onClick(e) {
  if (orderMode === 'link') { const t = pickTerritory(e.clientX, e.clientY); if (t >= 0) finishLink(t); return; }
  if (orderMode && sel && (sel.type === 'a' || sel.type === 'f')) { onRightClick(e); return; }
  const u = pickUnit(e.clientX, e.clientY);
  if (u) { sel = u.type === 'a' ? { type: 'a', id: u.id } : u.type === 'f' ? { type: 'f', id: u.id } : { type: 't', id: u.t }; renderRight(); return; }
  const t = pickTerritory(e.clientX, e.clientY); sel = t >= 0 ? { type: 't', id: t } : null; renderRight();
}
function onRightClick(e) {
  if (!sel) return;
  if (sel.type === 'a') {
    const a = G.armies.find(x => x.id === sel.id); if (!a || a.n !== G.player) return;
    const t = pickTerritory(e.clientX, e.clientY); if (t < 0) return;
    const r = G.orderMove(a, t, e.shiftKey || orderMode === 'sea');
    hint(r.ok ? `«${a.name}» → ${regName(t)}${r.days ? ` (≈${Math.ceil(r.days)} дн.)` : ''}` : '⚠ ' + r.err, 2500); orderMode = null; renderRight();
  } else if (sel.type === 'f') {
    const f = G.fleets.find(x => x.id === sel.id); if (!f || f.n !== G.player) return;
    const node = nearestSea(e.clientX, e.clientY); const r = G.orderFleet(f, node);
    hint(r.ok ? `«${f.name}» → ${D.sea.nodes[node].n} (≈${Math.ceil(r.days)} дн.)` : '⚠ ' + r.err, 2500); orderMode = null; renderRight();
  }
}
let hintTO = 0;
function hint(t, ms) { const h = $('#hint'); if (!t) { h.style.display = 'none'; return; } h.textContent = t; h.style.display = 'block'; clearTimeout(hintTO); if (ms) hintTO = setTimeout(() => h.style.display = 'none', ms); }
function showTip(e, t) {
  const tip = $('#tip'); const place = () => { tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 290, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; };
  const u = pickUnit(e.clientX, e.clientY);
  if (u && u.type === 'a') { const a = G.armies.find(x => x.id === u.id); if (a) { tip.innerHTML = `<b>${esc(a.name)}</b> — ${esc(G.N[a.n].name)}<br>${people(a.k)} · орг. ${pct(a.org, 0)} · постач. ${pct(a.sup, 0)}<br>${a.stance === 'attack' ? '➤ наступ' : '🛡 оборона'} · сила ${G.armyPower(a).toFixed(0)}`; place(); return; } }
  if (u && u.type === 'f') { const f = G.fleets.find(x => x.id === u.id); if (f) { tip.innerHTML = `<b>${esc(f.name)}</b> — ${esc(G.N[f.n].name)}<br>${f.s.toFixed(0)} кораблів · ${esc(D.sea.nodes[f.node].n)}`; place(); return; } }
  if (t < 0) { tip.style.display = 'none'; return; }
  const T = G.ter[t], n = G.N[T.ctrl], R = D.regions[t];
  let h = `<b>${esc(regName(t))}</b> <span class="mut">${esc(G.N[T.owner].name)}</span>`;
  if (T.ctrl !== T.owner) h += `<br><span class="r">Під контролем: ${esc(n.name)}</span>`;
  h += `<br><span class="mut">${G.TERRAIN[R.t].n} · ${popM(T.pop)} · ${money(T.gdp)}</span>`;
  if (mode === 'res') h += `<br>${ico(RI[modeRes].ic)} ${RI[modeRes].n}: ${qty(modeRes, T.prod[modeRes])} / потреба ${qty(modeRes, T.need0[modeRes])}`;
  else if (mode === 'rel') h += `<br>Відносини: ${G.rel[G.pv()][T.ctrl].toFixed(0)}`;
  if (T.occ) h += `<br><span class="y">Наступ ${esc(G.N[T.occ.by].name)}: ${T.occ.p.toFixed(0)}%</span>`;
  if (T.fort > 0.05) h += `<br><span class="mut">Укріплення ${pct(T.fort, 0)}</span>`;
  tip.innerHTML = h; place();
}
