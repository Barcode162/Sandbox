# 🦈 Bounce Helper

An Android helper that floats over a bouncing-shark paddle game and plays the paddle
for you. It watches the screen, follows the shark, predicts where it will come down
(including bounces off the side walls and ceiling, like pong) and holds the paddle under
that spot, so the score keeps climbing even when the shark gets very fast.

## Download

**Direct APK:** https://github.com/Barcode162/Sandbox/raw/claude/gifted-heisenberg-23pcda/download/BounceHelper.apk

After this is merged to `main`, every build is also published at
https://github.com/Barcode162/Sandbox/releases/latest

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

## How it works

- `CaptureService.kt` mirrors the screen into a small ~270 px wide image about 60 times a
  second (MediaProjection). Nothing is saved or sent anywhere.
- `Tracker.kt` finds the largest blob of the shark's colour, measures its speed, learns the
  wall/ceiling positions from the first bounces, and mirrors the path forward to the paddle
  line. Unit tests in `TrackerTest.kt` simulate a pong-style shark and check the prediction
  stays within ~35 px.
- `HelperService.kt` (accessibility service) draws the floating strip and holds a virtual
  finger on the paddle using a continuous gesture, moving it every 24 ms. It also measures
  how far the paddle sits from the finger, so games where you drag relatively still work.

The APK is signed with `signing/sharkbounce.keystore` (password `android`). The key is public
on purpose, so every build installs over the previous one.

## Build locally

```bash
cd bounce-helper
./gradlew testDebugUnitTest assembleRelease   # JDK 17+ and the Android SDK
```
