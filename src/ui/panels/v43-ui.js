// v4.3 — інтерфейс: тактика в бою, державна посада, власна справа поетапно, збут руди й перевізники, угоди між гравцями,
// ситуації-вибори, сезони в місті, авіалінії на мапі.
const POSN = { attack: 'готує наступ', defend: 'окопується в обороні', maneuver: 'маневрує, шукає обхід' };
const v43me = () => G && G.leader;

// ---------------- ВКЛАДКИ ----------------
{ const base = window.curTabs; if (base) window.curTabs = function () { const r = base.apply(this, arguments); const L = v43me(); if (!L) return r;
  const add = (k, n, after) => { if (r.some(x => x[0] === k)) return; const i = r.findIndex(x => x[0] === after); r.splice(i >= 0 ? i + 1 : r.length, 0, [k, n]); };
  if (L.role === 'char' && L.post) add('post', '🏛 Посада', 'career');
  if (L.role === 'char' && G.pc < 0 && (L.biz || L.job)) add('biz', '🚀 Своя справа', 'ops');
  if (L.role === 'char' || G.pc >= 0) add('deals', '🤝 Угоди', G.pc >= 0 ? 'coops' : 'biz');
  return r; }; }

// ---------------- ПОПАПИ: тактика, ситуації, кандидати на посади, вхідні угоди ----------------
let v43Seen = new Set();
{ const base = window.checkPopups; window.checkPopups = function () { base(); if (modalOpen || !G || G.gameOver) return; const L = v43me();
  if (L && L.tacAsk) { const q = L.tacAsk; if (!G.online) setSpeed(0);
    openModal(`<h2>🎯 ${t_('Бій за')} ${esc(regName(q.t))}</h2><p>🛰 ${t_('Розвідка (точність')} ~${q.acc}%): ${t_('противник')} <b>${t_(POSN[q.rep])}</b>.</p><p class="mut small">${t_('Оберіть тактику на найближчі 4 дні. Влучний вибір дає до +30% сили, хибний — мінус. Розвідка може помилятися.')}</p>
      <div class="tacg">${Object.entries(G.TAC).map(([k, A]) => `<button class="tacc" onclick="closeModal();s2Res(G.act.tacChoose('${k}'))"><b>${A.ic} ${esc(t_(A.n))}</b><span>${esc(t_(A.d))}</span></button>`).join('')}</div>`); return; }
  if (L && L.evQ && L.evQ.length) { const ev = L.evQ[0]; const E = G.CEV.find(x => x.id === ev.id); if (E) { if (!G.online) setSpeed(0);
    openModal(`<h2>📨 ${t_('Ситуація')}</h2><p>${esc(t_(E.t))}</p><div class="btns" style="flex-direction:column;align-items:stretch">${E.o.map((o, i) => `<button class="${i ? '' : 'pri'}" onclick="closeModal();s2Res(G.act.charEvDo(0,${i}))">${esc(t_(o[0]))}</button>`).join('')}</div><p class="mut small">${t_('Рішення впливають на гроші, репутацію й ризик кримінальної справи.')}</p>`); return; } else L.evQ.shift(); }
  if (G.player >= 0) { const rq = G.v43().postReq.filter(r => !r.done && r.nid === G.player); if (rq.length && !v43Seen.has('pr' + rq.map(r => r.id).join(','))) { v43Seen.add('pr' + rq.map(r => r.id).join(','));
    openModal(`<h2>📥 ${t_('Кандидати на посади')}</h2>${rq.map(r => `<div class="card small"><div class="row"><b>${esc(r.name)}</b><span>${esc(t_(G.MIN[r.k].n))}</span></div><div class="mut">${t_('рейтинг кандидата')}: ${r.score}</div><div class="btns"><button class="pri" onclick="s2Res(G.act.postAnswer(${r.id},true));closeModal()">✔ ${t_('Призначити')}</button><button onclick="s2Res(G.act.postAnswer(${r.id},false));closeModal()">✖ ${t_('Відхилити')}</button></div></div>`).join('')}<div class="btns"><button onclick="closeModal()">${t_('Пізніше')}</button></div>`); return; } }
  const me = G.curLk(); const inc = G.v43().deals.filter(d => d.st === 'open' && d.turn === me && !v43Seen.has('d' + d.id + ':' + d.hist.length));
  if (inc.length) { inc.forEach(d => v43Seen.add('d' + d.id + ':' + d.hist.length)); hint('✉ ' + t_('Нова пропозиція угоди — вкладка «Угоди»'), 4000); if (window.AUD) AUD.sfx('good'); }
}; }

