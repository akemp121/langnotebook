# Harness usage

The original refactor proposal is superseded by the completed checklist in
[AGENT_REFACTOR2.md](AGENT_REFACTOR2.md). This page describes the current CLI.

## Requirements and models

Linux/macOS, Python 3.10+, Git, Node/npm, installed project dependencies, and an
authenticated Pi CLI. The harness itself needs no additional Python packages.

Roles are fixed in `run_harness.py`:

| Role | Model | Reasoning | Tools |
| --- | --- | --- | --- |
| Coder | `openai/gpt-6.1-sol` | high | read, bash, edit, write |
| Resume assessment | `openai/gpt-6.1-sol` | high | read/search only |
| Reviewer | `openai/gpt-6-luna` | low | read/search only |

There are no model/thinking CLI options or automatic reviewer-model fallback.
Your API key/project must allow both models; `pi --list-models` is a catalog, not
proof of access. Extensions, MCP, skills, and prompt templates are disabled for
these subprocesses. Tool restrictions are guardrails, **not an OS sandbox**.

## Start one task

Review and commit your existing work first. Normal runs require a clean Git tree,
including untracked files, and no unfinished harness checkpoint.

```bash
python3 run_harness.py
```

This selects the first unchecked top-level task in `PLAN1.md`. To explicitly
select another unfinished task (which may skip prerequisites):

```bash
python3 run_harness.py --step 15
```

The coder gets the task, full plan/preservation rules, `AGENTS.md`, and
`docs/SPEC.md`. Baseline failures stop normal runs. After coding, lint, typecheck,
and existing Node tests must pass before independent review. Rejections and check
failures share **at most three coder repairs after the initial attempt**. Lower
that limit with `--max-repairs 0|1|2`; it cannot exceed three. Each subprocess has
a 900-second timeout by default (`--timeout SECONDS`).

Success checks off only the selected task, records verification evidence, and
stops. Nothing is auto-committed. Inspect the changes and any unavailable visual/
native checks, then commit before starting the next task.

## Resume partial or failed work

Do not run a normal task again merely because review failed. Inspect the printed
`failure.md` report, then use its exact recovery command, typically:

```bash
python3 run_harness.py --resume
```

An optional `--step N` selects a specific unfinished task. Resume supports both
committed partial work and uncommitted work. It assesses current files and prior
evidence, creates/updates a nested recovery sub-plan under that task, and executes
only remaining work. Already implemented work can proceed straight to fresh
checks/review without another coder call or a new code diff.

Valid checkpoints preserve the original comparison base, phase, assessment,
findings, and repair usage. A reviewer outage can resume review without repeating
completed coding. File changes invalidate cached work as appropriate, but **do
not reset the repair budget**. An interrupted coder invocation consumes an attempt.

### When resume requests more information

- **Legacy run without a trustworthy base:** identify the commit immediately
  before task work, not simply the current HEAD. For example, first inspect
  `git log --oneline`, then substitute that commit in:
  ```bash
  python3 run_harness.py --resume --step 15 --base-ref PRE_TASK_COMMIT
  ```
  Legacy logs may supply the base automatically. New checkpoints retain it;
  conflicting base references are rejected.
- **Unattributed task files:** inspect each file first. Move unrelated work away;
  explicitly acknowledge only task-related paths, repeating the flag as needed:
  ```bash
  python3 run_harness.py --resume --resume-path src/lessons/grammar.tsx
  ```
  This is acknowledgement, not a request to discard or stage the file.
- **Exhausted budget:** inspect/fix the work and findings manually before
  explicitly authorizing a fresh budget:
  ```bash
  python3 run_harness.py --resume --restart-repairs
  ```
  Merely rerunning resume never grants a new budget. Keep the same repair limit
  and log parent as the prior run; the failure report preserves these options.
- **Plan/checkpoint conflicts or corrupt state:** stop and inspect manually. Do
  not delete the checkpoint merely to bypass a limit. Another running harness
  holds a repository lock and must finish or stop before recovery can proceed.

## Scope, verification, and safety

Default editable paths are `src/`, `tests/`, and `docs/`. Add a necessary specific
file/directory with repeated `--allow-path PATH` flags. `PLAN1.md` is harness-owned.
Unrelated/out-of-scope changes are rejected; broadening scope is not a substitute
for reviewing unrelated work.

Before edits, runs snapshot HEAD, the Git index, plan, tracked files, and
nonignored untracked file contents. Snapshots do **not** include ignored untracked
files, `.git` history, or external resources, and are not an OS sandbox. No automatic reset, stash,
discard, branch switch, or commit is performed. Keep unrelated work out of agent
runs regardless of backups.

Review prompts exclude binary patch encodings, list image paths for selective
reads, and split large text changes into bounded parts. Every part must pass.
A completed but malformed review gets one formatting retry per part. API errors,
timeouts, empty/output-limited responses, and persistent protocol failures stop
without asking the coder to reimplement the task. Reported automated checks do not
establish native-device behavior or visual correctness by themselves.

## Logs, snapshots, and cost

The printed run directory defaults to
`~/.local/state/langnotebook-harness/run-*`. Change its parent with
`--log-dir /outside/repository/path`, and use the same parent when resuming so
prior logs can be discovered. Paths otherwise resolve from the script directory.

- `failure.md`: failure-only progress, findings, errors, cost, and recovery command.
- `summary.json`: structured configuration, progress, commands, checkpoint metadata,
  provider-reported tokens, and `reported_cost` in USD for this run only.
- Numbered prompts/stdout/stderr, attempt diffs/feedback, and assessment evidence:
  full diagnostic context for phases reached.
- `snapshot/`: HEAD, index, plan, file archive, and manifest; inspect before any
  manual restoration. The active checkpoint is worktree-local at the path from
  `git rev-parse --git-path harness-checkpoint.json`.

Output is file-backed. For live progress, use
`tail -f /printed/run/path/NNN.stdout.log` in another terminal. Keep logs/snapshots
private: they contain source, prompts, and potentially sensitive project content.
Missing or interrupted usage can undercount; zero reported cost does not imply
free usage. Use your provider's billing dashboard for actual charges. No paid
end-to-end/model-quality benchmark has been performed by the offline test suite.

## Validate without paid calls

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.test.cjs
npm run lint
npm run typecheck
```

Harness tests use mocked agents/subprocesses and temporary Git repositories, not
live model calls. Coverage includes fixed roles, feedback delivery, shared repair
limits, protocol/API failures, binary-free/bounded reviews, committed/dirty resume,
unrelated-change rejection, nested sub-plans, no-op approval, interruption and
cross-run budget persistence, snapshots, and actionable failure reports.

Use `python3 run_harness.py --help` for the complete current option list.
