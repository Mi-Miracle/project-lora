// ОНЛАЙН-ГРА (кооп/PvP для глядачів стріму). Хост рахує світ; гості — «тонкі клієнти»: отримують знімки стану
// й надсилають команди, які хост виконує від імені їхньої держави.
// Транспорт: PeerJS (WebRTC, кімната = 6-символьний код) або 'local' (BroadcastChannel — дві вкладки одного браузера, для тестів).
const NET = (() => {
  const S = { role: null, transport: 'peer', peer: null, conns: [], code: '', name: '', players: [], scen: 'war2026', diff: 'normal', chat: [], started: false, myNid: null, snapT: 0, bc: null };
  const PFX = 'lora-room-';
  const rid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  // ---------- транспорт
  function send(conn, msg) { try { if (S.transport === 'local') S.bc.postMessage({ to: conn.id, from: S.me, msg }); else conn.send(msg); } catch (e) { console.warn(e); } }
  function broadcast(msg) { S.conns.forEach(c => send(c, msg)); }
  function localChannel(code) { S.bc = new BroadcastChannel(PFX + code); S.me = rid(); }
  // ---------- ХОСТ
  function host(name, transport) {
    S.role = 'host'; S.name = name || 'Хост'; S.transport = transport || (window.Peer ? 'peer' : 'local'); S.code = rid();
    S.players = [{ id: 'host', name: S.name, a3: null, host: true }];
    return new Promise((res, rej) => {
      if (S.transport === 'local') { localChannel(S.code); S.me = 'host'; S.bc.onmessage = e => { const { to, from, msg } = e.data; if (to !== 'host') return; let c = S.conns.find(x => x.id === from); if (!c) { c = { id: from }; S.conns.push(c); } onHostData(c, msg); }; res(S.code); return; }
      S.peer = new Peer(PFX + S.code); S.peer.on('open', () => res(S.code)); S.peer.on('error', e => rej(e));
      S.peer.on('connection', c => { c.on('open', () => S.conns.push(c)); c.on('data', m => onHostData(c, m)); c.on('close', () => { S.conns = S.conns.filter(x => x !== c); S.players = S.players.filter(p => p.id !== c.peer); lobbyUpdate(); sys(`🔌 ${t_('гравець вийшов')}`); }); });
    });
  }
  function cid(c) { return c.peer || c.id; }
  function onHostData(c, m) {
    const id = cid(c), pl = S.players.find(p => p.id === id);
    if (m.t === 'hello' && m.spectate) { if (S.noSpect) { send(c, { t: 'err', text: t_('Хост вимкнув режим глядача') }); return; } if (!pl) S.players.push({ id, name: (m.name || 'Глядач').slice(0, 24), spect: true }); else pl.id = id; lobbyUpdate(); sys(`👁 ${m.name} ${t_('дивиться')}`); if (S.started) send(c, { t: 'start', save: G.save(), nid: -1, view: G.player }); return; }
    if (m.t === 'hello') { if (!pl && S.players.filter(p => !p.spect).length >= (S.maxPlayers || 12)) { send(c, { t: 'err', text: t_('Кімната заповнена') }); return; } if (S.started) { const old = S.players.find(p => !p.host && p.name === m.name && p.nid != null); if (!old) { send(c, { t: 'err', text: t_('Гра вже почалася') }); return; } old.id = id; send(c, { t: 'start', save: G.save(), nid: old.nid }); sys(`🔁 ${m.name} ${t_('перепідключився')}`); return; } if (!pl) S.players.push({ id, name: (m.name || 'Гість').slice(0, 24), a3: null }); lobbyUpdate(); sys(`👋 ${m.name} ${t_('приєднався')}`); }
    else if (m.t === 'pick' && pl && !S.started) { if (S.players.some(p => p.a3 === m.a3 && p !== pl)) { send(c, { t: 'err', text: t_('Цю державу вже обрано') }); return; } pl.a3 = m.a3; lobbyUpdate(); }
    else if (m.t === 'chat' && pl) { addChat(pl.name, m.text); broadcast({ t: 'chat', who: pl.name, text: m.text }); }
    else if (m.t === 'cmd' && pl && S.started) execCmd(pl, m);
  }
  function lobbyUpdate() { broadcast({ t: 'lobby', players: S.players.map(p => ({ name: p.name, a3: p.a3, host: !!p.host, spect: !!p.spect })), scen: S.scen, diff: S.diff, code: S.code }); if (window.renderLobby) renderLobby(); }
  function hostPick(a3) { const me = S.players[0]; if (S.players.some(p => p !== me && p.a3 === a3)) return false; me.a3 = a3; lobbyUpdate(); return true; }
  function hostStart() {
    const me = S.players[0]; if (!me.a3) return t_('Оберіть свою державу');
    const guests = S.players.filter(p => !p.host && p.a3); const humans = guests.map(p => ({ nid: LORA.createGame ? null : null, a3: p.a3, name: p.name }));
    G = LORA.createGame({ seed: (Date.now() % 1e9) | 0 });
    G.init(me.a3, S.scen, { difficulty: S.diff, humans: guests.map(p => ({ nid: G.nIdx[p.a3], name: `${p.name} (${p.a3})` })), leaderName: S.name });
    guests.forEach(p => p.nid = G.nIdx[p.a3]); S.started = true;
    const save = G.save(); S.conns.forEach(c => { const p = S.players.find(x => x.id === cid(c)); if (p && p.nid != null) send(c, { t: 'start', save, nid: p.nid }); else if (p && p.spect) send(c, { t: 'start', save, nid: -1, view: G.player }); });
    $('#start').style.display = 'none'; closeModal(); startUI(); chatUI(true); return '';
  }
  // виконання команди гостя від імені його держави
  const PROXY = ['act.*', 'decide', 'leaderGo', 'strike', 'setResearch', 'queueResearch', 'blocPropose', 'blocVote', 'blocApply', 'orderMove', 'startLink', 'cancelBuild', 'setStance', 'splitArmy', 'disband', 'orderFleet', 'setArmyTemplate', 'setArmyComp', 'agentGo', 'agentTask', 'agentRecall'];
  function execCmd(pl, m) {
    if (pl.nid == null) return; const prev = G.player; G.player = pl.nid; let r;
    try {
      const args = m.args.slice();
      if (/^(orderMove|setStance|splitArmy|disband|setArmyTemplate)$/.test(m.fn)) { const a = G.armies.find(x => x.id === args[0]); if (!a || a.n !== pl.nid) return; args[0] = a; }
      if (m.fn === 'orderFleet') { const f = G.fleets.find(x => x.id === args[0]); if (!f || f.n !== pl.nid) return; args[0] = f; }
      if (/^(setResearch|queueResearch)$/.test(m.fn)) args[0] = pl.nid;
      if (/^(blocVote|blocApply)$/.test(m.fn)) args[m.fn === 'blocVote' ? 2 : 1] = pl.nid;
      if (m.fn === 'blocPropose') args[3] = pl.nid;
      if (m.fn === 'act.answerPending') { const mine = G.pendingPeace.map((p, i) => [p, i]).filter(([p]) => p.to === pl.nid); if (!mine[args[0]]) return; args[0] = mine[args[0]][1]; }
      if (m.fn === 'strike') args[0] = pl.nid;
      if (m.fn === 'uiArmy' || m.fn === 'uiFleet') { const list = m.fn === 'uiArmy' ? G.armies : G.fleets; const u = list.find(x => x.id === m.args[0]); if (!u || u.n !== pl.nid) return; const ps = sel; sel = { type: m.fn === 'uiArmy' ? 'a' : 'f', id: u.id }; try { (m.fn === 'uiArmy' ? window._armyAct : window._fleetAct)(m.args[1]); } finally { sel = ps; } return; }
      const fn = m.fn.startsWith('act.') ? G.act[m.fn.slice(4)] : G[m.fn]; if (typeof fn === 'function') r = fn(...args);
      if (m.fn === 'act.armySet' && args[0]) { const a = G.armies.find(x => x.id === args[0] && x.n === pl.nid); if (a) Object.assign(a, args[1]); }
    } catch (e) { r = { ok: false, err: String(e) }; } finally { G.player = prev; }
    const c = S.conns.find(x => cid(x) === pl.id); if (c && m.rid) send(c, { t: 'res', rid: m.rid, r: r && typeof r === 'object' ? { ok: r.ok, err: r.err, days: r.days } : r });
  }
  // знімок стану для гостя (повні дані — лише його держави)
  const LIGHT = ['alive', 'stab', 'cash', 'debt', 'tech', 'q', 'navQ', 'warExh', 'growth', 'press', 'milStock', 'casualties', 'nuke', 'infraLvl', 'troopsBase'];
  function snapFor(nid) {
    const full = ['agg', 'stats', 'ratio', 'pol', 'ars', 'arsF', 'arsM', 'res', 'parl', 'rx', 'dev', 'imp', 'exp', 'mods', 'autoTrade', 'fpvD', 'strikeAuto'];
    return { t: 'snap', day: G.day, speed: speedIdx,
      N: G.N.map(n => { const o = {}; LIGHT.forEach(k => o[k] = n[k]); if (n.id === nid) full.forEach(k => o[k] = n[k]); else { o.agg = n.agg ? { gdp: n.agg.gdp, gdpPot: n.agg.gdp, pop: n.agg.pop, nT: n.agg.nT, pc: n.agg.pc, occLost: n.agg.occLost } : null; o.parl = n.parl ? { regime: n.parl.regime, name: n.parl.name, gov: n.parl.gov, coal: n.parl.coal, next: n.parl.next, seats: n.parl.seats, votes: [] } : null; } return o; }),
      ter: G.ter.map(t => [t.owner, t.ctrl, t.occ, +t.dmg.toFixed(3), +(t.fort || 0).toFixed(3), +t.gdp.toFixed(3), t.bld, +t.shield.toFixed(2), t.base, t.bfort || 0, t.pol, +(t.part || 0).toFixed(2)]),
      armies: G.armies, fleets: G.fleets, wars: [...G.wars.values()], alliances: G.alliances.map(a => ({ name: a.name, m: [...a.m] })), sanctions: [...G.sanctions], access: [...G.access], treaties: [...G.treaties],
      news: G.news.slice(0, 40), strikes: G.strikes || [], pending: G.pendingPeace.filter(p => p.to === nid), decisions: (G.decisions || []).filter(d => d.nid === nid), constructions: G.constructions.filter(c => c.n === nid), links: G.links, leaders: G.leaders, agents: G.agents.filter(a => a.n === nid), generals: G.generals.filter(g => g.n === nid || nid < 0), blocs: G.blocs, prices: G.prices, gameOver: G.gameOver || null, battles: G.battles, battleHot: G.battleHot };
  }
  async function pack(obj) { const js = JSON.stringify(obj); if (!window.CompressionStream) return { t: 'snapj', js }; const st = new Blob([js]).stream().pipeThrough(new CompressionStream('gzip')); return { t: 'snapz', z: new Uint8Array(await new Response(st).arrayBuffer()) }; }
  async function unpack(m) { if (m.t === 'snapj') return JSON.parse(m.js); const st = new Blob([m.z]).stream().pipeThrough(new DecompressionStream('gzip')); return JSON.parse(await new Response(st).text()); }
  function hostTick(now) {
    if (S.role !== 'host' || !S.started || !G || S.busy) return; if (now - S.snapT < 1500) return; S.snapT = now; S.busy = true;
    Promise.all(S.conns.map(async c => { const p = S.players.find(x => x.id === cid(c)); if (p && (p.nid != null || p.spect)) send(c, await pack(Object.assign(snapFor(p.spect ? -1 : p.nid), { players: onlineList() }, p.spect && window.outState ? { sv: outState() } : {}))); })).finally(() => S.busy = false);
  }
  function onlineList() { return S.players.filter(p => p.a3).map(p => ({ name: p.name, a3: p.a3, host: !!p.host, nid: p.host ? G.player : p.nid })); }
  // ---------- ГІСТЬ
  let rids = 0; const waiting = {};
  function join(code, name, transport, opts) {
    S.spectator = !!(opts && opts.spectate);
    S.role = 'guest'; S.name = name || 'Гість'; S.code = (code || '').trim().toUpperCase(); S.transport = transport || (window.Peer ? 'peer' : 'local');
    return new Promise((res, rej) => {
      if (S.transport === 'local') { localChannel(S.code); const c = { id: 'host' }; S.conns = [c]; S.bc.onmessage = e => { const { to, msg } = e.data; if (to === S.me) onGuestData(msg); }; send(c, { t: 'hello', name: S.name, spectate: S.spectator }); res(); return; }
      S.peer = new Peer(); S.peer.on('error', e => rej(e));
      S.peer.on('open', () => { const c = S.peer.connect(PFX + S.code, { reliable: true }); S.conns = [c]; c.on('open', () => { send(c, { t: 'hello', name: S.name, spectate: S.spectator }); res(); }); c.on('data', onGuestData); c.on('close', () => sys('🔌 ' + t_('зʼєднання з хостом втрачено'))); c.on('error', rej); });
    });
  }
  function onGuestData(m) {
    if (m.t === 'lobby') { S.players = m.players; S.scen = m.scen; S.diff = m.diff; if (window.renderLobby) renderLobby(); }
    else if (m.t === 'err') hint('⚠ ' + m.text, 4000);
    else if (m.t === 'chat') addChat(m.who, m.text);
    else if (m.t === 'start') { G = LORA.createGame({ seed: 1 }); G.load(m.save); G.player = m.nid >= 0 ? m.nid : m.view; S.myNid = m.nid; S.started = true; installProxies(); $('#start').style.display = 'none'; closeModal(); startUI(); document.body.classList.add('guest'); if (S.spectator) { document.body.classList.add('spect'); } else chatUI(true); if (S.spectator && window._follow) setStreamView('ticker'); else if (S.spectator && window._autoView) setStreamView(window._autoView); }
    else if ((m.t === 'snapz' || m.t === 'snapj') && G) unpack(m).then(o => { S.lag = S.lastSnap ? Math.round(performance.now() - S.lastSnap) : 0; S.lastSnap = performance.now(); S.online = o.players; applySnap(o); if (S.spectator && window.followOut) followOut(o.sv); });
    else if (m.t === 'res') { const w = waiting[m.rid]; if (w) { delete waiting[m.rid]; if (m.r && m.r.ok === false) { hint('⚠ ' + t_(m.r.err || ''), 3500); AUD.sfx('bad'); } } }
  }
  function applySnap(m) {
    const prevNews = G.news[0]; G.day = m.day; speedIdx = m.speed;
    m.N.forEach((o, i) => Object.assign(G.N[i], o));
    m.ter.forEach((a, i) => { const t = G.ter[i]; [t.owner, t.ctrl, t.occ, t.dmg, t.fort, t.gdp, t.bld, t.shield, t.base, t.bfort, t.pol, t.part] = a; });
    G.armies = m.armies; G.fleets = m.fleets; G.wars = new Map(m.wars.map(w => [G.warKey(w.a, w.b), w])); G.alliances = m.alliances.map(a => ({ name: a.name, m: new Set(a.m) }));
    G.sanctions = new Set(m.sanctions); G.access = new Set(m.access); G.treaties = new Set(m.treaties);
    G.news.length = 0; m.news.forEach(x => G.news.push(x)); G.strikes = m.strikes; G.pendingPeace = m.pending; G.constructions = m.constructions; G.links = m.links;
    G.decisions = m.decisions || []; G.leaders = m.leaders; G.agents = m.agents || []; G.generals = m.generals || []; G.blocs = m.blocs; G.prices = m.prices; G.battles = m.battles; G.battleHot = m.battleHot; if (m.gameOver) G.gameOver = m.gameOver;
    // нові новини → сповіщення й радники, як у одиночній грі
    const fresh = []; for (const n of G.news) { if (prevNews && n.text === prevNews.text && n.d === prevNews.d) break; fresh.push(n); } fresh.reverse().forEach(n => LORA.bus.emit('news', n));
    mapDirty = true;
  }
  function installProxies() {
    if (S.spectator) { const no = () => { hint('👁 ' + t_('Ви глядач — лише спостереження'), 2000); return { ok: false, err: t_('Режим глядача') }; }; Object.keys(G.act).forEach(k => G.act[k] = no); PROXY.forEach(k => { if (!k.startsWith('act.') && typeof G[k] === 'function') G[k] = no; }); window.armyAct = window.fleetAct = no; window.saveGame = no; return; }
    const mk = name => function (...args) { const rid = ++rids; waiting[rid] = 1; const a = args.map(x => x && typeof x === 'object' && x.id != null && (x.k != null || x.s != null) ? x.id : x); send(S.conns[0], { t: 'cmd', fn: name, args: a, rid }); return { ok: true, pending: true, days: '…' }; };
    Object.keys(G.act).forEach(k => { G.act[k] = mk('act.' + k); });
    { const ap = G.act.answerPending; G.act.answerPending = (i, y) => { const r = ap(i, y); G.pendingPeace.splice(i, 1); return r; }; }
    window.saveGame = () => hint('💾 ' + t_('Гру зберігає хост'), 2500);
    window.armyAct = k => { if (sel) send(S.conns[0], { t: 'cmd', fn: 'uiArmy', args: [sel.id, k] }); hint('📡 ' + t_('Наказ надіслано'), 1200); };
    window.fleetAct = k => { if (sel) send(S.conns[0], { t: 'cmd', fn: 'uiFleet', args: [sel.id, k] }); hint('📡 ' + t_('Наказ надіслано'), 1200); };
    PROXY.filter(p => !p.startsWith('act.')).forEach(k => { if (typeof G[k] === 'function') G[k] = mk(k); });
  }
  // ---------- чат
  function addChat(who, text) { S.chat.push({ who, text: String(text).slice(0, 200), d: G ? G.day : 0 }); if (S.chat.length > 80) S.chat.shift(); if (window.renderChat) renderChat(); AUD.sfx('pop'); }
  function sys(text) { addChat('★', text); }
  function say(text) { text = (text || '').trim(); if (!text) return; if (S.role === 'host') { addChat(S.name, text); broadcast({ t: 'chat', who: S.name, text }); } else if (S.role === 'guest') send(S.conns[0], { t: 'chat', text }); }
  return { S, onlineList: () => S.role === 'host' ? (G ? onlineList() : []) : (S.online || []), host, join, hostPick, hostStart, hostTick, say, lobbyUpdate, pick: a3 => send(S.conns[0], { t: 'pick', a3 }), isGuest: () => S.role === 'guest' && S.started, on: () => !!S.role };
})();
