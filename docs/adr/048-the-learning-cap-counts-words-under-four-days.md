---
status: accepted
date: 2026-11-18
---
# The learning cap counts words under 4 days

## Context

An audit on 2026-11-18 followed the owner's report, playing as a
learner: the school refuses new lessons and the reviews bring back *the
same words*. ADR 045 already accepts that *the learning cap of 15 fills
with relearning cards* and that *what a lapse costs is time, never a
level*. This ADR decides whether a lapsed word should hold a slot of the
learning cap for as long as it does.

What trunk holds, checked at `8d895101`:

- **In learning is stability under 7 days.** `cardsInLearningOf` counts
  the cards whose stability is null or under `SKILL_STABILITY_DAYS`, 7.
  `admitSchoolLesson` refuses `LearningCapReached` when that count plus
  the lesson's entering words passes the school level's `learningCap`:
  15 at level 1, 5 more per level, 60 at level 10 (`school.json`). At
  level 1 three lessons of 5 fill the cap, and a fourth starts once 5 of
  the 15 words hold a stability of 7 or more.
- **One line, five readers.** The same 7 days is the cap's line, the
  stable word a building level needs (ADR 045), the floor of a skill
  (ADR 036, rule 7), the point where a gloss fades (ADR 038,
  `ON_TAP_STABILITY_DAYS`) and the school path's `hold`
  (`wordStandingOf`). ADR 040 picked it for the cap by that kinship:
  *the point where its gloss fades (ADR 038) and the floor a skill
  needs (ADR 036)*.
- **What the cap is for.** It *bounds the review load a week later*
  (ADR 040); `decisions.md` 1.5 gives the reason as *design reasoning,
  no study*, against *unbounded new words per day*. Neither the cap nor
  its 7 days rests on a study of learners.
- **A word's two paths**, a learner on time, days counted from the
  lesson's finish (`reviewMemoryCard`, `dueInstantOf`,
  `defaultMemoryTerms`: learning steps 60 s and 600 s, one relearning
  step of 600 s, desired retention 0.9):

  | Review | Right every time | Wrong at the first typed recall |
  |---|---|---|
  | day 0, two recognitions | 2.3065, due day 2 | 2.3065, due day 2 |
  | day 2, recall | Good: 10.9710, due day 13 | Again: 0.6077, due in 10 min |
  | day 2, 10 min later | | Good: 0.6598, due day 3 |
  | day 3 | | Good: 2.4892, due day 5 |
  | day 5 | | Good: 6.0539, due day 11 |
  | day 11 | | Good: 14.8032, due day 26 |
  | day 13 | Good: 46.3169, retained | |
  | day 26 | | Good: 33.5926, retained |

  The word recalled right leaves learning on day 2. The word recalled
  wrong holds its slot until day 11, nine days longer, and its
  `retainedAt` waits for day 26, since the day-11 recall comes 6 whole
  days after the one before it (`retainedAtOf`).
- **Six of those nine days bound no review.** The lapsed word is
  reviewed on days 2, 2, 3 and 5. From day 5 to day 11 it is not due,
  as a stable word is not due from day 2 to day 13, but it holds a slot
  and the stable word holds none.
- **Lesson 4 waits only when 11 or more of the 15 are wrong.** With 10
  or fewer wrong, 5 words are stable on day 2 and lesson 4 starts that
  day. What fewer lapses cost is pace: each 5 lapsed words, or part of
  5, take one lesson out of every 2-day round until day 11. With 11 or
  more wrong, no lesson starts after the first three until day 11, and
  from day 5 to day 11 no review is due either: the learner has nothing
  to study for 6 days (*Worked examples*).
- **The way out ADR 045 names is closed to the learner who needs it.**
  *The school can be raised to 6* on stable words, but school level 3
  needs 10 of them (`wordNeed`), and a learner with 11 lapses in 15
  holds 4. School level 2 needs none and lifts the cap to 20; it is a
  new town's third goal since `8d895101`.
- **The refusal sends the player to reviews that are not due.**
  `refusal.LearningCapReached` reads *Words in learning:
  {cardsInLearning} of {learningCap}. Review them before you start
  another lesson.* (`en.json`), whether or not a review is due.

## Decision

- **A card is in learning while its stability is under 4 days.** The
  learning cap counts those cards, and nothing else about the cap
  moves: its values per school level, `LearningCapReached`, the count
  the school shows.
