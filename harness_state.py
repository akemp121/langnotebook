"""Durable harness state and non-destructive Git snapshots (standard library)."""
import ast
import hashlib
import re
import json
import os
from pathlib import Path
import shutil
import tarfile


class StateError(RuntimeError):
    pass


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


class TaskCheckpoint:
    def __init__(self, runner, args):
        self.runner, self.args = runner, args
        self.data = {}
        self.reusable = False

    def git(self, *args):
        return self.runner.git(*args).strip()

    def files(self):
        names = self.runner.git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0")
        result = {}
        for name in sorted(set(filter(None, names))):
            path = self.runner.root / name
            if path.is_symlink():
                content = b"symlink:" + os.readlink(path).encode()
            elif path.is_file():
                content = f"file:{path.stat().st_mode}:".encode() + path.read_bytes()
            elif path.exists():
                raise StateError(f"Unsupported directory/submodule in snapshot: {name}")
            else:
                content = b"deleted:"
            result[name] = hashlib.sha256(content).hexdigest()
        return result

    def changed(self, base):
        tracked = self.runner.git("diff", "--name-only", "-z", "--no-renames", base, "--").split("\0")
        other = self.runner.git("ls-files", "--others", "--exclude-standard", "-z").split("\0")
        return set(filter(None, tracked + other)) - {"PLAN1.md"}

    def legacy_base(self, directories):
        # The first logged HEAD is the original comparison base, not the failed
        # run's final working tree. Never infer a base from a commit title.
        candidates = []
        for directory in directories:
            folder = Path(directory)
            summary = json.loads((folder / "summary.json").read_text())
            for index, record in enumerate(summary.get("commands", []), 1):
                if record.get("command") == ["git", "rev-parse", "HEAD"]:
                    log = folder / f"{index:03d}.stdout.log"
                    if log.exists():
                        candidates.append(log.read_text().strip())
                        break
        if not candidates:
            raise StateError("No trustworthy original task base found. Resume with --base-ref REF (the commit before task work).")
        base = candidates[0]
        for candidate in candidates[1:]:
            ancestor = self.git("merge-base", base, candidate)
            if ancestor == candidate:
                base = candidate
            elif ancestor != base:
                raise StateError("Legacy logs have divergent bases; supply --base-ref REF explicitly.")
        return base

    def saved_scope(self, directories, base):
        scopes = []
        for directory in directories:
            folder = Path(directory)
            # Scope evidence must originate at the same pre-task base.
            try:
                if self.legacy_base([directory]) != base:
                    continue
            except StateError:
                continue
            diffs = sorted(folder.glob("attempt-*.diff"), key=lambda p: p.stat().st_mtime)
            if not diffs:
                continue
            paths = set()
            in_manifest = False
            for line in diffs[-1].read_text().splitlines():
                if line == "Changed-file manifest (binary/image paths may be read selectively):":
                    in_manifest = True
                    continue
                if in_manifest:
                    match = re.fullmatch(r'("(?:\\.|[^"\\])*"): (?:sha256=[a-f0-9]{64}|deleted)', line)
                    if match:
                        paths.add(json.loads(match[1]))
                    continue
                if not line.startswith("diff --git "):
                    continue
                raw = line[len("diff --git "):]
                if raw.startswith('"'):
                    tokens = re.findall(r'"(?:\\.|[^"\\])*"|\S+', raw)
                    if len(tokens) != 2:
                        raise StateError("Ambiguous saved task scope; confirm files with repeated --task-path PATH.")
                    names = []
                    for token in tokens:
                        try:
                            name = ast.literal_eval(token) if token.startswith('"') else token
                        except (SyntaxError, ValueError) as exc:
                            raise StateError("Unreadable saved task paths; confirm files with --task-path PATH.") from exc
                        try:
                            name = name.encode('latin1').decode('utf8')
                        except (UnicodeError, ValueError):
                            pass
                        names.append(name[2:])
                    paths.update(names)
                else:
                    match = re.fullmatch(r'a/(.*?) b/(.*)', raw)
                    if not match or match[1] != match[2]:
                        raise StateError("Ambiguous saved task scope; confirm files with repeated --task-path PATH.")
                    paths.add(match[1])
            paths.discard("PLAN1.md")
            if paths:
                scopes.append(paths)
        if not scopes or any(scope != scopes[0] for scope in scopes[1:]):
            raise StateError("Task file scope unavailable or ambiguous; confirm the task files with repeated --task-path PATH. --base-ref alone does not confirm scope.")
        return scopes[0]

    def prepare(self, plan, step, fingerprint, prior):
        root = self.runner.root
        git_dir = Path(self.git("rev-parse", "--absolute-git-dir"))
        self.path = git_dir / "harness-checkpoint.json"
        try:
            old = json.loads(self.path.read_text()) if self.path.exists() else None
        except (OSError, ValueError) as exc:
            raise StateError("Checkpoint is unreadable/corrupt; inspect it manually rather than resetting the budget.") from exc
        if old is not None and (not isinstance(old, dict) or old.get("version") != 1):
            raise StateError("Unsupported checkpoint format; inspect it manually before recovery.")
        resume = self.args.resume
        if old and old.get("repository") != str(root):
            raise StateError("Checkpoint belongs to a different repository/worktree.")
        if old and old.get("phase") != "approved":
            if not resume:
                raise StateError("An unfinished checkpoint exists; use --resume, not a fresh run.")
            if old.get("step") != step or old.get("plan_fingerprint") != fingerprint:
                raise StateError("Task/plan changed since the checkpoint; inspect manually before recovery.")
        else:
            old = None
        base_ref = getattr(self.args, "base_ref", None)
        if old and base_ref:
            if self.git("rev-parse", "--verify", base_ref + "^{commit}") != old["base"]:
                raise StateError("--base-ref conflicts with the original checkpoint base.")
        base = old["base"] if old else base_ref or (self.legacy_base(prior) if resume else self.git("rev-parse", "HEAD"))
        base = self.git("rev-parse", "--verify", base + "^{commit}")
        self.runner.run(["git", "merge-base", "--is-ancestor", base, "HEAD"])
        changed = self.changed(base)
        explicit = set(getattr(self.args, "task_path", []) or [])
        acknowledged = set(getattr(self.args, "resume_path", []) or [])
        recorded_scope = old.get("task_scope") if old else None
        if resume:
            scope = (set(recorded_scope) if recorded_scope is not None else
                     explicit or self.saved_scope(prior, base)) | explicit | acknowledged
        else:
            scope = set(changed)
        if any(Path(name).is_absolute() or '..' in Path(name).parts or name in ('', '.', 'PLAN1.md')
               or (root / name).is_dir() for name in scope):
            raise StateError("Task scope must contain relative file paths, excluding PLAN1.md.")
        allowed = self.args.allow_path
        for name in scope | self.changed("HEAD"):
            if not any(name == p.rstrip("/") or name.startswith(p.rstrip("/") + "/") for p in allowed):
                raise StateError(f"Unrelated/out-of-scope task change: {name}; do not absorb it into recovery.")
        current = self.files()
        dirty = self.changed("HEAD")
        unattributed = dirty - scope
        if resume and unattributed:
            raise StateError("Unattributed working-tree/committed changes: " + ", ".join(sorted(unattributed)) +
                             ". Move unrelated work away or explicitly acknowledge task files with --resume-path PATH.")
        self.scope = scope
        self.protected = {name: value for name, value in current.items() if name not in scope and name != "PLAN1.md"}
        # A complete backup is made before assessment, plan edits, checks or coding.
        snapshot = self.runner.artifacts / "snapshot"
        snapshot.mkdir()
        (snapshot / "HEAD").write_text(self.git("rev-parse", "HEAD") + "\n")
        (snapshot / "PLAN1.md").write_text(plan)
        index = Path(self.git("rev-parse", "--git-path", "index"))
        if not index.is_absolute():
            index = root / index
        if index.exists():
            shutil.copyfile(index, snapshot / "index")
        with tarfile.open(snapshot / "files.tar", "w") as archive:
            for name in current:
                file = root / name
                if file.exists() or file.is_symlink():
                    archive.add(file, arcname=name, recursive=False)
        (snapshot / "manifest.json").write_text(json.dumps(current, indent=2))
        if old and old.get("repair_limit", self.args.max_repairs) != self.args.max_repairs and not getattr(self.args, "restart_repairs", False):
            raise StateError("Repair limit changed; inspect work and use --resume --restart-repairs to acknowledge a new budget.")
        if old:
            self.data = old
            self.reusable = old.get("files") == current
        else:
            self.data = {"version": 1, "repository": str(root), "step": step, "plan_fingerprint": fingerprint,
                         "base": base, "phase": "prepared", "repairs_used": 0, "repair_limit": self.args.max_repairs, "coder_started": False,
                         "feedback": "", "assessment": None, "task_paths": sorted(changed)}
        if getattr(self.args, "restart_repairs", False):
            self.data.update(repairs_used=0, repair_limit=self.args.max_repairs, coder_started=False, phase="prepared", feedback="")
            self.reusable = False
            self.data["budget_restart_acknowledged"] = True
        elif self.data["coder_started"] and self.data["repairs_used"] >= self.args.max_repairs and self.data["phase"] not in ("coded", "checked", "reviewing"):
            raise StateError("Repair budget exhausted. Inspect logs/work first; --resume --restart-repairs explicitly acknowledges a fresh budget.")
        self.data["task_scope"] = sorted(scope)
        self.save(self.data["phase"])

    def save(self, phase, **values):
        self.data.update(values, phase=phase)
        current = self.files()
        if not self.args.resume:
            self.scope.update(self.changed(self.data["base"]))
        unexpected = {name for name in set(current) | set(self.protected)
                      if name not in self.scope and name != "PLAN1.md" and current.get(name) != self.protected.get(name)}
        if unexpected:
            raise StateError("Changes outside task scope: " + ', '.join(sorted(unexpected)) +
                             ". Inspect preserved work and explicitly acknowledge scope expansion with --task-path PATH.")
        self.data["files"] = current
        self.data["task_scope"] = sorted(self.scope)
        self.data["task_paths"] = sorted(self.changed(self.data["base"]) & self.scope)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.data, indent=2) + "\n")
        temporary.chmod(0o600)
        os.replace(temporary, self.path)

    def start_coder(self):
        if self.data["coder_started"]:
            if self.data["repairs_used"] >= self.args.max_repairs:
                raise StateError("Repair budget exhausted; inspect work and explicitly use --resume --restart-repairs to start a fresh budget.")
            self.data["repairs_used"] += 1
        # Save BEFORE starting: interruption must not grant a free coding attempt.
        self.save("coding", coder_started=True)
