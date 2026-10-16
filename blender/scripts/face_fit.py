"""Fit MPFB face-shape targets to a front photo using MediaPipe face landmarks.

Renders the character's face, detects the same 478 landmarks on render and photo,
compares proportion features (normalised by eye-corner distance), and solves for
target weights with a finite-difference Jacobian + damped least squares.

Run: blender -b me_base.blend -P scripts/face_fit.py -- <photo.jpg> <landmarker.task> <out_dir>
"""
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector
from bl_ext.user_default.mpfb.services.targetservice import TargetService
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

photo, model_path, out = sys.argv[sys.argv.index("--") + 1:][:3]
os.makedirs(out, exist_ok=True)
detector = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path), num_faces=1))

def landmarks(path):
    img = mp.Image.create_from_file(path)
    res = detector.detect(img)
    if not res.face_landmarks:
        raise RuntimeError(f"no face found in {path}")
    return np.array([(p.x * img.width, p.y * img.height) for p in res.face_landmarks[0]])

def features(L):
    # Rotate so the eye line is horizontal, scale by outer eye-corner distance.
    a, b = L[33], L[263]
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    R = np.array([[math.cos(-ang), -math.sin(-ang)], [math.sin(-ang), math.cos(-ang)]])
    P = (L - (a + b) / 2) @ R.T / np.linalg.norm(b - a)
    w = lambda i, j: abs(P[i, 0] - P[j, 0])
    h = lambda i, j: abs(P[i, 1] - P[j, 1])
    eye_y = (P[33, 1] + P[263, 1]) / 2
    return np.array([
        w(234, 454),               # face width at cheekbones
        w(172, 397),               # jaw width
        w(148, 377),               # chin width
        w(129, 358),               # nose (alar) width
        w(61, 291),                # mouth width
        w(133, 362),               # inner eye distance
        P[1, 1] - eye_y,           # eyes -> nose tip
        P[13, 1] - P[1, 1],        # nose tip -> mouth
        P[152, 1] - P[14, 1],      # lower lip -> chin
        h(0, 17),                  # lip height
        eye_y - (P[105, 1] + P[334, 1]) / 2,   # eye -> brow
        (h(159, 145) + h(386, 374)) / 2,       # eye opening
    ])

NAMES = ["face_w", "jaw_w", "chin_w", "nose_w", "mouth_w", "inner_eye", "eye_nose",
         "nose_mouth", "lip_chin", "lip_h", "eye_brow", "eye_open"]
PARAMS = [
    (["head-scale-horiz-decr"], ["head-scale-horiz-incr"]),
    (["head-scale-vert-decr"], ["head-scale-vert-incr"]),
    (["chin-width-decr"], ["chin-width-incr"]),
    (["chin-height-decr"], ["chin-height-incr"]),
    ([], ["head-square"]),
    (["l-cheek-bones-decr", "r-cheek-bones-decr"], ["l-cheek-bones-incr", "r-cheek-bones-incr"]),
    (["nose-scale-horiz-decr"], ["nose-scale-horiz-incr"]),
    (["nose-scale-vert-decr"], ["nose-scale-vert-incr"]),
    (["nose-trans-down"], ["nose-trans-up"]),
    (["mouth-scale-horiz-decr"], ["mouth-scale-horiz-incr"]),
    (["mouth-scale-vert-decr"], ["mouth-scale-vert-incr"]),
    (["mouth-trans-down"], ["mouth-trans-up"]),
    (["eyebrows-trans-down"], ["eyebrows-trans-up"]),
    (["l-eye-trans-in", "r-eye-trans-in"], ["l-eye-trans-out", "r-eye-trans-out"]),
    (["l-eye-height2-decr", "r-eye-height2-decr"], ["l-eye-height2-incr", "r-eye-height2-incr"]),
]

body = bpy.data.objects["Me.body"]
for o in bpy.data.objects:
    if o.name in ("CurlyHair", "Beard", "Scalp"):
        o.hide_render = True
keys = body.data.shape_keys.key_blocks
for dec, inc in PARAMS:
    for t in dec + inc:
        if t not in keys:
            TargetService.load_target(body, TargetService.target_full_path(t), weight=0.0, name=t)

def apply(p):
    for (dec, inc), v in zip(PARAMS, p):
        for t in dec:
            keys[t].value = max(0.0, -v)
        for t in inc:
            keys[t].value = max(0.0, v)

# Camera roughly matching an arm's-length phone selfie.
scene = bpy.context.scene
rig = bpy.data.objects["Me"]
eye = (rig.matrix_world @ rig.data.bones["eye.L"].head_local + rig.matrix_world @ rig.data.bones["eye.R"].head_local) / 2
cam = scene.camera
cam.constraints.clear()
cam.location = eye + Vector((0, -0.5, 0.0)) + Vector((0, 0, -0.02))
cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.lens = 26
scene.render.resolution_x, scene.render.resolution_y = 768, 1024
scene.cycles.samples = 12
for l in ("Key", "Fill", "Rim"):
    if l in bpy.data.objects:
        bpy.data.objects[l].hide_render = l == "Rim"
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.35, 0.35, 0.35, 1)

def measure(p, tag="tmp"):
    apply(p)
    scene.render.filepath = os.path.join(out, f"{tag}.png")
    bpy.ops.render.render(write_still=True)
    return features(landmarks(scene.render.filepath))

target = features(landmarks(photo))
p = np.zeros(len(PARAMS))
lo = np.array([0.0 if not dec else -1.0 for dec, _ in PARAMS])
log = []
for it in range(3):
    f0 = measure(p, f"iter{it}")
    err = target - f0
    log.append({"iter": it, "rms": float(np.sqrt((err ** 2).mean())), "p": p.round(3).tolist()})
    print("ITER", it, "rms", log[-1]["rms"])
    J = np.zeros((len(f0), len(PARAMS)))
    step = 0.35
    for k in range(len(PARAMS)):
        q = p.copy(); q[k] = min(1.0, q[k] + step)
        J[:, k] = (measure(q) - f0) / (q[k] - p[k])
    lam = 0.02
    dp = np.linalg.solve(J.T @ J + lam * np.eye(len(PARAMS)), J.T @ err)
    p = np.clip(p + dp, lo, 1.0)
final = measure(p, "final")
err = target - final
log.append({"iter": "final", "rms": float(np.sqrt((err ** 2).mean())), "p": p.round(3).tolist()})
result = {
    "params": {"/".join(inc or dec): round(float(v), 3) for (dec, inc), v in zip(PARAMS, p)},
    "targets": [{"target": t, "value": round(float(max(0, -v)), 3)} for (dec, inc), v in zip(PARAMS, p) for t in dec if v < 0]
             + [{"target": t, "value": round(float(max(0, v)), 3)} for (dec, inc), v in zip(PARAMS, p) for t in inc if v > 0],
    "features": {n: {"photo": round(float(a), 3), "model": round(float(b), 3)} for n, a, b in zip(NAMES, target, final)},
    "log": log,
}
json.dump(result, open(os.path.join(out, "face_fit.json"), "w"), indent=1)
print("RESULT", json.dumps(result["features"]))