// ---------------- ДЕРЖАВНА ПОСАДА ----------------
TAB_FN.post = function () { const L = v43me(); if (!L || !L.post) return ''; const p = L.post, n = G.N[p.nid], M = G.MIN[p.k];
  let h = `<div class="card"><b>${M.ic} ${esc(t_(M.n))}</b> · ${ndot(p.nid)}${esc(n.name)}<div class="small mut">${esc(t_(M.area))} · ${t_('з')} ${G.dateStr(p.d0)}</div></div>
    <div class="kpi"><div><b>${money(n.cash)}</b><span>${t_('бюджет країни')}</span></div><div><b>${Math.round(n.stab)}</b><span>${t_('стабільність')}</span></div><div><b>${Math.round(L.popu[p.nid] || 0)}</b><span>${t_('ваша популярність')}</span></div></div>
    <div class="small mut">${t_('Дії міністерства витрачають державний бюджет. Популярність нижче 8 два місяці поспіль — відставка.')}</div><div class="grp">🗂 ${t_('Повноваження')}</div>`;
  G.minActions(p.k).filter(A => A[0] !== 'fire' && A[0] !== 'bonus' && A[0] !== 'audit').forEach(A => { const e = G.minCan(p.nid, p.k, A[0]); h += `<div class="card small"><div class="row"><b>${A[2]} ${esc(t_(A[1]))}</b><span>${money(A[3](n))}</span></div><div class="mut">${esc(t_(A[5]))}</div>${s2B('▶ ' + t_('Виконати'), `s2Res(G.act.postDo('${A[0]}'))`, e, 1)}</div>`; });
  return h + `<div class="btns">${s2B('🚪 ' + t_('Відставка'), 's2Res(G.act.postResign())', '')}</div>`; };
{ const base = TAB_FN.ops; TAB_FN.ops = function () { const L = v43me(); let h = base(); if (!L || !L.job) return h; const s = G.seasonAt(L.at);
  h = `<div class="small mut" style="margin-bottom:4px">${t_(G.SEAS[s])} · ${esc(regName(L.at))}${s === 'winter' ? ' · ' + t_('частина польових і будівельних справ недоступна') : s === 'summer' ? ' · ' + t_('туристичний сезон: бонус кухарям, продавцям, акторам, пілотам, спортсменам') : ''}</div>` + h;
  const k = G.postFor(L); if (k) { const e = G.postErr(L); h += `<div class="grp">🏛 ${t_('Державна карʼєра')}</div><div class="card small"><b>${G.MIN[k].ic} ${esc(t_(G.MIN[k].n))}</b><div class="mut">${t_('Вершина вашої професії — посада в уряді з реальними повноваженнями. Потрібна одна з двох найвищих посад і популярність. Якщо країною керує гравець — він обирає серед кандидатів.')}</div>${s2B('📨 ' + t_('Подати кандидатуру'), 's2Res(G.act.postApply())', e, 1)}</div>`; }
  return h; }; }

