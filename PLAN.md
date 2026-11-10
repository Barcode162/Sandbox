# The Platform: the tiniest engine, and a way to grade every idea in it

A plan, written 2026-11-10. Nothing here is built yet.

**The goal.** One perfect platform, one texture that could never appear by coincidence, a camera you move
with your thumbs. As small as it can be made. Every technique in it is a known idea from LOOP3D **executed a
different way**, sits behind a switch next to its regular twin, and is graded on your iPhone, so each round we
know which idea is best, which is dead weight, and which ones are stronger together.

**The rules.**
- WebGPU in Safari on the iPhone. Published by GitHub only. No build step, no libraries, no WebAssembly:
  one page of plain JavaScript and one shader.
- Every twist ships with its **regular twin** behind a switch. Without the twin in the same harness, "better"
  is a guess.
- The picture must not change when a speed switch flips. The grader checks this before it reports a time.
- A size budget: the engine page at most **8 KB**, the grader at most **8 KB** (loaded only when grading).

**Three honest notes before the list.**
1. I can't promise any of these has never been done. Several have clear ancestors, and I name them. What
   is different is the execution, the phone-first reasoning, and that each one is measured against its twin
   instead of assumed.
2. One platform is 12 triangles. Nothing needs culling at that size, so no culling idea can be graded on
   it. The plan fixes this with a **work dial**: the same platform, cut into N x N blocks, same picture, as
   much work as we ask for. Culling, packing and detail ideas are graded on the dial.
3. Every number under "why it should win" is a prediction from arithmetic. None has been run on a phone.
   They are written down first so the phone can prove them wrong.

---

## 1. What LOOP3D does today (the regular way, read from its code)

| Thing | LOOP3D today | Where |
| --- | --- | --- |
| One corner of a shape | 32 bytes (8 floats) | `renderer_scene.cpp` |
| One triangle corner number | 4 bytes | `cluster.h` |
| One cluster's record | 64 bytes | `ClusterU` |
| One placed copy | 128 bytes | `InstanceU` |
| The frame's settings, sent every frame | 1,536 bytes | `FrameU` |
| "Which triangle is here" picture | 8 bytes a pixel | `RG32Uint` |
| Most other pictures | 8 bytes a pixel | `RGBA16Float` |
| Steps in one frame | about 9 full passes | frame graph |
| Culling one cluster | 6 plane tests, then 8 corners projected and 4 depth reads, and the whole test runs twice (count, then write) | `cluster_cull.wgsl.h` |
| Depth pyramid | 9 reads for every texel of every level | `hzb.wgsl.h` |

These are good ideas. They were designed for desktop graphics chips and for worlds with millions of
triangles. The phone's chip works differently (it draws the screen in small tiles and sorts out what is hidden
by itself), and the cost that matters most on it is **bytes moved**, not triangles.

---

## 2. The techniques (the pool)

Each has: the regular way, the twist, why it should win, an honest note, and its switch (`T01`...).

### Group A: needed for the platform to exist

**T01. The platform is maths, not triangles.**
- Regular: a mesh. Corners in a buffer, numbers in another, a matrix per copy.
- Twist: draw one triangle that covers the screen. For each pixel, work out where the eye's ray meets a box
  (a handful of subtractions and divisions). Hit: platform. Miss: sky. No vertex buffer, no index buffer, no
  instance, no depth buffer.
- Why: geometry memory is **0 bytes**. The cost depends only on pixels, never on how big or detailed the
  platform is. Edges are exact at any distance.
- Honest: ray-box maths is old and well known. It only works while the world is simple shapes; T07-T12 are
  how the same picture is drawn when it is not.

**T02. The 32-byte texture (the unique one).**
- Regular: an image, 4 bytes a texel plus a third more for its smaller copies, read from memory for every
  pixel. LOOP3D has four picture layers per material.
- Twist: take a phrase you choose, run SHA-256 on it, get 256 bits. Lay them out as a 16 x 16 grid; each bit
  turns one tile's pair of quarter-circle arcs one way or the other (a Truchet tiling). The arcs join up
  into loops and paths, so it reads as a designed pattern, not noise. The shader draws the arcs from the
  bits directly: the whole texture is **32 bytes** inside the frame's settings.
