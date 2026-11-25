# Skyrest

A stylized floating-isle action demo: a chibi swordsman versus the Stone Guardian. Three.js (WebGL2) +
TypeScript + Vite; all art, sound and code original and procedural. Plays on iPhone Safari (touch) and desktop.

```sh
npm install
npm run dev        # play at http://127.0.0.1:5176
npm run build      # static site in dist/ (base './', works under /Sandbox/skyrest/)
npm run verify     # typecheck → unit → build → size → e2e (boot, budgets, probe, frame-table screenshots)
npm run probe      # after build: screen-space boxes of hero/golem/temple/bridge/arena at 3 viewports
```

Controls: WASD/arrows move · J/Space/left-click attack · K/Shift/right-click dodge · L/E skill · Esc pause.
Touch: left-thumb joystick, right-side Attack / Dodge / Skill.

Screenshots go to `./evidence/` (set `EVIDENCE_DIR` to redirect). Never run `playwright install`:
Chromium is preinstalled; headless WebGL is SwiftShader, so judge look from screenshots and perf from
draw calls/triangles, never fps.

Layout: `src/contracts.ts` (frozen types) · `src/core` (sim core, pure) · `src/tuning` (all numbers) ·
`src/world` · `src/hero` · `src/golem` · `src/minions` · `src/camera` · `src/fx` · `src/input` · `src/audio` ·
`src/ui` · `src/app` (wiring + `window.__skyrest` test hooks) · `src/moments` (frame-table scripts).
