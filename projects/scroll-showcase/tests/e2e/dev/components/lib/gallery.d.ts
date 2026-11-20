// The shape of `window.__gallery` (dev/components/gallery.js), for checkJs.
import type { Viewport } from '../../../../../site/js/types.d.ts';
import type { Layer } from '../../../../../dev/components/fixtures.js';
import type * as svg from '../../../../../site/js/components/svg.js';
import type * as geometry from '../../../../../site/js/core/geometry.js';
import type { createBands } from '../../../../../site/js/components/bands-dom.js';
import type { createDotGrid } from '../../../../../site/js/components/dotgrid-svg.js';
import type { createWhitePoint } from '../../../../../site/js/components/white-point.js';

declare global {
  interface Window {
    __gallery: {
      ready: true;
      mode: 'grid' | 'solo';
      vp: Viewport;
      fixtures: string[];
      drawn: Record<string, Array<{ layer: Layer & Record<string, any>; instance: { set(...args: any[]): void } }>>;
      components: {
        createBands: typeof createBands;
        createDotGrid: typeof createDotGrid;
        createWhitePoint: typeof createWhitePoint;
        el: typeof svg.el;
        setAttrs: typeof svg.setAttrs;
        setStyles: typeof svg.setStyles;
      };
      geometry: Pick<typeof geometry, 'bandRects' | 'bandRectsFromWeights' | 'dotGrid' | 'viewport'>;
    };
  }
}
export {};
