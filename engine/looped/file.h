#pragma once
#include <optional>
#include <string>

namespace engine {
// Reads a file from the embedded virtual filesystem (e.g. "/shaders/x.wgsl").
std::optional<std::string> readTextFile(const char* path);
}
