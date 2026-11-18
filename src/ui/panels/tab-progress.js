// ДОСЯГНЕННЯ Й СТРАТЕГІЯ: блоки для вкладок «Персонаж» і «Компанія»
function goalsBlock(list, done) {
  const n = list.filter(g => done && done[g[0]]).length;
  return `<div class="grp">🏅 ${t_('Досягнення')} <span class="small mut">${n}/${list.length}</span></div><div class="goals">${list.map(([id, ic, nm]) => `<span class="goal ${done && done[id] ? 'on' : ''}" data-tip="${esc(t_(nm))}">${ic} ${esc(t_(nm))}</span>`).join('')}</div>`;
}
{ const base = TAB_FN.char; TAB_FN.char = function () { const L = G.leader; return base() + (L && L.role === 'char' ? goalsBlock(G.LIFE_GOALS, L.goals) : ''); }; }
{ const base = TAB_FN.co; TAB_FN.co = function () { let h = base(); const c = G.myCo && G.myCo(); if (!c) return h;
    h += `<div class="grp">🧭 ${t_('Стратегія компанії')}</div><div class="btns small">${Object.entries(G.CO_STRAT).map(([k, s]) => `<button class="${(c.strat || 'balanced') === k ? 'on' : ''}" data-tip="${esc(t_(s.d))}" onclick="coAct(()=>G.act.coStrat('${k}'))">${s.ic} ${esc(t_(s.n))}</button>`).join('')}</div><div class="mut small">${esc(t_(G.CO_STRAT[c.strat || 'balanced'].d))}</div>`;
    return h + goalsBlock(G.CO_GOALS, c.goals); }; }

// ДОРУЧЕННЯ
function showQuests() {
  const Q = G.myQuests ? G.myQuests() : []; const nation = G.player >= 0;
  openModal(`<h2>📜 ${t_('Доручення')}</h2><div class="mut small">${t_('Завжди три завдання з терміном. Виконали — нагорода й нове доручення. Прострочили — завдання зміниться.')}</div>` +
    (Q.length ? Q.map((q, i) => `<div class="card"><div class="row"><b>${esc(t_(q.text))}</b><span class="small mut">${t_('до')} ${G.dateStr(q.until)}</span></div><div class="bar"><i style="width:${Math.round((q.p || 0) * 100)}%;background:#ffd34d"></i></div><div class="row small"><span>🎁 ${esc(t_(q.rt))}</span><span>${Math.round((q.p || 0) * 100)}%${nation ? ` <button class="small" onclick="questRe(${i})" data-tip="${t_('Замінити доручення за гроші з бюджету')}">🔄</button>` : ''}</span></div></div>`).join('') : `<div class="card small">${t_('Перші доручення зʼявляться на початку наступного місяця.')}</div>`)
    + `<div class="small mut">${t_('Виконано за гру')}: ${G.questsDone || 0}</div><div class="btns"><button onclick="closeModal()">${t_('Закрити')}</button></div>`);
}
function questRe(i) { const r = G.act.questReroll(i); if (r && r.ok === false) hint('⚠ ' + t_(r.err), 2500); showQuests(); }
