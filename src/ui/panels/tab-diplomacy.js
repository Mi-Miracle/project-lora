// ВКЛАДКА «ДИПЛОМАТІЯ»: ваші війни й мирні пропозиції, союзи, санкції, відносини, конфлікти у світі.
TAB_FN.dipl = function () {
  const P = G.player, en = G.enemiesOf(P);
  const wars = en.map(e => { const w = G.wars.get(G.warKey(P, e)); const sc = G.warScore(P, e); const occ = G.ter.filter(t => t.owner === e && t.ctrl === P).length, lost = G.ter.filter(t => t.owner === P && t.ctrl === e).length;
    return `<div class="card"><div class="row"><b>${nlink(e)}</b><span>${Math.max(0, G.day - w.start)} дн.</span></div><div class="row small"><span>Оцінка війни</span><span class="${sc > 0 ? 'g' : 'r'}">${(sc * 100).toFixed(0)}</span></div><div class="bar"><i style="width:${50 + sc * 50}%;background:${sc > 0 ? '#4cd28a' : '#ff5d5d'}"></i></div>
    <div class="row small"><span>Ви контролюєте їхніх регіонів: ${occ}</span><span>Втрачено: ${lost}</span></div>
    <div class="btns"><button class="pri" onclick="openConf(${e})">🏛 ${t_('Мирна конференція')}</button><button onclick="peace(${e},'white')">🕊 Білий мир</button>${occ ? `<button onclick="peace(${e},'cede')">📜 Вимагати регіони</button>` : ''}<button onclick="peace(${e},'mutual')">⚖ Статус-кво</button></div></div>`; }).join('');
  const als = G.alliances.filter(a => a.m.has(P)).map(a => `<div class="card"><b>${esc(a.name)}</b><div class="small mut">${[...a.m].filter(x => x !== P && nat(x).alive).map(x => esc(nat(x).name)).join(', ')}</div></div>`).join('');
  const list = G.N.filter(x => x.alive && x.id !== P).map(x => ({ id: x.id, r: G.rel[P][x.id] }));
  const fr = list.slice().sort((a, b) => b.r - a.r).slice(0, 10), fo = list.slice().sort((a, b) => a.r - b.r).slice(0, 10);
  const sanc = [...G.sanctions].filter(k => k.startsWith(P + '>')).map(k => +k.split('>')[1]), sancOn = [...G.sanctions].filter(k => k.endsWith('>' + P)).map(k => +k.split('>')[0]);
  const conf = G.conflicts.filter(c => [...G.wars.values()].some(w => w.cid === c.id));
  const sub = curSub('dipl', 'wars');
  let h = subnav('dipl', [['wars', 'Війни'], ['blocs', 'Блоки'], ['allies', 'Союзи й санкції'], ['rel', 'Відносини'], ['agents', 'Агенти'], ['world', 'Конфлікти світу']]);
  if (sub === 'blocs') h += blocsTab();
  else if (sub === 'agents') h += agentsTab();
  else if (sub === 'wars') h += wars || '<div class="mut">Ви не воюєте.</div>';
  else if (sub === 'allies') h += (als || '<div class="mut">Немає союзів</div>') + `<div class="grp">Санкції</div><div class="small">Ви запровадили проти: ${sanc.map(x => esc(nat(x).name)).join(', ') || '—'}</div><div class="small" style="margin-top:4px">Проти вас: <span class="r">${sancOn.map(x => esc(nat(x).name)).join(', ') || '—'}</span></div>`;
  else if (sub === 'rel') h += `<div class="grp">Найкращі</div>${fr.map(x => `<div class="row"><span>${nlink(x.id)}</span><span class="g">${x.r.toFixed(0)}</span></div>`).join('')}<div class="grp">Найгірші</div>${fo.map(x => `<div class="row"><span>${nlink(x.id)}</span><span class="r">${x.r.toFixed(0)}</span></div>`).join('')}`;
  else h += conf.map(c => { const sides = new Set(); [...G.wars.values()].filter(w => w.cid === c.id).forEach(w => { sides.add(w.a); sides.add(w.b); }); return `<div class="card small"><b>${esc(c.name)}</b><div class="mut">${[...sides].map(x => esc(nat(x).name)).join(', ')}</div></div>`; }).join('') || '<div class="mut">Світ у мирі</div>';
  return h + '<div class="mut small" style="margin-top:8px">Оберіть країну на мапі, щоб відкрити дипломатичні дії.</div>';
};
function peace(e, type) { const r = G.act.peace(e, type); hint(r.ok ? '🕊 Мир підписано' : '⚠ ' + r.err, 3500); renderTab(true); renderRight(); }

