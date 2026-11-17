// ВКЛАДКА «БУДІВНИЦТВО»: будівлі в регіоні, черга, радник з розвитку (автоматичне будівництво), потужності держави.
const BD = D.buildings, BGR = D.buildingGroups;
function fmtIO(b) {
  const f = o => Object.entries(o || {}).map(([r, q]) => `${ico(RI[r].ic)}${q >= 1 ? q.toFixed(q >= 10 ? 0 : 1) : q.toFixed(q >= 0.1 ? 2 : 3)}`).join(' ');
  const effN = { mil: 'арсенал', q: 'якість армії', ships: 'кораблі', grow: 'зростання', stab: 'стабільність', tech: 'технології', supply: 'постачання', fort: 'укріплення', infra: 'інфраструктура', portCost: 'порти', lng: 'СПГ', air: 'авіаміст', shield: 'ППО' };
  const e = Object.keys(b.eff || {}).map(k => effN[k]).join(', ');
  return (b.in ? `<span class="mut">${f(b.in)} →</span> ` : '') + (b.out ? `<b>${f(b.out)}</b>` : '') + (e ? ` <span class="y">${e}</span>` : '');
}
TAB_FN.build = function () {
  const n = nat(G.player), P = G.player; const sub = curSub('build', 'new');
  let h = subnav('build', [['new', 'Будувати'], ['queue', `Черга (${G.constructions.filter(c => c.n === P).length})`], ['adv', 'Радник'], ['cap', 'Потужності']]);
  if (sub === 'new') {
    const i = sel && sel.type === 't' ? sel.id : -1;
    if (i < 0 || G.ter[i].ctrl !== P || G.ter[i].owner !== P) return h + `<div class="card">Оберіть <b>свій регіон</b> на мапі — тут з'явиться перелік доступних будівель.</div>` + advisorCard(n);
    const t = G.ter[i]; const g = curSub('bgrp', 'extract');
    h += `<div class="row"><b>${esc(regName(i))}</b><span class="mut">${G.TERRAIN[D.regions[i].t].n} · ${money(t.gdp)}</span></div>`;
    h += `<div class="sub">${BGR.map(x => `<button class="${g === x.id ? 'on' : ''}" onclick="subtab.bgrp='${x.id}';renderTab(true)">${ico(x.ic)} ${x.n}</button>`).join('')}</div>`;
    Object.entries(BD).filter(([, b]) => b.g === g).forEach(([k, b]) => {
      const err = G.canBuild(P, i, k); const cost = G.buildCost(P, i, k); const lvl = t.bld[k] || 0; const roi = b.va ? (b.va / cost * 100).toFixed(0) + '%/рік' : '';
      h += `<div class="card ${err ? 'soon' : ''}"><div class="row"><b>${ico(b.ic)} ${esc(b.n)}${lvl ? ` <span class="tag">рів. ${lvl}</span>` : ''}</b><span>${money(cost)}</span></div>
      <div class="small">${fmtIO(b)}</div><div class="row small"><span class="mut">${b.days} дн.${roi ? ' · окупність ' + roi : ''}</span>${err ? `<span class="r">${esc(err)}</span>` : `<button class="pri" onclick="doBuild(${i},'${k}')">Будувати</button>`}</div></div>`;
    });
  } else if (sub === 'queue') {
    const q = G.constructions.filter(c => c.n === P).sort((a, b) => a.done - b.done);
    h += q.map(c => { const p = (G.day - c.start) / Math.max(1, c.done - c.start); return `<div class="card"><div class="row"><span>${ico(BD[c.type].ic)} ${esc(BD[c.type].n)}</span><span class="mut">${c.done - G.day} дн.</span></div><div class="row small"><span>${esc(regName(c.t))}</span><button onclick="cancelBuild(${c.id})">✕ Скасувати</button></div><div class="bar"><i style="width:${p * 100}%"></i></div></div>`; }).join('') || '<div class="mut">Черга порожня</div>';
    h += `<div class="grp">Маршрути в будівництві</div>` + (G.links.filter(l => l.n === P && l.done > G.day).map(l => `<div class="row small"><span>${ico(D.linkTypes[l.type].ic)} ${esc(regName(l.a))} — ${esc(regName(l.b))}</span><span>${l.done - G.day} дн.</span></div>`).join('') || '<div class="mut small">немає</div>');
  } else if (sub === 'adv') h += advisorCard(n, true);
  else {
    const tot = {}; G.ter.forEach(t => { if (t.ctrl !== P) return; for (const k in t.bld) tot[k] = (tot[k] || 0) + t.bld[k]; });
    h += BGR.map(g => { const list = Object.entries(BD).filter(([k, b]) => b.g === g.id && tot[k]); return list.length ? `<div class="grp">${ico(g.ic)} ${g.n}</div>` + list.map(([k, b]) => `<div class="row"><span>${ico(b.ic)} ${esc(b.n)}</span><b>${tot[k]}</b></div>`).join('') : ''; }).join('') || '<div class="mut">Нових будівель ще немає. Наявний видобуток і виробництво країни вже враховані в економіці регіонів.</div>';
  }
  return h;
};
function advisorCard(n, full) {
  const d = n.dev; const pr = D.devPriorities;
  return `<div class="card"><div class="row"><b>🤖 Радник з розвитку</b><label><input type="checkbox" ${d.auto ? 'checked' : ''} onchange="nat(G.player).dev.auto=this.checked;renderTab(true)"> автоматично</label></div>
  ${slider('devInv', 'Державні інвестиції (% ВВП на рік)', 0, 0.06, 0.001, d.invest, v => (v * 100).toFixed(1) + '%', `${money(nat(G.player).agg.gdp * d.invest)} на рік · у фонді ${money(d.fund)}`)}
  <div class="row"><span>Пріоритет</span><select onchange="nat(G.player).dev.prio=this.value">${Object.entries(pr).map(([k, v]) => `<option value="${k}" ${d.prio === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>
  <div class="mut small">Радник щомісяця сам обирає найвигідніші проєкти: закриває дефіцити, нарощує експорт, під час війни — оборонку, укріплення й склади. Губернатора окремого регіону можна вимкнути або задати йому свій пріоритет у панелі регіону.</div></div>`;
}
function doBuild(i, k) { const r = G.startBuild(G.player, i, k); hint(r.ok ? `🏗 ${BD[k].n}: ${r.days} дн.` : '⚠ ' + r.err, 3000); renderTab(true); renderTop(); }
function cancelBuild(id) { const c = G.constructions.find(x => x.id === id); if (!c) return; G.constructions = G.constructions.filter(x => x.id !== id); nat(G.player).cash += c.cost * 0.5; hint('Скасовано, повернуто 50% коштів', 2500); renderTab(true); }
