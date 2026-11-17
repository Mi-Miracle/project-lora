// Крок 4: англійські назви регіонів, міст і країн для локалізації → data/i18n/names-en.js
// node build-data/04_names_en.js <ne_10m_admin_1.geojson> <ne_10m_populated_places.geojson> <project-root>
const fs = require('fs'), path = require('path'), vm = require('vm');
const iso = require('i18n-iso-countries');
const [, , ADM1, PLACES, ROOT] = process.argv;
const ctx = { LORA: { data: {} } }; vm.createContext(ctx);
['geo/regions.js', 'geo/cities.js', 'geo/cells.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), ctx));
const D = ctx.LORA.data;
const MAP = { KOS: 'KSV', SDS: 'SSD', PSX: 'PSE', SAH: 'ESH', CYN: 'NCY', KAS: 'IND', KAB: 'KAZ', ESB: 'CYP', WSB: 'CYP', HKG: 'CHN' };
const adm = JSON.parse(fs.readFileSync(ADM1)).features.map(f => f.properties);
const key = (cc, s) => cc + '|' + (s || '').replace(' область', ' обл.').toLowerCase();
const byName = {};
adm.forEach(p => { let a = MAP[p.adm0_a3] || p.adm0_a3; if (p.name === 'Crimea' || p.name === 'Sevastopol') a = 'UKR';
  const en = p.name_en || p.name; if (p.name_uk) byName[key(a, p.name_uk)] = en; if (p.region) byName[key(a, p.region)] = p.region; if (p.name) byName[key(a, p.name)] = en; });
byName['UKR|київ (місто)'] = 'Kyiv (city)'; byName['UKR|київська обл.'] = 'Kyiv Oblast';
const fixEn = s => s.replace(/\bKiev\b/g, 'Kyiv');
let miss = 0;
const regions = D.regions.map(r => { if (!r.n) return null; const v = byName[key(r.cc, r.n)]; if (!v) { miss++; return null; } return fixEn(v); });
const pl = JSON.parse(fs.readFileSync(PLACES)).features.map(f => f.properties);
const plIdx = {}; pl.forEach(p => { const k = (p.NAME_UK || p.NAME) + '|' + Math.round(p.LONGITUDE) + '|' + Math.round(p.LATITUDE); plIdx[k] = p.NAME_EN || p.NAME; });
let cm = 0;
const cities = D.cities.map(c => { for (const dx of [0, -1, 1]) for (const dy of [0, -1, 1]) { const v = plIdx[c.n + '|' + (Math.round(c.lon) + dx) + '|' + (Math.round(c.lat) + dy)]; if (v) return fixEn(v); } cm++; return null; });
const countries = {}; D.cells.forEach(c => { countries[c.a3] = iso.getName(c.a3, 'en') || null; });
Object.assign(countries, { RUS: 'Russia', USA: 'United States', GBR: 'United Kingdom', KOR: 'South Korea', PRK: 'North Korea', IRN: 'Iran', SYR: 'Syria', VEN: 'Venezuela', BOL: 'Bolivia', TZA: 'Tanzania', COD: 'DR Congo', COG: 'Congo', MDA: 'Moldova', LAO: 'Laos', VNM: 'Vietnam', TWN: 'Taiwan', KSV: 'Kosovo', NCY: 'Northern Cyprus', SOL: 'Somaliland', PSE: 'Palestine', CZE: 'Czechia', MKD: 'North Macedonia', FSM: 'Micronesia' });
fs.writeFileSync(path.join(ROOT, 'data/i18n/names-en.js'), `// Англійські назви (локалізація). ЗГЕНЕРОВАНО: tools/build-data/04_names_en.js\nLORA.data.namesEn = ${JSON.stringify({ regions, cities, countries })};\n`);
console.log('regions missing', miss, 'of', D.regions.filter(r => r.n).length, '| cities missing', cm, 'of', D.cities.length, '| countries', Object.keys(countries).length);
