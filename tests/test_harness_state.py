"""Checkpoint/snapshot tests: real temporary Git repositories, no paid calls."""
import json
import tarfile
import unittest
from unittest.mock import patch

import test_harness_resume as fixtures

assessment = fixtures.assessment
PLAN = fixtures.PLAN
import run_harness as h
from harness_state import TaskCheckpoint, StateError, digest


class StateTests(unittest.TestCase):
    setUp = fixtures.ResumeTests.setUp
    git = fixtures.ResumeTests.git

    def state(self, fingerprint=None, prior=()):
        self.args.base_ref = getattr(self.args, 'base_ref', 'HEAD^')
        self.args.resume_path = getattr(self.args, 'resume_path', [])
        self.args.restart_repairs = getattr(self.args, 'restart_repairs', False)
        folder = self.logs.parent / f'run-state-{len(list(self.logs.parent.iterdir()))}'
        folder.mkdir()
        runner = h.Runner(self.root, folder, 5)
        state = TaskCheckpoint(runner, self.args)
        state.prepare((self.root / 'PLAN1.md').read_text(), 2, fingerprint or digest(PLAN), prior)
        return state

    def test_snapshot_preserves_index_dirty_untracked_plan_and_head(self):
        source = self.root / 'src/preview.txt'
        source.write_text('staged')
        self.git('add', 'src/preview.txt')
        source.write_text('unstaged')
        (self.root / 'src/new.txt').write_text('untracked')
        self.args.resume_path = ['src/preview.txt', 'src/new.txt']
        before = self.git('diff', '--cached')
        state = self.state()
        snapshot = state.runner.artifacts / 'snapshot'
        self.assertEqual((snapshot / 'HEAD').read_text().strip(), self.git('rev-parse', 'HEAD').strip())
        self.assertEqual((snapshot / 'PLAN1.md').read_text(), PLAN)
        self.assertEqual((snapshot / 'index').read_bytes(), (self.root / '.git/index').read_bytes())
        with tarfile.open(snapshot / 'files.tar') as archive:
            self.assertEqual(archive.extractfile('src/preview.txt').read(), b'unstaged')
            self.assertEqual(archive.extractfile('src/new.txt').read(), b'untracked')
        self.assertEqual(self.git('diff', '--cached'), before)
        self.assertEqual(source.read_text(), 'unstaged')

    def test_dirty_unattributed_or_out_of_scope_files_rejected(self):
        (self.root / 'src/unrelated.txt').write_text('user work')
        with self.assertRaisesRegex(StateError, 'Unattributed'):
            self.state()
        self.assertEqual((self.root / 'src/unrelated.txt').read_text(), 'user work')
        (self.root / 'outside.txt').write_text('unrelated')
        self.args.resume_path = ['src/unrelated.txt', 'outside.txt']
        with self.assertRaisesRegex(StateError, 'out-of-scope'):
            self.state()

    def test_repairs_survive_interruption_and_require_acknowledged_restart(self):
        state = self.state()
        state.start_coder()
        self.assertEqual(state.data['repairs_used'], 0)
        resumed = self.state()
        resumed.start_coder()  # Interrupted coding consumes the original attempt.
        self.assertEqual(resumed.data['repairs_used'], 1)
        resumed.start_coder()
        resumed.start_coder()
        resumed.save('rejected', feedback='still missing', findings={'problem': 'missing tests'})
        with self.assertRaisesRegex(StateError, 'Repair budget exhausted'):
            self.state()
        self.args.restart_repairs = True
        restarted = self.state()
        self.assertEqual(restarted.data['repairs_used'], 0)
        self.assertTrue(restarted.data['budget_restart_acknowledged'])

    def test_changed_plan_or_budget_cannot_silently_reset_state(self):
        self.state()
        with self.assertRaisesRegex(StateError, 'Task/plan changed'):
            self.state(fingerprint='different plan')
        self.args.max_repairs = 2
        with self.assertRaisesRegex(StateError, 'Repair limit changed'):
            self.state()

    def test_new_committed_unrelated_file_is_excluded_but_dirty_edit_blocks(self):
        self.state()
        self.args.base_ref = None
        (self.root / 'src/unrelated.txt').write_text('unrelated committed work')
        self.git('add', 'src/unrelated.txt')
        self.git('commit', '-qm', 'unrelated change')
        resumed = self.state()
        self.assertNotIn('src/unrelated.txt', resumed.data['task_scope'])
        self.assertEqual((self.root / 'src/unrelated.txt').read_text(), 'unrelated committed work')
        (self.root / 'src/unrelated.txt').write_text('new unrelated edit')
        with self.assertRaisesRegex(StateError, 'Unattributed'):
            self.state()

    def test_stale_assessment_invalidated_without_resetting_repairs(self):
        state = self.state()
        state.start_coder()
        state.start_coder()
        state.save('coded', assessment=assessment())
        (self.root / 'src/preview.txt').write_text('manually adjusted task content')
        resumed = self.state()
        self.assertFalse(resumed.reusable)
        self.assertEqual(resumed.data['repairs_used'], 1)

    def test_corrupt_checkpoint_requires_manual_inspection(self):
        (self.root / '.git/harness-checkpoint.json').write_text('not JSON')
        with self.assertRaisesRegex(StateError, 'corrupt'):
            self.state()

    def test_legacy_missing_base_requires_explicit_reference(self):
        self.args.base_ref = None
        with self.assertRaisesRegex(StateError, '--base-ref'):
            self.state()
        self.args.base_ref = 'HEAD^'
        state = self.state()
        self.assertEqual(state.data['base'], self.git('rev-parse', 'HEAD^').strip())

    def test_legacy_logs_reconstruct_original_base_not_current_head(self):
        self.args.base_ref = None
        folder = self.logs.parent / 'run-legacy'
        folder.mkdir()
        (folder / 'summary.json').write_text(json.dumps({'commands': [{'command': ['git', 'rev-parse', 'HEAD']}]}))
        base = self.git('rev-parse', 'HEAD^').strip()
        (folder / '001.stdout.log').write_text(base + '\n')
        state = self.state(prior=[str(folder)])
        self.assertEqual(state.data['base'], base)
        _, changes = h.capture_changes(state.runner, self.git('rev-parse', 'HEAD').strip(), PLAN,
                                       self.args.allow_path, recovery=True, base=base)
        self.assertIn('+configurable content', changes)

    def test_review_failure_resumes_review_without_recoding_or_reassessment(self):
        self.args.base_ref = 'HEAD^'
        self.args.resume_path = []
        self.args.restart_repairs = False
        def initial(model, thinking, prompt, **kwargs):
            if kwargs.get('assessment'):
                return json.dumps(assessment())
            if kwargs.get('reviewer'):
                raise h.InfrastructureError('reviewer unavailable')
            (self.root / 'src/tests.txt').write_text('remaining tests')
            return 'Added tests'
        with patch.object(self.runner, 'agent', side_effect=initial), patch.object(self.runner, 'checks', return_value=''):
            with self.assertRaises(h.InfrastructureError):
                h.execute(self.args, self.runner, TaskCheckpoint(self.runner, self.args))
        saved = json.loads((self.root / '.git/harness-checkpoint.json').read_text())
        self.assertEqual(saved['phase'], 'reviewing')
        self.assertIsNotNone(saved['assessment'])
        folder = self.logs.parent / 'run-next'
        folder.mkdir()
        runner = h.Runner(self.root, folder, 5)
        approved = {'verdict': 'APPROVED', 'summary': 'Complete', 'findings': [], 'escalate': False}
        with patch.object(runner, 'agent', return_value=json.dumps(approved)) as agent, patch.object(runner, 'checks', return_value=''):
            h.execute(self.args, runner, TaskCheckpoint(runner, self.args))
        self.assertEqual(agent.call_count, 1)
        self.assertTrue(agent.call_args.kwargs['reviewer'])
        self.assertEqual(json.loads((self.root / '.git/harness-checkpoint.json').read_text())['phase'], 'approved')


if __name__ == '__main__':
    unittest.main()
