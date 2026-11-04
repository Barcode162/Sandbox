// A place as a list in words → the world's place file (J118.1): see place_list.h.
#include "looped/words/place_list.h"

#include <cctype>
#include <regex>
#include <set>

namespace engine::words {

namespace {

// A value or a group, in the order the words give them.
struct Node {
  enum Kind { kRaw, kText, kList, kGroup } kind = kRaw;
  std::string raw;  // a number as written, yes → true; or the text
  std::vector<Node> list;
  std::vector<std::pair<std::string, Node>> group;
  Node* find(const std::string& k) {
    for (auto& [n, v] : group)
      if (n == k) return &v;
    return nullptr;
  }
  Node& at(const std::string& k, Kind made) {
    if (Node* n = find(k)) return *n;
    group.push_back({k, Node{}});
    group.back().second.kind = made;
    return group.back().second;
  }
};
Node raw(std::string s) { return Node{Node::kRaw, std::move(s), {}, {}}; }
Node text(std::string s) { return Node{Node::kText, std::move(s), {}, {}}; }

void write(const Node& n, std::string& o) {
  switch (n.kind) {
    case Node::kRaw: o += n.raw; break;
    case Node::kText:
      o += '"';
      for (char c : n.raw) {
        if (c == '"' || c == '\\') o += '\\', o += c;
        else if (c == '\n') o += "\\n";
        else o += c;
      }
      o += '"';
      break;
    case Node::kList:
      o += '[';
      for (size_t i = 0; i < n.list.size(); ++i) {
        if (i) o += ", ";
        write(n.list[i], o);
      }
      o += ']';
      break;
    case Node::kGroup:
      o += '{';
      for (size_t i = 0; i < n.group.size(); ++i) {
        if (i) o += ", ";
        write(text(n.group[i].first), o);
        o += ": ";
        write(n.group[i].second, o);
      }
      o += '}';
      break;
  }
}

bool isNumber(const std::string& s) {
  static const std::regex re(R"(^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?$)");
  return std::regex_match(s, re);
}
bool isBare(const std::string& s) {
  static const std::regex re(R"(^[A-Za-z_][A-Za-z0-9_.\-/]*$)");
  return std::regex_match(s, re);
}

// "the light grid" → "lightGrid".
std::string camel(const std::string& words) {
  std::string o;
  bool up = false;
  for (char c : words) {
    if (c == ' ') up = !o.empty();
    else o += up ? static_cast<char>(std::toupper(static_cast<unsigned char>(c))) : c, up = false;
  }
  return o;
}

std::string trim(std::string_view s) {
  size_t a = 0, b = s.size();
  while (a < b && s[a] == ' ') ++a;
  while (b > a && (s[b - 1] == ' ' || s[b - 1] == '\r')) --b;
  return std::string(s.substr(a, b - a));
}

// Splits at `sep` outside "quotes".
std::vector<std::string> split(const std::string& s, const std::string& sep) {
  std::vector<std::string> out;
  std::string cur;
  bool q = false;
  for (size_t i = 0; i < s.size(); ++i) {
    if (s[i] == '\\' && q && i + 1 < s.size()) {
      cur += s[i], cur += s[++i];
      continue;
    }
    if (s[i] == '"') q = !q;
    if (!q && s.compare(i, sep.size(), sep) == 0) {
      out.push_back(cur), cur.clear();
      i += sep.size() - 1;
      continue;
    }
    cur += s[i];
  }
  out.push_back(cur);
  return out;
}

struct Reader {
  const KindsOf& kindsOf;
  Problems& p;
  int line = 0;
  bool bad = false;

  void problem(const std::string& what, const std::string& hint = "") {
    p.push_back({line, 1, what, hint, false});
    bad = true;
  }

