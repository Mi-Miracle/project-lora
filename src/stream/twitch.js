// TWITCH: вхід через Twitch (OAuth, implicit flow) і читання чату каналу (анонімно, через IRC WebSocket) для голосувань.
// Для входу потрібен Client ID застосунку з https://dev.twitch.tv/console (див. docs/TWITCH.md).
const TW = (() => {
  const S = { user: null, ws: null, channel: '', votes: null, connected: false };
  try { S.user = JSON.parse(localStorage.getItem('lora_tw_user') || 'null'); } catch (e) { }
  const cfg = () => ({ id: localStorage.getItem('lora_tw_client') || (LORA.config.twitchClientId || ''), redirect: localStorage.getItem('lora_tw_redirect') || (location.origin + location.pathname) });
  function login() {
    const c = cfg(); if (!c.id) { hint('⚠ ' + t_('Вкажіть Twitch Client ID у меню → Twitch'), 4000); return; }
    if (location.protocol === 'file:') { hint('⚠ ' + t_('Вхід через Twitch працює лише через локальний сервер: запустіть «Запустити LORA.bat»'), 6000); return; }
    const st = Math.random().toString(36).slice(2); localStorage.setItem('lora_tw_state', st);
    location.href = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${encodeURIComponent(c.id)}&redirect_uri=${encodeURIComponent(c.redirect)}&scope=&state=${st}`;
  }
  async function finish() {
    if (!/access_token=/.test(location.hash)) return; const h = new URLSearchParams(location.hash.slice(1)); history.replaceState(null, '', location.pathname + location.search);
    if (h.get('state') !== localStorage.getItem('lora_tw_state')) { hint('⚠ Twitch: state mismatch', 4000); return; }
    const token = h.get('access_token'); try {
      const r = await fetch('https://api.twitch.tv/helix/users', { headers: { 'Authorization': 'Bearer ' + token, 'Client-Id': cfg().id } }); const j = await r.json(); const u = j.data && j.data[0]; if (!u) throw new Error('no user');
      S.user = { login: u.login, name: u.display_name, avatar: u.profile_image_url, id: u.id }; localStorage.setItem('lora_tw_user', JSON.stringify(S.user)); // токен не зберігаємо
      hint('🟣 ' + t_('Ви увійшли як') + ' ' + u.display_name, 3500); if (window.startScreen && $('#start').style.display !== 'none') startScreen();
    } catch (e) { hint('⚠ Twitch: ' + e.message, 5000); }
  }
  function logout() { S.user = null; localStorage.removeItem('lora_tw_user'); if (window.startScreen) startScreen(); }
  // ---- чат каналу (лише читання, без входу)
  function connectChat(channel) {
    channel = (channel || '').toLowerCase().replace(/^#/, '').trim(); if (!channel) return; disconnectChat(); S.channel = channel; localStorage.setItem('lora_tw_channel', channel);
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); S.ws = ws;
    ws.onopen = () => { ws.send('CAP REQ :twitch.tv/tags'); ws.send('PASS SCHMOOPIIE'); ws.send('NICK justinfan' + Math.floor(Math.random() * 90000 + 10000)); ws.send('JOIN #' + channel); };
    ws.onmessage = e => String(e.data).split('\r\n').forEach(line => {
      if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
      if (/ 366 /.test(line)) { S.connected = true; hint('🟣 ' + t_('Чат Twitch підключено') + ': #' + channel, 3000); }
      const m = line.match(/display-name=([^;]*).*? PRIVMSG #\S+ :(.*)$/); if (!m) return; const user = m[1] || 'viewer', text = m[2];
      LORA.bus.emit('twitchChat', { user, text }); if (S.votes) vote(user, text);
    });
    ws.onclose = () => { S.connected = false; };
  }
  function disconnectChat() { if (S.ws) try { S.ws.close(); } catch (e) { } S.ws = null; S.connected = false; }
  // ---- голосування чату: !1, !2, !3
  function vote(user, text) { const m = text.trim().match(/^!?([1-9])\b/); if (!m) return; const k = +m[1] - 1; if (k >= S.votes.n) return; S.votes.by[user.toLowerCase()] = k; S.votes.onUpdate && S.votes.onUpdate(tally()); }
  function tally() { const t = Array(S.votes.n).fill(0); Object.values(S.votes.by).forEach(k => t[k]++); return t; }
  function poll(n, seconds, onUpdate) { return new Promise(res => { S.votes = { n, by: {}, onUpdate }; setTimeout(() => { const t = tally(); S.votes = null; const best = t.indexOf(Math.max(...t)); res({ t, best: Math.max(...t) > 0 ? best : -1 }); }, seconds * 1000); }); }
  setTimeout(finish, 0);
  return { S, login, logout, connectChat, disconnectChat, poll, cfg, setClient: (id, redirect) => { localStorage.setItem('lora_tw_client', id.trim()); if (redirect) localStorage.setItem('lora_tw_redirect', redirect.trim()); } };
})();
