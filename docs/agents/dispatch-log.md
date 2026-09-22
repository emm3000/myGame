# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 0 | 0 | 0 | 0 | 0 |
| 2 | sonnet:medium | 0 | 0 | 0 | 0 | 0 |
| 3 | opus:medium | 0 | 0 | 0 | 0 | 0 |
| 4 | opus:high | 0 | 0 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #24 | #3 | 4 | opus:high | MERGE | |
| #25 | #2 | 4 | opus:high | MERGE | |
| #26 | #6 | 4 | opus:high | FIX FIRST | checklist |
| #27 | #7 | 4 | opus:high | MERGE | |
| #30 | #8 | 4 | opus:high | MERGE | |
| #31 | #10 | 3 | opus:medium | FIX FIRST | checklist |
| #32 | #9 | 2 | sonnet:medium | FIX FIRST | judgment |
| #33 | #29 | 3 | opus:medium | MERGE | |
| #35 | #12 | 3 | opus:medium | MERGE | |
| #34 | #11 | 2 | sonnet:medium | FIX FIRST | judgment |
| #36 | #13 | 4 | opus:high | FIX FIRST | judgment |
| #37 | #14 | 3 | opus:medium | MERGE | |
| #40 | #15 | 2 | opus:medium | MERGE | |
| #42 | #16 | 4 | opus:high | FIX FIRST | spec |
| #44 | #43 | 4 | opus:high | MERGE | |
| #45 | #41 | 1 | sonnet:low | FIX FIRST | spec |
| #46 | #17 | 2 | opus:medium | MERGE | |
| #47 | #18 | 4 | opus:high | MERGE | |
