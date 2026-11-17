// ВКЛАДКИ «СВІТ», «БУДІВНИЦТВО», «ДОСЛІДЖЕННЯ».
const priceHist = {}; RES.forEach(r => priceHist[r] = []);
function spark(arr) { if (arr.length < 2) return ''; const w = 110, h = 22; const mx = Math.max(1.3, ...arr), mn = Math.min(0.7, ...arr); return `<svg width="${w}" height="${h}" style="vertical-align:middle"><line x1="0" x2="${w}" y1="${h - (1 - mn) / (mx - mn) * h}" y2="${h - (1 - mn) / (mx - mn) * h}" stroke="#3a4a5a" stroke-dasharray="2,2"/><polyline fill="none" stroke="#4fb3ff" stroke-width="1.5" points="${arr.map((v, i) => (i / (arr.length - 1) * w).toFixed(1) + ',' + (h - (v - mn) / (mx - mn) * h).toFixed(1)).join(' ')}"/></svg>`; }
TAB_FN.world = function () {
  const wsub = curSub('world', 'main'); const head = subnav('world', [['main', 'Огляд'], ['balance', 'Баланс і ШІ']]);
  if (wsub === 'balance') return head + balanceTab();
  const alive = G.N.filter(x => x.alive); const byG = alive.slice().sort((a, b) => b.agg.gdp - a.agg.gdp).slice(0, 15);
  const pw = alive.map(x => ({ x, p: G.nationPower(x.id) })).sort((a, b) => b.p - a.p).slice(0, 15); const tot = alive.reduce((s, x) => s + x.agg.gdp, 0);
  return head + `<div class="kpi"><div><span>Світовий ВВП</span><b>${money(tot)}</b></div><div><span>Держав</span><b>${alive.length}</b></div><div><span>Пар у війні</span><b>${G.wars.size}</b></div><div><span>Торгових потоків</span><b>${G.flows.length}</b></div></div>
  <div class="grp">Ціни на сировину (від бази)</div>${RGROUPS.map(g => g.list.map(r => `<div class="row"><span>${ico(RI[r].ic)} ${RI[r].n}</span><span>${spark(priceHist[r])} <b class="${G.prices[r] / G.priceBase[r] > 1.1 ? 'r' : ''}">${pct(G.prices[r] / G.priceBase[r], 0)}</b></span></div>`).join('')).join('')}
  <div class="grp">Найбільші економіки</div><table><tr><th>Країна</th><th>ВВП</th><th>Зрост.</th></tr>${byG.map(x => `<tr><td>${nlink(x.id)}</td><td>${money(x.agg.gdp)}</td><td class="${x.growth >= 0 ? 'g' : 'r'}">${sgnPct(x.growth)}</td></tr>`).join('')}</table>
  <div class="grp">Військова сила</div><table><tr><th>Країна</th><th>Сила</th><th>Склад</th></tr>${pw.map(o => `<tr><td>${nlink(o.x.id)}${o.x.nuke ? ' ☢' : ''}</td><td>${o.p.toFixed(0)}</td><td>${people(o.x.agg.troops || 0)}</td></tr>`).join('')}</table>`;
};

function balanceTab() {
  const DB = D.balance;
  const rows = Object.entries(DB).map(([k, v]) => { const cur = G.B[k]; const ch = Math.abs(cur - v.value) / Math.max(1e-9, v.value) > 0.005; return `<div class="row small"><span>${esc(v.n)}</span><b class="${ch ? 'y' : ''}">${+cur.toPrecision(3)}</b></div>`; }).join('');
  const log = (G.balanceLog || []).slice(0, 25).map(l => `<div class="row small"><span>${G.dateStr(l.d)} · ${esc(D.balance[l.key] ? D.balance[l.key].n : l.key)}</span><span>${l.from} → <b>${l.to}</b></span></div><div class="mut small" style="margin:-2px 0 4px">${esc(l.why)}</div>`).join('');
  const learners = G.N.filter(n => n.alive && n.ai && Math.abs(n.ai.learn) > 0.02).sort((a, b) => Math.abs(b.ai.learn) - Math.abs(a.ai.learn)).slice(0, 10);
  return `<div class="card small">Гра стежить за собою: раз на місяць «режисер» перевіряє, чи не завмер фронт, чи немає розгромів і надмірних втрат, як росте світова економіка й чи не надто мирно або воєнно у світі, — і м'яко підкручує параметри в безпечних межах. Агенти держав запам'ятовують, які наступи вдалися, і стають сміливішими або обережнішими.</div>
  <div class="grp">Зміни балансу</div>${log || '<div class="mut small">Поки без змін — усе в межах цілей.</div>'}
  <div class="grp">Досвід агентів</div>${learners.map(n => `<div class="row small"><span>${nlink(n.id)}</span><span>${n.ai.learn > 0 ? '<span class="y">обережніший</span>' : '<span class="g">сміливіший</span>'} (${(n.ai.learn * 100).toFixed(0)}%) · операцій: ${n.ai.memory.length}</span></div>`).join('') || '<div class="mut small">Агенти ще не мали бойового досвіду.</div>'}
  <div class="grp">Поточні параметри</div>${rows}`;
}
