// «Я граю за Україну»: стратегія гравця-людини проти ШІ, порівняння з ШІ-проти-ШІ.
// node tools/test/ukraine-bot.js [ДНІВ] [seed1,seed2,...]   (MODE=ai — Україною керує ШІ для порівняння)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^(src\/ui|src\/stream|src\/net|lib)\//.test(f));
function load() { const ctx = { console, Math, Date, JSON, Map, Set, Float32Array, Float64Array, Int32Array, Uint8Array, Object, Array, Number, String, Infinity, isFinite }; ctx.globalThis = ctx; vm.createContext(ctx); files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f })); return ctx.LORA; }
const DAYS = +(process.argv[2] || 1095), SEEDS = (process.argv[3] || '3,7,11').split(',').map(Number), MODE = process.env.MODE || 'me';
function run(seed) {
  const L = load(); const G = L.createGame({ seed }); G.init('UKR', 'war2026', { difficulty: process.env.DIFF || 'normal' });
  const U = G.player, R = G.nIdx.RUS, n = G.N[U], T = G.T, ter = G.ter, BD = G.D.buildings;
  G.armies.forEach(a => { if (a.n === U) a.auto = true; });
  if (MODE === 'ai') G.autoPlayer = true;
  else { ['fpv', 'recon_swarm', 'ew', 'swarm', 'laser_ad', 'naval_drones', 'ai_assist'].forEach(id => G.queueResearch(U, id)); n.res.auto = true; }
  const own0 = ter.filter(t => t.owner === U).length; let peace = null, log = [], aidGot = 0, tourI = 0;
  const ally = ['POL', 'DEU', 'GBR', 'USA', 'FRA', 'CAN', 'NLD', 'SWE'].map(a => G.nIdx[a]);
  const front = () => ter.filter(t => t.ctrl === U && T[t.i].nb.some(j => G.atWar(U, ter[j].ctrl)));
  for (let d = 0; d < DAYS; d++) {
    if (MODE === 'me') {
      // мирні пропозиції: приймаю лише повернення територій
      while (G.pendingPeace.length) { const p = G.pendingPeace[0]; const yes = p.type === 'white' || p.type === 'cede'; if (yes) { peace = p.type + ' @' + G.dateStr(); } G.act.answerPending(0, yes); }
      if (G.day % 7 === 2 && G.atWar(U, R)) { // удари по тилу
        const own = ter.filter(t => t.ctrl === U);
        const tg = goal => ter.filter(t => t.ctrl === R && t.owner === R && G.strikeRange(U, t.i, 'strike', own)).map(t => { let v = 0; const want = goal === 'energy' ? ['npp', 'coal_plant', 'gas_plant', 'hydro_plant', 'oil_field'] : ['arms_factory', 'drone_factory', 'missile_plant']; want.forEach(k => v += (t.bld[k] || 0) * BD[k].cost); return { i: t.i, v: v * (1 - t.shield * 0.7) }; }).sort((a, b) => b.v - a.v)[0];
        const sd = Math.floor(n.ars.strike * 0.3); if (sd >= 20) { const g = (G.day / 7) % 3 < 1 ? 'industry' : 'energy'; const t = tg(g); if (t && t.v > 0) G.strike(U, t.i, 'strike', sd, g, true); }
        const ms = Math.floor(n.ars.missiles * 0.3); if (ms >= 8) { const fr = ter.filter(t => t.ctrl === R && T[t.i].nb.some(j => ter[j].ctrl === U)).sort((a, b) => G.armies.filter(x => x.t === b.i && x.n === R).reduce((s, x) => s + x.k, 0) - G.armies.filter(x => x.t === a.i && x.n === R).reduce((s, x) => s + x.k, 0))[0]; if (fr) G.strike(U, fr.i, 'missiles', ms, (G.day / 7) % 3 < 1 ? 'rail' : 'military', true); }
      }
      if (G.day % 30 === 5) { // щомісячні рішення уряду
        if (process.env.NEW !== '0' && G.assignGeneral) { // нові можливості 1.3: генерали, авіація, кібер
          const gens = G.gensOf(U).sort((a, b) => b.skill - a.skill), fr = new Set(front().map(t => t.i)); const arms = G.armies.filter(a => a.n === U).sort((a, b) => (fr.has(b.t) ? 1e6 : 0) + b.k - (fr.has(a.t) ? 1e6 : 0) - a.k);
          gens.forEach((g, k) => { if (arms[k] && arms[k].gen !== g.id) G.assignGeneral(arms[k].id, g.id); });
          if ((n.milStock || 0) > 3) { G.act.buyAir('atk', 8); G.act.buyAir('ftr', 6); }
          G.act.cyber(R, G.day % 90 < 30 ? 'military' : G.day % 90 < 60 ? 'energy' : 'finance');
        }
        if (process.env.TPL !== '0' && G.setArmyTemplate && G.day > 120) { const mine = G.armies.filter(a => a.n === U && !a.retrain); const fr = new Set(front().map(t => t.i)); mine.filter(a => !fr.has(a.t) && a.k > 50 && G.tplOf(a) === 'std').sort((a, b) => b.k - a.k).slice(0, n._armSat > 0.85 ? 2 : 0).forEach(a => G.setArmyTemplate(a, 'mech')); mine.filter(a => fr.has(a.t) && G.urbanDef(a.t) > 0.2 && G.tplOf(a) === 'std').slice(0, 2).forEach(a => G.setArmyTemplate(a, 'inf')); }
        const p = n.pol; const war = G.atWar(U, R);
        p.mil = war ? 0.24 : 0.06; p.mob = war ? (G.day > 365 ? 0.045 : 0.038) : 0.012; p.res = 0.012; if (p.tax < 0.28) p.tax = 0.28;
        p.soc = n.stab < 45 ? Math.min(0.3, p.soc + 0.02) : Math.max(0.08, p.soc - 0.005);
        if (n.debt > n.agg.gdp * 1.4) p.tax = Math.min(0.42, p.tax + 0.01);
        // будівництво: дрони й ППО в тилу, укріплення на фронті
        const safe = ter.filter(t => t.ctrl === U && t.owner === U && !T[t.i].nb.some(j => G.atWar(U, ter[j].ctrl))).sort((a, b) => b.gdp - a.gdp);
        const plan = [['drone_factory', safe], ['air_defense', safe], ['fortline', front()], ['drone_factory', safe], ['arms_factory', safe], ['missile_plant', safe]];
        for (const [k, list] of plan) { if (n.cash < G.buildCost(U, 0, k) * 1.5) break; const t = list.find(t => !G.canBuild(U, t.i, k)); if (t) G.act.build(t.i, k); }
        // контрнаступ: концентрація резервів проти найслабшої окупованої ділянки
        if (war && G.day > 200) {
          const P = a => G.armyPower(a); G.armies.forEach(a => { if (a.n === U && a.opUntil && a.opUntil < G.day) { a.auto = true; a.opUntil = 0; } });
          const cand = ter.filter(t => t.owner === U && t.ctrl === R && T[t.i].nb.filter(j => ter[j].ctrl === U).length >= 2 && T[t.i].nb.filter(j => ter[j].ctrl === R).length <= 2).map(t => {
            const en = G.armies.filter(x => x.n === R && (x.t === t.i || T[t.i].nb.includes(x.t))).reduce((s, x) => s + P(x) * (x.t === t.i ? 1 : 0.4), 0); return { t, en }; }).sort((a, b) => a.en - b.en)[0];
          if (cand) { const near = G.armies.filter(a => a.n === U && !a.mv && T[cand.t.i].nb.includes(a.t)); const res = G.armies.filter(a => a.n === U && !a.mv && !near.includes(a) && a.k > 60 && !G.armies.some(x => x.t === a.t && G.atWar(x.n, U))).sort((a, b) => b.k - a.k).slice(0, 3);
            const myP = near.reduce((s, a) => s + a.k * n.q * n.arsF.att, 0) + res.reduce((s, a) => s + a.k * n.q * n.arsF.att * 0.5, 0);
            if (myP > cand.en * 1.6 && n.arsF.att > 1) { const stage = near[0] ? near[0].t : null; res.forEach(a => { if (stage != null) { a.auto = false; a.opUntil = G.day + 60; G.orderMove(a, stage); } }); near.forEach(a => { a.auto = false; a.opUntil = G.day + 60; a.stance = 'attack'; G.orderMove(a, cand.t.i); }); log.push('наступ ' + T[cand.t.i].n + ' ' + G.dateStr()); } }
        }
        if (war && (G.N[R].warExh || 0) > 0.45) { const r = G.act.peace(R, 'white'); if (r.ok) peace = 'white(me) @' + G.dateStr(); }
        // дипломатія: турне лідера союзниками, прохання про допомогу, вступ до ЄС/НАТО, санкції проти агресора в блоках
        if (process.env.DIPLO !== '0' && G.leader) {
          const L = G.leader, here = G.leaderNation();
          if (!L.mv && here !== U && here >= 0) { const x = here; if (x === G.nIdx.BEL) { ['eu', 'nato'].forEach(b => { const r = G.blocApply(b, U); if (r.ok) log.push('заявка ' + b + ' ' + G.dateStr()); G.blocPropose(b, 'aid', U, U, true); }); }
            else { G.act.improve(x); const r = G.act.requestAid(x); if (r && r.amt) aidGot += r.amt; if (G.rel[x][U] > 40 && !G.treaties.has(G.warKey(U, x))) G.act.treaty(x); } }
          if (!L.mv) { const tour = ally.concat([G.nIdx.BEL, G.nIdx.JPN, G.nIdx.ITA, G.nIdx.ESP, G.nIdx.NOR]).filter(x => x != null);
            const relOk = tourI % 4 === 3;
            const dest = here === U ? (relOk ? G.nIdx.BEL : tour[tourI++ % tour.length]) : U; const reg = dest === U ? (G.N[U].home != null ? G.N[U].home : ter.findIndex(t => t.ctrl === U)) : ter.findIndex(t => t.ctrl === dest && t.owner === dest); if (reg >= 0) G.leaderGo(reg); }
          Object.values(G.blocs).forEach(b => { if (!b.m.includes(U)) return; G.blocPropose(b.id, 'sanction', R, U, true); G.blocPropose(b.id, 'aid', U, U, true); b.agenda.forEach(it => G.blocVote(b.id, it.id, U, it.target === R && it.kind === 'sanction' ? 1 : it.target === U ? 1 : 0)); });
        }
        ally.forEach(a => { if (a != null && G.rel[a][U] < 70 && n.cash > 5 && !G.leaderBlocks(a)) G.act.improve(a); });
      }
    }
    G.step(); if (G.gameOver) { log.push('GAMEOVER ' + G.gameOver.text); break; }
    if (!G.atWar(U, R) && !peace) peace = 'peace(AI) @' + G.dateStr();
  }
  const ctrl = ter.filter(t => t.owner === U && t.ctrl === U).length, lib = ter.filter(t => t.owner === U && t.ctrl === U && G.T[t.i] && ['Луганська обл.', 'Автономна Республіка Крим', 'Севастополь'].includes(T[t.i].n)).length;
  if (process.env.NEWS) console.log(G.news.filter(n => /війн|мир|Мир|капітул|нападає|вступає|Перевор|протест|встановлює контроль/i.test(n.text) && n.nats.includes(U)).slice(0, 40).reverse().map(n => G.dateStr(n.d) + ' ' + n.text).join('\n'));
  log = log.slice(-8); const sancR = [...G.sanctions].filter(k => k.endsWith('>' + R)).length; return { seed, mode: MODE, aidGot: aidGot.toFixed(0), blocs: G.blocsOf(U).map(b => b.id).join(','), sancOnRus: sancR, rusPress: (G.N[R].press || 0).toFixed(2), ctrl: ctrl + '/' + own0, liberated: lib, gdp: n.agg.gdp.toFixed(0), stab: n.stab.toFixed(0), casU: n.casualties.toFixed(0), casR: G.N[R].casualties.toFixed(0), rusStab: G.N[R].stab.toFixed(0), rusExh: (G.N[R].warExh || 0).toFixed(2), war: G.atWar(U, R), peace, techs: Object.keys(n.res.done).length, ars: Object.fromEntries(Object.entries(n.ars).map(([k, v]) => [k, Math.round(v)])), hitsOut: n.arsM.hitsOut, log };
}
SEEDS.forEach(s => console.log(JSON.stringify(run(s))));
