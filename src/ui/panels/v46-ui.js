// v4.6 UI: нижня панель розділів (док) + бічна колонка вкладок розділу, пошук; категорії професій і справ;
// виробничі лінії, план, військо компанії, команда й ринок (рейтинг, персонал, конкуренти), позики між гравцями.
function v46r(r) { s2Res(r); if (window.renderTop) renderTop(); }
// ---------- розділи (перегруповано: 5 розділів) ----------
RAIL_G.splice(0, RAIL_G.length,
  ['me', '🧑', 'Персонаж', ['char', 'lead', 'city', 'life', 'family', 'skills', 'party']],
  ['work', '💼', 'Робота', ['career', 'ops', 'front', 'post', 'biz']],
  ['co', '🏢', 'Бізнес', ['co', 'coops', 'coprod', 'comkt', 'coarmy', 'cotrade', 'cotend', 'cord', 'cores', 'cobuild', 'codipl', 'cofin', 'coopp']],
  ['st', '🏛', 'Держава', ['state', 'op', 'econ', 'logi', 'army', 'build', 'tech', 'colony', 'planet', 'intel', 'spy', 'mins', 'staff']],
  ['wd', '🌐', 'Світ', ['dipl', 'un', 'world', 'deals']]);
// мала справа: «Виробництво» тепер є (свої лінії); корпорація (після перетворення) бачить усе
SMALL_HIDE.splice(0, SMALL_HIDE.length, 'cotrade', 'cotend', 'cord', 'cobuild');
railList = function () { const c = G.pc >= 0 && G.myCo(); const seen = new Set(); return curTabs().filter(([k]) => { if (seen.has(k)) return false; seen.add(k); return !(c && c.bizType && !c.corp && SMALL_HIDE.includes(k)); }); };
{ const b = window.coSec; window.coSec = c => c && c.corp ? Object.assign({}, b(c), { assets: (D.companySectors[c.sector] || { assets: [] }).assets }) : b(c); }
{ const base = window.curTabs; window.curTabs = function () { const r = base.apply(this, arguments); const c = G && G.pc >= 0 && G.myCo(); if (!c) return r; const at = k => r.findIndex(x => x[0] === k);
  if (c.bizType && at('comkt') < 0) { const i = Math.max(at('coops'), at('co')); r.splice(i + 1, 0, ['comkt', '👥 Команда й ринок']); }
  if ((c.sector === 'military' || ['vpk', 'pmc', 'sec'].includes(c.bizType)) && at('coarmy') < 0) { const i = Math.max(at('coprod'), at('co')); r.splice(i + 1, 0, ['coarmy', '🪖 Військо']); }
  return r; }; }
Object.assign(TIPS_TAB, { comkt: 'Рейтинг ★, персонал, конкуренти, події міста й сезонна пропозиція', coarmy: 'Власне військо компанії: набір загонів, спорядження зі складу, контракт із державою', career: 'Професії за категоріями: держслужба, торгівля й туризм, виробництво й ВПК, інше' });

