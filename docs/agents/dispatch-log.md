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
| sonnet:low | 29 | 21 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 387 | 260 | 54 | 47 | 25 |
| fable:high | 77 | 59 | 2 | 11 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1341 | opus:high | FIX FIRST | judgment | 2 | +204/-16 |
| #1343 | opus:high | FIX FIRST | checklist | 2 | +197/-19 |
| #1370 | opus:high | MERGE |  | 1 | +8/-5 |
| #1371 | opus:high | MERGE |  | 1 | +10/-2 |
| #1374 | opus:high | MERGE |  | 1 | +23/-20 |
| #1372 | opus:high | FIX FIRST | checklist | 2 | +82/-29 |
| #1373 | opus:high | FIX FIRST | judgment | 2 | +89/-39 |
| #1375 | sonnet:low | MERGE |  | 1 | +19/-15 |
| #1376 | sonnet:low | MERGE |  | 1 | +3/-3 |
| #1377 | opus:high | FIX FIRST | spec | 2 | +108/-28 |
| #1378 | opus:high | MERGE |  | 1 | +18/-1 |
| #1380 | opus:high | MERGE |  | 1 | +5/-5 |
| #1379 | opus:high | FIX FIRST | spec | 2 | +80/-37 |
| #1381 | opus:high | FIX FIRST | checklist | 2 | +131/-11 |
| #1382 | opus:high | MERGE |  | 1 | +28/-28 |
| #1383 | opus:high | MERGE |  | 1 | +356/-193 |
| #1384 | opus:high | FIX FIRST | spec | 2 | +166/-13 |
| #1386 | opus:high | MERGE |  | 1 | +128/-7 |
| #1385 | opus:high | FIX FIRST | checklist | 2 | +1085/-16 |
| #1387 | opus:high | FIX FIRST | spec | 2 | +148/-2 |
