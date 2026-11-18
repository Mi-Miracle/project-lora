// PROJECT LORA — окремий застосунок (Electron). Власне вікно без браузера.
// Гра роздається вбудованим локальним сервером (порт 8642), щоб працювали вхід через Twitch і онлайн.
const { app, BrowserWindow, Menu, shell, net } = require('electron');
const updater = require('./updater');
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 8642;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
// корінь гри: усередині застосунку (resources/app/game) або папка поруч із .exe (для режиму «оновлення файлів без перезбирання»)
function gameRoot() {
  const upd = path.join(app.getPath('userData'), 'game', 'index.html'); // оновлення з GitHub
  const inside = path.join(__dirname, 'game', 'index.html');
  const near = path.resolve(path.dirname(process.execPath), '..', 'index.html');
  if (fs.existsSync(upd) && !process.argv.includes('--no-update')) return path.dirname(upd);
  if (fs.existsSync(inside)) return path.dirname(inside);
  if (fs.existsSync(near)) return path.dirname(near);
  return path.resolve(__dirname, '..');
}
// заставка з перевіркою оновлень
async function splashUpdate() {
  if (process.argv.includes('--no-update')) return;
  const sp = new BrowserWindow({ width: 560, height: 320, frame: false, resizable: false, backgroundColor: '#05080d', show: true, alwaysOnTop: true, webPreferences: { contextIsolation: true } });
  const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#05080d;color:#dfe9f5;font:14px system-ui;height:100vh;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #1d3550">
<style>@keyframes sp{to{transform:rotate(360deg)}}@keyframes gl{0%,100%{text-shadow:0 0 6px #ffb020}50%{text-shadow:0 0 22px #ffb020}}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
.r{width:96px;height:96px;border-radius:50%;border:2px solid #2b5d8f;position:relative;box-shadow:inset 0 0 30px #12325a}.r:before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,200,80,.0),rgba(255,200,80,.45) 12%,rgba(255,200,80,0) 13%);animation:sp 2.2s linear infinite}
.r:after{content:"";position:absolute;inset:22px;border-radius:50%;border:1px dashed #2b5d8f}.m{font:700 30px system-ui;letter-spacing:1px;color:#ffd34d;margin-top:16px;animation:gl 2.4s ease-in-out infinite,fi .8s ease}
.t{font:600 13px system-ui;letter-spacing:6px;color:#9cc8f0;margin-top:4px;animation:fi 1.4s ease}.s{margin-top:18px;color:#8aa0b8;min-height:18px}</style>
<div class="r"></div><div class="m">Mi_Miracle</div><div class="t">PROJECT LORA</div><div class="s" id="m"></div></body>`;
  sp.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page));
  await new Promise(r => sp.webContents.once('did-finish-load', r));
  const log = m => { try { sp.webContents.executeJavaScript(`document.getElementById('m').textContent=${JSON.stringify(String(m))}`); } catch (e) { } };
  log('Перевіряю оновлення…');
  try { await Promise.race([updater.check(net, app.getPath('userData'), log), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 90000))]); }
  catch (e) { log('Оновлення недоступне: ' + String(e.message || e).slice(0, 60)); await new Promise(r => setTimeout(r, 1200)); }
  sp.destroy();
}
function startServer(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, path.normalize(p).replace(/^([/\\])+/, ''));
      if (!f.startsWith(root)) { rsp.writeHead(403); rsp.end(); return; }
      fs.readFile(f, (e, data) => { if (e) { rsp.writeHead(404); rsp.end('404'); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); rsp.end(data); });
    });
    srv.on('error', () => res(false)); // порт зайнятий (наприклад, уже запущено «Запустити LORA.bat») — використовуємо його
    srv.listen(PORT, '127.0.0.1', () => res(true));
  });
}
let win;
async function create() {
  await splashUpdate();
  const root = gameRoot(); await startServer(root);
  win = new BrowserWindow({ width: 1600, height: 900, minWidth: 1100, minHeight: 650, title: 'Project LORA', backgroundColor: '#0b1118', icon: path.join(root, 'assets', 'lora.png'), autoHideMenuBar: true, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
  Menu.setApplicationMenu(null); win.maximize();
  win.loadURL(`http://localhost:${PORT}/index.html`); ready = true;
  // зовнішні посилання (Twitch, GitHub) — у звичайному браузері; вхід Twitch повертається на localhost — лишаємо у вікні
  win.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith(`http://localhost:${PORT}`)) return { action: 'allow' }; shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.key === 'F12' && i.control) { win.webContents.toggleDevTools(); e.preventDefault(); }
    if (i.key === 'F5' && i.control) { win.webContents.reload(); e.preventDefault(); }
  });
  win.on('page-title-updated', e => e.preventDefault());
}
app.whenReady().then(create);
let ready = false; // поки показується заставка, закриття її вікна не має завершувати застосунок
app.on('window-all-closed', () => { if (ready) app.quit(); });