// ---------- нижня панель (док) + бічна колонка вкладок ----------
let dkQ = '';
{ const base = window.renderTabs; window.renderTabs = function () { base.apply(this, arguments); const el = document.getElementById('tabs'); if (!el || !G) return;
  const list = railList(); const btn = ([k, v]) => `<button class="${tab === k ? 'on' : ''}" data-k="${k}" onclick="railClick('${k}')">${tabLabel(k, v)}</button>`;
  const role = G.mpRole && ROLE_TABS[G.mpRole]; const groups = role ? [] : RAIL_G.map(g => [g, list.filter(([k]) => railGOf(k) === g[0])]).filter(([, l]) => l.length);
  if (list.some(([k]) => k === tab)) { railSec = railGOf(tab); RSEC_LAST[railSec] = tab; }
  if (groups.length && !groups.some(([g]) => g[0] === railSec)) railSec = groups[0][0][0];
  const cur = groups.find(([g]) => g[0] === railSec); el.className = 'v46';
  el.innerHTML = cur ? `<div class="rt-h">${cur[0][1]} ${esc(t_(cur[0][2]))}</div>${cur[1].map(btn).join('')}` : list.map(btn).join('');
  let dk = document.getElementById('dock'); if (!dk) { dk = document.createElement('div'); dk.id = 'dock'; (document.getElementById('app') || document.body).appendChild(dk);
    dk.innerHTML = `<div class="dk-secs"></div><div class="dk-s"><input id="dkIn" placeholder="🔍 ${esc(t_('Пошук: вкладка, місце в місті…'))}" autocomplete="off" oninput="dkQ=this.value;dkFind()" onfocus="dkFind()" onkeydown="if(event.key==='Enter'){const b=document.querySelector('#dkRes [data-i]');if(b)b.click();}if(event.key==='Escape'){this.value='';dkQ='';dkFind();this.blur()}"><div id="dkRes"></div></div>`; }
  const open = !document.getElementById('left').classList.contains('hide');
  dk.querySelector('.dk-secs').innerHTML = groups.map(([g, l]) => `<div class="dk-b ${g[0] === railSec && open ? 'on' : ''}" onclick="railSecClick('${g[0]}')" data-tip="${esc(l.map(x => t_(x[1]).replace(/^[^\p{L}]+/u, '')).join(' · '))}"><b>${g[1]}</b><span>${esc(t_(g[2]))}</span><i>${l.length}</i></div>`).join('')
    + (role ? `<div class="dk-b on"><b>👥</b><span>${esc(t_('Ваша роль'))}</span></div>` : ''); }; }
function dkFind() { const r = document.getElementById('dkRes'); if (!r) return; const q = (dkQ || '').trim().toLowerCase(); if (q.length < 2) { r.innerHTML = ''; r.style.display = 'none'; return; }
  const res = []; railList().forEach(([k, v]) => { const n = t_(v).replace(/^[^\p{L}]+/u, ''); const g = RAIL_G.find(x => x[0] === railGOf(k)); if (n.toLowerCase().includes(q) || (TIPS_TAB[k] && t_(TIPS_TAB[k]).toLowerCase().includes(q))) res.push([`${g ? g[1] : ''} ${n}`, `dkGo('${k}')`, g ? t_(g[2]) : '']); });
  if (G.leader && G.leader.role === 'char' && G.LOCS && G.LOCS.city) for (const [k, P] of Object.entries(G.LOCS.city.places)) { const n = t_(P.n); const acts = Object.values(P.acts || {}).filter(A => !A.hide || !A.hide(G.leader)).map(A => t_(A.n)); const hit = n.toLowerCase().includes(q) ? n : acts.find(a => a.toLowerCase().includes(q));
    if (hit) res.push([`${P.ic} ${n}${hit !== n ? ' — ' + hit.replace(/^[^\p{L}]+/u, '') : ''}`, `dkCity('${k}')`, t_('Місто')]); }
  if (G.JOBS) for (const [k, J] of Object.entries(G.JOBS)) if (t_(J.n).toLowerCase().includes(q)) res.push([`${J.ic} ${t_(J.n)}`, `dkGo('career')`, t_('Професія')]);
  r.style.display = 'block'; r.innerHTML = res.slice(0, 12).map((x, i) => `<div data-i="${i}" onclick="${x[1]}"><span>${esc(x[0])}</span><i>${esc(x[2])}</i></div>`).join('') || `<div class="mut">${t_('Нічого не знайдено')}</div>`; }
function dkGo(k) { tab = k; $('#left').classList.remove('hide'); dkQ = ''; const i = document.getElementById('dkIn'); if (i) { i.value = ''; i.blur(); } dkFind(); renderTabs(); renderTab(true); }
function dkCity(k) { dkQ = ''; const i = document.getElementById('dkIn'); if (i) { i.value = ''; i.blur(); } dkFind(); try { openLoc('city'); setTimeout(() => { try { cityGo(k); } catch (e) { } }, 50); } catch (e) { dkGo('city'); } }
document.addEventListener('mousedown', e => { const r = document.getElementById('dkRes'); if (r && !e.target.closest('.dk-s')) { r.style.display = 'none'; } });
document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { const i = document.getElementById('dkIn'); if (i) { e.preventDefault(); i.focus(); } } });

