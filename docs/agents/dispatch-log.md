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
| 2 | opus:high | 54 | 39 | 10 | 3 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 67 | 58 | 2 | 3 | 4 |
| 3 | opus:high | 99 | 70 | 10 | 14 | 5 |
| 1 | opus:high | 11 | 2 | 1 | 7 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #935 | #751 | 2 | opus:high | FIX FIRST | checklist | 19689 | 79 | 144 | 9.90 | 2 | 14 | +26/-0 | |
| #936 | #887 | 2 | opus:high | MERGE | | 11786 | 39 | 59 | 4.73 | 1 | 7 | +238/-3 | |
| #937 | #753 | 4 | opus:high | MERGE | | 26086 | 71 | 126 | 18.91 | 1 | 37 | +4394/-51048 | |
| #943 | #777 | 4 | opus:high | FIX FIRST | checklist | 20167 | 82 | 280 | 9.32 | 2 | 17 | +3349/-101 | |
| #944 | #939 | 1 | sonnet:low | MERGE | | 1149 | 4 | 26 | 0.46 | 1 | 0 | +3/-2 | |
| #945 | #942 | 3 | opus:high | MERGE | | 1343 | 15 | 38 | 1.09 | 1 | 2 | +6/-0 | |
| #946 | #778 | 3 | opus:high | MERGE | | 11291 | 48 | 72 | 4.82 | 1 | 8 | +1037/-9 | |
| #947 | #941 | 1 | sonnet:low | FIX FIRST | checklist | 1339 | 5 | 28 | 0.36 | 2 | 0 | +3/-162 | |
| #948 | #938 | 3 | opus:high | MERGE | | 4172 | 15 | 61 | 1.84 | 1 | 3 | +160/-168 | |
| #949 | #940 | 2 | opus:high | MERGE | | 2928 | 17 | 39 | 1.67 | 1 | 3 | +171/-1 | |
| #951 | #779 | 2 | opus:high | FIX FIRST | spec | 18141 | 58 | 142 | 6.55 | 2 | 10 | +856/-62 | |
| #953 | #780 | 2 | opus:high | MERGE | | 37674 | 117 | 166 | 12.78 | 1 | 21 | +1750/-34 | |
| #955 | #781 | 4 | opus:high | MERGE | | 5666 | 27 | 106 | 10.41 | 1 | 23 | +4205/-63 | |
| #956 | #952 | 2 | opus:high | MERGE | | 6256 | 22 | 51 | 2.75 | 1 | 4 | +60/-2 | |
| #957 | #782 | 3 | opus:high | FIX FIRST | checklist | 21608 | 66 | 113 | 7.74 | 2 | 12 | +1590/-21 | |
| #959 | #950 | 2 | opus:high | MERGE | | 1416 | 6 | 25 | 0.82 | 1 | 1 | +1/-7 | |
| #960 | #783 | 2 | opus:high | MERGE | | 7270 | 28 | 116 | 7.77 | 1 | 17 | +1542/-25 | |
| #961 | #784 | 3 | opus:high | MERGE | | 18046 | 58 | 143 | 18.86 | 1 | 40 | +2984/-115 | |
| #962 | #958 | 3 | opus:high | MERGE | | 22683 | 63 | 91 | 7.85 | 1 | 10 | +756/-133 | |
| #964 | #785 | 4 | opus:high | MERGE | | 25037 | 100 | 124 | | 1 | | +3587/-73 | |
