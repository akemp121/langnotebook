"""Regression coverage for task history mixed with committed harness refactors."""
import json
import unittest
from unittest.mock import patch

import test_harness_resume as fixtures
import run_harness as h
from harness_state import StateError, TaskCheckpoint, digest


class TaskScopeTests(unittest.TestCase):
    setUp = fixtures.ResumeTests.setUp
    git = fixtures.ResumeTests.git

    def legacy(self, name='run-original', diff=None):
        folder = self.logs.parent / name
        folder.mkdir()
        base = self.git('rev-parse', 'HEAD^').strip()
        (folder / 'summary.json').write_text(json.dumps({'commands': [{'command': ['git', 'rev-parse', 'HEAD']}]}))
        (folder / '001.stdout.log').write_text(base + '\n')
        (folder / 'attempt-0.diff').write_text(diff if diff is not None else self.git('diff', base, 'HEAD', '--', 'src/preview.txt'))
        return folder, base

    def prepare(self, folder):
        self.args.task_path = []
        self.args.base_ref = None
        state = TaskCheckpoint(self.runner, self.args)
        state.prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [str(folder)])
        return state

    def test_legacy_task_scope_excludes_intervening_harness_commits_from_review(self):
        folder, base = self.legacy()
        (self.root / 'AGENT_REFACTOR2.md').write_text('Unrelated harness plan')
        (self.root / 'harness_state.py').write_text('unrelated harness refactor')
        (self.root / 'src/unrelated.txt').write_text('unrelated committed source')
        self.git('add', '.')
        self.git('commit', '-qm', 'Harness refactor after partial task')
        before = self.git('status', '--porcelain')
        state = self.prepare(folder)
        self.assertEqual(state.data['base'], base)
        self.assertEqual(state.data['task_scope'], ['src/preview.txt'])
        _, diff = h.capture_changes(self.runner, self.git('rev-parse', 'HEAD').strip(), fixtures.PLAN,
                                    self.args.allow_path, recovery=True, base=base, task_scope=set(state.data['task_scope']))
        approval = {'verdict': 'APPROVED', 'summary': 'Complete', 'findings': [], 'escalate': False}
        with patch.object(self.runner, 'agent', return_value=json.dumps(approval)) as agent:
            h.review_changes(self.runner, 'Review task criteria', diff)
        prompt = agent.call_args.args[2]
        self.assertIn('+configurable content', prompt)
        for path in ('AGENT_REFACTOR2.md', 'harness_state.py', 'src/unrelated.txt'):
            self.assertNotIn(path, prompt)
        self.assertEqual((self.root / 'AGENT_REFACTOR2.md').read_text(), 'Unrelated harness plan')
        self.assertEqual(self.git('status', '--porcelain'), before)
        self.assertEqual(json.loads(state.path.read_text())['task_scope'], ['src/preview.txt'])
        (self.root / 'src/unrelated.txt').write_text('unrelated dirty change')
        next_folder = self.logs.parent / 'run-next'
        next_folder.mkdir()
        runner = h.Runner(self.root, next_folder, 5)
        with patch.object(runner, 'agent') as agent, self.assertRaisesRegex(StateError, 'Unattributed'):
            TaskCheckpoint(runner, self.args).prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [str(folder)])
        agent.assert_not_called()

    def test_step_15_execute_resumes_after_committed_harness_refactor(self):
        folder, base = self.legacy()
        (folder / 'summary.json').write_text(json.dumps({'step': 15, 'commands': [{'command': ['git', 'rev-parse', 'HEAD']}]}))
        plan = fixtures.PLAN.replace('**2.', '**15.').replace('**3.', '**16.')
        (self.root / 'PLAN1.md').write_text(plan)
        (self.root / 'AGENT_REFACTOR2.md').write_text('Unrelated committed harness plan')
        self.git('add', '.')
        self.git('commit', '-qm', 'Harness changes after task 15')
        self.args.step = 15
        self.args.task_path = []
        self.args.base_ref = None
        complete = {'step': 15, 'criteria': [{'criterion': 'Existing work', 'status': 'satisfied',
                                             'evidence': 'src/preview.txt:1'}], 'remaining_actions': []}
        approval = {'verdict': 'APPROVED', 'summary': 'Complete', 'findings': [], 'escalate': False}
        with patch.object(self.runner, 'agent', side_effect=[json.dumps(complete), json.dumps(approval)]) as agent, \
                patch.object(self.runner, 'checks', return_value=''):
            result = h.execute(self.args, self.runner, TaskCheckpoint(self.runner, self.args))
        self.assertEqual(result['step'], 15)
        self.assertEqual(agent.call_count, 2)
        self.assertTrue(agent.call_args.kwargs['reviewer'])
        self.assertNotIn('AGENT_REFACTOR2.md', agent.call_args.args[2])
        self.assertIn('- [x] **15.', (self.root / 'PLAN1.md').read_text())
        self.assertEqual((self.root / 'AGENT_REFACTOR2.md').read_text(), 'Unrelated committed harness plan')
        saved = json.loads((self.root / '.git/harness-checkpoint.json').read_text())
        self.assertEqual(saved['base'], base)
        self.assertEqual(saved['task_scope'], ['src/preview.txt'])

    def test_missing_or_conflicting_scope_requires_explicit_file_confirmation(self):
        self.args.base_ref = 'HEAD^'
        self.args.task_path = []
        with self.assertRaisesRegex(StateError, '--task-path'):
            TaskCheckpoint(self.runner, self.args).prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [])
        first, _ = self.legacy()
        second, _ = self.legacy('run-conflict', 'diff --git a/src/other.txt b/src/other.txt\n+other\n')
        with self.assertRaisesRegex(StateError, 'ambiguous'):
            TaskCheckpoint(self.runner, self.args).prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [str(first), str(second)])
        self.args.task_path = ['src/preview.txt']
        state = TaskCheckpoint(self.runner, self.args)
        state.prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [str(first), str(second)])
        self.assertEqual(state.data['task_scope'], ['src/preview.txt'])

    def test_scope_expansion_needs_acknowledgement_and_preserves_budget(self):
        folder, _ = self.legacy()
        state = self.prepare(folder)
        state.start_coder()
        state.start_coder()
        (self.root / 'src/additional.txt').write_text('new task file')
        with self.assertRaisesRegex(StateError, 'outside task scope'):
            state.save('coded')
        self.args.task_path = ['src/additional.txt']
        next_folder = self.logs.parent / 'run-expanded'
        next_folder.mkdir()
        runner = h.Runner(self.root, next_folder, 5)
        resumed = TaskCheckpoint(runner, self.args)
        resumed.prepare(fixtures.PLAN, 2, digest(fixtures.PLAN), [str(folder)])
        self.assertEqual(resumed.data['repairs_used'], 1)
        self.assertEqual(resumed.data['task_scope'], ['src/additional.txt', 'src/preview.txt'])

    def test_saved_manifest_alone_can_identify_task_files(self):
        folder, base = self.legacy(diff='Changed-file manifest (binary/image paths may be read selectively):\n' +
                                   json.dumps('src/preview.txt') + ': sha256=' + 'a' * 64 + '\n')
        state = TaskCheckpoint(self.runner, self.args)
        self.assertEqual(state.saved_scope([str(folder)], base), {'src/preview.txt'})

    def test_git_quoted_unicode_and_space_paths_recovered(self):
        folder, base = self.legacy()
        path = 'src/é sample.txt'
        (self.root / path).write_text('task content')
        self.git('add', path)
        patch_text = self.git('diff', '--cached', '--', path)
        (folder / 'attempt-0.diff').write_text(patch_text)
        state = TaskCheckpoint(self.runner, self.args)
        self.assertEqual(state.saved_scope([str(folder)], base), {path})


if __name__ == '__main__':
    unittest.main()
