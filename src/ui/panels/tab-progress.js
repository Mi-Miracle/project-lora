// ДОСЯГНЕННЯ Й СТРАТЕГІЯ: блоки для вкладок «Персонаж» і «Компанія»
function goalsBlock(list, done) {
  const n = list.filter(g => done && done[g[0]]).length;
  return `<div class="grp">🏅 ${t_('Досягнення')} <span class="small mut">${n}/${list.length}</span></div><div class="goals">${list.map(([id, ic, nm]) => `<span class="goal ${done && done[id] ? 'on' : ''}" data-tip="${esc(t_(nm))}">${ic} ${esc(t_(nm))}</span>`).join('')}</div>`;
}
{ const base = TAB_FN.char; TAB_FN.char = function () { const L = G.leader; return base() + (L && L.role === 'char' ? goalsBlock(G.LIFE_GOALS, L.goals) : ''); }; }
{ const base = TAB_FN.co; TAB_FN.co = function () { let h = base(); const c = G.myCo && G.myCo(); if (!c) return h;
    h += `<div class="grp">🧭 ${t_('Стратегія компанії')}</div><div class="btns small">${Object.entries(G.CO_STRAT).map(([k, s]) => `<button class="${(c.strat || 'balanced') === k ? 'on' : ''}" data-tip="${esc(t_(s.d))}" onclick="coAct(()=>G.act.coStrat('${k}'))">${s.ic} ${esc(t_(s.n))}</button>`).join('')}</div><div class="mut small">${esc(t_(G.CO_STRAT[c.strat || 'balanced'].d))}</div>`;
    return h + goalsBlock(G.CO_GOALS, c.goals); }; }
