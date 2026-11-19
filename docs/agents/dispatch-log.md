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
| sonnet:low | 27 | 19 | 0 | 1 | 7 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 353 | 242 | 42 | 46 | 22 |
| fable:high | 73 | 57 | 2 | 10 | 4 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1251 | opus:high | FIX FIRST | checklist | 2 | +104/-3 |
| #1258 | opus:high | MERGE |  | 1 | +3/-2 |
| #1259 | opus:high | MERGE |  | 1 | +32/-17 |
| #1260 | opus:high | MERGE |  | 1 | +215/-77 |
| #1261 | opus:high | MERGE |  | 1 | +26/-4 |
| #1262 | opus:high | FIX FIRST | spec | 2 | +288/-39 |
| #1263 | fable:high | MERGE |  | 1 | +370/-0 |
| #1264 | fable:high | MERGE |  | 1 | +385/-0 |
| #1269 | opus:high | MERGE |  | 1 | +130/-15 |
| #1270 | opus:high | FIX FIRST | checklist | 2 | +87/-60 |
| #1284 | opus:high | MERGE |  | 1 | +198/-26 |
| #1285 | opus:high | FIX FIRST | judgment | 2 | +3112/-240 |
| #1287 | opus:high | FIX FIRST | checklist | 2 | +538/-128 |
| #1289 | sonnet:low | MERGE |  | 1 | +52/-27 |
| #1288 | opus:high | FIX FIRST | spec | 2 | +537/-62 |
| #1291 | sonnet:low | MERGE |  | 1 | +19/-885 |
| #1290 | fable:high | FIX FIRST | judgment | 2 | +485/-0 |
| #1293 | opus:high | FIX FIRST | checklist | 2 | +439/-36 |
| #1307 | fable:high | FIX FIRST | spec | 2 | +409/-0 |
| #1308 | opus:high | FIX FIRST | checklist | 2 | +394/-28 |
