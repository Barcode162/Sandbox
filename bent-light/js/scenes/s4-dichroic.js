// scenes/s4-dichroic.js: Scene 4 *Dichroic* (spec §4 Scene 4, 320 svh; the peak).
//
// One canvas. Scene 3's glass shelf fades from the cobalt dot field; the vertex dots join into a
// jittered triangular lattice whose facets catch a moving light, sliding through teal, magenta,
// gold and vermilion; then the crystal relaxes and quantises into the seven exact bands (Scene 5 at
// p = 0). Every frame is a pure function of p (and of the breathing sample in admire mode).
//
// Quality (CEO ruling, D2): drawn at the spec configuration. On a device whose measured draw time
// stays above budget, the backing resolution steps down (level 0 → 1 → 2) with hysteresis; geometry
// never changes, so a frame at a given p looks the same at every level, only softer. Automated
// browsers never step down unless a test forces a level with ?s4level=N.

import { clamp, fin, glide, keys, lin, mulberry32, r, SEED } from '../core/math.js';
import { SCENES, bandRects, centre, dotGrid, shelf } from '../core/geometry.js';
import { BANDS, TOKENS } from '../core/tokens.js';
import { el } from '../components/svg.js';
import { buildLut, lutIndex } from './s4-lut.js';

/** @type {import('../types.js').SceneMeta} */
export const meta = SCENES[3];

const DEG = Math.PI / 180;
const JITTER_PX = 14;
const BREATHE_THETA = 6;
const BREATHE_S = 12;
const LEVEL_DPR = [Infinity, 1, 0.75];
const BUDGET_MS = 12;

/**
 * PURE (K6).
 * @param {number} p
 * @param {import('../types.js').Viewport} vp
 * @returns {import('../types.js').SceneState}
 */
export function state(p, vp) {
  const q = clamp(fin(p), 0, 1);
  const J = glide(r(q, 0.08, 0.35)) * (1 - glide(r(q, 0.8, 0.96)));
  const theta = keys(q, [[0.1, 200], [0.44, 268.25], [0.56, 271.75, lin], [0.9, 340]]);
  const facetAlpha = glide(r(q, 0.08, 0.38));
  const edgeAlpha = 0.45 * r(q, 0.04, 0.12) * (1 - r(q, 0.8, 0.92));
  const quant = r(q, 0.8, 0.96);
  const bandsAlpha = r(q, 0.92, 1);
  const glassAlpha = 1 - r(q, 0, 0.15);
  const fillDots = 0.55 * (1 - r(q, 0, 0.1));
  const vertexDots = 0.55 * (1 - r(q, 0.1, 0.3));
  const rho = glide(r(q, 0, 0.1));
  const wpAlpha = 1 - r(q, 0.88, 0.96);
  const c = centre(vp);
  const R = rho * 38 * vp.vmin;
  return {
    scene: 4,
    p: q,
    params: {
      J: fin(J), theta: fin(theta), facetAlpha: fin(facetAlpha), edgeAlpha: fin(edgeAlpha), quant: fin(quant),
      bandsAlpha: fin(bandsAlpha), glassAlpha: fin(glassAlpha), fillDots: fin(fillDots), vertexDots: fin(vertexDots),
      rho: fin(rho), wpAlpha: fin(wpAlpha),
    },
    geom: {
      ground: bandsAlpha >= 1 ? 'bands' : q <= 0 ? 'cobalt' : 'mosaic',
      bandRects: bandsAlpha >= 1 ? bandRects(vp) : null,
      dotGrid: { ...dotGrid(vp), vertexWhite: fin(vertexDots), fillWhite: fin(fillDots), vertexInk: 0, fillInk: 0 },
      whitePoint: { u: fin(c.u + R * Math.cos(theta * DEG)), v: fin(c.v + R * Math.sin(theta * DEG)), r: 3, alpha: fin(wpAlpha) },
      shelf: glassAlpha > 0 ? shelf(vp) : null,
      channelScales: null,
      glassAlpha: fin(glassAlpha),
      beamRect: null,
      otherOpacity: fin(Math.max(facetAlpha, edgeAlpha) * (1 - bandsAlpha)),
    },
  };
}

