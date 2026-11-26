# Dispatch log

The outcome of every merged PR, by the model that ran it. The model table lives only in `.claude/skills/wave/SKILL.md` and is tuned from this log; the loop it serves is `docs/agents/multi-session.md`. `scripts/mygame-merge` writes every row, so nobody types one.

Recent keeps the last 20 PRs, oldest first. When a new row makes it 21, the script adds the oldest row to its model's Summary counts and deletes it.

- **Model:effort** is what ran, which may differ from the table.
- **First review** is `MERGE` or `FIX FIRST`; **Cause**, on FIX FIRST, is `checklist` (a recurring reviewer checklist item, the model was fine), `judgment` (a wrong decision the model made) or `spec` (the issue was wrong or thin).
- **Rounds** counts the reviews until MERGE.
- **Lines +/-** is the PR's additions and deletions as GitHub counts them.

## Summary

Totals of the rows folded out of Recent. Until #1207 they were also split by the five rows of the old table; that split lives in git history.

| Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|
| sonnet:low | 81 | 69 | 2 | 3 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 108 | 80 | 11 | 14 | 3 |
| opus:high | 667 | 458 | 87 | 79 | 42 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #2065 | opus:high | FIX FIRST | spec | 2 | +93/-5 |
| #2067 | opus:high | FIX FIRST | checklist | 2 | +679/-3 |
| #2070 | opus:high | FIX FIRST | spec | 2 | +520/-6207 |
| #2069 | opus:high | FIX FIRST | judgment | 2 | +525/-3 |
| #2071 | opus:high | MERGE |  | 1 | +55/-7 |
| #2072 | opus:high | FIX FIRST | checklist | 2 | +766/-874 |
| #2073 | opus:high | MERGE |  | 1 | +525/-3 |
| #2074 | opus:high | MERGE |  | 1 | +198/-200 |
| #2075 | opus:high | FIX FIRST | checklist | 2 | +311/-20 |
| #2076 | sonnet:low | MERGE |  | 1 | +13/-3 |
| #2077 | opus:high | FIX FIRST | spec | 2 | +1308/-212 |
| #2079 | opus:high | MERGE |  | 1 | +1088/-1976 |
| #2080 | opus:high | MERGE |  | 1 | +226/-122 |
| #2081 | opus:high | FIX FIRST | checklist | 2 | +1478/-590 |
| #2082 | opus:high | FIX FIRST | judgment | 2 | +519/-18 |
| #2083 | opus:high | MERGE |  | 1 | +331/-3195 |
| #2084 | opus:high | FIX FIRST | spec | 2 | +783/-63 |
| #2086 | opus:high | MERGE |  | 1 | +15/-2 |
| #2087 | opus:high | MERGE |  | 1 | +4/-4 |
| #2088 | opus:high | MERGE |  | 1 | +11/-11 |
