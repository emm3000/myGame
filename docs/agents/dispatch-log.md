# Dispatch log

This log records the outcome of every PR per row of the model table, which lives only in `.claude/skills/wave/SKILL.md`; the loop it serves is `docs/agents/multi-session.md`. When a row shows two or more first-review FIX FIRST verdicts for reasons the checklist did not cover, raise it one step and note why in the skill. A row that stays MERGE across many PRs may move one step down.

The log has a fixed size. The Summary keeps the totals per row forever. Recent keeps only the last 20 PRs. At cycle close the orchestrator appends the new PR to Recent. When Recent passes 20 rows, it adds the oldest rows to the Summary counts and deletes them.

Cause values: `checklist` (a recurring item from the reviewer checklist, the model was fine), `judgment` (a wrong decision the model made), `spec` (the issue was wrong or thin).

Token columns, in thousands, measured from #707 on; older rows leave them empty. A row's cost is every token its PR took, fixes included, so the rows compare by cost per MERGE, not by verdict alone.
- **Peer in k** is every input token the peer session read: uncached, cache writes and cache reads. Cache reads dominate it.
- **Peer out k** is every output token the peer wrote.
- **Review k** adds up the `subagent_tokens` of each `pr-reviewer` run on the PR.
- **Rounds** counts the reviews until MERGE; 0 for a row 5 artifact, which has no review.
- **Model min** is the `totalAPIDuration` of the same `cost-state` line in minutes: the time the model worked, not the wall time the session stayed open.
- **Lines +/-** is `totalLinesAdded` and `totalLinesRemoved` from the same line.
- **Later bug** names the issue of any bug traced back to the PR after its merge; the orchestrator fills it when the bug's ticket names the PR. A MERGE with a later bug was not a clean MERGE.
- **Peer USD** is the `totalCostUSD` of the peer session's last `cost-state` line, written when the session exits; read it after `scripts/mygame-wave-close`. It is the API-price equivalent the status line shows, not what the subscription bills, so it compares rows, not invoices: `jq -c 'select(.type=="cost-state")|{usd:.totalCostUSD,min:(.totalAPIDuration/60000|floor),add:.totalLinesAdded,rm:.totalLinesRemoved}' <file>.jsonl | tail -1`. A peer that served two PRs splits nothing; its row with the later PR carries the session's total.

The peer's transcript survives the cycle close in `~/.claude/projects/-Users-emm-Documents-ia-mygame-<name>/`. Read its newest `.jsonl` and count each assistant message once, by `message.id`:

```
jq -s '[.[]|select(.type=="assistant" and .message.usage)]|unique_by(.message.id)|map(.message.usage)|{in:(map(.input_tokens+(.cache_creation_input_tokens//0)+(.cache_read_input_tokens//0))|add),out:(map(.output_tokens)|add)}' <file>.jsonl
```

## Summary

Totals of rows already folded out of Recent.

| Row | Model:effort | PRs | MERGE | FIX FIRST checklist | FIX FIRST judgment | FIX FIRST spec |
|---|---|---|---|---|---|---|
| 1 | sonnet:low | 14 | 12 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 40 | 30 | 6 | 2 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 65 | 56 | 2 | 3 | 4 |
| 3 | opus:high | 94 | 67 | 9 | 13 | 5 |
| 1 | opus:high | 11 | 2 | 1 | 7 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #907 | #872 | 2 | opus:high | MERGE | | 10561 | 60 | 158 | 5.34 | 1 | 8 | +573/-46 | |
| #908 | #841 | 2 | opus:high | MERGE | | 14560 | 118 | 216 | 8.83 | 1 | 17 | +1515/-104 | |
| #909 | #842 | 2 | opus:high | FIX FIRST | judgment | 6336 | 52 | 202 | 3.56 | 2 | 7 | +271/-12 | |
| #910 | #843 | 2 | opus:high | FIX FIRST | checklist | 10559 | 70 | 217 | 5.49 | 2 | 10 | +518/-64 | |
| #911 | #845 | 2 | opus:high | FIX FIRST | checklist | 15271 | 111 | 271 | 8.11 | 2 | 17 | +1172/-70 | |
| #912 | #846 | 3 | opus:high | MERGE | | 28272 | 80 | 88 | 10.02 | 1 | 16 | +308/-4 | |
| #913 | #847 | 2 | opus:high | MERGE | | 38124 | 94 | 95 | 13.51 | 1 | 18 | +642/-0 | |
| #914 | #873 | 2 | opus:high | FIX FIRST | checklist | 23860 | 92 | 119 | 8.87 | 2 | 16 | +620/-1 | |
| #915 | #874 | 2 | opus:high | FIX FIRST | checklist | 53084 | 151 | 184 | 18.03 | 2 | 28 | +572/-0 | |
| #916 | #793 | 4 | opus:high | MERGE | | 26460 | 62 | 108 | 8.77 | 1 | 9 | +227/-0 | |
| #923 | #848 | 2 | opus:high | MERGE | | 11374 | 34 | 61 | 4.48 | 1 | 5 | +154/-0 | |
| #924 | #849 | 2 | opus:high | MERGE | | 17421 | 54 | 84 | 6.19 | 1 | 10 | +319/-39 | |
| #925 | #917 | 3 | opus:high | FIX FIRST | judgment | 47414 | 152 | 144 | 17.45 | 2 | 30 | +666/-2 | |
| #927 | #920 | 3 | opus:high | MERGE | | 7802 | 71 | 60 | 4.59 | 1 | 9 | +869/-22 | |
| #928 | #918 | 2 | opus:high | MERGE | | 7809 | 64 | 101 | 4.78 | 1 | 9 | +401/-0 | |
| #929 | #921 | 2 | opus:high | MERGE | | 4938 | 46 | 117 | 3.34 | 1 | 6 | +718/-79 | |
| #930 | #919 | 2 | opus:high | MERGE | | 4597 | 43 | 74 | 3.16 | 1 | 6 | +461/-2 | |
| #931 | #922 | 2 | opus:high | MERGE | | 4619 | 33 | 61 | 3.22 | 1 | 4 | +205/-0 | |
| #932 | #926 | 3 | opus:high | FIX FIRST | checklist | 20983 | 94 | 69 | 11.21 | 2 | 18 | +569/-3 | |
| #933 | #645 | 3 | opus:high | MERGE | | 2281 | 28 | 41 | 1.96 | 1 | 4 | +132/-26 | |
