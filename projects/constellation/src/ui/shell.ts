// src/ui/shell.ts — composes the panels and owns the page-level behaviour: keyboard map (§12),
// Esc unwinding one layer at a time, hover card, intro choreography (§4), panel insets, Saved chip.
import type { NodeId } from '../core/index.ts';
import type { Insets } from '../view/contracts.ts';
import { lerp } from '../view/motion.ts';
import type { App, Panels } from './app.ts';
import { byId, h, isTypingTarget } from './dom.ts';
import { Drawer } from './drawer.ts';
import { KIND_NAME } from './format.ts';
import { Inspector } from './inspector.ts';
import { Sound } from './sound.ts';
import { LinkMode, StoreSheet } from './store.ts';
import { dismissToast, keymapDialog, toast } from './toasts.ts';
import { Topbar } from './topbar.ts';

export class Shell implements Panels {
  readonly topbar: Topbar;
  readonly drawer: Drawer;
  readonly inspector: Inspector;
  readonly store: StoreSheet;
  readonly linker: LinkMode;
  readonly sound = new Sound();
  private app: App;
  private card = byId('hovercard');
  private saved = byId('saved');
  private savedHide = 0;
  private insets: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  private insetTarget: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  private insetFrom: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
  private insetT0 = 0;
  private hintShown = false;
  private intro = { t0: 0, speed: 1, stage: 0, returning: false };
  private longPress = 0;

