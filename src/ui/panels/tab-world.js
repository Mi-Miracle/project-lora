// ВКЛАДКИ «СВІТ», «БУДІВНИЦТВО», «ДОСЛІДЖЕННЯ».
const priceHist = {}; RES.forEach(r => priceHist[r] = []);
function spark(arr) { if (arr.length < 2) return ''; const w = 110, h = 22; const mx = Math.max(1.3, ...arr), mn = Math.min(0.7, ...arr); return `<svg width="${w}" height="${h}" style="vertical-align:middle"><line x1="0" x2="${w}" y1="${h - (1 - mn) / (mx - mn) * h}" y2="${h - (1 - mn) / (mx - mn) * h}" stroke="#3a4a5a" stroke-dasharray="2,2"/><polyline fill="none" stroke="#4fb3ff" stroke-width="1.5" points="${arr.map((v, i) => (i / (arr.length - 1) * w).toFixed(1) + ',' + (h - (v - mn) / (mx - mn) * h).toFixed(1)).join(' ')}"/></svg>`; }
TAB_FN.world = function () {
  const wsub = curSub('world', 'main'); const head = subnav('world', [['main', 'Огляд'], ['stock', '📈 Біржа'], ['media', '📰 Медіа'], ['events', '🏅 Події'], ['balance', 'Баланс і ШІ']]);
  if (wsub === 'balance') return head + balanceTab();
  if (wsub === 'stock') return head + stockTab();
  if (wsub === 'media') return head + mediaTab();
  if (wsub === 'events') return head + wevTab();
  const alive = G.N.filter(x => x.alive); const byG = alive.slice().sort((a, b) => b.agg.gdp - a.agg.gdp).slice(0, 15);
  const pw = alive.map(x => ({ x, p: G.nationPower(x.id) })).sort((a, b) => b.p - a.p).slice(0, 15); const tot = alive.reduce((s, x) => s + x.agg.gdp, 0);
  return head + `<div class="kpi"><div><span>Світовий ВВП</span><b>${money(tot)}</b></div><div><span>Держав</span><b>${alive.length}</b></div><div><span>Пар у війні</span><b>${G.wars.size}</b></div><div><span>Торгових потоків</span><b>${G.flows.length}</b></div></div>
  <div class="grp">Ціни на сировину (від бази)</div>${RGROUPS.map(g => g.list.map(r => `<div class="row"><span>${ico(RI[r].ic)} ${RI[r].n}</span><span>${spark(priceHist[r])} <b class="${G.prices[r] / G.priceBase[r] > 1.1 ? 'r' : ''}">${pct(G.prices[r] / G.priceBase[r], 0)}</b></span></div>`).join('')).join('')}
  <div class="grp">Найбільші економіки</div><table><tr><th>Країна</th><th>ВВП</th><th>Зрост.</th></tr>${byG.map(x => `<tr><td>${nlink(x.id)}</td><td>${money(x.agg.gdp)}</td><td class="${x.growth >= 0 ? 'g' : 'r'}">${sgnPct(x.growth)}</td></tr>`).join('')}</table>
  <div class="grp">Військова сила</div><table><tr><th>Країна</th><th>Сила</th><th>Склад</th></tr>${pw.map(o => `<tr><td>${nlink(o.x.id)}${o.x.nuke ? ' ☢' : ''}</td><td>${o.p.toFixed(0)}</td><td>${people(o.x.agg.troops || 0)}</td></tr>`).join('')}</table>`;
};

