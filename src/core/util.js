// Загальні утиліти: математика, генератор випадкових чисел, черга з пріоритетом, декодування геометрії.
(function (L) {
  const U = L.core;
  const toR = Math.PI / 180;
  U.hav = function (ax, ay, bx, by) { const dLat = (by - ay) * toR, dLon = (bx - ax) * toR; const s = Math.sin(dLat / 2) ** 2 + Math.cos(ay * toR) * Math.cos(by * toR) * Math.sin(dLon / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); };
  U.clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  U.mulberry = function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  U.Heap = class Heap {
    constructor() { this.a = []; }
    push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
    pop() { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
    get size() { return this.a.length; }
  };
  // дельта-кодовані цілі ×100 -> [[lon,lat],...]
  U.decodeLine = function (arr) { const out = []; let x = 0, y = 0; for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out.push([x / 100, y / 100]); } return out; };
  U.pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
})(LORA);
