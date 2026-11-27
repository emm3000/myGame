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
| sonnet:low | 83 | 71 | 2 | 3 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 108 | 80 | 11 | 14 | 3 |
| opus:high | 712 | 488 | 93 | 84 | 46 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #2152 | opus:high | MERGE |  | 1 | +107/-52 |
| #2153 | sonnet:low | FIX FIRST | checklist | 2 | +21/-0 |
| #2154 | opus:high | MERGE |  | 1 | +152/-11 |
| #2158 | opus:high | MERGE |  | 1 | +124/-37 |
| #2155 | opus:high | FIX FIRST | judgment | 2 | +154/-112 |
| #2160 | opus:high | MERGE |  | 1 | +2/-2 |
| #2159 | opus:high | FIX FIRST | judgment | 2 | +468/-90 |
| #2161 | opus:high | MERGE |  | 1 | +20/-11 |
| #2163 | opus:high | MERGE |  | 1 | +190/-28 |
| #2162 | opus:high | MERGE |  | 1 | +60/-4 |
| #2164 | opus:high | FIX FIRST | checklist | 2 | +24/-3 |
| #2165 | opus:high | MERGE |  | 1 | +123/-18 |
| #2166 | opus:high | MERGE |  | 1 | +17/-22 |
| #2168 | opus:high | MERGE |  | 1 | +77/-27 |
| #2169 | opus:high | MERGE |  | 1 | +173/-26 |
| #2167 | opus:high | FIX FIRST | spec | 2 | +115/-30 |
| #2170 | opus:high | MERGE |  | 1 | +340/-71 |
| #2173 | sonnet:low | MERGE |  | 1 | +13/-89 |
| #2174 | opus:high | MERGE |  | 1 | +17/-0 |
| #2176 | opus:high | FIX FIRST | judgment | 2 | +3/-3 |
