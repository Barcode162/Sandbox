# Directions — M-0002 Frog river chase

Three rival directions for the `bakeoff` lever. They differ in camera, control model and how the alligator pressures you. All are Canvas 2D, procedural art, Web Audio, fixed-timestep, tier-2 buildable.

## A · Waterline

**Pitch:** One button. Hop across a sunset river while the gator swims below you.

- **North star:** a side-on slice of river, half sky and half underwater, where you can *see* the gator gliding up beneath your pad.
- **The look:** a cross-section diorama. Tokens: `sky-dusk #F6B17A`, `sky-high #7A6FB0`, `surface #3FA7A0`, `deep #123A4A`, `pad #6FBF4A`, `frog #C8F25C`, `gator #2E4A2A` with `eye-glow #FFD23F`. A wobbling waterline at 55% height splits the screen. Soft-edged flat shapes, light shafts below the surface. Rounded heavy sans for the timer. Motion: 220 ms `cubic-bezier(.2,.8,.2,1.2)` (slight overshoot).
- **Controls / hop:** tap, Space or Up hops to the next pad to the right. Holding at least 180 ms charges a **double hop** that skips one pad (a riskier, faster line). The frog can't miss a pad, so no aiming. Inputs are buffered for 150 ms. The camera leads the frog by 30% of the screen width.
- **The alligator:** a long silhouette underwater, behind and below you, rising as it closes in. Its distance sets the heartbeat tempo (60→140 bpm) and a red tint at the left edge. It surfaces in a jaw-snap if you idle on a pad for 1.2 s. Sinking pads dip into its reach.
- **Signature frames:**
  1. *Title* → frog on a pad at dusk, gator eyes blink open below the waterline → the threat is shown before any word.
  2. *Mid-hop near-miss* → frog at the top of its arc while jaws break the surface right under its shadow and spray freezes for a 60 ms hit-stop → the "almost" moment, readable in one still.
  3. *Finish* → frog lands on the reed bank, the gator sinks back sulking, the timer swells with "NEW BEST" → relief composed as a release of the frame.
- **First 10 seconds:** the next pad pulses with a ring. The first tap hops. The gator's eyes appear on the 3rd hop.
- **Risk + fallback:** a single button may feel shallow over 60 s. The double hop and the sinking pads carry the depth. Fallback: add a "duck" (down key) to dodge a snap.
- **Buildability:** cheapest of the three. The 1D pad sequence makes the bot and determinism trivial. The expensive parts are the waterline shader-like wobble and the underwater light shafts, both done as 2D gradients plus a sine path. The riskiest frame is #2. 1–2 engineers.

## B · Lilyfield

**Pitch:** Pick your path through drifting lily pads. The gator is hunting you.

- **North star:** a top-down pond map where you choose a route and the gator chooses one to cut you off.
- **The look:** a papercut, risograph-print look. Tokens: `paper #F3EBD8`, `ink #1D2B3A`, `water-a #2F8F9D`, `water-b #2A7A88`, `pad #8CC152`, `bloom #F27BA8`, `gator #3D5A3A`. Two-tone halftone grain, offset drop shadows 4 px, no outlines. Pads are an organic scatter, never lanes. Motion: 180 ms ease-out, with a paper "flutter" on landing.
- **Controls / hop:** up to three reachable pads light up with arrows (left-forward, forward, right-forward). Arrow keys or a tap on the screen's left, middle or right third pick one. Pads drift and rotate, so routes open and close.
- **The alligator:** fully visible from above, a sweeping S-curve swimmer that predicts your route and swims to intercept. Its wake ripples spread toward you. Danger shows as its shadow touching highlighted pads (they turn `bloom` red).
- **Signature frames:**
  1. *Overview* → the whole pond, frog at the bottom, the gator coiling at the side → the run reads as a puzzle at a glance.
  2. *Cut-off* → two of three arrows are blocked by the gator's body, one escape is lit → a decision under pressure.
  3. *Finish* → a pink bloom bursts as the frog reaches the far bank, the route is traced in ink → your run becomes a picture.
- **First 10 seconds:** one forward arrow pulses. The gator appears at the 5th hop.
- **Risk + fallback:** a top-down view drifts toward the classic crossing game's look. The organic scatter, papercut style and no lanes keep it clear. Fallback: tilt the camera 20°.
- **Buildability:** medium. Gator pathing plus drifting pads need careful seeding. The bot needs a route search. 2 engineers.

## C · Glowjaw

**Pitch:** Night river, glowing jaws behind you. Hop left or right toward the far shore.

- **North star:** a chase camera behind the frog, with the far shore glowing ahead and the gator's jaws looming at the bottom edge.
- **The look:** a bioluminescent night. Tokens: `night #0B1026`, `river #14305A`, `glow-pad #5CF2C1`, `firefly #FFE66D`, `frog #9BFF6A`, `jaw #1E2A1E`, `jaw-glow #FF4D6D`. Pseudo-3D perspective with pads scaling toward the horizon and additive glow. Motion: 260 ms ease-in-out, with a camera dolly after each hop.
- **Controls / hop:** pads come in rows of 2–3 ahead. Left, Up or Right (or a swipe/tap side) hops to that pad. Dead pads are dark.
- **The alligator:** you never see all of it, only upper teeth and two red eyes rising from the bottom of the screen, growing as it closes in. The bass drone pitches up. A snap shakes the camera 6 px.
- **Signature frames:**
  1. *Title* → the frog's back in silhouette against a glowing horizon → a journey, not a menu.
  2. *Jaws at 80%* → teeth fill the lower third, pads blur → panic.
  3. *Finish* → the frog leaps into a firefly swarm on shore → euphoria.
- **First 10 seconds:** the middle pad glows brighter, and Up is the obvious move.
- **Risk + fallback:** depth makes it hard to read whether a hop will land. Fallback: lock to 3 fixed columns.
- **Buildability:** hardest. The projection math, glow cost on mobile and depth sorting. 2–3 engineers.
