// ВКЛАДКИ v2.9: «🕶 Спецслужби», «🗣 Думка», «🌍 Планета» (держава), «🏙 Місто» (персонаж); режими мапи «Громадська думка»
// і «Море й клімат»; блок думки й дамб у панелі регіону; чутки на біржі; накладки на мапу (затоплення, протести, герої).
function v29Res(r) { hint(r && r.ok !== false ? '✅ ' + t_((r && r.msg) || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3800); AUD.sfx(r && r.ok !== false ? 'good' : 'bad'); renderTab(true); renderTop(); if (sel) renderRight(); }
function bar29(v, col) { v = Math.max(0, Math.min(100, v)); return `<div style="height:7px;background:#0005;border-radius:4px;overflow:hidden;margin:3px 0"><div style="width:${v}%;height:100%;background:${col || (v > 60 ? '#3ed06a' : v > 35 ? '#ffd34d' : '#e04848')}"></div></div>`; }
// ---------- рейка
{ const base = window.curTabs; if (base) window.curTabs = function () { const r = base.apply(this, arguments); if (!G) return r;
  if (G.player >= 0 && G.spyState && !r.some(x => x[0] === 'spy')) { const i = r.findIndex(x => x[0] === 'intel'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['spy', '🕶 Спецслужби']); const j = r.findIndex(x => x[0] === 'state'); r.splice(j >= 0 ? j + 1 : 1, 0, ['op', '🗣 Думка']); const k = r.findIndex(x => x[0] === 'colony'); r.splice(k >= 0 ? k + 1 : r.length, 0, ['planet', '🌍 Планета']); }
  if (G.leader && G.leader.money != null && G.cityState && !r.some(x => x[0] === 'city')) { const i = r.findIndex(x => x[0] === 'char' || x[0] === 'lead'); r.splice(i >= 0 ? i + 1 : r.length, 0, ['city', '🏙 Місто']); }
  return r; }; }

// ================= СПЕЦСЛУЖБИ =================
let spyTgt = null;
function spyTargets() { const me = G.player; return G.N.filter(n => n.alive && n.agg && n.id !== me).map(n => ({ id: n.id, w: (G.atWar(me, n.id) ? 1e6 : 0) + (G.rel[me][n.id] < -30 ? 1e5 : 0) + n.agg.gdp })).sort((a, b) => b.w - a.w).slice(0, 60).map(x => x.id); }
TAB_FN.spy = function () {
  if (!G || G.player < 0 || !G.spyState) return ''; const me = G.player, st = G.spyState(me), O = G.SPY_OPS, n = nat(me);
  if (spyTgt == null || !nat(spyTgt).alive || spyTgt === me) spyTgt = spyTargets()[0];
  const svcCard = (side, title) => { const s = st[side], tr = G.SPY_TRAITS[s.ch.tr]; const up = G.spyLvlCost(me, s.lvl + 1);
    return `<div class="card small"><div class="row"><b>${title}</b><span class="mut">${t_('рівень')} ${s.lvl}/5 · ${t_('операцій')} ${s.ops.length}/${s.lvl}</span></div>
      <div>👤 ${esc(s.ch.name)} ${esc(s.ch.nick)} · ${'★'.repeat(s.ch.sk)}${'☆'.repeat(5 - s.ch.sk)} · <span data-tip="${esc(t_(tr[1]))}"><u>${esc(t_(tr[0]))}</u></span> · ${s.ch.age} ${t_('р.')}</div>
      <div class="mut">${t_('Лояльність')} ${s.loy.toFixed(0)}% ${bar29(s.loy)} ${t_('Бюджет')}: ${money(G.spyBudget(me, s))}/${t_('міс.')} · ${t_('успішних')} ${s.done} · ${t_('провалів')} ${s.fail}</div>
      ${s.ops.map(o => { const OO = O[side][o.k]; const p = Math.min(100, (G.day - o.start) / Math.max(1, o.end - o.start) * 100); return `<div>${OO.ic} ${esc(t_(OO.n))}${o.x != null ? ' → ' + esc(nat(o.x).name) : ''} <span class="mut">${t_('ще')} ${o.end - G.day} ${t_('дн.')}</span>${bar29(p, '#4fb3ff')}</div>`; }).join('')}
      <div class="btns"><button class="small" ${s.lvl >= 5 ? 'disabled' : ''} onclick="v29Res(G.act.spyUp('${side}'))">⬆ ${t_('Рівень')} ${s.lvl + 1} · ${money(up)}</button><button class="small" onclick="spyCands('${side}')">🔄 ${t_('Змінити керівника')}</button></div></div>`; };
  let h = `<div class="card small mut">${t_('Дві служби: внутрішня (СБ) захищає країну, зовнішня (розвідка) працює за кордоном. Кожна операція триває кілька тижнів; успіх залежить від рівня служби, керівника й контррозвідки цілі. Ворожі «кроти» знижують успіх і зливають ваші плани.')}</div>`;
  h += svcCard('int', '🛡 ' + t_('Служба безпеки (внутрішня)'));
  h += `<div class="grp">🛡 ${t_('Завдання для СБ')}</div><div class="btns">` + Object.entries(O.int).map(([k, A]) => { const e = G.spyCan(me, 'int', k); const p = G.spyChance(me, 'int', k); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))} · ${A.dur} ${t_('дн.')}${e ? ' — ' + esc(t_(e)) : ''}" onclick="v29Res(G.act.spyStart('int','${k}'))">${A.ic} ${esc(t_(A.n))} · ${(p * 100).toFixed(0)}%</button>`; }).join('') + '</div>';
  h += svcCard('ext', '🌐 ' + t_('Зовнішня розвідка'));
  h += `<div class="grp">🎯 ${t_('Ціль')}</div><select onchange="spyTgt=+this.value;renderTab(true)" style="width:100%">${spyTargets().map(id => `<option value="${id}" ${id === spyTgt ? 'selected' : ''}>${G.atWar(me, id) ? '⚔ ' : G.rel[me][id] < -30 ? '😠 ' : ''}${esc(nat(id).name)}${st.src.some(r => r.x === id) ? ' · 🎣' : ''}</option>`).join('')}</select>`;
  h += `<div class="btns">` + Object.entries(O.ext).map(([k, A]) => { const e = G.spyCan(me, 'ext', k, spyTgt); const p = G.spyChance(me, 'ext', k, spyTgt); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A.d))} · ${A.dur} ${t_('дн.')}${e ? ' — ' + esc(t_(e)) : ''}" onclick="v29Res(G.act.spyStart('ext','${k}',${spyTgt}))">${A.ic} ${esc(t_(A.n))} · ${(p * 100).toFixed(0)}%</button>`; }).join('') + '</div>';
  h += `<div class="grp">🎣 ${t_('Джерела')} (${st.src.length})</div>` + (st.src.map(r => `<div class="row small"><span>${esc(r.name)} — ${esc(t_(r.role))}</span><span class="mut">${esc(nat(r.x).name)} · ${t_('надійність')} ${(r.rel * 100).toFixed(0)}%</span></div>`).join('') || `<div class="mut small">${t_('Немає. Завербуйте першого агента.')}</div>`) + `<div class="mut small">${t_('Джерело може бути перевербоване ворогом — тоді операції через нього провалюються. СБ може перевірити джерела.')}</div>`;
  const found = st.moles.filter(m => m.found); h += `<div class="grp">🐀 ${t_('Викриті кроти')}</div>` + (found.map((m, i) => `<div class="card small">${esc(m.name)} · ${t_('працював на')} <b>${esc(nat(m.by).name)}</b> (${m.svc === 'int' ? t_('СБ') : t_('розвідка')})<div class="btns"><button class="small" onclick="v29Res(G.act.moleDo(${i},'arrest'))">⛓ ${t_('Арештувати')}</button><button class="small" onclick="v29Res(G.act.moleDo(${i},'expel'))">✈ ${t_('Вислати')}</button><button class="small" onclick="v29Res(G.act.moleDo(${i},'turn'))">🔁 ${t_('Перевербувати (подвійний агент)')}</button></div></div>`).join('') || `<div class="mut small">${t_('Поки нікого. Це добре… або вони дуже обережні.')}</div>`);
  h += `<div class="grp">📜 ${t_('Журнал')}</div>` + (st.log.slice(0, 12).map(l => `<div class="small ${l.ok ? '' : 'mut'}">${esc(l.t)}</div>`).join('') || `<div class="mut small">—</div>`);
  return h;
};
function spyCands(side) { const L = G.spyCands(G.player); openModal(`<h2>🔄 ${t_('Новий керівник')}</h2><div class="mut small">${t_('Зміна керівника знижує лояльність служби на 10%.')}</div>` + L.map((c, i) => { const tr = G.SPY_TRAITS[c.tr]; return `<div class="card small"><b>${esc(c.name)} ${esc(c.nick)}</b> · ${'★'.repeat(c.sk)}${'☆'.repeat(5 - c.sk)} · ${c.age} ${t_('р.')}<div class="mut">${esc(t_(tr[0]))}: ${esc(t_(tr[1]))}</div><button class="small pri" onclick="closeModal();v29Res(G.act.spyHire('${side}',${i}))">${t_('Призначити')}</button></div>`; }).join('') + `<div class="btns"><button onclick="closeModal()">${t_('Скасувати')}</button></div>`); }

