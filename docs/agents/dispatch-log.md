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
| opus:high | 365 | 248 | 45 | 47 | 24 |
| fable:high | 76 | 59 | 2 | 11 | 4 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1293 | opus:high | FIX FIRST | checklist | 2 | +439/-36 |
| #1307 | fable:high | FIX FIRST | spec | 2 | +409/-0 |
| #1308 | opus:high | FIX FIRST | checklist | 2 | +394/-28 |
| #1316 | opus:high | MERGE |  | 1 | +89/-13 |
| #1317 | opus:high | MERGE |  | 1 | +126/-24 |
| #1315 | opus:high | FIX FIRST | checklist | 2 | +228/-18 |
| #1318 | opus:high | MERGE |  | 1 | +52/-34 |
| #1319 | opus:high | FIX FIRST | checklist | 2 | +374/-536 |
| #1320 | opus:high | FIX FIRST | checklist | 2 | +426/-705 |
| #1321 | opus:high | MERGE |  | 1 | +6/-15 |
| #1322 | opus:high | MERGE |  | 1 | +61/-43 |
| #1323 | opus:high | FIX FIRST | checklist | 2 | +241/-122 |
| #1325 | opus:high | MERGE |  | 1 | +58/-3 |
| #1326 | opus:high | FIX FIRST | checklist | 2 | +278/-69 |
| #1327 | opus:high | MERGE |  | 1 | +87/-21 |
| #1328 | opus:high | FIX FIRST | checklist | 2 | +262/-65 |
| #1330 | opus:high | MERGE |  | 1 | +66/-21 |
| #1331 | opus:high | MERGE |  | 1 | +118/-3 |
| #1332 | opus:high | MERGE |  | 1 | +162/-23 |
| #1333 | opus:high | MERGE |  | 1 | +189/-131 |
