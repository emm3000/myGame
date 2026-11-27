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
| opus:high | 688 | 468 | 92 | 81 | 46 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #2099 | opus:high | MERGE |  | 1 | +22/-22 |
| #2100 | opus:high | MERGE |  | 1 | +19/-19 |
| #2101 | opus:high | MERGE |  | 1 | +23/-23 |
| #2102 | opus:high | MERGE |  | 1 | +23/-23 |
| #2103 | opus:high | FIX FIRST | judgment | 2 | +89/-30 |
| #2104 | opus:high | MERGE |  | 1 | +66/-51 |
| #2105 | opus:high | MERGE |  | 1 | +336/-37 |
| #2106 | opus:high | MERGE |  | 1 | +65/-5 |
| #2107 | opus:high | MERGE |  | 1 | +52/-20 |
| #2108 | opus:high | MERGE |  | 1 | +109/-24 |
| #2109 | opus:high | MERGE |  | 1 | +249/-35 |
| #2126 | opus:high | MERGE |  | 1 | +60/-7 |
| #2127 | opus:high | MERGE |  | 1 | +60/-14 |
| #2128 | opus:high | MERGE |  | 1 | +29/-23 |
| #2125 | opus:high | MERGE |  | 1 | +63/-7 |
| #2130 | opus:high | MERGE |  | 1 | +57/-11 |
| #2129 | opus:high | FIX FIRST | judgment | 2 | +64/-4 |
| #2131 | opus:high | MERGE |  | 1 | +142/-2 |
| #2133 | opus:high | MERGE |  | 1 | +601/-74 |
| #2132 | opus:high | FIX FIRST | judgment | 2 | +131/-40 |
