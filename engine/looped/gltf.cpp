#include "looped/gltf.h"

#include <algorithm>
#include <cmath>
#include <cstring>
#include <memory>
#include <utility>

#include "looped/json.h"

namespace engine {
namespace {

constexpr uint32_t kGlbMagic = 0x46546C67;  // "glTF"
constexpr uint32_t kChunkJson = 0x4E4F534A;
constexpr uint32_t kChunkBin = 0x004E4942;

uint32_t readU32(const uint8_t* p) {
  uint32_t v;
  std::memcpy(&v, p, 4);
  return v;
}

// A column-major 4x4 matrix (same layout as Mat4) built from glTF TRS.
Mat4 nodeMatrix(const Json& node) {
  Mat4 m;
  if (node["matrix"].size() == 16) {
    for (int i = 0; i < 16; ++i) m.m[i] = static_cast<float>(node["matrix"][static_cast<size_t>(i)].number());
    return m;
  }
  const Json& t = node["translation"];
  const Json& r = node["rotation"];
  const Json& s = node["scale"];
  const Vec3 translation{static_cast<float>(t[0].number()), static_cast<float>(t[1].number()),
                         static_cast<float>(t[2].number())};
  Quat rotation;
  if (r.size() == 4) {
    rotation = {static_cast<float>(r[0].number()), static_cast<float>(r[1].number()),
                static_cast<float>(r[2].number()), static_cast<float>(r[3].number())};
  }
  const Vec3 scale{static_cast<float>(s[0].number(1)), static_cast<float>(s[1].number(1)),
                   static_cast<float>(s[2].number(1))};
  m = Mat4::transform(translation, rotation);
  for (int row = 0; row < 3; ++row) {
    m.at(0, row) *= scale.x;
    m.at(1, row) *= scale.y;
    m.at(2, row) *= scale.z;
  }
  return m;
}

Vec3 transformPosition(const Mat4& m, Vec3 p) {
  return {m.at(0, 0) * p.x + m.at(1, 0) * p.y + m.at(2, 0) * p.z + m.at(3, 0),
          m.at(0, 1) * p.x + m.at(1, 1) * p.y + m.at(2, 1) * p.z + m.at(3, 1),
          m.at(0, 2) * p.x + m.at(1, 2) * p.y + m.at(2, 2) * p.z + m.at(3, 2)};
}

Vec3 transformDirection(const Mat4& m, Vec3 d) {
  return {m.at(0, 0) * d.x + m.at(1, 0) * d.y + m.at(2, 0) * d.z,
          m.at(0, 1) * d.x + m.at(1, 1) * d.y + m.at(2, 1) * d.z,
          m.at(0, 2) * d.x + m.at(1, 2) * d.y + m.at(2, 2) * d.z};
}

// Normals need the inverse transpose; the cofactor matrix points the same way
// and needs no division.
Vec3 transformNormal(const Mat4& m, Vec3 n) {
  const Vec3 c0{m.at(0, 0), m.at(0, 1), m.at(0, 2)};
  const Vec3 c1{m.at(1, 0), m.at(1, 1), m.at(1, 2)};
  const Vec3 c2{m.at(2, 0), m.at(2, 1), m.at(2, 2)};
  const Vec3 r0 = cross(c1, c2), r1 = cross(c2, c0), r2 = cross(c0, c1);
  return normalize(r0 * n.x + r1 * n.y + r2 * n.z);
}

float determinant3(const Mat4& m) {
  const Vec3 c0{m.at(0, 0), m.at(0, 1), m.at(0, 2)};
  const Vec3 c1{m.at(1, 0), m.at(1, 1), m.at(1, 2)};
  const Vec3 c2{m.at(2, 0), m.at(2, 1), m.at(2, 2)};
  return dot(c0, cross(c1, c2));
}

class GlbReader {
 public:
  GlbReader(const Json& doc, const uint8_t* bin, size_t binSize, std::string& error)
      : doc_(doc), bin_(bin), binSize_(binSize), error_(error) {}

  bool fail(const std::string& what) {
    if (error_.empty()) error_ = what;
    return false;
  }

