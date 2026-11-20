// ВКЛАДКА «ДОСЛІДЖЕННЯ»: дерево технологій за епохами й гілками, поточне дослідження, черга, фінансування науки.
function techEff(e) {
  const P = [];
  if (e.g) P.push('+' + (e.g * 100).toFixed(1) + '% ' + t_('зростання')); if (e.q) P.push('+' + (e.q * 60).toFixed(0) + '% ' + t_('якість армії')); if (e.nav) P.push('+' + (e.nav * 60).toFixed(0) + '% ' + t_('флот'));
  if (e.tech) P.push('+' + (e.tech * 100).toFixed(0) + ' ' + t_('технології')); if (e.sup) P.push('+' + (e.sup * 100).toFixed(0) + '% ' + t_('постачання')); if (e.build) P.push('−' + (e.build * 100).toFixed(0) + '% ' + t_('час будівництва'));
  if (e.cyber) P.push(t_('кіберзахист') + ' +' + (e.cyber * 100).toFixed(0) + '%'); if (e.stab) P.push('+' + e.stab + ' ' + t_('стабільність'));
  if (e.prod) P.push(Object.entries(e.prod).map(([r, m]) => RI[r].ic + '+' + ((m - 1) * 100).toFixed(0) + '%').join(' '));
  if (e.um) P.push(Object.entries(e.um).map(([k, v]) => `${ico(D.armyTypes[k].ic)} ${t_(D.armyTypes[k].n)} +${Math.round(v * 100)}%`).join(' · '));
  if (e.air) P.push(Object.entries(e.air).map(([k, v]) => `${ico(D.airTypes[k].ic)} ${t_(D.airTypes[k].n)} +${Math.round(v * 100)}%`).join(' · '));
  if (e.ul && D.units[e.ul]) P.push(`🏭 ${t_('виробництво')}: ${t_(D.units[e.ul].n)}`);
  return P.join(' · ');
}
const techName = id => LORA.lang === 'en' ? D.techs[id].en : D.techs[id].n;
function resAct(fn) { const r = fn(); if (r && r.ok === false) hint('⚠ ' + r.err, 3000); renderTab(true); }
let resGrantAmt = 1;
function resBranchCard(n, b, B) {
  const R = G.resEnsure(n), A = R.act[b], yr = G.resBranchPts(n, b), w = R.alloc[b] || 0;
  let h = `<div class="card small resbr"><div class="row"><b>${ico(B.ic)} ${esc(LORA.lang === 'en' ? B.en : B.n)}</b><span>${pct(G.resShare(n, b), 0)} · ${yr.toFixed(0)} ${t_('очок/рік')} · ${t_('пул')} <b>${Math.floor(R.bp[b] || 0)}</b></span></div>`;
  h += `<div class="row"><span>${t_('Частка бюджету')}</span><input type="range" min="0" max="10" step="1" value="${w}" onchange="resAct(()=>G.act.resAlloc('${b}',+this.value))" style="width:45%"><b>${w}</b></div>`;
  if (A) { const c = G.techCost(n, A.id), p = Math.min(1, A.p / c); h += `<div class="row"><span>🔬 ${esc(techName(A.id))}</span><b>${pct(p, 0)}</b></div><div class="bar"><i style="width:${p * 100}%;background:#9b7bff"></i></div><div class="mut">${t_('Залишилось')} ≈ ${yr > 0 ? Math.ceil((c - A.p) / yr * 365) + ' ' + t_('дн.') : '∞'}</div>`; }
  else h += `<div class="y">${t_('Немає активного дослідження — очки накопичуються в пулі')}</div>`;
  h += `<div class="btns"><button class="small" ${n.cash < resGrantAmt ? 'disabled' : ''} data-tip="${t_('Разовий грант у сферу: гроші з бюджету → очки цієї сфери')}" onclick="resAct(()=>G.act.resGrant('${b}',resGrantAmt))">💰 ${t_('Грант')} ${money(resGrantAmt)} → +${G.resGrantPts(n, resGrantAmt)}</button></div></div>`;
  return h;
}
TAB_FN.tech = function () {
  const n = nat(G.player), R = G.resEnsure(n), TT = D.techs; const pts = R.pts || G.sciencePerYear(n);
  if (/^[1-4]$/.test(subtab.tech || '')) subtab.tech = 'econ';
  const BR = Object.entries(D.techBranches); const cnt = b => { const L = Object.entries(TT).filter(([, t]) => t.br === b); return `${L.filter(([id]) => R.done[id] != null).length}/${L.length}`; };
  let h = subnav('tech', [['sph', '💡 ' + t_('Сфери')], ...BR.map(([b, B]) => [b, B.ic + ' ' + (LORA.lang === 'en' ? B.en : B.n).split(/ [&йі] /)[0] + ' ' + cnt(b)])]);
  const doneN = Object.keys(R.done).length;
  h += `<div class="card"><div class="row"><span>${t_('Очки науки / рік')}</span><b>${pts.toFixed(0)}</b></div><div class="row"><span>${t_('Досліджено')}</span><b>${doneN} / ${Object.keys(TT).length}</b></div><div class="row"><span>${t_('Активних досліджень')}</span><b>${Object.keys(R.act).length}</b></div>`;
  if (R.queue.length) h += `<div class="small mut">${t_('Черга')}: ${R.queue.map(id => esc(techName(id))).join(' → ')} <a href="#" onclick="nat(G.player).res.queue=[];renderTab(true);return false">✕</a></div>`;
  h += `<label class="row" style="cursor:pointer"><span>🤖 ${t_('Автовибір дослідження в кожній сфері')}</span><input type="checkbox" ${R.auto ? 'checked' : ''} onchange="G.act.resAuto(this.checked)"></label>`
    + slider('res', t_('Видатки на науку (% ВВП)'), 0, 0.06, 0.001, n.pol.res, v => (v * 100).toFixed(1) + '%', t_('Бюджет науки ділиться між сферами за частками; у кожній сфері — свій пул очок і своє дослідження')) + '</div>';
  const cur0 = curSub('tech', 'sph');
  if (cur0 === 'sph' || !D.techBranches[cur0]) {
    h += `<div class="mut small">${t_('Вкладайте гроші у сфери: щорічний бюджет розподіляється за частками, разові гранти миттєво дають очки сфери. Очки витрачаються на дослідження цієї сфери (вибір — у вкладках епох).')}</div>`;
    h += `<div class="btns small"><span class="mut" style="align-self:center">${t_('Грант')}:</span>${[0.5, 1, 5, 20].map(v => `<button class="${resGrantAmt === v ? 'on' : ''}" onclick="resGrantAmt=${v};renderTab(true)">${money(v)}</button>`).join('')}</div>`;
    Object.entries(D.techBranches).forEach(([b, B]) => { h += resBranchCard(n, b, B); });
    return h;
  }
  const b = cur0, B = D.techBranches[b], eraF = curSub('tera', 'all');
  const eraBtn = e => { const L = Object.entries(TT).filter(([, t]) => t.br === b && (e === 'all' || t.era === +e)); return `<button class="small ${eraF === e ? 'on' : ''}" onclick="subtab.tera='${e}';renderTab(true)">${e === 'all' ? t_('Усі') : (e === '0' ? t_('90-ті') : t_('Епоха') + ' ' + ['I', 'II', 'III', 'IV'][e - 1])} · ${L.filter(([id]) => R.done[id] != null).length}/${L.length}</button>`; };
  h += `<div class="btns">${['all', '0', '1', '2', '3', '4'].map(eraBtn).join('')}</div>`;
  h += resBranchCard(n, b, B);
  h += `<div class="mut small">${t_('Що більше країн уже має технологію, то дешевше її освоїти; союзники діляться знаннями; під час війни військові дослідження вдвічі дешевші.')}</div>`;
  { let lastEra = -1;
    const list = Object.entries(TT).filter(([, t]) => t.br === b && (eraF === 'all' || t.era === +eraF)).sort((x, y) => x[1].era - y[1].era || (R.done[x[0]] != null) - (R.done[y[0]] != null) || x[1].c - y[1].c);
    if (!list.length) h += `<div class="mut small">${t_('У цій епосі досліджень гілки немає')}</div>`;
    list.forEach(([id, t]) => {
      if (t.era !== lastEra) { lastEra = t.era; h += `<div class="grp">${esc(LORA.lang === 'en' ? D.techEras[t.era].en : D.techEras[t.era].n)}</div>`; }
      const done = R.done[id] != null, av = G.techAvail(n, id), cur = !!(R.act[t.br] && R.act[t.br].id === id), cost = G.techCost(n, id), share = G.techOwnersShare(id), bpts = G.resBranchPts(n, t.br);
      const reqs = (t.req || []).map(r => `<span class="${R.done[r] != null ? 'g' : 'r'}">${esc(techName(r))}</span>`).join(', ');
      const unl = [...(t.unlock || []).map(k => ico(D.buildings[k].ic) + ' ' + esc(t_(D.buildings[k].n))), ...Object.entries(D.models || {}).flatMap(([ty, L]) => L.filter(m => m.rt === id).map(m => ico(m.ic) + ' ' + esc(t_(m.n)))), ...Object.entries(D.buildings).filter(([k, b]) => b.req && b.req.rt === id && !(t.unlock || []).includes(k)).map(([k, b]) => ico(b.ic) + ' ' + esc(t_(b.n)))].join(', ');
      const coU = Object.values(D.corpRD || {}).flat().filter(r => r[5] === id).map(r => esc(t_(r[1]))); 
      h += `<div class="card ${done ? '' : av ? '' : 'soon'}" style="${cur ? 'border-color:#9b7bff' : ''}"><div class="row"><b>${done ? '✅' : cur ? '🔬' : av ? '◻' : '🔒'} ${esc(techName(id))}</b><span class="small">${done ? t_('готово') : cost + ' ' + t_('очок') + ' · ≈' + (cost / Math.max(1, bpts)).toFixed(1) + ' ' + t_('р.') + (t.gr ? ' · ' + t_('грейд') + ' ' + ['I', 'II', 'III'][t.gr - 1] : '')}</span></div>
        <div class="small">${techEff(t.e || {})}${t.d ? `<br><span class="y">${esc(t_(t.d))}</span>` : ''}${unl ? `<br>${t_('Відкриває')}: ${unl}` : ''}${coU.length ? `<br>🏢 ${t_('Компаніям країни')}: ${coU.join(', ')}` : ''}</div>${reqs ? `<div class="small mut">${t_('Потрібно')}: ${reqs}</div>` : ''}<div class="small mut">${t_('Має у світі')}: ${pct(share, 0)} ${t_('ВВП')}</div>
        ${!done ? `<div class="btns">${av && !cur ? `<button class="pri" onclick="resAct(()=>G.setResearch(G.player,'${id}'))">🔬 ${t_('Дослідити')}${R.act[t.br] ? ' (' + t_('замість поточного') + ')' : ''}</button>` : ''}${!R.queue.includes(id) && !cur ? `<button onclick="resAct(()=>G.queueResearch(G.player,'${id}'))">➕ ${t_('В чергу')}</button>` : ''}</div>` : ''}</div>`;
    });
  }
  return h;
};
