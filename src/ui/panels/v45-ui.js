// v4.5 UI: вкладки «🔬 Дослідження» (малий бізнес) і «🤝 Можливості» (будь-яка компанія), поділ дій у закладах міста
// на «Робота / Підробітки / Своя справа / Інше», кнопка мод-панелі 🛠 на верхній панелі.
function v45act(r) { hint(r && r.ok !== false ? '✅ ' + t_((r && r.msg) || 'Готово') : '⚠ ' + t_((r && r.err) || 'Помилка'), 3200); renderTab(true); if (window.renderTop) renderTop(); }
// ---------- вкладки компанії ----------
{ const base = window.curTabs; window.curTabs = function () { const r = base.apply(this, arguments); const c = G && G.pc >= 0 && G.myCo(); if (!c) return r;
  const at = k => r.findIndex(x => x[0] === k); let i = Math.max(at('coops'), at('co')); if (i < 0) return r;
  if (c.bizType && at('cores') < 0) r.splice(++i, 0, ['cores', '🔬 Дослідження']);
  if (at('coopp') < 0) { const j = Math.max(at('cofin'), at('cores'), i); r.splice(j + 1, 0, ['coopp', '📋 Можливості']); } return r; }; }
RAIL_G[1][3].push('cores', 'coopp');
if (typeof TIPS_TAB === 'object') Object.assign(TIPS_TAB, { cores: 'Дослідження вашої справи: 5 гілок (продукт, маркетинг, процеси, масштаб, надійність). Працює паралельно з розробками.', coopp: 'Замовлення й тендери, керуючий, спонсорство, інвестори (для великої компанії — приватні контракти й спонсорство).',
  char: 'Ваш персонаж: здоровʼя, настрій, гроші, звʼязки, популярність, вибори', city: 'Прогулянка містом: робота, підробітки, розваги, покупки, своя справа', career: 'Професія: посада, зарплата, атестації й підвищення',
  ops: 'Справи за фахом: виїзні завдання на мапі, підробітки, сезонні бонуси', skills: 'Курси й навчання: навички для роботи, бізнесу й політики', party: 'Партія: членство, рейтинг, вибори', life: 'Статки: гроші, нерухомість, інвестиції, покупки',
  family: 'Родина: партнер, діти, стосунки', front: 'Служба на фронті: ваш підрозділ, накази штабу, тактика', post: 'Державна посада: повноваження й рішення', biz: 'Своя справа: фонд, план, допомога, офіс, команда — і відкриття',
  coops: 'Операції компанії за її профілем: заклади, родовища, маршрути, контракти', coprod: 'Виробництво: що виробляють ваші активи і куди йде товар', cotrade: 'Склад і продаж ресурсів', cotend: 'Державні тендери й контракти',
  cord: 'R&D: власні розробки компанії', cobuild: 'Будівництво нових активів', codipl: 'Відносини компанії з урядами й іншими компаніями', cofin: 'Фінанси: кредити, дивіденди, акції, звітність',
  op: 'Громадська думка: настрої регіонів, протести, пропаганда', un: 'ООН: резолюції, голосування, миротворці', colony: 'Колонії й позаземні бази', planet: 'Планета: клімат, море, катастрофи', intel: 'Розвідка й космос: супутники, дані про інші країни',
  spy: 'Спецслужби: агенти, операції, контррозвідка', mins: 'Міністри: призначення й доручення', staff: 'Персонал: помічники й радники', deals: 'Угоди з іншими гравцями: перевезення, продаж, послуги — з торгом' });

