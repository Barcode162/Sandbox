"""Tests for the Bureau's records office (bureau/bin/bureau).

Each test runs the real CLI against a throwaway copy of the Bureau, so the
repository's own records are never touched.

    python3 -m unittest discover -s bureau/tests -v
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CLI = REPO / "bureau" / "bin" / "bureau"
MARKER = "<!-- bureau:template -->"


class BureauCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="bureau-test-"))
        shutil.copytree(REPO / "bureau", self.tmp / "bureau",
                        ignore=shutil.ignore_patterns("M-[0-9]*", ".bureau.lock", "__pycache__"))
        shutil.copytree(REPO / ".claude", self.tmp / ".claude")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def cli(self, *args, ok=True, root=None):
        env = {**os.environ, "BUREAU_ROOT": str(root or self.tmp)}
        proc = subprocess.run([sys.executable, str(CLI), *args], capture_output=True, text=True, env=env)
        if ok is True and proc.returncode != 0:
            self.fail(f"bureau {' '.join(args)} exited {proc.returncode}\n{proc.stdout}\n{proc.stderr}")
        if ok is False and proc.returncode == 0:
            self.fail(f"bureau {' '.join(args)} unexpectedly succeeded\n{proc.stdout}")
        return proc

    def new_mission(self, title="Test mission", tier=3):
        out = self.cli("new", title, "--tier", str(tier), "--domain", "software").stdout.strip()
        return self.tmp / out

    def fill(self, mdir, *docs):
        for doc in docs:
            p = mdir / doc
            p.write_text(p.read_text().replace(MARKER, ""))

    def report(self, mdir, name, text="report"):
        p = mdir / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
        return name

    def vote(self, mid, gate, director, verdict="APPROVE", score="9", ok=True):
        mdir = next((self.tmp / "bureau" / "missions").glob(f"{mid}-*"))
        name = self.report(mdir, f"board/{gate}-{director}.md")
        return self.cli("vote", mid, gate, "--director", director, "--verdict", verdict,
                        "--score", score, "--report", name, ok=ok)


class TestIntegrity(BureauCase):
    def test_repository_validates(self):
        out = self.cli("validate", root=REPO).stdout
        self.assertIn("OK", out)

    def test_validate_catches_misnamed_agent(self):
        bad = self.tmp / ".claude" / "agents" / "scout.md"
        bad.write_text(bad.read_text().replace("name: scout", "name: spy", 1))
        out = self.cli("validate", ok=False).stdout
        self.assertIn("must match the file name", out)
        self.assertIn("spy is not registered", out)

    def test_validate_catches_unregistered_agent_and_bad_yaml(self):
        (self.tmp / ".claude" / "agents" / "ghost.md").write_text(
            "---\nname: ghost\ndescription: Bureau Nowhere — does things: badly and without a roster entry at all\n"
            "model: inherit\n---\n" + "x" * 500 + "\nSTATUS: DONE\n")
        out = self.cli("validate", ok=False).stdout
        self.assertIn("ghost is not registered", out)
        self.assertIn("invalid YAML", out)

    def test_validate_enforces_ratchet_floor(self):
        cfg_path = self.tmp / "bureau" / "config.json"
        cfg = json.loads(cfg_path.read_text())
        cfg["ship_threshold"] = 6.5
        cfg_path.write_text(json.dumps(cfg))
        self.assertIn("ratchet", self.cli("validate", ok=False).stdout)

    def test_roster_lists_every_department(self):
        out = self.cli("roster").stdout
        for title in ("Board of Directors", "Strategy Division", "Engineering Division",
                      "Quality Division", "The Institute"):
            self.assertIn(title, out)
        self.assertRegex(out, r"Capacity: \d+ roles × \d+ disciplines")


class TestMissions(BureauCase):
    def test_new_mission_creates_dossier(self):
        mdir = self.new_mission("Neon Harbor", tier=4)
        self.assertEqual(mdir.name, "M-0001-neon-harbor")
        for f in ("brief.md", "plan.md", "design/experience.md", "design/architecture.md",
                  "retro.md", "log.md", "state.json", "findings.jsonl", "votes.jsonl"):
            self.assertTrue((mdir / f).exists(), f)
        brief = (mdir / "brief.md").read_text()
        self.assertIn("M-0001 — Neon Harbor", brief)
        self.assertNotIn("{{", brief)
        st = json.loads((mdir / "state.json").read_text())
        self.assertEqual((st["tier"], st["phase"], st["output"]), (4, "intake", "projects/neon-harbor"))
        self.assertEqual(self.new_mission("Second").name, "M-0002-second")

    def test_unknown_tier_rejected(self):
        self.assertIn("unknown tier", self.cli("new", "x", "--tier", "9", ok=None).stderr)

    def test_phase_and_headcount(self):
        self.new_mission()
        self.cli("phase", "M-0001", "build", "--note", "wave 1")
        self.cli("convene", "1", "engineer", "--n", "6")
        self.cli("convene", "M-0001", "scout", "--n", "3")
        out = self.cli("status", "M-0001").stdout
        self.assertIn("phase build", out)
        self.assertIn("headcount 9", out)
        self.assertIn("engineer 6, scout 3", out)
        self.assertIn("9 agents convened", self.cli("status").stdout)
        self.assertIn("Phase intake → **build**", (self.tmp / "bureau/missions/M-0001-test-mission/log.md").read_text())

    def test_mission_lookup_by_slug(self):
        self.new_mission("Lookup Me")
        self.assertIn("M-0001 · Lookup Me", self.cli("status", "lookup-me").stdout)
        self.cli("status", "nope", ok=False)


class TestFindings(BureauCase):
    def setUp(self):
        super().setUp()
        self.new_mission()

    def add(self, sev="S1", by="qa-tester"):
        return self.cli("finding", "add", "M-0001", "--sev", sev, "--by", by, "--title", f"{sev} defect",
                        "--where", "src/x.ts:1").stdout.strip()

    def test_lifecycle_and_separation_of_duties(self):
        fid = self.add()
        self.assertEqual(fid, "F-001")
        self.cli("finding", "verify", "M-0001", fid, "--by", "inspector-general", ok=False)  # not resolved yet
        self.cli("finding", "resolve", "M-0001", fid, "--by", "engineer", "--evidence", "fixed; test passes")
        err = self.cli("finding", "verify", "M-0001", fid, "--by", "engineer", ok=False).stderr
        self.assertIn("separation of duties", err)
        self.cli("finding", "verify", "M-0001", "1", "--by", "inspector-general", "--note", "repro gone")
        self.assertIn("no findings match", self.cli("finding", "list", "M-0001", "--open").stdout)

    def test_reopen_returns_to_open(self):
        fid = self.add()
        self.cli("finding", "resolve", "M-0001", fid, "--by", "engineer", "--evidence", "e")
        self.cli("finding", "reopen", "M-0001", fid, "--by", "qa-tester", "--reason", "still fails")
        listed = json.loads(self.cli("finding", "list", "M-0001", "--json").stdout)
        self.assertEqual((listed[0]["status"], listed[0]["reopened"]), ("open", 1))

    def test_waiver_authority(self):
        s1, s2 = self.add("S1"), self.add("S2")
        self.assertIn("only the owner", self.cli("finding", "waive", "M-0001", s1, "--by", "director-risk",
                                                 "--reason", "r", ok=False).stderr)
        self.cli("finding", "waive", "M-0001", s1, "--by", "owner", "--reason", "accepted")
        self.cli("finding", "waive", "M-0001", s2, "--by", "engineer", "--reason", "r", ok=False)
        self.cli("finding", "waive", "M-0001", s2, "--by", "director-vision", "--reason", "taste call")
        self.assertIn("no findings match", self.cli("finding", "list", "M-0001", "--open").stdout)

    def test_ids_are_unique_under_concurrency(self):
        env = {**os.environ, "BUREAU_ROOT": str(self.tmp)}
        procs = [subprocess.Popen([sys.executable, str(CLI), "finding", "add", "M-0001", "--sev", "S3",
                                   "--by", "qa-tester", "--title", f"t{i}"], stdout=subprocess.PIPE, env=env, text=True)
                 for i in range(12)]
        ids = [p.communicate()[0].strip() for p in procs]
        self.assertEqual(len(set(ids)), 12, ids)


class TestGates(BureauCase):
    DIRECTORS = ("director-vision", "director-engineering", "director-risk")

    def test_plan_gate(self):
        mdir = self.new_mission(tier=4)
        out = self.cli("gate", "M-0001", "plan", ok=False).stdout
        self.assertIn("still a template", out)
        self.assertIn("has not voted", out)
        self.fill(mdir, "brief.md", "plan.md", "design/experience.md", "design/architecture.md")
        for d in self.DIRECTORS[:2]:
            self.vote("M-0001", "plan", d)
        self.vote("M-0001", "plan", "director-risk", "CONDITIONAL", "7.5")
        self.assertIn("PASS", self.cli("gate", "M-0001", "plan").stdout)
        self.vote("M-0001", "plan", "director-risk", "REJECT", "5")
        self.assertIn("REJECTED", self.cli("gate", "M-0001", "plan", ok=False).stdout)
        self.cli("round", "M-0001", "plan", "--note", "plan revised")
        self.assertIn("has not voted (plan round 2)", self.cli("gate", "M-0001", "plan", ok=False).stdout)

    def test_vote_requires_board_seat_and_report(self):
        self.new_mission()
        self.cli("vote", "M-0001", "plan", "--director", "engineer", "--verdict", "APPROVE",
                 "--score", "9", "--report", "x.md", ok=False)
        err = self.cli("vote", "M-0001", "plan", "--director", "director-risk", "--verdict", "APPROVE",
                       "--score", "9", "--report", "board/missing.md", ok=False).stderr
        self.assertIn("write it before voting", err)

    def test_ship_gate_tier3(self):
        mdir = self.new_mission(tier=3)
        self.fill(mdir, "brief.md", "design/experience.md", "design/architecture.md")
        (mdir / "plan.md").write_text("# Plan\n\n### WO-001 — Core\n\n### WO-002 — UI\n")
        self.vote("M-0001", "plan", "director-engineering")
        fid = self.cli("finding", "add", "M-0001", "--sev", "S1", "--by", "qa-tester", "--title", "bug").stdout.strip()

        out = self.cli("gate", "M-0001", "ship", ok=False).stdout
        self.assertIn("S0/S1 not yet verified: F-001", out)
        self.assertIn("without a completion report: WO-001, WO-002", out)
        self.assertIn("no code-reviewer review", out)
        self.assertNotIn("inspector-general", out)  # only the audit lever or tier 4 requires one

        self.cli("finding", "resolve", "M-0001", fid, "--by", "engineer", "--evidence", "e")
        self.cli("finding", "verify", "M-0001", fid, "--by", "qa-tester")  # the finder re-verifies
        for wo in ("WO-001", "WO-002"):
            self.report(mdir, f"reports/{wo}.md")
        for role in ("code-reviewer", "qa-tester"):
            self.report(mdir, f"reviews/{role}-r1.md")
        self.vote("M-0001", "ship", "director-engineering", "APPROVE", "8.6")
        self.vote("M-0001", "ship", "director-vision", "APPROVE", "7.9")
        self.assertIn("below the ship threshold", self.cli("gate", "M-0001", "ship", ok=False).stdout)
        self.vote("M-0001", "ship", "director-vision", "APPROVE", "8.2")
        self.assertIn("PASS", self.cli("gate", "M-0001", "ship").stdout)
        self.assertIn("ship gate (round 1): PASSED", self.cli("status", "M-0001").stdout)

    def test_open_s2_blocks_ship(self):
        mdir = self.new_mission(tier=1)
        self.fill(mdir, "brief.md")
        self.cli("finding", "add", "M-0001", "--sev", "S2", "--by", "code-reviewer", "--title", "minor")
        self.assertIn("S2 not yet verified or waived", self.cli("gate", "M-0001", "ship", ok=False).stdout)
        self.cli("finding", "waive", "M-0001", "F-001", "--by", "ceo", "--reason", "cosmetic, tier 1")
        self.cli("gate", "M-0001", "ship")

    def test_tier2_needs_no_plan_board(self):
        mdir = self.new_mission(tier=2)
        self.fill(mdir, "brief.md", "plan.md")
        self.assertIn("no board review required", self.cli("gate", "M-0001", "plan").stdout)

    def test_word_caps_block_the_plan_gate(self):
        mdir = self.new_mission(tier=2)
        self.fill(mdir, "brief.md")
        (mdir / "plan.md").write_text("# Plan\n\n" + "word " * 2600)
        self.assertIn("over its cap of 2500", self.cli("gate", "M-0001", "plan", ok=False).stdout)
        (mdir / "plan.md").write_text("# Plan\n\n" + "word " * 100)
        self.assertIn("plan.md written", self.cli("gate", "M-0001", "plan").stdout)

    def test_board_report_cap(self):
        mdir = self.new_mission(tier=4)
        self.report(mdir, "board/plan-director-risk.md", "word " * 800)
        err = self.cli("vote", "M-0001", "plan", "--director", "director-risk", "--verdict", "APPROVE",
                       "--score", "9", "--report", "board/plan-director-risk.md", ok=False).stderr
        self.assertIn("the cap is 700", err)


class TestEconomy(BureauCase):
    def test_agent_budget_is_enforced(self):
        self.new_mission(tier=2)  # budget 8
        self.cli("convene", "M-0001", "engineer", "--n", "6")
        err = self.cli("convene", "M-0001", "qa-tester", "--n", "3", ok=False).stderr
        self.assertIn("over budget", err)
        self.assertIn("used 6 of 8", err)
        self.cli("convene", "M-0001", "qa-tester", "--n", "3", "--owner-approved", "go ahead, one more")
        out = self.cli("status", "M-0001").stdout
        self.assertIn("headcount 9 of 9 budget", out)
        log = (self.tmp / "bureau/missions/M-0001-test-mission/log.md").read_text()
        self.assertIn("Budget raised by 1 with the Owner's approval", log)

    def test_levers_default_from_domain_and_add_requirements(self):
        out = self.cli("new", "Site", "--tier", "2", "--domain", "interactive-web").stdout.strip()
        mdir = self.tmp / out
        self.assertIn("levers polish", self.cli("status", "M-0001").stdout)
        self.fill(mdir, "brief.md", "plan.md")
        self.report(mdir, "reviews/code-reviewer-r1.md")
        self.report(mdir, "reports/WO-001.md")
        self.vote("M-0001", "ship", "director-vision", "APPROVE", "9")
        self.assertIn("no polish-critic review", self.cli("gate", "M-0001", "ship", ok=False).stdout)
        self.report(mdir, "reviews/polish-critic-r1.md")
        self.assertIn("PASS", self.cli("gate", "M-0001", "ship").stdout)

    def test_bakeoff_lever_requires_cards_and_verdict(self):
        out = self.cli("new", "Game", "--tier", "2", "--domain", "game", "--levers", "bakeoff,polish").stdout.strip()
        mdir = self.tmp / out
        self.fill(mdir, "brief.md", "plan.md")
        gate = self.cli("gate", "M-0001", "plan", ok=False).stdout
        self.assertIn("design/directions.md is missing (or still a template)", gate)
        self.fill(mdir, "design/directions.md")
        self.report(mdir, "board/bakeoff-experience.md")
        self.assertIn("PASS", self.cli("gate", "M-0001", "plan").stdout)

    def test_unknown_lever_rejected(self):
        self.assertIn("unknown lever", self.cli("new", "x", "--tier", "2", "--levers", "vibes", ok=None).stderr)


class TestMemory(BureauCase):
    def test_lessons(self):
        self.new_mission()
        first = self.cli("lesson", "add", "Dispose geometries on scene swap.", "--tags", "engineer,game",
                         "--mission", "M-0001").stdout.strip()
        second = self.cli("lesson", "add", "Seed RNG in tests.", "--tags", "test-engineer").stdout.strip()
        n = int(first.split("-")[1])
        self.assertEqual(second, f"L-{n + 1:04d}")
        out = self.cli("lesson", "list", "--tag", "game").stdout
        self.assertIn("Dispose geometries", out)
        self.assertNotIn("Seed RNG", out)
        self.cli("lesson", "add", "x", ok=False)  # tags required
        self.cli("validate")

    def test_upgrade_approvals_and_versioning(self):
        version = (self.tmp / "bureau" / "VERSION").read_text().strip()
        major, minor, patch = map(int, version.split("."))
        common = ["--title", "t", "--trigger", "M-0001", "--change", "c", "--files", "f"]
        self.cli("upgrade", "add", "--kind", "role", *common, "--approved-by", "director-vision", ok=False)
        self.cli("upgrade", "add", "--kind", "charter", *common, "--approved-by",
                 "director-vision,director-risk,director-engineering", ok=False)
        self.cli("upgrade", "add", "--kind", "prompt", *common, "--approved-by", "intern", ok=False)
        self.cli("upgrade", "add", "--kind", "prompt", *common, "--approved-by", "ceo")
        self.assertEqual((self.tmp / "bureau/VERSION").read_text().strip(), f"{major}.{minor}.{patch + 1}")
        self.cli("upgrade", "add", "--kind", "role", *common, "--approved-by", "director-vision,director-risk")
        self.assertEqual((self.tmp / "bureau/VERSION").read_text().strip(), f"{major}.{minor + 1}.0")
        self.cli("upgrade", "add", "--kind", "charter", *common, "--approved-by", "owner")
        self.assertEqual((self.tmp / "bureau/VERSION").read_text().strip(), f"{major + 1}.0.0")
        self.cli("validate")

    def test_validate_catches_version_drift(self):
        (self.tmp / "bureau" / "VERSION").write_text("9.9.9\n")
        self.assertIn("must equal the last upgrade", self.cli("validate", ok=False).stdout)


if __name__ == "__main__":
    unittest.main()
