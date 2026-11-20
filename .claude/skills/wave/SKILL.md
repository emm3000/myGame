---
name: wave
description: "Trigger: /wave, levantar wave, abrir peers, dispatch wave, lanzar sesiones. Boot one terminal pane per ticket (herdr or Warp) and dispatch each ticket to its peer session."
argument-hint: <issue numbers>
allowed-tools: Bash(gh:*) Bash(scripts/mygame-wave:*) Bash(scripts/mygame-merge:*) Bash(scripts/mygame-wave-close:*) Bash(scripts/mygame-orphans:*) Bash(git worktree:*) ListAgents SendMessage Read
license: Apache-2.0
metadata:
  author: "emm3000"
  version: "1.0"
---

## Activation Contract

Run when the owner invokes `/wave` with one or more issue numbers, or when the orchestrator dispatches more tickets itself. Each number becomes one peer session and one dispatch. Stop and report if any number is not an open `ready-for-agent` issue.

## Hard Rules

- Read `docs/agents/multi-session.md` first. Its Slicing, Dispatch, Isolation and Review cycle sections bind every dispatch.
- At most 3 peers at a time. One peer may carry up to 3 row 1 tickets, one PR each, in sequence; every other ticket gets its own peer.
- Take every model and effort from the tables below: one explicit model and one explicit effort per ticket, stated to the owner before booting.

## Decision Gates

Two rows. The table lives only here; `docs/agents/dispatch-log.md` records every PR's outcome by the model that ran it.

| Row | Work | Model:effort |
|---|---|---|
| 1 | `.md` edits, copy, renames, applying a diff already designed; every criterion is a command with empty output | sonnet:low |
| 2 | Everything else: code, schema and migrations, auth, the composition root, package and Gradle config, `.github/`, `scripts/`, design | opus:high |

What a row 2 dispatch adds, by the kind of work:

- Behavior: load `mattpocock-skills:tdd` and owe the red-run table (`docs/agents/peer.md`).
- A screen: the screenshots `docs/agents/peer.md` describes.
- The trap list, where nothing catches the error (the composition root, a `packages/contracts` schema change, package or Gradle config, `.github/`, a design-system default that changes N screens): screenshots of every affected screen and the leak check in `.claude/rules/architecture.md`.
- Schema or migration, auth, the persistence adapters, a new package: the contract test suite against every adapter and a migration test from the previous version.
- `scripts/` or `.github/`: a safety checklist naming what the code may destroy and what it must never touch (other projects, live peers, the main checkout, `trunk`), which steps see each secret, that no step running repo code holds one, and the proof run that shows both. Every run of a script or its test is a bounded run (`docs/agents/peer.md`).
- Design, a Design System or Design artifact (tokens, icons, component rules, a screen mockup): no branch, no PR. The peer publishes the artifact, posts its URL as a comment on the issue and closes it; the dispatch names the art bible, the lore pages and the existing artifact URLs.
- A dispatch that names a reference file to model the work on inherits that file's debt, so it names the file's known gaps in the same breath.

Roles outside the rows:

| Role | Model:effort |
|---|---|
| `pr-reviewer`, screen, logic, schema, auth or composition-root PR | opus:high |
| `pr-reviewer`, restyle, docs or rename PR | sonnet:medium |
| `ticket-writer`, planner | opus:medium |
| Orchestrator | opus:medium |
| A new ADR, an adversarial audit, research | fable:high |
| Lore, an ambiguous triage | opus:high |

An ADR or lore dispatch tells the peer to check every statement and worked example against trunk and the domain function that computes it, never against a comment or a PR body.

Reviewers never drop a step: they are the gate that holds the quality row 1 gives up. A row that draws two first-review FIX FIRST verdicts for one criterion goes up one step, noted in this section.

## Execution Steps

1. For each issue run `gh issue view <n> --json title,labels,body`. Count its `Done when` criteria and the screens it touches: over 5 criteria or 2 screens, refuse it and send it back to `ticket-writer` for a split, never dispatch it. Confirm the label and derive a short lowercase pane name from the title (one word, no digits).
2. Classify each ticket with the table. The table binds: deviate only with a one-line reason stated in the plan, never silently. Tell the owner the plan in one line per ticket: `@<name> #<n> <model>:<effort>`, before booting anything.
3. Run `scripts/mygame-wave <name>:<model>:<effort> ...` once with every ticket. It opens the panes in the terminal the orchestrator runs in (`TERM_PROGRAM`: herdr or Warp). When the owner names a terminal in the session ("trabajemos con warp", "con herdr"), pass `--terminal warp` or `--terminal herdr` as the first argument for the rest of the session. On `manual` (unknown terminal) the script prints one `scripts/mygame-session` line per peer: pass them to the owner to run, then poll.
4. Poll `ListAgents` until every pane name is listed, at most 10 seconds.
5. Send each peer one dispatch carrying every item of the playbook's Dispatch section, on branch `<type>/<n>-<slug>`. A design dispatch replaces branch, gate and PR with: publish the artifact, comment its URL on the issue, close the issue, reply with the URL. Ask for `notify_when_idle`.
6. Report to the owner in one or two lines: peers booted, tickets dispatched.

## Output Contract

Return the list `@<name> #<n> <model>:<effort>` and nothing else until a peer reports back.

## References

- `docs/agents/multi-session.md` — the orchestrator's playbook: dispatch, isolation, review cycle.
- `docs/agents/peer.md` — the one playbook a peer reads.
- `docs/agents/dispatch-log.md` — every PR's outcome by the model that ran it.
- `scripts/mygame-wave` — opens one pane per peer in herdr or Warp, or prints the launch lines.
- `scripts/mygame-session` — worktree plus `claude` launcher.
- `scripts/mygame-merge`, `scripts/mygame-wave-close`, `scripts/mygame-orphans` — merge one PR and log it, close one peer's cycle, list what closed cycles left behind; their use is the playbook's Between tickets.
