// ВКЛАДКА «РОЗВІДКА Й КОСМОС»: супутники, запуски, космічні програми, угоди про розвіддані, інтернет, РЛС, туман війни.
TAB_FN.intel = function () {
  const n = nat(G.player); if (!n || !n.sats) return '';
  const sub = curSub('intel', 'sats'); let h = subnav('intel', [['sats', 'Супутники'], ['space', 'Космічні програми'], ['deals', 'Розвіддані'], ['net', 'Інтернет і РЛС']]);
  const ST = D.satTypes;
  if (sub === 'sats') {
    window._sat = window._sat || { t: 'recon', k: 4 }; const S = window._sat, o = G.satOffer(G.player, S.t, S.k);
    h += `<div class="kpi"><div data-tip="${t_('Стартів на рік: власні майданчики й космодроми')}"><span>${t_('Власні старти')}</span><b>${G.launchCap(G.player) - Math.round(n.space.used || 0)} / ${G.launchCap(G.player)}</b></div><div><span>${t_('Розвідка з космосу')}</span><b class="${G.hasRecon(G.player) ? 'g' : 'r'}">${G.hasRecon(G.player) ? '✓ ' + t_('є') : '✗ ' + t_('немає')}</b></div></div><div class="ars">`;
    Object.entries(ST).forEach(([k, v]) => { h += `<div data-tip="${esc(t_(v.d))}">${ico(v.ic)}<b>${Math.floor(n.sats[k])}</b><span>${esc(t_(v.n))}</span></div>`; });
    h += `</div><div class="grp">${t_('Замовити запуск')}</div><div class="card"><div class="sub">${Object.entries(ST).map(([k, v]) => `<button class="${S.t === k ? 'on' : ''}" onclick="_sat.t='${k}';renderTab(true)">${ico(v.ic)} ${esc(t_(v.n))}</button>`).join('')}</div>
    ${slider('satK', t_('Супутників'), 1, 24, 1, S.k, v => v, '')}
    ${o ? `<div class="row small"><span>${o.own ? t_('Власна ракета') : o.prov >= 0 ? t_('Комерційний запуск') + ': ' + esc(nat(o.prov).name) : t_('Немає ракети')}</span><b>${money(o.cost)} · ${o.days} ${t_('дн.')} · ${Math.round(o.succ * 100)}%</b></div>` : ''}
    <div class="btns"><button class="pri" ${o && o.prov >= 0 ? '' : 'disabled'} onclick="doSat()">🚀 ${t_('Запустити')}</button></div>
    <div class="small mut">${t_('Супутники служать ~8 років. Власний завод супутників і стартовий майданчик (дослідження «Ракети-носії») роблять запуски дешевшими й незалежними.')}</div></div>`;
    if (n.space.q.length) h += `<div class="grp">${t_('Підготовка до запуску')}</div>` + n.space.q.map(q => `<div class="row small"><span>${ico(ST[q.type].ic)} ${esc(t_(ST[q.type].n))} ×${q.cnt}${q.prov !== n.id ? ' · ' + esc(nat(q.prov).name) : ''}</span><span>${q.done - G.day} ${t_('дн.')}</span></div>`).join('');
    const en = G.enemiesOf(G.player); if (en.length) { h += `<div class="grp">☄ ${t_('Протисупутникова зброя')}</div><div class="card">${en.map(e => `<div class="row small"><span>${esc(nat(e).name)}: ${Object.values(nat(e).sats || {}).reduce((a, b) => a + Math.floor(b), 0)} ${t_('супутників')}</span><button ${G.has(n, 'asat') ? '' : 'disabled'} onclick="doAsat(${e})">☄ ${t_('Збити 3')}</button></div>`).join('')}${G.has(n, 'asat') ? '' : `<div class="small y">${t_('Потрібне дослідження «Протисупутникова зброя»')}</div>`}</div>`; }
  } else if (sub === 'space') {
    h += `<div class="mut small">${t_('Великі космічні програми: роки роботи й десятки мільярдів, але — престиж, наука й повага світу. Потрібні власні старти й дослідження.')}</div>`;
    Object.entries(G.SPACE_PROG).forEach(([k, P]) => { const p = n.space.prog && n.space.prog[k]; const pr = p ? Math.min(1, (G.day - p.start) / (p.done - p.start)) : 0;
      h += `<div class="card"><div class="row"><b>${ico(P.ic)} ${esc(t_(P.n))}</b><span>${money(P.cost)} · ${Math.round(P.days / 365)} ${t_('р.')}</span></div><div class="small mut">${esc(t_(P.d))}</div>
      ${p ? (p.ok ? `<div class="g">✓ ${t_('Завершено')}</div>` : `<div class="bar"><i style="width:${pr * 100}%"></i></div><div class="small">${t_('Сплачено')} ${money(p.paid)} · ${t_('до завершення')} ${p.done - G.day} ${t_('дн.')}</div>`) : `<div class="btns"><button class="pri" onclick="doProg('${k}')">${t_('Розпочати')}</button></div>`}</div>`; });
    h += `<div class="row small"><span>${t_('Космічний престиж')}</span><b>${n.space.prest || 0}</b></div>`;
  } else if (sub === 'deals') {
    h += `<div class="mut small">${t_('Без власних розвідсупутників (≥3) розвідку можна орендувати або обмінюватись нею. Союзники по військовому блоку діляться автоматично. Угода — на рік; потрібен візит лідера або дипломат у країні.')}</div>`;
    const cur = Object.entries(n.intel || {}); if (cur.length) h += `<div class="grp">${t_('Чинні угоди')}</div>` + cur.map(([k, d]) => `<div class="row small"><span>🛰 ${esc(nat(+k).name)} · ${d.kind === 'lease' ? t_('оренда') + ' ' + money(d.fee) + '/' + t_('міс.') : t_('обмін')}</span><span>${d.until - G.day} ${t_('дн.')}</span></div>`).join('');
    const prov = G.N.filter(x => x.alive && x.id !== G.player && G.reconOwn(x)).sort((a, b) => G.rel[b.id][G.player] - G.rel[a.id][G.player]);
    h += `<div class="grp">${t_('Хто має розвідсупутники')}</div>` + prov.map(x => `<div class="row small"><span>${esc(x.name)} · 🔭${Math.floor(x.sats.recon)} · ${t_('відносини')} ${G.rel[x.id][G.player].toFixed(0)}</span><span><button ${G.atWar(G.player, x.id) ? 'disabled' : ''} onclick="doIntel(${x.id},'lease')">${t_('Орендувати')}</button>${G.reconOwn(n) ? `<button onclick="doIntel(${x.id},'share')">${t_('Обмін')}</button>` : ''}</span></div>`).join('');
  } else {
    const rs = G.radarSet()[G.player]; const vis = G.visibleFor(G.player);
    h += `<div class="kpi"><div data-tip="${t_('Рівень інтернету: базовий розвиток + оптоволокно, 5G, підводні кабелі, датацентри, супутники звʼязку. Прискорює економіку, але кібератаки болючіші.')}"><span>${t_('Інтернет')}</span><b>${Math.round(n.net * 100)}%</b></div><div data-tip="${t_('Регіони під покриттям ваших РЛС')}"><span>${t_('Покриття РЛС')}</span><b>${rs ? rs.size : 0}</b></div><div><span>${t_('Видимих регіонів')}</span><b>${vis.reduce((a, b) => a + b, 0)}</b></div></div>`;
    h += `<div class="small mut">${t_('Туман війни: видно ваші й союзні території та сусідні з ними, регіони з вашими військами й агентами, зону РЛС. Розвідсупутники (власні, орендовані чи союзні) відкривають увесь ворожий тил.')}</div>`;
    h += `<label class="row"><span>${t_('Туман війни')}</span><input type="checkbox" ${LORA.config.fog !== false ? 'checked' : ''} onchange="LORA.config.fog=this.checked;try{localStorage.setItem('lora_fog',this.checked?'1':'0')}catch(e){};fogCache=null;mapDirty=true"></label>`;
    const NB = Object.entries(D.buildings).filter(([k, b]) => b.g === 'digital' || (b.eff && b.eff.radar)); h += `<div class="grp">${t_('Будівлі')}</div>` + NB.map(([k, b]) => `<div class="row small"><span>${ico(b.ic)} ${esc(t_(b.n))}</span><b>${G.ter.reduce((s, t) => s + (t.owner === G.player ? t.bld[k] || 0 : 0), 0)}</b></div>`).join('') + `<div class="small mut">${t_('Будуються у вкладці «Будівництво».')}</div>`;
  }
  return h;
};
function doSat() { const S = window._sat; const r = G.act.orderSat(S.t, S.k); hint(r.ok ? `🚀 ${t_('Запуск через')} ${r.days} ${t_('дн.')}` : '⚠ ' + r.err, 3000); renderTab(true); }
function doProg(k) { const r = G.act.startProgram(k); hint(r.ok ? '🚀 ' + t_('Програму розпочато') : '⚠ ' + r.err, 3000); renderTab(true); }
function doIntel(x, k) { const r = G.act.intelDeal(x, k); hint(r.ok ? '🛰 ' + t_('Угоду укладено') : '⚠ ' + r.err, 3500); renderTab(true); fogCache = null; }
function doAsat(x) { const r = G.act.asat(x, 3); hint(r.ok ? `☄ ${t_('Збито')} ${r.hit}` : '⚠ ' + r.err, 3000); renderTab(true); }
// ---- туман війни на мапі
let fogCache = null, fogDay = -1, fogG = null, fogP = null;
function fogOn() { return LORA.config.fog !== false && G && G.player >= 0 && !(NET.S.spectator) && !window._follow && !streamView && G.visibleFor; }
function fogVis() { if (!fogOn()) return null; if (!fogCache || fogG !== G || fogP !== G.player || G.day < fogDay || G.day - fogDay >= 3) { if (fogG !== G || fogP !== G.player) { fogCache = null; fogSeaCache = null; } fogG = G; fogP = G.player; const v = G.visibleFor(G.player); if (fogCache && v.some((x, i) => x !== fogCache[i])) mapDirty = true; fogCache = v; fogDay = G.day; } return fogCache; }
try { if (localStorage.getItem('lora_fog') === '0') LORA.config.fog = false; } catch (e) { }
let fogSeaCache = null, fogSeaDay = -1, fogSeaG = null;
function fogSea() { const v = fogVis(); if (!v) return null; if (fogSeaCache && fogSeaDay === fogDay && fogSeaG === G) return fogSeaCache; fogSeaG = G; const s = new Set(); D.regions.forEach((r, i) => { if (v[i]) (r.p || []).forEach(p => { s.add(p[0]); (seaAdj()[p[0]] || []).forEach(x => s.add(x)); }); }); if (G.hasRecon(G.player)) G.fleets.forEach(f => { if (G.atWar(G.player, f.n)) s.add(f.node); }); fogSeaCache = s; fogSeaDay = fogDay; return s; }
let _seaAdj = null; function seaAdj() { if (_seaAdj) return _seaAdj; _seaAdj = {}; D.sea.edges.forEach(([a, b]) => { (_seaAdj[a] = _seaAdj[a] || []).push(b); (_seaAdj[b] = _seaAdj[b] || []).push(a); }); return _seaAdj; }
