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
| opus:high | 656 | 451 | 86 | 77 | 41 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #2028 | opus:high | FIX FIRST | judgment | 2 | +252/-0 |
| #2034 | opus:high | MERGE |  | 1 | +239/-144 |
| #2035 | opus:high | FIX FIRST | judgment | 2 | +251/-0 |
| #2037 | opus:high | MERGE |  | 1 | +244/-151 |
| #2047 | opus:high | MERGE |  | 1 | +2/-2 |
| #2048 | opus:high | MERGE |  | 1 | +525/-109 |
| #2059 | opus:high | MERGE |  | 1 | +200/-2 |
| #2060 | opus:high | MERGE |  | 1 | +949/-4 |
| #2061 | opus:high | MERGE |  | 1 | +262/-341 |
| #2062 | opus:high | FIX FIRST | checklist | 2 | +741/-5 |
| #2063 | opus:high | FIX FIRST | spec | 2 | +409/-362 |
| #2065 | opus:high | FIX FIRST | spec | 2 | +93/-5 |
| #2067 | opus:high | FIX FIRST | checklist | 2 | +679/-3 |
| #2070 | opus:high | FIX FIRST | spec | 2 | +520/-6207 |
| #2069 | opus:high | FIX FIRST | judgment | 2 | +525/-3 |
| #2071 | opus:high | MERGE |  | 1 | +55/-7 |
| #2072 | opus:high | FIX FIRST | checklist | 2 | +766/-874 |
| #2073 | opus:high | MERGE |  | 1 | +525/-3 |
| #2074 | opus:high | MERGE |  | 1 | +198/-200 |
| #2075 | opus:high | FIX FIRST | checklist | 2 | +311/-20 |
