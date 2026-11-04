// What a model must be (J116.6): see model_spec.h.
#include "looped/draw/model_spec.h"

#include <cstdio>

namespace engine::draw {

namespace {
constexpr float kMaxSeamShare = 0.20f;
constexpr float kMinTrianglesPerPart = 48;
constexpr float kMaxOpenShare = 0.05f;
constexpr float kMaxSimplestShare = 0.25f;
constexpr uint32_t kMaxMaterials = 8;
constexpr uint32_t kBigModel = 2000;
// Models seen right in front of you (the credit coin pops up by your view): four times the size budget.
const char* kCloseUp[] = {"credit_coin.glb"};  // smaller models are drawn whole: a 224-triangle bottle costs almost nothing
constexpr float kFreeTriangles = 300;              // every model, however small (a pawn you play with up close)
constexpr float kMaxTrianglesPerSquareMetre = 40000;  // and this many per m² of its biggest side

std::string pct(float x) {
  char b[32];
  std::snprintf(b, sizeof b, "%.0f%%", x * 100);
  return b;
}
}  // namespace

const std::vector<ModelRule>& modelRules() {
  static const std::vector<ModelRule> kRules = {
      {"M-SIMPLIFY", "A big model (2,000 triangles or more): its simplest version is at most a quarter of its triangles.",
       "Far away a model should cost a few triangles; a model that can't get simpler costs full price at any distance.",
       "Usually one of the rules below is the cause; fix that one."},
      {"M-SEAMS", "(A cause) more than 20% of its corners sit on a texture seam.",
       "A seam can only slide along itself when simplified, and where seams meet nothing moves; many seams freeze the model.",
       "Unwrap in fewer, bigger islands; put the seams where the model already has a crease."},
      {"M-PIECES", "(A cause) its separate pieces average under 48 triangles each.",
       "Hundreds of tiny loose pieces (screws, labels, bottles as separate bits) can only vanish one by one, so the simpler versions stay heavy.",
       "Join pieces that touch; make rows of small things (bottles, books, keys) one mesh, or a few."},
      {"M-OPEN", "(A cause) more than 5% of its edges are open (a triangle on one side only).",
       "Open edges are locked when simplifying, like seams.",
       "Close holes and give sheets a thickness, or merge them into what they lie on."},
      {"M-MATERIALS", "At most 8 materials with a picture, plus one per 2 m of its biggest side (plain colours don't count).",
       "Each pictured material is its own draw and its own texture; plain colours are kept per corner in the new frame.",
       "Share pictures, or put several looks in one texture."},
      {"M-DENSITY", "At most 300 triangles, plus 40,000 per square metre of its biggest side (a 10 cm candle: 700); four times that for a model seen right in front of you (the credit coin).",
       "Detail nobody can see at arm's length still has to be stored and simplified.",
       "Bake the fine detail into the texture instead of the triangles."},
  };
  return kRules;
}

std::vector<ModelProblem> checkModel(const ModelMeasure& m) {
  std::vector<ModelProblem> out;
  const auto& R = modelRules();
  auto say = [&](int i, std::string measured) { out.push_back({&R[static_cast<size_t>(i)], std::move(measured)}); };
  if (m.triangles >= kBigModel && m.simplestShare > kMaxSimplestShare) {
    say(0, pct(m.simplestShare) + " of its triangles at its simplest (at most " + pct(kMaxSimplestShare) + ")");
    // Why, usually:
    if (m.seamShare > kMaxSeamShare) say(1, pct(m.seamShare) + " of corners on seams"), out.back().cause = true;
    if (m.trianglesPerPart < kMinTrianglesPerPart) {
      char b[96];
      std::snprintf(b, sizeof b, "%u pieces, %.0f triangles each", m.parts, m.trianglesPerPart);
      say(2, b);
      out.back().cause = true;
    }
    if (m.openShare > kMaxOpenShare) say(3, pct(m.openShare) + " of edges open"), out.back().cause = true;
  }
  // A room-sized model has more surfaces than a prop: 8 pictures, plus one per 2 m of its biggest side.
  const uint32_t pictures = kMaxMaterials + static_cast<uint32_t>(m.size / 2);
  if (m.pictured > pictures) say(4, std::to_string(m.pictured) + " pictured materials (at most " + std::to_string(pictures) + " for its size)");
  float allowed = kFreeTriangles + kMaxTrianglesPerSquareMetre * m.size * m.size;
  for (const char* c : kCloseUp)
    if (m.file == c) allowed *= 4;
  if (static_cast<float>(m.triangles) > allowed) {
    char b[96];
    std::snprintf(b, sizeof b, "%u triangles for its %.2f m size (at most %.0f)", m.triangles, m.size, allowed);
    say(5, b);
  }
  return out;
}

}  // namespace engine::draw
