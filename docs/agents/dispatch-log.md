# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 5 | 3 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 29 | 24 | 3 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 25 | 21 | 1 | 2 | 1 |
| 3 | opus:high | 14 | 14 | 0 | 0 | 0 |
| 1 | fable:high | 17 | 15 | 0 | 2 | 0 |
| 5 | fable:high | 8 | 8 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #272 | #262 | 4 | opus:high | MERGE | |
| #273 | #263 | 3 | opus:high | MERGE | |
| #275 | #264 | 2 | opus:medium | MERGE | |
| #274 | #266 | 1 | fable:high | FIX FIRST | checklist |
| #276 | #265 | 2 | opus:medium | MERGE | |
| #286 | #278 | 1 | fable:high | MERGE | |
| #285 | #279 | 2 | opus:medium | MERGE | |
| #287 | #280 | 3 | opus:high | MERGE | |
| #288 | #281 | 4 | opus:high | MERGE | |
| #289 | #282 | 3 | opus:high | FIX FIRST | checklist |
| #290 | #284 | 1 | sonnet:low | MERGE | |
| #291 | #283 | 2 | opus:medium | MERGE | |
| #306 | #294 | 3 | opus:high | MERGE | |
| #307 | #293 | 1 | fable:high | MERGE | |
| #295 (artifact) | #295 | 5 | fable:high | MERGE | |
| #308 | #296 | 3 | opus:high | FIX FIRST | checklist |
| #309 | #298 | 4 | opus:high | MERGE | |
| #310 | #297 | 3 | opus:high | MERGE | |
| #311 | #299 | 3 | opus:high | MERGE | |
| #312 | #300 | 4 | opus:high | MERGE | |