// ---------------- ВЛАСНА СПРАВА ----------------
TAB_FN.biz = function () { const L = v43me(); if (!L) return ''; const b = L.biz;
  let h = `<div class="card small">${t_('Відкрийте власну справу за профілем професії. Дешевий шлях — кроками: відкласти гроші, скласти план, домовитися про допомогу, орендувати приміщення, зареєструватися, найняти людей. «По-старому» — Карʼєра → Заснувати компанію (≥ $500 тис. власних грошей).')}</div>`;
  if (!b) { const B = L.job && G.BIZ[L.job.k]; return h + (B ? `<div class="card"><b>🚀 ${esc(t_(B[1]))}</b> <span class="mut">(${esc(t_(G.D.companySectors[B[0]].n))})</span><div class="small mut">${t_('Ліцензія потребує навички')}: ${esc(t_((G.SKILLS[B[2]] || {}).n || B[2]))} 2+</div>${s2B('▶ ' + t_('Почати готуватися'), 's2Res(G.act.bizStart())', G.bizErr(L), 1)}</div>` : ''); }
  const miss = G.bizReady(b), cap = G.bizCapital(b); const st = (done, n) => `<span class="${done ? 'g' : 'mut'}">${done ? '✔' : '◻'}</span> <b>${t_(n)}</b>`;
  h += `<div class="card"><div class="row"><b>${esc(b.name)}</b><span>${t_('капітал')}: <b>${money(cap)}</b></span></div>${s2bar(1 - miss.length / 5, '#4cd28a')}<div class="small mut">${miss.length ? t_('Ще потрібно') + ': ' + miss.map(t_).join(', ') : t_('Усе готово — можна відкриватися!')}</div></div>`;
  h += `<div class="card small">${st(b.fund >= 20000 / 1e9, '1. Фонд справи')} <span class="mut">${money(b.fund)} / ${money(20000 / 1e9)}+</span><div class="btns">${s2B('+10%', "s2Res(G.act.bizDo('save',0.1))", '')}${s2B('+25%', "s2Res(G.act.bizDo('save',0.25))", '')}${s2B('+50%', "s2Res(G.act.bizDo('save',0.5))", '')}${s2B('↩', "s2Res(G.act.bizDo('unsave'))", b.fund <= 0 ? 'Фонд порожній' : '', 0, 'Забрати гроші з фонду')}</div><div class="mut">${t_('від ваших вільних грошей; що більший фонд, то більше дадуть кредитори й інвестори')}</div></div>`;
  h += `<div class="card small">${st(b.plan, '2. Бізнес-план')}${b.plan ? ` <span class="mut">${t_('якість')} ${(+b.plan).toFixed(1)}/5</span>` : `<div class="btns">${s2B('✍ ' + t_('Самому (5 дн.)'), "s2Res(G.act.bizDo('plan','self'))", (L.busy || 0) > G.day ? 'Ви зайняті' : '')}${s2B('🧑‍💼 ' + t_('Консультант $3 тис.'), "s2Res(G.act.bizDo('plan','consult'))", '')}</div>`}</div>`;
  h += `<div class="card small">${st(Object.keys(b.help).length, '3. Допомога (до двох джерел)')}${Object.entries(G.BIZ_HELP).map(([k, H]) => `<div class="row"><span>${H[0]} ${esc(t_(H[1]))}<br><span class="mut">${esc(t_(H[2]))}</span></span>${b.help[k] ? `<b class="g">+${money(b.help[k].amt)}</b>` : s2B(t_('Домовитись'), `s2Res(G.act.bizDo('help','${k}'))`, !b.plan ? 'Спершу бізнес-план' : '')}</div>`).join('')}</div>`;
  h += `<div class="card small">${st(b.place, '4. Приміщення')}${b.place ? ` <span class="mut">${b.place === 'mid' ? t_('виробниче (до 12 людей)') : t_('офіс (до 5 людей)')}</span>` : `<div class="btns">${s2B('🏢 ' + t_('Офіс') + ' $800', "s2Res(G.act.bizDo('place','small'))", '')}${s2B('🏭 ' + t_('Виробниче') + ' $2.5 тис.', "s2Res(G.act.bizDo('place','mid'))", '')}</div>`}</div>`;
  h += `<div class="card small">${st(b.reg, '5. Реєстрація й ліцензія')}${b.reg ? '' : s2B('📜 $600 · 5 ' + t_('дн.'), "s2Res(G.act.bizDo('reg'))", '')}</div>`;
  h += `<div class="card small">${st(b.team >= 1, '6. Команда')} <span class="mut">${b.team} ${t_('осіб')}</span><div class="btns">${s2B('+1 · $1.5 тис.', "s2Res(G.act.bizDo('team',1))", !b.place ? 'Спершу приміщення' : '')}${s2B('+3', "s2Res(G.act.bizDo('team',3))", !b.place ? 'Спершу приміщення' : '')}</div></div>`;
  h += `<div class="btns">${s2B('🎉 ' + t_('Відкрити справу'), 's2Res(G.act.bizOpen())', miss.length ? 'Ще потрібно: ' + miss.join(', ') : '', 1)}${s2B('✖ ' + t_('Відкласти задум'), "s2Res(G.act.bizDo('cancel'))", '', 0, 'Повертає 90% фонду')}</div>`;
  return h; };

