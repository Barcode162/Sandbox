// One model against the model spec (J116.6, looped/draw/model_spec.h):
//   build/native/model_check <file.glb>...   its numbers, and every rule it breaks with the fix
#include <cstdio>
#include <fstream>
#include <iterator>

#include "looped/draw/model_spec.h"
#include "looped/gltf.h"

int main(int argc, char** argv) {
  int bad = 0;
  for (int a = 1; a < argc; ++a) {
    std::ifstream f(argv[a], std::ios::binary);
    std::vector<uint8_t> bytes((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
    engine::ModelData d;
    std::string error;
    if (!engine::parseGlb(bytes, d, error)) {
      std::printf("%s: can't read (%s)\n", argv[a], error.c_str());
      ++bad;
      continue;
    }
    engine::draw::ModelMeasure m = engine::draw::measureModel(d);
    const std::string path = argv[a];
    m.file = path.substr(path.find_last_of('/') + 1);
    const auto problems = engine::draw::checkModel(m);
    std::printf("%s: %u triangles, %.2f m, seams %.0f%%, %u pieces, open %.0f%%, simplest %.0f%%, %u materials: %s\n", argv[a], m.triangles, m.size,
                m.seamShare * 100, m.parts, m.openShare * 100, m.simplestShare * 100, m.materials, problems.empty() ? "meets the spec" : "BREAKS IT");
    for (const auto& p : problems) std::printf("  %s %s. %s\n", p.rule->id, p.measured.c_str(), p.rule->fix);
    bad += !problems.empty();
  }
  return bad ? 1 : 0;
}