/** Seeded lattice: vertex jitter and facet normals, rebuilt on resize. */
function lattice(/** @type {import('../types.js').Viewport} */ vp) {
  const L = vp.lattice;
  const g = dotGrid(vp);
  const u0 = g.originU - L;
  const v0 = g.originV - L;
  const nu = Math.ceil((vp.U - u0) / L) + 1;
  const nv = Math.ceil((vp.V - v0) / L) + 1;
  const rand = mulberry32(SEED);
  const jit = new Float32Array(nu * nv * 2);
  for (let i = 0; i < jit.length; i++) jit[i] = (rand() * 2 - 1) * JITTER_PX;
  // Facet tilts follow a smooth seeded relief (a few long waves) plus a little per-facet grain, so
  // light sweeps across coherent ridges and valleys instead of noise. |n| ≤ 0.6.
  const waves = [0, 1, 2].map(() => ({ k: (0.6 + rand()) * (2 * Math.PI) / Math.max(vp.U, vp.V), a: rand() * 2 * Math.PI, ph: rand() * 2 * Math.PI }));
  const facets = (nu - 1) * (nv - 1) * 2;
  const normals = new Float32Array(facets * 2);
  let f = 0;
  for (let j = 0; j < nv - 1; j++) {
    for (let i = 0; i < nu - 1; i++) {
      for (let t = 0; t < 2; t++) {
        const x = u0 + (i + (t ? 0.33 : 0.67)) * L;
        const y = v0 + (j + (t ? 0.67 : 0.33)) * L;
        let nx = 0;
        let ny = 0;
        for (const w of waves) {
          const d = Math.cos(w.k * (x * Math.cos(w.a) + y * Math.sin(w.a)) + w.ph);
          nx += d * Math.cos(w.a);
          ny += d * Math.sin(w.a);
        }
        nx = nx * 0.16 + (rand() * 2 - 1) * 0.1;
        ny = ny * 0.16 + (rand() * 2 - 1) * 0.1;
        const m = Math.hypot(nx, ny);
        const c = m > 0.6 ? 0.6 / m : 1;
        normals[2 * f] = nx * c;
        normals[2 * f + 1] = ny * c;
        f++;
      }
    }
  }
  return { L, u0, v0, nu, nv, jit, normals };
}

/**
 * @param {import('../types.js').SceneHost} host
 * @returns {import('../types.js').SceneView}
 */