- **The 7-day line stays where it is for its four other readers.** A
  stable word, a retained word, a skill's floor, the gloss's fade and
  the school path's `hold` keep 7 days. A stable word stops being *a
  card not in learning*: it is counted on its own, as a card at 7 days
  or more. A card from 4 to under 7 days is neither in learning nor
  stable; it stands at `recall` on the school path, counts toward no
  building level, and its gloss still shows.
- **Why a second line.** The cap bounds review load, and the other four
  readers ask what a word has proved. A lapsed word at 6.0539, next due
  in 6 days, carries the load of a stable word and has proved less than
  one. One line cannot say both.
- **Why 4 days.**
  - Over 2.4892, where a lapsed word stands after its first Good on a
    later day: it is due again in 2 days, as a new word at 2.3065 is,
    and a new word holds a slot.
  - At or under 4.7235, where a lapsed word stands on day 5 when the
    relearning step was answered with a hint (Hard, then Good): without
    the hint it stands at 6.0539. Both free their slot at the day-5
    recall, the second Good on a later day.
  - 4 and not 3, so a word recalled wrong twice within its first days
    keeps its slot: wrong again at the relearning step it stands at
    3.8614 on day 6, wrong again on day 3 at 3.8936 on day 7, wrong
    again on day 11 at 3.9674 on day 14. Each waits for its next
    recall, which takes it past 7. One such path does free under 7: a
    word wrong again on day 5 stands at 3.3656 on day 8 and frees on
    day 11 at 5.9846, against day 17. The margin under 4 is thin, 0.03
    at the closest, and belongs to the default parameters: a refit of
    the parameters (ADR 036) re-derives the line.
  - A card at 4 days or more is next due 4 or more days after its
    review (`dueInstantOf` rounds the stability to whole days), so a
    word in learning is one the learner meets again within 4 days.
- **What a lapse costs now.** A word wrong at its first typed recall
  holds its slot from day 2 to day 5, 3 days more than a word recalled
  right, against 9. A stable word that lapses on day 13 comes back to
  learning at 1.5390 and leaves on day 15 at 4.9348, against day 20. A
  word whose first recognition was wrong leaves on day 3 at 6.6243,
  against day 10. A word that is never wrong moves on the same days as
  on trunk: 2.3065 is under both lines, and 10.9710, or 7.5174 after a
  hint on day 2, is over both.
- **ADR 045's acceptance, restated.** *What a lapse costs is time, never
  a level* stands. *The cap fills with relearning cards* still happens
  to a learner who keeps lapsing, and is still accepted there: that is
  the cap doing its work. It no longer happens to a word that lapsed
  once and has since been recalled right on two later days.
- **The cap says when it can open.** Where the cap refuses a lesson, the
  server answers the instant the next word in learning is due, and the
  school's cap line and the refusal show it in place of *Review them*,
  which stays only while a review is due. No client derives it (N1).
- **Existing players.** The count is derived on read from the stored
  cards, so the deploy moves it with no migration: a player's cards
  from 4 to under 7 days stop counting the moment the code ships, and a
  refused lesson may start. Nothing stored changes.

## Worked examples

The figures come from two throwaway scripts, pasted whole in the pull
request that proposes this ADR, run on trunk at `8d895101` with
`pnpm --filter @mygame/api exec tsx <file>`. They call trunk's
`reviewMemoryCard`, `dueInstantOf`, `cardsInLearningOf`,
`deriveLessonDurationSeconds` and `defaultMemoryTerms` and read
`school.json` and the 27 shipped lessons; admission and each option's
count are copies written in the script. No test in the repo pins them.

The learner is on time: every review is answered at its due instant,
and the next lesson in curriculum order starts the moment the slot and
the cap allow. The school stays at one level for the whole run, 1 unless
a row says 2. No holdout applies: the first 16 lessons are chrome
lessons, which the draw never touches (ADR 037). A recognition and the
10-minute relearning recall are always right. Day 0 is the first
lesson's start.

The options, each a rule for the cards that hold a slot:

- **Trunk**: stability under 7 days.
- **School 2**: trunk's rule at the cap of 20.
- **First Good frees**: under 7 days, but a lapsed card frees its slot
  at its first Good recall a day or more after the review before it.