// ---------- професії за категоріями ----------
{ const base = TAB_FN.career; TAB_FN.career = function () { let h = base.apply(this, arguments); if (!h || !G.JOB_CAT) return h; const i = h.indexOf("carDo('job'"); if (i < 0) return h; const a = h.lastIndexOf('<div class="btns">', i); const e = h.indexOf('</div>', i); if (a < 0 || e < 0) return h;
  const L = G.leader; const btn = k => { const J = G.JOBS[k]; if (!J) return ''; const e2 = G.careerCan('job', k); const on = L.job && L.job.k === k; return `<button class="small ${on ? 'on' : ''}" ${e2 ? 'disabled' : ''} data-tip="${esc(t_(J.d))}${e2 ? ' — ' + esc(t_(e2)) : ''} · ${t_('від')} $${J.ranks[0][2]}/${t_('міс.')}" onclick="carDo('job','${k}')">${J.ic} ${esc(t_(J.n))}</button>`; };
  const g = G.JOB_CAT.map(([ck, ic, n, ks]) => `<div class="jc"><div class="jc-h">${ic} ${esc(t_(n))}</div><div class="btns">${ks.map(btn).join('')}</div>${ck === 'gov' ? `<div class="small mut">${t_('Платить держава; ведуть до державних посад (міністерства, суди, генштаб).')} <a href="#" onclick="dkGo('post');return false">${t_('Державні посади')} →</a></div>` : ''}</div>`).join('');
  return h.slice(0, a) + g + h.slice(e + 6); }; }

// ---------- вибір типу своєї справи ----------
let bizSel = null;
{ const base = TAB_FN.biz; TAB_FN.biz = function () { const L = G && G.leader; if (!L || L.biz || !G.BIZ_CAT) return base.apply(this, arguments);
  const def = L.job && G.JOB_BIZT[L.job.k]; if (!bizSel || !G.BIZT[bizSel]) bizSel = def || 'rest'; const B = G.BIZT[bizSel]; const e = G.bizErr(L);
  let h = `<div class="card small">${t_('Оберіть, чим займатиметься справа. Профіль вашої професії позначено ⭐ — там легше з ліцензією. Далі кроки: фонд від $50 тис., план, допомога, офіс і виробництво, ліцензія, команда.')}</div>`;
  h += G.BIZ_CAT.map(([ck, ic, n, ks]) => `<div class="jc"><div class="jc-h">${ic} ${esc(t_(n))}</div><div class="btns">${ks.filter(k => G.BIZT[k]).map(k => `<button class="small ${k === bizSel ? 'on' : ''}" onclick="bizSel='${k}';renderTab(true)">${k === def ? '⭐ ' : ''}${G.BIZT[k].units[0][2]} ${esc(t_(G.BIZT[k].n))}</button>`).join('')}</div></div>`).join('');
  const gs = (G.BGOODS[bizSel] || []);
  h += `<div class="card"><b>🚀 ${esc(t_(B.n))}</b><div class="small mut">${t_('Заклади')}: ${B.units.map(u => u[2] + ' ' + t_(u[1])).join(', ')}</div>${gs.length ? `<div class="small mut">${t_('Виробництво')}: ${gs.map(g => g.ic + ' ' + t_(g.n)).join(', ')}</div>` : ''}
    <div class="small mut">${t_('Ліцензія потребує навички')}: ${esc(t_((G.SKILLS[B.sk] || {}).n || ''))} 2+${['vpk', 'pmc', 'sec'].includes(bizSel) ? ' · 🪖 ' + t_('можна мати власне військо') : ''}</div>
    <div class="btns">${s2B('🚀 ' + t_('Почати справу'), `v46r(G.act.bizStart('${bizSel}'))`, e, 1)}</div></div>`;
  return h; }; }