// ================= ГРОМАДСЬКА ДУМКА =================
TAB_FN.op = function () {
  if (!G || G.player < 0 || !G.regOp) return ''; const me = G.player, P = G.v29s('op', () => ({ mod: {}, prot: {}, heroes: [], cd: {} }));
  const regs = G.ter.filter(t => t.ctrl === me).map(t => ({ i: t.i, v: G.regOp(t.i), p: G.protestIn(t.i) })).sort((a, b) => a.v - b.v); const nv = G.natOp(me);
  let h = `<div class="kpi"><div><span>${t_('Думка по країні')}</span><b class="${nv > 55 ? 'g' : nv < 35 ? 'r' : ''}">${nv.toFixed(0)}%</b></div><div><span>${t_('Протести')}</span><b class="${regs.some(x => x.p) ? 'r' : ''}">${regs.filter(x => x.p).length}</b></div><div><span>${t_('Герої')}</span><b>${P.heroes.filter(x => x.n === me).length}</b></div></div>`;
  h += `<div class="mut small">${t_('Думка регіону залежить від стабільності, руйнувань, окупації, затоплень і ваших рішень. Нижче 28% — ризик протестів. Режим мапи «Громадська думка» показує все наочно.')} <button class="small" onclick="setMapMode29('op')">🗺 ${t_('Показати на мапі')}</button></div>`;
  const hs = P.heroes.filter(x => x.n === me); if (hs.length) h += `<div class="grp">🦸 ${t_('Місцеві герої')}</div>` + hs.map(x => `<div class="card small"><b>${esc(t_(x.kind))} ${esc(x.name)}</b> · ${esc(regName(x.reg))}<div class="mut">${esc(t_(x.deed))}</div><div class="btns"><button class="small" onclick="v29Res(G.act.heroAward(${x.id},'medal'))">🏅 ${t_('Медаль')}</button><button class="small" onclick="v29Res(G.act.heroAward(${x.id},'adv'))">🎖 ${t_('Зробити радником')}</button><button class="small" onclick="v29Res(G.act.heroAward(${x.id},'letter'))">✉ ${t_('Подякувати листом')}</button></div></div>`).join('');
  h += `<div class="grp">📍 ${t_('Регіони (найгірші — зверху)')}</div>` + regs.slice(0, 25).map(x => `<div class="row small" style="cursor:pointer" onclick="sel={type:'t',id:${x.i}};const c=D.regions[${x.i}].c;focusLonLat(c[0],c[1],Math.max(view.s,6));renderRight()"><span>${x.p ? '📢 ' : ''}${esc(regName(x.i))}${x.p ? ` <span class="r">(${esc(t_(x.p.why))})</span>` : ''}</span><b class="${x.v > 55 ? 'g' : x.v < 30 ? 'r' : ''}">${x.v.toFixed(0)}%</b></div>`).join('');
  return h;
};
function opBlock(i) {
  if (!G || !G.regOp || G.player < 0 || G.ter[i].ctrl !== G.player) return ''; const v = G.regOp(i), p = G.protestIn(i), n = nat(G.player);
  let h = `<div class="grp">🗣 ${t_('Громадська думка')}: <b class="${v > 55 ? 'g' : v < 30 ? 'r' : ''}">${v.toFixed(0)}%</b></div>${bar29(v)}`;
  if (p) h += `<div class="small r">📢 ${t_('Протести проти')} «${esc(t_(p.why))}» · ${(p.sz * 10).toFixed(0)} ${t_('тис. людей')}</div>`;
  h += `<div class="btns">` + Object.entries(G.OP_ACT).filter(([k, A]) => !A.prot || p).map(([k, A]) => `<button class="small" data-tip="${esc(t_(A.d))}" onclick="v29Res(G.act.opAct(${i},'${k}'))">${A.ic} ${esc(t_(A.n))} · ${money(A.c(i))}</button>`).join('') + '</div>';
  if (G.floodOf && D.regions[i].p && D.regions[i].p.length) { const f = G.floodOf(i), r = G.floodRisk(i), P = G.v29s('pl', () => ({ fl: {}, surge: {}, dam: {}, damQ: {}, deb: 6, kes: 0, hist: [] }));
    h += `<div class="small">🌊 ${t_('Затоплення')}: <b>${(f * 100).toFixed(0)}%</b> · ${t_('ризик від моря')}: ${(r * 100).toFixed(0)}% · ${P.dam[i] ? '🧱 ' + t_('дамба є') : P.damQ[i] ? '🚧 ' + t_('дамба будується') + ' (' + (P.damQ[i] - G.day) + ' ' + t_('дн.') + ')' : `<button class="small" onclick="v29Res(G.act.damBuild(${i}))">🧱 ${t_('Збудувати дамбу')} · ${money(G.damCost(i))}</button>`}</div>`; }
  return h;
}
{ const b = window.terrPanel; if (b) window.terrPanel = function (i) { const h = b.apply(this, arguments); try { return h + opBlock(i); } catch (e) { return h; } }; }

