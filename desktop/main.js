// PROJECT LORA — окремий застосунок (Electron). Власне вікно без браузера.
// Гра роздається вбудованим локальним сервером (порт 8642), щоб працювали вхід через Twitch і онлайн.
const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron');
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 8642;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
// корінь гри: усередині застосунку (resources/app/game) або папка поруч із .exe (для режиму «оновлення файлів без перезбирання»)
function gameRoot() {
  const near = path.resolve(path.dirname(process.execPath), '..', 'index.html');
  const inside = path.join(__dirname, 'game', 'index.html');
  if (fs.existsSync(inside)) return path.dirname(inside);
  if (fs.existsSync(near)) return path.dirname(near);
  return path.resolve(__dirname, '..');
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
  const root = gameRoot(); await startServer(root);
  win = new BrowserWindow({ width: 1600, height: 900, minWidth: 1100, minHeight: 650, title: 'Project LORA', backgroundColor: '#0b1118', icon: path.join(root, 'assets', 'lora.png'), autoHideMenuBar: true, webPreferences: { contextIsolation: true, backgroundThrottling: false } });
  Menu.setApplicationMenu(null); win.maximize();
  win.loadURL(`http://localhost:${PORT}/index.html`);
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
app.on('window-all-closed', () => app.quit());
