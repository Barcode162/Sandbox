#pragma once
// A small JSON reader and writer.
//
// Reading parses the whole text into a tree of values; lookups on missing
// keys return a null value, so optional fields can be read without checks:
// `v["a"]["b"].number(1)`. Text from the network is untrusted, so parsing
// has limits (nesting depth, string length) and never crashes on garbage:
// it returns a null value and an error instead.
//
// Writing goes through JsonWriter, which escapes strings properly (quotes,
// backslashes, control characters), so text like a file name can't break
// the message.
#include <cstddef>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

namespace engine {

struct JsonLimits {
  int maxDepth = 32;           // arrays/objects inside each other
  size_t maxString = 4096;     // bytes per string (after unescaping)
};

class Json {
 public:
  enum class Type { kNull, kBool, kNumber, kString, kArray, kObject };

  // Returns a null value (and sets `error`) if the text isn't valid JSON or
  // goes past the limits.
  static Json parse(std::string_view text, std::string* error = nullptr, JsonLimits limits = {});

  Type type() const { return type_; }
  bool isNull() const { return type_ == Type::kNull; }
  bool isObject() const { return type_ == Type::kObject; }
  bool isArray() const { return type_ == Type::kArray; }
  bool isString() const { return type_ == Type::kString; }
  bool isNumber() const { return type_ == Type::kNumber; }
  bool has(std::string_view key) const;

  double number(double fallback = 0) const { return type_ == Type::kNumber ? number_ : fallback; }
  int integer(int fallback = 0) const;
  bool boolean(bool fallback = false) const { return type_ == Type::kBool ? bool_ : fallback; }
  const std::string& string() const { return string_; }

  // Arrays.
  size_t size() const { return array_.size(); }
  const Json& operator[](size_t i) const;
  const Json& operator[](int i) const { return i < 0 ? (*this)[size()] : (*this)[static_cast<size_t>(i)]; }
  const std::vector<Json>& items() const { return array_; }
  // Objects (keys in the order they appeared).
  const Json& operator[](std::string_view key) const;
  const Json& operator[](const char* key) const { return (*this)[std::string_view(key)]; }
  const Json& operator[](const std::string& key) const { return (*this)[std::string_view(key)]; }
  const std::vector<std::pair<std::string, Json>>& members() const { return object_; }

 private:
  friend class JsonParser;
  Type type_ = Type::kNull;
  bool bool_ = false;
  double number_ = 0;
  std::string string_;
  std::vector<Json> array_;
  std::vector<std::pair<std::string, Json>> object_;
};

// `text` as a JSON string literal, quotes included.
std::string jsonQuote(std::string_view text);

// A parsed value written back as compact JSON text.
std::string jsonDump(const Json& value);

// Builds JSON text: commas and escaping are handled here.
//   JsonWriter w; w.beginObject().key("look").value(3).key("songs").beginArray();
//   for (...) w.value(title);
//   w.endArray().endObject();  → w.str()
class JsonWriter {
 public:
  JsonWriter& beginObject() { return open('{'); }
  JsonWriter& endObject() { return close('}'); }
  JsonWriter& beginArray() { return open('['); }
  JsonWriter& endArray() { return close(']'); }
  JsonWriter& key(std::string_view k);
  JsonWriter& value(std::string_view s);
  JsonWriter& value(const char* s) { return value(std::string_view(s)); }
  JsonWriter& value(const std::string& s) { return value(std::string_view(s)); }
  JsonWriter& value(double d);
  JsonWriter& value(int i);
  JsonWriter& value(bool b);
  JsonWriter& null();
  // Already-written JSON, put in as one value.
  JsonWriter& raw(std::string_view json);
  const std::string& str() const { return out_; }
  std::string take() { return std::move(out_); }

 private:
  JsonWriter& open(char c);
  JsonWriter& close(char c);
  void separate();
  std::string out_;
  std::vector<bool> first_;  // per open array/object: nothing written in it yet
  bool afterKey_ = false;
};

}  // namespace engine
