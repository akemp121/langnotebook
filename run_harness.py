import subprocess
import sys
import os

def run_streaming_command(cmd: list[str], input_text: str | None = None) -> tuple[int, str]:
    """Runs a command, streams output live to terminal, and captures full log."""
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE if input_text else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    output_lines = []

    # Feed multiline prompts via stdin to avoid shell argument limits
    if input_text and proc.stdin:
        proc.stdin.write(input_text)
        proc.stdin.close()

    # Stream output line-by-line in real time
    if proc.stdout:
        for line in proc.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
            output_lines.append(line)

    proc.wait()
    return proc.returncode, "".join(output_lines)

def execute_task(task_description: str):
    print(f"\n\033[1;34m>>> EXECUTING TASK: {task_description}\033[0m\n")

    coder_prompt = f"""
You are working on the project defined in SPEC.md.
Complete this specific task from PLAN1.md:
"{task_description}"

Rules:
1. Use React Native / Expo primitives (<View>, <Text>, <ScrollView>, <Pressable>).
2. Ensure strict TypeScript types.
3. Write or update the necessary files directly.
"""

    # 1. Run Pi with live streaming output
    print("\033[1;32m[1/3] Pi Agent working...\033[0m")
    run_streaming_command(["pi"], input_text=coder_prompt)

    # 2. Run TypeScript Verification
    print("\n\033[1;33m[2/3] Checking TypeScript compiler contracts (npx tsc --noEmit)...\033[0m")
    tsc_code, tsc_log = run_streaming_command(["npx", "tsc", "--noEmit"])

    # Auto-repair loop if compilation fails
    retries = 0
    while tsc_code != 0 and retries < 2:
        retries += 1
        print(f"\n\033[1;31m[!] TypeScript errors detected. Instructing Pi to fix (Attempt {retries}/2)...\033[0m\n")
        fix_prompt = f"""
The changes made introduced TypeScript compiler errors:
{tsc_log}

Inspect the files and fix these errors so 'npx tsc --noEmit' passes with zero errors.
"""
        run_streaming_command(["pi"], input_text=fix_prompt)
        tsc_code, tsc_log = run_streaming_command(["npx", "tsc", "--noEmit"])

    if tsc_code != 0:
        print("\n\033[1;41m Task failed: TypeScript errors unresolved. Check files manually. \033[0m\n")
        sys.exit(1)

    print("\n\033[1;32m[✓] TypeScript clean!\033[0m")

    # 3. Quick Reviewer Check
    print("\n\033[1;35m[3/3] Running Reviewer validation...\033[0m")
    git_diff = subprocess.run(["git", "diff"], capture_output=True, text=True).stdout
    reviewer_prompt = f"""
Review the following git diff against SPEC.md for the task "{task_description}":
{git_diff}

Verify:
- Does this accurately fulfill the task?
- Are any web DOM elements (div, button, span) mistakenly used instead of React Native primitives?
Output a 2-sentence summary and either 'STATUS: APPROVED' or 'STATUS: NEEDS_REVISION'.
"""
    run_streaming_command(["pi"], input_text=reviewer_prompt)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        task = ""
    
    execute_task(task)