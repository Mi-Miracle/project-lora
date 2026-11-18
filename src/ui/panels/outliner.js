// ОГЛЯДАЧ («outliner», як у великих стратегіях): компактний список того, що потребує уваги — війни, армії, будови,
// дослідження, голосування в блоках і парламенті, лідер. Клік — перехід до потрібного місця. Гарячі клавіші.
function renderOutliner() {
  let el = document.getElementById('outl'); if (!el) { el = document.createElement('div'); el.id = 'outl'; document.body.appendChild(el); }
  if (!G || G.player < 0 || $('#start').style.display !== 'none') { el.style.display = 'none'; return; } el.style.display = '';
  if (el.classList.contains('min')) { el.innerHTML = `<div class="ol-h" onclick="this.parentNode.classList.remove('min');renderOutliner()">▸ ${t_('Огляд')}</div>`; return; }
  const P = G.player, n = nat(P), rows = [];
  const add = (ic, txt, js, cls) => rows.push(`<div class="ol-r ${cls || ''}" onclick="${js}">${ic}<span>${txt}</span></div>`);
  if (NET.S.started) { const L = NET.onlineList(); add('📡', `${t_('Онлайн')}: ${L.map(p => `${p.host ? '👑' : ''}${esc(p.name)} <span class="mut">${esc(p.a3)}</span>`).join(', ')}${NET.S.role === 'guest' ? ` · <span class="${(NET.S.lag || 0) > 4000 ? 'r' : 'mut'}">${((NET.S.lag || 1500) / 1000).toFixed(1)} c</span>` : ''}`, "document.getElementById('gChat')&&document.getElementById('gChat').classList.remove('min')"); }
  G.enemiesOf(P).forEach(e => { const s = G.warScore(P, e); add('⚔', `${esc(nat(e).name)} <b class="${s >= 0 ? 'g' : 'r'}">${s >= 0 ? '+' : ''}${(s * 100).toFixed(0)}</b>`, "tab='dipl';subtab.dipl='wars';renderTabs();renderTab(true)", 'war'); });
  const my = G.armies.filter(a => a.n === P); const idle = my.filter(a => !a.mv && !a.auto && !a.train).length, low = my.filter(a => a.sup < 0.5 || a.org < 0.35).length;
  add(pxi('army'), `${t_('Армії')}: ${my.length}${low ? ` · <b class="r">${low} ${t_('виснажені')}</b>` : ''}${idle ? ` · ${idle} ${t_('без наказу')}` : ''}`, "tab='army';renderTabs();renderTab(true)");
  const cons = G.constructions.filter(c => c.n === P); if (cons.length) add(pxi('build'), `${t_('Будується')}: ${cons.length} · ${t_('найближче через')} ${Math.max(0, Math.min(...cons.map(c => c.done)) - G.day)} ${t_('дн.')}`, "tab='build';subtab.build='queue';renderTabs();renderTab(true)");
  if (n.res) add(pxi('tech'), n.res.cur ? `${esc(techName(n.res.cur))} <b>${pct(Math.min(1, n.res.prog / Math.max(1, G.techCost(n, n.res.cur))), 0)}</b>` : `<b class="y">${t_('Дослідження не обрано')}</b>`, "tab='tech';renderTabs();renderTab(true)", n.res.cur ? '' : 'warn');
  Object.values(G.blocs || {}).forEach(b => { if (!b.m.includes(P)) { const ap = b.agenda.find(a => a.kind === 'join' && a.target === P); if (ap) add(b.ic, `${t_('Заявка')}: ${esc(b.n)} · ${t_('до')} ${G.dateStr(ap.due).replace(/ р\.$/, '')}`, `tab='dipl';subtab.dipl='blocs';_bloc='${b.id}';renderTabs();renderTab(true)`); return; }
    const open = b.agenda.filter(a => a.votes[P] == null); if (open.length) add(b.ic, `${esc(b.n)}: <b class="y">${open.length} ${t_('питань без вашого голосу')}</b>`, `tab='dipl';subtab.dipl='blocs';_bloc='${b.id}';renderTabs();renderTab(true)`, 'warn'); });
  if (G.rada && G.rada.on) add('🏛', `${t_('Рада (чат)')}: ${t_('довіра')} <b class="${G.rada.trust >= 50 ? 'g' : 'r'}">${Math.round(G.rada.trust)}%</b>${G.rada.bills.length ? ' · 📜 ' + G.rada.bills.length : ''}`, "tab='state';subtab.state='parl';renderTabs();renderTab(true)");
  else if (n.parl && n.parl.regime !== 'autocracy') add('🏛', `${esc(t_(n.parl.name))}: ${t_('підтримка')} <b class="${G.parlSupport(n) > 0.52 ? 'g' : 'r'}">${pct(G.parlSupport(n), 0)}</b>`, "tab='state';subtab.state='parl';renderTabs();renderTab(true)");
  if (G.leader) add(pxi('star'), G.leader.mv ? `✈ → ${esc(nat(G.ter[G.leader.mv.to].ctrl).name)} · ${Math.max(0, G.leader.mv.arrive - G.day)} ${t_('дн.')}` : `${t_('Лідер')}: ${esc(nat(G.ter[G.leader.at].ctrl).name)}`, "tab='lead';renderTabs();renderTab(true);focusReg(G.leader.mv?G.leader.mv.to:G.leader.at)");
  if (G.goals) { const L = D.goals[G.goals.mode] || []; add('🏆', `${t_('Цілі')}: <b>${Object.keys(G.goals.done).length}/${L.length}</b>`, 'showGoals()'); }
  if ((n.press || 0) > 0.3) add('📢', `${t_('Тиск суспільства')}: <b class="r">${pct(n.press, 0)}</b>`, "tab='state';renderTabs();renderTab(true)", 'warn');
  el.innerHTML = `<div class="ol-h" onclick="this.parentNode.classList.add('min');renderOutliner()">▾ ${t_('Огляд')} <span class="mut small">${t_('гарячі клавіші')}: Alt+1–8, L, Esc</span></div>` + rows.join('');
}
document.addEventListener('keydown', e => {
  if (!G || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return; const T = curTabs().map(x => x[0]);
  if (/^Digit[1-8]$/.test(e.code) && e.altKey && !e.ctrlKey) { const k = T[+e.code.slice(5) - 1]; if (k) { tab = k; renderTabs(); renderTab(true); $('#left').classList.remove('hide'); } }
  else if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') { if (G.leader) focusReg(G.leader.mv ? G.leader.mv.to : G.leader.at); }
  else if (e.key === 'Escape') { if (modalOpen && !document.querySelector('.lobby')) closeModal(); else { sel = null; renderRight(); } }
});
