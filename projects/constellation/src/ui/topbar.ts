// src/ui/topbar.ts — wordmark + live stats, the lens switcher, search, Store and the ⋯ menu (§10).
import type { App } from './app.ts';
import { byId, clear, h } from './dom.ts';

export class Topbar {
  private app: App;
  private lenses = byId('lenses');
  private stats = byId('stats');
  private search = byId<HTMLInputElement>('search');
  private menuBtn = byId<HTMLButtonElement>('menu-open');
  private menu = byId('menu');
  private underline = h('span.lens-underline', { 'aria-hidden': 'true' });
  private lensKey = '';
  soundOn = false;
  onStore: () => void = () => {};
  onImport: () => void = () => {};
  onKeymap: () => void = () => {};

  constructor(app: App) {
    this.app = app;
    let pending = 0;
    this.search.addEventListener('input', () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => app.runSearch(this.search.value));
    });
    byId('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      app.runSearch(this.search.value);
      app.openDrawer('results', false);
      document.querySelector<HTMLElement>('#drawer .rlist button')?.focus();
    });
    byId('store-open').addEventListener('click', () => this.onStore());
    this.menuBtn.addEventListener('click', () => (this.menu.hidden ? this.openMenu() : this.closeMenu()));
    this.menu.addEventListener('keydown', (e) => this.menuKeys(e));
    document.addEventListener('pointerdown', (e) => {
      if (!this.menu.hidden && !this.menu.contains(e.target as Node) && e.target !== this.menuBtn && !this.menuBtn.contains(e.target as Node)) this.closeMenu(false);
    });
    window.addEventListener('resize', () => this.placeUnderline());
    document.fonts?.ready.then(() => this.placeUnderline()).catch(() => {});
  }

  render(): void {
    const app = this.app;
    const ps = app.graph.perspectives();
    const key = ps.map((p) => p.id + p.label).join('|');
    if (key !== this.lensKey) {
      this.lensKey = key;
      clear(this.lenses);
      ps.forEach((p, i) => {
        const b = h(
          'button.lens-pill',
          { type: 'button', 'data-lens': p.id, 'aria-pressed': 'false', 'aria-keyshortcuts': i < 9 ? String(i + 1) : undefined, title: p.description ?? `See the memory as the ${p.label}`, style: `--c:${app.lensCss(p.id)}` },
          h('span.dot', { 'aria-hidden': 'true' }),
          h('span', {}, p.label),
          i < 9 ? h('kbd', { 'aria-hidden': 'true' }, String(i + 1)) : null,
        );
        b.addEventListener('click', () => void app.setLens(p.id));
        this.lenses.append(b);
      });
      this.lenses.append(this.underline);
    }
    for (const b of this.lenses.querySelectorAll<HTMLButtonElement>('.lens-pill')) b.setAttribute('aria-pressed', String(b.dataset.lens === app.lens));
    this.stats.textContent = app.statsText();
    this.placeUnderline();
  }

  placeUnderline(): void {
    const active = this.lenses.querySelector<HTMLElement>('.lens-pill[aria-pressed="true"]');
    if (!active) return;
    const inset = 14;
    this.underline.style.width = `${Math.max(12, active.offsetWidth - inset * 2)}px`;
    this.underline.style.transform = `translateX(${active.offsetLeft + inset}px)`;
  }

  // ── Menu ─────────────────────────────────────────────────────────────────────────
  private openMenu(): void {
    const app = this.app;
    clear(this.menu);
    const item = (label: string, run: () => void, hint?: string) => {
      const b = h('button', { type: 'button', role: 'menuitem', tabindex: '-1' }, h('span', {}, label), hint ? h('kbd', {}, hint) : null);
      b.addEventListener('click', () => {
        this.closeMenu();
        run();
      });
      return b;
    };
    const sound = h('button', { type: 'button', role: 'menuitemcheckbox', 'aria-checked': String(this.soundOn), tabindex: '-1' }, h('span', {}, `Sound: ${this.soundOn ? 'on' : 'off'}`));
    sound.addEventListener('click', () => {
      this.soundOn = !this.soundOn;
      this.closeMenu();
    });
    this.menu.append(
      item('Import…', () => this.onImport()),
      item('Export', () => app.exportFile(), 'Ctrl E'),
      item('Open the Guidebook example', () => void app.openGuidebook()),
      item('Reset to seed', () => void app.resetToSeed()),
      h('hr', { role: 'separator' }),
      sound,
      item('Key map', () => this.onKeymap(), '?'),
    );
    this.menu.hidden = false;
    this.menuBtn.setAttribute('aria-expanded', 'true');
    (this.menu.querySelector('[role^="menuitem"]') as HTMLElement | null)?.focus();
  }

  closeMenu(focusButton = true): boolean {
    if (this.menu.hidden) return false;
    this.menu.hidden = true;
    this.menuBtn.setAttribute('aria-expanded', 'false');
    if (focusButton) this.menuBtn.focus();
    return true;
  }

  get menuOpen(): boolean {
    return !this.menu.hidden;
  }

  private menuKeys(e: KeyboardEvent): void {
    const items = [...this.menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = items.length;
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (e.key === 'Tab') this.closeMenu(false);
  }
}