- **Allowance of 5**: under 7 days, but the first 5 lapsed cards hold
  no slot.
- **Under 4 days**: the decision. **With school 2**: the same at the
  cap of 20.

**The first typed recalls wrong.** *k* of the first 15 typed recalls on
a later day are wrong, and every other answer is Good. The day lessons
4, 5, 6 and 7 start:

| Rule | 0 wrong | 3 wrong | 6 wrong | 11 wrong |
|---|---|---|---|---|
| Trunk | 2, 2, 2, 4 | 2, 2, 4, 4 | 2, 4, 6, 8 | 11, 11, 11, 13 |
| School 2 | 0, 2, 2, 2 | 0, 2, 2, 2 | 0, 2, 2, 4 | 0, 2, 4, 6 |
| First Good frees | 2, 2, 2, 4 | 2, 2, 3, 4 | 2, 3, 3, 4 | 3, 3, 3, 5 |
| Allowance of 5 | 2, 2, 2, 4 | 2, 2, 2, 4 | 2, 2, 4, 4 | 2, 4, 6, 8 |
| Under 4 days | 2, 2, 2, 4 | 2, 2, 4, 4 | 2, 4, 5, 5 | 5, 5, 5, 7 |
| Under 4 days, school 2 | 0, 2, 2, 2 | 0, 2, 2, 2 | 0, 2, 2, 4 | 0, 2, 4, 5 |

With 15 wrong the lessons start on the days of 11 wrong, under every
rule. A line at 3, 5 or 6 days gives the days of 4.

The same runs: the words held at the start of day 14, and the reviews
answered before it.

| Rule | 0 wrong | 3 wrong | 6 wrong | 11 wrong |
|---|---|---|---|---|
| Trunk | 105, 315 | 85, 264 | 65, 213 | 45, 168 |
| School 2 | 135, 410 | 120, 369 | 100, 318 | 80, 273 |
| First Good frees | 105, 315 | 105, 324 | 105, 333 | 105, 348 |
| Allowance of 5 | 105, 315 | 105, 324 | 85, 273 | 65, 228 |
| Under 4 days | 105, 315 | 100, 309 | 95, 303 | 90, 303 |
| Under 4 days, school 2 | 135, 410 | 135, 414 | 130, 408 | 125, 408 |

135 words is every shipped lesson. The longest stretch with the cap
full and no review due is 2 days in every run, the wait for a new
word's first recall, but on trunk with 11 or more wrong, where it is 6
days, day 5 to day 11. The busiest day of the 30 holds 45 reviews on
trunk with none wrong and 60 under the 4-day line with 15 wrong, the
busiest day of a school 2 learner with none wrong. At the cap of 20
with 16 of the first 20 wrong, lesson 5 starts on day 11 on trunk and
on day 5 under the 4-day line; with all 20 wrong the 4-day line's
busiest day holds 80 reviews.

**A learner who keeps lapsing.** Every typed recall on a later day is
wrong with probability *p*, whatever the card's stability; medians of
200 seeded runs. The words held, the stable words among them and the
reviews answered, at the start of day 14:

| Rule | *p* = 0.1 | *p* = 0.3 | *p* = 0.6 |
|---|---|---|---|
| Trunk | 75, 59, 246 | 40, 28, 218 | 20, 6, 249 |
| School 2 | 95, 79, 333 | 60, 38, 296 | 30, 8, 348 |
| First Good frees | 90, 72, 304 | 75, 45, 333 | 40, 13, 387 |
| Allowance of 5 | 95, 76, 319 | 60, 38, 282 | 30, 9, 331 |
| Under 4 days | 80, 62, 266 | 50, 33, 254 | 25, 6, 272 |
| Under 4 days, school 2 | 110, 88, 372 | 70, 47, 349 | 35, 10, 380 |

At *p* = 0.3 on day 30: trunk holds 50 words, 35 stable, after 408
reviews; the 4-day line 65, 48 and 535; school 2 65, 49 and 564; the
allowance 65, 48 and 554; first Good frees 125, 86 and 876. A line at 3
days gives 75, 53 and 583, at 5 days 55, 41 and 482, at 6 days 55, 40
and 472. At *p* = 0.6, 53 of the 200 runs fail 11 or more of the first
15, and lesson 4 waits past day 3 under trunk's rule and under the
4-day line.

