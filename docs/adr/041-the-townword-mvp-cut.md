---
status: proposed
date: 2026-11-04
---
# The Townword MVP cut

## Context

ADR 040 splits the town rebuild into 43 slices, #754 to #793 for
slices 1 to 40 and #751 to #753 for the cutover (41 to 43), each filed
with its blocking edges. Its order builds every town screen on both
clients, then the economy's breadth (the office, the map, jobs,
clean-ups, goals and tips), and makes the cutover the last slice. The
content tickets beside it are #741 (the chrome lessons), #742 (band 1,
first batch), #743 (placement), #744 (the holdout), #745 (the scaffold
and the chrome phases) and #746 (mail per language); #739 (the catalog)
is in flight. The owner asked on 2026-11-04 for the shortest path to a
playable Townword that teaches English to an A1–A2 Spanish-speaking
adult, the owner, who plays it daily, and delegated every branch to
what serves learning English best.

What trunk and the issues hold, checked at `0dc33268`:

- **The wave rules.** `.claude/skills/wave/SKILL.md`: at most 3 peers
  under `max-100`, no wave carries two tickets touching the same
  package, and a schema or migration change is always a wave of one.
- **Every town screen writes the catalog.** The web screen tickets
  (#762 onward) name `apps/web` and its catalog keys; the Android ones
  name `apps/android` only in their dispatch line, yet each requires
  every key to land in `en.json` and `es.json` together, in
  `packages/catalog`. So a web screen and an Android screen never share
  a wave. The api tickets touch no `apps/android` file: `core:network`
  generates its client at build time from `apps/api/openapi.json`
  (`apps/android/CLAUDE.md`), so they owe the Android gate as
  verification, not as an edit.
- **The order as filed.** A greedy schedule of the filed edges under
  those rules, run for this ADR over every ticket named above, gives
  39 waves in all: the naming screen (#762) at wave 9, the school
  (#770) at 19, the Report (#773) at 24, the cutover (#753) at 35. Read
  with the Android screens outside `packages/catalog`, as their
  dispatch lines say, it gives 29 waves in all, the school at 16, the
  Report at 19 and the cutover at 25. Either way, from #769, which
  drops the fief's lesson slot, until the school screen lands, no
  screen starts a lesson (ADR 040, *The clients in slice 16*): 7 to 10
  waves of reviews alone.
- **Today's game.** The owner plays lesson 1 and its reviews on the
  medieval fief (S39, #716). Lessons 2 to 16 wait for #769 (ADR 040).
  Until ADR 038's step 4 (#745) every player is `es` and the chrome is
  Spanish; under `es` it stays Spanish anyway until every chrome lesson
  is studied (ADR 038, *The chrome*).
- **The owner's phone.** The Android APK goes only to the owner's phone
  (`apps/android/CLAUDE.md`, R8); the web is responsive (PRD W6).
- **Gaps in the filed tickets** that any order meets:
  - No ticket stores the town's lesson slot: #759 adds `towns` and the
    building levels, #764 the build slot and the waiting list, #768 is
    domain only, and #769's migration creates `earned_skills` and drops
    the fief's slot.
  - The web's review screen lives at `/feudo/$fiefId/repaso`; #769
    keeps that URL, ADR 040 names no other, and #751 deletes it.
  - ADR 038's step 4 needs `en.json` to hold every key, fixed copy
    included: the account screens, refusals, verdicts, hint lines and
    the mail, whose keys #739 moves into the catalog. #746 writes the
    mail's English but is blocked by #745, which runs the key check
    both ways, and no open ticket writes the rest.
  - The navigation the Report tickets require (#773, #775: *Town,
    Report, Map and News in that order*), and the deletions' context and
    visual checks (#751, #752: every medieval screen *has given way*;
    the town's News and map screenshotted), assume ADR 040's order.

## Decision

### What the MVP is

- **The MVP is the learning loop on one client**: name the town, see
  its four resources accrue, build, study a lesson at the school,
  answer its reviews from the Report, and earn a skill that raises a
  rate the next building is paid from. In PRD terms it is the M rows
  for the town, S1 (the school and skills), S3 through the Report's
  news, S5, S6, S8 and S9.
- **Web first, Android after.** The web is responsive and the owner can
  play it on the phone; the learning is the same on either client.
  Each client's screen ticket writes `packages/catalog`, so building
  both in step doubles the screen waves on the path to the first
  lesson. Android follows in the cutover track below, on contracts that
  no longer change.
- **In the MVP**: #759, #764, #765, #768, #769, #755, #758, #741, #762,
  #772, #770, #773, with the merges below, and #756 and #740 (gate
  check 6), which cost no wave where they sit.
- **After it**, in two tracks: the cutover track (the holdout's draw,
  band 1, the Android town, sign-up, the deletions and the cutover),
  then everything else on one holding.

### Merges that cut waves

Each merge joins two tickets whose work is one model or one screen, or
two waves of one; one migration per wave still holds.

| Kept | Absorbs | Why |
|---|---|---|
| #759 | #754 | Both are waves of one. The town's content keys its season percents by `fall`, so the rename is the town core's first step. The rename stays mechanical, checked by its `rg` criteria. |
| #764 | #760 | The first event writers are building work finished and stopped; the event union, its kind enum with every kind and `players.report_read_at` land with them in one migration. |
| #765 | #761 | One route module and one `TownOverview`: found, read, build and stop. |
| #762 | #766 | One screen: the town home's place card is the building card. Drawing it twice would redraw the home. |
| #763 | #767 | The same, on Android. |
| #751 | #752 | Both delete; both edit `packages/catalog`, so they could never share a wave. |

- **#768 stays in `packages/domain` alone**, so it shares wave 3 with
  #765. The rename of `requiredLibraryLevel` to `requiredSchoolLevel`
  moves to #769, which already moves lessons to the school. The rename
  is the lesson's field alone; the arts keep theirs until the cutover
  deletes them. Its readers on trunk are `learning/Lesson.ts`,
  `testing/lessonOne.ts`, the lesson member of `DomainError`, the fief's
  lesson gate in `Fief.ts`, `lesson-1.json`, `LessonContentSchema`
  (`packages/contracts/src/LessonContent.ts`), `JsonLessonCatalog.ts`,
  the content gate's test support and `learnerOverviewOf.ts`. #768
  changes no signature the api calls.
  The school's lesson slot is a domain value with its own port in #768;
  #769's migration adds its table and #769 its adapter, which closes
  the first gap above. If #768 cannot keep to the domain, it takes a
  wave of its own and the MVP is 9 waves.
- **Not merged**: #770 and #773 are two screens and two routes; #759
  and #764 are two domain models whose joint review would be the
  largest of the rebuild.

### The wave plan

Rows and models from `.claude/skills/wave/SKILL.md`, `max-100`. #758 is
generated by Codex from now (`ready-for-codex`) and #741 drafted from
now; both merge in wave 5, each on the owner's approval.

| Wave | Tickets | Blocked by |
|---|---|---|
| 1 | #759 (with #754), row 4, alone | #739 |
| 2 | #764 (with #760), row 4, alone | #759 |
| 3 | #765 (with #761), row 3; #768, row 2; #755, row 3 | #764; #764; #739 |
| 4 | #769, row 4, alone | #768, #765 |
| 5 | #758, Lore; #741, row 2 | #757 (closed); #769 |
| 6 | #762 (with #766), row 2; #772, row 3; #756, row 3 | #765, #769, #755, #758; #769, #764; #739 |
| 7 | #770, row 2: lessons start again; #740, row 2 | #769, #762; #738 (closed) |
| 8 | #773, row 2: the MVP is complete | #772, #770 |
| 9 | #744 (the draw), row 4, alone | #769 |
| 10 | #763 (with #767), row 2; #742, row 1 | #765, #769, #756, #758; #741, #744 |
| 11 | #771, row 2 | #769, #763 |
| 12 | #775, row 2 | #772, #771 |
| 13 | #793, row 4, alone | #762, #763 |
| 14 | #751 (with #752), row 2 | #773, #775, #793 |
| 15 | #753, row 4, alone: the cutover | #751 |

- **8 waves to the MVP** after #739. As filed, the school lands at
  wave 16 to 19 and the Report at 19 to 24. No lesson can start in
  waves 5 and 6, against 7 to 10 waves as filed.
- **15 waves to the cutover**, against 25 to 35.
- **After the cutover**, in this order: #745, then #746; the holdout's
  checks (the split below) before its deadline; Town News (#774, #776);
  the office (#777 to #780); the map and jobs (#781 to #784); clean-ups
  (#785 to #788); goals and tips (#789 to #792); placement (#743) once
  its bands are drafted. The same greedy schedule gives about 18 more
  waves, about 33 in all, against 39 for the filed order under the
  same rule: the total moves little; what moves is when the learner
  gets the loop.

### The cutover comes right after the Android town, not last

- **The cutover is not in the MVP**: it needs the Android town first,
  which would add 6 waves to the MVP.
- **It is no longer the last slice** (amending ADR 040, *How the code
  moves*). It follows the Android town, the Report on both clients and
  sign-up, and deletes the medieval chronicle, map, army, goals and
  hints with no town screen in their place yet. Town News, the office,
  the map, jobs, clean-ups and goals are then built on one holding.
- **The navigation grows with the screens.** From the MVP it reads
  Town and Report. News and Map join when #774 and #776, and #783 and
  #784, land, each in its place in ADR 040's final order: Town, Report,
  Map, News. Until the cutover the medieval entries that have no town
  successor yet, *Crónica* and *Mapa*, stay as ADR 040 has them.
- **The PRD is rewritten whole at the cutover.** ADR 035 and ADR 040
  have the M and S rows rewritten as each slice ships, which assumed the
  breadth would ship before the cutover. With the medieval code gone,
  S2 and S10 to S17 would describe nothing that runs, so #753 rewrites
  every M and S row for the town, cuts S18 to S20, and marks each row
  whose slice has not shipped *not yet shipped (ADR 041)*; the slice
  that ships it removes the mark. This amends ADR 035's *PRD* line.
- **Why now and not last.** #745 waits on the cutover (ADR 040, *The
  order*), and under `es` the chrome turns bilingual once every chrome
  lesson is studied. Kept last, the cutover would hold the learner on
  Spanish chrome for about 17 waves after that point. And every breadth
  ticket built before it pays for the coexistence: a navigation entry
  that gives way, a URL kept reachable, `./town` subpaths, and #790's
  rename of the medieval goal ids, which a deleted goal no longer needs.
- **What the owner loses**: the medieval map, army and chronicle at
  wave 15 instead of at the end. They teach no word, ADR 035 signed
  their reset, and cards, the review log and the skills survive (ADR
  040, *The reset*).
- **The no-shim rule of ADR 040 holds.** No merged or reordered ticket
  reads or writes both holdings; the cutover's tickets stay filed with
  their edges before any slice merges; deleting a medieval screen with
  no successor is a deletion, not a bridge. Between waves 3 and 4 the
  town's school reads `learning/` as #768's known gaps already say:
  `Lesson.requiredLibraryLevel`, and `LessonSkill` and `EarnedSkill` on
  the medieval `ResourceKind`. These are types the town reads, never a
  value it shares with the fief or translates, and #769 moves them, as
  ADR 040 filed it.
- **The review screens leave the fief's URL before the deletion.**
  #773 moves the web's review screen to `/reviews`, the path of its api
  route, opened from the Report; #775 opens Android's from the Report
  with no fief id. That closes the second gap above, and adds
  `/reviews` to ADR 040's list of web paths.

### The holdout and placement

- **The holdout's draw is a hard gate on band 1**, not on the MVP.
  ADR 037 draws at a band's start and never draws chrome words, so the
  chrome lessons need no draw. A draw made after band 1 has begun could
  not be random over the band: the words already carded could no
  longer be held out, and the draw would lean to the band's later
  ranks. So #742 is blocked by #744, and #744 runs at wave 9, the first
  wave after the MVP.
- **#744 is split.** #744 keeps the draw, its storage, the band's start,
  the card entry that skips a held-out word, the recognition choices
  without its gloss, the skill on the words the player holds and the
  api's random source (its first, second and fifth criteria). A new
  ticket takes the 8- and 24-week checks, their stored results and the release, with its
  own migration, due 8 weeks after the owner's band 1 start, when the
  first check falls due on read. A check taken late measures a longer
  delay than ADR 037's, which the analysis would have to carry.
- **Placement waits** until band 1's lessons are drafted, since its
  sample needs the band's lexicon entries (#743's known gaps), and runs
  after the cutover. **This is a judgment call, not a proof.** It rests
  on the bar: a band passes at 29 of 30, which an A1–A2 learner is
  unlikely to meet on band 1, and a player who fails band 1 starts
  where a skipping player does. If the owner knows more of band 1 than
  that, the owner studies lessons that placement would have placed out.
  When it ships, it is offered once, to an account that has not started
  band 1's first lesson, and never after, since a started band holds a
  draw that a placed-out band must never have (ADR 037). The owner will
  have started band 1 by then, so the owner is never offered
  placement.

### Deadlines the order must meet

- **The holdout's draw before band 1** (wave 9 before #742 merges): a
  miss is lost data, never recoverable.
- **#745 before the 16th chrome lesson is studied.** A miss loses no
  data, since the phase is derived on read from what was studied and
  earned (ADR 038), but every day late is a day of Spanish chrome the
  learner should read in both languages.
- **The holdout's checks** 8 weeks after band 1 starts.
- **#745 carries the English of every fixed-copy key, the mail's
  included**, so its key check can run both ways; this closes the third
  gap above. #746 keeps sending each mail in the player's scaffold and
  rewording the Spanish mail in the town's words; the English it would
  have written is already in `en.json`.

## Considered options

- **The order as filed** (ADR 040). The full town on both clients
  before the economy's breadth, the cutover last. Rejected: the school
  lands at wave 16 to 19 and no lesson starts for 7 to 10 waves.
- **Both clients in the MVP.** Each Android screen is one more wave on
  the path, since it writes the catalog. Rejected: the web serves the
  learner on the phone, and Android lands 4 waves later on settled
  contracts.
- **The cutover inside the MVP.** It needs the Android town first.
  Rejected for 6 more waves before the MVP is complete.
- **The cutover last.** Rejected: #745 would wait about 17 waves past
  the point the chrome should turn bilingual, and every breadth ticket
  would carry the coexistence.
- **An Android client of reviews alone after the cutover**, its fief
  home deleted with no town home. Rejected: the owner's phone would
  lose its home for a 3-wave saving.
- **The town home without the place images** (#762 not blocked by
  #758). One wave less, and a second pass over the home when the images
  land. Rejected: the rework costs the wave it saves.
- **#759 and #764 merged as well.** One wave less; the two largest
  domain models of the rebuild in one review. Rejected.
- **#770 and #773 merged.** One wave less; two screens and two routes in
  one review. Rejected.
- **The catalog's JSON outside the package rule**, so a web and an
  Android screen could share a wave. The wave rules are the owner's to
  change, never an ADR's. Not taken; it would shorten the cutover
  track, not the MVP.
- **Band 1 in the MVP.** The 16 chrome lessons occupy an A1–A2 learner
  for weeks under the learning cap. Rejected: band 1 waits for the
  draw.
- **The holdout whole after the MVP, drawn late.** Rejected: a late
  draw cannot be random over a begun band.
- **The holdout whole before band 1.** It holds band 1 for the checks
  and the release, which fall due 8 and 24 weeks later. Rejected for the
  split.
- **Placement in the MVP.** Rejected: its sample needs the bands'
  lexicon, and at 29 of 30 it is unlikely to move an A1–A2 learner.
- **The both-way key check moved from #745 to #746**, so #746 writes the
  mail's English. Rejected: #745's Android `values/` turns English in
  the same step and the key check is one test; splitting it would run
  it one way for a ticket.
- **No Report in the MVP**, the reviews opened from the school.
  Rejected: the Report is the daily door to the reviews (ADR 035), and
  the review screen would stay on a fief URL.

## Consequences

- ADR 040's order is amended: the cutover follows the Android town and
  sign-up and precedes Town News, the office, the map, jobs, clean-ups
  and goals; Crónica, Mapa, the army, the goals and the hints are
  deleted with no town screen in their place, which amends *each
  medieval screen gives way to the town screen that replaces it* for
  those five. ADR 040 marks each amended passage inline. The rest of
  ADR 040 stands.
- The issue edits below are made once the owner approves this ADR,
  never before.
- After the cutover the medieval modules a breadth ticket names as its
  model exist only in history; each such ticket reads them at the
  cutover's parent commit.
- Until the cutover the PRD's rows are rewritten as each slice ships
  (ADR 040); the cutover rewrites the rest, marked as not yet shipped.

### The issue edits

Merged tickets are closed as not planned with a comment naming the
ticket that absorbs them; the absorbing ticket takes their criteria,
pointers and verification rows.

- **#754** into **#759**; #759 blocked by #739 instead of #754.
- **#760** into **#764**; the merged ticket ships one migration (the
  slot, the waiting list, the town's events table with every kind and
  `players.report_read_at`); #764 blocked by #759; #772 blocked by #764
  instead of #760.
- **#761** into **#765**; #765 blocked by #764 alone; #762 and #763
  blocked by #765 instead of #761.
- **#766** into **#762**; #779 blocked by #762 instead of #766.
- **#767** into **#763**; #780 blocked by #763 instead of #767.
- **#752** into **#751**; #751 covers both clients, blocked by #773,
  #775 and #793 alone (the edges to #774, #776, #783, #784, #787, #788,
  #791 and #792 go); #753 blocked by #751 alone. Its context says the
  medieval screens with a town successor have given way and the
  chronicle, map, army, goals and hints are deleted with none; its
  visual checks, web and emulator, cover the town home, the school and
  the Report, never News or the map.
- **#753**: its context calls it the cutover after the Android town
  and sign-up, no longer *the last slice*. Its PRD criterion reads:
  every M and S row describes the town, S18 to S20 are cut, and each
  row whose slice has not shipped is marked *not yet shipped (ADR
  041)*; its `rg` check stays. Its `CLAUDE.md` step rewrites the *Until
  the town rebuild ships* paragraph instead of dropping it: the code is
  the town, and the PRD marks what has not shipped.
- **Every ticket after the cutover whose PRD row #753 marked** (#774,
  #776, #777 to #792, #743, and the new holdout-checks ticket where a
  row covers it) gains: *rewrites its PRD row by id and removes the
  not yet shipped mark*.
- **#768**: dispatch `packages/domain` only; the rename criterion moves
  to #769; the lesson slot is a domain value behind its own port.
- **#769**: gains the rename of the lesson's `requiredLibraryLevel` to
  `requiredSchoolLevel` in every reader listed under *Merges*, with
  `rg -n "requiredLibraryLevel" packages/domain/src/learning
  packages/domain/src/testing packages/contracts/src/LessonContent.ts
  apps/api/content/lessons apps/api/src/learning
  apps/api/src/adapters/json/JsonLessonCatalog.ts` returning nothing
  (the arts keep theirs). On the wire the rename reaches the lessons'
  schema, `LessonStateSchema` (`packages/contracts/src/FiefOverview.ts`,
  which #769 moves to the town's overview), `apps/api/openapi.json`,
  the web's lesson and review tests and their stub
  (`fiefLessonRoute.test.tsx`, `reviewRoute.test.tsx`,
  `stubApiClient.testSupport.ts`) and Android's
  `LearningRepositoryTest.kt`. #769 also gains the town's lesson slot
  table and adapter in its migration.
- **#744**: blocked by #769 instead of #742; keeps the draw. **A new
  ticket**, *Holdout: the band checks at 8 and 24 weeks and the
  release*, row 4, a wave of one, `ready-for-agent`, takes the rest and
  is blocked by #744 and #753. **#742** gains *blocked by #744*.
- **#743**: gains *blocked by #753* and the rule that placement is
  offered once to an account that has not started band 1's first
  lesson.
- **#745**: gains the English of every fixed-copy key, the mail's
  included. **#746**: its criterion *`en.json` holds every mail key*
  reads that #745 wrote it; #746 sends each mail in the scaffold and
  rewords the Spanish mail in the town's words. The stale lines go with
  it: #745's known gap reads that the town rebuild and #745 itself
  write `en.json`'s keys, not *the town rebuild (#754 to #793)* alone;
  #745's dispatch line names `packages/catalog` and `apps/android`,
  whose `values/` it turns English; #746's known gap reads that it
  writes the mail in the town's words in Spanish, #745 having written
  the English.
- **#740**: placed in wave 7; no edge changes.
- **#773** and **#775**: their navigation criterion reads *Town, Report*
  in that order; #773 gains the web review screen's move to
  `/reviews`, opened from the Report, and #775 Android's review screen
  opened from the Report with no fief id.
- **#774** and **#776**: blocked by #753 and #772 instead of #762 or
  #763; their *Crónica leaves the navigation* criteria go, and each
  gains *News joins the navigation in ADR 040's order: Town, Report,
  Map, News*.
- **#777**: blocked by #753 instead of #769.
- **#783** and **#784**: their *Mapa leaves the navigation* and
  *`/feudo/$fiefId/mapa` stays reachable* criteria go, and each gains
  *Map joins the navigation in ADR 040's order*; #784's town map module
  may take the name `feature:map`.
- **The Android screen tickets** #763, #771, #775, #776, #780, #784,
  #788 and #792: their dispatch line names `packages/catalog` beside
  `apps/android`, as their criteria already require.
- **#790**: the renaming of `Goal`, `PendingGoal` and `UnderwayGoal`
  goes, and with it the web and Android readers; contracts and api
  only, no longer a wave of its own.
- **Every ticket after the cutover** that names a medieval file as its
  model names it at the cutover's parent commit.
- Labels: every kept ticket stays `ready-for-agent`, #758 stays
  `ready-for-codex`.

## References

- ADR 035, 036, 037, 038, 039, 040.
- `.claude/skills/wave/SKILL.md`, `docs/agents/multi-session.md`.
- `docs/PRODUCT_REQUIREMENTS.md`: M1–M8, S1, S3, S5, S6, S8, S9.
- Issues #739, #741–#746, #751–#793; PR #749 (ADR 040's slice table).
