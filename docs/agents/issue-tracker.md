# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations. The repository is inferred from `git remote -v`; `gh` does this automatically inside a clone.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..." --label ready-for-agent`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, never the bare form: the body alone misses corrections that live in comments.
- **List issues**: `gh issue list --state open --label ready-for-agent`; with `--json number,title,labels,body` when a script consumes it.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <number> --comment "..."`. A PR with `Closes #N` in its body closes the issue on merge.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a GitHub issue with the layout in `.claude/agents/ticket-writer.md`: title `<Area>: <slice>`, at most 3 lines of context, pointers, a `Done when` checklist, label `ready-for-agent`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a GitHub sub-issue of the map (`gh api` on the sub-issues endpoint). Where sub-issues are not enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`).
- **Blocking**: GitHub's native issue dependencies. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`). Fallback: a `Blocked by: #<n>` line at the top of the child body.
- **Frontier query**: the map's open children with no open blocker and no assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: comment the answer, close the issue, append a pointer to the map's Decisions-so-far.