// ================= ПЛАНЕТА =================
TAB_FN.planet = function () {
  if (!G || G.player < 0 || !G.debris) return ''; const me = G.player, C = G.climate || { t: 1.3, sea: 0 }, P = G.v29s('pl', () => ({ fl: {}, surge: {}, dam: {}, damQ: {}, deb: 6, kes: 0, hist: [] })), d = G.debris();
  let h = `<div class="kpi"><div><span>${t_('Потепління')}</span><b class="${C.t > 1.7 ? 'r' : ''}">+${C.t.toFixed(2)}°C</b></div><div><span>${t_('Рівень моря')}</span><b>+${C.sea.toFixed(1)} ${t_('см')}</b></div><div><span>${t_('Сміття на орбіті')}</span><b class="${d > 60 ? 'r' : ''}">${d.toFixed(0)}%</b></div></div>`;
  h += `<div class="grp">🌊 ${t_('Ваші прибережні регіони')} <button class="small" onclick="setMapMode29('flood')">🗺 ${t_('Мапа моря')}</button></div><div class="mut small">${t_('Що вище море, то більше затоплень; штормові нагони приходять самі. Дамба (рік будівництва) захищає регіон.')}</div>`;
  const L = G.floodList(me); h += (L.slice(0, 20).map(x => `<div class="row small"><span>${x.f > 0.05 ? '🌊 ' : ''}${esc(x.n)} <span class="mut">${t_('ризик')} ${(x.risk * 100).toFixed(0)}%${x.f > 0.01 ? ' · ' + t_('під водою') + ' ' + (x.f * 100).toFixed(0) + '%' : ''}</span></span><span>${x.dam ? '🧱' : x.q ? '🚧 ' + (x.q - G.day) + t_('дн.') : `<button class="small" onclick="v29Res(G.act.damBuild(${x.i}))">🧱 ${money(G.damCost(x.i))}</button>`}</span></div>`).join('') || `<div class="mut small">${t_('Виходу до моря немає — і це той випадок, коли це плюс.')}</div>`);
  h += `<div class="grp">🛰 ${t_('Орбітальне сміття')}</div>${bar29(100 - d)}<div class="small">${G.kessler() ? `<b class="r">☄ ${t_('Синдром Кесслера! Орбіта закрита ще')} ${P.kes - G.day} ${t_('дн.')}</b>` : t_('Кожен збитий супутник лишає уламки. Понад 85% — ланцюгова реакція (синдром Кесслера): більшість супутників світу знищено, запуски неможливі півтора року.')}</div>`;
  const e = G.debrisCleanCan(me); h += `<div class="btns"><button ${e ? 'disabled' : ''} data-tip="${esc(t_(e || 'сміття −8…16%, відносини з космічними державами +3'))}" onclick="v29Res(G.act.debrisClean())">🧹 ${t_('Місія з прибирання орбіти')} · $1.2 ${t_('млрд')}</button></div><div class="mut small">${t_('Порада: в ООН можна внести резолюцію «Програма прибирання орбіти».')}</div>`;
  return h;
};
function setMapMode29(m) { mode = m; mapDirty = true; try { const s = document.querySelector('#top select'); if (s) s.value = m; } catch (e) { } renderTop(); if (window.renderLegend) renderLegend(); }

