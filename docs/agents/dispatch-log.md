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
| sonnet:low | 31 | 23 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 400 | 266 | 57 | 49 | 27 |
| fable:high | 77 | 59 | 2 | 11 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1383 | opus:high | MERGE |  | 1 | +356/-193 |
| #1384 | opus:high | FIX FIRST | spec | 2 | +166/-13 |
| #1386 | opus:high | MERGE |  | 1 | +128/-7 |
| #1385 | opus:high | FIX FIRST | checklist | 2 | +1085/-16 |
| #1387 | opus:high | FIX FIRST | spec | 2 | +148/-2 |
| #1399 | sonnet:low | MERGE |  | 1 | +2/-2 |
| #1400 | opus:high | FIX FIRST | checklist | 2 | +142/-9 |
| #1401 | opus:high | FIX FIRST | judgment | 3 | +312/-3 |
| #1404 | fable:high | FIX FIRST | judgment | 2 | +176/-717 |
| #1405 | fable:high | MERGE |  | 1 | +9/-820 |
| #1406 | opus:high | MERGE |  | 1 | +308/-11 |
| #1408 | opus:high | FIX FIRST | checklist | 2 | +129/-10 |
| #1409 | opus:high | MERGE |  | 1 | +264/-78 |
| #1411 | opus:high | FIX FIRST | checklist | 2 | +294/-8 |
| #1412 | opus:high | MERGE |  | 1 | +380/-0 |
| #1413 | opus:high | MERGE |  | 1 | +96/-12 |
| #1414 | opus:high | MERGE |  | 1 | +52/-17 |
| #1415 | opus:high | FIX FIRST | spec | 2 | +17/-4 |
| #1416 | opus:high | FIX FIRST | spec | 2 | +76/-22 |
| #1417 | opus:high | MERGE |  | 1 | +150/-15 |
