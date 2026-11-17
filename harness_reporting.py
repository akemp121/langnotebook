"""Human-readable failure diagnostics; no repository mutations or model calls."""
from pathlib import Path
import shlex
import sys


def resume_command(root, configuration, step, checkpoint):
    command = [sys.executable, str(root / "run_harness.py"), "--resume"]
    if step is not None:
        command += ["--step", str(step)]
    # Preserve limits and discovery directory, but NEVER implicitly acknowledge
    # a new repair budget or adopt newly discovered unrelated work.
    for option in ("max_repairs", "timeout", "log_dir"):
        if configuration.get(option) is not None:
            command += ["--" + option.replace("_", "-"), str(configuration[option])]
    base = checkpoint.get("base") or configuration.get("base_ref")
    if base:
        command += ["--base-ref", base]
    for path in configuration.get("resume_path", []):
        command += ["--resume-path", path]
    for path in configuration.get("allow_path", []):
        if path not in ("src", "tests", "docs"):
            command += ["--allow-path", path]
    return f"cd {shlex.quote(str(root))} && {shlex.join(command)}"


def excerpt(value, limit=4000):
    text = str(value)
    return text if len(text) <= limit else text[:limit] + "\n[Excerpt only; full details in numbered logs/summary.json.]"


def failure_report(summary, progress, checkpoint, artifacts):
    configuration = summary["configuration"]
    step = progress.get("step") or checkpoint.get("step") or configuration.get("step")
    command = resume_command(Path(summary["repository"]), configuration, step, checkpoint)
    assessment = progress.get("assessment") or checkpoint.get("assessment") or {}
    phase = progress.get("phase", "startup")
    error = summary.get("error", "Unknown failure; inspect raw logs.")
    repairs = checkpoint.get("repairs_used")
    limit = checkpoint.get("repair_limit", configuration.get("max_repairs", "unknown"))
    lines = ["# Harness failure", "", f"- **Task:** {step if step is not None else 'not selected'}",
             f"- **Failed phase:** {phase}", f"- **Last durable phase:** {checkpoint.get('phase', 'no checkpoint prepared')}",
             f"- **Run duration:** {summary.get('seconds', 0):.1f}s",
             f"- **Repair budget used:** {repairs if repairs is not None else 'unknown (no checkpoint)'} / {limit}",
             "- **Work preserved:** no automatic reset, stash, discard, or commit; failure does not mark the task complete.",
             "", "## Failure / model or API error", "", "```text", excerpt(error), "```", "",
             "## Accomplished vs remaining", "",
             "Assessment entries are recorded evidence, not a claim of fresh verification:"]
    if progress.get("task"):
        lines.append(f"Selected task: {progress['task'].splitlines()[0]}")
    if progress.get("coder_report"):
        lines += ["", "Latest coder report (unverified; not independent approval):", "", "```text",
                  excerpt(progress["coder_report"]), "```"]
    criteria = assessment.get("criteria", [])
    if criteria:
        for item in criteria:
            lines.append(f"- **{item['status']}** — {item['criterion']}: {item['evidence']}")
    else:
        lines.append("- No validated assessment available; implementation progress is unknown. Inspect preserved files/diffs before coding again.")
    for action in assessment.get("remaining_actions", []):
        lines.append(f"- Remaining action: {action}")
    checks = progress.get("check_failures")
    if checks is None and checkpoint.get("phase") == "checks_failed":
        checks = checkpoint.get("feedback")
    lines += ["", "## Checks", ""]
    if checks:
        lines += ["```text", excerpt(checks), "```"]
    elif progress.get("checks_passed"):
        lines.append("Latest completed check suite passed; this does not establish visual/native behavior or reviewer approval.")
    else:
        lines.append("No completed passing check suite recorded for the current work in this run; inspect numbered logs.")
    review = progress.get("review") or checkpoint.get("findings") or {}
    lines += ["", "## Last validated reviewer findings", ""]
    if review:
        lines.append(f"{review.get('verdict', 'Unknown verdict')}: {review.get('summary', '')}")
        for finding in review.get("findings", []):
            lines.append(f"- `{finding['file']}:{finding['line']}` — {finding['message']}")
        if review.get("escalate"):
            lines.append("- Reviewer requested manual escalation.")
    else:
        lines.append("No validated review available. Protocol/API failure is not a rejection of the implementation.")
    commands = summary.get("commands", [])
    agents = [record for record in commands if record.get("command", [None])[0] == "pi"]
    lines += ["", "## Attempts and usage", "",
              f"- Agent invocations this run: {len(agents)} (includes assessment and format retries).",
              f"- Coder attempts entered this run: {progress.get('coder_attempts', 0)}.",
              f"- Reported tokens this run: {summary.get('reported_tokens', 0):,}.",
              f"- Reported cost this run: **${summary.get('reported_cost', 0):.6f} USD**.",
              "- Reported usage may omit interrupted requests; zero/missing cost is not proof of free usage."]
    for index, record in enumerate(commands, 1):
        if record.get("command", [None])[0] == "pi" or record.get("error") or record.get("returncode", 0) != 0:
            lines.append(f"- `{index:03d}` {shlex.join(record['command'])}: "
                         f"exit={record.get('returncode', 'incomplete')}, {record.get('seconds', 0):.1f}s; "
                         f"{record.get('error', '')}")
    lines += ["", "## Recover", "",
              "1. Inspect this report and preserved work. Resolve API access, budget, protocol, or scope issues first.",
              "2. Resume with the same log directory and limits (this command does not reset the repair budget):", "",
              "```bash", command, "```", "",
              "If the budget is exhausted, only after manual inspection append `--restart-repairs` to explicitly acknowledge a fresh budget.",
              "If no original base can be reconstructed, add `--base-ref <PRE_TASK_COMMIT>` after identifying the correct commit; never guess HEAD.",
              "For unattributed files, move unrelated work away; add repeated `--resume-path PATH` only for inspected task-related files.",
              "Plan/checkpoint conflicts or another active run require manual resolution before resuming.", "",
              "## Artifacts", "", f"- Run directory: `{artifacts}`",
              "- `summary.json`: structured error, configuration, commands, usage, and progress.",
              "- Numbered `.prompt.txt`, `.stdout.log`, `.stderr.log`: full command/agent evidence.",
              "- `attempt-*.diff`, `attempt-*.feedback.txt`, `assessment.json`, and `snapshot/` exist only if their phases were reached.",
              "- Logs/snapshots contain source and prompts; keep them private.", ""]
    return "\n".join(lines), command
