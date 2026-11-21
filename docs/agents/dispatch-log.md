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
| sonnet:low | 53 | 44 | 0 | 2 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 531 | 358 | 77 | 60 | 35 |
| fable:high | 79 | 60 | 2 | 12 | 5 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1686 | opus:high | MERGE |  | 1 | +142/-8 |
| #1687 | opus:high | FIX FIRST | judgment | 2 | +114/-26 |
| #1689 | opus:high | MERGE |  | 1 | +97/-17 |
| #1691 | sonnet:low | MERGE |  | 1 | +8/-8 |
| #1696 | opus:high | MERGE |  | 1 | +135/-129 |
| #1697 | opus:high | MERGE |  | 1 | +107/-4 |
| #1698 | opus:high | MERGE |  | 1 | +127/-7 |
| #1699 | opus:high | MERGE |  | 1 | +58/-18 |
| #1700 | opus:high | MERGE |  | 1 | +49/-0 |
| #1701 | opus:high | FIX FIRST | checklist | 2 | +138/-21 |
| #1707 | opus:high | MERGE |  | 1 | +22/-2 |
| #1706 | opus:high | MERGE |  | 1 | +43/-2 |
| #1708 | opus:high | MERGE |  | 1 | +145/-112 |
| #1709 | opus:high | MERGE |  | 1 | +39/-13 |
| #1740 | opus:high | MERGE |  | 1 | +76/-74 |
| #1742 | opus:high | MERGE |  | 1 | +98/-31 |
| #1741 | fable:high | FIX FIRST | spec | 3 | +973/-0 |
| #1743 | opus:high | FIX FIRST | checklist | 2 | +1090/-2 |
| #1746 | sonnet:low | MERGE |  | 1 | +34/-9 |
| #1750 | sonnet:low | MERGE |  | 1 | +143/-0 |
