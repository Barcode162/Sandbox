# Intel: reference analysis of best-in-class scroll-driven animation sites

Scout: motion · Mission M-0001 · Filed 2026-11-20

**Network status:** web search and fetch both worked. Most claims below are tied to a URL. Where a claim rests on established practitioner knowledge rather than a source fetched for this report, it is labelled **[practice, not sourced here]**. Where a source was secondary or could not be fetched, it is labelled **unverified**.

**Originality note:** This report collects techniques and principles only. It recommends no site's look, palette, layout or content for copying (brief A6, Charter XI.3).

---

## Questions

1. Pacing: what makes a scroll piece feel authored rather than like a demo reel?
2. Scene transitions: how do strong sites link scenes?
3. Typography: how is text handled inside scroll-scrubbed scenes?
4. Sticky stages: what is the canonical structure, and what breaks it?
5. Stopping mid-scroll: how do we make every resting frame look composed?
6. Idle states: how do we detect stillness and reward it?
7. Progress and navigation affordances.
8. Reduced motion and vestibular safety.
9. Common failure modes: jank, scroll-jacking, mobile 100vh jumps, motion sickness.
10. The ranked principles for our designers.

## Answers (short, direct)

1. **Pacing.** Treat the scroll as a timeline with a tempo. Give it beats, holds and rests, and do not keep every scene at full intensity. Practitioners call continuous scroll experiences a matter of "pacing discipline". A pinned stage that holds too long reads as a broken page.
2. **Transitions.** Hand over one persistent element from scene to scene, such as a colour field, a shape or a word. Overlap the end of scene N with the start of scene N+1 using timeline ranges (`exit` of one, `entry` of the next) rather than hard cuts with empty gaps. **[inference, built on the sourced range mechanics]**
3. **Typography.** Text must be readable the moment it is on screen. NN/g found that scroll-triggered text animation slows users down and irritates them. Animate the art and the display type as image. Never gate body copy behind motion.
4. **Sticky stages.** Use a tall section (the "track") holding a `position: sticky; top: 0` stage, with progress mapped from the track to the scene. The stage must not have an ancestor with `overflow: hidden`, `auto`, `scroll` or `overlay`, because that silently breaks sticky.
5. **Stopping.** Make every frame a pure function of progress, and design each scene's keyframes so that the in-between states are also compositions. Do not rely on snapping as a rescue. If snap is used at all, use `proximity` and never `mandatory`, because mandatory snapping traps content that is taller than the viewport.
6. **Idle.** Detect stillness with `scrollend` (Baseline 2025) plus a timer of about 1–1.5 s (brief A4). Ambient "breathing" is auto-starting motion, so WCAG 2.2.2 applies if it lasts more than 5 s: it needs a visible pause control, and it must be off under reduced motion.
7. **Progress and navigation.** Give the visitor a progress indicator driven by `scroll()`, plus a scene index or chapter navigation that uses real anchors with native scrolling. That keeps keyboard, find-in-page and the back button working. Hide the chrome in admire mode, and bring it back on any input. **[practice, not sourced here]**
8. **Reduced motion.** Under `reduce`, remove parallax, zoom and large non-scroll movement, and keep scrolling itself. Replace scrubbed scenes with static, composed key frames or gentle crossfades. Do not just turn the site off. Scrolling is "essential" motion under WCAG 2.3.3, but parallax is named as non-essential.
9. **Failure modes.** (a) Scroll-event-driven positioning janks under async scrolling, so use CSS sticky and scroll timelines. (b) Scroll-jacking, meaning a changed scroll rate or direction, harms control, discoverability and task success (NN/g). (c) `100vh` on mobile changes with the toolbar, so use `svh` for stage sizing; `dvh` animates jittery. (d) Motion sickness comes from parallax, zoom and large motion of elements other than the main scroller.
10. See the **ranked principles** at the end.

## Evidence and detail

### A. Platform mechanics (primary sources)

