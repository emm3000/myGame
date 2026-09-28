# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 2 | 0 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 6 | 6 | 0 | 0 | 0 |
| 3 | opus:medium | 11 | 8 | 2 | 1 | 0 |
| 4 | opus:high | 11 | 8 | 1 | 1 | 1 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #84 | #28 | 3 | opus:medium | MERGE | |
| #85 | #81 | 2 | opus:medium | MERGE | |
| #82 (artifact) | #82 | 5 | fable:high | MERGE | |
| #93 | #86 | 2 | opus:medium | MERGE | |
| #94 | #87 | 4 | opus:high | MERGE | |
| #95 | #88 | 3 | opus:medium | MERGE | |
| #97 | #89 | 4 | opus:high | MERGE | |
| #98 | #90 | 3 | opus:medium | MERGE | |
| #99 | #91 | 2 | opus:medium | FIX FIRST | spec |
| #100 | #92 | 3 | opus:medium | FIX FIRST | judgment |
| #101 | #96 | 3 | opus:medium | FIX FIRST | spec |
| #103 | #102 | 2 | opus:medium | MERGE | |
| #105 | #104 | 2 | opus:medium | MERGE | |
| #115 | #107 | 1 | fable:high | MERGE | |
| #116 | #108 | 4 | opus:high | FIX FIRST | judgment |
| #117 | #109 | 4 | opus:high | MERGE | |
| #118 | #110 | 4 | opus:high | MERGE | |
| #112 (artifact) | #112 | 5 | fable:high | MERGE | |
| #119 | #111 | 3 | opus:medium | FIX FIRST | checklist |
| #120 | #113 | 3 | opus:medium | MERGE | |