// ---------------- ЗБУТ РУДИ (у вкладці «Родовища») і КОНТРАКТИ ПЕРЕВІЗНИКА (у «Маршрутах») ----------------
let oreS = { to: null, m: 'truck' };
{ const base = window.s2Mines; window.s2Mines = function (c) { let h = '';
  const o = G.oreOf(c), has = Object.keys(o).length; const fc = G.v43().fc.find(x => x.shipper === c.id && x.st === 'active');
  if (has || c.assets.some(a => G.extOf(a.type))) { const mk = G.fcMarkets(c); if (oreS.to == null || !mk.some(m => m[0] === oreS.to)) oreS.to = mk[0] ? mk[0][0] : null;
    const val = Object.keys(o).reduce((s, r) => s + o[r] * G.spotSell(r), 0); const lg = c.oreLog;
    h += `<div class="grp">📦 ${t_('Збут руди')}</div><div class="card small"><div class="row"><span>${t_('Видобуток на місяць')}</span><b>${money(val)}</b></div>
      <div class="btns"><button class="small ${c.oreMode !== 'ship' ? 'on' : ''}" onclick="s2Res(G.act.setOreMode('site'))">🏷 ${t_('Продавати біля шахти')} (${Math.round(G.SITE_K * 100)}%)</button><button class="small ${c.oreMode === 'ship' ? 'on' : ''}" ${fc ? '' : 'disabled'} onclick="s2Res(G.act.setOreMode('ship'))">🚚 ${t_('Возити до ринку')}</button></div>
      ${lg ? `<div class="mut">${t_('Минулого місяця')}: ${lg.site != null ? t_('продано біля шахти за') + ' ' + money(lg.site) : `${t_('довезено')} ${money(lg.moved)}, ${t_('перевізнику')} ${money(lg.fee)}${lg.share < 1 ? ` (${t_('встиг')} ${Math.round(lg.share * 100)}%)` : ''}`}</div>` : ''}
      ${fc ? `<div class="card small" style="margin-top:6px"><b>🤝 ${t_('Перевізник')}: ${esc(fc.carrier >= 0 ? G.companies[fc.carrier].name : 'ШІ')}</b>${fc.ai ? ` <span class="mut">(${t_('базова ціна ШІ')})</span>` : ''}<div class="row"><span>${esc(regName(fc.from))} → ${esc(regName(fc.to))}</span><span>${Math.round(fc.rate * 100)}% ${t_('від вартості')}</span></div><div class="row"><span>${t_('Довезено')}</span><b>${money(fc.moved)}</b></div>${s2B('✖ ' + t_('Розірвати'), `s2Res(G.act.fcEnd(${fc.id}))`, '')}</div>`
      : `<div class="mut">${t_('Біля шахти покупець забирає сам — дешевше. Найміть перевізника, щоб продавати на ринку дорожче: ШІ за базовою ціною одразу або гравця з логістичною компанією — через «Угоди».')}</div>
      <select style="width:100%;margin:4px 0" onchange="oreS.to=+this.value;renderTab(true)">${mk.map(m => `<option value="${m[0]}" ${m[0] === oreS.to ? 'selected' : ''}>${esc(t_(m[1]))} — ${esc(regName(m[0]))} · ${t_('ставка ШІ')} ${Math.round(G.fcRate(c.assets.find(a => G.extOf(a.type)) ? c.assets.find(a => G.extOf(a.type)).t : m[0], m[0]) * 100)}%</option>`).join('')}</select>
      <div class="btns">${Object.entries(G.VEH).filter(([k]) => k !== 'air').map(([k, V]) => `<button class="small ${oreS.m === k ? 'on' : ''}" onclick="oreS.m='${k}';renderTab(true)">${V.ic}</button>`).join('')}${s2B('🤝 ' + t_('Найняти перевізника ШІ'), `s2Res(G.act.fcAI(${oreS.to},'${oreS.m}'))`, oreS.to == null ? 'Немає ринку' : '', 1)}</div>`}</div>`; }
  return h + base(c); }; }
{ const base = window.s2Routes; window.s2Routes = function (c) { let h = base(c); const fcs = G.v43().fc.filter(x => x.carrier === c.id && x.st === 'active' && !x.ai); if (!fcs.length) return h;
  const mine = G.s2().routes.filter(r => r.co === c.id);
  h += `<div class="grp">📦 ${t_('Контракти на перевезення руди')}</div>` + fcs.map(fc => { const sh = G.companies[fc.shipper]; const bound = mine.filter(r => r.fc === fc.id); const cap = G.fcCap(fc);
    return `<div class="card small"><div class="row"><b>${esc(sh ? sh.name : '?')}</b><span>${Math.round(fc.rate * 100)}% ${t_('від вартості')}</span></div><div>${esc(regName(fc.from))} → ${esc(regName(fc.to))}</div>
      <div class="row"><span>${t_('Привʼязано транспорту')}</span><span>${bound.reduce((s, r) => s + r.u.length, 0)} · ${t_('пропускна здатність')} ≈${money(cap)}/${t_('міс.')}</span></div><div class="row"><span>${t_('Отримано')}</span><b class="g">${money(fc.paid)}</b></div>
      ${bound.length ? '' : `<div class="r">${t_('Відкрийте маршрут між цими пунктами й привʼяжіть його — інакше вантаж стоїть')}</div>`}
      <div class="btns">${mine.filter(r => !r.fc && ((r.a === fc.from && r.b === fc.to) || (r.b === fc.from && r.a === fc.to))).map(r => s2B(`🔗 ${G.VEH[r.m].ic}×${r.u.length}`, `s2Res(G.act.fcBind(${fc.id},${r.id}))`, '')).join('')}<button class="small" onclick="s2R.a=${fc.from};s2R.b=${fc.to};renderTab(true)">📍 ${t_('Підставити точки')}</button></div></div>`; }).join('');
  return h; }; }