// ---- міжнародні блоки
function blocAct(fn) { const r = fn(); hint(r && r.ok === false ? '⚠ ' + r.err : '✅ ' + t_('Готово'), 3000); AUD.sfx(r && r.ok === false ? 'bad' : 'good'); renderTab(true); }
function blocsTab() {
  const P = G.player; window._bloc = window._bloc || 'nato'; const B = G.blocs; const b = B[window._bloc];
  let h = `<div class="sub">${Object.values(B).map(x => `<button class="${x.id === b.id ? 'on' : ''}" data-tip="${esc(x.n)} · ${x.m.length} ${t_('членів')}" onclick="_bloc='${x.id}';renderTab(true)">${ico(x.ic)} ${esc((nm => nm.length > 10 ? nm.split(' ')[0] : nm)(t_(x.n)))}${x.m.includes(P) ? ' ✓' : ''}</button>`).join('')}</div>`;
  const member = b.m.includes(P), lead = G.blocLeader(b); const RULE = { consensus: 'консенсус', leader: 'вирішальне слово лідера', majority: 'більшість', unanimity_sanctions: 'кваліфікована більшість (санкції й вступ — одностайно)' };
  h += `<div class="card"><div class="row"><b>${ico(b.ic)} ${esc(b.n)}</b><span class="tag ${member ? 'al' : ''}">${member ? t_('ви член') : t_('не член')}</span></div>
    <div class="small mut">${esc(t_(b.council))}${b.parl ? ' · ' + esc(t_(b.parl)) : ''} · ${t_('рішення')}: ${t_(RULE[b.rule])} · ${t_('штаб-квартира')}: ${esc(nat(b.hq).name)}${lead != null ? ' · ' + t_('лідер') + ': ' + esc(nat(lead).name) : ''}</div>
    <div class="small" style="margin-top:4px">${b.m.slice(0, 40).map(x => `<span class="tag" style="border-color:${nat(x).color}">${esc(nat(x).a3)}</span>`).join('')}</div></div>`;
  if (!member) { const pend = b.agenda.find(a => a.kind === 'join' && a.target === P);
    h += pend ? `<div class="card y">${t_('Вашу заявку розглядають до')} ${G.dateStr(pend.due)}: ${Object.values(pend.votes).filter(v => v > 0).length} ${t_('за')}, ${Object.values(pend.votes).filter(v => v < 0).length} ${t_('проти')}</div>`
      : `<div class="btns"><button data-tip="${t_('Звернення до блоку по зброю й гроші. Лідер має бути в штаб-квартирі; члени голосують за рівнем відносин')}" onclick="blocAct(()=>G.blocPropose('${b.id}','aid',G.player,G.player))">📦 ${t_('Попросити пакет допомоги')}</button><button class="pri" data-tip="${t_('Лідер має бути в штаб-квартирі блоку. Члени голосують за вашим рівнем відносин; військові блоки неохоче приймають державу у війні з ядерною державою.')}" onclick="blocAct(()=>G.blocApply('${b.id}',G.player))">📝 ${t_('Подати заявку на вступ')}</button></div>`; }
  else { const tg = sel && sel.type === 't' ? G.ter[sel.id].ctrl : null;
    h += `<div class="grp">${t_('Внести пропозицію')}</div><div class="small mut">${t_('Ціль — держава, обрана на мапі')}: ${tg != null ? esc(nat(tg).name) : '—'}</div><div class="btns">
      ${['aid', 'sanction', 'presence'].map(k => `<button ${tg == null ? 'disabled' : ''} data-tip="${esc(t_(G.blocKinds[k].d))}" onclick="blocAct(()=>G.blocPropose('${b.id}','${k}',${tg},G.player))">${esc(t_(G.blocKinds[k].n))}</button>`).join('')}
      ${['defense', 'trade'].concat(b.id === 'opec' ? ['oilcut'] : []).map(k => `<button data-tip="${esc(t_(G.blocKinds[k].d))}" onclick="blocAct(()=>G.blocPropose('${b.id}','${k}',null,G.player))">${esc(t_(G.blocKinds[k].n))}</button>`).join('')}</div>`; }
  h += `<div class="grp">${t_('Порядок денний')}</div>` + (b.agenda.length ? b.agenda.map(it => { const yes = Object.values(it.votes).filter(v => v > 0).length, no = Object.values(it.votes).filter(v => v < 0).length, my = it.votes[P];
    return `<div class="card small"><div class="row"><b>${esc(t_(G.blocKinds[it.kind].n))}${it.target != null ? ': ' + esc(nat(it.target).name) : ''}</b><span>${t_('до')} ${G.dateStr(it.due)}</span></div><div>${yes} ${t_('за')} · ${no} ${t_('проти')} · ${b.m.length - yes - no} ${t_('утрим./не голосували')}</div>
      ${member ? `<div class="btns">${[[1, '👍 ' + t_('За')], [0, '✋ ' + t_('Утриматись')], [-1, '👎 ' + t_('Проти')]].map(([v, l]) => `<button class="${my === v ? 'on' : ''}" onclick="blocAct(()=>G.blocVote('${b.id}',${it.id},G.player,${v}))">${l}</button>`).join('')}</div>` : ''}</div>`; }).join('') : `<div class="mut small">${t_('Порожньо')}</div>`);
  if (b.hist.length) h += `<div class="grp">${t_('Ухвалені й відхилені рішення')}</div>` + b.hist.slice(0, 8).map(x => `<div class="row small"><span>${x.ok ? '✅' : '❌'} ${esc(t_(G.blocKinds[x.kind].n))}${x.target != null ? ': ' + esc(nat(x.target).name) : ''}</span><span>${G.dateStr(x.d)}</span></div>`).join('');
  return h;
}

