// Збирає словник data/i18n/en.js: фрагменти (tools/i18n-fragments.json) + переклади en_a/b/c.txt (рядок = індекс) + en_extra.tsv.
// Після змін у коді: node tools/i18n-extract.js → допишіть переклади нових фрагментів у en_extra.tsv → node tools/i18n/build-en.js
const fs = require('fs'), path = require('path');
const frag = require('../i18n-fragments.json');
const tr = ['en_a.txt', 'en_b.txt', 'en_c.txt'].flatMap(f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\n$/, '').split('\n'));
const base = path.join(__dirname, 'base-fragments.json');
// базовий список фрагментів, до якого прив'язані рядки en_*.txt (фіксується при першому збиранні)
if (!fs.existsSync(base)) fs.writeFileSync(base, JSON.stringify(frag));
const B = require(base); if (B.length !== tr.length) throw new Error(`Кількість перекладів ${tr.length} ≠ фрагментів ${B.length}`);
const dict = {}; B.forEach((k, i) => { if (tr[i] && tr[i] !== '-') dict[k] = tr[i]; });
fs.readFileSync(path.join(__dirname, 'en_extra.tsv'), 'utf8').split('\n').forEach(l => { const [k, v] = l.split('\t'); if (k && v) dict[k] = v; });
const missing = frag.filter(k => !(k in dict) && !B.includes(k));
fs.writeFileSync(path.join(__dirname, '..', '..', 'data/i18n/en.js'), `// Англійський словник (укр. фрагмент → англ.). ЗГЕНЕРОВАНО: tools/i18n/build-en.js\nLORA.i18n.dict.en = ${JSON.stringify(dict, null, 0)};\n`);
console.log('entries', Object.keys(dict).length, '| нові фрагменти без перекладу:', missing.length); fs.writeFileSync(path.join(__dirname, 'missing.txt'), missing.join('\n'));
