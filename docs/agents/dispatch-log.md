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
| sonnet:low | 69 | 58 | 2 | 2 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 639 | 442 | 83 | 74 | 39 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
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
| #1969 | opus:medium | MERGE |  | 1 | +858/-625 |
| #1970 | opus:medium | MERGE |  | 1 | +152/-150 |
| #1971 | opus:medium | FIX FIRST | judgment | 2 | +107/-96 |
| #1972 | opus:medium | FIX FIRST | judgment | 2 | +156/-127 |
| #1973 | sonnet:low | MERGE |  | 1 | +44/-39 |
| #1974 | sonnet:low | MERGE |  | 1 | +400/-359 |
| #1975 | opus:medium | MERGE |  | 1 | +422/-343 |
| #1976 | sonnet:low | MERGE |  | 1 | +196/-181 |
| #1977 | sonnet:low | MERGE |  | 1 | +23/-10 |
| #1978 | sonnet:low | MERGE |  | 1 | +717/-627 |