  // One value from its words (see place_list.h).
  Node value(const std::string& words) {
    std::vector<std::string> toks;
    for (const std::string& t : split(trim(words), " "))
      if (!t.empty()) toks.push_back(t);
    if (toks.empty()) return problem("a setting with no value"), raw("null");
    if (toks.size() == 1 && toks[0].size() >= 2 && toks[0].front() == '"' && toks[0].back() == '"') {
      std::string s;
      for (size_t i = 1; i + 1 < toks[0].size(); ++i) {
        if (toks[0][i] == '\\' && i + 2 < toks[0].size()) {
          const char c = toks[0][++i];
          s += c == 'n' ? '\n' : c;
        } else s += toks[0][i];
      }
      return text(s);
    }
    auto numbers = [&](const std::vector<std::string>& ts, Node& out) {
      for (const std::string& t : ts) {
        if (!isNumber(t)) return false;
        out.list.push_back(raw(t));
      }
      return true;
    };
    bool hasTo = false;
    for (const std::string& t : toks) hasTo |= t == "to";
    if (hasTo) {
      Node all{Node::kList, "", {}, {}};
      std::vector<std::string> cur;
      for (size_t i = 0; i <= toks.size(); ++i) {
        if (i == toks.size() || toks[i] == "to") {
          Node one{Node::kList, "", {}, {}};
          if (cur.empty() || !numbers(cur, one)) return problem("`to` joins lists of numbers: `" + trim(words) + "`"), raw("null");
          all.list.push_back(one), cur.clear();
        } else cur.push_back(toks[i]);
      }
      return all;
    }
    Node nums{Node::kList, "", {}, {}};
    if (numbers(toks, nums)) return toks.size() == 1 ? nums.list[0] : nums;
    if (toks.size() == 1 && (toks[0] == "yes" || toks[0] == "no")) return raw(toks[0] == "yes" ? "true" : "false");
    bool bare = true;
    for (const std::string& t : toks) bare &= isBare(t);
    if (bare) {
      if (toks.size() == 1) return text(toks[0]);
      Node names{Node::kList, "", {}, {}};
      for (const std::string& t : toks) names.list.push_back(text(t));
      return names;
    }
    problem("can't read the value `" + trim(words) + "`", "numbers, yes / no, a bare word or \"quoted text\"");
    return raw("null");
  }

  // `key value, key value` → a group.
  Node pairs(const std::string& words) {
    Node g{Node::kGroup, "", {}, {}};
    for (const std::string& piece : split(words, ", ")) {
      const std::string t = trim(piece);
      const size_t sp = t.find(' ');
      if (sp == std::string::npos) {
        problem("`" + t + "` has no value", "a setting is its name and its value: `lumens 180`");
        continue;
      }
      const std::string key = t.substr(0, sp);
      if (g.find(key)) problem("`" + key + "` is set twice");
      g.group.push_back({key, value(t.substr(sp + 1))});
    }
    return g;
  }