// ---------------- УГОДИ МІЖ ГРАВЦЯМИ ----------------
let dS = { kind: 'service', to: null, price: 1000, text: '', payer: 'from', useCo: 0, r: null, q: 1, mode: 'truck', mk: null };
TAB_FN.deals = function () { const me = G.curLk(); const others = G.humanLks().filter(k => k !== me && G.leaders[k]); const D = G.v43().deals;
  let h = `<div class="card small">${t_('Домовляйтеся з іншими гравцями: послуги за гроші, продаж ресурсів, перевезення руди. Кожна сторона може запропонувати свою ціну, доки обидві не погодяться. З ШІ угоди йдуть за базовими цінами (біржа, перевізники ШІ).')}</div>`;
  const mineD = D.filter(d => d.from === me || d.to === me); const nm = lk => G.leaders[lk] ? G.leaders[lk].name : '?';
  const fmtP = d => d.kind === 'loan' ? d.price + '%/' + t_('міс.') : d.kind === 'freight' ? Math.round(d.price * 100) + '%' : d.kind === 'sell' ? money(d.price) : '$' + Math.round(d.price).toLocaleString('uk-UA');
  const terms = d => d.kind === 'loan' ? `💰 $${(+d.terms.amt).toLocaleString('uk-UA')} · ${d.terms.months} ${t_('міс.')} · ${t_('позичає')} ${esc(nm(d.terms.lender === 'to' ? d.to : d.from))}` : d.kind === 'service' ? `«${esc(d.terms.text || '')}» · ${t_('платить')} ${esc(nm(d.terms.payer === 'to' ? d.to : d.from))}` : d.kind === 'sell' ? `${(G.D.resources[d.terms.r] || {}).ic || ''} ${esc(t_((G.D.resources[d.terms.r] || {}).n || d.terms.r))} × ${(+d.terms.q).toFixed(2)}` : `${esc(regName(d.terms.from))} → ${esc(regName(d.terms.to))} ${G.VEH[d.terms.mode || 'truck'].ic}`;
  if (mineD.length) { h += `<div class="grp">📑 ${t_('Ваші угоди')}</div>`; mineD.slice().reverse().forEach(d => { const my = d.turn === me && d.st === 'open'; const K = G.DEAL_K[d.kind];
    h += `<div class="card small" ${my ? 'style="border-color:#ffb000"' : ''}><div class="row"><b>${K[0]} ${esc(t_(K[1]))}</b><span class="mut">${esc(nm(d.from))} → ${esc(nm(d.to))}</span></div><div>${terms(d)}</div>
      <div class="row"><span>${t_('Ціна')}</span><b>${fmtP(d)}</b></div><div class="mut">${d.hist.map(x => `${esc(nm(x[0]))}: ${d.kind === 'freight' ? Math.round(x[1] * 100) + '%' : x[1]}${x[2] ? ' — ' + esc(t_(x[2])) : ''}`).join(' · ')}</div>
      ${d.st !== 'open' ? `<div class="${d.st === 'done' ? 'g' : 'mut'}">${d.st === 'done' ? '✔ ' + t_('укладено') : d.st === 'no' ? '✖ ' + t_('відхилено') : '⌛ ' + t_('прострочено')}</div>`
      : my ? `<div class="btns"><input id="dc${d.id}" type="number" style="width:90px" value="${d.kind === 'freight' ? Math.round(d.price * 100) : d.price}">${s2B('↔ ' + t_('Своя ціна'), `s2Res(G.act.dealCounter(${d.id},${d.kind === 'freight' ? '(+document.getElementById(\'dc' + d.id + '\').value)/100' : '+document.getElementById(\'dc' + d.id + '\').value'}))`, '')}${s2B('✔ ' + t_('Погодитись'), `s2Res(G.act.dealAccept(${d.id}))`, '', 1)}${s2B('✖', `s2Res(G.act.dealDecline(${d.id}))`, '')}</div>`
      : `<div class="mut">⏳ ${t_('чекаємо відповіді')} ${esc(nm(d.turn))} · ${t_('до')} ${G.dateStr(d.exp)} ${s2B('✖', `s2Res(G.act.dealDecline(${d.id}))`, '', 0, 'Скасувати')}</div>`}</div>`; }); }
  h += `<div class="grp">✍ ${t_('Нова пропозиція')}</div>`;
  if (!others.length) return h + `<div class="card small mut">${t_('У грі немає інших гравців. Угоди між гравцями доступні в мультиплеєрі; у сольній грі перевізника ШІ наймають у вкладці «Родовища», а ресурси продають на біржі компанії.')}</div>`;
  if (dS.to == null || !others.includes(dS.to)) dS.to = others[0]; const myCo = G.coOfLk(me);
  h += `<div class="card small"><div class="row"><span>${t_('Кому')}</span><select onchange="dS.to=isNaN(+this.value)?this.value:+this.value;renderTab(true)">${others.map(k => `<option value="${k}" ${k === dS.to ? 'selected' : ''}>${esc(nm(k))}${G.coOfLk(k) ? ' · 🏢 ' + esc(G.coOfLk(k).name) : ''}</option>`).join('')}</select></div>
    <div class="btns">${Object.entries(G.DEAL_K).map(([k, K]) => `<button class="small ${dS.kind === k ? 'on' : ''}" onclick="dS.kind='${k}';renderTab(true)">${K[0]} ${t_(K[1])}</button>`).join('')}</div>`;
  if (dS.kind === 'service') h += `<input style="width:100%;margin:4px 0" placeholder="${t_('Опис послуги: захист у суді, рейс, консультація…')}" value="${esc(dS.text)}" oninput="dS.text=this.value">
    <div class="row"><span>${t_('Ціна, $')}</span><input type="number" style="width:110px" value="${dS.price}" oninput="dS.price=+this.value"></div>
    <div class="row"><span>${t_('Хто платить')}</span><select onchange="dS.payer=this.value"><option value="from" ${dS.payer === 'from' ? 'selected' : ''}>${t_('я')}</option><option value="to" ${dS.payer === 'to' ? 'selected' : ''}>${esc(nm(dS.to))}</option></select></div>${myCo ? `<label class="row small"><span>${t_('Платити з рахунку компанії')}</span><input type="checkbox" ${dS.useCo ? 'checked' : ''} onchange="dS.useCo=this.checked?1:0"></label>` : ''}
    ${s2B('📤 ' + t_('Надіслати'), "s2Res(G.act.dealNew('service',dS.to,{text:dS.text,payer:dS.payer,useCo:dS.useCo},dS.price))", !dS.text ? 'Опишіть послугу' : '', 1)}`;
  if (dS.kind === 'sell') { const rs = myCo ? Object.keys(myCo.res || {}).filter(r => myCo.res[r] > 0.001) : []; if (dS.r == null || !rs.includes(dS.r)) dS.r = rs[0];
    h += !myCo ? `<div class="mut">${t_('Потрібна ваша компанія')}</div>` : !rs.length ? `<div class="mut">${t_('Склад компанії порожній')}</div>` : `<div class="row"><span>${t_('Ресурс')}</span><select onchange="dS.r=this.value;renderTab(true)">${rs.map(r => `<option value="${r}" ${r === dS.r ? 'selected' : ''}>${esc(t_(G.D.resources[r].n))} (${myCo.res[r].toFixed(2)})</option>`).join('')}</select></div>
      <div class="row"><span>${t_('Кількість')}</span><input type="number" step="0.01" style="width:90px" value="${dS.q}" oninput="dS.q=+this.value"></div><div class="row"><span>${t_('Ціна разом')} ($ ${t_('млрд')})</span><input type="number" step="0.001" style="width:110px" value="${(dS.q * G.spotSell(dS.r)).toFixed(4)}" id="dsp"></div><div class="mut">${t_('біржа зараз')}: ${money(G.spotSell(dS.r))}/${t_('од.')}</div>
      ${s2B('📤 ' + t_('Запропонувати'), "s2Res(G.act.dealNew('sell',dS.to,{r:dS.r,q:dS.q},+document.getElementById('dsp').value))", '', 1)}`; }
  if (dS.kind === 'freight') { const oc = G.coOfLk(dS.to); const ok = myCo && Object.keys(G.oreOf(myCo)).length;
    if (!ok) h += `<div class="mut">${t_('Потрібна ваша видобувна компанія з діючими шахтами')}</div>`; else if (!oc || oc.sector !== 'logistics') h += `<div class="mut">${t_('У гравця немає логістичної компанії')}</div>`;
    else { const mk = G.fcMarkets(myCo); if (dS.mk == null || !mk.some(m => m[0] === dS.mk)) dS.mk = mk[0] && mk[0][0]; const base = G.fcRate(myCo.assets.find(a => G.extOf(a.type)).t, dS.mk);
      h += `<select style="width:100%;margin:4px 0" onchange="dS.mk=+this.value;renderTab(true)">${mk.map(m => `<option value="${m[0]}" ${m[0] === dS.mk ? 'selected' : ''}>${esc(t_(m[1]))} — ${esc(regName(m[0]))}</option>`).join('')}</select>
        <div class="btns">${Object.entries(G.VEH).filter(([k]) => k !== 'air').map(([k, V]) => `<button class="small ${dS.mode === k ? 'on' : ''}" onclick="dS.mode='${k}';renderTab(true)">${V.ic}</button>`).join('')}</div>
        <div class="row"><span>${t_('Ставка, % від вартості')}</span><input id="dsr" type="number" style="width:70px" value="${Math.round(base * 100)}"></div><div class="mut">${t_('базова ставка ШІ')}: ${Math.round(base * 100)}%</div>
        ${s2B('📤 ' + t_('Запропонувати'), "s2Res(G.act.dealNew('freight',dS.to,{to:dS.mk,mode:dS.mode},(+document.getElementById('dsr').value)/100))", '', 1)}`; } }
  return h + '</div>'; };

