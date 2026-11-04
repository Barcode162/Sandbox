// JSON reader/writer test (looped/json.*): what the writer produces parses
// back to the same values (backslashes, quotes, control characters, emoji),
// limits hold, and random garbage never crashes the reader.
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <random>
#include <string>

#include "looped/json.h"

using engine::Json;
using engine::JsonWriter;

static int g_failed = 0;
#define CHECK(cond)                                                     \
  do {                                                                  \
    if (!(cond)) {                                                      \
      std::printf("FAIL line %d: %s\n", __LINE__, #cond);               \
      ++g_failed;                                                       \
    }                                                                   \
  } while (0)

int main() {
  // Round trip of tricky strings.
  const std::string tricky[] = {
      "C:\\Users\\me\\song.mid", "say \"hi\"", "tab\there", "line\nbreak\r\n", std::string("nul\0byte", 8),
      "\x01\x02\x1f", "emoji \xF0\x9F\x8D\xB8 and \xC3\xA9", "slash / and </script>", "", "\\", "\"",
  };
  JsonWriter w;
  w.beginObject().key("list").beginArray();
  for (const std::string& s : tricky) w.value(s);
  w.endArray().key("n").value(3.25).key("i").value(-7).key("b").value(true).key("z").null();
  w.key("nan").value(std::nan("")).key("nested").beginArray().beginObject().key("k \"q\"").value("v").endObject();
  w.beginArray().endArray().endArray().endObject();
  std::string err;
  const Json doc = Json::parse(w.str(), &err);
  CHECK(err.empty());
  CHECK(doc.isObject());
  CHECK(doc["list"].size() == sizeof(tricky) / sizeof(tricky[0]));
  for (size_t i = 0; i < doc["list"].size(); ++i) CHECK(doc["list"][i].string() == tricky[i]);
  CHECK(doc["n"].number() == 3.25);
  CHECK(doc["i"].integer() == -7);
  CHECK(doc["b"].boolean() == true);
  CHECK(doc["z"].isNull() && doc.has("z"));
  CHECK(doc["nan"].isNull());
  CHECK(doc["nested"][0]["k \"q\""].string() == "v");
  CHECK(doc["nested"][1].isArray() && doc["nested"][1].size() == 0);
  CHECK(doc["missing"]["deeper"][3].isNull());

  // Numbers survive exactly.
  for (double d : {0.1, 1e-300, 123456789.123456789, -0.0, 1e300}) {
    JsonWriter n;
    n.beginArray().value(d).endArray();
    CHECK(Json::parse(n.str())[0].number() == d);
  }

  // \u escapes, surrogate pairs.
  CHECK(Json::parse("\"\\u00e9\\ud83c\\udf78\"").string() == "\xC3\xA9\xF0\x9F\x8D\xB8");
  CHECK(Json::parse("\"\\ud83c\"").isNull());       // lone surrogate
  CHECK(Json::parse("\"\\udf78x\"").isNull());

  // Limits: depth and string length.
  std::string deep31(31, '['), deep33(33, '[');
  deep31 += std::string(31, ']');
  deep33 += std::string(33, ']');
  CHECK(Json::parse(deep31).isArray());
  err.clear();
  CHECK(Json::parse(deep33, &err).isNull() && !err.empty());
  CHECK(Json::parse("\"" + std::string(4096, 'a') + "\"").string().size() == 4096);
  CHECK(Json::parse("\"" + std::string(4097, 'a') + "\"").isNull());
  CHECK(Json::parse("[1e999]").isNull());           // infinity is not a number here
  CHECK(Json::parse("\"raw\ncontrol\"").isNull());  // control characters must be escaped
  CHECK(Json::parse("{\"a\":1,\"a\":2}")["a"].integer() == 2);
  CHECK(Json::parse("[1e10]")[0].integer(-1) == -1);  // out of int range → fallback

  // Garbage: random bytes, and valid JSON with random damage. Must not crash.
  std::mt19937 rng(12345);
  const std::string base = w.str();
  int parsedOk = 0;
  for (int i = 0; i < 1000; ++i) {
    std::string g;
    if (i % 2 == 0) {
      const int len = static_cast<int>(rng() % 200);
      const char alphabet[] = "[]{}\",:\\u0123456789abcdeftrunl.-+eE \n\x01\xff";
      for (int k = 0; k < len; ++k) g += alphabet[rng() % (sizeof(alphabet) - 1)];
    } else {
      g = base;
      const int cuts = 1 + static_cast<int>(rng() % 5);
      for (int k = 0; k < cuts && !g.empty(); ++k) {
        const size_t at = rng() % g.size();
        switch (rng() % 3) {
          case 0: g.erase(at, 1 + rng() % 8); break;
          case 1: g[at] = static_cast<char>(rng() % 256); break;
          case 2: g.insert(at, 1, "[{\"\\,:"[rng() % 6]); break;
        }
      }
    }
    err.clear();
    const Json j = Json::parse(g, &err);
    if (err.empty()) ++parsedOk;
    else CHECK(j.isNull());
  }
  // Deep garbage must stop at the depth limit, not overflow the stack.
  CHECK(Json::parse(std::string(100000, '[')).isNull());

  std::printf("json_test: %d garbage inputs happened to be valid; %s\n", parsedOk, g_failed ? "FAILED" : "ok");
  return g_failed ? 1 : 0;
}
