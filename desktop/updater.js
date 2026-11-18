// АВТООНОВЛЕННЯ З GITHUB: при запуску порівнює останній коміт гілки main з установленим і,
// якщо є новіша версія, завантажує архів репозиторію й розпаковує файли гри в папку користувача.
// Без інтернету чи при помилці — гра запускається з уже встановлених файлів.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = 'Mi-Miracle/project-lora', BRANCH = 'main';
const KEEP = /^(index\.html|overlay\.html|src\/|data\/|assets\/|styles\/|lib\/)/;
async function getJSON(net, url) { const r = await net.fetch(url, { headers: { 'User-Agent': 'ProjectLORA-Updater', Accept: 'application/vnd.github+json' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
async function getBuf(net, url, onProg) {
  const r = await net.fetch(url, { headers: { 'User-Agent': 'ProjectLORA-Updater' } }); if (!r.ok) throw new Error('HTTP ' + r.status);
  const total = +r.headers.get('content-length') || 0; const reader = r.body.getReader(); const parts = []; let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(Buffer.from(value)); got += value.length; onProg && onProg(got, total); }
  return Buffer.concat(parts);
}
// мінімальний розбір ZIP через центральний каталог (stored / deflate)
function unzip(buf, onFile) {
  let eocd = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Пошкоджений архів');
  const n = buf.readUInt16LE(eocd + 10); let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Пошкоджений каталог');
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8'); p += 46 + nlen + xlen + clen;
    if (name.endsWith('/')) continue;
    const ln = buf.readUInt16LE(off + 26), lx = buf.readUInt16LE(off + 28); const data = buf.slice(off + 30 + ln + lx, off + 30 + ln + lx + csize);
    onFile(name, method === 8 ? zlib.inflateRawSync(data) : data);
  }
}
async function check(net, userDir, log) {
  const stamp = path.join(userDir, 'game', 'version.json'); let cur = null; try { cur = JSON.parse(fs.readFileSync(stamp, 'utf8')).sha; } catch (e) { }
  log('Перевіряю оновлення…');
  const info = await getJSON(net, `https://api.github.com/repos/${REPO}/commits/${BRANCH}`); const sha = info.sha;
  if (sha === cur) { log('Встановлено найновішу версію'); return { updated: false, sha }; }
  log('Знайдено оновлення — завантажую…');
  const buf = await getBuf(net, `https://codeload.github.com/${REPO}/zip/refs/heads/${BRANCH}`, (g, t) => log(`Завантаження ${(g / 1048576).toFixed(1)}${t ? ' / ' + (t / 1048576).toFixed(1) : ''} МБ`));
  const tmp = path.join(userDir, 'game.new'); fs.rmSync(tmp, { recursive: true, force: true }); let files = 0;
  unzip(buf, (name, data) => { const rel = name.split('/').slice(1).join('/'); if (!KEEP.test(rel)) return; const f = path.join(tmp, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); files++; });
  if (!fs.existsSync(path.join(tmp, 'index.html')) || files < 50) throw new Error('Архів неповний');
  fs.writeFileSync(path.join(tmp, 'version.json'), JSON.stringify({ sha, date: info.commit && info.commit.committer && info.commit.committer.date, msg: info.commit && info.commit.message }));
  const dst = path.join(userDir, 'game'), old = path.join(userDir, 'game.old'); fs.rmSync(old, { recursive: true, force: true });
  if (fs.existsSync(dst)) fs.renameSync(dst, old); fs.renameSync(tmp, dst); fs.rmSync(old, { recursive: true, force: true });
  log(`Оновлено (${files} файлів)`); return { updated: true, sha };
}
module.exports = { check };
