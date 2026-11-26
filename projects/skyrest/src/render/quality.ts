// src/render/quality.ts — owned by WO-002. The Auto tier's downgrade rule (§4.2), pure so it is unit-tested:
// average frame time over a 2 s window; if > 22 ms, drop the pixel ratio by 0.25 (floor 1.0), then go Low.
// Never upgrades. Feed it real frame intervals only (the renderer skips paused/hidden/automation frames).
import { AUTO_QUALITY } from '../tuning/world.ts';
import type { Quality } from '../contracts.ts';

export interface AutoState {
  quality: Quality;
  pixelRatio: number;
  windowMs: number;
  sumMs: number;
  frames: number;
}

export const createAutoState = (quality: Quality, pixelRatio: number): AutoState => ({ quality, pixelRatio, windowMs: 0, sumMs: 0, frames: 0 });

/** Feeds one frame interval; returns true when the tier or pixel ratio changed. */
export function autoStep(s: AutoState, frameMs: number): boolean {
  if (s.quality === 'low' && s.pixelRatio <= AUTO_QUALITY.pixelRatioFloor) return false;
  if (!(frameMs > 0) || frameMs > 250) return false; // stalls (tab switch, GC, load) are not frame cost
  s.windowMs += frameMs;
  s.sumMs += frameMs;
  s.frames++;
  if (s.windowMs < AUTO_QUALITY.windowMs) return false;
  const mean = s.sumMs / s.frames;
  s.windowMs = s.sumMs = s.frames = 0;
  if (mean <= AUTO_QUALITY.maxFrameMs) return false;
  if (s.pixelRatio - AUTO_QUALITY.pixelRatioStep >= AUTO_QUALITY.pixelRatioFloor - 1e-6) {
    s.pixelRatio = Math.max(AUTO_QUALITY.pixelRatioFloor, s.pixelRatio - AUTO_QUALITY.pixelRatioStep);
    return true;
  }
  if (s.quality === 'high') {
    s.quality = 'low';
    return true;
  }
  return false;
}
