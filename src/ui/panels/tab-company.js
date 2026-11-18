// ВКЛАДКА «КОМПАНІЯ»: огляд, активи, офіси, вплив (лобізм і захоплення держави), рейтинг конкурентів.
// Також дії компанії в правій панелі регіону та шар офісів/активів на мапі.
const CO_TABS = [['co', '🏢 Компанія'], ['world', '📊 Світ']];
function coSec(c) { return D.companySectors[c.sector]; }
function coAct(fn) { const r = fn(); hint(r && r.ok === false ? '⚠ ' + r.err : (r && r.msg) || 'Готово', 3000); renderTab(true); renderTop(); if (sel) renderRight(); }
TAB_FN.co = function () {
  const c = G.myCo(); if (!c) return '<div class="mut">Компанії немає.</div>';
  G.corpInit(c); G.corpRes(c); const s = coSec(c), cur = curSub('co', 'over'); let h = subnav('co', [['over', 'Огляд'], ['assets', 'Активи'], ['offices', 'Офіси'], ['infl', 'Вплив'], ['rank', 'Конкуренти']]);
  if (cur === 'prod') return h + coProdTab(c);
  if (cur === 'tend') return h + coTendTab(c);
  if (cur === 'rd') return h + coRDTab(c);
  if (cur === 'build') return h + coBuildTab(c);
  if (cur === 'fin') return h + coFinTab(c);
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
      <div class="btns"><span class="small mut" style="align-self:center">Лобізм:</span>${[0.1, 0.5, 2].map(v => `<button onclick="coAct(()=>G.act.coLobby(${nid},${v}))" ${c.cash < v ? 'disabled' : ''}>${money(v)}</button>`).join('')}
      ${nid !== G.player ? `<button class="${err ? '' : 'pri'}" onclick="coTakeover(${nid})" title="${esc(err || 'Профінансувати зміну влади')}" ${err ? 'disabled' : ''}>👑 Перебрати владу (${money(G.takeoverCost(c, nid))})</button>` : ''}</div>${err && nid !== G.player ? `<div class="small mut">${esc(err)}</div>` : ''}</div>`; }).join('');
  } else {
    const L = G.companies.filter(x => x.alive).sort((a, b) => G.coValue(b) - G.coValue(a));
    h += L.slice(0, 30).map((x, k) => `<div class="row small ${x.id === G.pc ? 'g' : ''}"><span>${k + 1}. ${ico(D.companySectors[x.sector].ic)} ${esc(x.name)} · ${esc(nat(x.home).name)}</span><span><b>${money(G.coValue(x))}</b>${x.id !== G.pc && G.coValue(x) <= G.coValue(c) * 0.6 ? ` <button class="small" onclick="coAct(()=>G.act.corpAcquire(${x.id}))" data-tip="${t_('Поглинути за')} ${money(G.coValue(x) * 1.35)}">🤝</button>` : ''}</span></div>`).join('');
  }
  return h;
};
function spark(arr) { const mx = Math.max(...arr), mn = Math.min(...arr), w = 300, hh = 46; const pts = arr.map((v, k) => `${(k / (arr.length - 1) * w).toFixed(1)},${(hh - (v - mn) / Math.max(1e-9, mx - mn) * (hh - 4) - 2).toFixed(1)}`).join(' ');
  return `<svg width="100%" viewBox="0 0 ${w} ${hh}" style="margin:6px 0"><polyline points="${pts}" fill="none" stroke="#4fb3ff" stroke-width="2"/></svg>`; }
function focusReg(i) { const c = D.regions[i].c; sel = { type: 't', id: i }; focusLonLat(c[0], c[1], Math.max(view.s, 8)); renderRight(); }
function coTakeover(nid) {
  const c = G.myCo(); openModal(`<h2>👑 Перебрати владу: ${esc(nat(nid).name)}?</h2><p>Компанія профінансує політичну кампанію (${money(G.takeoverCost(c, nid))}). Ви станете урядом цієї держави: керуватимете економікою, армією й дипломатією. 30% вільних коштів компанії піде до державних резервів. Стабільність тимчасово впаде.</p>
  <div class="btns"><button class="pri" onclick="closeModal();coAct(()=>G.act.coTakeover(${nid}))">Так, перебрати владу</button><button onclick="closeModal()">Скасувати</button></div>`);
}
LORA.bus.on('takeover', () => { if (!G || G.player < 0) return; applyTheme(nat(G.player).a3, nat(G.player).color); tab = 'state'; renderTabs(); renderTab(true); renderTop(); G._blkP = G.seaBlockedFor(G.player); mapDirty = true; });
// ---- дії компанії в регіоні (права панель)
function coRegionActions(i) {
  const c = G.myCo(); if (!c) return ''; const t = G.ter[i], nid = t.owner, s = coSec(c); let h = `<div class="grp">🏢 ${esc(c.name)}</div>`;
  const has = G.coHasOffice(c, nid), inf = c.infl[nid] || 0;
  h += `<div class="row small"><span>Вплив у країні</span><b>${inf.toFixed(0)}</b></div>`;
  if (!has) { const cost = G.officeCost(c, i); h += `<div class="btns"><button class="pri" onclick="coAct(()=>G.act.coOffice(${i}))" ${c.cash < cost ? 'disabled' : ''}>🏢 Купити офіс тут (${money(cost)})</button></div>`; }
  else {
    const o = c.offices.find(x => x.n === nid); h += `<div class="small mut">${o.hq ? '⭐ Тут ваш штаб-офіс' : '🏢 У країні є ваш офіс'} (${esc(G.T[o.t].n)})</div>`;
    if (!o.hq) h += `<div class="btns"><button onclick="coAct(()=>G.act.coHQ(${i}))">⭐ Перенести штаб сюди</button></div>`;
    h += `<div class="grp">Збудувати актив</div>` + s.assets.map(k => { const err = G.coCanBuild(c, i, k), b = D.buildings[k], cost = G.buildCost(nid, i, k) * 1.1, roi = G.assetProfit(c, { t: i, type: k, lvl: 1 }) / cost;
      return `<div class="row small"><span>${ico(b.ic)} ${esc(b.n)}<br><span class="mut">${money(cost)} · ${b.days} дн. · дохідність ${pct(roi, 0)}/р</span></span><button onclick="coAct(()=>G.act.coBuild(${i},'${k}'))" ${err ? `disabled title="${esc(err)}"` : ''}>🏗</button></div>`; }).join('');
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
    <div class="st"><b>${(c.infl[c.home] || 0).toFixed(0)}</b><span>вплив удома</span></div>${G.leader && G.leader.role === 'char' ? `<div class="st"><b>${money(G.leader.money)}</b><span>${t_('ваші гроші')}</span></div>` : ''}`;
}