- **CSS scroll-driven animations are now cross-browser.** Firefox 159 enabled them by default, so the feature is Baseline Newly available with Chrome and Safari. Sources: web.dev October 2026 roundup https://web.dev/blog/web-platform-10-2026 and MDN Firefox 159 notes https://developer.mozilla.org/Firefox/Releases/159. Firefox 157 changed `playbackRate` and `reverse()` behaviour on scroll-driven animations. Feature support was also an Interop 2026 focus area: https://hacks.mozilla.org/2026/02/launching-interop-2026/.
  - Chrome documents `scroll()` and `view()` timelines, named `view-timeline`, hoisting names with `timeline-scope` (":root is often a good choice"), and `animation-range`, with examples such as `entry 25% cover 50%` and `exit 50% exit 75%`. https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scrollytelling
  - Put `animation-timeline` after the `animation` shorthand, or the shorthand resets it. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations/Timelines and https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
  - Feature-detect with `@supports ((animation-timeline: scroll()) and (animation-range: 0% 100%))`. Avoid `scroll-timeline-polyfill`, which "is not feature complete". Decorative effects should be progressive enhancement with no fallback. Chrome guide, as above.
  - Animate `transform` and `opacity`, never `width` or `height`. Chrome guide, as above.
- **Frame budget.** A 60 Hz display gives 16.66 ms per frame, of which about 10 ms is available for our work. Geometry properties run layout, paint-only properties skip layout, and composite-only properties skip both. https://web.dev/articles/rendering-performance
- **Scroll-event positioning janks.** Under async (compositor) scrolling, a `scroll` handler that moves elements lags and then snaps back. Mozilla recommends CSS `position: sticky`, CSS scroll snap, and compositor-run CSS instead. Firefox logs a console warning when it detects scroll-linked effects. https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html
  - *Relevance:* our "no console errors" criterion does not cover warnings, but the warning is a useful signal for the e2e console check.
- **The sticky trap.** A sticky element "sticks to its nearest ancestor that has a 'scrolling mechanism' (created when overflow is hidden, scroll, auto, or overlay), even if that ancestor isn't the nearest actually scrolling ancestor." https://developer.mozilla.org/en-US/docs/Web/CSS/position
  - *Relevance:* a stray `overflow: hidden` used to stop horizontal overflow at 375 px will kill every stage. Use `overflow: clip` on the clipping wrapper instead. **[practice, not sourced here: `clip` does not create a scroll container]**
- **The sticky-stage pattern.** The Pudding recommends offloading the sticky behaviour to CSS (`position: sticky; top: 0`) and using JS only to trigger steps. A sticky element sticks only within its parent's bounds. https://pudding.cool/process/scrollytelling-sticky/
  - Scrollama deprecated its container enter and exit hooks in favour of CSS sticky. Its README also warns against `vh` units; the reason was truncated in search, so it is **unverified**. https://www.npmjs.com/package/scrollama
- **Viewport units.**
  - `svh` is the height with the toolbars expanded, so it never overflows.
  - `lvh` is the height with the toolbars retracted, and equals legacy `vh`.
  - `dvh` is live, but it is jittery if layout depends on it.

  https://web.dev/blog/viewport-units. A WebKit bug reports that iOS Safari fails to distinguish `svh` and `dvh` in one toolbar state, which is **unverified for current builds**: https://bugs.webkit.org/show_bug.cgi?id=261185
- **Stillness detection.** `scrollend` fires when "the scroll position has no more pending updates and the user has completed their gesture". It covers wheel, keyboard and snap scrolling. Touch and trackpad gestures are not complete until release. It is Baseline 2025. https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollend_event
- **Snap.**
  - Never use `mandatory` if a child can overflow the container, or when targets are widely spaced, because content in between becomes unreachable. `proximity` lets users stop partway through. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap/Basic_concepts and https://web.dev/articles/css-scroll-snap
  - GSAP's snap waits after the last scroll event (by default half the scrub time, or 0.1 s), is directional by default, and cancels if the user scrolls. That makes it a model for "gentle settle" behaviour if we ever want one. https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- **Scrub smoothing.** GSAP's `scrub: <number>` is "the amount of time the playhead takes to catch up with the scrollbar". `anticipatePin: 1` avoids a flash of unpinned content at fast scroll speeds. GSAP docs, as above.
  - *Relevance:* smoothing adds latency, so the frame trails the scroll position. That conflicts with our "same position, same frame" determinism unless the smoothed state is allowed to settle before any assertion. **[inference]**

### B. Craft observations from reference sites

- **Image-sequence scenes.** Apple-style scenes draw pre-rendered frames to a `<canvas>`, using frame index = progress × frameCount. They need preloading, and reportedly fall back to a single still image on small or slow devices. Sources are third-party reverse engineering, so this is **unverified**: https://css-tricks.com/?p=308477
  - *Relevance:* the technique is heavy for our offline, small-payload budget. Prefer generative canvas, SVG or CSS art computed from progress.