  // Reads accessor `index` as floats, `components` per element.
  bool readFloats(int index, int components, std::vector<float>& out) {
    const Json& acc = doc_["accessors"][static_cast<size_t>(index)];
    if (acc.isNull()) return fail("missing accessor");
    const int count = acc["count"].integer();
    const int type = acc["componentType"].integer();
    const bool normalized = acc["normalized"].boolean();
    const int compSize = type == 5126 ? 4 : type == 5123 || type == 5122 ? 2 : type == 5121 || type == 5120 ? 1 : 0;
    if (!compSize) return fail("unsupported accessor type");
    const uint8_t* base = nullptr;
    size_t stride = static_cast<size_t>(compSize * components);
    if (!view(acc, stride, base, count)) return false;
    out.resize(static_cast<size_t>(count) * components);
    for (int i = 0; i < count; ++i) {
      const uint8_t* e = base + static_cast<size_t>(i) * stride;
      for (int c = 0; c < components; ++c) {
        const uint8_t* p = e + c * compSize;
        float v = 0;
        switch (type) {
          case 5126: std::memcpy(&v, p, 4); break;
          case 5123: { uint16_t u; std::memcpy(&u, p, 2); v = normalized ? u / 65535.0f : u; break; }
          case 5122: { int16_t u; std::memcpy(&u, p, 2); v = normalized ? std::max(u / 32767.0f, -1.0f) : u; break; }
          case 5121: v = normalized ? *p / 255.0f : *p; break;
          case 5120: { int8_t u = static_cast<int8_t>(*p); v = normalized ? std::max(u / 127.0f, -1.0f) : u; break; }
        }
        out[static_cast<size_t>(i) * components + c] = v;
      }
    }
    return true;
  }

  bool readIndices(int index, std::vector<uint32_t>& out) {
    const Json& acc = doc_["accessors"][static_cast<size_t>(index)];
    const int count = acc["count"].integer();
    const int type = acc["componentType"].integer();
    const int size = type == 5125 ? 4 : type == 5123 ? 2 : type == 5121 ? 1 : 0;
    if (!size) return fail("unsupported index type");
    const uint8_t* base = nullptr;
    size_t stride = static_cast<size_t>(size);
    if (!view(acc, stride, base, count)) return false;
    out.resize(static_cast<size_t>(count));
    for (int i = 0; i < count; ++i) {
      const uint8_t* p = base + static_cast<size_t>(i) * stride;
      if (size == 4) std::memcpy(&out[static_cast<size_t>(i)], p, 4);
      else if (size == 2) { uint16_t u; std::memcpy(&u, p, 2); out[static_cast<size_t>(i)] = u; }
      else out[static_cast<size_t>(i)] = *p;
    }
    return true;
  }

  bool image(int index, ModelImage& out) {
    const Json& img = doc_["images"][static_cast<size_t>(index)];
    if (!img.has("bufferView")) return fail("only images embedded in the .glb are supported");
    const Json& bv = doc_["bufferViews"][static_cast<size_t>(img["bufferView"].integer())];
    const size_t offset = static_cast<size_t>(bv["byteOffset"].number());
    const size_t length = static_cast<size_t>(bv["byteLength"].number());
    if (offset + length > binSize_) return fail("image outside the binary chunk");
    out.bytes.assign(bin_ + offset, bin_ + offset + length);
    out.mimeType = img["mimeType"].string();
    return true;
  }

 private:
  // Finds where an accessor's data starts and its stride, with bounds checks.
  bool view(const Json& acc, size_t& stride, const uint8_t*& base, int count) {
    if (!acc.has("bufferView")) return fail("sparse/empty accessors are not supported");
    const Json& bv = doc_["bufferViews"][static_cast<size_t>(acc["bufferView"].integer())];
    if (bv["buffer"].integer() != 0) return fail("only the .glb's own buffer is supported");
    const size_t elementSize = stride;
    if (bv.has("byteStride")) stride = static_cast<size_t>(bv["byteStride"].integer());
    const size_t offset = static_cast<size_t>(bv["byteOffset"].number()) + static_cast<size_t>(acc["byteOffset"].number());
    const size_t length = static_cast<size_t>(bv["byteLength"].number());
    if (count > 0 && (static_cast<size_t>(acc["byteOffset"].number()) + (count - 1) * stride + elementSize > length ||
                      static_cast<size_t>(bv["byteOffset"].number()) + length > binSize_)) {
      return fail("accessor outside its buffer");
    }
    base = bin_ + offset;
    return true;
  }

