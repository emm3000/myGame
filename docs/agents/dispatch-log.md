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
| 2 | opus:high | 29 | 25 | 2 | 1 | 1 |
| 3 | opus:medium | 24 | 16 | 3 | 4 | 1 |
| 4 | opus:high | 63 | 55 | 1 | 3 | 4 |
| 3 | opus:high | 85 | 65 | 7 | 12 | 1 |
| 1 | opus:high | 9 | 2 | 1 | 6 | 0 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #818 | #740 | 2 | opus:high | FIX FIRST | checklist | 17159 | 99 | 165 | 7.39 | 2 | 16 | +893/-301 | |
| #821 | #770 | 3 | opus:high | FIX FIRST | checklist | 29918 | 89 | 198 | 11.89 | 2 | 15 | +1023/-29 | |
| #824 | #823 | 3 | opus:high | FIX FIRST | spec | 1402 | 24 | 70 | 1.48 | 2 | 3 | +93/-7 | |
| #822 | #773 | 2 | opus:high | FIX FIRST | judgment | 33292 | 97 | 260 | 13.18 | 2 | 19 | +1153/-79 | |
| #826 | #744 | 4 | opus:high | MERGE | | 12563 | 98 | 183 | 6.75 | 1 | 13 | +4757/-109 | |
| #828 | #763 | 2 | opus:high | FIX FIRST | checklist | 20891 | 210 | 521 | 13.45 | 3 | 30 | +4761/-386 | |
| #833 | #771 | 2 | opus:high | MERGE | | 22563 | 170 | 330 | 13.09 | 1 | 26 | +3322/-39 | |
| #835 | #775 | 2 | opus:high | FIX FIRST | checklist | 16155 | 149 | 391 | 10.34 | 2 | 21 | +3370/-63 | |
| #832 | ADR 042 | 1 | opus:high | FIX FIRST | judgment | 22491 | 231 | 530 | 16.27 | 5 | 40 | +561/-6 | |
| #851 | #836 | 4 | opus:high | FIX FIRST | checklist | 16750 | 112 | 269 | 9.94 | 2 | 17 | +1522/-66 | |
| #853 | #837 | 3 | opus:high | FIX FIRST | spec | 20403 | 122 | 393 | 11.22 | 2 | 18 | +1611/-94 | |
| #857 | #839 | 1 | sonnet:low | MERGE | | 691 | 3 | 81 | 0.28 | 1 | 0 | +2/-2 | |
| #858 | #838 | 2 | opus:high | MERGE | | 3777 | 23 | 100 | 2.36 | 1 | 3 | +110/-11 | |
| #860 | ADR 043 | 1 | opus:high | FIX FIRST | spec | 24007 | 230 | 426 | 16.61 | 4 | 45 | +671/-27 | |
| #859 | #844 | 2 | opus:high | FIX FIRST | spec | 28206 | 171 | 388 | 13.92 | 3 | 27 | +1182/-69 | |
| #875 | #861 | 3 | opus:high | MERGE | | 17150 | 107 | 332 | 9.55 | 2 | 18 | +489/-549 | |
| #877 | #862 | 3 | opus:high | FIX FIRST | judgment | 27932 | 148 | 300 | 13.24 | 2 | 23 | +809/-276 | |
| #880 | #863 | 3 | opus:high | FIX FIRST | checklist | 19127 | 129 | 244 | 10.45 | 2 | 20 | +3143/-7716 | |
| #884 | #864 | 3 | opus:high | FIX FIRST | spec | 17107 | 109 | 259 | 12.63 | 2 | 17 | +401/-374 | |
| #885 | #840 | 2 | opus:high | FIX FIRST | checklist | 29704 | 179 | 359 | 18.63 | 2 | 28 | +2317/-92 | |
