// tests/unit/support/guidebook-source.ts — the Guidebook example memory (M-0003).
// An everyday memory built to teach retrieval: a life, a side project, a bit of code, the files
// that go with them, and "Try" notes that say what to ask. Three lenses are three moments in
// time (Today, Last year, Next year), so values, lines and pathway outcomes change with the lens.
// `src/seed/guidebook.json` is this module's output (write it with
// `node tests/unit/support/write-guidebook.ts`); [U-guidebook] fails if the two drift apart.
import { canonMeta, canonNode, canonPerspective, canonRelation } from '../../../src/core/internal.ts';
import type { FileRef, MemoryDoc, MemoryNode, NodeKind, PathwayStep, Perspective, Relation, RelationType, Value, Vec3 } from '../../../src/core/types.ts';

export const GUIDE_TIME = Date.UTC(2026, 10, 20);
type Lens = 'today' | 'last-year' | 'next-year';
export const GUIDE_LENSES: Lens[] = ['today', 'last-year', 'next-year'];
type Tri = [today: Value, lastYear: Value, nextYear: Value];
type Cluster = 'guide' | 'home' | 'money' | 'people' | 'project' | 'code' | 'files' | 'job' | 'learning' | 'health' | 'travel' | 'timeline' | 'afford' | 'months' | 'checkout';

const nodes: MemoryNode[] = [];
const relations: Relation[] = [];
const clusterOf = new Map<string, Cluster>();

interface Extra {
  facets?: Tri;
  units?: Partial<Record<Lens | '*', string>>;
  tags?: string[];
  notes?: string;
  file?: FileRef;
  pathway?: PathwayStep;
}

function node(id: string, label: string, kind: NodeKind, cluster: Cluster, value: Value, x: Extra = {}): void {
  const n: MemoryNode = { id, label, kind, value, facets: {}, tags: [cluster, ...(x.tags ?? [])], created: GUIDE_TIME, updated: GUIDE_TIME };
  if (x.facets) n.facets = { today: x.facets[0], 'last-year': x.facets[1], 'next-year': x.facets[2] };
  if (x.units) n.units = x.units;
  if (x.notes) n.notes = x.notes;
  if (x.file) n.file = x.file;
  if (x.pathway) n.pathway = x.pathway;
  if (nodes.some((m) => m.id === id)) throw new Error(`duplicate id ${id}`);
  nodes.push(n);
  clusterOf.set(id, cluster);
}
const thing = (id: string, label: string, c: Cluster, value: Value, x?: Extra) => node(id, label, 'concept', c, value, x);
const variable = (id: string, label: string, c: Cluster, value: Value, x?: Extra) => node(id, label, 'variable', c, value, x);
const note = (id: string, label: string, c: Cluster, notes: string, x?: Extra) => node(id, label, 'note', c, null, { ...x, notes });
const file = (id: string, name: string, c: Cluster, f: Omit<FileRef, 'name'>, value: Value, x?: Extra) => node(id, name, 'file', c, value, { ...x, file: { name, ...f } });
const step = (id: string, label: string, c: Cluster, pathway: PathwayStep) => node(id, label, 'pathway', c, null, { pathway });

type Word = 'relates' | 'is-a' | 'references' | 'part-of' | 'causes' | 'next' | 'reads' | 'owns' | 'knows' | 'needs';
const counters = new Map<string, number>();
function rel(group: string, from: string, to: string, word: Word, lenses?: Lens[], weight = 1): void {
  const n = (counters.get(group) ?? 0) + 1;
  counters.set(group, n);
  const type: RelationType = word === 'next' ? 'chain' : word === 'part-of' ? 'part-of' : word === 'causes' ? 'causes' : 'association';
  const r: Relation = { id: `${group}-${String(n).padStart(2, '0')}`, from, to, type, weight, directed: false, created: GUIDE_TIME };
  if (word !== 'relates' && type === 'association') r.label = word;
  if (lenses) r.perspectives = [...lenses];
  relations.push(r);
}
function flow(from: string, to: string, branch: 'next' | 'true' | 'false', label?: string): void {
  const n = (counters.get('flow') ?? 0) + 1;
  counters.set('flow', n);
  const r: Relation = { id: `flow-${String(n).padStart(2, '0')}`, from, to, type: 'flow', weight: 1, directed: true, branch, created: GUIDE_TIME };
  if (label) r.label = label;
  relations.push(r);
}

// ── Start here: the guide notes (9) ─────────────────────────────────────────────────────
note('g-start', 'Start here', 'guide',
  'This is the Guidebook: about 150 everyday things (a home, money, people, a side project called Garden app, a bit of code and the files that go with them). Nothing here is special — it is the kind of thing anyone keeps. Click a light to read it; the "Try" lights around this one each show one way of getting something back out. Press 1, 2, 3 to look at it as Today, Last year or Next year.');
note('g-search', 'Try: ask by a word', 'guide',
  'Press / and type a word you half-remember. Good ones here: tax, Sam, garden, insurance, pdf, passport, deadline, Lisbon, money, renew. The matches flare; things 1, 2 and 3 hops away glow dimmer and dimmer. The Results tab lists them by distance. Search reads names, values, tags, file names and paths, and these notes — so you rarely need the exact name.');
note('g-neighbours', 'Try: ask by neighbourhood', 'guide',
  'Click a light and look at what is lit around it. Click Sam to see everything Sam touches: the project, a meeting, a birthday, a client. Click Files to see every file in this memory. Neighbourhood answers "what goes with this?" when you do not know what to search for.');
note('g-route', 'Try: find how two things connect', 'guide',
  'Press R and route from Idea to Launch. The declared timeline walks all 13 steps; today the memory finds a 3-step shortcut through Garden app and its client, the Riverside Co-op. Press 2 and try again: last year there was no client, so the best route is much longer. Then try Sam to Tax return (the money trail runs through an invoice), or Work laptop to Trip to Lisbon (the handbook decides the leave days). A route answers "how is this related to that?" Learn shortcut keeps the short way as a new line.');
note('g-lens', 'Try: look from another time', 'guide',
  'Press 1 (Today), 2 (Last year), 3 (Next year). Rent, savings, the tax rate, the project status and who Sam is all change. Lights that disagree across time show small ghosts with the other values. Some lines only exist in some years: last year Sam had not met the Riverside Co-op yet, so the Idea → Launch route is longer.');
