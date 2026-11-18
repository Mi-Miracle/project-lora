// транслітерація імен для англійської версії (КМУ 2010, спрощено)
const TRL = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', 'ʼ': '', "'": '' };
function translit(s) { return String(s).replace(/[а-яіїєґʼ']/gi, ch => { const lo = ch.toLowerCase(), r = TRL[lo]; if (r == null) return ch; return ch === lo ? r : r.charAt(0).toUpperCase() + r.slice(1); }); }
const pName = s => LORA.lang === 'en' ? translit(s) : s;
// КАРТКА МІНІСТРА зверху кожної вкладки держави: аватар, компетентність, лояльність, риса, автокерування ШІ, дії
let minOpen = {};
function minCard(k) {
  if (!G || G.player < 0 || G.mpRole || !G.MIN[k]) return ''; const n = nat(G.player), m = G.minOf(G.player, k), M = G.MIN[k]; const T = { honest: 'Чесний', tech: 'Технократ', pop: 'Популіст', hawk: 'Яструб', lazy: 'Лінивий', greedy: 'Жадібний', star: 'Медійний' };
  const bar = (v, c) => `<div class="bar" style="height:5px"><i style="width:${v}%;background:${c}"></i></div>`; const open = minOpen[k];
  let h = `<div class="mincard ${m.auto ? 'auto' : ''}"><div class="min-top" onclick="minOpen['${k}']=!minOpen['${k}'];renderTab(true)">${avatar(m.ava, 40, { fem: m.fem, mil: k === 'army' })}<div class="min-info"><div class="min-n"><b>${esc(pName(m.name))}</b> <span class="mut small">${M.ic} ${esc(t_(M.n))}</span></div>
    <div class="min-st small"><span>${t_('Компетентність')} ${Math.round(m.comp)}</span>${bar(m.comp, '#4fb3ff')}<span>${t_('Лояльність')} ${Math.round(m.loyal)}</span>${bar(m.loyal, m.loyal < 35 ? '#ff6a5a' : '#6ad08a')}</div></div>
    <label class="min-auto" onclick="event.stopPropagation()" data-tip="${t_('ШІ-міністр сам керує галуззю')}: ${esc(t_(M.area))}"><input type="checkbox" ${m.auto ? 'checked' : ''} onchange="G.act.minAuto('${k}',this.checked);renderTab(true)"> 🤖 ${t_('Авто')}</label><span class="min-tog">${open ? '▴' : '▾'}</span></div>`;
  if (open) { h += `<div class="small mut">${t_('Риса')}: <b>${esc(t_(T[m.trait] || m.trait))}</b> · ${t_('відповідає за')}: ${esc(t_(M.area))}</div><div class="min-acts">` + G.minActions(k).map(A => { const e = G.minCan(G.player, k, A[0]); const c = A[3](n);
      return `<button class="small" ${e ? 'disabled' : ''} data-tip="${esc(t_(A[5]))}${e ? ' — ' + esc(t_(e)) : ''}" onclick="minAct('${k}','${A[0]}')">${A[2]} ${esc(t_(A[1]))}${c ? ' · ' + money(c) : ''}</button>`; }).join('') + `</div>`; }
  return h + `</div>`;
}
function minAct(k, a) { const r = G.act.minDo(k, a); hint(r && r.ok ? '✅ ' + t_(r.msg) : '⚠ ' + t_((r && r.err) || '?'), 3500); AUD.sfx(r && r.ok ? 'good' : 'bad'); renderTab(true); renderTop(); }
['state', 'econ', 'logi', 'army', 'dipl', 'build', 'tech', 'intel'].forEach(k => { const base = TAB_FN[k]; if (!base) return; TAB_FN[k] = function () { return minCard(k) + base.apply(this, arguments); }; });
