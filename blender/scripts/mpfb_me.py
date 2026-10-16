"""Personalized MPFB2 male: fit (not shredded) build, dark curly hair, stubble,
light chest hair, warm light skin, brown eyes.

Run: blender -b -P scripts/mpfb_me.py [-- face]   ("face" renders only the close-up)
"""
import bpy, math, os, sys
import numpy as np
from mathutils import Vector
from bl_ext.user_default.mpfb.services.humanservice import HumanService

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ONLY_FACE = "face" in sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else False

bpy.ops.wm.read_factory_settings(use_empty=True)

info = HumanService._create_default_human_info_dict()
info["name"] = "Me"
info["phenotype"].update(gender=1.0, age=0.5, muscle=0.8, weight=0.6,
                         proportions=0.75, height=0.6)
info["phenotype"]["race"] = {"asian": 0.05, "caucasian": 0.9, "african": 0.05}
info["targets"] = [
    {"target": "torso-vshape-incr", "value": 0.3},
    {"target": "torso-muscle-pectoral-incr", "value": 0.4},
    {"target": "measure-shoulder-dist-incr", "value": 0.3},
]
info["rig"] = "default"
info["skin_mhmat"] = "young_caucasian_male/young_caucasian_male.mhmat"
info["skin_material_type"] = "ENHANCED_SSS"
info["eyes"] = "high-poly/high-poly.mhclo"
info["eyes_material_type"] = "PROCEDURAL_EYES"
info["eyes_material_settings"] = {"IrisMajorColor": [0.09, 0.11, 0.035, 1.0], "IrisMinorColor": [0.42, 0.2, 0.04, 1.0]}
info["eyebrows"] = "eyebrow001/eyebrow001.mhclo"
info["eyelashes"] = "eyelashes01/eyelashes01.mhclo"
info["teeth"] = "teeth_base/teeth_base.mhclo"
info["tongue"] = "tongue01/tongue01.mhclo"

settings = HumanService.get_default_deserialization_settings()
body = HumanService.deserialize_from_dict(info, settings)
rig = bpy.data.objects["Me"]

# ---------- Facial + chest hair mask from rest-pose geometry and face bones ----------
for m in body.modifiers:
    m.show_viewport = False
dg = bpy.context.evaluated_depsgraph_get()
mesh = body.evaluated_get(dg).to_mesh()
co = np.empty(len(mesh.vertices) * 3); mesh.vertices.foreach_get("co", co)
co = co.reshape(-1, 3) @ np.array(body.matrix_world)[:3, :3].T + np.array(body.matrix_world.translation)
body.evaluated_get(dg).to_mesh_clear()
for m in body.modifiers:
    m.show_viewport = True

def bone(name, tail=False):
    b = rig.data.bones[name]
    return np.array(rig.matrix_world @ (b.tail_local if tail else b.head_local))

