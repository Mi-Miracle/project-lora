// СТРІМ-МІСТОК (заготовка). Транслює події гри назовні: у локальний канал BroadcastChannel('lora') —
// його слухає overlay.html (джерело «Браузер» в OBS) — і, за бажання, у WebSocket (config.stream.websocketUrl).
// Формат повідомлення: { type: 'news'|'war'|'peace'|'capture'|'day'|'state', t: <мс>, data: {...} }
// Вхідні команди (майбутнє: голосування чату, бонуси глядачів): LORA.stream.onCommand(fn).
(function (L) {
  let bc = null, ws = null, sent = 0, G = null; const handlers = [];
  try { bc = new BroadcastChannel('lora'); bc.onmessage = e => { if (e.data && e.data.cmd) handlers.forEach(h => h(e.data)); }; } catch (e) { bc = null; }
  function send(type, data) {
    const msg = { type, t: Date.now(), data }; sent++;
    try { bc && bc.postMessage(msg); } catch (e) { }
    try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); } catch (e) { }
  }
  function connectWS() { const url = L.config.stream && L.config.stream.websocketUrl; if (!url) return; try { ws = new WebSocket(url); ws.onmessage = e => { try { const m = JSON.parse(e.data); if (m.cmd) handlers.forEach(h => h(m)); } catch (x) { } }; ws.onclose = () => setTimeout(connectWS, 5000); } catch (e) { } }
  L.stream.send = send;
  L.stream.onCommand = fn => handlers.push(fn);
  L.stream.status = () => ({ local: !!bc, ws: ws ? ['підключення', 'підключено', 'закривається', 'закрито'][ws.readyState] : '', sent });
  L.stream.attach = function (game) {
    G = game; connectWS();
    ['news', 'war', 'peace', 'capture'].forEach(ev => L.bus.on(ev, d => send(ev, ev === 'news' ? { text: d.text, kind: d.kind } : d)));
    L.bus.on('day', day => { if (day % 7) return; const n = G.N[G.pv()]; if (!n) return; send('state', { date: G.dateStr(), country: n.name, gdp: n.agg.gdp, growth: n.growth, stab: n.stab, troops: n.agg.troops, wars: G.enemiesOf(n.id).map(e => G.N[e].name) }); });
  };
  // приклад обробки команд глядачів (вимкнено, доки не з'явиться реальна інтеграція)
  L.stream.onCommand(m => { if (!G || !L.config.stream.enabled) return; if (m.cmd === 'pause') window.setSpeed && window.setSpeed(0); });
})(LORA);
