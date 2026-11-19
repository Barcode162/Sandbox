# 🦈 Bounce Helper

An Android helper that floats over a bouncing-shark paddle game and plays the paddle
for you. It watches the screen, follows the shark, predicts where it will come down
(including bounces off the side walls and ceiling, like pong) and holds the paddle under
that spot, so the score keeps climbing even when the shark gets very fast.

## Download

**APK (always the newest):** https://github.com/Barcode162/Sandbox/releases/latest/download/BounceHelper.apk

Release page: https://github.com/Barcode162/Sandbox/releases/latest

Needs Android 8.0 or newer.

### If the install gets stuck or fails

- **Play Protect "Scanning…" never finishes / "Blocked by Play Protect":** tap *More details*
  → *Install anyway*. If there's no button, open the Play Store → profile icon →
  *Play Protect* → ⚙️ → temporarily turn off *Scan apps with Play Protect*, install, then turn it back on.
- **Samsung:** Settings → *Security and privacy* → *Auto Blocker* → turn off (it blocks all
  installs from outside the Play Store).
- **Xiaomi / Redmi / POCO:** Settings → *Additional settings* → *Privacy* → allow your
  browser/file manager to install unknown apps.
- Make sure the phone has free storage, and delete any half-downloaded copies of the file
  before downloading again.

## Setup (the app walks you through this)

1. **Accessibility:** turn on *Bounce Helper*. This lets it show the floating strip and
   hold/drag the paddle. If the switch is greyed out ("Restricted setting", Android 13+),
   open *App info* → ⋮ → *Allow restricted settings*, then try again.
2. **Notifications** (Android 13+): optional; shows a "helper is on" notice with a Turn off button.
3. **Helper active:** flip the switch and allow screen sharing ("Entire screen").

## Using it

Open the game. A 🦈 tab floats at the edge of the screen. Drag it anywhere, and tap it to
pop out the tool strip:

| Button | What it does |
| --- | --- |
| 🎯 Shark | Freezes the screen; tap the middle of the shark so the helper learns its colour |
| ▬ Paddle | Freezes the screen; tap the middle of your paddle (sets where to hold) |
| ▶ Auto / ■ Stop | Holds the paddle and keeps sliding it under the predicted landing spot |
| 👁 | Show/hide the markers (pink triangle = predicted landing spot) |
| ⏻ | Turn the helper off |

If it loses the shark, raise *Tolerance* in the app. If it locks onto the background, lower it.

**Lead:** the helper measures how late each screen image arrives and aims ahead by that
much. The *Extra lead* slider adds time for the game's own reaction to touches (default
50 ms): if the paddle arrives late, raise it; if it overshoots, lower it. The status pill at the
bottom of the screen shows the total lead.

**🧠 Pattern learning** (on by default, switch and reset button in the app): every flight
is recorded and graded against where the shark really landed. The helper learns:

- **its usual misses**, grouped by how long until landing and how many wall bounces are ahead,
  and corrects for them (only when the miss is clearly real, not noise);
- **the launch rule**: how the shark leaves the paddle (angle from where it hit and the angle
  it came in at, plus the speed-up per hit). Right after a hit, before the new path can be
  measured, it already knows where the shark is going, blended with the live measurement by
  how accurate each one is. In the simulation test this cuts the first-frames error by about a third;
- **repeating landing sequences**, used only once they've proven right.

Old flights slowly fade so it keeps adapting as the game speeds up. The status pill shows
🧠 flights learned, the typical miss, and ✓ once it knows the launch rule. Re-picking the
paddle starts learning fresh.

**Made for the Instagram DM emoji game** (tap an emoji you sent in a DM): pick the emoji's
main colour with 🎯 and the black bar with ▬. The helper also:

- **learns gravity**: if the emoji falls in arcs instead of straight lines, it measures the curve of
  each flight and predicts the arc (simulation: misses drop from 245 px to 22 px);
- **ignores look-alikes**: the same emoji sitting still in a chat bubble is skipped, and it sticks
  with the emoji it's already following;
- **handles dark mode**: a black "paddle" as wide as the screen is background, not the paddle.

## How it works

- `CaptureService.kt` mirrors the screen into a small ~270 px wide image about 60 times a
  second (MediaProjection). Nothing is saved or sent anywhere.
- `Tracker.kt` finds the largest blob of the shark's colour, measures its speed, learns the
  wall/ceiling positions from the first bounces, and mirrors the path forward to the paddle
  line. Speed and position come from a least-squares line through every frame since the
  last bounce, so the prediction barely wobbles. Unit tests in `TrackerTest.kt` simulate a
  pong-style shark and check the prediction stays within ~35 px and moves < 4 px per frame.
- `PatternLearner.kt` is the learning part described above (error memory, recursive-least-squares
  launch rule, repeating-sequence matcher). `TrackerTest.learningBeatsPlainPhysics` plays a
  simulated pong-rule game and checks learning beats plain physics.
- `HelperService.kt` (accessibility service) draws the floating strip and holds a virtual
  finger on the paddle using a continuous gesture, updated every 20 ms. The finger glides
  toward the target (faster when the shark is about to land) and holds still inside a small
  dead zone. It also measures
  how far the paddle sits from the finger, so games where you drag relatively still work.

The APK is signed with `signing/sharkbounce.keystore` (password `android`). The key is public
on purpose, so every build installs over the previous one.

## Build locally

```bash
cd bounce-helper
./gradlew testDebugUnitTest assembleRelease   # JDK 17+ and the Android SDK
```
