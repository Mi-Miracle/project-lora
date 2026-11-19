// ЗАСТАВКА ЗАПУСКУ: логотип розробника Mi_Miracle → обертовий голографічний глобус із регіонами світу, радар,
// назва гри. Будь-яка клавіша або клік — пропустити. Вимикається в налаштуваннях (localStorage lora_intro=off).
(function () {
  if (sessionStorage.getItem('lora_menu')) { sessionStorage.removeItem('lora_menu'); return; }
  if (localStorage.getItem('lora_intro') === 'off' || /[?&](nointro|test)/.test(location.search) || (navigator.webdriver && !/[?&]intro/.test(location.search))) return;
  const ov = document.createElement('div'); ov.id = 'intro'; ov.innerHTML = '<canvas></canvas><div class="intro-skip">' + (LORA.lang === 'en' ? 'click or press a key to skip the animation' : 'клік або клавіша — пропустити анімацію') + '</div>';
  document.body.appendChild(ov); const cv = ov.querySelector('canvas'), cx = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1); const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit(); addEventListener('resize', fit);
  const pts = (LORA.data.regions || []).map(r => [r.c[0] * Math.PI / 180, r.c[1] * Math.PI / 180]);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // частинки для збирання логотипа
  const P = Array.from({ length: 420 }, () => ({ x: rnd(-1, 1), y: rnd(-1, 1), tx: 0, ty: 0, s: rnd(0.6, 1.8), d: rnd(0, 0.5) }));
  let logoPts = null;
  function sampleText() { const c = document.createElement('canvas'); c.width = 900; c.height = 220; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = '700 120px Pixelify, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Mi_Miracle', 450, 110);
    const d = g.getImageData(0, 0, 900, 220).data, out = []; for (let y = 0; y < 220; y += 5) for (let x = 0; x < 900; x += 5) if (d[(y * 900 + x) * 4 + 3] > 128) out.push([(x - 450) / 450, (y - 110) / 450]); return out; }
  let T0s = performance.now(); let done = false, raf = 0;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  function finish() { if (done) return; done = true; ['pointerdown', 'keydown'].forEach(e => removeEventListener(e, onKey)); ov.classList.add('out'); setTimeout(() => { cancelAnimationFrame(raf); ov.remove(); removeEventListener('resize', fit); }, 700); }
  let jumped = 0; const onKey = () => { const t = (performance.now() - T0s) / 1000; if (t < 7.4 && !jumped) { jumped = 1; T0s = performance.now() - 7400; return; } finish(); };
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, onKey));
  const tk = []; let tkLast = 0; const TK_SPEED = 55, TK_GAP = 260; // стрічка: повільно, з проміжками між новинами
  try { if (window.AUD && AUD.S.sfx) setTimeout(() => { try { AUD.sfx('news'); } catch (e) { } }, 2600); } catch (e) { }
  function frame(now) {
    if (done && ov.classList.contains('gone')) return; const t = (now - T0s) / 1000; const S = Math.min(W, H);
    cx.fillStyle = '#05080d'; cx.fillRect(0, 0, W, H);
    // сітка й скан-лінії
    cx.strokeStyle = 'rgba(80,160,255,0.05)'; cx.lineWidth = 1; for (let x = (t * 12) % 40; x < W; x += 40) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); } for (let y = 0; y < H; y += 40) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
    if (t < 3.1) { // ---- логотип розробника
      if (!logoPts) { logoPts = sampleText(); P.forEach((p, i) => { const q = logoPts[i % logoPts.length]; p.tx = q[0]; p.ty = q[1]; }); }
      const k = ease((t - 0.2) / 1.3), fade = t > 2.5 ? 1 - (t - 2.5) / 0.6 : 1, sc = S * 0.55;
      cx.save(); cx.translate(W / 2, H / 2); cx.globalAlpha = Math.max(0, fade);
      P.forEach(p => { const kk = ease((t - 0.2 - p.d) / 1.2); const x = (p.x + (p.tx - p.x) * kk) * sc, y = (p.y + (p.ty - p.y) * kk) * sc; cx.fillStyle = kk > 0.98 ? '#ffd34d' : 'rgba(120,190,255,0.85)'; cx.fillRect(x, y, p.s * 2, p.s * 2); });
      if (k > 0.9) { cx.shadowColor = '#ffb020'; cx.shadowBlur = 25 * (k - 0.9) * 10; cx.fillStyle = `rgba(255,211,77,${(k - 0.9) * 10})`; cx.font = `700 ${Math.round(sc * 0.235)}px Pixelify, system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('Mi_Miracle', 0, 0); cx.shadowBlur = 0;
        cx.fillStyle = 'rgba(200,220,240,0.8)'; cx.font = `400 ${Math.round(sc * 0.045)}px system-ui, sans-serif`; cx.fillText(LORA.lang === 'en' ? 'presents' : 'представляє', 0, sc * 0.2); }
      cx.restore();
    } else { // ---- глобус, радар, назва
      const u = t - 3.1, R = Math.min(S * 0.26, H * 0.27) * (0.6 + 0.4 * ease(u / 1.2)), cxm = W / 2, cym = H * 0.555, rot = u * 0.35 + 0.5, tilt = 0.35; const a = Math.min(1, u / 0.8);
      cx.save(); cx.globalAlpha = a;
      const gr = cx.createRadialGradient(cxm - R * 0.3, cym - R * 0.3, R * 0.1, cxm, cym, R * 1.1); gr.addColorStop(0, 'rgba(40,110,200,0.35)'); gr.addColorStop(1, 'rgba(5,15,30,0.05)'); cx.fillStyle = gr; cx.beginPath(); cx.arc(cxm, cym, R, 0, 7); cx.fill();
      cx.strokeStyle = 'rgba(100,180,255,0.5)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(cxm, cym, R, 0, 7); cx.stroke();
      const proj = (lo, la) => { const x = Math.cos(la) * Math.sin(lo + rot), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo + rot); const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt); return [cxm + x * R, cym - y2 * R, z2]; };
      cx.strokeStyle = 'rgba(100,180,255,0.16)'; cx.lineWidth = 1;
      for (let lo = -180; lo < 180; lo += 30) { cx.beginPath(); let f = true; for (let la = -90; la <= 90; la += 6) { const [x, y, z] = proj(lo * Math.PI / 180, la * Math.PI / 180); if (z < 0) { f = true; continue; } f ? cx.moveTo(x, y) : cx.lineTo(x, y); f = false; } cx.stroke(); }
      for (let la = -60; la <= 60; la += 30) { cx.beginPath(); let f = true; for (let lo = -180; lo <= 180; lo += 6) { const [x, y, z] = proj(lo * Math.PI / 180, la * Math.PI / 180); if (z < 0) { f = true; continue; } f ? cx.moveTo(x, y) : cx.lineTo(x, y); f = false; } cx.stroke(); }
      const sweep = (u * 1.6) % (Math.PI * 2);
      for (const [lo, la] of pts) { const [x, y, z] = proj(lo, la); if (z < 0.02) continue; let ang = Math.atan2(y - cym, x - cxm); let dA = (sweep - ang + Math.PI * 4) % (Math.PI * 2); const hot = dA < 0.6 ? 1 - dA / 0.6 : 0;
        cx.fillStyle = hot > 0 ? `rgba(255,${180 + hot * 60},80,${0.5 + hot * 0.5})` : `rgba(120,200,255,${0.25 + z * 0.55})`; const s = 1.2 + z * 1.6 + hot * 2; cx.fillRect(x - s / 2, y - s / 2, s, s); }
      // радарний промінь
      const gx = cx.createLinearGradient(cxm, cym, cxm + Math.cos(sweep) * R, cym + Math.sin(sweep) * R); gx.addColorStop(0, 'rgba(255,200,80,0)'); gx.addColorStop(1, 'rgba(255,200,80,0.35)');
      cx.strokeStyle = gx; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(cxm, cym); cx.lineTo(cxm + Math.cos(sweep) * R, cym + Math.sin(sweep) * R); cx.stroke();
      // дуги «ракет»
      for (let k = 0; k < 4; k++) { const ph = (u * 0.5 + k * 0.27) % 1; const A = pts[(k * 97) % pts.length], B = pts[(k * 211 + 50) % pts.length]; if (!A || !B) continue; const pa = proj(A[0], A[1]), pb = proj(B[0], B[1]); if (pa[2] < 0 || pb[2] < 0) continue;
        const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2 - R * 0.35; cx.strokeStyle = `rgba(255,90,70,${0.6 * (1 - ph)})`; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(pa[0], pa[1]); cx.quadraticCurveTo(mx, my, pa[0] + (pb[0] - pa[0]) * ph, pa[1] + (pb[1] - pa[1]) * ph - Math.sin(ph * Math.PI) * R * 0.18); cx.stroke(); }
      cx.restore();
      // назва й увесь текст — угорі
      const ta = ease((u - 0.9) / 0.9); if (ta > 0) { const title = 'L.O.R.A.', n = Math.floor(title.length * Math.min(1, (u - 0.9) / 1.0)), ty = H * 0.1 + S * 0.04, fs = Math.round(Math.min(S * 0.085, W * 0.07)); cx.save(); cx.globalAlpha = ta; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
        cx.fillStyle = 'rgba(255,211,77,0.85)'; cx.font = `600 ${Math.round(S * 0.018)}px system-ui, sans-serif`; cx.fillText((LORA.lang === 'en' ? 'MI_MIRACLE PRESENTS' : 'MI_MIRACLE ПРЕДСТАВЛЯЄ').split('').join(String.fromCharCode(8202)), W / 2, ty - fs * 0.95);
        const gl = Math.random() < 0.04 ? (Math.random() - 0.5) * 12 : 0; cx.font = `700 ${fs}px Pixelify, system-ui, sans-serif`; if (gl) { cx.fillStyle = 'rgba(255,60,80,0.6)'; cx.fillText(title.slice(0, n), W / 2 + gl, ty + 2); } cx.shadowColor = '#4fb3ff'; cx.shadowBlur = 18; cx.fillStyle = '#e8f3ff'; cx.fillText(title.slice(0, n) + (n < title.length && Math.floor(u * 6) % 2 ? '▌' : ''), W / 2, ty); cx.shadowBlur = 0;
        const sa = ease((u - 2.0) / 0.7); cx.globalAlpha = sa; cx.fillStyle = '#ffd34d'; cx.font = `400 ${Math.round(S * 0.026)}px system-ui, sans-serif`; cx.fillText('LORDS OF REAL ATLAS', W / 2, ty + S * 0.05); cx.fillStyle = 'rgba(200,220,240,0.75)'; cx.font = `400 ${Math.round(S * 0.019)}px system-ui, sans-serif`; cx.fillText(LORA.lang === 'en' ? 'Grand strategy on the real world map' : 'Глобальна стратегія на реальній мапі світу', W / 2, ty + S * 0.083);
        cx.fillStyle = 'rgba(180,200,220,0.6)'; cx.font = `400 ${Math.round(S * 0.017)}px system-ui, sans-serif`; cx.fillText('© Mi_Miracle · v' + (LORA.version || ''), W / 2, ty + S * 0.112); cx.restore(); }
      // супутники на орбіті
      for (let k = 0; k < 3; k++) { const ang = u * (0.6 + k * 0.25) + k * 2.1, rx = R * (1.25 + k * 0.08), ry = R * (0.32 + k * 0.1); const x = cxm + Math.cos(ang) * rx, y = cym + Math.sin(ang) * ry * (k % 2 ? -1 : 1);
        cx.strokeStyle = 'rgba(120,190,255,0.12)'; cx.beginPath(); cx.ellipse(cxm, cym, rx, ry, 0, 0, 7); cx.stroke(); cx.fillStyle = '#cfe8ff'; cx.fillRect(x - 3, y - 1, 6, 2); cx.fillStyle = '#4fb3ff'; cx.fillRect(x - 7, y - 1, 3, 2); cx.fillRect(x + 4, y - 1, 3, 2); }
      // кумедне: НЛО краде супутник, гусак із прапорцем крокує по сцені
      { const cyc = (u - 2.4) % 16; if (u > 2.4 && cyc < 7) { const q = cyc / 7, ux = -120 + (W + 240) * q, uy = cym - R * 1.15 + Math.sin(u * 3) * 8; const grab = q > 0.42 && q < 0.62;
          if (grab) { cx.fillStyle = 'rgba(140,255,170,0.18)'; cx.beginPath(); cx.moveTo(ux - 18, uy + 8); cx.lineTo(ux + 18, uy + 8); cx.lineTo(ux + 55, uy + 120); cx.lineTo(ux - 55, uy + 120); cx.fill(); const sy = uy + 110 - 100 * ((q - 0.42) / 0.2); cx.fillStyle = '#cfe8ff'; cx.fillRect(ux - 3, sy, 6, 2); cx.fillStyle = '#4fb3ff'; cx.fillRect(ux - 8, sy, 3, 2); cx.fillRect(ux + 5, sy, 3, 2); }
          cx.fillStyle = '#9fb6cc'; cx.beginPath(); cx.ellipse(ux, uy, 34, 9, 0, 0, 7); cx.fill(); cx.fillStyle = '#d8f0ff'; cx.beginPath(); cx.ellipse(ux, uy - 6, 14, 9, 0, Math.PI, 0); cx.fill();
          for (let i = 0; i < 4; i++) { cx.fillStyle = Math.floor(u * 8 + i) % 2 ? '#ffd34d' : '#ff5a8a'; cx.fillRect(ux - 22 + i * 14, uy + 1, 3, 3); }
          if (q > 0.62 && q < 0.8) { cx.fillStyle = 'rgba(255,255,255,0.85)'; cx.font = `600 ${Math.round(S * 0.016)}px system-ui`; cx.textAlign = 'center'; cx.fillText(LORA.lang === 'en' ? 'mine now 👽' : 'тепер це наше 👽', ux, uy - 22); } } }
      { const gw = (u - 4) % 22; if (u > 4 && gw < 14) { const q = gw / 14, gx = W + 60 - (W + 160) * q, gy = H - Math.max(24, S * 0.036) * 1.35 - S * 0.012, st = Math.sin(u * 10); cx.save(); cx.translate(gx, gy);
          cx.strokeStyle = '#ff9a2a'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(-4, -6); cx.lineTo(-4 + st * 5, 4); cx.moveTo(4, -6); cx.lineTo(4 - st * 5, 4); cx.stroke();
          cx.fillStyle = '#f2f2ee'; cx.beginPath(); cx.ellipse(0, -14, 16, 10, 0, 0, 7); cx.fill(); cx.fillRect(-14, -40, 6, 26); cx.beginPath(); cx.arc(-11, -42, 6, 0, 7); cx.fill(); cx.fillStyle = '#ff9a2a'; cx.beginPath(); cx.moveTo(-17, -43); cx.lineTo(-26, -41); cx.lineTo(-17, -39); cx.fill(); cx.fillStyle = '#111'; cx.fillRect(-13, -45, 2, 2);
          cx.strokeStyle = '#8a6a4a'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(8, -18); cx.lineTo(8, -52); cx.stroke(); cx.fillStyle = '#4fb3ff'; cx.fillRect(8, -52, 26, 8); cx.fillStyle = '#ffd34d'; cx.fillRect(8, -44, 26, 8); cx.fillStyle = '#05080d'; cx.font = '700 7px system-ui'; cx.textAlign = 'left'; cx.fillText('LORA', 10, -45);
          if (Math.floor(u * 1.3) % 4 === 0) { cx.fillStyle = '#fff'; cx.font = `700 ${Math.round(S * 0.016)}px system-ui`; cx.textAlign = 'center'; cx.fillText(LORA.lang === 'en' ? 'HONK!' : 'ГА-ГА!', -14, -60); } cx.restore(); } }
      // ще приколи: трактор тягне танк, кіт на глобусі, ракета «не туди», голуб із посилкою
      { const tq = (u - 9) % 26; if (u > 9 && tq < 11) { const q = tq / 11, x = -160 + (W + 320) * q, y = H - Math.max(24, S * 0.036) * 1.35 - S * 0.018; cx.save(); cx.font = `${Math.round(S * 0.05)}px serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
          cx.save(); cx.translate(x, y); cx.scale(-1, 1); cx.fillText('🚜', 0, 0); cx.restore(); cx.strokeStyle = '#8a6a4a'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x - S * 0.03, y - S * 0.012); cx.lineTo(x - S * 0.075, y - S * 0.012); cx.stroke();
          cx.save(); cx.translate(x - S * 0.11, y + Math.sin(u * 12) * 1.5); cx.rotate(-0.04); cx.fillStyle = '#3f5a2a'; cx.fillRect(-S * 0.04, -S * 0.022, S * 0.08, S * 0.022); cx.fillRect(-S * 0.015, -S * 0.034, S * 0.035, S * 0.013); cx.fillRect(S * 0.018, -S * 0.03, S * 0.04, S * 0.005); cx.restore();
          if (q > 0.3 && q < 0.6) { cx.fillStyle = '#ffd34d'; cx.font = `700 ${Math.round(S * 0.016)}px system-ui`; cx.fillText(LORA.lang === 'en' ? 'found it in the field 🌾' : 'знайшли в полі 🌾', x - S * 0.05, y - S * 0.07); } cx.restore(); } }
      { const cq = (u - 6) % 19; if (u > 6 && cq < 6) { const a = Math.min(1, cq / 0.6, (6 - cq) / 0.6), bob = Math.sin(u * 3) * 2; cx.save(); cx.globalAlpha = a; cx.font = `${Math.round(S * 0.055)}px serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText('🐈', cxm + R * 0.05, cym - R * 0.97 + bob);
          if (cq > 2 && cq < 4.5) { cx.fillStyle = '#fff'; cx.font = `600 ${Math.round(S * 0.015)}px system-ui`; cx.fillText(LORA.lang === 'en' ? 'this planet is mine now' : 'тепер це моя планета', cxm + R * 0.05, cym - R * 1.1); } cx.restore(); } }
      { const rq = (u - 12) % 23; if (u > 12 && rq < 5) { const q = rq / 5; const x = cxm - R * 0.6 + q * R * 0.2 + Math.sin(q * 20) * q * 30, y = cym - R * 0.3 - q * R * 0.9 + (q > 0.6 ? (q - 0.6) * (q - 0.6) * R * 6 : 0); cx.save(); cx.translate(x, y); cx.rotate(q > 0.6 ? (q - 0.6) * 8 : -0.6); cx.font = `${Math.round(S * 0.035)}px serif`; cx.textAlign = 'center'; cx.fillText('🚀', 0, 0); cx.restore();
          if (q > 0.65) { cx.fillStyle = '#ff6a5a'; cx.font = `700 ${Math.round(S * 0.015)}px system-ui`; cx.textAlign = 'center'; cx.fillText(LORA.lang === 'en' ? 'oops… wrong way' : 'ой… не туди', x, y - 26); } } }
      { const pq = (u - 15) % 21; if (u > 15 && pq < 7) { const q = pq / 7, x = W + 50 - (W + 100) * q, y = H * 0.33 + Math.sin(u * 4) * 16; cx.save(); cx.font = `${Math.round(S * 0.035)}px serif`; cx.textAlign = 'center'; cx.fillText('🕊', x, y); cx.font = `${Math.round(S * 0.022)}px serif`; cx.fillText('📦', x + 4, y + S * 0.025);
          if (q > 0.4 && q < 0.7) { cx.fillStyle = '#e8f0f8'; cx.font = `600 ${Math.round(S * 0.014)}px system-ui`; cx.fillText(LORA.lang === 'en' ? 'Express delivery: 1 sanction' : 'Доставка: 1 санкція', x, y - 24); } cx.restore(); } }
      // ще приколи 2: метеозонд, пінгвіни, «завантаження», підводний човен, кіт-курсор
      { const bq = (u - 7.5) % 24; if (u > 7.5 && bq < 9) { const q = bq / 9, x = W * 0.82 - q * 40, y = H * 0.75 - q * H * 0.6; cx.save(); cx.font = `${Math.round(S * 0.04)}px serif`; cx.textAlign = 'center'; cx.fillText('🎈', x, y); cx.strokeStyle = '#aaa'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x, y + 6); cx.lineTo(x, y + 26); cx.stroke(); cx.font = `${Math.round(S * 0.018)}px serif`; cx.fillText('📷', x, y + 34);
          if (q > 0.25 && q < 0.6) { cx.fillStyle = '#e8f0f8'; cx.font = `600 ${Math.round(S * 0.014)}px system-ui`; cx.fillText(LORA.lang === 'en' ? "it's a weather balloon, honest" : 'це метеозонд, чесно', x, y - 26); } cx.restore(); } }
      { const pq = (u - 18) % 30; if (u > 18 && pq < 12) { const q = pq / 12; cx.save(); cx.font = `${Math.round(S * 0.032)}px serif`; cx.textAlign = 'center'; for (let i = 0; i < 5; i++) { const x = -60 - i * 38 + (W + 260) * q, y = H - Math.max(24, S * 0.036) * 1.35 - S * 0.012 - Math.abs(Math.sin(u * 8 + i)) * 4; cx.fillText('🐧', x, y); }
          cx.fillStyle = '#e8f0f8'; cx.font = `600 ${Math.round(S * 0.014)}px system-ui`; if (q > 0.35 && q < 0.65) cx.fillText(LORA.lang === 'en' ? 'Where is the Antarctica DLC?' : 'Де DLC з Антарктидою?', -60 + (W + 260) * q, H - Math.max(24, S * 0.036) * 1.35 - S * 0.06); cx.restore(); } }
      { if (u > 1.2 && u < 9) { const pc = Math.min(99.9, Math.floor(ease((u - 1.2) / 3) * 999) / 10); const st = (LORA.lang === 'en' ? ['Loading diplomacy', 'Loading economy', 'Calming the geese', 'Hiding the UFO', 'Loading diplomacy'] : ['Завантаження дипломатії', 'Завантаження економіки', 'Заспокоюємо гусей', 'Ховаємо НЛО', 'Завантаження дипломатії'])[Math.min(4, Math.floor((u - 1.2) / 1.6))];
          cx.save(); cx.textAlign = 'left'; cx.fillStyle = 'rgba(200,220,240,0.55)'; cx.font = `500 ${Math.round(S * 0.014)}px monospace`; cx.fillText(`${st}… ${pc.toFixed(1)}%`, 18, 24); cx.fillStyle = 'rgba(79,179,255,0.5)'; cx.fillRect(18, 32, 180 * pc / 100, 3); cx.restore(); } }
      { const sq = (u - 21) % 27; if (u > 21 && sq < 6) { const a = Math.min(1, sq / 0.7, (6 - sq) / 0.7); cx.save(); cx.globalAlpha = a; const x = cxm + R * 0.35, y = cym + R * 0.45; cx.strokeStyle = '#9fb6cc'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y - 22 - Math.sin(u * 2) * 3); cx.lineTo(x + 10, y - 22 - Math.sin(u * 2) * 3); cx.stroke();
          cx.fillStyle = '#e8f0f8'; cx.font = `600 ${Math.round(S * 0.014)}px system-ui`; cx.textAlign = 'center'; if (sq > 1.5 && sq < 4.5) cx.fillText(LORA.lang === 'en' ? 'periscope check: all clear 🫡' : 'перевірка перископа: чисто 🫡', x + 20, y - 34); cx.restore(); } }
      // ще приколи 3: шпигун з газетою, супутник і уламок, гуска-протестувальниця, шаурма-герой
      { const en = LORA.lang === 'en'; const lab = (t, x, y) => { cx.fillStyle = '#e8f0f8'; cx.font = `600 ${Math.round(S * 0.014)}px system-ui`; cx.textAlign = 'center'; cx.fillText(t, x, y); };
        { const q0 = (u - 11) % 26; if (u > 11 && q0 < 7) { const a = Math.min(1, q0 / 0.6, (7 - q0) / 0.6), x = W * 0.12, y = H * 0.62 - Math.sin(Math.min(1, q0) * 1.57) * 10; cx.save(); cx.globalAlpha = a; cx.font = `${Math.round(S * 0.05)}px serif`; cx.textAlign = 'center'; cx.fillText('📰', x, y); cx.font = `${Math.round(S * 0.02)}px serif`; cx.fillText(Math.floor(u * 1.5) % 3 ? '👀' : '😶', x, y - S * 0.012); if (q0 > 1.5 && q0 < 5.5) lab(en ? "I'm just reading. Totally not a spy" : 'я просто читаю. Зовсім не шпигун', x + 40, y - S * 0.05); cx.restore(); } }
        { const q1 = (u - 25) % 29; if (u > 25 && q1 < 6) { const q = q1 / 6, x = cxm - R * 1.2 + q * R * 2.4, y = cym - R * 0.95; cx.save(); cx.font = `${Math.round(S * 0.03)}px serif`; cx.textAlign = 'center'; cx.fillText('🛰', x, y); const dx = W - q * W * 1.1; cx.font = `${Math.round(S * 0.016)}px serif`; cx.fillText('🔩', dx, y + 4); if (Math.abs(dx - x) < 40) { cx.font = `${Math.round(S * 0.04)}px serif`; cx.fillText('💥', x, y); } if (q > 0.55 && q < 0.95) lab(en ? 'Kessler? Never heard of him' : 'Кесслер? Не чули', x, y - 28); cx.restore(); } }
        { const q2 = (u - 13) % 33; if (u > 13 && q2 < 10) { const q = q2 / 10, x = W + 40 - q * (W + 80), y = H * 0.86 - Math.abs(Math.sin(u * 6)) * 6; cx.save(); cx.font = `${Math.round(S * 0.034)}px serif`; cx.textAlign = 'center'; cx.fillText('🪿', x, y - S * 0.03); cx.font = `${Math.round(S * 0.026)}px serif`; cx.fillText('🪧', x + S * 0.03, y - S * 0.05); if (q > 0.3 && q < 0.7) lab(en ? 'GEESE FOR PEACE (and bread)' : 'ГУСИ ЗА МИР (і хліб)', x, y - S * 0.1); cx.restore(); } }
        { const q3 = (u - 30) % 35; if (u > 30 && q3 < 5) { const q = q3 / 5, x = -40 + q * (W + 80), y = H * 0.2 + Math.sin(q * 6.28) * 30; cx.save(); cx.font = `${Math.round(S * 0.034)}px serif`; cx.textAlign = 'center'; cx.fillText('🌯', x, y); cx.fillStyle = '#c0392b'; cx.beginPath(); cx.moveTo(x - 14, y - 6); cx.lineTo(x - 40, y + 10 + Math.sin(u * 12) * 5); cx.lineTo(x - 12, y + 8); cx.fill(); if (q > 0.35 && q < 0.75) lab(en ? 'Shawarma — hero of the city' : 'Шаурма — герой міста', x, y - 28); cx.restore(); } } }
      // стрічка новин (кумедні заголовки по одному, повільно, з проміжками)
      if (u > 1.5) { const hh = Math.max(24, S * 0.036), y0 = H - hh * 1.35, L0 = 110; cx.fillStyle = 'rgba(12,18,28,0.92)'; cx.fillRect(0, y0, W, hh); cx.fillStyle = 'rgba(170,20,25,0.95)'; cx.fillRect(0, y0, L0 - 10, hh); cx.fillStyle = 'rgba(255,211,77,0.7)'; cx.fillRect(0, y0, W, 2);
        cx.fillStyle = '#fff'; cx.font = `700 ${Math.round(hh * 0.5)}px system-ui, sans-serif`; cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.fillText((Math.floor(u * 2) % 2 ? '● ' : '○ ') + (LORA.lang === 'en' ? 'LIVE' : 'НАЖИВО'), 12, y0 + hh / 2);
        const dt = Math.min(0.1, (now - (tkLast || now)) / 1000); tkLast = now; cx.font = `400 ${Math.round(hh * 0.5)}px system-ui, sans-serif`;
        const lastE = tk.length ? tk[tk.length - 1].x + tk[tk.length - 1].w : -1e9; if (lastE + TK_GAP < W) { const txt = LORA.funNext ? LORA.funNext(LORA.lang) : ''; if (txt) tk.push({ txt, x: Math.max(W, lastE + TK_GAP), w: cx.measureText(txt).width }); }
        cx.save(); cx.beginPath(); cx.rect(L0, y0, W - L0, hh); cx.clip(); for (const it of tk) { it.x -= TK_SPEED * dt; cx.fillStyle = '#ffd34d'; cx.fillText('◆', it.x - 22, y0 + hh / 2); cx.fillStyle = '#e8f0f8'; cx.fillText(it.txt, it.x, y0 + hh / 2); } cx.restore();
        while (tk.length && tk[0].x + tk[0].w < L0 - 30) tk.shift(); }
      // «натисніть будь-яку клавішу»
      if (u > 4.0) { cx.save(); cx.globalAlpha = 0.45 + 0.45 * Math.sin(u * 3.2); cx.fillStyle = '#ffd34d'; cx.textAlign = 'center'; cx.font = `700 ${Math.round(S * 0.028)}px Pixelify, system-ui, sans-serif`; cx.fillText(LORA.lang === 'en' ? 'PRESS ANY KEY' : 'НАТИСНІТЬ БУДЬ-ЯКУ КЛАВІШУ', W / 2, H - Math.max(24, S * 0.036) * 1.35 - S * 0.045); cx.restore(); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
})();
