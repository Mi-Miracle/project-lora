// ВКЛАДКИ ПЕРСОНАЖА: «Навчання й підробітки», «Партія», «Статки» (розкіш та інвестиції)
function lifeRes(r) { hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
const lifeBusy = L => L.busy > G.day ? `<div class="card small y">⏳ ${t_('Персонаж зайнятий ще')} ${L.busy - G.day} ${t_('дн.')}</div>` : '';
TAB_FN.skills = function () {
  const L = G.leader; if (!L || L.role !== 'char') return '';
  let h = lifeBusy(L) + `<div class="mut small">${t_('Навички — «дослідження» персонажа: відкривають професії й посилюють дії. Курс займає час і коштує грошей; досвід роботи теж підвищує навичку.')}</div><div class="grp">🎓 ${t_('Навички')}</div>`;
  h += Object.entries(G.SKILLS).map(([k, S]) => { const lv = G.skill(L, k), e = G.lifeStudyCan(k), pr = G.lifeStudyPrice(k);
    return `<div class="card small"><div class="row"><b>${S.ic} ${esc(t_(S.n))}</b><span>${'★'.repeat(lv)}${'☆'.repeat(5 - lv)}</span></div><div class="mut">${esc(t_(S.d))}</div>
    <div class="row"><span>${lv < 5 ? money(pr.cost) + ' · ' + pr.days + ' ' + t_('дн.') : t_('Максимум')}</span><button ${e ? `disabled data-tip="${esc(t_(e))}"` : ''} onclick="lifeRes(G.act.lifeStudy('${k}'))">📖 ${t_('Навчатися')}</button></div></div>`; }).join('');
  h += `<div class="grp">💼 ${t_('Підробітки')}</div>` + Object.entries(G.GIGS).map(([k, A]) => { const e = G.gigCan(k);
    return `<div class="row small"><span data-tip="${esc(t_(A.d))}">${A.ic} ${esc(t_(A.n))}<br><span class="mut">${A.days} ${t_('дн.')} · ${esc(t_(A.d))}</span></span><button ${e ? `disabled data-tip="${esc(t_(e))}"` : ''} onclick="lifeRes(G.act.gigDo('${k}'))">▶</button></div>`; }).join('');
  return h;
};
TAB_FN.party = function () {
  const L = G.leader; if (!L || L.role !== 'char') return ''; const P = G.partyOf(L);
  if (!P) { const e = G.careerCan('party'); return `<div class="card small">${t_('У вас ще немає партії. Заснуйте її, коли популярність у країні сягне 15: партія — шлях до парламенту, коаліції й власних законів.')}</div><div class="btns"><button class="pri" ${e ? `disabled data-tip="${esc(t_(e))}"` : ''} onclick="carDo('party')">🎗 ${t_('Заснувати партію')} · ${money(G.CAREER.party.cost)}</button></div>${e ? `<div class="small y">${esc(t_(e))}</div>` : ''}`; }
  const n = nat(P.nid), parl = n.parl, I = G.IDEOS[P.ideo] || G.IDEOS.center; const brS = Object.values(P.br).reduce((s, v) => s + v, 0);
  let h = lifeBusy(L) + `<div class="kpi"><div><b>${P.r.toFixed(1)}%</b><span>${t_('рейтинг')}</span></div><div><b>${P.seats}${parl ? '/' + parl.seats : ''}</b><span>${t_('місць')}</span></div><div><b>${money(P.cash)}</b><span>${t_('каса')}</span></div><div><b>${P.mem.toFixed(0)} ${t_('тис.')}</b><span>${t_('членів')}</span></div></div>`;
  h += `<div class="card small"><div class="row"><b>${esc(P.name)}</b><span>${I.ic} ${esc(t_(I.n))}</span></div><div class="bar"><i style="width:${Math.min(100, P.r * 2)}%"></i></div><div class="mut">${ndot(P.nid)}${esc(n.name)} · ${P.coal ? '🤝 ' + t_('у коаліції — фракція тягне політику країни до своєї програми') : P.seats ? '⚔ ' + t_('в опозиції') : t_('поза парламентом')} · ${t_('вибори')}: ${parl ? G.dateStr(parl.next) : '—'} · ${t_('барʼєр')} 5%</div>
    <div class="mut">${t_('Місця = пропорційні (якщо ≥ 5%) + мажоритарні округи, які дають регіональні осередки')} (${brS})</div></div>`;
  const btn = (k, a, label) => { const e = G.partyCan(k, a); const A = G.PARTY[k]; return `<button class="${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="lifeRes(G.act.partyDo('${k}',${a == null ? 'null' : JSON.stringify(a).replace(/"/g, '&quot;')}))">${A.ic} ${esc(t_(label || A.n))}${A.pc ? ' · ' + money(A.pc) : ''}</button>`; };
  h += `<div class="grp">📣 ${t_('Кампанія')}</div><div class="btns">${btn('p_fund')}${btn('p_ads')}${btn('p_rally')}${btn('p_debate')}${btn('p_congress')}</div>`;
  const ri = sel && sel.type === 't' ? sel.id : null;
  h += `<div class="grp">🏢 ${t_('Регіональні осередки')}</div><div class="mut small">${t_('Оберіть на мапі регіон своєї країни.')}</div><div class="btns">${btn('p_branch', ri, ri != null ? t_('Осередок') + ': ' + regName(ri) : null)}</div>`;
  h += Object.entries(P.br).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([i, v]) => `<div class="row small"><span>${esc(regName(+i))}</span><span>${'▮'.repeat(v)}</span></div>`).join('');
  h += `<div class="grp">🏛 ${t_('Фракція в парламенті')}</div><div class="btns">${btn('p_coal', null, P.coal ? t_('Вийти з коаліції') : t_('Увійти в коаліцію'))}${btn('p_bill')}${btn('p_primary')}</div>`;
  h += `<div class="mut small">${t_('Законопроєкти фракції')}: ${(G.PARTY_BILLS[P.ideo] || []).map(b => '«' + esc(t_(b[0])) + '»').join(', ')}</div>`;
  h += `<div class="grp">🧭 ${t_('Ідеологія')}</div><div class="btns">${Object.entries(G.IDEOS).map(([k, v]) => `<button class="small ${P.ideo === k ? 'on' : ''}" ${P.ideo === k || G.partyCan('p_ideo', k) ? 'disabled' : ''} onclick="lifeRes(G.act.partyDo('p_ideo','${k}'))">${v.ic} ${esc(t_(v.n))}</button>`).join('')}</div>`;
  return h;
};
let luxCat = 'home', invAmt = 0.01;
function lspark(a) { if (a.length < 2) return ''; const w = 90, h = 18, mx = Math.max(...a), mn = Math.min(...a), d = Math.max(1e-9, mx - mn); return `<svg width="${w}" height="${h}" style="vertical-align:middle"><polyline fill="none" stroke="#4fb3ff" stroke-width="1.5" points="${a.map((v, i) => (i / (a.length - 1) * w).toFixed(1) + ',' + (h - 1 - (v - mn) / d * (h - 2)).toFixed(1)).join(' ')}"/></svg>`; }
TAB_FN.life = function () {
  const L = G.leader; if (!L || L.role !== 'char') return ''; G.lifeInit(); const V = G.invValue(L), nid = G.leaderNation();
  let h = `<div class="kpi"><div><b>${money(G.lifeWealth(L))}</b><span>${t_('статки')}</span></div><div><b>${money(L.money)}</b><span>${t_('готівка')}</span></div><div><b>${money(V.tot)}</b><span>${t_('інвестиції')}</span></div><div><b>${(L.own || []).length}</b><span>${t_('майно')}</span></div></div>`;
  h += subnav('life', [['lux', '💎 ' + t_('Розкіш')], ['own', '🗝 ' + t_('Моє майно')], ['inv', '📈 ' + t_('Інвестиції')]]); const sub = curSub('life', 'lux');
  if (sub === 'lux') {
    h += `<div class="mut small">${t_('Купівля — у країні, де зараз персонаж (нерухомість дорожча в багатих країнах). Розкіш дає славу, звʼязки, швидші перельоти, охорону, оренду — але й утримання; показна розкіш у бідних країнах шкодить популярності.')}</div>`;
    h += `<div class="sub">${Object.entries(G.LUX_CAT).map(([k, [ic, n]]) => `<button class="${luxCat === k ? 'on' : ''}" onclick="luxCat='${k}';renderTab(true)">${ic} ${esc(t_(n))}</button>`).join('')}</div>`;
    h += Object.entries(G.LUX).filter(([, A]) => A.c === luxCat).map(([k, A]) => { const e = G.luxCan(k), p = nid >= 0 ? G.luxPrice(k, nid) : A.p;
      const fx = [A.fame ? `⭐ +${A.fame}` : '', A.pop ? `🎤 ${A.pop > 0 ? '+' : ''}${A.pop}${A.once ? '' : '/' + t_('міс.')}` : '', A.cont ? `🤝 +${A.cont}${A.once ? '' : '/' + t_('міс.')}` : '', A.trav ? `✈ ×${A.trav}` : '', A.sec ? `🛡 ${A.sec}` : '', A.media ? `📺 +${A.media}` : '', A.rent ? `💵 ${(A.rent * 100).toFixed(1)}%/${t_('рік')}` : '', A.apr ? '📈' : '', A.upk ? `🔧 ${(A.upk * 100).toFixed(0)}%/${t_('рік')}` : '', A.once ? t_('разово') : ''].filter(Boolean).join(' · ');
      return `<div class="row small"><span>${esc(t_(A.n))}<br><span class="mut">${fx}</span></span><span><b>${money(p)}</b> <button ${e ? `disabled data-tip="${esc(t_(e))}"` : ''} onclick="lifeRes(G.act.luxBuy('${k}'))">${t_('Купити')}</button></span></div>`; }).join('');
  } else if (sub === 'own') {
    if (!(L.own || []).length) h += `<div class="mut">${t_('Майна ще немає.')}</div>`;
    h += (L.own || []).map((o, i) => { const A = G.LUX[o.k]; const ch = o.v / o.p0 - 1;
      return `<div class="row small"><span>${G.LUX_CAT[A.c][0]} ${esc(t_(A.n))}<br><span class="mut">${ndot(o.nid)}${esc(nat(o.nid).name)} · ${t_('куплено')} ${G.dateStr(o.d)}</span></span><span><b>${money(o.v)}</b> <span class="${ch >= 0 ? 'g' : 'r'}">${ch >= 0 ? '+' : ''}${(ch * 100).toFixed(0)}%</span> <button onclick="lifeRes(G.act.luxSell(${i}))">${t_('Продати')}</button></span></div>`; }).join('');
    const tm = G.lifeTravelMul(L); h += `<div class="card small">${t_('Перельоти')}: ×${tm} · ${t_('охорона')} ${G.lifeSec(L)} · ${t_('медіа')} ${G.lifeMedia(L)}</div>`;
  } else {
    const M = G.mkt; h += `<div class="card small"><div class="row"><span>🪙 ${t_('Крипта')} ${lspark(M.cryptoH.slice(-24))}</span><b>×${M.crypto.toFixed(2)}</b></div><div class="row"><span>🥇 ${t_('Золото')} ${lspark(M.goldH.slice(-24))}</span><b>×${M.gold.toFixed(2)}</b></div>${nid >= 0 ? `<div class="row"><span>🏛 ${t_('Облігації')} ${esc(nat(nid).name)}</span><b>${(G.bondYield(nid) * 100).toFixed(1)}%</b></div>` : ''}</div>`;
    h += `<div class="row small"><span>${t_('Сума')}: <b>${money(invAmt)}</b></span><input type="range" min="0.001" max="${Math.max(0.0011, L.money).toFixed(4)}" step="0.001" value="${Math.min(invAmt, L.money)}" onchange="invAmt=+this.value;renderTab(true)"></div>`;
    h += Object.entries(G.INV).map(([k, A]) => { const e = G.invCan(k, invAmt); return `<div class="row small"><span>${A.ic} ${esc(t_(A.n))}<br><span class="mut">${esc(t_(A.d))}</span></span><button ${e ? `disabled data-tip="${esc(t_(e))}"` : ''} onclick="lifeRes(G.act.invest('${k}',invAmt))">${t_('Вкласти')}</button></div>`; }).join('');
    const I = L.pf; if (I) { h += `<div class="grp">📊 ${t_('Портфель')}</div>`;
      Object.entries(I.b).forEach(([k, v]) => { h += `<div class="row small"><span>🏛 ${esc(nat(+k).name)} · ${(G.bondYield(+k) * 100).toFixed(1)}%</span><span>${money(v)} <button onclick="lifeRes(G.act.invSell('bond',${k}))">${t_('Продати')}</button></span></div>`; });
      [['fund', '🌐', V.f], ['crypto', '🪙', V.c], ['gold', '🥇', V.g]].forEach(([k, ic, v]) => { if (v > 0) h += `<div class="row small"><span>${ic} ${esc(t_(G.INV[k].n))}</span><span>${money(v)} <button onclick="lifeRes(G.act.invSell('${k}'))">${t_('Продати')}</button></span></div>`; });
      I.v.forEach(x => { h += `<div class="row small"><span>🚀 ${esc(t_(x.name))} (${esc(nat(x.nid).name)})</span><span>${money(x.amt)} · ${t_('результат')} ${G.dateStr(x.end)}</span></div>`; });
      I.d.forEach((x, i) => { h += `<div class="row small"><span>🏗 ${esc(regName(x.t))}</span><span>${money(x.amt)} <button onclick="lifeRes(G.act.invSell('direct',${i}))">${t_('Вийти')} (−20%)</button></span></div>`; }); }
    h += `<div class="mut small">${t_('Вплив на світ: облігації наповнюють бюджет країни (і її борг), прямі інвестиції й успішні стартапи прискорюють зростання ВВП, обвал криптобульбашки гальмує світову економіку. Акції компаній — вкладка «Світ → Біржа».')}</div>`;
  }
  return h;
};
