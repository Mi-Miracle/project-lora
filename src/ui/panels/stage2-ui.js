// ЕТАП 2 — інтерфейс: вкладка «Фронт» для військового персонажа, вкладка операцій компанії (контракти ВПК, родовища, маршрути),
// керування власним підрозділом на мапі, вибір точок маршруту на мапі, шар мапи з транспортом і шахтами.
function s2Res(r) { if (r && r.pending) { hint('⏳ ' + t_('Надіслано'), 1500); return; } hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 4200); if (window.AUD) AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); if (window.renderTop) renderTop(); if (window.renderRight) renderRight(); }
const s2B = (label, call, err, pri, tip) => `<button class="small ${err ? '' : pri ? 'pri' : ''}" ${err ? 'disabled' : ''} data-tip="${esc(t_(tip || ''))}${err ? (tip ? ' — ' : '') + esc(t_(err)) : ''}" onclick="${call}">${label}</button>`;
const s2bar = (v, c) => `<div class="bar" style="height:6px"><i style="width:${Math.max(0, Math.min(100, v * 100))}%;background:${c || '#4cd28a'}"></i></div>`;
function s2Show(id) { if (typeof selArmy === 'function') selArmy(id); }

// ---------------- ВКЛАДКИ ----------------
{ const base = window.curTabs; if (base) window.curTabs = function () { const r = base.apply(this, arguments); if (!G) return r; const L = G.leader;
  if (L && L.role === 'char' && ((L.job && L.job.k === 'military') || L.unit != null || L.front != null) && !r.some(x => x[0] === 'front')) { const i = r.findIndex(x => x[0] === 'career'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['front', '⚔ Фронт']); }
  const c = G.pc >= 0 && G.myCo(); const lab = c && { military: '⚔ Контракти ВПК', mining: '⛏ Родовища', oil: '⛏ Родовища', logistics: '🚚 Маршрути' }[c.sector];
  if (lab && !r.some(x => x[0] === 'coops')) { const i = r.findIndex(x => x[0] === 'co'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['coops', lab]); }
  return r; }; }

