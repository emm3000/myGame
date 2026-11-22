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
| sonnet:low | 58 | 48 | 1 | 2 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 595 | 406 | 83 | 69 | 36 |
| fable:high | 82 | 62 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1831 | sonnet:low | MERGE |  | 1 | +55/-57 |
| #1837 | opus:high | MERGE |  | 2 | +172/-177 |
| #1838 | opus:high | MERGE |  | 1 | +916/-908 |
| #1839 | opus:high | MERGE |  | 1 | +117/-123 |
| #1840 | opus:high | MERGE |  | 1 | +412/-332 |
| #1841 | opus:high | MERGE |  | 1 | +88/-89 |
| #1842 | opus:high | MERGE |  | 1 | +358/-293 |
| #1843 | opus:high | MERGE |  | 1 | +69/-68 |
| #1844 | opus:high | MERGE |  | 1 | +377/-261 |
| #1845 | opus:high | MERGE |  | 1 | +157/-152 |
| #1846 | opus:high | MERGE |  | 1 | +398/-213 |
| #1847 | opus:high | MERGE |  | 1 | +70/-76 |
| #1848 | opus:high | MERGE |  | 1 | +627/-414 |
| #1849 | opus:high | MERGE |  | 1 | +117/-128 |
| #1850 | opus:high | MERGE |  | 1 | +586/-399 |
| #1851 | opus:high | MERGE |  | 2 | +497/-507 |
| #1852 | opus:high | MERGE |  | 1 | +524/-417 |
| #1853 | opus:high | MERGE |  | 1 | +16/-16 |
| #1854 | opus:high | MERGE |  | 1 | +153/-147 |
| #1856 | opus:high | MERGE |  | 2 | +188/-281 |
