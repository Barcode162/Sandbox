# Shark Bounce 🦈

A small Android game. A shark bounces around the screen like a pong ball, in straight
lines with clean reflections off the walls and ceiling, so its path is predictable.
Drag the orange platform left and right with your finger so the shark lands on it.

- **+1** for every catch
- **+2 PERFECT** if the shark lands in the middle (the light stripe on the platform)
- Landing off-center tilts the bounce angle, like pong
- The shark speeds up and the platform shrinks a little as your score climbs
- Miss once and it's game over. Your best score is saved.
- **HINT** button (top right) shows where the shark will land, which helps while learning

## Install on Android

1. On the phone, open the repo's **Releases** page:
   `https://github.com/Barcode162/Sandbox/releases/latest`
2. Download **SharkBounce.apk**.
3. Open it. If Android asks, allow *Install unknown apps* for your browser/files app.
4. Tap **Install**, then open **Shark Bounce**.

Works on Android 5.0 (Lollipop) and newer. New versions install over the old one and keep
your best score.

## How builds work

Every push to `main` that touches `shark-bounce/` runs the GitHub Actions workflow
`.github/workflows/shark-bounce.yml`. It builds the APK and publishes it as a new release.
You can also start it by hand from the **Actions** tab ("Run workflow").

The APK is signed with `signing/sharkbounce.keystore` (password `android`). That key is
public on purpose: it isn't protecting anything, and keeping it fixed means every build
installs as an update instead of a different app. Don't reuse it for an app you
publish to the Play Store.

## Build locally

```bash
cd shark-bounce
./gradlew assembleRelease   # needs JDK 17+ and the Android SDK
# APK: app/build/outputs/apk/release/app-release.apk
```

The code is in `app/src/main/java/com/barcode162/sharkbounce/GameView.kt`: physics,
drawing and touch handling, with no images or libraries.