TAB_FN.cores = function () { const c = G.myCo(); if (!c || !c.bizType) return `<div class="mut">${t_('Дослідження — для малого бізнесу. Велика компанія має R&D.')}</div>`;
  const has = k => (c.btech || {})[k]; const done = G.BRES.filter(d => has(d[0])).length;
  let h = `<div class="kpi"><div><b>${done}/${G.BRES.length}</b><span>${t_('досліджено')}</span></div><div><b>+${Math.round(G.bfx(c, 'rev') * 100)}%</b><span>${t_('до доходу')}</span></div><div><b>${G.bunitMax(c)}</b><span>${t_('макс. рівень закладу')}</span></div></div>`;
  if (c.blab) { const d = G.BRES.find(x => x[0] === c.blab.k); const p = Math.min(1, (G.day - c.blab.d0) / Math.max(1, c.blab.done - c.blab.d0));
    h += `<div class="card"><div class="row"><b>🔬 ${esc(t_(d[2]))}</b><span>${c.blab.done - G.day} ${t_('дн.')}</span></div><div class="bar"><i style="width:${p * 100}%;background:#4fb3ff"></i></div><div class="btns"><button class="small" onclick="v45act(G.act.bresCancel())">${t_('Скасувати (повернуть 50%)')}</button></div></div>`; }
  else h += `<div class="mut small">${t_('Лабораторія вільна — оберіть дослідження. Розробки у вкладці закладів ідуть паралельно.')}</div>`;
  const fxT = e => Object.entries(e).map(([k, v]) => ({ rev: `+${Math.round(v * 100)}% ${t_('доходу')}`, ord: `+${Math.round(v * 100)}% ${t_('до замовлень і тендерів')}`, up: `−${Math.round(v * 100)}% ${t_('ціни розширення')}`, open: `−${Math.round(v * 100)}% ${t_('часу відкриття')}`, lvl: `+${v} ${t_('макс. рівень закладів')}`, risk: `−${Math.round(v * 100)}% ${t_('ризику інцидентів')}`, fine: `−${Math.round(v * 100)}% ${t_('штрафів')}`, abroad: t_('заклади за кордоном без офісу') }[k] || k)).join(' · ');
  for (const [b, [ic, n]] of Object.entries(G.BRES_B)) { h += `<div class="grp">${ic} ${esc(t_(n))}</div>`;
    h += G.BRES.filter(d => d[1] === b).map(d => { const e = G.bresErr(c, d[0]); const st = has(d[0]) ? '✅' : c.blab && c.blab.k === d[0] ? '⏳' : e ? '🔒' : '🔓';
      return `<div class="row small" style="align-items:center"><span>${st} <b>${esc(t_(d[2]))}</b><br><span class="mut">${fxT(d[5])} · ${money(d[3] / 1e9)} · ${d[4]} ${t_('дн.')}</span></span>${has(d[0]) || (c.blab && c.blab.k === d[0]) ? '' : `<button class="small ${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(e ? t_(e) : t_('Почати дослідження'))}" onclick="v45act(G.act.bresStart('${d[0]}'))">${t_('Почати')}</button>`}</div>`; }).join(''); }
  return h; };

TAB_FN.coopp = function () { const c = G.myCo(); if (!c) return `<div class="mut">${t_('Компанії немає.')}</div>`; if (!c.ords) G.ordRefresh(c);
  let h = `<div class="grp">📋 ${t_(c.bizType ? 'Замовлення й тендери' : 'Приватні контракти')}</div><div class="mut small">${t_(c.bizType ? 'Нові пропозиції — щомісяця. Тендер — це конкурс: внесок 3%, шанс залежить від рівня закладів, досліджень і суперників.' : 'Разові контракти від приватних клієнтів — щомісяця. Державні тендери — у вкладці «Тендери», кредит — у «Фінансах».')} ${t_('Одночасно')}: ${(c.ordAct || []).length}/${G.ordCap(c)}</div>`;
  h += (c.ordAct || []).map(o => { const t = G.ORD_T.find(x => x[0] === o.k); return `<div class="row small"><span>⏳ ${t[1]} ${esc(t_(t[2]))}</span><span>${o.done - G.day} ${t_('дн.')} · <b class="g">${money(o.pay)}</b></span></div>`; }).join('');
  h += (c.ords || []).map(o => { const t = G.ORD_T.find(x => x[0] === o.k); const e = G.ordErr(c, o); const ch = G.ordChance(c, o);
    return `<div class="card"><div class="row"><b>${t[1]} ${esc(t_(t[2]))}</b><b class="g">${money(o.pay)}</b></div><div class="small mut">${o.days} ${t_('дн. виконання')} · ${t_('пропозиція ще')} ${o.exp - G.day} ${t_('дн.')}${o.rivals ? ` · ${t_('тендер')}: ${t_('суперників')} ${o.rivals}, ${t_('шанс')} ${Math.round(ch * 100)}%` : ''}${o.need > 1 ? ` · ${t_('потрібно')} ${o.need} ${t_(c.bizType ? 'закладів' : 'активів')}` : ''}</div>
      <div class="btns"><button class="${e ? '' : 'pri'}" ${e ? 'disabled' : ''} data-tip="${esc(e ? t_(e) : '')}" onclick="v45act(G.act.ordTake(${o.id}))">${o.rivals ? t_('Подати заявку') : t_('Взятися')}</button></div></div>`; }).join('') || `<div class="mut small">${t_('Пропозицій поки немає — заходьте наступного місяця.')}</div>`;
  if (c.ordEarn) h += `<div class="small mut">${t_('Зароблено на замовленнях')}: ${money(c.ordEarn)}</div>`;
  // спонсорство
  const sp = c.spons && c.spons.until > G.day;
  h += `<div class="grp">🎗 ${t_('Спонсорство')}</div><div class="small mut">${t_(c.bizType ? 'Місцеві фестивалі, команди, благодійність: +4% доходу закладів на 90 днів і слава власника.' : 'Великі події й благодійні фонди: +5 впливу в країні штабу.')}</div>
    <div class="btns"><button class="${sp ? '' : 'pri'}" ${sp ? 'disabled' : ''} onclick="v45act(G.act.sponsDo())">${sp ? `${t_('Діє ще')} ${c.spons.until - G.day} ${t_('дн.')}` : `${t_('Спонсорувати')} · ${money(G.sponsCost(c))}`}</button></div>`;
  if (c.bizType) {
    h += `<div class="grp">🧑‍💼 ${t_('Керуючий')}</div><div class="small mut">${t_('Бере 10% доходу закладів; щомісяця сам розширює заклади, запускає розробки й дослідження, лишаючи запас коштів.')}</div>
      ${c.mgr ? `<div class="small">✅ ${t_('Працює')}${c.mgrLog ? ` · ${t_('останнє')}: ${esc(t_(c.mgrLog))}` : ''}${c.mgrFee ? ` · ${t_('оплата')} ${money(c.mgrFee)}/${t_('міс.')}` : ''}</div>` : ''}
      <div class="btns"><button class="${c.mgr ? '' : 'pri'}" onclick="v45act(G.act.mgrSet(${c.mgr ? 0 : 1}))">${c.mgr ? t_('Звільнити керуючого') : t_('Найняти керуючого')}</button></div>`;
    const sh = c.invSh || 0;
    h += `<div class="grp">💼 ${t_('Інвестори')}</div><div class="small mut">${t_('Продайте 20% інвестору — отримаєте гроші зараз, але ця частка доходу закладів щомісяця йтиме йому. Максимум 60%.')}</div>
      <div class="row small"><span>${t_('Частка інвесторів')}</span><b>${Math.round(sh * 100)}%${c.invCut ? ` · −${money(c.invCut)}/${t_('міс.')}` : ''}</b></div>
      <div class="btns"><button class="small" ${sh >= 0.6 - 1e-9 ? 'disabled' : ''} onclick="v45act(G.act.shareSell())">${t_('Продати 20%')} · ${money(G.shareVal(c))}</button><button class="small" ${sh > 0 ? '' : 'disabled'} onclick="v45act(G.act.shareBuy())">${t_('Викупити 20%')} · ${money(G.shareVal(c) * 1.2)}</button></div>`;
    if ((c.incLog || []).length) h += `<div class="grp">⚠ ${t_('Інциденти')}</div>` + c.incLog.slice().reverse().map(x => `<div class="small mut">${t_('день')} ${x.d}: ${esc(t_(x.txt))}</div>`).join('');
  }
  return h; };

