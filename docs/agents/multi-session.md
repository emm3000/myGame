# Multi-session orchestration

How the orchestrator session dispatches tickets to parallel peer sessions, reviews their pull requests and merges them. This is the orchestrator's doc; a peer reads `docs/agents/peer.md` instead. Issues and pull requests as the board, and this playbook as the way of working: ADR 002.

## The unit

One GitHub issue labelled `ready-for-agent`. The label vocabulary is `docs/agents/triage-labels.md`, the `gh` operations are `docs/agents/issue-tracker.md`, the open board is `gh issue list --label ready-for-agent`, never a list in a doc. The issue IS the work: a `Done when` list of falsifiable conditions, best a command with empty output, plus at most 3 lines of context. Constraints that outlive an issue live in `.claude/rules/` and the package `CLAUDE.md` files. Git is the chronicle; a fact goes in exactly one place. New issues come from the `ticket-writer` agent, from the PRD, the lore and the ADRs; `mattpocock-skills:grilling` stress-tests a plan before it is ticketed and `mattpocock-skills:to-tickets` splits it. Read an issue with `gh issue view <n> --comments`, never the bare form: corrections to a stale body live in the comments. Proving something is absent takes every source, not the first one.

## The loop

```
1. Orchestrator SCOPES the issue (inline, cheap) and picks the model table row
2. scripts/mygame-wave boots one peer per ticket → WRITER   ── own worktree, branch, commits, PR that closes the issue
3. CI runs `pnpm gate` on the PR
4. Orchestrator delegates → pr-reviewer                     ── MERGE or FIX FIRST, on every PR
5. scripts/mygame-merge rebase-merges, writes the dispatch-log row, closes the cycle
```

## Roles

- **Owner** approves the first dispatch of a session and verifies model and effort with `/model` in each pane. After that the orchestrator keeps dispatching on its own. Refer to a session with an `@` prefix in chat (`@queue`): it disambiguates the session from a feature or ticket of the same name.
- **Orchestrator** coordinates: dispatches via `SendMessage`, reviews, merges. It stays thin.
  - Delegate investigation and any artifact-producing work (tickets, specs, surveys, docs) to a subagent with an explicit model.
  - Do inline only routing state (`git status`, `git worktree list`, `gh issue/pr list`, `ListAgents`) and at most 1-2 files to decide. A package boundary touched, run the leak check in `.claude/rules/architecture.md`.
  - Report minimal: act on review/agent findings, tell the owner 1-2 lines and only decisions that are genuinely theirs. Merging a clean PR is normal practice, not a question.
  - A peer that goes idle without a PR or a report gets a status check at once: `gh pr list --head <branch>`, `git -C ../mygame-<name> status --short`, then a `SendMessage` asking where it stands. The owner is never the watchdog.

## Model and effort

