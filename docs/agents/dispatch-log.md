# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 7 | 5 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 46 | 40 | 4 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 44 | 39 | 1 | 2 | 2 |
| 3 | opus:high | 28 | 26 | 2 | 0 | 0 |
| 1 | fable:high | 30 | 25 | 1 | 3 | 1 |
| 5 | fable:high | 11 | 11 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #410 (artifact) | #410 | 5 | fable:high | MERGE | |
| #422 | #414 | 4 | opus:high | MERGE | |
| #423 | #417 | 3 | opus:high | MERGE | |
| #425 | #415 | 3 | opus:high | MERGE | |
| #426 | #416 | 2 | opus:medium | MERGE | |
| #427 | #418 | 1 | fable:high | MERGE | |
| #429 | #428 | 2 | opus:medium | MERGE | |
| #438 | #431 | 1 | fable:high | MERGE | |
| #439 | #432 | 4 | opus:high | MERGE | |
| #440 | #434 | 2 | opus:medium | FIX FIRST | checklist |
| #433 (artifact) | #433 | 5 | fable:high | MERGE | |
| #441 | #435 | 2 | opus:medium | MERGE | |
| #442 | #436 | 2 | opus:medium | MERGE | |
| #443 | #437 | 1 | fable:high | MERGE | |
| #457 | #445 | 3 | opus:high | MERGE | |
| #458 | #446 | 3 | opus:high | FIX FIRST | judgment |
| #459 | #447 | 3 | opus:high | FIX FIRST | judgment |
| #460 | #448 | 3 | opus:high | MERGE | |
| infra#1 | #449 | 3 | opus:high | MERGE | |
| infra#2 | #450 | 3 | opus:high | MERGE | |
