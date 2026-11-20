'use strict';
// ============================================================================
//  AETHERWILD — game data: items, tools, recipes, building tiers, species
// ============================================================================
(function () {
  const G = window.G;

  // gather power per node type. 0 = this tool cannot harvest it.
  const HAND = { tree: 1, rock: 1, bush: 2, iron: 0, aether: 0, void: 0 };

  G.ITEMS = {
    // ---- resources
    wood: { name: 'Wood', type: 'res', stack: 100, desc: 'Sturdy timber. The backbone of every early base.' },
    stone: { name: 'Stone', type: 'res', stack: 100, desc: 'Chunks of granite.' },
    fiber: { name: 'Plant Fiber', type: 'res', stack: 100, desc: 'Tough fibres for bindings and bedding.' },
    berries: { name: 'Sunberries', type: 'food', stack: 50, food: 8, water: 3, desc: 'Sweet berries. Herbivores adore them. +8 food' },
    iron_ore: { name: 'Iron Ore', type: 'res', stack: 100, desc: 'Rust-flecked ore. Smelt in a furnace.' },
    iron_ingot: { name: 'Iron Ingot', type: 'res', stack: 100, desc: 'Refined iron for metal tools and walls.' },
    aetherite: { name: 'Aetherite Shard', type: 'res', stack: 100, desc: 'A crystal humming with captured sky-light. Found in the Aether Glade.' },
    aether_alloy: { name: 'Aether Alloy', type: 'res', stack: 100, desc: 'Iron fused with aetherite. Light as wood, harder than steel, softly glowing.' },
    void_crystal: { name: 'Void Crystal', type: 'res', stack: 50, desc: 'A crystal that swallows light. Grows on the highest peaks, or in the hearts of Dreadmaws.' },
    voidglass: { name: 'Voidglass', type: 'res', stack: 50, desc: 'Impossible black glass, almost indestructible.' },
    raw_meat: { name: 'Raw Meat', type: 'food', stack: 40, food: 10, hurt: 6, desc: 'Edible, but risky raw. Carnivores love it. +10 food' },
    cooked_meat: { name: 'Cooked Meat', type: 'food', stack: 40, food: 32, desc: 'Hearty and safe. +32 food' },
    hide: { name: 'Hide', type: 'res', stack: 100, desc: 'Thick dinosaur hide.' },
    salve: { name: 'Herbal Salve', type: 'food', stack: 20, heal: 35, desc: 'Restores 35 health.' },
    // ---- tools & weapons
    stone_axe: { name: 'Stone Axe', type: 'tool', stack: 1, dur: 140, dmg: 12, speed: 0.55, gather: { tree: 4, rock: 1, bush: 2, iron: 0, aether: 0, void: 0 }, desc: 'Chops trees far faster than bare hands.' },
    stone_pick: { name: 'Stone Pickaxe', type: 'tool', stack: 1, dur: 140, dmg: 10, speed: 0.6, gather: { tree: 1, rock: 4, bush: 1, iron: 2, aether: 0, void: 0 }, desc: 'Breaks rock and can mine iron.' },
    club: { name: 'Knockout Club', type: 'tool', stack: 1, dur: 160, dmg: 7, torpor: 26, speed: 0.6, gather: HAND, desc: 'Heavy club. Builds up torpor to knock out aggressive dinos for taming.' },
    stone_spear: { name: 'Stone Spear', type: 'tool', stack: 1, dur: 150, dmg: 24, reach: 5.2, speed: 0.7, gather: HAND, desc: 'Long reach hunting spear.' },
    torch: { name: 'Torch', type: 'tool', stack: 1, dur: 0, dmg: 5, speed: 0.6, light: true, gather: HAND, desc: 'Lights the night. Hold to use.' },
    iron_axe: { name: 'Iron Axe', type: 'tool', stack: 1, dur: 320, dmg: 22, speed: 0.5, gather: { tree: 8, rock: 1, bush: 3, iron: 0, aether: 0, void: 0 }, desc: 'A proper woodsman\'s axe.' },
    iron_pick: { name: 'Iron Pickaxe', type: 'tool', stack: 1, dur: 320, dmg: 17, speed: 0.55, gather: { tree: 1, rock: 7, bush: 1, iron: 5, aether: 2, void: 0 }, desc: 'Can mine Aetherite.' },
    iron_sword: { name: 'Iron Sword', type: 'tool', stack: 1, dur: 360, dmg: 40, speed: 0.48, gather: HAND, desc: 'Reliable steel.' },
    aether_axe: { name: 'Aether Axe', type: 'tool', stack: 1, dur: 900, dmg: 34, speed: 0.42, gather: { tree: 14, rock: 2, bush: 4, iron: 0, aether: 0, void: 0 }, desc: 'Fells trees in a few humming strokes.' },
    aether_pick: { name: 'Aether Pickaxe', type: 'tool', stack: 1, dur: 900, dmg: 26, speed: 0.45, gather: { tree: 2, rock: 12, bush: 1, iron: 9, aether: 5, void: 3 }, desc: 'Can mine Void Crystal.' },
    aether_blade: { name: 'Aether Blade', type: 'tool', stack: 1, dur: 1000, dmg: 70, speed: 0.42, gather: HAND, desc: 'A glowing sword of crystal-alloy.' },
    void_blade: { name: 'Void Reaver', type: 'tool', stack: 1, dur: 2400, dmg: 130, speed: 0.4, torpor: 10, gather: HAND, desc: 'Darkness given an edge. The apex weapon.' },
    // ---- misc
    saddle: { name: 'Saddle', type: 'misc', stack: 5, desc: 'Keep one in your inventory to ride tamed Trikeros, Stegoliths, Razorclaws and Dreadmaws.' },
    // ---- placeables
    campfire: { name: 'Campfire', type: 'place', stack: 5, desc: 'Cook meat. Light and safety.' },
    workbench: { name: 'Workbench', type: 'place', stack: 5, desc: 'Unlocks advanced crafting.' },
    furnace: { name: 'Furnace', type: 'place', stack: 5, desc: 'Smelts iron ore into ingots.' },
    forge: { name: 'Aether Forge', type: 'place', stack: 5, desc: 'Fuses aetherite and void crystal into exotic materials.' },
    chest: { name: 'Storage Chest', type: 'place', stack: 5, desc: '24 slots of safe storage.' },
    bed: { name: 'Bed', type: 'place', stack: 5, desc: 'Sleep to set your respawn point.' },
    lantern: { name: 'Aether Lantern', type: 'place', stack: 10, desc: 'A crystal lamp that never goes out.' },
  };
  for (const k in G.ITEMS) G.ITEMS[k].id = k;
  G.HAND = { name: 'Hands', dmg: 6, torpor: 3, speed: 0.5, gather: HAND };

  // ---- crafting. station: null (anywhere) | workbench | campfire | furnace | forge
  G.RECIPES = [
    { out: 'stone_axe', cost: { wood: 5, stone: 5, fiber: 3 } },
    { out: 'stone_pick', cost: { wood: 5, stone: 6, fiber: 3 } },
    { out: 'club', cost: { wood: 8, fiber: 3 } },
    { out: 'torch', cost: { wood: 2, fiber: 2 } },
    { out: 'salve', cost: { fiber: 5, berries: 3 } },
    { out: 'campfire', cost: { wood: 8, stone: 6 } },
    { out: 'workbench', cost: { wood: 20, stone: 10 } },
    { out: 'stone_spear', cost: { wood: 8, stone: 4, fiber: 4 }, station: 'workbench' },
    { out: 'chest', cost: { wood: 25, stone: 4 }, station: 'workbench' },
    { out: 'bed', cost: { wood: 15, fiber: 15, hide: 4 }, station: 'workbench' },
    { out: 'furnace', cost: { stone: 35, wood: 10 }, station: 'workbench' },
    { out: 'saddle', cost: { hide: 12, fiber: 10, iron_ingot: 3 }, station: 'workbench' },
    { out: 'cooked_meat', cost: { raw_meat: 1 }, station: 'campfire' },
    { out: 'iron_ingot', cost: { iron_ore: 2, wood: 1 }, station: 'furnace' },
    { out: 'iron_axe', cost: { iron_ingot: 4, wood: 4 }, station: 'workbench' },
    { out: 'iron_pick', cost: { iron_ingot: 4, wood: 4 }, station: 'workbench' },
    { out: 'iron_sword', cost: { iron_ingot: 6, hide: 2 }, station: 'workbench' },
    { out: 'forge', cost: { iron_ingot: 20, stone: 30, aetherite: 10 }, station: 'workbench' },
    { out: 'aether_alloy', cost: { aetherite: 2, iron_ingot: 1 }, station: 'forge' },
    { out: 'lantern', cost: { aether_alloy: 1, aetherite: 2 }, station: 'forge' },
    { out: 'aether_axe', cost: { aether_alloy: 5, iron_ingot: 2 }, station: 'forge' },
    { out: 'aether_pick', cost: { aether_alloy: 5, iron_ingot: 2 }, station: 'forge' },
    { out: 'aether_blade', cost: { aether_alloy: 7, hide: 2 }, station: 'forge' },
    { out: 'voidglass', cost: { void_crystal: 2, aether_alloy: 1 }, station: 'forge' },
    { out: 'void_blade', cost: { voidglass: 5, aether_alloy: 4 }, station: 'forge' },
  ];
  G.STATIONS = { workbench: 'Workbench', campfire: 'Campfire', furnace: 'Furnace', forge: 'Aether Forge' };

  // ---- building tiers (upgrade path)
  G.TIERS = [
    { id: 'wood', name: 'Wood', hp: 300, cost: { wood: 10 }, color: '#b9874f' },
    { id: 'stone', name: 'Stone', hp: 900, cost: { stone: 12, wood: 2 }, color: '#9aa0a6' },
    { id: 'metal', name: 'Metal', hp: 2400, cost: { iron_ingot: 5, stone: 4 }, color: '#7f8c99' },
    { id: 'aether', name: 'Aetherium', hp: 6000, cost: { aether_alloy: 4, iron_ingot: 3 }, color: '#4ff0e0' },
    { id: 'void', name: 'Voidglass', hp: 15000, cost: { voidglass: 3, aether_alloy: 2 }, color: '#b04dff' },
  ];
  G.PIECES = {
    foundation: { name: 'Foundation', mult: 1.5 },
    wall: { name: 'Wall', mult: 1 },
    doorway: { name: 'Doorway', mult: 0.9 },
    window: { name: 'Window Wall', mult: 0.9 },
    floor: { name: 'Floor / Roof', mult: 0.8 },
    stairs: { name: 'Stairs', mult: 1 },
    door: { name: 'Door', mult: 0.6 },
  };
  G.pieceCost = function (kind, tier) {
    const base = G.TIERS[tier].cost, m = G.PIECES[kind].mult, out = {};
    for (const k in base) out[k] = Math.max(1, Math.ceil(base[k] * m));
    return out;
  };

  // ---- resource nodes
  G.NODES = {
    tree: { name: 'Tree', hp: 40, res: 'wood', bonus: null, color: 0x8a5a33 },
    rock: { name: 'Boulder', hp: 40, res: 'stone', bonus: null, color: 0x8f9296 },
    bush: { name: 'Sunberry Bush', hp: 10, res: 'fiber', bonus: 'berries', color: 0x4f8a3a },
    iron: { name: 'Iron Deposit', hp: 36, res: 'iron_ore', bonus: 'stone', color: 0xb5643a, need: 'Stone Pickaxe' },
    aether: { name: 'Aetherite Cluster', hp: 30, res: 'aetherite', bonus: null, color: 0x4ff0e0, need: 'Iron Pickaxe' },
    void: { name: 'Void Crystal', hp: 24, res: 'void_crystal', bonus: null, color: 0xb04dff, need: 'Aether Pickaxe' },
  };

  // ---- creatures
  // temper: passive (never fights, flees when hurt), shy (flees on sight),
  //         neutral (fights back), aggressive (hunts you)
  G.SPECIES = {
    trikeros: {
      name: 'Trikeros', temper: 'neutral', diet: 'Herbivore', hp: 420, speed: 2.4, run: 7.5, turn: 1.6, dmg: 26, reach: 3.6,
      tame: 'feed', food: ['berries'], need: 8, ride: true, rideSpeed: 9.5, seat: 3.0, loot: { raw_meat: 7, hide: 6 },
      count: 9, r: 1.7, scale: 1.0, hint: 'Feed it Sunberries. It will fight back if provoked.'
    },
    stegolith: {
      name: 'Stegolith', temper: 'passive', diet: 'Herbivore', hp: 380, speed: 1.9, run: 5.5, turn: 1.2, dmg: 30, reach: 4.0,
      tame: 'feed', food: ['berries'], need: 6, ride: true, rideSpeed: 7.5, seat: 3.4, loot: { raw_meat: 7, hide: 7 },
      count: 8, r: 1.9, scale: 1.0, hint: 'Gentle giant. Feed it Sunberries.'
    },
    skitter: {
      name: 'Skitterbeak', temper: 'shy', diet: 'Herbivore', hp: 70, speed: 2.8, run: 11, turn: 3.2, dmg: 4, reach: 1.6,
      tame: 'feed', food: ['berries'], need: 3, ride: false, seat: 1.4, loot: { raw_meat: 2, hide: 1 },
      count: 14, r: 0.7, scale: 1.0, hint: 'Skittish. Crouch [C] and sneak up to feed it.'
    },
    razorclaw: {
      name: 'Razorclaw', temper: 'aggressive', diet: 'Carnivore', hp: 150, speed: 3.6, run: 9.6, turn: 3.6, dmg: 11, reach: 2.2,
      tame: 'ko', food: ['raw_meat', 'cooked_meat'], need: 4, torpor: 90, ride: true, rideSpeed: 12.5, seat: 1.65,
      loot: { raw_meat: 4, hide: 3 }, count: 9, pack: 3, aggro: 24, r: 0.9, scale: 1.0, hint: 'Knock out with a Club, then feed meat.'
    },
    dreadmaw: {
      name: 'Dreadmaw', temper: 'aggressive', diet: 'Carnivore', hp: 1700, speed: 2.8, run: 7.8, turn: 1.4, dmg: 42, reach: 5.2,
      tame: 'ko', food: ['raw_meat', 'cooked_meat'], need: 10, torpor: 420, ride: true, rideSpeed: 10.5, seat: 4.6, breaker: true,
      loot: { raw_meat: 20, hide: 14, void_crystal: 3 }, count: 3, aggro: 34, r: 2.6, scale: 1.0, hint: 'Apex predator. Smashes weak walls. Knock out, then feed meat.'
    },
  };

  G.OBJECTIVES = [
    { text: 'Punch a tree to gather 10 Wood', done: () => G.inv.count('wood') >= 10 || G.stats.crafted.stone_axe },
    { text: 'Craft a Stone Axe and Stone Pickaxe [Tab]', done: () => G.stats.crafted.stone_axe && G.stats.crafted.stone_pick },
    { text: 'Build a Foundation [B]', done: () => G.stats.built.foundation > 0 },
    { text: 'Build walls, a doorway and a roof for your home', done: () => G.stats.built.wall + G.stats.built.doorway >= 3 && G.stats.built.floor > 0 },
    { text: 'Craft a Workbench and place it', done: () => G.stats.placed.workbench },
    { text: 'Tame a dinosaur (feed herbivores Sunberries)', done: () => G.stats.tamed > 0 },
    { text: 'Build a Furnace and smelt Iron Ingots', done: () => G.stats.crafted.iron_ingot },
    { text: 'Upgrade a wall to Stone or better [U]', done: () => G.stats.upgraded > 0 },
    { text: 'Mine Aetherite in the glowing Aether Glade (Iron Pickaxe)', done: () => G.stats.got.aetherite },
    { text: 'Build the Aether Forge and make Aether Alloy', done: () => G.stats.crafted.aether_alloy },
    { text: 'Obtain Void Crystal (mountain peaks or a Dreadmaw)', done: () => G.stats.got.void_crystal },
    { text: 'Forge Voidglass and build a Voidglass wall', done: () => G.stats.voidBuilt },
    { text: 'Tame a Dreadmaw. You rule the island.', done: () => G.stats.tamedRex },
  ];
})();
