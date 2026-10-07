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
| 2 | opus:medium | 51 | 44 | 5 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 46 | 41 | 1 | 2 | 2 |
| 3 | opus:high | 35 | 31 | 2 | 2 | 0 |
| 1 | fable:high | 33 | 28 | 1 | 3 | 1 |
| 5 | fable:high | 13 | 13 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| infra#2 | #450 | 3 | opus:high | MERGE | |
| #461 | #451 | 3 | opus:high | FIX FIRST | judgment |
| infra#3 | #452 | 3 | opus:high | FIX FIRST | judgment |
| infra#4 | #453 | 3 | opus:high | FIX FIRST | judgment |
| #462 | #455 | 1 | fable:high | FIX FIRST | judgment |
| #479 | #465 | 3 | opus:high | FIX FIRST | checklist |
| #480 | #464 | 1 | fable:high | FIX FIRST | judgment |
| #466 (artifact) | #466 | 5 | fable:high | MERGE | |
| #481 | #467 | 4 | opus:high | MERGE | |
| #482 | #478 | 4 | opus:high | MERGE | |
| #483 | #469 | 3 | opus:high | FIX FIRST | judgment |
| #485 | #468 | 3 | opus:high | MERGE | |
| #484 | #471 | 3 | opus:high | MERGE | |
| #486 | #470 | 3 | opus:high | MERGE | |
| #487 | #472 | 3 | opus:high | FIX FIRST | checklist |
| #488 | #473 | 2 | opus:medium | MERGE | |
| #489 | #474 | 2 | opus:medium | MERGE | |
| #490 | #475 | 2 | opus:medium | MERGE | |
| #491 | #476 | 2 | opus:medium | FIX FIRST | judgment |
| #492 | #477 | 1 | fable:high | FIX FIRST | spec |
| #495 | #493 | 2 | opus:medium | MERGE | |
| #496 | #494 | 2 | opus:medium | MERGE | |
| #508 | #498 | 1 | sonnet:low | MERGE | |
| infra#7 | #507 | 3 | opus:high | MERGE | |
| #509 | #501 | 2 | opus:medium | MERGE | |
| #510 | #499 | 1 | fable:high | FIX FIRST | judgment |
| #511 | #500 | 3 | opus:high | MERGE | |
| #512 | #502 | 4 | opus:high | MERGE | |
| artifact | #505 | 5 | fable:high | MERGE | |
| #513 | #503 | 2 | opus:medium | MERGE | |
| #514 | #504 | 2 | opus:medium | FIX FIRST | judgment |