// ---------------- МІСТО: сезони ----------------
let cwP = null;
function cityWeather(cx, W, H, now, night) { if (!G || !G.leader) return; const s = G.seasonAt(G.leader.at);
  if (!cwP) cwP = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), v: 0.03 + Math.random() * 0.06, r: 1 + Math.random() * 2.2 }));
  if (s === 'winter') { cx.fillStyle = 'rgba(235,245,255,0.16)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#ffffffd9'; cwP.forEach(p => { p.y += p.v * 0.016; p.x += Math.sin(now + p.y * 9) * 0.0006; if (p.y > 1) { p.y = 0; p.x = Math.random(); } cx.beginPath(); cx.arc(p.x * W, p.y * H, p.r, 0, 7); cx.fill(); }); }
  else if (s === 'autumn' && (Math.floor(G.day / 3) % 3 === 0)) { cx.strokeStyle = 'rgba(160,190,230,0.45)'; cx.lineWidth = 1; cwP.forEach(p => { p.y += p.v * 0.05; if (p.y > 1) { p.y = 0; p.x = Math.random(); } cx.beginPath(); cx.moveTo(p.x * W, p.y * H); cx.lineTo(p.x * W - 3, p.y * H + 10); cx.stroke(); }); }
  else if (s === 'summer' && !night) { const g = cx.createRadialGradient(W * 0.9, H * 0.05, 0, W * 0.9, H * 0.05, W * 0.5); g.addColorStop(0, 'rgba(255,230,140,0.28)'); g.addColorStop(1, 'rgba(255,230,140,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
  cx.font = '600 13px system-ui'; cx.textAlign = 'left'; cx.fillStyle = night ? '#dfe7f5' : '#1b2633'; cx.fillText(t_(G.SEAS[s]), 12, H - 12); cx.textAlign = 'center'; }

// стилі тактики
{ const st = document.createElement('style'); st.textContent = '.tacg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.tacc{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:10px;gap:4px;min-height:74px}.tacc span{font-size:12px;opacity:.75}'; document.head.appendChild(st); }
