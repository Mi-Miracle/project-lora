// v4.7 UI: постачання й податки (вкладка «Команда й ринок»), оптовий продаж, держзамовлення генштабу, біржа часток,
// режим мапи «Ринок вашої справи», сучасний інтерфейс (тема ui2).
RAIL_G.find(g => g[0] === 'wd')[3].push('exch');
{ const base = window.curTabs; window.curTabs = function () { const r = base.apply(this, arguments); if (G && (G.leader || G.pc >= 0) && r.findIndex(x => x[0] === 'exch') < 0) r.push(['exch', '📈 Біржа']); return r; }; }
Object.assign(TIPS_TAB, { exch: 'Біржа часток: купуйте частки компаній гравців і корпорацій, отримуйте дивіденди, продавайте частку своєї компанії' });

// ---------- «Команда й ринок»: постачання й податки ----------
{ const base = TAB_FN.comkt; TAB_FN.comkt = function () { let h = base(); const c = G.myCo(); if (!c || !c.bizType) return h; const s = G.supGood(c);
  if (s) { const B = G.BIZT[s.ty]; const m = (c.sup || {}).mode || 'market'; const sel = G.supSellers(c);
    h += `<div class="grp">🔗 ${t_('Постачання')}</div><div class="small mut">${t_('Вашим закладам потрібно')}: ${s.g.ic} <b>${esc(t_(s.g.n))}</b> (${t_('виробляє')}: ${esc(t_(B.n))}) — ${G.supNeed(c).toFixed(1)} ${esc(t_(s.g.u))}/${t_('міс.')}</div>
      <div class="btns">${s2B(t_('Відкритий ринок'), "v46r(G.act.supSet('market'))", '', m === 'market')}${s2B(t_('Кооператив') + ' +5%', "v46r(G.act.supSet('coop'))", '', m === 'coop', 'Плата 2.5% доходу закладів')}</div>
      ${sel.length ? sel.map(x => `<div class="row small"><span>🏭 «${esc(x.name)}» · ${t_('склад')} ${((x.binv || {})[s.g.k] || 0).toFixed(1)}</span>${s2B(m === 'co' && c.sup.co === x.id ? '✓ ' + t_('Ваш постачальник') : t_('Обрати') + ' +10%', `v46r(G.act.supSet('co',${x.id}))`, '', m === 'co' && c.sup.co === x.id)}</div>`).join('') : `<div class="small mut">${t_('Компаній гравців, що продають цей товар оптом, поки немає.')}</div>`}
      ${c.supLog ? `<div class="small mut">${t_('Минулого місяця')}: ${esc(c.supLog)}</div>` : ''}`; }
  const tm = c.taxMode || 'honest';
  h += `<div class="grp">🧾 ${t_('Податки')}</div><div class="small mut">${t_('Ставка')} ${Math.round(G.taxRateB(c) * 100)}% ${t_('доходу')} · ${t_('сплачено минулого місяця')} ${money(c.taxPaid || 0)}${c.taxEv ? ` · ${t_('недоплачено')} ${money(c.taxEv)}` : ''}</div>
    <div class="btns">${Object.entries(G.TAXM).map(([k, M]) => s2B(t_(M[0]), `v46r(G.act.taxModeSet('${k}'))`, '', tm === k, k === 'honest' ? 'Повний податок; перевірки лише піднімають рейтинг' : `Податок ×${M[1]}; якщо спіймають — штраф ×${k === 'shadow' ? 4 : 2} від недоплати${k === 'shadow' ? ' і кримінальна справа' : ''}`)).join('')}</div>
    <div class="small">${t_('Ризик перевірки')}: <b class="${G.taxRisk(c) > 0.08 ? 'r' : ''}">${Math.round(G.taxRisk(c) * 100)}%/${t_('міс.')}</b>${c.audit > G.day ? ` · ✅ ${t_('аудит діє ще')} ${c.audit - G.day} ${t_('дн.')}` : ''}</div>
    <div class="btns">${s2B('🔎 ' + t_('Замовити аудит') + ' · ' + money(G.auditCost(c)), 'v46r(G.act.auditDo())', '', 0, 'Ризик перевірок −60% на півроку; виявляє нечесного бухгалтера')}</div>`;
  return h; }; }
