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
function charDo(k) { const r = G.charDo(k, k === 'broker' ? window._brk : null); hint(r.ok ? '✅ ' + r.msg : '⚠ ' + r.err, 3500); AUD.sfx(r.ok ? 'good' : 'bad'); renderTab(true); renderRight(); renderTop(); }
// вкладка
TAB_FN.lead = function () {
  const L = G.leader; if (!L) return '<div class="mut">—</div>';
  let h = `<div class="card"><div class="row"><b>${pxi('star')} ${esc(ldName())}</b><span class="mut">${esc(t_(L.role === 'president' ? 'глава держави' : L.role === 'ceo' ? 'генеральний директор' : G.D.charTypes[L.type].n))}</span></div><div class="small">${ldWhere()}</div>
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
  if (!G.leader.mv) h += `<div class="grp">${t_('Дії тут')}</div>` + charActionsBlock();
  return h;
};
function renderTopChar(sp) {
  const L = G.leader; return `<button onclick="toggleLeft()">☰</button><div class="st"><b>${ico(G.D.charTypes[L.type].ic)} ${esc(L.name)}</b><span>${esc(t_(G.D.charTypes[L.type].n))}</span></div>
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
  if (_pxImg.complete) ctx.drawImage(_pxImg, p[0] * 16, p[1] * 16, 16, 16, x - 12, y - 22 + bob, 24, 24);
  ctx.font = '600 11px Pixelify, system-ui'; ctx.textAlign = 'center'; const w = ctx.measureText(L.name).width + 10;
  ctx.fillStyle = 'rgba(10,16,24,0.85)'; ctx.fillRect(x - w / 2, y + 4, w, 15); ctx.fillStyle = '#ffd34d'; ctx.fillText(L.name, x, y + 15);
}
