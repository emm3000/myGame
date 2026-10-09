# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 8 | 6 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 58 | 50 | 5 | 2 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 48 | 43 | 1 | 2 | 2 |
| 3 | opus:high | 47 | 37 | 4 | 6 | 0 |
| 1 | fable:high | 37 | 28 | 1 | 6 | 2 |
| 5 | fable:high | 14 | 14 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #512 | #502 | 4 | opus:high | MERGE | |
| artifact | #505 | 5 | fable:high | MERGE | |
| #513 | #503 | 2 | opus:medium | MERGE | |
| #514 | #504 | 2 | opus:medium | FIX FIRST | judgment |
| #515 | #506 | 2 | opus:medium | MERGE | |
| infra#8 | #517 | 3 | opus:high | MERGE | |
| infra#9 | #518 | 3 | opus:high | MERGE | |
| #520 | #519 | 3 | opus:high | MERGE | |
| #528 | #522 | 1 | fable:high | MERGE | |
| #523 (artifact) | #523 | 5 | fable:high | MERGE | |
| #529 | #524 | 2 | opus:medium | MERGE | |
| #530 | #525 | 2 | opus:medium | FIX FIRST | judgment |
| #531 | #526 | 3 | opus:high | FIX FIRST | judgment |
| #532 | #527 | 1 | fable:high | FIX FIRST | judgment |
| #535 (artifact) | #535 | 5 | fable:high | MERGE | |
| #538 | #536 | 3 | opus:high | MERGE | |
| #539 | #537 | 1 | fable:high | FIX FIRST | judgment |
| #546 | #544 | 1 | sonnet:low | MERGE | |
| #547 | #543 | 4 | opus:high | MERGE | |
| #548 | #542 | 2 | opus:medium | MERGE | |
| #549 | #541 | 1 | fable:high | FIX FIRST | spec |
