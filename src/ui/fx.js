// АНІМАЦІЇ СВІТОВИХ ПОДІЙ: прибульці, сонячний спалах, супервулкан, астероїд, сарана, кальмар, блекаут, роботи,
// мандрівник у часі, повінь, ракета, спорт, злив документів, навчання. Канва поверх гри ~4 с; клік — пропустити.
const FX = (() => {
  const Q = []; let busy = false;
  const TXT = {
    ufo: ['🛸 КОНТАКТ!', 'UFO CONTACT!'], solar: ['☀ СУПЕРСПАЛАХ', 'SOLAR SUPERFLARE'], volcano: ['🌋 СУПЕРВУЛКАН', 'SUPERVOLCANO'], asteroid: ['☄ АСТЕРОЇД НАБЛИЖАЄТЬСЯ', 'ASTEROID INCOMING'],
    asteroid_ok: ['🚀 ЗЕМЛЮ ВРЯТОВАНО', 'EARTH SAVED'], impact: ['💥 УДАР АСТЕРОЇДА', 'ASTEROID IMPACT'], locust: ['🦗 САРАНА', 'LOCUSTS'], kraken: ['🦑 ГІГАНТСЬКИЙ КАЛЬМАР', 'GIANT SQUID'],
    blackout: ['🌐 ІНТЕРНЕТ ВПАВ', 'INTERNET DOWN'], robots: ['🤖 СТРАЙК РОБОТІВ', 'ROBOT STRIKE'], time: ['⏳ МАНДРІВНИК У ЧАСІ', 'TIME TRAVELLER'], flood: ['🌊 МОРЕ НАСТУПАЄ', 'SEAS ARE RISING'],
    rocket: ['🏁 ПЕРШІ В КОСМОСІ', 'FIRST IN SPACE'], sport: ['🏆 ПЕРЕМОГА', 'VICTORY'], leak: ['📰 ЗЛИВ!', 'LEAKED!'], exercise: ['🎯 НАВЧАННЯ', 'MILITARY DRILLS']
  };
  function play(e) { if (!e || !TXT[e.kind] || (typeof AUD !== 'undefined' && AUD.S.fx === false) || !G || document.body.classList.contains('stream') && !AUD.S.fxStream) return; Q.push(e); if (!busy) next(); }
  function next() {
    const e = Q.shift(); if (!e) { busy = false; return; } busy = true;
    const cv = document.createElement('canvas'); cv.id = 'fxcv'; document.body.appendChild(cv); const W = cv.width = innerWidth, H = cv.height = innerHeight, cx = cv.getContext('2d');
    const T0 = performance.now(), DUR = 4300, en = LORA.lang === 'en'; let done = false; const end = () => { if (done) return; done = true; cv.style.opacity = 0; setTimeout(() => { cv.remove(); next(); }, 400); }; cv.onclick = end;
    try { AUD.sfx && AUD.sfx(e.kind === 'sport' || e.kind === 'rocket' || e.kind === 'asteroid_ok' ? 'good' : 'news'); } catch (x) { }
    const R = Math.random, P = Array.from({ length: 160 }, () => ({ x: R() * W, y: R() * H, v: 0.5 + R() * 2, s: 1 + R() * 3, a: R() * 6.28 }));
    const title = (TXT[e.kind] || ['', ''])[en ? 1 : 0] + (e.where ? ' · ' + (en && typeof t_ === 'function' ? t_(e.where) : e.where) : '') + (e.who ? ' · ' + e.who : '') + (e.win ? ' · ' + e.win : '');
    const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
    function frame(now) {
      if (done) return; const t = (now - T0) / DUR, u = (now - T0) / 1000; if (t > 1) { end(); return; }
      const fade = Math.min(1, t * 6, (1 - t) * 6); cx.clearRect(0, 0, W, H); cx.globalAlpha = fade;
      cx.fillStyle = 'rgba(3,6,12,0.55)'; cx.fillRect(0, 0, W, H);
      const k = e.kind, mx = W / 2, my = H * 0.45;
      if (k === 'ufo') { const x = W * (0.15 + 0.7 * ease(t * 1.4)), y = H * 0.28 + Math.sin(u * 3) * 10; // промінь і корова
        if (t > 0.45) { cx.fillStyle = 'rgba(140,255,170,0.25)'; cx.beginPath(); cx.moveTo(x - 30, y + 10); cx.lineTo(x + 30, y + 10); cx.lineTo(x + 110, H * 0.85); cx.lineTo(x - 110, H * 0.85); cx.fill();
          const cy2 = H * 0.8 - (H * 0.5) * ease((t - 0.5) * 2.2); cx.font = '42px serif'; cx.textAlign = 'center'; cx.fillText('🐄', x, cy2); }
        cx.fillStyle = '#9fb6cc'; cx.beginPath(); cx.ellipse(x, y, 90, 24, 0, 0, 7); cx.fill(); cx.fillStyle = '#cfe8ff'; cx.beginPath(); cx.ellipse(x, y - 16, 38, 22, 0, Math.PI, 0); cx.fill();
        for (let i = 0; i < 6; i++) { cx.fillStyle = Math.floor(u * 8 + i) % 2 ? '#ffd34d' : '#ff5a8a'; cx.beginPath(); cx.arc(x - 60 + i * 24, y + 6, 4, 0, 7); cx.fill(); } }
      if (k === 'solar') { const r = H * 0.2; const g = cx.createRadialGradient(W * 0.85, H * 0.15, 10, W * 0.85, H * 0.15, r * (1 + t * 6)); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.3, 'rgba(255,170,40,0.8)'); g.addColorStop(1, 'rgba(255,80,0,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) { cx.strokeStyle = `hsla(${120 + i * 40},90%,60%,${0.35 * fade})`; cx.lineWidth = 18; cx.beginPath(); for (let x = 0; x <= W; x += 20) cx.lineTo(x, H * 0.18 + i * 26 + Math.sin(x / 120 + u * 2 + i) * 30); cx.stroke(); } }
      if (k === 'volcano' || k === 'impact') { const by = H * 0.85; cx.fillStyle = '#3a2a22'; cx.beginPath(); cx.moveTo(mx - 260, by); cx.lineTo(mx - 50, H * 0.5); cx.lineTo(mx + 50, H * 0.5); cx.lineTo(mx + 260, by); cx.fill();
        if (k === 'impact' && t < 0.4) { const q = t / 0.4; cx.fillStyle = '#ffb060'; cx.beginPath(); cx.arc(W * (1 - q) * 0.9, H * 0.5 * q, 16, 0, 7); cx.fill(); }
        P.forEach(p => { const tt = Math.max(0, t - (k === 'impact' ? 0.4 : 0.1)); if (!tt) return; const d = tt * 900 * p.v; const x = mx + Math.cos(p.a) * d * 0.6, y = H * 0.5 - Math.abs(Math.sin(p.a)) * d + d * d / 1800; cx.fillStyle = p.s > 2.5 ? '#ff6a2a' : '#555'; cx.fillRect(x, y, p.s * 3, p.s * 3); });
        if (k === 'impact' && t > 0.38 && t < 0.55) { cx.fillStyle = `rgba(255,255,255,${(0.55 - t) * 5})`; cx.fillRect(0, 0, W, H); } }
      if (k === 'asteroid' || k === 'asteroid_ok') { cx.fillStyle = '#2e6ac0'; cx.beginPath(); cx.arc(mx, H * 1.15, H * 0.55, 0, 7); cx.fill(); const q = ease(t * 1.2); const ax = W * 0.1 + q * W * 0.4, ay = H * 0.15 + q * H * 0.35;
        if (k === 'asteroid_ok' && t > 0.5) { const r2 = (t - 0.5) * 2; cx.fillStyle = '#ffd34d'; cx.fillRect(mx - 4 + r2 * 200, H * 0.62 - r2 * 300, 8, 24); cx.save(); cx.translate(ax + r2 * 400, ay - r2 * 200); } else cx.save(), cx.translate(ax, ay);
        cx.fillStyle = '#8a7a6a'; cx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, rr = 34 + Math.sin(i * 7) * 9; cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } cx.fill(); cx.restore();
        cx.strokeStyle = 'rgba(255,170,90,0.5)'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(ax - 120, ay - 60); cx.lineTo(ax - 30, ay - 15); cx.stroke(); }
      if (k === 'locust') P.forEach((p, i) => { const x = (p.x + u * 220 * p.v) % W, y = p.y + Math.sin(u * 8 + i) * 8; cx.font = `${12 + p.s * 5}px serif`; cx.fillText('🦗', x, y); });
      if (k === 'kraken') { cx.fillStyle = '#0d3b66'; cx.fillRect(0, H * 0.62, W, H); for (let i = 0; i < 6; i++) { cx.strokeStyle = '#c0397a'; cx.lineWidth = 26 - i; cx.lineCap = 'round'; cx.beginPath(); const bx = W * (0.2 + i * 0.12); cx.moveTo(bx, H); for (let s = 0; s < 12; s++) cx.lineTo(bx + Math.sin(u * 2 + s * 0.6 + i) * 40 * s / 6, H - s * H * 0.035 * ease(t * 2)); cx.stroke(); }
        cx.font = '48px serif'; cx.fillText('🚢', W * 0.62 + Math.sin(u * 3) * 30, H * 0.6 - Math.abs(Math.sin(u * 4)) * 20); }
      if (k === 'blackout') { for (let i = 0; i < 50; i++) { cx.fillStyle = `rgba(${R() * 255},${R() * 255},${R() * 255},0.25)`; cx.fillRect(R() * W, R() * H, R() * 300, 4 + R() * 20); } cx.fillStyle = '#e8f0f8'; cx.font = '700 120px monospace'; cx.textAlign = 'center'; cx.fillText('404', mx + (R() - 0.5) * 12, my + 40); }
      if (k === 'robots') { for (let i = 0; i < 7; i++) { const x = W * 0.12 + i * W * 0.12, y = H * 0.62 + Math.abs(Math.sin(u * 5 + i)) * -20; cx.font = '54px serif'; cx.textAlign = 'center'; cx.fillText('🤖', x, y); cx.fillStyle = '#f4f1e6'; cx.fillRect(x - 40, y - 120, 80, 40); cx.fillStyle = '#1a1a22'; cx.font = '700 13px system-ui'; cx.fillText(en ? 'OIL!' : 'МАСТИЛА!', x, y - 95); cx.fillRect(x - 2, y - 80, 4, 30); } }
      if (k === 'time') { for (let i = 0; i < 14; i++) { cx.strokeStyle = `hsla(${(u * 120 + i * 25) % 360},90%,65%,0.6)`; cx.lineWidth = 3; cx.beginPath(); cx.arc(mx, my, 20 + i * 22 + (u * 80) % 22, 0, 7); cx.stroke(); } cx.font = '64px serif'; cx.textAlign = 'center'; cx.fillText(t > 0.4 ? '🧑‍🚀' : '⏳', mx, my + 22); cx.fillStyle = '#ffd34d'; cx.font = '700 28px monospace'; cx.fillText(String(2099 - Math.floor(ease(t * 1.5) * 73)), mx, my + 90); }
      if (k === 'flood') { const lv = H * (0.9 - 0.35 * ease(t * 1.5)); cx.fillStyle = 'rgba(40,120,200,0.75)'; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W; x += 20) cx.lineTo(x, lv + Math.sin(x / 60 + u * 4) * 10); cx.lineTo(W, H); cx.fill(); cx.font = '40px serif'; ['🏠', '🏢', '🌴', '🚗'].forEach((c, i) => cx.fillText(c, W * (0.2 + i * 0.2), lv - 6 + Math.sin(u * 3 + i) * 6)); }
      if (k === 'rocket') { const y = H * (0.9 - ease(t * 1.3) * 0.9); cx.font = '70px serif'; cx.textAlign = 'center'; cx.fillText('🚀', mx, y); for (let i = 0; i < 30; i++) { cx.fillStyle = `rgba(255,${150 + R() * 100},60,${0.6 * R()})`; cx.beginPath(); cx.arc(mx + (R() - 0.5) * 40, y + 40 + R() * 80, 4 + R() * 10, 0, 7); cx.fill(); } }
      if (k === 'sport' || k === 'rocket' || k === 'asteroid_ok') P.forEach((p, i) => { const y = (p.y + u * 160 * p.v) % H; cx.fillStyle = `hsl(${i * 37 % 360},90%,60%)`; cx.save(); cx.translate(p.x, y); cx.rotate(u * 4 + i); cx.fillRect(-4, -2, 8, 4); cx.restore(); });
      if (k === 'sport') { cx.font = '110px serif'; cx.textAlign = 'center'; cx.fillText(e.sp === 'wc' ? '⚽' : '🏆', mx, my + 30 + Math.sin(u * 4) * 10); }
      if (k === 'leak') P.slice(0, 60).forEach((p, i) => { const y = (p.y + u * 120 * p.v) % H; cx.save(); cx.translate(p.x, y); cx.rotate(Math.sin(u * 2 + i) * 0.8); cx.fillStyle = '#f4f1e6'; cx.fillRect(-18, -24, 36, 48); cx.fillStyle = '#b22'; cx.fillRect(-14, -16, 28, 5); cx.fillStyle = '#999'; for (let l = 0; l < 4; l++) cx.fillRect(-14, -6 + l * 7, 28, 2); cx.restore(); });
      if (k === 'exercise') { for (let i = 0; i < 8; i++) { const x = (i * W / 8 + u * 140) % (W + 100) - 50; cx.font = '46px serif'; cx.fillText(i % 3 ? '🪖' : '🛡', x, H * 0.7); } for (let i = 0; i < 3; i++) { cx.font = '40px serif'; cx.fillText('✈', (W - (u * 400 + i * 300) % (W + 200)), H * 0.25 + i * 40); } }
      // заголовок
      cx.globalAlpha = fade; cx.textAlign = 'center'; cx.font = `700 ${Math.round(Math.min(W, H) * 0.06)}px Pixelify, system-ui`; cx.lineWidth = 8; cx.strokeStyle = '#05080d'; cx.strokeText(title, mx, H * 0.14); cx.fillStyle = '#ffd34d'; cx.fillText(title, mx, H * 0.14);
      cx.font = '13px system-ui'; cx.fillStyle = 'rgba(220,230,240,0.6)'; cx.fillText(en ? 'click to skip' : 'клік — пропустити', mx, H - 40);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  LORA.bus.on('fx', play);
  LORA.bus.on('disaster', d => { if (d && /метеорит/.test(d.label || '')) play({ kind: 'impact', where: '' }); });
  return { play };
})();