// ---------- виробництво малої справи + план корпорації ----------
function bprodHtml(c) { const gs = G.bgoods(c); if (!gs.length) return ''; let h = `<div class="grp">🏭 ${t_('Виробничі лінії')}</div><div class="mut small">${t_('Щомісяця заклади виробляють товар: собівартість списується одразу, товар продається автоматично (ціна залежить від рейтингу й подій міста) або йде на склад. Понаднормовий план (150%) — собівартість +25%.')}</div>`;
  h += gs.map(g => { const rate = G.bgoodRate(c, g); const pl = (c.bplan || {})[g.k] ?? 1; const pr = G.bgoodPrice(g), cs = G.bgoodCost(g); const st = g.mil ? (c.inv || {})[g.k] || 0 : (c.binv || {})[g.k] || 0; const unitN = g.unit === '*' ? t_('усі заклади') : ((G.BIZT[c.bizType].units.find(u => u[0] === g.unit) || [0, '?', ''])[2] + ' ' + t_((G.BIZT[c.bizType].units.find(u => u[0] === g.unit) || [0, '?'])[1]));
    return `<div class="card small ${rate > 0 ? '' : 'soon'}"><div class="row"><b>${g.ic} ${esc(t_(g.n))}</b><span>${t_('склад')}: <b>${st.toFixed(g.q < 1 ? 3 : 0)}</b> ${esc(t_(g.u))}</span></div>
      <div class="row"><span class="mut">${esc(unitN)} · ${rate.toFixed(g.q < 1 ? 3 : 0)} ${esc(t_(g.u))}/${t_('міс.')} · ${t_('собівартість')} $${cs.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} · ${t_('ціна')} $${pr.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}</span></div>
      <div class="btns">${[0, 0.5, 1, 1.5].map(v => `<button class="small ${pl === v ? 'on' : ''}" onclick="v46r(G.act.bplanSet('${g.k}',${v}))">${Math.round(v * 100)}%</button>`).join('')}
      ${g.mil ? s2B('🏛 ' + t_('Продати державі'), `v46r(G.act.bsellMil('${g.k}'))`, st > 0 ? '' : 'Склад порожній') : `<label class="small"><input type="checkbox" ${(c.bkeep || {})[g.k] ? 'checked' : ''} onchange="v46r(G.act.bkeepSet('${g.k}',this.checked))"> ${t_('на склад')}</label>${st > 0 ? s2B(t_('Продати склад'), `v46r(G.act.bsell('${g.k}'))`, '') : ''}`}</div></div>`; }).join('');
  if (c.bprodNet != null) h += `<div class="small mut">${t_('Виробництво минулого місяця')}: <b class="${c.bprodNet >= 0 ? 'g' : 'r'}">${money(c.bprodNet)}</b>${gs.some(g => g.mil) ? ' · ' + t_('військовий товар іде на склад: продайте державі або озбройте власне військо (вкладка «Військо»)') : ''}</div>`;
  return h; }
function pmodeHtml(c) { const m = c.pmode || 'std'; return `<div class="grp">📋 ${t_('Виробничий план')}</div><div class="btns">${Object.entries(G.PMODE).map(([k, P]) => `<button class="small ${m === k ? 'on' : ''}" data-tip="${t_('випуск')} ×${P[1]} · ${t_('сировина')} ×${P[2]} · ${t_('собівартість')} ×${P[3]}" onclick="v46r(G.act.pmodeSet('${k}'))">${esc(t_(P[0]))}</button>`).join('')}</div>
  <div class="small mut">${t_('Економний — менше випуску, але дешевше; Максимум — понаднормово: +20% продукції, сировина й собівартість дорожчі.')}</div>`; }
function corpLinesHtml(c) { const f = G.corpResFlow(c); const RI = D.resources; const rs = Object.keys(f.out); if (!rs.length) return ''; let tot = 0;
  const rows = rs.map(r => { const v = (f.out[r] || 0) * (G.prices[r] || 0) * 12; tot += v; return `<tr><td>${ico(RI[r].ic)} ${esc(t_(RI[r].n))}</td><td class="g">+${(f.out[r] || 0).toFixed(3)}</td><td class="r">${f.inn[r] ? '−' + f.inn[r].toFixed(3) : ''}</td><td>${(c.res[r] || 0).toFixed(3)}</td><td>${money(v)}</td></tr>`; }).join('');
  return `<div class="grp">🏭 ${t_('Виробничі лінії сектору')}</div><table class="small"><tr><th>${t_('Продукт')}</th><th>+/${t_('міс.')}</th><th>${t_('сировина')}</th><th>${t_('склад')}</th><th>${t_('вартість/рік')}</th></tr>${rows}</table><div class="small mut">${t_('Разом за ринковими цінами')}: <b>${money(tot)}/${t_('рік')}</b>. ${t_('Продаж і автопродаж — у вкладці «Ресурси».')}</div>`; }
{ const base = TAB_FN.coprod; TAB_FN.coprod = function () { const c = G.myCo(); if (!c) return base(); if (c.bizType && !c.corp) return bprodHtml(c) || `<div class="mut">${t_('Ваш тип справи не має виробничих ліній.')}</div>`;
  let h = pmodeHtml(c) + base(); if (c.sector !== 'military' && c.sector !== 'tech') h += corpLinesHtml(c); if (c.bizType) h += bprodHtml(c); return h; }; }