note('g-path', 'Try: compute an answer', 'guide',
  'Press P and run "Can I afford the trip?", then switch the lens and run it again. Today it says not yet, last year it was far off, next year it says book it — one rule, three truths. "Months until the trip" is a while loop; "What will checkout charge?" chains values from the code cluster.');
note('g-store', 'Try: store your own', 'guide',
  'Press N. Give it a name, a value, maybe a different value per lens, and link it to something already here. Useful first things to store: where you keep a document, a person and how you know them, a project and its next step, a file path, a number you keep looking up. Never store a password itself — store where it lives.');
note('g-questions', 'Questions this memory can answer', 'guide',
  'Where is my lease? (search lease) · What costs me money every month? (search monthly, or click Money) · Who is involved in Garden app? (click Garden app) · What was the tax rate last year? (press 2, search tax) · What do I need before the trip? (click Trip to Lisbon; read its neighbours) · How does my job affect the trip? (route Work laptop → Trip to Lisbon) · What breaks if taxPct changes? (click taxPct, look at checkout) · What should I do about Bug #42? (click it; read its neighbours)');
note('g-patterns', 'Five ways to get things back', 'guide',
  '1 By word: search. 2 By neighbourhood: click and look around. 3 By connection: route between two things. 4 By time or viewpoint: switch the lens and watch values change. 5 By computing: run a pathway that reads values and decides. Most real questions mix two of these.');
for (const g of ['g-search', 'g-neighbours', 'g-route', 'g-lens', 'g-path', 'g-store', 'g-questions', 'g-patterns']) rel('guide', 'g-start', g, 'part-of');

// ── Home & life (16) ────────────────────────────────────────────────────────────────────
thing('home', 'Home', 'home', 'Apartment, 3rd floor', { facets: ['Apartment, 3rd floor', 'Shared flat, Elm St', 'Apartment, 3rd floor (renewed)'], tags: ['life'] });
variable('rent', 'Rent', 'home', 1200, { facets: [1200, 1150, 1260], units: { '*': 'USD/month' }, tags: ['money', 'monthly'] });
file('lease', 'lease-2026.pdf', 'home', { path: 'Documents/Home/lease-2026.pdf', mime: 'application/pdf', sizeNote: '2.1 MB' }, 'Signed, ends Aug 2027', { facets: ['Signed, ends Aug 2027', 'Not signed yet (old lease: shared flat)', 'Renew by June'], tags: ['document', 'renew'] });
variable('internet', 'Internet plan', 'home', 60, { facets: [60, 55, 65], units: { '*': 'USD/month' }, tags: ['money', 'monthly'] });
thing('wifi', 'Wi-Fi network', 'home', 'Okafor-3F', { notes: 'The password is on the sticker under the router — stored there, not here.', tags: ['password'] });
thing('car', 'Car', 'home', '2019 hatchback', { facets: ['2019 hatchback', 'No car (bus pass)', '2019 hatchback'], tags: ['life'] });
variable('car-insurance', 'Car insurance', 'home', 95, { facets: [95, 0, 102], units: { '*': 'USD/month' }, tags: ['money', 'monthly', 'insurance', 'renew'] });
file('insurance-card', 'insurance-card.jpg', 'home', { path: 'Photos/Documents/insurance-card.jpg', mime: 'image/jpeg', sizeNote: '340 KB' }, 'Policy HB-22-0917', { tags: ['insurance', 'document'] });
thing('passport', 'Passport', 'home', 'Valid until 2028-03', { facets: ['Valid until 2028-03', 'Valid until 2028-03', 'Renew before travel: < 6 months left'], notes: 'Kept in the blue folder, top drawer of the desk.', tags: ['document', 'travel', 'renew'] });
thing('desk-drawer', 'Desk, top drawer', 'home', 'Blue folder: passport, birth certificate', { tags: ['where'] });
thing('spare-key', 'Spare key', 'home', 'With Ana next door', { facets: ['With Ana next door', 'Under the mat (bad idea)', 'With Ana next door'], tags: ['where'] });
thing('dentist', 'Dentist check-up', 'home', 'Jan 12', { facets: ['Jan 12', 'Missed (rebooked)', 'Every 6 months'], tags: ['health', 'deadline'] });
thing('basil', 'Basil plant', 'home', 'Water every 3 days', { tags: ['life'] });
note('groceries', 'Grocery list', 'home', 'Lentils, tomatoes, basil seeds, coffee, oat milk.', { tags: ['list'] });
file('lasagna', 'lasagna.md', 'home', { path: 'Notes/Recipes/lasagna.md', mime: 'text/markdown', content: '# Lasagna\nOven 190 °C, 45 min. Rest 10 min before cutting.' }, 'Recipe, serves 6', { tags: ['recipe'] });
file('lentil-soup', 'lentil-soup.md', 'home', { path: 'Notes/Recipes/lentil-soup.md', mime: 'text/markdown', content: '# Lentil soup\nSimmer 25 min. Basil at the end.' }, 'Recipe, serves 4', { tags: ['recipe'] });

