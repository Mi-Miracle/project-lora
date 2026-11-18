// ГОЛОВНИЙ ЦИКЛ ІНТЕРФЕЙСУ: крок симуляції за швидкістю, малювання, оновлення панелей.
let tAcc = 0, lastFrame = performance.now(), lastUI = 0;
function startUI() {
  { const v = nat(G.pv()); applyTheme(v.a3, v.color); }
  const n = nat(G.pv()); const c = D.regions[n.home].c; const deg = Math.sqrt(Math.max(2e4, (n.agg && n.agg.area) || 3e5)) / 111 * 2.4; view.s = Math.max(5, Math.min(60, (innerWidth - 720) / deg)); focusLonLat(c[0], c[1]);
  G._blkP = G.seaBlockedFor(G.pv()); mapDirty = true;
  if (G.player < 0) tab = G.pc >= 0 ? 'co' : 'char'; renderTabs(); renderTab(true); renderTop(); renderLegend(); renderNews(); $('#left').classList.remove('hide');
  LORA.stream.attach && LORA.stream.attach(G);
}
function afterStep() {
  if (G.day % 7 === 0) RES.forEach(r => { priceHist[r].push(G.prices[r] / G.priceBase[r]); if (priceHist[r].length > 260) priceHist[r].shift(); });
  G._blkP = G.seaBlockedFor(G.pv());
  if (G.day % LORA.config.autosaveDays === 0) autosave();
}
function frame(now) {
  const dt = Math.min(0.25, (now - lastFrame) / 1000); lastFrame = now; animT += dt;
  if (G && !G.gameOver && speedIdx && !_paused && (!modalOpen || NET.S.role === 'host') && !NET.isGuest()) {
    tAcc += dt * LORA.config.speeds[speedIdx]; let steps = 0;
    while (tAcc >= 1 && steps < 5) { G.step(); tAcc -= 1; steps++; afterStep(); }
    if (steps >= 5) tAcc = 0;
  }
  NET.hostTick(now);
  if (typeof streamView === 'undefined' || streamView !== 'ticker') draw();
  if (G && now - lastUI > 450) { lastUI = now; if (speedIdx) mapDirty = true; renderTop(); renderTab(); if (sel) renderRight(true); checkPopups(); renderOutliner(); }
  requestAnimationFrame(frame);
}
LORA.i18n.observe();
fitWorld();
{ const q = new URLSearchParams(location.search); const j = q.get('join'); if (j) { netMode = 'guest'; netCode = j.toUpperCase(); } }
startScreen();
requestAnimationFrame(frame);
