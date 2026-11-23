// ─────────────────────────────────────────────────────────────────────────────
//  Melody's Crystals — the shop's catalogue.
//
//  This is the one file to edit to change the shop:
//   • prices are in CENTS (1600 = $16.00) for each of the three formats
//   • add a crystal by copying a block, giving it a new `slug`, and adding its
//     photo to site/img/crystals/ (then credit the photographer in credits.js)
//   • `focus` moves the photo crop ("50% 40%" = centre, slightly high)
// ─────────────────────────────────────────────────────────────────────────────

export const FORMATS = [
  {
    id: 'bag',
    youGet: '8–10 polished stones, about 2–3 cm each, in a cotton drawstring pouch.',
    name: 'Tumbled bag',
    short: 'Bag',
    size: '8\u2060–\u206010 stones · 2\u2060–\u20603\u00a0cm',
    pieces: 9,
    perLabel: 'per stone',
    blurb: 'Polished pocket stones in a cotton drawstring pouch.',
  },
  {
    id: 'big',
    youGet: 'One hand-picked piece, about 6–9 cm, chosen to match the photo’s colour.',
    name: 'Big crystal',
    short: 'Big',
    size: 'One piece · 6\u2060–\u20609\u00a0cm',
    pieces: 1,
    perLabel: 'one statement piece',
    blurb: 'A single hand-picked showpiece for a shelf or desk.',
  },
  {
    id: 'jar',
    youGet: 'About 6 chunky pieces, 3–5 cm each, in a 500 ml glass jar with a brass lid.',
    name: 'Jar of big crystals',
    short: 'Jar',
    size: 'About 6 pieces · 3\u2060–\u20605\u00a0cm · 500\u00a0ml jar',
    pieces: 6,
    perLabel: 'per piece · a full display',
    blurb: 'A glass jar filled with chunky pieces. Made to be seen.',
  },
];

export const INTENTIONS = [
  'Calm', 'Love', 'Focus', 'Protection', 'Energy', 'Clarity', 'Abundance', 'Sleep', 'Confidence', 'Creativity',
];

