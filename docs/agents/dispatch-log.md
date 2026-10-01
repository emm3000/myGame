# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 6 | 4 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 33 | 28 | 3 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 27 | 23 | 1 | 2 | 1 |
| 3 | opus:high | 18 | 17 | 1 | 0 | 0 |
| 1 | fable:high | 19 | 16 | 1 | 2 | 0 |
| 5 | fable:high | 8 | 8 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #307 | #293 | 1 | fable:high | MERGE | |
| #295 (artifact) | #295 | 5 | fable:high | MERGE | |
| #308 | #296 | 3 | opus:high | FIX FIRST | checklist |
| #309 | #298 | 4 | opus:high | MERGE | |
| #310 | #297 | 3 | opus:high | MERGE | |
| #311 | #299 | 3 | opus:high | MERGE | |
| #312 | #300 | 4 | opus:high | MERGE | |
| #313 | #301 | 3 | opus:high | MERGE | |
| #314 | #302 | 3 | opus:high | MERGE | |
| #315 | #304 | 1 | fable:high | MERGE | |
| #316 | #303 | 2 | opus:medium | MERGE | |
| #317 | #305 | 2 | opus:medium | MERGE | |
| #328 | #319 | 1 | fable:high | MERGE | |
| #329 | #323 | 1 | fable:high | MERGE | |
| #335 | #326 | 2 | opus:medium | MERGE | |
| #336 | #322 | 2 | opus:medium | MERGE | |
| #337 | #327 | 2 | opus:medium | MERGE | |
| #338 | #334 | 1 | sonnet:low | MERGE | |
| #340 | #339 | 4 | opus:high | MERGE | |
| #342 | #341 | 3 | opus:high | MERGE | |
