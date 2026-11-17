// ВКЛАДКА «ЕКОНОМІКА»: ресурси за групами, ринок, партнери, державні контракти. Ринок працює автоматично.
TAB_FN.econ = function () {
  const n = nat(G.player), A = n.agg, P = G.player; const sub = curSub('econ', 'res');
  let h = subnav('econ', [['res', 'Ресурси'], ['partners', 'Партнери'], ['contracts', 'Контракти']]);
  if (sub === 'res') {
    h += `<label class="row" style="cursor:pointer"><span>🤖 Автоматичний ринок (приватні компанії купують і продають самі)</span><input type="checkbox" ${n.autoTrade ? 'checked' : ''} onchange="nat(G.player).autoTrade=this.checked;G.tradeDirty=true"></label>`;
    RGROUPS.forEach(g => {
      h += `<div class="grp">${ico(g.ic)} ${g.n}</div><table><tr><th>Ресурс</th><th>Вироб.</th><th>Потреба</th><th>±</th><th>Забезп.</th><th title="Заборона експорту">⛔</th></tr>`;
      g.list.forEach(r => { const im = n.imp[r] || 0, ex = n.exp[r] || 0, pr = G.prices[r] / G.priceBase[r]; const net = ex ? '<span class="g">+' + qty(r, ex) + '</span>' : im ? '<span style="color:#7cc4ff">−' + qty(r, im) + '</span>' : '–';
        h += `<tr><td title="${RI[r].u}">${ico(RI[r].ic)} ${RI[r].n}<div class="mut small">ціна <span class="${pr > 1.1 ? 'r' : pr < 0.9 ? 'g' : ''}">${pct(pr, 0)}</span> · ${RI[r].u}</div></td><td>${qty(r, A.prod[r])}</td><td>${qty(r, A.need[r])}</td><td>${net}</td><td class="${n.ratio[r] < 0.95 ? 'r' : 'g'}">${pct(n.ratio[r], 0)}</td><td><input type="checkbox" ${n.exportBan[r] ? 'checked' : ''} onchange="nat(G.player).exportBan['${r}']=this.checked;G.tradeDirty=true"></td></tr>`; });
      h += '</table>';
    });
    h += `<div class="row" style="margin-top:6px"><span>Експорт / імпорт</span><span><span class="g">${money(n.stats.exp)}</span> / <span style="color:#7cc4ff">${money(n.stats.imp)}</span></span></div><div class="row"><span>Транспортні витрати</span><span>${money(n.stats.trCost || 0)}</span></div>`;
  } else if (sub === 'partners') {
    const partners = {}; G.flows.forEach(f => { if (f.from === P) { (partners[f.to] = partners[f.to] || { e: 0, i: 0 }).e += f.val; } if (f.to === P) { (partners[f.from] = partners[f.from] || { e: 0, i: 0 }).i += f.val; } });
    const top = Object.entries(partners).sort((a, b) => (b[1].e + b[1].i) - (a[1].e + a[1].i)).slice(0, 20);
    h += `<table><tr><th>Країна</th><th>Експорт</th><th>Імпорт</th></tr>${top.map(([k, v]) => `<tr><td>${nlink(+k)}</td><td class="g">${money(v.e)}</td><td style="color:#7cc4ff">${money(v.i)}</td></tr>`).join('') || '<tr><td colspan=3 class="mut">немає</td></tr>'}</table>`;
  } else {
    const alive = G.N.filter(x => x.alive && x.id !== P).sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    h += `<div class="card"><div class="btns"><select id="ctR">${RGROUPS.map(g => `<optgroup label="${g.n}">${g.list.map(r => `<option value="${r}">${RI[r].ic} ${RI[r].n}</option>`).join('')}</optgroup>`).join('')}</select><select id="ctD"><option value="import">Імпорт від</option><option value="export">Експорт до</option></select></div>
      <div class="btns"><select id="ctP" style="flex:1">${alive.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><input id="ctQ" type="number" min="0.01" step="0.1" value="1" style="width:80px" title="обсяг на рік"></div>
      <div class="btns"><button class="pri" onclick="addContract()">Укласти контракт</button></div><div class="mut small">Контракти мають пріоритет над ринком. Потрібен відкритий маршрут і відсутність санкцій/війни.</div></div>
      ${G.contracts.map(c => `<div class="row"><span>${c.dir === 'import' ? '⬅ Імпорт' : '➡ Експорт'} ${ico(RI[c.r].ic)} ${c.q} · ${esc(nat(c.partner).name)}</span><span>${c.ok ? '<span class="g">діє (' + (c.qa || 0).toFixed(2) + ')</span>' : '<span class="r">' + (c.reason || 'очікує') + '</span>'} <button onclick="G.act.cancelContract(${c.id});renderTab(true)">✕</button></span></div>`).join('')}`;
  }
  return h;
};
function addContract() { G.act.contract($('#ctR').value, +$('#ctP').value, +$('#ctQ').value, $('#ctD').value); hint('Контракт додано — набуде чинності при перерахунку маршрутів', 2500); renderTab(true); }