// ================= РЕЖИМИ МАПИ =================
if (typeof MAP_MODES !== 'undefined') MAP_MODES.push(['op', 'Громадська думка'], ['flood', 'Море й клімат']);
{ const b = window.terrColor; if (b) window.terrColor = function (i) {
  if (mode === 'op' && G.regOp) { const t = G.ter[i]; if (t.ctrl !== G.pv() && G.player >= 0) return '#3a4250'; const v = G.regOp(i); return scale3((v - 45) / 45); }
  if (mode === 'flood' && G.floodOf) { const f = G.floodOf(i); if (f > 0.01) return lerpC([110, 170, 230], [20, 60, 160], Math.min(1, f * 1.5)); const r = G.floodRisk(i); return r > 0 ? lerpC([150, 155, 160], [235, 190, 80], Math.min(1, r)) : '#7d858e'; }
  return b.apply(this, arguments); }; }
// накладки: затоплені регіони, протести, герої, дамби
function drawOverlay29(lw) {
  if (!G || !G.floodOf) return; const P = G.v29 || {}; const pl = P.pl, op = P.op;
  if (pl && mode !== 'flood') { const L = new Set([...Object.keys(pl.fl || {}), ...Object.keys(pl.surge || {})]); L.forEach(k => { const i = +k, f = G.floodOf(i); if (f < 0.04) return; ctx.fillStyle = `rgba(40,120,220,${0.18 + f * 0.45})`; ctx.fill(GEO.paths[i]); }); }
  const em = (e, i, dy) => { const c = D.regions[i].c; const s = 16 * lw; ctx.font = `${s}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, c[0], -c[1] + (dy || 0) * lw); };
  if (op && G.player >= 0) { for (const k in op.prot) { const p = op.prot[k]; if (p.until <= G.day) continue; const i = +k; if (G.ter[i].ctrl !== G.player) continue; ctx.strokeStyle = `rgba(255,70,70,${0.5 + Math.sin(animT * 5) * 0.3})`; ctx.lineWidth = 2.4 * lw; ctx.stroke(GEO.paths[i]); em('📢', i, -10); }
    (op.heroes || []).forEach(hh => { if (hh.n === G.player) em('🦸', hh.reg, 10); }); }
  if (pl && G.player >= 0 && view.s > 6) { for (const k in pl.dam) if (G.ter[k] && G.ter[k].owner === G.player) em('🧱', +k, 0); for (const k in pl.damQ) if (G.ter[k] && G.ter[k].owner === G.player) em('🚧', +k, 0); }
}

// ================= БІРЖА: ЧУТКИ =================
{ const b = window.stockTab; if (b) window.stockTab = function () { let h = b.apply(this, arguments); try { const w = G.wallet(); if (!w || !G.insTips) return h; const T0 = G.insTips(w);
  h = `<div class="grp">🤫 ${t_('Чутки й інсайди')}</div>` + (T0.length ? T0.map(t => { const c = G.companies[t.cid]; return `<div class="card small">${t.dir > 0 ? '📈' : '📉'} <b>${esc(LORA.lang === 'en' ? c.en : c.name)}</b>: ${esc(t_(t.what))}<div class="mut">${t_('Джерело')}: ${esc(t_(t.src))} · ${t.done ? t_('вже відомо') : t_('ще не підтверджено')}</div><div class="btns"><button class="small" onclick="stockDo(${t.cid},1)">+1%</button><button class="small" onclick="stockDo(${t.cid},-1)">−1%</button></div></div>`; }).join('') + `<div class="mut small">⚖ ${t_('Торгівля на інсайдах незаконна: Комісія з цінних паперів може почати розслідування.')}</div>` : `<div class="mut small">${t_('Поки тихо. Чутки приходять від звʼязків або економічної розвідки.')}</div>`) + h; } catch (e) { } return h; }; }

// ================= МІСТО =================
TAB_FN.city = function () {
  if (!G || !G.cityState) return ''; const S = G.cityState(); if (!S) return `<div class="mut">${t_('Місто доступне лише персонажу з особистими грошима.')}</div>`; const L = G.leader;
  let h = `<div class="card"><h3>🏙 ${esc(S.name)}</h3><div class="mut small">${t_('Вийдіть у місто: магазини, бари, ресторани, нічні клуби, спорт, казино, університет, телестудія. Кожна дія займає кілька годин доби й має випадкові наслідки.')}</div>
    <div class="small">😊 ${t_('Настрій')} ${S.mood.toFixed(0)}% ${bar29(S.mood)} ❤ ${t_('Здоровʼя')} ${S.hp.toFixed(0)}% ${bar29(S.hp)}</div><div class="mut small">${t_('Гарний настрій — більший заробіток; низьке здоровʼя — ризик лікарні.')}</div>
    <div class="btns"><button class="pri" ${L.mv ? 'disabled' : ''} onclick="openCity()">🚶 ${t_('Вийти в місто')}</button></div></div>`;
  if (S.log.length) h += `<div class="grp">📝 ${t_('Сьогодні')}</div>` + S.log.map(x => `<div class="small">${esc(t_(x))}</div>`).join('');
  return h;
};
let cityUI = null;
function openCity() {
  if (!G || !G.cityState()) return; if (G.leader.mv) { hint('⚠ ' + t_('Ви в дорозі'), 2000); return; }
  const prev = speedIdx; if (!G.online && !NET.isGuest()) setSpeed(0);
  let el = document.getElementById('city'); if (!el) { el = document.createElement('div'); el.id = 'city'; document.body.appendChild(el); }
  el.innerHTML = `<div class="city-top"><b id="cityName"></b><span id="cityClock"></span><span id="cityStats"></span><span style="flex:1"></span><button onclick="cityWait()">⏩ ${t_('Чекати 2 год')}</button><button onclick="cityHome()">🏠 ${t_('Додому')}</button><button onclick="closeCity()">✕</button></div>
    <div class="city-body"><canvas id="citycv"></canvas><div class="city-side" id="citySide"></div></div><div class="city-log" id="cityLog"></div>`;
  el.style.display = 'flex'; const S = G.cityState(); const seed = [...S.name].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
  cityUI = { prev, place: null, me: { x: 0.5, y: 0.45 }, path: [], fx: [], seed, raf: 0, hov: null };
  const cv = document.getElementById('citycv'); cv.onclick = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; let best = null, bd = 0.004; for (const [k, P] of Object.entries(G.CITY)) { const d = (P.x - x) ** 2 + (P.y - y) ** 2; if (d < bd) { bd = d; best = k; } } if (best) cityGo(best); };
  cv.onmousemove = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; let best = null; for (const [k, P] of Object.entries(G.CITY)) if ((P.x - x) ** 2 + (P.y - y) ** 2 < 0.003) best = k; cityUI.hov = best; cv.style.cursor = best ? 'pointer' : 'default'; };
  citySide(); cityTop(); cityLoop();
}
function closeCity() { const el = document.getElementById('city'); if (el) el.style.display = 'none'; if (cityUI) { cancelAnimationFrame(cityUI.raf); if (!G.online && !NET.isGuest() && cityUI.prev) setSpeed(cityUI.prev); } cityUI = null; renderTab(true); renderTop(); }
function cityTop() { const S = G.cityState(); if (!S) return; const h = Math.floor(S.h), m = Math.round((S.h - h) * 60); $('#cityName').textContent = '🏙 ' + S.name; $('#cityClock').textContent = `🕐 ${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}${S.h >= 26 ? ' · ' + t_('час спати') : ''}`;
  $('#cityStats').innerHTML = `😊 ${S.mood.toFixed(0)}% · ❤ ${S.hp.toFixed(0)}% · 💰 ${money(S.money)}`; $('#cityLog').innerHTML = S.log.slice(0, 4).map(x => `<div>${esc(t_(x))}</div>`).join(''); }
function cityGo(k) { if (!cityUI) return; const P = G.CITY[k]; const a = cityUI.me; cityUI.path = [{ x: P.x, y: a.y }, { x: P.x, y: P.y }]; cityUI.place = k; citySide(); }
function citySide() {
  const el = $('#citySide'); if (!el || !cityUI) return; const k = cityUI.place, S = G.cityState();
  if (!k) { el.innerHTML = `<h3>${t_('Куди підемо?')}</h3><div class="mut small">${t_('Клацніть заклад на мапі. Деякі відкриті лише вдень, інші — лише ввечері.')}</div>` + Object.entries(G.CITY).map(([q, P]) => `<div class="row small" style="cursor:pointer" onclick="cityGo('${q}')"><span>${P.ic} ${esc(t_(P.n))}</span><span class="${G.cityOpen(q, S.h) ? 'g' : 'mut'}">${G.cityOpen(q, S.h) ? t_('відчинено') : t_('зачинено')}</span></div>`).join(''); return; }
  const P = G.CITY[k]; el.innerHTML = `<h3>${P.ic} ${esc(t_(P.n))}</h3><div class="mut small">${t_('Працює')}: ${P.open[0]}:00–${P.open[1] % 24}:00 · ${G.cityOpen(k, S.h) ? `<span class="g">${t_('відчинено')}</span>` : `<span class="r">${t_('зачинено')}</span>`}</div>`
    + Object.entries(P.acts).map(([a, A]) => { const e = G.cityCan(k, a); return `<button class="city-act" ${e ? 'disabled' : ''} data-tip="${esc(e ? t_(e) : '')}" onclick="cityDo('${k}','${a}')"><b>${esc(t_(A.n))}</b><span class="mut">${A.h} ${t_('год')} · ${A.c ? money(A.c) : t_('безкоштовно')}</span></button>`; }).join('')
    + `<div class="btns"><button class="small" onclick="cityUI.place=null;citySide()">← ${t_('Усі заклади')}</button></div>`;
}
function cityDo(k, a) { const r = G.act.cityDo(k, a); if (!r || r.ok === false) { hint('⚠ ' + t_((r && r.err) || 'Помилка'), 2500); return; }
  const P = G.CITY[k]; const d = r.d || {}; const good = (d.mood || 0) + (d.popu || 0) + (d.fame || 0) >= 0;
  cityUI.fx.push({ x: P.x, y: P.y, t0: performance.now(), e: r.fx === 'jackpot' ? '💰' : r.fx === 'paparazzi' ? '📸' : r.fx === 'heart' ? '❤' : r.fx === 'busted' ? '🚨' : r.fx === 'song' ? '🎵' : r.fx === 'football' ? '⚽' : r.fx === 'disco' ? '✨' : r.fx === 'pigeons' ? '🕊' : good ? '✨' : '💢' });
  if (r.fx === 'jackpot' || r.fx === 'paparazzi' || r.fx === 'busted') LORA.bus.emit('fx', { kind: r.fx, sub: r.msg });
  AUD.sfx(good ? 'good' : 'bad'); hint((good ? '😊 ' : '😬 ') + t_(r.msg), 4500); cityTop(); citySide(); }
function cityWait() { const r = G.act.cityWait(2); if (r && r.ok === false) { hint('⚠ ' + t_(r.err), 2000); return; } hint('⏳ ' + t_(r.msg), 2500); cityTop(); citySide(); }
function cityHome() { const r = G.act.cityHome(); if (r && r.ok) hint('🏠 ' + t_(r.msg), 3500); closeCity(); }
function cityLoop() {
  if (!cityUI) return; const cv = document.getElementById('citycv'); if (!cv) return; const W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } const cx = cv.getContext('2d'); const S = G.cityState(); if (!S) return;
  const hh = S.h % 24, night = hh >= 20 || hh < 6, dusk = hh >= 18 && hh < 20; let rs = cityUI.seed; const rnd = () => ((rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296);
  cx.fillStyle = night ? '#141b26' : dusk ? '#4a4038' : '#c9c3b2'; cx.fillRect(0, 0, W, H);
  // квартали
  const nx = 10, ny = 8, bw = W / nx, bh = H / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const r = rnd(); const park = i >= 4 && i <= 5 && j <= 1; cx.fillStyle = park ? (night ? '#1e3324' : '#7fb06a') : night ? `rgb(${40 + r * 20},${44 + r * 20},${58 + r * 20})` : `rgb(${170 + r * 40},${160 + r * 40},${150 + r * 30})`; cx.fillRect(i * bw + 8, j * bh + 8, bw - 16, bh - 16);
    if (!park && night) for (let w = 0; w < 6; w++) if (rnd() < 0.5) { cx.fillStyle = '#ffd86a'; cx.fillRect(i * bw + 14 + (w % 3) * (bw - 28) / 3, j * bh + 14 + Math.floor(w / 3) * (bh - 28) / 2, 6, 6); } }
  // вулиці
  cx.strokeStyle = night ? '#2a3240' : '#8d8a82'; cx.lineWidth = 8; for (let i = 0; i <= nx; i++) { cx.beginPath(); cx.moveTo(i * bw, 0); cx.lineTo(i * bw, H); cx.stroke(); } for (let j = 0; j <= ny; j++) { cx.beginPath(); cx.moveTo(0, j * bh); cx.lineTo(W, j * bh); cx.stroke(); }
  // ріка
  cx.strokeStyle = night ? '#1d3550' : '#6fa4cf'; cx.lineWidth = H * 0.06; cx.beginPath(); for (let x = 0; x <= W; x += 20) cx.lineTo(x, H * 0.97 - Math.sin(x / W * 5 + cityUI.seed % 7) * H * 0.03); cx.stroke();
  // машинки
  const now = performance.now() / 1000; cx.font = '18px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; for (let c = 0; c < 8; c++) { const horiz = c % 2 === 0, lane = (c * 3 + 1) % (horiz ? ny : nx), p = ((now * (40 + c * 7) + c * 200) % ((horiz ? W : H) + 60)) - 30; cx.fillText(['🚗', '🚕', '🚌', '🚲', '🛵', '🚓', '🚙', '🚎'][c], horiz ? p : lane * bw, horiz ? lane * bh : p); }
  // заклади
  for (const [k, P] of Object.entries(G.CITY)) { const x = P.x * W, y = P.y * H, open = G.cityOpen(k, S.h); const hov = cityUI.hov === k || cityUI.place === k;
    cx.fillStyle = open ? (hov ? '#ffd34d' : '#f4f1e6') : '#6a6f78'; cx.strokeStyle = '#1b2633'; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, hov ? 30 : 26, 0, 7); cx.fill(); cx.stroke();
    cx.globalAlpha = open ? 1 : 0.45; cx.font = `${hov ? 32 : 28}px serif`; cx.fillText(P.ic, x, y + 1); cx.globalAlpha = 1;
    if (hov || W > 900) { cx.font = '600 12px system-ui'; const nm = t_(P.n); const w2 = cx.measureText(nm).width + 10; cx.fillStyle = 'rgba(10,14,20,0.8)'; cx.fillRect(x - w2 / 2, y + 30, w2, 18); cx.fillStyle = open ? '#e8f0f8' : '#9aa3ad'; cx.fillText(nm, x, y + 39); } }
  // персонаж іде вулицями
  const me = cityUI.me; if (cityUI.path.length) { const t = cityUI.path[0]; const dx = t.x - me.x, dy = t.y - me.y, d = Math.hypot(dx, dy), sp = 0.012; if (d < sp) { me.x = t.x; me.y = t.y; cityUI.path.shift(); } else { me.x += dx / d * sp; me.y += dy / d * sp; } }
  cx.font = '34px serif'; cx.fillText(G.leader.ic && G.leader.ic !== '⭐' ? G.leader.ic : '🧍', me.x * W, me.y * H - 22 - (cityUI.path.length ? Math.abs(Math.sin(now * 10)) * 5 : 0));
  // ефекти дій
  cityUI.fx = cityUI.fx.filter(f => now * 1000 - f.t0 < 1600); cityUI.fx.forEach(f => { const q = (now * 1000 - f.t0) / 1600; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; cx.globalAlpha = 1 - q; cx.font = '24px serif'; cx.fillText(f.e, f.x * W + Math.cos(a) * q * 90, f.y * H + Math.sin(a) * q * 90 - q * 30); } cx.globalAlpha = 1; });
  if (night) { cx.fillStyle = 'rgba(10,10,40,0.18)'; cx.fillRect(0, 0, W, H); }
  cityUI.raf = requestAnimationFrame(cityLoop);
}
