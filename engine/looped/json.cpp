#include "looped/json.h"

#include <charconv>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace engine {

namespace {
const Json kNullJson;
}  // namespace

class JsonParser {
 public:
  JsonParser(std::string_view text, JsonLimits limits) : s_(text), limits_(limits) {}

  bool parseDocument(Json& out) {
    if (!parseValue(out, 0)) return false;
    skipSpace();
    return pos_ == s_.size() || fail("extra text after the end");
  }
  const std::string& error() const { return error_; }

 private:
  bool fail(const char* what) {
    if (error_.empty()) error_ = std::string(what) + " at byte " + std::to_string(pos_);
    return false;
  }
  void skipSpace() {
    while (pos_ < s_.size() && (s_[pos_] == ' ' || s_[pos_] == '\n' || s_[pos_] == '\r' || s_[pos_] == '\t')) ++pos_;
  }
  bool literal(std::string_view word) {
    if (s_.substr(pos_, word.size()) != word) return fail("unknown word");
    pos_ += word.size();
    return true;
  }

  bool parseValue(Json& out, int depth) {
    if (depth >= limits_.maxDepth) return fail("nested too deeply");
    skipSpace();
    if (pos_ >= s_.size()) return fail("unexpected end");
    const char c = s_[pos_];
    if (c == '{') return parseObject(out, depth);
    if (c == '[') return parseArray(out, depth);
    if (c == '"') {
      out.type_ = Json::Type::kString;
      return parseString(out.string_);
    }
    if (c == 't' || c == 'f') {
      out.type_ = Json::Type::kBool;
      out.bool_ = c == 't';
      return literal(c == 't' ? "true" : "false");
    }
    if (c == 'n') return literal("null");
    return parseNumber(out);
  }

  bool parseNumber(Json& out) {
    const size_t start = pos_;
    while (pos_ < s_.size() && std::string_view("+-0123456789.eE").find(s_[pos_]) != std::string_view::npos) ++pos_;
    if (pos_ == start) return fail("unexpected character");
    if (pos_ - start > 64) return fail("bad number");
    const std::string digits(s_.substr(start, pos_ - start));
    char* end = nullptr;
    out.number_ = std::strtod(digits.c_str(), &end);
    if (end != digits.c_str() + digits.size() || !std::isfinite(out.number_)) return fail("bad number");
    out.type_ = Json::Type::kNumber;
    return true;
  }

  static void appendUtf8(std::string& out, uint32_t cp) {
    if (cp < 0x80) {
      out += static_cast<char>(cp);
    } else if (cp < 0x800) {
      out += static_cast<char>(0xC0 | (cp >> 6));
      out += static_cast<char>(0x80 | (cp & 0x3F));
    } else if (cp < 0x10000) {
      out += static_cast<char>(0xE0 | (cp >> 12));
      out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
      out += static_cast<char>(0x80 | (cp & 0x3F));
    } else {
      out += static_cast<char>(0xF0 | (cp >> 18));
      out += static_cast<char>(0x80 | ((cp >> 12) & 0x3F));
      out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
      out += static_cast<char>(0x80 | (cp & 0x3F));
    }
  }

  bool parseHex4(uint32_t& out) {
    if (pos_ + 4 > s_.size()) return fail("bad escape");
    out = 0;
    for (int i = 0; i < 4; ++i) {
      const char h = s_[pos_++];
      out <<= 4;
      if (h >= '0' && h <= '9') out |= static_cast<uint32_t>(h - '0');
      else if (h >= 'a' && h <= 'f') out |= static_cast<uint32_t>(h - 'a' + 10);
      else if (h >= 'A' && h <= 'F') out |= static_cast<uint32_t>(h - 'A' + 10);
      else return fail("bad escape");
    }
    return true;
  }

  bool parseString(std::string& out) {
    ++pos_;  // opening quote
    while (pos_ < s_.size()) {
      const char c = s_[pos_++];
      if (c == '"') return true;
      if (out.size() >= limits_.maxString) return fail("string too long");
      if (c != '\\') {
        if (static_cast<unsigned char>(c) < 0x20) return fail("control character in a string");
        out += c;
        continue;
      }
      if (pos_ >= s_.size()) break;
      const char e = s_[pos_++];
      switch (e) {
        case '"': out += '"'; break;
        case '\\': out += '\\'; break;
        case '/': out += '/'; break;
        case 'b': out += '\b'; break;
        case 'f': out += '\f'; break;
        case 'n': out += '\n'; break;
        case 'r': out += '\r'; break;
        case 't': out += '\t'; break;
        case 'u': {
          uint32_t cp;
          if (!parseHex4(cp)) return false;
          if (cp >= 0xD800 && cp < 0xDC00) {  // surrogate pair
            uint32_t low = 0;
            if (s_.substr(pos_, 2) != "\\u") return fail("lone surrogate");
            pos_ += 2;
            if (!parseHex4(low)) return false;
            if (low < 0xDC00 || low > 0xDFFF) return fail("lone surrogate");
            cp = 0x10000 + ((cp - 0xD800) << 10) + (low - 0xDC00);
          } else if (cp >= 0xDC00 && cp <= 0xDFFF) {
            return fail("lone surrogate");
          }
          appendUtf8(out, cp);
          break;
        }
        default: return fail("bad escape");
      }
    }
    return fail("unterminated string");
  }

