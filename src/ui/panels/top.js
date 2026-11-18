// ВЕРХНЯ ПАНЕЛЬ: держава, дата, швидкість, ключові показники, режим мапи.
function setSpeed(i) { if (NET.isGuest()) { hint('⏱ ' + t_('Швидкістю керує хост'), 2000); return; } speedIdx = i; if (i) lastSpeed = i; renderTop(); }
function setMode(m) { mode = m; mapDirty = true; renderTop(); renderLegend(); }
function toggleLeft() { $('#left').classList.toggle('hide'); renderTabs(); }
const MAP_MODES = [['pol', 'Політична'], ['terrain', 'Рельєф'], ['rel', 'Відносини'], ['trade', 'Торгівля'], ['res', 'Ресурс'], ['gdp', 'ВВП на душу'], ['growth', 'Зростання'], ['stab', 'Стабільність'], ['mil', 'Військова сила'], ['supply', 'Фронти й логістика']];
function renderTop() {
  if (!G) return; { const ae = document.activeElement; if (ae && ae.tagName === 'SELECT' && ae.closest && ae.closest('#top')) return; } // відкритий список не закриваємо
  if (G.player < 0) { const sp0 = ['⏸', '▶', '▶▶', '▶▶▶', '⏩'].map((s, i) => `<button class="${speedIdx === i ? 'on' : ''}" onclick="setSpeed(${i})">${s}</button>`).join(''); $('#top').innerHTML = (G.pc >= 0 ? renderTopCompany(sp0) : renderTopChar(sp0)) + `<select onchange="setMode(this.value)" title="Режим мапи">${MAP_MODES.map(([k, v]) => `<option value="${k}" ${mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select><button onclick="showGoals()" title="Цілі">🏆</button>${window.outChip ? outChip() : ''}<button onclick="saveGame()" title="Зберегти">💾</button><button onclick="menu()" title="Меню">⚙</button>`; return; }
  const n = nat(G.player), A = n.agg; const debtR = n.debt / Math.max(1, A.gdp);
  const sp = ['⏸', '▶', '▶▶', '▶▶▶', '⏩'].map((s, i) => `<button class="${speedIdx === i ? 'on' : ''}" onclick="setSpeed(${i})" title="${['Пауза (пробіл)', '1 день за 10 с · рік ≈ 1 год', '1 день за 3 с · рік ≈ 18 хв', '1 день/с · рік ≈ 6 хв', '4 дні/с · рік ≈ 1.5 хв'][i]}">${s}</button>`).join('');
  const worst = RES.reduce((w, r) => n.ratio[r] < n.ratio[w] ? r : w, 'oil');
  $('#top').innerHTML = `<button onclick="toggleLeft()" title="Панель">☰</button>
    <div class="st"><b>${ndot(n.id)}${esc(n.name)}</b><span>${n.nuke ? '☢ ядерна держава' : 'держава'}</span></div>
    <div class="st"><b>${G.dateStr()}</b><span>день ${G.day}</span></div><div id="speed">${sp}</div>
    <div class="st"><b>${money(A.gdp)} <span class="${n.growth >= 0 ? 'g' : 'r'}" style="font-size:11px">${sgnPct(n.growth)}</span></b><span>ВВП / рік</span></div>
    <div class="st"><b>${money(n.cash)}</b><span>резерви</span></div>
    <div class="st"><b class="${debtR > 1 ? 'r' : debtR > 0.6 ? 'y' : ''}">${pct(debtR, 0)}</b><span>борг/ВВП</span></div>
    <div class="st"><b class="${n.stab < 30 ? 'r' : n.stab < 50 ? 'y' : 'g'}">${n.stab.toFixed(0)}</b><span>стабільність</span></div>
    <div class="st"><b>${people(A.troops || 0)}</b><span>армія</span></div>
    <div class="st"><b class="${n.ratio[worst] < 0.9 ? 'r' : 'g'}">${ico(RI[worst].ic)} ${pct(n.ratio[worst], 0)}</b><span>забезпечення</span></div>
    <div class="st"><b>${G.enemiesOf(n.id).length ? '<span class="r">⚔ ' + G.enemiesOf(n.id).length + '</span>' : '<span class="g">мир</span>'}</b><span>війни</span></div>
    <select onchange="setMode(this.value)" title="Режим мапи">${MAP_MODES.map(([k, v]) => `<option value="${k}" ${mode === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    ${mode === 'res' ? `<select onchange="modeRes=this.value;mapDirty=true;renderLegend()">${RGROUPS.map(g => `<optgroup label="${g.n}">${g.list.map(r => `<option value="${r}" ${modeRes === r ? 'selected' : ''}>${RI[r].ic} ${RI[r].n}</option>`).join('')}</optgroup>`).join('')}</select>` : ''}
    <button onclick="showGoals()" title="Цілі">🏆</button>${window.outChip ? outChip() : ''}<button onclick="saveGame()" title="Зберегти">💾</button><button onclick="menu()" title="Меню">⚙</button>`;
}
function renderLegend() {
  const L = { pol: 'Кольори держав поверх рельєфу. Штрихування з червоним контуром — регіон під чужим контролем. Біла межа — ваші кордони. ◆ — стратегічні протоки (червоні — закриті для вас).',
    terrain: 'Рельєф регіонів: <span style="color:#9bc46a">■</span> рівнина <span style="color:#d8c77a">■</span> степ <span style="color:#3f8a4a">■</span> ліс <span style="color:#a58a5a">■</span> пагорби <span style="color:#8a7a6e">■</span> гори <span style="color:#e3c58a">■</span> пустеля. Гори й ліс дають бонус обороні та сповільнюють наступ.',
    rel: '<span style="color:#3dbd6e">■</span> друзі · <span style="color:#999">■</span> нейтрали · <span style="color:#cd3737">■</span> вороже · <span style="color:#2f6fb0">■</span> союзники · <span style="color:#8a1c1c">■</span> війна',
    trade: 'Обсяг торгівлі з вами. Лінії — торгові маршрути: <span class="g">■</span> ваш експорт, <span style="color:#4fb3ff">■</span> імпорт. Крапки — конвої.',
    res: `${ico(RI[modeRes].ic)} ${RI[modeRes].n}: <span class="g">зелений</span> — регіон виробляє більше, ніж споживає; <span class="r">червоний</span> — дефіцит. Лінії — світові потоки.`,
    gdp: 'ВВП на душу в регіоні.', growth: 'Темп зростання ВВП держав.', stab: 'Внутрішня стабільність.', mil: 'Бойова сила армій.',
    supply: 'Фронти: <span style="color:#7a2323">■</span> ворог, <span style="color:#2e6aa6">■</span> ви, <span style="color:#2e5a6e">■</span> дружні. Пунктир — морські шляхи. Смужка біля армії — постачання; ➤ — наступ.' };
  $('#legend').innerHTML = L[mode] + '<div class="mut small" style="margin-top:4px">ЛКМ — вибір · ПКМ — наказ · Shift+ПКМ — морем · колесо — масштаб · пробіл — пауза</div>';
}