def smooth(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

x, y, z = co[:, 0], co[:, 1], co[:, 2]
mouth = np.mean([bone(n) for n in ("oris01", "oris02", "oris05", "oris06")], axis=0)
eye_z = (bone("eye.L")[2] + bone("eye.R")[2]) / 2
neck_z = bone("neck02")[2]
chin_z = mouth[2] - 0.055
front = mouth[1]  # most of the face is behind this plane (+Y is back)
depth = y - front
side = smooth(0.02, 0.06, np.abs(x))
top = (mouth[2] + 0.022) * (1 - side) + (eye_z - 0.03) * side       # mustache -> sideburns
beard = smooth(0.0, 0.012, top - z)                                     # below the top line
beard *= 1 - smooth(0.075, 0.095, depth)                                # stop in front of the ears
beard *= smooth(chin_z - 0.03, chin_z - 0.005, z)                        # fade down the neck
beard *= 1 - smooth(0.04, 0.06, depth) * smooth(chin_z, chin_z - 0.02, z)  # no hair on back of neck
lips = ((x / 0.025) ** 2 + ((z - mouth[2]) / 0.0075) ** 2) < 1
beard[lips & (depth < 0.02)] = 0

chest_c = (bone("spine01")[2] + bone("neck01")[2]) / 2 - 0.03
chest = np.exp(-((x / 0.09) ** 2 + ((z - chest_c) / 0.09) ** 2)) * (y < bone("spine01")[1])
chest *= 0.55

attr = body.data.attributes.new("hair_mask", "FLOAT", "POINT")
attr.data.foreach_set("value", np.clip(np.maximum(beard, chest), 0, 1).astype(np.float32))

# ---------- Skin: warm tint + stubble shading driven by the mask ----------
mat = body.material_slots[0].material
grp_node = next(n for n in mat.node_tree.nodes if n.type == "GROUP")
grp_node.inputs["colorMixIn"].default_value = (0.86, 0.62, 0.46, 1)
grp_node.inputs["colorMixInStrength"].default_value = 0.3
g = grp_node.node_tree
nodes, links = g.nodes, g.links
a = nodes.new("ShaderNodeAttribute"); a.attribute_name = "hair_mask"
tc = nodes.new("ShaderNodeTexCoord")
noise = nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 1600; noise.inputs["Detail"].default_value = 2
ramp = nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[1].position = 0.4, 0.55
mul = nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
mul2 = nodes.new("ShaderNodeMath"); mul2.operation = "MULTIPLY"; mul2.inputs[1].default_value = 0.85
tint = nodes.new("ShaderNodeMix"); tint.data_type = "RGBA"; tint.blend_type = "MULTIPLY"
tint.inputs["B"].default_value = (0.06, 0.045, 0.035, 1)
links.new(tc.outputs["Object"], noise.inputs["Vector"])
links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
links.new(ramp.outputs["Color"], mul.inputs[0])
links.new(a.outputs["Fac"], mul.inputs[1])
links.new(mul.outputs["Value"], mul2.inputs[0])
links.new(mul2.outputs["Value"], tint.inputs["Factor"])
bc = nodes["Bright/Contrast"]
links.new(bc.outputs["Color"], tint.inputs["A"])
links.new(tint.outputs["Result"], nodes["Principled BSDF"].inputs["Base Color"])
# A soft shadow under the stubble even where noise is off, for the "five o'clock" look.
shadow = nodes.new("ShaderNodeMix"); shadow.data_type = "RGBA"; shadow.blend_type = "MULTIPLY"
shadow.inputs["B"].default_value = (0.5, 0.46, 0.44, 1)
links.new(a.outputs["Fac"], shadow.inputs["Factor"])
links.new(tint.outputs["Result"], shadow.inputs["A"])
links.new(shadow.outputs["Result"], nodes["Principled BSDF"].inputs["Base Color"])

# ---------- Hair: real curly strands grown from a scalp patch ----------
import bmesh
in_body = np.zeros(len(co), bool)
gi = body.vertex_groups["body"].index
for v in body.data.vertices:
    in_body[v.index] = any(g.group == gi and g.weight > 0.5 for g in v.groups)
hairline = eye_z + 0.048
scalp = in_body & (z > chin_z) & ((z > hairline) | ((depth > 0.095) & (z > mouth[2] + 0.02)))
scalp &= ~((depth < 0.085) & (z < hairline))  # keep the face clear
scalp |= in_body & (np.abs(x) > 0.055) & (z > eye_z + 0.012) & (depth > 0.03)  # temples/sides
scalp &= ~((np.abs(x) > 0.066) & (z < eye_z + 0.03))  # and the ears

for m in body.modifiers:
    m.show_viewport = False
dg = bpy.context.evaluated_depsgraph_get()
bm = bmesh.new(); bm.from_mesh(body.evaluated_get(dg).to_mesh())
body.evaluated_get(dg).to_mesh_clear()
for m in body.modifiers:
    m.show_viewport = True
bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in np.where(~scalp)[0]], context="VERTS")
scalp_me = bpy.data.meshes.new("Scalp"); bm.to_mesh(scalp_me)
area_m2 = sum(f.calc_area() for f in bm.faces); bm.free()
scalp_ob = bpy.data.objects.new("Scalp", scalp_me); bpy.context.collection.objects.link(scalp_ob)
scalp_ob.parent = rig; scalp_ob.parent_type = "BONE"; scalp_ob.parent_bone = "head"
scalp_ob.matrix_parent_inverse = (rig.matrix_world @ rig.data.bones["head"].matrix_local
                                  @ __import__("mathutils").Matrix.Translation((0, rig.data.bones["head"].length, 0))).inverted()

