"""Cross-component acceptance coverage; every agent invocation is mocked."""
import json
import unittest
from unittest.mock import patch

import test_harness_resume as fixtures
import run_harness as h
from harness_state import StateError, TaskCheckpoint

APPROVED = {"verdict": "APPROVED", "summary": "Complete", "findings": [], "escalate": False}
REJECTED = {"verdict": "NEEDS_REVISION", "summary": "Missing verification", "findings": [
    {"file": "src/preview.txt", "line": 1, "message": "Add remaining verification"}], "escalate": False}


class AcceptanceTests(unittest.TestCase):
    setUp = fixtures.ResumeTests.setUp
    git = fixtures.ResumeTests.git

    def test_actual_pi_command_flags_for_coder_and_reviewer(self):
        output = "\n".join(map(json.dumps, [
            {"type": "message_end", "message": {"role": "assistant", "stopReason": "stop",
             "content": [{"type": "text", "text": json.dumps(APPROVED)}]}},
            {"type": "agent_settled", "aborted": False},
        ]))
        def fake_run(command, prompt):
            self.runner.records.append({"command": command})
            return output
        with patch.object(self.runner, "run", side_effect=fake_run) as run:
            self.runner.agent(h.CODER_MODEL, h.CODER_THINKING, "Code")
            coder = run.call_args.args[0]
            self.runner.agent(h.REVIEWER_MODEL, h.REVIEWER_THINKING, "Review", reviewer=True)
            reviewer = run.call_args.args[0]
        for command, model, thinking, tools in [
            (coder, "openai/gpt-6.1-sol", "high", "read,bash,edit,write"),
            (reviewer, "openai/gpt-6-luna", "low", "read,grep,find,ls"),
        ]:
            self.assertEqual(command[command.index("--model") + 1], model)
            self.assertEqual(command[command.index("--thinking") + 1], thinking)
            self.assertEqual(command[command.index("--tools") + 1], tools)
            for flag in ("--no-session", "--no-extensions", "--no-mcp", "--no-skills", "--no-prompt-templates"):
                self.assertIn(flag, command)

    def test_binary_assets_never_enter_reviewer_prompts_as_patch_payloads(self):
        payload = b"\x89PNG\x00IMAGE-CONTENT-NOT-FOR-TEXT-REVIEW"
        (self.root / "src/staged.png").write_bytes(payload)
        self.git("add", "src/staged.png")
        (self.root / "src/untracked.png").write_bytes(payload)
        head = self.git("rev-parse", "HEAD").strip()
        _, diff = h.capture_changes(self.runner, head, fixtures.PLAN, self.args.allow_path)
        with patch.object(self.runner, "agent", return_value=json.dumps(APPROVED)) as agent:
            result = h.review_changes(self.runner, "Review the original criteria", diff)
        self.assertEqual(result["verdict"], "APPROVED")
        prompt = agent.call_args.args[2]
        self.assertIn("src/staged.png", prompt)
        self.assertIn("src/untracked.png", prompt)
        self.assertIn("read relevant image paths selectively", prompt)
        self.assertNotIn("GIT binary patch", prompt)
        self.assertNotIn("IMAGE-CONTENT-NOT-FOR-TEXT-REVIEW", prompt)

    def test_shared_budget_survives_review_outage_and_repeated_cli_equivalent_resume(self):
        self.args.base_ref = "HEAD^"
        self.args.resume_path = []
        self.args.restart_repairs = False
        calls = {"coding": 0, "reviews": 0, "assessments": 0}
        def agent(model, thinking, prompt, **kwargs):
            if kwargs.get("assessment"):
                calls["assessments"] += 1
                return json.dumps(fixtures.assessment())
            if kwargs.get("reviewer"):
                calls["reviews"] += 1
                if calls["reviews"] == 2:
                    raise h.InfrastructureError("Temporary reviewer outage")
                return json.dumps(REJECTED)
            calls["coding"] += 1
            (self.root / "src/progress.txt").write_text(f"Attempt {calls['coding']}")
            return "Addressed remaining verification"
        with patch.object(self.runner, "agent", side_effect=agent), patch.object(self.runner, "checks", return_value=""):
            with self.assertRaises(h.InfrastructureError):
                h.execute(self.args, self.runner, TaskCheckpoint(self.runner, self.args))
        self.assertEqual(calls["coding"], 2)  # Initial attempt plus repair one.
        self.assertEqual(calls["assessments"], 1)
        folder = self.logs.parent / "run-second"
        folder.mkdir()
        runner = h.Runner(self.root, folder, 5)
        with patch.object(runner, "agent", side_effect=agent), patch.object(runner, "checks", return_value=""):
            with self.assertRaisesRegex(StateError, "Repair budget exhausted"):
                h.execute(self.args, runner, TaskCheckpoint(runner, self.args))
        self.assertEqual(calls["coding"], 4)  # Still only initial + three repairs across both runs.
        self.assertEqual(calls["assessments"], 1)  # Cached assessment/coded work reused for the failed review.
        state = json.loads((self.root / ".git/harness-checkpoint.json").read_text())
        self.assertEqual(state["repairs_used"], 3)
        self.assertIn("- [ ] **2.", (self.root / "PLAN1.md").read_text())
        self.assertEqual((self.root / "src/progress.txt").read_text(), "Attempt 4")
        folder = self.logs.parent / "run-third"
        folder.mkdir()
        last_runner = h.Runner(self.root, folder, 5)
        with patch.object(last_runner, "agent") as no_calls, self.assertRaisesRegex(StateError, "Repair budget exhausted"):
            h.execute(self.args, last_runner, TaskCheckpoint(last_runner, self.args))
        no_calls.assert_not_called()


if __name__ == "__main__":
    unittest.main()
