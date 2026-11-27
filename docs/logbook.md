# Logbook

What each working session advanced and what is still unproven, so a human can follow the project with no AI and nothing lives only in an issue thread. It replaces the checklists that lived on issue #1515.

Rule: every session adds its section below before the orchestrator's `/clear`, and moves what it proved out of `## Still to validate`. Sections run newest first.

## Still to validate

### Session 2026-11-27 (S46, fast mode from the first PR): what was not proven

The owner chose fast mode for every S46 PR: red-run quotes, emulator screenshots and the local full gate are skipped. Each peer ran only its touched modules' tests and detekt. CI (`gate`, `android`, `vercel`) and one `pr-reviewer` per PR still bound every merge. Tick each item when it is checked.

- [ ] **No red runs quoted** for #2134 (PR #2135), #2111 (PR #2136), #2120 (PR #2138), #2123 (PR #2139) and #2112 (PR #2152). Only PR #2138's fix round quoted one, for the `TownScreen.kt` scroll test. A test that passes against the old code proves nothing, and nobody checked whether these tests fail without the fix.
- [x] **No emulator shots** for #2111, #2112, #2120 and #2123. Proven: QA run 8 shot all four on trunk `547d72c9d` and ticked their boxes ([#1194 comment](https://github.com/emm3000/myGame/issues/1194#issuecomment-7214537981)).
- [x] **Town stocks with a five-digit capacity** (`storage.json:141` goes up to 57 650). Checked by QA run 8, and it fails: at 360 dp and font scale 1.0 each capacity wraps onto two lines. Filed as #2156.
- [ ] **New design-system pieces with no screenshot in either theme:** `MyGameSunkenCard`, `MyGameFrameGround`, and `ReadingBlock`'s `ground` (PR #2139). Contrast is computed (12.8:1 dark), not seen. QA run 9 saw `MyGameSunkenCard` in light and dark on Today; `MyGameFrameGround` and the `ground` remain unseen.
- [ ] **The read word in *Read more*** is still plain. It is split out to #2140 (server) and #2141 (Android).
- [x] **The design wave, 14 PRs merged with no emulator shots:** #2146 (PR #2154), #2149 (PR #2155), #2147 (PR #2158), #2113 (PR #2159), #2145 (PR #2160), #2151 (PR #2161), #2156 (PR #2162), #2142 (PR #2163), #2148 (PR #2165), #2144 (PR #2166), #2150 (PR #2167, Robolectric captures only, on `assets/2150`), #2143 (PR #2168), #2157 (PR #2169, the dots' wave needs a recording), #2122 (PR #2170). None quotes a red run; each ran only its touched modules. QA run 9 shoots them on trunk and ticks each issue's screenshot box. Proven: QA run 9 shot 12 of 14 on trunk `e46c61886` and ticked each passing box ([#1194 comment](https://github.com/emm3000/myGame/issues/1194#issuecomment-7216657066)). #2145 owes no shots and #2146 cannot be reached. #2113 fails on Town's header, filed as #2175; its box stays open.
- [ ] **Design-system changes that redraw many screens, seen on no screen:** a busy `MyGameTextLink` now draws the working dots and its busy line in place of its label (PR #2167; Sign out, Resend, Learn's busy links); the working dots rise and grow in turn (PR #2169); `MyGameOutlinedDoor` replaced 9 player-moving rows (PR #2170). The walk also checks that the word reading's door does not read as the first action above *Siguiente palabra*. QA run 9 saw part of it: *Salir* shows the dots and *Esperando*, the dots' wave is recorded at both sizes, the doors it shot draw the ink outline, and the word reading's door reads secondary to the filled *Siguiente palabra*, though it stays first in the reading order. Still unseen: Resend's and Learn's busy links, the word check rows and the placement offer row.
- [ ] **A test that hung:** a throwaway 360×640 font 2.0 capture in PR #2167 never went idle with the dots animating and the test JVM ran out of heap. No committed test can hang that way (the reviewer checked `autoAdvance`), but a new capture of an animated state must use reduced motion or `mainClock.autoAdvance = false`.
- [ ] **Placement and word-check screens** (#2145, #2146) cannot be reached on the emulator with the current content, because `GET /placement` answers closed. Only Robolectric backs them.

### Session 2026-11-26 and 2026-11-27 (S45, 23 PRs, fast mode from #2106): what was not proven

The owner deferred screenshots from PR #2105 on and chose fast mode from PR #2106 on, for this session only. Each fast-mode PR skipped its red-run quotes, its screenshots and the local full gate. CI (`gate`, `android`, `vercel`) and one `pr-reviewer` per PR still bound every merge. Tick each item when it is checked.

- [x] **No emulator shots for #2093, #2094, #2095, #1990 (PRs #2105–#2108).** Proven by QA run 8 on 2026-11-27, which shot each one and ticked its box. The canvas v12 walk (QA run 7, [#1194 comment](https://github.com/emm3000/myGame/issues/1194#issuecomment-7212576301), tag `qa-run-7`) covered these screens on trunk `61643ec7e`.
- [x] **No emulator shots for the fixes merged after the walk** (proven by QA run 8 on 2026-11-27, all nine shot and ticked):
  - the review end lands on Today: #2117, PR #2126;
  - the review end names the reviewed lesson: #2118, PR #2125;
  - the last lesson word ends in *Continue*: #2119, PR #2128;
  - the office's met requirement and its locked hire: #2121, PR #2127;
  - the running lesson's dots and one-line countdown: #2110, PR #2129;
  - no ring on News or the map: #2114, PR #2130;
  - equal-height Town tiles: #2115, PR #2131;
  - the Me spacing and the segmented Theme: #2116, PR #2133;
  - the navigation bar at font scale 2.0: #2124, PR #2132.
  Each of these issues keeps its screenshot box unticked. A second canvas walk on trunk would settle them all at once.
- [ ] **TalkBack on a phone:**
  - Today's running-lesson heading, which should be read once as one heading (PR #2129);
  - the segmented Theme, which should say "1 of 3" (PR #2133).
  Only Robolectric semantics back either one (#1112).
- [ ] **The QA walk could not reach these states:** the placement offer (`GET /placement` answered closed), the #2091 confirming dots (the answer lands within one frame), and the day-2, holdout and lesson-31 frames.
- [ ] **Six canvas deltas are still open:** #2111, #2112, #2113, #2120, #2122 and #2123. In S46, #2111, #2112, #2120 and #2123 merged (see S46 above), and #2113 and #2122 are in the design wave.
- [ ] **The owner's walk notes, not yet ticketed:**
  - Learn's lesson list needs a long scroll, and its information reads flat.
  - After a correct review answer the player has to tap twice. The owner suggests advancing automatically when nothing was earned.
  - On a small phone the review's button sits below the fold.
  Both review notes touch ADR 057 and go to a fable:high decision.
- [ ] **Server authority on hiring:** `HiringUiStateMapping.kt:71` locks a hire by comparing office levels, while the server checks the office level's `hires` list (#2078). In S46, #2134 (PR #2135) made the catalog refuse office content where a higher level drops a hire, so the two rules agree by construction. A gap in the level numbers would still split them (#2137).

### Triage 2026-11-22: every open item checked against trunk dd3e8dfc

Each open item below was checked against the code, git history and GitHub. The ticked ones are proven by later work:
- the `map` check runs, because `ARCHITECTURE.md` exists;
- 10 real `*Tables.ts` files pass `feature_graph`;
- #1739 merged;
- deploy run 44866181562 applied 0045 on Neon;
- #1686 fixed the Android cap;
- #1696, #1683 and #1739, #1687, #1697 and #1742, #1684, #1701 and #1689 fixed §5;
- `packages/catalog/src/generatedFiles.test.ts` checks `strings.xml`.

The red-run tables of 2026-11-20 are moot, because ADR 052 and ADR 054 rewrote that code.

What is left:
- **Commands: done 2026-11-22 by peer `verify` on e976b105, all PASS.**
  - The local `pnpm gate` exits 0: api 1314, web 1456, domain 671, contracts 368, catalog 53.
  - The #1742 red re-run fails 2 of 71, then passes 71 of 71.
  - #1743 at limit 31 and cap 8 makes each case fail, and restored it passes.
  - `TownStatusTest` passes 5 of 5.
  - The `EnglishText` locale-mark mutation makes 5 of 5 fail. TalkBack itself still needs the emulator.
- **Emulator QA run 6: done 2026-11-22 by peer `qa` on e976b105** ([#1194 comment](https://github.com/emm3000/myGame/issues/1194#issuecomment-7081244333), screenshots under tag `qa-run-6`).
  - 17 of 18 cases pass: smoke 7 of 7, #1519, #1530, #1665, #1671, #1666, #1581, #1670, #1625, and #1661/#1669 in es.
  - Two partial results: #1667 passes for lessons 1–10, where *top*, *due*, *try* and *review* do not appear. PlacementOffer is unreachable on a fresh account.
  - One failure: #1661 under none failed, filed as #1876 (a lone `.` or `?` after a wrapped support at font scale 2.0) and fixed by #1882.
  - Not run: TalkBack (#1587, #1620). The emulator's focus does not move under injected input, so it needs the owner's phone (#1112).
- **Web (parked, ADR 043):** the 38 items of §4, #1663, and the web half of #1667 and #1668. Tickets #1677, #1678 and #1681 are parked.
- **Owner:**
  - #1660 and #1662 on production;
  - §6.
- **Found by the triage:** production deploys fail since 13:17Z on Vercel's free cap of 100 api deployments a day, so production stays on 8f792520 until the cap resets.

### Session 2026-11-21 (21 PRs, log 746aec8e): what was not proven

The normal flow ran this session. Each peer ran the local `pnpm gate`, the TDD red runs, and emulator screenshots for screen PRs. These items are still open:

- [x] **Red runs were not re-run by any reviewer.** The reviewers of #1742 (check 6 lookback) and #1743 (structure check: folder limit 31, method cap 8) traced them by hand or read the PR body. Re-running them means reverting the fix and watching the test fail.
- [x] **No reviewer ran the local `pnpm gate`.** The reviewers of #1740–#1746 relied on CI's `gate` job; only the writers ran it locally.
- [x] **The `map` check has never run.** `scripts/mygame-structure-check` skips it until `ARCHITECTURE.md` exists. It first runs with A1 (#1714), which is where to confirm it fails on a missing folder row.
- [x] **`feature_graph` has no proof on real code.** The Biome postgres exemption (`*Tables`, `*FromRow`, `*Columns`) was tested only on planted probe files, because no `*Tables.ts` exists yet. The first real check is A3 (#1716) and A4 (#1717).
- [x] **Draft #1739 (#1694) is red.** Its WIP commit fails `town.test.ts` "reads the town in one round trip". It resumes after #1714.
- [ ] **The images of PR #1709 are broken.** Closing it deleted `assets/1703-visual-check`. #1747 and #1748 move the screenshot flow to one branch.
- [x] **The Android smoke (#1194) has not run since #1683–#1709.** Run 5 was earlier in this session. Run it once on trunk before the Android restructure (#1744).


### Session 2026-11-20 (fast mode, 100 PRs, log 71f93dcd): consolidated debt

This one list replaces the scattered per-PR lines above. Tick each item when it is checked.

#### 1. Never validated in this session (applies to every PR)
- [x] `pnpm gate` run locally on trunk. Only CI ran it.
- [x] (moot) Red-run tables: the new tests were not shown failing first. Mutation proofs exist only for #1661, #1664, #1666, #1667 and #1668.
- [ ] Screenshots of every changed web screen (`apps/web/CLAUDE.md` seed).
- [x] Emulator flows for every changed Android screen.
- [x] Android smoke (`docs/qa/android.md`, #1194) on the trunk after #1659–#1671. Run 4 passed 7 of 7 before that wave; run 5 passed 7 of 7 on 2026-11-21, and the bug it found (#1688) was fixed by #1698.

#### 2. Deploy and production (owner)
- [ ] #1660 (#1650): open the Report, finish a building in another tab, then close the Report. The next Report shows that news and does not mark it read early. Neon gets migration 0045 (report_served_at) at deploy.
- [ ] #1662 (#1649): after deploy, request forgot-password once on prod-like preview. The mail arrives and the response is the same as for an unknown address. The cap (5 pending per instance) cannot be hit by hand.
- [x] Confirm that Neon applied migration 0045 (`players.report_served_at`) on the first deploy after #1660.

#### 3. Android (15)
- [x] #1519 (#1367): texts moved to their own read. On Android, the school's text list shows titles and a text opens through `GET /town/texts/{id}`; a text not reached reads its own not-open state. Measure a town read's size with many texts on a real account.
- [x] #1530 (#1528): Android model only; the town home's status strip already drew a running released lesson's countdown by band and set. Confirm it still does on the emulator.
- [x] #1581 (#1573): Android: open a refused verify link, background the app, `adb shell am kill com.emm.mygame`, then return. It still shows the refused link and sends no token. The emulator run was waived.
- [ ] #1587 (#834): TalkBack on Android reads the school's lesson theme, the shown lesson and the words-page theme in English. The emulator screenshots and the remove-the-marks mutation check were not run.
- [ ] #1620 (#1614): with TalkBack on Android, the text titles on the school and on the text page read as English. Emulator run waived.
- [x] #1625 (#1615): Android study reminder. With the phone clock set off from the server, the reminder fires at the time computed from the Report's server `readAt`. Emulator run waived.
- [ ] #1663 (#1645): on the web lesson-words page, the support line under `es` is Spanish with `lang=es`. Under `none` it is the English definition with `lang=en`. Android lesson words are unchanged. Screenshots waived.
- [x] #1665 (#1651): on Android, finish a building. The finish notice shows with only *Close*, there is no way-on row, and the dock's go still leads to the next step. Emulator waived.
- [x] #1661 (#1654): on Android at font scale 2.0, open the lesson words and a review card. No line starts with a space or punctuation; a support that does not fit beside its word drops to the next line; `____` can open a line. Emulator waived.
- [x] #1669 (#1655): on Android at 360x640, font scale 2.0, es, check for truncation or awkward wrap on: school LessonRows and ShownLesson (title plus status), Report rows (`report_reminder_offer`), PlacementOffer, the TownPage school and map links, and TownReportRow.
- [x] #1666 (#1656): on Android, reproduce the holdout check's 400 by switching the scaffold between es and none mid-check, so the gloss dedup differs, then send. The check re-reads with the refusal line and fresh words. Emulator waived.
- [x] #1670 (#1653): on Android, with an es player whose email is unverified on an English phone, sign out and in, and kill the api briefly. The verification banner stays in Spanish. Emulator waived.
- [x] #1671 (#1652): on Android, earn a skill in a review during the English chrome phase under es. The verdict reads *Habilidad ganada: comida, nivel 2.* in Spanish; under none it is English. Emulator waived.
- [ ] #1667 (#1648): on web and Android, open lessons 1–10 and read the new definitions (money, town, full, come, worker, build, news, team, office, list, mayor, ready, station, clean, waste, top, due, try, review) and lesson 5's theme *Build a home*. Each reads naturally beside its word.
- [x] #1668 (#1657): on the web school with 11 words in learning, a 5-word lesson with 1 word held out shows as open, with no cap mark, and study starts. Android still blocks it (follow-up on #1497).

#### 4. Web (38). The web is parked by ADR 043, so check these when it is unparked.
- [ ] #1517 (#1042): docs only; S22's not-yet-shipped mark removed. Check the S22 row against the shipped screens in the smoke.
- [ ] #1518 (#1002): the News screen and the Report's news name a stopped build's or hire's refund (*Recuperaste: ...*); an all-zero refund draws nothing.
- [ ] #1524 (#1521, pending CI): the town home's stable and retained word counts, and a place card's *n of m words* need; none at top level.
- [ ] #1516 (#1281, pending CI): the web school lists the texts reached, newest first; a text opens on its own read; a word under 7 days shows its gloss beside it, a stable word on tap, a second tap closes it; a text not reached reads *nothing to read*.
- [ ] #1526 (#1090, pending CI): on the web town home, a running released lesson reads by band and set with its countdown, never *Lesson 0*; its finish notice too; the card goes to /school.
- [ ] #1529 (#1522, pending CI): after a correct review that opens a building level, the web verdict reads *Ya tienes ... nivel N*; none on a wrong answer.
- [ ] #1523 (#1064): the web settings screen changes the scaffold (es / none), shows *Saving...* then *Saved.*; a refusal and an unreachable api each restore the stored value. `ScaffoldChoice` moved to the design system and its keys were renamed to `scaffold.*`: recheck sign-up's picker too.
- [ ] #1533 (#1282, pending CI): the web town home names the newest text on caught-up and on a running lesson (beside the goal) and opens it; the web school shows *Banda N: x de y* per started band, none before.
- [ ] #1534 (#1066 A): the web school draws a due holdout check; take it (placement format, all answers at once), skip it, a 409 inline, and a check with no words sends an empty list. Placement's asking components moved to the design system: recheck placement too.
- [ ] #1539 (#1065 A): the web shell draws its chrome by the server's phase (Spanish, English over Spanish, English) and English under none; each line carries its `lang`; a screen reader voices the back link and the retained-words ring in the right language. The fixed-copy key list moved to `packages/catalog`.
- [ ] #1540 (#1527): the web school lists released lessons after the shelved ones, named by band and set (no more *Lesson 0* in the school), starts one, and shows a refusal inside its row; with none released, no row.
- [ ] #1541 (#1537 seam): no visible change is expected. Spot-check that the town, school, map and report still read the same in Spanish, since 102 files moved to `Label` props.
- [ ] #1544 (#1536): the web school, placement, holdout check and report draw chrome by phase (Spanish / English over Spanish / English) and fixed copy in the scaffold; under none everything is English. Known gap: the school's reviews link stays Spanish until #1535 merges.
- [ ] #1545 (#1537): the web map (terrain, jobs, clean-up, job-out) and the signed-in routes draw chrome by phase, with refusals and loading in the scaffold. Known gaps: news, report and reviews routes still pass `es`; a job-out time in the both phase shows English only.
- [ ] #1546 (#1535): the web town home, buildings, slots, resources, seasons and news draw chrome by phase; the next step's holdout and released lines stay in the scaffold. Known gaps: finish times in the both phase show English only (#1547); months and "y" stay Spanish (#1542).
- [ ] #1548 (#1542): under none or in the English phase, dates past tomorrow show English months, and amounts join with "and".
- [ ] #1547 / PR #1551 (pending): in the both phase, a countdown due tomorrow shows *tomorrow* over *mañana*. Check the layout of `WaitingUpgrades.tsx:38`, where a `' · '` separator sits beside a two-line column. It is unverified because screenshots were waived.
- [ ] #1552 (#1538 E1): signed in, the review card, refusals, settings, verification banner and sign-out are in the scaffold language whatever the phase; under none everything is English, including the cap refusal's time.
- [ ] #1553 (#1549 E2, fixes #1514): before sign-in the account screens follow the browser (`es*` Spanish, else English), with a visible switch that is remembered; sign-up's preselected scaffold matches; html lang follows. Check with an English browser and with a Spanish one, and with storage blocked (private window).
- [ ] #1554 (#1550 E3): no visible change is expected; the catalog no longer exports flat functions. Smoke any signed-in and signed-out screen in Spanish.
- [ ] #1564 (#1558): under none, a recognition's choices and its verdict's right answer are the English definitions, marked `lang="en"`; under es, the Spanish glosses.
- [ ] #1565 (#1555): on /school, when the next step is a released lesson or a holdout check, the block shows that step ahead of the shelf; it starts the lesson or opens the check, never links back to /school; a refused start shows inside the block.
- [ ] #1566 (#1559): Settings keeps focus on the picked radio while saving; sign-up shows *You can change it at any time in Settings.*; a pick during sign-up submit is ignored.
- [ ] #1569 (#1568): under none the recall cue is the English definition, marked `lang="en"`; under es, the Spanish gloss marked `lang="es"`.
- [ ] #1567 (#1560): on the town home, a season ending within a minute and a card whose resources arrive within a minute count down every second. Type a hire count of 3 and watch the ready line tick. A typed count now survives leaving the town home.
- [ ] #1570 (#1556): once a band starts, the web school shows the holdout note under the band lines (*1 word in 10 is kept back…*); none before.
- [ ] #1572 (#1557): in the web holdout check and placement walks, focus moves to the new word or end line after each step. Under none the choices are marked `lang="en"`, under es `lang="es"`. Try it with a keyboard and a screen reader.
- [ ] #1571 (#1561): on the town home the newest text's English title is marked `lang="en"` inside its Spanish line; on the school a released lesson's Spanish title is marked `lang="es"` inside an English line.
- [ ] #1582 (#1577): with a released lesson running, the web school's slot opens its words on `/school/released-<band>-<set>`, titled by band and set, with no *Lesson 0*.
- [ ] #1589 (#1578): on the web town home and on the school, a running released lesson's next step opens `/school/released-<band>-<set>`.
- [ ] #1590 (#854): with the device clock set 3+ s ahead, the web Report re-reads at `nextDueAt`, timed from the server's `readAt`. Screenshot waived.
- [ ] #1609 (#1596): on the web town home, in a countdown's last minute, type in the office form faster than once a second; every countdown keeps ticking. Check at 360 px and 1280 px (screenshots waived).
- [ ] #1611 (#1595): web school text page. Check four states: loading, before a tap, the Spanish gloss open, and the English definition open. The support region announces on a tap (screen reader). Screenshots waived.
- [ ] #1624 (#1601): web school full-cap line and town home place cards. Figures take `tabular-nums` one by one, with no shift while the numbers change. Check at 360 px and 1280 px in the es, both and en phases (screenshots waived).
- [ ] #1631 (#1628): on the web school text page, the tap word still looks and behaves the same (focus ring, expanded state, the support region opens) in light and dark mode. Screenshots waived.
- [ ] #1630 (#1627): leave the web Report open across local midnight. The next-review line and the news rows turn their day at 00:00. Screenshot waived.
- [ ] #1643 (#1639): leave the web Report open, put the laptop to sleep across midnight, then wake it. The next-review line shows the new day right away, with no new read. Screenshot waived.
- [ ] #1641 (#1634): on the web town home, place cards show the level number in `tabular-nums`; on the school, the full-cap word count does too. Check in the es, both and en phases (screenshots waived).

#### 5. Bugs and follow-ups found, not yet ticketed (details on #1497)
- [x] **Android learning-cap bug**, the twin of #1657: `SchoolContent.kt:66,75,140` compares `words.size`. A player sees a lesson blocked that the api would accept. Fix this first.
- [ ] Web skill verdict drawn as chrome, the twin of #1652 (`RatedVerdictLines.tsx`).
- [x] `GET /report` from lesson words moves the served instant (#1660).
- [x] No pg pool or statement timeout (`connectPostgres.ts:13`, #1662).
- [x] Check 6 reader gaps: past and participle in one set, the *have* lookback, 's never read as *has*, relative *that* (#1664, #1667).
- [ ] `LessonWordsScreen` ignores `support.shown` (#1663).
- [x] The holdout check 409 keeps old words (#1666); the `NavRowTitle` status weight (#1669); `rememberLastKnown` against `android-architecture.md:62` (#1670).
- [x] No CI check that the generated `strings.xml` matches the catalog (#1671).
- [ ] `ReportRepositoryTest` cast at :381 flakes under load (#1668), now #1874.

#### 6. Waiting on the owner
- #1460 (release key and production), #1114 (a real reset mail from production), #642 (a Cloudflare token), #641 (branch protection), and #1112, #1003 and #1010, which the owner parked.
- The PRD S7 wording (ADR 015) and the *energy* exception in `CONTEXT.md`.



## 2026-11-27 (S46): canvas v12's design deltas all merged

### Advanced
- **First wave (fast mode):** the hire lock follows the server (#2134, PR #2135) and four canvas deltas: #2111, #2120, #2123 and #2112 (PRs #2136, #2138, #2139, #2152). QA run 8 shot them on trunk: 17 pass and 1 fail, the five-digit stocks capacity (#2156, fixed by PR #2162).
- **Design wave (at most 3 peers, fast mode, one fresh peer per ticket):** 14 PRs, #2154 to #2170, close every open canvas v12 delta except the read word in *Read more* (#2140 server, #2141 Android, needs triage). About 70 of the canvas's 74 frames are now in code.
- **Design system:** `MyGameSunkenCard`; the four tab roots' title and ring in one header; a busy text link draws the working dots in place of its label; the dots rise and grow in turn (ADR 057 *Working* amended); `MyGameOutlinedDoor` for links that move the player (ADR 050 Door row amended).
- **Rules:** readability written down (`principles.md` Readability, `kotlin-style.md` Structure limits, `android-architecture.md` Layout; PR #2153). `scripts/mygame-merge` refuses `--no-close` unless the peer ran sonnet:low, so a row 2 peer is never recycled (PR #2164).
- **Review minors:** gathered on #2137.

### Not proven
- The items in this session's block under `## Still to validate`: no emulator shot of any design-wave PR, and no red run quoted. QA run 9 is next.

## 2026-11-26 and 2026-11-27 (S45): canvas v12 shipped, the junit4.v2 chain closed, the first walk's bugs fixed

### Advanced
- **ADR 057:** two amendments:
  - the running lesson is Today's first card (#2089, PR #2096);
  - *Read more* supports the read word's own token, while a unit's words stay unsupported (#2085, PR #2109). A fable:high agent decided the second, with the owner's authority, after triage showed that the premise of #2085 was wrong.
- **Canvas v12's deltas are all merged:** #2090, #2091, #2092, #2093, #2094, #2095 and #1990 (PRs #2097, #2103–#2108).
- **The junit4.v2 chain is closed:** #2054–#2058, PRs #2098–#2102. No v1 Compose rule is left in `apps/android`. #2058 was widened to cover `feature:today`, which no earlier ticket in the chain had included.
- **A canvas v12 walk on a windowed emulator** (QA run 7): 15 screens match, 19 have deltas, 3 states were unreachable. It filed #2110–#2124.
- **Fixed from the walk:** the four functional bugs (#2117, #2118, #2119, #2121) and five visual deltas (#2110, #2114, #2115, #2116, #2124).
- **Peers:** the owner raised the cap to five for this session only. Screenshots were deferred to one final walk from PR #2105, and fast mode started at PR #2106.

### Not proven
- The items in this session's block under `## Still to validate`.

### Next
- Run a second canvas walk on trunk, then triage #2111, #2112, #2113, #2120, #2122 and #2123.
- Settle the owner's three walk notes: Learn's hierarchy, review auto-advance, and the review button on small phones.
- Dispatch or close the follow-up batches #2078, #2066, #2049 and #1891.
- Close stale issues such as #716 and #571 if they are done.

## 2026-11-25: ADR 056, U1–U3, XA and Track X ticketed

### Advanced
- U1 (#1979): the season labels, `DurationMark` and `FramePieces` copies became one each in `core:ui`.
- U2 (#1992): `NavRowMatcher` and `TextStyleLookup` moved to the new test-only module `core:uitesting`.
- U3 (#1994): the server gap, `serverNow()` and the read loop are written once, in `core:model` `town/` (`ReadFollower`, `readUntilReached`).
- XA (#1993): `SignedInFrame` and `openFromDock` are now in files of their own name. `kotlin-style.md` now says a block-bodied `Unit` function omits its return type, matching detekt's `NoUnitReturn` and about 385 functions. The owner approved that line.
- Track X (the shell) was grilled by Fable, as the owner delegated, and cut into XA, XB and X1 to X7 (#1981–#1989). ADR 056 records the decisions (#1991).
- The Android peer limit is now two at a time, on disjoint Gradle modules, at most one of them with an emulator. The wave skill's cap is three peers.
- Every PR was MERGE at first review.

### Not proven
- No emulator flow ran, since none of these PRs changes how a screen is built.
- #1990 is in needs-triage: two sources disagree on which screens read the town (Review, SchoolText).

### Next
- U4 #1930 and XB #1982 can run side by side, then X1 to X7, D1 and D2, #1933, Z1 and Z2.
- #1891 has new minors from #1979, #1991, #1992 and #1994. The `core:uitesting` file renames must land before Z2.

## 2026-11-24 and 2026-11-25: ADR 056, Tracks S, J, L, P and R closed

### Advanced
- Track S closed with S5 (#1969): the school ViewModels fold their state into `SchoolTaps` and `LessonWordsTaps`.
- Track J closed (#1970–#1972): the map's previews, file names and `MapViewModel` under the limits, which folded into `MapReads`, `MapQuote` and `MapServerView`.
- Track L closed (#1973–#1975): `feature:learning` in `reviews`, its previews and card pieces filed by name, and `ReviewViewModel` folded into `ReviewReads` and `ReviewServerView`.
- Track P closed (#1976): the placement and holdout previews and routes are in files named for them.
- Track R closed (#1977, #1978): `feature:report` is split into its root and `news`, with its previews, news rows and ViewModel tests filed by name.
- The owner trialled opus:medium in place of opus:high on row 2 for this session only. Five PRs ran on it: three were MERGE at first review and two were FIX FIRST, both for legibility (a second spelling of one act, a declaration in a file named for another). None was a behavior finding.

### Not proven
- No emulator flow ran: ADR 056 answer 9 says a move owes none, so the Robolectric suites and `assembleDebug` are the evidence.
- Some Done when criteria were stale. `fd 'ReviewDock|ReviewCardContent'` matches `FillReviewDock.kt` as a substring, and the `NavRowMatcher.kt` baseline line named by #1924 and #1926 is no longer on trunk.

### Next
- U1–U4 (#1927–#1930), then #1933, Z1 and Z2. Track X (the shell) is grilled with the owner and ticketed before D1 (#1931).
- #1891 holds two new follow-ups: the school screen-test fixtures copied into three files, and three test names that appear twice in `feature:learning`.

## 2026-11-23 and 2026-11-24: ADR 056, the Android client by feature then by role

### Advanced
- ADR 056 accepted (#1889); its chain is #1892–#1935, one peer at a time, with the owner's bar: Android legible to a human with no AI.
- Track M (core:model, core:network packages) and Track N closed: `feature:account`, `feature:learning`, `feature:jobs` renamed (#1952–#1954); `feature:holdout` born (#1956).
- #1955: the Compose test helpers live once in `core:ui`'s `testFixtures`; `checkModuleBoundaries` refuses a test-fixtures edge outside a test configuration, and `checkStructure` reads the fixtures (#1957).
- Track A closed (#1958, #1959): account in `auth`, `password`, `scaffold`, `settings`, `signin`, `signup`, `verification`. ADR 056 section 4 gained the rule for a piece several screens draw.
- Track T closed (#1960–#1964): town in `building` (with `building/work`), `guidance`, `hiring`, `naming`, `status`; previews, names, sizes and test suites under the limits.
- Track S: S1–S4 merged (#1965–#1968); S5 (#1917) is next.
- Follow-ups gathered on #1891; U1 (#1927), U2 (#1928) and S5 (#1917) carry the review findings that belong to them.

### Not proven
- No emulator flow ran: ADR 056 answer 9 says a move owes none; the Robolectric suites and `assembleDebug` are the evidence.
- `TownWorkRepositoryTest` › `carries the cap of a full waiting list` flaked once at load 38 (#1891).

### Next
- #1917 (S5), then the rest of the chain through #1935.
- Track X (the shell) is grilled with the owner and ticketed before #1931.

## 2026-11-22 (afternoon): ADR 055, the #1685 minors and the validation pass

### Advanced
- #1866: ADR 055. The api's feature order binds the domain's `application/` folders, and `domain/` stays unordered with `noImportCycles` only. #1869 added the eight Biome overrides.
- #1867, #1870, #1871, #1872, #1873, #1875, #1877, #1878 and #1879: the 9 tickets split from #1685. They cover the domain read instant, the structure check, the town lock test, the Android renames, the content gate (*that* relative, noun subject), two definitions and two Android test pins.
- #1881: the Android network tests get their own client timeouts, so a loaded machine no longer reads `Unreachable` (#1880, found while working #1874).
- #1882: fixes a sentence's lone closing punctuation after a wrapped support at font scale 2.0 (#1876, found by QA run 6).
- Validation pass on the logbook's open debt:
  - triage against trunk;
  - local gate and red re-runs by peer `verify`;
  - Android QA run 6 by peer `qa`, where 17 of 18 cases pass.

  See *Triage 2026-11-22* under Still to validate.

### Not proven
- TalkBack (#1587, #1620): the emulator's focus does not move under injected input, so it needs the owner's phone (#1112).
- #1875 leaves "The school that has the money made it." refused; trunk passed it. The gate is stricter there, not weaker, and it is listed on the PR.
- Production deploys were capped by Vercel's 100 deployments a day from 13:17Z. The first deploy after the reset carries everything since 8f792520.

### Next
- #1747 then #1748: the asset branches, with the owner at the computer.
- The Android audit (#1744). The web stays parked: #1865, #1677, #1678, #1681 and the 38 web items.

## 2026-11-22: ADR 053 and ADR 054, the backend in three layers with classes

### Advanced
- #1804: ADR 053, a domain use case is a class with its ports in the constructor and one `execute`. ADR 054 (#1806) superseded it and absorbed it.
- #1806: ADR 054, each feature reads `domain/`, `application/` and `infrastructure/` (the owner chose Codely's shape). It covers use cases and controllers as classes, the `UnitOfWork` port and one grammar in both packages.
- #1826–#1856: all 19 migration tickets, #1807–#1825, merged as 30 PRs. Every feature is moved: platform, content, memory, season, account, town and its sub-areas, placement, holdout, learning and report. `apps/api/src` holds only `infrastructure/` and the composition root.
- `scripts/mygame-structure-check` runs on an empty baseline with the new checks: `role_folder`, `file_outside_layer`, `use_case_shape`, `controller_shape`, `use_case_built_outside_root`, `controller_built_outside_route_list` and `route_file`.
- New contract suites prove fakes that had none: `accountsContract` and `townReaderContract` (#1836). `DrizzleUnitOfWork` has rollback tests (#1830). `readScaffold` answers a `Result`, and no domain use case throws (#1852).
- 32 PRs in all.

### Not proven
- The town row lock (`'lockedForUpdate'` in `DrizzleTownRepository`) has no test that fails without it, because every town change takes the player lock first (#1840, noted on #1685).
- `MailCopy` was not prototyped before #1832. The mail copy was compared byte for byte in review, not on a live mail.
- The answer for a player with no account (`AccountNotFound`, an empty 500) was checked by reading the code, not by a live request (#1852).
- Feature order inside the domain package is not checked. 118 import lines cross the api's order (#1855).

### Next
- Batch #1685: the review minors of this sprint and the last (shared town store builder, quote duplication, town lock test, the unknown-email hash test, the `step_is_public` granularity).
- #1855: an ADR on feature order inside the domain package.
- Asset branches #1747 then #1748, with the owner at the computer. Audits #1744 (Android) and #1745 (web, parked).

## 2026-11-21: ADR 052 migration, audit and readability follow-ups

### Advanced
- #1739: the plain-pool statement timeout (#1694), deployed; `/api/health` answers 200.
- #1752–#1779: ADR 052 steps A1–A10, D1, D2 and C1. The api, domain and contracts read by feature then by role. The baselines are empty and the checks are hard. `noImportCycles` now really runs and checks type-only imports in the backend (#1774). `town/resources` exists (#1777). Imports across top-level folders are `#` subpath imports (#1751).
- #1738: the adversarial readability audit. It found nothing structural and filed eight tickets.
- #1788–#1802: those tickets, plus #1792 and #1795 from their reviews:
  - presenters only map (#1781, in four PRs);
  - responders are `respond*`;
  - adapters are named technology plus port;
  - one in-memory fake per port, through `@mygame/domain/testing`;
  - route tests live in the rightmost feature they seed;
  - reading names are checked in every async form;
  - `ARCHITECTURE.md` names every role (#1787).
- 40 PRs in all.

### Not proven
- Five fakes had broken their ports' promises (#1796). The review found no domain test that had asserted the wrong behavior, but there is no proof that every earlier fake-backed test was sound.
- Gates at a load average above 40 failed on 5 s test timeouts in files the PRs did not touch. Each later passed at a lower load. These are load-sensitive tests, not fixed.

### Next
- Batch #1685 holds the minors from this sprint's reviews.
- Asset branches: #1747, then #1748, when the owner is at the computer.
- Audits: #1744 (Android) and #1745 (web, parked).

## 2026-11-21: Android close-out and ADR 052 step 0

### Advanced
- #1683–#1709: Android and content.
- #1740: test path helper (#1713).
- #1741: ADR 052.
- #1742: content gate (#1695).
- #1743: structure check and limits in the gate (#1711).
- #1746: rules (#1712).
- #1750: this logbook (#1749); issue #1515 closed into it.
- 22 PRs in all (logs 746aec8e and the commit that adds this line).

### Not proven
See `## Still to validate`, the 2026-11-21 group.

### Next
- #1714, #1725 and #1736 in parallel.
- #1694 parked as draft #1739.
- Asset branches: #1747 and #1748.
- Audits: #1744 (Android) and #1745 (web, parked).

## 2026-11-20: fast-mode session

### Advanced
- 100 PRs in fast mode (log 71f93dcd), among them #1517–#1671 as listed under `## Still to validate`.
- Mutation proofs exist for #1661, #1664, #1666, #1667 and #1668.

### Not proven
See `## Still to validate`, the 2026-11-20 group, items 1 to 5.

### Next
- Fix the Android learning-cap bug first (item 5 of that group).
- Owner items in item 2 and the waiting list in item 6.