// оптовий продаж у виробничих лініях
{ const b = window.bprodHtml; window.bprodHtml = function (c) { let h = b(c); if (!h) return h; const gs = G.bgoods(c).filter(g => !g.mil); if (!gs.length) return h;
  return h + `<div class="grp">🤝 ${t_('Оптом гравцям')}</div><div class="small mut">${t_('Відкрийте опт — товар іде на склад, а гравці-покупці щомісяця забирають його за ринковою ціною.')}</div>` + gs.map(g => `<label class="row small"><span>${g.ic} ${esc(t_(g.n))}</span><input type="checkbox" ${(c.whole || {})[g.k] ? 'checked' : ''} onchange="v46r(G.act.wholeSet('${g.k}',this.checked))"></label>`).join('')
    + (c.wholeEarn ? `<div class="small mut">${t_('Зароблено на опті')}: ${money(c.wholeEarn)}</div>` : ''); }; }
// держзамовлення у вкладці «Військо»
{ const b = TAB_FN.coarmy; TAB_FN.coarmy = function () { let h = b(); const c = G.myCo(); if (!c) return h; const o = c.gso;
  const card = o ? `<div class="card ${o.kind === 'hold' ? '' : 'g'}"><div class="row"><b>📜 ${t_('Наказ генштабу')}: ${o.kind === 'hold' ? t_('утримати') : t_('звільнити')} ${esc(G.T[o.t].n)}</b><span>${o.until - G.day} ${t_('дн.')}</span></div>
      <div class="small mut">${o.kind === 'hold' ? t_('Тримайте загін компанії в регіоні до кінця строку (до 3 днів відсутності).') : t_('Регіон має перейти під контроль вашої країни, а ваш загін — бути там.')} ${t_('Нагорода')}: <b class="g">${money(o.pay)}</b>, ${t_('репутація +3, слава власника +1')}.</div>
      <div class="btns">${s2B('🎯 ' + t_('Показати'), `focusReg(${o.t})`, '')}${s2B(t_('Відхилити'), 'v46r(G.act.gsoDecline())', '')}</div></div>`
    : `<div class="small mut">📜 ${t_('Під час війни генштаб щомісяця може дати вашому війську наказ — утримати або звільнити регіон за винагороду.')}${c.gsoWins ? ' ' + t_('Виконано наказів') + ': ' + c.gsoWins : ''}</div>`;
  const i = h.indexOf('<div class="grp">➕'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); }; }

