// ВКЛАДКА «ЛІДЕР» / «ПЕРСОНАЖ»: де зараз лідер, перельоти, візити; для режиму персонажа — зв'язки, популярність, дії, вибори.
const CHAR_TABS = [['char', '🧑 Персонаж'], ['world', '📊 Світ']];
const ldName = () => G.leader ? G.leader.name : '';
function ldWhere() { const L = G.leader; if (!L) return ''; if (L.mv) return `✈ ${t_('летить')}: ${esc(regName(L.mv.from))} → ${esc(regName(L.mv.to))} (${t_('приліт через')} ${Math.max(0, L.mv.arrive - G.day)} ${t_('дн.')})`;
  const nid = G.ter[L.at].ctrl; return `📍 ${esc(regName(L.at))}, ${ndot(nid)}${esc(nat(nid).name)}`; }
function ldGo(i) { const r = G.leaderGo(i); hint(r.ok ? `✈ ${ldName()}: ${t_('виліт')}, ${r.days} ${t_('дн.')}` : '⚠ ' + r.err, 3000); AUD.sfx(r.ok ? 'good' : 'bad'); renderTab(true); if (sel) renderRight(); }
function ldHome() { const L = G.leader; const h = G.player >= 0 ? (nat(G.player).home != null ? nat(G.player).home : L.at) : (G.myCo() ? G.myCo().offices.find(o => o.hq).t : L.at); ldGo(h); }
// блок у правій панелі регіону
function leaderRegionBlock(i) {
  const L = G.leader; if (!L) return ''; const t = G.ter[i], nid = t.ctrl, here = !L.mv && G.ter[L.at].ctrl === nid;
  let h = `<div class="grp">${pxi('star')} ${esc(ldName())}</div>`;
  if (here) h += `<div class="small g">${t_('Лідер перебуває в цій країні — можна домовлятися особисто.')}</div>`;
  else { const me = G.pv(); const war = nid !== me && G.atWar(me, nid);
    h += `<div class="small mut">${ldWhere()}</div>` + (war ? `<div class="small r">${t_('Ворожа держава — візит неможливий')}</div>` : `<div class="btns"><button class="pri" data-tip="${t_('Переговори, союзи, торговельні угоди й лобізм можливі лише під час особистого візиту')}" onclick="ldGo(${i})" ${L.mv ? 'disabled' : ''}>✈ ${t_('Летіти сюди')} (${G.travelTime(i)} ${t_('дн.')})</button></div>`); }
  if (L.role === 'char' && here) h += charActionsBlock();
  return h;
}
function charActionsBlock() {
  const L = G.leader, nid = G.leaderNation(); window._brk = window._brk != null && window._brk !== nid ? window._brk : null;
  const partners = Object.keys(L.cont).map(Number).filter(x => x !== nid && L.cont[x] >= 30);
  let h = `<div class="row small"><span>${t_('Зв\'язки')} / ${t_('популярність')}</span><b>${(L.cont[nid] || 0).toFixed(0)} / ${(L.popu[nid] || 0).toFixed(0)}</b></div>`;
  Object.entries(G.charActions).forEach(([k, a]) => { const err = G.charCan(k, k === 'broker' ? window._brk : null);
    h += `<div class="row small"><span data-tip="${esc(t_(a.d))}">${ico(a.ic)} ${esc(t_(a.n))}<br><span class="mut">${a.cost ? money(a.cost) + ' · ' : ''}${a.days ? a.days + ' ' + t_('дн.') : ''}</span></span><button onclick="charDo('${k}')" ${err ? `disabled data-tip="${esc(t_(err))}"` : ''}>▶</button></div>`;
    if (k === 'broker' && partners.length) h += `<div class="small"><select onchange="_brk=+this.value;renderRight()"><option value="">— ${t_('друга країна')} —</option>${partners.map(x => `<option value="${x}" ${window._brk === x ? 'selected' : ''}>${esc(nat(x).name)}</option>`).join('')}</select></div>`; });
  return h;
}
function charDo(k) { const r = G.act.charDo(k, k === 'broker' ? window._brk : null); hint(r.ok ? '✅ ' + r.msg : '⚠ ' + r.err, 3500); AUD.sfx(r.ok ? 'good' : 'bad'); renderTab(true); renderRight(); renderTop(); }
// вкладка
TAB_FN.lead = function () {
  const L = G.leader; if (!L) return '<div class="mut">—</div>';
  let h = `<div class="card"><div class="ava-row">${leaderAva(80)}<div class="ava-btns"><button class="small" onclick="rerollLeaderAva()" data-tip="${t_('Інший вигляд аватарки')}">🎲</button><button class="small" onclick="toggleLeaderFem()" data-tip="${t_('Чоловік / жінка')}">⚥</button></div></div><div class="row"><b>${pxi('star')} ${esc(ldName())}</b><span class="mut">${esc(t_(L.role === 'president' ? 'глава держави' : L.role === 'ceo' ? 'генеральний директор' : G.D.charTypes[L.type].n))}</span></div><div class="small">${ldWhere()}</div>
    <div class="btns"><button onclick="ldHome()" ${L.mv ? 'disabled' : ''}>🏠 ${t_('Додому')}</button><button onclick="focusReg(${L.mv ? L.mv.to : L.at})">🎯 ${t_('Показати на мапі')}</button></div></div>`;
  h += `<div class="mut small">${t_('Щоб домовлятися з країною — союзи, торговельні угоди, військовий доступ, покращення відносин, офіси й лобізм — лідер має особисто прилетіти туди. Клацніть регіон країни → «Летіти сюди». Офіційний візит раз на пів року дає +6 до відносин. Довга відсутність удома знижує стабільність.')}</div>`;
  const vis = Object.entries(L.lastVisit).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (vis.length) h += `<div class="grp">${t_('Останні візити')}</div>` + vis.map(([k, d]) => `<div class="row small"><span>${ndot(+k)}${esc(nat(+k).name)}</span><span>${G.dateStr(d)}</span></div>`).join('');
  return h;
};
TAB_FN.char = function () {
  const L = G.leader; if (!L) return ''; const ct = G.D.charTypes[L.type];
  let h = `<div class="kpi"><div><b>${money(L.money)}</b><span>${t_('особисті кошти')}</span></div><div><b>${L.fame.toFixed(0)}</b><span>${t_('світова слава')}</span></div></div>`;
  h += TAB_FN.lead();
  h += `<div class="card small">${ico(ct.ic)} <b>${esc(t_(ct.n))}</b>: ${esc(t_(ct.d))}.<br>${t_('Мета: здобути звʼязки й популярність у країні, висунутися кандидатом і виграти вибори — тоді ви станете главою держави. В автократіях замість виборів потрібні звʼязки ≥ 80.')}</div>`;
  if (L.cand != null) { const p = nat(L.cand).parl; h += `<div class="card g">🗳 ${t_('Ви кандидат')}: ${esc(nat(L.cand).name)} · ${t_('вибори')} ${p ? G.dateStr(p.next) : '?'}</div>`; }
  const all = [...new Set([...Object.keys(L.cont), ...Object.keys(L.popu)].map(Number))].sort((a, b) => ((L.cont[b] || 0) + (L.popu[b] || 0)) - ((L.cont[a] || 0) + (L.popu[a] || 0)));
  h += `<div class="grp">${t_('Зв\'язки й популярність')}</div><table><tr><th>${t_('Країна')}</th><th>🤝</th><th>🎤</th><th>🗳</th></tr>` + all.slice(0, 16).map(k => `<tr><td>${ndot(k)}${esc(nat(k).name)}</td><td>${(L.cont[k] || 0).toFixed(0)}</td><td>${(L.popu[k] || 0).toFixed(0)}</td><td class="small">${nat(k).parl ? G.dateStr(nat(k).parl.next).replace(/ р\.$/, '') : ''}</td></tr>`).join('') + '</table>';
  h += `<div class="card small">📍 ${t_('Дії на місцевості (знайомства, виступи, благодійність, медіа…) — клацніть на мапі регіон країни, де перебуває персонаж: вони відкриються в правій панелі.')}</div>`;
  return h;
};
function renderTopChar(sp) {
  const L = G.leader; return `<button onclick="toggleLeft()">☰</button>${leaderAva(30)}<div class="st"><b>${ico(G.D.charTypes[L.type].ic)} ${esc(L.name)}</b><span>${esc(t_(G.D.charTypes[L.type].n))}</span></div>
  <div class="st"><b>${G.dateStr()}</b><span>${t_('день')} ${G.day}</span></div><div id="speed">${sp}</div>
  <div class="st" data-tip="${t_('Особисті кошти персонажа')}"><b>${money(L.money)}</b><span>${t_('кошти')}</span></div><div class="st"><b>${L.fame.toFixed(0)}</b><span>${t_('слава')}</span></div>
  <div class="st"><b>${L.mv ? '✈' : '📍'} ${esc(nat(L.mv ? G.ter[L.mv.to].ctrl : G.ter[L.at].ctrl).name)}</b><span>${t_('де ви')}</span></div>`;
}
// маркер лідера на мапі
const _pxImg = new Image(); _pxImg.src = 'assets/ui/icons.png';
function drawLeader(sh) {
  const L = G && G.leader; if (!L) return; let lon, lat;
  if (L.mv) { const a = D.regions[L.mv.from].c, b = D.regions[L.mv.to].c; const f = Math.min(1, (G.day - L.mv.start + (typeof tAcc === 'number' ? tAcc : 0)) / Math.max(1, L.mv.arrive - L.mv.start)); lon = a[0] + (b[0] - a[0]) * f; lat = a[1] + (b[1] - a[1]) * f;
    const A = toScreen(a[0] + sh, a[1]), B = toScreen(b[0] + sh, b[1]); ctx.strokeStyle = 'rgba(255,214,90,0.6)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.setLineDash([]); }
  else [lon, lat] = D.regions[L.at].c;
  const [x, y] = toScreen(lon + sh, lat); if (x < -40 || x > innerWidth + 40) return;
  const p = PX_ICONS.star, bob = Math.sin(animT * 3) * 2; ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(x, y + 12, 10, 3, 0, 0, 7); ctx.fill();
  const av = avatarImg(L.ava || L.name, { fem: L.fem });
  if (av) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x - 15, y - 33 + bob, 30, 30); ctx.drawImage(av, x - 14, y - 32 + bob, 28, 28); if (_pxImg.complete) ctx.drawImage(_pxImg, p[0] * 16, p[1] * 16, 16, 16, x + 7, y - 38 + bob, 12, 12); }
  else if (_pxImg.complete) ctx.drawImage(_pxImg, p[0] * 16, p[1] * 16, 16, 16, x - 12, y - 22 + bob, 24, 24);
  ctx.font = '600 11px Pixelify, system-ui'; ctx.textAlign = 'center'; const w = ctx.measureText(L.name).width + 10;
  ctx.fillStyle = 'rgba(10,16,24,0.85)'; ctx.fillRect(x - w / 2, y + 4, w, 15); ctx.fillStyle = '#ffd34d'; ctx.fillText(L.name, x, y + 15);
}
// ---- КАР'ЄРА: робота, партія, депутат, власна компанія, шлях до президентства
let foundName = '', foundSector = 'tech', foundCash = 0.3;
function carDo(k, a, b) { const r = k === 'found' ? G.act.careerFound(foundName || null, foundSector, foundCash) : G.act.careerDo(k, a, b); hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); if (r && r.ok && k === 'found') { tab = 'co'; renderTabs(); } renderTab(true); renderTop(); }
TAB_FN.career = function () {
  const L = G.leader; if (!L || L.role !== 'char') return '';
  const nid = G.leaderNation(), here = nid >= 0 ? nat(nid) : null; const stage = G.player >= 0 ? 4 : L.mp != null ? 2 : G.pc >= 0 ? 3 : L.party ? 1 : 0;
  const steps = [['🧑', 'Персонаж'], ['🎗', 'Партія'], ['🏛', 'Депутат'], ['🏢', 'Власник компанії'], ['👑', 'Президент']];
  const got = [true, !!L.party, L.mp != null, G.pc >= 0, G.player >= 0];
  let h = `<div class="career-path">${steps.map(([ic, n], k) => `<span class="${got[k] ? 'on' : ''}">${ico(ic)} ${t_(n)}</span>`).join('<i>›</i>')}</div>`;
  h += `<div class="mut small">${t_('Етапи можна проходити в будь-якому порядку: заробіть гроші й вплив, станьте депутатом або засновником компанії — і балотуйтеся в президенти (вкладка «Персонаж» → «Балотуватися»).')}</div>`;
  const btn = (k, a, label) => { const e = G.careerCan(k, a); const A = G.CAREER[k]; return `<button class="${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="carDo('${k}',${a == null ? 'null' : `'${a}'`})">${A.ic} ${esc(t_(label || A.n))}${A.cost ? ' · ' + money(A.cost) : ''}</button>`; };
  // робота
  h += `<div class="grp">🧳 ${t_('Робота')}</div>`;
  if (L.job) { const J = G.JOBS[L.job.k]; h += `<div class="card small"><div class="row"><b>${J.ic} ${esc(t_(J.n))} · ${t_('рівень')} ${L.job.lvl}</b><span>${money(J.pay * (1 + (L.job.lvl - 1) * 0.6) * 12)}/${t_('рік')}</span></div><div class="mut">${esc(t_(J.d))} · ${esc(nat(L.job.nid).name)}</div></div>`; }
  h += `<div class="btns">${Object.entries(G.JOBS).map(([k, J]) => { const e = G.careerCan('job', k); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(J.d))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="carDo('job','${k}')">${J.ic} ${esc(t_(J.n))}</button>`; }).join('')}</div>`;
  // партія
  h += `<div class="grp">🎗 ${t_('Партія')}</div>`;
  if (L.party) h += `<div class="card small"><div class="row"><b>${esc(L.party.name)}</b><b>${L.party.r.toFixed(1)}%</b></div><div class="bar"><i style="width:${Math.min(100, L.party.r * 2)}%"></i></div><div class="mut">${esc(nat(L.party.nid).name)} · ${t_('рейтинг росте разом із вашою популярністю')}</div></div>`;
  h += `<div class="btns">${btn('party')}${btn('campaign')}</div>`;
  // парламент
  h += `<div class="grp">🏛 ${t_('Парламент')}</div>`;
  if (L.mp != null) h += `<div class="card small g">🏛 ${t_('Ви депутат')}: ${esc(nat(L.mp).name)} · ${t_('вплив у Раді')} <b>${(L.mpInfl || 0).toFixed(0)}</b> · ${t_('зарплата')} ${money(0.0072)}/${t_('рік')}</div>`;
  else if (L.mpCand != null) h += `<div class="card small">🗳 ${t_('Ви кандидат у депутати')}: ${esc(nat(L.mpCand).name)} · ${t_('вибори')} ${G.dateStr(L.mpBy || nat(L.mpCand).parl.next)}</div>`;
  h += `<div class="btns">${btn('mp_run')}${btn('mp_speech')}${btn('mp_inquiry')}${btn('mp_faction')}${G.pc >= 0 ? btn('mp_lobby') : ''}</div>`;
  if (L.mp != null) h += `<div class="row small"><span>📜 ${t_('Законопроєкт')}</span><select id="billSel">${G.MP_BILLS.map((b, k) => `<option value="${k}">${esc(t_(b[0]))}</option>`).join('')}</select><button ${G.careerCan('mp_bill') ? 'disabled' : ''} onclick="carDo('mp_bill',document.getElementById('billSel').value)">${t_('Внести')}</button></div>`;
  // компанія
  h += `<div class="grp">🏢 ${t_('Власна компанія')}</div>`;
  if (G.pc >= 0) { const c = G.myCo(); h += `<div class="card small"><div class="row"><b>${esc(c.name)}</b><span>${money(G.coValue(c))}</span></div>${c.owner === 'me' ? `<div class="row"><span>${t_('Дивіденди власнику (частка прибутку)')}</span><select onchange="G.act.coSet('divs',null,+this.value)">${[0, 0.1, 0.2, 0.4].map(v => `<option value="${v}" ${c.divs === v ? 'selected' : ''}>${v * 100}%</option>`).join('')}</select></div><div class="btns">${[0.05, 0.2].map(v => `<button class="small" onclick="coAct(()=>G.act.coSet('invest',null,${v}))">💸 ${t_('Вкласти')} ${money(v)}</button>`).join('')}</div>` : ''}</div>`; }
  else h += `<div class="card small"><div class="row"><span>${t_('Назва')}</span><input type="text" value="${esc(foundName)}" oninput="foundName=this.value" placeholder="${t_('Моя компанія')}" style="width:55%"></div>
    <div class="row"><span>${t_('Сектор')}</span><select onchange="foundSector=this.value">${Object.entries(D.companySectors).map(([k, s]) => `<option value="${k}" ${foundSector === k ? 'selected' : ''}>${s.ic} ${esc(t_(s.n))}</option>`).join('')}</select></div>
    <div class="row"><span>${t_('Стартовий капітал')}: <b>${money(foundCash)}</b></span><input type="range" min="0.2" max="${Math.max(0.21, L.money).toFixed(2)}" step="0.05" value="${foundCash}" onchange="foundCash=+this.value;renderTab(true)"></div>
    <div class="btns">${(() => { const e = G.careerCan('found_co'); return `<button class="pri" ${e || L.money < 0.2 ? 'disabled' : ''} onclick="carDo('found')">🏗 ${t_('Заснувати компанію')}</button>${e ? `<span class="r small">${esc(t_(e))}</span>` : ''}`; })()}</div><div class="mut">${t_('Компанія засновується в країні, де ви зараз перебуваєте. Далі ви керуєте і персонажем, і компанією.')}</div></div>`;
  return h;
};
