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
| 1 | sonnet:low | 25 | 18 | 0 | 1 | 6 |
| 2 | sonnet:medium | 2 | 0 | 0 | 2 | 0 |
| 2 | opus:medium | 77 | 61 | 7 | 7 | 2 |
| 2 | sonnet:high | 3 | 0 | 0 | 2 | 1 |
| 2 | opus:high | 95 | 71 | 15 | 7 | 2 |
| 3 | opus:medium | 25 | 16 | 4 | 4 | 1 |
| 4 | opus:high | 74 | 60 | 3 | 5 | 6 |
| 3 | opus:high | 134 | 88 | 18 | 18 | 9 |
| 3 | fable:high | 2 | 2 | 0 | 0 | 0 |
| 4 | fable:high | 1 | 1 | 0 | 0 | 0 |
| 1 | opus:high | 18 | 5 | 1 | 11 | 1 |
| 1 | fable:high | 43 | 31 | 1 | 8 | 3 |
| 5 | fable:high | 18 | 18 | 0 | 0 | 0 |
| 5 | opus:high | 3 | 3 | 0 | 0 | 0 |

## Recent

Last 20 PRs, oldest first. Model:effort is what actually ran, which may differ from the table row. Known defect (audit #1200 item 9): in the rows from #1152 on, the merge helper wrote the orchestrator's cycle number into Review k, and a summary note into Model min. Neither column holds what its header says. The log's format is being rewritten.

| PR | Issue | Row | Model:effort | First review | Cause | Peer in k | Peer out k | Review k | Peer USD | Rounds | Model min | Lines +/- | Later bug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| #1159 | #1147 | 3 | opus:high | FIX FIRST | checklist | 42132 | 187 | 159 | | 2 | Inexact alarm, boot and clock receiver, notification; language and tap rules added after review had no test | +1069/-58 | |
| #1163 | #1148 | 3 | opus:high | FIX FIRST | judgment | 73859 | 188 | 160 | | 3 | Reminder Settings, permission, Report offer; revoked notifications left the switch drawn on, six rules without red runs | +1375/-62 | |
| #1162 | #1161 | 1 | opus:high | FIX FIRST | judgment | 21675 | 80 | 161 | | 4 | ADR 047 Main Street; self-targeting steps, dropped home parts and a second green button found by review | +668/-0 | |
| #1174 | #1164 | 2 | opus:high | MERGE |  | 9962 | 31 | 162 | | 1 | go and on-go tokens, generated to Android, contrast pinned on both sides | +140/-7 | |
| #1175 | #1165 | 2 | opus:high | MERGE |  | 17924 | 47 | 163 | | 1 | Report rows: Town News, reminder offer, Settings; offer guard caught by two mutations | +102/-41 | |
| #1180 | #1177 | 2 | opus:high | MERGE |  | 29852 | 60 | 164 | | 1 | Review follow-ups batch: stable lapse test, sample cap, word-need top level, English refusal and level line, Report padding and sign-out | +255/-30 | |
| #1178 | #1166 | 2 | opus:high | FIX FIRST | judgment | 53128 | 172 | 165 | | 3 | Dock state in the town status: own read, loading and refused, no-town apart; countdown froze once a review passed | +602/-98 | |
| #1176 | #1167 | 3 | opus:high | FIX FIRST | spec | 70023 | 212 | 166 | | 2 | Go button and MyGameDock, measured 435 dp unfolded at es 2.0; first round missed placement and holdout screenshots | +1316/-24 | |
| #1182 | #1181 | 2 | opus:high | FIX FIRST | checklist | 21604 | 88 | 167 | | 2 | Single-flight town read, joined only by the newest ticket in the same session; readSentAfterNow after a rated answer | +387/-89 | |
| #1184 | #1168 | 2 | opus:high | FIX FIRST | judgment | 39746 | 118 | 168 | | 3 | Street strip and place page; tabs 45 dp inside the 20 dp gutter on a 360 dp phone, now scroll and snap on arrival | +825/-1 | |
| #1187 | #1186 | 2 | opus:high | MERGE |  | 20934 | 103 | 169 | | 3 | Count disc intrinsics: 32961 dp max width stacked every door; LabelAndCount keeps words whole at 2.0 | +559/-31 | |
| #1185 | #1169 | 3 | opus:high | FIX FIRST | spec | 143401 | 491 | 170 | | 6 | Dock frame on every signed-in screen; folded line lost off Content, dock on naming, side insets, TalkBack order, a false reading line, School and dock on two reads | +2349/-1951 | |
| #1189 | #1188 | 2 | opus:high | MERGE |  | 6315 | 24 | 171 | | 1 | Held town keeps the newest answer by send order; a late older read no longer overwrites | +49/-2 | |
| #1190 | #1171 | 2 | opus:high | MERGE |  | 39194 | 120 | 172 | | 1 | Placement and the holdout check in the dock; the end follows the town step through a shared task-dock seam | +765/-230 | |
| #1193 | #1192 | 1 | opus:medium | FIX FIRST | judgment | 14840 | 57 | 173 | | 2 | Android QA plan in docs/qa/android.md, 30 cases, 7 smoke; a broken jq seed line and a promised keyboard behavior the app lacks | +509/-0 | |
| #1191 | #1170 | 2 | opus:high | FIX FIRST | checklist | 83395 | 279 | 174 | | 3 | Review and word reading in the dock; untested folded TalkBack turn, missing 2.0 shots, a verdict that folds the dock never scrolled into view | +1205/-358 | |
| #1198 | #1197 | 1 | sonnet:low | FIX FIRST | spec | 1984 | 9 | 175 | | 2 | QA plan fixes from run 1; the PR claimed namespaced keys but only the example had one, and the smoke box did not hold its own numbers | +48/-48 | |
| #1199 | #1195 | 2 | opus:high | FIX FIRST | checklist | 32819 | 116 | 176 | | 2 | Theme pick in Settings (System, Light, Dark) as a device preference; no red runs quoted, nav scrim dropped, pick gated behind the settings read | +762/-13 | |
| #1202 | #1201 | 1 | fable:high | MERGE |  | 2262 | 44 | 177 | | 1 | Lean peer loop from audit #1200: peer.md, blockers only, red-run table, screenshots once, disjoint-module rule; multi-session.md 26 KB to 14 KB | +93/-55 | |
| #1204 | #1172 | 2 | opus:high | FIX FIRST | spec | 54265 | 166 | 178 | | 2 | Main Street pager, seven place pages over the street strip; #1196 left the office refusals out and the rewrite dropped four tests of shipped code | +1282/-1207 | |
