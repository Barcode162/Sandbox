// Headless smoke test: drives the simulation with a fake player.
const assert = require('assert');
const D = require('../shared/defs.js'), Game = require('../shared/sim.js');
const game = new Game({ seed: 12345 });
const cnt = {}; for (let i = 0; i < D.W * D.H; i++) { cnt['g' + game.g[i]] = (cnt['g' + game.g[i]] || 0) + 1; const n = D.objs[game.o[i]].name; cnt[n] = (cnt[n] || 0) + 1; }
console.log('world:', D.grounds.map((g, i) => g.n + ' ' + (100 * (cnt['g' + i] || 0) / (D.W * D.H)).toFixed(1) + '%').join(', '));
console.log('objects:', Object.keys(cnt).filter(k => !/^g\d/.test(k)).map(k => k + ':' + cnt[k]).join(' '));

const msgs = []; const p = game.addPlayer('Tester<>', 'tok', m => msgs.push(m));
assert.equal(p.name, 'Tester'); assert.equal(msgs[0].t, 'init');
const step = n => { for (let i = 0; i < n; i++) game.tick(0.1); };
const tp = (x, y) => { p.x = x; p.y = y; };

// find a tree outside town and chop it
const find = (name, minD) => { for (let r = minD; r < 150; r++) for (let a = 0; a < 6.28; a += 0.02) { const x = Math.floor(D.CX + Math.cos(a) * r), y = Math.floor(D.CY + Math.sin(a) * r); if (game.o[y * D.W + x] === D.O[name] && !D.solid(game, x, y + 1)) return [x, y]; } };
let [tx, ty] = find('tree', 14); tp(tx + 0.5, ty + 1.5);
for (let i = 0; i < 20 && game.o[ty * D.W + tx]; i++) { game.handle(p, { t: 'hit', x: tx, y: ty }); step(3); }
assert.equal(game.o[ty * D.W + tx], 0, 'tree chopped'); assert(p.inv.wood >= 2); assert(p.skills.wood > 0);
p.inv.wood = 50;
game.handle(p, { t: 'craft', r: 0, n: 1 }); assert.equal(p.inv.pick1, 1, 'crafted pickaxe');
[tx, ty] = find('rock', 14); tp(tx + 0.5, ty + 1.5);
for (let i = 0; i < 20 && game.o[ty * D.W + tx]; i++) { game.handle(p, { t: 'hit', x: tx, y: ty }); step(3); }
assert(p.inv.stone >= 2, 'mined stone');
// building + protection
game.handle(p, { t: 'craft', r: D.recipes.findIndex(r => r.out === 'wood_wall'), n: 2 });
const bx = Math.floor(p.x), by = Math.floor(p.y) + 2;
if (!game.o[by * D.W + bx] && D.grounds[game.g[by * D.W + bx]].walk) { game.handle(p, { t: 'use', item: 'wood_wall', x: bx, y: by }); assert.equal(game.o[by * D.W + bx], D.O.wood_wall, 'placed wall'); }
game.handle(p, { t: 'use', item: 'wood_wall', x: D.CX + 2, y: D.CY + 2 });
assert.notEqual(game.o[(D.CY + 2) * D.W + D.CX + 2], D.O.wood_wall, 'town protected');
// movement validation
const ox = p.x; game.handle(p, { t: 'm', x: p.x + 50, y: p.y }); assert.equal(p.x, ox, 'teleport rejected');
// combat
const mb = game.spawnMob('slime', p.x + 1, p.y, 0); p.inv.sword3 = 1;
for (let i = 0; i < 30 && game.mobs.has(mb.id); i++) { game.handle(p, { t: 'atk', a: Math.atan2(mb.y - p.y, mb.x - p.x) }); step(4); }
assert(!game.mobs.has(mb.id), 'slime killed'); assert(p.skills.combat > 0);
// events, spawning, long run, save/load
step(2000); assert(game.event || game.evKind > 0, 'event started');
console.log('mobs alive:', game.mobs.size, 'event:', game.event && game.event.kind, 'hp:', p.hp, 'dead:', p.dead);
const sv = JSON.parse(JSON.stringify(game.save()));
const g2 = new Game({ save: sv }); const p2 = g2.addPlayer('Tester', 'tok', () => {});
assert.equal(p2.inv.pick1, 1); assert.deepEqual([...g2.o], [...game.o], 'world restored');
console.log('quests:', JSON.stringify(p.quests.map(q => q.k + ':' + q.id + ' ' + q.have + '/' + q.need)));
console.log('OK - all smoke tests passed');