function balanceTab() {
  const DB = D.balance;
  const rows = Object.entries(DB).map(([k, v]) => { const cur = G.B[k]; const ch = Math.abs(cur - v.value) / Math.max(1e-9, v.value) > 0.005; return `<div class="row small"><span>${esc(v.n)}</span><b class="${ch ? 'y' : ''}">${+cur.toPrecision(3)}</b></div>`; }).join('');
  const log = (G.balanceLog || []).slice(0, 25).map(l => `<div class="row small"><span>${G.dateStr(l.d)} · ${esc(D.balance[l.key] ? D.balance[l.key].n : l.key)}</span><span>${l.from} → <b>${l.to}</b></span></div><div class="mut small" style="margin:-2px 0 4px">${esc(l.why)}</div>`).join('');
  const learners = G.N.filter(n => n.alive && n.ai && Math.abs(n.ai.learn) > 0.02).sort((a, b) => Math.abs(b.ai.learn) - Math.abs(a.ai.learn)).slice(0, 10);
  return `<div class="card small">Гра стежить за собою: раз на місяць «режисер» перевіряє, чи не завмер фронт, чи немає розгромів і надмірних втрат, як росте світова економіка й чи не надто мирно або воєнно у світі, — і м'яко підкручує параметри в безпечних межах. Агенти держав запам'ятовують, які наступи вдалися, і стають сміливішими або обережнішими.</div>
  <div class="grp">Зміни балансу</div>${log || '<div class="mut small">Поки без змін — усе в межах цілей.</div>'}
  <div class="grp">Досвід агентів</div>${learners.map(n => `<div class="row small"><span>${nlink(n.id)}</span><span>${n.ai.learn > 0 ? '<span class="y">обережніший</span>' : '<span class="g">сміливіший</span>'} (${(n.ai.learn * 100).toFixed(0)}%) · операцій: ${n.ai.memory.length}</span></div>`).join('') || '<div class="mut small">Агенти ще не мали бойового досвіду.</div>'}
  <div class="grp">Поточні параметри</div>${rows}`;
}

