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
| 1 | sonnet:low | 23 | 16 | 0 | 1 | 6 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 80 | 61 | 12 | 5 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 74 | 60 | 3 | 5 | 6 |
| 3 | opus:high | 126 | 86 | 15 | 17 | 7 |
| 3 | fable:high | 2 | 2 | 0 | 0 | 0 |
| 4 | fable:high | 1 | 1 | 0 | 0 | 0 |
| 1 | opus:high | 17 | 5 | 1 | 10 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #1106 | #1061 | 2 | opus:high | MERGE | | 45683 | 107 | 145 | | 1 | season mark on town and school; core:network percents mapped | +829/-97 | |
| #1108 | #1077 | 2 | opus:high | FIX FIRST | checklist | 32371 | 84 | 94 | | 2 | office and map season marks; untyped test rule claimed fixed | +691/-33 | |
| #1107 | #1062 | 3 | opus:high | MERGE | | 51420 | 161 | 250 | | 1 | support on tap; MyGameFrameText; TalkBack merge and hint revert fixed before merge; device TalkBack walk not run | +1650/-77 | |
| #1111 | #1092 #1099 | 4 | opus:high | FIX FIRST | checklist | 20347 | 82 | 384 | | 2 | reset deferred via waitUntil; flake root cause was Mailpit rDNS; settle test passed with no-op | +540/-42 | |
| #1116 | #1080 | 2 | opus:high | MERGE | | 27816 | 96 | 182 | | 1 | sign-out once; links flag in retain {} NavigationLinks | +369/-116 | |
| #1115 #1117 | #1110 | 1 | sonnet:low | MERGE | | 1184 | 4 | | | 1 | typed 14 compose rules in two PRs around #1080 | +32/-14 | |
| #1118 | #1082 | 3 | opus:high | MERGE | | 27985 | 51 | 169 | | 1 | hasBandStarted on TownOverview via isWeekReached; school holdout note | +198/-14 | |
| #1119 | #1098 #1081 | 4 | opus:high | FIX FIRST | judgment | 44127 | 137 | 216 | | 4 | migration 0044 scaffold_version; Settings kept a second stored copy that drifted on the change answer | +3133/-111 | |
| #1120 | #1088 | 3 | opus:high | FIX FIRST | spec | 41903 | 101 | 216 | | 2 | one ICU formatter in CopyReader; Closes would have dropped three comment items (moved to #1121) | +347/-149 | |
| #1122 | #1121 | 3 | opus:high | FIX FIRST | judgment | 26553 | 70 | 219 | | 2 | both-phase MyGameLabel slots; IcuStrings deleted; banner live region lost its text in both phase | +308/-49 | |
| #1123 | #831 | 2 | opus:high | FIX FIRST | checklist | 48818 | 124 | 219 | | 2 | fixed-minute retries in town, report and school; review stops on background; two new branches had no test | +614/-29 | |
| #1124 | #1045 | 3 | opus:high | MERGE | | 4445 | 32 | 142 | | 1 | shared netsimd inherited a peer cwd; close spares netsimd and adb by exact name | +41/-3 | |
| #1125 | #850 | 1 | opus:high | FIX FIRST | judgment | 30690 | 168 | | 3 | ADR 045; stable-only missed the retained-word option; split stable 3-6, retained 7-10 | +1326/-15 | |
| #1137 | #1130 | 2 | opus:high | MERGE | | 3704 | 24 | 115 | | 1 | stable and retained word counts, levelWordNeedOf; reviewer ran 2 mutations | +155/-0 | |
| #1138 | #1129 | 1 | sonnet:low | FIX FIRST | judgment | 2434 | 8 | 107 | | 2 | word need copy; ticket-writer copy overpromised a build and a remedy | +27/-1 | |
| #1139 | #1131 | 3 | opus:high | MERGE | | 33506 | 64 | 254 | | 1 | every skill to money; running step carries the goal; day 57.9 reproduced by mutation | +269/-494 | |
| #1140 | #1132 | 3 | opus:high | FIX FIRST | checklist | 32112 | 81 | 151 | | 2 | NotEnoughWords admission; refusal order had no test (reviewer reorder stayed green) | +476/-27 | |
| #1142 | #1141 | 1 | opus:high | FIX FIRST | judgment | 16000 | 67 | 302 | | 4 | ADR 046 study reminder; lesson-ready and holdout cases left the learner silent | +382/-5 | |
| #1150 | #1149 | 3 | opus:high | MERGE | | 3353 | 15 | 87 | | 1 | Gradle 9.9.1 (security fixes) and AGP 9.5.1; 2191 tests before and after; wrapper sums match official | +3/-3 | |
| #1151 | #1133 | 3 | opus:high | FIX FIRST | checklist | 52258 | 135 | 152 | | 3 | Town word counts and card need; met rule without red run, then refusal copy disagreed with card | +943/-110 | |