What this shows, and does not:

- **The premise holds only from 11 wrong.** Lesson 4 starts on day 2
  with 0, 3 or 6 wrong under every rule. The audit's case, a first
  session where most typed recalls fail, is the 11-wrong column: day 11
  on trunk, day 5 under the 4-day line.
- **The 4-day line gives back most of the pace, inside the load the cap
  already allows.** With 3, 6 and 11 wrong the learner holds 100, 95
  and 90 words on day 14 against trunk's 85, 65 and 45, and answers
  309, 303 and 303 reviews against trunk's 264, 213 and 168, never more
  than the 315 of a learner who is never wrong. At the cap of 20 it
  passes that learner's 410 by 4 with 3 wrong and by 10 with 15 wrong.
- **It is not a cure for a learner who keeps lapsing.** At *p* = 0.3 it
  holds 50 words on day 14 against 40; at *p* = 0.6 every rule stalls
  under 15 stable words. A learner that far from 0.1 is one the default
  parameters do not fit, and no rule for the cap repairs a schedule.
- **The runs cannot show a cost in retention.** *p* is fixed, so a
  learner holding more weak words lapses no more often in the model.
  Whether a real one does is not measured here.
- **These are a learner on time.** A learner who plays once a day or
  less is not simulated.

## Considered options

- **Keep 7 days and make the wait visible.** *Learning*: the hardest
  brake; a learner who fails most of a first session adds no word for 9
  days. *Cost*: 6 of the 9 days hold no review, so the brake buys no
  practice of the lapsed words there, and no copy makes a 6-day wait
  with nothing due read as progress. *Code*: copy and one instant on
  the wire. Rejected as the whole answer; its visible half is taken.
- **Leave it to the school.** School 2 is the third goal and its cap of
  20 starts lesson 4 on day 0. It is capacity for every learner and not
  a rule for a lapse: a learner who is never wrong answers 410 reviews
  in 14 days against 315, the wall comes back when 16 of 20 are wrong,
  and school 3 needs 10 stable words. Kept as it is; the decision works
  beside it.
- **A lapsed card frees its slot at its first Good on a later day.**
  *Learning*: the weakest brake. It frees a word at 2.4892, due in 2
  days, while a new word at 2.3065 holds a slot; at *p* = 0.3 the
  learner answers 876 reviews by day 30 against trunk's 408. *Code*: a
  stored card keeps no trace of an earlier lapse or of the days before
  its last review (`StoredMemoryCard`), so it needs a column, a
  migration and a rule in `reviewMemoryCard`. Rejected.
