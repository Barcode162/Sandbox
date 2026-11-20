'use strict';
// ============================================================================
//  AETHERWILD — bootstrap, input, main loop
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);

  G.newStats = () => ({ crafted: {}, built: { foundation: 0, wall: 0, doorway: 0, window: 0, floor: 0, stairs: 0, door: 0 }, placed: {}, got: {}, tamed: 0, upgraded: 0, voidBuilt: false, tamedRex: false, kills: 0 });
  G.stats = G.newStats();
  G.camPos = new THREE.Vector3(); G.camDir = new THREE.Vector3(0, 0, -1);

  // ------------------------------------------------------------------ input
  const I = G.Input = {
    keys: {}, mouse: { l: false, r: false, lPressed: false }, dx: 0, dy: 0, ax: 0, az: 0, locked: false, noLock: false, paused: false, fails: 0,
    active() { return G.started && !G.UI.open && !G.Player.dead && !this.paused && (this.locked || this.noLock); },
    lock() {
      if (this.noLock) { this.paused = false; return; }
      const c = G.renderer.domElement;
      try { const p = c.requestPointerLock(); if (p && p.catch) p.catch(() => this.fallback()); } catch (e) { this.fallback(); }
    },
    fallback() {
      // refused (e.g. right after Esc, or no gesture): show the pause menu so a click can resume.
      // Only give up on mouse lock entirely if it keeps failing and never worked.
      this.fails++;
      if (!this.everLocked && this.fails >= 3) { this.noLock = true; this.paused = false; $('#pause').classList.add('hidden'); G.UI.toast('Mouse lock unavailable here: hold Right Mouse to look around', null, 'warn'); return; }
      if (G.started && !G.UI.open && !G.Player.dead) G.Menu.pause();
    },
    unlock() { if (document.pointerLockElement) document.exitPointerLock(); },
  };
  document.addEventListener('pointerlockchange', () => {
    I.locked = document.pointerLockElement === G.renderer.domElement;
    if (I.locked) { I.everLocked = true; I.fails = 0; I.paused = false; $('#pause').classList.add('hidden'); }
    else if (G.started && !G.UI.open && !G.Player.dead && !I.noLock && !I.paused) G.Menu.pause();
  });
  document.addEventListener('pointerlockerror', () => I.fallback());
  document.addEventListener('mousemove', e => {
    if (I.locked || (I.noLock && !G.touch && I.mouse.r && I.active())) { I.dx += e.movementX || 0; I.dy += e.movementY || 0; }
  });
  document.addEventListener('mousedown', e => {
    G.Audio.start();
    if (!G.started || G.UI.open || G.touch) return;
    if (!I.locked && !I.noLock) { if (e.target === G.renderer.domElement) I.lock(); return; }
    if (e.button === 0) { I.mouse.l = true; I.mouse.lPressed = true; }
    if (e.button === 2) { I.mouse.r = true; if (G.Build.mode) G.Build.stopBuild(); }
  });
  document.addEventListener('mouseup', e => { if (e.button === 0) I.mouse.l = false; if (e.button === 2) I.mouse.r = false; });
  document.addEventListener('wheel', e => {
    if (!I.active()) return;
    const P = G.Player; P.sel = (P.sel + (e.deltaY > 0 ? 1 : 7)) % 8; G.UI.refreshHotbar();
  }, { passive: true });
  window.addEventListener('blur', () => { I.keys = {}; I.mouse.l = I.mouse.r = false; });
  document.addEventListener('keyup', e => { I.keys[e.code] = false; });
  document.addEventListener('keydown', e => {
    if (e.code === 'Tab' && G.started) e.preventDefault();
    if (!G.started || e.target.tagName === 'INPUT') return;
    I.keys[e.code] = true;
    if (e.repeat) return;
    const U = G.UI, P = G.Player, B = G.Build;
    if (P.dead) return;
    if (e.code === 'Escape') {
      if (U.open) { U.closeAll(); I.lock(); }
      else if (B.mode) B.stopBuild();
      else if (!$('#settings').classList.contains('hidden')) { /* handled by menu */ }
      else if (I.paused) G.Menu.resume();
      else if (I.noLock) G.Menu.pause();
      return;
    }
    if (I.paused) return;
    if (e.code === 'Tab' || e.code === 'KeyI') { if (U.open === 'inv') { U.closeAll(); I.lock(); } else U.openInventory(); return; }
    if (e.code === 'KeyB') { if (U.open === 'build') { U.closeAll(); I.lock(); } else if (!P.mount) U.openBuild(); return; }
    if (e.code === 'KeyH') { $('#help').classList.toggle('hidden'); return; }
    if (e.code === 'KeyT') { G.Tutorial.skip(); return; }
    if (!I.active()) return;
    if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 8) { P.sel = n - 1; U.refreshHotbar(); } return; }
    const f = P.focus;
    switch (e.code) {
      case 'KeyE': P.interact(); break;
      case 'KeyR': if (B.mode || B.placeItem) B.rot = (B.rot + 1) % 4; else P.ride(); break;
      case 'KeyF': P.command(); break;
      case 'KeyC': P.crouch = !P.crouch; break;
      case 'KeyU': if (f && f.kind === 'piece' && f.t < 5) B.upgrade(f.obj); break;
      case 'KeyX':
        if (f && f.kind === 'piece' && f.t < 5) B.demolish(f.obj);
        else if (f && f.kind === 'place' && f.t < 5) B.pickUp(f.obj);
        break;
    }
  });

  // ------------------------------------------------------------------ setup
  let envTex = null;
  // (re)builds the whole island for a seed into a fresh scene
  G.buildWorld = function (seed) {
    if (G.scene) G.scene.traverse(o => { if (o.geometry && !o.isPoints) o.geometry.dispose(); });
    const scene = G.scene = new THREE.Scene();
    scene.environment = envTex;
    scene.add(G.camera);
    G.Phys.reset();
    G.Lights.init(scene, 6);
    G.Particles.init(scene);
    G.World.init(scene, seed);
    G.Build.init(scene);
    G.Creatures.init();
    G.inv.load(new Array(G.inv.slots.length).fill(null));
    G.stats = G.newStats();
    G.Player.reset();
    G.Player.spawnAt(G.World.spawn.x, G.World.spawn.z);
    G.Creatures.spawnInitial();
    G.loadedSeed = seed; G.pristine = true;
    G.applyQuality();
    G.Menu.titleCam();
  };
  G.enterWorld = function (w) {
    if (!(G.pristine && G.loadedSeed === w.seed)) G.buildWorld(w.seed);
    G.pristine = false;
    G.current = w;
    G.Tutorial.load(null);
    const loaded = !w.fresh && G.loadSave(w);
    if (!loaded) {
      const sp = G.World.spawn;
      G.Player.spawnAt(sp.x, sp.z);
      G.Player.yaw = Math.atan2(sp.x, sp.z);
      G.stats = G.newStats();
      if (G.settings.tutorial) G.Tutorial.start(); else G.UI.toast('Welcome to ' + w.name + '. Punch trees to begin.', null, 'good');
    }
    G.Player.intro = 2.2;
    G.started = true;
    G.UI.refreshHotbar();
    G.save(true);
  };
  G.applyQuality = function () {
    const q = G.settings.quality, r = G.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, q === 'low' ? 1 : 1.5));
    r.setSize(window.innerWidth, window.innerHeight);
    const sun = G.World.sun, n = q === 'low' ? 1024 : 2048;
    if (sun && sun.shadow.mapSize.x !== n) { sun.shadow.mapSize.set(n, n); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    if (G.World.grass) { G.World.grassN = G.World.grassN || G.World.grass.count; G.World.grass.count = q === 'low' ? Math.min(9000, G.World.grassN) : G.World.grassN; }
  };
  G.applyView = function () {
    G.camera.fov = G.settings.fov; G.camera.updateProjectionMatrix();
  };

  function init() {
    const r = G.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.autoClear = false;
    document.body.prepend(r.domElement);
    G.camera = new THREE.PerspectiveCamera(G.settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);

    // image-based ambient from a soft gradient sky (keeps metals readable)
    const envScene = new THREE.Scene();
    const eg = new THREE.SphereGeometry(10, 16, 8); const ec = [];
    const top = new THREE.Color(0x8fbde8), hor = new THREE.Color(0xe8e4d8), bot = new THREE.Color(0x5c5a44);
    const pa = eg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 10; const c = y > 0 ? hor.clone().lerp(top, y) : hor.clone().lerp(bot, -y * 2); ec.push(c.r, c.g, c.b); }
    eg.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3));
    envScene.add(new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    envTex = new THREE.PMREMGenerator(r).fromScene(envScene, 0.04).texture;

    G.inv = new G.Inventory(30); G.inv.hotbar = 8;
    G.Player.init();
    G.Player.vmScene.environment = envTex;
    G.Menu.init();
    G.UI.init();
    G.Touch.init();
    // the island behind the title is the last world you played (or a showcase island)
    const last = G.Worlds.list()[0];
    G.buildWorld(last ? last.seed : 16213);
    G.World.tod = 0.29; // golden morning light for the title
    G.UI.refreshHotbar();

    window.addEventListener('resize', () => {
      r.setSize(window.innerWidth, window.innerHeight);
      G.camera.aspect = window.innerWidth / window.innerHeight; G.camera.updateProjectionMatrix();
      G.Player.vmCam.aspect = G.camera.aspect; G.Player.vmCam.updateProjectionMatrix();
      G.UI.sizeMinimap();
    });
    G.Player.vmCam.aspect = G.camera.aspect; G.Player.vmCam.updateProjectionMatrix();
    $('#btn-respawn').onclick = () => { $('#death').classList.add('hidden'); G.Player.respawn(); G.Input.lock(); };
    // the camera is already flying when the start screen fades in
    requestAnimationFrame(loop);
    setTimeout(() => { $('#loading').classList.add('gone'); G.Menu.set('start'); }, 350);
    setTimeout(() => $('#loading').classList.add('hidden'), 1600);
  }

  let last = performance.now(), saveT = 60, fpsT = 0, frames = 0;
  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    frames++; fpsT += dt; if (fpsT > 1) { G.fps = frames / fpsT; frames = 0; fpsT = 0; }
    const r = G.renderer, cam = G.camera;
    if (!G.started) {
      G.time += dt;
      G.Menu.updateTitleCam(dt, cam);
      cam.updateMatrixWorld(); G.camPos.copy(cam.position); cam.getWorldDirection(G.camDir);
      G.World.update(dt * 0.15, cam); G.Creatures.update(dt); G.Particles.update(dt); G.Lights.update(cam);
      r.clear(); r.render(G.scene, cam);
      return;
    }
    if (I.paused) dt = 0;
    G.time += dt;
    const P = G.Player, B = G.Build;
    // held placeable → placement preview
    if (!B.mode) {
      const h = P.held(); const want = h && G.ITEMS[h.id].type === 'place' && !P.mount ? h.id : null;
      if (B.placeItem !== want) { B.placeItem = want; B.dropGhost(); B.rot = 0; }
    }
    // keyboard turning (also useful without mouse lock)
    if (I.active()) { if (I.keys.ArrowLeft) I.dx -= 600 * dt; if (I.keys.ArrowRight) I.dx += 600 * dt; if (I.keys.ArrowUp) I.dy -= 400 * dt; if (I.keys.ArrowDown) I.dy += 400 * dt; }
    P.update(dt);
    B.update(dt);
    G.Creatures.update(dt);
    G.World.update(dt, cam);
    G.Particles.update(dt);
    G.Lights.update(cam);
    G.UI.update(dt);
    G.Tutorial.update(dt);
    G.Audio.update();
    saveT -= dt; if (saveT <= 0) { saveT = 60; G.save(true); }
    r.clear(); r.render(G.scene, cam);
    if (!P.mount) { r.clearDepth(); r.render(P.vmScene, P.vmCam); }
  }

  window.addEventListener('beforeunload', () => { if (!G.noSave) G.save(true); });
  window.addEventListener('load', () => setTimeout(init, 30));
})();
