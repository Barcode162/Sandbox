// main.js: boot. Creates the C4 runtime objects in their contract order:
// env → ambient → engine → rewind → admire → chrome. The engine sets data-boot=ready and resolves
// __showcase.ready after its first applied frame.
// Every factory is wired from wave 0 (WO-001 stubs), so wave-2 work orders replace factory bodies
// only and never edit this file. Owner chain: WO-001 → WO-006 → WO-014 → WO-025 → WO-024.

import scenes from './scenes/index.js';
import { prefersReduced, safeStorage } from './core/env.js';
import { createAnnounce } from './core/announce.js';
import { createAmbient } from './engine/ambient.js';
import { createEngine } from './engine/engine.js';
import { createRewind } from './engine/rewind.js';
import { createAdmire } from './engine/admire.js';
import { createChrome } from './chrome/chrome.js';

const doc = document;
const win = window;

// env
const reduced = prefersReduced(win);
const announce = createAnnounce(doc, win);
// ambient
const ambient = createAmbient({ reduced, storage: safeStorage });
// engine
const engine = createEngine({ scenes, doc, win, reduced, ambient });
// rewind
const rewind = createRewind({ engine, announce, reduced, doc });
// admire
const admire = createAdmire({ engine, ambient, rewind, announce, doc, win, reduced });
// chrome
createChrome({ engine, admire, ambient, rewind, announce, doc, reduced });
