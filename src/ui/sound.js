// ЗВУК І МУЗИКА: усе синтезується WebAudio (без аудіофайлів). Ефекти — sfx(тип); музика — генеративний чіптюн-ембієнт,
// що стає напруженішим під час війни. Налаштування зберігаються в localStorage('lora_audio').
const AUD = (() => {
  let S = { sfx: true, music: true, vol: 0.55, mvol: 0.32, tts: true, toasts: true, newscast: true, advisors: true, style: 'auto', voice: '', vrate: 1.03, vpitch: 1, vEvents: true, vAdv: false, vAnyLang: false, engine: 'auto', espeak: false, azKey: '', azRegion: 'westeurope', azVoice: 'uk-UA-PolinaNeural', azVoiceEn: 'en-US-AvaMultilingualNeural', elKey: '', elVoice: '', voiceVol: 0.9 };
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
  // progs — кілька прогресій на стиль (міняються кожні 4 такти), arp — малюнок арпеджіо
  const STY = {
    ambient: { n: 'Спокійний ембієнт', bpm: 72, progs: [[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], [[50, 53, 57], [55, 59, 62], [48, 52, 55], [53, 57, 60]]], pad: 'triangle', bass: 'triangle', lead: 'square', arp: [0, 2, 1, 2, 0, 1, 2, 1], drums: 'soft' },
    synth:   { n: 'Синтвейв', bpm: 100, progs: [[[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]], [[45, 48, 52], [53, 57, 60], [48, 52, 55], [55, 59, 62]]], pad: 'sawtooth', bass: 'sawtooth', lead: 'square', arp: [0, 1, 2, 1, 0, 2, 1, 2], drums: 'four' },
    epic:    { n: 'Епічний оркестр', bpm: 84, progs: [[[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]], [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]]], pad: 'sawtooth', bass: 'triangle', lead: 'triangle', arp: [2, 1, 0, 1, 2, 2, 1, 0], drums: 'taiko' },
    march:   { n: 'Воєнний марш', bpm: 112, progs: [[[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], [[50, 53, 57], [55, 58, 62], [53, 57, 60], [45, 49, 52]]], pad: 'square', bass: 'sawtooth', lead: 'square', arp: [0, 0, 2, 1, 0, 0, 2, 2], drums: 'march' },
    tension: { n: 'Напруга', bpm: 90, progs: [[[45, 48, 52], [46, 49, 53], [45, 48, 52], [44, 47, 51]], [[45, 48, 51], [44, 47, 50], [43, 46, 50], [44, 48, 51]]], pad: 'sawtooth', bass: 'sine', lead: 'sine', arp: [0, 2, 0, 1, 0, 2, 0, 1], drums: 'pulse' },
    menu:    { n: 'Головне меню', bpm: 80, progs: [[[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]]], pad: 'triangle', bass: 'triangle', lead: 'triangle', arp: [0, 1, 2, 1, 2, 1, 0, 2], drums: 'soft' },
    cold:    { n: 'Холодна війна', bpm: 76, progs: [[[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]], [[45, 48, 52], [50, 53, 57], [44, 47, 52], [45, 48, 52]]], pad: 'sawtooth', bass: 'square', lead: 'sine', arp: [0, 1, 0, 2, 0, 1, 2, 1], drums: 'pulse' },
    business:{ n: 'Ділові новини (лоу-фай)', bpm: 88, progs: [[[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [53, 57, 60, 64]], [[52, 55, 59, 62], [57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65]]], pad: 'triangle', bass: 'sine', lead: 'triangle', arp: [0, 2, 3, 1, 2, 0, 3, 2], drums: 'lofi' },
    piano:   { n: 'Фортепіано (персонаж)', bpm: 70, progs: [[[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 53]], [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [43, 47, 50, 55]]], pad: 'sine', bass: 'sine', lead: 'triangle', arp: [0, 1, 2, 3, 2, 1, 2, 3], drums: 'none' },
    heroic:  { n: 'Героїчний', bpm: 96, progs: [[[48, 55, 60], [53, 57, 60], [55, 59, 62], [48, 52, 55]], [[45, 52, 57], [53, 57, 60], [48, 55, 60], [55, 59, 62]]], pad: 'sawtooth', bass: 'triangle', lead: 'square', arp: [0, 2, 1, 2, 0, 2, 1, 0], drums: 'taiko' },
    eastern: { n: 'Східний мотив', bpm: 92, progs: [[[50, 51, 54], [50, 53, 57], [48, 51, 55], [50, 51, 54]]], pad: 'triangle', bass: 'triangle', lead: 'sawtooth', arp: [0, 1, 0, 2, 1, 0, 2, 1], drums: 'darbuka' },
    industrial:{ n: 'Індастріал', bpm: 118, progs: [[[40, 47, 52], [40, 46, 52], [38, 45, 50], [41, 48, 53]]], pad: 'square', bass: 'sawtooth', lead: 'sawtooth', arp: [0, 0, 1, 0, 2, 0, 1, 0], drums: 'four' },
    night:   { n: 'Нічне місто', bpm: 64, progs: [[[49, 53, 56, 60], [46, 49, 53, 56], [51, 54, 58, 61], [44, 48, 51, 54]]], pad: 'sine', bass: 'triangle', lead: 'sine', arp: [3, 2, 1, 0, 1, 2, 3, 2], drums: 'soft' },
    doom:    { n: 'Ядерна загроза', bpm: 60, progs: [[[40, 43, 46], [39, 42, 45], [40, 43, 46], [41, 44, 47]]], pad: 'sawtooth', bass: 'sine', lead: 'sine', arp: [0, 0, 1, 0, 0, 2, 0, 1], drums: 'heart' },
    victory: { n: 'Тріумф', bpm: 108, progs: [[[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]]], pad: 'triangle', bass: 'triangle', lead: 'square', arp: [0, 1, 2, 2, 1, 2, 0, 2], drums: 'march' }
  };
  Object.values(STY).forEach(st => { st.prog = st.progs[0]; });
  function autoStyle() {
    if (!window.G || !G.day) return 'menu'; const P = G.pv ? G.pv() : G.player; const n = P >= 0 ? G.N[P] : null; const war = P >= 0 && G.enemiesOf(P).length > 0;
    const cyc = (a, d) => a[Math.floor(G.day / d) % a.length];
    if (n && n.nk && n.nk.esc >= 3) return 'doom';
    if (G.player < 0 && G.leader && G.leader.role === 'char' && G.pc < 0) return war ? 'tension' : cyc(['piano', 'night', 'ambient'], 75);
    if (G.player < 0 && G.pc >= 0) return war ? cyc(['industrial', 'tension'], 90) : cyc(['business', 'synth', 'night'], 90);
    if (war) { if (n && n.stab < 35) return 'tension'; return cyc(['epic', 'march', 'heroic', 'industrial'], 90); }
    if (n && n.stab < 30) return 'tension';
    if (n && /RUS|CHN|USA|PRK|IRN/.test(n.a3) && G.wars && G.wars.size > 2) return cyc(['cold', 'ambient'], 120);
    if (n && /SAU|IRN|IRQ|EGY|TUR|ARE|SYR|ISR|JOR|QAT|KWT|OMN|YEM|MAR|DZA|PAK|AFG/.test(n.a3)) return cyc(['eastern', 'ambient', 'synth'], 120);
    return cyc(['ambient', 'synth', 'business', 'night'], 120);
  }
  function startMusic() { if (timer) return; musT = ctx.currentTime + 0.1; timer = setInterval(schedule, 120); }
  function schedule() {
    if (!ctx || !S.music) return; const want = S.style === 'auto' ? autoStyle() : S.style; if (want !== curStyle && step % 32 === 0) curStyle = want;
    const st = STY[curStyle] || STY.ambient, beat = 60 / st.bpm / 2;
    if (step % 32 === 0) st.prog = st.progs[Math.floor(Math.random() * st.progs.length)];
    while (musT < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 8) % 4, chord = st.prog[bar], s8 = step % 8;
      if (s8 === 0) chord.forEach(m => tone(hz(m), musT, beat * 8, st.pad, st.pad === 'sawtooth' ? 0.016 : 0.035, musG));
      if (s8 % 2 === 0 || st.drums === 'four') tone(hz(chord[0] - 12), musT, beat * (st.drums === 'four' ? 0.8 : 1.6), st.bass, 0.05, musG);
      if ((step * 7 + bar) % 3 !== 0 || curStyle === 'synth') { const nt = chord[st.arp[(s8 + bar) % 8] % chord.length] + 12 + (Math.random() < 0.12 ? 12 : 0); tone(hz(nt), musT, beat * (curStyle === 'piano' ? 2.2 : 0.9), st.lead, curStyle === 'epic' ? 0.03 : curStyle === 'piano' ? 0.04 : 0.018, musG); }
      if (s8 === 6 && Math.random() < 0.35) tone(hz(chord[Math.floor(Math.random() * chord.length)] + 24), musT, beat * 2, 'triangle', 0.012, musG); // мелодійні «відповіді»
      if (curStyle === 'epic' && s8 === 0 && bar % 2 === 0) tone(hz(chord[2] + 24), musT, beat * 6, 'triangle', 0.02, musG); // «хор»
      switch (st.drums) {
        case 'soft': if (s8 === 4) noise(musT, 0.05, 0.015, 5000, musG); break;
        case 'four': if (s8 % 2 === 0) noise(musT, 0.12, 0.09, 150, musG); if (s8 % 4 === 2) noise(musT, 0.08, 0.05, 3000, musG); noise(musT, 0.02, 0.015, 8000, musG); break;
        case 'taiko': if (s8 === 0 || s8 === 3 || s8 === 6) { noise(musT, 0.35, 0.16, 120, musG); tone(55, musT, 0.3, 'sine', 0.12, musG, 40); } break;
        case 'march': if (s8 % 4 === 0) noise(musT, 0.18, 0.13, 180, musG); if (s8 % 2 === 1) noise(musT, 0.05, 0.05, 2500, musG); if (s8 === 7) noise(musT, 0.04, 0.04, 2500, musG); break;
        case 'lofi': if (s8 === 0 || s8 === 5) noise(musT, 0.14, 0.08, 160, musG); if (s8 === 4) noise(musT, 0.07, 0.04, 2200, musG); if (s8 % 2 === 1) noise(musT, 0.02, 0.012, 7000, musG); break;
        case 'darbuka': if (s8 === 0 || s8 === 3) tone(90, musT, 0.15, 'sine', 0.12, musG, 60); if (s8 === 5 || s8 === 7) noise(musT, 0.05, 0.05, 3500, musG); break;
        case 'heart': if (s8 === 0 || s8 === 1) tone(52, musT, 0.25, 'sine', 0.18, musG, 38); break;
        case 'pulse': if (s8 % 4 === 0) tone(48, musT, 0.4, 'sine', 0.16, musG, 35); if (s8 === 6) noise(musT, 0.1, 0.03, 900, musG); break;
      }
      musT += beat; step++;
    }
  }
  function blip(p) { if (!S.sfx || !init()) return; const t = ctx.currentTime; tone(320 * p * (0.85 + Math.random() * 0.4), t, 0.05, 'square', 0.035); }
  function set(k, v) { S[k] = v; save(); if (!ctx) return; sfxG.gain.value = S.sfx ? S.vol : 0; musG.gain.value = S.music ? S.mvol : 0; }
  // ---- озвучування тексту (браузерний синтез мовлення)
  // ---- озвучування тексту (системні голоси через синтез мовлення). prio 'queue' — у чергу (події), інакше перебиває
  const voices = () => { try { return window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { return []; } };
  function pickVoice() { const lang = LORA.lang === 'en' ? 'en' : 'uk', V = voices(); if (S.voice) { const v = V.find(x => x.name === S.voice); if (v) return v; }
    return V.find(v => v.lang.toLowerCase().startsWith(lang) && /female|жін|Polina|Lesya|Ostap|Samantha|Zira|Natural|Google/i.test(v.name)) || V.find(v => v.lang.toLowerCase().startsWith(lang)) || (S.vAnyLang ? V[0] : null); }
  let vQ = [], vBusy = false;
  // який рушій говоритиме: вибраний у налаштуваннях або «авто» (хмарний із ключем → системний голос мови → eSpeak)
  function engineFor() {
    const want = S.engine || 'auto'; const sysOk = !!(window.speechSynthesis && pickVoice());
    if (want === 'system') return sysOk ? 'system' : null; if (want === 'azure') return S.azKey ? 'azure' : null; if (want === 'eleven') return S.elKey ? 'eleven' : null; if (want === 'espeak') return (typeof VOICE !== 'undefined') ? 'espeak' : null;
    if (S.azKey) return 'azure'; if (S.elKey) return 'eleven'; if (sysOk) return 'system'; if (S.espeak && (typeof VOICE !== 'undefined')) return 'espeak'; return null;
  }
  function speak(text, onEnd, prio) {
    const eng = S.tts ? engineFor() : null; if (!eng) { onEnd && onEnd(); return false; }
    const clean = String(text).replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim(); if (!clean) { onEnd && onEnd(); return false; }
    if (prio !== 'queue') { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } (typeof VOICE !== 'undefined') && VOICE.stop(); vQ = []; vBusy = false; }
    else if (vBusy) { if (vQ.length < 3) vQ.push([text, onEnd]); return true; }
    vBusy = true; let fin = false; const done = () => { if (fin) return; fin = true; vBusy = false; onEnd && onEnd(); const nx = vQ.shift(); if (nx) speak(nx[0], nx[1], 'queue'); };
    const lang = LORA.lang === 'en' ? 'en' : 'uk';
    if (eng === 'system') { try { const v = pickVoice(); const u = new SpeechSynthesisUtterance(clean); u.voice = v; u.lang = v.lang; u.rate = S.vrate || 1.03; u.pitch = S.vpitch || 1; u.volume = S.voiceVol != null ? S.voiceVol : 0.9; u.onend = u.onerror = done; speechSynthesis.speak(u); } catch (e) { done(); return false; } return true; }
    VOICE.say(eng, clean.slice(0, 600), lang, S).then(done, e => { console.warn('voice', e); lastErr = String(e.message || e); done(); }); return true;
  }
  let lastErr = '';
  const voiceInfo = () => { const V = voices(); return { engine: engineFor(), err: lastErr, all: V.length, uk: V.filter(v => v.lang.toLowerCase().startsWith('uk')).length, en: V.filter(v => v.lang.toLowerCase().startsWith('en')).length, cur: (pickVoice() || {}).name || '' }; };
  document.addEventListener('pointerdown', () => init(), { once: true });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) sfx('click'); });
  return { S, sfx, set, init, speak, blip, STY, voices, voiceInfo };
})();
