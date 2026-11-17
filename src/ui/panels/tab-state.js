// ВКЛАДКА «ДЕРЖАВА»: огляд, бюджет, політика, запаси. Підвкладки — щоб не перевантажувати.
const TABS = [['state', '🏛 Держава'], ['econ', '📦 Економіка'], ['logi', '🚢 Логістика'], ['army', '🪖 Армія'], ['dipl', '🌐 Дипломатія'], ['build', '🏗 Будівництво'], ['tech', '🔬 Дослідження'], ['intel', '🛰 Розвідка й космос'], ['world', '📊 Світ']];
function curTabs() { const ld = G && G.leader ? [['lead', '⭐ Лідер']] : []; if (G && G.player < 0) return G.pc >= 0 ? CO_TABS.concat(ld) : CHAR_TABS; return (G && G.pc >= 0 ? TABS.concat([['co', '🏢 Компанія']]) : TABS).concat(ld); }
function railClick(k) { const L = $('#left'); if (tab === k && !L.classList.contains('hide')) { L.classList.add('hide'); renderTabs(); return; } tab = k; L.classList.remove('hide'); renderTabs(); renderTab(true); }
function renderTabs() { { const t = curTabs().find(x => x[0] === tab); const pt = document.getElementById('ptitle'); if (pt && t) pt.innerHTML = (TAB_ICON[tab] ? pxi(TAB_ICON[tab], 1) : '') + `<span>${t_(t[1]).replace(/^[^\p{L}]+/u, '')}</span><button class="pt-x" data-tip="${t_('Згорнути панель (клік по активній іконці теж згортає)')}" onclick="$('#left').classList.add('hide');renderTabs()">✕</button>`; document.body.classList.toggle('lhide', $('#left').classList.contains('hide')); } $('#tabs').innerHTML = curTabs().map(([k, v]) => `<button class="${tab === k ? 'on' : ''}" data-k="${k}" onclick="railClick('${k}')">${tabLabel(k, v)}</button>`).join(''); }
const TAB_FN = {};
function renderTab(force) {
  if (!G) return; const el = $('#tabc');
  if (!force && el.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const st = el.scrollTop; el.innerHTML = (TAB_FN[tab] || (() => ''))(); el.scrollTop = st;
}
function subnav(t, list) { const cur = subtab[t] || list[0][0]; return `<div class="sub">${list.map(([k, v]) => `<button class="${cur === k ? 'on' : ''}" onclick="subtab['${t}']='${k}';renderTab(true)">${v}</button>`).join('')}</div>`; }
const curSub = (t, def) => subtab[t] || def;
function slider(key, label, min, max, step, val, fmt, note) {
  return `<div class="sl"><div class="lab"><span>${label}</span><b id="v_${key}">${fmt(val)}</b></div><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="document.getElementById('v_${key}').textContent=(${fmt.toString()})(+this.value);" onchange="setPol('${key}',+this.value)">${note ? `<div class="mut small">${note}</div>` : ''}</div>`;
}
function setPol(k, v) { if (k === 'devInv') { nat(G.player).dev.invest = v; renderTab(true); return; } if (k === 'recK') { window._recK = v; renderTab(true); return; } if (k === 'shipK') { window._shipK = v; renderTab(true); return; } if (k === 'stkCnt') { window._stk.cnt = v; renderTab(true); return; } if (k === 'airK') { window._air.k = v; renderTab(true); return; } if (k === 'satK') { window._sat.k = v; renderTab(true); return; } const r = G.act.setPolicy(k, v); if (r && r.ok === false) { hint('⚠ ' + r.err, 4000); AUD.sfx('bad'); } renderTab(true); renderTop(); }
TAB_FN.state = function () {
  const n = nat(G.player), A = n.agg, s = n.stats; const debtR = n.debt / Math.max(1, A.gdp); const bal = s.rev - s.spend; const pool = A.pop * 1000 * n.pol.mob;
  const sub = curSub('state', 'over');
  let h = subnav('state', [['over', 'Огляд'], ['budget', 'Бюджет'], ['policy', 'Політика'], ['proj', 'Нацпроєкти'], ['parl', 'Парламент'], ['stock', 'Запаси']]);
  if (sub === 'parl') return h + parlTab(n);
  if (sub === 'proj') return h + projTab(n);
  if (sub === 'over') {
    h += `<div class="kpi"><div><span>ВВП</span><b>${money(A.gdp)}</b></div><div><span>Зростання</span><b class="${n.growth >= 0 ? 'g' : 'r'}">${sgnPct(n.growth, 2)}</b></div><div><span>Населення</span><b>${popM(A.pop)}</b></div><div><span>ВВП на душу</span><b>$${(n.pc || 0).toFixed(0)}</b></div><div><span>Регіонів</span><b>${A.nT}</b></div><div><span>Площа</span><b>${(A.area / 1000).toFixed(0)} тис. км²</b></div></div>
    <div class="row"><span>Інфраструктура</span><span>${(n.infraLvl * 100).toFixed(0)} / 150</span></div><div class="bar"><i style="width:${n.infraLvl / 1.5 * 100}%"></i></div>
    <div class="row"><span>Технології</span><span>${(n.tech * 100).toFixed(0)}</span></div><div class="bar"><i style="width:${n.tech / 1.8 * 100}%;background:#a87bff"></i></div>
    <div class="row"><span>Стабільність</span><span class="${n.stab < 30 ? 'r' : ''}">${n.stab.toFixed(1)}</span></div><div class="bar"><i style="width:${n.stab}%;background:${n.stab < 30 ? '#ff5d5d' : n.stab < 50 ? '#ffc04d' : '#4cd28a'}"></i></div>
    ${n.warExh > 0.05 ? `<div class="row"><span>Втома від війни</span><span class="r">${pct(n.warExh, 0)}</span></div>` : ''}
    ${n.stab < 20 ? '<div class="card r">⚠ Критична стабільність! Підвищте соціальні видатки, знизьте податки або завершіть війну.</div>' : ''}
    <div class="grp">Найбагатші регіони</div>${G.ter.filter(t => t.ctrl === n.id).sort((a, b) => b.gdp - a.gdp).slice(0, 6).map(t => `<div class="row" style="cursor:pointer" onclick="selRegion(${t.i})"><span>${esc(regName(t.i))}</span><span>${money(t.gdp)}</span></div>`).join('')}`;
  } else if (sub === 'budget') {
    h += `<div class="row"><span>Доходи</span><span class="g">${money(s.rev)}</span></div><div class="row"><span>Видатки (з відсотками)</span><span class="r">${money(s.spend)}</span></div>
    <div class="row"><span>Обслуговування боргу</span><span>${money(s.interest)} (ставка ${pct(s.rate, 1)})</span></div>${n.aidIn ? `<div class="row"><span>Іноземна допомога</span><span class="g">${money(n.aidIn)}</span></div>` : ''}
    <div class="row"><span>Сальдо</span><b class="${bal >= 0 ? 'g' : 'r'}">${money(bal)} (${sgnPct(bal / Math.max(1, A.gdp))} ВВП)</b></div>
    <div class="row"><span>Резерви / держборг</span><span>${money(n.cash)} / ${money(n.debt)} <span class="${debtR > 1 ? 'r' : ''}">(${pct(debtR, 0)})</span></span></div>
    ${n.defaulted ? '<div class="card r">Дефолт: кредитні ринки закриті, ставка підвищена.</div>' : ''}
    <div class="grp">Структура видатків (% ВВП)</div>${[['mil', 'Оборона'], ['infra', 'Інфраструктура'], ['soc', 'Соцсфера'], ['res', 'Наука']].map(([k, v]) => `<div class="row"><span>${v}</span><span>${pct(n.pol[k])} · ${money(A.gdp * n.pol[k])}</span></div>`).join('')}`;
  } else if (sub === 'policy') {
    h += `<label class="card row" style="cursor:pointer"><span>🤖 <b>Автопілот уряду</b> — ШІ сам веде бюджет, мобілізацію й дипломатію (зручно на стрімі)</span><input type="checkbox" ${G.autoPlayer ? 'checked' : ''} onchange="G.autoPlayer=this.checked;renderTab(true)"></label>`;
    h += slider('tax', 'Податки й збори', 0.08, 0.6, 0.005, n.pol.tax, v => (v * 100).toFixed(1) + '%', 'Понад 35% гальмує зростання; понад 45% — знижує стабільність')
      + slider('mil', 'Оборона', 0.003, 0.35, 0.002, n.pol.mil, v => (v * 100).toFixed(1) + '%', `Бюджет ${money(A.gdp * n.pol.mil)}; утримання армії ${money(s.upkeep || 0)}. Решта — нове озброєння.`)
      + slider('infra', 'Інфраструктура й логістика', 0, 0.08, 0.002, n.pol.infra, v => (v * 100).toFixed(1) + '%', 'Швидкість військ, постачання, вартість перевезень, зростання')
      + slider('soc', 'Соціальна сфера', 0.02, 0.4, 0.005, n.pol.soc, v => (v * 100).toFixed(1) + '%', 'Головне джерело стабільності')
      + slider('res', 'Наука й технології', 0, 0.06, 0.001, n.pol.res, v => (v * 100).toFixed(1) + '%', 'Якість армії, продуктивність')
      + slider('mob', 'Рівень мобілізації (% населення)', 0.002, 0.08, 0.001, n.pol.mob, v => (v * 100).toFixed(1) + '%', `Ліміт особового складу: ${people(pool)}. Понад 1% населення — удар по економіці.`);
  } else {
    h += ['oil', 'gas', 'grain'].map(r => `<div class="row"><span>${ico(RI[r].ic)} ${RI[r].n}</span><span>${n.stock[r].toFixed(0)} дн. / ціль ${n.stockTarget[r]} дн.</span></div><div class="bar"><i style="width:${Math.min(100, n.stock[r] / Math.max(1, n.stockTarget[r]) * 100)}%;background:#ffc04d"></i></div>`).join('')
      + `<div class="btns">${['oil', 'gas', 'grain'].map(r => `<button onclick="nat(G.player).stockTarget['${r}']=Math.min(365,nat(G.player).stockTarget['${r}']+30);renderTab(true)">+30 дн. ${ico(RI[r].ic)}</button>`).join('')}</div><div class="mut small">Запаси покривають дефіцит під час блокад і криз. Поповнення коштує бюджету.</div>`;
  }
  return h;
};
function selRegion(i) { sel = { type: 't', id: i }; const c = D.regions[i].c; focusLonLat(c[0], c[1], Math.max(view.s, 9)); renderRight(); }

// ---- парламент: півколо місць, підтримка, вибори, останні голосування
function parlSvg(p, n) {
  const tot = p.seats, gov = Math.round(p.gov * tot), coal = Math.round(p.coal * tot); const rows = 7, pts = [];
  for (let r = 0; r < rows; r++) { const R = 40 + r * 9, cnt = Math.round(tot * R / (rows * 40 + 9 * rows * (rows - 1) / 2)); for (let k = 0; k < cnt; k++) { const a = Math.PI * (1 - k / Math.max(1, cnt - 1)); pts.push([a, 120 + Math.cos(a) * R, 112 - Math.sin(a) * R]); } }
  pts.sort((a, b) => b[0] - a[0]); const col = i => i < gov ? 'var(--acc)' : i < gov + coal ? 'var(--acc2)' : '#8f2a30';
  return `<svg viewBox="0 0 240 118" width="100%">${pts.slice(0, tot).map((q, i) => `<rect x="${(q[1] - 2).toFixed(1)}" y="${(q[2] - 2).toFixed(1)}" width="4" height="4" fill="${col(i)}"/>`).join('')}<text x="120" y="108" text-anchor="middle" fill="#fff" font-family="Pixelify,system-ui" font-size="15">${gov + coal}/${tot}</text></svg>`;
}
function parlTab(n) {
  const p = n.parl; if (!p) return ''; const sup = G.parlSupport(n); const RG = { democracy: 'демократія', hybrid: 'гібридний режим', autocracy: 'автократія' };
  let h = `<h3>🏛 ${esc(t_(p.name))}</h3><div class="small mut">${t_('Режим')}: ${t_(RG[p.regime])}</div>${parlSvg(p, n)}
  <div class="row small"><span><i class="dot" style="background:var(--acc)"></i>${t_('Партія влади')}</span><b>${(p.gov * 100).toFixed(0)}%</b></div><div class="row small"><span><i class="dot" style="background:var(--acc2)"></i>${t_('Коаліція')}</span><b>${(p.coal * 100).toFixed(0)}%</b></div><div class="row small"><span><i class="dot" style="background:#8f2a30"></i>${t_('Опозиція')}</span><b>${((1 - p.gov - p.coal) * 100).toFixed(0)}%</b></div>
  <div class="row"><span data-tip="${t_('Частка голосів, на яку можна розраховувати: залежить від фракцій і стабільності')}">${t_('Підтримка рішень')}</span><b class="${sup > 0.55 ? 'g' : sup > 0.48 ? 'y' : 'r'}">${pct(sup, 0)}</b></div>
  <div class="row"><span>${t_('Наступні вибори')}</span><b>${G.dateStr(p.next)}</b></div>`;
  h += `<div class="card small">${p.regime === 'autocracy' ? t_('В автократії парламент не заважає: рішення ухвалюються без голосувань.') : t_('Великі зміни податків, мобілізації, оборонного й соціального бюджету та оголошення війни виносяться на голосування. Провалене рішення можна повторити через 30 днів. Підтримка росте зі стабільністю й економікою.')}</div>`;
  if (p.votes.length) h += `<div class="grp">${t_('Останні голосування')}</div>` + p.votes.map(v => `<div class="row small"><span>${v.ok ? '✅' : '❌'} ${esc(t_(v.what))}</span><span>${v.yes}/${v.need}</span></div>`).join('');
  return h;
}

function projTab(n) {
  const PR = D.projects; if (!PR) return ''; let h = `<div class="mut small">${t_('Великі багаторічні програми: щомісячні платежі з бюджету, а після завершення — постійний ефект. Одночасно — до двох.')}</div>`;
  for (const [k, P] of Object.entries(PR)) { const p = n.proj[k], e = G.projCan(G.player, k); const cost = G.projCost(G.player, k);
    h += `<div class="card"><div class="row"><b>${ico(P.ic)} ${esc(t_(P.n))}</b><span>${money(cost)} · ${P.yrs} ${t_('р.')}</span></div><div class="small mut">${esc(t_(P.d))}</div>`;
    if (p && p.ok) h += `<div class="g small">✓ ${t_('Завершено')}</div>`;
    else if (p) h += `<div class="bar"><i style="width:${Math.min(100, (G.day - p.start) / (p.done - p.start) * 100)}%"></i></div><div class="row small"><span>${t_('Сплачено')} ${money(p.paid)} · ${t_('залишилось')} ${p.done - G.day} ${t_('дн.')}</span><button class="dang" onclick="G.act.cancelProject('${k}');renderTab(true)">${t_('Скасувати')}</button></div>`;
    else h += `<div class="btns"><button class="pri" ${e ? 'disabled' : ''} onclick="doProj('${k}')">${t_('Розпочати')}</button>${e ? `<span class="small y">${esc(t_(e))}</span>` : ''}</div>`;
    h += `</div>`; }
  return h;
}
function doProj(k) { const r = G.act.startProject(k); hint(r.ok ? '🚀 ' + t_('Проєкт розпочато') : '⚠ ' + r.err, 3000); renderTab(true); }
