// check-static.mjs — catalogue integrity: every crystal has three whole-cent prices, its photos
// exist at both sizes, and every photo shown is credited with an author, licence and source.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRYSTALS, FORMATS, INTENTIONS } from '../site/data/crystals.js';
import { CREDITS } from '../site/data/credits.js';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const problems = [];
const slugs = new Set();

if (CRYSTALS.length < 12) problems.push(`expected at least 12 crystals, found ${CRYSTALS.length}`);
for (const c of CRYSTALS) {
  if (slugs.has(c.slug)) problems.push(`duplicate slug ${c.slug}`);
  slugs.add(c.slug);
  for (const k of ['name', 'meaning', 'help', 'alt', 'care', 'chakra']) if (!c[k]) problems.push(`${c.slug}: missing ${k}`);
  if (/\b(heals?|cures?|treats?)\b/i.test(c.meaning + ' ' + c.help)) problems.push(`${c.slug}: copy makes a health claim`);
  for (const f of FORMATS) {
    const p = c.prices?.[f.id];
    if (!Number.isInteger(p) || p <= 0) problems.push(`${c.slug}: price for ${f.id} must be whole cents > 0`);
  }
  if (!(c.prices.bag < c.prices.big && c.prices.big < c.prices.jar)) problems.push(`${c.slug}: prices should rise bag < big < jar`);
  for (const t of c.tags) if (!INTENTIONS.includes(t)) problems.push(`${c.slug}: unknown intention ${t}`);
  if (!c.photos?.length) problems.push(`${c.slug}: no photos`);
  for (const id of c.photos ?? []) {
    for (const size of [480, 1200]) if (!existsSync(path.join(SITE, `img/crystals/${id}-${size}.jpg`))) problems.push(`${c.slug}: missing img/crystals/${id}-${size}.jpg`);
    const cr = CREDITS.find((x) => x.id === id);
    if (!cr || !cr.author || !cr.licence || !/^https:\/\//.test(cr.source)) problems.push(`${id}: photo is not fully credited`);
  }
}
for (const page of ['index.html', 'product.html', 'checkout.html', 'credits.html']) if (!existsSync(path.join(SITE, page))) problems.push(`missing ${page}`);

if (problems.length) {
  console.error(`static check FAILED (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`static check OK: ${CRYSTALS.length} crystals × ${FORMATS.length} formats, ${CRYSTALS.reduce((n, c) => n + c.photos.length, 0)} credited photos`);
