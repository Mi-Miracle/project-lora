// МАПА: камера — масштаб, зсув, перетворення координат (рівнопроміжна проєкція, як у растра рельєфу).
const cv = document.getElementById('map'), ctx = cv.getContext('2d');
const pickCtx = document.createElement('canvas').getContext('2d');
const baseCv = document.createElement('canvas'), bctx = baseCv.getContext('2d');
let DPR = 1;
const view = { s: 4, ox: 0, oy: 0 };
let lastViewKey = '';
function resize() { DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); cv.width = baseCv.width = innerWidth * DPR; cv.height = baseCv.height = innerHeight * DPR; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; mapDirty = true; }
addEventListener('resize', resize); resize();
const toScreen = (lon, lat) => [lon * view.s + view.ox, -lat * view.s + view.oy];
const toWorld = (x, y) => [(x - view.ox) / view.s, -(y - view.oy) / view.s];
function fitWorld() { view.s = Math.max(innerWidth / 360, innerHeight / 150); view.ox = innerWidth / 2 - 10 * view.s; view.oy = innerHeight / 2 - 22 * view.s; }
function focusLonLat(lon, lat, s) { if (s) view.s = s; view.ox = innerWidth / 2 + 150 - lon * view.s; view.oy = innerHeight / 2 + lat * view.s; clampView(); }
function clampView() {
  const minS = innerHeight / 170; if (view.s < minS) view.s = minS; if (view.s > LORA.config.map.maxZoom) view.s = LORA.config.map.maxZoom;
  const top = 84 * view.s, bot = -70 * view.s; if (view.oy - top > 46) view.oy = 46 + top; if (view.oy - bot < innerHeight) view.oy = innerHeight + bot;
  if (view.ox > 540 * view.s) view.ox -= 360 * view.s; if (view.ox < -540 * view.s + innerWidth) view.ox += 360 * view.s;
}
function visibleShifts() { const [lonL] = toWorld(0, 0), [lonR] = toWorld(innerWidth, 0); const out = []; for (let k = -2; k <= 2; k++) if (lonR > -180 + k * 360 && lonL < 180 + k * 360) out.push(k * 360); return { out, lonL, lonR }; }
