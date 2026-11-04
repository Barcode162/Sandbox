#include "looped/world/catalog.h"

#include <set>

#include "looped/json.h"

namespace engine::world {

std::vector<CatalogItem> parseCatalog(std::string_view text, std::string* error) {
  std::vector<CatalogItem> out;
  std::string err;
  const Json root = Json::parse(text, &err, {16, 1 << 14});
  if (!root.isObject()) {
    if (error) *error += "catalog: " + (err.empty() ? std::string("not a catalog") : err) + "\n";
    return out;
  }
  std::set<std::string> seen;
  for (const Json& j : root["items"].items()) {
    CatalogItem it;
    it.kind = j["kind"].string();
    it.name = j["name"].string();
    it.category = j["category"].string();
    it.about = j["about"].string();
    it.price = j["price"].integer(0);
    it.tradeable = j["tradeable"].boolean(false);
    if (it.kind.empty() || it.price < 1 || !seen.insert(it.kind).second) {
      if (error) *error += "catalog: item \"" + it.kind + "\" needs a kind of its own and a price of at least 1\n";
      continue;
    }
    out.push_back(std::move(it));
  }
  return out;
}

}  // namespace engine::world
