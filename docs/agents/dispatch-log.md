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
| 2 | opus:medium | 72 | 60 | 5 | 6 | 1 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 7 | 7 | 0 | 0 | 0 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 57 | 51 | 1 | 2 | 3 |
| 3 | opus:high | 68 | 52 | 6 | 10 | 0 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 1 | 1 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #659 | #650 | 2 | opus:high | MERGE | |
| #661 | #660 | 1 | sonnet:low | MERGE | |
| #662 | #637 | 2 | opus:high | MERGE | |
| #663 | #638 | 3 | opus:high | MERGE | |
| #664 | #651 | 2 | opus:high | MERGE | |
| #665 | #653 | 2 | opus:high | MERGE | |
| #666 | #656 | 1 | sonnet:low | MERGE | |
| #667 | #657 | 2 | opus:high | MERGE | |
| #672 | #671 | 2 | opus:high | MERGE | |
| #673 | #668 | 2 | opus:high | MERGE | |
| #674 | #669 | 2 | opus:high | MERGE | |
| #675 | #670 | 2 | opus:high | MERGE | |
| #680 | #676 | 4 | opus:high | MERGE | |
| #681 | #677 | 2 | opus:high | MERGE | |
| #682 | #678 | 2 | opus:high | MERGE | |
| #683 | #679 | 2 | opus:high | MERGE | |
| #689 | #684 | 1 | sonnet:low | MERGE | |
| #688 | #685 | 3 | opus:high | FIX FIRST | judgment |
| #690 | #686 | 3 | opus:high | MERGE | |
| #691 | #687 | 2 | opus:high | MERGE | |