// ---------- військо компанії ----------
let armyK = 1;
TAB_FN.coarmy = function () { const c = G.myCo(); if (!c) return ''; const as = G.coArmies(c); const q = G.coArmyQuote(c, armyK); const e = G.coArmyErr(c, armyK);
  let h = `<div class="card small">${t_('Компанія може тримати власне військо: набір і навчання — гроші, спорядження (бронетехніка, снаряди, FPV-дрони) — зі складу компанії. Загоном командуєте на мапі (оберіть і ПКМ по регіону) або передаєте армії держави — тоді, поки країна воює, держава платить 140% утримання.')}</div>`;
  h += `<div class="grp">➕ ${t_('Сформувати загін')}</div><div class="btns">${[1, 2, 5, 10].map(k => `<button class="small ${armyK === k ? 'on' : ''}" onclick="armyK=${k};renderTab(true)">${k} ${t_('тис.')}</button>`).join('')}</div>
    <div class="small">${t_('Набір')}: <b>${money(q.raise)}</b> · ${t_('спорядження зі складу')}: <b class="${q.eq > 0.7 ? 'g' : q.eq > 0.3 ? '' : 'r'}">${Math.round(q.eq * 100)}%</b> · ${t_('утримання')} ${money(armyK * 0.00035)}/${t_('міс.')}</div>
    <div class="small mut">${t_('На 1 тис. бійців')}: ${Object.entries(G.ARMY_KIT).map(([g, n]) => `${(G.CORP_GOODS[g] || {}).ic || ''} ${n} ${esc(t_((G.CORP_GOODS[g] || {}).u || ''))} (${t_('є')} ${((c.inv || {})[g] || 0).toFixed(2)})`).join(' · ')}</div>
    <div class="btns">${s2B('🪖 ' + t_('Сформувати'), `v46r(G.act.coArmyRaise(${armyK}))`, e, 1)}</div>`;
  if (as.length) { h += `<div class="grp">🪖 ${t_('Ваші загони')}</div>` + as.map(a => `<div class="card small"><div class="row"><b>${esc(a.name)}</b><span>${a.k.toFixed(1)} ${t_('тис.')} · ${t_('орг.')} ${Math.round(a.org * 100)}%</span></div><div class="row"><span class="mut">📍 ${esc(G.T[a.t].n)}</span><span>${s2B('🎯', `focusReg(${a.t})`, '', 0, 'Показати на мапі')}${s2B('✖ ' + t_('Розпустити'), `v46r(G.act.coArmyDisband(${a.id}))`, '')}</span></div></div>`).join('');
    h += `<label class="row small"><span>${t_('Передати загони армії держави (платить 140% утримання під час війни)')}</span><input type="checkbox" ${c.armyCtr ? 'checked' : ''} onchange="v46r(G.act.coArmyCtr(this.checked))"></label>`;
    h += `<div class="small mut">${t_('Утримання')}: ${money(c.armyUpk || 0)}/${t_('міс.')}${c.armyPay ? ` · ${t_('держава платить')} ${money(c.armyPay)}` : ''}</div>`; }
  if (c.sector === 'military' && !c.bizType) h += `<div class="small mut">${t_('Також можна брати контракти ПВК — у вкладці «Операції».')}</div>`;
  return h; };