- Every dispatch states model and **one** explicit effort (low / medium / high, never a range), with a one-line reason. The row comes from the table in `.claude/skills/wave/SKILL.md`: pick the cheapest model and lowest effort that gets it right; reserve Opus for work where a mistake is silent or expensive (schema and migrations, auth, the composition root, the contracts boundary); low is enough where a wrong answer fails the compiler or a test loudly.
- The orchestrator session itself runs opus:medium: it scopes, dispatches, reads verdicts and merges, which is coordination, not deep reasoning. The owner raises it to high for a conflicting rebase or an ambiguous FIX FIRST, and lowers it back after.
- Fable runs ADRs, audits and research (owner, 2026-11-18, audit #1200). Design, the lore, an ambiguous triage and diagnosing a peer that failed the same ticket twice run opus:high. Reviews, implementation and doc checks go to Opus or Sonnet.
- `model` is explicit on every Agent call: the parameter overrides an agent's frontmatter `model:`, and omitting it silently runs the definition or session default.
- A session cannot see its own reasoning effort; `ListAgents` does not show it, and asking a session returns a guess. The owner verifies with `/model` in each terminal.

## Slicing

- One slice = one small PR: a schema change plus its domain change, or one screen, or one route, or one adapter. A ticket naming more than 2 screens, or a schema change plus a screen, gets split into sub-issues with `gh` first.
- Tickets in flight at once touch disjoint Gradle modules, or disjoint packages for TypeScript. A seam two of them share lands first as its own PR.
- Before dispatching tickets filed by an audit, re-verify each against current `trunk`; the finding may already be fixed.

## Dispatch

Every dispatch to a peer carries:

- The issue number, the branch name, the peer's **own** worktree path, and the ports, container names and emulator port it may use (Isolation below).
- Read first: `docs/agents/peer.md`, then the ADRs, rules, package `CLAUDE.md` and lore pages the ticket turns on. Never this file.
- The file list (`fd -e ts`) and their tests, plus the pre-scoped blockers. For a move or refactor, a dependency-closure directive: transitive imports mapped from the consuming layer, non-platform dependencies co-moved.
- Whether the ticket owes the red-run table (it adds or changes behavior) and screenshots (it draws a screen); `peer.md` says how.
- The reply it expects: the PR URL and the gate's exit code.

## Launching peers

- `/wave <issue numbers>` or `scripts/mygame-wave` run directly. Either way the orchestrator first classifies each ticket with the table in `.claude/skills/wave/SKILL.md` and states `@<name> #<n> <model>:<effort>` to the owner, a deviation from the table carrying a one-line reason.
- `scripts/mygame-wave [--terminal herdr|warp|manual] name:model:effort [...]` opens one pane per peer, each running `scripts/mygame-session`. Without the flag the terminal comes from `TERM_PROGRAM`; `manual` prints the launch lines instead of opening anything; herdr needs its server running. Peers are found by `ListAgents` either way: the `claude -n <name>` session name, not the terminal, is the address.
- `scripts/mygame-session name model effort` creates the detached worktree `../mygame-<name>` from `origin/trunk` when missing, runs `pnpm install --frozen-lockfile` there, then runs `claude -n <name> --model <model> --effort <effort> --permission-mode bypassPermissions` inside it.

## Isolation: worktrees

- Every peer works in its own git worktree (`../mygame-<name>`, off `origin/trunk`), never in the owner's main checkout, which holds owner-only uncommitted files. A checkout there changes the branch under every other session.
- Before changing the state of any checkout, find out who is using it; an unexpected branch may be a live peer, not a leftover.
- Review and verification prompts are read-only on every existing checkout. A build on a branch, or a red/green check that needs a source edit, runs in a throwaway worktree under the session scratchpad, removed afterward.
- The peer's side of every Isolation section is `docs/agents/peer.md`, Isolation. Its process and stdin rules bind the orchestrator too.

## Isolation: ports and databases

- The dispatch assigns every port, never a default: `API_PORT` and `WEB_PORT` for a peer that runs the api or the web, the host port of its Postgres container `mygame-<session>-pg`, and the two host ports of its mail container `mygame-<session>-mail`. Every peer's `pnpm gate` needs both containers. The recipes are `apps/api/CLAUDE.md`, Local database and Local mail; never the owner's local database, never Neon.

## Isolation: emulators

- A peer that needs an emulator runs its own AVD, `mygame-<name>`, on an even port in 5560–5588; the recipe is `apps/android/CLAUDE.md`, Commands. `Medium_Phone*`, `hello-*` and `picantea-*` AVDs belong to other repos, and ports 5590 and up to pichanga.
- An emulator a later ticket still needs: close the earlier ticket with `scripts/mygame-wave-close <name> --keep-emulator` and name the kept `mygame-<name>` in the next dispatch. Once no ticket needs it, run `scripts/mygame-wave-close <name>` again without the flag, which stops the emulator and deletes the AVD.
- Never stop `netsimd`, the one process every running emulator shares. _Why: `scripts/mygame-wave-close` used to kill it by the closed worktree's directory, which took down the other peers' emulators (#1045)._

## Review cycle

- A session gets nothing new until its previous PR is reviewed, fixed and merged. Never queue two tickets in one dispatch, except that one peer may carry up to 3 row 1 tickets, one PR each, in sequence (`.claude/skills/wave/SKILL.md`).
- Every PR gets one review: a fresh `pr-reviewer` subagent the orchestrator launches, one per PR, on the model the roles table of `.claude/skills/wave/SKILL.md` names, passed on the call; nothing lowers a review. What it checks, the red-run table first, is `.claude/agents/pr-reviewer.md`. It returns `blocking|minor` findings, one verdict (MERGE or FIX FIRST) and one cause word (`checklist`, `judgment`, `spec`) for the dispatch log.
- The review prompt carries the PR number, the issue, the criteria to scrutinize and, for an `apps/api` mutation, a `DATABASE_URL`; never the peer's report or the orchestrator's reading of it. The reviewer's `Not run:` line is the orchestrator's to settle before it merges.
- FIX FIRST: relay the blocking items to the peer verbatim, and nothing else. Its fix report quotes command output per item; a bare claim goes back. MERGE: merge, with no polish round.
- Minors go into the sprint's one open batch issue, `Review follow-ups: S<n>`, one comment per PR. At sprint end it is dispatched as one ticket or closed; none stays open into the next sprint.
- Screenshots are shot once, at the head the PR opens with (`docs/agents/peer.md`); a fix round reshoots only what it redraws, and a SHA mismatch sends nothing back. The net for a layout a fix round broke is the smoke suite of `docs/qa/android.md`, run once per merged batch, never per PR.
- Merge is rebase-only, linear history, CI required. The orchestrator never blocks its own turn on `gh run watch`; it merges when the CI notification or the session's report arrives.
- A pull request that adds or changes learning content (a gloss, a frame, a definition or a text, under `apps/api/content/lessons/` and wherever texts live) is validated by an opus:high reviewer, delegated by the owner (2026-11-05, repeated 2026-11-12). The orchestrator notes that delegation on the pull request, then merges it as any other (ADR 037, check 7). Anything irreversible or outward-facing still waits for the owner.
- Waiting on CI is two steps, both in the background, never a hand-written `until`. First prove the run exists: `gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>' --jq .total_count`, bounded by `for i in $(seq 1 N); do ...; sleep S; done`. A `0` that never moves means GitHub dropped the event for that push, and the fix is a new push, not more waiting. Then block on the run itself with `gh run watch <id> --exit-status` (or `gh pr checks <N> --watch --fail-fast`), which ends on its own.
- Every background wait carries a hard bound, and on expiry the session reports instead of sleeping on.
- Auto-merge (`gh pr merge --rebase --auto`) only works while checks are still pending; on a CLEAN PR GitHub refuses it. Check `gh pr view <N> --json mergeStateStatus` first: merge directly with `gh pr merge <N> --rebase` when CLEAN, arm auto-merge only while pending.

## Between tickets

- A cycle closes in this order: the peer leaves its worktree clean and reports; the orchestrator runs `scripts/mygame-merge <pr> <session> <model:effort> <merge|checklist|judgment|spec> <rounds>` from its own checkout, which rebase-merges the PR, writes its dispatch-log row and runs `scripts/mygame-wave-close <session>`, forwarding `--keep-emulator`. For a peer carrying several row 1 tickets, every PR but its last merges with `--no-close`, which merges and logs and leaves the peer running; any throwaway review worktree under a scratchpad is removed. The session is free when `scripts/mygame-orphans` exits 0 and prints nothing beyond `kept:` lines and `orphans: none`. What the scripts stop, remove, write and report is their source; `scripts/test-mygame-wave-close` and `scripts/test-mygame-merge` check them, outside `pnpm gate`.
- The row `scripts/mygame-merge` writes to the Recent table of `docs/agents/dispatch-log.md` holds the PR, the model:effort that ran, the first-review verdict, its cause on FIX FIRST (the `pr-reviewer` cause word), the rounds until MERGE and the lines GitHub counts; past 20 rows it folds the oldest into the Summary. It refuses a PR that already has a row, and one merged before the oldest Recent row, whose row is already folded. That guard assumes Recent is in merge order, so a PR merged by hand and first logged after 20 newer rows is refused, with no override. A PR merged by hand gets its row from `scripts/mygame-merge --dry-run` with the same arguments, which neither merges nor closes. Nobody types a row. The rows accumulate uncommitted in the working tree across the sprint, with `git pull --rebase --autostash` between merges, and ship as one `docs(agents): log S<n>` commit when the sprint closes, never one per ticket. Before any push, the orchestrator squashes any run of unpushed log commits into one with `git reset --soft`. It pushes that sprint commit to `trunk` itself when every unpushed commit is a cycle-close docs commit; any other push to `trunk` still needs the owner's OK. The table in `.claude/skills/wave/SKILL.md` is tuned from that log, not from opinion.
- Also at cycle close, the orchestrator asks whether the merged work made an architecture or domain decision, changed a domain term, or named something a player sees. If it did, it files a small docs ticket that loads `mattpocock-skills:domain-modeling` and adds or updates the ADR in `docs/adr/`, `CONTEXT.md`, `docs/setting/`, or all of them. An ADR that the shipped behavior contradicts is fixed the same way.
- `scripts/mygame-wave-close` kills the peer's `claude` process and deletes its branches, local and remote, so it runs only after the peer's last PR is merged: closing first closes the open PR, and a closed PR cannot take a rebased head. If the pane outlives it, `kill -HUP` its parent `zsh`. After a machine restart a peer comes back as `claude --resume <id>` with its cwd at the main checkout: the close misses that process, so kill its PID first, and `scripts/mygame-orphans` flags its live worktree until then. Tell the resumed peer to work only in its worktree. A closed session never gets a second ticket.
