// ВКЛАДКА «ЛОГІСТИКА»: протоки й канали, ключові маршрути, блокади, постачання армій.
TAB_FN.logi = function () {
  const sub = curSub('logi', 'choke'); const head = subnav('logi', [['choke', 'Протоки й потоки'], ['routes', 'Маршрути'], ['new', 'Прокласти маршрут']]);
  if (sub !== 'choke') return head + linksTab(sub);
  const P = G.player; const blk = G.seaBlockedFor(P); const NC = G.NC;
  const ch = G.chokeIdx.map(ci => { const s = D.sea.nodes[ci]; const tr = G.chokeTraffic ? G.chokeTraffic[ci] : 0; let mine = 0; G.flows.forEach(f => { if ((f.from === P || f.to === P) && f.path.includes(NC + ci)) mine += f.val; });
    let st = '<span class="g">відкрито</span>'; if (G.seaClosed[ci] > G.day) st = '<span class="r">закрито (' + (G.seaClosed[ci] - G.day) + ' дн.)</span>'; else if (s.id === 'NSR' && blk[ci]) st = '<span class="y">льоди (лип–жов)</span>'; else if (blk[ci]) st = '<span class="r">закрито для вас</span>';
    return `<tr><td><a href="#" onclick="focusLonLat(${s.lon},${s.lat},Math.max(view.s,8));return false" style="color:#cfe6ff">${esc(s.n)}</a><div class="mut small">${(s.ctl || []).map(a => G.nIdx[a] != null ? esc(nat(G.nIdx[a]).name) : a).join(', ')}</div></td><td>${st}</td><td>${money(tr)}</td><td>${mine ? money(mine) : '–'}</td></tr>`; }).join('');
  const routes = G.flows.filter(f => f.to === P || f.from === P).sort((a, b) => b.val - a.val).slice(0, 14).map(f => { const chokes = f.path.filter(u => u >= NC && D.sea.nodes[u - NC].ctl).map(u => D.sea.nodes[u - NC].n); const sea = f.path.some(u => u >= NC);
    return `<tr><td>${ico(RI[f.r].ic)} ${f.from === P ? '➡ ' + esc(nat(f.to).name) : '⬅ ' + esc(nat(f.from).name)}<div class="mut small">${sea ? '🚢 море' : RI[f.r].mode === 1 ? '🛢 трубопровід' : '🚆 залізниця/авто'}${chokes.length ? ' · ' + chokes.join(' → ') : ''}</div></td><td>${(f.km / 1000).toFixed(1)} тис. км</td><td>${money(f.val)}</td></tr>`; }).join('');
  const blockades = G.fleets.filter(f => G.atWar(f.n, P) && !f.mv).map(f => `<div class="row"><span>⛴ ${esc(nat(f.n).name)} — ${esc(D.sea.nodes[f.node].n)}</span><span class="r">${f.s.toFixed(0)} кор.</span></div>`).join('');
  const arms = G.armies.filter(a => a.n === P).map(a => `<div class="row"><span>${esc(a.name)} · ${esc(regName(a.t))}</span><span class="${a.sup < 0.5 ? 'r' : a.sup < 0.75 ? 'y' : 'g'}">${pct(a.sup, 0)} → ${pct(a.supTarget || a.sup, 0)}</span></div>`).join('');
  return head + `<div class="grp">Стратегічні протоки й канали</div><table><tr><th>Вузол</th><th>Статус</th><th>Світ</th><th>Ви</th></tr>${ch}</table>
  <div class="mut small">Контролер протоки закриває її для ворогів і країн під своїми санкціями — торгівля йде довшими й дорожчими маршрутами.</div>
  <div class="grp">Ваші ключові маршрути</div><table><tr><th>Потік</th><th>Довжина</th><th>Вартість</th></tr>${routes || '<tr><td colspan=3 class="mut">немає</td></tr>'}</table>
  <div class="grp">Ворожі блокади</div>${blockades || '<div class="mut">Немає</div>'}
  <div class="grp">Постачання армій</div>${arms || '<div class="mut">Немає армій</div>'}
`;
};

