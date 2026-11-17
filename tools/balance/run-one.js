// Один прогін симуляції з заданими параметрами балансу -> метрики (JSON у stdout).
// node run-one.js '{"params":{...},"seed":7,"days":730,"scenario":"war2026","country":"UKR"}'
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const cfg = JSON.parse(process.argv[2]);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^(src\/ui|src\/stream|src\/net|lib)\//.test(f));
const ctx = { console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, Map, Set, Float32Array, Float64Array, Int32Array, Uint8Array, Object, Array, Number, String, Infinity, isFinite };
ctx.globalThis = ctx; vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const L = ctx.LORA;
Object.entries(cfg.params || {}).forEach(([k, v]) => { if (L.data.balance[k]) L.data.balance[k].value = v; });
const G = L.createGame({ seed: cfg.seed }); G.init(cfg.country || 'UKR', cfg.scenario || 'war2026');
G.autoPlayer = true; G.armies.forEach(a => a.auto = true); // гравця веде той самий ШІ
G.metrics.selfTune = false;
const big = ['USA', 'CHN', 'RUS', 'IND', 'DEU', 'JPN', 'GBR', 'FRA', 'BRA', 'UKR', 'TUR', 'POL'].map(a => G.nIdx[a]);
const regs0 = big.map(n => G.ter.filter(t => t.owner === n).length);
let changes = 0; L.bus.on('capture', () => changes++);
const R = G.nIdx.RUS, U = G.nIdx.UKR; const cas0 = { R: G.N[R].casualties, U: G.N[U].casualties };
let growthSum = 0, gN = 0, wars0 = G.wars.size, newWars = 0;
L.bus.on('war', () => newWars++);
for (let i = 0; i < cfg.days; i++) { G.step(); if (G.day % 30 === 0 && !(G.worldMod.until > G.day)) { growthSum += G.metrics.worldGrowth || 0; gN++; } }
const yrs = cfg.days / 365;
const collapse = big.map((n, k) => n == null ? 0 : 1 - G.ter.filter(t => t.owner === n && t.ctrl === n).length / Math.max(1, regs0[k]));
const out = {
  frontPerYear: changes / yrs,
  casR: (G.N[R].casualties - cas0.R) / yrs / Math.max(100, G.troopsOf(R) || 1),
  casU: (G.N[U].casualties - cas0.U) / yrs / Math.max(100, G.troopsOf(U) || 1),
  uaLost: collapse[big.indexOf(U)], maxCollapse: Math.max(...collapse), ruAlive: G.N[R].alive, uaAlive: G.N[U].alive,
  growth: growthSum / Math.max(1, gN), newWars, warsEnd: G.wars.size, B: G.B
};
process.stdout.write(JSON.stringify(out));
