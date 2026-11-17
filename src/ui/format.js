// ІНТЕРФЕЙС: спільний стан і форматування чисел/назв. Глобальні змінні інтерфейсу оголошено тут.
var G = null;                 // поточна гра
var mode = 'pol';             // режим мапи
var modeRes = 'oil';          // ресурс для режиму «Ресурс»
var tab = 'state';            // вкладка лівої панелі
var subtab = {};              // підвкладки
var sel = null;               // вибране: {type:'t'|'a'|'f', id}
var speedIdx = 0, lastSpeed = 1;
var modalOpen = false;
var orderMode = null;
var mapDirty = true;
var hoverT = -1;
const RES = LORA.data.resourceOrder, RI = LORA.data.resources, RGROUPS = LORA.data.resourceGroups;
const D = LORA.data;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function money(bn) { const a = Math.abs(bn); const sgn = bn < 0 ? '−' : ''; if (a >= 1000) return sgn + '$' + (a / 1000).toFixed(a >= 10000 ? 1 : 2) + ' трлн'; if (a >= 1) return sgn + '$' + a.toFixed(a >= 100 ? 0 : 1) + ' млрд'; return sgn + '$' + (a * 1000).toFixed(0) + ' млн'; }
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
const sgnPct = (x, d = 1) => (x >= 0 ? '+' : '') + (x * 100).toFixed(d) + '%';
const people = k => k >= 1000 ? (k / 1000).toFixed(2) + ' млн' : k.toFixed(0) + ' тис.';
const popM = m => m >= 1 ? m.toFixed(1) + ' млн' : (m * 1000).toFixed(0) + ' тис.';
const qty = (r, q) => (q >= 100 ? q.toFixed(0) : q >= 10 ? q.toFixed(1) : q.toFixed(2));
const nat = i => G.N[i];
const ndot = i => `<span class="dot" style="background:${G.N[i].color}"></span>`;
const nlink = i => `<a href="#" onclick="selectNation(${i});return false" style="color:#cfe6ff;text-decoration:none">${ndot(i)}${esc(G.N[i].name)}</a>`;
const regName = i => D.regions[i].n || (G ? nat(G.ter[i].core).name : '');
