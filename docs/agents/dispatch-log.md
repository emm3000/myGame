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
| 2 | opus:medium | 15 | 12 | 2 | 0 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 20 | 16 | 1 | 2 | 1 |
| 1 | fable:high | 7 | 7 | 0 | 0 | 0 |
| 5 | fable:high | 4 | 4 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause |
|---|---|---|---|---|---|
| #163 (artifact) | #163 | 5 | fable:high | MERGE | |
| #171 | #162 | 4 | opus:high | MERGE | |
| #172 | #164 | 2 | opus:medium | FIX FIRST | checklist |
| #174 | #173 | 4 | opus:high | MERGE | |
| #175 | #165 | 2 | opus:medium | MERGE | |
| #177 | #176 | 1 | fable:high | MERGE | |
| #178 | #169 | 1 | sonnet:low | MERGE | |
| #179 | #154 | 3 | opus:high | MERGE | |
| #181 | #180 | 3 | opus:high | MERGE | |
| #191 | #183 | 1 | fable:high | MERGE | |
| #192 | #184 | 3 | opus:high | MERGE | |
| #193 | #186 | 2 | opus:medium | MERGE | |
| #194 | #187 | 3 | opus:high | MERGE | |
| #185 (artifact) | #185 | 5 | fable:high | MERGE | |
| #195 | #188 | 2 | opus:medium | MERGE | |
| #196 | #190 | 1 | fable:high | MERGE | |
| #197 | #189 | 2 | opus:medium | MERGE | |
| #204 | #199 | 1 | fable:high | MERGE | |
| #205 | #200 | 3 | opus:high | MERGE | |
| #206 | #201 | 3 | opus:high | MERGE | |