  const Json& doc_;
  const uint8_t* bin_;
  size_t binSize_;
  std::string& error_;
};

// Per-triangle tangents from texture coordinates, averaged per vertex.
void computeTangents(ModelPrimitive& p) {
  std::vector<Vec3> tan(p.vertices.size()), bitan(p.vertices.size());
  for (size_t i = 0; i + 2 < p.indices.size(); i += 3) {
    const uint32_t ia = p.indices[i], ib = p.indices[i + 1], ic = p.indices[i + 2];
    const ModelVertex &a = p.vertices[ia], &b = p.vertices[ib], &c = p.vertices[ic];
    const Vec3 e1 = b.position - a.position, e2 = c.position - a.position;
    const float du1 = b.uv.x - a.uv.x, dv1 = b.uv.y - a.uv.y, du2 = c.uv.x - a.uv.x, dv2 = c.uv.y - a.uv.y;
    const float det = du1 * dv2 - du2 * dv1;
    if (std::fabs(det) < 1e-12f) continue;
    const float r = 1.0f / det;
    const Vec3 t = (e1 * dv2 - e2 * dv1) * r;
    const Vec3 bt = (e2 * du1 - e1 * du2) * r;
    for (uint32_t v : {ia, ib, ic}) {
      tan[v] += t;
      bitan[v] += bt;
    }
  }
  for (size_t v = 0; v < p.vertices.size(); ++v) {
    ModelVertex& mv = p.vertices[v];
    Vec3 t = tan[v] - mv.normal * dot(mv.normal, tan[v]);  // make it lie on the surface
    if (dot(t, t) < 1e-12f) t = std::fabs(mv.normal.x) < 0.9f ? cross(mv.normal, {1, 0, 0}) : cross(mv.normal, {0, 1, 0});
    t = normalize(t);
    const float w = dot(cross(mv.normal, t), bitan[v]) < 0 ? -1.0f : 1.0f;
    mv.tangent = {t.x, t.y, t.z, w};
  }
}

void computeNormals(ModelPrimitive& p) {
  for (ModelVertex& v : p.vertices) v.normal = {};
  for (size_t i = 0; i + 2 < p.indices.size(); i += 3) {
    ModelVertex &a = p.vertices[p.indices[i]], &b = p.vertices[p.indices[i + 1]], &c = p.vertices[p.indices[i + 2]];
    const Vec3 n = cross(b.position - a.position, c.position - a.position);
    a.normal += n;
    b.normal += n;
    c.normal += n;
  }
  for (ModelVertex& v : p.vertices) v.normal = normalize(v.normal);
}

bool readPrimitive(GlbReader& r, const Json& prim, const Mat4& world, ModelPrimitive& out) {
  const int mode = prim["mode"].integer(4);
  if (mode != 4) return true;  // only triangle lists; skip lines/points
  const Json& attrs = prim["attributes"];
  if (!attrs.has("POSITION")) return r.fail("primitive without positions");
  std::vector<float> pos, nrm, uv, tan;
  if (!r.readFloats(attrs["POSITION"].integer(), 3, pos)) return false;
  if (attrs.has("NORMAL") && !r.readFloats(attrs["NORMAL"].integer(), 3, nrm)) return false;
  if (attrs.has("TEXCOORD_0") && !r.readFloats(attrs["TEXCOORD_0"].integer(), 2, uv)) return false;
  if (attrs.has("TANGENT") && !r.readFloats(attrs["TANGENT"].integer(), 4, tan)) return false;
  const size_t count = pos.size() / 3;

  out.vertices.resize(count);
  // Mirrored nodes (negative scale) flip triangle winding and tangent handedness.
  const bool flipped = determinant3(world) < 0;
  for (size_t i = 0; i < count; ++i) {
    ModelVertex& v = out.vertices[i];
    v.position = transformPosition(world, {pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]});
    if (nrm.size() >= (i + 1) * 3) v.normal = transformNormal(world, {nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]});
    if (uv.size() >= (i + 1) * 2) v.uv = {uv[i * 2], uv[i * 2 + 1]};
    if (tan.size() >= (i + 1) * 4) {
      const Vec3 t = normalize(transformDirection(world, {tan[i * 4], tan[i * 4 + 1], tan[i * 4 + 2]}));
      v.tangent = {t.x, t.y, t.z, tan[i * 4 + 3] * (flipped ? -1.0f : 1.0f)};
    }
  }
  if (prim.has("indices")) {
    if (!r.readIndices(prim["indices"].integer(), out.indices)) return false;
  } else {
    out.indices.resize(count);
    for (size_t i = 0; i < count; ++i) out.indices[i] = static_cast<uint32_t>(i);
  }
  for (uint32_t i : out.indices) {
    if (i >= count) return r.fail("index out of range");
  }
  if (flipped) {
    for (size_t i = 0; i + 2 < out.indices.size(); i += 3) std::swap(out.indices[i + 1], out.indices[i + 2]);
  }
  if (nrm.empty()) computeNormals(out);
  if (tan.empty()) computeTangents(out);
  out.material = prim["material"].integer(-1);
  return true;
}