- Why it can't be coincidence: there are 2^256 patterns, about 10^77. The chance an unrelated process
  produces yours is 1 in 10^77. If 2^64 other such textures existed, the chance any pair matched would still
  be about 1 in 2^129. And it is **provable**: the page prints the 64 hex characters, and anyone can redo the
  hash from the phrase and get the same picture.
- Why it should be fast: no memory read per pixel, and sharp at any distance. When a tile gets smaller than
  a pixel, the shader fades to the pattern's known average, which is what an image's smaller copies
  approximate, done exactly.
- Honest: Truchet tiles date from 1704 (the arc version from 1987). The twist is that the texture *is* the hash. Whether maths per pixel
  beats a memory read on this chip is a real question, so the twin is the same pattern baked into an image.

**T03. One pass, straight to the screen, nothing kept.**
- Regular: LOOP3D writes a "which triangle" picture, then lights it, blends with the past, measures
  exposure, blooms, grades. About 9 passes, most at 8 bytes a pixel.
- Twist: one pass. Colour goes to the screen at 4 bytes a pixel. Depth, if used at all, is thrown away at
  the end of each tile so it never reaches memory.
- Why: on a tile-drawing chip, what stays inside the tile is nearly free and what is written out is not.
  At 860 x 1864 pixels: one pass writes 6.4 MB a frame. Nine passes at 8 bytes, each read once and written
  once, move about 230 MB a frame, roughly 36 times more.
- Honest: this is forward drawing, the oldest way there is. The twist is choosing it *because of* the
  phone's chip instead of following desktop engines.

**T04. Smooth edges from maths, not from extra samples or past frames.**
- Regular: LOOP3D blends each frame with the last (16 shifted positions, a 5-read filter, a 3 x 3
  neighbourhood clamp, two kept pictures).
- Twist: the platform's edge and the texture's arcs are both formulas, so the shader knows exactly how much
  of a pixel each covers. No extra samples, no history, no ghosting when you move.
- Twin: 4 samples a pixel (MSAA), which the phone resolves inside the tile.
- Honest: only possible because the scene is formulas. It will not carry over to arbitrary meshes.

**T05. Draw only when something changed.**
- Regular: every frame is drawn, 60 times a second, even when the picture is identical.
- Twist: if the camera did not move and nothing animated, skip the frame entirely.
- Why: average cost = (share of time moving) x (cost of a frame). Standing still costs 0. Less heat means
  the phone slows itself down later, so the speed you get while moving lasts longer.
- Honest: apps do this; game engines rarely do. LOOP3D already does it for sun shadows only.

**T06. One block of memory, nothing created after the start.**
- Regular: many separate growing lists; 1,536 bytes of settings sent every frame.
- Twist: one fixed block holds everything the page ever uses. The frame's settings are 80 bytes: the
  camera (48) and the texture's bits (32). Nothing is created while running, so the browser's memory
  cleaner never interrupts a frame.
- Honest: expect almost no change in average time. Its job is *zero hitches* and smallness.

### Group B: graded on the work dial (the platform cut into N x N blocks)

**T07. Zero-byte corners, 2-byte blocks.**
- Regular: 32 bytes a corner, 4 a corner number, 128 a copy.
- Twist: a block's place is its number (column in the low bits, row in the high bits). A corner's place
  within the block is its own count's low bits. The shader rebuilds everything from two integers the chip
  already provides. Corners: **0 bytes**. A visible block: **2 bytes**.
- Why: 32 blocks fit in one 64-byte line of the chip's fast memory, against half of one LOOP3D copy.
- Honest: fetching corners in the shader ("vertex pulling") is known; LOOP3D's cluster drawing does a
  form of it with full-size records.

**T08. Compartments (your idea): cull the boxes, then only look inside the ones on the edge.**
- Regular: test every piece against the view, one at a time.
- Twist: group blocks 8 x 8 into compartments of 64. One compartment's answer is a single 64-bit mask.
  Test compartments first; each comes out **all in**, **all out**, or **on the edge**. Only "on the edge"
  ones are opened.
- Why: the ones on the edge lie along the outline of what you see, so their number grows with the
  outline's length, not the area. For 4,096 blocks: regular is 4,096 tests of 6 planes. Compartments are
  64 tests, plus about 20 edge compartments. The whole culling state is 520 bytes (LOOP3D's cluster
  records for the same count: 262,144).
