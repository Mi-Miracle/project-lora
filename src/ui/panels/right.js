// ПРАВА ПАНЕЛЬ: інформація про вибраний регіон/державу, армію чи флот + дії.
function selectNation(i) { const n = nat(i); sel = { type: 't', id: n.home }; const c = D.regions[n.home].c; focusLonLat(c[0], c[1], Math.max(view.s, 5)); renderRight(); }
function renderRight(soft) {
  const el = $('#right'); document.body.classList.toggle('rp', !!(sel && G)); if (!sel || !G) { el.style.display = 'none'; return; }
  if (soft && el.contains(document.activeElement) && /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  el.style.display = 'block'; const st = el.scrollTop;
  const h = sel.type === 'a' ? armyPanel() : sel.type === 'f' ? fleetPanel() : terrPanel(sel.id);
  if (!h) { sel = null; el.style.display = 'none'; return; }
  const html = `<div style="text-align:right;margin:-4px -4px 0 0"><button onclick="sel=null;renderRight()" title="Закрити">✕</button></div>` + h; if (soft && html === el._last) return; el.innerHTML = html; el._last = html; el.scrollTop = st;
}
function terrPanel(i) {
  const P = G.player, t = G.ter[i], R = D.regions[i], o = nat(t.owner), c = nat(t.ctrl); const isMe = t.owner === P; const rel = P >= 0 ? G.rel[P][t.owner] : 0;
  const tags = [];
  if (G.atWar(P, t.ctrl)) tags.push('<span class="tag war">⚔ війна з вами</span>'); if (G.allied(P, t.owner) && !isMe) tags.push('<span class="tag al">🛡 союзник</span>'); if (o.nuke) tags.push('<span class="tag nk">☢ ядерна</span>');
  Object.values(G.blocs || {}).forEach(b => { if (b.m.includes(t.owner)) tags.push(`<span class="tag" data-tip="${esc(b.n)}">${ico(b.ic)} ${esc(b.n.length > 12 ? b.n.split(' ').map(w => w[0]).join('') : b.n)}</span>`); });
  if (G.sanctions.has(P + '>' + t.owner)) tags.push('<span class="tag war">ваші санкції</span>'); if (G.sanctions.has(t.owner + '>' + P)) tags.push('<span class="tag war">санкції проти вас</span>');
  const _fv = window.fogVis ? fogVis() : null; const armiesHere = G.armies.filter(a => a.t === i && !(a.mv && a.mv.sea) && (!_fv || _fv[i] || a.n === G.player)); const cities = D.cities.filter(x => x.reg === i).sort((a, b) => b.pop - a.pop);
  const topRes = RES.filter(r => t.prod[r] > 0).map(r => ({ r, v: t.prod[r] / Math.max(1e-9, G.W_prod0[r]) })).sort((a, b) => b.v - a.v).slice(0, 5);
  let h = `<h2>${esc(regName(i))}</h2><div class="mut">${ndot(t.owner)}${esc(o.name)}${t.ctrl !== t.owner ? ` · <span class="r">контроль: ${esc(c.name)}</span>` : ''}</div><div>${tags.join('')}</div>`;
  if (t.occ) h += `<div class="card"><div class="row"><span>Наступ: ${esc(nat(t.occ.by).name)}</span><b class="r">${t.occ.p.toFixed(0)}%</b></div><div class="bar"><i style="width:${t.occ.p}%;background:#ff5d5d"></i></div></div>`;
  h += `<div class="grp">Регіон</div><div class="row"><span>Рельєф</span><span>${G.TERRAIN[R.t].n}</span></div><div class="row"><span>Площа</span><span>${(t.area / 1000).toFixed(1)} тис. км²</span></div><div class="row"><span>Населення</span><span>${popM(t.pop)}</span></div><div class="row"><span>Економіка</span><span>${money(t.gdp)}</span></div>
  ${t.dmg > 0.01 ? `<div class="row"><span>Руйнування</span><span class="r">${pct(t.dmg, 0)}</span></div>` : ''}${t.fort > 0.03 ? `<div class="row"><span>Укріплення</span><span class="y">${pct(t.fort, 0)}</span></div>` : ''}${t.integ < 0.99 ? `<div class="row"><span>Інтеграція</span><span class="y">${pct(t.integ, 0)}</span></div>` : ''}
  ${topRes.length ? `<div class="small mut">Частка світу: ${topRes.map(x => RI[x.r].ic + ' ' + (x.v * 100).toFixed(x.v > 0.01 ? 1 : 2) + '%').join(' · ')}</div>` : ''}
  ${cities.length ? `<div class="small mut">Міста: ${cities.slice(0, 6).map(x => esc(x.n) + (x.cap ? ' ★' : '') + ' (' + (x.pop >= 1000 ? (x.pop / 1000).toFixed(1) + ' млн' : x.pop + ' тис.') + ')').join(', ')}</div>` : ''}
  <div class="small mut">Порти: ${R.p.length ? [...new Set(R.p.map(p => D.sea.nodes[p[0]].n))].slice(0, 4).join(', ') : 'немає виходу до моря'}</div>
  <div class="grp">Держава: ${esc(o.name)}</div><div class="row"><span>ВВП</span><span>${money(o.agg.gdp)} <span class="${o.growth >= 0 ? 'g' : 'r'}">${sgnPct(o.growth)}</span></span></div><div class="row"><span>Стабільність</span><span>${o.stab.toFixed(0)}</span></div>
  <div class="row"><span>Армія</span><span>${people(o.agg.troops || 0)} · якість ${o.q.toFixed(2)}</span></div><div class="row"><span>Флот</span><span>${G.shipsOf(o.id).toFixed(0)} кор.</span></div>
  ${o.ai ? `<div class="row"><span>Курс</span><span class="small">${{ west: 'західний', east: 'східний', neutral: 'нейтральний' }[o.ai.bloc] || ''} · ${o.ai.aggr > 0.3 ? 'агресивний' : o.ai.aggr > 0.1 ? 'жорсткий' : 'мирний'}</span></div>` : ''}
  ${G.enemiesOf(t.owner).length ? `<div class="row"><span>Воює з</span><span class="r">${G.enemiesOf(t.owner).map(e => esc(nat(e).name)).join(', ')}</span></div>` : ''}`;
  if (G.pc >= 0) h += coRegionActions(i);
  h += leaderRegionBlock(i); if (window.agentRegionBlock) h += agentRegionBlock(i);
  if (P < 0) { } else if (!isMe) {
    const tk = G.warKey(P, t.owner), war = G.atWar(P, t.owner);
    h += `<div class="grp">Відносини з вами</div><div class="row"><span>${rel > 30 ? 'дружні' : rel > -30 ? 'нейтральні' : 'ворожі'}</span><b class="${rel >= 0 ? 'g' : 'r'}">${rel.toFixed(0)}</b></div><div class="bar"><i style="width:${50 + rel / 2}%;background:${rel >= 0 ? '#4cd28a' : '#ff5d5d'}"></i></div>
    <div class="btns"><button onclick="dact('improve',${t.owner})">🤝 Дипмісія</button><button onclick="dact('treaty',${t.owner})" ${war ? 'disabled' : ''}>${G.treaties.has(tk) ? '❌ Розірвати ЗВТ' : '📑 Вільна торгівля'}</button>
    <button onclick="dact('sanction',${t.owner})">${G.sanctions.has(P + '>' + t.owner) ? '✅ Зняти санкції' : '🚫 Санкції'}</button><button onclick="dact('access',${t.owner})" ${war ? 'disabled' : ''}>${G.access.has(P + '>' + t.owner) ? 'Скасувати доступ' : '🛂 Військовий доступ'}</button>
    <button onclick="dact('requestAid',${t.owner})" ${war ? 'disabled' : ''} data-tip="Попросити зброю й гроші. Лише під час особистого візиту лідера; шанс залежить від відносин і ваших спільних ворогів">📦 Попросити допомогу</button>
    <button onclick="dact('alliance',${t.owner})" ${war ? 'disabled' : ''}>${G.allied(P, t.owner) ? (G.alliances.some(a => a.m.size === 2 && a.m.has(P) && a.m.has(t.owner)) ? 'Розірвати союз' : '🛡 Союзники') : '🛡 Запропонувати союз'}</button></div>
    <div class="btns"><span class="mut small" style="align-self:center">Допомога:</span>${[1, 5, 20].map(v => `<button onclick="aid(${t.owner},${v})">$${v} млрд</button>`).join('')}</div>
    <div class="btns">${G.atWar(P, t.ctrl) ? `<button class="dang" onclick="tab='army';subtab.army='strike';renderTabs();renderTab(true);$('#left').classList.remove('hide')">🎯 Удар по регіону</button>` : ''}${war ? `<button onclick="peace(${t.owner},'white')">🕊 Запропонувати мир</button>` : `<button class="dang" onclick="confirmWar(${t.owner})">⚔ Оголосити війну</button>`}</div>`;
  } else {
    const p = t.pol; const pr = D.devPriorities;
    h += `<div class="btns"><button class="pri" onclick="tab='build';subtab.build='new';renderTabs();renderTab(true);$('#left').classList.remove('hide')">🏗 Будувати тут</button><button onclick="tab='army';subtab.army='land';renderTabs();renderTab(true);$('#left').classList.remove('hide')">🪖 Мобілізувати</button><button onclick="startLinkFrom(${i})">🚆 Маршрут звідси</button></div>
    <div class="grp">Налаштування регіону</div>
    <div class="sl"><div class="lab"><span>Податки регіону (від загальних)</span><b>${p.tax > 0 ? '+' : ''}${(p.tax * 100).toFixed(0)} п.п.</b></div><input type="range" min="-0.1" max="0.1" step="0.01" value="${p.tax}" onchange="G.ter[${i}].pol.tax=+this.value;renderRight()"><div class="mut small">Пільги прискорюють зростання регіону, надбавки — наповнюють бюджет.</div></div>
    <label class="row" style="cursor:pointer"><span>Спеціальна економічна зона (+зростання, −30% податків, будівництво −20%)</span><input type="checkbox" ${p.sez ? 'checked' : ''} onchange="G.ter[${i}].pol.sez=this.checked;renderRight()"></label>
    <label class="row" style="cursor:pointer"><span>🤖 Губернатор (автоматичне будівництво)</span><input type="checkbox" ${p.gov ? 'checked' : ''} onchange="G.ter[${i}].pol.gov=this.checked;renderRight()"></label>
    <div class="row"><span>Спеціалізація</span><select onchange="G.ter[${i}].pol.prio=this.value||null"><option value="">як у держави</option>${Object.entries(pr).map(([k, v]) => `<option value="${k}" ${p.prio === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>`;
  }
  const bl = Object.entries(t.bld); const cons = G.constructions.filter(c => c.t === i);
  if (bl.length || cons.length) h += `<div class="grp">Будівлі</div>` + bl.map(([k, l]) => `<div class="row small"><span>${ico(D.buildings[k].ic)} ${esc(D.buildings[k].n)}</span><b>рів. ${l}</b></div>`).join('') + cons.map(c => `<div class="row small"><span class="mut">🏗 ${esc(D.buildings[c.type].n)}</span><span class="mut">${c.done - G.day} дн.</span></div>`).join('');
  if (t.bsup || t.bfort || t.shield) h += `<div class="small mut">Бонуси: ${t.bsup ? 'постачання +' + pct(t.bsup, 0) + ' ' : ''}${t.bfort ? 'укріплення +' + pct(t.bfort, 0) + ' ' : ''}${t.shield ? 'ППО ' + pct(t.shield, 0) : ''}</div>`;
  if (armiesHere.length) h += `<div class="grp">Війська в регіоні</div>` + armiesHere.map(a => `<div class="row" style="cursor:pointer" onclick="sel={type:'a',id:${a.id}};renderRight()"><span>${ndot(a.n)}${esc(a.name)} ${a.stance === 'attack' ? '➤' : ''}</span><span class="${G.atWar(P, a.n) ? 'r' : ''}">${people(a.k)}</span></div>`).join('');
  return h;
}
function dact(k, x) { const r = G.act[k](x); hint(r && r.ok === false ? '⚠ ' + r.err : (r && r.msg) || 'Готово', 3000); renderRight(); renderTab(true); }
function aid(x, v) { G.act.aid(x, v); hint(`Надіслано $${v} млрд`, 2000); renderRight(); }
function confirmWar(x) {
  const P = G.player, o = nat(x); const allies = new Set(); G.alliances.forEach(al => { if (al.m.has(x) && !al.m.has(P)) al.m.forEach(m => { if (m !== x && nat(m).alive) allies.add(m); }); });
  const myP = G.nationPower(P), thP = G.nationPower(x); let alP = 0; allies.forEach(a => alP += G.nationPower(a));
  const land = G.ter.some((t, i) => t.ctrl === P && D.regions[i].nb.some(j => G.ter[j].ctrl === x));
  openModal(`<h2>⚔ Оголосити війну: ${esc(o.name)}?</h2><div class="row"><span>Ваша бойова сила</span><b>${myP.toFixed(0)}</b></div><div class="row"><span>Їхня сила</span><b>${thP.toFixed(0)}</b></div>
  ${allies.size ? `<div class="card r">Союзники можуть вступити у війну: ${[...allies].map(a => esc(nat(a).name)).join(', ')} (сумарна сила ${alP.toFixed(0)})</div>` : ''}${o.nuke ? '<div class="card r">☢ Ядерна держава. Повномасштабна війна з нею — екстремальний ризик.</div>' : ''}
  ${!land ? '<div class="card y">Немає спільного кордону: знадобиться морський десант або військовий доступ через треті країни.</div>' : ''}
  <div class="mut">Наслідки: падіння відносин у світі, можливі санкції, торгівля з ворогом припиниться, протоки під контролем ворога закриються для вас.</div>
  <div class="btns" style="margin-top:12px"><button class="dang" onclick="{const r=G.act.declareWar(${x});if(r&&r.ok===false)hint('⚠ '+r.err,4000);}closeModal();mapDirty=true;renderRight();renderTab(true)">Оголосити війну</button><button onclick="closeModal()">Скасувати</button></div>`);
}
function armyPanel() {
  const a = G.armies.find(x => x.id === sel.id); if (!a) return ''; const P = G.player, mine = a.n === P, n = nat(a.n);
  let h = `<h2>${ndot(a.n)}${esc(a.name)}</h2><div class="mut">${esc(n.name)} · ${esc(regName(a.t))} · ${G.TERRAIN[D.regions[a.t].t].n}</div>
  <div class="row"><span>Чисельність</span><b>${people(a.k)}</b></div><div class="row"><span>Організованість</span><span>${pct(a.org, 0)}</span></div><div class="bar"><i style="width:${a.org * 100}%"></i></div>
  <div class="row"><span>Постачання</span><span>${pct(a.sup, 0)} → ${pct(a.supTarget || a.sup, 0)}</span></div><div class="bar"><i style="width:${a.sup * 100}%;background:${a.sup < 0.5 ? '#ff5d5d' : '#4cd28a'}"></i></div>
  <div class="row"><span>Якість</span><span>${n.q.toFixed(2)}</span></div><div class="row"><span>Бойова сила</span><b>${G.armyPower(a).toFixed(0)}</b></div><div class="row"><span>Режим</span><span>${a.stance === 'attack' ? '➤ наступ (штурм)' : '🛡 оборона (позиційні бої)'}</span></div>
  ${compBlock(a, mine)}${genBlock(a, mine)}
  ${a.train > 0 ? `<div class="row"><span>Підготовка</span><span class="y">${a.train} дн.</span></div>` : ''}${a.mv ? `<div class="row"><span>Наказ</span><span>${a.mv.sea ? '⚓ морем' : '🚚 марш'} → ${esc(regName(a.mv.dst))}</span></div>` : ''}`;
  if (mine) {
    const here = G.armies.filter(x => x.n === P && x.t === a.t && x.id !== a.id && !x.mv);
    h += `<div class="card small">Рух: <b>ПКМ</b> по регіону (суходолом) або <b>Shift+ПКМ</b> (морем).</div>
    <div class="btns"><button onclick="orderMode='land';hint('Клікніть ціль на мапі')">🚚 Рух…</button><button onclick="orderMode='sea';hint('Клікніть ціль для морського перекидання')">⚓ Морем…</button><button onclick="armyAct('stop')">⏹ Стоп</button>
    <button class="${a.stance === 'attack' ? 'on' : ''}" onclick="armyAct('attack')">➤ Штурм</button><button class="${a.stance !== 'attack' ? 'on' : ''}" onclick="armyAct('hold')">🛡 Оборона</button>
    <button class="${a.auto ? 'on' : ''}" onclick="armyAct('auto')">🤖 Авто</button><button onclick="armyAct('split')">✂ Розділити</button>${here.length ? `<button onclick="armyAct('merge')">🔗 Об'єднати (${here.length})</button>` : ''}
    <button onclick="armyAct('home')">🏠 Додому</button><button class="dang" onclick="armyAct('disband')">Розформувати</button></div>
    <div class="mut small">Штурм — висока інтенсивність боїв і втрат, просування вперед. Оборона — позиційні бої з малими втратами. Авто — армія сама обороняє фронт і наступає за переваги.</div>`;
  }
  return h;
}
function compBlock(a, mine) {
  if (!G.armyComp) return ''; const c = G.armyComp(a), TY = D.armyTypes, TP = D.armyTemplates, cur = G.tplOf(a); const ks = Object.keys(TY).filter(k => c[k] > 0.004);
  const P = G.player, enemy = a.n !== P && G.atWar(a.n, P), known = a.n === P || !enemy || (nat(P).recon && nat(P).recon[a.n] > G.day) || (G.hasRecon && G.hasRecon(P));
  let h = `<div class="comp"><div class="row"><span>${t_('Склад')}</span><b>${known ? TP[cur].ic + ' ' + esc(TP[cur].n) : '❓ ' + t_('невідомо — потрібна розвідка')}</b></div>`;
  if (known) h += `<div class="compbar">${ks.map(k => `<i style="width:${c[k] * 100}%;background:${TY[k].col}" data-tip="${esc(TY[k].n)} — ${Math.round(c[k] * 100)}%. ${esc(TY[k].d)}"></i>`).join('')}</div>
  <div class="complg">${ks.map(k => `<span><i style="background:${TY[k].col}"></i>${ico(TY[k].ic)} ${esc(TY[k].n)} ${Math.round(c[k] * 100)}%</span>`).join('')}</div>`;
  const st = G.vetStars(a); h += `<div class="row small"><span>${t_('Досвід')}</span><span class="y">${st ? st + ' ' : ''}${Math.round((a.xp || 0) * 100)}%</span></div>`;
  const sn = G.seasonName ? G.seasonName(a.t) : ''; if (sn) h += `<div class="row small"><span>${t_('Сезон')}</span><span>${sn}${G.season(a.t).mud ? ' · ' + t_('техніка в наступі слабша') : ''}</span></div>`;
  const n = nat(a.n); if (mine && n._armSat != null && n._armSat < 0.9 && c.mbt + c.ifv > 0.15) h += `<div class="mut small r">⚠ ${t_('Бракує бронетехніки: танкові частини на')} ${Math.round(n._armSat * 100)}%</div>`;
  if (a.retrain) h += `<div class="row"><span>${t_('Переформування')}</span><span class="y">→ ${esc(a.retrain.c ? t_('власний склад') : TP[a.retrain.to].n)} · ${a.retrain.until - G.day} ${t_('дн.')}</span></div>`;
  else if (mine) h += `<div class="btns"><button class="pri" onclick="openCompEditor(${a.id})">✏ ${t_('Змінити склад і техніку')}</button></div>`;
  return h + '</div>';
}
function genBlock(a, mine) {
  if (!G.generalOf) return ''; const g = G.generalOf(a), TR = D.genTraits;
  let h = `<div class="grp">🎖 ${t_('Командувач')}</div>` + (g ? `<div class="small gen-row" data-tip="${esc(t_(TR[g.trait].d))}">${avatar('gen' + g.id + g.name, 40, { mil: 1, fem: false })}<div><b>${esc(g.name)}</b> <span class="y">${'★'.repeat(g.skill)}</span> · ${ico(TR[g.trait].ic)} ${esc(t_(TR[g.trait].n))} — <span class="mut">${esc(t_(TR[g.trait].d))}</span></div></div>` : `<div class="small mut">${t_('немає')}</div>`);
  if (mine) { const gens = G.gensOf(a.n).sort((x, y) => y.skill - x.skill);
    h += `<select class="gsel" onchange="genAssign(${a.id}, this.value)"><option value="">— ${t_('без командувача')} —</option>${gens.map(x => `<option value="${x.id}" ${g && g.id === x.id ? 'selected' : ''}>${esc(x.name)} ${'★'.repeat(x.skill)} · ${esc(t_(TR[x.trait].n))}${x.army != null && x.army !== a.id ? ' (' + t_('зайнятий') + ')' : ''}</option>`).join('')}</select>`; }
  return h;
}
function genAssign(aid, v) { const r = G.act.assignGeneral(aid, v === '' ? null : +v); if (r && r.ok === false) hint('⚠ ' + r.err, 2500); renderRight(); }
function armyTpl(k) { const r = G.setArmyTemplate(sel.id, k); if (r && r.ok === false) hint('⚠ ' + r.err, 2500); else hint('🪖 ' + t_('Переформування почалось (30 дн.)'), 2000); renderRight(); }
function armyAct(k) {
  const a = G.armies.find(x => x.id === sel.id); if (!a) return;
  if (k === 'stop') a.mv = null; if (k === 'auto') a.auto = !a.auto; if (k === 'attack') a.stance = 'attack'; if (k === 'hold') a.stance = 'hold';
  if (k === 'split' && a.k > 4) { const b = G.newArmy(a.n, a.t, a.k / 2, a.name + '-Б'); b.comp = Object.assign({}, G.armyComp(a)); b.org = a.org; b.sup = a.sup; b.auto = a.auto; a.k /= 2; }
  if (k === 'merge') { G.armies.filter(x => x.n === a.n && x.t === a.t && x.id !== a.id && !x.mv).forEach(x => { a.org = (a.org * a.k + x.org * x.k) / (a.k + x.k); const ca = G.armyComp(a), cx = G.armyComp(x); for (const q in ca) ca[q] = (ca[q] * a.k + (cx[q] || 0) * x.k) / (a.k + x.k); a.k += x.k; x.dead = true; }); G.armies = G.armies.filter(x => !x.dead); }
  if (k === 'home') { const r = G.orderMove(a, nat(a.n).home); if (!r.ok) hint('⚠ ' + r.err, 2500); }
  if (k === 'disband') { G.armies = G.armies.filter(x => x.id !== a.id); sel = null; }
  renderRight(); renderTab(true);
}
function fleetPanel() {
  const f = G.fleets.find(x => x.id === sel.id); if (!f) return ''; const mine = f.n === G.player, n = nat(f.n);
  return `<h2>${ndot(f.n)}${esc(f.name)}</h2><div class="mut">${esc(n.name)} · ${esc(D.sea.nodes[f.node].n)}</div><div class="row"><span>Кораблі</span><b>${f.s.toFixed(0)}</b></div><div class="row"><span>Організованість</span><span>${pct(f.org, 0)}</span></div><div class="row"><span>Якість</span><span>${n.navQ.toFixed(2)}</span></div>
  ${f.mv ? `<div class="row"><span>Рух</span><span>→ ${esc(D.sea.nodes[f.mv.nodes[f.mv.nodes.length - 1]].n)}</span></div>` : ''}
  ${mine ? `<div class="card small">ПКМ по морю — перемістити. Флот у вузлі блокує ворожу торгівлю й захищає ваші маршрути.</div><div class="btns"><button onclick="orderMode='fleet';hint('Клікніть точку в морі')">⛵ Рух…</button><button onclick="fleetAct('home')">🏠 На базу</button><button class="${f.auto ? 'on' : ''}" onclick="fleetAct('auto')">🤖 Авто</button></div>` : ''}`;
}
function fleetAct(k) { const f = G.fleets.find(x => x.id === sel.id); if (!f) return; if (k === 'home') { const p = G.nationPorts(f.n)[0]; if (p) G.orderFleet(f, p[0]); } if (k === 'auto') f.auto = !f.auto; renderRight(); }

window._armyAct = armyAct; window._fleetAct = fleetAct;

// ---- редактор складу армії
let compDraft = null;
function openCompEditor(aid) { const a = G.armies.find(x => x.id === aid); if (!a) return; compDraft = { aid, c: Object.assign({}, G.armyComp(a)) }; renderCompEditor(); }
function compSet(k, v) { if (!compDraft) return; compDraft.c[k] = v / 100; renderCompEditor(k); }
function compTpl(k) { if (!compDraft) return; compDraft.c = Object.assign({}, D.armyTemplates[k].c); renderCompEditor(); }
function renderCompEditor(focusK) {
  const d = compDraft, a = d && G.armies.find(x => x.id === d.aid); if (!a) { closeModal(); return; }
  const TY = D.armyTypes, MD = D.models || {}, n = nat(a.n), L = G.COMP_LIM, q = G.compQuote(a, d.c), cur = G.armyComp(a);
  const nc = q.c; let sum = 0; for (const k in d.c) sum += d.c[k] || 0;
  let h = `<h2>🪖 ${esc(a.name)} — ${t_('склад і техніка')}</h2><div class="mut small">${t_('Тягніть повзунки: частки автоматично зводяться до 100%. Переформування займає час і гроші, армія тимчасово слабша (−20%).')} ${t_('Всього бійців')}: ${Math.round(a.k * 1000).toLocaleString()}</div>`;
  h += `<div class="grp">${t_('Шаблони')}</div><div class="btns tplb">${Object.entries(D.armyTemplates).filter(([k]) => k !== 'mech').map(([k, v]) => `<button onclick="compTpl('${k}')" data-tip="${esc(tplTip(v))}">${ico(v.ic)} ${esc(t_(v.n))}</button>`).join('')}</div>`;
  h += `<div class="compbar">${Object.keys(TY).filter(k => nc[k] > 0.004).map(k => `<i style="width:${nc[k] * 100}%;background:${TY[k].col}"></i>`).join('')}</div><table class="compedit">`;
  for (const k of Object.keys(TY)) {
    const t = TY[k], list = MD[k] || [], mi = n.mq ? Math.min(Math.floor(n.mq[k] || 0), list.length - 1) : 0, m = list[mi], best = G.bestModel ? G.bestModel(n, k) : mi, nb = list[best];
    const men = Math.round(a.k * 1000 * nc[k]); const dl = nc[k] - (cur[k] || 0);
    h += `<tr><td style="width:38%">${ico(t.ic)} <b>${esc(t_(t.n))}</b><div class="mut small">${esc(t_(t.d))}</div></td>
      <td><input type="range" min="${L[k][0] * 100}" max="${L[k][1] * 100}" step="1" value="${Math.round((d.c[k] || 0) * 100)}" oninput="this.nextElementSibling.textContent=this.value+'%'" onchange="compSet('${k}',+this.value)"><b>${Math.round((d.c[k] || 0) * 100)}%</b>
      <div class="small">→ ${Math.round(nc[k] * 100)}% · ${men.toLocaleString()} ${t_('ос.')} ${Math.abs(dl) > 0.005 ? `<span class="${dl > 0 ? 'g' : 'r'}">${dl > 0 ? '+' : ''}${Math.round(dl * 100)}%</span>` : ''}</div>
      ${m ? `<div class="small mut">${ico(m.ic)} ${esc(t_(m.n))} · ⚔${(m.att || 1).toFixed(2)} 🛡${(m.def || 1).toFixed(2)}${best > mi && nb ? ` · <span class="y">${t_('переозброєння на')} ${esc(t_(nb.n))}</span>` : ''}</div>` : ''}</td></tr>`;
  }
  h += `</table>`;
  const mine = a.n === G.player || (G.isHuman && G.isHuman(a.n));
  h += `<div class="row"><span>${t_('Зміна складу')}</span><b>${Math.round(q.ch * 100)}%</b></div><div class="row"><span>${t_('Термін')}</span><b>${q.days} ${t_('дн.')}</b></div><div class="row"><span>${t_('Вартість')}</span><b>${money(q.cost)}</b></div>`;
  h += `<div class="mut small">${t_('Техніку (моделі) держава оновлює сама в міру досліджень і виробництва — прискорити можна у вкладці «Армія → Техніка».')}</div>`;
  h += `<div class="btns">${mine ? `<button class="pri" ${q.ch < 0.02 ? 'disabled' : ''} onclick="applyComp()">✔ ${t_('Переформувати')}</button>` : ''}<button onclick="tab='army';subtab.army='models';renderTabs();renderTab(true);$('#left').classList.remove('hide');closeModal()">⚙ ${t_('Техніка')}</button><button onclick="closeModal()">${t_('Закрити')}</button></div>`;
  openModal(h);
}
function applyComp() { const d = compDraft; if (!d) return; const r = G.setArmyComp(d.aid, d.c); if (r && r.ok === false) { hint('⚠ ' + t_(r.err), 3000); return; } closeModal(); hint('🪖 ' + t_('Переформування почалось') + (r && r.days ? ' (' + r.days + ' ' + t_('дн.') + ')' : ''), 2500); renderRight(); }