// Lists every mesh part in the scene with its world transform (cheap: no
// vertex data is read here).
bool collectNodes(GlbReader& r, const Json& doc, int index, const Mat4& parent, int depth,
                  std::vector<std::pair<const Json*, Mat4>>& out) {
  if (depth > 32) return r.fail("node tree too deep");
  const Json& node = doc["nodes"][static_cast<size_t>(index)];
  const Mat4 world = parent * nodeMatrix(node);
  if (node.has("mesh")) {
    const Json& mesh = doc["meshes"][static_cast<size_t>(node["mesh"].integer())];
    for (const Json& prim : mesh["primitives"].items()) out.emplace_back(&prim, world);
  }
  for (const Json& child : node["children"].items()) {
    if (!collectNodes(r, doc, child.integer(), world, depth + 1, out)) return false;
  }
  return true;
}

}  // namespace

struct GlbParser::State {
  std::vector<uint8_t> file;
  Json doc;
  const uint8_t* bin = nullptr;
  size_t binSize = 0;
  std::string error;
  std::unique_ptr<GlbReader> reader;
  std::vector<std::pair<const Json*, Mat4>> parts;
  size_t next = 0;
};

GlbParser::GlbParser() : s_(std::make_unique<State>()) {}
GlbParser::~GlbParser() = default;

bool GlbParser::begin(std::vector<uint8_t> fileBytes, std::string& error) {
  State& st = *s_;
  st.file = std::move(fileBytes);
  const std::vector<uint8_t>& file = st.file;
  error.clear();
  if (file.size() < 20 || readU32(file.data()) != kGlbMagic) {
    error = "not a .glb file";
    return false;
  }
  if (readU32(file.data() + 4) != 2) {
    error = "only glTF version 2 is supported";
    return false;
  }
  // Chunks: JSON first, then the optional binary chunk.
  std::string_view jsonText;
  size_t offset = 12;
  const size_t total = std::min<size_t>(readU32(file.data() + 8), file.size());
  while (offset + 8 <= total) {
    const uint32_t length = readU32(file.data() + offset);
    const uint32_t type = readU32(file.data() + offset + 4);
    if (offset + 8 + length > total) break;
    const uint8_t* data = file.data() + offset + 8;
    if (type == kChunkJson) jsonText = {reinterpret_cast<const char*>(data), length};
    if (type == kChunkBin && !st.bin) {
      st.bin = data;
      st.binSize = length;
    }
    offset += 8 + ((length + 3) & ~3u);
  }
  if (jsonText.empty()) {
    error = "missing JSON chunk";
    return false;
  }
  std::string jsonError;
  st.doc = Json::parse(jsonText, &jsonError, {64, 1u << 20});  // our own model files: generous limits
  if (!st.doc.isObject()) {
    error = "bad JSON: " + jsonError;
    return false;
  }
  st.reader = std::make_unique<GlbReader>(st.doc, st.bin, st.binSize, st.error);
  const Json& scene = st.doc["scenes"][static_cast<size_t>(st.doc["scene"].integer(0))];
  for (const Json& node : scene["nodes"].items()) {
    if (!collectNodes(*st.reader, st.doc, node.integer(), Mat4(), 0, st.parts)) {
      error = st.error;
      return false;
    }
  }
  return true;
}

