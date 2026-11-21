// A stand-in for WO-003's tower systems, used only until the real ones land (board condition 5 removes it
// at ship). It approximates §7 with instant hits through the real SimContext seam: First targeting,
// cooldowns, range to centre − R, pierce, splash, pulses, jets, beams, Pale vision and multipliers.
import type { SimContext } from '../../../src/contracts/sim-context';
import type { Blot, Tower } from '../../../src/contracts/types';
import { TICK_S } from '../../../src/contracts/types';

const buf = new Int32Array(256);

function bestFirst(ctx: SimContext, t: Tower, range: number, area: boolean): Blot | null {
  const n = ctx.queryBlots(t.x, t.y, range, buf);
  let best: Blot | null = null;
  for (let i = 0; i < n; i++) {
    const b = ctx.blotAt(buf[i]);
    if (!area && !ctx.canSee(t, b)) continue;
    if (!best || b.s > best.s || (b.s === best.s && b.id < best.id)) best = b;
  }
  return best;
}

function dmg(t: Tower, b: Blot): number {
  return (t.stats.damage + t.buffDamageAdd) * (t.stats.multVs[b.kind] ?? 1);
}

/** Hit up to `max` blots within `r` of (x,y), nearest-first order is not needed for a fake. */
function area(ctx: SimContext, t: Tower, x: number, y: number, r: number, max: number, src: number, see: boolean): void {
  const n = ctx.queryBlots(x, y, r, buf);
  const ids: Blot[] = [];
  for (let i = 0; i < n && ids.length < max; i++) {
    const b = ctx.blotAt(buf[i]);
    if (see && !ctx.canSee(t, b)) continue;
    ids.push(b);
  }
  for (const b of ids) if (b.alive) {
    ctx.hit(b, dmg(t, b), t.stats.damageType, src, t, 0, 1);
    if (t.stats.slowPct > 0 && b.alive) ctx.slow(b, t.stats.slowPct, Math.round(t.stats.slowDur * 60));
  }
}

export function fakeUpdateAuras(ctx: SimContext): void {
  for (const t of ctx.state.towers) { t.buffDetect = false; t.buffIntervalMul = 1; t.buffDamageAdd = 0; }
  for (const o of ctx.state.towers) {
    if (o.stats.auraRadius <= 0) continue;
    for (const t of ctx.state.towers) {
      if (Math.hypot(t.x - o.x, t.y - o.y) > o.stats.auraRadius) continue;
      t.buffDetect ||= o.stats.auraDetect;
      t.buffIntervalMul = Math.min(t.buffIntervalMul, o.stats.auraIntervalMul);
      t.buffDamageAdd = Math.max(t.buffDamageAdd, o.stats.auraDamageAdd);
    }
  }
}

export function fakeUpdateTowers(ctx: SimContext): void {
  for (const t of ctx.state.towers) {
    t.cooldown -= TICK_S;
    if (t.cooldown > 0) continue;
    const st = t.stats;
    const range = st.attack === 'jets' ? st.jetRange : st.range;
    const isArea = st.areaClass || st.attack === 'pulse' || st.attack === 'jets';
    const target = bestFirst(ctx, t, range, isArea);
    if (!target) continue;
    t.cooldown = st.interval * t.buffIntervalMul;
    t.shots++;
    const src = ctx.nextSourceId();
    switch (st.attack) {
      case 'quill': case 'lance': case 'beam': {
        const per = st.attack === 'beam' ? st.pierce : st.pierce * st.spreadDeg.length;
        area(ctx, t, target.x, target.y, st.attack === 'beam' ? 30 : 16, Math.max(1, per), src, true);
        break;
      }
      case 'stone':
        area(ctx, t, target.x, target.y, st.splashRadius, st.splashMax, src, false);
        for (let k = 0; k < st.skips; k++) area(ctx, t, target.x, target.y, st.skipRadius, st.skipMax, ctx.nextSourceId(), false);
        break;
      case 'pulse': {
        area(ctx, t, t.x, t.y, st.range, st.pulseMax, src, false);
        if (st.freezeEvery && t.shots % st.freezeEvery === 0) {
          const n = ctx.queryBlots(t.x, t.y, st.range, buf);
          for (let i = 0; i < n; i++) ctx.freeze(ctx.blotAt(buf[i]), Math.round(st.freezeDur * 60), st.slowPct);
        }
        break;
      }
      case 'jets':
        area(ctx, t, t.x, t.y, st.jetRange, st.jetCount * st.jetPierce, src, false);
        break;
    }
  }
}

export function fakeUpdateProjectiles(_ctx: SimContext): void {}