// ---- МИРНА КОНФЕРЕНЦІЯ
let conf = null;
function openConf(e) {
  const P = G.confPrepare(G.player, e); conf = { e, P, terms: { regs: P.regs, give: {}, repar: { from: e, amt: 0, years: 3 }, dmz: false, guar: null, med: null, _budget: P.budget } };
  P.regs.forEach(r => conf.terms.give[r.i] = r.ctrl); renderConf();
}
function confSet(k, v) { const T = conf.terms; if (k === 'give') T.give[v[0]] = v[1]; else if (k === 'reparAmt') T.repar.amt = +v; else if (k === 'reparYears') T.repar.years = +v; else if (k === 'reparFrom') T.repar.from = +v; else T[k] = v; renderConf(); }
function renderConf() {
  const { e, P, terms } = conf, me = G.player; const ev = G.confCost(me, e, terms); const pctv = Math.min(100, Math.max(0, ev.cost / Math.max(1, ev.budget) * 100));
  let h = `<h2>🏛 ${t_('Мирна конференція')}: ${esc(nat(me).name)} — ${esc(nat(e).name)}</h2><div class="mut small">${t_('Складіть пакет умов. Ворог погодиться, якщо поступки вкладаються в межу, що залежить від ходу війни, виснаження й тиску на нього. Ваші власні поступки розширюють межу.')}</div>`;
  h += `<div class="card"><div class="row"><span>${t_('Поступки, яких ви вимагаєте')}</span><b class="${ev.ok ? 'g' : 'r'}">${ev.cost} / ${ev.budget}</b></div><div class="bar"><i style="width:${pctv}%;background:${ev.ok ? '#3c3' : '#d33'}"></i></div><div class="small mut">${t_('Оцінка війни')}: ${(P.score * 100).toFixed(0)} · ${t_('виснаження ворога')}: ${Math.round((nat(e).warExh || 0) * 100)}%</div></div>`;
  h += `<div class="grp">${t_('Спірні регіони')}</div>` + (P.regs.length ? `<table class="small">${P.regs.map(r => { const to = terms.give[r.i]; return `<tr><td>${esc(regName(r.i))}<div class="mut">${t_('належить')}: ${esc(nat(r.owner).name)} · ${t_('контроль')}: ${esc(nat(r.ctrl).name)}</div></td><td style="white-space:nowrap"><button class="small ${to === me ? 'on' : ''}" onclick="confSet('give',[${r.i},${me}])">${esc(nat(me).a3)}</button><button class="small ${to === e ? 'on' : ''}" onclick="confSet('give',[${r.i},${e}])">${esc(nat(e).a3)}</button></td></tr>`; }).join('')}</table>` : `<div class="mut small">${t_('Немає')}</div>`);
  h += `<div class="grp">${t_('Репарації')}</div><div class="row small"><span>${t_('Хто платить')}</span><span><button class="small ${terms.repar.from === e ? 'on' : ''}" onclick="confSet('reparFrom',${e})">${esc(nat(e).name)}</button><button class="small ${terms.repar.from === me ? 'on' : ''}" onclick="confSet('reparFrom',${me})">${t_('ми')}</button></span></div>
    <div class="row small"><span>${t_('Сума на рік')}: <b>${money(terms.repar.amt)}</b></span><input type="range" min="0" max="${Math.max(1, Math.round(nat(terms.repar.from).agg.gdp * 0.03))}" step="0.5" value="${terms.repar.amt}" onchange="confSet('reparAmt',this.value)"></div>
    <div class="row small"><span>${t_('Років')}: <b>${terms.repar.years}</b></span><input type="range" min="1" max="10" value="${terms.repar.years}" onchange="confSet('reparYears',this.value)"></div>`;
  h += `<div class="grp">${t_('Безпека')}</div><label class="row small"><span>🚧 ${t_('Демілітаризована зона в спірних регіонах і перемир\'я на 5 років')}</span><input type="checkbox" ${terms.dmz ? 'checked' : ''} onchange="confSet('dmz',this.checked)"></label>`;
  h += `<div class="row small"><span>🛡 ${t_('Гарант безпеки (оборонний союз)')}</span><select onchange="confSet('guar',this.value===''?null:+this.value)"><option value="">${t_('немає')}</option>${P.guarantors.map(g => `<option value="${g}" ${terms.guar === g ? 'selected' : ''}>${esc(nat(g).name)}</option>`).join('')}</select></div>`;
  h += `<div class="row small"><span>🤝 ${t_('Посередник (+15 до межі, гонорар 0.4% ВВП)')}</span><select onchange="confSet('med',this.value===''?null:+this.value)"><option value="">${t_('немає')}</option>${P.mediators.map(g => `<option value="${g}" ${terms.med === g ? 'selected' : ''}>${esc(nat(g).name)}</option>`).join('')}</select></div>`;
  h += `<div class="btns"><button class="pri" ${ev.ok ? '' : 'disabled'} onclick="signConf()">✍ ${t_('Підписати мир')}</button><button onclick="closeModal();conf=null">${t_('Закрити')}</button></div>`;
  openModal(h); $('#mbox').classList.add('wide');
}
function signConf() { const r = G.act.confSign(conf.e, conf.terms); hint(r.ok ? '🕊 ' + t_('Мир підписано') : '⚠ ' + t_(r.err), 4000); if (r.ok) { closeModal(); conf = null; } renderTab(true); renderRight(); renderTop(); }
