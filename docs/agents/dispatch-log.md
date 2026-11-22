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
| sonnet:low | 56 | 47 | 0 | 2 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 103 | 77 | 11 | 12 | 3 |
| opus:high | 567 | 386 | 81 | 64 | 35 |
| fable:high | 80 | 60 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1770 | opus:high | MERGE |  | 1 | +4518/-3489 |
| #1772 | opus:high | MERGE |  | 1 | +629/-562 |
| #1773 | opus:high | FIX FIRST | checklist | 2 | +576/-514 |
| #1775 | opus:high | MERGE |  | 1 | +650/-602 |
| #1778 | opus:high | MERGE |  | 1 | +125/-124 |
| #1776 | opus:high | FIX FIRST | judgment | 2 | +169/-121 |
| #1779 | opus:high | MERGE |  | 1 | +1692/-1671 |
| #1788 | opus:high | MERGE |  | 1 | +139/-118 |
| #1789 | opus:high | FIX FIRST | checklist | 2 | +321/-309 |
| #1790 | opus:high | MERGE |  | 1 | +52/-52 |
| #1791 | opus:high | FIX FIRST | judgment | 2 | +677/-504 |
| #1794 | opus:high | MERGE |  | 1 | +239/-162 |
| #1793 | opus:high | FIX FIRST | judgment | 2 | +737/-397 |
| #1798 | opus:high | MERGE |  | 1 | +414/-114 |
| #1797 | opus:high | FIX FIRST | judgment | 2 | +455/-239 |
| #1796 | opus:high | FIX FIRST | judgment | 2 | +386/-671 |
| #1799 | opus:high | FIX FIRST | spec | 2 | +2573/-1784 |
| #1800 | opus:high | MERGE |  | 1 | +107/-44 |
| #1801 | opus:high | MERGE |  | 1 | +270/-186 |
| #1802 | sonnet:low | FIX FIRST | checklist | 2 | +19/-8 |