- **Pacing as the core discipline.** The Awwwards case study of Working Stiff Films (STIFF) frames the site as a "guided journey" that uses transitions, timing and directional movement, and states that continuous scroll experiences "rely heavily on pacing discipline". It is self-reported, and the page returned 503 on fetch, so this is known from the search summary only and is **partially verified**. https://www.awwwards.com/working-stiff-films-case-study.html
- **Mapping text to the stage.** Strong scrollytelling ties each text block to one graphic state, though many-to-one and one-to-many mappings also occur. A full-bleed stage lets text scroll over it, while a partial stage lets text scroll beside it. https://data.europa.eu/apps/data-visualisation-guide/scrollytelling-design-variations
- **Smooth-scroll libraries.** Lenis and similar libraries are the norm on award sites, but they carry real reports of breaking keyboard and scrollbar input during animation, of breaking scroll-snap and overscroll, and of confusing assistive tech.
  - Lenis #107: https://www.github.com/darkroomengineering/lenis/issues/107
  - Thoughtworks Radar: https://thoughtworks.com/radar/languages-and-frameworks/lenis
  - The Lenis README counters that it wraps native scroll. https://unpkg.com/lenis@1.3.25/README.md
  - *Relevance:* we have no need for it. Native scroll plus CSS timelines gives determinism for free.

### C. User research and accessibility

- **Scroll-jacking.** NN/g's study found that scroll-jacking "exhibit[s] significant threats to user control and freedom, discoverability, attention, efficiency, and task success". Altered scroll rate combined with reading text was the worst case. https://www.nngroup.com/articles/scrolljacking-101/
- **Scroll animations.** NN/g found that scroll-triggered text animations slowed users, and that users do not separate deliberate effects from system delay. Its advice: animate secondary content, keep text instantly available, and do not replay reveals. https://www.nngroup.com/articles/scroll-animations/
  - *Note:* our site is a leisure and art piece, which NN/g says is the appropriate context. Its "play once" advice conflicts with our scrub-and-rewind requirement. Scrubbing is user-controlled rather than time-triggered, so the delay complaint does not apply, but the advice on text does.
- **WCAG 2.3.3 (AAA).** Parallax is cited as often non-essential, while scrolling movement itself is essential. A global off switch is the recommended technique. https://w3c.github.io/wcag/understanding/animation-from-interactions
- **WCAG 2.2.2 (A).** Moving content that "starts automatically, lasts more than five seconds, and is presented in parallel with other content" needs "a mechanism for the user to pause, stop, or hide it". https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
  - *Relevance:* the admire-mode breathing falls under this.
- **Vestibular triggers** are "scrolling animations in which elements other than the main scrolling element move a lot", parallax and zooming. Under `reduce`, remove non-essential movement. Static replacements, such as `<picture>` with a still fallback, are a sanctioned pattern. https://web.dev/articles/prefers-reduced-motion

## Facts vs. inferences

| Claim | Status |
|---|---|
| Scroll-driven CSS animations are cross-browser as of Firefox 159 | Fact (web.dev, MDN) |
| `overflow: hidden/auto/scroll/overlay` ancestors capture sticky | Fact (MDN) |
| Scroll-event positioning janks under async scroll | Fact (Mozilla docs) |
| Scroll-jacking harms control and task success | Fact (NN/g study) |
| Mandatory snap traps oversized content | Fact (MDN, web.dev) |
| `scrollend` is Baseline and covers wheel, keyboard and snap | Fact (MDN) |
| `overflow: clip` is the safe way to stop horizontal overflow without breaking sticky | Practice, not sourced here |
| "Authored" feel comes from tempo variation and persistent hand-off elements | Inference from the pacing sources plus range mechanics |
| Scrub smoothing conflicts with determinism tests unless the state is allowed to settle | Inference |
| Apple-style image sequences and their mobile fallback | Unverified (third-party) |

## Implications for the mission

1. **Architecture.** Use native scroll, CSS `position: sticky` stages, and per-scene progress (0 to 1) computed from the track. Drive visuals either with CSS `view()` or `scroll()` timelines, or with a single rAF loop that reads `scrollY` once per frame and writes only `transform`, `opacity` or canvas draws.
   - Either way, keep one JS function `frameAt(progress)` per scene, so the unit tests can assert start, end and determinism. Pure CSS timelines are hard to unit-test, so the architect must choose explicitly. **[inference]**