// ---- КОРПОРАЦІЯ: виробництво, тендери, R&D, будівництво, фінанси
const coOpenTenders = c => (G.tenders || []).filter(t => !t.done && (t.sector === c.sector || (t.kind === 'res' && G.corpProduces(c, t.r))));
function coProdTab(c) {
  let h = `<div class="kpi"><div><span>${t_('Репутація')}</span><b class="${c.rep >= 50 ? 'g' : 'r'}">${Math.round(c.rep)}</b></div><div><span>${t_('Контрактів')}</span><b>${c.contracts.length}</b></div><div><span>${t_('Потужності проєктів')}</span><b>${G.corpCapUsed(c)} / ${G.corpCap(c)}</b></div></div>`;
  if (c.sector === 'military') {
    h += `<div class="grp">${t_('Виробничі лінії')}</div><div class="mut small">${t_('Товар виробляється на ваших заводах щомісяця, собівартість списується з коштів. Продукція йде на склад і за контрактами — прямо в арсенал держави-замовника.')}</div>`;
    Object.entries(G.CORP_GOODS).forEach(([k, g]) => {
      const has = G.corpHasGood(c, k), rate = G.corpRate(c, k), need = g.from.map(b => D.buildings[b] ? D.buildings[b].n : b).join(' / ');
      const lock = !has ? (g.rd && c.rd.done[g.rd] == null ? t_('Потрібна розробка') + ' «' + esc(t_((G.corpTree(c).find(t => t.id === g.rd) || {}).n || '')) + '»' : t_('Потрібен завод') + ': ' + esc(need)) : '';
      const free = Math.floor(c.inv[k] || 0) - c.contracts.filter(x => x.good === k).reduce((s, x) => s + x.left, 0);
      h += `<div class="card small ${has ? '' : 'soon'}"><div class="row"><b>${ico(g.ic)} ${esc(t_(g.n))}</b><span>${t_('склад')}: <b>${Math.floor(c.inv[k] || 0).toLocaleString()}</b> ${esc(g.u || '')}</span></div>
        ${free >= 1 ? `<div class="row"><span>${t_('Продати вільне')} (${free.toLocaleString()}, ≈${money(free * g.price * 0.85)})</span><select onchange="if(this.value!=='')coAct(()=>G.act.corpSell(+this.value,'${k}'))"><option value="">${t_('кому…')}</option>${G.corpBuyers(c).map(id => `<option value="${id}">${esc(nat(id).name)}${G.enemiesOf(id).length ? ' ⚔' : ''}</option>`).join('')}</select></div>` : ''}
        ${has ? `<div class="row"><span>${Math.floor(rate).toLocaleString()} ${t_('на міс.')} · ${t_('собівартість')} ${money(G.corpUnitCost(c, k) * 1000)}/1000 · ${t_('ціна')} ${money(g.price * 1000)}/1000</span><label><input type="checkbox" ${c.lines[k] !== false ? 'checked' : ''} onchange="G.act.coSet('line','${k}',this.checked)"> ${t_('виробляти')}</label></div>` : `<div class="r">${lock}</div>`}</div>`;
    });
    h += `<label class="row small"><span>${t_('Продавати надлишок своїй державі (70% ціни), коли вона воює')}</span><input type="checkbox" ${c.autoSell ? 'checked' : ''} onchange="G.act.coSet('autoSell',null,this.checked)"></label>`;
  } else if (c.sector === 'tech') {
    const Dg = G.digInit(c), mk = G.digMarket(c), cap = G.digCap(c);
    h += `<div class="grp">📱 ${t_('Цифрові продукти')}</div><div class="mut small">${t_('IT-компанія не має заводів: дохід = користувачі × дохід з користувача + ліцензії на розробки. Користувачів дають офіси в країнах з розвиненим інтернетом, маркетинг і R&D; стелю задають ваші дата-центри й хмари.')}</div>
    <div class="kpi"><div><span>${t_('Користувачі')}</span><b>${Dg.users.toFixed(1)} ${t_('млн')}</b></div><div><span>${t_('Ринок (онлайн)')}</span><b>${mk.toFixed(0)} ${t_('млн')}</b></div><div><span>${t_('Стеля інфраструктури')}</span><b>${cap.toFixed(0)} ${t_('млн')}</b></div><div><span>${t_('Дохід з користувача')}</span><b>$${G.digArpu(c).toFixed(1)}/${t_('рік')}</b></div></div>
    <div class="kpi"><div><span>${t_('Виручка / рік')}</span><b>${money(Dg.revY || 0)}</b></div><div><span>${t_('Чистий результат / рік')}</span><b class="${(Dg.netY || 0) >= 0 ? 'g' : 'r'}">${money(Dg.netY || 0)}</b></div></div>
    ${Dg.users >= cap * 0.95 ? `<div class="card small y">⚠ ${t_('Уперлися в стелю інфраструктури — будуйте дата-центри, хмарні регіони, ШІ-датацентри (вкладка «Будівництво»).')}</div>` : ''}
    <div class="sl"><div class="lab"><span>${t_('Маркетинг на рік')}</span><b>${money(Dg.mkt)}</b></div><input type="range" min="0" max="3" step="0.05" value="${Dg.mkt}" onchange="coAct(()=>G.act.coSet('mkt',null,+this.value))"></div>`;
  } else h += `<div class="card small">${t_('Ваш сектор заробляє на активах (видобуток, станції, ферми, дата-центри) і на проєктних контрактах для урядів. Більше профільних активів — більше потужностей для проєктів.')}</div>`;
  if (c.contracts.length) h += `<div class="grp">${t_('Активні контракти')}</div>` + c.contracts.map(k => k.kind === 'good' ? `<div class="card small"><div class="row"><b>${ico(G.CORP_GOODS[k.good].ic)} ${esc(t_(G.CORP_GOODS[k.good].n))} → ${esc(nat(k.buyer).name)}</b><span>${money(k.qty * k.price)}</span></div><div class="bar"><i style="width:${(1 - k.left / k.qty) * 100}%"></i></div><div class="row"><span>${t_('лишилось')} ${Math.ceil(k.left).toLocaleString()}</span><span class="${k.due - G.day < 30 ? 'r' : 'mut'}">${t_('термін')}: ${k.due - G.day} ${t_('дн.')}</span></div></div>`
    : `<div class="card small"><div class="row"><b>🏗 ${esc(t_(k.name))} → ${esc(nat(k.buyer).name)}</b><span>${money(k.value)}</span></div><div class="bar"><i style="width:${Math.min(100, (G.day - k.start) / Math.max(1, k.done - k.start) * 100)}%"></i></div><div class="mut">${t_('до завершення')} ${Math.max(0, k.done - G.day)} ${t_('дн.')} · ${t_('потужність')} ${k.need}</div></div>`).join('');
  return h;
}
let bidMul = 1;
function coTendTab(c) {
  const L = coOpenTenders(c).sort((a, b) => (G.corpCanBid(c, a) ? 1 : 0) - (G.corpCanBid(c, b) ? 1 : 0) || a.close - b.close);
  let h = `<div class="mut small">${t_('Уряди оголошують тендери. Подайте заявку з ціною: дешевше — більше шансів, але менше прибутку. На перемогу також впливають якість (R&D), репутація, ваш вплив у країні та союзи. Результат — у день закриття.')}</div>`;
  h += `<div class="row small"><span>${t_('Ваша ціна від стартової')}: <b>${Math.round(bidMul * 100)}%</b></span><input type="range" min="70" max="125" value="${Math.round(bidMul * 100)}" onchange="bidMul=this.value/100;renderTab(true)"></div>`;
  if (!L.length) return h + `<div class="card small">${t_('Зараз немає відкритих тендерів у вашому секторі. Нові з’являються щомісяця.')}</div>`;
  h += L.slice(0, 30).map(t => { const e = G.corpCanBid(c, t), mine = t.bids.some(b => b.co === c.id); const g = t.kind === 'good' ? G.CORP_GOODS[t.good] : null; const val = t.kind === 'good' ? t.qty * t.price : t.kind === 'res' ? t.q * t.price * t.months : t.value;
    return `<div class="card small ${e && !mine ? 'soon' : ''}"><div class="row"><b>${t.kind === 'good' ? ico(g.ic) + ' ' + esc(t_(g.n)) + ' ×' + t.qty.toLocaleString() : t.kind === 'res' ? ico(RI[t.r].ic) + ' ' + t_('Постачання') + ': ' + esc(t_(RI[t.r].n)) + ' ' + t.q.toFixed(3) + '/' + t_('міс.') + ' × ' + t.months : '🏗 ' + esc(t_(t.name))}</b><b>${money(val * bidMul)}</b></div>
      <div class="row"><span>${ndot(t.buyer)}${esc(nat(t.buyer).name)} · ${t.kind === 'good' ? t_('поставити до') + ' ' + G.dateStr(t.due) : t.kind === 'res' ? t_('щомісяця зі складу') : t_('потужність') + ' ' + t.need + ' · ' + t.days + ' ' + t_('дн.')}</span><span class="mut">${t_('заявки до')} ${G.dateStr(t.close)} · ${t.bids.length} ${t_('заявок')}</span></div>
      ${mine ? `<div class="g">✔ ${t_('Заявку подано')}</div>` : e ? `<div class="r">${esc(t_(e))}</div>` : `<div class="btns"><button class="pri" onclick="coAct(()=>G.act.corpBid(${t.id},bidMul))">📑 ${t_('Подати заявку')}</button></div>`}</div>`; }).join('');
  return h;
}
function coRDTab(c) {
  const T = G.corpTree(c), cur = c.rd.cur && T.find(t => t.id === c.rd.cur);
  let h = `<div class="kpi"><div><span>${t_('Очки R&D')}</span><b>${Math.floor(c.rd.pts)}</b></div><div><span>${t_('Розроблено')}</span><b>${Object.keys(c.rd.done).length} / ${T.length}</b></div><div><span>${t_('Зараз')}</span><b>${cur ? esc(t_(cur.n)) : '—'}</b></div></div>`;
  h += slider('coRD', t_('Бюджет R&D на рік'), 0.05, 2, 0.05, c.rd.budget, v => money(v), `≈ ${Math.round(8 + c.rd.budget / 12 * 3500)} ${t_('очок на місяць')} · ${t_('університети й дата-центри компанії +20% кожен')}`);
  const fxs = { rate: 'виробництво', cost: 'собівартість −', qual: 'якість', profit: 'прибуток активів', cap: 'потужності', out: 'видобуток/випуск', fuel: 'витрати сировини −', users: 'приріст користувачів', arpu: 'дохід з користувача', roy: 'ліцензії' };
  h += T.map(t => { const done = c.rd.done[t.id] != null, stOk = G.corpStOk(c, t.st), can = t.req.every(r => c.rd.done[r] != null) && stOk; const eff = Object.entries(t.e).map(([k, v]) => k === 'unlock' ? '🔓 ' + t_(G.CORP_GOODS[v].n) : k === 'cap' ? '+' + (v * 2) + ' ' + t_(fxs[k]) : t_(fxs[k]) + ' +' + Math.round(v * 100) + '%').join(' · ');
    return `<div class="card small ${done ? '' : can ? '' : 'soon'}"><div class="row"><b>${done ? '✅' : c.rd.cur === t.id ? '🔬' : '○'} ${esc(t_(t.n))}</b><span>${t.cost} ${t_('очок')}</span></div><div class="mut">${eff}</div>
      ${!done && can && c.rd.cur !== t.id ? `<div class="btns"><button onclick="coAct(()=>G.act.corpRD('${t.id}'))">🔬 ${t_('Розробляти')}</button></div>` : ''}${!done && !can ? `<div class="r">${t_('Потрібно')}: ${[...t.req.filter(r => c.rd.done[r] == null).map(r => esc(t_((T.find(x => x.id === r) || {}).n || r))), ...(stOk ? [] : ['🏛 ' + t_('держдослідження') + ' «' + esc(techName(t.st)) + '»'])].join(', ')}</div>` : ''}${t.st && stOk && !done ? `<div class="small g">🏛 ${esc(techName(t.st))} ✓</div>` : ''}${c.rd.cur === t.id ? `<div class="bar"><i style="width:${Math.min(100, c.rd.pts / t.cost * 100)}%"></i></div>` : ''}</div>`; }).join('');
  return h;
}
function coBuildTab(c) {
  const s = coSec(c); let h = `<div class="mut small">${t_('Профільні активи вашого сектору й найвигідніше місце серед країн, де є ваші офіси. Будівництво триває місяцями — як у реальності.')}</div>`;
  h += s.assets.map(k => { const b = D.buildings[k]; if (!b) return ''; const sp = G.coBestSpot(c, k); const ok = sp.i != null; const cost = ok ? G.buildCost(G.ter[sp.i].owner, sp.i, k) * 1.1 : 0;
    return `<div class="card small ${ok ? '' : 'soon'}"><div class="row"><b>${ico(b.ic)} ${esc(t_(b.n))}</b><span>${ok ? money(cost) : ''}</span></div><div>${fmtIO ? fmtIO(b) : ''}</div>
      <div class="row"><span class="mut">${b.days} ${t_('дн.')}${ok ? ' · 📍 ' + esc(regName(sp.i)) + ' (' + esc(nat(G.ter[sp.i].owner).name) + ') · ' + t_('дохідність') + ' ' + pct(sp.roi, 0) + '/' + t_('р') : ''}</span>${ok ? `<span style="white-space:nowrap"><button onclick="focusReg(${sp.i})">🗺</button><button class="pri" onclick="coAct(()=>G.act.coBuild(${sp.i},'${k}'))" ${c.cash < cost ? 'disabled' : ''}>🏗 ${t_('Будувати')}</button></span>` : `<span class="r">${esc(t_(sp.err))}</span>`}</div></div>`; }).join('');
  if (c.pend.length) h += `<div class="grp">${t_('Будується')}</div>` + c.pend.map(p => `<div class="row small"><span>🏗 ${esc(t_(D.buildings[p.type].n))} · ${esc(G.T[p.t].n)}</span><span>${Math.max(0, p.done - G.day)} ${t_('дн.')}</span></div>`).join('');
  return h;
}
function coFinTab(c) {
  let h = `<div class="kpi"><div><span>${t_('Кошти')}</span><b>${money(c.cash)}</b></div><div><span>${t_('Борг')}</span><b class="${c.debt > 0 ? 'y' : ''}">${money(c.debt)}</b></div><div><span>${t_('Відсотки / рік')}</span><b>${money(c.debt * 0.075)}</b></div></div>`;
  h += `<div class="card small">${t_('Банк дає кредит під 7.5% річних, до 60% вартості компанії. Кредит — щоб швидше будувати заводи й вигравати великі контракти.')}<div class="btns">${[0.5, 2, 5].map(v => `<button onclick="coAct(()=>G.act.corpLoan(${v}))">🏦 +${money(v)}</button>`).join('')}${c.debt > 0 ? [0.5, 2].map(v => `<button onclick="coAct(()=>G.act.corpLoan(-${v}))">↩ ${t_('погасити')} ${money(v)}</button>`).join('') : ''}</div></div>`;
  h += `<div class="row small"><span>${t_('Прибуток до податків / рік')}</span><b class="g">${money(c.profitY)}</b></div><div class="row small"><span>${t_('Податки / рік')}</span><b class="y">${money(c.taxY)}</b></div><div class="row small"><span>${t_('Офіси / рік')}</span><b>${money(c.offices.length * 0.048)}</b></div>`;
  if (G.stock && G.stock.px[c.id] != null) { h += `<div class="grp">📈 ${t_('Акції компанії')}</div><div class="row small"><span>${t_('Ціна 1% акцій на біржі')}</span><b>${money(G.stock.px[c.id])}</b></div><div class="row small"><span>${t_('У вільному обігу')} / ${t_('у засновників')}</span><b>${G.stockFloat(c.id).toFixed(0)}% / ${(100 - G.stockFloat(c.id)).toFixed(0)}%</b></div>${G.stockController(c.id) ? `<div class="small r">⚠ ${t_('Контрольний пакет у когось іншого')}</div>` : ''}
    <div class="btns small">${[2, 5, 10].map(v => `<button onclick="coAct(()=>G.act.stockIssue(${v}))" data-tip="${t_('Продати нові акції інвесторам: гроші йдуть компанії, частка засновників меншає')}">📤 ${t_('Емісія')} ${v}%</button>`).join('')}${[1, 5].map(v => `<button onclick="coAct(()=>G.act.stockBuyback(${v}))">📥 ${t_('Викуп')} ${v}%</button>`).join('')}</div>`; }
  h += secBlock('co', c.home);
  if (c.sector === 'military') { const P = G.secProviders().find(p => p.id === c.id), K = G.secContracts.filter(k => k.prov === c.id);
    h += `<div class="grp">🛡 ${t_('Охоронні послуги (ПВК)')}</div><div class="mut small">${t_('Ваша компанія може охороняти персонажів і компанії (інших гравців теж). Місткість росте з кількістю заводів.')}</div>
    <div class="row small"><span>${t_('Клієнтів')} / ${t_('місткість')}</span><b>${P ? P.used + ' / ' + P.cap : '—'}</b></div><div class="row small"><span>${t_('Дохід від охорони / рік')}</span><b class="g">${money(K.reduce((a, k) => a + k.fee * 12 * 0.6, 0))}</b></div>
    <div class="row small"><span>${t_('Ціна (множник)')}</span><select onchange="coAct(()=>G.act.secPrice(+this.value))">${[0.6, 0.8, 1, 1.3, 1.6, 2].map(v => `<option value="${v}" ${(c.secMul || 1) === v ? 'selected' : ''}>×${v}</option>`).join('')}</select></div>`; }
  return h;
}
// найм охорони: who = 'co' (компанія) або 'L' (персонаж)
function secBlock(who, home) {
  const key = who === 'co' ? 'co' + G.pc : (G._lk != null ? 'L' + G._lk : 'L' + (G.player >= 0 ? G.player : 'me')); const cur = G.secOf(key);
  const P = G.secProviders(home); const sel = window._secP != null && P.find(p => p.id === window._secP) ? window._secP : (P[0] || {}).id;
  let h = `<div class="grp">🛡 ${t_(who === 'co' ? 'Безпека компанії' : 'Особиста охорона')}</div><div class="mut small">${t_(who === 'co' ? 'Захищає від диверсій, розкрадання складів, шпигунства й рейдерів.' : 'Захищає від пограбувань, шантажу, викрадень і замахів. Ризик росте зі статками, славою, політикою й поїздками в небезпечні країни.')}</div>`;
  if (cur) { const pc = G.companies[cur.prov]; h += `<div class="card small g">${esc(t_(G.SEC_LV[cur.lvl].n))} — «${esc(pc ? pc.name : '?')}» · ${money(cur.fee)}/${t_('міс.')} <button class="small" onclick="secAct(G.act.secFire('${who}'))">${t_('Розірвати')}</button></div>`; }
  if (!P.length) return h + `<div class="small mut">${t_('Немає доступних ПВК')}</div>`;
  h += `<div class="row small"><span>${t_('Постачальник')}</span><select onchange="_secP=+this.value;renderTab(true)">${P.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}${p.human ? ' 🎮' : ''} · ${t_('якість')} ${Math.round(p.q * 100)}% · ${t_('вільно')} ${p.cap - p.used}</option>`).join('')}</select></div>`;
  const p = P.find(x => x.id === sel); h += `<div class="btns small">${G.SEC_LV.slice(1).map((L, i) => `<button ${cur && cur.lvl === i + 1 && cur.prov === sel ? 'class="on"' : ''} onclick="secAct(G.act.secHire('${who}',${sel},${i + 1}))">${esc(t_(L.n))} · ${money(G.secFee(p, i + 1, who === 'co'))}/${t_('міс.')}</button>`).join('')}</div>`;
  return h;
}
function secAct(r) { hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3000); renderTab(true); }

// ---- окремі вкладки компанії
const coWrap = fn => () => { const c = G.myCo(); if (!c) return '<div class="mut">' + t_('Компанії немає.') + '</div>'; G.corpInit(c); G.corpRes(c); return fn(c); };
TAB_FN.coprod = coWrap(c => coProdTab(c));
TAB_FN.cotend = coWrap(c => coTendTab(c));
TAB_FN.cord = coWrap(c => coRDTab(c));
TAB_FN.cobuild = coWrap(c => coBuildTab(c));
TAB_FN.cofin = coWrap(c => coFinTab(c));
let tradeQ = 0.25;
TAB_FN.cotrade = coWrap(c => {
  const f = G.corpResFlow(c), R = new Set([...Object.keys(f.out), ...Object.keys(f.inn), ...Object.keys(c.res).filter(r => c.res[r] > 1e-6)]);
  let h = `<div class="mut small">${t_('Ринок замкнений: продати можна лише тим, хто купує (держави з дефіцитом платять зі свого бюджету, інші компанії — зі своїх коштів), купити — лише те, що хтось продає. Бракує сировини — активи стоять. Непродане лежить на складі (місткість — річний випуск), надлишок псується.')}</div>`;
  if (c.lack && c.lack.length) h += `<div class="card small r">⛔ ${t_('Бракує сировини')}: ${c.lack.map(r => esc(t_(RI[r].n))).join(', ')} — ${t_('потужність')} ${pct(c.inRatio || 0, 0)}. ${t_('Відкрийте офіси в країнах-виробниках, покращіть відносини або купуйте в інших компаній.')}</div>`;
  if (c.unsoldM && Object.keys(c.unsoldM).length) h += `<div class="card small y">📦 ${t_('Не знайшлося покупців минулого місяця')}: ${Object.entries(c.unsoldM).map(([r, q]) => esc(t_(RI[r].n)) + ' ' + q.toFixed(3)).join(', ')}. ${t_('Шукайте контракти в «Тендерах», відкривайте офіси в нових країнах.')}</div>`;
  h += `<div class="kpi"><div><span>${t_('Чистий дохід від ресурсів / рік')}</span><b class="${(c.resNetY || 0) >= 0 ? 'g' : 'r'}">${money(c.resNetY || 0)}</b></div><div><span>${t_('Контрактів постачання')}</span><b>${(c.supply || []).length}</b></div></div>`;
  if (!R.size) h += `<div class="card small">${t_('Поки що ви нічого не виробляєте. Збудуйте профільні активи (вкладка «Будівництво») — видобуток, станції, заводи, ферми.')}</div>`;
  h += `<div class="btns small"><span class="mut" style="align-self:center">${t_('Обсяг угоди')}:</span>${[0.1, 0.25, 1].map(v => `<button class="${tradeQ === v ? 'on' : ''}" onclick="tradeQ=${v};renderTab(true)">${Math.round(v * 100)}% ${t_('міс. виробництва')}</button>`).join('')}</div>`;
  h += `<table class="small"><tr><th>${t_('Ресурс')}</th><th>${t_('Склад')}</th><th>+/${t_('міс.')}</th><th>${t_('Ціна')}</th><th>${t_('Авто')}</th><th></th></tr>`;
  [...R].forEach(r => { const RIr = RI[r]; const pm = (f.out[r] || 0) - (f.inn[r] || 0); const q = Math.max(Math.abs(pm), (c.res[r] || 0), 0.0001) * tradeQ * (Math.abs(pm) > 0 ? 1 : 1);
    h += `<tr><td>${ico(RIr.ic)} ${esc(t_(RIr.n))}</td><td>${(c.res[r] || 0).toFixed(3)}</td><td class="${pm >= 0 ? 'g' : 'r'}">${pm.toFixed(3)}</td><td>${money(G.prices[r])}</td><td><input type="checkbox" ${c.sell[r] !== false ? 'checked' : ''} onchange="G.act.coSet('sell','${r}',this.checked)"></td>
      <td style="white-space:nowrap"><button class="small" onclick="coAct(()=>G.act.corpTrade('${r}',${q}))">${t_('Купити')}</button><button class="small" onclick="coAct(()=>G.act.corpTrade('${r}',-${q}))">${t_('Продати')}</button></td></tr>`; });
  h += `</table><div class="mut small">${t_('Продаж — 95% ринкової ціни, купівля — 106%. Сировина, якої бракує на складі, докуповується автоматично.')}</div>`;
  if ((c.supply || []).length) h += `<div class="grp">${t_('Контракти постачання')}</div>` + c.supply.map(k => `<div class="card small"><div class="row"><b>${ico(RI[k.r].ic)} ${esc(t_(RI[k.r].n))} → ${esc(nat(k.buyer).name)}</b><span>${k.q.toFixed(3)}/${t_('міс.')} · ${money(k.p)}</span></div><div class="mut">${t_('лишилось місяців')}: ${k.left} · ${t_('недопоставка — штраф 25% і репутація')}</div></div>`).join('');
  return h;
});
TAB_FN.codipl = coWrap(c => {
  const ids = [...new Set([c.home, ...c.offices.map(o => o.n), ...Object.keys(c.lost || {}).map(Number)])];
  let h = `<div class="mut small">${t_('Відносини компанії з урядами: вплив дає податкові пільги, захист від націоналізації й доступ до тендерів. Нові країни — купіть офіс (клік по регіону на мапі).')}</div>`;
  ids.forEach(nid => { const n = nat(nid), v = c.infl[nid] || 0, d = (c.dip && c.dip[nid]) || {};
    const st = [d.tax > G.day ? '🧾 ' + t_('податкові канікули') : '', d.sub > G.day ? '🏗 ' + t_('співфінансування') : '', d.lic > G.day ? '📜 ' + t_('експортна ліцензія') : '', d.deal && d.deal.until > G.day && !d.deal.done ? '📈 ' + t_('інвест. угода до') + ' ' + G.dateStr(d.deal.until) : ''].filter(Boolean).join(' · ');
    h += `<div class="card small"><div class="row"><b>${ndot(nid)}${esc(n.name)}${nid === c.home ? ' ⭐' : ''}</b><b class="${v >= 50 ? 'g' : v >= 25 ? 'y' : ''}">${t_('вплив')} ${v.toFixed(0)}</b></div><div class="bar"><i style="width:${v}%"></i></div>${st ? `<div class="g">${st}</div>` : ''}
      <div class="btns">${Object.entries(G.CO_DIP).map(([k, A]) => { const e = G.coDipCan(c, nid, k); if (k === 'court' && e && /Немає/.test(e)) return ''; return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="coAct(()=>G.act.coDip(${nid},'${k}'))">${A.ic} ${esc(t_(A.n))}${A.cost ? ' · ' + money(A.cost) : ''}</button>`; }).join('')}</div></div>`; });
  return h;
});
