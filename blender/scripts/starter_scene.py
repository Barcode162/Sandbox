import bpy, math, os

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Ground plane
bpy.ops.mesh.primitive_plane_add(size=10)
# Test object: smooth subdivided monkey
bpy.ops.mesh.primitive_monkey_add(location=(0, 0, 1))
suz = bpy.context.object
suz.modifiers.new("Subsurf", "SUBSURF").levels = 2
bpy.ops.object.shade_smooth()
mat = bpy.data.materials.new("Clay")
mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.45, 0.3, 1)
suz.data.materials.append(mat)

# Camera + light
bpy.ops.object.camera_add(location=(4, -4, 3), rotation=(math.radians(65), 0, math.radians(45)))
scene.camera = bpy.context.object
bpy.ops.object.light_add(type="SUN", location=(3, -2, 5), rotation=(math.radians(40), math.radians(20), 0))
bpy.context.object.data.energy = 4

# World + render settings (Cycles on CPU, no GPU in this container)
world = bpy.data.worlds.new("World"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.08, 1)
scene.world = world
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 32
scene.render.resolution_x, scene.render.resolution_y = 960, 540

out = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "starter.blend"))
scene.render.filepath = os.path.join(out, "renders", "starter.png")
bpy.ops.render.render(write_still=True)