2. **No smooth-scroll library, no scroll-jacking, no `mandatory` snap.** Optional `proximity` snap is allowed only at scene boundaries.
3. **Size stages with `svh`, never `vh` or `dvh`.** Test at 375 px with the toolbar states in mind.
4. **Use `overflow: clip`, never `hidden`, on wrappers.** Add an e2e assertion that each stage's computed position is `sticky` and that its bounding top equals 0 at mid-progress.
5. **Admire mode.** Trigger it on `scrollend` plus an idle timer of about 1.2 s. Render ambient motion on a separate layer from the scrubbed state, so determinism tests can disable it. Provide a visible pause control (WCAG 2.2.2), and keep it off under reduced motion.
6. **Reduced-motion design is a deliverable.** It needs its own composed stills or crossfades per scene, not a blank page.

**Top risks**

- **(1)** A stray `overflow: hidden` silently breaks every stage.
- **(2)** Mid-transition frames look broken, which fails the "20 random positions" bar. Design the in-betweens, not just the keyframes.
- **(3)** Scrub smoothing or easing in JS makes the frame lag the position, which breaks determinism tests.

## Open questions / unverified

- Whether the iOS Safari `svh`/`dvh` bug persists in current builds. This environment has no iOS device.
- The exact reason in Scrollama's README for avoiding `vh` (the text was truncated).
- The full details of the Working Stiff Films case study (HTTP 503 on fetch).
- Apple's internal scroll tooling, which is undocumented.

---

## Ranked principles for our designers (highest impact first)

1. **Design every frame, not every keyframe.** Each scene is a pure function of progress. Storyboard at 0, 25, 50, 75 and 100% and at the in-betweens. If a frame halfway through a transition is not a composition, redesign the transition. This is the brief's core promise.
2. **Never hijack the scroll.** Keep native scroll rate and direction. Use no smooth-scroll library and no `mandatory` snap. Visitors must be able to stop anywhere, including between scenes. (NN/g, MDN)
3. **Give the piece a tempo.** Alternate dense scenes with quiet holds and rests. Vary scene lengths, typically between one and three viewport heights of track. A stage held long with nothing changing reads as broken. (Pacing sources, Pudding guidance) *[The length figure is an inference.]*
4. **Link scenes with a hand-off, not a cut.** Carry one element (colour, shape, line or word) out of scene N and into scene N+1, and overlap their timeline ranges so that no stretch of scroll is empty. This is what turns a demo reel into one authored piece. *[inference]*
5. **Move only `transform` and `opacity`, or a canvas.** Never animate layout properties. Read scroll once per frame, and never position elements from `scroll` events. Keep within the ~10 ms frame budget. (web.dev, Mozilla, Chrome)
6. **Build stages on CSS sticky inside a tall track, and protect them.** Use `top: 0`, height `100svh`, and `overflow: clip` (never `hidden`) on any ancestor. (MDN, Pudding, web.dev viewport units)
7. **Text is never held hostage by motion.** Body copy is legible the moment it is on screen. Only display type that is treated as image may be scrubbed. (NN/g)
8. **Reward stillness quietly, and let the visitor stop it.** Enter admire mode about 1.2 s after `scrollend` and fade the chrome out. Keep the breathing subtle and below the scene's own motion. Show a visible pause control, and restore everything instantly on any input. (MDN scrollend, WCAG 2.2.2)
9. **Treat reduced motion as a second authored cut.** Remove parallax, zoom and large off-axis movement, and replace each scene with composed stills or crossfades. Keep the beauty and lose the movement. (web.dev, WCAG 2.3.3)
10. **Keep orientation visible but out of the way.** Show a thin progress indicator from the `scroll()` timeline and a chapter index built on real anchors and native scrolling, both reachable by keyboard and hidden while admiring. *[practice, not sourced here]*
11. **Limit off-axis and depth motion.** Parallax layers, zooms and rotation of large areas are the main vestibular triggers. Use them as accents within a scene, not as the scene's main movement, and cap how far large layers travel. (web.dev reduced-motion, W3C 2.3.3)
12. **The opening frame is finished art at progress 0.** Nothing should be waiting to animate in, and the first scroll movement should produce a visible response within the first viewport. *[brief requirement plus inference]*
