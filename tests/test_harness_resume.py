"""Read-only resume assessment tests; no model API calls."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import run_harness as h

PLAN = """# Plan
## Tasks
- [x] **1. Baseline.** Done.
- [ ] **2. Preview.** Done when content is configurable and tested.
- [ ] **3. Next.** Done when documented.
## Completion
Stop.
"""


def assessment(step=2):
    return {"step": step, "criteria": [
        {"criterion": "Configurable content", "status": "satisfied", "evidence": "src/preview.txt:1"},
        {"criterion": "Tests", "status": "missing", "evidence": "No test for configurable props"},
        {"criterion": "Device coverage", "status": "unverified", "evidence": "No fresh native check recorded"},
    ], "remaining_actions": ["Add prop tests", "Verify device behavior"]}


class ResumeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        parent = Path(self.temp.name)
        self.root = parent / "repo"
        self.root.mkdir()
        self.logs = parent / "runs" / "run-current"
        self.logs.mkdir(parents=True)
        self.runner = h.Runner(self.root, self.logs, 5)
        self.args = argparse.Namespace(step=None, resume=True, max_repairs=3, allow_path=["src", "tests", "docs"])
        self.git("init", "-q")
        self.git("config", "user.name", "Test")
        self.git("config", "user.email", "test@example.invalid")
        (self.root / "PLAN1.md").write_text(PLAN)
        (self.root / "AGENTS.md").write_text("Rules")
        (self.root / "docs").mkdir()
        (self.root / "docs/SPEC.md").write_text("Spec")
        (self.root / "src").mkdir()
        (self.root / "src/preview.txt").write_text("baseline")
        self.git("add", ".")
        self.git("commit", "-qm", "baseline")
        (self.root / "src/preview.txt").write_text("configurable content")
        self.git("add", ".")
        self.git("commit", "-qm", "2 partially done")

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, text=True)

    def run_assessment(self, value=None):
        with patch.object(self.runner, "agent", return_value=json.dumps(value or assessment())) as agent, \
                patch.object(self.runner, "checks") as checks:
            result = h.execute(self.args, self.runner)
        checks.assert_not_called()
        self.assertEqual(agent.call_count, 1)
        self.assertEqual(agent.call_args.args[:2], ("openai/gpt-6.1-sol", "high"))
        self.assertTrue(agent.call_args.kwargs["assessment"])
        self.assertEqual((self.root / "PLAN1.md").read_text(), PLAN)
        return result, agent.call_args.args[2]

    def test_committed_partial_work_with_empty_diff_is_assessed(self):
        result, prompt = self.run_assessment()
        self.assertEqual(result["status"], "assessed")
        self.assertEqual(result["step"], 2)
        self.assertEqual(result["assessment"], assessment())
        self.assertIn("HEAD may ALREADY contain partial task work", prompt)
        self.assertIn("EVERY completion criterion", prompt)
        self.assertIn("2 partially done", (self.logs / "assessment-git.txt").read_text())
        self.assertEqual(json.loads((self.logs / "assessment.json").read_text()), assessment())
        self.assertEqual(self.git("status", "--porcelain"), "")

    def test_staged_unstaged_and_untracked_work_is_preserved(self):
        source = self.root / "src/preview.txt"
        source.write_text("staged content")
        self.git("add", "src/preview.txt")
        source.write_text("unstaged content")
        (self.root / "src/new.txt").write_text("untracked content")
        before = [self.git("diff", "HEAD"), self.git("diff", "--cached"), self.git("status", "--porcelain")]
        self.run_assessment()
        after = [self.git("diff", "HEAD"), self.git("diff", "--cached"), self.git("status", "--porcelain")]
        self.assertEqual(before, after)
        self.assertEqual((self.root / "src/new.txt").read_text(), "untracked content")
        evidence = (self.logs / "assessment-git.txt").read_text()
        self.assertIn("unstaged content", evidence)
        self.assertIn("staged content", evidence)
        self.assertIn("src/new.txt", evidence)

    def test_explicit_unfinished_step(self):
        self.args.step = 3
        result, prompt = self.run_assessment(assessment(3))
        self.assertEqual(result["step"], 3)
        self.assertIn("READ-ONLY RESUME ASSESSMENT for step 3", prompt)

    def test_completed_step_rejected_before_assessment(self):
        self.args.step = 1
        with patch.object(self.runner, "agent") as agent, self.assertRaisesRegex(h.HarnessError, "already complete"):
            h.execute(self.args, self.runner)
        agent.assert_not_called()

    def test_legacy_failed_logs_found_by_selected_task_not_other_tasks(self):
        for name, step in (("run-failed", 2), ("run-other", 3)):
            folder = self.logs.parent / name
            folder.mkdir()
            (folder / "summary.json").write_text(json.dumps({"status": "failed", "configuration": {"step": None}}))
            (folder / "007.prompt.txt").write_text(f"Implement ONLY step {step} below; stop before the next step.")
        result, prompt = self.run_assessment()
        self.assertEqual(result["prior_run_logs"], [str(self.logs.parent / "run-failed")])
        self.assertIn("run-failed", prompt)
        self.assertNotIn("run-other", prompt)

    def test_invalid_assessment_never_marks_complete(self):
        with patch.object(self.runner, "agent", return_value="not JSON"), self.assertRaises(h.InfrastructureError):
            h.execute(self.args, self.runner)
        self.assertEqual((self.root / "PLAN1.md").read_text(), PLAN)
        self.assertFalse((self.logs / "assessment.json").exists())

    def test_assessment_schema_rejects_wrong_task_status_and_missing_actions(self):
        for value in [{}, {**assessment(), "step": 3}, {**assessment(), "criteria": []},
                      {**assessment(), "criteria": [{"criterion": "x", "status": "done", "evidence": "x"}]},
                      {**assessment(), "remaining_actions": []}]:
            with self.subTest(value=value), self.assertRaises(h.InfrastructureError):
                h.parse_assessment(json.dumps(value), 2)

    def test_read_only_sol_tools_and_flags(self):
        output = "\n".join(map(json.dumps, [
            {"type": "message_end", "message": {"role": "assistant", "stopReason": "stop",
             "content": [{"type": "text", "text": json.dumps(assessment())}]}},
            {"type": "agent_settled", "aborted": False},
        ]))
        def fake_run(cmd, prompt):
            self.runner.records.append({"command": cmd})
            return output
        with patch.object(self.runner, "run", side_effect=fake_run) as run:
            self.runner.agent(h.CODER_MODEL, h.CODER_THINKING, "Assess", assessment=True)
        cmd = run.call_args.args[0]
        self.assertEqual(cmd[cmd.index("--tools") + 1], "read,grep,find,ls")
        self.assertEqual(cmd[cmd.index("--model") + 1], "openai/gpt-6.1-sol")
        self.assertEqual(cmd[cmd.index("--thinking") + 1], "high")
        self.assertIn("--no-extensions", cmd)
        self.assertIn("--no-mcp", cmd)

    def test_cli_resume_reports_assessment_not_approval(self):
        with tempfile.TemporaryDirectory() as parent, patch.object(h, "ROOT", self.root), \
                patch.object(sys, "argv", ["run_harness.py", "--resume", "--log-dir", parent]), \
                patch.object(h.Runner, "agent", return_value=json.dumps(assessment())):
            self.assertEqual(h.main(), 0)
            summary = json.loads(next(Path(parent).glob("run-*/summary.json")).read_text())
            self.assertEqual(summary["status"], "assessed")
            self.assertTrue(summary["configuration"]["resume"])
        self.assertEqual((self.root / "PLAN1.md").read_text(), PLAN)


if __name__ == "__main__":
    unittest.main()
