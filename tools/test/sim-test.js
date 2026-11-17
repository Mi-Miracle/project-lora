// Тест симуляції без браузера: node tools/test/sim-test.js [КРАЇНА] [СЦЕНАРІЙ] [ДНІВ]
// Завантажує ті самі файли, що й index.html (крім інтерфейсу), і проганяє гру.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^(src\/ui|src\/stream|src\/net|lib)\//.test(f));
const ctx = { console, Math, Date, JSON, Map, Set, Float32Array, Float64Array, Int32Array, Uint8Array, Object, Array, Number, String, Infinity, isFinite };
ctx.globalThis = ctx; vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const L = ctx.LORA;
const [cc = 'UKR', sc = 'war2026', days = 365] = process.argv.slice(2);
const t0 = Date.now();
const G = L.createGame({ seed: 7 }); G.init(cc, sc); if (process.env.AUTO) { G.autoPlayer = true; G.armies.forEach(a => a.auto = true); }
console.log('init ms', Date.now() - t0, 'regions', G.NT, 'nations', G.N.filter(n => n.alive).length, 'armies', G.armies.length, 'flows', G.flows.length);
const t1 = Date.now();
for (let i = 0; i < +days; i++) {
  G.step();
  if (G.day % 120 === 0 || i === days - 1) {
    const p = G.N[G.player], R = G.N[G.nIdx.RUS];
    const occ = G.ter.filter(t => t.owner === p.id && t.ctrl !== p.id).map(t => G.T[t.i].n).join(',');
    const fr = G.ter.filter(t => t.occ && (t.owner === p.id)).map(t => G.T[t.i].n + ':' + t.occ.p.toFixed(0)).join(',');
    console.log(G.dateStr(), '|', p.name, 'ВВП', p.agg.gdp.toFixed(0), 'g', (p.growth * 100).toFixed(1), 'стаб', p.stab.toFixed(0), 'війська', G.troopsOf(p.id).toFixed(0), 'втрати', p.casualties.toFixed(0), '| РФ', R.agg.gdp.toFixed(0), 'втрати', R.casualties.toFixed(0), '| війн', G.wars.size, '| ціни', Object.entries(G.prices).filter(([k, v]) => Math.abs(v / G.priceBase[k] - 1) > 0.1).map(([k, v]) => k + ':' + (v / G.priceBase[k]).toFixed(2)).join(' '));
    if (occ) console.log('   окуповано:', occ); if (fr) console.log('   наступи:', fr);
  }
  if (G.gameOver) { console.log('GAME OVER', G.gameOver.text); break; }
}
console.log('мс/день', ((Date.now() - t1) / G.day).toFixed(1));
console.log(G.news.slice(0, 12).map(n => G.dateStr(n.d) + ' ' + n.text).join('\n'));
