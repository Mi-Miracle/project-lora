// АНІМАЦІЇ v3.0: війна, мир, договори, шопінг, біржа, навчання, весілля, хакери, армія, авіація, заводи, знесення,
// суд, агітація, пожежі, Кесслер тощо — і автоматичний запуск майже на всі дії гравця.
(function () {
  if (typeof FX === 'undefined' || !FX.add) return;
  const tr = s => (LORA.lang === 'en' && typeof t_ === 'function') ? t_(s) : s;
  FX.add('war', { bg: ['#3a0505', '#0a0101'], items: [['⚔', 'zoom', 1, 160], ['🪖', 'march', 10, 44], ['🚀', 'flyL', 4, 44], ['💥', 'burst', 16, 30]], shake: 1, flash: 1 }, ['⚔ ВІЙНУ ОГОЛОШЕНО', 'WAR DECLARED']);
  FX.add('treaty', { bg: ['#0a2a1a', '#020a06'], items: [['📜', 'zoom', 1, 150], ['🖋', 'float', 3, 50], ['🤝', 'orbit', 4, 44], ['🕊', 'fly', 3, 40]] }, ['📜 УГОДУ ПІДПИСАНО', 'AGREEMENT SIGNED']);
  FX.add('shopping', { bg: ['#2a0a2a', '#0a020a'], items: [['🛍', 'rain', 20, 36], ['💳', 'orbit', 4, 40], ['🤩', 'pulse', 1, 120]] }, ['🛍 ПОКУПКА', 'NEW PURCHASE']);
  FX.add('stocks', { bg: ['#06200f', '#010804'], items: [['📈', 'zoom', 1, 150], ['💹', 'float', 6, 36], ['🪙', 'rain', 20, 26]], draw(cx, W, H, u) { cx.strokeStyle = '#3ed06a'; cx.lineWidth = 6; cx.beginPath(); for (let x = 0; x <= W; x += 30) cx.lineTo(x, H * 0.75 - x / W * H * 0.35 + Math.sin(x / 40 + u * 3) * 25); cx.stroke(); } }, ['📈 УГОДА НА БІРЖІ', 'MARKET TRADE']);
  FX.add('study', { bg: ['#141a3a', '#04060f'], items: [['📚', 'stomp', 1, 140], ['🎓', 'rise', 8, 40], ['💡', 'burst', 20, 26]] }, ['🎓 НАВЧАННЯ', 'STUDYING']);
  FX.add('wedding', { bg: ['#3a1a2a', '#0f050a'], items: [['💒', 'pulse', 1, 150], ['💍', 'zoom', 1, 60], ['🌸', 'rain', 40, 26], ['🕊', 'fly', 2, 44]] }, ['💒 ВЕСІЛЛЯ', 'WEDDING']);
  FX.add('baby', { bg: ['#1a2a3a', '#05080f'], items: [['👶', 'pulse', 1, 150], ['🍼', 'float', 4, 40], ['🎈', 'rise', 12, 34]] }, ['👶 ПОПОВНЕННЯ В РОДИНІ', 'NEW FAMILY MEMBER']);
  FX.add('hack', { bg: ['#000a00', '#000'], items: [['💻', 'pulse', 1, 130], ['🦠', 'orbit', 8, 30]], draw(cx, W, H, u) { cx.font = '16px monospace'; cx.fillStyle = 'rgba(60,255,120,0.7)'; for (let i = 0; i < 40; i++) { const x = (i * 53) % W, y = ((u * 220 + i * 97) % (H + 40)) - 20; cx.fillText(Math.random() < 0.5 ? '1' : '0', x, y); cx.fillText('ACCESS', x + 10, (y + 140) % H); } } }, ['💻 КІБЕРОПЕРАЦІЯ', 'CYBER OPERATION']);
  FX.add('army', { bg: ['#1a2a1a', '#050a05'], items: [['🪖', 'march', 14, 46], ['🚩', 'pulse', 1, 110], ['🥁', 'marchL', 3, 40]] }, ['🪖 НОВИЙ ПІДРОЗДІЛ', 'NEW UNIT']);
  FX.add('jets', { bg: ['#0a1a3a', '#02050f'], items: [['✈', 'fly', 6, 56], ['✈', 'flyL', 4, 44], ['☁', 'float', 8, 50]] }, ['✈ АВІАЦІЯ', 'AIR FORCE']);
  FX.add('factory', { bg: ['#2a1a0a', '#0a0602'], items: [['🏭', 'pulse', 1, 150], ['⚙', 'orbit', 6, 40], ['💨', 'rise', 10, 34]] }, ['🏭 ВИРОБНИЦТВО', 'PRODUCTION']);
  FX.add('demolish', { bg: ['#2a2a2a', '#0a0a0a'], items: [['🏚', 'stomp', 1, 150], ['🚜', 'march', 2, 60], ['🧱', 'burst', 20, 30]], shake: 1 }, ['🚜 ЗНЕСЕННЯ', 'DEMOLITION']);
  FX.add('court', { bg: ['#2a1a0a', '#0a0502'], items: [['⚖', 'pulse', 1, 150], ['🔨', 'stomp', 1, 70], ['📜', 'float', 5, 34]] }, ['⚖ СУД', 'COURT']);
  FX.add('leaflets', { bg: ['#1a1a2a', '#05050a'], items: [['📄', 'rain', 50, 30], ['📣', 'pulse', 1, 120]] }, ['📣 АГІТАЦІЯ', 'CAMPAIGNING']);
  FX.add('wildfire', { bg: ['#3a1505', '#0a0401'], items: [['🔥', 'rise', 30, 40], ['🌲', 'march', 8, 50], ['🚁', 'fly', 2, 50]] }, ['🔥 ЛІСОВА ПОЖЕЖА', 'WILDFIRE']);
  FX.add('nuketest', { bg: ['#2a2a05', '#0a0a01'], items: [['☢', 'zoom', 1, 170], ['💥', 'burst', 30, 40]], shake: 1, flash: 1 }, ['☢ ЯДЕРНЕ ВИПРОБУВАННЯ', 'NUCLEAR TEST']);
  FX.add('aid', { bg: ['#0a2a2a', '#020a0a'], items: [['📦', 'rain', 24, 40], ['🚚', 'march', 4, 54], ['❤', 'burst', 12, 26]] }, ['📦 ДОПОМОГА', 'AID SENT']);
  FX.add('science2', { bg: ['#101040', '#05050f'], items: [['🧪', 'pulse', 1, 140], ['⚛', 'orbit', 8, 36], ['💡', 'burst', 20, 24]] }, ['🔬 НОВЕ ДОСЛІДЖЕННЯ', 'NEW RESEARCH']);
  FX.add('launch', { bg: ['#020818', '#000'], items: [['🛰', 'rise', 3, 50], ['⭐', 'rain', 40, 12], ['🚀', 'zoom', 1, 120]] }, ['🚀 ЗАПУСК', 'LAUNCH']);
  FX.add('company', { bg: ['#0a1a2a', '#02060a'], items: [['🏢', 'stomp', 1, 150], ['🎉', 'burst', 30, 28], ['💼', 'march', 6, 40]] }, ['🏢 НОВА КОМПАНІЯ', 'NEW COMPANY']);
  FX.add('dacha', { bg: ['#1a3a1a', '#050f05'], items: [['🥔', 'rain', 20, 34], ['🏡', 'pulse', 1, 130], ['🐓', 'march', 3, 40]] }, ['🏡 ДАЧА', 'DACHA']);

  const GAP = 6; let last = {};
  const play = (k, o, gap) => { if (!G) return; gap = gap == null ? GAP : gap; if (gap && last[k] != null && G.day - last[k] < gap) return; last[k] = G.day; LORA.bus.emit('fx', Object.assign({ kind: k }, o || {})); };
  const ok = r => r == null || (r && r.ok !== false && !r.pending && !r.err);
  const sub = r => (r && r.msg) ? String(r.msg).slice(0, 120) : '';
  const MAP = {
    declareWar: 'war', startProject: 'factory', orderSat: 'launch', startProgram: 'launch', nukeTest: 'nuketest', luxBuy: 'shopping', invest: 'stocks', invSell: 'stocks',
    lifeStudy: 'study', coBuild: 'factory', corpRD: 'science2', stockTrade: ['stocks', 10], hireAgent: 'spyop', intelDeal: 'treaty', cyber: 'hack', colBuild: 'build',
    unVote: ['un', 10], hybDo: 'hack', inter: 'treaty', demolish: 'demolish', coDemolish: 'demolish', rebuild: 'build', exchangePOW: 'treaty', createLegion: 'army', buyAir: 'jets', modernize: 'factory',
    careerFound: 'company', coTakeover: 'stocks', corpAcquire: 'stocks', aid: 'aid', requestAid: 'aid', confSign: 'treaty', damBuild: 'build', estateUp: 'build', setEmbargo: 'war', coLobby: 'meeting', coHQ: 'company', staffDo: 'meeting', shadowDo: 'spyop', kidEdu: 'study', setHeir: 'heart'
  };
  function hook() {
    if (!G || !G.act || G.act._h30) return; G.act._h30 = 1; last = {};
    Object.entries(MAP).forEach(([name, v]) => { const b = G.act[name]; if (typeof b !== 'function') return; const [k, gap] = Array.isArray(v) ? v : [v, GAP]; G.act[name] = function () { const r = b.apply(this, arguments); try { if (ok(r)) play(k, { sub: sub(r) }, gap); } catch (e) { } return r; }; });
    const fam = G.act.famDo; if (typeof fam === 'function') G.act.famDo = function (k) { const r = fam.apply(this, arguments); try { if (ok(r)) play(/marr|wed|propos/.test(String(k)) ? 'wedding' : /kid|baby|child/.test(String(k)) ? 'baby' : 'heart', { sub: sub(r) }, 3); } catch (e) { } return r; };
  }
  setInterval(hook, 800);
})();
