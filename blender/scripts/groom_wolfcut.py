"""Guide-based groom for a wet, brushed-back wolf cut.

Like a hand groom: ~1600 guide strands are "combed" by marching each one across
the real head surface (BVH snap) along a flow field, with layer lengths set per
region (short crown, mid sides, long shaggy nape, a few curtain fringe pieces),
and an outward flick at the ends. Children are interpolated from the 3 nearest
guides, then pulled into wet clumps and kept off the skin.
"""
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree


def sample_surface(verts, tris, n, rng):
    A, B, C = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]
    fn = np.cross(B - A, C - A); fa = np.linalg.norm(fn, axis=1)
    pick = rng.choice(len(tris), n, p=fa / fa.sum())
    u, v = rng.random(n), rng.random(n); f = u + v > 1; u[f], v[f] = 1 - u[f], 1 - v[f]
    return A[pick] + (B[pick] - A[pick]) * u[:, None] + (C[pick] - A[pick]) * v[:, None]


def groom(head_bvh, scalp_verts, scalp_tris, centre, radii, front_y, eye_z, chin_z,
          n_strands=32000, n_guides=1600, pts=40, seed=5):
    rng = np.random.default_rng(seed)
    cx, cy, cz = centre

    def axis_pt(p):
        return np.array([cx, cy, min(max(p[2], chin_z - 0.05), cz)])

    def surf(p):
        loc, n, _, _ = head_bvh.find_nearest(Vector(p))
        loc, n = np.array(loc), np.array(n)
        if np.dot(n, loc - axis_pt(loc)) < 0:
            n = -n
        return loc, n

    groots = sample_surface(scalp_verts, scalp_tris, n_guides, rng)
    G = np.zeros((n_guides, pts, 3))
    for g, r in enumerate(groots):
        u = (r[1] - cy) / radii[1]            # -1 front .. +1 back
        v = (r[2] - cz) / radii[2]            # 0 equator .. 1 crown
        side = abs(r[0] - cx) / radii[0]
        fringe = u < -0.55 and rng.random() < 0.1
        if fringe:
            want = np.array([np.sign(r[0] - cx + 1e-6) * 1.1, -0.15, -0.8])
            L = rng.uniform(0.05, 0.07)
        else:
            back = np.clip((u + 0.1) / 0.9, 0, 1)
            want = np.array([np.sign(r[0] - cx + 1e-6) * 0.25 * side, 1.0 - 0.6 * back, -0.25 - 1.2 * back - 0.5 * side])
            L = (0.085 + 0.035 * np.clip(u + 0.3, 0, 1) + 0.05 * np.clip(-v + 0.3, 0, 1) * np.clip(u + 0.4, 0, 1)
                 + 0.02 * side) * rng.uniform(0.88, 1.12)
        want /= np.linalg.norm(want)
        ds = L / (pts - 1)
        p = r.copy(); d = None
        flick = rng.uniform(0.6, 1.3) * (0.35 if v > 0.55 else 1.0)
        wave_ph, wave_f = rng.uniform(0, 6.3), rng.uniform(1.0, 1.8)
        for i in range(pts):
            s = i / (pts - 1)
            loc, n = surf(p)
            on_skull = p[2] > cz - 0.035
            if i == 0:
                G[g, 0] = loc + n * 0.001
                p = G[g, 0].copy()
            w = want - np.dot(want, n) * n if on_skull else want + np.array([0, 0, -0.8])
            if np.linalg.norm(w) < 1e-4:
                w = np.array([0.0, 1.0, 0.0])
            w /= np.linalg.norm(w)
            d = w if d is None else (0.55 * d + 0.45 * w)
            if s > 0.72:                                       # end flick: out + up
                out = np.array([p[0] - cx, p[1] - cy, 0.0]); out /= np.linalg.norm(out) + 1e-9
                k = flick * ((s - 0.72) / 0.28) ** 1.5
                d = d + k * (0.9 * out + np.array([0, 0, 0.55]))
            d /= np.linalg.norm(d)
            if i > 0:
                p = p + d * ds
                lat = np.cross(d, n); lat /= np.linalg.norm(lat) + 1e-9
                p = p + lat * 0.0007 * np.sin(wave_f * 6.283 * s + wave_ph)   # wet wave
                loc, n = surf(p)
                lift = 0.0025 + 0.011 * s ** 0.8                  # upper layers lie over lower
                h = np.dot(p - loc, n)
                if on_skull and s < 0.75:
                    p = loc + n * lift                            # combed flat onto the head
                elif h < lift:
                    p = loc + n * lift
                G[g, i] = p

    # Children: interpolate from the 3 nearest guides, then wet-clump to the nearest one.
    kd = KDTree(n_guides)
    for i, r in enumerate(groots):
        kd.insert(Vector(r), i)
    kd.balance()
    roots = sample_surface(scalp_verts, scalp_tris, n_strands, rng)
    P = np.zeros((n_strands, pts, 3))
    t = np.linspace(0, 1, pts)[:, None]
    for c, r in enumerate(roots):
        near = kd.find_n(Vector(r), 3)
        idx = [k for _, k, _ in near]
        w = np.array([1.0 / (dist + 1e-4) for _, _, dist in near]); w /= w.sum()
        shape = sum(wi * (G[k] - G[k][0]) for wi, k in zip(w, idx))
        path = r + shape
        clump = G[idx[0]] + (r - groots[idx[0]]) * 0.12
        P[c] = path + (clump - path) * (0.82 * t ** 0.6)
    P += rng.normal(0, 0.0002, (n_strands, 1, 3)) * t[None] ** 2

    # Keep everything at least 2mm off the skin.
    flat = P.reshape(-1, 3)
    for i in range(len(flat)):
        loc, n, _, dist = head_bvh.find_nearest(Vector(flat[i]))
        if loc is None or dist > 0.01:
            continue
        loc, n = np.array(loc), np.array(n)
        ax = np.array([cx, cy, min(max(loc[2], chin_z - 0.05), cz)])
        if np.dot(n, loc - ax) < 0:
            n = -n
        if np.dot(flat[i] - loc, n) < 0.002:
            flat[i] = loc + n * 0.002
    return flat.reshape(P.shape)
