# Playbook — Software

For CLIs, libraries, SDKs, services and APIs, data pipelines, automation, bots and infrastructure.

## The experience is the developer experience
The experience spec covers:
- **The first five minutes:** install → hello world → first real use. The README quickstart must work verbatim, and QA will run it exactly as written.
- **API ergonomics:** naming, defaults, progressive disclosure, consistency.
- **Errors:** what happened, why, and how to fix it. Never a bare stack trace for user error.
- **CLI surface:** `--help` that teaches, human output by default and `--json` for machines, meaningful exit codes, color only on a TTY.
- **Configuration:** flags > env > config file > defaults, with the precedence documented.
- **Logs:** levels, structure, and no secrets ever.

## Engineering standards
- Types throughout, and input validated at every trust boundary.
- No silent failure. Errors are typed and carry context.
- Idempotency where operations can be retried. Resources cleaned up on every path.
- Concurrency-safe where concurrency exists, with the reasoning written down.
- Few dependencies, each justified and pinned.

## Testing
- Unit and integration tests, plus **property-based tests** for core logic (hypothesis, fast-check).
- **Golden tests** for CLI output and **contract tests** for APIs.
- **Fuzzing** for parsers and anything that consumes untrusted input.
- **Load tests** for services, against the latency and throughput budgets.

## Security
Anything networked or handling user data gets a threat model in the architecture, a dependency audit, least-privilege access, and secrets taken only from the environment.

## Packaging & delivery
One-command install and run. Versioned, with a CHANGELOG and a licence. The verify command runs lint, types, every test suite, and a smoke test of the installed artifact.

## Budgets (defaults; set per project)
- CLI startup ≤ 150 ms.
- Service p95 latency stated, and measured under load.
- Memory stated for typical and worst-case inputs.

## Staffing
backend, api-design, cli, library-design, database, auth-security, concurrency, performance, devops-ci, packaging, observability. A `test-engineer` on property-based and fuzz testing pays for itself.

## Reviewer checklist (software addendum)
- Run the README exactly as written on a clean checkout.
- Feed it bad input: empty, huge, malformed, wrong types, unicode, concurrent calls.
- Kill it mid-operation, then confirm it recovers cleanly with no corrupted state.
- Read every error message as a first-time user would. Each one should point at the fix.