// ---------- місто: поділ дій закладу на категорії ----------
const CITY_CAT = { work: '💼 Робота', side: '💵 Підробітки', biz: '🚀 Своя справа', other: '✨ Інше' };
const CITY_CAT_ORD = ['work', 'side', 'biz', 'other'];
const cityCat = (a, A) => /^(apply_|j_|exam_|quit_)/.test(a) ? 'work' : /^x_/.test(a) ? 'side' : /^bh_/.test(a) ? 'biz' : '';
{ const base = window.citySide; if (base) window.citySide = function () {
  const k = typeof locUI !== 'undefined' && locUI && locUI.place; const P = k && typeof locP === 'function' && locP()[k]; if (!P || !G || !G.leader) return base.apply(this, arguments);
  const vis = Object.entries(P.acts).filter(([, A]) => !A.hide || !A.hide(G.leader)); const cats = new Set(vis.map(([a, A]) => cityCat(a, A)).filter(Boolean));
  if (!cats.size) return base.apply(this, arguments);
  const tmp = []; for (const [a, A] of Object.entries(P.acts)) { if (A.tab) continue; A.tab = cityCat(a, A) || 'other'; tmp.push(A); }
  if (G.JOB_TABS) Object.assign(G.JOB_TABS, CITY_CAT);
  locUI.tabs = locUI.tabs || {}; if (!locUI.tabs[k] && cats.has('work')) locUI.tabs[k] = 'work';
  try { base.apply(this, arguments); } finally { tmp.forEach(A => delete A.tab); }
  const bar = document.querySelector('#citySide .city-tabs'); if (bar) { const key = b => { const m = (b.getAttribute('onclick') || '').match(/='([^']+)';citySide/); const i = m ? CITY_CAT_ORD.indexOf(m[1]) : -1; return i < 0 ? 9 : i; };
    [...bar.children].sort((x, y) => key(x) - key(y)).forEach(b => bar.appendChild(b)); } }; }

// ---------- кнопка мод-панелі на верхній панелі ----------
function devBtn() { if (window.NET && NET.isGuest && NET.isGuest()) { hint('⚠ ' + t_('Мод-панель недоступна гостю в мультиплеєрі'), 2500); return; } if (!AUD.S.dev) AUD.set('dev', true); devToggle(); }
{ const base = window.renderTop; if (base) window.renderTop = function () { base.apply(this, arguments); const top = document.getElementById('top'); if (!top || top.querySelector('.devb')) return;
  if (window.NET && NET.isGuest && NET.isGuest()) return; const b = document.createElement('button'); b.className = 'devb' + ((typeof devOpen !== 'undefined' && devOpen) ? ' on' : ''); b.textContent = '🛠'; b.setAttribute('data-tip', t_('Мод-панель для тестування (F9): гроші, навички, пропуск часу, миттєві будови'));
  b.onclick = devBtn; const g = top.querySelector('[onclick="showGoals()"]'); if (g) g.parentNode.insertBefore(b, g); else top.appendChild(b); }; }
