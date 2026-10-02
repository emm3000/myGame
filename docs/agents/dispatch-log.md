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
| 2 | opus:medium | 38 | 33 | 3 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 30 | 26 | 1 | 2 | 1 |
| 3 | opus:high | 23 | 21 | 2 | 0 | 0 |
| 1 | fable:high | 23 | 20 | 1 | 2 | 0 |
| 5 | fable:high | 9 | 9 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #342 | #341 | 3 | opus:high | MERGE | |
| #355 | #345 | 3 | opus:high | MERGE | |
| #356 | #344 | 1 | fable:high | FIX FIRST | spec |
| #357 | #346 | 4 | opus:high | MERGE | |
| #358 | #348 | 2 | opus:medium | MERGE | |
| #347 (artifact) | #347 | 5 | fable:high | MERGE | |
| #360 | #349 | 4 | opus:high | MERGE | |
| #359 | #350 | 2 | opus:medium | MERGE | |
| #361 | #351 | 4 | opus:high | MERGE | |
| #362 | #352 | 3 | opus:high | MERGE | |
| #363 | #353 | 2 | opus:medium | FIX FIRST | checklist |
| #364 | #354 | 1 | fable:high | MERGE | |
| #372 | #366 | 1 | fable:high | MERGE | |
| #373 | #367 | 3 | opus:high | MERGE | |
| #374 | #368 | 4 | opus:high | MERGE | |
| #375 | #370 | 2 | opus:medium | MERGE | |
| #376 | #369 | 2 | opus:medium | MERGE | |
| #377 | #371 | 1 | fable:high | MERGE | |
| #394 | #380 | 4 | opus:high | FIX FIRST | spec |
| #395 | #379 | 1 | fable:high | FIX FIRST | judgment |
