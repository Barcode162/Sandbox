// Detail where it's seen (J116.6): see clusters.h.
#include "looped/draw/clusters.h"

#include <algorithm>
#include <array>
#include <tuple>
#include <cmath>
#include <cstring>
#include <queue>
#include <unordered_map>
#include <unordered_set>

namespace engine::draw {

namespace {

using Tri = std::array<uint32_t, 3>;

uint64_t posKey(Vec3 p) {
  uint32_t x, y, z;
  std::memcpy(&x, &p.x, 4);
  std::memcpy(&y, &p.y, 4);
  std::memcpy(&z, &p.z, 4);
  return (static_cast<uint64_t>(x) * 73856093ull) ^ (static_cast<uint64_t>(y) * 19349663ull << 1) ^ (static_cast<uint64_t>(z) * 83492791ull << 2);
}

// Every corner's "place" (corners at the same position share one), and which corners are on a seam.
struct Places {
  std::vector<uint32_t> of;     // corner → place
  std::vector<uint8_t> seam;    // corner: 1 = shares its place with another corner
};

Places places(const std::vector<Vec3>& pos) {
  Places P;
  P.of.resize(pos.size());
  P.seam.assign(pos.size(), 0);
  std::unordered_map<uint64_t, std::vector<uint32_t>> byKey;
  std::vector<uint32_t> first;  // place → its first corner
  for (uint32_t i = 0; i < pos.size(); ++i) {
    auto& list = byKey[posKey(pos[i])];
    uint32_t place = UINT32_MAX;
    for (uint32_t pl : list)
      if (pos[first[pl]].x == pos[i].x && pos[first[pl]].y == pos[i].y && pos[first[pl]].z == pos[i].z) place = pl;
    if (place == UINT32_MAX) {
      place = static_cast<uint32_t>(first.size());
      first.push_back(i);
      list.push_back(place);
    } else {
      P.seam[i] = 1;
      P.seam[first[place]] = 1;
    }
    P.of[i] = place;
  }
  return P;
}

Vec3 centroid(const std::vector<Vec3>& pos, const Tri& t) { return (pos[t[0]] + pos[t[1]] + pos[t[2]]) * (1.0f / 3); }

uint32_t spread(uint32_t x) {  // 10 bits → every third bit (Morton order)
  x &= 1023;
  x = (x | (x << 16)) & 0x030000FF;
  x = (x | (x << 8)) & 0x0300F00F;
  x = (x | (x << 4)) & 0x030C30C3;
  x = (x | (x << 2)) & 0x09249249;
  return x;
}

// Bounding sphere of points (Ritter: a quick, slightly loose one).
void sphereOf(const std::vector<Vec3>& pts, Vec3* c, float* r) {
  if (pts.empty()) {
    *c = {}, *r = 0;
    return;
  }
  Vec3 a = pts[0], b = a;
  for (const Vec3& p : pts)
    if (length(p - a) > length(b - a)) b = p;
  Vec3 d = b;
  for (const Vec3& p : pts)
    if (length(p - b) > length(d - b)) d = p;
  Vec3 cc = (b + d) * 0.5f;
  float rr = length(d - b) * 0.5f;
  for (const Vec3& p : pts) {
    const float k = length(p - cc);
    if (k > rr) {
      const float nr = (rr + k) * 0.5f;
      cc = cc + (p - cc) * ((nr - rr) / k);
      rr = nr;
    }
  }
  *c = cc, *r = rr;
}

// A sphere around spheres.
void sphereOfSpheres(const std::vector<std::pair<Vec3, float>>& s, Vec3* c, float* r) {
  Vec3 cc = s[0].first;
  float rr = s[0].second;
  for (const auto& [sc, sr] : s) {
    const float d = length(sc - cc);
    if (d + sr <= rr) continue;
    if (d + rr <= sr) {
      cc = sc, rr = sr;
      continue;
    }
    const float nr = (d + rr + sr) * 0.5f;
    cc = cc + (sc - cc) * ((nr - rr) / std::max(d, 1e-12f));
    rr = nr;
  }
  *c = cc, *r = rr;
}

// Triangles cut into clusters of at most `most` that touch (by place), grown outward from a seed in Morton order.
std::vector<std::vector<uint32_t>> partition(const std::vector<Vec3>& pos, const Places& P, const std::vector<Tri>& tris, int most) {
  const size_t n = tris.size();
  std::unordered_map<uint32_t, std::vector<uint32_t>> byPlace;
  for (uint32_t t = 0; t < n; ++t)
    for (uint32_t v : tris[t]) byPlace[P.of[v]].push_back(t);
  Vec3 lo{1e30f, 1e30f, 1e30f}, hi{-1e30f, -1e30f, -1e30f};
  std::vector<Vec3> mid(n);
  for (size_t t = 0; t < n; ++t) mid[t] = centroid(pos, tris[t]), lo = minComponents(lo, mid[t]), hi = maxComponents(hi, mid[t]);
  const Vec3 ext = maxComponents(hi - lo, {1e-9f, 1e-9f, 1e-9f});
  std::vector<std::pair<uint32_t, uint32_t>> order(n);
  for (uint32_t t = 0; t < n; ++t) {
    const Vec3 q = (mid[t] - lo);
    order[t] = {spread(static_cast<uint32_t>(q.x / ext.x * 1023)) | spread(static_cast<uint32_t>(q.y / ext.y * 1023)) << 1 |
                    spread(static_cast<uint32_t>(q.z / ext.z * 1023)) << 2,
                t};
  }
  std::sort(order.begin(), order.end());
  std::vector<uint8_t> used(n, 0);
  std::vector<std::vector<uint32_t>> out;
  size_t next = 0;
  while (true) {
    while (next < n && used[order[next].second]) ++next;
    if (next >= n) break;
    std::vector<uint32_t> c;
    Vec3 sum;
    using Item = std::pair<float, uint32_t>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> frontier;
    auto take = [&](uint32_t t) {
      used[t] = 1;
      c.push_back(t);
      sum = sum + mid[t];
      const Vec3 cc = sum * (1.0f / static_cast<float>(c.size()));
      for (uint32_t v : tris[t])
        for (uint32_t u : byPlace[P.of[v]])
          if (!used[u]) frontier.push({length(mid[u] - cc), u});
    };
    take(order[next].second);
    size_t scan = next;
    while (static_cast<int>(c.size()) < most) {
      if (!frontier.empty()) {
        const uint32_t t = frontier.top().second;
        frontier.pop();
        if (!used[t]) take(t);
        continue;
      }
      // Nothing touching left (a shelf of separate books): the next loose
      // triangle nearby (in Morton order) joins, so loose pieces share clusters.
      while (scan < n && used[order[scan].second]) ++scan;
      if (scan >= n) break;
      take(order[scan].second);
    }
    out.push_back(std::move(c));
  }
  return out;
}

// ---- Simplifying a group: half-edge collapses by quadric error, the outline and seams locked ----

struct Quadric {
  double a[10] = {};  // symmetric 4x4: xx xy xz xw yy yz yw zz zw ww
  void addPlane(double nx, double ny, double nz, double d, double w) {
    const double p[4] = {nx, ny, nz, d};
    int k = 0;
    for (int i = 0; i < 4; ++i)
      for (int j = i; j < 4; ++j) a[k++] += w * p[i] * p[j];
  }
  double at(Vec3 v) const {
    const double x = v.x, y = v.y, z = v.z;
    return a[0] * x * x + 2 * a[1] * x * y + 2 * a[2] * x * z + 2 * a[3] * x + a[4] * y * y + 2 * a[5] * y * z + 2 * a[6] * y + a[7] * z * z +
           2 * a[8] * z + a[9];
  }
  Quadric operator+(const Quadric& o) const {
    Quadric q;
    for (int i = 0; i < 10; ++i) q.a[i] = a[i] + o.a[i];
    return q;
  }
};

uint64_t edgeKey(uint32_t a, uint32_t b) { return a < b ? (static_cast<uint64_t>(a) << 32 | b) : (static_cast<uint64_t>(b) << 32 | a); }

// Simplifies `tris` (corner numbers) toward `target` triangles by moving
// places (positions) onto neighbouring places. A place with one corner moves
// freely; a place on a seam (two or more corners: a texture edge, a hard
// edge) only slides along its seam onto the next seam place, every corner
// moving onto its partner there, so colours and light-texture places stay
// whole; where seams meet, and on the group's outline, nothing moves.
// `tris` is replaced.
void simplify(const std::vector<Vec3>& pos, const Places& P, std::vector<Tri>& tris, size_t target, const std::unordered_set<uint32_t>& alsoLocked,
              float pruneUpTo) {
  // Local places.
  std::unordered_map<uint32_t, uint32_t> lp;
  std::vector<Vec3> ppos;
  std::vector<uint32_t> global;
  auto placeOf = [&](uint32_t corner) {
    const uint32_t g = P.of[corner];
    auto it = lp.find(g);
    if (it == lp.end()) {
      it = lp.emplace(g, static_cast<uint32_t>(ppos.size())).first;
      ppos.push_back(pos[corner]);
      global.push_back(g);
    }
    return it->second;
  };
  std::vector<std::array<uint32_t, 3>> tp(tris.size());  // per triangle: its places
  for (size_t t = 0; t < tris.size(); ++t)
    for (int k = 0; k < 3; ++k) tp[t][k] = placeOf(tris[t][k]);
  const size_t np = ppos.size();
  // Edges between places: how many triangles use each, and whether it's a seam (its corners differ across it).
  struct EdgeInfo {
    int uses = 0;
    uint32_t ca = UINT32_MAX, cb = UINT32_MAX;  // the corners seen at its lower / higher place
    bool seam = false;
  };
  std::unordered_map<uint64_t, EdgeInfo> edges;
  for (size_t t = 0; t < tris.size(); ++t)
    for (int k = 0; k < 3; ++k) {
      uint32_t pa = tp[t][k], pb = tp[t][(k + 1) % 3], ca = tris[t][k], cb = tris[t][(k + 1) % 3];
      if (pa > pb) std::swap(pa, pb), std::swap(ca, cb);
      EdgeInfo& e = edges[edgeKey(pa, pb)];
      ++e.uses;
      if (e.ca == UINT32_MAX) e.ca = ca, e.cb = cb;
      else if (e.ca != ca || e.cb != cb) e.seam = true;
    }
  std::vector<int> seamDegree(np, 0);
  std::vector<uint8_t> locked(np, 0);
  for (const auto& [k, e] : edges) {
    const uint32_t pa = static_cast<uint32_t>(k >> 32), pb = static_cast<uint32_t>(k & 0xFFFFFFFFu);
    if (e.uses == 1) locked[pa] = locked[pb] = 1;  // the outline (or the model's own open edge)
    if (e.seam || e.uses > 2) ++seamDegree[pa], ++seamDegree[pb];
    if (e.uses > 2) locked[pa] = locked[pb] = 1;
  }
  std::vector<int> cornersAt(np, 0);
  {
    std::unordered_map<uint32_t, std::unordered_set<uint32_t>> cs;
    for (size_t t = 0; t < tris.size(); ++t)
      for (int k = 0; k < 3; ++k) cs[tp[t][k]].insert(tris[t][k]);
    for (const auto& [pl, set] : cs) cornersAt[pl] = static_cast<int>(set.size());
  }
  std::vector<uint8_t> outline(np, 0);  // shared with another group (or frozen): a part with any of it is never removed
  for (size_t i = 0; i < np; ++i)
    if (alsoLocked.count(global[i])) locked[i] = 1, outline[i] = 1;
  for (size_t i = 0; i < np; ++i)
    if (cornersAt[i] > 1 && seamDegree[i] != 2) locked[i] = 1;  // where seams meet (or a lone seam end)
  std::vector<Quadric> Q(np);
  std::vector<std::vector<uint32_t>> around(np);
  std::vector<uint8_t> alive(tris.size(), 1);
  for (uint32_t t = 0; t < tris.size(); ++t) {
    const Vec3 a = ppos[tp[t][0]], b = ppos[tp[t][1]], c = ppos[tp[t][2]];
    Vec3 n = cross(b - a, c - a);
    const float l = length(n);
    if (l > 0) n = n * (1 / l);
    for (uint32_t v : tp[t]) Q[v].addPlane(n.x, n.y, n.z, -dot(n, a), 1.0), around[v].push_back(t);
  }
  auto isSeamEdge = [&](uint32_t a, uint32_t b) {
    auto it = edges.find(edgeKey(a, b));
    return it != edges.end() && it->second.seam;
  };
  std::vector<uint32_t> version(np, 0);
  std::vector<uint8_t> gone(np, 0);
  struct Cand {
    double cost;
    uint32_t from, to, vf, vt;
    bool operator>(const Cand& o) const { return cost > o.cost; }
  };
  std::priority_queue<Cand, std::vector<Cand>, std::greater<Cand>> heap;
  auto push = [&](uint32_t from, uint32_t to) {
    if (locked[from] || from == to || gone[from] || gone[to]) return;
    if (cornersAt[from] > 1 && !isSeamEdge(from, to)) return;  // a seam place only slides along its seam
    heap.push({std::max(0.0, (Q[from] + Q[to]).at(ppos[to])), from, to, version[from], version[to]});
  };
  for (const auto& [k, e] : edges) {
    const uint32_t pa = static_cast<uint32_t>(k >> 32), pb = static_cast<uint32_t>(k & 0xFFFFFFFFu);
    push(pa, pb), push(pb, pa);
  }
  size_t count = tris.size();
  std::unordered_map<uint32_t, uint32_t> partner;
  while (count > target && !heap.empty()) {
    const Cand c = heap.top();
    heap.pop();
    if (gone[c.from] || gone[c.to]) continue;
    if (c.vf != version[c.from] || c.vt != version[c.to]) {
      bool near = false;
      for (uint32_t t : around[c.from])
        if (alive[t] && (tp[t][0] == c.to || tp[t][1] == c.to || tp[t][2] == c.to)) near = true;
      if (near) push(c.from, c.to);
      continue;
    }
    // Each corner at `from` needs one partner at `to` (the corner it shares a triangle with there).
    partner.clear();
    bool ok = true;
    int sharedTris = 0;
    for (uint32_t t : around[c.from]) {
      if (!alive[t]) continue;
      int kf = -1, kt = -1;
      for (int k = 0; k < 3; ++k) {
        if (tp[t][k] == c.from) kf = k;
        if (tp[t][k] == c.to) kt = k;
      }
      if (kt < 0) continue;
      ++sharedTris;
      auto [it, fresh] = partner.emplace(tris[t][kf], tris[t][kt]);
      if (!fresh && it->second != tris[t][kt]) ok = false;
    }
    if (!ok || sharedTris == 0) continue;
    {
      std::unordered_set<uint32_t> cornersHere, targets;
      for (uint32_t t : around[c.from])
        if (alive[t])
          for (int k = 0; k < 3; ++k)
            if (tp[t][k] == c.from) cornersHere.insert(tris[t][k]);
      for (uint32_t cf : cornersHere) {
        auto it = partner.find(cf);
        if (it == partner.end()) ok = false;
        else targets.insert(it->second);
      }
      if (targets.size() != cornersHere.size()) ok = false;  // two colours would merge
    }
    if (!ok) continue;
    // No flips, no triangles folded flat.
    for (uint32_t t : around[c.from]) {
      if (!alive[t] || tp[t][0] == c.to || tp[t][1] == c.to || tp[t][2] == c.to) continue;
      Vec3 p[3], q[3];
      for (int k = 0; k < 3; ++k) p[k] = ppos[tp[t][k]], q[k] = tp[t][k] == c.from ? ppos[c.to] : p[k];
      const Vec3 n0 = cross(p[1] - p[0], p[2] - p[0]), n1 = cross(q[1] - q[0], q[2] - q[0]);
      const float l0 = length(n0), l1 = length(n1);
      if (l1 <= 1e-12f || (l0 > 0 && dot(n0, n1) < 0.25f * l0 * l1)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    // The link condition (places next to both are only the far corners of the shared triangles).
    {
      std::vector<uint32_t> nf, nt;
      for (uint32_t t : around[c.from])
        if (alive[t])
          for (uint32_t v : tp[t])
            if (v != c.from && v != c.to) nf.push_back(v);
      for (uint32_t t : around[c.to])
        if (alive[t])
          for (uint32_t v : tp[t])
            if (v != c.to) nt.push_back(v);
      std::sort(nf.begin(), nf.end());
      nf.erase(std::unique(nf.begin(), nf.end()), nf.end());
      std::sort(nt.begin(), nt.end());
      nt.erase(std::unique(nt.begin(), nt.end()), nt.end());
      int common = 0;
      for (uint32_t v : nf) common += std::binary_search(nt.begin(), nt.end(), v);
      if (common != sharedTris) continue;
    }
    // Move: `from` and its corners onto `to` and their partners.
    gone[c.from] = 1;
    Q[c.to] = Q[c.to] + Q[c.from];
    ++version[c.to];
    for (uint32_t t : around[c.from]) {
      if (!alive[t]) continue;
      if (tp[t][0] == c.to || tp[t][1] == c.to || tp[t][2] == c.to) {
        alive[t] = 0;
        --count;
        continue;
      }
      for (int k = 0; k < 3; ++k)
        if (tp[t][k] == c.from) tp[t][k] = c.to, tris[t][k] = partner[tris[t][k]];
      around[c.to].push_back(t);
    }
    // Seam edges now ending at `to` keep their seam flag.
    for (uint32_t t : around[c.to])
      if (alive[t])
        for (int k = 0; k < 3; ++k) {
          uint32_t pa = tp[t][k], pb = tp[t][(k + 1) % 3];
          if (pa == c.to || pb == c.to) {
            auto old = edges.find(edgeKey(pa == c.to ? c.from : pa, pb == c.to ? c.from : pb));
            if (old != edges.end() && old->second.seam) edges[edgeKey(pa, pb)].seam = true;
          }
        }
    for (uint32_t t : around[c.to])
      if (alive[t])
        for (uint32_t v : tp[t])
          if (v != c.to) push(c.to, v), push(v, c.to);
  }
  // Still too many: loose little parts (a screw, a bottle on a far shelf)
  // that touch nothing outside go entirely, smallest first, none bigger
  // than `pruneUpTo`; the measured error counts what went.
  if (count > target && pruneUpTo > 0) {
    std::vector<uint32_t> parent(np);
    for (uint32_t i = 0; i < np; ++i) parent[i] = i;
    auto find = [&](uint32_t x) {
      while (parent[x] != x) x = parent[x] = parent[parent[x]];
      return x;
    };
    for (uint32_t t = 0; t < tris.size(); ++t)
      if (alive[t]) parent[find(tp[t][1])] = find(tp[t][0]), parent[find(tp[t][2])] = find(tp[t][0]);
    struct Part {
      Vec3 lo{1e30f, 1e30f, 1e30f}, hi{-1e30f, -1e30f, -1e30f};
      bool keep = false;
      std::vector<uint32_t> tris;
    };
    std::unordered_map<uint32_t, Part> parts;
    for (uint32_t t = 0; t < tris.size(); ++t) {
      if (!alive[t]) continue;
      Part& pt = parts[find(tp[t][0])];
      pt.tris.push_back(t);
      for (uint32_t v : tp[t]) {
        pt.lo = minComponents(pt.lo, ppos[v]), pt.hi = maxComponents(pt.hi, ppos[v]);
        if (outline[v]) pt.keep = true;
      }
    }
    std::vector<std::pair<float, uint32_t>> bySize;
    for (const auto& [r, pt] : parts)
      if (!pt.keep && length(pt.hi - pt.lo) <= pruneUpTo && parts.size() > 1) bySize.push_back({length(pt.hi - pt.lo), r});
    std::sort(bySize.begin(), bySize.end());
    for (const auto& [size, r] : bySize) {
      if (count <= target) break;
      for (uint32_t t : parts[r].tris) alive[t] = 0, --count;
    }
  }
  std::vector<Tri> out;
  for (uint32_t t = 0; t < tris.size(); ++t)
    if (alive[t]) out.push_back(tris[t]);
  tris = std::move(out);
}

// The distance from a point to a triangle.
float pointTri(Vec3 p, Vec3 a, Vec3 b, Vec3 c) {
  const Vec3 ab = b - a, ac = c - a, ap = p - a;
  const float d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return length(p - a);
  const Vec3 bp = p - b;
  const float d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return length(p - b);
  const float vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return length(p - (a + ab * (d1 / (d1 - d3))));
  const Vec3 cp = p - c;
  const float d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return length(p - c);
  const float vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return length(p - (a + ac * (d2 / (d2 - d6))));
  const float va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) return length(p - (b + (c - b) * ((d4 - d3) / ((d4 - d3) + (d5 - d6)))));
  const float den = 1 / (va + vb + vc);
  return length(p - (a + ab * (vb * den) + ac * (vc * den)));
}

// How far apart two versions of a surface are: the full one's corners from
// the simple one, and the simple one's triangle middles and edge middles
// from the full one (the larger).
float surfaceGap(const std::vector<Vec3>& pos, const std::vector<Tri>& full, const std::vector<Tri>& simple) {
  auto nearest = [&](Vec3 p, const std::vector<Tri>& tris) {
    float best = 1e30f;
    for (const Tri& t : tris) best = std::min(best, pointTri(p, pos[t[0]], pos[t[1]], pos[t[2]]));
    return best;
  };
  float gap = 0;
  for (const Tri& t : full)
    for (uint32_t v : t) gap = std::max(gap, nearest(pos[v], simple));
  for (const Tri& t : simple) {
    const Vec3 a = pos[t[0]], b = pos[t[1]], c = pos[t[2]];
    for (const Vec3& q : {(a + b + c) * (1.0f / 3), (a + b) * 0.5f, (b + c) * 0.5f, (c + a) * 0.5f}) gap = std::max(gap, nearest(q, full));
  }
  return gap;
}

}  // namespace

ClusterTree buildClusters(const std::vector<Vec3>& pos, const std::vector<uint32_t>& idx, const ClusterSettings& s) {
  ClusterTree T;
  const Places P = places(pos);
  std::vector<Tri> all(idx.size() / 3);
  for (size_t t = 0; t < all.size(); ++t) all[t] = {idx[3 * t], idx[3 * t + 1], idx[3 * t + 2]};
  T.fullTriangles = static_cast<uint32_t>(all.size());
  // Adds clusters made from `tris` at `level`; returns their numbers.
  auto addClusters = [&](const std::vector<Tri>& tris, int level, float error, Vec3 gc, float gr) {
    std::vector<uint32_t> made;
    for (const std::vector<uint32_t>& part : partition(pos, P, tris, s.clusterTriangles)) {
      Cluster c;
      c.first = static_cast<uint32_t>(T.indices.size() / 3);
      c.count = static_cast<uint32_t>(part.size());
      c.level = level;
      std::vector<Vec3> pts;
      for (uint32_t t : part)
        for (uint32_t v : tris[t]) T.indices.push_back(v), pts.push_back(pos[v]);
      if (level == 0) sphereOf(pts, &c.center, &c.radius);
      else c.center = gc, c.radius = gr;
      c.error = error;
      made.push_back(static_cast<uint32_t>(T.clusters.size()));
      T.clusters.push_back(c);
    }
    return made;
  };
  std::vector<uint32_t> active = addClusters(all, 0, 0, {}, 0);
  std::unordered_set<uint32_t> frozen;  // places on clusters that stopped simplifying: their borders never move again
  int level = 0;
  while (active.size() > 1 && level < s.maxLevels) {
    ++level;
    // Group neighbouring clusters (sharing places), Morton-ordered seeds.
    std::unordered_map<uint32_t, std::vector<uint32_t>> clustersAt;  // place → active clusters
    for (uint32_t c : active) {
      const Cluster& cl = T.clusters[c];
      std::unordered_set<uint32_t> seen;
      for (uint32_t i = cl.first * 3; i < (cl.first + cl.count) * 3; ++i)
        if (seen.insert(P.of[T.indices[i]]).second) clustersAt[P.of[T.indices[i]]].push_back(c);
    }
    std::unordered_map<uint32_t, uint8_t> grouped;
    std::vector<std::vector<uint32_t>> groups;
    std::vector<uint32_t> order = active;
    std::sort(order.begin(), order.end(), [&](uint32_t a, uint32_t b) {
      const Vec3 x = T.clusters[a].center, y = T.clusters[b].center;
      return std::tie(x.x, x.y, x.z) < std::tie(y.x, y.y, y.z);
    });
    for (uint32_t seed : order) {
      if (grouped[seed]) continue;
      std::vector<uint32_t> g{seed};
      grouped[seed] = 1;
      while (static_cast<int>(g.size()) < s.groupClusters) {
        // The ungrouped cluster sharing the most places with the group.
        std::unordered_map<uint32_t, int> shared;
        for (uint32_t c : g) {
          const Cluster& cl = T.clusters[c];
          for (uint32_t i = cl.first * 3; i < (cl.first + cl.count) * 3; ++i)
            for (uint32_t o : clustersAt[P.of[T.indices[i]]])
              if (!grouped[o]) ++shared[o];
        }
        uint32_t best = UINT32_MAX;
        if (!shared.empty()) {
          best = shared.begin()->first;
          for (const auto& [o, n] : shared)
            if (n > shared[best] || (n == shared[best] && o < best)) best = o;
        } else if (g.size() == 1) {
          // It touches nothing left (a loose piece: a bottle, a screw): the nearest cluster.
          const Vec3 here = T.clusters[seed].center;
          float bestD = 1e30f;
          for (uint32_t o : active)
            if (!grouped[o] && length(T.clusters[o].center - here) < bestD) bestD = length(T.clusters[o].center - here), best = o;
          if (best == UINT32_MAX) break;
        } else {
          break;
        }
        g.push_back(best);
        grouped[best] = 1;
      }
      groups.push_back(std::move(g));
    }
    // Places shared by two groups (even at a single corner) stay put this round.
    std::unordered_set<uint32_t> locked = frozen;
    {
      std::unordered_map<uint32_t, uint32_t> groupAt;
      for (uint32_t gi = 0; gi < groups.size(); ++gi)
        for (uint32_t c : groups[gi]) {
          const Cluster& cl = T.clusters[c];
          for (uint32_t i = cl.first * 3; i < (cl.first + cl.count) * 3; ++i) {
            const uint32_t pl = P.of[T.indices[i]];
            auto it = groupAt.find(pl);
            if (it == groupAt.end()) groupAt.emplace(pl, gi);
            else if (it->second != gi) locked.insert(pl);
          }
        }
    }
    auto freeze = [&](uint32_t c) {
      const Cluster& cl = T.clusters[c];
      for (uint32_t i = cl.first * 3; i < (cl.first + cl.count) * 3; ++i) frozen.insert(P.of[T.indices[i]]);
    };
    std::vector<uint32_t> next;
    for (const std::vector<uint32_t>& g : groups) {
      std::vector<Tri> tris;
      std::vector<std::pair<Vec3, float>> spheres;
      float childError = 0;
      for (uint32_t c : g) {
        const Cluster& cl = T.clusters[c];
        for (uint32_t t = cl.first; t < cl.first + cl.count; ++t) tris.push_back({T.indices[3 * t], T.indices[3 * t + 1], T.indices[3 * t + 2]});
        spheres.push_back({cl.center, cl.radius});
        childError = std::max(childError, cl.error);
      }
      const size_t before = tris.size();
      if (g.size() < 2 && active.size() > 1) {
        next.push_back(g[0]);  // nothing to join with this round: wait for the next
        continue;
      }
      const std::vector<Tri> full = tris;
      Vec3 gc0;
      float gr0;
      sphereOfSpheres(spheres, &gc0, &gr0);
      simplify(pos, P, tris, static_cast<size_t>(std::ceil(before * s.keep)), locked, gr0 * 0.5f);
      if (tris.size() > before * 0.85f) {  // stuck: these clusters stay the simplest of their part (roots)
        for (uint32_t c : g) freeze(c);
        continue;
      }
      // The real gap from the full detail (the group's children are themselves simpler versions: add their error).
      const float err = surfaceGap(pos, full, tris);
      Vec3 gc;
      float gr;
      sphereOfSpheres(spheres, &gc, &gr);
      // Its gap from its children, plus theirs from the full detail: never less than the truth.
      const float error = std::max(err + childError, childError * 1.001f + 1e-7f);
      for (uint32_t c : g) T.clusters[c].parentCenter = gc, T.clusters[c].parentRadius = gr, T.clusters[c].parentError = error;
      for (uint32_t m : addClusters(tris, level, error, gc, gr)) next.push_back(m);
    }
    if (next.size() >= active.size()) {  // no progress: what's left are roots
      for (uint32_t c : next) freeze(c);
      break;
    }
    active = std::move(next);
  }
  T.levels = level + 1;
  for (const Cluster& c : T.clusters)
    if (c.parentError >= 1e29f) T.rootTriangles += c.count;
  return T;
}

namespace {
float pixels(const DetailView& v, Vec3 c, float r, float e) {
  if (e <= 0) return 0;
  if (e >= 1e29f) return 1e30f;
  const float d = length(c - v.eye) - r;
  if (d <= 1e-4f) return 1e30f;
  return e / d * v.pixelsPerMetre;
}
}  // namespace

void pickClusters(const ClusterTree& t, const DetailView& v, std::vector<uint32_t>& out) {
  out.clear();
  for (uint32_t i = 0; i < t.clusters.size(); ++i) {
    const Cluster& c = t.clusters[i];
    if (pixels(v, c.center, c.radius, c.error) <= v.limitPixels && pixels(v, c.parentCenter, c.parentRadius, c.parentError) > v.limitPixels)
      out.push_back(i);
  }
}

uint32_t pickedIndices(const ClusterTree& t, const std::vector<uint32_t>& picked, std::vector<uint32_t>& out) {
  out.clear();
  uint32_t tris = 0;
  for (uint32_t i : picked) {
    const Cluster& c = t.clusters[i];
    out.insert(out.end(), t.indices.begin() + c.first * 3, t.indices.begin() + (c.first + c.count) * 3);
    tris += c.count;
  }
  return tris;
}

}  // namespace engine::draw
