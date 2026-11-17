// Тест компаній: node tools/test/company-test.js [СЕКТОР] [КРАЇНА] [ДНІВ] [СКЛАДНІСТЬ]
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^(src\/ui|src\/stream|src\/net|lib)\//.test(f));
const ctx = { console, Math, Date, JSON, Map, Set, Float32Array, Float64Array, Int32Array, Uint8Array, Object, Array, Number, String, Infinity, isFinite };
ctx.globalThis = ctx; vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const L = ctx.LORA;
const [sector = 'agro', home = 'MDA', days = 720, diff = 'normal'] = process.argv.slice(2);
const G = L.createGame({ seed: 11 }); G.init(null, 'war2026', { difficulty: diff, company: { name: 'Тест Корп', sector, home } });
const c = G.myCo(); console.log('player', G.player, 'pc', G.pc, 'cash', c.cash, 'офіс', G.T[c.offices[0].t].n, 'AI компаній', G.companies.length - 1);
// проста стратегія гравця: будувати найприбутковіше у країні штабу, лобіювати, спробувати захоплення
const BD = G.D.buildings, SEC = G.D.companySectors[sector];
for (let i = 0; i < +days; i++) {
  G.step();
  if (G.day % 30 === 0) {
    let best = null; G.ter.forEach(t => { if (t.owner !== c.home) return; SEC.assets.forEach(type => { if (G.coCanBuild(c, t.i, type)) return; const roi = G.assetProfit(c, { t: t.i, type, lvl: 1 }) / BD[type].cost; if (!best || roi > best.roi) best = { i: t.i, type, roi }; }); });
    if (best && c.cash > 1.5) { const r = G.coBuild(c, best.i, best.type); }
    else if (c.cash > 0.5) G.coLobby(c, c.home, c.cash * 0.5);
    const r = G.coTakeover(c, c.home); if (r.ok) { console.log('ЗАХОПЛЕННЯ', G.dateStr(), '→ гравець', G.N[G.player].name); break; }
  }
  if (G.day % 120 === 0) console.log(G.dateStr(), 'cash', c.cash.toFixed(2), 'value', G.coValue(c).toFixed(2), 'profit/yr', c.profitY.toFixed(2), 'assets', c.assets.map(a => a.type + ':' + a.lvl).join(','), 'pend', c.pend.length, 'вплив', (c.infl[c.home] || 0).toFixed(1), G.coCanTakeover(c, c.home));
  if (G.gameOver) { console.log('GAME OVER', G.gameOver.text); break; }
}
const top = G.companies.slice().sort((a, b) => G.coValue(b) - G.coValue(a)).slice(0, 8);
top.forEach(x => console.log(x.name.padEnd(22), G.coValue(x).toFixed(1), 'офісів', x.offices.length, 'активів', x.assets.reduce((s, a) => s + a.lvl, 0), 'прибуток', x.profitY.toFixed(1)));
console.log(G.news.filter(n => /компан|націонал|Корпорац|«/.test(n.text)).slice(0, 8).map(n => G.dateStr(n.d) + ' ' + n.text).join('\n'));
