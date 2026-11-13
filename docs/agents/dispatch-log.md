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
| 1 | sonnet:low | 20 | 15 | 0 | 0 | 5 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 69 | 52 | 10 | 5 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 71 | 59 | 2 | 4 | 6 |
| 3 | opus:high | 112 | 77 | 12 | 16 | 6 |
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
| #1029 | #1006 | 3 | fable:high | MERGE | | 17766 | 96 | 102 | | 1 | Fable 5.2 trial, owner approved; three deviations all accepted | +1406/-431 | |
| #1028 | #1020 | 1 | sonnet:low | MERGE | | 1314 | 5 | 29 | | 1 | | +9/-0 | |
| #1030 | #1022 | 1 | sonnet:low | MERGE | | 918 | 3 | 25 | | 1 | | +15/-0 | |
| #1031 | #1023 | 2 | opus:high | MERGE | | 28931 | 90 | 87 | | 1 | two minors folded (search bound, no seconds) | +518/-26 | |
| #1032 | #1025 | 3 | fable:high | MERGE | | 22925 | 118 | 114 | | 1 | Fable trial 2; two minors folded; own /agents-review ran two opus reviewers | +1007/-19 | |
| #1034 | #1008 | 1 | opus:high | MERGE | | 8486 | 37 | 67 | | 1 | content raised from sonnet:low; reviewer approved content for the owner; four content minors folded | +102/-2 | |
| #1036 | #1007 | 4 | fable:high | MERGE | | 23106 | 121 | 103 | | 1 | Fable trial 3; GET-side frame store upheld; three minors folded | +3397/-115 | |
| #1037 | #1021 | 3 | opus:high | FIX FIRST | checklist | 15288 | 57 | 188 | | 2 | deriveFullAt stop rule every/some untested | +571/-98 | |
| #1039 | #1033 | 1 | sonnet:low | MERGE | | 1216 | 3 | 21 | | 1 | stale CLAUDE.md line left: peer declined a CLAUDE.md edit on peer request | +4/-1 | |
| #1040 | #1038 | 1 | sonnet:low | FIX FIRST | spec | 1681 | 9 | 34 | | 2 | left S22 unmarked while its halves were open | +18/-7 | |
| #1041 | #1024 | 2 | opus:high | MERGE | | 14489 | 51 | 63 | | 1 | one minor folded (window measured from the read) | +285/-13 | |
| #1044 | #1009 | 2 | opus:high | MERGE | | 13712 | 39 | 37 | | 1 | emulator run found nothing to fix; tests and screenshots only | +91/-0 | |
| #1043 | #1011 | 1 | opus:high | MERGE | | 5540 | 49 | 67 | | 1 | content raised from sonnet:low; reviewer read all 160 frames; 9 wording fixes folded | +940/-64 | |
| #1046 | #804 | 4 | opus:high | FIX FIRST | judgment | 38239 | 175 | 297 | | 2 | sample over-asked the random source: 500 in prod, fakes sliced | +5652/-153 | |
| #1067 | #745 | 3 | opus:high | FIX FIRST | checklist | 58959 | 153 | 108 | | 2 | part a of 3 (catalog en, values split); no English-device screenshots; 7 copy rewordings | +1214/-473 | |
| #1068 | #745 | 4 | opus:high | MERGE | | | | 90 | | 1 | part b of 3 (players.scaffold migration); minors carried into part c | +3003/-47 | |
| #1069 | #745 | 3 | opus:high | FIX FIRST | judgment | | | 330 | | 3 | part c of 3; placement/holdout Spanish under none, phase unreachable without a town, then contract suite and lazy phase; tokens on #1067 row cover all three parts | +2092/-212 | |
| #1073 | #1048 | 1 | sonnet:low | FIX FIRST | spec | 1297 | 8 | 72 | | 2 | ticket-writer copy overpromised (skip changes nothing; short check) | +93/-0 | |
| #1075 | #1061 #1062 | 1 | opus:high | FIX FIRST | judgment | 15028 | 72 | 85 | | 4 | ADR: support leaks via inflected forms, wrong-sense card words, unit literal glosses; delegation docs aligned | +62/-11 | |
| #1079 | #1050 | 3 | opus:high | MERGE | | 48549 | 174 | 155 | | 1 | chrome language from server phase; sign-out dead-nav bug caught on emulator; real-time test fixed before merge | +1521/-206 | |
