"""Build an athletic young male with MPFB2 and render front/3-4 turnaround previews.

Run: blender -b -P scripts/mpfb_male_base.py
"""
import bpy, math, os
from mathutils import Vector
from bl_ext.user_default.mpfb.services.humanservice import HumanService

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

bpy.ops.wm.read_factory_settings(use_empty=True)

info = HumanService._create_default_human_info_dict()
info["name"] = "Hero"
info["phenotype"].update(gender=1.0, age=0.45, muscle=1.0, weight=0.68,
                         proportions=0.85, height=0.62)
info["phenotype"]["race"] = {"asian": 0.2, "caucasian": 0.7, "african": 0.1}
info["targets"] = [
    {"target": "torso-vshape-incr", "value": 0.6},
    {"target": "torso-muscle-pectoral-incr", "value": 0.5},
    {"target": "torso-muscle-dorsi-incr", "value": 0.5},
    {"target": "stomach-pregnant-decr", "value": 0.5},
    {"target": "measure-waist-circ-decr", "value": 0.4},
    {"target": "measure-shoulder-dist-incr", "value": 0.4},
]
info["rig"] = "default"
info["skin_mhmat"] = "young_caucasian_male/young_caucasian_male.mhmat"
info["skin_material_type"] = "ENHANCED_SSS"
info["eyes"] = "high-poly/high-poly.mhclo"
info["eyes_material_type"] = "PROCEDURAL_EYES"
info["eyebrows"] = "eyebrow001/eyebrow001.mhclo"
info["eyelashes"] = "eyelashes01/eyelashes01.mhclo"
info["teeth"] = "teeth_base/teeth_base.mhclo"
info["tongue"] = "tongue01/tongue01.mhclo"
info["hair"] = "cortu_short_messy_hair/cortu_short_messy_hair.mhclo"

settings = HumanService.get_default_deserialization_settings()
settings["subdiv_levels"] = 1
body = HumanService.deserialize_from_dict(info, settings)

# Recolor the hair platinum blond: keep the texture's strand detail as luminance,
# map it through a blond ramp, and drop the object-space normal map that blotches.
for ob in bpy.data.objects:
    if ob.type == "MESH" and "hair" in ob.name.lower():
        nt = ob.material_slots[0].material.node_tree
        tex, bsdf = nt.nodes["diffuseTexture"], nt.nodes["Principled BSDF"]
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.32, 0.24, 0.15, 1)
        ramp.color_ramp.elements[1].position = 0.35
        ramp.color_ramp.elements[1].color = (0.92, 0.82, 0.62, 1)
        nt.links.new(tex.outputs["Color"], bw.inputs["Color"])
        nt.links.new(bw.outputs["Val"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        for l in list(bsdf.inputs["Normal"].links):
            nt.links.remove(l)
        bsdf.inputs["Roughness"].default_value = 0.45
        bsdf.inputs["Coat Weight"].default_value = 0.2

# --- Studio preview: neutral grey backdrop, 3-point lighting ---
scene = bpy.context.scene
bpy.ops.mesh.primitive_plane_add(size=30)
floor = bpy.context.object
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.18, 0.18, 0.2, 1)
floor.data.materials.append(fm)

def area(name, loc, energy, size, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object; l.name = name
    l.data.energy, l.data.size, l.data.color = energy, size, color
    l.rotation_euler = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

area("Key", (2.2, -3.0, 2.8), 450, 2.0)
area("Fill", (-3.0, -2.0, 1.6), 200, 3.0, (0.85, 0.9, 1.0))
area("Rim", (0.5, 3.0, 2.6), 600, 1.5, (0.75, 0.6, 1.0))

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

height = max((body.matrix_world @ Vector(c)).z for c in body.bound_box)
bpy.ops.object.empty_add(location=(0, 0, height * 0.52)); target = bpy.context.object

bpy.ops.object.camera_add(); cam = bpy.context.object
cam.data.lens = 60
c = cam.constraints.new("TRACK_TO"); c.target = target; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
scene.camera = cam

os.makedirs(os.path.join(ROOT, "renders"), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "male_base.blend"))

shots = {
    "front": ((0, -4.6, height * 0.55), height * 0.52),
    "three_quarter": ((2.8, -3.6, height * 0.6), height * 0.52),
    "face": ((0.5, -1.6, height * 0.93), height * 0.92),
}
for name, (loc, tz) in shots.items():
    cam.location = loc
    target.location.z = tz
    cam.data.lens = 85 if name == "face" else 60
    scene.render.filepath = os.path.join(ROOT, "renders", f"male_base_{name}.png")
    bpy.ops.render.render(write_still=True)
