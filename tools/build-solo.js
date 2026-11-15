// Bundles the whole game into one offline HTML file (solo play, no server needed).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = rd('public/index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${rd('public/style.css')}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => `<script>\n${rd(src.startsWith('shared/') ? src : 'public/' + src)}</script>`);
html = html.replace('<script>', () => '<script>window.SB_SOLO = true;</script>\n<script>');
const out = process.argv[2] || path.join(root, 'dist', 'wildlands-solo.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log('Wrote', out, (html.length / 1024).toFixed(0) + ' KB');
