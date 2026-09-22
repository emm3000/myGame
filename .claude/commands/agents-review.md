---
description: Review the pending diff against CLAUDE.md and .claude/rules before a commit or a PR.
allowed-tools: Bash(git diff:*) Bash(git status:*) Bash(rg:*) Bash(fd:*) Read
---

Review the working tree diff (`git diff` plus untracked files from `git status --short`) against `origin/trunk` when it exists, otherwise against `HEAD`. Read-only: never edit, never commit.

Load `mattpocock-skills:code-review` and run its two axes:

1. **Standards**: root `CLAUDE.md`, every file under `.claude/rules/`, the `CLAUDE.md` of every package the diff touches. Run both leak checks from `.claude/rules/architecture.md` and quote their output.
2. **Spec**: the issue the branch name points at (`gh issue view <n> --comments`) when the branch is `<type>/<n>-<slug>`; otherwise the user's stated intent.

Output, English, at most 25 lines, one line per finding:

`path:line: SEVERITY (blocking|minor): problem. fix.`

Then `Verdict: READY` or `Verdict: FIX FIRST` with the blocking items only. No praise.
