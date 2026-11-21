// Uniform spatial grid over the field (architecture §Decisions: Broadphase). Allocation-free after construction.
// Counting-sort layout: cellStart[c]..cellStart[c+1] index into `items`, which holds pool indices.
// The grid spans x ∈ [−128, 1216), y ∈ [−64, 784) so off-screen spawns (x −40) still bucket; points outside clamp to the edge cells.

export interface SpatialGrid {
  /** Rebuild from the live blot pool (x, y, radius per index). */
  rebuild(count: number, xs: ArrayLike<number>, ys: ArrayLike<number>): void;
  /** Write candidate indices whose cell overlaps the circle; caller does the exact test. Returns count. */
  candidates(x: number, y: number, r: number, out: Int32Array): number;
}

const ORIGIN_X = -128;
const ORIGIN_Y = -64;
const SPAN_W = 1344;
const SPAN_H = 848;

export function createGrid(cellSize = 64, capacity = 4096): SpatialGrid {
  const cols = Math.ceil(SPAN_W / cellSize);
  const rows = Math.ceil(SPAN_H / cellSize);
  const cells = cols * rows;
  const cellStart = new Int32Array(cells + 1);
  const fill = new Int32Array(cells);
  const cellOf = new Int32Array(capacity);
  const items = new Int32Array(capacity);
  const inv = 1 / cellSize;

  const col = (x: number): number => {
    const c = Math.floor((x - ORIGIN_X) * inv);
    return c < 0 ? 0 : c >= cols ? cols - 1 : c;
  };
  const row = (y: number): number => {
    const r = Math.floor((y - ORIGIN_Y) * inv);
    return r < 0 ? 0 : r >= rows ? rows - 1 : r;
  };

  return {
    rebuild(count, xs, ys) {
      const n = count < capacity ? count : capacity;
      cellStart.fill(0);
      for (let i = 0; i < n; i++) {
        const c = row(ys[i]) * cols + col(xs[i]);
        cellOf[i] = c;
        cellStart[c + 1]++;
      }
      for (let c = 0; c < cells; c++) { cellStart[c + 1] += cellStart[c]; fill[c] = cellStart[c]; }
      for (let i = 0; i < n; i++) items[fill[cellOf[i]]++] = i;
    },
    candidates(x, y, r, out) {
      const c0 = col(x - r), c1 = col(x + r), r0 = row(y - r), r1 = row(y + r);
      const cap = out.length;
      let k = 0;
      for (let rr = r0; rr <= r1; rr++) {
        for (let cc = c0; cc <= c1; cc++) {
          const c = rr * cols + cc;
          for (let j = cellStart[c], e = cellStart[c + 1]; j < e; j++) {
            if (k >= cap) return k;
            out[k++] = items[j];
          }
        }
      }
      return k;
    },
  };
}
