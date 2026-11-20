// Uniform spatial grid over the field — STUB (WO-002 implements). Allocation-free after construction.
export interface SpatialGrid {
  /** Rebuild from the live blot pool (x, y, radius per index). */
  rebuild(count: number, xs: ArrayLike<number>, ys: ArrayLike<number>): void;
  /** Write candidate indices whose cell overlaps the circle; caller does the exact test. Returns count. */
  candidates(x: number, y: number, r: number, out: Int32Array): number;
}

export function createGrid(_cellSize = 64, _capacity = 4096): SpatialGrid {
  // TODO(WO-002)
  return { rebuild() {}, candidates: () => 0 };
}
