// РЕЖИМ «ПРЕЗИДЕНТ І РАДА» — інтерфейс: голосування чату за законопроєкти, підпис/вето президента.
let radaBusy = false, radaT = Date.now();
function radaBox() { let b = document.getElementById('radaBox'); if (!b) { b = document.createElement('div'); b.id = 'radaBox'; document.body.appendChild(b); } return b; }
async function radaRound(bill) {
  radaBusy = true; bill.st = 'voting'; const sec = AUD.S.radaSec || 60; let left = sec, t = [0, 0]; const box = radaBox();
  const draw = () => { const tot = Math.max(1, t[0] + t[1]); box.innerHTML = `<div class="rada-h">🏛 ${t_('ВЕРХОВНА РАДА (ЧАТ)')} <span class="mut">${left} ${t_('с')}</span></div>
    <div class="rada-t">${bill.ic ? bill.ic + ' ' : ''}${esc(t_(bill.what))}</div><div class="mut small">${bill.by === 'pres' ? t_('Законопроєкт президента') : t_('Ініціатива депутатів')}</div>
    <div class="rada-v"><span class="g">!1 ${t_('ЗА')} · ${t[0]}</span><span class="r">!2 ${t_('ПРОТИ')} · ${t[1]}</span></div><div class="rada-bar"><i style="width:${t[0] / tot * 100}%"></i></div>`; };
  box.style.display = 'block'; draw(); AUD.sfx('alert');
  const iv = setInterval(() => { left--; draw(); }, 1000);
  const r = await TW.poll(2, sec, x => { t = x; draw(); }); clearInterval(iv); t = r.t;
  const res = G.radaResolve(bill.id, t[0], t[1]);
  box.innerHTML = `<div class="rada-h">🏛 ${res && res.ok ? '✅ ' + t_('УХВАЛЕНО') : '❌ ' + t_('ПРОВАЛЕНО')}</div><div class="rada-t">${esc(t_(bill.what))}</div><div class="rada-v"><span class="g">${t[0]} ${t_('за')}</span><span class="r">${t[1]} ${t_('проти')}</span></div>`;
  AUD.sfx(res && res.ok ? 'good' : 'bad'); if (res && res.res && res.res.ok === false && res.res.err) hint('⚠ ' + t_(res.res.err), 3000);
  setTimeout(() => { box.style.display = 'none'; radaBusy = false; if (res && res.sign) radaSignModal(bill); try { renderTab(true); renderTop(); } catch (e) { } }, 4000);
}
function radaSignModal(b) {
  if (!G.rada.bills.find(x => x.id === b.id)) return;
  openModal(`<h2>✍ ${t_('Закон на підпис президенту')}</h2><div class="card"><b>${b.ic || '📜'} ${esc(t_(b.what))}</b><div class="mut small">${t_('Рада (чат) ухвалила')}: ${b.yes} ${t_('за')} / ${b.no} ${t_('проти')}</div></div>
    <div class="mut small">${t_('Підпис підвищує довіру чату. Вето знижує довіру й стабільність. Якщо не вирішите за 30 секунд — закон підпишеться автоматично.')}</div>
    <div class="btns"><button class="pri" onclick="radaSign(${b.id},true)">✍ ${t_('Підписати')}</button><button onclick="radaSign(${b.id},false)">✋ ${t_('Ветувати')}</button></div>`);
  clearTimeout(window._radaST); window._radaST = setTimeout(() => { if (G.rada.bills.find(x => x.id === b.id && x.st === 'sign')) radaSign(b.id, true); }, 30000);
}
function radaSign(id, s) { clearTimeout(window._radaST); G.radaSign(id, s); closeModal(); try { renderTab(true); renderTop(); } catch (e) { } }
setInterval(() => {
  if (!G || !G.rada || !G.rada.on || NET.isGuest()) return; G.rada.live = !!TW.S.connected;
  if (!G.rada.live || radaBusy) return;
  const b = G.rada.bills.find(x => x.st === 'vote'); if (b) { radaRound(b); return; }
  const sign = G.rada.bills.find(x => x.st === 'sign'); if (sign && !modalOpen) { radaSignModal(sign); return; }
  if (speedIdx && Date.now() - radaT > (AUD.S.radaMin || 6) * 60000) { radaT = Date.now(); if (G.radaInitiative()) radaT = Date.now(); }
}, 2000);
// панель у вкладці «Держава → Парламент»: у режимі «Президент і Рада» замість ШІ-парламенту
function radaPanel(full) {
  const R = G.rada; if (!R || !R.on) return '';
  let h = `<div class="grp">🏛 ${t_('Верховна Рада — ваш чат Twitch')}</div><div class="card small" style="border-color:#7a5cff">${R.live ? '🟣 ' + t_('Чат підключено: законопроєкти голосує чат (!1 — за, !2 — проти).') : '⚠ ' + t_('Чат Twitch не підключено. Законопроєкти чекають — підключіть чат на стартовому екрані або вирішіть вручну нижче.')}
    <div class="row"><span>${t_('Довіра чату до президента')}</span><b class="${R.trust >= 50 ? 'g' : 'r'}">${Math.round(R.trust)}%</b></div><div class="bar"><i style="width:${R.trust}%"></i></div>
    <div class="row"><span>${t_('Вето')}</span><b>${R.vetoes}</b></div><div class="row"><span>${t_('Наступні вибори (голосування довіри)')}</span><b>${nat(G.player).parl ? G.dateStr(nat(G.player).parl.next) : '—'}</b></div>
    <div class="btns"><button onclick="G.radaInitiative();radaT=Date.now();renderTab(true)">📜 ${t_('Нова ініціатива депутатів')}</button></div></div>`;
  const q = R.bills.filter(b => b.st === 'vote' || b.st === 'voting' || b.st === 'sign');
  if (q.length) { h += `<div class="grp">${t_('Законопроєкти')}</div>` + q.map(b => `<div class="card small"><div class="row"><b>${b.ic || '📜'} ${esc(t_(b.what))}</b><span class="mut">${b.st === 'voting' ? '🟣 ' + t_('голосування') : b.st === 'sign' ? '✍ ' + t_('на підписі') : t_('у черзі')}</span></div>
      ${b.st === 'vote' && !R.live ? `<div class="btns"><button onclick="radaManual(${b.id},true)">✔ ${t_('Ухвалити вручну')}</button><button onclick="radaManual(${b.id},false)">✖ ${t_('Відхилити')}</button></div>` : ''}${b.st === 'sign' ? `<div class="btns"><button class="pri" onclick="radaSign(${b.id},true)">✍ ${t_('Підписати')}</button><button onclick="radaSign(${b.id},false)">✋ ${t_('Ветувати')}</button></div>` : ''}</div>`).join(''); }
  if (R.log.length) h += `<div class="grp">${t_('Історія голосувань')}</div>` + R.log.slice(0, full ? 15 : 8).map(l => `<div class="row small"><span>${l.ok ? '✅' : '❌'} ${esc(t_(l.what))}${l.sign === false ? ' <span class="r">(' + t_('вето') + ')</span>' : ''}</span><span class="mut">${l.yes}/${l.no}</span></div>`).join('');
  h += `<div class="mut small">${t_('Ваші великі рішення (податки, бюджет, мобілізація, оголошення війни) автоматично стають законопроєктами. ШІ-парламент у цьому режимі вимкнено.')}</div>`;
  return h;
}
function radaManual(id, ok) { const r = G.radaResolve(id, ok ? 1 : 0, ok ? 0 : 1); if (r && r.sign) radaSignModal(G.rada.bills.find(x => x.id === id) || { id }); renderTab(true); renderTop(); }
// оверлеї для глядачів і джерела OBS: голосування Ради й «Чат вирішує долю світу»
function overlayState() { const o = {}; ['radaBox', 'chaosBox'].forEach(id => { const b = document.getElementById(id); if (b && b.style.display === 'block') o[id] = b.innerHTML; }); return o; }
function applyOverlays(o) { if (!o) return; ['radaBox', 'chaosBox'].forEach(id => { let b = document.getElementById(id); if (!o[id]) { if (b) b.style.display = 'none'; return; } if (!b) { b = document.createElement('div'); b.id = id; document.body.appendChild(b); } b.innerHTML = o[id]; b.style.display = 'block'; }); }