hair_mat = bpy.data.materials.new("CurlyHair"); hair_mat.use_nodes = True
hn = hair_mat.node_tree.nodes; hn.remove(hn["Principled BSDF"])
hb = hn.new("ShaderNodeBsdfHairPrincipled"); hb.parametrization = "MELANIN"
hb.inputs["Melanin"].default_value = 0.95
hb.inputs["Melanin Redness"].default_value = 0.1
hb.inputs["Roughness"].default_value = 0.2
hb.inputs["Radial Roughness"].default_value = 0.3
hb.inputs["Random Roughness"].default_value = 0.3
hb.inputs["Random Color"].default_value = 0.15
hair_mat.node_tree.links.new(hb.outputs[0], hn["Material Output"].inputs["Surface"])
scalp_mat = bpy.data.materials.new("Scalp"); scalp_mat.use_nodes = True
scalp_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.03, 0.02, 0.015, 1)
scalp_mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
scalp_me.materials.append(scalp_mat)

lib = "/opt/blender/4.2/datafiles/assets/geometry_nodes/procedural_hair_node_assets.blend"
with bpy.data.libraries.load(lib) as (src, dst):
    dst.node_groups = ["Frizz Hair Curves"]

STRANDS = 30000
ng = bpy.data.node_groups.new("CurlyHairGen", "GeometryNodeTree")
ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
N, L = ng.nodes, ng.links
gin, gout = N.new("NodeGroupInput"), N.new("NodeGroupOutput")
def grp(name, **vals):
    n = N.new("GeometryNodeGroup"); n.node_tree = bpy.data.node_groups[name]
    for k, v in vals.items():
        n.inputs[k].default_value = v
    return n
# Strands are laid out in Python: roots scattered over the scalp, combed back and
# down along the head, then pushed outside a head-sized ellipsoid so none pass
# through the skull. Geometry nodes add the curls/frizz on top.
rng = np.random.default_rng(3)
sv = np.array([v.co for v in scalp_me.vertices])
scalp_me.calc_loop_triangles()
tris = np.array([tuple(lt.vertices) for lt in scalp_me.loop_triangles])
A, B, C = sv[tris[:, 0]], sv[tris[:, 1]], sv[tris[:, 2]]
fn = np.cross(B - A, C - A); fa = np.linalg.norm(fn, axis=1); fn /= fa[:, None] + 1e-12
pick = rng.choice(len(tris), STRANDS, p=fa / fa.sum())
u, v = rng.random(STRANDS), rng.random(STRANDS)
flip = u + v > 1; u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
roots = A[pick] + (B[pick] - A[pick]) * u[:, None] + (C[pick] - A[pick]) * v[:, None]
nrm = fn[pick]
centre_xyz = np.array([0.0, (sv[:, 1].min() + sv[:, 1].max()) / 2, eye_z - 0.005])
upper = sv[sv[:, 2] > eye_z]
radii = np.array([np.abs(upper[:, 0]).max(), (upper[:, 1].max() - upper[:, 1].min()) / 2,
                  sv[:, 2].max() - centre_xyz[2]])
nrm *= np.sign(((roots - centre_xyz) * nrm).sum(1))[:, None]  # make normals point outward

comb = np.array([0.0, 0.8, -0.6]); comb /= np.linalg.norm(comb)

face_pt = np.array([0.0, front - 0.15, mouth[2] - 0.08])

