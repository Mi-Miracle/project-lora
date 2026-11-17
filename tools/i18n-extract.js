// Витягує українські фрагменти рядків із коду (src/**, data/* крім geo) → tools/i18n-fragments.json
// node tools/i18n-extract.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const files = []; const walk = d => fs.readdirSync(d).forEach(f => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/geo|i18n/.test(f)) walk(p); } else if (p.endsWith('.js')) files.push(p); });
walk(path.join(ROOT, 'src')); walk(path.join(ROOT, 'data'));
const set = new Map();
files.forEach(f => {
  let s = fs.readFileSync(f, 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').replace(/\/\/[^\n'"`]*$/gm, '');
  // фрагменти: послідовності без лапок, тегів і ${}, що містять кирилицю
  const parts = s.split(/\$\{|\}|<\/?[a-zA-Z][^<>]*>|['"`]|\\n/);
  parts.forEach(p => { p = p.trim(); if (!/[а-яіїєґА-ЯІЇЄҐ]/.test(p)) return; if (p.length > 400) return; p = p.replace(/^[\s,.:;·()|+\-—=!?]+|[\s,:;·(|+\-—=]+$/g, ''); if (!/[а-яіїєґА-ЯІЇЄҐ]/.test(p)) return; set.set(p, (set.get(p) || 0) + 1); });
});
const arr = [...set.keys()].sort((a, b) => b.length - a.length);
fs.writeFileSync(path.join(__dirname, 'i18n-fragments.json'), JSON.stringify(arr, null, 0));
console.log('fragments', arr.length, 'chars', arr.join('').length);
