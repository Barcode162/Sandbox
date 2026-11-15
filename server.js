// Wildlands server: serves the client and runs the shared world over WebSockets.
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const Game = require('./shared/sim.js');

const PORT = process.env.PORT || 3000;
const SAVE = path.join(__dirname, 'data', 'world.json');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

let save = null;
try { save = JSON.parse(fs.readFileSync(SAVE, 'utf8')); console.log('Loaded saved world'); } catch (e) { console.log('Starting a new world'); }
const game = new Game({ save });

function persist() {
  try {
    fs.mkdirSync(path.dirname(SAVE), { recursive: true });
    fs.writeFileSync(SAVE + '.tmp', JSON.stringify(game.save()));
    fs.renameSync(SAVE + '.tmp', SAVE);
  } catch (e) { console.error('Save failed:', e.message); }
}

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const base = url.startsWith('/shared/') ? __dirname : path.join(__dirname, 'public');
  const file = path.normalize(path.join(base, url));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096, perMessageDeflate: true });
const enc = (k, v) => v instanceof Uint8Array ? Buffer.from(v.buffer, v.byteOffset, v.length).toString('base64') : v;
wss.on('connection', ws => {
  let player = null, count = 0, windowStart = Date.now();
  const send = m => { if (ws.readyState === 1) ws.send(JSON.stringify(m, enc)); };
  ws.on('message', raw => {
    const now = Date.now();
    if (now - windowStart > 1000) { windowStart = now; count = 0; }
    if (++count > 80) return;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    try {
      if (!player) { if (m && m.t === 'join') player = game.addPlayer(m.name, m.token, send); }
      else game.handle(player, m);
    } catch (e) { console.error('handler error', e); }
  });
  ws.on('close', () => { if (player) game.removePlayer(player.id); });
  ws.on('error', () => {});
});

let last = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(0.5, (now - last) / 1000); last = now;
  try { game.tick(dt); } catch (e) { console.error('tick error', e); }
}, 100);
setInterval(persist, 60000);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { persist(); process.exit(0); });

server.listen(PORT, () => console.log(`Wildlands running on http://localhost:${PORT}`));