def comb_paths(roots, nrm, length, pts):
    # Front roots sweep up/back away from the face; back roots fall with gravity.
    w = np.clip((front + 0.13 - roots[:, 1]) / 0.07, 0, 1)[:, None]
    want = w * np.array([0.0, 1.0, 0.15]) + (1 - w) * comb
    tang = want - (nrm * want).sum(1)[:, None] * nrm
    bad = np.linalg.norm(tang, axis=1) < 1e-3; tang[bad] = (0, 1, 0)
    tang /= np.linalg.norm(tang, axis=1)[:, None]
    t = np.linspace(0, 1, pts)[None, :, None]
    Ls = length[:, None, None]
    grav = (0.45 * (1 - 0.6 * w))[:, :, None]
    return (roots[:, None, :]
            + nrm[:, None, :] * (0.012 * np.sqrt(t))             # lift off the scalp
            + tang[:, None, :] * Ls * t                         # combed direction
            + np.array([0, 0, -1.0]) * (grav * Ls * t ** 2))    # gravity

# Wolf cut: guides set the layers (short crown, longer shaggy back/nape), a soft
# wave, and an up/out flick at the ends. Strands hug their guide tightly toward
# the tips so the hair reads as wet, brushed clumps.
PTS, GUIDES = 48, 900
gsel = rng.choice(STRANDS, GUIDES, replace=False)
gr = roots[gsel]
back = np.clip((gr[:, 1] - front - 0.06) / 0.10, 0, 1)        # 0 at front, 1 at back
low = np.clip((hairline + 0.04 - gr[:, 2]) / 0.08, 0, 1)        # 1 near nape/sides
g_len = (0.075 + 0.05 * back + 0.06 * low * back) * rng.uniform(0.8, 1.2, GUIDES)
G = comb_paths(gr, nrm[gsel], g_len, PTS)
T = np.gradient(G, axis=1); T /= np.linalg.norm(T, axis=2, keepdims=True)
e1 = np.cross(T, nrm[gsel][:, None, :]); e1 /= np.linalg.norm(e1, axis=2, keepdims=True) + 1e-9
tt = np.linspace(0, 1, PTS)[None, :]
wave = 0.004 * np.sin(2 * np.pi * rng.uniform(1.0, 1.6, GUIDES)[:, None] * tt + rng.uniform(0, 6.3, GUIDES)[:, None])
G = G + (wave * tt)[..., None] * e1
# Wet + brushed: above the ears, guides are snapped onto the real head surface
# (BVH of the body mesh) at a small, growing offset, so the hair lies on the skull.
from mathutils.bvhtree import BVHTree
body.data.calc_loop_triangles()
tri_all = np.array([tuple(lt.vertices) for lt in body.data.loop_triangles])
keep = (co[tri_all][:, :, 2].min(1) > chin_z - 0.06) & in_body[tri_all].all(1)
head_bvh = BVHTree.FromPolygons([tuple(p) for p in co], [tuple(t) for t in tri_all[keep]])

def hug(pts, offset, only_above=None, min_only=False):
    flat = pts.reshape(-1, 3); off = np.broadcast_to(offset, pts.shape[:2]).reshape(-1)
    sel = np.ones(len(flat), bool) if only_above is None else flat[:, 2] > only_above
    out = flat.copy()
    for i in np.where(sel)[0]:
        loc, n, _, _ = head_bvh.find_nearest(flat[i])
        if loc is None:
            continue
        n = np.array(n); loc = np.array(loc)
        if np.dot(flat[i] - loc, n) < 0:
            n = -n if np.dot(n, loc - centre_xyz) < 0 else n
        h = np.dot(flat[i] - loc, n)
        if min_only:
            if h < off[i]:
                out[i] = loc + n * off[i]
        else:
            out[i] = loc + n * off[i]
    return out.reshape(pts.shape)

G = hug(G, 0.004 + 0.012 * tt, only_above=centre_xyz[2] - 0.03)
# End flick: the last ~25% bends outward from the head and a little up.
out = G - centre_xyz; out /= np.linalg.norm(out, axis=2, keepdims=True)
flick = np.clip((tt - 0.75) / 0.25, 0, 1) ** 2 * g_len[:, None] * rng.uniform(0.15, 0.35, GUIDES)[:, None]
G = G + flick[..., None] * (0.8 * out + np.array([0, 0, 0.3]))

