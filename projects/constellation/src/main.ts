// src/main.ts — the integration seam (WO-003). Loads the autosave or else the seed through the
// core (loadSaved / validateDoc), creates the graph, starts autosave, builds the renderer and the
// instruments, and installs window.__constellation (the e2e hook; experience.md §13 `__cst`).
// URL flags: ?seed=1 ignores the autosave (fresh seed); ?stress=N shows a generated N-node memory
// (never autosaved) for the frame-time budget.
import './styles/app.css';
import seedJson from './seed/memory.json';
import { AUTOSAVE_KEY, createGraph, exportJson, loadSaved, startAutosave, validateDoc } from './core/index.ts';
import type { KeyValueStorage, MemoryDoc } from './core/index.ts';
import type { ConstellationState, ConstellationTestHook } from './view/contracts.ts';
import { createRenderer } from './view/renderer.ts';
import { App } from './ui/app.ts';
import { byId, h } from './ui/dom.ts';
import { Shell } from './ui/shell.ts';
import { stressDoc } from './ui/stress.ts';
import { toast } from './ui/toasts.ts';

const params = new URLSearchParams(location.search);
const stress = Number(params.get('stress') ?? 0) || 0;
const freshSeed = params.has('seed') && params.get('seed') !== '0';
// ?memory=<name> opens a personal memory bundled from src/memories/<name>.json (M-0003). It autosaves
// to its own slot; a newer version of the file (a different stamp) replaces the browser's copy.
const memories = import.meta.glob<unknown>('./memories/*.json', { eager: true, import: 'default' });
const memoryName = (params.get('memory') ?? '').toLowerCase();
const memoryFile = /^[a-z0-9-]{1,40}$/.test(memoryName) ? memories[`./memories/${memoryName}.json`] : undefined;

/** A short, stable fingerprint of a memory file (FNV-1a over its JSON text). */
function stampOf(value: unknown): string {
  const text = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36) + ':' + text.length.toString(36);
}
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

