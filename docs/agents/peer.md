# Peer

The one playbook a dispatched peer session reads, beside its issue and the docs its dispatch names. The orchestrator's side is `docs/agents/multi-session.md`; a peer skips it.

## The ticket

- The issue's `Done when` list is the contract and wins over any file list in the dispatch. Read it with `gh issue view <n> --comments`: corrections to a stale body live in the comments. Run every criterion before opening the PR.
- One ticket, one small PR. When the work outgrows the ticket, stop and report.
- Past about 60% context without a PR: commit, open a partial PR, report.

## Isolation

- Work only in your worktree, `../mygame-<name>`, on a branch made there with `git fetch` and `git switch -c <branch> origin/trunk`. The main checkout is the owner's: no git command runs in it or with `-C` against it.
- The api, the web, Postgres and mail run only on the ports and container names your dispatch gives (`apps/api/CLAUDE.md`, Local database and Local mail). Before `docker run`, `lsof -nP -iTCP:<port> -sTCP:LISTEN` prints nothing.
- Never Neon: every database command runs against your own container.
- Never symlink another worktree's `node_modules` into yours: its workspace links resolve to that peer's sources, and an install there rewrites yours. Your worktree runs its own `pnpm install --frozen-lockfile`.
- Android: your own AVD `mygame-<name>`, created and started as `apps/android/CLAUDE.md` (Commands) says, or the kept one your dispatch names. Every other AVD belongs to another peer or repo.
- Stop only what you started, by PID or `adb -s emulator-<port> emu kill`. `pkill` and `killall` on a shared name (`emulator`, `qemu-system`, `adb`, `java`, `gradle`) reach other peers and repos. `netsimd` serves every emulator on the machine, so it is never yours to stop.
- Never run `./gradlew --stop`: a Gradle daemon serves every checkout on the machine, so `--stop` reaches other peers' builds. Your daemon idles out on its own.
- Outside your worktree and your containers the machine stays as it was: no `brew services`, no LaunchAgent, no global install.
- A command never waits on stdin: a script goes in a scratchpad file and runs as `python3 <file>`, never as `python3 - <<'EOF'` inside a pipeline. When a command has printed nothing for two minutes, `pgrep` shows what it runs: a Gradle or test run goes on, a process waiting on stdin is killed.

## Inner loop

The commands that run one file or one module, each with one measured run (#1200):

| Command | Wall clock |
|---|---|
| `pnpm --filter @mygame/domain test src/town/building/application/StartBuildingWork.test.ts` | 0.8 s |
| `pnpm --filter @mygame/domain test src/town` | 1.2 s |
| `pnpm --filter @mygame/api test src/placement/infrastructure/http/placementRoutes.test.ts` | 2.9 s |
| `pnpm --filter @mygame/web test src/town/officeRoute.test.tsx` | 3.0 s |
| `taskpolicy -c utility ./gradlew :feature:town:testDebugUnitTest --tests '<Class>'` | 1.7 s JVM, 7.9 s Robolectric |
| `taskpolicy -c utility ./gradlew :feature:town:testDebugUnitTest` | 15.9 s |

A path is relative to its package; the Gradle rows run in `apps/android`; an api test needs `DATABASE_URL` on your container. `pnpm gate` and the Android leg run before the push.

## Red runs

A ticket that adds or changes behavior writes each new rule's test first (`mattpocock-skills:tdd`). The PR body quotes, per rule, the test's name and the failing assertion line its red step printed. Mutations are `pr-reviewer`'s: it runs the few a risky change needs.

## Screenshots

A ticket that draws a screen shoots once, at the head the PR opens with, on its emulator against the real api, the flow exercised (`.claude/rules/verification.md`, the `apps/android` row): `android screen capture --device=emulator-<port> --no-metrics -o <file>.png`. A Robolectric capture stands in only for a state the emulator cannot reach against the real api, and the PR body names that state and why it cannot be reached. A ticket's shots are:

- each changed composable at the default scale, and again at 360×640, font scale 2.0, in es;
- published under the folder `<n>/`, the issue number, on the one orphan branch `assets`, that head's short SHA in every file name, linked in the PR body as `https://raw.githubusercontent.com/emm3000/myGame/assets/<n>/<file>`.

`assets` is append-only: each round adds one commit on top of `origin/assets` with a plain push. Never `--force` or `--force-with-lease` on it, never delete or rewrite it, locally or on origin; no script does either, so the links stay the PR's evidence after the merge. Build the commit from a temporary index, which checks out no other ticket's files, creates no local branch, and publishes only the files you name. `$shots` is a scratchpad folder holding only this round's images:

```bash
git fetch origin assets
GIT_INDEX_FILE="$shots.index" git read-tree origin/assets
for file in "$shots"/*.png; do
  GIT_INDEX_FILE="$shots.index" git update-index --add --cacheinfo "100644,$(git hash-object -w "$file"),<n>/${file##*/}"
done
commit=$(git commit-tree "$(GIT_INDEX_FILE="$shots.index" git write-tree)" -p origin/assets -m "chore(assets): <n> visual check at <short sha>")
rm "$shots.index"
git push origin "$commit:refs/heads/assets"
```

A rejected push means another peer appended first: run the block again, which fetches and rebuilds your commit on the new `origin/assets`.

A fix round reshoots only the composables it redraws.

## The PR

- Open it in the turn `pnpm gate` goes green: push the branch, `gh pr create` with `Closes #<n>`. `pr-reviewer` reviews it; CI and the merge are the orchestrator's.
- Your ticket branch and a `--force-with-lease` on it after a rebase are yours to push without asking, and so is your plain-push append to `assets`. `trunk` is never yours.
- Evidence a criterion turns on goes in the PR body in full; for a measurement, the measured lines.
- A deleted test is listed in the PR body with the rule it covered and the test that still covers it, or the reason the rule is gone.

## The reply

- To the orchestrator, in 1-2 lines: the PR URL and the gate's exit code.
- A fix report quotes, for each blocking item, the command and the output line that shows the fix. A claim without output is not a report.
- After the merge, leave the worktree clean and report. The orchestrator closes the cycle.
