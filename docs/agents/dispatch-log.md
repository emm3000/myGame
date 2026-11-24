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
| sonnet:low | 64 | 54 | 1 | 2 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 634 | 441 | 83 | 72 | 37 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1947 | opus:high | MERGE |  | 1 | +208/-114 |
| #1949 | opus:high | FIX FIRST | judgment | 2 | +2007/-1821 |
| #1950 | opus:high | FIX FIRST | spec | 2 | +1153/-1511 |
| #1951 | sonnet:low | MERGE |  | 1 | +0/-18 |
| #1952 | sonnet:low | MERGE |  | 1 | +357/-357 |
| #1953 | sonnet:low | MERGE |  | 1 | +369/-369 |
| #1954 | sonnet:low | FIX FIRST | checklist | 2 | +207/-207 |
| #1956 | opus:high | FIX FIRST | judgment | 2 | +625/-212 |
| #1957 | opus:high | FIX FIRST | spec | 3 | +245/-194 |
| #1958 | sonnet:low | MERGE |  | 1 | +120/-87 |
| #1959 | sonnet:low | MERGE |  | 1 | +273/-250 |
| #1960 | sonnet:low | FIX FIRST | judgment | 2 | +327/-180 |
| #1961 | sonnet:low | MERGE |  | 1 | +177/-174 |
| #1962 | opus:high | FIX FIRST | judgment | 2 | +677/-621 |
| #1963 | opus:high | FIX FIRST | judgment | 2 | +1336/-979 |
| #1964 | opus:high | FIX FIRST | checklist | 2 | +2258/-1939 |
| #1965 | sonnet:low | MERGE |  | 1 | +84/-44 |
| #1966 | sonnet:low | MERGE |  | 1 | +460/-435 |
| #1967 | opus:high | MERGE |  | 1 | +106/-95 |
| #1968 | opus:high | MERGE |  | 1 | +266/-207 |
