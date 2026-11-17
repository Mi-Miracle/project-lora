// ЗВУК І МУЗИКА: усе синтезується WebAudio (без аудіофайлів). Ефекти — sfx(тип); музика — генеративний чіптюн-ембієнт,
// що стає напруженішим під час війни. Налаштування зберігаються в localStorage('lora_audio').
const AUD = (() => {
  let S = { sfx: true, music: true, vol: 0.55, mvol: 0.32, tts: true, toasts: true, newscast: true, advisors: true, style: 'auto' };
  try { Object.assign(S, JSON.parse(localStorage.getItem('lora_audio') || '{}')); } catch (e) { }
  let ctx = null, master = null, sfxG = null, musG = null, noiseBuf = null;
  const save = () => { try { localStorage.setItem('lora_audio', JSON.stringify(S)); } catch (e) { } };
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = S.sfx ? S.vol : 0; sfxG.connect(master);
    musG = ctx.createGain(); musG.gain.value = S.music ? S.mvol : 0; musG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startMusic(); return true;
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function tone(f, t0, dur, type, vol, dest, slide) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, freq, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 800; const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  function sfx(type) {
    if (!S.sfx || !init()) return; const t = ctx.currentTime;
    switch (type) {
      case 'click': tone(880, t, 0.05, 'square', 0.08); break;
      case 'good': [72, 76, 79, 84].forEach((m, i) => tone(hz(m), t + i * 0.07, 0.16, 'square', 0.1)); break;
      case 'bad': [67, 63, 60].forEach((m, i) => tone(hz(m), t + i * 0.11, 0.22, 'sawtooth', 0.09)); break;
      case 'alert': [0, 1, 2].forEach(i => { tone(hz(81), t + i * 0.22, 0.1, 'square', 0.12); tone(hz(76), t + i * 0.22 + 0.11, 0.1, 'square', 0.12); }); break;
      case 'war': noise(t, 0.6, 0.5, 300); tone(hz(43), t, 0.7, 'sawtooth', 0.25, null, hz(31)); [55, 55, 58, 55].forEach((m, i) => tone(hz(m), t + 0.3 + i * 0.16, 0.18, 'square', 0.1)); break;
      case 'boom': noise(t, 0.9, 0.6, 500); tone(70, t, 0.6, 'sine', 0.4, null, 30); break;
      case 'news': [72, 79, 76, 84, 83].forEach((m, i) => { tone(hz(m), t + i * 0.13, 0.25, 'triangle', 0.16); tone(hz(m - 12), t + i * 0.13, 0.25, 'square', 0.05); }); break;
      case 'pop': tone(hz(84), t, 0.06, 'square', 0.1); tone(hz(91), t + 0.06, 0.08, 'square', 0.1); break;
      case 'quake': noise(t, 1.6, 0.6, 120); tone(45, t, 1.5, 'sine', 0.35, null, 25); break;
    }
  }
  // ---- генеративна музика: кілька стилів, «авто» обирає за ситуацією
  let musT = 0, step = 0, timer = null, curStyle = '', swapAt = 0;
  const STY = {
    ambient: { n: 'Спокійний ембієнт', bpm: 72, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], pad: 'triangle', bass: 'triangle', lead: 'square', arp: [0, 2, 1, 2, 0, 1, 2, 1], drums: 'soft' },
    synth:   { n: 'Синтвейв', bpm: 100, prog: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]], pad: 'sawtooth', bass: 'sawtooth', lead: 'square', arp: [0, 1, 2, 1, 0, 2, 1, 2], drums: 'four' },
    epic:    { n: 'Епічний оркестр', bpm: 84, prog: [[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]], pad: 'sawtooth', bass: 'triangle', lead: 'triangle', arp: [2, 1, 0, 1, 2, 2, 1, 0], drums: 'taiko' },
    march:   { n: 'Воєнний марш', bpm: 112, prog: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], pad: 'square', bass: 'sawtooth', lead: 'square', arp: [0, 0, 2, 1, 0, 0, 2, 2], drums: 'march' },
    tension: { n: 'Напруга', bpm: 90, prog: [[45, 48, 52], [46, 49, 53], [45, 48, 52], [44, 47, 51]], pad: 'sawtooth', bass: 'sine', lead: 'sine', arp: [0, 2, 0, 1, 0, 2, 0, 1], drums: 'pulse' },
    menu:    { n: 'Головне меню', bpm: 80, prog: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]], pad: 'triangle', bass: 'triangle', lead: 'triangle', arp: [0, 1, 2, 1, 2, 1, 0, 2], drums: 'soft' }
  };
  function autoStyle() {
    if (!window.G || !G.day) return 'menu'; const P = G.pv ? G.pv() : G.player; const war = P >= 0 && G.enemiesOf(P).length > 0; const n = G.N[P];
    if (war) { if (n && n.stab < 35) return 'tension'; return Math.floor(G.day / 90) % 2 ? 'epic' : 'march'; }
    if (n && n.stab < 30) return 'tension'; return Math.floor(G.day / 120) % 2 ? 'synth' : 'ambient';
  }
  function startMusic() { if (timer) return; musT = ctx.currentTime + 0.1; timer = setInterval(schedule, 120); }
  function schedule() {
    if (!ctx || !S.music) return; const want = S.style === 'auto' ? autoStyle() : S.style; if (want !== curStyle && step % 32 === 0) curStyle = want;
    const st = STY[curStyle] || STY.ambient, beat = 60 / st.bpm / 2;
    while (musT < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % 4, chord = st.prog[bar], s8 = step % 8;
      if (s8 === 0) chord.forEach(m => tone(hz(m), musT, beat * 8, st.pad, st.pad === 'sawtooth' ? 0.016 : 0.035, musG));
      if (s8 % 2 === 0 || st.drums === 'four') tone(hz(chord[0] - 12), musT, beat * (st.drums === 'four' ? 0.8 : 1.6), st.bass, 0.05, musG);
      if ((step * 7 + bar) % 3 !== 0 || curStyle === 'synth') tone(hz(chord[st.arp[(s8 + bar) % 8]] + 12), musT, beat * 0.9, st.lead, curStyle === 'epic' ? 0.03 : 0.018, musG);
      if (curStyle === 'epic' && s8 === 0 && bar % 2 === 0) tone(hz(chord[2] + 24), musT, beat * 6, 'triangle', 0.02, musG); // «хор»
      switch (st.drums) {
        case 'soft': if (s8 === 4) noise(musT, 0.05, 0.015, 5000, musG); break;
        case 'four': if (s8 % 2 === 0) noise(musT, 0.12, 0.09, 150, musG); if (s8 % 4 === 2) noise(musT, 0.08, 0.05, 3000, musG); noise(musT, 0.02, 0.015, 8000, musG); break;
        case 'taiko': if (s8 === 0 || s8 === 3 || s8 === 6) { noise(musT, 0.35, 0.16, 120, musG); tone(55, musT, 0.3, 'sine', 0.12, musG, 40); } break;
        case 'march': if (s8 % 4 === 0) noise(musT, 0.18, 0.13, 180, musG); if (s8 % 2 === 1) noise(musT, 0.05, 0.05, 2500, musG); if (s8 === 7) noise(musT, 0.04, 0.04, 2500, musG); break;
        case 'pulse': if (s8 % 4 === 0) tone(48, musT, 0.4, 'sine', 0.16, musG, 35); if (s8 === 6) noise(musT, 0.1, 0.03, 900, musG); break;
      }
      musT += beat; step++;
    }
  }
  function blip(p) { if (!S.sfx || !init()) return; const t = ctx.currentTime; tone(320 * p * (0.85 + Math.random() * 0.4), t, 0.05, 'square', 0.035); }
  function set(k, v) { S[k] = v; save(); if (!ctx) return; sfxG.gain.value = S.sfx ? S.vol : 0; musG.gain.value = S.music ? S.mvol : 0; }
  // ---- озвучування тексту (браузерний синтез мовлення)
  function speak(text, onEnd) {
    if (!S.tts || !window.speechSynthesis) { onEnd && onEnd(); return false; }
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const lang = LORA.lang === 'en' ? 'en' : 'uk';
      const v = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(lang) && /female|жін|Polina|Lesya|Samantha|Zira|Google/i.test(v.name)) || speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(lang));
      if (!v && lang === 'uk') { onEnd && onEnd(); return false; } if (v) u.voice = v; u.lang = lang === 'en' ? 'en-GB' : 'uk-UA'; u.rate = 1.03; u.onend = () => onEnd && onEnd(); speechSynthesis.speak(u); return true; } catch (e) { onEnd && onEnd(); return false; }
  }
  document.addEventListener('pointerdown', () => init(), { once: true });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) sfx('click'); });
  return { S, sfx, set, init, speak, blip, STY };
})();
