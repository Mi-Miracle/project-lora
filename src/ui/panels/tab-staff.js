// КАРТКИ КОМАНДИ: директори компанії (зверху вкладок компанії) і помічники персонажа/президента (зверху вкладок персонажа).
let stfOpen = {};
function staffCard(kind, k) {
  if (!G || !G.STAFF) return ''; const D0 = G.STAFF[kind][k]; if (!D0) return ''; if (kind === 'co' && !(G.pc >= 0 && G.myCo())) return ''; if (kind === 'ch' && !(G.leader && G.leader.money != null)) return '';
  const s = G.staffOf(kind, k); if (!s) return ''; const key = kind + k, open = stfOpen[key]; const T = G.STAFF_TR[s.trait] || [s.trait, ''];
  const bar = (v, c) => `<div class="bar" style="height:5px"><i style="width:${v}%;background:${c}"></i></div>`;
  const sal = G.staffSalary(s, kind);
  let h = `<div class="mincard stf ${s.auto ? 'auto' : ''} ${s.hired ? '' : 'nohire'}"><div class="min-top" onclick="stfOpen['${key}']=!stfOpen['${key}'];renderTab(true)">${avatar(s.ava, 40, { fem: s.fem })}<div class="min-info"><div class="min-n"><b>${esc(pName(s.name))}</b> <span class="mut small">${D0.ic} ${esc(t_(D0.n))}</span></div>
    ${s.hired ? `<div class="min-st small"><span>${t_('Компетентність')} ${Math.round(s.comp)}</span>${bar(s.comp, '#4fb3ff')}<span>${t_('Лояльність')} ${Math.round(s.loyal)}</span>${bar(s.loyal, s.loyal < 35 ? '#ff6a5a' : '#6ad08a')}</div>` : `<div class="small mut">${t_('Кандидат')} · ${t_('компетентність')} ${Math.round(s.comp)} · ${money(sal)}/${t_('міс.')}</div>`}</div>
    ${s.hired ? `<label class="min-auto" onclick="event.stopPropagation()" data-tip="${t_('ШІ сам виконує дії')}: ${esc(t_(D0.area))}"><input type="checkbox" ${s.auto ? 'checked' : ''} onchange="G.act.staffAuto('${kind}','${k}',this.checked);renderTab(true)"> 🤖 ${t_('Авто')}</label>` : `<button class="pri small" onclick="event.stopPropagation();stfAct('${kind}','${k}','hire')">➕ ${t_('Найняти')}</button>`}<span class="min-tog">${open ? '▴' : '▾'}</span></div>`;
  if (open) {
    h += `<div class="small mut">${t_('Риса')}: <b>${esc(t_(T[0]))}</b> — ${esc(t_(T[1]))} · ${t_('відповідає за')}: ${esc(t_(D0.area))} · ${t_('зарплата')} ${money(sal)}/${t_('міс.')}</div>`;
    if (s.hired) h += `<div class="min-acts">` + G.staffActions(kind, k).map(A => { const e = G.staffCan(kind, k, A[0]); const c = A[3](kind === 'co' ? G.myCo() : G.leader);
      return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A[5]))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="stfAct('${kind}','${k}','${A[0]}')">${A[2]} ${esc(t_(A[1]))}${c ? ' · ' + money(c) : ''}</button>`; }).join('') + (kind === 'ch' ? `<button class="small" onclick="stfAct('${kind}','${k}','dismiss')">🚪 ${t_('Розірвати контракт')}</button>` : '') + `</div>`;
  }
  return h + `</div>`;
}
function stfAct(kind, k, a) { const r = G.act.staffDo(kind, k, a); hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || '?'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
// вбудовуємо картки у відповідні вкладки
setTimeout(() => {
  if (typeof G === 'undefined') return; const S = { co: { cfo: 'cofin', coo: 'coprod', cmo: 'cotrade', cto: 'cord', gr: 'codipl', sec: 'co' }, ch: { sec: 'char', pr: 'char', coach: 'skills', fin: 'life', law: 'career', agent: 'career' } };
  const byTab = {}; for (const kind in S) for (const k in S[kind]) (byTab[S[kind][k]] = byTab[S[kind][k]] || []).push([kind, k]);
  for (const tab in byTab) { const base = TAB_FN[tab]; if (!base) continue; TAB_FN[tab] = function () { const inner = base.apply(this, arguments); if (!inner) return inner; return byTab[tab].map(([kind, k]) => staffCard(kind, k)).join('') + inner; }; }
  // президент і CEO: помічники над вкладкою «Лідер»
  const bl = TAB_FN.lead; if (bl) TAB_FN.lead = function () { const inner = bl.apply(this, arguments); const L = G && G.leader; if (!L || L.role === 'char' || L.money == null) return inner; const acts = L.role === 'president' && G.LEAD_ACT ? `<div class="grp">🎩 ${t_('Дії глави держави')}</div><div class="min-acts">` + G.LEAD_ACT.map(A => { const e = G.leadCan(A[0]), c = A[3](nat(G.player)); return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A[5]))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="stfLead('${A[0]}')">${A[2]} ${esc(t_(A[1]))}${c ? ' · ' + money(c) : ''}</button>`; }).join('') + '</div>' : ''; return inner + acts + `<div class="grp">👥 ${t_('Особиста команда')}</div>` + ['sec', 'pr', 'fin', 'law', 'agent'].map(k => staffCard('ch', k)).join(''); };
}, 0);
function stfLead(k) { const r = G.act.leadDo(k); hint(r && r.ok ? '✅ ' + t_(r.msg || 'Готово') : '⚠ ' + t_((r && r.err) || '?'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
