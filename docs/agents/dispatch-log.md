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
| sonnet:low | 52 | 44 | 0 | 1 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 510 | 346 | 73 | 57 | 33 |
| fable:high | 79 | 60 | 2 | 12 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1636 | opus:high | MERGE |  | 1 | +3/-3 |
| #1637 | opus:high | MERGE |  | 1 | +45/-15 |
| #1638 | opus:high | MERGE |  | 1 | +66/-22 |
| #1642 | opus:high | FIX FIRST | judgment | 2 | +45/-6 |
| #1643 | opus:high | MERGE |  | 1 | +64/-0 |
| #1641 | opus:high | FIX FIRST | spec | 2 | +190/-24 |
| #1658 | sonnet:low | FIX FIRST | judgment | 2 | +13/-6 |
| #1659 | opus:high | MERGE |  | 1 | +96/-22 |
| #1660 | opus:high | FIX FIRST | judgment | 2 | +2840/-65 |
| #1662 | opus:high | MERGE |  | 1 | +157/-13 |
| #1663 | opus:high | MERGE |  | 1 | +55/-28 |
| #1665 | opus:high | MERGE |  | 1 | +54/-306 |
| #1664 | opus:high | FIX FIRST | checklist | 2 | +365/-81 |
| #1661 | opus:high | FIX FIRST | judgment | 2 | +158/-24 |
| #1666 | opus:high | FIX FIRST | checklist | 2 | +121/-8 |
| #1670 | opus:high | MERGE |  | 1 | +22/-1 |
| #1671 | opus:high | MERGE |  | 1 | +15/-8 |
| #1667 | opus:high | FIX FIRST | checklist | 2 | +360/-94 |
| #1669 | opus:high | MERGE |  | 1 | +25/-2 |
| #1668 | opus:high | FIX FIRST | checklist | 2 | +118/-11 |
