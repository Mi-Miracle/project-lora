// ВКЛАДКА «КОМПАНІЯ»: огляд, активи, офіси, вплив (лобізм і захоплення держави), рейтинг конкурентів.
// Також дії компанії в правій панелі регіону та шар офісів/активів на мапі.
const CO_TABS = [['co', '🏢 Компанія'], ['world', '📊 Світ']];
function coSec(c) { return D.companySectors[c.sector]; }
function coAct(fn) { const r = fn(); hint(r && r.ok === false ? '⚠ ' + r.err : (r && r.msg) || 'Готово', 3000); renderTab(true); renderTop(); if (sel) renderRight(); }
TAB_FN.co = function () {
  const c = G.myCo(); if (!c) return '<div class="mut">Компанії немає.</div>';
  const s = coSec(c), cur = curSub('co', 'over'); let h = subnav('co', [['over', 'Огляд'], ['assets', 'Активи'], ['offices', 'Офіси'], ['infl', 'Вплив'], ['rank', 'Конкуренти']]);
  if (cur === 'over') {
    const val = G.coValue(c), assets = c.assets.reduce((a, x) => a + x.lvl, 0);
    h += `<h3>${ico(s.ic)} ${esc(c.name)}</h3><div class="mut small">${esc(s.n)} · ${esc(s.d)}</div>
    <div class="row"><span>Вартість компанії</span><b>${money(val)}</b></div><div class="row"><span>Вільні кошти</span><b class="${c.cash < 0 ? 'r' : ''}">${money(c.cash)}</b></div>
    <div class="row"><span>Прибуток до податків / рік</span><b class="g">${money(c.profitY)}</b></div><div class="row"><span>Податки / рік</span><b class="y">${money(c.taxY)}</b></div>
    <div class="row"><span>Основний бізнес (не розкладений по регіонах)</span><span>${money(c.base)}</span></div>
    <div class="row"><span>Активів (рівнів)</span><span>${assets} · у будівництві ${c.pend.length}</span></div><div class="row"><span>Офісів</span><span>${c.offices.length} · штаб: ${esc(G.T[c.offices.find(o => o.hq).t].n)}, ${esc(nat(c.home).name)}</span></div>
    ${c.hist.length > 2 ? spark(c.hist) : ''}
    ${c.board ? `<div class="grp">👔 ${t_('Рада директорів')}</div><div class="row"><span data-tip="${t_('Задоволеність ради зростанням вартості компанії. Нижче 55 — великі витрати (понад чверть вартості) потребують схвалення; нижче 12 — ризик звільнення CEO')}">${t_('Задоволеність')}</span><b class="${c.board.sat > 55 ? 'g' : c.board.sat > 25 ? 'y' : 'r'}">${c.board.sat.toFixed(0)}</b></div><div class="bar"><i style="width:${c.board.sat}%"></i></div>` : ''}
    <div class="card small">Як рости: купуйте <b>офіси</b> в країнах (клік по регіону на мапі → «Купити офіс»), будуйте профільні <b>активи</b>, вкладайте в <b>лобізм</b>. Коли вплив ≥ 70 і уряд слабкий — можна <b>перебрати владу</b> в державі й керувати нею.</div>`;
    if (G.player >= 0) h += `<div class="card g small">Ви також керуєте державою: ${esc(nat(G.player).name)}.</div>`;
  } else if (cur === 'assets') {
    h += c.assets.length ? c.assets.map(a => `<div class="row small" style="cursor:pointer" onclick="focusReg(${a.t})"><span>${ico(D.buildings[a.type].ic)} ${esc(D.buildings[a.type].n)} · ${esc(G.T[a.t].n)}</span><b>рів. ${a.lvl} · ${money(G.assetProfit(c, a))}/р</b></div>`).join('') : '<div class="mut">Активів ще немає. Оберіть регіон у країні, де є ваш офіс, і збудуйте актив у правій панелі.</div>';
    if (c.pend.length) h += `<div class="grp">Будується</div>` + c.pend.map(p => `<div class="row small"><span>🏗 ${esc(D.buildings[p.type].n)} · ${esc(G.T[p.t].n)}</span><span>${Math.max(0, p.done - G.day)} дн.</span></div>`).join('');
    h += `<div class="grp">Профільні активи</div>` + s.assets.map(k => `<div class="small">${ico(D.buildings[k].ic)} ${esc(D.buildings[k].n)} — від ${money(D.buildings[k].cost)}</div>`).join('');
  } else if (cur === 'offices') {
    h += c.offices.map(o => `<div class="row small" style="cursor:pointer" onclick="focusReg(${o.t})"><span>${o.hq ? '⭐ штаб' : '🏢 філія'} · ${esc(G.T[o.t].n)}, ${esc(nat(o.n).name)}</span><span>податок ${pct(Math.max(0.05, nat(o.n).pol.tax * 0.7 - (c.infl[o.n] || 0) * 0.002), 0)}</span></div>`).join('');
    h += `<div class="card small">Новий офіс: клацніть регіон на мапі будь-якої країни (не у війні з країною штабу й без санкцій) → «Купити офіс». Ціна залежить від економіки регіону й країни. Офіс дозволяє будувати активи та лобіювати в цій країні. Штаб можна перенести в країну, де є офіс.</div>`;
  } else if (cur === 'infl') {
    const list = c.offices.map(o => o.n);
    h += `<div class="mut small">Вплив росте від лобізму та від частки ваших активів в економіці країни, повільно згасає. ≥ 30 — податкові пільги, ≥ 50 — захист від націоналізації, ≥ 70 — можна перебрати владу.</div>`;
    h += list.map(nid => { const v = c.infl[nid] || 0, n = nat(nid), err = G.coCanTakeover(c, nid);
      return `<div class="card"><div class="row"><b>${ndot(nid)}${esc(n.name)}</b><b class="${v >= 70 ? 'g' : v >= 30 ? 'y' : ''}">${v.toFixed(0)}</b></div><div class="bar"><i style="width:${v}%;background:${v >= 70 ? '#4cd28a' : '#4fb3ff'}"></i></div>
      <div class="small mut">ВВП ${money(n.agg.gdp)} · стабільність ${n.stab.toFixed(0)} · ваші активи ${money(G.coAssetsIn(c, nid))}</div>
      <div class="btns"><span class="small mut" style="align-self:center">Лобізм:</span>${[0.1, 0.5, 2].map(v => `<button onclick="coAct(()=>G.coLobby(G.myCo(),${nid},${v}))" ${c.cash < v ? 'disabled' : ''}>${money(v)}</button>`).join('')}
      ${nid !== G.player ? `<button class="${err ? '' : 'pri'}" onclick="coTakeover(${nid})" title="${esc(err || 'Профінансувати зміну влади')}" ${err ? 'disabled' : ''}>👑 Перебрати владу (${money(G.takeoverCost(c, nid))})</button>` : ''}</div>${err && nid !== G.player ? `<div class="small mut">${esc(err)}</div>` : ''}</div>`; }).join('');
  } else {
    const L = G.companies.filter(x => x.alive).sort((a, b) => G.coValue(b) - G.coValue(a));
    h += L.slice(0, 30).map((x, k) => `<div class="row small ${x.id === G.pc ? 'g' : ''}"><span>${k + 1}. ${ico(D.companySectors[x.sector].ic)} ${esc(x.name)} · ${esc(nat(x.home).name)}</span><b>${money(G.coValue(x))}</b></div>`).join('');
  }
  return h;
};
function spark(arr) { const mx = Math.max(...arr), mn = Math.min(...arr), w = 300, hh = 46; const pts = arr.map((v, k) => `${(k / (arr.length - 1) * w).toFixed(1)},${(hh - (v - mn) / Math.max(1e-9, mx - mn) * (hh - 4) - 2).toFixed(1)}`).join(' ');
  return `<svg width="100%" viewBox="0 0 ${w} ${hh}" style="margin:6px 0"><polyline points="${pts}" fill="none" stroke="#4fb3ff" stroke-width="2"/></svg>`; }