export function mount(host) {
  let vp = host.vp;
  const win = host.section.ownerDocument.defaultView;
  const forced = Number(new URLSearchParams(win?.location.search ?? '').get('s4level'));
  const adaptive = !(win?.navigator.webdriver) && !(forced >= 0 && forced <= 2 && win?.location.search.includes('s4level'));
  let level = forced >= 1 && forced <= 2 ? forced : 0;
  let ewma = 0;
  let draws = 0;

  const canvas = /** @type {HTMLCanvasElement} */ (/** @type {unknown} */ (el('canvas', { class: 's4-canvas', 'aria-hidden': 'true' }, host.uv)));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));
  let lat = lattice(vp);
  let scale = 1;
  let lastKey = '';
  const bandRgb = BANDS.map((_, i) => TOKENS[`band-${i + 1}`].rgb);
  const cobalt = TOKENS['band-6'].hex;

  function size() {
    const cap = vp.vw >= 1440 ? 1.5 : 2;
    scale = Math.min(vp.dpr, cap, LEVEL_DPR[level]);
    canvas.width = Math.round(vp.U * scale);
    canvas.height = Math.round(vp.V * scale);
    canvas.style.width = `${vp.U}px`;
    canvas.style.height = `${vp.V}px`;
    lastKey = '';
  }
  size();

  /** @param {import('../types.js').SceneState} st @param {number} theta */
  function draw(st, theta) {
    const k = st.params;
    const { L, u0, v0, nu, nv, jit, normals } = lat;
    const lut = buildLut(theta);
    const cx = Math.cos(theta * DEG);
    const cy = Math.sin(theta * DEG);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = cobalt;
    ctx.fillRect(0, 0, vp.U, vp.V);

    // Dots: vertex dots on the lattice, fill dots at the pitch in between (Scene 2–3's grid).
    const g = dotGrid(vp);
    if (k.fillDots > 0 || k.vertexDots > 0) {
      ctx.fillStyle = '#FFFFFF';
      const pu = g.originU % g.pitch;
      const pv = g.originV % g.pitch;
      for (let v = pv; v <= vp.V; v += g.pitch) {
        for (let u = pu; u <= vp.U; u += g.pitch) {
          const onLattice = Math.abs(((u - g.originU) / L) % 1) < 1e-6 && Math.abs(((v - g.originV) / L) % 1) < 1e-6;
          const a = onLattice ? k.vertexDots : k.fillDots;
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(u, v, g.r, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // The glass shelf (Scene 3's resting frame), fading out.
    if (k.glassAlpha > 0 && st.geom.shelf) {
      for (const it of st.geom.shelf) {
        ctx.globalAlpha = k.glassAlpha;
        ctx.beginPath();
        const h = it.size / 2;
        if (it.kind === 'cir') ctx.arc(it.u, it.v, h, 0, 2 * Math.PI);
        else if (it.kind === 'tri') {
          const R = it.size / Math.sqrt(3);
          for (let i = 0; i < 3; i++) {
            const a = (-90 + 120 * i) * DEG;
            ctx.lineTo(it.u + R * Math.cos(a), it.v + R * Math.sin(a));
          }
          ctx.closePath();
        } else {
          ctx.moveTo(it.u, it.v - h);
          ctx.lineTo(it.u + h, it.v);
          ctx.lineTo(it.u, it.v + h);
          ctx.lineTo(it.u - h, it.v);
          ctx.closePath();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.stroke();
      }
    }

    // The faceted lattice.
    if (k.facetAlpha > 0) {
      const X = (/** @type {number} */ i, /** @type {number} */ j) => u0 + i * L + jit[2 * (j * nu + i)] * k.J;
      const Y = (/** @type {number} */ i, /** @type {number} */ j) => v0 + j * L + jit[2 * (j * nu + i) + 1] * k.J;
      ctx.lineWidth = 0.5;
      let f = 0;
      for (let j = 0; j < nv - 1; j++) {
        for (let i = 0; i < nu - 1; i++) {
          const tris = [
            [i, j, i + 1, j, i + 1, j + 1],
            [i, j, i + 1, j + 1, i, j + 1],
          ];
          for (const t of tris) {
            const nl = k.J * (normals[2 * f] * cx + normals[2 * f + 1] * cy);
            f++;
            const xa = X(t[0], t[1]), ya = Y(t[0], t[1]);
            const xb = X(t[2], t[3]), yb = Y(t[2], t[3]);
            const xc = X(t[4], t[5]), yc = Y(t[4], t[5]);
            let c = lut[lutIndex(nl)];
            if (k.quant > 0) {
              const band = bandRgb[Math.min(6, Math.max(0, Math.floor((7 * (xa + xb + xc)) / 3 / vp.U)))];
              c = /** @type {[number, number, number]} */ (c.map((x, n) => x + (band[n] - x) * k.quant));
            }
            const col = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
            ctx.globalAlpha = k.facetAlpha;
            ctx.fillStyle = col;
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.moveTo(xa, ya);
            ctx.lineTo(xb, yb);
            ctx.lineTo(xc, yc);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            if (k.edgeAlpha > 0) {
              ctx.globalAlpha = k.edgeAlpha;
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.lineWidth = 0.5;
            }
          }
        }
      }
    }

    // The seven exact bands return over the mosaic.
    if (k.bandsAlpha > 0) {
      ctx.globalAlpha = k.bandsAlpha;
      bandRects(vp).forEach((b, i) => {
        ctx.fillStyle = BANDS[i];
        ctx.fillRect(b.u0, 0, b.u1 - b.u0, vp.V);
      });
    }

    // The white point: the light itself.
    const wp = st.geom.whitePoint;
    if (wp && wp.alpha > 0) {
      const R = k.rho * 38 * vp.vmin;
      const c = centre(vp);
      ctx.globalAlpha = wp.alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(c.u + R * Math.cos(theta * DEG), c.v + R * Math.sin(theta * DEG), wp.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return {
    apply(st, amb) {
      const wave = amb.a > 0 ? amb.a * Math.sin((2 * Math.PI * amb.t) / BREATHE_S) : 0;
      const theta = st.params.theta + BREATHE_THETA * wave * st.params.J;
      const key = `${st.p}|${theta}|${level}`;
      if (key === lastKey) return;
      lastKey = key;
      const t0 = win ? win.performance.now() : 0;
      draw(st, theta);
      if (!adaptive || !win || level >= 2) return;
      const ms = win.performance.now() - t0;
      ewma = draws++ === 0 ? ms : ewma * 0.85 + ms * 0.15;
      if (draws > 24 && ewma > BUDGET_MS) {
        level++;
        draws = 0;
        size();
      }
    },
    resize(next) {
      vp = next;
      lat = lattice(vp);
      size();
    },
    destroy() {
      canvas.remove();
    },
  };
}
