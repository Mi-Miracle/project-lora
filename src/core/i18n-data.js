// Застосовує мову до даних (назви регіонів, міст, країн, будівель, ресурсів…) ще до створення гри.
(function () {
  const L = LORA, D = L.data; if (L.lang === 'uk') return; const t = L.i18n.tr;
  const E = D.namesEn;
  if (E) { D.regions.forEach((r, i) => { if (E.regions[i]) { if (r.n0 == null) r.n0 = r.n; r.n = E.regions[i]; } }); D.cities.forEach((c, i) => { if (E.cities[i]) c.n = E.cities[i]; }); D.cells.forEach(c => { if (E.countries[c.a3]) c.n = E.countries[c.a3]; }); }
  const tf = (o, ...ks) => o && Object.values(o).forEach(v => ks.forEach(k => { if (v && typeof v[k] === 'string') v[k] = t(v[k]); }));
  tf(D.buildings, 'n', 'd'); tf(D.buildingGroups, 'n', 'd'); tf(D.linkTypes, 'n', 'd'); tf(D.devPriorities, 'n', 'd'); tf(D.difficulty, 'n', 'd'); tf(D.scenarios, 'name', 'desc');
  if (D.companySectors) Object.values(D.companySectors).forEach(s => { s.n = s.en || t(s.n); s.d = t(s.d); });
  if (D.companies) D.companies.forEach(c => { c[0] = c[1]; });
  if (D.resources) tf(D.resources, 'n', 'g', 'd'); if (D.resourceGroups) (Array.isArray(D.resourceGroups) ? D.resourceGroups : Object.values(D.resourceGroups)).forEach(g => { if (g.n) g.n = t(g.n); });
  if (D.sea && D.sea.nodes) D.sea.nodes.forEach(n => { n.n = t(n.n); });
})();
