// Тест режиму «за персонажа»: node tools/test/char-test.js [ТИП] [КРАЇНА] [ДНІВ]
// Проста стратегія: зв'язки й популярність удома, інвестиції, консультації, посередництво з сусідом → вибори → глава держави.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^(src\/ui|src\/stream|src\/net|lib)\//.test(f));
const ctx = { console, Math, Date, JSON, Map, Set, Float32Array, Float64Array, Int32Array, Uint8Array, Object, Array, Number, String, Infinity, isFinite };
ctx.globalThis = ctx; vm.createContext(ctx); files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const L0 = ctx.LORA; const [type = 'star', home = 'POL', days = 1500, seed = 5] = process.argv.slice(2);
const G = L0.createGame({ seed: +seed }); G.init(null, 'war2026', { difficulty: 'normal', char: { name: 'Олена Тест', type, home } });
const H = G.nIdx[home], nb = G.N.filter(n => n.alive && n.id !== H && n.parl && n.parl.regime !== 'autocracy' && G.ter.some((t, i) => t.ctrl === H && G.T[i].nb.some(j => G.ter[j].ctrl === n.id)))[0];
console.log('персонаж', G.leader.name, type, 'дім', G.N[H].name, 'гроші', G.leader.money, 'сусід для угод', nb && nb.name, 'вибори', G.N[H].parl && G.dateStr(G.N[H].parl.next));
let log = [], won = null, errs = {};
const go = nid => { const t = G.ter.findIndex(t => t.ctrl === nid && t.owner === nid); return G.leaderGo(t); };
for (let d = 0; d < +days; d++) {
  G.step(); const L = G.leader; if (!L) { console.log("лідера немає", G.dateStr(), G.player, Object.keys(G.leaders), G.gameOver && G.gameOver.text); break; }
  if (G.player >= 0) { won = G.dateStr() + ' → ' + G.N[G.player].name; break; }
  if (L.mv || L.busy > G.day) continue;
  const here = G.leaderNation(), c = L.cont[H] || 0, p = L.popu[H] || 0;
  let k = null, partner;
  if (L.money < 0.006) k = (L.cont[here] || 0) >= 20 ? 'consult' : 'lecture';
  else if (here !== H) { if ((L.cont[here] || 0) < 32) k = 'meet'; else if ((L.cont[H] || 0) >= 30) { k = 'broker'; partner = H; } else { go(H); continue; } }
  else if (c >= 40 && p >= 45 && L.cand !== H) k = 'run';
  else if (L.cand === H && c >= 55 && p >= 55 && G.N[H].parl.next - G.day >= 90 && L.money > 0.07) k = 'snap';
  else if (L.money < 0.01) k = c >= 20 ? 'consult' : 'meet';
  else if (L.money > 0.12) k = 'invest';
  else if (nb && c >= 35 && (L.cont[nb.id] || 0) < 30 && G.day % 200 < 5) { go(nb.id); continue; }
  else k = c < 58 ? 'meet' : p < 58 ? 'speech' : 'consult';
  const r = G.charDo(k, partner); if (!r.ok) { errs[k + ":" + r.err] = (errs[k + ":" + r.err] || 0) + 1; if (/звʼязки ≥ 20/.test(r.err)) G.charDo('meet'); }
  else if (k === 'run' || k === 'broker' || k === 'snap') log.push(G.dateStr() + ' ' + k + ' ' + r.msg);
  if (G.day % 180 === 0) console.log(G.dateStr(), 'гроші', L.money.toFixed(3), 'звʼязки', c.toFixed(0), 'популярність', p.toFixed(0), 'слава', L.fame.toFixed(0), 'кандидат', L.cand != null);
}
console.log(JSON.stringify({ won, log: log.slice(0, 10), errs }));
if (won) { // кілька місяців за державу: має працювати як звичайна гра
  for (let d = 0; d < 120; d++) G.step();
  const n = G.N[G.player]; console.log('після перемоги', G.dateStr(), n.name, 'ВВП', n.agg.gdp.toFixed(0), 'стаб', n.stab.toFixed(0), 'лідер', G.leader && G.leader.role, 'агенти', JSON.stringify(G.act.hireAgent('spy')), 'кеш', n.cash.toFixed(1));
}
