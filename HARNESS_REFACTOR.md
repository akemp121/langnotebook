# Harness refactor

**Original assessment:** `run_harness.py` was a useful typecheck/repair wrapper, but accepted empty tasks, ignored agent failures/reviewer verdicts, and reviewed incomplete diffs.

**Implemented:** single-step execution, blocking checks/review, clean-tree isolation, scoped complete diffs, per-role models, stronger-review escalation, saved logs/usage, repository locking, and offline harness tests. The checklist below records the design; cheaper-model quality still needs empirical evaluation.

Implement in order:

1. **Select exactly one step.** Default to the first unchecked task in `PLAN1.md` (currently 10); allow `--step N`, rejecting missing/completed steps. Pass its full text, completion criteria, plan-wide preservation rules, `AGENTS.md`, and the correct specification path (`docs/SPEC.md`, not `SPEC.md`). Prohibit advancing to other steps.
2. **Make execution deterministic.** Resolve paths/cwd from the script location; invoke Pi explicitly with `--print` or `--mode json`. Check every subprocess exit code, including Git and agents. Add timeouts, process-tree cleanup, bounded retries, and nonzero exit on failure/interruption. Drain output while sending stdin to avoid pipe deadlocks.
3. **Isolate and capture changes.** Require a clean tree or use a dedicated worktree; never reset user changes. Capture tracked, staged, and untracked changes, including new tests/files—not just `git diff`. Reject unexpected scope changes; keep failed work available for inspection.
4. **Gate on real checks.** Run baseline and post-change `npm run lint`, `npm run typecheck`, and `node --test tests/*.test.cjs`. Distinguish pre-existing failures. Feed failed checks back to the coder within one shared repair budget; rerun all checks after every repair. Record unavailable visual/native checks honestly.
5. **Enforce review.** Give a fresh reviewer the complete change set, relevant files, exact completion criteria, and check results. Use read-only tools (no shell/write access; disable MCP/extensions for this role). Require validated JSON with verdict, actionable findings, and file/line references. Rejection triggers bounded coder repair and re-review; malformed output, crashes, or exhausted retries block completion.
6. **Configure models per role.** Add `--coder-model` and `--reviewer-model` using Pi's `--model provider/id`; independently configure `--thinking`. Start with a cheaper reviewer and low thinking, retaining the stronger coder. Escalate ambiguous/high-risk findings or repeated review failures to the stronger model; never silently treat reviewer failure as approval.
7. **Track completion and effectiveness.** Only the harness marks the selected checkbox complete after all gates pass; append evidence and stop. Save per-run prompts, outputs, diffs, check results, model IDs, elapsed time, retries, tokens, and reported/estimated cost. Compare cheaper vs stronger reviewers on identical saved changes with seeded defects and human-checked verdicts; choose by missed defects and total cost per accepted step, not token price alone.
8. **Test the harness without paid calls.** Mock subprocesses using Python's standard library: cover task selection, agent/Git failure, timeout, malformed/rejected review, staged/untracked files, repair exhaustion, and success-only checkbox updates. No new orchestration framework needed.

## How to use

Requires Linux/macOS, Python 3.10+, Git, Node/npm, installed project dependencies, and an authenticated Pi CLI. No additional Python packages are needed.

1. Review and commit these harness changes first: **every run requires a clean Git tree**, including untracked files. The harness never commits, resets, or stashes your work.
2. Find exact model IDs available to your Pi installation:
   ```bash
   pi --list-models
   ```
3. Replace the values below with real `provider/model-id` values. Run the first unfinished step (currently step 10):
   ```bash
   CODER='openai/gpt-6.1-sol'
   REVIEWER='openai/gpt-6.1-terra'
   python3 run_harness.py --coder-model "openai/gpt-6.1-sol" --reviewer-model "openai/gpt-6.1-terra"
   ```
   Or select one specific unfinished step:
   ```bash
   python3 run_harness.py --step 10 --coder-model "$CODER" --reviewer-model "$REVIEWER"
   ```

**Defaults:** high coder thinking, low reviewer thinking, two repairs total, and a 900-second timeout per subprocess. Override with `--coder-thinking`, `--reviewer-thinking`, `--max-repairs`, or `--timeout`; use `--help` for all options. Paths resolve from the script, not your terminal directory. Explicit `--step` may skip ahead; default selection preserves plan order.

**Scope and review:** edits are limited to `src/`, `tests/`, and `docs/`. Add a necessary file/directory with repeated `--allow-path path` options. `PLAN1.md` remains harness-owned. Reviewers get read/search tools only, with extensions/MCP disabled; route changes, subsequent repairs, reviewer errors, and requested escalation use the coder model for fresh stronger review. This is a guardrail, **not an OS sandbox**: the coder can execute shell commands.

**Results:** each run stops after one step. Success marks only that checkbox, records verification evidence, and leaves changes uncommitted. Review the diff, perform any unavailable visual/device checks, and commit before the next run. Failure exits nonzero, leaves the checkbox unchanged, and preserves changes; inspect/fix them manually and commit or move them before retrying. The script does not automatically resume a dirty failed run.

**Logs and cost:** the printed run directory defaults to `~/.local/state/langnotebook-harness/run-*`; use `--log-dir /outside/repository/path` to change its parent. Numbered prompt/stdout/stderr logs, per-attempt diffs, and `summary.json` retain commands, timing, retries on success, model settings, and provider-reported usage/cost. Output is file-backed rather than streamed; use `tail -f /printed/run/path/NNN.stdout.log` for live progress. Logs contain source/prompts: keep them private. Missing usage is not estimated; subscription pricing may differ from reported cost.

**Validate without paid calls:**
```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
npm run lint
npm run typecheck
node --test tests/*.test.cjs
```

**Evaluate the cheaper reviewer:** use saved diffs (including deliberately seeded defects) for paired cheap/strong reviews and human adjudication. Record missed defects, false alarms, elapsed time, and total cost including repairs/escalation. No automatic model benchmark or paid end-to-end run is included; retain the cheaper model only if its measured quality is acceptable.