- **A relearning allowance**, 5 lapsed cards outside the cap. It needs
  the same stored trace and a second count on the school. In the runs
  it does what a school level does (65, 48 and 554 on day 30 at
  *p* = 0.3, against school 2's 65, 49 and 564), and it lets the
  learner with 11 wrong start one lesson every 2 days where the 4-day
  line starts three on day 5. Rejected.
- **A line at 3, 5 or 6 days.** The first-recall runs cannot tell them
  apart. At 3 a word wrong twice frees one review sooner, and the
  learner at *p* = 0.3 answers 583 reviews by day 30 against 535. At 5
  or 6 the word relearned with a hint (4.7235) keeps its slot to day
  10, and 6 sits 0.05 under the 6.0539 the whole decision turns on.
  Rejected for 4; the owner may move the line from 3 to 5 and the days
  of the first table stay.
- **Lower the one 7-day line for every reader.** It moves the floor of
  rule 7, which the owner kept on 2026-11-05 (ADR 045), the gloss's
  fade and the need of building levels 3 to 6. Rejected.
- **A cap on new words per day.** It reads the clock, where ADR 040 has
  *no read and no clock* move the cap, and it never slows a learner who
  is failing. Not simulated. Rejected.
- **Soften what Again does**, with other relearning steps or a gentler
  forgetting formula. ADR 036 ports py-fsrs and lets its file win; the
  schedule is not this ADR's to change. Rejected.

## Consequences

- **What it trades away.** The schedule of every card is untouched: the
  same due instants, the same desired retention of 0.9. The decision
  moves only when new words may enter. A lapsed word frees its slot 6
  days sooner, at about 6 days of stability and before any proof, so a
  learner with lapses holds more words under 7 days at once than trunk
  allows: at *p* = 0.3, 535 reviews by day 30 against 408, about a
  third more. If a learner's lapses come from holding too many weak
  words at once, the 4-day line makes them worse and trunk's protects; no run
  here and no study in `docs/research/` says whether they do. The 7
  days this replaces rested on design reasoning too (`decisions.md`
  1.5).
- **How to tell.** The review log holds every review with its rating
  and the card before it (ADR 036, rule 8). The share of Again among
  recalls on a later day, before and after the change, is the check.
  So is the share wrong at the first typed recall: this ADR read no
  player's cards and does not know the owner's.
- **Not decided here.** Whether the first typed recall asks too much:
  the word is recognized twice and then typed from its gloss 2 days
  later (ADR 036, rule 2). A typed recall on day 0 would be its own
  ADR.
- **The cap and the stable count part.** ADR 045's *the recall that
  frees the cap opens a level* stays true for a word that is never
  wrong, 2.3065 to 10.9710. A lapsed word frees the cap on day 5 and
  counts toward a level on day 11.
- **The count can pass the cap**, as on trunk: a card that lapses comes
  back under the line whatever the cap, and only a lesson start is
  refused.
- `packages/domain`: `cardsInLearningOf` reads a 4-day constant of its
  own; `stableWordCountOf` stops being `cards.length −
  cardsInLearningOf(cards)` and counts the cards at
  `SKILL_STABILITY_DAYS` or more. `wordStandingOf`, `isWordRetained`,
  `supportLevelOf` and `admitSchoolLesson` do not change.
- `packages/contracts`, `apps/api`: `LearningLoad` gains the instant
  the next word in learning is due, null when none is, so the Android
  row of `.claude/rules/verification.md` is owed. `inLearning` and
  `cap` keep their shape.
- Clients read no stability, so the count moves with the api alone. The
  cap line and the refusal change copy, Android first.
- `docs/adr/045-stable-words-open-the-town.test.ts` computed its stable
  words as the cards not in learning. It was a snapshot the gate never
  ran, removed in #1283 and kept in git at `cf336126`; ADR 045's
  *Worked examples* says how to run it.
- No migration, no content change.
- **The edits its acceptance forced**, made with ticket 1:
  `CONTEXT.md` (**In learning** reads *under 4 days*, **Stable word**
  drops *so not in learning*, **Stability** says a card from 4 to
  under 7 days is neither); ADR 040, *The learning cap*; ADR 042, the
  `caughtUp` bullet, whose worked example, *in learning until the
  11-12 recall*, stays true; ADR 045, *The words a town holds*, *A
  player who lapses* and *The decision, together*. Each is marked
  amended. No row of `docs/PRODUCT_REQUIREMENTS.md` names the line.
- **Four tickets, in order, each one pull request**:
  1. **Domain: in learning is under 4 days.** The constant, the two
     counts, their tests with a card at 6.0539 that is neither in
     learning nor stable, the snapshot's `stableWordsOf`, and the doc
     edits above.
  2. **Api and contracts: when the next word in learning is due.**
     `LearningLoad`'s new instant, derived on read with
     `dueInstantOf`, and the regenerated client.
  3. **Android: the cap says when it can open.** The school's cap line
     and the cap refusal show that instant, and *Review them* only
     while a review is due; `en.json` and `es.json` through check 9.
  4. **Web: the same line**, as its own ticket.

## References

- ADR 035, ADR 036 (rules 2, 5, 7 and 8), ADR 038, ADR 040 (*The
  learning cap*), ADR 042, ADR 045 (*A player who lapses*);
  `docs/research/english-pivot/decisions.md` 1.5 and 7.1.
- `packages/domain/src/learning/cardsInLearningOf.ts`,
  `skillStabilityDays.ts`, `stableWordCountOf.ts`, `wordStandingOf.ts`;
  `packages/domain/src/memory/nextMemoryOf.ts`, `reviewMemoryCard.ts`,
  `dueInstantOf.ts`, `MemoryTerms.ts`, `MemoryCard.ts`;
  `packages/domain/src/town/admitSchoolLesson.ts`;
  `apps/api/content/town/school.json`, `town.json`;
  `packages/catalog/en.json` (`refusal.LearningCapReached`);
  `packages/contracts/src/TownOverview.ts` (`LearningLoad`).
- PRD N1.