  // The kind the words name (bar stool → bar_stool), among the place's kinds.
  std::string kind(const std::string& words, const std::set<std::string>& kinds) {
    if (words.rfind("thing of kind ", 0) == 0) {
      const std::string k = trim(words.substr(14));
      if (!kinds.count(k)) problem("no kind `" + k + "` in the place's kind files");
      return k;
    }
    std::string a = words, b = words;
    for (char& c : a)
      if (c == ' ') c = '_';
    for (char& c : b)
      if (c == ' ') c = '-';
    const bool ha = kinds.count(a) > 0, hb = kinds.count(b) > 0;
    if (ha && hb && a != b) problem("`" + words + "` could be the kind " + a + " or " + b, "say `a thing of kind " + a + "`");
    if (!ha && !hb) problem("no kind called `" + words + "` in the place's kind files", "the kind's id with spaces: bar_stool → bar stool");
    return ha ? a : b;
  }
};

}  // namespace

bool isPlaceList(std::string_view text) {
  for (const std::string& l : split(std::string(text), "\n"))
    if (trim(l).rfind("kinds from ", 0) == 0) return true;
  return false;
}

bool placeListToJson(std::string_view source, const std::string& id, const KindsOf& kindsOf, std::string& json, int& thingCount,
                     Problems& p) {
  Reader r{kindsOf, p};
  Node top{Node::kGroup, "", {}, {}};
  top.group.push_back({"id", text(id)});
  std::vector<Node> things;
  std::set<std::string> kinds;
  std::map<std::string, int> count;
  std::set<std::string> ids;
  std::vector<std::pair<std::string, int>> held;  // `held by` names, and their lines
  int topIndent = -1;
  bool placed = false;
  const std::vector<std::string> lines = split(std::string(source), "\n");
  for (size_t li = 0; li < lines.size(); ++li) {
    r.line = static_cast<int>(li) + 1;
    const std::string& full = lines[li];
    const std::string t = trim(full);
    if (t.empty() || t[0] == '#') continue;
    int indent = 0;
    while (indent < static_cast<int>(full.size()) && full[indent] == ' ') ++indent;
    if (!placed) {
      if (t.rfind("place ", 0) != 0) {
        r.problem("a place starts with `place <its name>`");
        break;
      }
      placed = true;
      continue;
    }
    if (topIndent < 0) topIndent = indent;
    if (indent > topIndent) {  // a part of the thing above
      if (things.empty()) {
        r.problem("an indented line belongs under a thing");
        continue;
      }
      Node& parts = things.back().at("parts", Node::kGroup);
      const size_t colon = t.find(": ");
      if (colon == std::string::npos) {
        r.problem("a part's line is `its <part>: <settings>` or `a <part>: <settings>`");
        continue;
      }
      const std::string head = t.substr(0, colon);
      if (head.rfind("its ", 0) == 0) {
        const std::string key = camel(head.substr(4));
        if (parts.find(key)) r.problem("its " + head.substr(4) + " is set twice");
        parts.group.push_back({key, r.pairs(t.substr(colon + 2))});
      } else if (head.rfind("a ", 0) == 0 || head.rfind("an ", 0) == 0) {
        const std::string key = camel(head.substr(head.find(' ') + 1)) + "s";
        parts.at(key, Node::kList).list.push_back(r.pairs(t.substr(colon + 2)));
      } else r.problem("a part's line is `its <part>: <settings>` or `a <part>: <settings>`");
      continue;
    }
    if (indent < topIndent) {
      r.problem("this line is less indented than the place's lines");
      continue;
    }
    // The place's own lines.
    if (t.rfind("about: ", 0) == 0) {
      top.group.push_back({"about", text(t.substr(7))});
      continue;
    }
    if (t.rfind("kinds from ", 0) == 0) {
      const std::string f = trim(t.substr(11));
      top.at("kinds", Node::kList).list.push_back(text(f));
      const std::vector<std::string> ks = kindsOf(f);
      if (ks.empty()) r.problem("the kind file `" + f + "` has no kinds (or isn't there)");
      kinds.insert(ks.begin(), ks.end());
      continue;
    }
    if (t.rfind("you come in at ", 0) == 0) {
      const std::vector<std::string> bits = split(t.substr(15), ", facing ");
      if (bits.size() != 2) {
        r.problem("`you come in at x y z, facing <degrees>`");
        continue;
      }
      Node s{Node::kGroup, "", {}, {}};
      s.group.push_back({"at", r.value(bits[0])});
      s.group.push_back({"yaw", r.value(bits[1])});
      top.group.push_back({"spawn", s});
      continue;
    }
    if (t.rfind("a point ", 0) == 0) {
      const size_t at = t.find(" at ");
      if (at == std::string::npos) {
        r.problem("`a point <name> at x y z`");
        continue;
      }
      top.at("points", Node::kGroup).group.push_back({trim(t.substr(8, at - 8)), r.value(t.substr(at + 4))});
      continue;
    }
    if (t.rfind("an area ", 0) == 0 && t.find(": ") != std::string::npos) {
      const size_t colon = t.find(": ");
      top.at("areas", Node::kGroup).group.push_back({trim(t.substr(8, colon - 8)), r.pairs(t.substr(colon + 2))});
      continue;
    }
    const size_t colon = t.find(": ");
    const size_t at = t.find(" at ");
    if (colon != std::string::npos && (at == std::string::npos || colon < at)) {  // a setting group, or one more of a list
      const std::string head = t.substr(0, colon);
      if (head.rfind("the ", 0) == 0) top.group.push_back({camel(head.substr(4)), r.pairs(t.substr(colon + 2))});
      else if (head.rfind("a ", 0) == 0 || head.rfind("an ", 0) == 0)
        top.at(camel(head.substr(head.find(' ') + 1)) + "s", Node::kList).list.push_back(r.pairs(t.substr(colon + 2)));
      else r.problem("a place's setting is `the <name>: …` or `a <name>: …`");
      continue;
    }
    // A thing.
    const bool the = t.rfind("the ", 0) == 0;
    if (at == std::string::npos || !(the || t.rfind("a ", 0) == 0 || t.rfind("an ", 0) == 0)) {
      r.problem("can't read this line", "a thing is `a <kind> at x y z`, …");
      continue;
    }
    const std::string kindWords = trim(t.substr(t.find(' ') + 1, at - t.find(' ') - 1));
    const std::string k = r.kind(kindWords, kinds);
    const int n = ++count[k];
    std::vector<std::string> bits = split(t.substr(at + 4), ", ");
    Node thing{Node::kGroup, "", {}, {}};
    std::string tid = the ? k : k + "-" + std::to_string(n);
    Node parts{Node::kGroup, "", {}, {}};
    std::string parent;
    std::vector<std::pair<std::string, Node>> extra;
    for (size_t i = 1; i < bits.size(); ++i) {
      const std::string b = trim(bits[i]);
      if (b.rfind("turned ", 0) == 0) extra.push_back({"turn", r.value(b.substr(7))});
      else if (b.rfind("scaled ", 0) == 0) extra.push_back({"scale", r.value(b.substr(7))});
      else if (b.rfind("called ", 0) == 0) tid = trim(b.substr(7));
      else if (b.rfind("held by ", 0) == 0) parent = trim(b.substr(8));
      else if (b.rfind("made of ", 0) == 0) {
        const std::vector<std::string> mi = split(b.substr(8), " in ");
        if (mi.size() != 2) {
          r.problem("`made of <model file> in <material>`");
          continue;
        }
        Node m{Node::kGroup, "", {}, {}};
        m.group.push_back({"file", text(trim(mi[0]))});
        m.group.push_back({"material", text(trim(mi[1]))});
        parts.group.push_back({"model", m});
      } else r.problem("can't read `" + b + "`", "turned, scaled, made of, called or held by");
    }
    if (!ids.insert(tid).second) r.problem("two things are called `" + tid + "`");
    thing.group.push_back({"id", text(tid)});
    thing.group.push_back({"kind", text(k)});
    thing.group.push_back({"at", r.value(bits[0])});
    for (auto& e : extra) thing.group.push_back(e);
    if (!parent.empty()) thing.group.push_back({"parent", text(parent)}), held.push_back({parent, r.line});
    if (!parts.group.empty()) thing.group.push_back({"parts", parts});
    things.push_back(thing);
  }
  for (const auto& [name, at] : held)  // `held by` names a thing in the place
    if (!ids.count(name)) r.line = at, r.problem("`held by " + name + "`: no thing is called that");
  if (!placed) r.problem("a place starts with `place <its name>`");
  if (r.bad) return false;
  json = "{\n";
  for (const auto& [k, v] : top.group) {
    json += "  ";
    write(text(k), json);
    json += ": ";
    write(v, json);
    json += ",\n";
  }
  json += "  \"things\": [\n";
  for (size_t i = 0; i < things.size(); ++i) {
    json += "    ";
    write(things[i], json);
    json += i + 1 < things.size() ? ",\n" : "\n";
  }
  json += "  ]\n}\n";
  thingCount = static_cast<int>(things.size());
  return true;
}

}  // namespace engine::words
