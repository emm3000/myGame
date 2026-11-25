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
| sonnet:low | 77 | 65 | 2 | 3 | 7 |
| sonnet:medium | 7 | 5 | 0 | 2 | 0 |
| sonnet:high | 3 | 0 | 0 | 2 | 1 |
| opus:medium | 108 | 80 | 11 | 14 | 3 |
| opus:high | 644 | 444 | 84 | 76 | 39 |
| fable:high | 84 | 64 | 2 | 12 | 6 |

## Recent

| PR | Model:effort | First review | Cause | Rounds | Lines +/- |
|---|---|---|---|---|---|
| #1977 | sonnet:low | MERGE |  | 1 | +23/-10 |
| #1978 | sonnet:low | MERGE |  | 1 | +717/-627 |
| #1979 | opus:high | MERGE |  | 1 | +134/-177 |
| #1991 | sonnet:low | MERGE |  | 1 | +45/-20 |
| #1992 | opus:high | MERGE |  | 1 | +58/-38 |
| #1993 | sonnet:low | MERGE |  | 1 | +43/-34 |
| #1994 | opus:high | MERGE |  | 1 | +276/-227 |
| #1995 | opus:high | MERGE |  | 1 | +842/-705 |
| #2015 | opus:high | MERGE |  | 1 | +78/-52 |
| #2016 | opus:high | FIX FIRST | spec | 2 | +3262/-112 |
| #2017 | opus:high | MERGE |  | 1 | +636/-28 |
| #2018 | opus:high | FIX FIRST | checklist | 2 | +2161/-347 |
| #2025 | opus:high | MERGE |  | 1 | +99/-18 |
| #2019 | opus:high | FIX FIRST | spec | 2 | +805/-394 |
| #2026 | opus:high | FIX FIRST | judgment | 2 | +208/-0 |
| #2030 | opus:high | FIX FIRST | checklist | 2 | +249/-58 |
| #2028 | opus:high | FIX FIRST | judgment | 2 | +252/-0 |
| #2034 | opus:high | MERGE |  | 1 | +239/-144 |
| #2035 | opus:high | FIX FIRST | judgment | 2 | +251/-0 |
| #2037 | opus:high | MERGE |  | 1 | +244/-151 |
