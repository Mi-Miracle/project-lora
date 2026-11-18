// ВКЛАДКА «РОДИНА»: вік, стосунки, шлюб, діти, освіта, спадкоємець; для персонажа — ще й тіньові справи.
// А також блок «Дії між державами» у панелі країни (таємні протоколи, подарунки, тролінг…).
function famRes(r) { hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
TAB_FN.family = function () {
  const L = G.leader; if (!L || L.money == null) return ''; const F = G.famEnsure(L); const age = G.ageOf(L);
  const bar = (v, c) => `<div class="bar" style="height:6px"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${c}"></i></div>`;
  const P = (k, v) => G.FAM_PERK[k] ? `${esc(t_(G.FAM_PERK[k][0]))} — <span class="mut">${esc(t_(G.FAM_PERK[k][1]))}</span>` : '';
  const btn = (k, label) => { const A = G.FAM_ACT[k], e = G.famCan(k), c = A.cost(L); return `<button class="small ${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="famRes(G.act.famDo('${k}'))">${A.ic} ${esc(t_(label || A.n))}${c ? ' · ' + money(c) : ''}</button>`; };
  let h = `<div class="kpi"><div><b>${Math.floor(age)}</b><span>${t_('років')}</span></div><div><b>${F.gen}</b><span>${t_('покоління')}</span></div><div><b>${F.kids.filter(c => !c.dead).length}</b><span>${t_('дітей')}</span></div>${L.role === 'char' ? `<div><b class="${F.heat > 50 ? 'r' : ''}">${Math.round(F.heat)}</b><span>${t_('підозра')}</span></div>` : ''}</div>`;
  if (age > 65) h += `<div class="card small y">🩺 ${t_('Вік дається взнаки: призначте спадкоємця, щоб династія не обірвалася.')}</div>`;
  h += `<div class="grp">💞 ${t_('Стосунки')}</div>`;
  if (F.spouse) { const s = F.spouse; h += `<div class="card small"><div class="row">${avatar(s.ava, 44, { fem: s.fem })}<div style="flex:1;margin-left:8px"><b>${esc(pName(s.name))}</b> ${s.wed ? '💍' : '💎 ' + t_('заручини')}<div>${P(s.perk)}</div><div class="mut">${t_('Кохання')} ${Math.round(s.love)}</div>${bar(s.love, s.love < 25 ? '#ff6a5a' : '#ff7ab8')}</div></div></div>`; }
  else if (F.date) { const s = F.date; h += `<div class="card small"><div class="row">${avatar(s.ava, 44, { fem: s.fem })}<div style="flex:1;margin-left:8px"><b>${esc(pName(s.name))}</b> · ${s.age} ${t_('р.')}<div>${P(s.perk)}</div><div class="mut">${t_('Кохання')} ${Math.round(s.love)} / 50 ${t_('для освідчення')}</div>${bar(s.love * 2, '#ff7ab8')}</div></div></div>`; }
  else if (F.cands) h += F.cands.map((s, i) => `<div class="card small"><div class="row">${avatar(s.ava, 40, { fem: s.fem })}<div style="flex:1;margin-left:8px"><b>${esc(pName(s.name))}</b> · ${s.age} ${t_('р.')}<div>${P(s.perk)}</div></div><button class="pri small" onclick="famRes(G.act.famPick(${i}))">💘 ${t_('Зустрічатися')}</button></div></div>`).join('');
  else h += `<div class="mut small">${t_('Ви самотні. Знайомства відкриють трьох кандидатів з різними професіями — кожна дає родині свій бонус.')}</div>`;
  h += `<div class="btns">${btn('meet')}${btn('date')}${btn('propose')}${F.spouse && !F.spouse.wed ? btn('wedding') : ''}${btn('family')}${btn('trip')}${F.spouse ? btn('divorce') : ''}</div>`;
  h += `<div class="grp">👶 ${t_('Діти')}</div><div class="btns">${btn('baby')}${btn('adopt')}</div>`;
  const heir = G.heirOf(L);
  h += F.kids.map((c, i) => { if (c.dead) return ''; const a = G.kidAge(c); const sk = Object.entries(c.sk || {}).map(([k, v]) => (G.SKILLS[k] ? G.SKILLS[k].ic : k) + v).join(' ');
    return `<div class="card small"><div class="row">${avatar(c.ava, 38, { fem: c.fem })}<div style="flex:1;margin-left:8px"><b>${esc(pName(c.name))}</b> ${heir === c ? '👑' : ''} · ${Math.floor(a)} ${t_('р.')}<div class="mut">${t_('Освіта')} ${'★'.repeat(c.edu || 0)}${'☆'.repeat(5 - (c.edu || 0))} ${sk}</div>${bar(c.happy || 60, '#ffd34d')}</div></div>
      <div class="btns">${a >= 6 && (c.edu || 0) < 5 ? `<button class="small" onclick="famRes(G.act.kidEdu(${i}))">📚 ${t_('Навчання')}</button><button class="small" onclick="famRes(G.act.kidEdu(${i},'elite'))">🎓 ${t_('Елітна освіта')} ×2.5</button>` : ''}${a >= 16 && heir !== c ? `<button class="small" onclick="famRes(G.act.setHeir(${i}))">👑 ${t_('Зробити спадкоємцем')}</button>` : ''}</div></div>`; }).join('') || `<div class="mut small">${t_('Дітей поки немає.')}</div>`;
  h += `<div class="grp">👑 ${t_('Спадкоємець')}</div><div class="card small">${heir ? `<b>${esc(pName(heir.name))}</b> — ${t_('отримає 70% статків (30% — податок), половину звʼязків і слави, власні навички')}` : `<span class="y">${t_('Немає: дитина від 16 років або подружжя. Без спадкоємця персонаж після смерті завершить династію.')}</span>`}
    ${F.spouse && F.spouse.wed && heir !== F.spouse ? `<div class="btns"><button class="small" onclick="famRes(G.act.setHeir('s'))">👑 ${t_('Спадкоємець — подружжя')}</button></div>` : ''}<div class="btns">${btn('retire')}</div></div>`;
  if (F.siblings && F.siblings.length) h += `<div class="small mut">${t_('Брати й сестри')}: ${F.siblings.map(x => esc(pName(x))).join(', ')}</div>`;
  if (L.role === 'char') {
    h += `<div class="grp">🕶 ${t_('Тіньові справи')}</div><div class="mut small">${t_('Швидкі гроші й звʼязки, але що вища підозра, то більший шанс суду, штрафу й заборони вʼїзду. Адвокат і охорона зменшують ризик.')}</div><div class="btns">`
      + Object.entries(G.SHADOW).map(([k, A]) => { const e = G.shadowCan(k); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="famRes(G.act.shadowDo('${k}'))">${A.ic} ${esc(t_(A.n))}${A.cost ? ' · ' + money(A.cost) : ''}</button>`; }).join('') + '</div>';
    const bans = Object.entries(F.ban || {}).filter(([, d]) => d > G.day); if (bans.length) h += `<div class="small r">⛔ ${t_('Заборона вʼїзду')}: ${bans.map(([n, d]) => esc(nat(+n).name) + ' (' + (d - G.day) + ' ' + t_('дн.') + ')').join(', ')}</div>`;
  }
  return h;
};
// вкладка в рейці
{ const base = window.curTabs; if (base) window.curTabs = function () { const r = base.apply(this, arguments); if (G && G.leader && G.leader.money != null && !r.some(x => x[0] === 'family')) { const i = r.findIndex(x => x[0] === 'life'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['family', '👪 Родина']); } return r; }; }
// дії між державами (панель країни)
function interBlock(x) {
  if (!G || G.player < 0 || x === G.player || !G.INTER) return ''; const mine = (G.secrets || []).filter(s => !s.leak && ((s.a === G.player && s.b === x) || (s.b === G.player && s.a === x)));
  return `<div class="grp">🎭 ${t_('Дії між державами')}${G.humans && G.humans.has(x) ? ' · 🧑 ' + t_('гравець') : ''}</div><div class="btns">` + Object.entries(G.INTER).map(([k, A]) => { const e = G.interCan(G.player, x, k); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="dact2('${k}',${x})">${A.ic} ${esc(t_(A.n))}</button>`; }).join('')
    + mine.map(s => `<button class="small dang" data-tip="${t_('Оприлюднити таємний протокол: партнер втратить стабільність і довіру союзників, ваші відносини з ним — −40')}" onclick="if(confirmBtn(this)){const r=G.act.leakSecret(${s.id});hint(r.ok?'📰 '+t_(r.msg):'⚠ '+t_(r.err),3000);renderRight();}">📰 ${t_('Злити таємний протокол')}</button>`).join('') + '</div>';
}
function confirmBtn(b) { if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = t_('Точно? Ще раз'); return false; }
function dact2(k, x) { const r = G.act.inter(x, k); hint(r && r.ok === false ? '⚠ ' + t_(r.err) : '✅ ' + t_((r && r.msg) || 'Готово'), 3000); renderRight(); renderTop(); }