TAB_FN.front = function () {
  const L = G.leader; if (!L || L.role !== 'char') return ''; const j = L.job && L.job.k === 'military' ? L.job : null;
  let h = `<div class="card small">${t_('Військова служба: на фронті ви рухаєтеся разом з армією, досвід і слава — з реальних боїв. З посади «Лейтенант» вам дають власний підрозділ: обирайте його на мапі й клацайте ПКМ по регіону, щоб віддати наказ.')}</div>`;
  if (!j) return h + `<div class="card small y">${t_('Спершу влаштуйтеся: Штаб і військкомат у місті (урядовий квартал).')}</div>`;
  const nid = j.nid, war = G.enemiesOf(nid); const cap = G.unitCap(L), u = G.unitOf(L), fa = G.frontArmy(L);
  h += `<div class="kpi"><div><b>${esc(t_(G.jobTitle(L)))}</b><span>${t_('посада')}</span></div><div><b>${cap ? cap + ' ' + t_('тис.') : '—'}</b><span>${t_('під командуванням')}</span></div><div><b class="${(L.hp || 80) < 40 ? 'r' : ''}">${Math.round(L.hp || 80)}</b><span>${t_('здоровʼя')}</span></div><div><b>${L.misOk || 0}</b><span>${t_('завдань виконано')}</span></div></div>`;
  h += `<div class="card small">${war.length ? `⚔ ${esc(nat(nid).name)} ${t_('воює')}: ${war.map(e => ndot(e) + esc(nat(e).name)).join(', ')}` : `🕊 ${esc(nat(nid).name)} ${t_('зараз не воює — фронту немає. Служіть у штабі й готуйтеся.')}`}</div>`;
  if (fa) { const a = fa; h += `<div class="grp">🎖 ${t_('На фронті')}</div><div class="card"><div class="row"><b>${esc(a.name)}</b><span>${esc(regName(a.t))}</span></div>
    <div class="row"><span>${t_('Чисельність')}</span><b>${people(a.k)}</b></div><div class="row"><span>${t_('Організованість')}</span><span>${pct(a.org, 0)}</span></div>${s2bar(a.org)}<div class="row"><span>${t_('Постачання')}</span><span>${pct(a.sup, 0)}</span></div>${s2bar(a.sup, a.sup < 0.5 ? '#ff5d5d' : '#4cd28a')}
    <div class="row"><span>${t_('Режим')}</span><span>${a.stance === 'attack' ? '➤ ' + t_('наступ') : '🛡 ' + t_('оборона')}</span></div>${(G.battles || []).includes(a.t) ? `<div class="r small">⚔ ${t_('Іде бій!')}</div>` : ''}
    <div class="btns">${s2B('🗺 ' + t_('Показати на мапі'), `s2Show(${a.id})`, '', 1)}${a.pcU ? s2B('➤ ' + t_('Наступ'), `s2Res(G.act.unitStance(${a.id},'attack'))`, a.stance === 'attack' ? 'вже' : '') + s2B('🛡 ' + t_('Оборона'), `s2Res(G.act.unitStance(${a.id},'hold'))`, a.stance !== 'attack' ? 'вже' : '') : ''}${s2B('🚑 ' + t_('Повернутися з фронту'), 's2Res(G.act.frontBack())', '')}</div>
    ${a.pcU ? `<div class="small mut">${t_('Наказ руху: оберіть підрозділ на мапі → ПКМ по регіону (Shift — морем).')}</div>` : `<div class="small mut">${t_('Ви у складі армії: накази віддає командування. Власний підрозділ — з посади «Лейтенант».')}</div>`}</div>`;
    if (L.mis) h += `<div class="card small">📯 <b>${t_('Завдання штабу')}:</b> ${esc(t_(G.misText(L.mis)))}<br><span class="mut">${t_('до')} ${G.dateStr(L.mis.due)}</span> ${s2B('🎯', `focusReg(${L.mis.t})`, '', 0, 'Показати ціль')}</div>`;
    else if (a.pcU) h += `<div class="card small mut">📯 ${t_('Нове завдання штаб надішле найближчими днями.')}</div>`;
  } else {
    h += `<div class="grp">🎖 ${t_('Підрозділ')}</div>`;
    if (u) h += `<div class="card"><div class="row"><b>${esc(u.name)}</b><span>${people(u.k)} / ${cap} ${t_('тис.')}</span></div><div class="small mut">${esc(regName(u.t))} · ${t_('без вас підрозділом керує командування країни')}</div><div class="btns">${s2B('🗺', `s2Show(${u.id})`, '')}${s2B('➕ ' + t_('Поповнити'), 's2Res(G.act.unitFill())', u.k >= cap * 0.97 ? 'Підрозділ укомплектований' : '')}${s2B('↩ ' + t_('Передати під загальне командування'), 's2Res(G.act.unitRelease())', '')}</div></div>`;
    else h += `<div class="card small">${s2B('🎖 ' + t_('Прийняти командування підрозділом'), 's2Res(G.act.unitForm())', G.unitFormErr(L), 1)}</div>`;
    h += `<div class="card small">${s2B('⚔ ' + t_('Вирушити на фронт'), 's2Res(G.act.frontGo())', G.frontErr(L), 1)}<div class="small mut">${t_('На фронті кожен день зараховується як робочий; є ризик поранення. Місто й перельоти — після повернення.')}</div></div>`;
  }
  return h;
};
function focusReg(i) { const c = D.regions[i].c; focusLonLat(c[0], c[1], Math.max(view.s, 6)); sel = { type: 't', id: i }; renderRight(); }

