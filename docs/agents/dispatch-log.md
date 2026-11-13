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
| 1 | sonnet:low | 22 | 16 | 0 | 0 | 6 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 78 | 60 | 11 | 5 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 73 | 60 | 3 | 4 | 6 |
| 3 | opus:high | 119 | 83 | 13 | 16 | 6 |
| 3 | fable:high | 2 | 2 | 0 | 0 | 0 |
| 4 | fable:high | 1 | 1 | 0 | 0 | 0 |
| 1 | opus:high | 15 | 5 | 1 | 8 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #1083 | #1049 | 1 | sonnet:low | FIX FIRST | spec | 1606 | 9 | 65 | | 2 | ticket-writer copy overpromised again (reviews stay as they are) | +65/-0 | |
| #1087 | #1052 | 2 | opus:high | MERGE | | 37993 | 124 | 120 | | 1 | town in server language; designsystem MyGameLabel overloads approved mid-run | +954/-315 | |
| #1086 | #1051 | 3 | opus:high | FIX FIRST | checklist | 43334 | 143 | 155 | | 2 | screenshots behind head; two copy keys added mid-run (skip line was false); note deferred to #1082 | +2417/-51 | |
| #1089 | #1056 | 3 | opus:high | MERGE | | 34039 | 97 | 230 | | 1 | overview holdout + released lessons in next step; one due rule shared; ADR 042 amended | +2682/-289 | |
| #1091 | #746 | 4 | opus:high | MERGE | | 10285 | 42 | 133 | | 1 | each mail in the stored scaffold; no-player sends nothing | +665/-108 | |
| #1093 | #1058 | 2 | opus:high | MERGE | | 19442 | 60 | 127 | | 1 | sign-up scaffold choice, phone-language default; group heading a11y fixed before merge | +407/-53 | |
| #1094 | #1054 | 2 | opus:high | MERGE | | 34384 | 82 | 159 | | 1 | map and placement in server language; placement all fixed copy | +680/-178 | |
| #1095 | #1060 | 3 | opus:high | MERGE | | 14806 | 46 | 165 | | 1 | season percents on the overview; one domain reader of the settings | +396/-88 | |
| #1097 | #1059 | 3 | opus:high | MERGE | | 38615 | 89 | 191 | | 1 | settings screen; late answer after sign-out guarded; branch deleted by my close before merge and restored from pull ref | +1300/-31 | |
| #1096 | #1057 | 2 | opus:high | MERGE | | 43252 | 90 | 146 | | 1 | released lessons on the school path; core:network readings mapped; Lesson 1 drop fixed | +614/-104 | |
| #1101 | #1055 | 2 | opus:high | MERGE | | 30284 | 75 | 158 | | 1 | review and verification banner in server language | +593/-122 | |
| #1102 | #1053 #1100 | 2 | opus:high | MERGE | | 34406 | 106 | 236 | | 1 | school in server language; released duplicate and wrap fixed | +841/-238 | |
| #1104 | #1076 | 3 | opus:high | MERGE | | 29564 | 113 | 388 | | 1 | FrameSpan wire; reviewer re-ran the resolver on 295 frames, no leak; 35 noCardSense tokens | +1360/-176 | |
| #1106 | #1061 | 2 | opus:high | MERGE | | 45683 | 107 | 145 | | 1 | season mark on town and school; core:network percents mapped | +829/-97 | |
| #1108 | #1077 | 2 | opus:high | FIX FIRST | checklist | 32371 | 84 | 94 | | 2 | office and map season marks; untyped test rule claimed fixed | +691/-33 | |
| #1107 | #1062 | 3 | opus:high | MERGE | | 51420 | 161 | 250 | | 1 | support on tap; MyGameFrameText; TalkBack merge and hint revert fixed before merge; device TalkBack walk not run | +1650/-77 | |
| #1111 | #1092 #1099 | 4 | opus:high | FIX FIRST | checklist | 20347 | 82 | 384 | | 2 | reset deferred via waitUntil; flake root cause was Mailpit rDNS; settle test passed with no-op | +540/-42 | |
| #1116 | #1080 | 2 | opus:high | MERGE | | 27816 | 96 | 182 | | 1 | sign-out once; links flag in retain {} NavigationLinks | +369/-116 | |
| #1115 #1117 | #1110 | 1 | sonnet:low | MERGE | | 1184 | 4 | | | 1 | typed 14 compose rules in two PRs around #1080 | +32/-14 | |
| #1118 | #1082 | 3 | opus:high | MERGE | | 27985 | 51 | 169 | | 1 | hasBandStarted on TownOverview via isWeekReached; school holdout note | +198/-14 | |