from mathutils.kdtree import KDTree
kd = KDTree(GUIDES)
for i, rt in enumerate(gr):
    kd.insert(rt, i)
kd.balance()
owner = np.array([kd.find(rt)[1] for rt in roots])
spread = (roots - gr[owner])[:, None, :] * (1 - 0.9 * tt[..., None])
jitter = rng.normal(0, 0.0006, (STRANDS, 1, 3)) * tt[..., None]
P = G[owner] + spread + jitter
t = tt[..., None]

# Keep every strand point at least 3mm off the skin.
P = hug(P, 0.003, min_only=True)
t = tt[..., None]

# Face guard: once a strand enters the face box, freeze the rest of it there.
inface = ((np.abs(P[..., 0]) < 0.07) & (P[..., 1] < front + 0.075)
          & (P[..., 2] < hairline - 0.01) & (P[..., 2] > chin_z - 0.03))
hit = np.maximum.accumulate(inface, axis=1)
first = np.where(hit.any(1), hit.argmax(1), PTS)
idx = np.minimum(np.arange(PTS)[None, :], np.maximum(first - 1, 0)[:, None])
P = np.take_along_axis(P, idx[..., None].repeat(3, axis=2), axis=1)

curves = bpy.data.hair_curves.new("CurlyHair")
curves.add_curves([PTS] * STRANDS)
curves.position_data.foreach_set("vector", P.reshape(-1).astype(np.float32))
frizz = grp("Frizz Hair Curves", **{"Factor": 1.0, "Distance": 0.0006, "Shape": 0.5, "Seed": 2})
L.new(gin.outputs[0], frizz.inputs["Geometry"])
rad = N.new("GeometryNodeSetCurveRadius"); rad.inputs["Radius"].default_value = 0.0003
L.new(frizz.outputs["Geometry"], rad.inputs["Curve"])
mat_n = N.new("GeometryNodeSetMaterial"); mat_n.inputs["Material"].default_value = hair_mat
L.new(rad.outputs[0], mat_n.inputs["Geometry"])

L.new(mat_n.outputs[0], gout.inputs[0])

# Cycles only renders true hair from a Curves object, so the generator lives on one.
hair_ob = bpy.data.objects.new("CurlyHair", curves)
bpy.context.collection.objects.link(hair_ob)
hair_ob.data.materials.append(hair_mat)
hair_ob.parent, hair_ob.parent_type, hair_ob.parent_bone = rig, "BONE", "head"
hair_ob.matrix_parent_inverse = scalp_ob.matrix_parent_inverse.copy()
hair_ob.modifiers.new("CurlyHair", "NODES").node_group = ng
# Lift the dark scalp 1mm off the skin so it doesn't z-fight.
scalp_ob.hide_render = True

# ---------- Beard: short real hairs on the stubble mask ----------
lower = smooth(mouth[2] - 0.012, mouth[2] - 0.03, z)                     # chin + jaw
jawline = smooth(0.035, 0.07, depth) * smooth(mouth[2] + 0.01, mouth[2] - 0.02, z)
stache = (np.abs(x) < 0.03) * smooth(mouth[2] + 0.003, mouth[2] + 0.008, z)
cheeks = 0.25
bmask = np.clip(beard, 0, 1) * in_body * np.clip(cheeks + lower + jawline + stache, 0, 1)
body.data.calc_loop_triangles()
polys = np.array([tuple(lt.vertices) for lt in body.data.loop_triangles])
A, B, C = co[polys[:, 0]], co[polys[:, 1]], co[polys[:, 2]]
fn = np.cross(B - A, C - A); fa = np.linalg.norm(fn, axis=1); fn /= fa[:, None] + 1e-12
w = fa * bmask[polys].mean(1)
NB = 26000
pick = rng.choice(len(polys), NB, p=w / w.sum())
u, v = rng.random(NB), rng.random(NB); fl = u + v > 1; u[fl], v[fl] = 1 - u[fl], 1 - v[fl]
br = A[pick] + (B[pick] - A[pick]) * u[:, None] + (C[pick] - A[pick]) * v[:, None]
bn = fn[pick] * np.sign(((br - np.array([0, front + 0.06, mouth[2]])) * fn[pick]).sum(1))[:, None]
down = np.array([0, 0.15, -1.0]); bt = down - (bn @ down)[:, None] * bn
bt /= np.linalg.norm(bt, axis=1)[:, None] + 1e-9
blen = rng.uniform(0.0015, 0.004, NB)[:, None, None]
bts = np.linspace(0, 1, 5)[None, :, None]
BP = br[:, None, :] + bn[:, None, :] * (0.2 * blen * bts) + bt[:, None, :] * (blen * bts) \
     + rng.normal(0, 0.0006, (NB, 1, 3)) * bts ** 2
