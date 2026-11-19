---
status: accepted, the words a town holds, a player who lapses and the decision together amended by ADR 048
date: 2026-11-16
---
# Stable words open the town

## Context

ADR 042 found that learning is not felt in the game: a skill's percent
never brings a level sooner, and the town grows on a flat 20 money per
hour (#850). The owner's goal for this decision: learning American
English comes first, and the words a player retains must visibly move
the game; the owner wants to use English, phrases and phrasal verbs
included (ADR 044); and a new player must always know where to go next.

What trunk holds, checked at `5214dc7d`:

- **Money is the only stock that binds.** Tax is the only money source,
  20 per hour (`town.json`); no building makes money. Every building
  level costs money, and only the homes cost food (ADR 042).
- **A skill raises one resource by 5 %, by a cycle.** `curriculum.json`
  holds `skill: { cycle: [food, material, power, money], ratePercent: 5 }`,
  so lesson *n* raises `cycle[(n − 1) mod 4]` and the money skill comes
  at lessons 4, 8, 12… (ADR 039). `deriveResourceRates` sums one
  resource's percents into one factor.
- **A skill lands late.** Rule 7 of ADR 036, which the owner kept on
  2026-11-05, earns a level only with an unaided recall 7 days after the
  review before it: on day 13 for a learner on time, day 7 at the
  earliest (ADR 042). *The stability is the floor; the `retainedAt` is
  the proof* (ADR 036): `isWordRetained` asks for both.
- **A word turns stable on day 2.** A lesson's word is recognized at
  its finish and 10 minutes later (stability 2.3065), then recalled at
  its first due instant, 2 days and 10 minutes after the lesson, which
  takes it to 10.971 (`reviewMemoryCard`, `dueInstantOf`). From
  stability 7 the card is no longer *in learning* (`cardsInLearningOf`),
  so the learning cap frees and the school path shows it at `hold`
  (`wordStandingOf`). That is the floor alone, one Good answer; the
  proof comes at the next recall, from day 13, when the path shows it
  `retained`. Stability moves only at a review, and a card is reviewed
  only when due (ADR 036), so absence never lowers it and an early
  review cannot raise it.
- **The shipped words.** Lessons 1 to 27 hold 135 card words and
  units: the 16 chrome lessons hold 80 words, which the holdout never
  draws (ADR 037), lessons 17 to 26 hold 50 band 1 words in 10 lessons,
  and lesson 27 is a unit lesson of 5 units. Lessons 28 to 47 merged on
  2026-11-18 (#1285, ADR 049) and add 100 entries, 80 of them band 1
  words: `curriculum.json` lists 47 lessons and band 1 holds 130 words
  on trunk. The counts below are those of lessons 1 to 27, the content
  this decision was written against. Band 1's draw holds out 87 words, a tenth of its 875 non-chrome words
  (`bandStartDrawn`, `JsonLessonCatalog.wordsOfBand`), so no count of
  band 1 words is certain to reach a card today. Every shipped lesson
  asks for school level 1.
- **What the skills save.** The runs below, on trunk's content, find that
  the food, material and power skills save 0 hours at every level of a
  balanced run and of a homes-only run over 90 days, and the money
  skills alone save what all of them save (*Worked examples*).

## Decision

### The words a town holds

- A **stable word** is a card of the player whose stability is 7 days
  or more: a card not in learning, at `hold` or `retained` on the school
  path. The count is `cards.length − cardsInLearningOf(cards)`.
  (Amended by ADR 048: in learning is under 4 days, so a stable word
  is counted on its own, the cards at `SKILL_STABILITY_DAYS` or more
  (`stableWordCountOf`), and a card from 4 to under 7 days is
  neither in learning nor stable.)
- A **retained word** is a stable word whose recall 7 days after the
  review before it proved it: `isWordRetained`, the school path's
  `retained`, the proof rule 7 earns a skill with.

Both are derived on read from the cards, with no column. A unit is a
card and counts like a word (ADR 044). A held-out word has no card and
never counts; a placed-out word counts only once studied, as a
placed-out lesson earns a skill only once studied (ADR 039). A lapse
takes a word out of both counts, as it moves the word back on the school
path (ADR 042); a day away never does.

### Words open building levels from 3

- **Level *L* of any building, from 3 up, needs 10 × (*L* − 2) words**:
  stable words for levels 3 to 6 (10, 20, 30, 40), retained words for
  levels 7 to 10 (50, 60, 70, 80). Levels 1 and 2 need none, so a new
  town builds in the first session as ADR 042 has it. The first recalls,
  on day 2, open level 3; the first proofs, from day 13, open level 7.
- **Why the split.** The floor gives the first days their moment: a
  retained-only need opens nothing before day 13, the day a skill lands
  anyway. The proof closes what the floor leaves open: under a
  stable-only need, a stable word can only leave the count at a review,
  so the need rewards skipping reviews, and a player who stops reviewing
  a word once it is stable still builds homes 10. Under the split that
  player stops at level 6.
- **A need is checked, never spent.** Starting building work, in the slot
  or on the waiting list, checks the town's words against the level's
  need, as it checks people; short, it is refused
  `NotEnoughWords { needed, held, standing }`, `standing` being `stable`
  or `retained`, and nothing is charged. A level built or queued stays
  whatever the count does later. Words are capability, never currency
  (ADR 035).
- **The curve is content, written once.** `town.json` gains
  `wordNeed: { fromLevel: 3, perLevel: 10, retainedFromLevel: 7 }`; the
  domain derives each level's need and standing from it, as ADR 039
  derives a lesson's skill from one curve. Moving it is a content
  change, with no migration.
- **The top need never passes the words no draw can hold out.** The
  content gate gains **check 11**. A lesson's words count toward a need
  only if a school reaches the lesson's `requiredSchoolLevel` without
  them: for every school level *s*, the words of the lessons a school at
  *s* admits must cover the need of school level *s* + 1, and at the top
  school level the need of level 10. A lesson's words are the chrome
  lessons' card words, plus, per band, the band's shipped card words
  beyond the count its draw holds out. Today every lesson asks for
  school level 1, so every need counts 80 + max(0, 50 − 87) = 80,
  level 10's need (80 + (130 − 87) = 123 with lessons 28 to 47). No holdout draw, no placement and no unshipped lesson
  can leave a town short of a level: any 80 retained cards open level
  10, and the chrome words, which every player studies, are the
  guaranteed floor. A later band that ships past its draw lets a later
  ADR raise the curve.

### Every lesson's skill raises money

- **The skill raises money, at every lesson.** `curriculum.json`'s skill
  becomes `{ resource: money, ratePercent: 5 }`; the cycle goes. Each
  lesson retained adds 5 % of the tax, 1 money per hour, so the 27
  shipped lessons take it from 20 to 47 per hour (`deriveResourceRates`).
  This amends ADR 039's rules 2, 3 and 6 and its check 10, and ADR 036's
  rule 7, where lesson 1 earns food.
- **Why money alone.** The runs find that a food, material or power
  level saves 0 hours anywhere, with or without the money levels beside
  it, because money sets when every level is paid. Keeping a percent
  where it moves no timeline is a promise the town does not keep.
- **An earned level keeps what it stored** (ADR 039, rule 5): a food
  level already earned stays food. The chrome phase reads earned skills
  by lesson, not by resource, so it does not move (ADR 038).
- **Rule 7 stands.** The skill stays a proof of memory a week after the
  review before it, and so do levels 7 to 10.

### What the player sees

The server answers every number below (N1); no client derives a need.

- **The town home** shows the stable and the retained words, and each
  place card its next level's need beside its cost and people: *Needs
  30 words*, with the standing the school path already names, and the
  count toward it. `TownOverview` gains `stableWordCount` and
  `retainedWordCount`, named apart from `learning.retainedWords`, and
  each building's `nextLevel` its `wordsNeeded`, `{ count, standing }`,
  or null when the level needs no words or the town's words meet it.
- **The review verdict** of an answer that makes a word stable or
  retained says what it opened. `ReviewVerdict` gains `stableWordCount`,
  `retainedWordCount` and `openedLevel`, the highest level whose need the
  counts before the answer missed and the counts after meet, or null.
  The day-2 recall that holds the 10th word says only *You have the
  words for level 3 now.* (*Ya tienes las palabras para el nivel 3.*),
  not that the level is open: the review is where the town grows.
- **The refusal** names the need, the count and the standing, so a
  blocked place card stays focusable and says why (PRD S22).
- **The next step keeps its order** (ADR 042, amended 2026-11-13). Words
  turn stable and retained at a due review, so `reviews` already leads,
  and `lessonToStudy` and `caughtUp`'s next review instant say where the
  next words come from. `lessonRunning`'s `producer`, keyed to the
  lesson's skill resource, always reads none once every skill is money,
  so it goes, and `lessonRunning` carries the next building goal as
  `caughtUp` does, which keeps a building pointer during the first
  lesson.
- **Copy.** Each new line passes check 9 in its ticket; *need*, *word*,
  *level* and *build* are chrome words (`docs/setting/chrome.md`).

### Existing towns

Content and code, no migration. A town keeps its levels, its queued work
and its earned skills; its next raise from level 3 checks the need. Work
already charged was admitted and runs on.

## Worked examples

Every figure is reproduced by `docs/adr/045-stable-words-open-the-town.test.ts`,
run with `pnpm --filter @mygame/api exec vitest run --root ../..
--testTimeout=900000 docs/adr/045-stable-words-open-the-town.test.ts`
(46 tests). It is a snapshot of trunk at `5214dc7d`: the content and the
domain's `deriveResourceRates`, `deriveStorageCapacity`, `derivePeople`,
`deriveLessonDurationSeconds`, `reviewMemoryCard`, `dueInstantOf`,
`cardsInLearningOf` and `isWordRetained` are trunk's, but admission,
charging, the queue, accrual and skill-earning are copies written in the
test, and no holdout is applied. It sits outside every package's
`include`, so `pnpm gate` lints it and never runs it; a later change to
the domain or the content does not fail it.

The runs go in one-minute steps over 90 days on fields, before the
season calendar's epoch, so every season percent reads 100. Every
answer is Good, but in the run with lapses below. The learner starts the next lesson in curriculum order
whenever the school's slot and cap allow, and earns a lesson's skill at
the review that retains its last word. Stocks are not floored, so the
game pays minutes later; no hire, job or clean-up runs. Day 0 is the
founding.

- **Players.** *On time* plays every minute; *daily* plays one 30-minute
  session a day, 12 hours after the founding; *every third day* one such
  session every 72 hours; *never studies* builds every minute and starts
  no lesson. A session player queues work up to the waiting list's cap.
- **Runs.** *Homes-only* builds farm 1, factory 1, then the homes, with
  homes, storage or a power station first when people, capacity or power
  require one. *Balanced* builds the cheapest next level of any building
  whose need the count meets, with the same prerequisites.
- Each figure is the day the level finishes, to a tenth.

**What the skills save on trunk** (no need), balanced run, on time, the
day every building holds level *L*:

| Skills | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|
| The cycle (trunk) | 6.6 | 11.9 | 19.5 | 28.8 | 42.5 | 63.1 | 89.4 | – |
| None | 6.6 | 11.9 | 19.8 | 31.7 | 49.5 | 76.3 | – | – |
| The cycle's money levels alone | 6.6 | 11.9 | 19.5 | 28.8 | 42.5 | 63.1 | 89.4 | – |
| The cycle without money | 6.6 | 11.9 | 19.8 | 31.7 | 49.5 | 76.3 | – | – |
| Every lesson on money | 6.6 | 11.9 | 18.2 | 24.4 | 32.0 | 43.4 | 57.9 | 70.0 |

On the homes-only run the homes are paid on the same days with the cycle
or with no skill, level 10 on day 14.5, and on day 14.3 with every lesson
on money. Skills land on days 13 (lesson 1), 15 (4), 17 (8), 19.7 (16)
and 23.1 (24). The food, material and power levels save nothing on top
of every lesson's money level either: a run with both pays every level
on the days of money alone.

**The words** of a learner on time at school level 1, homes-only: 0
stable on day 2, 15 on day 2.1, then 15 more every 2 days, 120 on day
16.1. The learning cap of 15 lets three lessons in at once, and their
words leave learning together at the recall. The retained words follow
11 days behind: 15 on day 13.1, 30 on day 15.1, and so on.

**The decision**, the split need and every lesson on money:

| Run, player | Homes 2 to 10, or every building at 2 to 9 | Refused for words |
|---|---|---|
| Homes-only, on time | 0, 2, 4, 4, 6, 19.1, 21.1, 24.2, 29 | homes 3 to 7, from days 0, 2, 4, 4.4, 6.8 |
| Homes-only, daily | 0.5, 2.5, 5.5, 5.5, 7.5, 21.5, 24.5, 27.6, 31.6 | homes 3 to 7, from days 0.5, 2.5, 5.5, 6.5, 8.5 |
| Homes-only, every third day | 0.5, 3.5, 6.5, 6.5, 9.5, 24.5, 30.5, 33.6, 36.6 | homes 3, 4 and 7, from days 0.5, 3.5 and 12.5 |
| Balanced, on time | 6.6, 11.9, 18.1, 24.2, 31.8, 43.2, 57.7, 69.9 | farm 3, 4 and 7, from days 0.5, 2.7 and 15.5 |
| Balanced, daily | 2.5, 12.5, 18.5, 25.5, 33.5, 44.6, 59.6, 71.7 | farm 3, 4 and 7, from days 1.5, 3.5 and 16.5 |
| Balanced, every third day | 9.5, 15.5, 21.5, 30.5, 36.6, 48.6, 63.6, 75.7 | farm 7, from day 18.5 |
| Either, never studies | every building at level 2, and no level above it | every level from 3 |

On trunk the balanced daily player holds every building at 2 to 7 on
days 7.5, 12.5, 20.5, 29.5, 43.5 and 63.6, and the every-third-day
player on days 9.5, 15.5, 21.5, 33.5, 45.6 and 66.6, neither reaching 8
in 90 days.

What this shows, and does not:

- **A town that does not learn stops at level 2.** That is the decision's
  floor: the English is how the town grows.
- **On a homes-only run the need binds every level up to homes 7** for a
  learner on time: homes 3 to 6 open at the recalls of days 2, 4 and 6,
  and homes 7 waits for the first proofs, to day 19.1, against 8.1 under
  a stable-only need.
- **On a balanced run, money binds almost everywhere.** A learner on
  time waits on words three times, twice by day 4 and once on day 15.5;
  a player who reviews every third day once. For the learner on time
  the days match a stable-only need's to the tenth.
- **The need stops binding once the words are held.** A learner on time
  holds the 80 retained words of level 10 on day 19 balanced and day
  23.1 homes-only; from then on only money sets a timeline. A
  stable-only need stops on day 8 balanced and day 12.1 homes-only.
- **The money skills move the late levels**, not the need: every
  building at 8 on day 57.7 against 89.4 on trunk, and on day 57.9 with
  every lesson on money and no need at all.
- **These are floors.** The runs buy the moment stocks allow; a slower
  player still has levels to pay when the words and the skills land.

**A player who lapses.** The same runs, but 3 typed recalls in every
10 are wrong (Again), the 1st, 2nd and 10th of each ten the player
answers; a recognition is always right.

- **Balanced, on time**: every building at 2 to 8 on days 6.1, 11.9,
  18.4, 23.5, 26.4, 66.9 and 88.1, ending at levels 10, 10, 10, 10, 9,
  9 and 8 on day 90. The 80 retained words are first held on day 48.9,
  and from day 60 to 90 the count moves between 83 and 95. Played once
  a day: 80 on day 45.5, then 92 to 100.
- **Homes-only, on time**: homes 2 to 6 on days 0, 2, 6, 27 and 31.1, and
  no homes 7 in 90 days. That run never raises the school, so its
  learning cap of 15 fills with relearning cards, the player holds
  only 60 cards, and the retained count stays between 36 and 46 from
  day 60 to 90, under homes 7's 50.
- **Such a player is never stuck.** A level built stays built whatever
  the count does; levels 1 and 2 need nothing; levels 3 to 6 need
  stable words only, so the school can be raised to 6 on them, and
  each school level lifts the learning cap by 5 (15 at level 1, 60 at
  10, `school.json`), which lets new lessons in. A lapsed word comes back to the count at its later
  recalls. What a lapse costs is time, never a level. (Amended by
  ADR 048: a lapsed word frees its slot of the cap at 4 days, so the
  cap fills with relearning cards only while lapses keep coming; the
  way out through the school needs 10 stable words at school level 3,
  which a learner who lapses most of a first session does not hold.)

## Considered options

Each is weighed on the first 15 days, on retention (ADR 036), on N1 and
lazy evaluation (ADR 005), and on ADR 041's deadlines. Of these, two are
met on trunk (the holdout draw before band 1, #744 and #742; #745 before
the 16th chrome lesson), and one is live: the holdout's checks 8 and 24
weeks after a band's start, shipped (#804, #1056) and due on read.

- **Stable words alone** for every level from 3. *First 15 days*: as the
  decision to homes 6, then homes 7 on day 8.1 and homes 10 on day 18
  on time, homes-only; the balanced days are the decision's. *Retention*:
  a stable word leaves the count only at a review, so the need rewards
  skipping reviews: a player who stops reviewing a word once it is
  stable builds homes 10 on day 18.6, against 18. It counts the floor
  alone, one Good answer, where ADR 036 asks for the proof. *N1,
  deadline*: as the decision. Rejected for the split.
- **Retained words alone** for every level from 3. *First 15 days*:
  nothing opens before day 13: homes 3 on day 13 on time, homes-only,
  and every building at 3 on day 13.1 balanced, against 2 and 11.9; the
  day-2 recall moves nothing, the same late landing as rule 7's skill.
  *Retention*: the strongest, every level is proved. *N1, deadline*: as
  the decision. Rejected: the first fortnight is where a new player
  learns the review moves the town.
- **Retained words as a resource the town spends** (the dispatch's
  proposal). *First 15 days*: the same day-2 start as the need, then a
  stall: raising all seven buildings to level 3 would spend 70 words and
  to level 4 210, against 135 shipped. *Retention*: a spent word is still
  known, so the count stops saying what the player knows, and a player
  is pushed to study for spendable words rather than to keep them.
  *N1*: a ledger of spent words, a column and a write per level.
  *Deadline*: none moved, but a held-out word is a coin the player can
  never earn, which makes the withheld 10 % a visible cost. It breaks ADR
  035's *retention earns skills, never currency*. Rejected; the need
  keeps its timing without the spend.
- **Each place needs the words of its domain** (the farm, food words).
  *First 15 days*: split by the four resources, a learner on time on the
  homes-only run holds 10 stable words per pool on days 4, 4 and 6 for
  food, material and power, 20 on day 10.1 and 30 on days 14.1 to 16.1,
  against days 2, 4 and 4 for one town-wide count; the homes, the
  storage, the school and the office belong to no pool. There is no
  market (PRD W3), and ADR 039 rejected tying a theme to a resource: a
  theme is free text no check can read, most themes name no resource,
  and the pools would end unbalanced by accident. The 80 chrome words
  give each pool 20, short of level 5's 30. *Deadline*: a draw could
  hold out a pool's words, which the chrome bound avoids. Rejected for
  one town-wide count.
- **Money per hour for each stable word** (0.2 per word, no need).
  *First 15 days*: the strongest: every building at 3 on day 9 and at 4
  on day 12.9, against 11.9 and 19.5 on trunk; homes 10 on day 13.1.
  *Retention*: a wrong recall cuts income, so a lapse is a fine, which
  pushes a player to look an answer up and spoils the review log that
  measures learning. *N1*: every review that crosses stability 7 changes
  a rate, so it must accrue and rebase the town in its transaction, as a
  skill does today, on many more reviews. *Deadline*: a held-out word
  never pays, so the holdout costs the player money. It also inflates
  with content: band 1 whole is 877 card words (ADR 039), 175 per hour
  at 0.2, and the economy would be resized at every content batch. It
  amends ADR 039's *nothing else earns*. Rejected.
- **Every lesson on money, no need.** *First 15 days*: nothing moves
  before day 13 (6.6 and 11.9, as trunk). *Retention, N1, deadline*: no
  change. Taken as the decision's second half: alone, a town that never
  studies grows as fast as today until day 13.
- **The need with the cycle kept.** *First 15 days*: as the need; then
  nothing moves, as on trunk (every building at 8 on day 89.3 under a
  stable-only need). Rejected: three skills in four keep saving nothing.
- **Relax rule 7**, so a skill lands at the day-2 recall. The owner kept
  rule 7 on 2026-11-05, knowing its timing (ADR 042). Not reopened; the
  need gives day 2 its moment without touching what a skill proves.
- **A larger percent per skill.** It lands on day 13 at the earliest
  whatever the percent, and on food, material or power it moves nothing
  at any percent while money binds. Rejected.

**The decision, together.** *First 15 days*: the need binds from the
first hour and opens at the day-2, day-4 and day-6 recalls; the first
proofs open level 7 from day 13, and every lesson retained from day 13
adds 1 money per hour. *Retention*: the need counts stability and the
proof, which only a due review moves, so it cannot be crammed and
absence never costs (ADR 035); the learning cap and the stable count
read one boundary, so the recall that frees the cap opens a level
(amended by ADR 048: the cap reads 4 days and the stable count 7, so
this holds for a word that is never wrong; a lapsed word frees the cap
before it counts toward a level). A
lapse removes a word from the count, never a level. The pull to skip
reviews that a stable count makes stops at level 6: past it every word
needs the week-later recall a skipped review never gives. It is not
gone: once a word is retained and its lesson's skill earned, reviewing
it has no upside in the town, and a wrong answer or a Hard can only
take it out of the count, since `retainedAtOf` clears `retainedAt` at
any rating but Good. A hint turns a right answer into a Hard
(`ratingOf`), as a near-miss does, so on a word counted toward levels
7 to 10 a hint costs town progress, and the need pulls a player to
answer unaided or skip. The decision has no answer for that beyond the
next step, which always leads with due reviews (ADR 042). *N1*: derived on read from
the stored cards and checked by the server at the work's start; no
timer, no new stored state. *Deadline*: none moved; the need tops out
at the chrome words, which no draw touches, so the holdout can never
block a level, and practised words, the comparison's treated half, are
the only ones it rewards.

## Consequences

- `packages/domain`: the stable and the retained counts beside
  `cardsInLearningOf` and `isWordRetained`; each level's need and
  standing from the town's settings; `startBuildingWork` takes the
  player's cards (`CardRepository`) and refuses `NotEnoughWords`, a new
  `DomainError` member; `TownSettings` gains the curve; `nextStepOf`'s
  `lessonRunning` loses `producer` and carries the building goal.
- `packages/contracts`: `TownContentSchema` gains `wordNeed`;
  `CurriculumContentSchema`'s skill becomes `{ resource, ratePercent }`;
  `TownOverview` gains `stableWordCount`, `retainedWordCount` and
  `nextLevel.wordsNeeded`; `ReviewVerdict` gains `stableWordCount`,
  `retainedWordCount` and `openedLevel`; `ApiError` gains `NotEnoughWords`
  with its params; `NextStep`'s `lessonRunning` loses `producer` and
  gains `goal`. The OpenAPI client is regenerated, so the Android row of
  `.claude/rules/verification.md` is owed.
- `apps/api`: `town.json` gains the curve and `curriculum.json` the money
  skill; `POST /town/work` reads the cards inside `mutateTown`;
  `answerRefusal` maps the new kind to 409 with its params; the content
  gate's check 10 (`checkSkill`) reads one resource, and check 11 is new;
  `JsonLessonCatalog` gives every lesson the one skill, and its tests
  that pin the cycle's positions change with it.
- Clients, Android first (the owner's order): the counts on the town
  home, the need on each place card, the refusal line, the verdict's
  opened level. The web follows as its own tickets.
- No migration: the counts are derived, the curve and the skill are
  content, and every stored skill keeps its resource.
- A balanced learner on time feels no timeline move from day 4 to day
  13; closing that gap needs a rate a review pays, rejected above.
- A band that ships past its draw is the moment to revisit the curve:
  until then level 10 is 80 retained words, the chrome words its floor.
- Amended, each passage marked inline: ADR 036 (rule 7's food skill),
  ADR 039 (rules 2, 3 and 6, check 10), ADR 042 (*What the skill is
  worth*, the next step's producer). `CONTEXT.md`: **Stable word** and
  **Retained word** new, **Skill** and **Building** changed, **Skill
  cycle** marked to go with its ticket. PRD M4, M5 and S1, by row id.
- No ticket is written until the owner signs off on this ADR (#850).

## References

- Issue #850; ADR 005, ADR 035, ADR 036 (rule 7), ADR 037 (the
  holdout, the chrome lessons, the content gate), ADR 038, ADR 039, ADR
  041 (*Deadlines the order must meet*), ADR 042, ADR 044.
- `packages/domain/src/town/deriveResourceRates.ts`,
  `startBuildingWork.ts`, `admitSchoolLesson.ts`, `nextStepOf.ts`,
  `derivePeople.ts`; `packages/domain/src/learning/cardsInLearningOf.ts`,
  `wordStandingOf.ts`, `isWordRetained.ts`, `bandStartDrawn.ts`;
  `packages/domain/src/memory/reviewMemoryCard.ts`, `dueInstantOf.ts`;
  `apps/api/content/town/`, `apps/api/content/lessons/curriculum.json`;
  `docs/setting/chrome.md`.
- PRD M4, M5, S1, S22, W3, N1.
