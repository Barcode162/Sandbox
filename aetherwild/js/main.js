'use strict';
// ============================================================================
//  AETHERWILD — bootstrap, input, main loop
// ============================================================================
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  const SEED = 16213;

  G.newStats = () => ({ crafted: {}, built: { foundation: 0, wall: 0, doorway: 0, window: 0, floor: 0, stairs: 0, door: 0 }, placed: {}, got: {}, tamed: 0, upgraded: 0, voidBuilt: false, tamedRex: false, kills: 0 });
  G.stats = G.newStats();
  G.settings = { sens: 1 };
  try { Object.assign(G.settings, JSON.parse(localStorage.getItem('aetherwild_settings') || '{}')); } catch (e) { }
  G.camPos = new THREE.Vector3(); G.camDir = new THREE.Vector3(0, 0, -1);

  // ------------------------------------------------------------------ input
  const I = G.Input = {
    keys: {}, mouse: { l: false, r: false, lPressed: false }, dx: 0, dy: 0, locked: false, noLock: false, paused: false,
    active() { return G.started && !G.UI.open && !G.Player.dead && !this.paused && (this.locked || this.noLock); },
    lock() {
      if (this.noLock) { this.paused = false; $('#pause').classList.add('hidden'); return; }
      const c = G.renderer.domElement;
      try { const p = c.requestPointerLock(); if (p && p.catch) p.catch(() => this.fallback()); } catch (e) { this.fallback(); }
    },
    fallback() {
      // a lock that worked before can be refused briefly after Esc: just show the pause/resume screen
      if (this.everLocked) { if (G.started && !G.UI.open && !G.Player.dead) { this.paused = true; $('#pause').classList.remove('hidden'); } return; }
      this.noLock = true; this.paused = false; $('#pause').classList.add('hidden'); G.UI.toast('Mouse lock unavailable here: hold Right Mouse to look around', null, 'warn'); },
    unlock() { if (document.pointerLockElement) document.exitPointerLock(); },
  };
  document.addEventListener('pointerlockchange', () => {
    I.locked = document.pointerLockElement === G.renderer.domElement;
    if (I.locked) { I.everLocked = true; I.paused = false; $('#pause').classList.add('hidden'); }
    else if (G.started && !G.UI.open && !G.Player.dead && !I.noLock) { I.paused = true; $('#pause').classList.remove('hidden'); G.save(true); }
  });
  document.addEventListener('pointerlockerror', () => I.fallback());
  document.addEventListener('mousemove', e => {
    if (I.locked || (I.noLock && I.mouse.r && I.active())) { I.dx += e.movementX || 0; I.dy += e.movementY || 0; }
  });
  document.addEventListener('mousedown', e => {
    G.Audio.start();
    if (!G.started || G.UI.open) return;
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
    if (e.code === 'Tab') e.preventDefault();
    if (!G.started) return;
    I.keys[e.code] = true;
    if (e.repeat) return;
    const U = G.UI, P = G.Player, B = G.Build;
    if (P.dead) return;
    if (e.code === 'Escape') { if (U.open) { U.closeAll(); I.lock(); } else if (B.mode) B.stopBuild(); return; }
    if (e.code === 'Tab' || e.code === 'KeyI') { if (U.open === 'inv') { U.closeAll(); I.lock(); } else if (!I.paused) U.openInventory(); return; }
    if (e.code === 'KeyB') { if (U.open === 'build') { U.closeAll(); I.lock(); } else if (!I.paused && !P.mount) U.openBuild(); return; }
    if (e.code === 'KeyH') { $('#help').classList.toggle('hidden'); return; }
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
  function init() {
    const r = G.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.setSize(window.innerWidth, window.innerHeight);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.autoClear = false;
    document.body.prepend(r.domElement);
    const scene = G.scene = new THREE.Scene();
    G.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(G.camera);

    // image-based ambient from a soft gradient sky (keeps metals readable)
    const envScene = new THREE.Scene();
    const eg = new THREE.SphereGeometry(10, 16, 8); const ec = [];
    const top = new THREE.Color(0x8fbde8), hor = new THREE.Color(0xe8e4d8), bot = new THREE.Color(0x5c5a44);
    const pa = eg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 10; const c = y > 0 ? hor.clone().lerp(top, y) : hor.clone().lerp(bot, -y * 2); ec.push(c.r, c.g, c.b); }
    eg.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3));
    envScene.add(new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(envScene, 0.04).texture;

    G.Lights.init(scene, 6);
    G.Particles.init(scene);
    G.World.init(scene, SEED);
    G.Build.init(scene);
    G.inv = new G.Inventory(30); G.inv.hotbar = 8;
    G.Player.init();
    G.Player.vmScene.environment = scene.environment;
    G.UI.init();
    G.Player.spawnAt(G.World.spawn.x, G.World.spawn.z);
    G.Creatures.spawnInitial();
    G.UI.refreshHotbar();

    window.addEventListener('resize', () => {
      r.setSize(window.innerWidth, window.innerHeight);
      G.camera.aspect = window.innerWidth / window.innerHeight; G.camera.updateProjectionMatrix();
      G.Player.vmCam.aspect = G.camera.aspect; G.Player.vmCam.updateProjectionMatrix();
    });
    G.Player.vmCam.aspect = G.camera.aspect; G.Player.vmCam.updateProjectionMatrix();

    // title / menus
    const cont = $('#btn-continue');
    if (G.hasSave()) cont.classList.remove('hidden');
    cont.onclick = () => start(true);
    // two-step confirm inside the page (native confirm() dialogs are not available everywhere)
    const confirmBtn = (btn, label, fn) => {
      const orig = btn.textContent; let armed = false, t = 0;
      btn.onclick = () => {
        if (!armed) { armed = true; btn.textContent = label; btn.classList.add('armed'); clearTimeout(t); t = setTimeout(() => { armed = false; btn.textContent = orig; btn.classList.remove('armed'); }, 3500); return; }
        clearTimeout(t); fn();
      };
    };
    if (G.hasSave()) confirmBtn($('#btn-new'), 'Erase save and start over?', () => { G.wipeSave(); start(false); });
    else $('#btn-new').onclick = () => start(false);
    $('#btn-resume').onclick = () => I.lock();
    $('#btn-save').onclick = () => G.save();
    $('#btn-help').onclick = () => $('#help').classList.toggle('hidden');
    confirmBtn($('#btn-wipe'), 'Click again to erase this world', () => { G.wipeSave(); G.started = false; G.noSave = true; location.reload(); });
    const sens = $('#sens'); sens.value = G.settings.sens;
    sens.oninput = () => { G.settings.sens = +sens.value; try { localStorage.setItem('aetherwild_settings', JSON.stringify(G.settings)); } catch (e) { } };
    $('#loading').classList.add('hidden'); $('#title').classList.remove('hidden');
    requestAnimationFrame(loop);
  }

  function start(load) {
    G.Audio.start();
    if (load && !G.loadSave()) load = false;
    if (!load) {
      G.Player.spawnAt(G.World.spawn.x, G.World.spawn.z);
      G.Player.yaw = Math.atan2(-(0 - G.World.spawn.x), -(0 - G.World.spawn.z));
      G.UI.toast('Welcome to the Aetherwild. Punch trees to begin.', null, 'good');
    }
    G.started = true;
    $('#title').classList.add('hidden'); $('#hud').classList.remove('hidden');
    G.UI.refreshHotbar();
    I.lock();
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
      const sp = G.World.spawn, a = G.time * 0.04;
      const cx = sp.x + Math.cos(a) * 70, cz = sp.z + Math.sin(a) * 70;
      G._ty = G.damp(G._ty || 40, Math.max(G.World.height(cx, cz) + 18, G.World.height(sp.x, sp.z) + 30), 2, dt);
      cam.position.set(cx, G._ty, cz);
      cam.lookAt(sp.x, G.World.height(sp.x, sp.z) + 4, sp.z);
      cam.updateMatrixWorld(); G.camPos.copy(cam.position); cam.getWorldDirection(G.camDir);
      G.World.update(dt * 0.3, cam); G.Creatures.update(dt); G.Lights.update(cam);
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
    G.Audio.update();
    saveT -= dt; if (saveT <= 0) { saveT = 60; G.save(true); }
    r.clear(); r.render(G.scene, cam);
    if (!P.mount) { r.clearDepth(); r.render(P.vmScene, P.vmCam); }
  }

  window.addEventListener('beforeunload', () => { if (!G.noSave) G.save(true); });
  window.addEventListener('load', () => setTimeout(init, 30));
})();