let linkDraft = null;
function linksTab(sub) {
  const P = G.player, LT = D.linkTypes;
  if (sub === 'routes') {
    const mine = G.links.filter(l => l.n === P || G.ter[l.a].ctrl === P || G.ter[l.b].ctrl === P);
    return (mine.map(l => { const st = G.linkVisible(l); return `<div class="card small"><div class="row"><b>${ico(LT[l.type].ic)} ${LT[l.type].n}</b><span class="${st === 'cut' ? 'r' : st === 'build' ? 'y' : 'g'}">${st === 'cut' ? 'перерізано війною' : st === 'build' ? 'будується ' + (l.done - G.day) + ' дн.' : 'працює'}</span></div><div class="row"><span>${esc(regName(l.a))} — ${esc(regName(l.b))}</span><span>${Math.round(l.km)} км</span></div></div>`; }).join('') || '<div class="mut">Власних маршрутів ще немає.</div>')
      + '<div class="mut small">Залізниці й автошляхи прискорюють перекидання військ і постачання, міждержавні маршрути здешевлюють торгівлю (труби — газ, залізниця — сировина й контейнери, авто — контейнери). Авіаміст — швидке перекидання військ і цінних вантажів.</div>';
  }
  const d = linkDraft || { type: 'rail', a: sel && sel.type === 't' ? sel.id : -1 };
  linkDraft = d;
  let h = `<div class="sub">${Object.entries(LT).map(([k, v]) => `<button class="${d.type === k ? 'on' : ''}" onclick="linkDraft.type='${k}';renderTab(true)">${ico(v.ic)} ${v.n}</button>`).join('')}</div>`;
  h += `<div class="row"><span>Початок</span><b>${d.a >= 0 ? esc(regName(d.a)) : '— оберіть регіон на мапі'}</b></div>`;
  h += `<div class="btns"><button onclick="if(sel&&sel.type==='t'){linkDraft.a=sel.id;renderTab(true)}">📍 Взяти вибраний регіон</button>${d.a >= 0 ? `<button class="pri" onclick="orderMode='link';hint('Клікніть кінцевий регіон маршруту')">🎯 Обрати кінець на мапі</button>` : ''}</div>`;
  h += `<div class="mut small">Ціна залежить від довжини й рельєфу: гори — майже вдвічі дорожче. Маршрут через кордон потребує згоди сусіда (відносини ≥ 40) і покращує відносини.</div>`;
  return h;
}
function startLinkFrom(i) { linkDraft = { type: (linkDraft && linkDraft.type) || 'rail', a: i }; tab = 'logi'; subtab.logi = 'new'; renderTabs(); renderTab(true); $('#left').classList.remove('hide'); orderMode = 'link'; hint('Клікніть кінцевий регіон маршруту'); }
function finishLink(b) {
  const d = linkDraft; orderMode = null; if (!d || d.a < 0) return;
  const err = G.canLink(G.player, d.type, d.a, b); const q = G.linkQuote(d.type, d.a, b); const L = D.linkTypes[d.type];
  if (err) { hint('⚠ ' + err, 3500); return; }
  openModal(`<h2>${ico(L.ic)} ${L.n}</h2><div class="row"><span>Маршрут</span><b>${esc(regName(d.a))} — ${esc(regName(b))}</b></div><div class="row"><span>Довжина</span><span>${Math.round(q.km)} км</span></div><div class="row"><span>Вартість</span><b>${money(q.cost)}</b></div><div class="row"><span>Термін</span><span>${q.days} дн.</span></div>
  <div class="btns"><button class="pri" onclick="G.startLink(G.player,'${d.type}',${d.a},${b});closeModal();renderTab(true);renderTop()">Будувати</button><button onclick="closeModal()">Скасувати</button></div>`);
}
