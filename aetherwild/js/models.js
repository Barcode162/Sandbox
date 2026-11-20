'use strict';
// ============================================================================
//  AETHERWILD — procedural model library (one art style for everything)
// ============================================================================
(function () {
  const G = window.G;
  const geo = G.geo;
  const PI = Math.PI;

  const C = G.PAL = {
    woodL: 0xb9874f, wood: 0x9a6a3c, woodD: 0x6b4426, bark: 0x6e4b2e,
    stone: 0x9aa0a6, stoneD: 0x6f757b, stoneL: 0xb4b9bd,
    iron: 0x8d969e, ironD: 0x5a6269, ironL: 0xb7c0c7, rust: 0xb86a3c,
    aGlow: 0x4ff0e0, aPale: 0xdbe7ea, aPanel: 0x9fd6d0, aCrys: 0x6fe3d6,
    vGlow: 0xb04dff, vDark: 0x1d1727, vGlass: 0x3d2a5c, vCrys: 0x4a2f72,
    hide: 0xa47a52, hideD: 0x7d5a3a, fiber: 0x9bb35e, leaf: 0x5d9440, leafD: 0x467a3a,
    flameO: 0xff8a2a, flameY: 0xffd35a, cream: 0xe2d2ae, black: 0x181818, bone: 0xe6dcc0,
  };

  // tier styles shared by every building piece
  const TS = [
    { main: C.woodL, dark: C.woodD, mat: 'std', fmat: 'std' },
    { main: C.stone, dark: C.stoneD, mat: 'std', fmat: 'std' },
    { main: C.iron, dark: C.ironD, mat: 'metal', fmat: 'metal' },
    { main: C.aPanel, dark: C.aPale, mat: 'std', fmat: 'metal', glow: C.aGlow },
    { main: C.vGlass, dark: C.vDark, mat: 'glass', fmat: 'metal', glow: C.vGlow },
  ];
  G.TIERSTYLE = TS;

  const M4 = () => new THREE.Matrix4();

  // ------------------------------------------------------------------------
  // Panel filler: fills rectangle u∈[x0,x1], v∈[y0,y1] (thickness T on z)
  // with the tier's surface pattern. m: transform from panel space.
  // ------------------------------------------------------------------------
  function fill(b, tier, x0, x1, y0, y1, T, m, horizontal) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const s = TS[tier];
    if (tier === 0) { // planks
      const ph = 0.3; const rows = Math.max(1, Math.round(h / ph)); const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        const c = (r % 2) ? C.woodL : C.wood;
        b.box(w, rh * 0.94, T * (0.9 + 0.1 * b.rnd()), c, { p: [cx, y0 + rh * (r + 0.5), (b.rnd() - 0.5) * 0.02], m, j: 0.08 });
      }
    } else if (tier === 1) { // bricks
      b.box(w, h, T * 0.8, C.stoneD, { p: [cx, cy, 0], m });
      const bh = 0.5; const rows = Math.max(1, Math.round(h / bh)); const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let u = x0 - ((r % 2) ? 0.375 : 0);
        while (u < x1 - 0.01) {
          const a = Math.max(u, x0), e = Math.min(u + 0.75, x1);
          if (e - a > 0.08) b.box(e - a - 0.05, rh - 0.06, T * (0.96 + b.rnd() * 0.12), C.stone, { p: [(a + e) / 2, y0 + rh * (r + 0.5), 0], m, j: 0.14 });
          u += 0.75;
        }
      }
    } else if (tier === 2) { // riveted plate
      b.box(w, h, T * 0.86, C.iron, { p: [cx, cy, 0], m, mat: 'metal', j: 0.03 });
      const bands = [y0 + 0.09, y1 - 0.09]; if (h > 1.6) bands.push(cy);
      for (const by of bands) {
        b.box(w, 0.16, T, C.ironD, { p: [cx, by, 0], m, mat: 'metal' });
        for (let u = x0 + 0.2; u < x1 - 0.1; u += 0.5) {
          b.box(0.06, 0.06, T + 0.04, C.ironL, { p: [u, by, 0], m, mat: 'metal' });
        }
      }
      if (w > 1.2) for (let u = x0 + 1; u < x1 - 0.3; u += 1) b.box(0.08, h, T * 0.95, C.ironD, { p: [u, cy, 0], m, mat: 'metal' });
    } else if (tier === 3) { // aetherium
      b.box(w, h, T * 0.8, C.aPanel, { p: [cx, cy, 0], m, j: 0.04 });
      for (const fy of [y0 + 0.07, y1 - 0.07]) b.box(w, 0.14, T, C.aPale, { p: [cx, fy, 0], m, mat: 'metal' });
      for (const fx of [x0 + 0.07, x1 - 0.07]) b.box(0.14, h, T, C.aPale, { p: [fx, cy, 0], m, mat: 'metal' });
      const lines = Math.max(1, Math.floor(h / 0.9));
      for (let i = 1; i <= lines; i++) {
        const ly = y0 + (h * i) / (lines + 1);
        b.box(w - 0.3, 0.05, T * 0.8 + 0.03, C.aGlow, { p: [cx, ly, 0], m, mat: 'glow' });
      }
    } else { // voidglass
      if (horizontal) {
        b.box(w, h, T * 0.9, C.vDark, { p: [cx, cy, 0], m, mat: 'metal', j: 0.04 });
        for (let u = x0 + 0.75; u < x1 - 0.2; u += 0.75) b.box(0.035, h - 0.1, T * 0.9 + 0.02, C.vGlow, { p: [u, cy, 0], m, mat: 'glow' });
      } else {
        b.box(w - 0.1, h - 0.1, T * 0.45, C.vGlass, { p: [cx, cy, 0], m, mat: 'glass' });
      }
      for (const fy of [y0 + 0.08, y1 - 0.08]) b.box(w, 0.16, T, C.vDark, { p: [cx, fy, 0], m, mat: 'metal' });
      for (const fx of [x0 + 0.08, x1 - 0.08]) b.box(0.16, h, T, C.vDark, { p: [fx, cy, 0], m, mat: 'metal' });
      for (const fy of [y0 + 0.18, y1 - 0.18]) b.box(w - 0.3, 0.03, T + 0.02, C.vGlow, { p: [cx, fy, 0], m, mat: 'glow' });
      for (const fx of [x0 + 0.18, x1 - 0.18]) b.box(0.03, h - 0.3, T + 0.02, C.vGlow, { p: [fx, cy, 0], m, mat: 'glow' });
    }
  }

  function posts(b, tier, T) {
    const s = TS[tier];
    for (const x of [-1.41, 1.41]) b.box(0.2, 3, T + 0.08, s.dark, { p: [x, 1.5, 0], mat: s.fmat, j: 0.05 });
    if (tier === 0) b.box(3, 0.2, T + 0.06, C.woodD, { p: [0, 2.9, 0], j: 0.05 });
  }

  const pieceCache = {};
  G.Models = {
    TS,
    piece(kind, tier) {
      const key = kind + tier;
      if (!pieceCache[key]) pieceCache[key] = buildPiece(kind, tier);
      const g = pieceCache[key].clone();
      // the skirt must not share scale with other clones (clone() deep-copies Object3D, shares geometry)
      return g;
    },
  };

  function buildPiece(kind, tier) {
    const T = 0.3; const s = TS[tier];
    const grp = new THREE.Group();
    if (kind === 'wall' || kind === 'doorway' || kind === 'window') {
      const b = new G.Builder(11 + tier);
      if (kind === 'wall') fill(b, tier, -1.5, 1.5, 0, 3, T);
      else if (kind === 'doorway') {
        fill(b, tier, -1.5, -0.6, 0, 3, T); fill(b, tier, 0.6, 1.5, 0, 3, T); fill(b, tier, -0.6, 0.6, 2.2, 3, T);
        b.box(1.3, 0.12, T + 0.1, s.dark, { p: [0, 2.2, 0], mat: s.fmat });
      } else {
        fill(b, tier, -1.5, -0.6, 0, 3, T); fill(b, tier, 0.6, 1.5, 0, 3, T);
        fill(b, tier, -0.6, 0.6, 0, 1.2, T); fill(b, tier, -0.6, 0.6, 2.2, 3, T);
        b.box(1.4, 0.1, T + 0.16, s.dark, { p: [0, 1.2, 0], mat: s.fmat });
        b.box(1.3, 0.1, T + 0.1, s.dark, { p: [0, 2.2, 0], mat: s.fmat });
        b.box(0.06, 1.0, 0.06, s.dark, { p: [0, 1.7, 0], mat: s.fmat });
        b.box(1.2, 0.06, 0.06, s.dark, { p: [0, 1.7, 0], mat: s.fmat });
      }
      posts(b, tier, T);
      grp.add(b.build());
    } else if (kind === 'floor' || kind === 'foundation') {
      const b = new G.Builder(21 + tier);
      const th = kind === 'floor' ? 0.25 : 0.32;
      const m = M4().makeRotationX(-PI / 2).premultiply(M4().makeTranslation(0, -th / 2, 0));
      fill(b, tier, -1.5, 1.5, -1.5, 1.5, th, m, true);
      if (kind === 'floor') {
        for (const z of [-1.42, 1.42]) b.box(3, 0.32, 0.16, s.dark, { p: [0, -0.2, z], mat: s.fmat });
      }
      grp.add(b.build());
      if (kind === 'foundation') {
        const k = new G.Builder(31 + tier);
        const body = tier === 0 ? C.woodD : tier === 1 ? C.stoneD : tier === 2 ? C.ironD : tier === 3 ? C.aPale : C.vDark;
        const bm = tier >= 2 ? 'metal' : 'std';
        k.box(2.8, 1, 2.8, body, { p: [0, -0.5, 0], mat: bm, j: 0.05 });
        for (const x of [-1.3, 1.3]) for (const z of [-1.3, 1.3]) k.box(0.45, 1, 0.45, s.dark, { p: [x, -0.5, z], mat: s.fmat, j: 0.06 });
        if (s.glow) for (const x of [-1.3, 1.3]) for (const z of [-1.3, 1.3]) k.box(0.47, 0.04, 0.47, s.glow, { p: [x, -0.2, z], mat: 'glow' });
        const skirt = k.build(); skirt.name = 'skirt'; skirt.position.y = -0.3;
        grp.add(skirt);
      }
    } else if (kind === 'stairs') {
      const b = new G.Builder(41 + tier);
      const sm = s.mat === 'glass' ? 'metal' : s.mat; const sc = s.mat === 'glass' ? C.vDark : s.main;
      for (let i = 0; i < 6; i++) {
        const hgt = (i + 1) * 0.5;
        b.box(2.5, hgt, 0.5, sc, { p: [0, hgt / 2, -1.25 + i * 0.5], mat: sm, j: 0.08 });
        if (s.glow) b.box(2.5, 0.03, 0.04, s.glow, { p: [0, hgt + 0.005, -1.25 + i * 0.5 + 0.23], mat: 'glow' });
      }
      for (const x of [-1.33, 1.33]) {
        const m = M4().makeRotationX(-Math.atan2(3, 3));
        b.box(0.16, 0.35, 4.2, s.dark, { p: [x, 1.5, 0], r: [-PI / 4, 0, 0], mat: s.fmat });
      }
      grp.add(b.build());
    } else if (kind === 'door') {
      const b = new G.Builder(51 + tier);
      const m = M4().makeTranslation(0.58, 0, 0);
      fill(b, tier, -0.57, 0.57, 0.02, 2.18, 0.12, m);
      b.box(0.08, 0.08, 0.26, tier >= 2 ? C.ironL : C.ironD, { p: [1.0, 1.05, 0], mat: 'metal' });
      if (tier === 0) for (const y of [0.4, 1.8]) b.box(1.14, 0.14, 0.16, C.woodD, { p: [0.58, y, 0] });
      const panel = b.build(); panel.name = 'panel';
      const hinge = new THREE.Group(); hinge.name = 'hinge'; hinge.position.x = -0.58; hinge.add(panel);
      grp.add(hinge);
    }
    return grp;
  }

  // ------------------------------------------------------------------ items
  function handle(b, len, c, r) { b.add(geo.cyl(r || 0.035, (r || 0.035) * 1.15, 6), c || C.woodD, { p: [0, len / 2, 0], s: [1, len, 1], j: 0.06 }); }
  function headStyle(t) {
    return [
      { c: C.stoneD, mat: 'std' }, { c: C.iron, mat: 'metal', edge: C.ironL },
      { c: C.aPale, mat: 'metal', glow: C.aGlow }, { c: C.vDark, mat: 'metal', glow: C.vGlow },
    ][t];
  }
  function axe(t) {
    const b = new G.Builder(60 + t); const h = headStyle(t);
    handle(b, 0.8); b.add(geo.cyl(0.045, 0.045, 6), C.fiber, { p: [0, 0.64, 0], s: [1, 0.12, 1] });
    b.box(0.28, 0.18, 0.06, h.c, { p: [0.1, 0.66, 0], mat: h.mat, j: 0.1 });
    b.box(0.06, 0.24, 0.05, h.edge || h.c, { p: [0.25, 0.66, 0], mat: h.mat });
    if (h.glow) b.box(0.03, 0.22, 0.07, h.glow, { p: [0.27, 0.66, 0], mat: 'glow' });
    return b;
  }
  function pick(t) {
    const b = new G.Builder(70 + t); const h = headStyle(t);
    handle(b, 0.8);
    b.box(0.42, 0.07, 0.07, h.c, { p: [0, 0.72, 0], mat: h.mat, j: 0.1 });
    for (const sx of [-1, 1]) b.add(geo.cone(4), h.edge || h.c, { p: [sx * 0.27, 0.69, 0], r: [0, 0, sx * (PI / 2 + 0.25)], s: [0.08, 0.16, 0.08], mat: h.mat });
    if (h.glow) b.box(0.3, 0.02, 0.08, h.glow, { p: [0, 0.75, 0], mat: 'glow' });
    return b;
  }
  function sword(t) {
    const b = new G.Builder(80 + t); const h = headStyle(t);
    handle(b, 0.2, C.hideD, 0.03);
    b.box(0.26, 0.04, 0.06, t === 3 ? C.vGlow : C.ironD, { p: [0, 0.21, 0], mat: t === 3 ? 'glow' : 'metal' });
    const bc = t === 3 ? C.vGlass : h.c, bm = t === 3 ? 'voidc' : (t === 2 ? 'aeth' : 'metal');
    b.box(0.07, 0.72, 0.02, t === 2 ? C.aCrys : bc, { p: [0, 0.6, 0], mat: bm });
    b.add(geo.cone(4), t === 2 ? C.aCrys : bc, { p: [0, 1.01, 0], r: [0, PI / 4, 0], s: [0.1, 0.12, 0.03], mat: bm });
    if (h.glow) b.box(0.015, 0.7, 0.03, h.glow, { p: [0, 0.6, 0], mat: 'glow' });
    b.add(geo.ico0, t >= 2 ? h.glow : C.ironL, { p: [0, -0.02, 0], s: 0.06, mat: t >= 2 ? 'glow' : 'metal' });
    return b;
  }
  function itemBuilder(id) {
    let b = new G.Builder(id.length * 7 + 3);
    switch (id) {
      case 'wood':
        for (const [x, y, r] of [[-0.12, 0, 0.2], [0.12, 0, -0.2], [0, 0.17, 0]]) {
          b.add(geo.cyl(0.1, 0.1, 7), C.bark, { p: [x, y, 0], r: [PI / 2, r, 0], s: [1, 0.6, 1], j: 0.08 });
          b.add(geo.cyl(0.08, 0.08, 7), C.woodL, { p: [x, y, 0.301], r: [PI / 2, r, 0], s: [1, 0.01, 1] });
        } break;
      case 'stone': b.add(geo.dode, C.stone, { s: [0.5, 0.36, 0.42], j: 0.15 }); b.add(geo.dode, C.stoneD, { p: [0.22, -0.06, 0.1], s: 0.22, j: 0.1 }); break;
      case 'fiber':
        for (let i = 0; i < 9; i++) b.add(geo.cyl(0.012, 0.02, 4), i % 2 ? C.fiber : C.leaf, { p: [(i - 4) * 0.022, 0, (i % 3 - 1) * 0.02], r: [0, 0, (i - 4) * 0.06], s: [1, 0.7, 1] });
        b.add(geo.cyl(0.07, 0.07, 6), C.hideD, { s: [1, 0.06, 1] }); break;
      case 'berries':
        for (let i = 0; i < 7; i++) { const a = i * 2.4; b.add(geo.ico1, i % 2 ? 0xd8394c : 0xb02a48, { p: [Math.cos(a) * 0.1 * (i > 0), (i % 3) * 0.05, Math.sin(a) * 0.1 * (i > 0)], s: 0.13 }); }
        b.add(geo.cone(3), C.leaf, { p: [0, 0.16, 0], r: [0.5, 0, 0.8], s: [0.12, 0.2, 0.03] }); break;
      case 'iron_ore':
        b.add(geo.dode, C.stoneD, { s: [0.5, 0.38, 0.44], j: 0.12 });
        for (const p of [[0.12, 0.12, 0.12], [-0.15, 0.05, 0.14], [0.05, 0.17, -0.1]]) b.add(geo.octa, C.rust, { p, s: 0.13, mat: 'metal' }); break;
      case 'iron_ingot':
        b.add(geo.cyl(0.21, 0.26, 4), C.iron, { r: [0, PI / 4, 0], s: [1.6, 0.14, 0.8], mat: 'metal' }); break;
      case 'aetherite':
        for (const [x, z, h, r] of [[0, 0, 0.5, 0], [0.12, 0.05, 0.32, 0.4], [-0.1, -0.04, 0.36, -0.35], [0.02, -0.12, 0.26, 0.2]])
          b.add(geo.octa, C.aCrys, { p: [x, h / 2 - 0.15, z], r: [r * 0.5, 0, r], s: [0.16, h, 0.16], mat: 'aeth' }); break;
      case 'aether_alloy':
        b.add(geo.cyl(0.21, 0.26, 4), C.aPale, { r: [0, PI / 4, 0], s: [1.6, 0.14, 0.8], mat: 'metal' });
        b.box(0.48, 0.03, 0.04, C.aGlow, { p: [0, 0.075, 0], mat: 'glow' }); break;
      case 'void_crystal':
        for (const [x, z, h, r] of [[0, 0, 0.55, 0], [0.13, 0.05, 0.34, 0.45], [-0.12, -0.04, 0.4, -0.4]])
          b.add(geo.octa, C.vCrys, { p: [x, h / 2 - 0.15, z], r: [0, 0, r], s: [0.17, h, 0.17], mat: 'voidc' }); break;
      case 'voidglass':
        b.add(geo.cyl(0.3, 0.3, 6), C.vGlass, { r: [PI / 2, 0, 0], s: [1, 0.06, 1], mat: 'glass' });
        b.add(geo.torus(0.3, 0.025, 4, 6), C.vGlow, { r: [0, 0, PI / 6], mat: 'glow' }); break;
      case 'raw_meat': case 'cooked_meat': {
        const c = id === 'raw_meat' ? 0xc4484a : 0x8a4f2c;
        b.add(geo.ico1, c, { p: [0, 0.05, 0], s: [0.34, 0.3, 0.42], j: 0.08 });
        b.add(geo.cyl(0.03, 0.03, 5), C.bone, { p: [0, 0.05, -0.3], r: [PI / 2, 0, 0], s: [1, 0.25, 1] });
        b.add(geo.ico0, C.bone, { p: [0, 0.05, -0.42], s: 0.1 }); break;
      }
      case 'hide':
        b.add(geo.cyl(0.32, 0.36, 7), C.hide, { r: [0.15, 0, 0.1], s: [1, 0.04, 0.8], j: 0.1 });
        b.add(geo.cyl(0.18, 0.2, 7), C.hideD, { p: [0.05, 0.03, 0], s: [1, 0.03, 0.8] }); break;
      case 'salve':
        b.add(geo.cyl(0.14, 0.16, 8), 0xd8d2c0, { p: [0, 0.1, 0], s: [1, 0.24, 1] });
        b.add(geo.cyl(0.12, 0.12, 8), 0x5fb35a, { p: [0, 0.23, 0], s: [1, 0.04, 1] });
        b.add(geo.cyl(0.15, 0.15, 8), C.woodD, { p: [0, 0.27, 0], s: [1, 0.05, 1] }); break;
      case 'stone_axe': return axe(0); case 'iron_axe': return axe(1); case 'aether_axe': return axe(2);
      case 'stone_pick': return pick(0); case 'iron_pick': return pick(1); case 'aether_pick': return pick(2);
      case 'iron_sword': return sword(1); case 'aether_blade': return sword(2); case 'void_blade': return sword(3);
      case 'club':
        b.add(geo.cyl(0.11, 0.04, 7), C.wood, { p: [0, 0.38, 0], s: [1, 0.76, 1], j: 0.1 });
        for (const [a, y] of [[0, 0.62], [2.1, 0.55], [4.2, 0.68]]) b.add(geo.dode, C.stoneD, { p: [Math.cos(a) * 0.1, y, Math.sin(a) * 0.1], s: 0.07 }); break;
      case 'stone_spear':
        handle(b, 1.5, C.wood, 0.03);
        b.add(geo.cone(4), C.stoneD, { p: [0, 1.6, 0], s: [0.09, 0.24, 0.06] });
        b.add(geo.cyl(0.04, 0.04, 6), C.fiber, { p: [0, 1.47, 0], s: [1, 0.08, 1] }); break;
      case 'torch':
        handle(b, 0.55, C.wood, 0.03);
        b.add(geo.cyl(0.06, 0.05, 6), C.hideD, { p: [0, 0.56, 0], s: [1, 0.12, 1] });
        b.add(geo.cone(5), C.flameO, { p: [0, 0.7, 0], s: [0.12, 0.22, 0.12], mat: 'glow' });
        b.add(geo.cone(5), C.flameY, { p: [0, 0.68, 0], s: [0.07, 0.14, 0.07], mat: 'glow' }); break;
      case 'saddle':
        b.add(geo.ico1, C.hide, { s: [0.5, 0.18, 0.6], j: 0.08 });
        b.add(geo.cyl(0.08, 0.1, 6), C.hideD, { p: [0, 0.1, 0.22], s: [1, 0.12, 1] });
        b.box(0.04, 0.4, 0.06, C.ironD, { p: [0.27, -0.12, 0], mat: 'metal' }); b.box(0.04, 0.4, 0.06, C.ironD, { p: [-0.27, -0.12, 0], mat: 'metal' }); break;
      default:
        if (G.Models.placeBuilders[id]) return G.Models.placeBuilders[id]();
        b.box(0.3, 0.3, 0.3, 0xff00ff);
    }
    return b;
  }
  G.Models.item = function (id) { return itemBuilder(id).build(false); };
  G.Models.itemBuilder = itemBuilder;

  // ------------------------------------------------------------- placeables
  G.Models.placeBuilders = {
    campfire() {
      const b = new G.Builder(91);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * PI * 2; b.add(geo.dode, C.stoneD, { p: [Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55], s: [0.3, 0.22, 0.26], j: 0.15 }); }
      for (let i = 0; i < 4; i++) { const a = i * PI / 2 + 0.4; b.add(geo.cyl(0.06, 0.07, 6), C.bark, { p: [Math.cos(a) * 0.18, 0.28, Math.sin(a) * 0.18], r: [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7], s: [1, 0.7, 1], j: 0.1 }); }
      b.add(geo.ico0, 0x2a2420, { p: [0, 0.03, 0], s: [0.7, 0.08, 0.7] });
      return b;
    },
    workbench() {
      const b = new G.Builder(92);
      for (let i = 0; i < 5; i++) b.box(0.4, 0.1, 1.0, i % 2 ? C.woodL : C.wood, { p: [-0.8 + i * 0.4, 0.9, 0], j: 0.08 });
      for (const x of [-0.85, 0.85]) for (const z of [-0.38, 0.38]) b.box(0.12, 0.85, 0.12, C.woodD, { p: [x, 0.43, z] });
      b.box(1.8, 0.06, 0.8, C.wood, { p: [0, 0.3, 0], j: 0.08 });
      b.box(0.5, 0.03, 0.18, C.ironL, { p: [-0.3, 0.97, 0.1], r: [0, 0.3, 0], mat: 'metal' });
      b.box(0.05, 0.05, 0.3, C.woodD, { p: [0.4, 0.98, -0.1], r: [0, -0.5, 0] });
      b.box(0.18, 0.08, 0.08, C.ironD, { p: [0.47, 0.99, -0.2], r: [0, -0.5, 0], mat: 'metal' });
      b.box(0.22, 0.2, 0.2, C.ironD, { p: [0.75, 1.05, 0.3], mat: 'metal' });
      b.add(geo.cyl(0.03, 0.03, 6), C.ironL, { p: [0.75, 1.05, 0.48], r: [PI / 2, 0, 0], s: [1, 0.2, 1], mat: 'metal' });
      return b;
    },
    furnace() {
      const b = new G.Builder(93);
      for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2 + (r % 2) * 0.39;
        b.box(0.62, 0.38, 0.34, C.stone, { p: [Math.cos(a) * 0.68, 0.2 + r * 0.4, Math.sin(a) * 0.68], r: [0, -a + PI / 2, 0], j: 0.16 });
      }
      b.add(geo.cyl(0.65, 0.82, 8), C.stoneD, { p: [0, 0.8, 0], s: [1, 1.6, 1] });
      b.add(geo.cyl(0.3, 0.75, 8), C.stone, { p: [0, 1.85, 0], s: [1, 0.5, 1], j: 0.1 });
      b.add(geo.cyl(0.22, 0.25, 6), C.stoneD, { p: [0, 2.4, 0], s: [1, 0.8, 1], j: 0.1 });
      b.box(0.7, 0.6, 0.3, 0x1a1210, { p: [0, 0.55, 0.78] });
      b.box(0.56, 0.42, 0.1, C.flameO, { p: [0, 0.5, 0.86], mat: 'glow' });
      b.box(0.36, 0.2, 0.11, C.flameY, { p: [0, 0.42, 0.87], mat: 'glow' });
      return b;
    },
    forge() {
      const b = new G.Builder(94);
      b.box(1.7, 0.5, 1.2, C.ironD, { p: [0, 0.25, 0], mat: 'metal' });
      b.box(1.3, 0.4, 0.9, C.aPale, { p: [0, 0.7, 0], mat: 'metal' });
      b.box(1.6, 0.08, 1.1, C.ironD, { p: [0, 0.93, 0], mat: 'metal' });
      b.box(1.32, 0.04, 0.92, C.aGlow, { p: [0, 0.58, 0], mat: 'glow' });
      for (const x of [-0.7, 0.7]) for (const z of [-0.45, 0.45]) {
        b.box(0.14, 1.2, 0.14, C.aPale, { p: [x, 1.4, z], mat: 'metal' });
        b.add(geo.octa, C.aCrys, { p: [x, 2.1, z], s: [0.16, 0.34, 0.16], mat: 'aeth' });
      }
      b.add(geo.torus(0.55, 0.03, 4, 12), C.aGlow, { p: [0, 1.75, 0], r: [PI / 2, 0, 0], mat: 'glow' });
      return b;
    },
    chest() {
      const b = new G.Builder(95);
      for (let i = 0; i < 3; i++) b.box(1.2, 0.18, 0.72, i % 2 ? C.woodL : C.wood, { p: [0, 0.1 + i * 0.19, 0], j: 0.08 });
      b.add(geo.cyl(0.37, 0.37, 8, 1), C.wood, { p: [0, 0.62, 0], r: [0, 0, PI / 2], s: [1, 1.22, 1], j: 0.08 });
      for (const x of [-0.45, 0.45]) { b.box(0.08, 0.6, 0.76, C.ironD, { p: [x, 0.3, 0], mat: 'metal' }); b.add(geo.cyl(0.39, 0.39, 8), C.ironD, { p: [x, 0.62, 0], r: [0, 0, PI / 2], s: [1, 0.08, 1], mat: 'metal' }); }
      b.box(0.14, 0.18, 0.06, C.ironL, { p: [0, 0.6, 0.39], mat: 'metal' });
      return b;
    },
    bed() {
      const b = new G.Builder(96);
      b.box(1.3, 0.3, 2.3, C.wood, { p: [0, 0.15, 0], j: 0.08 });
      b.box(1.3, 0.8, 0.12, C.woodD, { p: [0, 0.4, -1.12] });
      b.box(1.16, 0.18, 2.1, C.cream, { p: [0, 0.38, 0.05], j: 0.04 });
      b.box(0.8, 0.12, 0.4, 0xf1ebdb, { p: [0, 0.52, -0.78] });
      b.box(1.2, 0.1, 1.3, 0x4f7396, { p: [0, 0.5, 0.42], j: 0.05 });
      return b;
    },
    lantern() {
      const b = new G.Builder(97);
      b.box(0.36, 0.1, 0.36, C.ironD, { p: [0, 0.05, 0], mat: 'metal' });
      b.add(geo.cyl(0.04, 0.05, 6), C.aPale, { p: [0, 0.7, 0], s: [1, 1.3, 1], mat: 'metal' });
      b.box(0.34, 0.06, 0.34, C.aPale, { p: [0, 1.38, 0], mat: 'metal' });
      b.box(0.34, 0.06, 0.34, C.aPale, { p: [0, 1.82, 0], mat: 'metal' });
      for (const x of [-0.15, 0.15]) for (const z of [-0.15, 0.15]) b.box(0.03, 0.44, 0.03, C.aPale, { p: [x, 1.6, z], mat: 'metal' });
      b.add(geo.octa, C.aGlow, { p: [0, 1.6, 0], s: [0.18, 0.34, 0.18], mat: 'glow' });
      b.add(geo.cone(4), C.aPale, { p: [0, 1.95, 0], s: [0.4, 0.2, 0.4], r: [0, PI / 4, 0], mat: 'metal' });
      return b;
    },
    backpack() {
      const b = new G.Builder(98);
      b.add(geo.ico1, C.hide, { p: [0, 0.3, 0], s: [0.6, 0.6, 0.45], j: 0.1 });
      b.box(0.5, 0.08, 0.5, C.hideD, { p: [0, 0.58, 0] });
      b.add(geo.octa, C.aGlow, { p: [0, 1.0, 0], s: [0.15, 0.3, 0.15], mat: 'glow' });
      return b;
    },
  };
  G.Models.place = function (id) {
    const g = G.Models.placeBuilders[id]().build();
    if (id === 'campfire') {
      const f = new G.Builder(5);
      f.add(geo.cone(5), C.flameO, { p: [0, 0.45, 0], s: [0.45, 0.75, 0.45], mat: 'glow' });
      f.add(geo.cone(5), C.flameY, { p: [0, 0.38, 0], s: [0.26, 0.48, 0.26], mat: 'glow' });
      const fl = f.build(false); fl.name = 'flame'; g.add(fl);
    }
    if (id === 'forge') {
      const f = new G.Builder(6); f.add(geo.octa, C.aCrys, { s: [0.32, 0.6, 0.32], mat: 'aeth' });
      const cr = f.build(false); cr.name = 'spin'; cr.position.y = 1.75; g.add(cr);
    }
    return g;
  };

  // ------------------------------------------------------------- nature nodes
  G.Models.nature = {
    pine(seed) {
      const b = new G.Builder(seed);
      b.add(geo.cyl(0.16, 0.3, 6), C.bark, { p: [0, 1.1, 0], s: [1, 2.2, 1], j: 0.08 });
      const cols = [0x3c6b3a, 0x447640, 0x4d8247];
      [[1.7, 1.9, 2.3], [1.3, 1.7, 3.4], [0.9, 1.5, 4.45]].forEach(([r, h, y], i) =>
        b.add(geo.cone(7), cols[i], { p: [0, y, 0], r: [0, i * 0.5, 0], s: [r * 2, h, r * 2], j: 0.07 }));
      return b;
    },
    oak(seed) {
      const b = new G.Builder(seed);
      b.add(geo.cyl(0.24, 0.38, 6), C.bark, { p: [0, 1.3, 0], s: [1, 2.6, 1], j: 0.08 });
      b.add(geo.cyl(0.08, 0.13, 5), C.bark, { p: [0.45, 2.5, 0.1], r: [0, 0, -0.8], s: [1, 1.2, 1] });
      [[0, 3.6, 0, 2.9], [0.9, 3.1, 0.4, 2.0], [-0.8, 3.2, -0.3, 2.1], [0.1, 4.3, -0.5, 1.8]].forEach(([x, y, z, s], i) =>
        b.add(geo.ico1, i % 2 ? 0x5d9440 : 0x67a148, { p: [x, y, z], s: [s, s * 0.85, s], r: [i, i * 2, 0], j: 0.07 }));
      return b;
    },
    glade(seed) {
      const b = new G.Builder(seed);
      b.add(geo.cyl(0.18, 0.32, 6), 0x7c6f94, { p: [0, 1.0, 0], r: [0, 0, 0.12], s: [1, 2.1, 1], j: 0.08 });
      b.add(geo.cyl(0.12, 0.18, 6), 0x7c6f94, { p: [0.22, 2.6, 0], r: [0, 0, -0.25], s: [1, 1.4, 1], j: 0.08 });
      [[0.3, 3.7, 0, 2.4], [-0.6, 3.2, 0.5, 1.6], [0.9, 3.0, -0.5, 1.5]].forEach(([x, y, z, s], i) =>
        b.add(geo.ico0, i % 2 ? 0x4fb8b0 : 0x5cc6bb, { p: [x, y, z], s: [s, s * 0.8, s], r: [i, i, 0], j: 0.08 }));
      for (const [x, y, z] of [[0.9, 2.3, 0.6], [-0.7, 2.4, -0.3], [0.1, 2.6, 0.9]]) b.add(geo.octa, C.aGlow, { p: [x, y, z], s: [0.12, 0.3, 0.12], mat: 'glow' });
      return b;
    },
    rock(seed) {
      const b = new G.Builder(seed);
      b.add(geo.dode, C.stone, { p: [0, 0.5, 0], s: [2.2, 1.5, 1.9], r: [0.3, seed, 0.2], j: 0.12 });
      b.add(geo.dode, C.stoneD, { p: [0.9, 0.25, 0.6], s: [0.9, 0.7, 0.8], r: [seed, 0.5, 0], j: 0.12 });
      return b;
    },
    bush(seed) {
      const b = new G.Builder(seed);
      [[0, 0.45, 0, 1.2], [0.45, 0.35, 0.2, 0.9], [-0.35, 0.35, -0.25, 0.85]].forEach(([x, y, z, s], i) =>
        b.add(geo.ico0, i % 2 ? C.leaf : C.leafD, { p: [x, y, z], s, r: [i, i, i], j: 0.08 }));
      for (let i = 0; i < 9; i++) { const a = i * 2.3; b.add(geo.ico0, i % 2 ? 0xd8394c : 0xb02a48, { p: [Math.cos(a) * 0.55, 0.35 + (i % 3) * 0.18, Math.sin(a) * 0.5], s: 0.13 }); }
      return b;
    },
    iron(seed) {
      const b = new G.Builder(seed);
      b.add(geo.dode, C.stoneD, { p: [0, 0.55, 0], s: [2.0, 1.6, 1.8], r: [0.2, seed, 0.3], j: 0.12 });
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + seed; b.add(geo.octa, C.rust, { p: [Math.cos(a) * 0.8, 0.4 + (i % 3) * 0.35, Math.sin(a) * 0.7], r: [a, a, 0], s: 0.38, mat: 'metal', j: 0.1 }); }
      return b;
    },
    aether(seed) {
      const b = new G.Builder(seed);
      b.add(geo.dode, 0x4a5560, { p: [0, 0.2, 0], s: [1.8, 0.7, 1.6], j: 0.1 });
      [[0, 0, 2.4, 0, 0], [0.5, 0.3, 1.6, 0.4, 0.2], [-0.5, 0.2, 1.8, -0.35, -0.2], [0.2, -0.55, 1.4, 0.2, -0.45], [-0.3, -0.4, 1.1, -0.3, 0.3]]
        .forEach(([x, z, h, rz, rx]) => b.add(geo.octa, C.aCrys, { p: [x, h / 2, z], r: [rx, 0, rz], s: [0.45, h, 0.45], mat: 'aeth', j: 0.08 }));
      return b;
    },
    voidn(seed) {
      const b = new G.Builder(seed);
      b.add(geo.dode, 0x2b2733, { p: [0, 0.3, 0], s: [2, 0.9, 1.8], j: 0.1, mat: 'metal' });
      [[0, 0, 3.0, 0, 0], [0.6, 0.2, 2.0, 0.35, 0.1], [-0.5, 0.3, 2.2, -0.3, -0.2], [0.1, -0.6, 1.6, 0.1, -0.4]]
        .forEach(([x, z, h, rz, rx]) => b.add(geo.octa, C.vCrys, { p: [x, h / 2, z], r: [rx, 0, rz], s: [0.5, h, 0.5], mat: 'voidc', j: 0.06 }));
      return b;
    },
  };

  G.Models.grassTuft = function () {
    const b = new G.Builder(9);
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7;
      const g = new THREE.BufferGeometry();
      const w = 0.07, h = 0.45 + (i % 2) * 0.2, lean = 0.12;
      g.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, lean, h, 0], 3));
      b.add(g, i % 2 ? 0x6ea54b : 0x5f9741, { p: [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], r: [0, a, 0] });
    }
    return b.geoFor('std');
  };
  G.Models.flower = function (c) {
    const b = new G.Builder(19);
    b.add(geo.cyl(0.012, 0.015, 4), 0x4f8a3a, { p: [0, 0.2, 0], s: [1, 0.4, 1] });
    b.add(geo.ico0, c, { p: [0, 0.42, 0], s: [0.12, 0.07, 0.12] });
    return b.geoFor('std');
  };

  // ------------------------------------------------------------- creatures
  const SPAL = {
    trikeros: { body: 0x7d8b5a, belly: 0xbcb27e, acc: 0xc9763a, dark: 0x4a4030, eye: C.black },
    stegolith: { body: 0x5f7d8c, belly: 0xaebdbb, acc: 0xc4503c, dark: 0x3e4f58, eye: C.black },
    skitter: { body: 0xc9a66b, belly: 0xeadcb5, acc: 0x7a5f3a, dark: 0x5a4630, eye: C.black, crest: 0xe0b040 },
    razorclaw: { body: 0x4f5d3a, belly: 0x9aa27a, acc: 0xb33a2a, dark: 0x2a2a22, eye: 0xf2c33a },
    dreadmaw: { body: 0x544a5e, belly: 0x8a7f8c, acc: 0x4a2f72, dark: 0x2c2632, eye: C.vGlow },
  };

  function part(b, parent, name) { const g = b.build(); g.name = name || ''; if (parent) parent.add(g); return g; }

  function quad(id) {
    const P = SPAL[id];
    const trike = id === 'trikeros';
    const L = trike ? 3.4 : 3.9, W = trike ? 1.75 : 1.6, H = trike ? 1.6 : 1.75, legLen = trike ? 1.2 : 1.3;
    const root = new THREE.Group();
    const bodyY = legLen + H * 0.32;
    const body = new THREE.Group(); body.position.y = bodyY; root.add(body);
    let b = new G.Builder(id.length);
    b.add(geo.ico1, P.body, { s: [W, H, L], j: 0.06 });
    b.add(geo.ico1, P.belly, { p: [0, -H * 0.2, 0.05], s: [W * 0.88, H * 0.62, L * 0.9], j: 0.05 });
    if (!trike) {
      for (let i = 0; i < 7; i++) {
        const t = i / 6, z = G.lerp(-L * 0.42, L * 0.3, t), hh = 0.45 + Math.sin(t * PI) * 0.7;
        b.add(geo.cone(4), P.acc, { p: [(i % 2 ? 0.14 : -0.14), H * 0.42 + hh * 0.4, z], r: [0, 0, (i % 2 ? -0.18 : 0.18)], s: [0.1, hh, 0.55 + Math.sin(t * PI) * 0.3], j: 0.1 });
      }
    } else {
      for (let i = 0; i < 5; i++) b.add(geo.ico0, P.dark, { p: [0, H * 0.45, -L * 0.3 + i * 0.35], s: [0.3, 0.2, 0.3] });
    }
    part(b, body, 'torso');
    // legs
    const legs = [];
    const pivotY = -H * 0.18, lt = bodyY + pivotY;
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], i) => {
      const lg = new THREE.Group(); lg.position.set(sx * W * 0.33, pivotY, sz * L * 0.28); body.add(lg);
      const lb = new G.Builder(i + 40);
      lb.add(geo.ico1, P.body, { p: [0, -0.15, 0], s: [0.55, 0.95, 0.75], j: 0.05 });
      lb.add(geo.cyl(0.2, 0.16, 6), P.body, { p: [0, -lt / 2 - 0.1, 0], s: [1, lt * 0.9, 1], j: 0.05 });
      lb.add(geo.cyl(0.24, 0.26, 6), P.dark, { p: [0, -lt + 0.08, 0.04], s: [1, 0.16, 1.2] });
      part(lb, lg, 'leg');
      legs.push({ g: lg, ph: (i === 0 || i === 3) ? 0 : PI });
    });
    // neck & head
    const neck = new THREE.Group(); neck.position.set(0, trike ? H * 0.1 : -H * 0.05, L * 0.44); body.add(neck);
    b = new G.Builder(5);
    b.add(geo.cyl(0.35, 0.5, 6), P.body, { p: [0, 0, 0.3], r: [PI / 2 - (trike ? 0.3 : -0.2), 0, 0], s: [1, 0.8, 1], j: 0.05 });
    part(b, neck);
    const head = new THREE.Group(); head.position.set(0, trike ? 0.15 : -0.12, 0.75); neck.add(head);
    b = new G.Builder(6);
    if (trike) {
      b.box(0.72, 0.6, 0.9, P.body, { p: [0, 0, 0.15], j: 0.06 });
      b.add(geo.cone(4), P.dark, { p: [0, -0.08, 0.75], r: [PI / 2, PI / 4, 0], s: [0.42, 0.5, 0.36] });
      b.add(geo.cyl(0.5, 0.5, 9), P.acc, { p: [0, 0.5, -0.3], r: [-0.5 + PI / 2, 0, 0], s: [2.3, 0.1, 1.9], j: 0.1 });
      for (let i = 0; i < 7; i++) { const a = PI * (0.1 + 0.8 * i / 6); b.add(geo.cone(4), C.bone, { p: [Math.cos(a) * 1.15, 0.5 + Math.sin(a) * 0.78, -0.55 - Math.sin(a) * 0.3], r: [-0.4, 0, a - PI / 2], s: [0.14, 0.3, 0.14] }); }
      for (const sx of [-1, 1]) b.add(geo.cone(6), C.bone, { p: [sx * 0.24, 0.5, 0.38], r: [1.05, 0, -sx * 0.1], s: [0.18, 1.0, 0.18] });
      b.add(geo.cone(5), C.bone, { p: [0, 0.22, 0.62], r: [0.7, 0, 0], s: [0.14, 0.34, 0.14] });
      for (const sx of [-1, 1]) b.box(0.08, 0.1, 0.1, P.eye, { p: [sx * 0.37, 0.12, 0.25] });
    } else {
      b.box(0.42, 0.36, 0.72, P.body, { p: [0, 0, 0.15], j: 0.06 });
      b.add(geo.cone(4), P.dark, { p: [0, -0.06, 0.6], r: [PI / 2, PI / 4, 0], s: [0.28, 0.3, 0.24] });
      for (const sx of [-1, 1]) b.box(0.06, 0.07, 0.07, P.eye, { p: [sx * 0.22, 0.07, 0.25] });
    }
    part(b, head);
    // tail
    const tail = []; let parent = body, tz = -L * 0.44, r1 = trike ? 0.45 : 0.5;
    const segs = 3;
    for (let i = 0; i < segs; i++) {
      const tg = new THREE.Group(); tg.position.set(0, i === 0 ? 0.05 : 0, tz); parent.add(tg);
      const len = (trike ? 0.95 : 1.1) * (1 - i * 0.15), r2 = r1 * 0.62;
      const tb = new G.Builder(i + 70);
      if (i < segs - 1) tb.add(geo.cyl(r2, r1, 6), P.body, { p: [0, 0, -len / 2], r: [-PI / 2, 0, 0], s: [1, len, 1], j: 0.05 });
      else tb.add(geo.cone(6), P.body, { p: [0, 0, -len / 2], r: [-PI / 2, 0, 0], s: [r1 * 2, len, r1 * 2], j: 0.05 });
      if (!trike && i === segs - 1) for (const [sx, sy] of [[1, 1], [-1, 1], [1, 0.4], [-1, 0.4]]) tb.add(geo.cone(4), C.bone, { p: [sx * 0.15, 0.15 * sy, -len * (sy > 0.5 ? 0.6 : 0.3)], r: [0, 0, -sx * 1.1], s: [0.1, 0.6, 0.1] });
      part(tb, tg);
      tail.push(tg); parent = tg; tz = -len * 0.92; r1 = r2;
    }
    root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { root, body, neck, head, tail, legs, bodyY, quad: true, headLen: 1.4 };
  }

  function biped(id) {
    const P = SPAL[id];
    const rex = id === 'dreadmaw', sk = id === 'skitter';
    const legLen = rex ? 1.15 : sk ? 1.05 : 0.95;
    const L = rex ? 1.6 : sk ? 0.8 : 1.25, W = rex ? 0.85 : sk ? 0.42 : 0.5, H = rex ? 0.95 : sk ? 0.5 : 0.58;
    const root = new THREE.Group();
    const body = new THREE.Group(); body.position.y = legLen; root.add(body);
    let b = new G.Builder(id.length + 1);
    b.add(geo.ico1, P.body, { p: [0, H * 0.2, L * 0.05], r: [-0.12, 0, 0], s: [W, H, L], j: 0.06 });
    b.add(geo.ico1, P.belly, { p: [0, H * 0.05, L * 0.12], r: [-0.12, 0, 0], s: [W * 0.84, H * 0.66, L * 0.86], j: 0.05 });
    if (sk) for (let i = 0; i < 3; i++) b.box(W * 1.01, 0.05, 0.08, P.acc, { p: [0, H * 0.32, -0.1 + i * 0.16] });
    if (id === 'razorclaw') for (let i = 0; i < 4; i++) b.box(W * 0.6, 0.04, 0.09, P.acc, { p: [0, H * 0.67, -0.25 + i * 0.18] });
    // arms
    for (const sx of [-1, 1]) {
      const al = rex ? 0.3 : sk ? 0.3 : 0.38;
      b.add(geo.cyl(0.04, 0.06, 5), P.body, { p: [sx * W * 0.4, H * 0.05, L * 0.42], r: [0.9, 0, sx * 0.2], s: [1, al, 1] });
      if (!sk) b.add(geo.cone(4), C.bone, { p: [sx * W * 0.42, -0.08, L * 0.42 + al * 0.45], r: [2.2, 0, 0], s: [0.04, 0.1, 0.04] });
    }
    if (rex) for (let i = 0; i < 5; i++) b.add(geo.octa, P.acc, { p: [0, H * 0.72, -0.4 + i * 0.24], r: [-0.3, 0, 0], s: [0.12, 0.34 - i * 0.03, 0.12], mat: 'voidc' });
    part(b, body, 'torso');
    // neck/head
    const neck = new THREE.Group(); neck.position.set(0, H * 0.35, L * 0.42); body.add(neck);
    b = new G.Builder(3);
    if (sk) b.add(geo.cyl(0.06, 0.12, 6), P.body, { p: [0, 0.4, 0.12], r: [0.3, 0, 0], s: [1, 0.85, 1], j: 0.05 });
    else b.add(geo.cyl(rex ? 0.32 : 0.13, rex ? 0.4 : 0.18, 6), P.body, { p: [0, 0.12, 0.12], r: [0.9, 0, 0], s: [1, rex ? 0.6 : 0.45, 1], j: 0.05 });
    part(b, neck);
    const head = new THREE.Group(); head.position.set(0, sk ? 0.82 : rex ? 0.32 : 0.24, sk ? 0.28 : rex ? 0.4 : 0.3); neck.add(head);
    b = new G.Builder(4);
    let jaw = null;
    if (sk) {
      b.box(0.16, 0.15, 0.24, P.body, { j: 0.05 });
      b.add(geo.cone(4), P.dark, { p: [0, -0.02, 0.2], r: [PI / 2, PI / 4, 0], s: [0.12, 0.2, 0.1] });
      b.add(geo.cone(4), P.crest, { p: [0, 0.12, -0.08], r: [-0.8, 0, 0], s: [0.04, 0.22, 0.08] });
      for (const sx of [-1, 1]) b.box(0.03, 0.04, 0.04, P.eye, { p: [sx * 0.08, 0.04, 0.03] });
    } else {
      const s = rex ? 1.9 : 1;
      b.box(0.3 * s, 0.26 * s, 0.42 * s, P.body, { p: [0, 0.02 * s, 0.05 * s], j: 0.06 });
      b.box(0.22 * s, 0.15 * s, 0.34 * s, P.body, { p: [0, 0.0, 0.36 * s], j: 0.06 });
      for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) b.add(geo.cone(3), C.bone, { p: [sx * 0.09 * s, -0.09 * s, (0.24 + i * 0.07) * s], r: [PI, 0, 0], s: [0.03 * s, 0.07 * s, 0.03 * s] });
      for (const sx of [-1, 1]) b.box(0.04 * s, 0.05 * s, 0.06 * s, P.eye, { p: [sx * 0.15 * s, 0.08 * s, 0.14 * s], mat: rex ? 'glow' : 'std' });
      if (!rex) for (let i = 0; i < 3; i++) b.add(geo.cone(4), P.acc, { p: [0, 0.15 + i * 0.02, -0.05 - i * 0.1], r: [-1.2, 0, 0], s: [0.05, 0.22 - i * 0.04, 0.05] });
      else for (const sx of [-1, 1]) b.add(geo.cone(4), P.dark, { p: [sx * 0.2, 0.3, -0.05], r: [-0.9, 0, sx * 0.3], s: [0.08, 0.3, 0.08] });
      const jb = new G.Builder(8);
      jb.box(0.2 * s, 0.07 * s, 0.5 * s, P.belly, { p: [0, -0.03 * s, 0.25 * s], j: 0.05 });
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) jb.add(geo.cone(3), C.bone, { p: [sx * 0.07 * s, 0.03 * s, (0.3 + i * 0.07) * s], s: [0.025 * s, 0.06 * s, 0.025 * s] });
      jaw = new THREE.Group(); jaw.position.set(0, -0.1 * s, -0.02 * s); head.add(jaw); part(jb, jaw);
    }
    part(b, head);
    // legs
    const legs = [];
    [1, -1].forEach((sx, i) => {
      const lg = new THREE.Group(); lg.position.set(sx * W * 0.34, 0, 0); body.add(lg);
      const lb = new G.Builder(i + 20);
      lb.add(geo.ico1, P.body, { p: [0, -legLen * 0.18, 0.02], s: [W * 0.5, legLen * 0.6, W * 0.75], j: 0.05 });
      part(lb, lg);
      const knee = new THREE.Group(); knee.position.set(0, -legLen * 0.45, 0.04); lg.add(knee);
      const kb = new G.Builder(i + 30);
      const sl = legLen * 0.58;
      kb.add(geo.cyl(0.045 * (rex ? 2 : 1), 0.065 * (rex ? 2 : 1), 5), P.body, { p: [0, -sl / 2, -0.06], r: [0.2, 0, 0], s: [1, sl, 1] });
      kb.box(0.14 * (rex ? 1.8 : 1), 0.06, 0.3 * (rex ? 1.4 : 1), P.dark, { p: [0, -sl + 0.03, 0.04] });
      if (id === 'razorclaw') kb.add(geo.cone(4), C.bone, { p: [sx * 0.06, -sl + 0.12, 0.08], r: [0.6, 0, 0], s: [0.04, 0.16, 0.04] });
      part(kb, knee);
      legs.push({ g: lg, knee, ph: i * PI });
    });
    // tail
    const tail = []; let parent = body, tz = -L * 0.4, r1 = W * 0.42;
    const segs = 4;
    for (let i = 0; i < segs; i++) {
      const tg = new THREE.Group(); tg.position.set(0, i === 0 ? H * 0.2 : 0, tz); parent.add(tg);
      const len = L * (sk ? 0.42 : 0.5) * (1 - i * 0.1), r2 = r1 * 0.66;
      const tb = new G.Builder(i + 80);
      if (i < segs - 1) tb.add(geo.cyl(r2, r1, 6), P.body, { p: [0, 0, -len / 2], r: [-PI / 2, 0, 0], s: [1, len, 1], j: 0.05 });
      else tb.add(geo.cone(6), P.body, { p: [0, 0, -len / 2], r: [-PI / 2, 0, 0], s: [r1 * 2, len, r1 * 2], j: 0.05 });
      if (sk && i % 2 === 0) tb.box(r1 * 2.05, r1 * 0.6, 0.06, P.acc, { p: [0, 0, -len * 0.4] });
      if (id === 'razorclaw' && i === segs - 1) tb.add(geo.cone(4), P.acc, { p: [0, 0.05, -len * 0.5], r: [-1.4, 0, 0], s: [0.05, 0.3, 0.12] });
      part(tb, tg);
      tail.push(tg); parent = tg; tz = -len * 0.92; r1 = r2;
    }
    root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { root, body, neck, head, jaw, tail, legs, bodyY: legLen, quad: false, headLen: rex ? 1.2 : 0.5 };
  }

  G.Models.creature = function (id) {
    const m = (id === 'trikeros' || id === 'stegolith') ? quad(id) : biped(id);
    const sc = { trikeros: 1.0, stegolith: 1.0, skitter: 1.15, razorclaw: 1.15, dreadmaw: 2.7 }[id];
    m.root.scale.setScalar(sc); m.scale = sc;
    return m;
  };

  G.Models.cloud = function (seed) {
    const b = new G.Builder(seed); const r = b.rnd;
    const n = 4 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const c = 1 - Math.abs(i - n / 2) / n; b.add(geo.ico1, 0xffffff, { p: [(i - n / 2) * 9 + r() * 3, r() * 3 + c * 3, (r() - 0.5) * 8], s: [16 + c * 14 + r() * 6, 8 + c * 8, 14 + c * 8 + r() * 6], r: [0, r() * 3, 0], j: 0.03 }); }
    b.add(geo.ico1, 0xe9eef3, { p: [0, -1.5, 0], s: [n * 10, 4, 20] });
    const g = b.build(false); g.children.forEach(c => { c.castShadow = false; c.receiveShadow = false; c.material = G.M.cloud; });
    return g;
  };
})();
