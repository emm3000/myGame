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
| 1 | sonnet:low | 13 | 11 | 0 | 0 | 2 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 72 | 60 | 5 | 6 | 1 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 26 | 24 | 1 | 0 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 59 | 53 | 1 | 2 | 3 |
| 3 | opus:high | 78 | 60 | 6 | 11 | 1 |
| 1 | opus:high | 7 | 2 | 1 | 4 | 0 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #799 | #739 | 4 | opus:high | MERGE | | 13268 | 51 | 115 | 22.20 | 1 | 52 | +255/-18 | |
| #801 | #800 | 3 | opus:high | MERGE | | 2719 | 21 | 42 | 1.67 | 1 | 3 | +106/-0 | |
| #802 | #797 | 3 | opus:high | MERGE | | 1943 | 13 | 29 | 1.22 | 1 | 2 | +13/-8 | |
| #798 | ADR 041 | 1 | opus:high | FIX FIRST | judgment | 23412 | 121 | 283 | 9.88 | 3 | 23 | +770/-108 | |
| #805 | #759 | 4 | opus:high | MERGE | | 28452 | 95 | 95 | 10.37 | 1 | 15 | +16/-0 | |
| #806 | #764 | 4 | opus:high | FIX FIRST | spec | 32158 | 131 | 157 | 13.53 | 2 | 20 | +1496/-60 | |
| #807 | #768 | 2 | opus:high | MERGE | | 11311 | 60 | 80 | | 1 | | | |
| #808 | #755 | 3 | opus:high | FIX FIRST | judgment | 19269 | 66 | 150 | | 2 | | | |
| #809 | #765 | 3 | opus:high | FIX FIRST | checklist | 24806 | 93 | 126 | | 2 | | | |
| #810 | #769 | 4 | opus:high | FIX FIRST | judgment | 14485 | 53 | 184 | 37.13 | 3 | 67 | +705/-89 | |
| #811 | #803 | 3 | opus:high | MERGE | | 1053 | 7 | 37 | 0.78 | 1 | 1 | +27/-11 | |
| #812 | #741 | 2 | opus:high | FIX FIRST | judgment | 16326 | 78 | 186 | 6.82 | 2 | 12 | +1392/-25 | |
| #813 | #758 | lore | opus:high | FIX FIRST | judgment | 36971 | 159 | 167 | 14.77 | 3 | 27 | +8306/-35 | |
| #814 | #772 | 3 | opus:high | MERGE | | 14735 | 58 | 87 | 5.95 | 1 | 9 | +1811/-25 | |
| #816 | #756 | 3 | opus:high | MERGE | | 16875 | 58 | 87 | 6.43 | 1 | 9 | +554/-238 | |
| #817 | #762 | 2 | opus:high | FIX FIRST | checklist | 44787 | 118 | 171 | 15.83 | 3 | 19 | +1943/-91 | |
| #818 | #740 | 2 | opus:high | FIX FIRST | checklist | 17159 | 99 | 165 | 7.39 | 2 | 16 | +893/-301 | |
| #821 | #770 | 3 | opus:high | FIX FIRST | checklist | 29918 | 89 | 198 | 11.89 | 2 | 15 | +1023/-29 | |
| #824 | #823 | 3 | opus:high | FIX FIRST | spec | 1402 | 24 | 70 | 1.48 | 2 | 3 | +93/-7 | |
| #822 | #773 | 2 | opus:high | FIX FIRST | judgment | 33292 | 97 | 260 | 13.18 | 2 | 19 | +1153/-79 | |