// ---------- команда й ринок (рейтинг, персонал, конкуренти, події) ----------
TAB_FN.comkt = function () { const c = G.myCo(); if (!c || !c.bizType) return ''; const r = c.brate || 3; const tg = G.brateTarget(c);
  let h = `<div class="kpi"><div><b>${'★'.repeat(Math.round(r))}${'☆'.repeat(5 - Math.round(r))}</b><span>${t_('рейтинг')} ${r.toFixed(1)} → ${tg.toFixed(1)}</span></div><div><b>${Math.round((0.8 + r * 0.07 - 1) * 100)}%</b><span>${t_('до доходу')}</span></div></div>
    <div class="small mut">${t_('Рейтинг росте від розробок, досліджень, сильного персоналу й ваших візитів у заклад (місто → «Ваш заклад»); падає від інцидентів і поганих відгуків.')}</div>`;
  const ev = G.cityEvOf(c.home); if (ev) { const D2 = G.CITY_EV.find(x => x[0] === ev.k); h += `<div class="card small ${D2[4] > 0 ? 'g' : 'r'}">${D2[1]} ${esc(t_(D2[2]))} · ${t_('ще')} ${ev.until - G.day} ${t_('дн.')} · ${D2[3].includes(G.bizCat(c.bizType)) ? (D2[4] > 0 ? '+' : '') + Math.round(D2[4] * 100) + '% ' + t_('до вашого доходу') : t_('вашу справу не зачіпає')}</div>`; }
  const s = G.seasonAt((c.bunits[0] || {}).t ?? c.offices[0].t);
  h += `<div class="row small"><span>🍂 ${t_('Сезонна пропозиція')}: ${c.smenu === s ? '<b class="g">' + esc(t_(G.SEAS[s] || s)) + ' +6%</b>' : `<span class="mut">${t_('зараз')} ${esc(t_(G.SEAS[s] || s))}</span>`}</span>${c.smenu === s ? '' : s2B(t_('Запустити') + ' · $5 ' + t_('тис.'), 'v46r(G.act.smenuSet())', '')}</div>`;
  h += `<div class="grp">👥 ${t_('Персонал')}</div>`;
  for (const [role, [ic, n, d]] of Object.entries(G.STAFF_R)) { const x = (c.bstaff || {})[role]; const cand = (c.bcand || {})[role];
    h += `<div class="card small"><div class="row"><b>${ic} ${esc(t_(n))}</b>${x ? `<span>${esc(x.n)} · ${'●'.repeat(Math.round(x.sk))}${'○'.repeat(5 - Math.round(x.sk))} · $${x.sal}/${t_('міс.')}</span>` : `<span class="mut">${t_('вакансія')}</span>`}</div><div class="mut">${esc(t_(d))}</div>
      ${x ? `<div class="btns">${s2B(t_('Звільнити'), `v46r(G.act.staffFire('${role}'))`, '')}</div>` : cand ? cand.map((p, i) => `<div class="row"><span>${esc(p.n)} · ${t_('майстерність')} ${p.sk}/5 · $${p.sal}/${t_('міс.')}${role === 'acc' ? ' · ' + t_('репутація') + ' ' + (p.hon > 0.75 ? t_('бездоганна') : p.hon > 0.5 ? t_('нормальна') : t_('сумнівна')) : ''}</span>${s2B(t_('Найняти'), `v46r(G.act.staffHire('${role}',${i}))`, '')}</div>`).join('') : `<div class="btns">${s2B('🔎 ' + t_('Шукати кандидатів'), `v46r(G.act.staffCands('${role}'))`, '')}</div>`}</div>`; }
  if (c.bstaffSal) h += `<div class="small mut">${t_('Зарплати')}: $${c.bstaffSal.toLocaleString('uk-UA')}/${t_('міс.')}</div>`;
  h += `<div class="grp">⚔ ${t_('Конкуренти')}</div>`;
  const rv = c.rivals || []; h += rv.length ? rv.map(x => `<div class="card small"><div class="row"><b>«${esc(x.n)}» · ${esc(G.T[x.t].n)}</b><span>${t_('сила')} ${'■'.repeat(x.str)}</span></div><div class="mut">${t_('забирає')} ${Math.round(G.rivalShare(c, x.t) * 100)}% ${t_('доходу ваших закладів у цьому місті (разом з іншими)')}</div>
    <div class="btns">${s2B('🧲 ' + t_('Переманити людей') + ' · ' + money(8000 * x.str / 1e9), `v46r(G.act.rivalPoach(${x.id}))`, '', 0, '75% успіху; інакше скандал і −0.3 рейтингу')}${s2B('💼 ' + t_('Купити') + ' · ' + money(G.rivalBuyCost(x)), `v46r(G.act.rivalBuy(${x.id}))`, '')}</div></div>`).join('') : `<div class="mut small">${t_('Конкуренти зʼявляться з першим щомісячним звітом.')}</div>`;
  return h; };

