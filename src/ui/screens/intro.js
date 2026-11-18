// ЗАСТАВКА ЗАПУСКУ: логотип розробника Mi_Miracle → обертовий голографічний глобус із регіонами світу, радар,
// назва гри. Будь-яка клавіша або клік — пропустити. Вимикається в налаштуваннях (localStorage lora_intro=off).
(function () {
  if (localStorage.getItem('lora_intro') === 'off' || /[?&](nointro|test)/.test(location.search) || (navigator.webdriver && !/[?&]intro/.test(location.search))) return;
  const ov = document.createElement('div'); ov.id = 'intro'; ov.innerHTML = '<canvas></canvas><div class="intro-skip">' + (LORA.lang === 'en' ? 'click or press any key to skip' : 'клік або будь-яка клавіша — пропустити') + '</div>';
  document.body.appendChild(ov); const cv = ov.querySelector('canvas'), cx = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1); const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit(); addEventListener('resize', fit);
  const pts = (LORA.data.regions || []).map(r => [r.c[0] * Math.PI / 180, r.c[1] * Math.PI / 180]);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // частинки для збирання логотипа
  const P = Array.from({ length: 420 }, () => ({ x: rnd(-1, 1), y: rnd(-1, 1), tx: 0, ty: 0, s: rnd(0.6, 1.8), d: rnd(0, 0.5) }));
  let logoPts = null;
  function sampleText() { const c = document.createElement('canvas'); c.width = 900; c.height = 220; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.font = '700 120px Pixelify, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Mi_Miracle', 450, 110);
    const d = g.getImageData(0, 0, 900, 220).data, out = []; for (let y = 0; y < 220; y += 5) for (let x = 0; x < 900; x += 5) if (d[(y * 900 + x) * 4 + 3] > 128) out.push([(x - 450) / 450, (y - 110) / 450]); return out; }
  const T0 = performance.now(); let done = false, raf = 0;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  function finish() { if (done) return; done = true; ov.classList.add('out'); setTimeout(() => { cancelAnimationFrame(raf); ov.remove(); removeEventListener('resize', fit); }, 700); }
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, finish, { once: true }));
  try { if (window.AUD && AUD.S.sfx) setTimeout(() => { try { AUD.sfx('news'); } catch (e) { } }, 2600); } catch (e) { }
  function frame(now) {
    if (done && ov.classList.contains('gone')) return; const t = (now - T0) / 1000; const S = Math.min(W, H);
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
      const u = t - 3.1, R = S * 0.3 * (0.6 + 0.4 * ease(u / 1.2)), cxm = W / 2, cym = H * 0.46, rot = u * 0.35 + 0.5, tilt = 0.35; const a = Math.min(1, u / 0.8);
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
      // назва
      const ta = ease((u - 0.9) / 0.9); if (ta > 0) { const title = 'PROJECT LORA', n = Math.floor(title.length * Math.min(1, (u - 0.9) / 1.0)); cx.save(); cx.globalAlpha = ta; cx.textAlign = 'center';
        cx.shadowColor = '#4fb3ff'; cx.shadowBlur = 18; cx.fillStyle = '#e8f3ff'; cx.font = `700 ${Math.round(S * 0.085)}px Pixelify, system-ui, sans-serif`; cx.fillText(title.slice(0, n) + (n < title.length && Math.floor(u * 6) % 2 ? '▌' : ''), W / 2, cym + R + S * 0.11); cx.shadowBlur = 0;
        const sa = ease((u - 2.0) / 0.7); cx.globalAlpha = sa; cx.fillStyle = '#ffd34d'; cx.font = `400 ${Math.round(S * 0.026)}px system-ui, sans-serif`; cx.fillText(LORA.lang === 'en' ? 'Grand strategy on the real world map' : 'Глобальна стратегія на реальній мапі світу', W / 2, cym + R + S * 0.16);
        cx.fillStyle = 'rgba(180,200,220,0.6)'; cx.font = `400 ${Math.round(S * 0.018)}px system-ui, sans-serif`; cx.fillText('© Mi_Miracle · v' + (LORA.version || ''), W / 2, H - S * 0.04); cx.restore(); }
      if (u > 4.6) finish();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
})();
