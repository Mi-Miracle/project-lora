// МОД-ПАНЕЛЬ ДЛЯ ТЕСТУВАННЯ (F9; увімкнути в Налаштування → Гра). Працює в одиночній грі та в хоста.
// Гроші, навички, досвід і посади, пропуск часу, миттєве завершення справ, будов, розвідки, курсів.
let devOpen = false;
const DEV = {
  ok() { if (!G) return 'Гра не запущена'; if (NET.isGuest()) return 'Мод-панель недоступна гостю в мультиплеєрі'; return ''; },
  L: () => G.leader, C: () => (G.pc >= 0 ? G.myCo() : null), Nn: () => (G.player >= 0 ? G.N[G.player] : null),
  log(t) { hint('🛠 ' + t_(t), 2500); devRender(); if (window.renderTop) renderTop(); renderTab(true); if (window.renderRight) renderRight(); },
  run(f, msg) { const e = DEV.ok(); if (e) return hint('⚠ ' + t_(e), 2500); try { const r = f(); DEV.log(typeof r === 'string' ? r : msg || 'Готово'); } catch (err) { hint('⚠ ' + err.message, 4000); console.error(err); } },
  days(n) { const e = DEV.ok(); if (e) return hint('⚠ ' + t_(e), 2500); let left = n; const box = document.getElementById('devProg');
    const chunk = () => { const k = Math.min(left, 10); for (let i = 0; i < k && !G.gameOver; i++) { G.step(); if (typeof afterStep === 'function') afterStep(); } left -= k; if (box) box.textContent = `⏩ ${n - left}/${n}`; if (left > 0 && !G.gameOver) setTimeout(chunk, 0); else { mapDirty = true; DEV.log(`Пропущено ${n} дн.`); } };
    chunk(); },
  money(v) { DEV.run(() => { const L = DEV.L(); if (L && L.role === 'char') L.money += v / 1e9; else if (DEV.Nn()) DEV.Nn().cash += v / 1e9; return '+' + G.fmt$(v / 1e9); }); },
  coMoney(v) { DEV.run(() => { const c = DEV.C(); if (!c) return 'Немає компанії'; c.cash += v / 1e9; return 'Компанія +' + G.fmt$(v / 1e9); }); },
  skills(v) { DEV.run(() => { const L = DEV.L(); L.sk = L.sk || {}; Object.keys(G.SKILLS).forEach(k => { L.sk[k] = v == null ? Math.min(5, (L.sk[k] || 0) + 1) : v; }); L.busy = 0; return v == null ? 'Усі навички +1' : `Усі навички = ${v}`; }); },
  heal() { DEV.run(() => { const L = DEV.L(); L.hp = 100; L.mood = 100; L.busy = 0; return 'Здоровʼя й настрій 100'; }); },
  xp() { DEV.run(() => { const L = DEV.L(); if (!L.job) return 'Немає роботи'; L.job.xp = G.jobNeed(L); const t = G.jobPromo(L); return t || 'Досвід заповнено (підвищення — коли виконано вимоги)'; }); },
  rank(d) { DEV.run(() => { const L = DEV.L(); if (!L.job) return 'Немає роботи'; L.job.lvl = Math.max(1, Math.min(5, L.job.lvl + d)); L.job.xp = 0; return `Посада: ${G.jobTitle(L)}`; }); },
  job(k) { DEV.run(() => { const L = DEV.L(); if (L.job && L.job.k !== k) G.jobQuit && G.jobQuit(L); L.job = null; const r = G.jobTake(k, true); if (!L.job) { L.job = { k, nid: L.home, lvl: 1, xp: 0, dd: 0, warn: 0, d0: G.day }; } return `Робота: ${t_(G.JOBS[k].n)}`; }); },
  work() { DEV.run(() => { const L = DEV.L(); if (!L.job) return 'Немає роботи'; L.job.dd = 20; L.job.warn = 0; return 'Відпрацьовано 20 днів цього місяця'; }); },
  opDone() { DEV.run(() => { const L = DEV.L(); let n = 0; if (L.op) { L.op.end = G.day + 1; n++; } L.opCd = {}; if (L.city) { L.city.dn = {}; L.city.gigs = 0; } return n ? 'Справа завершиться завтра; кулдауни скинуто' : 'Кулдауни справ і обовʼязків скинуто'; }); },
  build() { DEV.run(() => { let n = 0; const nid = G.player >= 0 ? G.player : G.pv(); G.constructions.forEach(c => { if (c.n === nid || (c.co != null && c.co === G.pc)) { c.done = G.day + 1; n++; } }); const c = DEV.C(); if (c) c.pend.forEach(p => { p.done = G.day + 1; n++; });
    G.links.forEach(l => { if (!l.built && (l.n === nid || (l.co != null && l.co === G.pc))) { l.done = G.day + 1; n++; } }); return `Завтра завершиться будов: ${n}`; }); },
  surv() { DEV.run(() => { let n = 0; G.s2().surv.forEach(v => { v.done = G.day + 1; n++; }); return `Розвідок завершиться завтра: ${n}`; }); },
  stab() { DEV.run(() => { const n = DEV.Nn() || G.N[G.pv()]; n.stab = 90; n.cash += 100; return `${n.name}: стабільність 90, +$100 млрд`; }); },
  res() { DEV.run(() => { const n = DEV.Nn(); if (!n || !G.resBoost) return 'Лише для президента'; G.resBoost(n, 0.5); return 'Дослідження +50%'; }); },
  fame() { DEV.run(() => { const L = DEV.L(); L.fame += 20; L.popu[L.home] = Math.min(100, (L.popu[L.home] || 0) + 20); return 'Слава +20, популярність +20'; }); },
  front() { DEV.run(() => { const L = DEV.L(); if (!L.job || L.job.k !== 'military') { DEV.job('military'); } L.job.lvl = Math.max(L.job.lvl, 3); L.sk.mil = Math.max(L.sk.mil || 0, 3); L.sk.fit = Math.max(L.sk.fit || 0, 2); return 'Військовий, капітан: можна отримати підрозділ'; }); },
  company(sec) { DEV.run(() => { if (G.pc >= 0) { G.myCo().sector = sec; G.myCo().cash += 5; return `Сектор компанії: ${sec}, +$5 млрд`; } const L = DEV.L(); const c = G.startCompany({ home: G.N[L.home].a3, sector: sec, cash: 5 }); return `Компанію «${c.name}» створено (${sec})`; }); }
};
function devRender() {
  const el = document.getElementById('devp'); if (!el) return; if (!devOpen || !G) { el.style.display = 'none'; return; } el.style.display = 'block';
  const L = G.leader, isC = L && L.role === 'char', e = DEV.ok(); const b = (l, c, tip) => `<button class="small" ${tip ? `data-tip="${esc(t_(tip))}"` : ''} onclick="${c}">${l}</button>`;
  const jobs = Object.keys(G.JOBS || {}).map(k => `<option value="${k}" ${L && L.job && L.job.k === k ? 'selected' : ''}>${esc(t_(G.JOBS[k].n))}</option>`).join('');
  el.innerHTML = `<div class="row"><b>🛠 ${t_('Мод-панель')}</b><span class="mut small" id="devProg">${t_('день')} ${G.day}</span><button class="small" onclick="devToggle(false)">✕</button></div>
    ${e ? `<div class="r small">${t_(e)}</div>` : ''}
    <div class="grp">⏩ ${t_('Час')}</div><div class="btns">${b('+1', 'DEV.days(1)')}${b('+7', 'DEV.days(7)')}${b('+30', 'DEV.days(30)')}${b('+180', 'DEV.days(180)')}${b('+365', 'DEV.days(365)')}</div>
    <div class="grp">💰 ${t_('Гроші')}</div><div class="btns">${b('+$1k', 'DEV.money(1e3)')}${b('+$100k', 'DEV.money(1e5)')}${b('+$10M', 'DEV.money(1e7)')}${b('🏢 +$1B', 'DEV.coMoney(1e9)')}</div>
    ${isC ? `<div class="grp">🎒 ${t_('Персонаж')}</div><div class="btns">${b('📚 +1', 'DEV.skills()', 'Усі навички +1')}${b('📚 max', 'DEV.skills(5)', 'Усі навички на максимум')}${b('❤ 100', 'DEV.heal()')}${b('⭐ +20', 'DEV.fame()')}</div>
    <div class="grp">💼 ${t_('Робота')}</div><select style="width:100%" onchange="DEV.job(this.value)"><option value="">— ${t_('влаштуватися')} —</option>${jobs}</select>
    <div class="btns">${b('📈 ' + t_('Досвід'), 'DEV.xp()', 'Досвід до підвищення')}${b('⬆', 'DEV.rank(1)', 'Посада +1')}${b('⬇', 'DEV.rank(-1)', 'Посада −1')}${b('📅 20 дн.', 'DEV.work()', 'Відпрацьовані дні місяця')}${b('⏱ ' + t_('Справи'), 'DEV.opDone()', 'Завершити справу й скинути кулдауни')}${b('🎖 ' + t_('Фронт'), 'DEV.front()', 'Зробити військовим-капітаном')}</div>` : ''}
    <div class="grp">🏗 ${t_('Будови й компанія')}</div><div class="btns">${b('🏗 ' + t_('Завершити'), 'DEV.build()', 'Завершити будови країни/компанії й залізниці')}${b('🔍', 'DEV.surv()', 'Завершити розвідку')}${['military', 'mining', 'oil', 'logistics'].map(s => b(s === 'military' ? '⚔' : s === 'logistics' ? '🚚' : s === 'oil' ? '🛢' : '⛏', `DEV.company('${s}')`, 'Компанія сектору ' + s)).join('')}</div>
    <div class="grp">🏛 ${t_('Країна')}</div><div class="btns">${b('⚖ ' + t_('Стабільність'), 'DEV.stab()')}${b('🔬 +50%', 'DEV.res()')}</div>`;
}
function devToggle(on) { if (on && !(window.AUD && AUD.S.dev)) { hint('🛠 ' + t_('Увімкніть мод-панель: Налаштування → Гра'), 3000); return; } devOpen = on == null ? !devOpen : on; devRender(); }
document.addEventListener('keydown', e => { if (e.key === 'F9') { e.preventDefault(); devToggle(); } });
{ const d = document.createElement('div'); d.id = 'devp'; d.className = 'panel'; d.style.cssText = 'display:none;position:fixed;right:12px;top:64px;width:300px;max-height:80vh;overflow:auto;z-index:900;padding:10px;background:#141c27f2;border:1px solid #ffb000;border-radius:10px'; document.body.appendChild(d); }
setInterval(() => { if (devOpen) { const p = document.getElementById('devProg'); if (p && !/⏩/.test(p.textContent) && G) p.textContent = t_('день') + ' ' + G.day; } }, 1000);
