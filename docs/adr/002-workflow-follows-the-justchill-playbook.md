---
status: accepted
date: 2026-09-21
---
# The Claude workflow follows the JustChill playbook

The author already runs a writer/reviewer loop on GitHub Issues in two other
repos (Gema, then JustChill), with a dispatch history that tuned its model
table. Starting this repo with a different way of working would throw that
evidence away.

## Decision

The workflow is JustChill's playbook, adapted to a TypeScript monorepo:
`docs/agents/multi-session.md` is the procedure, the model table in
`.claude/skills/wave/SKILL.md` is the only place a model and effort per kind
of work is written, and `docs/agents/dispatch-log.md` tunes it from PR
verdicts. Issues labelled `ready-for-agent` are the board; no doc holds a
work list. `trunk` is the only long-lived branch, merged by rebase only.

- One peer Claude session per ticket, in its own worktree, one PR that closes
  the issue.
- Every PR gets a fresh `pr-reviewer` that follows
  `mattpocock-skills:code-review`. Mechanical slices are reviewed by Sonnet
  medium; screens, logic, schema, auth and the composition root by Opus high.
  Post-review fixes run Sonnet low.
- The orchestrator reads at most one or two files inline and delegates the
  rest, with `model` explicit on every Agent call.
- Fable is used for design, lore and architecture decisions only.
- The `mattpocock-skills` plugin supplies the per-task skills: `grilling`
  before ticketing, `to-tickets` to split, `tdd` on behavior, `code-review`
  in the reviewer, `domain-modeling` for `CONTEXT.md` and ADRs,
  `diagnosing-bugs`, `research`, `writing-for-agents`.

## What changed from JustChill

Gradle became `pnpm gate`; emulators became local ports and Playwright
screenshots; SQLDelight migrations became the schema wave-of-one rule that
ADR 006 will make concrete. The model table starts from JustChill's rows and
will be tuned by this repo's own log.

## Consequences

The dispatch log starts empty; every row is a bet until it says otherwise.
When the playbook and this ADR disagree, the playbook is updated and this ADR
is amended in the same change.
