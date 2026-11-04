#pragma once
// Background work spread over frames: a queue of small jobs run after the
// frame is submitted, until a deadline. Each job has
// - a lane: critical jobs run before normal ones, normal before background;
// - a kind (a name like "texture"): the queue learns how long each kind
//   takes and only starts a job that should finish before the deadline;
// - an optional cancel token: set *token = true and the job is skipped.
#include <cstddef>
#include <functional>
#include <memory>

namespace engine {

enum class JobLane { kCritical, kNormal, kBackground, kCount };
using CancelToken = std::shared_ptr<bool>;

void queueJob(std::function<void()> job, JobLane lane = JobLane::kNormal, const char* kind = "job",
              CancelToken cancel = nullptr);
// Runs jobs while now + the next job's expected time < deadlineMs (one job
// always may start if none ran yet in this call, so a big job can't block
// forever).
void runJobs(double deadlineMs);
size_t pendingJobs();
// Jobs wait while this returns false (e.g. until the mip pipelines exist).
void setJobGate(std::function<bool()> gate);

}  // namespace engine
