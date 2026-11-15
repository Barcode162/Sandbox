// Shared game definitions (used by both the server simulation and the browser client).
(function (root) {
  'use strict';
  const D = {};
  D.W = 320; D.H = 320; D.CX = 160; D.CY = 160;
  D.SAFE_R = 11;      // protected town radius
  D.REACH = 3.4;      // how far a player can gather / build
  D.SPEED = 4.6;      // tiles per second
  D.CLAIM_R = 7;      // land claim half-size
  D.DAY_LEN = 480;    // seconds per day/night cycle
  D.PR = 0.28;        // player collision radius

  D.G = { WATER: 0, SAND: 1, GRASS: 2, FOREST: 3, SNOW: 4, STONE: 5, WOODF: 6, STONEF: 7 };
  D.grounds = [
    { n: 'Water', walk: 0, c: '#3276c4' },
    { n: 'Sand', walk: 1, c: '#e3d08f' },
    { n: 'Grass', walk: 1, c: '#6ab04a' },
    { n: 'Forest', walk: 1, c: '#4f9440' },
    { n: 'Snow', walk: 1, c: '#eef3f7' },
    { n: 'Stone', walk: 1, c: '#8a8d94' },
    { n: 'Wood floor', walk: 1, c: '#b07a45', floor: 1 },
    { n: 'Stone floor', walk: 1, c: '#a9acb3', floor: 1 },
  ];

  const soil = [2, 3];
  const objList = [
    ['none', {}],
    ['tree', { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 2, 4], ['sapling', 1, 1, 0.35]], xp: ['wood', 6], regrow: 1, mc: '#2a6e2e' }],
    ['pine', { solid: 1, hp: 6, tool: 'axe', drops: [['wood', 2, 4], ['sapling', 1, 1, 0.25]], xp: ['wood', 6], regrow: 1, mc: '#2c6e4f' }],
    ['cactus', { solid: 1, hp: 4, tool: 'axe', drops: [['fiber', 2, 3]], xp: ['wood', 4], regrow: 1, mc: '#3f8f4a' }],
    ['rock', { solid: 1, hp: 8, tool: 'pick', tier: 1, drops: [['stone', 2, 3], ['coal', 1, 1, 0.15]], xp: ['mine', 5], regrow: 1, mc: '#6d7078' }],
    ['coal_ore', { solid: 1, hp: 10, tool: 'pick', tier: 1, drops: [['coal', 2, 3], ['stone', 1, 1]], xp: ['mine', 8], regrow: 1, mc: '#33343a' }],
    ['copper_ore', { solid: 1, hp: 12, tool: 'pick', tier: 2, drops: [['copper_ore', 1, 2], ['stone', 1, 1]], xp: ['mine', 12], regrow: 1, mc: '#d0803c' }],
    ['iron_ore', { solid: 1, hp: 18, tool: 'pick', tier: 3, drops: [['iron_ore', 1, 2], ['stone', 1, 1]], xp: ['mine', 20], regrow: 1, mc: '#d5d8e0' }],
    ['gold_ore', { solid: 1, hp: 24, tool: 'pick', tier: 4, drops: [['gold_ore', 1, 2]], xp: ['mine', 32], regrow: 1, mc: '#f0c93a' }],
    ['crystal', { solid: 1, hp: 28, tool: 'pick', tier: 4, drops: [['crystal', 1, 2]], xp: ['mine', 40], regrow: 1, light: 3, mc: '#a37cff' }],
    ['star_ore', { solid: 1, hp: 40, tool: 'pick', tier: 4, drops: [['starmetal', 2, 3]], xp: ['mine', 70], light: 4, mc: '#7fe3ff' }],
    ['bush_full', { solid: 1, hp: 1, drops: [['berries', 2, 4]], xp: ['farm', 6], becomes: 'bush', mc: '#2f7d32' }],
    ['bush', { solid: 1, grow: ['bush_full', 90], mc: '#2f7d32' }],
    ['grass_tuft', { hp: 1, drops: [['fiber', 1, 2], ['seeds', 1, 1, 0.3]], xp: ['farm', 2], regrow: 1 }],
    ['flower', { hp: 1, drops: [['fiber', 1, 1], ['seeds', 1, 1, 0.15]], xp: ['farm', 2], regrow: 1 }],
    ['sapling', { hp: 1, drops: [['sapling', 1, 1]], grow: ['tree', 150], on: [2, 3, 4] }],
    ['wheat0', { hp: 1, drops: [['seeds', 1, 1]], grow: ['wheat1', 50], on: soil }],
    ['wheat1', { hp: 1, drops: [['seeds', 1, 1]], grow: ['wheat2', 50] }],
    ['wheat2', { hp: 1, drops: [['wheat', 2, 3], ['seeds', 1, 2]], xp: ['farm', 12] }],
    ['wood_wall', { solid: 1, hp: 6, tool: 'axe', drops: [['wood_wall', 1, 1]], built: 1, mc: '#8f6034' }],
    ['stone_wall', { solid: 1, hp: 14, tool: 'pick', drops: [['stone_wall', 1, 1]], built: 1, mc: '#55585f' }],
    ['door', { hp: 5, tool: 'axe', mobBlock: 1, drops: [['door', 1, 1]], built: 1, mc: '#b98550' }],
    ['torch', { hp: 1, light: 5, drops: [['torch', 1, 1]], built: 1 }],
    ['workbench', { solid: 1, hp: 5, tool: 'axe', drops: [['workbench', 1, 1]], built: 1, mc: '#b98550' }],
    ['furnace', { solid: 1, hp: 8, tool: 'pick', light: 3, drops: [['furnace', 1, 1]], built: 1, mc: '#55585f' }],
    ['campfire', { solid: 1, hp: 3, light: 6, drops: [['campfire', 1, 1]], built: 1, mc: '#ff7b1c' }],
    ['bed', { solid: 1, hp: 4, drops: [['bed', 1, 1]], built: 1, mc: '#c0392b' }],
    ['flag', { solid: 1, hp: 5, drops: [['flag', 1, 1]], built: 1, mc: '#e03a3a' }],
    ['lantern', { hp: 2, light: 9, drops: [['lantern', 1, 1]], built: 1, mc: '#ffe9a0' }],
    ['stall', { solid: 1, fixed: 1, mc: '#e03a3a' }],
    ['beacon', { solid: 1, fixed: 1, light: 10, mc: '#7fe3ff' }],
  ];
  D.objs = []; D.O = {};
  objList.forEach(([n, d], i) => { d.name = n; d.id = i; D.objs.push(d); D.O[n] = i; });

  D.TIERS = ['Hand', 'Wood', 'Stone', 'Copper', 'Iron', 'Star'];
  D.TIER_C = ['#888', '#a8763e', '#9aa0a8', '#d0803c', '#dfe3ea', '#7fe3ff'];
  D.SWORD_DMG = [3, 7, 10, 14, 19, 27];
  D.ARMOR = [0, 0.15, 0.3, 0.45, 0.6];
  D.ARMOR_N = ['', 'Leather', 'Copper', 'Iron', 'Star'];

  const I = D.items = {
    wood: { n: 'Wood', e: '🪵', v: 1 }, stone: { n: 'Stone', e: '🪨', v: 1 }, fiber: { n: 'Fiber', e: '🌿', v: 1 },
    coal: { n: 'Coal', e: '⚫', v: 3 },
    copper_ore: { n: 'Copper Ore', e: '⬣', c: '#d0803c', v: 4 }, iron_ore: { n: 'Iron Ore', e: '⬣', c: '#d5d8e0', v: 7 },
    gold_ore: { n: 'Gold Ore', e: '⬣', c: '#f0c93a', v: 14 }, crystal: { n: 'Crystal', e: '💎', v: 25 },
    starmetal: { n: 'Starmetal', e: '🌠', v: 40 },
    copper_bar: { n: 'Copper Bar', e: '▰', c: '#d0803c', v: 12 }, iron_bar: { n: 'Iron Bar', e: '▰', c: '#d5d8e0', v: 20 },
    gold_bar: { n: 'Gold Bar', e: '▰', c: '#f0c93a', v: 40 }, star_bar: { n: 'Star Bar', e: '▰', c: '#7fe3ff', v: 120 },
    raw_meat: { n: 'Raw Meat', e: '🥩', food: 6, v: 2 }, cooked_meat: { n: 'Cooked Meat', e: '🍖', food: 40, v: 6 },
    berries: { n: 'Berries', e: '🍒', food: 10, v: 2 }, wheat: { n: 'Wheat', e: '🌾', v: 2 },
    bread: { n: 'Bread', e: '🍞', food: 30, v: 8 }, potion: { n: 'Health Potion', e: '🧪', food: 90, v: 15 },
    seeds: { n: 'Seeds', e: '🌰', place: 'wheat0', v: 1 }, sapling: { n: 'Sapling', e: '🌱', place: 'sapling', v: 2 },
    gel: { n: 'Slime Gel', e: '🟢', v: 3 }, bone: { n: 'Bone', e: '🦴', v: 4 }, hide: { n: 'Hide', e: '🟤', v: 5 },
    feather: { n: 'Feather', e: '🪶', v: 3 }, crown: { n: "Slime King's Crown", e: '👑', v: 600 },
    arrow: { n: 'Arrow', e: '➶', c: '#e8e8e8', v: 1 }, bow: { n: 'Bow', e: '🏹', v: 20, bow: 1 },
    wood_wall: { n: 'Wood Wall', e: '🟫', place: 'wood_wall', v: 1 }, stone_wall: { n: 'Stone Wall', e: '🧱', place: 'stone_wall', v: 1 },
    wood_floor: { n: 'Wood Floor', e: '🟧', floor: 6, v: 1 }, stone_floor: { n: 'Stone Floor', e: '⬜', floor: 7, v: 1 },
    door: { n: 'Door', e: '🚪', place: 'door', v: 3 }, torch: { n: 'Torch', e: '🕯️', place: 'torch', v: 1 },
    workbench: { n: 'Workbench', e: '🛠️', place: 'workbench', v: 5 }, furnace: { n: 'Furnace', e: '♨️', place: 'furnace', v: 10 },
    campfire: { n: 'Campfire', e: '🔥', place: 'campfire', v: 5 }, bed: { n: 'Bed', e: '🛏️', place: 'bed', v: 10 },
    flag: { n: 'Claim Flag', e: '🚩', place: 'flag', v: 50 }, lantern: { n: 'Crystal Lantern', e: '🏮', place: 'lantern', v: 30 },
  };
  for (let t = 1; t <= 5; t++) {
    I['pick' + t] = { n: D.TIERS[t] + ' Pickaxe', e: '⛏️', tool: 'pick', tier: t, v: t * t * 4 };
    I['axe' + t] = { n: D.TIERS[t] + ' Axe', e: '🪓', tool: 'axe', tier: t, v: t * t * 4 };
    I['sword' + t] = { n: D.TIERS[t] + ' Sword', e: '🗡️', tool: 'sword', tier: t, v: t * t * 4 };
  }
  for (let t = 1; t <= 4; t++) I['armor' + t] = { n: D.ARMOR_N[t] + ' Armor', e: '🛡️', tool: 'armor', tier: t, v: t * t * 10 };

  // Recipes: out, n (count), in (ingredients), st (station needed nearby)
  const R = D.recipes = [];
  const rc = (out, n, inp, st) => R.push({ out, n, in: inp, st: st || null });
  const toolMats = [null, { wood: 5 }, { wood: 3, stone: 6 }, { wood: 3, copper_bar: 4 }, { wood: 3, iron_bar: 5 }, { wood: 3, star_bar: 4, gold_bar: 2 }];
  rc('pick1', 1, toolMats[1]); rc('axe1', 1, toolMats[1]); rc('sword1', 1, { wood: 6 });
  rc('workbench', 1, { wood: 10 }); rc('campfire', 1, { wood: 8, stone: 4 });
  rc('torch', 4, { wood: 1, coal: 1 }); rc('wood_wall', 2, { wood: 2 }); rc('wood_floor', 4, { wood: 2 });
  for (let t = 2; t <= 5; t++) for (const k of ['pick', 'axe', 'sword']) rc(k + t, 1, toolMats[t], 'workbench');
  rc('furnace', 1, { stone: 20 }, 'workbench'); rc('stone_wall', 2, { stone: 2 }, 'workbench'); rc('stone_floor', 4, { stone: 2 }, 'workbench');
  rc('door', 1, { wood: 6 }, 'workbench'); rc('bed', 1, { wood: 10, fiber: 8 }, 'workbench');
  rc('bow', 1, { wood: 5, fiber: 6 }, 'workbench'); rc('arrow', 8, { wood: 2, stone: 1 }, 'workbench');
  rc('potion', 1, { berries: 3, gel: 1 }, 'workbench');
  rc('armor1', 1, { hide: 8 }, 'workbench'); rc('armor2', 1, { copper_bar: 10 }, 'workbench');
  rc('armor3', 1, { iron_bar: 12 }, 'workbench'); rc('armor4', 1, { star_bar: 8, gold_bar: 4 }, 'workbench');
  rc('flag', 1, { wood: 10, fiber: 10, copper_bar: 5 }, 'workbench'); rc('lantern', 1, { crystal: 1, iron_bar: 2 }, 'workbench');
  rc('copper_bar', 1, { copper_ore: 2, coal: 1 }, 'furnace'); rc('iron_bar', 1, { iron_ore: 2, coal: 1 }, 'furnace');
  rc('gold_bar', 1, { gold_ore: 2, coal: 1 }, 'furnace'); rc('star_bar', 1, { starmetal: 2, crystal: 1, coal: 2 }, 'furnace');
  rc('cooked_meat', 1, { raw_meat: 1 }, 'campfire'); rc('bread', 1, { wheat: 3 }, 'campfire');

  D.shop = { seeds: 5, sapling: 10, torch: 8, arrow: 3, potion: 40, bread: 20, flag: 200, bed: 60 };

  D.mobs = {
    slime: { n: 'Slime', hp: 20, dmg: 5, spd: 1.7, xp: 8, aggro: 5, coins: [1, 3], drops: [['gel', 1, 2, 0.8]] },
    chicken: { n: 'Chicken', hp: 8, dmg: 0, spd: 2.4, xp: 3, passive: 1, coins: [0, 0], drops: [['raw_meat', 1, 1, 1], ['feather', 1, 2, 0.7]] },
    boar: { n: 'Boar', hp: 35, dmg: 8, spd: 2.6, xp: 14, aggro: 3.5, coins: [2, 5], drops: [['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.6]] },
    scorpion: { n: 'Scorpion', hp: 45, dmg: 11, spd: 2.8, xp: 20, aggro: 6, coins: [4, 8], drops: [['hide', 1, 1, 0.4], ['gold_ore', 1, 1, 0.08]] },
    wolf: { n: 'Wolf', hp: 55, dmg: 13, spd: 3.4, xp: 26, aggro: 8, coins: [4, 9], drops: [['hide', 1, 2, 0.9], ['raw_meat', 1, 1, 0.6]] },
    skeleton: { n: 'Skeleton', hp: 60, dmg: 14, spd: 2.5, xp: 30, aggro: 8, coins: [5, 12], drops: [['bone', 1, 3, 1], ['arrow', 2, 6, 0.5]] },
    golem: { n: 'Golem', hp: 150, dmg: 24, spd: 1.5, xp: 75, aggro: 6, size: 1.4, coins: [12, 25], drops: [['stone', 3, 6, 1], ['iron_ore', 1, 3, 0.7], ['gold_ore', 1, 2, 0.3], ['crystal', 1, 1, 0.1]] },
    wraith: { n: 'Star Wraith', hp: 200, dmg: 26, spd: 3.0, xp: 110, aggro: 9, coins: [15, 30], drops: [['starmetal', 1, 2, 0.6], ['crystal', 1, 1, 0.3]], event: 1 },
    king: { n: 'Slime King', hp: 700, dmg: 30, spd: 2.1, xp: 450, aggro: 12, size: 3, coins: [120, 200], drops: [['gel', 8, 15, 1], ['gold_bar', 2, 4, 1], ['potion', 2, 3, 1], ['crown', 1, 1, 0.25]], boss: 1, event: 1 },
  };

  D.SKILLS = { mine: 'Mining', wood: 'Woodcutting', combat: 'Combat', farm: 'Farming' };
  D.levelFor = xp => Math.min(60, Math.floor(Math.sqrt((xp || 0) / 25)) + 1);
  D.xpFor = lvl => 25 * (lvl - 1) * (lvl - 1);
  D.totalLevel = sk => Object.keys(D.SKILLS).reduce((a, k) => a + D.levelFor(sk[k]), 0);
  D.maxHp = sk => 100 + 6 * (D.levelFor(sk.combat) - 1);
  D.best = (inv, kind) => { for (let t = 5; t >= 1; t--) if (inv[kind + t]) return t; return 0; };

  // 0 = full day, 1 = full night
  D.darkness = clock => {
    const p = (clock % D.DAY_LEN) / D.DAY_LEN;
    if (p < 0.58) return 0; if (p < 0.66) return (p - 0.58) / 0.08;
    if (p < 0.94) return 1; return (1 - p) / 0.06;
  };

  D.solid = (map, tx, ty, mob) => {
    if (tx < 0 || ty < 0 || tx >= D.W || ty >= D.H) return true;
    const i = ty * D.W + tx;
    if (!D.grounds[map.g[i]].walk) return true;
    const d = D.objs[map.o[i]];
    return !!(d.solid || (mob && d.mobBlock));
  };
  D.blockedAt = (map, x, y, r, mob) =>
    D.solid(map, Math.floor(x - r), Math.floor(y - r), mob) || D.solid(map, Math.floor(x + r), Math.floor(y - r), mob) ||
    D.solid(map, Math.floor(x - r), Math.floor(y + r), mob) || D.solid(map, Math.floor(x + r), Math.floor(y + r), mob);

  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.SBDefs = D;
})(typeof window !== 'undefined' ? window : globalThis);
