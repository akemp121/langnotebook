"""Failure report tests, with no model calls."""
from contextlib import redirect_stderr
import io
import json
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import run_harness as h
from harness_reporting import failure_report, resume_command


class ReportTests(unittest.TestCase):
    def summary(self):
        return {"repository": "/tmp/project with spaces", "seconds": 12.5,
                "configuration": {"max_repairs": 3, "timeout": 900, "log_dir": "/tmp/private logs",
                                  "allow_path": ["src", "tests", "docs", "extra files"],
                                  "resume_path": ["src/a b.ts"], "task_path": ["docs/confirmed task.md"], "restart_repairs": True},
                "error": "OpenAI API error (403): no model access", "reported_cost": 0.123456,
                "reported_tokens": 1234, "commands": [{"command": ["pi", "--model", h.REVIEWER_MODEL],
                                                        "returncode": 0, "seconds": 2}]}

    def test_report_contains_progress_findings_errors_cost_and_safe_resume(self):
        state = {"step": 15, "phase": "rejected", "base": "abc123", "repairs_used": 3, "repair_limit": 3,
                 "assessment": {"criteria": [
                     {"criterion": "Routes", "status": "satisfied", "evidence": "src/routes.ts:1"},
                     {"criterion": "Mobile", "status": "unverified", "evidence": "No device check"}],
                     "remaining_actions": ["Verify mobile layout"]},
                 "findings": {"verdict": "NEEDS_REVISION", "summary": "Fix fallback", "findings": [
                     {"file": "src/a.ts", "line": 7, "message": "Return controlled missing result"}]}}
        progress = {"phase": "review", "step": 15, "coder_attempts": 2, "check_failures": "TypeScript TS2322"}
        report, command = failure_report(self.summary(), progress, state, Path('/tmp/logs/run-1'))
        for text in ['Task:** 15', 'Failed phase:** review', '3 / 3', 'satisfied', 'unverified',
                     'Verify mobile layout', 'TS2322', 'src/a.ts:7', '403', '$0.123456', '1,234',
                     'summary.json', 'snapshot/', '--restart-repairs', '--base-ref']:
            self.assertIn(text, report)
        self.assertIn(command, report)
        argv = shlex.split(command.split(' && ', 1)[1])
        self.assertNotIn('--restart-repairs', argv)  # A previous acknowledgement is never silently repeated.
        self.assertEqual(argv[argv.index('--step') + 1], '15')
        self.assertEqual(argv[argv.index('--log-dir') + 1], '/tmp/private logs')
        self.assertEqual(argv[argv.index('--resume-path') + 1], 'src/a b.ts')
        self.assertEqual(argv[argv.index('--task-path') + 1], 'docs/confirmed task.md')
        self.assertEqual(argv[argv.index('--base-ref') + 1], 'abc123')
        self.assertEqual(argv[argv.index('--allow-path') + 1], 'extra files')

    def test_unknown_progress_is_not_claimed_complete_or_fresh(self):
        report, command = failure_report(self.summary(), {}, {}, Path('/tmp/run'))
        self.assertIn('No validated assessment', report)
        self.assertIn('No validated review', report)
        self.assertIn('no checkpoint', report)
        self.assertIn('zero/missing cost is not proof', report)
        self.assertNotIn('--base-ref', shlex.split(command.split(' && ', 1)[1]))
        self.assertIn('<PRE_TASK_COMMIT>', report)

    def test_long_errors_are_explicit_excerpts_with_raw_logs_retained(self):
        summary = self.summary()
        summary['error'] = 'x' * 20000
        report, _ = failure_report(summary, {}, {}, Path('/tmp/run'))
        self.assertIn('Excerpt only', report)
        self.assertNotIn('x' * 5000, report)

    def test_passing_checks_do_not_imply_review_approval(self):
        report, _ = failure_report(self.summary(), {'checks_passed': True}, {}, Path('/tmp/run'))
        self.assertIn('Latest completed check suite passed', report)
        self.assertIn('does not establish visual/native behavior or reviewer approval', report)

    def test_failure_and_interrupt_print_report_and_command_without_touching_plan(self):
        for exception in (h.InfrastructureError('Reviewer output/token budget exhausted'), KeyboardInterrupt()):
            with self.subTest(exception=type(exception).__name__), tempfile.TemporaryDirectory() as temp:
                root = Path(temp) / 'repo'
                root.mkdir()
                subprocess.run(['git', 'init', '-q'], cwd=root, check=True)
                plan = '- [ ] **15. Verify.** Done when checked.\n'
                (root / 'PLAN1.md').write_text(plan)
                logs = Path(temp) / 'logs'
                stderr = io.StringIO()
                def fail(args, runner, checkpoint):
                    runner.progress.update(step=15, phase='review', coder_attempts=1, checks_passed=True)
                    checkpoint.data.update(step=15, phase='reviewing', repairs_used=1, repair_limit=3, base='abc123')
                    runner.records.append({'command': ['pi', '--model', h.REVIEWER_MODEL], 'usage': [
                        {'totalTokens': 20, 'cost': {'total': 0.5}}]})
                    raise exception
                with patch.object(h, 'ROOT', root), patch.object(sys, 'argv', ['run_harness.py', '--log-dir', str(logs)]), \
                        patch.object(h, 'execute', side_effect=fail), redirect_stderr(stderr):
                    self.assertEqual(h.main(), 1)
                run = next(logs.glob('run-*'))
                report = (run / 'failure.md').read_text()
                summary = json.loads((run / 'summary.json').read_text())
                self.assertIn(str(run / 'failure.md'), stderr.getvalue())
                self.assertIn('Recovery command', stderr.getvalue())
                self.assertIn('--resume --step 15', stderr.getvalue())
                self.assertIn('$0.500000', report)
                self.assertEqual(summary['status'], 'failed')
                self.assertEqual(summary['progress']['phase'], 'review')
                self.assertEqual(summary['checkpoint']['repairs_used'], 1)
                self.assertEqual((root / 'PLAN1.md').read_text(), plan)

    def test_dirty_tree_preflight_still_reports_selected_task_and_recovery(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'repo'
            root.mkdir()
            subprocess.run(['git', 'init', '-q'], cwd=root, check=True)
            plan = '- [ ] **15. Verify.** Done when checked.\n'
            (root / 'PLAN1.md').write_text(plan)
            logs = Path(temp) / 'logs'
            with patch.object(h, 'ROOT', root), patch.object(sys, 'argv', ['run_harness.py', '--log-dir', str(logs)]), \
                    patch.object(h.Runner, 'agent') as agent, redirect_stderr(io.StringIO()):
                self.assertEqual(h.main(), 1)
            agent.assert_not_called()
            report = next(logs.glob('run-*/failure.md')).read_text()
            self.assertIn('Task:** 15', report)
            self.assertIn('repository preflight', report)
            self.assertIn('Working tree must be clean', report)
            self.assertIn('--resume --step 15', report)
            self.assertEqual((root / 'PLAN1.md').read_text(), plan)

    def test_success_does_not_create_failure_report(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'repo'
            root.mkdir()
            subprocess.run(['git', 'init', '-q'], cwd=root, check=True)
            logs = Path(temp) / 'logs'
            with patch.object(h, 'ROOT', root), patch.object(sys, 'argv', ['run_harness.py', '--log-dir', str(logs)]), \
                    patch.object(h, 'execute', return_value={'step': 15, 'repairs': 0, 'review': {'verdict': 'APPROVED'}}):
                self.assertEqual(h.main(), 0)
            run = next(logs.glob('run-*'))
            self.assertFalse((run / 'failure.md').exists())
            self.assertEqual(json.loads((run / 'summary.json').read_text())['status'], 'approved')


if __name__ == '__main__':
    unittest.main()