  bool parseArray(Json& out, int depth) {
    ++pos_;
    out.type_ = Json::Type::kArray;
    skipSpace();
    if (pos_ < s_.size() && s_[pos_] == ']') {
      ++pos_;
      return true;
    }
    while (true) {
      out.array_.emplace_back();
      if (!parseValue(out.array_.back(), depth + 1)) return false;
      skipSpace();
      if (pos_ >= s_.size()) return fail("unterminated array");
      const char c = s_[pos_++];
      if (c == ']') return true;
      if (c != ',') return fail("expected , or ]");
    }
  }

  bool parseObject(Json& out, int depth) {
    ++pos_;
    out.type_ = Json::Type::kObject;
    skipSpace();
    if (pos_ < s_.size() && s_[pos_] == '}') {
      ++pos_;
      return true;
    }
    while (true) {
      skipSpace();
      if (pos_ >= s_.size() || s_[pos_] != '"') return fail("expected a key");
      std::string key;
      if (!parseString(key)) return false;
      skipSpace();
      if (pos_ >= s_.size() || s_[pos_++] != ':') return fail("expected :");
      // A repeated key: the last one wins (like JavaScript).
      Json* slot = nullptr;
      for (auto& m : out.object_) {
        if (m.first == key) slot = &m.second;
      }
      if (!slot) {
        out.object_.emplace_back(std::move(key), Json());
        slot = &out.object_.back().second;
      } else {
        *slot = Json();
      }
      if (!parseValue(*slot, depth + 1)) return false;
      skipSpace();
      if (pos_ >= s_.size()) return fail("unterminated object");
      const char c = s_[pos_++];
      if (c == '}') return true;
      if (c != ',') return fail("expected , or }");
    }
  }

  std::string_view s_;
  JsonLimits limits_;
  size_t pos_ = 0;
  std::string error_;
};

Json Json::parse(std::string_view text, std::string* error, JsonLimits limits) {
  JsonParser parser(text, limits);
  Json out;
  if (!parser.parseDocument(out)) {
    if (error) *error = parser.error();
    return Json();
  }
  return out;
}

int Json::integer(int fallback) const {
  if (type_ != Type::kNumber) return fallback;
  if (!(number_ > -2147483648.0 && number_ < 2147483648.0)) return fallback;  // also NaN
  return static_cast<int>(number_);
}

bool Json::has(std::string_view key) const {
  for (const auto& m : object_) {
    if (m.first == key) return true;
  }
  return false;
}

const Json& Json::operator[](size_t i) const { return i < array_.size() ? array_[i] : kNullJson; }

const Json& Json::operator[](std::string_view key) const {
  for (const auto& m : object_) {
    if (m.first == key) return m.second;
  }
  return kNullJson;
}

std::string jsonQuote(std::string_view text) {
  std::string out;
  out.reserve(text.size() + 2);
  out += '"';
  for (const char ch : text) {
    const auto c = static_cast<unsigned char>(ch);
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buf[8];
          std::snprintf(buf, sizeof(buf), "\\u%04x", c);
          out += buf;
        } else {
          out += ch;
        }
    }
  }
  out += '"';
  return out;
}

void JsonWriter::separate() {
  if (afterKey_) {
    afterKey_ = false;
    return;
  }
  if (!first_.empty()) {
    if (!first_.back()) out_ += ',';
    first_.back() = false;
  }
}

JsonWriter& JsonWriter::open(char c) {
  separate();
  out_ += c;
  first_.push_back(true);
  return *this;
}

JsonWriter& JsonWriter::close(char c) {
  out_ += c;
  if (!first_.empty()) first_.pop_back();
  return *this;
}

JsonWriter& JsonWriter::key(std::string_view k) {
  separate();
  out_ += jsonQuote(k);
  out_ += ':';
  afterKey_ = true;
  return *this;
}

JsonWriter& JsonWriter::value(std::string_view s) {
  separate();
  out_ += jsonQuote(s);
  return *this;
}

JsonWriter& JsonWriter::value(double d) {
  if (!std::isfinite(d)) return null();  // JSON has no NaN or infinity
  separate();
  char buf[32];
  const auto r = std::to_chars(buf, buf + sizeof(buf), d);
  out_.append(buf, r.ptr);
  return *this;
}

JsonWriter& JsonWriter::raw(std::string_view json) {
  separate();
  out_ += json;
  return *this;
}

JsonWriter& JsonWriter::value(int i) {
  separate();
  out_ += std::to_string(i);
  return *this;
}

JsonWriter& JsonWriter::value(bool b) {
  separate();
  out_ += b ? "true" : "false";
  return *this;
}

JsonWriter& JsonWriter::null() {
  separate();
  out_ += "null";
  return *this;
}

namespace {
void dumpInto(const Json& v, JsonWriter& w) {
  switch (v.type()) {
    case Json::Type::kNull: w.null(); break;
    case Json::Type::kBool: w.value(v.boolean()); break;
    case Json::Type::kNumber: w.value(v.number()); break;
    case Json::Type::kString: w.value(v.string()); break;
    case Json::Type::kArray:
      w.beginArray();
      for (const Json& x : v.items()) dumpInto(x, w);
      w.endArray();
      break;
    case Json::Type::kObject:
      w.beginObject();
      for (const auto& m : v.members()) {
        w.key(m.first);
        dumpInto(m.second, w);
      }
      w.endObject();
      break;
  }
}
}  // namespace

std::string jsonDump(const Json& value) {
  JsonWriter w;
  dumpInto(value, w);
  return w.take();
}

}  // namespace engine
