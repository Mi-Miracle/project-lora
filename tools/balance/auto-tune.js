// АВТОНАСТРОЮВАЧ БАЛАНСУ. Запуск: node tools/balance/auto-tune.js [поколінь=6] [нащадків=4] [днів=730]
// Еволюційний пошук: мутує параметри з data/balance.js у межах min/max, проганяє симуляції (по 2 сиди),
// оцінює відхилення від цілей (data/balance.js -> balanceTargets) і записує найкращі значення назад у data/balance.js.
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFile } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const balFile = path.join(ROOT, 'data', 'balance.js');
const ctx = { LORA: { data: {} } }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(balFile, 'utf8'), ctx);
const B = ctx.LORA.data.balance, TG = ctx.LORA.data.balanceTargets;
const KEYS = ['attackerLoss', 'combatLoss', 'holdIntensity', 'occRate', 'occCap', 'defBase', 'fortDef', 'attackNeed', 'attackNeedRisk', 'attritionNeed'];
const [GENS = 6, KIDS = 4, DAYS = 730] = process.argv.slice(2).map(Number);
const SEEDS = [7, 99];
const run = (params, seed) => new Promise(res => execFile('node', [path.join(__dirname, 'run-one.js'), JSON.stringify({ params, seed, days: DAYS })], { maxBuffer: 1e7, timeout: 900000 }, (e, out) => { try { res(JSON.parse(out)); } catch (x) { res(null); } }));
const band = (v, [lo, hi]) => v < lo ? (lo - v) / lo : v > hi ? (v - hi) / hi : 0;
function score(m) {
  if (!m) return 99;
  let s = 0;
  s += 2 * band(m.frontPerYear, TG.frontRegionsPerYear);
  s += band(m.casR, TG.casualtiesPerYearShare) + band(m.casU, TG.casualtiesPerYearShare);
  s += Math.max(0, m.casU / Math.max(0.01, m.casR) - 2) * 0.3; // оборонець не повинен втрачати набагато більше за агресора
  s += 3 * Math.max(0, m.uaLost - 0.35) + 3 * Math.max(0, m.maxCollapse - 0.4);
  s += (m.uaAlive ? 0 : 5) + (m.ruAlive ? 0 : 5);
  s += 2 * band(m.growth, TG.worldGrowth);
  s += m.newWars > 3 ? (m.newWars - 3) * 0.3 : 0;
  return s;
}
async function evalP(p) { const ms = []; for (let i = 0; i < SEEDS.length; i += 2) ms.push(...await Promise.all(SEEDS.slice(i, i + 2).map(sd => run(p, sd)))); const sc = ms.reduce((a, m) => a + score(m), 0) / ms.length; return { p, sc, ms }; }
function mutate(p, step) { const q = Object.assign({}, p); KEYS.forEach(k => { if (Math.random() < 0.5) { const lim = B[k]; const span = lim.max - lim.min; q[k] = Math.min(lim.max, Math.max(lim.min, q[k] + (Math.random() * 2 - 1) * span * step)); } }); return q; }
(async () => {
  let best = {}; KEYS.forEach(k => best[k] = B[k].value);
  let cur = await evalP(best); console.log('старт', cur.sc.toFixed(3), JSON.stringify(cur.ms.map(m => m && { f: +m.frontPerYear.toFixed(1), cR: +m.casR.toFixed(2), cU: +m.casU.toFixed(2), ua: +m.uaLost.toFixed(2), g: +m.growth.toFixed(3), w: m.newWars })));
  let step = 0.25;
  for (let g = 0; g < GENS; g++) {
    for (let k = 0; k < KIDS; k++) {
      const c = await evalP(mutate(cur.p, step));
      const brief = c.ms.map(m => m && { f: +m.frontPerYear.toFixed(1), cR: +m.casR.toFixed(2), cU: +m.casU.toFixed(2), ua: +m.uaLost.toFixed(2), g: +m.growth.toFixed(3), w: m.newWars });
      console.log(`покоління ${g + 1}.${k + 1}: ${c.sc.toFixed(3)} ${JSON.stringify(brief)}`);
      if (c.sc < cur.sc) { cur = c; console.log('  ✓ краще'); }
    }
    step *= 0.75;
  }
  // запис найкращих значень у data/balance.js
  let src = fs.readFileSync(balFile, 'utf8');
  KEYS.forEach(k => { const v = +cur.p[k].toPrecision(3); src = src.replace(new RegExp(`(${k}:\\s*\\{ value: )[0-9.e-]+`), `$1${v}`); });
  src = src.replace(/\/\/ Останнє автоналаштування:.*\n/, '') + `// Останнє автоналаштування: ${new Date().toISOString().slice(0, 10)}, оцінка ${cur.sc.toFixed(3)} (0 = всі цілі виконано)\n`;
  fs.writeFileSync(balFile, src);
  console.log('ГОТОВО. Найкраще:', cur.sc.toFixed(3), JSON.stringify(cur.p));
})();