// ---- БІРЖА
let stockStep = 1;
function stockTab() {
  if (!G.stock) G.stockInit(); const S = G.stock, w = G.wallet(); const cash = !w ? 0 : w[0] === 'n' ? nat(+w.slice(1)).cash : w === 'L' ? G.leader.money : G.companies[+w.slice(1)].cash;
  const chg = c => { const h = S.hist[c.id] || []; const p0 = h.length > 4 ? h[h.length - 5] : h[0] || S.px[c.id]; return S.px[c.id] / p0 - 1; };
  const L = G.companies.filter(c => c.alive && S.px[c.id] != null).sort((a, b) => S.px[b.id] - S.px[a.id]);
  const idx = S.idx[S.idx.length - 1] || 100, i4 = S.idx.length > 4 ? S.idx[S.idx.length - 5] : S.idx[0];
  let h = `<div class="kpi"><div><span>${t_('Індекс LORA')}</span><b>${idx.toFixed(1)} <span class="${idx >= i4 ? 'g' : 'r'}">${((idx / i4 - 1) * 100).toFixed(1)}%</span></b></div><div><span>${t_('Ваш гаманець')}</span><b>${money(cash)}</b></div><div><span>${t_('Портфель')}</span><b>${money(w ? G.stockPortfolio(w) : 0)}</b></div></div>`;
  h += `<div class="card small">${spark(S.idx, 300, 40)}<div class="mut">${t_('Індекс за 2 роки. Війни й санкції б\'ють по компаніях країни; світова напруга піднімає ВПК; дорога нафта — енергетику. Дивіденди — 30% прибутку щомісяця.')}</div></div>`;
  h += `<div class="card small"><div class="row"><span>💰 ${t_('Гроші інвесторів на ринку')}</span><b>${money(S.pool || 0)}</b></div><div class="row"><span>🌍 ${t_('Вплив біржі на світове зростання')}</span><b class="${(S.wealthG || 0) >= 0 ? 'g' : 'r'}">${((S.wealthG || 0) * 100).toFixed(2)}%</b></div>${S.bubble ? `<div class="y">🫧 ${t_('Ринок перегрітий: ризик обвалу')}</div>` : ''}${S.panic > G.day ? `<div class="r">😱 ${t_('Паніка на біржі')}</div>` : ''}</div>`;
  h += `<div class="btns">${[0.1, 1, 5, 10].map(v => `<button class="${stockStep === v ? 'on' : ''}" onclick="stockStep=${v};renderTab(true)">${v}%</button>`).join('')}</div><table class="small"><tr><th>${t_('Компанія')}</th><th>${t_('Ціна 1%')}</th><th>${t_('4 тиж.')}</th><th>${t_('Обіг')}</th><th>${t_('Ваше')}</th><th></th></tr>`;
  L.slice(0, 40).forEach(c => { const ch = chg(c), held = w ? G.stockHeld(w, c.id) : 0, sec = (D.companySectors[c.sector] || {});
    h += `<tr><td>${ico(sec.ic || '🏢')} ${esc(LORA.lang === 'en' ? c.en : c.name)}<div class="mut">${esc(nat(c.home).name)}</div></td><td>${money(S.px[c.id])}</td><td class="${ch >= 0 ? 'g' : 'r'}">${(ch * 100).toFixed(1)}%</td><td class="mut">${G.stockFree(c.id).toFixed(0)}/${G.stockFloat(c.id).toFixed(0)}%</td><td>${held ? held + '%' : ''}${G.stockController(c.id) === w && w ? ' 👑' : ''}</td>
    <td style="white-space:nowrap"><button class="small" onclick="stockDo(${c.id},${stockStep})">+</button>${held ? `<button class="small" onclick="stockDo(${c.id},${-Math.min(held, stockStep)})">−</button>` : ''}</td></tr>`; });
  h += `</table>`;
  const mine = L.filter(c => w && G.stockController(c.id) === w);
  if (mine.length) h += `<div class="grp">👑 ${t_('Ваші контрольні пакети')}</div>` + mine.map(c => `<div class="row small"><span>${esc(LORA.lang === 'en' ? c.en : c.name)} · ${t_('дивіденди')}</span><select onchange="stockDiv(${c.id},+this.value)">${[0, 0.2, 0.3, 0.5, 0.8].map(v => `<option value="${v}" ${(c.divCtl != null ? c.divCtl : 0.3) === v ? 'selected' : ''}>${v * 100}%</option>`).join('')}</select></div>`).join('');
  h += `<div class="grp">🌐 ${t_('Індекси країн')}</div><table class="small"><tr><th>${t_('Країна')}</th><th>${t_('Капіталізація')}</th><th>${t_('Компаній')}</th><th>${t_('4 тиж.')}</th></tr>${G.stockCountries().slice(0, 14).map(x => `<tr><td>${ndot(x.nid)}${esc(nat(x.nid).name)}</td><td>${money(x.cap)}</td><td>${x.n}</td><td class="${x.ch >= 0 ? 'g' : 'r'}">${(x.ch * 100).toFixed(1)}%</td></tr>`).join('')}</table>`;
  return h + `<div class="mut small">${t_('Купуючи з обігу, ви платите інвесторам; дивіденди платить сама компанія. Хто набере ≥ 50% акцій — отримує контроль. Компанії залучають гроші емісією (до 75% в обігу).')}</div>`;
}
function stockDiv(cid, v) { const r = G.act.stockSetDiv(cid, v); hint(r.ok ? '✅ ' + t_(r.msg) : '⚠ ' + t_(r.err), 2500); renderTab(true); }
function stockDo(cid, pct) { const r = G.act.stockTrade(cid, pct); if (r && r.ok === false) hint('⚠ ' + t_(r.err), 3000); else AUD.sfx('good'); renderTab(true); renderTop(); }
// ---- МЕДІА: газета тижня й рейтинг лідерів
function mediaTab() {
  const week = G.news.filter(n => n.d > G.day - 30);
  const score = it => (/☢/.test(it.text) ? 10 : 0) + (/війн|нападає|капітул|Переворот|Повстання|Обвал/.test(it.text) ? 5 : 0) + (/мир|угод|союз|звільнено|Звільнено/.test(it.text) ? 3 : 0) + (/🏆|рекорд|Рекорд/.test(it.text) ? 2 : 0) - (/Збудовано|будує|Будівництво|за тиждень|Дефолт/.test(it.text) ? 6 : 0) - (/^(✈|🚀) /.test(it.text) ? 6 : 0);
  const top = week.slice().sort((a, b) => score(b) - score(a)).slice(0, 7); const main = top[0];
  const papers = ['Світовий вісник', 'Геополітика сьогодні', 'LORA Times', 'Ранковий кур\'єр'];
  let h = `<div class="paper"><div class="paper-h">${esc(t_(papers[Math.floor(G.day / 30) % papers.length]))}<span>${G.dateStr()}</span></div>`;
  if (main) h += `<div class="paper-main">${esc(t_(main.text))}</div>`; h += top.slice(1).map(n => `<div class="paper-i">▪ ${esc(t_(n.text))}</div>`).join('') || `<div class="mut">${t_('Тихий місяць')}</div>`;
  h += `</div><div class="grp">${t_('Рейтинг лідерів світу')}</div>`;
  const R = G.N.filter(n => n.alive && n.agg && n.agg.gdp > 150).map(n => { const war = G.enemiesOf(n.id).length; const s = n.stab * 0.5 + (n.growth || 0) * 900 + Math.min(20, n.agg.gdp / 1500) - (n.warExh || 0) * 25 + (war ? 4 : 0) + (n.nk && n.nk.used ? -30 : 0); return { n, s }; }).sort((a, b) => b.s - a.s);
  const me = R.findIndex(x => x.n.id === G.player);
  h += `<table class="small">${R.slice(0, 12).map((x, k) => `<tr ${x.n.id === G.player ? 'style="background:#2a3a1a"' : ''}><td>${k + 1}</td><td>${nlink(x.n.id)}</td><td>${t_('стаб.')} ${x.n.stab.toFixed(0)}</td><td>${x.s.toFixed(0)}</td></tr>`).join('')}</table>`;
  if (me >= 12) h += `<div class="small">${t_('Ваше місце')}: <b>${me + 1}</b> ${t_('з')} ${R.length}</div>`;
  h += `<div class="btns"><button class="pri" onclick="showChronicle()">📜 ${t_('Хроніка для стріму')}</button></div>`;
  return h;
}