function focusReg(i) { const c = D.regions[i].c; sel = { type: 't', id: i }; focusLonLat(c[0], c[1], Math.max(view.s, 8)); renderRight(); }
function coTakeover(nid) {
  const c = G.myCo(); openModal(`<h2>👑 Перебрати владу: ${esc(nat(nid).name)}?</h2><p>Компанія профінансує політичну кампанію (${money(G.takeoverCost(c, nid))}). Ви станете урядом цієї держави: керуватимете економікою, армією й дипломатією. 30% вільних коштів компанії піде до державних резервів. Стабільність тимчасово впаде.</p>
  <div class="btns"><button class="pri" onclick="closeModal();coAct(()=>G.coTakeover(G.myCo(),${nid}))">Так, перебрати владу</button><button onclick="closeModal()">Скасувати</button></div>`);
}
LORA.bus.on('takeover', () => { if (!G || G.player < 0) return; applyTheme(nat(G.player).a3, nat(G.player).color); tab = 'state'; renderTabs(); renderTab(true); renderTop(); G._blkP = G.seaBlockedFor(G.player); mapDirty = true; });
// ---- дії компанії в регіоні (права панель)
function coRegionActions(i) {
  const c = G.myCo(); if (!c) return ''; const t = G.ter[i], nid = t.owner, s = coSec(c); let h = `<div class="grp">🏢 ${esc(c.name)}</div>`;
  const has = G.coHasOffice(c, nid), inf = c.infl[nid] || 0;
  h += `<div class="row small"><span>Вплив у країні</span><b>${inf.toFixed(0)}</b></div>`;
  if (!has) { const cost = G.officeCost(c, i); h += `<div class="btns"><button class="pri" onclick="coAct(()=>G.coOpenOffice(G.myCo(),${i}))" ${c.cash < cost ? 'disabled' : ''}>🏢 Купити офіс тут (${money(cost)})</button></div>`; }
  else {
    const o = c.offices.find(x => x.n === nid); h += `<div class="small mut">${o.hq ? '⭐ Тут ваш штаб-офіс' : '🏢 У країні є ваш офіс'} (${esc(G.T[o.t].n)})</div>`;
    if (!o.hq) h += `<div class="btns"><button onclick="coAct(()=>G.coMoveHQ(G.myCo(),${i}))">⭐ Перенести штаб сюди</button></div>`;
    h += `<div class="grp">Збудувати актив</div>` + s.assets.map(k => { const err = G.coCanBuild(c, i, k), b = D.buildings[k], cost = G.buildCost(nid, i, k) * 1.1, roi = G.assetProfit(c, { t: i, type: k, lvl: 1 }) / cost;
      return `<div class="row small"><span>${ico(b.ic)} ${esc(b.n)}<br><span class="mut">${money(cost)} · ${b.days} дн. · дохідність ${pct(roi, 0)}/р</span></span><button onclick="coAct(()=>G.coBuild(G.myCo(),${i},'${k}'))" ${err ? `disabled title="${esc(err)}"` : ''}>🏗</button></div>`; }).join('');
  }
  const mine = c.assets.filter(a => a.t === i); if (mine.length) h += `<div class="small">Ваші активи тут: ${mine.map(a => D.buildings[a.type].ic + ' ' + esc(D.buildings[a.type].n) + ' ×' + a.lvl).join(', ')}</div>`;
  const others = G.companies.filter(x => x.id !== G.pc && x.offices.some(o => o.n === nid)); if (others.length) h += `<div class="small mut">Конкуренти в країні: ${others.slice(0, 6).map(x => esc(x.name)).join(', ')}</div>`;
  return h;
}
// ---- шар компанії на мапі
function drawCompanyLayer(sh) {
  const c = G.myCo(); if (!c || view.s < 4) return; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const marks = {}; const add = (i, e) => (marks[i] = marks[i] || []).push(e); c.offices.forEach(o => add(o.t, o.hq ? '⭐' : '🏢')); c.assets.forEach(a => add(a.t, D.buildings[a.type].ic)); c.pend.forEach(p => add(p.t, '🏗'));
  Object.entries(marks).forEach(([i, list]) => { const cc = D.regions[i].c; const [x, y] = toScreen(cc[0] + sh, cc[1]); if (x < 0 || x > innerWidth || y < 50 || y > innerHeight) return;
    drawEmoRow([...new Set(list)].slice(0, 6), x, y + 19, 'rgba(255,214,90,0.92)'); });
}
// ---- верхня панель у режимі компанії
function renderTopCompany(sp) {
  const c = G.myCo(); return `<button onclick="toggleLeft()" title="Панель">☰</button>
    <div class="st"><b>${ico(coSec(c).ic)} ${esc(c.name)}</b><span>компанія · ${esc(nat(c.home).name)}</span></div>
    <div class="st"><b>${G.dateStr()}</b><span>день ${G.day}</span></div><div id="speed">${sp}</div>
    <div class="st"><b>${money(G.coValue(c))}</b><span>вартість</span></div><div class="st"><b class="${c.cash < 0 ? 'r' : ''}">${money(c.cash)}</b><span>кошти</span></div>
    <div class="st"><b class="g">${money(c.profitY)}</b><span>прибуток / рік</span></div><div class="st"><b>${c.offices.length}</b><span>офісів</span></div>
    <div class="st"><b>${(c.infl[c.home] || 0).toFixed(0)}</b><span>вплив удома</span></div>`;
}
