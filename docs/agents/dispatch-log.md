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
| sonnet:low | 26 | 18 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 343 | 234 | 42 | 45 | 21 |
| fable:high | 65 | 53 | 1 | 8 | 3 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1218 | opus:high | MERGE |  | 1 | +21/-0 |
| #1220 | fable:high | MERGE |  | 1 | +29/-84 |
| #1219 | fable:high | FIX FIRST | judgment | 2 | +22/-4 |
| #1221 | fable:high | MERGE |  | 1 | +56/-101 |
| #1223 | fable:high | FIX FIRST | judgment | 2 | +16/-107 |
| #1225 | opus:high | MERGE |  | 1 | +37/-4 |
| #1224 | fable:high | FIX FIRST | spec | 2 | +66/-6 |
| #1226 | fable:high | MERGE |  | 1 | +7/-8 |
| #1228 | fable:high | MERGE |  | 1 | +41/-68 |
| #1229 | fable:high | FIX FIRST | checklist | 2 | +113/-44 |
| #1235 | opus:high | MERGE |  | 1 | +226/-115 |
| #1236 | opus:high | FIX FIRST | judgment | 2 | +212/-25 |
| #1237 | opus:high | MERGE |  | 1 | +21/-7 |
| #1234 | opus:high | MERGE |  | 1 | +1/-1 |
| #1242 | opus:high | MERGE |  | 1 | +29/-17 |
| #1244 | opus:high | MERGE |  | 1 | +90/-4 |
| #1245 | opus:high | MERGE |  | 1 | +82/-330 |
| #1246 | opus:high | FIX FIRST | spec | 2 | +37/-6 |
| #1250 | sonnet:low | MERGE |  | 1 | +10/-4 |
| #1251 | opus:high | FIX FIRST | checklist | 2 | +104/-3 |
