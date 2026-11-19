// АНІМАЦІЇ v2.9: засідання уряду й парламенту, лекції, виступи, ефіри, протести, шпигуни, Кесслер, місто.
// Плюс автоматичний запуск анімацій на дії гравця (лекція, реклама, книга, засідання, голосування, мітинг…).
(function () {
  if (typeof FX === 'undefined' || !FX.add) return;
  const pickS = a => a[Math.floor(Math.random() * a.length)];
  const en = () => LORA.lang === 'en';
  const tr = s => (en() && typeof t_ === 'function') ? t_(s) : s;
  function bubble(cx, x, y, txt, a) { cx.globalAlpha = a; cx.font = '600 15px system-ui'; const w = cx.measureText(txt).width + 18; cx.fillStyle = '#f4f1e6'; cx.strokeStyle = '#1b2633'; cx.lineWidth = 2; cx.beginPath(); if (cx.roundRect) cx.roundRect(x - w / 2, y - 34, w, 26, 8); else cx.rect(x - w / 2, y - 34, w, 26); cx.fill(); cx.stroke(); cx.beginPath(); cx.moveTo(x - 5, y - 8); cx.lineTo(x + 5, y - 8); cx.lineTo(x, y); cx.fill(); cx.fillStyle = '#1b2633'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, x, y - 21); cx.globalAlpha = 1; }
  // ---- засідання уряду: стіл, міністри, репліки, молоток
  const CAB_P = ['Пропоную!', 'Заперечую!', 'А бюджет?', 'Кава скінчилась', 'Голосуємо!', 'Це вже було', 'Давайте нараду', 'Згоден… мабуть', 'Хто з’їв печиво?', 'Записую', 'За!', 'Утримуюсь', 'Мій кіт проти'];
  const PEOPLE = ['🧑‍💼', '👩‍💼', '👨‍💼', '🧓', '👩‍🦳', '🧔', '👩‍🔬', '🎖'];
  FX.add('council', { bg: ['#1c1206', '#080502'], items: [], draw(cx, W, H, u, t) {
    const mx = W / 2, my = H * 0.56; cx.fillStyle = '#5a3a1e'; cx.beginPath(); cx.ellipse(mx, my, W * 0.3, H * 0.13, 0, 0, 7); cx.fill(); cx.fillStyle = '#7a5530'; cx.beginPath(); cx.ellipse(mx, my - 6, W * 0.29, H * 0.12, 0, 0, 7); cx.fill();
    cx.font = '26px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; ['📄', '☕', '📄', '🥐', '📁', '☕'].forEach((e, i) => cx.fillText(e, mx + Math.cos(i / 6 * 6.28) * W * 0.16, my - 6 + Math.sin(i / 6 * 6.28) * H * 0.06));
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.2, x = mx + Math.cos(a) * W * 0.33, y = my + Math.sin(a) * H * 0.17 - Math.abs(Math.sin(u * 3 + i)) * 4; cx.font = '46px serif'; cx.fillText(PEOPLE[i], x, y);
      const ph = Math.floor(Math.max(0, u) * 1.6 + i * 0.7); if ((ph + i) % 4 === 0 && t < 0.8) bubble(cx, x, y - 26, tr(CAB_P[(ph * 3 + i) % CAB_P.length]), 0.95); }
    if (t > 0.78) { const k = (t - 0.78) / 0.22; cx.font = '90px serif'; cx.save(); cx.translate(mx + 40, my - 70); cx.rotate(-0.9 + Math.min(1, k * 3) * 0.9); cx.fillText('🔨', 0, 0); cx.restore();
      if (k > 0.3) { cx.save(); cx.translate(mx, my - 10); cx.rotate(-0.15); cx.strokeStyle = '#d33'; cx.lineWidth = 6; cx.font = '800 52px system-ui'; cx.fillStyle = 'rgba(220,40,40,0.9)'; cx.strokeRect(-190, -40, 380, 80); cx.fillText(tr('УХВАЛЕНО'), 0, 4); cx.restore(); } } } },
    ['🏛 ЗАСІДАННЯ УРЯДУ', 'CABINET MEETING']);
  // ---- парламент: півколо, табло голосування
  FX.add('parliament', { bg: ['#0a1430', '#03060f'], items: [], draw(cx, W, H, u, t) {
    const mx = W / 2, my = H * 0.82, R0 = Math.min(W, H) * 0.18; let yes = 0, no = 0; const tot = 120;
    for (let r = 0; r < 5; r++) { const n = 14 + r * 5; for (let k = 0; k < n; k++) { const a = Math.PI + (k + 0.5) / n * Math.PI, x = mx + Math.cos(a) * (R0 + r * 34), y = my + Math.sin(a) * (R0 + r * 34); const id = r * 50 + k; const voted = t > 0.15 + ((id * 37) % 100) / 100 * 0.55; const v = ((id * 7919) % 100) < 62;
      cx.fillStyle = !voted ? '#556' : v ? '#3ed06a' : '#e04848'; if (voted) v ? yes++ : no++; cx.beginPath(); cx.arc(x, y, 8, 0, 7); cx.fill(); } }
    cx.font = '60px serif'; cx.textAlign = 'center'; cx.fillText('🎙', mx, my - 30); cx.fillStyle = '#05080d'; cx.fillRect(mx - 170, H * 0.27, 340, 70); cx.strokeStyle = '#ffd34d'; cx.lineWidth = 3; cx.strokeRect(mx - 170, H * 0.27, 340, 70);
    cx.font = '700 34px monospace'; cx.fillStyle = '#3ed06a'; cx.fillText(`${tr('ЗА')} ${yes}`, mx - 80, H * 0.27 + 36); cx.fillStyle = '#e04848'; cx.fillText(`${tr('ПРОТИ')} ${no}`, mx + 80, H * 0.27 + 36);
    if (t > 0.8) { cx.font = '800 44px system-ui'; cx.fillStyle = yes > no ? '#3ed06a' : '#e04848'; cx.fillText(yes > no ? tr('РІШЕННЯ УХВАЛЕНО') : tr('ПРОВАЛЕНО'), mx, H * 0.45); } } }, ['🗳 ГОЛОСУВАННЯ', 'THE VOTE']);
  // ---- лекція: дошка, кафедра, студенти
  const BOARD = ['ВВП = 🍔 × 😊', 'Інфляція → 🎈', 'Податки ≈ 😢', 'Успіх = кава²', 'Стратегія: 1) 2) ??? 3) 💰', 'E = mc² + бюджет'];
  FX.add('lecture', { bg: ['#14261a', '#050a06'], items: [], draw(cx, W, H, u, t) {
    const mx = W / 2; cx.fillStyle = '#1d3b2a'; cx.fillRect(mx - W * 0.3, H * 0.24, W * 0.6, H * 0.26); cx.strokeStyle = '#8a6a3a'; cx.lineWidth = 10; cx.strokeRect(mx - W * 0.3, H * 0.24, W * 0.6, H * 0.26);
    const txt = tr(BOARD[Math.floor(Math.max(0, u) / 1.4) % BOARD.length]) || ""; cx.font = '600 34px "Comic Sans MS", system-ui'; cx.fillStyle = '#e8f0e8'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; const n = Math.min(txt.length, Math.floor((u % 1.4) * 30)); cx.fillText(txt.slice(0, n), mx, H * 0.37);
    cx.font = '70px serif'; cx.fillText('🧑‍🏫', mx + W * 0.22, H * 0.6 + Math.sin(u * 4) * 4); cx.font = '42px serif'; for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { const x = mx - W * 0.32 + k * W * 0.08 + r * 20, y = H * 0.72 + r * 60 - Math.abs(Math.sin(u * 5 + k + r)) * (k % 3 ? 3 : 10); cx.fillText(['🧑‍🎓', '👩‍🎓', '🙋', '🧑‍🎓', '😴', '👩‍🎓', '✍', '🧑‍🎓', '🤔'][(k + r * 4) % 9], x, y); } } }, ['🎓 ЛЕКЦІЯ', 'LECTURE']);
  // ---- виступ / мітинг: трибуна, натовп
  FX.add('speech', { bg: ['#2a1a08', '#0a0602'], items: [['🎈', 'rise', 12, 34], ['✨', 'burst', 18, 20]], draw(cx, W, H, u, t) {
    const mx = W / 2; cx.fillStyle = '#7a1e1e'; cx.fillRect(mx - 70, H * 0.42, 140, 110); cx.fillStyle = '#ffd34d'; cx.fillRect(mx - 70, H * 0.42, 140, 8); cx.font = '64px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🧑‍💼', mx, H * 0.36 + Math.sin(u * 6) * 3); cx.font = '30px serif'; cx.fillText('🎤', mx + 40, H * 0.42);
    ['🚩', '🏳', '🚩'].forEach((f, i) => { cx.font = '50px serif'; cx.fillText(f, mx - 220 + i * 220, H * 0.32 + Math.sin(u * 3 + i) * 6); });
    cx.font = '38px serif'; for (let k = 0; k < 22; k++) { const x = (k / 22) * W + 20, y = H * 0.82 - Math.abs(Math.sin(u * 6 + k * 1.3)) * 18; cx.fillText(['🙌', '👏', '🙋', '🙌', '📣', '👏', '📋'][k % 7], x, y); } } }, ['🎙 ВИСТУП', 'SPEECH']);
  // ---- телеефір
  FX.add('tvshow', { bg: ['#101030', '#04040c'], items: [['👏', 'float', 8, 30]], draw(cx, W, H, u, t) {
    const mx = W / 2, my = H * 0.52; cx.fillStyle = '#111'; cx.fillRect(mx - W * 0.28, my - H * 0.22, W * 0.56, H * 0.42); cx.fillStyle = '#28305a'; cx.fillRect(mx - W * 0.26, my - H * 0.2, W * 0.52, H * 0.38);
    cx.fillStyle = '#e02424'; cx.fillRect(mx - W * 0.25, my - H * 0.19, 86, 28); cx.font = '700 18px system-ui'; cx.fillStyle = '#fff'; cx.textAlign = 'left'; cx.textBaseline = 'middle'; cx.fillText('● LIVE', mx - W * 0.25 + 8, my - H * 0.19 + 14);
    cx.textAlign = 'center'; cx.font = '72px serif'; cx.fillText('🎤', mx - W * 0.1, my + 10); cx.fillText('🧑‍💼', mx + W * 0.1, my + 10 + Math.sin(u * 5) * 3);
    const ap = Math.min(1, t * 1.6 + Math.sin(u * 7) * 0.08); cx.fillStyle = '#333'; cx.fillRect(mx - 150, my + H * 0.24, 300, 18); cx.fillStyle = '#3ed06a'; cx.fillRect(mx - 150, my + H * 0.24, 300 * ap, 18); cx.font = '600 14px system-ui'; cx.fillStyle = '#e8f0f8'; cx.fillText(tr('ОПЛЕСКИ'), mx, my + H * 0.24 + 34); } }, ['📺 ПРЯМИЙ ЕФІР', 'LIVE ON AIR']);
  FX.add('photoshoot', { bg: ['#222', '#050505'], items: [['📸', 'orbit', 6, 46], ['🧑‍💼', 'pulse', 1, 130]], flash: 1 }, ['📸 РЕКЛАМНА ЗЙОМКА', 'AD SHOOT']);
  FX.add('book', { bg: ['#2a1e0a', '#0a0702'], items: [['📚', 'rain', 30, 36], ['📖', 'zoom', 1, 150], ['✍', 'float', 4, 40]] }, ['📖 НОВА КНИГА', 'NEW BOOK']);
  FX.add('meeting', { bg: ['#0a1a2a', '#02060a'], items: [['💼', 'march', 6, 46], ['📈', 'zoom', 1, 140], ['🤝', 'float', 3, 50]] }, ['📑 ДІЛОВА ЗУСТРІЧ', 'BUSINESS MEETING']);
  FX.add('work', { bg: ['#141a22', '#050709'], items: [['💻', 'pulse', 1, 120], ['📎', 'rain', 20, 26], ['☕', 'float', 5, 40]] }, ['💼 РОБОЧИЙ ДЕНЬ', 'WORK DAY']);
  FX.add('charity', { bg: ['#2a0a1a', '#0a0206'], items: [['❤', 'burst', 40, 30], ['🎁', 'rain', 14, 40], ['🤗', 'pulse', 1, 120]] }, ['🎗 БЛАГОДІЙНІСТЬ', 'CHARITY']);
  FX.add('protest', { bg: ['#2a0a0a', '#0a0202'], items: [['📋', 'march', 14, 44], ['📣', 'marchL', 6, 40], ['🔥', 'float', 4, 30]] }, ['📢 ПРОТЕСТИ', 'PROTESTS']);
  FX.add('police', { bg: ['#0a0a2a', '#02020a'], items: [['🚓', 'march', 5, 60], ['🛡', 'marchL', 8, 40], ['📋', 'rain', 10, 30]], flash: 1 }, ['🚓 РОЗГІН', 'CRACKDOWN']);
  FX.add('build', { bg: ['#2a2a0a', '#0a0a02'], items: [['🏗', 'pulse', 1, 140], ['🚧', 'march', 6, 40], ['🧱', 'rain', 20, 28]] }, ['🏗 ІНВЕСТИЦІЇ', 'INVESTMENT']);
  FX.add('busted', { bg: ['#300808', '#0a0202'], items: [['🚨', 'pulse', 1, 140], ['🕵', 'chase', 1, 70], ['🚔', 'dot', 1, 70], ['📰', 'rain', 20, 30]], flash: 1 }, ['🚨 ВИКРИТО!', 'BUSTED!']);
  FX.add('mole', { bg: ['#1a1a1a', '#050505'], items: [['🐀', 'dot', 1, 80], ['🕵', 'chase', 1, 80], ['🔦', 'float', 3, 40]] }, ['🐀 СПІЙМАНО КРОТА', 'MOLE CAUGHT']);
  FX.add('spyop', { bg: ['#05140c', '#010402'], items: [['🕶', 'pulse', 1, 120], ['📡', 'orbit', 6, 34], ['🗂', 'float', 5, 34]] }, ['🕶 ОПЕРАЦІЮ РОЗПОЧАТО', 'OPERATION LAUNCHED']);
  FX.add('kessler', { bg: ['#02030a', '#000'], items: [['🛰', 'orbit', 10, 40], ['💥', 'burst', 50, 26], ['🌍', 'pulse', 1, 170]], shake: 1, flash: 1 }, ['☄ СИНДРОМ КЕССЛЕРА', 'KESSLER SYNDROME']);
  FX.add('cleanup', { bg: ['#06122a', '#020610'], items: [['🧹', 'orbit', 3, 60], ['🛰', 'orbit', 6, 34], ['🌍', 'pulse', 1, 150], ['✨', 'burst', 20, 20]] }, ['🧹 ПРИБИРАННЯ ОРБІТИ', 'ORBIT CLEANUP']);
  FX.add('paparazzi', { bg: ['#111', '#000'], items: [['📸', 'burst', 24, 40], ['😱', 'pulse', 1, 130]], flash: 1 }, ['📸 ПАПАРАЦЦІ!', 'PAPARAZZI!']);
  FX.add('disco', { bg: ['#2a0a3a', '#05020a'], items: [['🕺', 'pulse', 1, 140], ['💃', 'march', 6, 50], ['🕺', 'marchL', 6, 50], ['✨', 'burst', 30, 20]], laser: 1 }, ['🕺 ВЕЧІРКА', 'PARTY NIGHT']);
  FX.add('jackpot', { bg: ['#2a1a00', '#0a0600'], items: [['🎰', 'pulse', 1, 140], ['💰', 'rain', 40, 30], ['💵', 'rain', 20, 34]] }, ['🎰 ДЖЕКПОТ!', 'JACKPOT!']);
  FX.add('gym', { bg: ['#1a1a1a', '#050505'], items: [['🏋', 'stomp', 1, 160], ['💪', 'burst', 12, 34]] }, ['💪 ТРЕНУВАННЯ', 'WORKOUT']);
  FX.add('heart', { bg: ['#2a0a1a', '#0a0206'], items: [['🕯', 'float', 6, 34], ['❤', 'burst', 30, 28], ['🍷', 'pulse', 1, 110]] }, ['❤ РОМАНТИКА', 'ROMANCE']);
  FX.add('flooded', { bg: ['#06223a', '#020a12'], items: [['🌊', 'march', 8, 70], ['🏠', 'float', 5, 44], ['🛶', 'march', 2, 50]] }, ['🌊 ЗАТОПЛЕННЯ', 'FLOODING']);

  // ---- автоматичні анімації на дії гравця (лише локальний гравець; засідання — не частіше ніж раз на 20 днів)
  const GIG_FX = { lecture: 'lecture', ad: 'photoshoot', book: 'book', consult: 'meeting', stream: 'stream', tv: 'tvshow', charity: 'charity' };
  let last = {};
  const play = (k, o, gap) => { if (!G) return; if (gap && last[k] && G.day - last[k] < gap) return; last[k] = G.day; LORA.bus.emit('fx', Object.assign({ kind: k }, o || {})); };
  const ok = r => r && r.ok !== false && !r.pending;
  function hook() {
    if (!G || !G.act || G.act._h29) return; G.act._h29 = 1; last = {};
    const W = (name, fn) => { const b = G.act[name]; if (typeof b !== 'function') return; G.act[name] = function () { const r = b.apply(this, arguments); try { if (ok(r)) fn(r, arguments); } catch (e) { } return r; }; };
    W('gigDo', (r, a) => { const k = GIG_FX[a[0]]; if (k) play(k, { sub: r.msg ? String(r.msg).slice(0, 120) : '' }); });
    W('careerDo', r => play('work', { sub: r.msg ? String(r.msg).slice(0, 120) : '' }, 15));
    W('minDo', r => play('council', { sub: r.msg ? String(r.msg).slice(0, 120) : '' }, 20));
    W('parlAct', r => play('parliament', { sub: r.msg ? String(r.msg).slice(0, 120) : '' }, 10));
    W('leadDo', r => play('speech', { sub: r.msg ? String(r.msg).slice(0, 120) : '' }, 10));
    W('partyDo', r => play('speech', { sub: r.msg ? String(r.msg).slice(0, 120) : '' }, 10));
    W('spyStart', () => play('spyop', null, 7));
    W('heroAward', r => play('party', { title: tr('🦸 НАГОРОДА ГЕРОЮ'), sub: r.msg }));
  }
  setInterval(hook, 700);
})();
