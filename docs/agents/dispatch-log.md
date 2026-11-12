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
| 1 | sonnet:low | 15 | 12 | 0 | 0 | 3 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 65 | 48 | 10 | 5 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 68 | 58 | 2 | 3 | 5 |
| 3 | opus:high | 106 | 75 | 10 | 15 | 5 |
| 1 | opus:high | 11 | 2 | 1 | 7 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #968 | #774 | 2 | opus:high | MERGE | | 17452 | 46 | 75 | | 1 | | +424/-42 | |
| #970 | #963 | 2 | opus:high | FIX FIRST | judgment | 29983 | 95 | 110 | | 3 | | +635/-99 | |
| #969 | #786 | 3 | opus:high | FIX FIRST | judgment | 35883 | 93 | 95 | | 2 | | +1058/-221 | |
| #972 | #965 | 3 | opus:high | MERGE | | 11893 | 42 | 75 | | 1 | | +759/-491 | |
| #973 | #971 | 2 | opus:high | FIX FIRST | judgment | 33322 | 78 | 85 | | 2 | | +314/-75 | |
| #977 | #787 | 2 | opus:high | MERGE | | 33641 | 92 | 75 | | 1 | | +764/-114 | |
| #978 | #788 | 2 | opus:high | MERGE | | 47099 | 137 | 160 | | 3 | | +1472/-172 | |
| #980 | #979 | 3 | opus:high | MERGE | | 6696 | 21 | 45 | | 1 | | +140/-41 | |
| #982 | #954 | 2 | opus:high | MERGE | | 25175 | 54 | 75 | | 1 | | +227/-66 | |
| #983 | #981 | 3 | opus:high | MERGE | | 32719 | 91 | 150 | | 3 | | +573/-89 | |
| #974 | #742 | 1 | sonnet:low | FIX FIRST | spec | 5994 | 42 | 95 | | 2 | | +680/-16 | |
| #984 | #789 | 4 | opus:high | FIX FIRST | spec | 20470 | 79 | 140 | | 2 | | +3357/-26 | |
| #988 | #790 | 3 | opus:high | MERGE | | 14318 | 39 | 95 | | 1 | | +619/-115 | |
| #989 | #776 | 2 | opus:high | MERGE | | 23513 | 65 | 75 | | 1 | | +760/-63 | |
| #992 | #986 | 3 | opus:high | MERGE | | 12773 | 54 | 75 | | 1 | | +497/-26 | |
| #994 | #987 | 2 | opus:high | MERGE | | 10858 | 44 | 45 | | 1 | | +499/-0 | |
| #996 | #995 | 3 | opus:high | MERGE | | 7986 | 33 | 65 | | 1 | | +182/-4 | |
| #993 | #792 | 2 | opus:high | MERGE | | 39318 | 116 | 95 | | 2 | | +1308/-28 | |
| #999 | #791 | 2 | opus:high | MERGE | | 21339 | 64 | 90 | | 1 | | +694/-29 | |
| #1000 | #990 | 2 | opus:high | MERGE | | 15676 | 45 | 45 | | 1 | | +103/-36 | |
