// ХРОНІКА ДЛЯ СТРІМУ: підсумок гри — показники «тоді й зараз», графіки й ключові події. Можна вивести на весь екран.
function chronChart(ser, key, col, label, fmt) {
  if (!ser || ser.length < 2) return ''; const v = ser.map(s => s[key]); const mx = Math.max(...v), mn = Math.min(...v), w = 520, h = 90, sp = (mx - mn) || 1;
  const pts = v.map((x, k) => `${(k / (v.length - 1) * w).toFixed(1)},${(h - 6 - (x - mn) / sp * (h - 14)).toFixed(1)}`).join(' ');
  return `<div class="chron-ch"><div class="row small"><b>${label}</b><span class="mut">${fmt(mn)} … ${fmt(mx)}</span></div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px"><polyline points="0,${h} ${pts} ${w},${h}" fill="${col}22" stroke="none"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2"/></svg></div>`;
}
function showChronicle(full) {
  if (!G.chron) { G.chronInit && G.chronInit(); }
  const C = G.chron; if (!C) { hint('⚠ ' + t_('Хроніка доступна лише за державу'), 3000); return; }
  const n = nat(C.nid), a = C.ser[0] || C.start, b = G.chronNow(); const d = (x, y, f) => { const r = y - x; return `<span class="${r >= 0 ? 'g' : 'r'}">${r >= 0 ? '+' : ''}${f(r)}</span>`; };
  const yrs = ((G.day - (a.d || 0)) / 365).toFixed(1);
  const ev = C.ev.slice().reverse();
  const big = ev.filter(e => /☢|капітул|мир|Мир|Звільнено|звільнено|Розвилка|🏆|перемога|Переворот|Обвал|оголош|нападає/.test(e.text)).slice(0, 14);
  const wars = ev.filter(e => /нападає|оголошує війну/.test(e.text)).length, peace = ev.filter(e => /мир|Мир/.test(e.text)).length;
  let h = `<div class="chron ${full ? 'chron-full' : ''}"><h2>📜 ${t_('Хроніка')}: ${esc(n.name)}</h2><div class="mut">${G.dateStr(a.d || 0)} — ${G.dateStr()} · ${yrs} ${t_('р.')}</div>
  <div class="kpi"><div><span>${t_('ВВП')}</span><b>${money(b.gdp)} ${d(a.gdp, b.gdp, x => money(x))}</b></div><div><span>${t_('Стабільність')}</span><b>${b.stab.toFixed(0)} ${d(a.stab, b.stab, x => x.toFixed(0))}</b></div><div><span>${t_('Регіонів')}</span><b>${b.reg} ${d(a.reg, b.reg, x => x)}</b></div><div><span>${t_('Війська')}</span><b>${Math.round(b.tr)} ${t_('тис.')}</b></div></div>
  <div class="row small"><span>⚔ ${t_('Війн почато')}: <b>${wars}</b></span><span>🕊 ${t_('Мирних угод')}: <b>${peace}</b></span><span>☢ ${t_('Ядерних ударів у світі')}: <b>${G.nukeUsed || 0}</b></span><span>💀 ${t_('Втрати')}: <b>${Math.round(n.casualties || 0)} ${t_('тис.')}</b></span></div>
  ${chronChart(C.ser, 'gdp', '#4fd18b', t_('ВВП'), x => money(x))}${chronChart(C.ser, 'stab', '#ffd34d', t_('Стабільність'), x => x.toFixed(0))}${chronChart(C.ser, 'reg', '#6fb6ff', t_('Регіони під контролем'), x => x.toFixed(0))}
  <div class="grp">${t_('Ключові моменти')}</div>${big.map(e => `<div class="chron-e"><span class="mut">${G.dateStr(e.d)}</span> ${esc(t_(e.text))}</div>`).join('') || `<div class="mut">${t_('Поки що без великих подій')}</div>`}
  ${G.rada && G.rada.log.length ? `<div class="grp">🏛 ${t_('Закони чату')}</div>` + G.rada.log.slice(0, 6).map(l => `<div class="small">${l.ok ? '✅' : '❌'} ${esc(t_(l.what))} <span class="mut">${l.yes}/${l.no}</span></div>`).join('') : ''}
  </div><div class="btns">${full ? '' : `<button class="pri" onclick="closeModal();showChronicle(true)">📺 ${t_('На весь екран (для стріму)')}</button>`}<button onclick="closeModal()">${t_('Закрити')}</button></div>`;
  openModal(h); if (full) $('#mbox').classList.add('wide'); else $('#mbox').classList.remove('wide');
}