  constructor(app: App) {
    this.app = app;
    this.topbar = new Topbar(app);
    this.drawer = new Drawer(app);
    this.inspector = new Inspector(app);
    this.store = new StoreSheet(app);
    this.linker = new LinkMode(app);
    app.panels = this;
    this.topbar.onStore = () => this.store.show(app.selected ?? undefined);
    this.topbar.onImport = () => byId<HTMLInputElement>('import-file').click();
    this.topbar.onKeymap = () => keymapDialog();
    this.drawer.onClose = () => app.closeDrawer();
    this.inspector.onClose = () => app.closeInspector();
    this.inspector.onLink = (id) => this.linker.start(id);
    this.wireSoundToggle();

    byId<HTMLInputElement>('import-file').addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      const f = input.files?.[0];
      input.value = '';
      if (!f) return;
      void app.importText(f.name, await f.text());
    });

    document.addEventListener('keydown', (e) => this.keydown(e));
    document.addEventListener('keyup', (e) => {
      if (e.key === 'd' || e.key === 'D') app.extras.setGhostsExpanded(false);
    });
    window.addEventListener('blur', () => app.extras.setGhostsExpanded(false));
    window.addEventListener('resize', () => this.layout());

    app.renderer.onHover((id) => this.hover(id));
    app.extras.onFrame((t) => this.frame(t));

    // Touch: a 450 ms long-press on a light starts link mode.
    const stage = byId('stage');
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      const x = e.clientX;
      const y = e.clientY;
      window.clearTimeout(this.longPress);
      this.longPress = window.setTimeout(() => {
        const id = this.nodeAt(x, y);
        if (id) this.linker.start(id);
      }, 450);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointermove'] as const) {
      stage.addEventListener(ev, (e) => {
        if (ev === 'pointermove' && e.pointerType === 'touch' && Math.abs(e.movementX) + Math.abs(e.movementY) < 3) return;
        window.clearTimeout(this.longPress);
      });
    }
    // First input dismisses the hint.
    const firstInput = () => {
      dismissToast('hint');
      this.hintShown = true;
    };
    window.addEventListener('pointerdown', firstInput, { once: true });
    window.addEventListener('keydown', firstInput, { once: true });
    window.addEventListener('wheel', firstInput, { once: true, passive: true });
  }

  private nodeAt(x: number, y: number): NodeId | null {
    let best: NodeId | null = null;
    let bestD = 24;
    for (const n of this.app.graph.nodes()) {
      const p = this.app.renderer.screenPosition(n.id);
      if (!p) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) ((bestD = d), (best = n.id));
    }
    return best;
  }

  private wireSoundToggle(): void {
    const app = this.app;
    const orig = app.renderer.playTrace.bind(app.renderer);
    // Sound rides on trace visits and route arrivals; nothing plays unless the toggle is on.
    app.renderer.playTrace = (trace, options) =>
      orig(trace, {
        ...options,
        onStep: (i) => {
          options?.onStep?.(i);
          this.sound.enabled = this.topbar.soundOn;
          const s = trace.steps[i];
          if (!s) return;
          const loops = trace.steps.slice(0, i).filter((x) => x.nodeId === s.nodeId && x.op === 'while').length;
          if (s.branch === 'false') this.sound.falseBlip();
          else this.sound.visit(loops);
          if (i === trace.steps.length - 1) window.setTimeout(() => this.sound.result(), 300);
        },
      });
    const origRoutes = app.renderer.highlightRoutes.bind(app.renderer);
    app.renderer.highlightRoutes = (trails) => {
      origRoutes(trails);
      this.sound.enabled = this.topbar.soundOn;
      for (const t of trails) if (t.role !== 'learned') this.sound.tick(t.route.hops * 160);
    };
  }

  // ── Panels ───────────────────────────────────────────────────────────────────────
  renderTopbar(): void {
    this.topbar.render();
  }

  renderDrawer(): void {
    this.drawer.render();
    this.layout();
  }

  renderInspector(): void {
    this.inspector.render();
    this.layout();
  }

  traceProgress(index: number): void {
    this.drawer.traceProgress(index);
  }

  /** Classes for rail / bottom-sheet layouts and the camera insets for the free area. */
  layout(): void {
    const app = this.app;
    const w = innerWidth;
    const mobile = w < 768;
    const drawerOpen = !!app.drawerTab;
    const inspOpen = app.inspectorOpen;
    document.body.classList.toggle('body-inspector', mobile && inspOpen);
    document.body.classList.toggle('body-sheet', mobile && (inspOpen || drawerOpen));
    this.drawer.el.classList.toggle('rail', !mobile && w < 1280 && drawerOpen && inspOpen);
    const next: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
    if (mobile) {
      const open = inspOpen ? this.inspector.el : drawerOpen ? this.drawer.el : null;
      if (open && !open.hidden) next.bottom = open.getBoundingClientRect().height;
      next.top = 100;
    } else {
      if (drawerOpen && !this.drawer.el.hidden) next.left = this.drawer.el.getBoundingClientRect().right;
      if (inspOpen && !this.inspector.el.hidden) next.right = w - this.inspector.el.getBoundingClientRect().left;
      next.top = 56;
    }
    const t = this.insetTarget;
    if (t.left !== next.left || t.right !== next.right || t.bottom !== next.bottom || t.top !== next.top) {
      this.insetFrom = { ...this.insets };
      this.insetTarget = next;
      this.insetT0 = performance.now();
    }
  }

  // ── Frame hooks ──────────────────────────────────────────────────────────────────
  startIntro(returning: boolean, now: number): void {
    this.intro = { t0: now, speed: returning ? 0.5 : 1, stage: 0, returning };
    document.body.classList.add('intro');
    if (this.app.reduced) {
      this.intro.speed = 0.08;
    }
  }

  private frame(t: number): void {
    // Insets tween 220 ms so the camera centre glides with the panels.
    const u = Math.min(1, (performance.now() - this.insetT0) / 220);
    const f = this.insetFrom;
    const g = this.insetTarget;
    const k = this.app.reduced ? 1 : 1 - Math.pow(1 - u, 3);
    const next = { left: lerp(f.left, g.left, k), right: lerp(f.right, g.right, k), top: lerp(f.top, g.top, k), bottom: lerp(f.bottom, g.bottom, k) };
    if (next.left !== this.insets.left || next.right !== this.insets.right || next.bottom !== this.insets.bottom || next.top !== this.insets.top) {
      this.insets = next;
      // Top is chrome, not cover: keep the centre on the full height on desktop.
      // The top bar covers 56 px: framing centres on the area below it (F-023).
      this.app.extras.setInsets(next);
    }
    // Intro choreography from the render clock.
    const it = this.intro;
    if (it.stage < 3) {
      const dt = (t - it.t0) / it.speed;
      if (it.stage < 1 && dt >= 1800) {
        document.body.classList.add('show-brand');
        it.stage = 1;
      }
      if (it.stage < 2 && dt >= 2400) {
        document.body.classList.add('show-tools');
        it.stage = 2;
      }
      if (it.stage < 3 && dt >= 3200) {
        it.stage = 3;
        document.body.classList.remove('intro');
        this.greet();
      }
    }
    // Hover card follows the pointer.
    if (!this.card.hidden) {
      const p = this.app.extras.pointer();
      if (p) this.placeCard(p.x, p.y);
    }
  }

  private greet(): void {
    const app = this.app;
    if (this.intro.returning) {
      const stored = app.graph.nodes().filter((n) => !app.seedIds.has(n.id));
      const n = app.graph.nodes().length;
      const newest = [...stored].sort((a, b) => b.created - a.created)[0];
      const text = stored.length
        ? `Welcome back. ${n} lights. The ${stored.length} you stored ${stored.length === 1 ? 'is' : 'are'} where you left ${stored.length === 1 ? 'it' : 'them'}.`
        : `Welcome back. ${n} lights, as you left them.`;
      toast(text, { key: 'hint', timeout: 6000, actions: newest ? [{ label: `Show ${newest.label}`, run: () => app.select(newest.id, { fly: true, open: true }) }] : [] });
    } else if (!this.hintShown) {
      const touch = matchMedia('(pointer: coarse)').matches;
      toast(touch ? 'Drag to look around · tap a light · tap search to ask.' : 'Drag to look around · click a light · press / to ask.', { key: 'hint', timeout: 5800 });
    }
  }

  /** A write the browser accepted: show "Saved" for 1.2 s (never when storage failed). */
  savedConfirmed(): void {
    if (this.saved.classList.contains('bad')) {
      this.saved.classList.remove('bad');
      this.saved.textContent = 'Saved';
      dismissToast('storage');
    }
    window.clearTimeout(this.savedHide);
    this.saved.classList.add('on');
    this.savedHide = window.setTimeout(() => this.saved.classList.remove('on'), 1200);
  }

  /** Storage unavailable or failing: a persistent "Not saved" chip. */
  notSaved(): void {
    window.clearTimeout(this.savedHide);
    this.saved.textContent = 'Not saved';
    this.saved.classList.add('on', 'bad');
  }

  // ── Hover card ───────────────────────────────────────────────────────────────────
  private hover(id: NodeId | null): void {
    const app = this.app;
    const n = id ? app.graph.getNode(id) : undefined;
    if (!n || matchMedia('(pointer: coarse)').matches) {
      this.card.hidden = true;
      return;
    }
    const value = n.kind === 'pathway' ? (n.pathway?.expr ?? n.pathway?.op ?? '') : app.valueText(n);
    const others = app.graph.perspectives().filter((p) => p.id !== app.lens && app.units.show(n, p.id) !== app.valueText(n)).length;
    const parts: HTMLElement[] = [h('span.h-name', {}, n.label), h('span.h-kind', {}, KIND_NAME[n.kind])];
    if (value && value !== '—') parts.push(h('span.h-val', {}, value));
    if (others && n.kind !== 'pathway') parts.push(h('span.h-more', {}, `+${others} other ${others === 1 ? 'view' : 'views'}`));
    this.card.replaceChildren(...parts);
    this.card.hidden = false;
    const p = app.extras.pointer();
    if (p) this.placeCard(p.x, p.y);
  }

  private placeCard(x: number, y: number): void {
    const r = this.card.getBoundingClientRect();
    const left = x + 14 + r.width > innerWidth - 8 ? x - 14 - r.width : x + 14;
    const top = Math.min(innerHeight - r.height - 8, Math.max(8, y + 14));
    this.card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  // ── Keyboard (§12) ───────────────────────────────────────────────────────────────
  private escape(target: EventTarget | null): boolean {
    const app = this.app;
    if (this.linker.escape()) return true;
    if (this.topbar.closeMenu()) return true;
    const search = byId<HTMLInputElement>('search');
    if (target === search) {
      if (search.value) app.clearSearch();
      else search.blur();
      return true;
    }
    if (app.query) {
      app.clearSearch();
      return true;
    }
    if (app.playing) {
      app.stopRun();
      app.renderAll();
      return true;
    }
    if (app.route) {
      app.clearRoute();
      return true;
    }
    if (app.inspectorOpen) {
      app.closeInspector();
      return true;
    }
    if (app.drawerTab) {
      app.closeDrawer();
      return true;
    }
    if (app.selected) {
      app.select(null);
      return true;
    }
    return false;
  }

  private keydown(e: KeyboardEvent): void {
    const app = this.app;
    if (document.querySelector('dialog[open]')) return; // modal dialogs own their keys (Esc → cancel)
    const typing = isTypingTarget(e.target);
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    if (key === 'Escape') {
      if (this.escape(e.target)) e.preventDefault();
      return;
    }
    if (mod && (key === 'e' || key === 'E')) {
      e.preventDefault();
      app.exportFile();
      return;
    }
    if (mod && (key === 'z' || key === 'Z') && !typing) {
      e.preventDefault();
      app.undo();
      return;
    }
    if (typing || mod || e.altKey) return;
    const onButton = e.target instanceof HTMLElement && e.target !== document.body && e.target.matches('button, a, [role="tab"], [role="menuitem"], summary, input, select, textarea');
    const sel = app.selected;
    const lensIndex = Number(key);
    if (Number.isInteger(lensIndex) && lensIndex >= 1 && lensIndex <= 9) {
      const p = app.graph.perspectives()[lensIndex - 1];
      if (p) {
        e.preventDefault();
        void app.setLens(p.id);
      }
      return;
    }
    switch (key) {
      case '/':
        e.preventDefault();
        byId('search').focus();
        return;
      case '?':
        e.preventDefault();
        keymapDialog();
        return;
      case 'n':
      case 'N':
        e.preventDefault();
        this.store.show(sel ?? undefined);
        return;
      case 'l':
      case 'L':
        if (sel) {
          e.preventDefault();
          this.linker.start(sel);
        } else toast('Select a light first, then press L to link it.', { key: 'link-hint', timeout: 2600 });
        return;
      case 'r':
      case 'R':
        e.preventDefault();
        app.openDrawer('route', false);
        this.drawer.focusRouteFrom();
        return;
      case 'p':
      case 'P':
        e.preventDefault();
        app.openDrawer('pathways', true);
        return;
      case 'f':
      case 'F':
        if (sel) void app.renderer.focusNode(sel);
        return;
      case 'Home':
        e.preventDefault();
        void app.extras.home();
        return;
      case 'd':
      case 'D':
        if (!e.repeat) app.extras.setGhostsExpanded(true);
        return;
      case 's':
      case 'S':
        e.preventDefault();
        app.step();
        return;
      case ' ':
        if (onButton) return;
        e.preventDefault();
        if (app.activePathway) void app.run(app.activePathway);
        return;
      case 'Enter':
        if (onButton) return;
        if (sel) {
          app.inspectorOpen = true;
          this.renderInspector();
          this.inspector.el.querySelector<HTMLElement>('button')?.focus();
        }
        return;
      case '[':
      case ']': {
        if (!sel) return;
        // Cycle through the neighbours of the node you started from.
        const base = this.cycleBase && this.cycleBase !== sel && app.neighbours(this.cycleBase).includes(sel) ? this.cycleBase : sel;
        const nb = app.neighbours(base);
        if (!nb.length) return;
        const i = nb.indexOf(sel);
        const step = key === ']' ? 1 : -1;
        const next = nb[i < 0 ? (step > 0 ? 0 : nb.length - 1) : (i + step + nb.length) % nb.length]!;
        this.cycleBase = base;
        app.select(next, { fly: false });
        return;
      }
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        if (onButton) return;
        e.preventDefault();
        const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key] as [number, number];
        if (!sel) {
          const root = app.hub();
          if (root) app.select(root.id, { fly: false });
          return;
        }
        const next = app.extras.neighbourInDirection(sel, dir[0], dir[1], app.neighbours(sel)) ?? app.extras.neighbourInDirection(sel, dir[0], dir[1], app.graph.nodes().map((n) => n.id));
        if (next) app.select(next, { fly: false });
        return;
      }
    }
  }

  private cycleBase: NodeId | null = null;
}
