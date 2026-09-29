# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 3 | 1 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 23 | 18 | 3 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 24 | 20 | 1 | 2 | 1 |
| 3 | opus:high | 9 | 9 | 0 | 0 | 0 |
| 1 | fable:high | 13 | 13 | 0 | 0 | 0 |
| 5 | fable:high | 7 | 7 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #229 | #220 | 1 | fable:high | MERGE | |
| #230 | #219 | 2 | opus:medium | MERGE | |
| #239 | #232 | 1 | fable:high | MERGE | |
| #240 | #233 | 2 | opus:medium | MERGE | |
| #241 | #234 | 3 | opus:high | MERGE | |
| #242 | #235 | 4 | opus:high | MERGE | |
| #243 | #236 | 3 | opus:high | MERGE | |
| #244 | #238 | 1 | sonnet:low | MERGE | |
| #245 | #237 | 2 | opus:medium | MERGE | |
| #252 | #248 | 3 | opus:high | MERGE | |
| #251 | #247 | 1 | fable:high | FIX FIRST | judgment |
| #253 | #250 | 1 | sonnet:low | MERGE | |
| #254 | #249 | 2 | opus:medium | MERGE | |
| #267 | #257 | 3 | opus:high | MERGE | |
| #268 | #256 | 1 | fable:high | FIX FIRST | judgment |
| #269 | #258 | 2 | opus:medium | MERGE | |
| #259 (artifact) | #259 | 5 | fable:high | MERGE | |
| #270 | #260 | 2 | opus:medium | MERGE | |
| #271 | #261 | 3 | opus:high | MERGE | |
| #272 | #262 | 4 | opus:high | MERGE | |