// ---------- біржа ----------
let exPct = 1, exPr = 0;
TAB_FN.exch = function () { const lk = G.curLk(); const L = G.leaders[lk] || G.leader; const st = G.v29s('v47', () => ({ seq: 1, sh: {}, ord: [] })); const cos = G.exCos(); const myC = G.pc >= 0 ? G.myCo() : (G.coOfLk && G.coOfLk(lk));
  let h = `<div class="kpi"><div><b>${money(L ? L.money : 0)}</b><span>${t_('ваші гроші')}</span></div><div><b>${money(L && L.divInc || 0)}</b><span>${t_('дивіденди загалом')}</span></div></div>`;
  const mine = Object.entries(st.sh).map(([id, hs]) => [G.companies.find(c => c.id === +id), hs[lk] || 0]).filter(([c, p]) => c && p > 0);
  h += `<div class="grp">💼 ${t_('Ваш портфель')}</div>` + (mine.length ? mine.map(([c, p]) => `<div class="row small"><span>${esc(c.name)} · <b>${p.toFixed(2)}%</b></span><span>≈ ${money(p * G.coFair(c))} ${c.ai ? s2B(t_('Продати ринку'), `v46r(G.act.exMktSell(${c.id},${p}))`, '') : s2B(t_('Виставити'), `v46r(G.act.exList(${c.id},${p},${G.coFair(c)}))`, '')}</span></div>`).join('') : `<div class="small mut">${t_('Часток поки немає.')}</div>`);
  if (myC) { const own = G.ownerPct(myC);
    h += `<div class="grp">🏢 ${t_('Ваша компанія на біржі')}</div><div class="small">${esc(myC.name)}: ${t_('вам належить')} <b>${own.toFixed(1)}%</b> · ${t_('ціна 1%')} ≈ <b>${money(G.coFair(myC))}</b></div>
      <div class="row small"><span>${t_('Дивіденди акціонерам')}</span><span class="btns">${[0, 0.1, 0.25, 0.5].map(r => s2B(Math.round(r * 100) + '%', `v46r(G.act.divSet(${r}))`, '', (myC.div || 0) === r)).join('')}</span></div>
      <div class="row small"><span>${t_('Продати частку')}</span><span class="btns">${[1, 5, 10].map(p => s2B(p + '%', `exPct=${p};renderTab(true)`, '', exPct === p)).join('')}</span></div>
      <div class="btns">${s2B('📤 ' + t_('Виставити') + ` ${exPct}% · ${money(exPct * G.coFair(myC))}`, `v46r(G.act.exList(${myC.id},${exPct},${G.coFair(myC)}))`, own - exPct < 51 ? 'Власник має лишити собі щонайменше 51%' : '', 1)}</div>`; }
  const ord = st.ord.filter(o => G.companies.find(c => c.id === o.co));
  h += `<div class="grp">📋 ${t_('Заявки гравців')}</div>` + (ord.length ? ord.map(o => { const c = G.companies.find(x => x.id === o.co); const S0 = G.leaders[o.lk]; const fair = G.coFair(c);
    return `<div class="row small"><span>${esc(c.name)} · ${o.pct}% · ${money(o.price)}/1% <span class="${o.price > fair * 1.1 ? 'r' : 'g'}">(${t_('оцінка')} ${money(fair)})</span><br><span class="mut">${esc(S0 ? S0.name : '?')}</span></span>${o.lk === lk ? s2B(t_('Зняти'), `v46r(G.act.exCancel(${o.id}))`, '') : s2B(t_('Купити') + ' ' + money(o.pct * o.price), `v46r(G.act.exBuy(${o.id}))`, '')}</div>`; }).join('') : `<div class="small mut">${t_('Заявок немає.')}</div>`);
  h += `<div class="grp">🏦 ${t_('Корпорації (ринок)')}</div><div class="small mut">${t_('До 20% кожної корпорації вільно на ринку; дивіденди — 40% місячного прибутку на вашу частку.')}</div>`;
  h += cos.filter(c => c.ai).slice(0, 15).map(c => { const f = G.coFair(c); return `<div class="row small"><span>${esc(c.name)} <span class="mut">· ${esc(t_((G.D.companySectors[c.sector] || {}).n || ''))}</span><br><span class="mut">1% = ${money(f)} · ${t_('дивіденд')} ${money(G.coProfitM(c) * 0.4 / 100)}/${t_('міс.')}</span></span><span class="btns">${[0.01, 0.1, 1].map(p => s2B(p + '%', `v46r(G.act.exMkt(${c.id},${p}))`, '')).join('')}</span></div>`; }).join('');
  return h; };

// ---------- режим мапи «Ринок вашої справи» ----------
if (typeof MAP_MODES !== 'undefined') MAP_MODES.push(['market', 'Ринок вашої справи']);
{ const b = window.terrColor; if (b) window.terrColor = function (i) { if (mode !== 'market') return b.apply(this, arguments); const c = G.pc >= 0 ? G.myCo() : null; if (!c || !c.bizType) return '#3a4250';
  const mine = (c.bunits || []).filter(u => u.t === i); const rv = (c.rivals || []).filter(x => x.t === i).reduce((s, x) => s + x.str, 0);
  if (mine.length) { const v = mine.reduce((s, u) => s + G.unitRev(c, u), 0); return lerpC([40, 110, 70], [90, 230, 140], Math.min(1, v / Math.max(1e-9, G.bizMonthly(c)) * 2)); }
  if (rv) return lerpC([120, 70, 60], [230, 90, 70], Math.min(1, rv / 6));
  const ev = G.cityEvOf(G.ter[i].ctrl); if (ev) return '#8a7a3a'; return G.ter[i].ctrl === c.home ? '#4a5566' : '#2f3742'; }; }
{ const b = window.renderLegend; if (b) window.renderLegend = function () { b.apply(this, arguments); if (mode !== 'market') return; const el = document.getElementById('legend'); if (!el) return;
  el.innerHTML = `<b>🏪 ${t_('Ринок вашої справи')}</b><div>🟩 ${t_('ваші заклади (яскравіше — більший дохід)')}</div><div>🟥 ${t_('лише конкуренти')}</div><div>🟨 ${t_('країна з подією міста')}</div><div>⬜ ${t_('ваша країна — місце для нового закладу')}</div>`; }; }

// ---------- сучасний інтерфейс ----------
function ui2Apply() { document.body.classList.toggle('ui2', AUD.S.ui2 !== false); }
{ const s = AUD.set; AUD.set = function (k, v) { const r = s.apply(this, arguments); if (k === 'ui2') ui2Apply(); return r; }; }
document.addEventListener('DOMContentLoaded', ui2Apply); ui2Apply();