// ── Money (14) ──────────────────────────────────────────────────────────────────────────
thing('money', 'Money', 'money', 'Monthly in, monthly out, saving for Lisbon', { tags: ['money'] });
variable('salary', 'Salary', 'money', 4100, { facets: [4100, 3800, 4400], units: { '*': 'USD/month' }, tags: ['money', 'monthly'] });
variable('savings', 'Savings', 'money', 4200, { facets: [4200, 2600, 7000], units: { '*': 'USD' }, tags: ['money'] });
variable('emergency', 'Emergency fund', 'money', 1500, { facets: [1500, 1500, 2000], units: { '*': 'USD' }, notes: 'Never spend below this.', tags: ['money'] });
variable('monthly-saving', 'Monthly saving', 'money', 350, { facets: [350, 250, 400], units: { '*': 'USD/month' }, tags: ['money', 'monthly'] });
variable('subscriptions', 'Subscriptions', 'money', 48, { facets: [48, 61, 40], units: { '*': 'USD/month' }, notes: 'Music, cloud storage, one news site. Last year also a gym never used.', tags: ['money', 'monthly'] });
thing('trip', 'Trip to Lisbon', 'money', 'Planning', { facets: ['Planning', 'Just an idea', 'Booked for May'], tags: ['travel'] });
variable('trip-cost', 'Trip cost', 'money', 3100, { facets: [3100, 3400, 3300], units: { '*': 'USD' }, notes: 'Flights, 6 nights, food. Prices drop when booked early.', tags: ['money', 'travel'] });
file('hotel', 'lisbon-hotel.png', 'money', { path: 'Photos/Travel/lisbon-hotel.png', mime: 'image/png', sizeNote: '1.4 MB' }, 'Screenshot of the hotel shortlist', { tags: ['travel'] });
thing('tax-return', 'Tax return', 'money', 'Due Apr 15', { facets: ['Due Apr 15', 'Filed late (Apr 30)', 'Due Apr 15 — ask Jo early'], tags: ['money', 'deadline', 'tax'] });
file('tax-2025', 'tax-2025.pdf', 'money', { path: 'Documents/Money/tax-2025.pdf', mime: 'application/pdf', sizeNote: '890 KB' }, 'Last year’s return', { tags: ['tax', 'document'] });
file('budget', 'budget-2026.xlsx', 'money', { path: 'Documents/Money/budget-2026.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeNote: '64 KB' }, 'Monthly budget sheet', { tags: ['money', 'monthly'] });
file('invoice', 'invoice-118.pdf', 'money', { path: 'Documents/Work/invoice-118.pdf', mime: 'application/pdf', sizeNote: '120 KB' }, 'Riverside Co-op, $1,800', { facets: ['Sent, unpaid', 'Not written yet', 'Paid'], tags: ['money', 'document', 'project'] });
variable('side-income', 'Side income', 'money', 600, { facets: [600, 0, 1500], units: { '*': 'USD/month' }, notes: 'From Garden app work for the Riverside Co-op.', tags: ['money', 'monthly', 'project'] });

// ── People (8) ──────────────────────────────────────────────────────────────────────────
thing('sam', 'Sam', 'people', 'Teammate on Garden app', { facets: ['Teammate on Garden app', 'Classmate from the night course', 'Co-founder'], notes: 'Had the original Garden app idea. Knows the Riverside Co-op people. Birthday Sep 9.', tags: ['person'] });
thing('ana', 'Ana', 'people', 'Neighbour, 3B', { notes: 'Has the spare key. Waters the basil when I travel.', tags: ['person'] });
thing('mom', 'Mom', 'people', 'Birthday May 3', { notes: 'Call on Sundays. Wants photos from Lisbon.', tags: ['person', 'birthday'] });
thing('priya', 'Priya', 'people', 'Riverside Co-op coordinator', { facets: ['Riverside Co-op coordinator', 'Unknown', 'Our main client contact'], tags: ['person', 'client'] });
thing('okafor', 'Ms. Okafor', 'people', 'Landlord', { notes: 'Prefers email. Renewal talk in June.', tags: ['person'] });
thing('jo', 'Jo', 'people', 'Accountant', { facets: ['Accountant', 'Not yet (did taxes alone)', 'Accountant'], tags: ['person', 'tax'] });
thing('dr-lee', 'Dr. Lee', 'people', 'Dentist', { tags: ['person', 'health'] });
thing('birthdays', 'Birthdays', 'people', 'Mom May 3 · Sam Sep 9 · Ana Dec 1', { tags: ['birthday', 'list'] });

// ── Garden app: the side project (14) ───────────────────────────────────────────────────
thing('garden', 'Garden app', 'project', 'Prototype', { facets: ['Prototype', 'Idea on a napkin', 'Launched to 3 co-ops'], notes: 'Reminds community gardeners when to water, based on the weather.', tags: ['project', 'garden'] });
thing('coop', 'Riverside Co-op', 'project', 'First client', { facets: ['First client', 'Never heard of them', 'Paying client, 140 members'], tags: ['client', 'garden'] });
thing('decision-sqlite', 'Decision: use SQLite', 'project', 'Decided Feb 2', { notes: 'One file, no server to run. Revisit if more than 10 co-ops.', tags: ['decision', 'garden'] });
thing('bug-42', 'Bug #42', 'project', 'Reminders repeat twice', { facets: ['Reminders repeat twice', null, 'Fixed in 1.0.2'], notes: 'Happens when the phone changes time zone. See reminders.js.', tags: ['bug', 'garden'] });
thing('deadline', 'Demo deadline', 'project', 'Mar 14', { facets: ['Mar 14', 'None yet', 'Met (Mar 14)'], tags: ['deadline', 'garden'] });
note('kickoff', 'Kickoff meeting', 'project', 'With Sam and Priya. Agreed: watering reminders first, weather second, payments later.', { tags: ['meeting', 'garden'] });
file('research-notes', 'research-notes.md', 'project', { path: 'Projects/Garden/research-notes.md', mime: 'text/markdown', content: '12 gardeners interviewed. Biggest pain: forgetting to water in heat waves.' }, '12 interviews', { tags: ['garden', 'research'] });
file('mockups', 'mockups.fig', 'project', { path: 'Projects/Garden/mockups.fig', mime: 'application/octet-stream', sizeNote: '18 MB' }, 'Three screens', { tags: ['garden', 'design'] });
file('reminders-js', 'reminders.js', 'project', { path: 'Projects/Garden/src/reminders.js', mime: 'text/javascript' }, 'Schedules reminders', { tags: ['garden', 'code'] });
thing('old-proto', 'Old prototype (2025)', 'project', 'Abandoned', { facets: ['Reused for the beta', 'Abandoned in a drawer', 'Archived'], notes: 'A weekend hack from last year — turned out to cover most of the beta.', tags: ['garden'] });
variable('weekly-users', 'Weekly users', 'project', 40, { facets: [40, 0, 1200], units: { '*': 'people' }, tags: ['garden', 'metric'] });
note('feedback', 'User feedback', 'project', '"Tell me before the heat wave, not during." "Let me snooze for a day."', { tags: ['garden', 'research'] });
thing('weather-api', 'Weather service', 'project', 'Free tier, 1,000 calls/day', { facets: ['Free tier, 1,000 calls/day', null, 'Paid tier, $20/month'], tags: ['garden', 'money'] });
thing('domain', 'gardenapp domain', 'project', 'Renews every Oct', { tags: ['garden', 'renew', 'money'] });

// ── Code: the checkout of the Garden app shop (9) ───────────────────────────────────────
file('checkout-js', 'checkout.js', 'code', { path: 'Projects/Garden/src/checkout.js', mime: 'text/javascript', content: 'total = cartTotal - cartTotal * discountPct / 100;\ntotal += total * taxPct / 100;\nif (!isMember) total += shippingFee;' }, 'Computes the order total', { tags: ['code', 'garden'] });
variable('cart-total', 'cartTotal', 'code', 80, { facets: [80, 60, 100], units: { '*': 'USD' }, tags: ['code'] });
variable('discount', 'discountPct', 'code', 10, { facets: [10, 0, 20], units: { '*': '%' }, tags: ['code', 'money'] });
variable('tax-pct', 'taxPct', 'code', 5, { facets: [5, 4, 8], units: { '*': '%' }, notes: 'Changes by law; next year it goes up.', tags: ['code', 'tax', 'money'] });
variable('is-member', 'isMember', 'code', true, { facets: [true, false, true], tags: ['code'] });
variable('shipping', 'shippingFee', 'code', 7, { facets: [7, 7, 5], units: { '*': 'USD' }, tags: ['code', 'money'] });
file('config-json', 'config.json', 'code', { path: 'Projects/Garden/config.json', mime: 'application/json', content: '{ "taxPct": 5, "shippingFee": 7, "currency": "USD" }' }, 'Shop settings', { tags: ['code'] });
file('checkout-test', 'checkout.test.js', 'code', { path: 'Projects/Garden/test/checkout.test.js', mime: 'text/javascript' }, '6 tests', { facets: ['6 tests, all pass', 'No tests', '14 tests'], tags: ['code', 'test'] });
thing('shop', 'Seed shop', 'code', 'Sells seed packs to members', { facets: ['Sells seed packs to members', null, 'Open to everyone'], tags: ['garden', 'money'] });

// ── Day job (12) ────────────────────────────────────────────────────────────────────────
thing('job', 'Day job', 'job', 'Support engineer at Northwind Bikes', { facets: ['Support engineer at Northwind Bikes', 'Junior support at Northwind Bikes', 'Team lead, support'], tags: ['work'] });
thing('manager', 'Rosa (manager)', 'job', 'Weekly 1:1 on Tuesdays', { tags: ['person', 'work'] });
note('one-on-one', '1:1 notes', 'job', 'Asked about the team-lead path. Rosa: lead one project end to end first. Next 1:1: show the ticket dashboard.', { tags: ['work', 'meeting'] });
thing('laptop', 'Work laptop', 'job', 'Asset tag NB-4471', { notes: 'Return within 5 days if leaving. IT: help@northwind.example.', tags: ['work', 'where'] });
thing('vpn', 'VPN access', 'job', 'Via the company app', { notes: 'The password lives in the company password manager — not here.', tags: ['work', 'password'] });
variable('tickets', 'Open tickets', 'job', 18, { facets: [18, 42, 10], units: { '*': 'tickets' }, tags: ['work', 'metric'] });
file('dashboard', 'ticket-dashboard.sql', 'job', { path: 'Work/queries/ticket-dashboard.sql', mime: 'application/sql', content: 'SELECT status, count(*) FROM tickets GROUP BY status;' }, 'The query behind the dashboard', { tags: ['work', 'code'] });
thing('review', 'Performance review', 'job', 'Due Jun 30', { facets: ['Due Jun 30', '"Meets expectations"', 'Aim: "exceeds", then lead role'], tags: ['work', 'deadline'] });
file('handbook', 'employee-handbook.pdf', 'job', { path: 'Work/HR/employee-handbook.pdf', mime: 'application/pdf', sizeNote: '3.8 MB' }, 'Leave, expenses, laptop policy', { tags: ['work', 'document'] });
variable('leave-days', 'Leave days left', 'job', 14, { facets: [14, 3, 25], units: { '*': 'days' }, notes: 'Lisbon needs 6 of them.', tags: ['work', 'travel'] });
thing('commute', 'Commute', 'job', 'Car, 25 min', { facets: ['Car, 25 min', 'Bus 41, 50 min', 'Remote 3 days a week'], tags: ['work', 'life'] });
note('expenses', 'Expense rule', 'job', 'Claim within 30 days; photo of the receipt is enough. Lunches with clients count.', { tags: ['work', 'money'] });

// ── Learning (11) ───────────────────────────────────────────────────────────────────────
thing('learning', 'Learning', 'learning', 'One course and one book at a time', { tags: ['learning'] });
thing('course', 'Night course: Web dev', 'learning', 'Finished', { facets: ['Finished', 'Week 6 of 12', 'Teaching assistant'], notes: 'Where I met Sam.', tags: ['learning', 'course'] });
thing('portuguese', 'Portuguese', 'learning', 'A2, 15 min a day', { facets: ['A2, 15 min a day', 'Not started', 'B1 — enough for Lisbon'], tags: ['learning', 'travel'] });
variable('streak', 'Practice streak', 'learning', 46, { facets: [46, 0, 300], units: { '*': 'days' }, tags: ['learning', 'metric'] });
thing('book-1', 'Book: Thinking in Systems', 'learning', 'Reading, chapter 4', { facets: ['Reading, chapter 4', 'On the wishlist', 'Read, notes taken'], tags: ['learning', 'book'] });
note('book-notes', 'Notes: Thinking in Systems', 'learning', 'Stocks and flows. A delay in a feedback loop makes it oscillate — like watering reminders that arrive after the heat wave.', { tags: ['learning', 'book', 'garden'] });
thing('book-2', 'Book: The Design of Everyday Things', 'learning', 'Read', { tags: ['learning', 'book', 'design'] });
file('certificate', 'webdev-certificate.pdf', 'learning', { path: 'Documents/Learning/webdev-certificate.pdf', mime: 'application/pdf', sizeNote: '210 KB' }, 'Course certificate', { tags: ['learning', 'document'] });
note('til', 'Things I learned', 'learning', 'SQLite handles more than you think. Time zones break reminders. People read the first line only.', { tags: ['learning', 'garden', 'code'] });
thing('sql', 'Skill: SQL', 'learning', 'Comfortable', { facets: ['Comfortable', 'Beginner', 'Strong'], tags: ['learning', 'code', 'work'] });
thing('js', 'Skill: JavaScript', 'learning', 'Comfortable', { facets: ['Comfortable', 'Learning', 'Strong'], tags: ['learning', 'code'] });

// ── Health & routines (9) ───────────────────────────────────────────────────────────────
thing('health', 'Health', 'health', 'Sleep, move, check-ups', { tags: ['health'] });
variable('sleep', 'Sleep', 'health', 7, { facets: [7, 6, 7.5], units: { '*': 'hours' }, tags: ['health', 'metric'] });
variable('steps', 'Daily steps', 'health', 6500, { facets: [6500, 9000, 8000], units: { '*': 'steps' }, notes: 'Dropped when I got the car.', tags: ['health', 'metric'] });
thing('run', 'Run club', 'health', 'Saturdays 8:00', { facets: ['Saturdays 8:00', 'Not a thing yet', 'Training for a 10k'], tags: ['health', 'routine'] });
thing('allergy', 'Allergy', 'health', 'Penicillin', { notes: 'Tell any new doctor or dentist.', tags: ['health', 'important'] });
file('vaccines', 'vaccination-record.pdf', 'health', { path: 'Documents/Health/vaccination-record.pdf', mime: 'application/pdf', sizeNote: '150 KB' }, 'Up to date', { tags: ['health', 'document', 'travel'] });
thing('eye-test', 'Eye test', 'health', 'Every 2 years — next in March', { tags: ['health', 'deadline'] });
note('morning', 'Morning routine', 'health', 'Water, 15 min Portuguese, water the basil on Mon/Thu, leave by 8:20.', { tags: ['routine'] });
thing('gym', 'Gym membership', 'health', 'Cancelled', { facets: ['Cancelled', 'Paying, never going', 'Cancelled'], tags: ['health', 'money'] });

// ── Travel: Lisbon details (9) ──────────────────────────────────────────────────────────
thing('flights', 'Flights', 'travel', 'Watching prices', { facets: ['Watching prices', 'Not looked', 'Booked: TP 202, May 9'], tags: ['travel', 'money'] });
note('packing', 'Packing list', 'travel', 'Passport, adapter (type F), sun hat, walking shoes, Portuguese phrasebook, allergy card.', { tags: ['travel', 'list'] });
thing('adapter', 'Plug adapter', 'travel', 'Type F — in the travel pouch', { tags: ['travel', 'where'] });
thing('alfama', 'Alfama walk', 'travel', 'Day 2 morning', { notes: 'Start at the castle, walk down; Mom wants photos of the tiles.', tags: ['travel', 'place'] });
thing('sintra', 'Day trip: Sintra', 'travel', 'Day 4', { tags: ['travel', 'place'] });
thing('pasteis', 'Pastéis de nata place', 'travel', 'Belém, go early', { tags: ['travel', 'food'] });
file('itinerary', 'lisbon-itinerary.md', 'travel', { path: 'Notes/Travel/lisbon-itinerary.md', mime: 'text/markdown', content: 'Day 1 arrive · Day 2 Alfama · Day 3 Belém · Day 4 Sintra · Day 5 rest · Day 6 fly home' }, '6 days', { tags: ['travel'] });
thing('travel-insurance', 'Travel insurance', 'travel', 'Not bought', { facets: ['Not bought', null, 'Bought with the flights'], tags: ['travel', 'insurance', 'money'] });
thing('phrase', 'Phrase: "Onde fica…?"', 'travel', '"Where is…?"', { tags: ['travel', 'learning'] });

// ── Files hub (1) — every file links here ──────────────────────────────────────────────
thing('files', 'Files', 'files', 'Everything stored as a file reference', { notes: 'Click this to see every file in the memory at once. Files are stored by name and path, sometimes with a short excerpt.', tags: ['files'] });

// ── Garden app timeline: the declared, step-by-step road (13 hops) ──────────────────────
const TIMELINE: Array<[string, string]> = [
  ['t-idea', 'Idea'], ['t-sketch', 'Sketch'], ['t-interviews', 'Interviews'], ['t-research', 'Research summary'],
  ['t-wireframes', 'Wireframes'], ['t-prototype', 'Prototype'], ['t-feedback', 'Feedback round'], ['t-rewrite', 'Rewrite'],
  ['t-beta', 'Beta'], ['t-fixes', 'Bug fixing'], ['t-pricing', 'Pricing'], ['t-site', 'Website'], ['t-prelaunch', 'Pre-launch'], ['t-launch', 'Launch'],
];
TIMELINE.forEach(([id, label], i) => thing(id, label, 'timeline', `Step ${i + 1} of ${TIMELINE.length}`, { tags: ['timeline', 'garden'] }));

// ── Pathways (3) ────────────────────────────────────────────────────────────────────────
// A · Can I afford the trip?  if/else on three money values.
step('a1', 'Can I afford the trip?', 'afford', { op: 'start' });
step('a2', 'read s ← Savings', 'afford', { op: 'read', target: 's', source: 'savings' });
step('a3', 'read c ← Trip cost', 'afford', { op: 'read', target: 'c', source: 'trip-cost' });
step('a4', 'if s − c ≥ Emergency fund', 'afford', { op: 'if', expr: 's - c >= @"Emergency fund"' });
step('a5', 'end: Book it', 'afford', { op: 'end', expr: '"Book it: " + (s - c) + " USD left after the trip."' });
step('a6', 'end: Not yet', 'afford', { op: 'end', expr: '"Not yet: " + (@"Emergency fund" - (s - c)) + " USD short of keeping the emergency fund."' });
// M · Months until the trip?  a while loop that keeps saving.
step('m1', 'Months until the trip?', 'months', { op: 'start' });
step('m2', 'read s ← Savings', 'months', { op: 'read', target: 's', source: 'savings' });
step('m3', 'assign months ← 0', 'months', { op: 'assign', target: 'months', expr: '0' });
step('m4', 'while s < trip + emergency', 'months', { op: 'while', expr: 's < @"Trip cost" + @"Emergency fund"' });
step('m5', 'assign s ← s + Monthly saving', 'months', { op: 'assign', target: 's', expr: 's + @"Monthly saving"' });
step('m6', 'assign months ← months + 1', 'months', { op: 'assign', target: 'months', expr: 'months + 1' });
step('m7', 'end: ready in n months', 'months', { op: 'end', expr: '"Ready in " + months + " months, with " + s + " saved."' });
// C · What will checkout charge?  data flowing through the code variables.
step('c1', 'What will checkout charge?', 'checkout', { op: 'start' });
step('c2', 'read t ← cartTotal', 'checkout', { op: 'read', target: 't', source: 'cart-total' });
step('c3', 'assign t ← t − discount', 'checkout', { op: 'assign', target: 't', expr: 't - t * @discountPct / 100' });
step('c4', 'assign t ← t + tax', 'checkout', { op: 'assign', target: 't', expr: 't + t * @taxPct / 100' });
step('c5', 'if isMember', 'checkout', { op: 'if', expr: '@isMember' });
step('c6', 'end: members ship free', 'checkout', { op: 'end', expr: '"Member pays " + t + ", free shipping."' });
step('c7', 'end: add shipping', 'checkout', { op: 'end', expr: '"Guest pays " + (t + @shippingFee) + " USD with shipping."' });

// ── Relations ───────────────────────────────────────────────────────────────────────────
// Guide → the things each "Try" points at
// Guide pointers are weak (cost 4 per hop) so routes go through real things, not the guide.
const GUIDE_W = 0.25;
rel('guide', 'g-search', 'tax-return', 'references', undefined, GUIDE_W);
rel('guide', 'g-neighbours', 'sam', 'references', undefined, GUIDE_W);
rel('guide', 'g-neighbours', 'files', 'references', undefined, GUIDE_W);
rel('guide', 'g-route', 't-idea', 'references', undefined, GUIDE_W);
rel('guide', 'g-lens', 'rent', 'references', undefined, GUIDE_W);
rel('guide', 'g-path', 'a1', 'references', undefined, GUIDE_W);
rel('guide', 'g-store', 'home', 'references', undefined, GUIDE_W);
rel('guide', 'g-questions', 'lease', 'references', undefined, GUIDE_W);
rel('guide', 'g-patterns', 'money', 'references', undefined, GUIDE_W);
// Home
for (const id of ['rent', 'lease', 'internet', 'wifi', 'spare-key', 'basil', 'groceries', 'desk-drawer']) rel('home', id, 'home', 'part-of');
rel('home', 'lease', 'rent', 'relates');
rel('home', 'lease', 'okafor', 'references');
rel('home', 'rent', 'okafor', 'relates');
rel('home', 'car', 'car-insurance', 'needs', ['today', 'next-year']);
rel('home', 'car-insurance', 'insurance-card', 'references');
rel('home', 'passport', 'desk-drawer', 'relates');
rel('home', 'spare-key', 'ana', 'relates');
rel('home', 'basil', 'ana', 'relates');
rel('home', 'basil', 'lentil-soup', 'relates');
rel('home', 'groceries', 'lentil-soup', 'references');
rel('home', 'groceries', 'lasagna', 'references');
rel('home', 'dentist', 'dr-lee', 'relates');
rel('home', 'car', 'home', 'relates', ['today', 'next-year']);
// Money
for (const id of ['salary', 'savings', 'emergency', 'monthly-saving', 'subscriptions', 'budget', 'side-income', 'tax-return']) rel('money', id, 'money', 'part-of');
rel('money', 'rent', 'budget', 'relates');
rel('money', 'internet', 'budget', 'relates');
rel('money', 'car-insurance', 'budget', 'relates', ['today', 'next-year']);
rel('money', 'subscriptions', 'budget', 'relates');
rel('money', 'monthly-saving', 'savings', 'causes');
rel('money', 'savings', 'trip', 'relates');
rel('money', 'trip', 'trip-cost', 'relates');
rel('money', 'trip', 'hotel', 'references');
rel('money', 'trip', 'passport', 'needs');
rel('money', 'trip', 'mom', 'relates');
rel('money', 'tax-return', 'tax-2025', 'references');
rel('money', 'tax-return', 'jo', 'relates', ['today', 'next-year']);
rel('money', 'tax-return', 'salary', 'relates');
rel('money', 'tax-return', 'side-income', 'relates');
rel('money', 'invoice', 'side-income', 'causes', ['today', 'next-year']);
rel('money', 'invoice', 'coop', 'references', ['today', 'next-year']);
rel('money', 'emergency', 'savings', 'relates');
// People
rel('people', 'birthdays', 'mom', 'references');
rel('people', 'birthdays', 'sam', 'references');
rel('people', 'birthdays', 'ana', 'references');
rel('people', 'sam', 'garden', 'owns', ['today', 'next-year']);
rel('people', 'sam', 't-idea', 'relates');
rel('people', 'sam', 'kickoff', 'relates', ['today', 'next-year']);
rel('people', 'sam', 'coop', 'knows', ['today', 'next-year']);
rel('people', 'sam', 'old-proto', 'relates');
rel('people', 'priya', 'coop', 'part-of', ['today', 'next-year']);
rel('people', 'priya', 'kickoff', 'relates', ['today', 'next-year']);
rel('people', 'jo', 'tax-2025', 'relates', ['today', 'next-year']);
rel('people', 'okafor', 'home', 'relates');
// Project
rel('project', 'coop', 'garden', 'part-of', ['today', 'next-year']);
for (const id of ['decision-sqlite', 'bug-42', 'deadline', 'kickoff', 'research-notes', 'mockups', 'reminders-js', 'weekly-users', 'feedback', 'weather-api', 'domain']) rel('project', id, 'garden', 'part-of');
rel('project', 'bug-42', 'reminders-js', 'references');
rel('project', 'bug-42', 'feedback', 'relates');
rel('project', 'bug-42', 'weekly-users', 'causes', ['today']);
rel('project', 'feedback', 'research-notes', 'relates');
rel('project', 'reminders-js', 'weather-api', 'relates');
rel('project', 'weather-api', 'budget', 'relates', ['next-year']);
rel('project', 'domain', 'subscriptions', 'relates');
rel('project', 'deadline', 'kickoff', 'relates');
rel('project', 'coop', 'weekly-users', 'causes', ['today', 'next-year']);
rel('project', 'decision-sqlite', 'reminders-js', 'relates');
// Code
for (const id of ['cart-total', 'discount', 'tax-pct', 'is-member', 'shipping']) rel('code', id, 'checkout-js', 'part-of');
rel('code', 'config-json', 'tax-pct', 'references');
rel('code', 'config-json', 'shipping', 'references');
rel('code', 'checkout-test', 'checkout-js', 'references');
rel('code', 'checkout-js', 'shop', 'part-of');
rel('code', 'shop', 'garden', 'part-of', ['today', 'next-year']);
rel('code', 'tax-pct', 'tax-return', 'relates');
rel('code', 'shop', 'side-income', 'causes', ['next-year']);
// Day job
for (const id of ['manager', 'one-on-one', 'laptop', 'vpn', 'tickets', 'review', 'handbook', 'leave-days', 'commute', 'expenses', 'dashboard']) rel('job', id, 'job', 'part-of');
rel('job', 'manager', 'one-on-one', 'relates');
rel('job', 'one-on-one', 'review', 'relates');
rel('job', 'one-on-one', 'dashboard', 'references');
rel('job', 'dashboard', 'tickets', 'relates');
rel('job', 'dashboard', 'sql', 'relates');
rel('job', 'handbook', 'laptop', 'references');
rel('job', 'handbook', 'expenses', 'references');
rel('job', 'handbook', 'leave-days', 'references');
rel('job', 'commute', 'car', 'needs', ['today']);
rel('job', 'salary', 'job', 'causes');
rel('job', 'leave-days', 'trip', 'needs');
rel('job', 'expenses', 'money', 'relates');
// Learning
for (const id of ['course', 'portuguese', 'book-1', 'book-2', 'til', 'sql', 'js', 'certificate']) rel('learn', id, 'learning', 'part-of');
rel('learn', 'course', 'sam', 'relates');
rel('learn', 'course', 'certificate', 'references');
rel('learn', 'course', 'js', 'causes');
rel('learn', 'portuguese', 'streak', 'relates');
rel('learn', 'portuguese', 'trip', 'relates');
rel('learn', 'book-1', 'book-notes', 'references');
rel('learn', 'book-notes', 'bug-42', 'relates');
rel('learn', 'book-2', 'mockups', 'relates');
rel('learn', 'til', 'decision-sqlite', 'relates');
rel('learn', 'til', 'bug-42', 'relates');
rel('learn', 'js', 'checkout-js', 'relates');
rel('learn', 'js', 'reminders-js', 'relates');
// Health
for (const id of ['sleep', 'steps', 'run', 'allergy', 'vaccines', 'eye-test', 'dentist', 'gym']) rel('health', id, 'health', 'part-of');
rel('health', 'allergy', 'dr-lee', 'relates');
rel('health', 'allergy', 'packing', 'relates');
rel('health', 'steps', 'commute', 'relates');
rel('health', 'gym', 'subscriptions', 'relates', ['last-year']);
rel('health', 'morning', 'portuguese', 'relates');
rel('health', 'morning', 'basil', 'relates');
rel('health', 'morning', 'health', 'relates');
// Travel
for (const id of ['flights', 'packing', 'itinerary', 'travel-insurance', 'hotel']) rel('travel', id, 'trip', 'part-of');
rel('travel', 'itinerary', 'alfama', 'references');
rel('travel', 'itinerary', 'sintra', 'references');
rel('travel', 'itinerary', 'pasteis', 'references');
rel('travel', 'packing', 'adapter', 'references');
rel('travel', 'packing', 'passport', 'references');
rel('travel', 'vaccines', 'trip', 'relates');
rel('travel', 'flights', 'trip-cost', 'relates');
rel('travel', 'travel-insurance', 'trip-cost', 'relates');
rel('travel', 'alfama', 'mom', 'relates');
rel('travel', 'phrase', 'portuguese', 'part-of');
rel('travel', 'phrase', 'itinerary', 'relates');
// Files hub: every file is-a File
// The Files hub gathers every file for neighbourhood browsing; weak, so it is not a route shortcut.
for (const n of nodes) if (n.kind === 'file') rel('file', n.id, 'files', 'is-a', undefined, 0.25);
// Timeline: 13 declared hops, then the shortcuts that make it short
for (let i = 0; i < TIMELINE.length - 1; i++) rel('road', TIMELINE[i]![0], TIMELINE[i + 1]![0], 'next');
rel('road', 't-idea', 'garden', 'relates');
rel('road', 't-launch', 'coop', 'relates', ['today', 'next-year']);
rel('road', 't-launch', 'deadline', 'relates', ['today', 'next-year']);
rel('road', 'old-proto', 't-beta', 'relates', ['today', 'next-year']);
rel('road', 't-interviews', 'research-notes', 'references');
rel('road', 't-wireframes', 'mockups', 'references');
rel('road', 't-feedback', 'feedback', 'references');
rel('road', 't-fixes', 'bug-42', 'relates');
rel('road', 't-pricing', 'shop', 'relates');
// Flows
flow('a1', 'a2', 'next'); flow('a2', 'a3', 'next'); flow('a3', 'a4', 'next');
flow('a4', 'a5', 'true', 'then'); flow('a4', 'a6', 'false', 'else');
flow('m1', 'm2', 'next'); flow('m2', 'm3', 'next'); flow('m3', 'm4', 'next');
flow('m4', 'm5', 'true', 'body'); flow('m5', 'm6', 'next'); flow('m6', 'm4', 'next', 'loop'); flow('m4', 'm7', 'false', 'exit');
flow('c1', 'c2', 'next'); flow('c2', 'c3', 'next'); flow('c3', 'c4', 'next'); flow('c4', 'c5', 'next');
flow('c5', 'c6', 'true', 'then'); flow('c5', 'c7', 'false', 'else');
// Reads: each pathway step → the light it reads
rel('read', 'a2', 'savings', 'reads'); rel('read', 'a3', 'trip-cost', 'reads'); rel('read', 'a4', 'emergency', 'reads');
rel('read', 'm2', 'savings', 'reads'); rel('read', 'm4', 'trip-cost', 'reads'); rel('read', 'm5', 'monthly-saving', 'reads');
rel('read', 'c2', 'cart-total', 'reads'); rel('read', 'c3', 'discount', 'reads'); rel('read', 'c4', 'tax-pct', 'reads');
rel('read', 'c5', 'is-member', 'reads'); rel('read', 'c7', 'shipping', 'reads');
rel('read', 'a1', 'trip', 'relates'); rel('read', 'm1', 'trip', 'relates'); rel('read', 'c1', 'checkout-js', 'relates');

// ── Layout: clusters as islands, per lens ───────────────────────────────────────────────
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const ISLANDS: Record<Exclude<Cluster, 'afford' | 'months' | 'checkout' | 'timeline'>, Record<Lens, Vec3>> = {
  guide: { today: v(0, 78, 0), 'last-year': v(0, 82, -10), 'next-year': v(0, 78, 0) },
  home: { today: v(-88, 34, 0), 'last-year': v(-70, 20, 10), 'next-year': v(-92, 40, -6) },
  money: { today: v(-40, -12, 6), 'last-year': v(-52, -20, 0), 'next-year': v(-18, -8, 10) },
  people: { today: v(28, 34, 4), 'last-year': v(-20, 40, 8), 'next-year': v(34, 30, 0) },
  project: { today: v(72, -4, 0), 'last-year': v(100, -20, -30), 'next-year': v(58, -2, 6) },
  code: { today: v(122, 34, -8), 'last-year': v(128, 40, -20), 'next-year': v(108, 30, -4) },
  files: { today: v(-6, 30, -24), 'last-year': v(-6, 30, -24), 'next-year': v(-6, 30, -24) },
  job: { today: v(150, 80, -10), 'last-year': v(140, 70, 0), 'next-year': v(160, 90, -14) },
  learning: { today: v(78, 96, -6), 'last-year': v(40, 100, 0), 'next-year': v(82, 100, -10) },
  health: { today: v(-150, 84, -8), 'last-year': v(-140, 70, 0), 'next-year': v(-156, 90, -6) },
  travel: { today: v(-92, 108, 0), 'last-year': v(-110, 120, -30), 'next-year': v(-62, 104, 10) },
};
const RADIUS: Record<keyof typeof ISLANDS, number> = { guide: 26, home: 34, money: 30, people: 22, project: 34, code: 24, files: 0, job: 30, learning: 28, health: 26, travel: 26 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function positionsFor(lens: Lens): Record<string, Vec3> {
  const out: Record<string, Vec3> = {};
  const r1 = (n: number) => Math.round(n * 100) / 100;
  // Islands: a sunflower disc in the screen plane, slight depth jitter. The hub sits at the centre.
  const HUB: Partial<Record<Cluster, string>> = { guide: 'g-start', home: 'home', money: 'money', project: 'garden', code: 'checkout-js', files: 'files', people: 'birthdays', job: 'job', learning: 'learning', health: 'health', travel: 'itinerary' };
  for (const c of Object.keys(ISLANDS) as Array<keyof typeof ISLANDS>) {
    // Island centres are spread ×1.4 around the middle so each cluster reads as its own island (M-0003 F-002).
    const raw = ISLANDS[c][lens];
    const at = { x: r1(raw.x * 1.4), y: r1(raw.y * 1.4), z: raw.z };
    const members = nodes.filter((n) => clusterOf.get(n.id) === c && n.id !== HUB[c]);
    const hub = HUB[c];
    const R = RADIUS[c];
    // The hub crowns its island (just above the disc), so its name has open sky (M-0003 F-002).
    if (hub) out[hub] = R ? { x: at.x, y: r1(at.y + R * 0.82 + 9), z: at.z } : at;
    members.forEach((n, i) => {
      const t = (i + 0.7) / members.length;
      const a = i * 2.39996 + hash(c + lens) * 6.28;
      const r = R * Math.sqrt(t);
      out[n.id] = { x: r1(at.x + Math.cos(a) * r), y: r1(at.y + Math.sin(a) * r * 0.82), z: r1(at.z + (hash(n.id + lens) - 0.5) * 10) };
    });
  }
  // Timeline: an open arc under everything, Idea on the left, Launch on the right.
  const tilt = lens === 'last-year' ? 18 : lens === 'next-year' ? 6 : 10;
  TIMELINE.forEach(([id], i) => {
    const a = Math.PI * (1.08 + (0.84 * i) / (TIMELINE.length - 1));
    out[id] = { x: r1(10 + Math.cos(a) * 125), y: r1(-150 - Math.sin(a) * 34), z: r1(Math.sin(a) * tilt) };
  });
  // Pathways: vertical flowcharts, left to right under the money and project islands.
  // Flowcharts sit 1.4× further out too, keeping their 11-unit step spacing.
  const column = (ids: string[], x: number, y: number, side: Record<string, number> = {}) =>
    ids.forEach((id, i) => (out[id] = { x: x * 1.4 + (side[id] ?? 0), y: y * 1.4 - i * 11, z: 6 }));
  column(['a1', 'a2', 'a3', 'a4', 'a5'], -128, -38, { a5: -14 });
  out['a6'] = { x: -128 * 1.4 + 14, y: -38 * 1.4 - 44, z: 6 };
  column(['m1', 'm2', 'm3', 'm4', 'm5', 'm6'], -86, -46, { m5: 14, m6: 14 });
  out['m6'] = { x: -86 * 1.4 + 14, y: -46 * 1.4 - 55, z: 6 };
  out['m5'] = { x: -86 * 1.4 + 14, y: -46 * 1.4 - 33, z: 6 };
  out['m7'] = { x: -86 * 1.4 - 14, y: -46 * 1.4 - 55, z: 6 };
  column(['c1', 'c2', 'c3', 'c4', 'c5', 'c6'], 128, -10, { c6: -14 });
  out['c7'] = { x: 128 * 1.4 + 14, y: -10 * 1.4 - 55, z: 6 };
  return out;
}

const PERSPECTIVES: Array<Omit<Perspective, 'positions'> & { id: Lens }> = [
  { id: 'today', label: 'Today', description: 'How things stand now: current money, the project as a prototype, Sam as a teammate.', accent: '#FFB547' },
  { id: 'last-year', label: 'Last year', description: 'A year ago: a shared flat, no car, the project only an idea, Sam a classmate. Some lines did not exist yet.', accent: '#C79BFF' },
  { id: 'next-year', label: 'Next year', description: 'The plan: higher rent, more savings, Garden app launched, Sam a co-founder.', accent: '#6FD3FF' },
];

export function buildGuidebook(): MemoryDoc {
  return {
    schema: 'constellation.memory',
    version: 1,
    meta: canonMeta({
      title: 'Guidebook: an everyday memory',
      description: 'An example memory to learn retrieval with: a home, money, people, a side project, some code and its files, seen Today, Last year and Next year. Start with the "Start here" light.',
      defaultPerspective: 'today',
      featured: { route: { from: 't-idea', to: 't-launch' }, pathway: 'a1', query: 'tax' },
    }),
    perspectives: PERSPECTIVES.map((p) => canonPerspective({ ...p, positions: positionsFor(p.id) })),
    nodes: nodes.map(canonNode),
    relations: relations.map(canonRelation),
  };
}