size_t GlbParser::partCount() const { return s_->parts.size(); }
bool GlbParser::done() const { return s_->next >= s_->parts.size(); }

bool GlbParser::step(ModelData& out, std::string& error) {
  State& st = *s_;
  if (done()) return true;
  const auto& [prim, world] = st.parts[st.next++];
  ModelPrimitive p;
  if (!readPrimitive(*st.reader, *prim, world, p)) {
    error = st.error;
    return false;
  }
  if (!p.indices.empty()) out.primitives.push_back(std::move(p));
  return true;
}

bool GlbParser::finish(ModelData& out, std::string& error) {
  State& st = *s_;
  const Json& doc = st.doc;
  // Materials: glTF textures point at images; store image indices directly.
  const auto imageOf = [&](const Json& textureInfo) {
    if (!textureInfo.has("index")) return -1;
    return doc["textures"][static_cast<size_t>(textureInfo["index"].integer())]["source"].integer(-1);
  };
  for (const Json& m : doc["materials"].items()) {
    ModelMaterial mat;
    mat.name = m["name"].string();
    mat.blend = m["alphaMode"].string() == "BLEND";
    const Json& pbr = m["pbrMetallicRoughness"];
    for (size_t i = 0; i < 4; ++i) mat.baseColor[i] = static_cast<float>(pbr["baseColorFactor"][i].number(1));
    mat.metallic = static_cast<float>(pbr["metallicFactor"].number(1));
    mat.roughness = static_cast<float>(pbr["roughnessFactor"].number(1));
    mat.baseColorImage = imageOf(pbr["baseColorTexture"]);
    mat.metalRoughImage = imageOf(pbr["metallicRoughnessTexture"]);
    mat.normalImage = imageOf(m["normalTexture"]);
    mat.normalScale = static_cast<float>(m["normalTexture"]["scale"].number(1));
    mat.occlusionImage = imageOf(m["occlusionTexture"]);
    mat.emissiveImage = imageOf(m["emissiveTexture"]);
    mat.occlusionStrength = static_cast<float>(m["occlusionTexture"]["strength"].number(1));
    const Json& e = m["emissiveFactor"];
    // KHR_materials_emissive_strength lets glow go past 1 (bulbs, neon).
    const float strength =
        static_cast<float>(m["extensions"]["KHR_materials_emissive_strength"]["emissiveStrength"].number(1));
    mat.emissive = Vec3{static_cast<float>(e[0].number()), static_cast<float>(e[1].number()),
                        static_cast<float>(e[2].number())} * strength;
    mat.flame = static_cast<float>(m["extras"]["looped_flame"].number(0));
    out.materials.push_back(mat);
  }
  out.images.resize(doc["images"].size());  // filled by image()

  if (out.primitives.empty()) {
    error = "no triangles in the file";
    return false;
  }
  out.boundsMin = out.boundsMax = out.primitives[0].vertices[0].position;
  for (const ModelPrimitive& p : out.primitives) {
    for (const ModelVertex& v : p.vertices) {
      out.boundsMin = {std::min(out.boundsMin.x, v.position.x), std::min(out.boundsMin.y, v.position.y),
                       std::min(out.boundsMin.z, v.position.z)};
      out.boundsMax = {std::max(out.boundsMax.x, v.position.x), std::max(out.boundsMax.y, v.position.y),
                       std::max(out.boundsMax.z, v.position.z)};
    }
  }
  return true;
}

bool GlbParser::image(size_t index, ModelData& out, std::string& error) {
  State& st = *s_;
  if (index >= out.images.size()) return true;
  if (!st.reader->image(static_cast<int>(index), out.images[index])) {
    error = st.error;
    return false;
  }
  if (index + 1 == out.images.size()) {  // the last one: done with the file
    st.file.clear();
    st.file.shrink_to_fit();
  }
  return true;
}

bool parseGlb(const std::vector<uint8_t>& file, ModelData& out, std::string& error) {
  GlbParser parser;
  if (!parser.begin(file, error)) return false;
  while (!parser.done()) {
    if (!parser.step(out, error)) return false;
  }
  if (!parser.finish(out, error)) return false;
  for (size_t i = 0; i < out.images.size(); ++i) {
    if (!parser.image(i, out, error)) return false;
  }
  return true;
}

}  // namespace engine