// ---------------- ОПЕРАЦІЇ КОМПАНІЇ ----------------
let s2R = { a: -1, b: -1, m: 'truck', n: 5 }; var s2Pick = null;
function s2PickClick(t) { if (s2Pick === 'a') { s2R.a = t; s2Pick = 'b'; hint('📍 ' + t_('Тепер оберіть пункт призначення'), 4000); } else { s2R.b = t; s2Pick = null; hint(''); } renderTab(true); }
TAB_FN.coops = function () {
  const c = G.myCo(); if (!c) return ''; if (c.sector === 'military') return s2Pmc(c); if (c.sector === 'logistics') return s2Routes(c); if (G.secRes(c.sector).length) return s2Mines(c); return '';
};
function s2Pmc(c) {
  const S = G.s2(); let h = `<div class="card small">${t_('Воюючі держави наймають приватні військові компанії. Ви набираєте й оснащуєте бійців за свій кошт, а замовник платить щомісяця й дає бонус за кожен звільнений регіон. Загоном можна командувати самому (мапа, ПКМ) або передати замовнику.')}</div>`;
  h += `<div class="small mut">${t_('Набір')} ${money(G.PMC.raise)}/${t_('тис.')} · ${t_('утримання')} ${money(G.PMC.upk)}/${t_('тис. на міс.')}</div>`;
  const mine = S.pmc.filter(p => p.co === c.id && !p.end);
  h += `<div class="grp">🛡 ${t_('Ваші контракти')} (${mine.length})</div>`;
  if (!mine.length) h += `<div class="small mut">${t_('Активних контрактів немає.')}</div>`;
  mine.forEach(p => { const a = G.armies.find(x => x.id === p.army); h += `<div class="card"><div class="row"><b>${ndot(p.buyer)}${esc(nat(p.buyer).name)}</b><span class="mut">${t_('проти')} ${ndot(p.enemy)}${esc(nat(p.enemy).name)}</span></div>
    ${a ? `<div class="row"><span>${esc(a.name)}</span><b>${people(a.k)}</b></div><div class="small mut">${esc(regName(a.t))} · ${t_('орг.')} ${pct(a.org, 0)} · ${a.stance === 'attack' ? '➤' : '🛡'}${(G.battles || []).includes(a.t) ? ' · ⚔ ' + t_('бій') : ''}</div>` : ''}
    <div class="row"><span>${t_('Оплата')}</span><span>${money(p.pay * (a ? a.k : p.k0))}/${t_('міс.')} · ${t_('лишилось')} ${p.left} ${t_('міс.')}</span></div><div class="row"><span>${t_('Зароблено')}</span><b>${money(p.got)}</b></div><div class="small mut">${t_('Регіонів звільнено')}: ${p.regs}</div>
    <div class="btns">${a ? s2B('🗺', `s2Show(${a.id})`, '') : ''}${s2B(p.handed ? '🎮 ' + t_('Командувати самому') : '🤝 ' + t_('Передати замовнику'), `s2Res(G.act.pmcAuto(${p.id},${!p.handed}))`, '')}${s2B('✖ ' + t_('Відкликати'), `s2Res(G.act.pmcRecall(${p.id}))`, '', 0, 'Неустойка й відносини −8')}</div></div>`; });
  h += `<div class="grp">📑 ${t_('Пропозиції')} (${S.offers.length})</div>`;
  if (!S.offers.length) h += `<div class="small mut">${t_('Зараз ніхто не наймає. Пропозиції зʼявляються щомісяця під час воєн.')}</div>`;
  S.offers.forEach(o => { const e = G.pmcErr(c, o); h += `<div class="card small"><div class="row"><b>${ndot(o.buyer)}${esc(nat(o.buyer).name)}</b><span class="mut">${t_('проти')} ${ndot(o.enemy)}${esc(nat(o.enemy).name)}</span></div>
    <div class="row"><span>${o.k} ${t_('тис. бійців')} · ${o.months} ${t_('міс.')}</span><span>${money(o.pay * o.k)}/${t_('міс.')}</span></div><div class="row"><span>${t_('Бонус за регіон')}</span><span>${money(o.bonus)}</span></div><div class="row"><span>${t_('Набір і оснащення')}</span><span>${money(o.k * G.PMC.raise)}</span></div>
    <div class="small mut">${t_('Пропозиція діє до')} ${G.dateStr(o.close)}</div>${s2B('✍ ' + t_('Підписати контракт'), `s2Res(G.act.pmcTake(${o.id}))`, e, 1)}</div>`; });
  const ai = S.pmc.filter(p => p.co !== c.id && !p.end); if (ai.length) h += `<div class="grp">🌐 ${t_('Конкуренти на фронтах')}</div>` + ai.slice(0, 8).map(p => `<div class="row small"><span>${esc(G.companies[p.co].name)}</span><span>${ndot(p.buyer)}${esc(nat(p.buyer).name)}</span></div>`).join('');
  return h;
}
function s2Mines(c) {
  const S = G.s2(), RS = G.secRes(c.sector); const RI = G.D.resources || LORA.data.resources; const rn = r => (RI[r] ? RI[r].ic + ' ' + t_(RI[r].n) : r);
  let h = `<div class="card small">${t_('Шлях до шахти: геологорозвідка (тижні) → аукціон за ліцензію проти інших компаній → будівництво → видобуток. Запаси скінченні; форсований режим дає більше, але виснажує родовище й частіше призводить до аварій. Там, де немає гравця, родовища розробляють ШІ-компанії.')}</div>`;
  const sv = S.surv.filter(v => v.co === c.id); if (sv.length) h += `<div class="grp">🔍 ${t_('Розвідка триває')}</div>` + sv.map(v => `<div class="row small"><span>${esc(regName(v.t))}</span><span>${Math.max(0, v.done - G.day)} ${t_('дн.')}</span></div>${s2bar((G.day - v.d0) / Math.max(1, v.done - v.d0), '#5aa7d8')}`).join('');
  // діючі шахти
  const ex = c.assets.filter(a => G.extOf(a.type)); h += `<div class="grp">⛏ ${t_('Ваші промисли')} (${ex.length})</div>`;
  ex.forEach(a => { const r = G.extOf(a.type), d = G.dep(a.t, r), m = G.mineModeOf(c, a), halt = G.mineHalt(c, a); const left = d ? d.R / d.R0 : 1;
    h += `<div class="card small"><div class="row"><b>${G.D.buildings[a.type].ic} ${esc(t_(G.D.buildings[a.type].n))} ${a.lvl > 1 ? '×' + a.lvl : ''}</b><span>${esc(regName(a.t))}</span></div>
      <div class="row"><span>${t_('Запаси')}</span><span>${Math.round(left * 100)}%${d ? ' · ' + t_('якість') + ' ' + Math.round(d.q * 100) + '%' : ''}</span></div>${s2bar(left, left < 0.2 ? '#ff6a5a' : '#c9a24a')}
      ${halt ? `<div class="r">💥 ${t_('Простій після аварії до')} ${G.dateStr(halt)}</div>` : d && d.R <= 0 ? `<div class="r">${t_('Родовище виснажене')}</div>` : ''}
      <div class="btns">${[[0.5, '🐢 ' + t_('Щадний')], [1, '⚙ ' + t_('Нормальний')], [1.5, '🔥 ' + t_('Форсований')]].map(([v, l]) => s2B(l, `s2Res(G.act.mineMode(${a.t},'${a.type}',${v}))`, m === v ? 'вже' : '', 0)).join('')}</div></div>`; });
  c.pend.filter(p => G.extOf(p.type)).forEach(p => { h += `<div class="row small"><span>🏗 ${esc(t_(G.D.buildings[p.type].n))} — ${esc(regName(p.t))}</span><span>${Math.max(0, p.done - G.day)} ${t_('дн.')}</span></div>`; });
  // регіони з покладами в країнах, де є офіси
  const hosts = [...new Set(c.offices.map(o => o.n))]; const regs = []; hosts.forEach(n => G.ter.forEach(t => { if (t.owner === n && RS.some(r => G.hasGeo(t.i, r))) regs.push(t.i); }));
  regs.sort((x, y) => (G.ter[x].ctrl === G.ter[x].owner ? 0 : 1) - (G.ter[y].ctrl === G.ter[y].owner ? 0 : 1) || (G.ter[y].gdp - G.ter[x].gdp));
  h += `<div class="grp">🗺 ${t_('Поклади в країнах ваших офісів')} (${regs.length})</div>`;
  if (!regs.length) h += `<div class="small mut">${t_('Відкрийте офіси в країнах із корисними копалинами (вкладка «Компанія» → Офіси).')}</div>`;
  regs.slice(0, 40).forEach(i => { const host = G.ter[i].owner; const surv = S.surv.some(v => v.co === c.id && v.t === i); let rows = '';
    RS.filter(r => G.hasGeo(i, r)).forEach(r => { const d = G.dep(i, r); const known = d && d.f[c.id]; const lic = d && d.lic >= 0 && d.till > G.day ? d.lic : -1; const ty = G.typeOfRes(r); const built = c.assets.some(a => a.t === i && a.type === ty) || c.pend.some(p => p.t === i && p.type === ty);
      const out = Object.values(G.D.buildings[ty].out)[0] || 1; let act = '';
      if (!known) act = `<span class="mut">${t_('не розвідано')}</span>`;
      else if (lic === c.id) act = built ? `<span class="g">✔ ${t_('працює')}</span>` : s2B('🏗 ' + t_('Будувати'), `s2Res(G.act.mineBuild(${i},'${r}'))`, G.coCanBuild(c, i, ty), 1);
      else if (lic >= 0) act = `<span class="mut">${t_('ліцензія')}: ${esc(G.companies[lic].name)}</span>`;
      else { const b = G.licBase(i, r); act = [1, 1.3, 1.7].map(k => s2B(`⚖ ${money(b * k)}`, `s2Res(G.act.mineLicense(${i},'${r}',${(b * k).toFixed(6)}))`, G.licErr(c, i, r, b * k), k === 1.3, 'Ставка на аукціоні: що вища — то менше шансів у конкурентів')).join(''); }
      rows += `<div class="row small"><span>${rn(r)}${known ? ` · ${Math.round(d.R / out)} ${t_('р.')} · ${Math.round(d.q * 100)}%` : ''}</span><span>${act}</span></div>`; });
    h += `<div class="card small"><div class="row"><b>${ndot(host)}${esc(regName(i))}</b>${s2B('🔍 ' + t_('Розвідка') + ' ' + money(G.survCost(i)), `s2Res(G.act.mineSurvey(${i}))`, surv ? 'Розвідка тут уже йде' : G.survErr(c, i), 0)}</div>${rows}</div>`; });
  return h;
}
function s2Routes(c) {
  const S = G.s2(); let h = `<div class="card small">${t_('Прокладіть маршрут між двома регіонами й купіть транспорт — машини, потяги чи судна поїдуть мапою. Дохід — з кожного рейсу; шлях обходить війни, а біля фронту транспорт можуть знищити.')}</div>`;
  h += `<div class="grp">➕ ${t_('Новий маршрут')}</div><div class="card small"><div class="btns">${Object.entries(G.VEH).map(([k, V]) => `<button class="small ${s2R.m === k ? 'on' : ''}" data-tip="${esc(t_(V.d))} · ${money(V.cost)}" onclick="s2R.m='${k}';renderTab(true)">${V.ic} ${t_(V.n)}</button>`).join('')}</div>
    <div class="row"><span>${t_('Звідки')}</span><b>${s2R.a >= 0 ? esc(regName(s2R.a)) : '—'}</b></div><div class="row"><span>${t_('Куди')}</span><b>${s2R.b >= 0 ? esc(regName(s2R.b)) : '—'}</b></div>
    <div class="btns"><button class="small ${s2Pick ? 'on' : 'pri'}" onclick="s2Pick='a';hint('📍 ${t_('Клацніть на мапі пункт відправлення')}',5000);renderTab(true)">🗺 ${t_('Обрати на мапі')}</button>${s2Pick ? `<button class="small" onclick="s2Pick=null;hint('');renderTab(true)">✖</button>` : ''}</div>`;
  if (s2R.a >= 0 && s2R.b >= 0) { const q = G.routeQuote(s2R.a, s2R.b, s2R.m); const V = G.VEH[s2R.m];
    if (!q.ok) h += `<div class="r small">⚠ ${esc(t_(q.err))}</div>`;
    else { h += `<div class="row small"><span>${t_('Відстань')}</span><span>${q.km} ${t_('км')} · ${q.days} ${t_('дн. в один бік')}</span></div><div class="row small"><span>${t_('Прибуток з одиниці')}</span><span>${money(q.profitTrip)}/${t_('рейс')} · ≈${money(q.monthly)}/${t_('міс.')}</span></div>
      <div class="row small"><span>${t_('Кількість')}</span><span><input type="number" min="1" max="${V.max}" value="${s2R.n}" style="width:60px" oninput="s2R.n=Math.max(1,Math.min(${V.max},+this.value||1))"> × ${money(V.cost)}</span></div>
      ${s2B('🚀 ' + t_('Відкрити маршрут') + ' · ' + money(V.cost * s2R.n), `s2Res(G.act.routeNew(${s2R.a},${s2R.b},'${s2R.m}',s2R.n))`, G.routeErr(c, s2R.a, s2R.b, s2R.m, s2R.n), 1)}`; } }
  h += `</div>`;
  const mine = S.routes.filter(r => r.co === c.id); h += `<div class="grp">🚚 ${t_('Ваші маршрути')} (${mine.length})</div>`;
  if (!mine.length) h += `<div class="small mut">${t_('Маршрутів ще немає.')}</div>`;
  mine.forEach(r => { const V = G.VEH[r.m]; const moving = r.u.filter(u => u >= 0).length;
    h += `<div class="card small"><div class="row"><b>${V.ic} ${esc(regName(r.a))} ⇄ ${esc(regName(r.b))}</b><span>${r.km} ${t_('км')}</span></div>
      <div class="row"><span>${t_('Транспорт')}</span><span>${r.u.length} (${t_('в дорозі')} ${moving})${r.lost ? ' · ' + t_('втрачено') + ' ' + r.lost : ''}</span></div><div class="row"><span>${t_('Рейсів')}</span><span>${r.trips}</span></div><div class="row"><span>${t_('Зароблено')}</span><b class="${r.earn < 0 ? 'r' : 'g'}">${money(r.earn)}</b></div>
      ${r.st ? `<div class="r">🚧 ${esc(t_(r.st))}</div>` : ''}<div class="btns">${s2B('🗺', `focusReg(${r.a})`, '')}${s2B('+1', `s2Res(G.act.routeAdd(${r.id},1))`, r.u.length >= V.max ? 'Максимум' : c.cash < V.cost ? 'Бракує коштів' : '')}${s2B('+5', `s2Res(G.act.routeAdd(${r.id},5))`, r.u.length + 5 > V.max ? 'Максимум' : c.cash < V.cost * 5 ? 'Бракує коштів' : '')}${s2B('−1', `s2Res(G.act.routeAdd(${r.id},-1))`, r.u.length <= 1 ? 'Остання одиниця' : '')}${s2B('✖ ' + t_('Закрити'), `s2Res(G.act.routeClose(${r.id}))`, '')}</div></div>`; });
  const ai = S.routes.filter(r => r.co !== c.id); if (ai.length) h += `<div class="small mut">🌐 ${t_('Маршрутів конкурентів у світі')}: ${ai.length}</div>`;
  return h;
}

