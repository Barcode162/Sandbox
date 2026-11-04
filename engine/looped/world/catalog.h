#pragma once
// The catalog (docs/archive/ENGINE.md E7.4): every kind you could own, with a name,
// a category, a price in credits and whether it can be traded. Homes, the
// mall and the VIP shop all read the same list (assets/world/catalog.json).
#include <string>
#include <string_view>
#include <vector>

namespace engine::world {

struct CatalogItem {
  std::string kind, name, category, about;
  int price = 0;  // credits
  bool tradeable = false;
};

// Reads {"items": [{"kind", "name", "category", "price", "tradeable", "about"}]}.
// Problems (no kind, a price under 1, a kind listed twice) go to `error`.
std::vector<CatalogItem> parseCatalog(std::string_view text, std::string* error);

}  // namespace engine::world
