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
  // СЦЕНИ з емодзі: bg — фон, items — [емодзі, режим руху, кількість, розмір], shake — трясіння, flash — спалах
  const SCN = {
    welcome: { bg: ['#0b2a3a', '#071420'], items: [['🛸', 'pulse', 1, 120], ['🤝', 'zoom', 1, 90], ['✨', 'burst', 40, 26], ['📡', 'float', 6, 34]] },
    cows: { bg: ['#0a1a10', '#05080d'], items: [['🛸', 'fly', 3, 80], ['🐄', 'rise', 14, 44], ['😱', 'float', 5, 38]] },
    burger: { bg: ['#2a1a05', '#100802'], items: [['🍔', 'rain', 30, 40], ['👽', 'march', 8, 48], ['🎉', 'burst', 30, 26]] },
    science: { bg: ['#101040', '#05050f'], items: [['⚛', 'orbit', 8, 40], ['🔬', 'pulse', 1, 110], ['⚗', 'float', 8, 34], ['💡', 'burst', 20, 26]] },
    battle: { bg: ['#300808', '#080202'], items: [['💥', 'burst', 40, 40], ['🛸', 'fly', 4, 70], ['✈', 'flyL', 5, 50]], shake: 1, flash: 1, laser: 1 },
    leaving: { bg: ['#06122a', '#020610'], items: [['🛸', 'rise', 3, 90], ['👋', 'float', 6, 40], ['⭐', 'rain', 50, 14]] },
    kaiju: { bg: ['#1a2a3a', '#050a10'], items: [['🦖', 'stomp', 1, 240], ['🏢', 'march', 7, 60], ['🚁', 'fly', 3, 46]], shake: 1 },
    tame: { bg: ['#1a3a1a', '#050f05'], items: [['🦖', 'pulse', 1, 200], ['❤', 'burst', 30, 30], ['🍖', 'rain', 12, 36]] },
    evac: { bg: ['#2a2a10', '#0a0a05'], items: [['🚌', 'marchL', 8, 54], ['🏃', 'marchL', 14, 36], ['🦖', 'stomp', 1, 160]] },
    dino: { bg: ['#203010', '#081005'], items: [['🦕', 'march', 5, 90], ['🦖', 'marchL', 4, 80], ['🧪', 'float', 6, 34]] },
    zoo: { bg: ['#1a3a1a', '#050f05'], items: [['🦕', 'pulse', 1, 180], ['🎟', 'rain', 20, 30], ['📸', 'float', 10, 34], ['💰', 'rise', 12, 30]] },
    cat: { bg: ['#2a1a2a', '#0a050a'], items: [['🐈', 'stomp', 1, 300], ['🏛', 'march', 5, 60], ['😹', 'float', 8, 40]] },
    catfed: { bg: ['#2a1a2a', '#0a050a'], items: [['🐈', 'pulse', 1, 220], ['🐟', 'rain', 30, 34], ['💤', 'float', 6, 40]] },
    laserdot: { bg: ['#200a0a', '#050202'], items: [['🐈', 'chase', 1, 200], ['🔴', 'dot', 1, 30]] },
    geese: { bg: ['#1a2a1a', '#050a05'], items: [['🦢', 'march', 30, 40], ['📋', 'float', 6, 40], ['📢', 'pulse', 1, 70]] },
    geesepeace: { bg: ['#1a2a1a', '#050a05'], items: [['🦢', 'orbit', 10, 40], ['🍞', 'rain', 30, 30], ['🕊', 'fly', 5, 40]] },
    money: { bg: ['#0a2a0a', '#020a02'], items: [['💸', 'rain', 40, 36], ['💰', 'pulse', 1, 120], ['📈', 'float', 4, 46]] },
    crash: { bg: ['#2a0a0a', '#0a0202'], items: [['📉', 'pulse', 1, 140], ['💸', 'rise', 30, 30], ['😭', 'float', 8, 40]], shake: 1 },
    party: { bg: ['#2a0a2a', '#0a020a'], items: [['🎉', 'burst', 40, 32], ['🕺', 'march', 8, 50], ['💃', 'marchL', 8, 50], ['🎶', 'float', 10, 30]] },
    sad: { bg: ['#1a1a24', '#05050a'], items: [['🌧', 'float', 8, 60], ['💧', 'rain', 60, 18], ['😢', 'march', 6, 40]] },
    robotsparty: { bg: ['#101a2a', '#05080d'], items: [['🤖', 'march', 10, 50], ['🛢', 'rain', 20, 30], ['🎉', 'burst', 30, 26]] },
    reboot: { bg: ['#05080d', '#000'], items: [['💾', 'pulse', 1, 120], ['🔄', 'spin', 1, 90], ['0️⃣', 'rain', 50, 18], ['1️⃣', 'rain', 50, 18]] },
    council: { bg: ['#101a2a', '#05080d'], items: [['🤖', 'orbit', 8, 46], ['🏛', 'pulse', 1, 110], ['📜', 'float', 6, 34]] },
    future: { bg: ['#1a0a3a', '#05020f'], items: [['🔮', 'pulse', 1, 120], ['🚀', 'fly', 4, 46], ['🏙', 'march', 6, 60], ['✨', 'burst', 30, 24]] },
    jail: { bg: ['#1a1a1a', '#050505'], items: [['🚔', 'march', 3, 70], ['👨‍🚀', 'pulse', 1, 110], ['⛓', 'float', 6, 40]] },
    minister: { bg: ['#2a2a0a', '#0a0a02'], items: [['👨‍🚀', 'pulse', 1, 110], ['🎩', 'float', 6, 40], ['📜', 'rain', 20, 28]] },
    navy: { bg: ['#0d3b66', '#05182a'], items: [['🚢', 'march', 5, 60], ['💥', 'burst', 30, 34], ['🦑', 'stomp', 1, 160]], shake: 1 },
    fish: { bg: ['#0d3b66', '#05182a'], items: [['🦑', 'pulse', 1, 200], ['🐟', 'rain', 40, 30], ['❤', 'float', 8, 34]] },
    tourists: { bg: ['#0d3b66', '#05182a'], items: [['🦑', 'pulse', 1, 160], ['📸', 'float', 12, 34], ['🚤', 'march', 6, 46], ['💰', 'rise', 14, 28]] },
    spray: { bg: ['#1a2a0a', '#050a02'], items: [['🚁', 'fly', 4, 60], ['☁', 'float', 8, 60], ['🦗', 'rise', 30, 26]] },
    snack: { bg: ['#2a1a05', '#0a0502'], items: [['🍽', 'pulse', 1, 120], ['🦗', 'rain', 30, 28], ['😋', 'float', 8, 40]] },
    birds: { bg: ['#1a2a3a', '#05080d'], items: [['🐦', 'fly', 30, 30], ['🦗', 'rain', 20, 22], ['🐓', 'march', 8, 40]] },
    ice: { bg: ['#a8d8ff', '#3a6a9a'], items: [['❄', 'rain', 60, 26], ['⛄', 'march', 6, 56], ['🥶', 'float', 6, 40]] },
    heat: { bg: ['#ff8a2a', '#5a1a00'], items: [['🔥', 'float', 10, 50], ['🌡', 'pulse', 1, 120], ['🧊', 'rise', 12, 30]] },
    furcoat: { bg: ['#6a8ab0', '#1a2a3a'], items: [['🧥', 'march', 12, 46], ['❄', 'rain', 40, 22], ['😎', 'float', 6, 40]] },
    portal: { bg: ['#1a0a3a', '#020010'], items: [['🌀', 'spin', 1, 260], ['✨', 'burst', 40, 24]] },
    portalexp: { bg: ['#1a0a3a', '#020010'], items: [['🌀', 'spin', 1, 200], ['🧑‍🔬', 'rise', 6, 40], ['🦄', 'burst', 10, 40], ['💎', 'rain', 20, 30]] },
    portalbad: { bg: ['#2a0a1a', '#0a0205'], items: [['🌀', 'spin', 1, 200], ['👾', 'burst', 20, 40]], shake: 1 },
    meme: { bg: ['#2a2a2a', '#0a0a0a'], items: [['🐸', 'pulse', 1, 160], ['😂', 'rain', 40, 30], ['📱', 'float', 10, 36]] },
    meteorgold: { bg: ['#2a2005', '#0a0802'], items: [['☄', 'fly', 1, 90], ['💰', 'burst', 40, 30], ['🌾', 'march', 10, 36]] },
    auction: { bg: ['#2a2005', '#0a0802'], items: [['🔨', 'pulse', 1, 110], ['💰', 'rain', 30, 30], ['🤵', 'march', 6, 46]] },
    signal: { bg: ['#05081a', '#000'], items: [['📡', 'pulse', 1, 140], ['〰', 'burst', 20, 30], ['⭐', 'rain', 60, 12]] },
    aigov: { bg: ['#051a1a', '#020808'], items: [['🤖', 'stomp', 1, 220], ['🗳', 'float', 8, 40], ['💻', 'march', 6, 46]] },
    off: { bg: ['#000', '#000'], items: [['🔌', 'pulse', 1, 140], ['💤', 'float', 8, 40]] },
    debate: { bg: ['#10102a', '#05050f'], items: [['🎙', 'pulse', 1, 110], ['🤖', 'marchL', 1, 120], ['🧑‍💼', 'march', 1, 120], ['🔥', 'burst', 20, 26]] },
    shield: { bg: ['#051a2a', '#02080f'], items: [['🛡', 'pulse', 1, 160], ['✨', 'orbit', 12, 26], ['☄', 'rain', 10, 30]] },
    orbital: { bg: ['#05081a', '#000'], items: [['🛰', 'fly', 3, 60], ['⚡', 'rain', 20, 40], ['💥', 'burst', 30, 34]], flash: 1, laser: 1 },
    offline: { bg: ['#1a2a1a', '#050a05'], items: [['📖', 'float', 10, 36], ['🌳', 'march', 8, 60], ['🧺', 'pulse', 1, 100]] },
    fax: { bg: ['#2a2a24', '#0a0a08'], items: [['📠', 'pulse', 1, 130], ['📄', 'rain', 40, 28], ['👴', 'float', 4, 46]] },
    handshake: { bg: ['#0a2a2a', '#020a0a'], items: [['🤝', 'pulse', 1, 140], ['❤', 'burst', 30, 28], ['🕊', 'fly', 4, 40]] },
    stream: { bg: ['#2a0a3a', '#0a0210'], items: [['🎮', 'pulse', 1, 130], ['💜', 'rise', 30, 28], ['💬', 'float', 14, 34], ['🎉', 'burst', 20, 26]] },
    song: { bg: ['#2a0a3a', '#0a0210'], items: [['🎤', 'pulse', 1, 130], ['🎶', 'burst', 30, 30], ['🏆', 'float', 3, 50], ['💡', 'rain', 20, 24]] },
    whale: { bg: ['#0d3b66', '#05182a'], items: [['🐋', 'stomp', 1, 230], ['🚢', 'march', 4, 50], ['💦', 'burst', 20, 28]] },
    whalefree: { bg: ['#0d3b66', '#05182a'], items: [['🐋', 'flyL', 1, 160], ['💦', 'rise', 30, 26], ['👋', 'float', 6, 40]] },
    catvote: { bg: ['#2a1a2a', '#0a050a'], items: [['🐈', 'pulse', 1, 170], ['🗳', 'rain', 20, 34], ['🎉', 'burst', 20, 26], ['🐟', 'float', 6, 34]] },
    football: { bg: ['#0a3a0a', '#021002'], items: [['⚽', 'orbit', 3, 50], ['🏟', 'pulse', 1, 130], ['🎉', 'burst', 30, 26], ['📣', 'march', 8, 40]] },
    hole: { bg: ['#1a140a', '#050302'], items: [['🕳', 'pulse', 1, 220], ['🚧', 'march', 6, 46], ['😮', 'float', 6, 40]], shake: 1 },
    treasure: { bg: ['#2a2005', '#0a0802'], items: [['🏺', 'pulse', 1, 120], ['💎', 'burst', 30, 30], ['📜', 'float', 8, 34], ['💰', 'rain', 30, 26]] },
    droneshow: { bg: ['#05081a', '#000'], items: [['✨', 'orbit', 40, 16], ['🛸', 'float', 10, 30], ['🐈', 'pulse', 1, 120]] },
    monolith: { bg: ['#2a2010', '#0a0805'], items: [['🗿', 'pulse', 1, 200], ['🧑‍🔬', 'march', 5, 40], ['❓', 'float', 10, 36]] },
    satfall: { bg: ['#05081a', '#000'], items: [['🛰', 'fly', 1, 90], ['🔥', 'fly', 6, 30], ['😬', 'float', 6, 40]] },
    banana: { bg: ['#2a2a05', '#0a0a02'], items: [['🍌', 'rain', 40, 34], ['🐒', 'march', 6, 50], ['📈', 'pulse', 1, 110]] },
    pigeons: { bg: ['#2a2a2a', '#0a0a0a'], items: [['🕊', 'rain', 50, 30], ['🚗', 'march', 3, 50], ['🏛', 'pulse', 1, 110]] },
    penguins: { bg: ['#a8d8ff', '#3a6a9a'], items: [['🐧', 'march', 14, 44], ['🧊', 'float', 6, 50], ['📋', 'pulse', 1, 90]] },
    un: { bg: ['#0a2a4a', '#020a14'], items: [['🇺🇳', 'pulse', 1, 140], ['🗳', 'orbit', 10, 34], ['🕊', 'fly', 4, 40]] }
  };
  const SCN_T = {};
  function drawScene(cx, W, H, u, t, S, P) {
    const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, S.bg[0]); g.addColorStop(1, S.bg[1]); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    if (S.shake) cx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    if (S.laser) for (let i = 0; i < 4; i++) { if (Math.random() < 0.5) { cx.strokeStyle = i % 2 ? '#ff3b6b' : '#3bffb0'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(Math.random() * W, 0); cx.lineTo(Math.random() * W, H); cx.stroke(); } }
    if (S.draw) { cx.save(); S.draw(cx, W, H, u, t); cx.restore(); } const mx = W / 2, my = H * 0.5; cx.textAlign = 'center'; cx.textBaseline = 'middle'; let pi = 0;
    S.items.forEach(([e, mode, n, sz]) => { cx.font = `${sz}px serif`; for (let i = 0; i < n; i++) { const p = P[(pi++) % P.length]; let x = mx, y = my, sc = 1, rot = 0;
      if (mode === 'rain') { x = p.x; y = (p.y + u * 140 * p.v) % (H + 60) - 30; rot = Math.sin(u * 2 + i) * 0.4; }
      else if (mode === 'rise') { x = p.x; y = H + 30 - ((p.y + u * 120 * p.v) % (H + 60)); }
      else if (mode === 'float') { x = p.x; y = p.y * 0.7 + H * 0.15 + Math.sin(u * 2 + i) * 20; }
      else if (mode === 'march' || mode === 'marchL') { const d = mode === 'march' ? 1 : -1; const span = W + 200; x = ((i * span / n + u * 110 * d) % span + span) % span - 100; y = H * 0.78 - Math.abs(Math.sin(u * 7 + i)) * 14; if (d < 0) x = W - x; }
      else if (mode === 'fly' || mode === 'flyL') { const d = mode === 'fly' ? 1 : -1; const span = W + 300; x = ((i * span / Math.max(1, n) + u * 260) % span) - 150; if (d < 0) x = W - x; y = H * 0.22 + (i % 3) * 50 + Math.sin(u * 3 + i) * 15; }
      else if (mode === 'stomp') { y = H * 0.62 - Math.abs(Math.sin(u * 2.2)) * 40; sc = 1 + Math.abs(Math.sin(u * 2.2)) * 0.06; x = mx + Math.sin(u * 0.8) * 80; }
      else if (mode === 'pulse') { sc = 1 + Math.sin(u * 4) * 0.08; y = my; }
      else if (mode === 'zoom') { sc = Math.min(1.2, t * 2.5); y = my - 40; }
      else if (mode === 'orbit') { const a = u * 1.4 + i / n * 6.28; x = mx + Math.cos(a) * W * 0.28; y = my + Math.sin(a) * H * 0.22; }
      else if (mode === 'burst') { const a = p.a, d = ((u * 180 * p.v) % (Math.max(W, H) * 0.7)); x = mx + Math.cos(a) * d; y = my + Math.sin(a) * d; }
      else if (mode === 'spin') { rot = u * 3; y = my; }
      else if (mode === 'dot') { x = mx + Math.cos(u * 3.1) * W * 0.35; y = my + Math.sin(u * 4.3) * H * 0.25; }
      else if (mode === 'chase') { x = mx + Math.cos(u * 3.1 - 0.5) * W * 0.3; y = my + 40 + Math.sin(u * 4.3 - 0.5) * H * 0.2; rot = Math.sin(u * 6) * 0.2; }
      cx.save(); cx.translate(x, y); cx.rotate(rot); cx.scale(sc, sc); cx.fillText(e, 0, 0); cx.restore(); } });
    if (S.flash && Math.random() < 0.08) { cx.fillStyle = 'rgba(255,255,255,0.35)'; cx.fillRect(0, 0, W, H); }
    cx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const isBusy = () => busy;
  function play(e) { if (!e || !(TXT[e.kind] || SCN[e.kind]) || (typeof AUD !== 'undefined' && AUD.S.fx === false) || !G || document.body.classList.contains('stream') && !AUD.S.fxStream) return; Q.push(e); if (!busy) next(); }
  function next() {
    const e = Q.shift(); if (!e) { busy = false; return; } busy = true;
    const cv = document.createElement('canvas'); cv.id = 'fxcv'; document.body.appendChild(cv); const W = cv.width = innerWidth, H = cv.height = innerHeight, cx = cv.getContext('2d');
    const T0 = performance.now(), DUR = 4300, en = LORA.lang === 'en'; let done = false; const end = () => { if (done) return; done = true; cv.style.opacity = 0; setTimeout(() => { cv.remove(); next(); }, 400); }; cv.onclick = end;
    try { AUD.sfx && AUD.sfx(e.kind === 'sport' || e.kind === 'rocket' || e.kind === 'asteroid_ok' ? 'good' : 'news'); } catch (x) { }
    const R = Math.random, P = Array.from({ length: 160 }, () => ({ x: R() * W, y: R() * H, v: 0.5 + R() * 2, s: 1 + R() * 3, a: R() * 6.28 }));
    const tr = x => (en && typeof t_ === 'function') ? t_(x) : x; const title = e.title ? tr(e.title) : (TXT[e.kind] || ['', ''])[en ? 1 : 0] + (e.where ? ' · ' + (en && typeof t_ === 'function' ? t_(e.where) : e.where) : '') + (e.who ? ' · ' + e.who : '') + (e.win ? ' · ' + e.win : '');
    const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
    function frame(now) {
      if (done) return; const t = Math.max(0, (now - T0) / DUR), u = Math.max(0, (now - T0) / 1000); if (t > 1) { end(); return; }
      const fade = Math.min(1, t * 6, (1 - t) * 6); cx.clearRect(0, 0, W, H); cx.globalAlpha = fade;
      cx.fillStyle = 'rgba(3,6,12,0.55)'; cx.fillRect(0, 0, W, H);
      const k = e.kind, mx = W / 2, my = H * 0.45; if (SCN[k]) { drawScene(cx, W, H, u, t, SCN[k], P); cx.globalAlpha = fade; }
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
      if (k === 'time') { for (let i = 0; i < 14; i++) { cx.strokeStyle = `hsla(${(u * 120 + i * 25) % 360},90%,65%,0.6)`; cx.lineWidth = 3; cx.beginPath(); cx.arc(mx, my, 20 + i * 22 + (u * 80) % 22, 0, 7); cx.stroke(); } cx.font = '64px serif'; cx.textAlign = 'center'; cx.fillText(t > 0.4 ? '👨‍🚀' : '⏳', mx, my + 22); cx.fillStyle = '#ffd34d'; cx.font = '700 28px monospace'; cx.fillText(String(2099 - Math.floor(ease(t * 1.5) * 73)), mx, my + 90); }
      if (k === 'flood') { const lv = H * (0.9 - 0.35 * ease(t * 1.5)); cx.fillStyle = 'rgba(40,120,200,0.75)'; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W; x += 20) cx.lineTo(x, lv + Math.sin(x / 60 + u * 4) * 10); cx.lineTo(W, H); cx.fill(); cx.font = '40px serif'; ['🏠', '🏢', '🌴', '🚗'].forEach((c, i) => cx.fillText(c, W * (0.2 + i * 0.2), lv - 6 + Math.sin(u * 3 + i) * 6)); }
      if (k === 'rocket') { const y = H * (0.9 - ease(t * 1.3) * 0.9); cx.font = '70px serif'; cx.textAlign = 'center'; cx.fillText('🚀', mx, y); for (let i = 0; i < 30; i++) { cx.fillStyle = `rgba(255,${150 + R() * 100},60,${0.6 * R()})`; cx.beginPath(); cx.arc(mx + (R() - 0.5) * 40, y + 40 + R() * 80, 4 + R() * 10, 0, 7); cx.fill(); } }
      if (k === 'sport' || k === 'rocket' || k === 'asteroid_ok') P.forEach((p, i) => { const y = (p.y + u * 160 * p.v) % H; cx.fillStyle = `hsl(${i * 37 % 360},90%,60%)`; cx.save(); cx.translate(p.x, y); cx.rotate(u * 4 + i); cx.fillRect(-4, -2, 8, 4); cx.restore(); });
      if (k === 'sport') { cx.font = '110px serif'; cx.textAlign = 'center'; cx.fillText(e.sp === 'wc' ? '⚽' : '🏆', mx, my + 30 + Math.sin(u * 4) * 10); }
      if (k === 'leak') P.slice(0, 60).forEach((p, i) => { const y = (p.y + u * 120 * p.v) % H; cx.save(); cx.translate(p.x, y); cx.rotate(Math.sin(u * 2 + i) * 0.8); cx.fillStyle = '#f4f1e6'; cx.fillRect(-18, -24, 36, 48); cx.fillStyle = '#b22'; cx.fillRect(-14, -16, 28, 5); cx.fillStyle = '#999'; for (let l = 0; l < 4; l++) cx.fillRect(-14, -6 + l * 7, 28, 2); cx.restore(); });
      if (k === 'exercise') { for (let i = 0; i < 8; i++) { const x = (i * W / 8 + u * 140) % (W + 100) - 50; cx.font = '46px serif'; cx.fillText(i % 3 ? '🎖' : '🛡', x, H * 0.7); } for (let i = 0; i < 3; i++) { cx.font = '40px serif'; cx.fillText('✈', (W - (u * 400 + i * 300) % (W + 200)), H * 0.25 + i * 40); } }
      // заголовок
      cx.globalAlpha = fade; cx.textAlign = 'center'; cx.font = `700 ${Math.round(Math.min(W, H) * 0.06)}px Pixelify, system-ui`; cx.lineWidth = 8; cx.strokeStyle = '#05080d'; cx.strokeText(title, mx, H * 0.14); cx.fillStyle = '#ffd34d'; cx.fillText(title, mx, H * 0.14);
      if (e.sub) { cx.font = `600 ${Math.round(Math.min(W, H) * 0.026)}px system-ui`; cx.lineWidth = 6; cx.strokeStyle = '#05080d'; const sub = tr(String(e.sub)).slice(0, 160); cx.strokeText(sub, mx, H * 0.21); cx.fillStyle = '#e8f0f8'; cx.fillText(sub, mx, H * 0.21); }
      cx.font = '13px system-ui'; cx.fillStyle = 'rgba(220,230,240,0.6)'; cx.fillText(en ? 'click to skip' : 'клік — пропустити', mx, H - 40);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  LORA.bus.on('fx', play);
  LORA.bus.on('disaster', d => { if (d && /метеорит/.test(d.label || '')) play({ kind: 'impact', where: '' }); });
  return { play, busy: isBusy, scenes: () => Object.keys(SCN), add: (k, sc, txt) => { SCN[k] = sc; if (txt) TXT[k] = txt; }, qlen: () => Q.length };
})();
