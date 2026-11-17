"""Run with: python3 -m unittest discover -s tests -p 'test_*.py' -v."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import run_harness as h

PLAN = """# Plan

Preserve the shell.

## Tasks

- [x] **1. Baseline.** Done.

- [ ] **2. Change preview.** Done when configurable.

- [ ] **3. Next task.** Not authorized.

## Completion

All done.
"""
APPROVAL = {"verdict": "APPROVED", "summary": "Meets criteria.", "findings": [], "escalate": False}
REVISION = {"verdict": "NEEDS_REVISION", "summary": "Missing prop.", "findings": [
    {"file": "src/preview.tsx", "line": 2, "message": "Accept instructions through props."}], "escalate": False}


class ParsingTests(unittest.TestCase):
    def test_default_first_unchecked(self):
        task = h.select_task(PLAN)
        self.assertEqual(task[2], "2")
        self.assertNotIn("Next task", task[0])

    def test_explicit_step(self):
        self.assertEqual(h.select_task(PLAN, 3)[2], "3")

    def test_missing_complete_and_all_complete(self):
        for plan, step in [(PLAN, 1), (PLAN, 99), (PLAN.replace("[ ]", "[x]"), None)]:
            with self.subTest(step=step), self.assertRaises(h.HarnessError):
                h.select_task(plan, step)

    def test_only_selected_checkbox_changes(self):
        updated = h.complete_plan(PLAN, h.select_task(PLAN), "Passed.")
        self.assertIn("- [x] **2.", updated)
        self.assertIn("- [ ] **3.", updated)
        self.assertIn("**Recorded:** Passed.", updated)
        self.assertTrue(updated.endswith("All done.\n"))

    def test_review_schema(self):
        self.assertEqual(h.parse_review(json.dumps(APPROVAL)), APPROVAL)
        for value in ["not json", "[]", json.dumps({}),
                      json.dumps({**APPROVAL, "findings": REVISION["findings"]}),
                      json.dumps({**REVISION, "findings": []}),
                      json.dumps({**APPROVAL, "escalate": "false"}),
                      json.dumps({**REVISION, "findings": [{"file": "a", "line": 0, "message": "Fix"}]})]:
            with self.subTest(value=value), self.assertRaises(h.HarnessError):
                h.parse_review(value)

    def test_json_events_and_usage(self):
        message = {"role": "assistant", "stopReason": "stop", "content": [{"type": "text", "text": "Done"}],
                   "usage": {"totalTokens": 12}}
        events = [{"type": "message_end", "message": message}, {"type": "agent_settled", "aborted": False}]
        text, usage = h.parse_events("\n".join(map(json.dumps, events)))
        self.assertEqual(text, "Done")
        self.assertEqual(usage[0]["totalTokens"], 12)
        for output in ["bad", "", json.dumps(events[0]),
                       "\n".join(map(json.dumps, [events[0], {"type": "agent_settled", "aborted": True}]))]:
            with self.assertRaises(h.HarnessError):
                h.parse_events(output)


    def test_model_access_error_is_actionable(self):
        message = {"role": "assistant", "provider": "openai", "model": "gpt-6-luna",
                   "content": [], "stopReason": "error",
                   "errorMessage": "OpenAI API error (403): Project does not have access to model gpt-6-luna"}
        events = [{"type": "message_end", "message": message}, {"type": "agent_settled", "aborted": False}]
        with self.assertRaises(h.HarnessError) as error:
            h.parse_events("\n".join(map(json.dumps, events)))
        text = str(error.exception)
        self.assertIn("openai/gpt-6-luna", text)
        self.assertIn("403", text)
        self.assertIn("does not have access", text)
        self.assertIn("pi --list-models is not proof of access", text)


class ExecutionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "docs").mkdir()
        (self.root / "PLAN1.md").write_text(PLAN)
        (self.root / "AGENTS.md").write_text("Rules")
        (self.root / "docs/SPEC.md").write_text("Spec")
        self.runner = Mock(root=self.root, artifacts=self.root / "logs")
        self.runner.artifacts.mkdir()
        self.runner.git.side_effect = ["", "head"]
        self.runner.checks.return_value = ""
        self.runner.agent.side_effect = ["Coder report", json.dumps(APPROVAL)]
        self.args = argparse.Namespace(step=None, allow_path=["src", "tests", "docs"], max_repairs=1)
        self.capture = patch.object(h, "capture_changes", return_value=(["src/preview.tsx"], "diff"))
        self.capture.start()
        self.addCleanup(self.capture.stop)

    def assert_unchecked(self):
        self.assertEqual((self.root / "PLAN1.md").read_text(), PLAN)

    def test_success_only_completion(self):
        result = h.execute(self.args, self.runner)
        self.assertEqual(result["step"], 2)
        self.assertEqual(self.runner.agent.call_args_list[0].args[:2], ("openai/gpt-6.1-sol", "high"))
        self.assertEqual(self.runner.agent.call_args_list[1].args[:2], ("openai/gpt-6-luna", "low"))
        self.assertTrue(self.runner.agent.call_args_list[1].kwargs["reviewer"])
        self.assertIn("- [x] **2.", (self.root / "PLAN1.md").read_text())

    def test_dirty_tree(self):
        self.runner.git.side_effect = ["?? user-file"]
        with self.assertRaises(h.HarnessError):
            h.execute(self.args, self.runner)
        self.runner.agent.assert_not_called()
        self.assert_unchecked()

    def test_baseline_failure(self):
        self.runner.checks.return_value = "Existing TS failure"
        with self.assertRaisesRegex(h.HarnessError, "Baseline"):
            h.execute(self.args, self.runner)
        self.runner.agent.assert_not_called()
        self.assert_unchecked()

    def test_agent_failure(self):
        self.runner.agent.side_effect = h.HarnessError("Pi failed")
        with self.assertRaises(h.HarnessError):
            h.execute(self.args, self.runner)
        self.assert_unchecked()

    def test_rejection_repairs_with_fixed_models(self):
        self.runner.agent.side_effect = ["Coder", json.dumps(REVISION), "Repair", json.dumps(APPROVAL)]
        result = h.execute(self.args, self.runner)
        self.assertEqual(result["repairs"], 1)
        self.assertEqual([call.args[:2] for call in self.runner.agent.call_args_list], [
            ("openai/gpt-6.1-sol", "high"), ("openai/gpt-6-luna", "low"),
            ("openai/gpt-6.1-sol", "high"), ("openai/gpt-6-luna", "low")])
        self.assertEqual(self.runner.checks.call_count, 3)

    def test_malformed_review_does_not_substitute_sol(self):
        self.runner.agent.side_effect = ["Coder", "bad"]
        with self.assertRaisesRegex(h.HarnessError, "valid JSON"):
            h.execute(self.args, self.runner)
        self.assertEqual(self.runner.agent.call_count, 2)
        self.assert_unchecked()

    def test_review_access_error_does_not_substitute_sol(self):
        self.runner.agent.side_effect = ["Coder", h.HarnessError("OpenAI API error (403): model access denied")]
        with self.assertRaisesRegex(h.HarnessError, "403"):
            h.execute(self.args, self.runner)
        self.assertEqual(self.runner.agent.call_count, 2)
        self.assert_unchecked()

    def test_requested_escalation_does_not_substitute_sol(self):
        self.args.max_repairs = 0
        self.runner.agent.side_effect = ["Coder", json.dumps({**APPROVAL, "escalate": True})]
        with self.assertRaises(h.HarnessError):
            h.execute(self.args, self.runner)
        self.assertEqual(self.runner.agent.call_count, 2)
        self.assert_unchecked()

    def test_repair_exhaustion(self):
        self.runner.agent.side_effect = ["Coder", json.dumps(REVISION), "Repair", json.dumps(REVISION)]
        with self.assertRaisesRegex(h.HarnessError, "budget exhausted"):
            h.execute(self.args, self.runner)
        self.assert_unchecked()

    def test_reviewer_changes_block_completion(self):
        with patch.object(h, "capture_changes", side_effect=[(["src/a.tsx"], "before"), (["src/a.tsx"], "after")]):
            with self.assertRaisesRegex(h.HarnessError, "changed during review"):
                h.execute(self.args, self.runner)
        self.assert_unchecked()

    def test_high_risk_routes_still_use_luna_low(self):
        with patch.object(h, "capture_changes", return_value=(["src/app/route.tsx"], "diff")):
            h.execute(self.args, self.runner)
        self.assertEqual(self.runner.agent.call_args_list[-1].args[:2], ("openai/gpt-6-luna", "low"))

    def test_check_failure_repaired_before_review(self):
        self.runner.checks.side_effect = ["", "TS failure", ""]
        self.runner.agent.side_effect = ["Coder", "Repair", json.dumps(APPROVAL)]
        h.execute(self.args, self.runner)
        self.assertIn("TS failure", self.runner.agent.call_args_list[1].args[2])


class SubprocessAndGitTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.logs = self.root / "logs"
        self.logs.mkdir()
        self.runner = h.Runner(self.root, self.logs, 5)

    def test_cli_needs_no_model_arguments_and_records_fixed_settings(self):
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)
        with tempfile.TemporaryDirectory() as log_dir:
            with patch.object(h, "ROOT", self.root), patch.object(sys, "argv", ["run_harness.py", "--log-dir", log_dir]), \
                    patch.object(h, "execute", return_value={"step": 2}) as execute:
                self.assertEqual(h.main(), 0)
            self.assertFalse(hasattr(execute.call_args.args[0], "coder_model"))
            summary = json.loads(next(Path(log_dir).glob("run-*/summary.json")).read_text())
            self.assertEqual(summary["configuration"]["coder_model"], "openai/gpt-6.1-sol")
            self.assertEqual(summary["configuration"]["coder_thinking"], "high")
            self.assertEqual(summary["configuration"]["reviewer_model"], "openai/gpt-6-luna")
            self.assertEqual(summary["configuration"]["reviewer_thinking"], "low")
        help_text = subprocess.check_output([sys.executable, str(Path(h.__file__)), "--help"], text=True)
        for flag in ("--coder-model", "--reviewer-model", "--coder-thinking", "--reviewer-thinking"):
            self.assertNotIn(flag, help_text)

    def test_command_failure(self):
        with self.assertRaises(h.HarnessError):
            self.runner.run([sys.executable, "-c", "raise SystemExit(2)"])

    def test_timeout(self):
        self.runner.timeout = 0.05
        with self.assertRaises(h.HarnessError):
            self.runner.run([sys.executable, "-c", "import time; time.sleep(30)"])

    def test_large_stdin_stdout_no_deadlock(self):
        result = self.runner.run([sys.executable, "-c", "import sys; print('x'*100000); print(len(sys.stdin.read()))"], "p" * 100000)
        self.assertTrue(result.endswith("100000\n"))

    def test_git_staged_untracked_and_scope(self):
        def git(*args):
            return subprocess.check_output(["git", *args], cwd=self.root, text=True)
        git("init", "-q")
        git("config", "user.name", "Test")
        git("config", "user.email", "test@example.invalid")
        (self.root / ".gitignore").write_text("logs/\n")
        (self.root / "PLAN1.md").write_text(PLAN)
        (self.root / "src").mkdir()
        (self.root / "src/old.txt").write_text("old\n")
        git("add", ".")
        git("commit", "-qm", "baseline")
        head = git("rev-parse", "HEAD").strip()
        (self.root / "src/old.txt").write_text("staged\n")
        git("add", "src/old.txt")
        (self.root / "src/new.txt").write_text("untracked\n")
        paths, diff = h.capture_changes(self.runner, head, PLAN, ["src"])
        self.assertEqual(paths, ["src/new.txt", "src/old.txt"])
        self.assertIn("+staged", diff)
        self.assertIn("+untracked", diff)
        (self.root / "unrelated.txt").write_text("unwanted")
        with self.assertRaisesRegex(h.HarnessError, "Out-of-scope"):
            h.capture_changes(self.runner, head, PLAN, ["src"])
        with self.assertRaises(h.HarnessError):
            self.runner.git("not-a-git-command")


if __name__ == "__main__":
    unittest.main()
