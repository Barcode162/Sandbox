#include "looped/world/world.h"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <set>

namespace engine::world {

namespace {

constexpr int kMaxDepth = 16;          // a chain of messages longer than this stops
constexpr int kMaxTimedPerFrame = 4096;

const Json& nullJson() {
  static const Json j;
  return j;
}

const State& noState() {
  static const State s;
  return s;
}

std::string autoId(const ThingSpec& s) {
  char buf[64];
  std::snprintf(buf, sizeof buf, "@%.1f,%.1f", s.at.x, s.at.z);
  return s.kind + buf;
}

// The inverse of a place-turn-size matrix (no perspective).
Mat4 affineInverse(const Mat4& m) {
  const float a = m.at(0, 0), b = m.at(1, 0), c = m.at(2, 0);
  const float d = m.at(0, 1), e = m.at(1, 1), f = m.at(2, 1);
  const float g = m.at(0, 2), h = m.at(1, 2), k = m.at(2, 2);
  const float A = e * k - f * h, B = -(d * k - f * g), C = d * h - e * g;
  const float det = a * A + b * B + c * C;
  Mat4 r;
  if (std::fabs(det) < 1e-12f) return r;
  const float s = 1.0f / det;
  r.at(0, 0) = A * s;
  r.at(1, 0) = -(b * k - c * h) * s;
  r.at(2, 0) = (b * f - c * e) * s;
  r.at(0, 1) = B * s;
  r.at(1, 1) = (a * k - c * g) * s;
  r.at(2, 1) = -(a * f - c * d) * s;
  r.at(0, 2) = C * s;
  r.at(1, 2) = -(a * h - b * g) * s;
  r.at(2, 2) = (a * e - b * d) * s;
  const Vec3 t{m.at(3, 0), m.at(3, 1), m.at(3, 2)};
  for (int row = 0; row < 3; ++row)
    r.at(3, row) = -(r.at(0, row) * t.x + r.at(1, row) * t.y + r.at(2, row) * t.z);
  return r;
}

// Position, turn and size back out of a matrix (no shear).
void decompose(const Mat4& m, Vec3* pos, Quat* rot, Vec3* scale) {
  *pos = {m.at(3, 0), m.at(3, 1), m.at(3, 2)};
  Vec3 col[3];
  for (int c = 0; c < 3; ++c) col[c] = {m.at(c, 0), m.at(c, 1), m.at(c, 2)};
  *scale = {length(col[0]), length(col[1]), length(col[2])};
  for (int c = 0; c < 3; ++c) {
    const float l = (&scale->x)[c];
    if (l > 1e-8f) col[c] = col[c] * (1.0f / l);
  }
  // Rotation matrix (columns) → quaternion.
  const float m00 = col[0].x, m11 = col[1].y, m22 = col[2].z;
  const float tr = m00 + m11 + m22;
  Quat q;
  if (tr > 0) {
    const float s = std::sqrt(tr + 1.0f) * 2;
    q = {(col[1].z - col[2].y) / s, (col[2].x - col[0].z) / s, (col[0].y - col[1].x) / s, 0.25f * s};
  } else if (m00 > m11 && m00 > m22) {
    const float s = std::sqrt(1.0f + m00 - m11 - m22) * 2;
    q = {0.25f * s, (col[1].x + col[0].y) / s, (col[2].x + col[0].z) / s, (col[1].z - col[2].y) / s};
  } else if (m11 > m22) {
    const float s = std::sqrt(1.0f + m11 - m00 - m22) * 2;
    q = {(col[1].x + col[0].y) / s, 0.25f * s, (col[2].y + col[1].z) / s, (col[2].x - col[0].z) / s};
  } else {
    const float s = std::sqrt(1.0f + m22 - m00 - m11) * 2;
    q = {(col[2].x + col[0].z) / s, (col[2].y + col[1].z) / s, 0.25f * s, (col[0].y - col[1].x) / s};
  }
  *rot = normalized(q);
}

Mat4 scaling(Vec3 s) {
  Mat4 m;
  m.at(0, 0) = s.x;
  m.at(1, 1) = s.y;
  m.at(2, 2) = s.z;
  return m;
}

}  // namespace

uint16_t World::netIdOf(std::string_view id) {
  const uint32_t h = hash32(id);
  const auto folded = static_cast<uint16_t>((h >> 16) ^ (h & 0xffff));
  return folded ? folded : 1;
}

int World::make(const Library& lib, const ThingSpec& spec, int parent, const std::string& id,
                std::string* errors) {
  const Kind* kind = lib.find(spec.kind);
  if (!kind) {
    if (errors) *errors += id + ": no kind \"" + spec.kind + "\"\n";
    return -1;
  }
  if (byId_.count(id)) {
    if (errors) *errors += id + ": two things have this id\n";
    return -1;
  }
  Thing t;
  t.id = id;
  t.net = netIdOf(id);
  t.kind = kind;
  t.parent = parent;
  t.at = spec.at;
  t.rot = normalized(eulerDegrees(spec.turn) * spec.rotation);
  t.phase = spec.phase;
  t.scale = spec.scale;
  t.seed = spec.seed ? spec.seed : (hash32(id) | 1u);
  t.parts = spec.parts;
  t.loops = spec.loops;
  const std::string& first = !spec.state.empty() ? spec.state : kind->start;
  const int s = first.empty() ? 0 : kind->state(first);
  if (s < 0 && errors) *errors += id + ": no state \"" + first + "\" in kind \"" + kind->id + "\"\n";
  t.state = std::max(0, s);
  const int index = static_cast<int>(things_.size());
  byId_[id] = index;
  // Two ids can hash alike (16 bits): the later one takes the next free
  // number. Every phone and the room read the same files in the same order,
  // so they all agree.
  while (byNet_.count(t.net)) t.net = static_cast<uint16_t>(t.net + 1 ? t.net + 1 : 1);
  byNet_.emplace(t.net, index);
  things_.push_back(std::move(t));
  if (parent >= 0) things_[static_cast<size_t>(parent)].children.push_back(index);
  schedule(index);
  // The smaller things it's made of, placed on it.
  int n = 0;
  for (const ThingSpec& c : kind->things) {
    ++n;
    const std::string cid = id + "/" + (c.id.empty() ? c.kind + std::to_string(n) : c.id);
    make(lib, c, index, cid, errors);
  }
  return index;
}

bool World::build(const Library& source, const Place& place, std::string* errors) {
  library_ = std::make_shared<const Library>(source);
  const Library& library = *library_;
  things_.clear();
  byId_.clear();
  byNet_.clear();
  changes_.clear();
  std::string err;
  std::vector<std::pair<int, const ThingSpec*>> made;
  for (const ThingSpec& spec : place.things) {
    const std::string id = spec.id.empty() ? autoId(spec) : spec.id;
    const int i = make(library, spec, -1, id, &err);
    if (i >= 0) made.emplace_back(i, &spec);
  }
  // Parents named in the place (they may come later in the file).
  for (auto [i, spec] : made) {
    if (spec->parent.empty()) continue;
    const int p = find(spec->parent);
    if (p < 0) {
      err += things_[static_cast<size_t>(i)].id + ": no parent \"" + spec->parent + "\"\n";
      continue;
    }
    bool loop = false;  // would it sit on itself?
    for (int q = p; q >= 0; q = things_[static_cast<size_t>(q)].parent)
      if (q == i) loop = true;
    if (loop) {
      err += things_[static_cast<size_t>(i)].id + ": parent \"" + spec->parent + "\" sits on it (a circle)\n";
      continue;
    }
    things_[static_cast<size_t>(i)].parent = p;
    things_[static_cast<size_t>(p)].children.push_back(i);
  }
  orderDirty_ = true;
  if (errors) *errors += err;
  return err.empty();
}

int World::find(std::string_view id) const {
  const auto it = byId_.find(std::string(id));
  return it == byId_.end() ? -1 : it->second;
}

int World::findNet(uint16_t net) const {
  const auto it = byNet_.find(net);
  return it == byNet_.end() ? -1 : it->second;
}

const Json& World::part(int i, std::string_view name) const {
  const Thing& t = things_[static_cast<size_t>(i)];
  for (const auto& [n, j] : t.parts)
    if (n == name) return j;
  return t.kind ? t.kind->part(name) : nullJson();
}

const Loop* World::loopOf(int i, int state) const {
  const Thing& t = things_[static_cast<size_t>(i)];
  if (state < 0 || static_cast<size_t>(state) >= t.kind->states.size()) return nullptr;
  const std::string& name = t.kind->states[static_cast<size_t>(state)].loop;
  for (const Loop& l : t.loops)
    if (l.name == name) return &l;
  return t.kind->loop(name);
}

const State& World::stateOf(int i) const {
  const Thing& t = things_[static_cast<size_t>(i)];
  if (static_cast<size_t>(t.state) >= t.kind->states.size()) return noState();
  return t.kind->states[static_cast<size_t>(t.state)];
}

void World::schedule(int i) {
  Thing& t = things_[static_cast<size_t>(i)];
  t.due = std::numeric_limits<double>::infinity();
  const State& s = stateOf(i);
  if (s.next.empty() || t.kind->state(s.next) < 0) return;
  double d = -1;
  if (s.after >= 0) d = s.after;
  else if (s.afterLoops >= 0) {
    const Loop* l = loopOf(i, t.state);
    if (l) d = s.afterLoops * l->seconds();
  }
  if (d >= 0) t.due = t.start + std::max(0.001, d);
}

void World::enter(int i, int state, double at, bool record, int depth) {
  Thing& t = things_[static_cast<size_t>(i)];
  t.prevState = t.state;
  t.prevStart = t.start;
  t.state = state;
  t.start = at;
  schedule(i);
  if (record) changes_.push_back({t.net, static_cast<uint8_t>(state), at});
  const State& s = stateOf(i);
  for (const Send& send : s.enter) deliver(i, send, at, record, depth + 1);
}

void World::deliver(int from, const Send& s, double at, bool record, int depth) {
  const Thing& t = things_[static_cast<size_t>(from)];
  if (s.to == "self") {
    fire(from, s.event, at, record, depth);
  } else if (s.to == "parent") {
    if (t.parent >= 0) fire(t.parent, s.event, at, record, depth);
  } else if (s.to == "children") {
    const std::vector<int> kids = t.children;  // copied: fire() never changes the tree, but be safe
    for (int c : kids) fire(c, s.event, at, record, depth);
  } else if (s.to == "all") {  // every thing in the place (lights going down...)
    for (size_t k = 0; k < things_.size(); ++k)
      if (static_cast<int>(k) != from) fire(static_cast<int>(k), s.event, at, record, depth);
  } else if (!s.to.empty() && s.to[0] == '#') {
    fire(find(std::string_view(s.to).substr(1)), s.event, at, record, depth);
  } else {
    fire(find(t.id + "/" + s.to), s.event, at, record, depth);
  }
}

bool World::fire(int i, std::string_view event, double at, bool record, int depth) {
  if (depth > kMaxDepth || i < 0) return false;
  const Thing& t = things_[static_cast<size_t>(i)];
  const State& s = stateOf(i);
  const std::string* target = nullptr;
  for (const auto& [e, to] : s.on)
    if (e == event) target = &to;
  if (!target)
    for (const auto& [e, to] : t.kind->on)
      if (e == event) target = &to;
  if (!target) return false;
  const int next = t.kind->state(*target);
  if (next < 0) return false;
  enter(i, next, at, record, depth);
  return true;
}

bool World::reacts(int i, std::string_view event) const {
  if (i < 0 || static_cast<size_t>(i) >= things_.size()) return false;
  const Thing& t = things_[static_cast<size_t>(i)];
  for (const auto& [e, to] : stateOf(i).on)
    if (e == event) return t.kind->state(to) >= 0;
  for (const auto& [e, to] : t.kind->on)
    if (e == event) return t.kind->state(to) >= 0;
  return false;
}

bool World::send(int i, std::string_view event, double now) {
  if (i < 0 || static_cast<size_t>(i) >= things_.size()) return false;
  return fire(i, event, now, true, 0);
}

bool World::sendAll(std::string_view event, double now) {
  bool any = false;
  for (size_t i = 0; i < things_.size(); ++i) any = fire(static_cast<int>(i), event, now, true, 0) || any;
  return any;
}

bool World::setState(int i, std::string_view state, double now) {
  if (i < 0 || static_cast<size_t>(i) >= things_.size()) return false;
  const int s = things_[static_cast<size_t>(i)].kind->state(state);
  if (s < 0) return false;
  enter(i, s, now, true, 0);
  return true;
}

void World::apply(const Change& c) {
  const int i = findNet(c.net);
  if (i < 0) return;
  Thing& t = things_[static_cast<size_t>(i)];
  if (c.state >= t.kind->states.size()) return;
  if (t.state == c.state && t.start == c.start) return;
  t.prevState = t.state;
  t.prevStart = t.start;
  t.state = c.state;
  t.start = c.start;
  schedule(i);
}

std::vector<Change> World::takeChanges() {
  std::vector<Change> out;
  out.swap(changes_);
  return out;
}

void World::order() {
  order_.clear();
  order_.reserve(things_.size());
  std::vector<int> stack;
  for (size_t r = 0; r < things_.size(); ++r) {
    if (things_[r].parent >= 0) continue;
    stack.push_back(static_cast<int>(r));
    while (!stack.empty()) {
      const int i = stack.back();
      stack.pop_back();
      order_.push_back(i);
      const auto& kids = things_[static_cast<size_t>(i)].children;
      for (auto it = kids.rbegin(); it != kids.rend(); ++it) stack.push_back(*it);
    }
  }
  orderDirty_ = false;
}

Mat4 World::rest(const Thing& t) const {
  return Mat4::translation(t.at) * Mat4::rotation(t.rot) * scaling(t.scale);
}

Mat4 World::moved(const Thing& t) const {
  // In its own space, around the pivot: there, move, turn, scale, back.
  const Vec3 s = t.motion.scale();
  const Vec3 p = t.kind->pivot;
  return Mat4::translation(p + t.motion.move()) * Mat4::rotation(eulerDegrees(t.motion.turn())) *
         scaling({1 + s.x, 1 + s.y, 1 + s.z}) * Mat4::translation(Vec3{} - p);
}

Mat4 World::local(const Thing& t) const { return rest(t) * moved(t); }

int World::tune(std::string_view kind, float speed, bool off) {
  int n = 0;
  for (Thing& t : things_)
    if (t.kind && t.kind->id == kind) {
      t.speed = std::clamp(speed, 0.0f, 8.0f);
      t.off = off;
      ++n;
    }
  return n;
}

void World::update(const Clock& clock) {
  const double now = clock.seconds;
  // Timed rules, in the order they fall due (so chains come out the same on
  // every phone whatever its frame rate). A long way behind (joining late,
  // a sleeping tab): states that only time moves on skip whole rounds.
  for (size_t i = 0; i < things_.size(); ++i) {
    Thing& t = things_[i];
    if (!(t.due < now - 30)) continue;
    // Walk the timed chain from here; if it comes back round with no
    // messages on the way, jump whole rounds.
    double total = 0;
    int s = t.state;
    bool clean = true;
    for (int step = 0; step < 32; ++step) {
      const State& st = t.kind->states[static_cast<size_t>(s)];
      if (!st.enter.empty() && step > 0) clean = false;
      double d = -1;
      if (st.after >= 0) d = st.after;
      else if (st.afterLoops >= 0) {
        const Loop* l = loopOf(static_cast<int>(i), s);
        if (l) d = st.afterLoops * l->seconds();
      }
      const int n = st.next.empty() ? -1 : t.kind->state(st.next);
      if (d < 0 || n < 0) {
        clean = false;
        break;
      }
      total += std::max(0.001, d);
      s = n;
      if (s == t.state) break;
    }
    if (clean && s == t.state && total > 0) {
      const double rounds = std::floor((now - 30 - t.start) / total);
      if (rounds > 0) {
        t.start += rounds * total;
        schedule(static_cast<int>(i));
      }
    }
  }
  for (int n = 0; n < kMaxTimedPerFrame; ++n) {
    int first = -1;
    double when = now;
    for (size_t i = 0; i < things_.size(); ++i)
      if (things_[i].due <= when) {
        // Ties go to the lower index, so the order is the same everywhere.
        if (first < 0 || things_[i].due < when) first = static_cast<int>(i), when = things_[i].due;
      }
    if (first < 0) break;
    Thing& t = things_[static_cast<size_t>(first)];
    const int next = t.kind->state(stateOf(first).next);
    enter(first, next, t.due, false, 0);  // everyone works these out: nothing to send
  }

  // Each thing's loop (blending in from the state before).
  for (size_t i = 0; i < things_.size(); ++i) {
    Thing& t = things_[i];
    Motion m;
    if (t.off) { t.motion = m; t.prevState = -1; continue; }
    const double sp = t.speed;
    if (const Loop* l = loopOf(static_cast<int>(i), t.state))
      l->add(l->cycles(clock, t.start, t.seed) * sp + t.phase, t.seed, 1, m);
    if (t.prevState >= 0) {
      const Loop* cur = loopOf(static_cast<int>(i), t.state);
      const float blend = cur ? cur->blend : 0.3f;
      const double w = blend > 0 ? (now - t.start) / blend : 1;
      if (w >= 1 || w < 0) {
        t.prevState = -1;
      } else {
        Motion pm;
        if (const Loop* p = loopOf(static_cast<int>(i), t.prevState))
          p->add(p->cycles(clock, t.prevStart, t.seed) * sp + t.phase, t.seed, 1, pm);
        m = mix(pm, m, smoothstep(0, 1, static_cast<float>(w)));
      }
    }
    t.motion = m;
  }

  // Places, parents first: each thing moves with what it sits on.
  if (orderDirty_) order();
  for (int i : order_) {
    Thing& t = things_[static_cast<size_t>(i)];
    const Mat4 l = local(t);
    t.world = t.parent >= 0 ? things_[static_cast<size_t>(t.parent)].world * l : l;
  }
}

void World::setRest(int i, Vec3 at, Quat rot) {
  Thing& t = things_[static_cast<size_t>(i)];
  t.at = at;
  t.rot = rot;
}

void World::setScale(int i, Vec3 scale) { things_[static_cast<size_t>(i)].scale = scale; }

int World::updateKind(const Kind& changed) {
  if (!library_) return 0;
  const Kind* found = library_->find(changed.id);
  if (!found) return 0;
  Kind& k = const_cast<Kind&>(*found);  // the shared kinds: every copy of the world sees it
  k.loops = changed.loops;
  k.states = changed.states;
  k.on = changed.on;
  k.start = changed.start;
  k.pivot = changed.pivot;
  int n = 0;
  for (size_t i = 0; i < things_.size(); ++i) {
    Thing& t = things_[i];
    if (t.kind != found) continue;
    ++n;
    if (t.state < 0 || static_cast<size_t>(t.state) >= k.states.size()) t.state = std::max(0, k.state(k.start));
    if (t.prevState >= static_cast<int>(k.states.size())) t.prevState = -1;
  }
  return n;
}

void World::attach(int i, int parent) {
  // Keep it exactly where it is now (loops included, so a parent's sway
  // doesn't make it jump): its new rest is what, on the new parent and with
  // its own loop added back, lands on the same place.
  //   parentWorld * rest' * moved = world  →  rest' = parentWorld⁻¹ * world * moved⁻¹
  const Thing& t = things_[static_cast<size_t>(i)];
  Mat4 r = t.world * affineInverse(moved(t));
  if (parent >= 0) r = affineInverse(things_[static_cast<size_t>(parent)].world) * r;
  Vec3 at, scale;
  Quat rot;
  decompose(r, &at, &rot, &scale);
  attach(i, parent, at, rot);
  things_[static_cast<size_t>(i)].scale = scale;
}

void World::attach(int i, int parent, Vec3 at, Quat rot) {
  for (int q = parent; q >= 0; q = things_[static_cast<size_t>(q)].parent)
    if (q == i) return;  // can't sit on itself
  Thing& t = things_[static_cast<size_t>(i)];
  if (t.parent >= 0) {
    auto& kids = things_[static_cast<size_t>(t.parent)].children;
    kids.erase(std::remove(kids.begin(), kids.end(), i), kids.end());
  }
  t.parent = parent;
  if (parent >= 0) things_[static_cast<size_t>(parent)].children.push_back(i);
  t.at = at;
  t.rot = rot;
  orderDirty_ = true;
}

std::vector<std::string> World::check() const {
  std::vector<std::string> out;
  std::set<std::string> seen;
  auto say = [&](const std::string& s) {
    if (seen.insert(s).second) out.push_back(s);
  };
  for (size_t i = 0; i < things_.size(); ++i) {
    const Thing& t = things_[i];
    const Kind& k = *t.kind;
    const std::string who = t.loops.empty() ? "kind \"" + k.id + "\"" : "thing \"" + t.id + "\"";
    if (k.states.empty()) {
      if (k.still.empty()) say(who + ": no states (every thing needs a live loop)");
      continue;
    }
    for (size_t s = 0; s < k.states.size(); ++s) {
      const State& st = k.states[s];
      const Loop* l = loopOf(static_cast<int>(i), static_cast<int>(s));
      if (!l && !st.loop.empty()) say(who + " state \"" + st.name + "\": no loop \"" + st.loop + "\"");
      else if ((!l || !l->live()) && k.still.empty())
        say(who + " state \"" + st.name + "\": its loop is empty (every thing needs a live loop)");
      for (const auto& [e, to] : st.on)
        if (k.state(to) < 0) say(who + " state \"" + st.name + "\" on " + e + ": no state \"" + to + "\"");
      if (!st.next.empty() && k.state(st.next) < 0)
        say(who + " state \"" + st.name + "\": next \"" + st.next + "\" isn't a state");
      if ((st.after >= 0 || st.afterLoops >= 0) && st.next.empty())
        say(who + " state \"" + st.name + "\": timed but no \"next\"");
      if (st.afterLoops >= 0 && !l) say(who + " state \"" + st.name + "\": afterLoops with no loop");
    }
    for (const auto& [e, to] : k.on)
      if (k.state(to) < 0) say(who + " on " + e + ": no state \"" + to + "\"");
  }
  return out;
}

std::vector<std::string> World::stillKinds() const {
  std::set<std::string> s;
  for (const Thing& t : things_)
    if (!t.kind->still.empty()) s.insert(t.kind->id + " (" + t.kind->still + ")");
  return {s.begin(), s.end()};
}

}  // namespace engine::world