- Honest: testing groups before members is how every tree-based culler works. The twist is the fixed
  64-wide mask, so a compartment is one number and "all in" is one comparison.

**T09. Footprint spans: inside an edge compartment, test no block at all.**
- Regular: even tree cullers test each leaf.
- Twist: what the camera sees of a flat platform is a simple polygon on the ground. Find it once (the
  view's corners dropped onto the platform). Then each row of blocks is just "from column a to column b",
  and the row's mask is made with two shifts. Blocks tested one by one: **zero**.
- Why: work grows with the number of rows (N), not blocks (N x N). At N = 256: 256 row spans against
  65,536 tests.
- Honest: terrain engines have used view footprints. It depends on the world being flat here; hills would
  need a height margin.

**T10. Whole-compartment draws.**
- Twist: an "all in" compartment is sent as **one** number that draws all 64 of its blocks. Only edge
  compartments list single blocks.
- Why: the list the chip reads shrinks by up to 64 times in the middle of the view, which is most of it.

**T11. Detail by counting zeros.**
- Regular: LOOP3D picks detail per cluster with a distance (a square root), a divide and two error tests.
- Twist: far blocks merge 2 x 2 into one, again and again. The level is read from the squared distance by
  counting its leading zero bits: no square root, no divide, no decimals. On a flat platform a merged
  block is *exactly* the same surface, so the error is zero and there are no seams to hide.
- Why: triangles stop growing with N. Full grid at N = 1,024 is about 2 million triangles; rings of 32 x 32
  over 6 levels are about 12,000, roughly 170 times fewer.
- Honest: this is the geometry-clipmap idea (2004). The zero-counting pick and the zero-error merge are
  the twist.

**T12. Pre-recorded drawing.**
- Regular: the list of draw commands is written again every frame.
- Twist: record it once; each frame says "play it". Only the 80 bytes of settings change.
- Honest: a standard WebGPU feature that small engines skip. Expect a small processor-side saving.

### Parked until the world is more than a platform
Hidden-behind-walls as a 512-byte table of compartment-sees-compartment bits (instead of a depth pyramid);
lamps per compartment as a bit mask (instead of a lamp grid of lists); shadows from formulas. Each needs
something to hide behind or something to light, which a lone platform does not have.

---

## 3. The grader: how we get information back

**What you do.** Open the page with `?grade`. It plays a fixed camera path by itself for a few minutes,
then shows one button: **Copy result**. Paste it in the chat. I store it in `runs/` and rebuild `GRADES.md`.
(Upgrade later: a second button that opens a pre-filled GitHub issue, so one tap saves it with no pasting.)

**Every build keeps its own address.** A push publishes to `…/Sandbox/<build>/`, and old builds stay. Old
and new can be run on the same phone on the same day, which is the only fair comparison.

**Switches.** `?t=` takes a number whose bits are T01-T12, `?n=` the work dial, `?s=` the resolution.

**What is measured, per combination of switches:**

| Number | What it is |
| --- | --- |
| Capacity | The highest work dial that still holds 60 a second. The main grade. |
| Chip time | Time until the graphics chip says it finished, averaged. |
| Processor time | The frame's own work, repeated 1,000 times and divided. |
| Bytes | Page size; memory reserved; bytes sent per frame. All counted exactly, since we reserve every byte ourselves. |
| Blocks sent / seen | How tight the culling is. Blocks wrongly dropped must be 0. |
| Picture | Same as the reference at 8 fixed views, or the largest difference. |
| Hitches | Frames over 25 ms in a 60-second walk. Target: none. |

**Why capacity and not frames a second.** Safari stops at 60 and its clock ticks in whole milliseconds.
Two ideas that both reach 60 look identical. So instead of asking "how fast", the grader asks **"how much
work until it breaks"**: it raises the dial until frames start to miss, and searches for the edge. That
number has no ceiling and does not depend on the clock's fineness.

**"Perfect" is checkable.** The scene is formulas, so a slow mode can compute the true picture by taking
64 samples a pixel. The platform's grade is its distance from that. This is LOOP3D's cinema score in
miniature, with no path tracer.

---

## 4. The maths behind the grading

**A cost model.** Predict a frame as

`time = fixed + (per corner) x corners + (per pixel) x pixels + (per block listed) x blocks`

The grader runs a small grid of dial settings and resolutions and fits these four numbers. Each technique
is then described by *which number it changes*:

| Technique | Changes |
| --- | --- |
| T01 maths platform | corners become 0 |
| T02, T03, T04 | per pixel |
| T05 draw on change | multiplies everything by the share of time moving |
| T06, T12 | fixed |
| T07 packing | per corner |
| T08, T09 culling | corners, blocks |
| T10 | per block listed |
| T11 detail | corners |

**Theory of what works together** (predictions, to be tested):
- **Different numbers: they simply add.** T02 (per pixel) and T08 (corners) should each save what they
  save alone. Any extra gain or loss is a real surprise worth understanding.
- **Same product: they multiply, so each makes the other's saving smaller.** T07 lowers the cost per corner
  and T08 lowers the number of corners. If each halves its side, together they leave a quarter: 75% saved,
  not 100%. Both still earn their place, but the second one in is always worth less than it looked alone.
- **Same waste: they overlap.** T08 and T11 both remove far-away blocks at shallow angles. Expect them to
  be worth clearly less together than added.
- **Enablers.** T08 makes T10 possible, and T09 is only cheap after T08 has thrown most compartments out.
  Expect these to be worth *more* together than added.
- **T01 against all of group B.** If the maths platform wins at every dial setting, group B is not for the
  platform; it is the test bench for the day the world needs triangles.

**Measuring "together".** For two switches A and B, run all four combinations:

`together = time(both) - time(only A) - time(only B) + time(neither)`

Zero: independent. Above zero: they overlap. Below zero: they help each other. The grader reports this for
every pair.

**Why run every combination instead of one switch at a time.** With k switches there are 2^k combinations.
Each technique's effect is then averaged over *all* of them (half on, half off), so 32 runs give every
effect the precision of 16 paired comparisons, and all the pair numbers come free. One-at-a-time testing
needs far more runs for the same certainty and can't see pairs at all. Six switches is 64 combinations, a
few seconds each: about five minutes on the phone.

**When the pool grows past about 8 switches**, the full set gets long. Then: run every combination
briefly, keep the better half, double the time, repeat. The total is about twice the first round.

**Noise and heat.** The phone slows as it warms, which would favour whatever runs first. Three guards:
the order is A, B, B, A (a steady drift cancels exactly); one fixed "sentinel" combination is repeated at
the start, middle and end, and everything is scaled by how it drifted; and a technique is kept only if its
effect is more than twice its measured uncertainty.

**Choosing the pool.** Each technique gets two grades: **time saved**, and **time saved per kilobyte of
code** (smallness is a goal, so a big idea must pay for its size). With the fitted effects and pair
numbers, every possible pool is scored by arithmetic, the best three are run for real, and the winner
becomes the next build. Anything that can't beat its regular twin is removed, and the reason is written
in `GRADES.md` so it isn't tried again blind.

---

## 5. The order of work

One small goal at a time, each one something you can see on the phone.

0. **A page on GitHub** that says "WebGPU works" and lists what your phone's chip offers (including
   whether Safari gives the chip's own timers). Proves publishing, tells us what we can measure.
1. **The platform and a sky**, drawn as maths (T01, T03), from a still camera.
2. **Thumbs:** left half of the screen walks, right half looks; keys and mouse on a computer.
3. **The 32-byte texture** from your phrase (T02), with smooth edges (T04).
4. **The grader**: the camera path, the capacity search, Copy result, `runs/`, `GRADES.md`.
5. **The twins**: image texture, MSAA, mesh platform. First real grades: T01-T06 against regular.
6. **The work dial** drawn the regular way (32-byte corners, 128-byte copies, every block tested), with the
   picture checked identical to step 3.
7. **One technique per step**, T07 to T12, each followed by a grading run and an updated `GRADES.md`.
8. **Choose the pool** from the numbers; write up which predictions in section 4 held and which did not.

The `engine/` folder already on this branch (a small game-loop sketch from earlier) is replaced at step 1.

---

## 6. What I need from you

1. **The phrase** for the texture. Anything you like; it will be public in the repo. It is what makes the
   pattern yours.
2. **GitHub Pages switched on for Sandbox** (repo Settings, Pages, source: the `gh-pages` branch). Step 0
   creates that branch.
3. **Your go** for step 0.
