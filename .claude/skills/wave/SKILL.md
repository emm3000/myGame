---
name: wave
description: "Trigger: /wave, levantar wave, abrir peers, dispatch wave, lanzar sesiones. Boot one Warp pane per ticket and dispatch each ticket to its peer session."
argument-hint: <issue numbers>
allowed-tools: Bash(gh:*) Bash(scripts/mygame-wave:*) Bash(git worktree:*) ListAgents SendMessage Read
license: Apache-2.0
metadata:
  author: "emm3000"
  version: "1.0"
---

## Activation Contract

Run when the owner invokes `/wave` with one or more issue numbers, or when the orchestrator starts the next wave itself after the previous wave is fully merged. Each number becomes one peer session and one dispatch. Stop and report if any number is not an open `ready-for-agent` issue.

## Hard Rules

- Read `docs/agents/multi-session.md` first. Its dispatch checklist, model table and isolation rules bind every dispatch.
- Never queue two tickets on one peer. Never dispatch a ticket while a PR from the same wave is unmerged.
- One explicit model and one explicit effort per ticket, stated to the owner before booting.
- Never touch the owner's main checkout. Peers get their own worktree from `scripts/mygame-session`.
- No wave carries two tickets touching the same package, and a schema or migration change is always a wave of one.
- Assign each peer its own `API_PORT` and `WEB_PORT` in the dispatch, never the defaults.

## Decision Gates

Rows are ordered by blast radius: how much a mistake breaks and whether a gate catches it. A ticket that matches several rows takes the highest-numbered row that matches. The table lives only here; `docs/agents/dispatch-log.md` records the outcomes per row.

| Row | Work | Model:effort | Extra instruction |
|---|---|---|---|
| 1 | `.md` edits, copy, renames, applying a diff already designed; every criterion is a command with empty output | sonnet:low | none: the compiler and the criteria fail loudly |
| 2 | Code where the compiler or a test catches the error: one component, one use case, one route handler, one adapter behind an existing contract test | sonnet:medium | load `mattpocock-skills:tdd` for behavior; Playwright screenshots for a screen |
| 3 | Code on the trap list, where nothing catches the error: the composition root, a `packages/contracts` schema change, package config (`tsconfig`, `package.json`, `biome.json`), `.github/`, a design-system default that changes N screens | opus:medium | screenshots of every affected screen; the leak check in `.claude/rules/architecture.md` |
| 4 | Schema or migration, auth, the persistence adapters, cross-package architecture, a new package | opus:high | the contract test suite against every adapter; a migration test from the previous version |
| 5 | Design: a Design System or Design artifact (tokens, icons, component rules, a screen mockup) | fable:high | no branch, no PR: the peer publishes the artifact, posts its URL as a comment on the issue and closes it; the dispatch names the art bible, the lore pages and the existing artifact URLs |

Reviews and other roles keep the playbook rules: a `pr-reviewer` on every PR, restyle/docs/rename reviews sonnet:medium, screen/logic/schema/auth/composition-root reviews opus:high, post-review fixes sonnet:low, `ticket-writer` opus:high, lore fable. Design is row 5, a `/wave` peer like any other ticket.

Every row is a bet until `docs/agents/dispatch-log.md` says otherwise. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why here.

- Inherited from JustChill's log, kept as a starting bet: a package-wide sweep that needs judgment per line (which comment survives, which duplicate is real) takes row 3, not row 2.
- Inherited: a dispatch that names a reference file to model the work on inherits that file's debt, so name its known gaps in the same breath.

## Execution Steps

1. For each issue run `gh issue view <n> --json title,labels,body`. Confirm the label and derive a short lowercase pane name from the title (one word, no digits).
2. Classify each ticket with the table. The table binds: deviate only with a one-line reason stated in the plan, never silently. Tell the owner the plan in one line per ticket: `@<name> #<n> <model>:<effort>`, before booting anything.
3. Run `scripts/mygame-wave <name>:<model>:<effort> ...` once with every ticket.
4. Poll `ListAgents` until every pane name is listed, at most 60 seconds.
5. Send each peer one dispatch built from the playbook checklist: issue, docs to read, branch `<type>/<n>-<slug>`, its worktree `../mygame-<name>`, its ports, the acceptance-criteria line, the gate (`pnpm gate`), TDD or screenshots per the table, `Closes #<n>`, no merge, reply with the PR URL. A row 5 dispatch replaces branch, gate and PR with: publish the artifact, comment its URL on the issue, close the issue, reply with the URL. Ask for `notify_when_idle`.
6. Report to the owner in one or two lines: peers booted, tickets dispatched.

## Output Contract

Return the list `@<name> #<n> <model>:<effort>` and nothing else until a peer reports back.

## References

- `docs/agents/multi-session.md` — dispatch checklist, isolation, review cycle.
- `docs/agents/dispatch-log.md` — the outcomes per table row.
- `scripts/mygame-wave` — Warp tab config generator.
- `scripts/mygame-session` — worktree plus `claude` launcher.