function storage(): KeyValueStorage | null {
  try {
    const s = window.localStorage;
    const k = '__constellation_probe';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function boot(): void {
  const seed = validateDoc(seedJson);
  if (!seed.ok) throw new Error(`Seed memory is invalid: ${seed.errors.map((e) => e.message).join(' ')}`);
  const store = stress ? null : storage();
  let doc: MemoryDoc = seed.doc;
  let returning = false;
  let note = '';
  let unreadable: string | null = null;
  let saveKey = AUTOSAVE_KEY;
  let personal = false;
  let personalBase: MemoryDoc | null = null;
  let memoryNote = '';
  let keptAside: { count: number; names: string[]; raw: string | null } | null = null;
  if (memoryName && !stress) {
    const file = memoryFile === undefined ? null : validateDoc(memoryFile);
    if (file?.ok) {
      personal = true;
      doc = file.doc;
      personalBase = file.doc;
      saveKey = `${AUTOSAVE_KEY}.${memoryName}`;
      const stamp = stampOf(memoryFile);
      try {
        // Same file as last visit: reopen the browser's copy (with any stars stored by hand).
        if (store && store.getItem(`${saveKey}.stamp`) === stamp) {
          const saved = loadSaved(store, saveKey);
          if (saved?.ok) ((doc = saved.doc), (returning = true));
        } else if (store) {
          // A newer file replaces the browser's copy. Stars added by hand are kept aside, never dropped
          // silently (F-004): the notice offers them as a download.
          const old = loadSaved(store, saveKey);
          if (old?.ok) {
            const fileIds = new Set(file.doc.nodes.map((n) => n.id));
            const extra = old.doc.nodes.filter((n) => !fileIds.has(n.id));
            if (extra.length) {
              const raw = store.getItem(saveKey);
              if (raw !== null) store.setItem(`${saveKey}.previous`, raw);
              keptAside = { count: extra.length, names: extra.slice(0, 3).map((n) => n.label), raw };
            }
          }
          store.removeItem(saveKey);
          store.setItem(`${saveKey}.stamp`, stamp);
        }
      } catch {
        /* storage blocked: the file opens, unsaved (handled below) */
      }
    } else {
      memoryNote = file
        ? `The memory "${memoryName}" couldn't be opened (${file.errors[0]?.message ?? 'unknown problem'}), so your usual memory is shown.`
        : `There's no memory called "${memoryName}" here, so your usual memory is shown.`;
    }
  }
  if (stress) {
    const s = validateDoc(stressDoc(stress));
    if (s.ok) doc = s.doc;
  } else if (personal) {
    /* opened above */
  } else if (store && !freshSeed) {
    const saved = loadSaved(store);
    if (saved?.ok) {
      doc = saved.doc;
      returning = true;
    } else if (saved && !saved.ok) {
      // Keep the unreadable copy aside before autosave can overwrite it (F-004).
      unreadable = store.getItem(AUTOSAVE_KEY);
      try {
        if (unreadable !== null) store.setItem(`${AUTOSAVE_KEY}.unreadable`, unreadable);
      } catch {
        /* quota: the download action below still has it in memory */
      }
      note = `Your saved memory couldn't be opened (${saved.errors[0]?.message ?? 'unknown problem'}), so the seed is shown. The unreadable copy is kept aside; download it to repair or keep it.`;
    }
  }
  const graph = createGraph(doc);
  const stage = byId('stage');

  if (!hasWebGL()) {
    document.body.classList.remove('intro');
    document.body.classList.add('show-brand', 'show-tools');
    const exp = h('button.btn.primary', { type: 'button' }, 'Export my memory');
    exp.addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([exportJson(graph)], { type: 'application/json' }));
      const a = h('a', { href: url, download: 'constellation-memory.json' });
      document.body.append(a);
      a.click();
      a.remove();
    });
    document.body.append(
      h(
        'div.nogl',
        { role: 'alert' },
        h('div.inner.panel', {}, h('h2', { style: 'font-size:19px;font-weight:700' }, 'No WebGL here'), h('p', {}, "This memory needs WebGL to draw, and this browser has it off or unsupported. Your data is safe: you can still export it."), h('div.row', {}, exp)),
      ),
    );
    byId('topbar').setAttribute('inert', '');
    if (store && !stress) startAutosave(graph, store, { key: saveKey });
    window.__constellation = {
      ready: true,
      perspective: graph.meta.defaultPerspective,
      stats: () => ({ fps: 0, frameMs: 0, drawCalls: 0, nodes: graph.nodes().length, relations: graph.relations().length }),
      screenPosition: () => null,
      nodeIdByLabel: (l) => graph.findByLabel(l)?.id ?? null,
      idle: async () => {},
    };
    return;
  }

  const renderer = createRenderer({ container: stage, reducedMotion: motionQuery.matches });
  // The baseline ("what you stored", Reset) is the memory file when a personal memory is open (F-002).
  const base = personal ? personalBase! : seed.doc;
  const seedIds = new Set(base.nodes.map((n) => n.id));
  const app = new App(graph, renderer, seedIds, base, motionQuery.matches);
  if (personal) app.baseLabel = 'the latest published version';
  const shell = new Shell(app);
  const extras = app.extras;
  motionQuery.addEventListener('change', (e) => {
    app.reduced = e.matches;
    renderer.setReducedMotion(e.matches);
  });

  new ResizeObserver(() => renderer.resize(stage.clientWidth, stage.clientHeight)).observe(stage);
  renderer.setScene(app.builder.build(app.lens));
  extras.playIntro({ speed: returning ? 0.5 : 1 });
  shell.startIntro(returning, extras.clock.now());
  app.renderAll();

  if (store) {
    // Saved is shown only after a write the browser accepted (F-001).
    const tracked: KeyValueStorage = {
      getItem: (k) => store.getItem(k),
      removeItem: (k) => store.removeItem(k),
      setItem: (k, v) => {
        store.setItem(k, v);
        shell.savedConfirmed();
      },
    };
    const options = {
      key: saveKey,
      onError: () => {
        shell.notSaved();
        toast("Couldn't save to this browser (storage is full or blocked). Export a copy so nothing is lost.", {
          key: 'storage',
          error: true,
          timeout: 0,
          actions: [{ label: 'Export', run: () => app.exportFile() }],
        });
      },
    };
    let stop = startAutosave(graph, tracked, options);
    // Flush pending edits when the page is hidden or closed, then keep saving (F-005).
    const flush = () => {
      stop();
      stop = startAutosave(graph, tracked, options);
    };
    addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  } else if (!stress) {
    app.persistent = false;
    shell.notSaved();
    toast("Not saved: this browser won't keep your memory (storage is blocked). Export to keep a copy.", {
      key: 'storage',
      error: true,
      timeout: 0,
      actions: [{ label: 'Export', run: () => app.exportFile() }],
    });
  }
  if (memoryNote) toast(memoryNote, { key: 'memory', error: true, timeout: 0 });
  if (keptAside) {
    const k = keptAside;
    const what = k.count === 1 ? `"${k.names[0]}"` : `${k.count} stars you added here (${k.names.join(', ')}${k.count > 3 ? '…' : ''})`;
    toast(`Your memory was updated. ${what} ${k.count === 1 ? 'was' : 'were'} only in this browser, so a copy is kept aside.`, {
      key: 'kept',
      timeout: 0,
      actions: k.raw === null ? [] : [{ label: 'Download it', run: () => download(`constellation-${memoryName}-browser-copy.json`, k.raw!) }],
    });
  }
  if (note) {
    const raw = unreadable;
    toast(note, {
      key: 'load',
      error: true,
      timeout: 0,
      actions: raw === null ? [] : [{ label: 'Download it', run: () => download('constellation-memory-unreadable.json', raw) }],
    });
  }

  const state = (): ConstellationState => {
    const pw = app.activePathway;
    const runs: ConstellationState['runs'] = {};
    for (const [lens, rec] of app.runs.get(pw ?? '') ?? []) runs[lens] = rec.trace.status === 'ended' ? String(rec.trace.result) : (rec.trace.error ?? rec.trace.status);
    let loopBadge: number | null = null;
    if (app.playing) {
      const steps = app.playing.trace.steps.slice(0, app.playing.index + 1);
      loopBadge = steps.filter((s, i) => s.op === 'while' && steps.slice(0, i).some((t) => t.nodeId === s.nodeId)).length;
    } else if (pw) {
      const rec = app.runs.get(pw)?.get(app.lens);
      if (rec) loopBadge = rec.loops;
    }
    const v = app.route;
    return {
      ...extras.debugState(),
      lens: app.lens,
      lights: graph.nodes().length,
      statsText: app.statsText(),
      route: v ? { declared: v.cmp.declared?.hops ?? null, shortest: v.cmp.shortest?.hops ?? null, chip: v.verdict } : null,
      activationCounts: app.activationCounts(),
      runs,
      loopBadge,
    };
  };

  const hook: ConstellationTestHook = {
    ready: true,
    get perspective() {
      return app.lens;
    },
    stats: () => renderer.stats(),
    screenPosition: (id) => renderer.screenPosition(id),
    nodeIdByLabel: (label) => graph.findByLabel(label)?.id ?? null,
    idle: () => extras.whenIdle(),
    clock: extras.clock,
    state,
  };
  window.__constellation = hook;
}

boot();
