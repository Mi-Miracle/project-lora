// МАПА: геометрія регіонів (Path2D), лінії кордонів і узбережжя, растр рельєфу, міста.
const GEO = (function () {
  const dec = LORA.core.decodeLine;
  const paths = [], bbox = [];
  D.shapes.forEach((rings, i) => {
    const p = new Path2D(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    rings.forEach(enc => { const pts = dec(enc); pts.forEach(([x, y], k) => { k ? p.lineTo(x, -y) : p.moveTo(x, -y); if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }); p.closePath(); });
    paths.push(p); bbox.push([a, b, c, d]);
  });
  const linePath = list => { const p = new Path2D(); list.forEach(enc => { dec(enc).forEach(([x, y], k) => k ? p.lineTo(x, -y) : p.moveTo(x, -y)); }); return p; };
  const borders = linePath(D.lines.borders), coast = linePath(D.lines.coast), inner = linePath(D.lines.inner);
  const relief = new Image(); let reliefOk = false;
  relief.onload = () => { reliefOk = true; mapDirty = true; };
  relief.onerror = () => console.warn('Не вдалося завантажити рельєф', LORA.config.map.relief);
  relief.src = LORA.config.map.relief;
  const cities = D.cities.slice().sort((a, b) => b.pop - a.pop);
  return { paths, bbox, borders, coast, inner, relief, get reliefOk() { return reliefOk; }, cities };
})();
