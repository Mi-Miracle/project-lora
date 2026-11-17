// АГЕНТИ: вкладка «Дипломатія → Агенти», блок у панелі регіону, малювання на мапі.
let agSel = null;
function agentsTab() {
  if (G.player < 0) return `<div class="card">${t_('Агенти доступні лише під час гри за державу.')}</div>`;
  const K = D.agentKinds, mine = G.agentsOf(G.player); let h = `<div class="mut small">${t_('Шпигуни й дипломати — окремі одиниці на мапі. Оберіть агента, потім регіон на мапі — і відправте його туди.')}</div>`;
  h += `<div class="btns">${Object.entries(K).map(([k, v]) => `<button onclick="agHire('${k}')" data-tip="${esc(v.d)}">${pxi(v.px)} ${t_('Найняти')}: ${esc(v.n)} (${money(v.cost)})</button>`).join('')}</div>`;
  if (!mine.length) h += `<div class="card small">${t_('Агентів немає.')}</div>`;
  mine.forEach(a => {
    const k = K[a.kind], c = G.ter[a.at].ctrl, T_ = a.task ? D.spyTasks[a.task] : null;
    h += `<div class="card ag ${agSel === a.id ? 'on' : ''}" onclick="agPick(${a.id})"><div class="row"><b>${pxi(k.px)} ${esc(a.name)}</b><span class="mut">${esc(k.n)}${a.xp >= 0.3 ? ' · ' + '★'.repeat(Math.min(3, Math.floor(a.xp * 3.4))) : ''}</span></div>
      <div class="row small"><span>${a.mv ? '✈ ' + t_('в дорозі до') + ' ' + esc(regName(a.mv.to)) + ' · ' + (a.mv.arrive - G.day) + ' ' + t_('дн.') : '📍 ' + esc(regName(a.at)) + ', ' + esc(nat(c).name)}</span>${a.kind === 'spy' && T_ ? `<span>${ico(T_.ic)} ${esc(T_.n)}${T_.dur ? ' · ' + Math.round(a.prog * 100) + '%' : ''}</span>` : a.kind === 'dip' && !a.mv && c !== G.player ? `<span class="g">🤝 ${t_('переговори')} · ${G.rel[c][G.player].toFixed(0)}</span>` : ''}</div>`;
    if (a.kind === 'spy' && !a.mv && agSel === a.id) h += `<div class="sub">${Object.entries(D.spyTasks).map(([tk, v]) => `<button class="${a.task === tk ? 'on' : ''}" data-tip="${esc(v.d)}" onclick="event.stopPropagation();agTask(${a.id},'${tk}')">${ico(v.ic)} ${esc(v.n)}</button>`).join('')}</div>`;
    if (agSel === a.id) h += `<div class="btns"><button onclick="event.stopPropagation();agFocus(${a.id})">🔎 ${t_('Показати')}</button><button class="dang" onclick="event.stopPropagation();agRecall(${a.id})">${t_('Відкликати')}</button></div>`;
    h += `</div>`;
  });
  h += `<div class="small mut">${t_('Ризик провалу росте в технологічно розвинених державах, під час війни і проти контррозвідки. Спійманий агент — дипломатичний скандал. Досвідчені агенти працюють швидше й обережніше.')}</div>`;
  return h;
}
function agHire(k) { const r = G.act.hireAgent(k); hint(r.ok ? '✅ ' + t_('Агента найнято') : '⚠ ' + r.err, 2500); if (r.ok && r.id) agSel = r.id; renderTab(true); }
function agPick(id) { agSel = agSel === id ? null : id; renderTab(true); if (sel && sel.type === 't') renderRight(); }
function agFocus(id) { const a = G.agents.find(x => x.id === id); if (!a) return; const c = D.regions[a.mv ? a.mv.to : a.at].c; focusLonLat(c[0], c[1], Math.max(view.s, 5)); mapDirty = true; }
function agTask(id, t) { const r = G.agentTask(id, t); if (r && r.ok === false) hint('⚠ ' + r.err, 3000); renderTab(true); }
function agRecall(id) { const r = G.agentRecall(id); if (r && r.ok === false) hint('⚠ ' + r.err, 3000); agSel = null; renderTab(true); }
function agGo(id, i) { const r = G.agentGo(id, i); hint(r && r.ok ? `✈ ${t_('Агент вирушив')}: ${r.days} ${t_('дн.')}` : '⚠ ' + (r && r.err), 3000); renderTab(true); renderRight(); mapDirty = true; }
function agentRegionBlock(i) {
  if (G.player < 0 || !G.agentsOf) return ''; const mine = G.agentsOf(G.player); const t = G.ter[i];
  let h = '';
  const here = mine.filter(a => !a.mv && a.at === i); const idle = mine.filter(a => !a.mv && a.at !== i && !(a.kind === 'dip' && t.ctrl !== G.player && G.atWar(G.player, t.ctrl)));
  if (t.part > 0.2 && t.owner !== t.ctrl) h += `<div class="row small"><span>🔥 ${t_('Партизанський рух')}</span><b class="${t.owner === G.player ? 'g' : 'r'}">${Math.round(t.part * 100)}%</b></div>`;
  if (!mine.length) return h;
  h += `<div class="grp">🕵 ${t_('Агенти')}</div>`;
  here.forEach(a => h += `<div class="row small"><span>${ico(D.agentKinds[a.kind].ic)} ${esc(a.name)}</span><span>${a.task ? D.spyTasks[a.task].ic + ' ' + esc(D.spyTasks[a.task].n) : t_('тут')}</span></div>`);
  if (idle.length) h += `<div class="btns">${idle.map(a => `<button onclick="agGo(${a.id},${i})">${ico(D.agentKinds[a.kind].ic)} ${esc(a.name)} → ${t_('сюди')}</button>`).join('')}</div>`;
  return h;
}
function drawAgents(sh) {
  if (!G || !G.agents || G.player < 0) return; ctx.imageSmoothingEnabled = false;
  G.agents.forEach((a, k) => {
    if (a.n !== G.player) return; let lon, lat;
    if (a.mv) { const A = D.regions[a.mv.from].c, B = D.regions[a.mv.to].c; const f = Math.min(1, (G.day - a.mv.start + (typeof tAcc === 'number' ? tAcc : 0)) / Math.max(1, a.mv.arrive - a.mv.start)); lon = A[0] + (B[0] - A[0]) * f; lat = A[1] + (B[1] - A[1]) * f;
      const P = toScreen(A[0] + sh, A[1]), Q = toScreen(B[0] + sh, B[1]); ctx.strokeStyle = a.kind === 'spy' ? 'rgba(170,140,255,0.55)' : 'rgba(120,220,170,0.55)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke(); ctx.setLineDash([]); }
    else [lon, lat] = D.regions[a.at].c;
    let [x, y] = toScreen(lon + sh, lat); x += 16 + (k % 3) * 9; y -= 6; if (x < -40 || x > innerWidth + 40) return;
    const p = PX_ICONS[D.agentKinds[a.kind].px]; if (!p) return;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + 9, 7, 2.5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = a.kind === 'spy' && !a.mv && G.ter[a.at].ctrl !== G.player ? 0.75 : 1;
    if (_pxImg.complete) ctx.drawImage(_pxImg, p[0] * 16, p[1] * 16, 16, 16, x - 9, y - 10, 18, 18); ctx.globalAlpha = 1;
    if (agSel === a.id) { ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 10, y - 11, 20, 20); }
  });
  // партизани: 🔥 над окупованими регіонами з сильним рухом
  if (view.s >= 3) { ctx.font = '13px system-ui'; ctx.textAlign = 'center'; G.ter.forEach((t, i) => { if (!(t.part > 0.3) || t.owner === t.ctrl) return; const c = D.regions[i].c; const [x, y] = toScreen(c[0] + sh, c[1]); if (x < -20 || x > innerWidth + 20) return; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(animT * 2 + i); ctx.fillText('🔥', x - 14, y - 12); ctx.globalAlpha = 1; }); }
}

// ---- цілі (досягнення)
function showGoals() {
  if (!G || !G.goals) { G && G.goalsInit && G.goalsInit(); } if (!G || !G.goals) return; const L = D.goals[G.goals.mode] || [], done = G.goals.done;
  const rw = r => [r.cash ? '+' + money(r.cash) : '', r.money ? '+' + money(r.money) : '', r.stab ? t_('стабільність') + ' +' + r.stab : ''].filter(Boolean).join(', ');
  openModal(`<h2>🏆 ${t_('Цілі')} · ${Object.keys(done).length}/${L.length}</h2><div class="mut small">${t_('Досягайте цілей — отримуйте нагороди. Перевірка раз на місяць.')}</div>` + L.map(g => `<div class="card ${done[g.id] != null ? '' : 'soon'}"><div class="row"><b>${done[g.id] != null ? '✅' : '◻'} ${esc(t_(g.n))}</b><span class="small">${esc(rw(g.r || {}))}</span></div><div class="small mut">${esc(t_(g.d))}${done[g.id] != null ? ' · ' + G.dateStr(done[g.id]) : ''}</div></div>`).join('') + `<div class="btns"><button onclick="closeModal()">${t_('Закрити')}</button></div>`);
}
