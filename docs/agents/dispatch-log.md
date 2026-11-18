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
| sonnet:low | 25 | 18 | 0 | 1 | 6 |
| sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 102 | 77 | 11 | 11 | 3 |
| opus:high | 324 | 227 | 37 | 41 | 18 |
| fable:high | 64 | 52 | 1 | 8 | 3 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1159 | opus:high | FIX FIRST | checklist | 2 | +1069/-58 |
| #1163 | opus:high | FIX FIRST | judgment | 3 | +1375/-62 |
| #1162 | opus:high | FIX FIRST | judgment | 4 | +668/-0 |
| #1174 | opus:high | MERGE |  | 1 | +140/-7 |
| #1175 | opus:high | MERGE |  | 1 | +102/-41 |
| #1180 | opus:high | MERGE |  | 1 | +255/-30 |
| #1178 | opus:high | FIX FIRST | judgment | 3 | +602/-98 |
| #1176 | opus:high | FIX FIRST | spec | 2 | +1316/-24 |
| #1182 | opus:high | FIX FIRST | checklist | 2 | +387/-89 |
| #1184 | opus:high | FIX FIRST | judgment | 3 | +825/-1 |
| #1187 | opus:high | MERGE |  | 3 | +559/-31 |
| #1185 | opus:high | FIX FIRST | spec | 6 | +2349/-1951 |
| #1189 | opus:high | MERGE |  | 1 | +49/-2 |
| #1190 | opus:high | MERGE |  | 1 | +765/-230 |
| #1193 | opus:medium | FIX FIRST | judgment | 2 | +509/-0 |
| #1191 | opus:high | FIX FIRST | checklist | 3 | +1205/-358 |
| #1198 | sonnet:low | FIX FIRST | spec | 2 | +48/-48 |
| #1199 | opus:high | FIX FIRST | checklist | 2 | +762/-13 |
| #1202 | fable:high | MERGE |  | 1 | +93/-55 |
| #1204 | opus:high | FIX FIRST | spec | 2 | +1282/-1207 |
