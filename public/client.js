// Wildlands browser client: rendering, input, UI and networking.
(function () {
  'use strict';
  const D = window.SBDefs, { W, H, O, objs, items, grounds } = D;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const isTouch = matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  const SOLO_ONLY = !!window.SB_SOLO || location.protocol === 'file:';

  const S = {
    on: false, id: 0, map: null, clock: 0, event: null, sel: 0, hot: Array(9).fill(null),
    me: { x: 0, y: 0, f: 1, hp: 100, maxhp: 100, coins: 0, inv: {}, skills: {}, quests: [], dead: false, name: '', swT: -9, sa: 0 },
    players: new Map(), mobs: new Map(), roster: new Map(), claims: new Map(), tdmg: new Map(), fx: [], parts: [], shake: 0,
  };
  const me = S.me;
  let net = null, now = 0;

  // ---------- sound ----------
  let AC = null, muted = LS.get('sb_mute') === '1';
  function snd(f, d, type, v, slide) {
    if (muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
    } catch (e) { }
  }
  const SFX = {
    hit: () => snd(170, 0.07, 'square', 0.04, -60), brk: () => snd(240, 0.14, 'triangle', 0.09, -170),
    get: () => snd(880, 0.07, 'sine', 0.05, 400), swing: () => snd(420, 0.08, 'sawtooth', 0.025, -280),
    hurt: () => snd(140, 0.2, 'sawtooth', 0.08, -80), die: () => snd(320, 0.18, 'square', 0.04, -250),
    place: () => snd(300, 0.06, 'triangle', 0.08, -100), craft: () => { snd(520, 0.08, 'triangle', 0.07); setTimeout(() => snd(780, 0.12, 'triangle', 0.07), 80); },
    up: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => snd(f, 0.16, 'triangle', 0.08), i * 90)),
    coin: () => { snd(1200, 0.06, 'square', 0.03); setTimeout(() => snd(1600, 0.1, 'square', 0.03), 60); },
    bow: () => snd(700, 0.1, 'triangle', 0.05, -400),
  };

  // ---------- sprites ----------
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
  function R(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); }
  function blob(x, c, cx, cy, r, ry) {
    ry = ry || r; x.fillStyle = c;
    for (let j = -ry; j <= ry; j++) for (let i = -r; i <= r; i++)
      if ((i * i) / (r * r + r * 0.6) + (j * j) / (ry * ry + ry * 0.6) <= 1) x.fillRect(cx + i, cy + j, 1, 1);
  }
  function lcg(s) { return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
  const SH = 'rgba(0,0,0,.22)';
  const GS = [];
  function ground(base, specks, n, seed, extra) {
    const out = [];
    for (let v = 0; v < 4; v++) out.push(mk(16, 16, x => {
      const r = lcg(seed * 31 + v * 977 + 5); R(x, base, 0, 0, 16, 16);
      for (let i = 0; i < n; i++) { x.fillStyle = specks[(r() * specks.length) | 0]; x.fillRect((r() * 16) | 0, (r() * 16) | 0, 1 + ((r() * 2) | 0), 1); }
      if (extra) extra(x, r, v);
    }));
    return out;
  }
  GS[0] = ground('#3276c4', ['#3d84d4', '#2b69b3'], 5, 1, (x, r) => { for (let i = 0; i < 3; i++) R(x, '#6ea9e8', (r() * 12) | 0, (r() * 15) | 0, 3, 1); });
  GS[1] = ground('#e3d08f', ['#d4bf78', '#eedda3'], 12, 2);
  GS[2] = ground('#6ab04a', ['#5da040', '#7cc25a', '#62a844'], 14, 3);
  GS[3] = ground('#4f9440', ['#458638', '#5aa24a'], 14, 4);
  GS[4] = ground('#eef3f7', ['#dbe4ec', '#ffffff'], 9, 5);
  GS[5] = ground('#8a8d94', ['#7b7e85', '#999ca3'], 12, 6);
  GS[6] = ground('#b07a45', ['#a57040'], 5, 7, x => { for (const y of [0, 4, 8, 12]) R(x, '#8c5d30', 0, y, 16, 1); R(x, '#8c5d30', 5, 0, 1, 4); R(x, '#8c5d30', 11, 4, 1, 4); R(x, '#8c5d30', 3, 8, 1, 4); R(x, '#8c5d30', 9, 12, 1, 4); });
  GS[7] = ground('#a9acb3', ['#b4b7be', '#9fa2a9'], 6, 8, x => { for (const y of [0, 8]) R(x, '#8b8e95', 0, y, 16, 1); R(x, '#8b8e95', 0, 0, 1, 8); R(x, '#8b8e95', 8, 8, 1, 8); });

  const rockBase = x => { blob(x, SH, 8, 14, 6, 1); blob(x, '#74777f', 8, 10, 6, 4); blob(x, '#8f929a', 7, 9, 4, 2); R(x, '#a6a9b0', 5, 7, 3, 1); };
  const ore = (c, l) => mk(16, 16, x => { rockBase(x); for (const [a, b] of [[4, 9], [8, 7], [10, 11], [6, 12], [11, 8]]) { R(x, c, a, b, 2, 2); R(x, l, a, b, 1, 1); } });
  const bush = full => mk(16, 16, x => { blob(x, SH, 8, 14, 6, 1); blob(x, '#2f7d32', 8, 10, 6, 4); blob(x, '#3f9643', 7, 9, 4, 2); if (full) for (const [a, b] of [[4, 9], [8, 7], [11, 10], [6, 12], [10, 13]]) { R(x, '#d3304a', a, b, 2, 2); R(x, '#ff7a8a', a, b, 1, 1); } });
  const wheat = s => mk(16, 16, x => { for (const a of [2, 5, 8, 11, 14]) for (const b of [9, 15]) { const h = 3 + s * 3; R(x, s === 2 ? '#d8b23c' : '#6fb04a', a, b - h, 1, h); if (s === 2) R(x, '#f2d868', a - 1, b - h, 2, 3); } });
  const wall = (top, front, line) => mk(16, 22, x => { R(x, top, 0, 0, 16, 8); R(x, front, 0, 8, 16, 14); R(x, line, 0, 8, 16, 1); R(x, line, 0, 14, 16, 1); R(x, line, 0, 21, 16, 1); R(x, line, 5, 8, 1, 6); R(x, line, 11, 15, 1, 6); R(x, line, 0, 0, 16, 1); R(x, line, 0, 0, 1, 8); R(x, line, 15, 0, 1, 8); });
  const flame = f => x => { R(x, '#ff7b1c', 6, 5 + f, 4, 6 - f); R(x, '#ffd23f', 7, 7 + f, 2, 4 - f); };
  const flower = c => mk(16, 16, x => { R(x, '#3d8a35', 8, 9, 1, 6); R(x, c, 7, 6, 3, 3); R(x, c, 6, 7, 5, 1); R(x, '#ffe066', 8, 7, 1, 1); });
  const SPR = {
    tree: [mk(16, 26, x => { blob(x, SH, 8, 24, 5, 1); R(x, '#6b4526', 7, 15, 3, 10); R(x, '#855a33', 7, 15, 1, 10); blob(x, '#2a6e2e', 8, 9, 7, 7); blob(x, '#37873b', 7, 8, 5, 5); blob(x, '#4ea352', 6, 6, 2, 2); })],
    pine: [mk(16, 26, x => { blob(x, SH, 8, 24, 5, 1); R(x, '#6b4526', 7, 20, 2, 5); const tri = (top, rows, hw) => { for (let r = 0; r < rows; r++) { const w = Math.round(r * hw / (rows - 1)); R(x, r < 2 ? '#f4f8fb' : '#2c6e4f', 8 - w, top + r, w * 2 + 1, 1); if (r >= 2) R(x, '#3a8562', 8 - w, top + r, 2, 1); } }; tri(12, 9, 7); tri(6, 8, 5); tri(1, 7, 4); })],
    cactus: [mk(16, 18, x => { blob(x, SH, 8, 16, 4, 1); R(x, '#3f8f4a', 7, 3, 3, 13); R(x, '#57ab63', 7, 3, 1, 13); R(x, '#3f8f4a', 3, 7, 2, 5); R(x, '#3f8f4a', 3, 11, 4, 2); R(x, '#3f8f4a', 12, 5, 2, 5); R(x, '#3f8f4a', 10, 9, 4, 2); })],
    rock: [mk(16, 16, rockBase)],
    coal_ore: [ore('#26272c', '#4a4b52')], copper_ore: [ore('#d0803c', '#f0a868')], iron_ore: [ore('#e3e6ee', '#ffffff')], gold_ore: [ore('#f0c93a', '#fff0a0')],
    crystal: [mk(16, 16, x => { blob(x, SH, 8, 14, 6, 1); R(x, '#8a5cf0', 4, 7, 3, 8); R(x, '#b08cff', 4, 7, 1, 8); R(x, '#6c43d1', 8, 3, 3, 12); R(x, '#c9b0ff', 8, 3, 1, 12); R(x, '#8a5cf0', 12, 9, 2, 6); R(x, '#fff', 9, 4, 1, 2); })],
    star_ore: [mk(16, 16, x => { blob(x, SH, 8, 14, 6, 1); blob(x, '#2b2540', 8, 10, 6, 4); blob(x, '#3c3558', 7, 9, 4, 2); for (const [a, b, c] of [[4, 9, '#7fe3ff'], [8, 7, '#ffe066'], [10, 11, '#7fe3ff'], [6, 12, '#ffe066'], [11, 8, '#fff']]) R(x, c, a, b, 2, 2); })],
    bush_full: [bush(1)], bush: [bush(0)],
    grass_tuft: [mk(16, 16, x => { for (const [a, b, h] of [[4, 10, 5], [6, 8, 7], [8, 10, 5], [10, 7, 8], [12, 10, 5]]) { R(x, '#3d8a35', a, b, 1, h); R(x, '#8fd16a', a, b, 1, 1); } })],
    flower: [flower('#f06292'), flower('#fff176'), flower('#ba68c8'), flower('#ffffff')],
    sapling: [mk(16, 16, x => { R(x, '#6b4526', 8, 10, 1, 5); blob(x, '#4ea352', 8, 8, 2, 2); R(x, '#8fd16a', 7, 7, 1, 1); })],
    wheat0: [wheat(0)], wheat1: [wheat(1)], wheat2: [wheat(2)],
    wood_wall: [wall('#b98550', '#8f6034', '#6f4824')], stone_wall: [wall('#b4b7be', '#868991', '#5d6067')],
    door: [mk(16, 22, x => { R(x, '#6f4824', 1, 2, 14, 20); R(x, '#b98550', 3, 4, 10, 18); R(x, '#a57040', 3, 12, 10, 1); R(x, '#f0c93a', 10, 13, 2, 2); })],
    torch: [0, 1].map(f => mk(16, 16, x => { R(x, '#6b4526', 7, 8, 2, 7); R(x, '#ff9d2e', 6, 3 + f, 4, 5 - f); R(x, '#ffe066', 7, 5, 2, 2); })),
    workbench: [mk(16, 16, x => { blob(x, SH, 8, 15, 7, 1); R(x, '#6b4526', 2, 10, 2, 5); R(x, '#6b4526', 12, 10, 2, 5); R(x, '#b98550', 1, 5, 14, 5); R(x, '#d2a06a', 1, 5, 14, 1); R(x, '#9aa0a8', 4, 6, 5, 2); R(x, '#6b4526', 9, 6, 3, 1); })],
    furnace: [0, 1].map(f => mk(16, 18, x => { R(x, '#6d7078', 2, 2, 12, 15); R(x, '#8a8d94', 2, 2, 12, 2); R(x, '#55585f', 2, 16, 12, 1); R(x, '#1b1b1f', 5, 9, 6, 6); R(x, '#ff7b1c', 6, 11 + f, 4, 4 - f); R(x, '#ffd23f', 7, 13, 2, 2); })),
    campfire: [0, 1].map(f => mk(16, 16, x => { blob(x, SH, 8, 14, 6, 1); R(x, '#8a8d94', 2, 12, 2, 2); R(x, '#8a8d94', 12, 12, 2, 2); R(x, '#6b4526', 3, 12, 10, 2); R(x, '#855a33', 5, 10, 6, 2); flame(f)(x); })),
    bed: [mk(16, 16, x => { R(x, '#6b4526', 1, 2, 14, 13); R(x, '#f4f4f4', 2, 3, 12, 4); R(x, '#c0392b', 2, 7, 12, 7); R(x, '#e05545', 2, 7, 12, 1); })],
    flag: [mk(16, 24, x => { blob(x, SH, 8, 22, 3, 1); R(x, '#ddd', 7, 2, 1, 21); R(x, '#e03a3a', 8, 3, 7, 5); R(x, '#b82a2a', 8, 7, 7, 1); R(x, '#f0c93a', 6, 1, 3, 2); })],
    lantern: [mk(16, 22, x => { blob(x, SH, 8, 20, 3, 1); R(x, '#444', 7, 9, 2, 12); R(x, '#444', 5, 1, 6, 1); R(x, '#ffe9a0', 5, 2, 6, 6); R(x, '#fff7d6', 6, 3, 4, 4); R(x, '#444', 5, 8, 6, 1); })],
    stall: [mk(16, 28, x => { for (let i = 0; i < 16; i += 4) { R(x, '#e03a3a', i, 0, 2, 8); R(x, '#f4f4f4', i + 2, 0, 2, 8); } R(x, '#6b4526', 0, 8, 1, 20); R(x, '#6b4526', 15, 8, 1, 20); R(x, '#5a3b7a', 5, 14, 6, 6); R(x, '#f1c9a5', 6, 9, 4, 5); R(x, '#222', 7, 11, 1, 1); R(x, '#222', 9, 11, 1, 1); R(x, '#b98550', 1, 18, 14, 10); R(x, '#d2a06a', 1, 18, 14, 2); R(x, '#f0c93a', 4, 16, 2, 2); })],
    beacon: [mk(16, 30, x => { blob(x, SH, 8, 28, 6, 1); R(x, '#868991', 3, 22, 10, 7); R(x, '#a9acb3', 3, 22, 10, 1); R(x, '#a9acb3', 5, 10, 6, 12); R(x, '#c4c7ce', 5, 10, 2, 12); blob(x, '#7fe3ff', 8, 5, 3, 4); R(x, '#fff', 7, 2, 1, 3); })],
  };
  const OSPR = objs.map(d => SPR[d.name] || null);

  function mobSprite(draw, w, h) { const c = mk(w || 16, h || 16, draw); const f = mk(c.width, c.height, x => { x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; R(x, '#fff', 0, 0, c.width, c.height); }); return { c, f }; }
  const slimeDraw = (c1, c2, king) => x => { blob(x, c1, 8, 10, 6, 4); R(x, c2, 5, 7, 3, 1); R(x, '#123', 6, 10, 2, 2); R(x, '#123', 10, 10, 2, 2); if (king) { R(x, '#f0c93a', 5, 4, 7, 2); R(x, '#f0c93a', 5, 2, 1, 2); R(x, '#f0c93a', 8, 2, 1, 2); R(x, '#f0c93a', 11, 2, 1, 2); R(x, '#e03a3a', 8, 4, 1, 1); } };
  const MSPR = {
    slime: mobSprite(slimeDraw('#3fae49', '#8be28f')),
    king: mobSprite(slimeDraw('#2e9bd6', '#9fdcff', true)),
    chicken: mobSprite(x => { blob(x, '#f5f5f0', 7, 10, 4, 3); blob(x, '#f5f5f0', 11, 7, 2, 2); R(x, '#d33', 11, 4, 2, 1); R(x, '#f0a020', 14, 7, 2, 1); R(x, '#000', 12, 6, 1, 1); R(x, '#f0a020', 6, 14, 1, 2); R(x, '#f0a020', 9, 14, 1, 2); }),
    boar: mobSprite(x => { R(x, '#7a5136', 2, 7, 11, 6); R(x, '#8c6044', 2, 7, 11, 1); R(x, '#7a5136', 11, 6, 4, 6); R(x, '#a67c5b', 14, 8, 2, 3); R(x, '#fff', 13, 11, 1, 2); R(x, '#000', 12, 7, 1, 1); R(x, '#4e3220', 3, 13, 2, 3); R(x, '#4e3220', 10, 13, 2, 3); }),
    scorpion: mobSprite(x => { blob(x, '#c26a2a', 8, 11, 4, 2); R(x, '#c26a2a', 12, 8, 3, 2); R(x, '#c26a2a', 12, 13, 3, 2); R(x, '#c26a2a', 2, 6, 2, 5); R(x, '#c26a2a', 2, 4, 4, 2); R(x, '#402', 6, 4, 1, 3); R(x, '#000', 10, 10, 1, 1); R(x, '#8f4a18', 5, 14, 1, 2); R(x, '#8f4a18', 8, 14, 1, 2); R(x, '#8f4a18', 11, 14, 1, 2); }),
    wolf: mobSprite(x => { R(x, '#8d93a0', 2, 8, 10, 5); R(x, '#a7adba', 2, 8, 10, 1); R(x, '#8d93a0', 10, 5, 5, 5); R(x, '#8d93a0', 10, 3, 1, 2); R(x, '#8d93a0', 14, 3, 1, 2); R(x, '#c9cfdc', 14, 8, 2, 2); R(x, '#ff3', 12, 6, 1, 1); R(x, '#8d93a0', 0, 7, 3, 2); R(x, '#6c7280', 3, 13, 2, 3); R(x, '#6c7280', 9, 13, 2, 3); }),
    skeleton: mobSprite(x => { R(x, '#eee', 5, 1, 6, 6); R(x, '#000', 6, 3, 2, 2); R(x, '#000', 9, 3, 2, 2); R(x, '#ddd', 7, 7, 2, 7); R(x, '#ddd', 4, 8, 8, 1); R(x, '#ddd', 4, 10, 8, 1); R(x, '#ddd', 5, 12, 6, 1); R(x, '#ddd', 3, 8, 1, 6); R(x, '#ddd', 12, 8, 1, 6); R(x, '#ddd', 6, 14, 1, 5); R(x, '#ddd', 9, 14, 1, 5); }, 16, 20),
    golem: mobSprite(x => { R(x, '#6d7078', 3, 5, 10, 10); R(x, '#868991', 5, 1, 6, 5); R(x, '#ff8a1c', 6, 3, 1, 1); R(x, '#ff8a1c', 9, 3, 1, 1); R(x, '#5c5f66', 0, 6, 3, 8); R(x, '#5c5f66', 13, 6, 3, 8); R(x, '#5c5f66', 4, 15, 3, 3); R(x, '#5c5f66', 9, 15, 3, 3); R(x, '#4f9440', 4, 6, 3, 1); R(x, '#4f9440', 9, 9, 3, 1); }, 16, 18),
    wraith: mobSprite(x => { blob(x, '#5b3a9e', 8, 7, 5, 6); R(x, '#5b3a9e', 4, 12, 2, 4); R(x, '#5b3a9e', 7, 12, 2, 5); R(x, '#5b3a9e', 10, 12, 2, 3); R(x, '#7fe3ff', 6, 6, 2, 2); R(x, '#7fe3ff', 9, 6, 2, 2); R(x, '#7a52c9', 5, 2, 3, 1); }, 16, 18),
  };
  const PSPR = {};
  function playerSprite(name) {
    if (PSPR[name]) return PSPR[name];
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const shirt = `hsl(${h % 360},65%,50%)`, hair = ['#4a2f1a', '#222', '#c9a227', '#8c3b1e', '#ddd'][(h >> 9) % 5];
    return PSPR[name] = [0, 1, 2].map(f => mk(16, 20, x => {
      R(x, hair, 5, 1, 6, 3); R(x, hair, 4, 2, 1, 4); R(x, '#f1c9a5', 5, 3, 6, 5); R(x, '#222', 9, 5, 1, 2);
      R(x, shirt, 4, 8, 8, 6); R(x, 'rgba(0,0,0,.18)', 4, 13, 8, 1); R(x, '#f1c9a5', 3, 9, 1, 4); R(x, '#f1c9a5', 12, 9, 1, 4);
      R(x, '#3b4a6b', 5, 14, 2, f === 1 ? 4 : 5); R(x, '#3b4a6b', 9, 14, 2, f === 2 ? 4 : 5);
    }));
  }

  // ---------- canvas ----------
  const cv = $('#game'), ctx = cv.getContext('2d');
  let VW = 0, VH = 0, Z = 3, TS = 48, DPR = 1;
  const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 3);
    VW = cv.width = Math.floor(innerWidth * DPR); VH = cv.height = Math.floor(innerHeight * DPR);
    Z = Math.max(2, Math.min(8, Math.round(Math.min(VW, VH) / (16 * 12.5)))); TS = 16 * Z;
    lightCv.width = Math.ceil(VW / 4); lightCv.height = Math.ceil(VH / 4);
  }
  addEventListener('resize', resize); resize();
  const cam = { x: D.CX, y: D.CY };

  // ---------- minimap ----------
  const mapCv = document.createElement('canvas'); mapCv.width = W; mapCv.height = H;
  const mapCtx = mapCv.getContext('2d');
  function mapPx(i) { const o = objs[S.map.o[i]]; mapCtx.fillStyle = o.mc || grounds[S.map.g[i]].c; mapCtx.fillRect(i % W, (i / W) | 0, 1, 1); }
  const mini = $('#mini'), mctx = mini.getContext('2d'), bigCv = $('#bigcv');
  function drawMap(c, x, sx, sy, sw) {
    const k = c.width / sw; x.imageSmoothingEnabled = false;
    R(x, '#1d4f8a', 0, 0, c.width, c.height); x.drawImage(mapCv, sx, sy, sw, sw, 0, 0, c.width, c.width);
    const dot = (wx, wy, col, r) => { x.fillStyle = col; x.beginPath(); x.arc((wx - sx) * k, (wy - sy) * k, r, 0, 7); x.fill(); };
    for (const i of S.claims.keys()) dot(i % W + 0.5, ((i / W) | 0) + 0.5, '#ff5252', 2.5);
    if (sw < 100) for (const m of S.mobs.values()) dot(m.x, m.y, D.mobs[m.k].passive ? '#fff8' : '#f33', 1.5);
    for (const p of S.players.values()) if (p.id !== S.id) dot(p.x, p.y, '#fff', 2.5);
    if (S.event) { const e = S.event; dot(Math.max(sx + 3 / k, Math.min(sx + sw - 3 / k, e.x)), Math.max(sy + 3 / k, Math.min(sy + sw - 3 / k, e.y)), (now * 3 | 0) % 2 ? '#ff4dff' : '#fff', 4.5); }
    dot(D.CX + 0.5, D.CY + 0.5, '#7fe3ff', 2.5); dot(me.x, me.y, '#ffd54a', 3.2);
  }

  // ---------- networking ----------
  function connect(solo, name) {
    const token = LS.get('sb_token') || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    LS.set('sb_token', token); LS.set('sb_name', name);
    if (solo) {
      let save = null; try { save = JSON.parse(LS.get('sb_solo')); } catch (e) { }
      let game; try { game = new window.SBGame({ save }); } catch (e) { game = new window.SBGame(); }
      const pl = game.addPlayer(name, token, onMsg);
      net = { send: m => game.handle(pl, m) };
      let last = performance.now();
      setInterval(() => { const n = performance.now(); game.tick(Math.min(0.5, (n - last) / 1000)); last = n; }, 100);
      const persist = () => LS.set('sb_solo', JSON.stringify(game.save()));
      setInterval(persist, 20000); addEventListener('pagehide', persist);
      document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
      return;
    }
    $('#loginmsg').textContent = 'Connecting...';
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => ws.send(JSON.stringify({ t: 'join', name, token }));
    ws.onmessage = e => onMsg(JSON.parse(e.data));
    ws.onclose = () => {
      if (S.kicked) return;
      if (S.on) { toast('Connection lost - reconnecting...'); setTimeout(() => connect(false, name), 3000); }
      else $('#loginmsg').textContent = 'Could not reach the server. Try Play Solo.';
    };
    net = { send: m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); } };
  }
  const b64 = v => typeof v === 'string' ? Uint8Array.from(atob(v), c => c.charCodeAt(0)) : new Uint8Array(v);

  function onMsg(m) {
    switch (m.t) {
      case 'init': {
        S.id = m.id; S.map = { g: b64(m.g), o: b64(m.o) }; S.clock = m.clock; S.event = m.event;
        Object.assign(me, m.you); cam.x = me.x; cam.y = me.y; me.dead = false;
        S.players.clear(); S.mobs.clear(); S.claims.clear(); for (const [i, n] of m.claims) S.claims.set(i, n);
        for (let i = 0; i < W * H; i++) mapPx(i);
        try { const h = JSON.parse(LS.get('sb_hot')); if (Array.isArray(h) && h.length === 9) S.hot = h.map(v => items[v] ? v : null); } catch (e) { }
        S.hot[0] = null; for (const k in me.inv) autoHot(k);
        $('#login').hidden = true; $('#hud').hidden = false; $('#dead').hidden = true;
        const first = !S.on; S.on = true; uiAll(); showEvent();
        if (first && !LS.get('sb_seen')) { LS.set('sb_seen', '1'); openPanel('help'); }
        break;
      }
      case 's': {
        S.clock = m.c; me.hp = m.me[0]; me.maxhp = m.me[1];
        if (m.me[2] !== me.coins) { if (m.me[2] > me.coins && S.on) SFX.coin(); me.coins = m.me[2]; }
        sync(S.players, m.p, (e, a) => { e.tx = a[1]; e.ty = a[2]; e.f = a[3]; e.hp = a[4]; e.maxhp = a[5]; if (e.sw !== undefined && a[6] !== e.sw && e.id !== S.id) { e.swT = now; e.sa = a[7]; } e.sw = a[6]; e.armor = a[8]; });
        sync(S.mobs, m.m, (e, a) => { e.k = a[1]; e.tx = a[2]; e.ty = a[3]; e.hp = a[4]; e.mhp = a[5]; e.lvl = a[6]; e.f = a[7]; });
        uiStats(); break;
      }
      case 'tile': S.map.g[m.i] = m.g; S.map.o[m.i] = m.o; S.tdmg.delete(m.i); mapPx(m.i); break;
      case 'inv': {
        for (const k in m.d) { if (m.d[k] > 0) me.inv[k] = m.d[k]; else { delete me.inv[k]; const h = S.hot.indexOf(k); if (h > 0) S.hot[h] = null; } }
        if (m.got) { float(me.x, me.y - 0.9, `+${m.got[1]} ${items[m.got[0]].e}`, '#fff'); SFX.get(); autoHot(m.got[0]); }
        uiHot(); refreshPanel(); uiStats(); break;
      }
      case 'xp': {
        me.skills[m.k] = m.xp; float(me.x, me.y - 1.5, `+${m.gain} ${D.SKILLS[m.k]} xp`, '#ffd54a');
        if (m.up) { toast(`⭐ ${D.SKILLS[m.k]} level ${m.up}!`, true); SFX.up(); }
        refreshPanel(); uiStats(); break;
      }
      case 'fx': onFx(m); break;
      case 'chat': chatLine(m); break;
      case 'toast': toast(m.s); break;
      case 'quests': me.quests = m.q; uiQuests(); refreshPanel(); break;
      case 'qdone': toast(`📜 Bounty complete! +${m.coins} 🪙`, true); SFX.up(); break;
      case 'crafted': SFX.craft(); break;
      case 'traded': SFX.coin(); break;
      case 'event': S.event = m.ev; showEvent(); if (m.ev) SFX.up(); break;
      case 'roster': S.roster.clear(); for (const [id, n, l] of m.r) S.roster.set(id, { name: n, lvl: l }); refreshPanel(); break;
      case 'claim': if (m.name) S.claims.set(m.i, m.name); else S.claims.delete(m.i); break;
      case 'pos': me.x = m.x; me.y = m.y; break;
      case 'dead': me.dead = true; $('#deadmsg').textContent = `Slain by a ${m.by}.` + (m.lost ? ` You dropped ${m.lost} coins.` : ''); $('#dead').hidden = false; closePanel(); SFX.hurt(); break;
      case 'alive': me.dead = false; me.x = cam.x = m.x; me.y = cam.y = m.y; $('#dead').hidden = true; break;
      case 'kick': S.kicked = true; toast(m.s); break;
    }
  }
  function sync(map, arr, set) {
    const seen = new Set();
    for (const a of arr) {
      let e = map.get(a[0]);
      if (!e) { e = { id: a[0], x: a[1] !== undefined && typeof a[1] === 'number' ? a[1] : a[2], y: 0, swT: -9, flash: -9 }; map.set(a[0], e); set(e, a); e.x = e.tx; e.y = e.ty; }
      else set(e, a);
      seen.add(a[0]);
    }
    for (const id of map.keys()) if (!seen.has(id)) map.delete(id);
  }
  function onFx(m) {
    if (m.k === 'hit') { S.tdmg.set(m.y * W + m.x, { r: m.r, t: now }); burst(m.x + 0.5, m.y + 0.5, objs[m.o].mc || '#9c6', 3); SFX.hit(); }
    else if (m.k === 'brk') { burst(m.x + 0.5, m.y + 0.5, objs[m.o].mc || '#9c6', 10); SFX.brk(); }
    else if (m.k === 'dmg') {
      float(m.x + (Math.random() - 0.5) * 0.5, m.y - 0.8, String(m.n), m.c, true);
      if (m.m) { const mb = S.mobs.get(m.m); if (mb) mb.flash = now; SFX.hit(); }
      if (m.p === S.id) { S.shake = 0.25; SFX.hurt(); }
    }
    else if (m.k === 'die') { burst(m.x, m.y, m.mk === 'slime' ? '#3fae49' : '#ddd', 14); SFX.die(); }
    else if (m.k === 'arrow') { S.fx.push({ arrow: m, t: now }); SFX.bow(); }
  }
  function float(x, y, txt, c, big) { S.fx.push({ x, y, txt, c, big, t: now }); }
  function burst(x, y, c, n) { for (let i = 0; i < n; i++) S.parts.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3 - 1, c, t: now }); }

  // ---------- UI ----------
  const icon = id => { const it = items[id]; return `<span class="ic"${it.c ? ` style="color:${it.c}"` : ''}>${it.e}</span>` + (it.tier ? `<i class="tier" style="background:${D.TIER_C[it.tool === 'armor' ? [0, 1, 3, 4, 5][it.tier] : it.tier]}"></i>` : ''); };
  const usable = id => { const it = items[id]; return it && (it.place || it.floor || it.food || it.bow); };
  function autoHot(id) {
    if (!usable(id) || S.hot.includes(id) || !me.inv[id]) return;
    const f = S.hot.indexOf(null, 1); if (f > 0) { S.hot[f] = id; LS.set('sb_hot', JSON.stringify(S.hot)); }
  }
  function uiHot() {
    $('#hotbar').innerHTML = S.hot.map((id, i) => `<div class="slot${i === S.sel ? ' sel' : ''}" data-i="${i}"><span class="k">${i + 1}</span>${i === 0 ? '<span class="ic">✋</span>' : id ? icon(id) + `<span class="n">${me.inv[id] || 0}</span>` : ''}</div>`).join('');
    LS.set('sb_hot', JSON.stringify(S.hot));
  }
  $('#hotbar').addEventListener('pointerdown', e => {
    const el = e.target.closest('.slot'); if (!el) return; e.preventDefault();
    const i = +el.dataset.i;
    if (i === S.sel && S.hot[i] && items[S.hot[i]].food) net.send({ t: 'use', item: S.hot[i] });
    S.sel = i; uiHot();
  });
  let lastStats = '';
  function uiStats() {
    const tl = D.totalLevel(me.skills), k = [me.hp, me.maxhp, me.coins, tl].join();
    if (k === lastStats) return; lastStats = k;
    $('#hpbar i').style.width = Math.max(0, 100 * me.hp / me.maxhp) + '%'; $('#hpbar span').textContent = `${me.hp} / ${me.maxhp}`;
    $('#coins').textContent = `🪙 ${me.coins}`; $('#gear').textContent = `⭐ Lv ${tl}`;
  }
  const qText = q => `${q.k === 'k' ? 'Defeat' : 'Gather'} ${q.need} ${q.k === 'k' ? D.mobs[q.id].n : items[q.id].n}`;
  function uiQuests() { $('#quests').innerHTML = me.quests.map(q => `<div>${esc(qText(q))} <b>${q.have}/${q.need}</b></div>`).join(''); }
  function showEvent() {
    const el = $('#event'); el.hidden = !S.event;
    if (S.event) el.textContent = S.event.kind === 'boss' ? '👑 Slime King sighted!' : '☄️ Meteor crash site!';
  }
  function toast(s, big) {
    const d = document.createElement('div'); d.textContent = s; if (big) d.className = 'big';
    const box = $('#toasts'); box.appendChild(d); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => d.remove(), big ? 3200 : 2200);
  }
  function chatLine(m) {
    const d = document.createElement('div');
    if (m.sys) { d.className = 'sys'; d.textContent = m.s; } else { const b = document.createElement('b'); b.textContent = m.n + ': '; d.appendChild(b); d.appendChild(document.createTextNode(m.s)); }
    const box = $('#chatlog'); box.appendChild(d); while (box.children.length > 7) box.firstChild.remove();
    setTimeout(() => { d.style.transition = 'opacity 1s'; d.style.opacity = 0.35; }, 12000);
  }
  function uiAll() { uiHot(); lastStats = ''; uiStats(); uiQuests(); refreshPanel(); $('#mute').textContent = muted ? '🔇' : '🔊'; }

  let panel = null;
  const TABS = { inv: '🎒 Items', craft: '🔨 Craft', quests: '📜 Bounties', skills: '⭐ Skills', shop: '🛒 Trader', players: '👥 Players', help: '❔ Help' };
  function openPanel(tab) { if (panel === tab) return closePanel(); panel = tab; $('#panel').hidden = false; refreshPanel(true); }
  function closePanel() { panel = null; $('#panel').hidden = true; }
  const nearTrader = () => Math.hypot(me.x - D.CX - 3.5, me.y - D.CY + 1.5) < 6;
  function nearStation(name) {
    const id = O[name], px = Math.floor(me.x), py = Math.floor(me.y);
    for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++) if (x >= 0 && y >= 0 && x < W && y < H && S.map.o[y * W + x] === id) return true;
    return false;
  }
  function refreshPanel(reset) {
    if (!panel) return;
    const body = $('#pbody'), sc = reset ? 0 : body.scrollTop;
    $('#tabs').innerHTML = Object.keys(TABS).map(k => `<button data-p="${k}" class="${k === panel ? 'on' : ''}">${TABS[k]}</button>`).join('');
    let h = '';
    if (panel === 'inv') {
      const gear = ['pick', 'axe', 'sword', 'armor'].map(k => { const t = D.best(me.inv, k); return `${items[k + 1].e} ${t ? (k === 'armor' ? D.ARMOR_N[t] : D.TIERS[t]) : '—'}`; }).join(' &nbsp; ');
      h = `<div class="hint">Best tools & armor are used automatically: ${gear}<br>Tap a block, food or bow to put it on your hotbar.</div><div class="grid">` +
        Object.keys(me.inv).map(k => `<div class="slot" data-item="${k}" title="${esc(items[k].n)}">${icon(k)}<span class="n">${me.inv[k]}</span></div>`).join('') + '</div><div class="hint" id="iteminfo"></div>';
    } else if (panel === 'craft') {
      for (const st of [null, 'workbench', 'furnace', 'campfire']) {
        const ok = !st || nearStation(st);
        h += `<h3>${st ? items[st].e + ' ' + items[st].n + (ok ? '' : ' — not nearby') : '✋ By hand'}</h3>`;
        D.recipes.forEach((r, i) => {
          if (r.st !== st) return;
          const it = items[r.out]; if (it.tool && D.best(me.inv, it.tool) > it.tier) return;
          let can = ok;
          const ing = Object.keys(r.in).map(k => { const have = me.inv[k] || 0; if (have < r.in[k]) can = false; return `<span class="${have < r.in[k] ? 'bad' : ''}">${items[k].e} ${have}/${r.in[k]}</span>`; }).join(' &nbsp;');
          h += `<div class="row${can ? '' : ' no'}"><div class="big">${icon(r.out)}</div><div class="mid">${esc(it.n)}${r.n > 1 ? ' ×' + r.n : ''}${me.inv[r.out] ? ` <small style="display:inline;opacity:.6">(have ${me.inv[r.out]})</small>` : ''}<small>${ing}</small></div>` +
            `<button data-a="craft" data-r="${i}" data-n="1"${can ? '' : ' disabled'}>Craft</button>${it.tool ? '' : `<button data-a="craft" data-r="${i}" data-n="5"${can ? '' : ' disabled'}>×5</button>`}</div>`;
        });
      }
    } else if (panel === 'quests') {
      h = '<div class="hint">Bounties never run out — finish one and a new one appears. Rewards grow as you complete more.</div>' +
        me.quests.map(q => `<div class="row"><div class="big">${q.k === 'k' ? '⚔️' : items[q.id].e}</div><div class="mid">${esc(qText(q))}<small>Reward: ${q.coins} 🪙 · ${q.xp} ${D.SKILLS[q.sk]} xp</small><div class="bar"><i style="width:${Math.min(100, 100 * q.have / q.need)}%"></i></div></div><b>${q.have}/${q.need}</b></div>`).join('');
    } else if (panel === 'skills') {
      h = '<div class="hint">Skills level up as you play. Higher levels work faster, hit harder and sometimes double your loot.</div>' +
        Object.keys(D.SKILLS).map(k => { const xp = me.skills[k] || 0, l = D.levelFor(xp), a = D.xpFor(l), b = D.xpFor(l + 1); return `<div class="row"><div class="big">${{ mine: '⛏️', wood: '🪓', combat: '⚔️', farm: '🌾' }[k]}</div><div class="mid">${D.SKILLS[k]} — level ${l}<small>${xp - a} / ${b - a} xp</small><div class="bar"><i style="width:${100 * (xp - a) / (b - a)}%"></i></div></div></div>`; }).join('');
    } else if (panel === 'shop') {
      if (!nearTrader()) h = '<div class="hint">The trader is in town, next to the glowing beacon. Come back when you are close!</div>';
      else {
        h = `<h3>Buy — you have ${me.coins} 🪙</h3>` + Object.keys(D.shop).map(k => `<div class="row${me.coins < D.shop[k] ? ' no' : ''}"><div class="big">${icon(k)}</div><div class="mid">${esc(items[k].n)}<small>${D.shop[k]} 🪙</small></div><button data-a="buy" data-item="${k}" data-n="1"${me.coins < D.shop[k] ? ' disabled' : ''}>Buy</button><button data-a="buy" data-item="${k}" data-n="10"${me.coins < D.shop[k] * 10 ? ' disabled' : ''}>×10</button></div>`).join('');
        h += '<h3>Sell</h3>' + (Object.keys(me.inv).filter(k => items[k].v).map(k => `<div class="row"><div class="big">${icon(k)}</div><div class="mid">${esc(items[k].n)} ×${me.inv[k]}<small>${items[k].v} 🪙 each</small></div><button class="s" data-a="sell" data-item="${k}" data-n="1">Sell 1</button><button class="s" data-a="sell" data-item="${k}" data-n="999">All</button></div>`).join('') || '<div class="hint">Nothing to sell.</div>');
      }
    } else if (panel === 'players') {
      h = `<h3>Online — ${S.roster.size}</h3>` + [...S.roster.entries()].sort((a, b) => b[1].lvl - a[1].lvl).map(([id, p], i) => `<div class="row"><div class="big">${['🥇', '🥈', '🥉'][i] || '🙂'}</div><div class="mid">${esc(p.name)}${id === S.id ? ' (you)' : ''}</div><b>Lv ${p.lvl}</b></div>`).join('');
    } else if (panel === 'help') {
      h = `<h3>How to play</h3><div class="hint" style="opacity:1;font-size:13.5px;line-height:1.6">
        ${isTouch ? '🕹️ <b>Move</b> with the joystick. Hold <b>⚔️</b> to attack or gather whatever is closest. <b>Tap the world</b> to gather a tile or place the selected block. Tap a selected food slot to eat.'
          : '<kbd>WASD</kbd> move · <kbd>Left click</kbd> (hold) gather / attack · <kbd>Right click</kbd> place block / eat · <kbd>Space</kbd> auto-target · <kbd>1-9</kbd> hotbar · <kbd>E</kbd> items · <kbd>C</kbd> craft · <kbd>Q</kbd> bounties · <kbd>M</kbd> map · <kbd>Enter</kbd> chat'}
        <br><br>🪓 Punch trees for <b>wood</b>, then craft a <b>pickaxe</b> and a <b>workbench</b> (🔨).
        <br>⛏️ Better pickaxes mine better ore. Smelt ore in a <b>furnace</b> with coal.
        <br>🏠 Build walls, floors and doors anywhere outside town. A <b>bed</b> sets your respawn; a <b>claim flag</b> protects your land.
        <br>🌙 Nights are dangerous. Torches and campfires light your base; monsters get tougher the further you travel.
        <br>📜 Bounties (top right) pay coins. Spend them at the <b>trader</b> in town.
        <br>☄️ Watch for <b>meteor crashes</b> and the <b>Slime King</b> — rare loot for everyone who joins the fight.</div>`;
    }
    body.innerHTML = h; body.scrollTop = sc;
  }
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { panel = b.dataset.p; refreshPanel(true); } });
  $('#pclose').addEventListener('click', closePanel);
  $('#btns').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.p) openPanel(b.dataset.p); });
  $('#pbody').addEventListener('click', e => {
    const b = e.target.closest('button[data-a]');
    if (b) { const a = b.dataset.a; if (a === 'craft') net.send({ t: 'craft', r: +b.dataset.r, n: +b.dataset.n }); else net.send({ t: a, item: b.dataset.item, n: +b.dataset.n }); return; }
    const s = e.target.closest('.slot[data-item]');
    if (s) {
      const id = s.dataset.item, it = items[id]; let msg = `${it.n} — sells for ${it.v || 0} 🪙`;
      if (it.food) msg += ` · heals ${it.food}`;
      if (usable(id)) {
        const cur = S.hot.indexOf(id); if (cur > 0) S.hot[cur] = null;
        let slot = S.sel > 0 ? S.sel : S.hot.indexOf(null, 1); if (slot < 1) slot = 1;
        S.hot[slot] = id; S.sel = slot; uiHot(); msg += ` · placed in hotbar slot ${slot + 1}`;
      }
      $('#iteminfo').textContent = msg;
    }
  });
  $('#mute').addEventListener('click', () => { muted = !muted; LS.set('sb_mute', muted ? '1' : '0'); $('#mute').textContent = muted ? '🔇' : '🔊'; });
  $('#respawn').addEventListener('click', () => net.send({ t: 'respawn' }));
  const chatin = $('#chatin');
  $('#chatbtn').addEventListener('click', () => chatin.focus());
  chatin.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { if (chatin.value.trim()) net.send({ t: 'chat', s: chatin.value }); chatin.value = ''; chatin.blur(); }
    if (e.key === 'Escape') { chatin.value = ''; chatin.blur(); }
  });
  let bigOpen = false;
  const toggleMap = () => { bigOpen = !bigOpen; $('#bigmap').hidden = !bigOpen; if (bigOpen) { bigCv.width = bigCv.height = 640; drawMap(bigCv, bigCv.getContext('2d'), 0, 0, W); } };
  mini.addEventListener('click', toggleMap); $('#bigmap').addEventListener('click', toggleMap);

  // ---------- input ----------
  const keys = {};
  addEventListener('keydown', e => {
    if (!S.on || document.activeElement === chatin || document.activeElement === $('#name')) return;
    const k = e.key.toLowerCase(); keys[k] = true;
    if (k === 'enter') { chatin.focus(); e.preventDefault(); }
    else if (k === 'e' || k === 'i') openPanel('inv'); else if (k === 'c') openPanel('craft'); else if (k === 'q') openPanel('quests');
    else if (k === 'm') toggleMap(); else if (k === 'escape') { closePanel(); if (bigOpen) toggleMap(); }
    else if (k >= '1' && k <= '9') { S.sel = +k - 1; uiHot(); }
    if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; ptr.down = false; });
  const ptr = { x: 0, y: 0, down: false, id: null, touch: false, has: false, lastTile: -1 };
  const joy = { x: 0, y: 0, id: null };
  let actHeld = false;
  const toWorld = (px, py) => [cam.x + (px * DPR - VW / 2) / TS, cam.y + (py * DPR - VH / 2) / TS];
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    if (!S.on || me.dead) return; e.preventDefault(); if (document.activeElement === chatin) chatin.blur();
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.touch = e.pointerType === 'touch'; ptr.has = !ptr.touch;
    if (e.button === 2) { useAt(...toWorld(ptr.x, ptr.y)); return; }
    ptr.down = true; ptr.id = e.pointerId; ptr.lastTile = -1; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => { if (ptr.down && e.pointerId !== ptr.id) return; ptr.x = e.clientX; ptr.y = e.clientY; if (e.pointerType !== 'touch') ptr.has = true; });
  const pup = e => { if (e.pointerId === ptr.id) ptr.down = false; };
  cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
  cv.addEventListener('wheel', e => { S.sel = (S.sel + (e.deltaY > 0 ? 1 : 8)) % 9; uiHot(); }, { passive: true });
  const joyEl = $('#joy'), knob = joyEl.firstElementChild;
  const joyMove = e => {
    const r = joyEl.getBoundingClientRect(); let dx = (e.clientX - r.left - r.width / 2) / 44, dy = (e.clientY - r.top - r.height / 2) / 44;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 36}px,${dy * 36}px)`;
  };
  joyEl.addEventListener('pointerdown', e => { e.preventDefault(); joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
  joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
  const joyUp = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; } };
  joyEl.addEventListener('pointerup', joyUp); joyEl.addEventListener('pointercancel', joyUp);
  const act = $('#actbtn');
  act.addEventListener('pointerdown', e => { e.preventDefault(); actHeld = true; act.setPointerCapture(e.pointerId); });
  act.addEventListener('pointerup', () => actHeld = false); act.addEventListener('pointercancel', () => actHeld = false);

  // ---------- actions ----------
  let lastAct = 0, lastSend = 0, sentX = 0, sentY = 0;
  const selItem = () => { const id = S.hot[S.sel]; return id && me.inv[id] ? id : null; };
  function swing(a) { me.swT = now; me.sa = a; if (Math.cos(a) < -0.2) me.f = -1; else if (Math.cos(a) > 0.2) me.f = 1; }
  function attack(a) {
    const bow = selItem() === 'bow' && me.inv.arrow > 0;
    if (now - lastAct < (bow ? 0.62 : 0.36)) return;
    lastAct = now; swing(a); if (!bow) SFX.swing(); net.send({ t: 'atk', a, bow });
  }
  function hitTile(tx, ty) {
    if (now - lastAct < 0.27) return;
    lastAct = now; swing(Math.atan2(ty + 0.5 - me.y, tx + 0.5 - me.x)); net.send({ t: 'hit', x: tx, y: ty });
  }
  const harvestable = (tx, ty) => { if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null; const d = objs[S.map.o[ty * W + tx]]; return d.hp && !d.fixed ? d : null; };
  const inReach = (tx, ty) => Math.hypot(tx + 0.5 - me.x, ty + 0.5 - me.y) <= D.REACH;
  function primary(wx, wy) {
    for (const m of S.mobs.values()) if (Math.hypot(m.x - wx, m.y - 0.3 - wy) < 0.6 * (D.mobs[m.k].size || 1) + 0.25) return attack(Math.atan2(m.y - me.y, m.x - me.x));
    const tx = Math.floor(wx), ty = Math.floor(wy);
    if (harvestable(tx, ty) && inReach(tx, ty)) return hitTile(tx, ty);
    attack(Math.atan2(wy - me.y, wx - me.x));
  }
  function useAt(wx, wy) {
    const id = selItem(); if (!id) return false;
    const it = items[id];
    if (it.food) { net.send({ t: 'use', item: id }); return true; }
    if (!it.place && !it.floor) return false;
    const tx = Math.floor(wx), ty = Math.floor(wy);
    if (!inReach(tx, ty)) { toast('Too far away'); return true; }
    net.send({ t: 'use', item: id, x: tx, y: ty }); SFX.place(); return true;
  }
  function smart() {
    const bow = selItem() === 'bow' && me.inv.arrow > 0;
    let best = null, bd = bow ? 9 : 2.6;
    for (const m of S.mobs.values()) { if (D.mobs[m.k].passive && bow) continue; const d = Math.hypot(m.x - me.x, m.y - me.y) - 0.4 * (D.mobs[m.k].size || 1); if (d < bd) { bd = d; best = m; } }
    if (best) return attack(Math.atan2(best.y - me.y, best.x - me.x));
    let bt = null; bd = 2.3;
    const px = Math.floor(me.x), py = Math.floor(me.y);
    for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) {
      const d = harvestable(x, y); if (!d || d.built || d.grow) continue;
      const dd = Math.hypot(x + 0.5 - me.x - me.f * 0.4, y + 0.5 - me.y); if (dd < bd) { bd = dd; bt = [x, y]; }
    }
    if (bt) return hitTile(bt[0], bt[1]);
    attack(me.f > 0 ? 0 : Math.PI);
  }

  function update(dt) {
    if (me.dead) return;
    let dx = joy.x, dy = joy.y;
    if (keys.w || keys.arrowup) dy -= 1; if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1; if (keys.d || keys.arrowright) dx += 1;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    me.moving = l > 0.15;
    if (me.moving) {
      const sp = D.SPEED * dt, nx = me.x + dx * sp, ny = me.y + dy * sp, stuck = D.blockedAt(S.map, me.x, me.y, D.PR);
      if (stuck || !D.blockedAt(S.map, nx, me.y, D.PR)) me.x = nx;
      if (stuck || !D.blockedAt(S.map, me.x, ny, D.PR)) me.y = ny;
      me.x = Math.max(0.5, Math.min(W - 0.5, me.x)); me.y = Math.max(0.5, Math.min(H - 0.5, me.y));
      if (Math.abs(dx) > 0.15 && now - me.swT > 0.3) me.f = dx < 0 ? -1 : 1;
    }
    if (now - lastSend > 0.07 && (me.x !== sentX || me.y !== sentY)) { lastSend = now; sentX = me.x; sentY = me.y; net.send({ t: 'm', x: +me.x.toFixed(2), y: +me.y.toFixed(2), f: me.f }); }
    if (ptr.down && !panel) {
      const [wx, wy] = toWorld(ptr.x, ptr.y), it = items[selItem()] || {};
      if (ptr.touch && (it.place || it.floor)) {
        const ti = Math.floor(wy) * W + Math.floor(wx);
        if (ti !== ptr.lastTile) { ptr.lastTile = ti; if (S.map.o[ti] && harvestable(Math.floor(wx), Math.floor(wy))) primary(wx, wy); else useAt(wx, wy); }
      } else primary(wx, wy);
    }
    if (actHeld || keys[' ']) smart();
  }

  // ---------- rendering ----------
  function drawSprite(c, x, y, w, h, flip) {
    if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); ctx.restore(); } else ctx.drawImage(c, x, y, w, h);
  }
  function label(txt, x, y, col, size) {
    ctx.font = `bold ${Math.round((size || 4.2) * Z)}px system-ui,sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(2, Z * 0.8); ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(txt, x, y); ctx.fillStyle = col || '#fff'; ctx.fillText(txt, x, y);
  }
  function hpBar(x, y, w, r, col) { R(ctx, '#000a', x - w / 2 - 1, y - 1, w + 2, Z + 2); R(ctx, col, x - w / 2, y, Math.max(0, w * r), Z); }
  function render(dt) {
    const map = S.map;
    cam.x += (me.x - cam.x) * Math.min(1, dt * 12); cam.y += (me.y - cam.y) * Math.min(1, dt * 12);
    let shx = 0, shy = 0; if (S.shake > 0) { S.shake -= dt; shx = (Math.random() - 0.5) * Z * 3; shy = (Math.random() - 0.5) * Z * 3; }
    const ox = Math.round(VW / 2 - cam.x * TS + shx), oy = Math.round(VH / 2 - cam.y * TS + shy);
    ctx.imageSmoothingEnabled = false;
    R(ctx, '#2b69b3', 0, 0, VW, VH);
    const x0 = Math.max(0, Math.floor(-ox / TS)), x1 = Math.min(W - 1, Math.floor((VW - ox) / TS));
    const y0 = Math.max(0, Math.floor(-oy / TS)), y1 = Math.min(H - 1, Math.floor((VH - oy) / TS));
    const wf = Math.floor(now * 1.6);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const g = map.g[y * W + x]; let v = (x * 7 + y * 13 + ((x * y) % 5)) & 3; if (g === 0) v = (v + wf) & 3;
      ctx.drawImage(GS[g][v], ox + x * TS, oy + y * TS, TS, TS);
      if (g === 0 && y > 0 && map.g[(y - 1) * W + x] !== 0) R(ctx, 'rgba(10,30,70,.35)', ox + x * TS, oy + y * TS, TS, Z * 3);
    }
    // claims
    ctx.setLineDash([Z * 3, Z * 3]); ctx.lineWidth = Z; ctx.strokeStyle = 'rgba(255,255,255,.45)';
    for (const i of S.claims.keys()) { const cx = i % W, cy = (i / W) | 0; if (Math.abs(cx - cam.x) < 40 && Math.abs(cy - cam.y) < 40) ctx.strokeRect(ox + (cx - D.CLAIM_R) * TS, oy + (cy - D.CLAIM_R) * TS, (D.CLAIM_R * 2 + 1) * TS, (D.CLAIM_R * 2 + 1) * TS); }
    ctx.setLineDash([]);
    // entities
    const ents = [];
    for (const p of S.players.values()) {
      if (p.id === S.id) continue;
      const mv = Math.hypot(p.tx - p.x, p.ty - p.y) > 0.03; p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); p.moving = mv; ents.push(p);
    }
    for (const m of S.mobs.values()) { m.moving = Math.hypot(m.tx - m.x, m.ty - m.y) > 0.03; m.x += (m.tx - m.x) * Math.min(1, dt * 10); m.y += (m.ty - m.y) * Math.min(1, dt * 10); ents.push(m); }
    if (!me.dead) ents.push(me);
    ents.sort((a, b) => a.y - b.y);
    let ei = 0;
    const lights = [];
    const drawEnt = e => {
      const px = ox + e.x * TS, py = oy + e.y * TS;
      if (px < -TS * 3 || py < -TS * 3 || px > VW + TS * 3 || py > VH + TS * 4) return;
      if (e.k) {
        const d = D.mobs[e.k], sp = MSPR[e.k], sz = d.size || 1, w = sp.c.width * Z * sz, h = sp.c.height * Z * sz;
        const bob = e.k === 'slime' || e.k === 'king' ? Math.abs(Math.sin(now * 5 + e.id)) * Z * 2 * sz : e.k === 'wraith' ? Math.sin(now * 3 + e.id) * Z * 2 : e.moving ? Math.abs(Math.sin(now * 12 + e.id)) * Z : 0;
        ctx.fillStyle = SH; ctx.beginPath(); ctx.ellipse(px, py + 3 * Z * sz, 5 * Z * sz, 2 * Z * sz, 0, 0, 7); ctx.fill();
        drawSprite(now - e.flash < 0.09 ? sp.f : sp.c, Math.round(px - w / 2), Math.round(py + 4 * Z * sz - h - bob), w, h, e.f < 0);
        const top = py + 4 * Z * sz - h - bob - Z * 2;
        if (d.boss) { label(`${d.n}`, px, top - Z * 3, '#ffd54a', 5.5); hpBar(px, top, TS * 2.4, e.hp / e.mhp, '#e0457a'); }
        else if (e.hp < e.mhp) { hpBar(px, top, TS * 0.8, e.hp / e.mhp, '#f0605a'); label(`Lv${e.lvl + 1} ${d.n}`, px, top - Z * 2, '#fff', 3.4); }
        if (e.k === 'wraith') lights.push([e.x, e.y, 2.5]);
        return;
      }
      const isMe = e === me, name = isMe ? me.name : (S.roster.get(e.id) || {}).name || '?';
      const sp = playerSprite(name), fr = e.moving ? 1 + (Math.floor(now * 9) & 1) : 0;
      ctx.fillStyle = SH; ctx.beginPath(); ctx.ellipse(px, py + 3 * Z, 5 * Z, 2 * Z, 0, 0, 7); ctx.fill();
      drawSprite(sp[fr], Math.round(px - 8 * Z), Math.round(py - 16 * Z), 16 * Z, 20 * Z, e.f < 0);
      const st = now - e.swT;
      if (st < 0.2) {
        const a = e.sa - 1 + st / 0.2 * 2; ctx.strokeStyle = `rgba(255,255,255,${0.85 - st * 3})`; ctx.lineWidth = Z * 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(px, py - 5 * Z, TS * 0.95, a - 0.7, a + 0.3); ctx.stroke();
      }
      label(name, px, py - 18 * Z, isMe ? '#ffd54a' : '#fff');
      if (!isMe && e.hp < e.maxhp) hpBar(px, py - 17 * Z, TS * 0.8, e.hp / e.maxhp, '#5fd35f');
      lights.push([e.x, e.y - 0.3, 3.2]);
    };
    const tf = Math.floor(now * 6);
    for (let y = y0; y <= Math.min(H - 1, y1 + 2); y++) {
      while (ei < ents.length && ents[ei].y < y + 0.62) drawEnt(ents[ei++]);
      for (let x = Math.max(0, x0 - 6); x <= Math.min(W - 1, x1 + 6); x++) {
        const o = map.o[y * W + x]; if (!o) continue;
        const d = objs[o]; if (d.light) lights.push([x + 0.5, y + 0.3, d.light]);
        if (x < x0 || x > x1) continue;
        const fr = OSPR[o]; if (!fr) continue;
        const sp = d.name === 'flower' ? fr[(x * 7 + y * 3) % fr.length] : fr[(tf + x + y) % fr.length];
        ctx.drawImage(sp, ox + x * TS, oy + (y + 1) * TS - sp.height * Z, TS, sp.height * Z);
      }
    }
    while (ei < ents.length) drawEnt(ents[ei++]);
    // tile damage, cursor
    for (const [i, t] of S.tdmg) { if (now - t.t > 6) { S.tdmg.delete(i); continue; } hpBar(ox + (i % W + 0.5) * TS, oy + ((i / W | 0) + 1) * TS - Z * 3, TS * 0.7, 1 - t.r, '#ffd54a'); }
    if (ptr.has && !me.dead) {
      const [wx, wy] = toWorld(ptr.x, ptr.y), tx = Math.floor(wx), ty = Math.floor(wy), it = items[selItem()] || {};
      if (harvestable(tx, ty) || it.place || it.floor) { ctx.lineWidth = Z; ctx.strokeStyle = inReach(tx, ty) ? 'rgba(255,255,255,.85)' : 'rgba(255,90,90,.6)'; ctx.strokeRect(ox + tx * TS + Z / 2, oy + ty * TS + Z / 2, TS - Z, TS - Z); }
    }
    // particles and floating text
    S.parts = S.parts.filter(p => now - p.t < 0.5);
    for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 12 * dt; R(ctx, p.c, ox + p.x * TS, oy + p.y * TS, Z * 2, Z * 2); }
    // night
    const dark = D.darkness(S.clock);
    if (dark > 0.01) {
      const lw = lightCv.width, lh = lightCv.height, k = 0.25;
      lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, lw, lh); lctx.fillStyle = `rgba(6,8,32,${0.8 * dark})`; lctx.fillRect(0, 0, lw, lh);
      lctx.globalCompositeOperation = 'destination-out';
      for (const [lx, ly, r] of lights) {
        const sx = (ox + lx * TS) * k, sy = (oy + ly * TS) * k, rr = r * TS * k * (1 + Math.sin(now * 7 + lx) * 0.02);
        const g = lctx.createRadialGradient(sx, sy, 0, sx, sy, rr); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = g; lctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
      }
      ctx.imageSmoothingEnabled = true; ctx.drawImage(lightCv, 0, 0, VW, VH); ctx.imageSmoothingEnabled = false;
    }
    S.fx = S.fx.filter(f => now - f.t < (f.arrow ? 0.15 : 1));
    for (const f of S.fx) {
      if (f.arrow) { const a = f.arrow; ctx.strokeStyle = '#fff'; ctx.lineWidth = Z; ctx.beginPath(); ctx.moveTo(ox + a.x1 * TS, oy + (a.y1 - 0.3) * TS); ctx.lineTo(ox + a.x2 * TS, oy + (a.y2 - 0.3) * TS); ctx.stroke(); continue; }
      const t = now - f.t; ctx.globalAlpha = Math.min(1, 2 - t * 2); label(f.txt, ox + f.x * TS, oy + (f.y - t * 0.9) * TS, f.c, f.big ? 5.5 : 4); ctx.globalAlpha = 1;
    }
    // event pointer
    if (S.event) {
      const e = S.event, ex = ox + (e.x + 0.5) * TS, ey = oy + (e.y + 0.5) * TS, pad = TS;
      if (ex < pad || ey < pad || ex > VW - pad || ey > VH - pad) {
        const a = Math.atan2(ey - VH / 2, ex - VW / 2), r = Math.min(VW, VH) / 2 - pad * 1.2, ax = VW / 2 + Math.cos(a) * r, ay = VH / 2 + Math.sin(a) * r;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ff4dff'; ctx.strokeStyle = '#000'; ctx.lineWidth = Z;
        ctx.beginPath(); ctx.moveTo(Z * 7, 0); ctx.lineTo(-Z * 4, -Z * 5); ctx.lineTo(-Z * 4, Z * 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        label(`${Math.round(Math.hypot(e.x - me.x, e.y - me.y))}m`, ax - Math.cos(a) * Z * 12, ay - Math.sin(a) * Z * 12 + Z * 2, '#ffb3ff');
      } else { ctx.strokeStyle = `rgba(255,77,255,${0.5 + Math.sin(now * 5) * 0.3})`; ctx.lineWidth = Z; ctx.beginPath(); ctx.arc(ex, ey, TS * (3.6 + Math.sin(now * 3) * 0.2), 0, 7); ctx.stroke(); }
    }
  }

  let lastT = performance.now(), frame = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t; now = t / 1000;
    if (!S.on) return;
    update(dt); render(dt);
    if (++frame % 6 === 0) {
      drawMap(mini, mctx, Math.round(me.x) - 35, Math.round(me.y) - 35, 70);
      if (bigOpen && frame % 30 === 0) drawMap(bigCv, bigCv.getContext('2d'), 0, 0, W);
      const d = D.darkness(S.clock); $('#clock').textContent = d > 0.5 ? '🌙 Night' : d > 0 ? '🌆 Dusk' : '☀️ Day';
      const nt = nearTrader(); if ($('#shopbtn').hidden === nt) { $('#shopbtn').hidden = !nt; if (panel === 'shop') refreshPanel(); }
      if (frame % 60 === 0 && panel === 'craft') refreshPanel();
    }
  }
  requestAnimationFrame(loop);

  // ---------- login ----------
  const nameIn = $('#name'); nameIn.value = LS.get('sb_name') || '';
  if (SOLO_ONLY) { $('#playOnline').hidden = true; $('#playSolo').textContent = 'Play'; }
  const go = solo => { const n = nameIn.value.trim() || 'Adventurer'; snd(1, 0.01, 'sine', 0.0001); connect(solo, n); };
  $('#playOnline').addEventListener('click', () => go(false));
  $('#playSolo').addEventListener('click', () => go(true));
  nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') go(SOLO_ONLY); });
  window.__SB = S;
})();