// ---------------- ПАНЕЛЬ АРМІЇ: власний підрозділ / ПВК ----------------
{ const base = window.armyPanel; if (base) window.armyPanel = function () { const h = base.apply(this, arguments); const a = G.armies.find(x => x.id === sel.id); if (!a || !G.canCmd || !G.canCmd(a) || a.n === G.player) return h;
  return h + `<div class="card small" style="border-color:#ffb000"><b>🎖 ${a.pmc != null ? t_('Ваш загін ПВК') : t_('Ваш підрозділ')}</b><div class="small mut">${t_('ПКМ по регіону на мапі — рух (Shift — морем)')}</div><div class="btns">${s2B('➤ ' + t_('Наступ'), `s2Res(G.act.unitStance(${a.id},'attack'))`, a.stance === 'attack' ? 'вже' : '')}${s2B('🛡 ' + t_('Оборона'), `s2Res(G.act.unitStance(${a.id},'hold'))`, a.stance !== 'attack' ? 'вже' : '')}</div></div>`; }; }

// ---------------- МАПА: транспорт, шахти, розвідка ----------------
function drawStage2(sh) {
  if (!G || !G.s2) return; const S = G.s2(); const myCo = G.pc; const zoom = view.s; const frac = typeof speedIdx !== 'undefined' && speedIdx ? (typeof tAcc !== 'undefined' ? tAcc : 0) : 0;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  S.routes.forEach(r => { const mine = r.co === myCo; if (!mine && zoom < 5) return; const X = G.routePts(r); const V = G.VEH[r.m];
    ctx.beginPath(); X.P.forEach((p, k) => { const [x, y] = toScreen(p[0] + sh, p[1]); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.strokeStyle = mine ? (r.st ? 'rgba(255,90,90,0.8)' : 'rgba(255,190,60,0.75)') : 'rgba(200,200,200,0.35)'; ctx.lineWidth = mine ? 2 : 1; ctx.setLineDash(r.m === 'ship' ? [6, 5] : r.m === 'rail' ? [2, 3] : []); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = (mine ? 15 : 11) + 'px system-ui'; const step = 1 / Math.max(1, r.days);
    r.u.forEach(u => { const uu = u >= 0 ? Math.min(u + step * frac, 2) : u; const p = G.routePos(r, uu); const [x, y] = toScreen(p[0] + sh, p[1]); if (x < -20 || x > innerWidth + 20 || y < -20 || y > innerHeight + 20) return; const sz = mine ? 15 : 11; if (mine) { ctx.fillStyle = r.st ? '#7a1d1dcc' : '#00000088'; ctx.beginPath(); ctx.arc(x, y, sz * 0.62, 0, 7); ctx.fill(); } drawEmo(V.ic, x, y, sz); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; });
  });
  if (myCo >= 0 && zoom >= 2.5) { ctx.font = '14px system-ui';
    Object.entries(S.dep).forEach(([k, d]) => { if (d.lic !== myCo || d.till <= G.day) return; const i = +k.split(':')[0]; const c = D.regions[i].c; const [x, y] = toScreen(c[0] + sh, c[1]); ctx.globalAlpha = d.R > 0 ? 1 : 0.4; drawEmo('⛏', x - 14, y + 12 + Math.sin(animT * 5 + i) * 1.5, 15); ctx.globalAlpha = 1; });
    S.surv.forEach(v => { if (v.co !== myCo) return; const c = D.regions[v.t].c; const [x, y] = toScreen(c[0] + sh, c[1]); ctx.globalAlpha = 0.55 + 0.45 * Math.sin(animT * 4); drawEmo('🔍', x + 14, y + 12, 15); ctx.globalAlpha = 1; }); }
  // мітка «ви тут» для персонажа на фронті
  const L = G.leader; const fa = L && G.frontArmy && G.frontArmy(L); if (fa) { const c = D.regions[fa.t].c; const [x, y] = toScreen(c[0] + sh, c[1]); drawEmo('🪖', x - 26, y - 10 + Math.sin(animT * 3) * 2, 18); }
  ctx.restore();
}
