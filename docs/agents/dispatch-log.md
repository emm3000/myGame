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
| sonnet:low | 84 | 71 | 3 | 3 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 108 | 80 | 11 | 14 | 3 |
| opus:high | 725 | 498 | 94 | 86 | 46 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #2169 | opus:high | MERGE |  | 1 | +173/-26 |
| #2167 | opus:high | FIX FIRST | spec | 2 | +115/-30 |
| #2170 | opus:high | MERGE |  | 1 | +340/-71 |
| #2173 | sonnet:low | MERGE |  | 1 | +13/-89 |
| #2174 | opus:high | MERGE |  | 1 | +17/-0 |
| #2176 | opus:high | FIX FIRST | judgment | 2 | +3/-3 |
| #2177 | opus:high | MERGE |  | 2 | +54/-15 |
| #2182 | opus:high | MERGE |  | 1 | +103/-12 |
| #2183 | opus:high | MERGE |  | 1 | +86/-8 |
| #2184 | opus:high | MERGE |  | 1 | +132/-2 |
| #2185 | opus:high | FIX FIRST | judgment | 2 | +76/-11 |
| #2189 | opus:high | MERGE |  | 1 | +95/-48 |
| #2190 | opus:high | MERGE |  | 1 | +44/-3 |
| #2191 | opus:high | FIX FIRST | spec | 2 | +134/-128 |
| #2192 | sonnet:low | MERGE |  | 1 | +1775/-1139 |
| #2193 | opus:high | MERGE |  | 1 | +321/-285 |
| #2194 | opus:high | MERGE |  | 1 | +39/-0 |
| #2195 | sonnet:low | MERGE |  | 1 | +69/-49 |
| #2196 | opus:high | MERGE |  | 1 | +54/-29 |
| #2197 | opus:high | FIX FIRST | spec | 3 | +238/-114 |
