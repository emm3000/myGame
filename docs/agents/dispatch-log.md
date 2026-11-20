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
| sonnet:low | 40 | 32 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 427 | 283 | 62 | 50 | 31 |
| fable:high | 79 | 60 | 2 | 12 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1461 | sonnet:low | MERGE |  | 1 | +1/-1 |
| #1463 | sonnet:low | MERGE |  | 1 | +3/-2 |
| #1464 | sonnet:low | MERGE |  | 1 | +1/-1 |
| #1465 | opus:high | MERGE |  | 1 | +197/-26 |
| #1467 | opus:high | FIX FIRST | judgment | 2 | +1216/-13 |
| #1468 | opus:high | MERGE |  | 1 | +1100/-107 |
| #1473 | sonnet:low | MERGE |  | 1 | +20/-5 |
| #1474 | opus:high | MERGE |  | 1 | +39/-0 |
| #1476 | sonnet:low | MERGE |  | 1 | +34/-57 |
| #1477 | opus:high | MERGE |  | 1 | +73/-14 |
| #1478 | opus:high | MERGE |  | 1 | +82/-26 |
| #1483 | opus:high | MERGE |  | 1 | +64/-21 |
| #1484 | sonnet:low | MERGE |  | 1 | +31/-29 |
| #1486 | opus:high | MERGE |  | 1 | +69/-3 |
| #1487 | opus:high | MERGE |  | 1 | +11/-1 |
| #1493 | opus:high | MERGE |  | 1 | +46/-5 |
| #1496 | sonnet:low | MERGE |  | 1 | +4/-4 |
| #1498 | opus:high | MERGE |  | 1 | +114/-30 |
| #1499 | opus:high | MERGE |  | 1 | +45/-26 |
| #1500 | opus:high | MERGE |  | 1 | +11/-56 |
