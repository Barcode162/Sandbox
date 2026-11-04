#include "looped/jobs.h"

#include <emscripten/emscripten.h>

#include <algorithm>
#include <cstring>
#include <deque>
#include <map>
#include <string>

#include "looped/bridge.h"
#include "looped/log.h"
#include "looped/profiler.h"

namespace engine {
namespace {

struct Job {
  std::function<void()> run;
  const char* kind;
  CancelToken cancel;
};

std::deque<Job> g_lanes[static_cast<int>(JobLane::kCount)];
std::map<std::string, double> g_estimate;  // kind -> expected ms (smoothed)
std::function<bool()> g_gate;

double estimate(const char* kind) {
  const auto it = g_estimate.find(kind);
  return it == g_estimate.end() ? 1.0 : it->second;
}

}  // namespace

void queueJob(std::function<void()> job, JobLane lane, const char* kind, CancelToken cancel) {
  g_lanes[static_cast<int>(lane)].push_back({std::move(job), kind ? kind : "job", std::move(cancel)});
}

size_t pendingJobs() {
  size_t n = 0;
  for (const auto& lane : g_lanes) n += lane.size();
  return n;
}

void setJobGate(std::function<bool()> gate) { g_gate = std::move(gate); }

void runJobs(double deadlineMs) {
  if (bridge::frame().hidden) return;  // paused while the page is in the background
  int ran = 0;
  double maxJob = 0;
  if (!g_gate || g_gate()) {
    for (auto& lane : g_lanes) {
      while (!lane.empty()) {
        Job& next = lane.front();
        if (next.cancel && *next.cancel) {
          lane.pop_front();
          continue;
        }
        const double now = emscripten_get_now();
        if (ran > 0 && now + estimate(next.kind) > deadlineMs) break;
        if (ran == 0 && now >= deadlineMs + 4) break;  // the frame already ran long: wait a frame
        Job job = std::move(next);
        lane.pop_front();
        job.run();
        ++ran;
        const double took = emscripten_get_now() - now;
        maxJob = std::max(maxJob, took);
        // Slow jobs show up in reports (the first few only).
        static int slowLogged = 0;
        if (took > 50 && slowLogged < 8) {
          ++slowLogged;
          LOG_INFO("Slow job: %s took %.0f ms.", job.kind ? job.kind : "?", took);
        }
        double& e = g_estimate.try_emplace(job.kind, took).first->second;
        e = std::max(took, 0.8 * e + 0.2 * took);  // quick to rise, slow to fall
      }
      if (ran > 0 && emscripten_get_now() >= deadlineMs) break;
    }
  }
  profiler().jobs(ran, pendingJobs(), maxJob);
}

}  // namespace engine