export const CRYSTALS = [
  {
    slug: 'clear-quartz',
    name: 'Clear Quartz',
    meaning: 'The all-purpose stone of clarity.',
    help: 'Traditionally called the “master healer,” it’s kept nearby for a clear head. Many pair it with other stones to amplify an intention.',
    tags: ['Clarity', 'Focus', 'Energy'],
    chakra: 'Crown',
    colour: '#d9dde0',
    care: 'Rinse gently with water and dry with a soft cloth.',
    prices: { bag: 1200, big: 2800, jar: 6500 },
    photos: ['clear-quartz', 'clear-quartz-2'],
    focus: '50% 50%',
    zoom: 1.1,
    alt: 'A cluster of clear quartz points on a black background',
  },
  {
    slug: 'amethyst',
    name: 'Amethyst',
    meaning: 'A quiet stone for rest.',
    help: 'Long associated with calm and sober thinking, it’s often kept by the bed. People reach for it to wind down.',
    tags: ['Calm', 'Sleep', 'Clarity'],
    chakra: 'Third eye',
    colour: '#8a63a8',
    care: 'Keep out of strong sunlight; its purple can fade. Rinse with water.',
    prices: { bag: 1600, big: 4200, jar: 9500 },
    photos: ['amethyst', 'amethyst-2', 'amethyst-3'],
    focus: '50% 45%',
    zoom: 1.3,
    alt: 'A cluster of deep purple amethyst crystals',
  },
  {
    slug: 'rose-quartz',
    name: 'Rose Quartz',
    meaning: 'The stone of love and kindness.',
    help: 'Traditionally linked with love of every kind, including for yourself. A soft reminder to be gentle with your heart.',
    tags: ['Love', 'Calm', 'Confidence'],
    chakra: 'Heart',
    colour: '#e6a9b4',
    care: 'Keep out of strong sunlight. Rinse with water.',
    prices: { bag: 1400, big: 3600, jar: 8500 },
    photos: ['rose-quartz', 'rose-quartz-2'],
    focus: '50% 40%',
    zoom: 1.35,
    alt: 'A rough chunk of soft pink rose quartz',
  },
  {
    slug: 'citrine',
    name: 'Citrine',
    meaning: 'A sunny stone of plenty.',
    help: 'Called the “merchant’s stone,” it’s kept in shops and wallets for abundance. Its warm colour is associated with optimism.',
    tags: ['Abundance', 'Energy', 'Confidence'],
    chakra: 'Solar plexus',
    colour: '#e0a63a',
    care: 'Rinse with water and keep out of harsh sunlight.',
    prices: { bag: 2200, big: 6800, jar: 15000 },
    photos: ['citrine', 'citrine-2'],
    focus: '40% 50%',
    zoom: 1.15,
    alt: 'Golden citrine crystal points on a dark background',
  },
  {
    slug: 'smoky-quartz',
    name: 'Smoky Quartz',
    meaning: 'A grounding stone for heavy days.',
    help: 'Traditionally used for grounding and letting go of stress. People keep it close to feel steady.',
    tags: ['Calm', 'Protection', 'Sleep'],
    chakra: 'Root',
    colour: '#7a6656',
    care: 'Rinse with water and dry with a soft cloth.',
    prices: { bag: 1600, big: 4000, jar: 9500 },
    photos: ['smoky-quartz', 'smoky-quartz-2'],
    focus: '50% 50%',
    zoom: 1.35,
    alt: 'A star-shaped cluster of brown smoky quartz crystals',
  },
  {
    slug: 'black-tourmaline',
    name: 'Black Tourmaline',
    meaning: 'The classic protection stone.',
    help: 'Long associated with protection, it’s often placed by the front door. Many keep one as a shield against negativity.',
    tags: ['Protection', 'Calm', 'Confidence'],
    chakra: 'Root',
    colour: '#2b2b2e',
    care: 'Brush off dust with a dry cloth; it can be brittle along its lines.',
    prices: { bag: 1500, big: 3800, jar: 9000 },
    photos: ['black-tourmaline'],
    focus: '58% 50%',
    zoom: 1.9,
    alt: 'A black tourmaline crystal set in grey rock',
  },
  {
    slug: 'selenite',
    name: 'Selenite',
    meaning: 'Soft light for a peaceful space.',
    help: 'Traditionally used to cleanse a room and other crystals. Its glow is associated with peace and quiet evenings.',
    tags: ['Calm', 'Sleep', 'Clarity'],
    chakra: 'Crown',
    colour: '#efe8dc',
    care: 'Keep selenite dry. Water softens it. Dust with a soft brush.',
    prices: { bag: 1200, big: 3000, jar: 7000 },
    photos: ['selenite'],
    focus: '40% 45%',
    zoom: 1.25,
    alt: 'A clear, glassy blade of selenite on its rock',
  },
  {
    slug: 'tigers-eye',
    name: 'Tiger’s Eye',
    meaning: 'A golden stone of courage.',
    help: 'Traditionally carried for courage and good judgement. Its shifting stripes are associated with drive and luck.',
    tags: ['Confidence', 'Focus', 'Abundance'],
    chakra: 'Solar plexus',
    colour: '#a8732e',
    care: 'Rinse with water; polish with a soft cloth to bring back the shimmer.',
    prices: { bag: 1400, big: 3400, jar: 8000 },
    photos: ['tigers-eye', 'tigers-eye-2'],
    focus: '50% 50%',
    zoom: 1.2,
    alt: 'A polished tiger’s eye stone with golden-brown bands',
  },
  {
    slug: 'labradorite',
    name: 'Labradorite',
    meaning: 'The stone of change.',
    help: 'Its flash of colour is traditionally associated with intuition and transformation. People keep it close through new beginnings.',
    tags: ['Creativity', 'Protection', 'Clarity'],
    chakra: 'Third eye',
    colour: '#4f7c95',
    care: 'Wipe with a damp cloth. Tilt it in the light to see the flash.',
    prices: { bag: 2000, big: 5800, jar: 13500 },
    photos: ['labradorite', 'labradorite-2'],
    focus: '45% 50%',
    zoom: 1.15,
    alt: 'Polished labradorite flashing blue and gold',
  },
  {
    slug: 'carnelian',
    name: 'Carnelian',
    meaning: 'A bright spark of motivation.',
    help: 'Traditionally associated with vitality and creative fire. Often kept on a desk to get projects moving.',
    tags: ['Energy', 'Creativity', 'Love'],
    chakra: 'Sacral',
    colour: '#c0532b',
    care: 'Rinse with water. Sunlight makes its orange glow.',
    prices: { bag: 1500, big: 3600, jar: 8500 },
    photos: ['carnelian', 'carnelian-2'],
    focus: '50% 50%',
    zoom: 1.1,
    alt: 'Glowing orange carnelian on a black background',
  },
  {
    slug: 'lapis-lazuli',
    name: 'Lapis Lazuli',
    meaning: 'A royal-blue stone of wisdom.',
    help: 'Prized since ancient Egypt, it’s associated with truth and wisdom. People keep it near for honest conversations.',
    tags: ['Focus', 'Clarity', 'Confidence'],
    chakra: 'Throat',
    colour: '#2c4a9a',
    care: 'Wipe with a dry or barely damp cloth; avoid soaking.',
    prices: { bag: 2200, big: 7500, jar: 16000 },
    photos: ['lapis-lazuli', 'lapis-lazuli-2'],
    focus: '50% 50%',
    zoom: 1.15,
    alt: 'Deep blue lapis lazuli flecked with gold',
  },
  {
    slug: 'fluorite',
    name: 'Fluorite',
    meaning: 'The tidy-mind stone.',
    help: 'Traditionally linked with focus and order, it’s a favourite for study desks. Its colour bands are associated with clear thinking.',
    tags: ['Focus', 'Clarity', 'Calm'],
    chakra: 'Third eye',
    colour: '#7d5fae',
    care: 'Fluorite is soft. Rinse briefly and keep it away from harder stones.',
    prices: { bag: 1800, big: 4800, jar: 11000 },
    photos: ['fluorite', 'fluorite-2'],
    focus: '50% 50%',
    zoom: 1.2,
    alt: 'Purple fluorite crystals on pale rock',
  },
];

export function bySlug(slug) {
  return CRYSTALS.find((c) => c.slug === slug) ?? null;
}

/** Image paths for a photo id at a width (480 for cards, 1200 for the product gallery). */
export function img(id, size = 480) {
  return `img/crystals/${id}-${size}.jpg`;
}

/** Crop style for a crystal's photo: where to centre it, and how far to zoom in. */
export function photoStyle(c) {
  return `object-position:${c.focus};--zoom:${c.zoom ?? 1}`;
}

export function fromPrice(c) {
  return Math.min(...Object.values(c.prices));
}

export function tagCounts() {
  const m = Object.fromEntries(INTENTIONS.map((t) => [t, 0]));
  for (const c of CRYSTALS) for (const t of c.tags) m[t]++;
  return m;
}
