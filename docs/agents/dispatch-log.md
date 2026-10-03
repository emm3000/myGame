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
| 2 | opus:medium | 43 | 37 | 4 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 34 | 30 | 1 | 2 | 1 |
| 3 | opus:high | 27 | 25 | 2 | 0 | 0 |
| 1 | fable:high | 26 | 22 | 1 | 2 | 1 |
| 5 | fable:high | 10 | 10 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #377 | #371 | 1 | fable:high | MERGE | |
| #394 | #380 | 4 | opus:high | FIX FIRST | spec |
| #395 | #379 | 1 | fable:high | FIX FIRST | judgment |
| #381 (artifact) | #381 | 5 | fable:high | MERGE | |
| #396 | #382 | 4 | opus:high | MERGE | |
| #397 | #383 | 4 | opus:high | MERGE | |
| #398 | #384 | 4 | opus:high | MERGE | |
| #399 | #386 | 4 | opus:high | MERGE | |
| #400 | #385 | 2 | opus:medium | MERGE | |
| #401 | #387 | 4 | opus:high | MERGE | |
| #402 | #388 | 4 | opus:high | MERGE | |
| #403 | #389 | 4 | opus:high | MERGE | |
| #404 | #390 | 2 | opus:medium | MERGE | |
| #405 | #391 | 2 | opus:medium | MERGE | |
| #406 | #392 | 3 | opus:high | MERGE | |
| #407 | #393 | 1 | fable:high | MERGE | |
| #419 | #409 | 1 | fable:high | MERGE | |
| #420 | #412 | 4 | opus:high | MERGE | |
| #421 | #413 | 4 | opus:high | MERGE | |
| #410 (artifact) | #410 | 5 | fable:high | MERGE | |