bc = bpy.data.hair_curves.new("Beard"); bc.add_curves([5] * NB)
bc.position_data.foreach_set("vector", BP.reshape(-1).astype(np.float32))
bc.materials.append(hair_mat)
beard_ob = bpy.data.objects.new("Beard", bc); bpy.context.collection.objects.link(beard_ob)
beard_ob.parent, beard_ob.parent_type, beard_ob.parent_bone = rig, "BONE", "head"
beard_ob.matrix_parent_inverse = scalp_ob.matrix_parent_inverse.copy()
bng = bpy.data.node_groups.new("BeardRadius", "GeometryNodeTree")
bng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
bng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
bi, bo = bng.nodes.new("NodeGroupInput"), bng.nodes.new("NodeGroupOutput")
brad = bng.nodes.new("GeometryNodeSetCurveRadius"); brad.inputs["Radius"].default_value = 0.00007
bng.links.new(bi.outputs[0], brad.inputs[0]); bng.links.new(brad.outputs[0], bo.inputs[0])
beard_ob.modifiers.new("Radius", "NODES").node_group = bng

# Darker brows to match the hair.
for o in bpy.data.objects:
    if "eyebrow" in o.name:
        for n in o.material_slots[0].material.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                n.inputs["Base Color"].default_value = (0.02, 0.012, 0.008, 1)

# ---------- Studio preview ----------
scene = bpy.context.scene
bpy.ops.mesh.primitive_plane_add(size=30)
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.18, 0.18, 0.2, 1)
bpy.context.object.data.materials.append(fm)

def area(name, loc, energy, size, aim_z, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object; l.name = name
    l.data.energy, l.data.size, l.data.color = energy, size, color
    l.rotation_euler = (Vector((0, 0, aim_z)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

height = max((body.matrix_world @ Vector(c)).z for c in body.bound_box)
area("Key", (2.2, -3.0, 2.8), 400, 2.0, 1.1)
area("Fill", (-3.0, -2.0, 1.6), 150, 3.0, 1.1, (0.85, 0.9, 1.0))
area("Rim", (0.5, 3.0, 2.6), 600, 1.5, 1.1, (0.75, 0.6, 1.0))

world = bpy.data.worlds.new("World"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.03, 0.035, 1)
scene.world = world
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.resolution_x, scene.render.resolution_y = 1080, 1350

bpy.ops.object.empty_add(); target = bpy.context.object
bpy.ops.object.camera_add(); cam = bpy.context.object
c = cam.constraints.new("TRACK_TO"); c.target = target; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
scene.camera = cam

os.makedirs(os.path.join(ROOT, "renders"), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "me_base.blend"))

shots = {
    "face": ((0.55, -1.25, height * 0.93), height * 0.925, 85),
    "side": ((-1.45, -0.05, height * 0.93), height * 0.925, 85),
    "front": ((0, -4.6, height * 0.55), height * 0.52, 60),
    "three_quarter": ((2.8, -3.6, height * 0.6), height * 0.52, 60),
}
for name, (loc, tz, lens) in shots.items():
    if ONLY_FACE and name not in ("face", "side"):
        continue
    cam.location, target.location.z, cam.data.lens = loc, tz, lens
    scene.render.filepath = os.path.join(ROOT, "renders", f"me_{name}.png")
    bpy.ops.render.render(write_still=True)
