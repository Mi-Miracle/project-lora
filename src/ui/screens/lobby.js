// ОНЛАЙН-ЛОБІ: окремі екрани для хоста (створює кімнату, бачить код, запускає гру) і гостя (вводить код, обирає державу).
let netName = (typeof TW !== 'undefined' && TW.S.user) ? TW.S.user.name : '', netCode = '', netMode = 'solo', lobbyQ = '';
function netStartBlock() {
  if (netMode === 'solo') return '';
  if (netMode === 'host') return `<div class="card"><div class="row"><span>${t_('Ваше імʼя (нік)')}</span><input type="text" value="${esc(netName)}" oninput="netName=this.value" placeholder="Streamer" style="width:55%"></div>
    <div class="small mut">${t_('Оберіть сценарій, складність і свою державу нижче, потім відкрийте кімнату й надішліть код глядачам. Гості обирають держави в лобі.')}</div></div>`;
  return `<div class="card"><div class="row"><span>${t_('Ваше імʼя (нік)')}</span><input type="text" value="${esc(netName)}" oninput="netName=this.value" placeholder="viewer123" style="width:55%"></div>
    <div class="row"><span>${t_('Код кімнати')}</span><input type="text" value="${esc(netCode)}" oninput="netCode=this.value.toUpperCase()" placeholder="ABC123" style="width:55%;text-transform:uppercase;font-family:var(--px);font-size:16px;letter-spacing:.2em"></div>
    <div class="btns"><button class="pri" onclick="guestJoin()">🔗 ${t_('Підключитися як гравець')}</button><button onclick="if(!netCode){hint('⚠ '+t_('Введіть код кімнати'),2500)}else watchJoin(netCode,false)" data-tip="${t_('Лише дивитися: без держави й керування')}">👁 ${t_('Дивитися як глядач')}</button></div></div>`;
}
async function hostOpen() {
  try { const code = await NET.host((netName || 'Streamer').trim()); NET.S.scen = scen; NET.S.diff = startDiff; NET.hostPick(startSel); renderLobby(); hint('🔑 ' + t_('Кімнату створено') + ': ' + code, 3000); }
  catch (e) { hint('⚠ ' + t_('Не вдалося створити кімнату (потрібен інтернет)') + ': ' + (e.type || e.message || e), 6000); }
}
async function guestJoin() {
  if (!netCode) { hint('⚠ ' + t_('Введіть код кімнати'), 2500); return; }
  try { await NET.join(netCode, (netName || 'Гість').trim()); renderLobby(); } catch (e) { hint('⚠ ' + t_('Не вдалося підключитися') + ': ' + (e.type || e.message || e), 6000); }
}
function renderLobby() {
  if (NET.S.started) return; $('#start').style.display = 'none'; const S = NET.S, host = S.role === 'host'; const taken = new Set(S.players.map(p => p.a3).filter(Boolean));
  const myA3 = host ? S.players[0] && S.players[0].a3 : (S.players.find(p => p.name === S.name) || {}).a3;
  const list = (window._startList || []).filter(c => !lobbyQ || c.name.toLowerCase().includes(lobbyQ.toLowerCase())).slice(0, 60);
  const html = `<div class="lobby"><div class="lb-top"><div><div class="small mut">${t_('Код кімнати')}</div><div class="lb-code" onclick="navigator.clipboard&&navigator.clipboard.writeText('${S.code}');hint('📋 ${t_('Скопійовано')}',1500)" data-tip="${t_('Клацніть, щоб скопіювати. Надішліть код у чат стріму')}">${S.code}</div></div>
    <div class="small mut">${host ? t_('Ви — хост: ваш компʼютер рахує світ. Не закривайте вкладку.') : t_('Ви — гість. Оберіть державу й чекайте старту від хоста.')}<br>${t_('Сценарій')}: ${esc(t_(D.scenarios[S.scen] ? D.scenarios[S.scen].name : S.scen))} · ${t_('Складність')}: ${esc(t_(D.difficulty[S.diff] ? D.difficulty[S.diff].n : S.diff))}</div></div>
    ${host ? `<div class="lb-links">${roomLinks(S.code)}</div>` : ''}
    <div class="lb-grid"><div><div class="grp">${t_('Гравці')} (${S.players.length})</div>${S.players.map(p => `<div class="row"><span>${p.host ? '👑' : p.spect ? '👁' : '🎮'} ${esc(p.name)}</span><b>${p.spect ? '<span class="mut">' + t_('глядач') + '</span>' : p.a3 ? esc((D.cells.find(c => c.a3 === p.a3) || {}).n || p.a3) : '<span class="mut">' + t_('обирає…') + '</span>'}</b></div>`).join('')}
      <div class="grp">${t_('Чат')}</div><div id="lbChat" class="chat-log"></div><div class="row"><input type="text" id="lbIn" style="flex:1" placeholder="${t_('Повідомлення…')}" onkeydown="if(event.key==='Enter'){NET.say(this.value);this.value=''}"></div></div>
      ${S.spectator ? `<div><div class="grp">👁 ${t_('Режим глядача')}</div><div class="mut">${t_('Ви спостерігатимете за грою: мапа, війни, новини. Керувати нічим не можна.')}</div></div>` : ''}<div style="${S.spectator ? 'display:none' : ''}"><div class="grp">${t_('Ваша держава')}</div><input type="text" placeholder="${t_('Пошук країни…')}" value="${esc(lobbyQ)}" oninput="lobbyQ=this.value;renderLobby();setTimeout(()=>{const i=document.querySelector('.lobby input[placeholder]');},0)" style="width:100%">
      <div class="lb-list">${list.map(c => `<div class="c ${c.a3 === myA3 ? 'sel' : ''} ${taken.has(c.a3) && c.a3 !== myA3 ? 'tk' : ''}" onclick="${taken.has(c.a3) && c.a3 !== myA3 ? '' : host ? `NET.hostPick('${c.a3}');applyTheme('${c.a3}')` : `NET.pick('${c.a3}');applyTheme('${c.a3}')`}"><b>${esc(c.name)}</b><span>${money(c.gdp)}${taken.has(c.a3) && c.a3 !== myA3 ? ' · ' + t_('зайнято') : ''}</span></div>`).join('')}</div></div></div>
    <div class="btns" style="justify-content:space-between">${host ? `<button class="pri" style="padding:9px 22px" onclick="{const e=NET.hostStart();if(e)hint('⚠ '+e,3000)}">▶ ${t_('Почати гру для всіх')}</button>` : `<span class="mut">${t_('Очікуємо, поки хост почне гру…')}</span>`}<button onclick="location.reload()">✕ ${t_('Вийти')}</button></div></div>`;
  if (!modalOpen || !document.querySelector('.lobby')) { openModal(html); $('#mbox').classList.add('lbbox'); } else { const f = document.activeElement && document.activeElement.id; $('#mbox').innerHTML = html; if (f) { const el = document.getElementById(f); el && el.focus(); } }
  renderChat();
}
// ---- чат (лобі й гра)
function renderChat() {
  const L = NET.S.chat.slice(-40).map(m => `<div><b>${esc(m.who)}:</b> ${esc(m.text)}</div>`).join('');
  ['lbChat', 'gChatLog'].forEach(id => { const el = document.getElementById(id); if (el) { el.innerHTML = L; el.scrollTop = 1e9; } });
}
function chatUI(on) {
  if (!on || document.getElementById('gChat')) return; const d = document.createElement('div'); d.id = 'gChat';
  d.innerHTML = `<div class="gc-h" onclick="this.parentNode.classList.toggle('min')">💬 ${t_('Чат гравців')} · ${NET.S.code} <span class="mut">(${NET.S.role === 'host' ? t_('хост') : t_('гість')})</span></div><div id="gChatLog" class="chat-log"></div><input type="text" placeholder="${t_('Enter — надіслати')}" onkeydown="event.stopPropagation();if(event.key==='Enter'){NET.say(this.value);this.value=''}">`;
  document.body.appendChild(d); renderChat();
}
