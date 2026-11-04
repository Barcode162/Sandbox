#include "looped/file.h"

#include <fstream>
#include <sstream>

#include "looped/log.h"

namespace engine {

std::optional<std::string> readTextFile(const char* path) {
  std::ifstream in(path, std::ios::binary);
  if (!in) {
    LOG_ERROR("Missing file: %s", path);
    return std::nullopt;
  }
  std::stringstream buffer;
  buffer << in.rdbuf();
  return buffer.str();
}

}  // namespace engine
