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
| sonnet:low | 32 | 24 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 410 | 270 | 60 | 50 | 29 |
| fable:high | 79 | 60 | 2 | 12 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1411 | opus:high | FIX FIRST | checklist | 2 | +294/-8 |
| #1412 | opus:high | MERGE |  | 1 | +380/-0 |
| #1413 | opus:high | MERGE |  | 1 | +96/-12 |
| #1414 | opus:high | MERGE |  | 1 | +52/-17 |
| #1415 | opus:high | FIX FIRST | spec | 2 | +17/-4 |
| #1416 | opus:high | FIX FIRST | spec | 2 | +76/-22 |
| #1417 | opus:high | MERGE |  | 1 | +150/-15 |
| #1418 | sonnet:low | MERGE |  | 1 | +19/-23 |
| #1419 | opus:high | MERGE |  | 1 | +5/-4 |
| #1432 | sonnet:low | MERGE |  | 1 | +75/-43 |
| #1433 | sonnet:low | MERGE |  | 1 | +27/-12 |
| #1431 | sonnet:low | MERGE |  | 1 | +45/-37 |
| #1434 | sonnet:low | MERGE |  | 1 | +2/-2 |
| #1436 | opus:high | MERGE |  | 1 | +11/-0 |
| #1437 | opus:high | MERGE |  | 1 | +472/-1082 |
| #1438 | sonnet:low | MERGE |  | 1 | +2/-2 |
| #1441 | opus:high | MERGE |  | 1 | +75/-26 |
| #1440 | opus:high | MERGE |  | 1 | +39/-1 |
| #1442 | opus:high | MERGE |  | 1 | +36/-0 |
| #1443 | opus:high | FIX FIRST | checklist | 2 | +82/-42 |