// ---------- перетворення на корпорацію (у «Можливостях») ----------
{ const base = TAB_FN.coopp; TAB_FN.coopp = function () { let h = base(); const c = G.myCo(); if (!c || !c.bizType || c.corp) return h; const e = G.toCorpErr(c);
  return h + `<div class="grp">🏢 ${t_('Стати корпорацією')}</div><div class="small mut">${t_('Коли справа виросте (8+ закладів або $250 тис./міс.), її можна перетворити на корпорацію сектору: будівництво заводів і станцій, державні тендери, R&D, біржа ресурсів. Заклади працюють і далі.')}</div>
    <div class="btns">${s2B('🏢 ' + t_('Перетворити') + ' · ' + money(G.CORP_NEED.cash), 'v46r(G.act.toCorp())', e, 1)}</div>`; }; }

// ---------- позики між гравцями: картка угод ----------
let lnS = { amt: 10000, months: 6, rate: 3, lender: 'from' };
{ const base = TAB_FN.deals; TAB_FN.deals = function () { let h = base(); const me = G.curLk(); const ls = G.loansOf(me); const nm = lk => G.leaders[lk] ? G.leaders[lk].name : '?';
  if (ls.length) h += `<div class="grp">💰 ${t_('Позики')}</div>` + ls.map(l => `<div class="card small"><div class="row"><b>${l.lender === me ? t_('Ви позичили') + ' ' + esc(nm(l.borrower)) : t_('Ви винні') + ' ' + esc(nm(l.lender))}</b><span>${t_('лишилось')} ${money(l.left)}</span></div><div class="mut">${money(l.pay)}/${t_('міс.')} · ${l.rate}%/${t_('міс.')}${l.late ? ` · ⚠ ${t_('прострочено')} ${l.late}` : ''}</div>${l.borrower === me ? `<div class="btns">${s2B(t_('Погасити достроково'), `v46r(G.act.loanRepay(${l.id}))`, '')}</div>` : ''}</div>`).join('');
  if (typeof dS === 'object' && dS.kind === 'loan' && G.humanLks().filter(k => k !== me).length) h += `<div class="card small"><div class="row"><span>${t_('Сума, $')}</span><input type="number" style="width:110px" value="${lnS.amt}" oninput="lnS.amt=+this.value"></div>
    <div class="row"><span>${t_('Строк, міс.')}</span><input type="number" min="1" max="36" style="width:70px" value="${lnS.months}" oninput="lnS.months=+this.value"></div><div class="row"><span>${t_('Ставка, %/міс.')}</span><input type="number" min="0" max="20" step="0.5" style="width:70px" value="${lnS.rate}" oninput="lnS.rate=+this.value"></div>
    <div class="row"><span>${t_('Хто позичає')}</span><select onchange="lnS.lender=this.value"><option value="from" ${lnS.lender === 'from' ? 'selected' : ''}>${t_('я')}</option><option value="to" ${lnS.lender === 'to' ? 'selected' : ''}>${t_('інший гравець')}</option></select></div>
    <div class="mut">${t_('Платежі списуються щомісяця з особистих грошей, а якщо їх бракує — з компанії позичальника. Після 3 прострочок суд стягує борг із компанії.')}</div>
    ${s2B('📤 ' + t_('Запропонувати позику'), "v46r(G.act.dealNew('loan',dS.to,{amt:lnS.amt,months:lnS.months,lender:lnS.lender},lnS.rate))", '', 1)}</div>`;
  return h; }; }