// ---- світові події й клімат
function wevTab() {
  let h = `<div class="kpi"><div><span>🌍 ${t_('Світове забруднення')}</span><b class="${G.worldPoll > 60 ? 'r' : 'y'}">${(G.worldPoll || 0).toFixed(0)}</b></div><div><span>${t_('Кліматичні лиха')}</span><b>${G.worldPoll > 60 ? t_('часті') : t_('помірні')}</b></div></div>`;
  h += `<div class="mut small">${t_('Що брудніша світова економіка (вугілля, нафта, металургія), то частіші посухи, повені, пожежі й спека — і тим більше кліматичних мігрантів.')}</div><div class="grp">🏅 ${t_('Світові події')}</div>`;
  if (!G.wev || !G.wev.length) return h + `<div class="mut small">${t_('Заявки на Олімпіаду, Чемпіонат світу й Expo відкриваються на початку року.')}</div>`;
  G.wev.forEach((e, k) => { const E = G.WEV[e.k]; const mine = e.cand.includes(G.player);
    h += `<div class="card small"><div class="row"><b>${E.ic} ${esc(t_(E.n))} ${2026 + e.y}</b><span>${e.host == null ? t_('голосування') + ' ' + G.dateStr(e.vote) : e.host >= 0 ? t_('господар') + ': ' + esc(nat(e.host).name) : t_('без господаря')}</span></div>
      <div class="mut">${t_('Кандидати')}: ${e.cand.map(x => esc(nat(x).name)).join(', ') || '—'} · ${t_('ефект')}: ${t_('стабільність')} +${E.stab}, ${t_('зростання на рік')}, ${t_('відносини')}</div>
      ${e.host == null && G.player >= 0 ? `<div class="btns">${mine ? `<button onclick="dact2(()=>G.act.wevLobby(${k}));renderTab(true)">🤝 ${t_('Лобіювати делегатів')}</button>` : `<button class="pri" onclick="dact2(()=>G.act.wevApply(${k}));renderTab(true)">📨 ${t_('Подати заявку')}</button>`}</div>` : ''}${e.done ? `<div class="g">✔ ${t_('Проведено')}</div>` : ''}</div>`; });
  return h;
}
