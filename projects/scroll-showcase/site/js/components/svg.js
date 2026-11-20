// Element creation and cached attribute/style writes for every renderer.
//
// The write cache is the reason a still frame stays still: a scene's `apply`
// may call `setAttrs` with the same values every frame, and only values that
// differ from the value last written *to that node* reach the DOM. The cache
// is keyed by the node itself (a WeakMap), so a recreated node starts empty
// and receives every value again. All writes to a managed attribute or style
// property must go through these helpers, or the cache goes stale.

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Tags that only exist in SVG. Anything else is HTML unless its parent is SVG. */
const SVG_TAGS = new Set([
  'svg', 'g', 'defs', 'symbol', 'use', 'pattern', 'clipPath', 'mask', 'marker',
  'linearGradient', 'radialGradient', 'stop', 'circle', 'ellipse', 'line', 'path',
  'polygon', 'polyline', 'rect', 'text', 'tspan', 'textPath', 'image', 'foreignObject',
  'filter', 'feBlend', 'feColorMatrix', 'feComposite', 'feFlood', 'feGaussianBlur',
  'feMerge', 'feMergeNode', 'feOffset', 'feTurbulence', 'desc',
]);

/** @type {WeakMap<Element, Map<string, string | null>>} */
const written = new WeakMap();

/** @param {Element} node */
function cacheOf(node) {
  let cache = written.get(node);
  if (!cache) {
    cache = new Map();
    written.set(node, cache);
  }
  return cache;
}

/**
 * Normalise a value for writing. Non-finite numbers throw (the engine reports
 * them) instead of reaching the DOM as "NaN", which the browser would log.
 * @param {string} name
 * @param {string | number | null} value
 * @returns {string | null}
 */
function text(name, value) {
  if (value === null) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`${name}: non-finite value ${value}`);
    return String(value);
  }
  return value;
}

/**
 * True when `value` differs from the value last written under `key` to `node`,
 * and records it as written. This is the single comparison behind every
 * cached write.
 * @param {Element} node
 * @param {string} key
 * @param {string | null} value
 */
function changed(node, key, value) {
  const cache = cacheOf(node);
  if (cache.has(key) && cache.get(key) === value) return false;
  cache.set(key, value);
  return true;
}

/**
 * Write attributes, skipping any whose value equals the value last written to
 * this node. `null` removes the attribute; `undefined` leaves it alone.
 * @param {Element} node
 * @param {Record<string, string | number | null | undefined>} attrs
 * @returns {number} how many attributes were actually written
 */
export function setAttrs(node, attrs) {
  let writes = 0;
  for (const name of Object.keys(attrs)) {
    const raw = attrs[name];
    if (raw === undefined) continue;
    const value = text(name, raw);
    if (!changed(node, name, value)) continue;
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
    writes++;
  }
  return writes;
}

/**
 * Write inline style properties (CSS names, e.g. `transform`, `mix-blend-mode`,
 * `--x`) through the same per-node cache as `setAttrs`. `null` removes the
 * property; `undefined` leaves it alone.
 * @param {HTMLElement | SVGElement} node
 * @param {Record<string, string | number | null | undefined>} styles
 * @returns {number} how many properties were actually written
 */
export function setStyles(node, styles) {
  let writes = 0;
  for (const prop of Object.keys(styles)) {
    const raw = styles[prop];
    if (raw === undefined) continue;
    const value = text(prop, raw);
    if (!changed(node, `style:${prop}`, value)) continue;
    if (value === null) node.style.removeProperty(prop);
    else node.style.setProperty(prop, value);
    writes++;
  }
  return writes;
}

/**
 * @template {string} K
 * @typedef {K extends keyof HTMLElementTagNameMap
 *   ? (K extends keyof SVGElementTagNameMap ? Element : HTMLElementTagNameMap[K])
 *   : K extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[K] : Element} TagElement
 */

/**
 * Create an element in the right namespace, set its attributes through the
 * write cache, and append it to `parent` if given. The namespace is SVG when
 * the tag only exists in SVG, or when the parent is an SVG element other than
 * `foreignObject` (so `a`, `title` and `style` follow their parent); HTML
 * otherwise.
 * @template {string} K
 * @param {K} tag
 * @param {Record<string, string | number | null | undefined>} [attrs]
 * @param {Element | null} [parent]
 * @returns {TagElement<K>}
 */
export function el(tag, attrs = {}, parent = null) {
  const inSvg = parent !== null && parent.namespaceURI === SVG_NS && parent.localName !== 'foreignObject';
  const node = inSvg || SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  setAttrs(node, attrs);
  if (parent) parent.appendChild(node);
  return /** @type {TagElement<K>} */ (/** @type {unknown} */ (node));
}
