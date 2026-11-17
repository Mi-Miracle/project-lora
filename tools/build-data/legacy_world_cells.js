// Builds world data for the game: territories, borders, ports, sea network, economy
const topo = require('world-atlas/countries-110m.json');
const topojson = require('topojson-client');
const d3 = require('d3-geo');
const iso = require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/uk.json'));
const fs = require('fs');

const R = 6371;
function hav(a, b) { // [lon,lat]
  const toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR, dLon = (b[0] - a[0]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

const geoms = topo.objects.countries.geometries;
const NAME_OVR = {
  USA: 'США', GBR: 'Велика Британія', RUS: 'Росія', KOR: 'Південна Корея', PRK: 'Північна Корея',
  IRN: 'Іран', SYR: 'Сирія', VEN: 'Венесуела', BOL: 'Болівія', TZA: 'Танзанія', COD: 'ДР Конго',
  COG: 'Конго', LAO: 'Лаос', VNM: "В'єтнам", MDA: 'Молдова', TWN: 'Тайвань', CZE: 'Чехія',
  CAF: 'ЦАР', ARE: 'ОАЕ', DOM: 'Домініканська Респ.', BIH: 'Боснія і Герцеговина', MKD: 'Півн. Македонія',
  PSE: 'Палестина', NLD: 'Нідерланди', CIV: "Кот-д'Івуар", SSD: 'Південний Судан', GNQ: 'Екв. Гвінея',
  FLK: 'Фолкленди', ATF: 'Франц. півд. території', ESH: 'Західна Сахара', SWZ: 'Есватіні', TLS: 'Східний Тимор',
  BRN: 'Бруней', PNG: 'Папуа Нова Гвінея', SLB: 'Соломонові о-ви', TTO: 'Тринідад і Тобаго', NCL: 'Нова Каледонія', PRI: 'Пуерто-Рико',
  KSV: 'Косово', GRL: 'Гренландія'
};
// territories owned by another nation at start
const OWNER_OVR = { GRL: 'DNK', FLK: 'GBR', ATF: 'FRA', NCL: 'FRA', PRI: 'USA', ESH: 'MAR', NCY: 'CYP', SOL: 'SOM' };

const terr = [];
const byGeomIdx = [];
geoms.forEach((g, i) => {
  let a3 = null;
  if (g.id) a3 = iso.numericToAlpha3(g.id);
  const nm = g.properties.name;
  if (!a3) {
    if (nm === 'Kosovo') a3 = 'KSV';
    else if (nm === 'N. Cyprus') a3 = 'NCY';
    else if (nm === 'Somaliland') a3 = 'SOL';
    else if (nm === 'Antarctica') a3 = 'ATA';
    else a3 = 'X' + i;
  }
  if (a3 === 'ATA') { byGeomIdx[i] = -1; return; }
  let name = NAME_OVR[a3] || (iso.getName(a3, 'uk')) || nm;
  byGeomIdx[i] = terr.length;
  terr.push({ i, a3, name, owner: OWNER_OVR[a3] || a3 });
});

const neighbors = topojson.neighbors(geoms);
// arc usage count for coastline detection
const arcUse = {};
function walkArcs(arcs, fn) { if (typeof arcs[0] === 'number') arcs.forEach(fn); else arcs.forEach(a => walkArcs(a, fn)); }
geoms.forEach(g => { if (g.arcs) walkArcs(g.arcs, a => { const k = a < 0 ? ~a : a; arcUse[k] = (arcUse[k] || 0) + 1; }); });

const SEA = [
  ['ATL_N', 'Північна Атлантика', -35, 48], ['ATL_C', 'Центральна Атлантика', -35, 30], ['ATL_EQ', 'Екваторіальна Атлантика', -28, 5],
  ['ATL_S', 'Південна Атлантика', -20, -25], ['NEWF', 'Ньюфаундленд', -50, 44], ['LABR', 'Лабрадорське море', -55, 56],
  ['US_E', 'Східне узбережжя США', -71, 37], ['FLA', 'Флоридська протока', -80.5, 24.3], ['GULF_MX', 'Мексиканська затока', -90, 25],
  ['YUC', 'Юкатанська протока', -85.5, 21.5], ['CARIB', 'Карибське море', -75, 14.5], ['CARIB_E', 'Малі Антильські о-ви', -61, 15],
  ['PAN_A', 'Панамський канал (Атл.)', -79.9, 9.6], ['PAN_P', 'Панамський канал (Тих.)', -79.5, 8.0], ['GUIANA', 'Гвіанське узбережжя', -52, 8],
  ['BRA_N', 'Північ Бразилії', -38, -2], ['BRA_E', 'Схід Бразилії', -33, -12], ['BRA_S', 'Південь Бразилії', -44, -27],
  ['PLATA', 'Ла-Плата', -54, -37], ['PATAG', 'Патагонський шельф', -60, -46], ['HORN', 'Протока Дрейка', -66, -58],
  ['CHILE', 'Узбережжя Чилі', -75, -32], ['PERU', 'Узбережжя Перу', -81, -13], ['ECU', 'Східна Пацифіка', -84, -1],
  ['CAM_P', 'Центр. Америка (Тих.)', -92, 11], ['MEX_P', 'Мексика (Тих.)', -108, 18], ['CAL', 'Каліфорнія', -121, 32],
  ['PNW', 'Північний захід Пацифіки', -129, 48], ['ALASKA', 'Затока Аляска', -148, 56], ['PAC_NE', 'Північно-східна Пацифіка', -145, 38],
  ['HAWAII', 'Гаваї', -157, 21], ['PAC_N', 'Північна Пацифіка', 170, 42], ['PAC_S', 'Південна Пацифіка', -140, -20],
  ['PAC_SW', 'Південно-західна Пацифіка', 175, -20], ['JP_PAC', 'Тихоокеанське узбережжя Японії', 142, 33], ['OKHOTSK', 'Охотське море', 150, 54],
  ['JP_SEA', 'Японське море', 135, 40], ['KOREA', 'Корейська протока', 129.3, 34.2], ['YELLOW', 'Жовте море', 123, 36],
  ['ECS', 'Східнокитайське море', 125, 29], ['TAIWAN', 'Тайванська протока', 119.5, 24], ['LUZON', 'Лусонська протока', 121, 20.5],
  ['SCS_N', 'Південнокитайське море (пн.)', 115, 18], ['SCS_S', 'Південнокитайське море (пд.)', 110, 8], ['PHIL', 'Філіппінське море', 132, 15],
  ['SING', 'Сингапурська протока', 104.3, 1.2], ['MALACCA', 'Малаккська протока', 99, 4.5], ['ANDAMAN', 'Андаманське море', 94, 9],
  ['BENGAL', 'Бенгальська затока', 88, 15], ['SRI', 'Біля Шрі-Ланки', 81, 4.5], ['ARAB', 'Аравійське море', 64, 15], ['WIND', 'Біля західної Індії', 70.5, 16],
  ['OMAN', 'Оманська затока', 58.5, 24.5], ['HORMUZ', 'Ормузька протока', 56.4, 26.5], ['PERS', 'Перська затока', 50.5, 27.3],
  ['ADEN', 'Аденська затока', 48, 12.5], ['BAB', 'Баб-ель-Мандеб', 43.4, 12.6], ['RED', 'Червоне море', 38, 21],
  ['SUEZ', 'Суецький канал', 32.5, 30.2], ['EMED', 'Східне Середземномор\'я', 31, 33.6], ['CMED', 'Центральне Середземномор\'я', 19, 34.5],
  ['TYR', 'Тірренське море', 12, 39.5], ['ADR', 'Адріатичне море', 15.5, 42.8], ['WMED', 'Західне Середземномор\'я', 3, 38.5],
  ['GIB', 'Гібралтарська протока', -5.6, 35.95], ['AEG', 'Егейське море', 25, 38.5], ['BOS', 'Босфор і Дарданелли', 28.9, 41.0],
  ['BLACK', 'Чорне море', 34, 43.3], ['VOLGA', 'Волго-Донський канал', 43, 48], ['CASP', 'Каспійське море', 51, 42],
  ['BISCAY', 'Біскайська затока', -6, 46], ['PORT', 'Узбережжя Португалії', -11, 39], ['CHAN', 'Ла-Манш', -1.5, 50.2],
  ['NSEA', 'Північне море', 3.5, 56], ['DAN', 'Данські протоки', 11, 57.8], ['BALT', 'Балтійське море', 19, 56.5],
  ['FIN', 'Фінська і Ботнічна затоки', 23, 60.3], ['NORW', 'Норвезьке море', 3, 66], ['BAR', 'Баренцове море', 38, 72],
  ['ICE', 'Біля Ісландії', -20, 62], ['CANARY', 'Канарські о-ви', -16, 27], ['WAFR', 'Західна Африка', -20, 12],
  ['GUINEA', 'Гвінейська затока', 2, 2], ['ANGOLA', 'Узбережжя Анголи', 9, -11], ['NAMIB', 'Узбережжя Намібії', 11, -25],
  ['CAPE', 'Мис Доброї Надії', 18, -37], ['AGUL', 'Агульяс', 33, -34], ['MOZ', 'Мозамбіцька протока', 41, -18],
  ['SOMAL', 'Сомалійський басейн', 52, 3], ['MASC', 'Маскаренські о-ви', 58, -21], ['IND_C', 'Центр Індійського океану', 78, -12],
  ['JAVA_S', 'Південь Яви', 108, -12], ['SUNDA', 'Зондська протока', 105.8, -6.2], ['JAVA', 'Яванське море', 110, -5],
  ['FLORES', 'Море Флорес', 120, -7.5], ['BANDA', 'Море Банда', 127, -5.5], ['ARAF', 'Арафурське море', 135, -10],
  ['TORRES', 'Торресова протока', 142.5, -10], ['CORAL', 'Коралове море', 155, -16], ['TASMAN', 'Тасманове море', 160, -37],
  ['BIGHT', 'Велика Австралійська затока', 133, -38], ['WAUS', 'Західна Австралія', 110, -28],
  ['NSR', 'Північний морський шлях', 105, 78], ['BERING', 'Берингова протока', -169, 65.5]
];
const CHOKE = { SUEZ: ['EGY'], PAN_A: ['PAN'], HORMUZ: ['IRN', 'OMN'], BAB: ['YEM', 'DJI', 'ERI'], MALACCA: ['MYS', 'IDN'],
  SING: ['SGP', 'MYS', 'IDN'], BOS: ['TUR'], GIB: ['ESP', 'MAR', 'GBR'], DAN: ['DNK', 'SWE'], VOLGA: ['RUS'], NSR: ['RUS'],
  TAIWAN: ['TWN', 'CHN'], KOREA: ['KOR', 'JPN'], FLA: ['USA', 'CUB'] };
const SEA_EDGES = `ATL_N-NEWF NEWF-LABR NEWF-US_E ATL_N-ATL_C ATL_N-ICE ATL_N-BISCAY ICE-NORW ICE-LABR NORW-NSEA NORW-BAR NSEA-CHAN CHAN-BISCAY NSEA-DAN DAN-BALT BALT-FIN
BISCAY-PORT PORT-GIB PORT-ATL_C PORT-CANARY GIB-CANARY GIB-WMED WMED-TYR TYR-CMED WMED-CMED CMED-ADR CMED-AEG CMED-EMED AEG-EMED AEG-BOS BOS-BLACK BLACK-VOLGA VOLGA-CASP
EMED-SUEZ SUEZ-RED RED-BAB BAB-ADEN ADEN-ARAB ADEN-SOMAL ARAB-OMAN OMAN-HORMUZ HORMUZ-PERS ARAB-WIND WIND-SRI ARAB-SOMAL SOMAL-MOZ SOMAL-MASC MOZ-AGUL MASC-AGUL MASC-IND_C SRI-IND_C SRI-BENGAL BENGAL-ANDAMAN SRI-ANDAMAN ANDAMAN-MALACCA
MALACCA-SING SING-SCS_S SING-JAVA SCS_S-SCS_N SCS_N-TAIWAN SCS_N-LUZON TAIWAN-ECS LUZON-PHIL ECS-YELLOW ECS-KOREA KOREA-JP_SEA ECS-JP_PAC PHIL-JP_PAC JP_SEA-OKHOTSK JP_PAC-OKHOTSK JP_PAC-PAC_N OKHOTSK-PAC_N
PAC_N-ALASKA PAC_N-PAC_NE PAC_N-HAWAII ALASKA-PNW PNW-PAC_NE PNW-CAL PAC_NE-CAL PAC_NE-HAWAII CAL-MEX_P MEX_P-CAM_P CAM_P-PAN_P PAN_P-ECU ECU-PERU PERU-CHILE CHILE-HORN HORN-PATAG PATAG-PLATA PLATA-BRA_S BRA_S-BRA_E BRA_E-BRA_N BRA_N-GUIANA GUIANA-CARIB_E CARIB_E-CARIB CARIB-PAN_A PAN_A-PAN_P CARIB-YUC YUC-GULF_MX GULF_MX-FLA FLA-US_E CARIB_E-ATL_C US_E-ATL_C ATL_C-CANARY ATL_C-ATL_EQ CANARY-WAFR WAFR-ATL_EQ WAFR-GUINEA ATL_EQ-BRA_N ATL_EQ-GUINEA GUINEA-ANGOLA ANGOLA-NAMIB ANGOLA-ATL_S NAMIB-CAPE ATL_S-CAPE ATL_S-BRA_E ATL_S-BRA_S CAPE-AGUL
ECU-PAC_S PAC_S-HAWAII PAC_S-PAC_SW PAC_SW-CORAL PAC_SW-TASMAN CORAL-TORRES TORRES-ARAF ARAF-BANDA BANDA-FLORES FLORES-JAVA JAVA-SUNDA SUNDA-JAVA_S JAVA_S-WAUS JAVA_S-IND_C WAUS-BIGHT BIGHT-TASMAN IND_C-WAUS HAWAII-PAC_SW PHIL-BANDA
BAR-NSR NSR-BERING BERING-PAC_N BERING-ALASKA CORAL-PHIL`.split(/\s+/).filter(Boolean).map(e => e.split('-'));
const seaIdx = {}; SEA.forEach((s, i) => seaIdx[s[0]] = i);
SEA_EDGES.forEach(([a, b]) => { if (seaIdx[a] == null || seaIdx[b] == null) throw new Error('bad edge ' + a + b); });
// inland seas: only these ports may attach to CASP / VOLGA
const INLAND = { CASP: ['RUS', 'KAZ', 'TKM', 'AZE', 'IRN'], VOLGA: [] };

const r1 = x => Math.round(x * 10) / 10;
const out = [];
terr.forEach((t, ti) => {
  const g = geoms[t.i];
  const f = topojson.feature(topo, g);
  // polygons
  let polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let largest = null, la = -1;
  polys.forEach(p => { const a = d3.geoArea({ type: 'Polygon', coordinates: p }); if (a > la) { la = a; largest = p; } });
  const c = d3.geoCentroid({ type: 'Polygon', coordinates: largest });
  const area = Math.round(d3.geoArea(f) * R * R);
  const rings = [];
  polys.forEach(p => p.forEach(ring => {
    const flat = [];
    let prev = null;
    let off = 0, lx = null;
    ring.forEach(([x, y]) => { if (lx != null) { if (x - lx > 180) off -= 360; else if (lx - x > 180) off += 360; } lx = x; const q = [r1(x + off), r1(y)]; if (!prev || q[0] !== prev[0] || q[1] !== prev[1]) { flat.push(q[0], q[1]); prev = q; } });
    if (flat.length >= 6) rings.push(flat);
  }));
  // coast vertices
  const coastArcs = [];
  walkArcs(g.arcs, a => { const k = a < 0 ? ~a : a; if (arcUse[k] === 1) coastArcs.push([k]); });
  let coast = [];
  if (coastArcs.length) {
    const ml = topojson.feature(topo, { type: 'MultiLineString', arcs: coastArcs });
    ml.geometry.coordinates.forEach(line => line.forEach(p => coast.push(p)));
  }
  // ports: link to sea nodes within 800 km of coast
  const ports = [];
  if (coast.length) {
    const cand = [];
    SEA.forEach((s, si) => {
      if (INLAND[s[0]] && !INLAND[s[0]].includes(t.a3)) return;
      let best = 1e9, bp = null;
      for (let k = 0; k < coast.length; k += 1) { const d = hav(coast[k], [s[2], s[3]]); if (d < best) { best = d; bp = coast[k]; } }
      cand.push({ si, d: best, p: bp });
    });
    cand.sort((a, b) => a.d - b.d);
    cand.forEach(cn => { if (cn.d < 1000) ports.push([cn.si, r1(cn.p[0]), r1(cn.p[1]), Math.round(cn.d)]); });
    if (!ports.length && cand[0] && cand[0].d < 1700 && !INLAND[SEA[cand[0].si][0]]) ports.push([cand[0].si, r1(cand[0].p[0]), r1(cand[0].p[1]), Math.round(cand[0].d)]);
    // landlocked check by name: Caspian-only coasts with no other sea
  }
  const nb = neighbors[t.i].map(j => byGeomIdx[j]).filter(j => j >= 0);
  out.push({ a3: t.a3, n: t.name, o: t.owner, c: [r1(c[0]), r1(c[1])], ar: area, r: rings, nb, p: ports });
});
// extra land links (tunnels, bridges, causeways)
const EXTRA = [['GBR', 'FRA'], ['DNK', 'SWE'], ['SAU', 'BHR'], ['ESP', 'MAR']];
const ai = {}; out.forEach((t, i) => ai[t.a3] = i);
EXTRA.forEach(([a, b]) => { if (ai[a] != null && ai[b] != null) { if (!out[ai[a]].nb.includes(ai[b])) out[ai[a]].nb.push(ai[b]); if (!out[ai[b]].nb.includes(ai[a])) out[ai[b]].nb.push(ai[a]); } });

const data = { T: out, S: SEA.map(s => [s[0], s[1], s[2], s[3], CHOKE[s[0]] || null]), E: SEA_EDGES.map(([a, b]) => [seaIdx[a], seaIdx[b]]) };
fs.writeFileSync('world.json', JSON.stringify(data));
console.log('territories', out.length, 'bytes', JSON.stringify(data).length);
console.log('no ports:', out.filter(t => !t.p.length).map(t => t.a3).join(' '));
console.log('few:', out.filter(t => t.p.length).map(t => t.a3 + ':' + t.p.map(p => SEA[p[0]][0]).join(',')).filter(s=>/^(RUS|USA|UKR|CAN|AZE|KAZ|IRN|EGY|TUR|CHN|AUS|BRA|IND)/.test(s)).join('\n'));
