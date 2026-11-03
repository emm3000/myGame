# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 9 | 7 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 66 | 56 | 5 | 4 | 1 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 53 | 47 | 1 | 2 | 3 |
| 3 | opus:high | 56 | 45 | 4 | 7 | 0 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 1 | 1 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #598 | #583 | 3 | opus:high | MERGE | |
| #599 | #592 | 4 | opus:high | MERGE | |
| #600 | #591 | 2 | opus:medium | MERGE | |
| #601 | #593 | 2 | opus:medium | FIX FIRST | judgment |
| #602 | #594 | 4 | opus:high | MERGE | |
| #603 | #595 | 2 | opus:medium | MERGE | |
| #605 | #604 | 3 | opus:high | FIX FIRST | checklist |
| #606 | #596 | 3 | opus:high | MERGE | |
| #613 | #582 | 3 | opus:high | MERGE | |
| #614 | #607 | 2 | opus:medium | MERGE | |
| #615 | #608 | 3 | opus:high | MERGE | |
| #617 | #616 | 3 | opus:high | FIX FIRST | judgment |
| #618 | #609 | 2 | opus:medium | MERGE | |
| #619 | #610 | 2 | opus:medium | FIX FIRST | judgment |
| #620 | #611 | 2 | opus:high | MERGE | |
| #622 | #621 | 4 | opus:high | MERGE | |
| #623 | #612 | 2 | opus:high | MERGE | |
| #627 | #624 | 2 | opus:high | MERGE | |
| #628 | #625 | 4 | opus:high | MERGE | |
| #629 | #626 | 3 | opus:high | MERGE | |
