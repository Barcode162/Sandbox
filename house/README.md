# The house

Hearthwake itself, built on Looped (`../engine`). Today (M0): the empty
main hall of Aldric's house at true size, lit by the hearth and the dawn
window, walked through in first person.

| Folder | What it is |
| --- | --- |
| `app/` | The game's C++: loading the place, walking, the camera, drawing through the engine |
| `web/` | The page (`index.html`) and the memory test (`memory.html`) |
| `assets/world/` | The house as data: `materials.json` (look, feel, sound of each material), `kinds/` (kinds of things), `places/house.json` (what stands where, the air, the lights) |
| `assets/models/` | Models and their measured brightness (`albedo.json`; none yet) |
| `tools/` | `smoke.mjs` (the page starts, draws, walks; the memory test runs), `shots.mjs` (reference pictures from fixed views) |

## Build and check

```
bash house/build.sh            # site/: the page, the WebAssembly, the memory test
node house/tools/smoke.mjs     # starts it in a software browser and checks it
node house/tools/shots.mjs     # pictures from fixed views into build/shots/
```

Page options: `?cam=x,z,yaw,pitch` (a fixed view, degrees; yaw 0 faces
the hearth), `?mem=1` (memory in the corner), `?place=<name>`.

## Controls

Phone: left thumb walks, right thumb looks. Computer: W A S D or the
arrows walk, drag the mouse to look.

## Units

Metres, lumens, Kelvin and candela, as in Looped. The window's light comes
from a dawn sky of about 1,500 cd/m² over the 0.54 m² opening (about 2,500
lumens); the hearth gives about 2,000 lumens at 1,900 K.
