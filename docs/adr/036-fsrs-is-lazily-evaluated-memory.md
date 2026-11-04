---
status: proposed
date: 2026-11-04
---
# FSRS is lazily evaluated memory

## Context

ADR 035 makes retention the game's progress: a lesson brings in new
words, the server grades every review, and a skill level is earned when
every word of its lesson is retained past a stability threshold. It
names FSRS as the scheduler and defers the rest here: the stored card,
the derived retrievability and due instant, the server's grading, the
threshold and the review log. ADR 012's amendment leaves this ADR what a
lesson costs.

The design tree (`docs/research/english-pivot/decisions.md`) settles
the direction: FSRS at default parameters and desired retention 0.90
(§4.1), memory derived on read like a stock (§4.2), the server grading
with a fixed rating map (§4.3), recognition before recall (§5.1),
feedback that prompts before it tells (§6.1, §6.2), the skill at 7-day
stability and never taken back (§1.1, §1.6), an append-only review log
(§8.4), and a first slice of one lesson on the existing fief and
library (§14). It leaves eight rules open, which the owner delegated on
2026-11-04: the card's owner, the switch from recognition to recall,
the recognition choices, what a typed answer accepts, the rating map,
how lesson 1 uses the study slot, where the skill lives, and the review
log's contents. A ninth was left open between the design tree, whose
§14 keeps Android out of the first slice, and the S39 tickets, which
put it in; the owner delegated it too. Each rule below is stated in one
line first, then pinned.

The learner is an adult at A1 to A2, a Spanish speaker learning
American English (§2.1). The evidence behind the scheduler is weaker
than the rest of the design: FSRS is the best non-neural model of the
open-spaced-repetition srs-benchmark, which is community work, not
peer-reviewed, and measures how well a model predicts recall, not how
much anyone learns (`research.md` §14). Kim and Webb (2022) found
expanding and equal schedules equal for L2 learning (§1), so FSRS is
chosen for efficiency and for the predictions the owner's calibration
metric needs (§8.2), not for a claim of more learning.

## Decision

### The scheduler

- **FSRS-6 exactly as py-fsrs 6.3.2 implements it**: commit
  `9446cb06605c597a063aeee49f7d188d42e34dc2` of
  `open-spaced-repetition/py-fsrs`, file `fsrs/scheduler.py`, MIT
  licence. A pure function in `packages/domain`, ported to TypeScript;
  where this ADR and that file differ, the file wins and this ADR is
  amended.
- **The 21 default parameters**, `w0` to `w20`: 0.212, 1.2931, 2.3065,
  8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
  0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658,
  0.1542. Per-player fitting waits for hundreds of reviews per player
  (§4.4) and is a later ADR.
- **Desired retention 0.90; learning steps 1 min and 10 min; one
  relearning step, 10 min; maximum interval 36500 days.** These are
  py-fsrs's defaults.
- **No fuzz.** py-fsrs fuzzes a review interval by default with
  `random()`; Townword turns it off, so the same card, answer and
  instant always give the same next card, and the domain never draws a
  random number.
- **Days are whole days, floored**, as py-fsrs counts them
  (`timedelta.days`): the elapsed days of retrievability, the elapsed
  days of the log, and the same-day test that sends a review under one
  day to the short-term stability formula.
- **A review interval in days is the stability rounded half to even**,
  as Python's `round` does, at least 1 and at most 36500. At retention
  0.90 the formula `S / FACTOR × (0.9^(1 / DECAY) − 1)` reduces to `S`,
  so a card of stability 2.5 is due in 2 days, never 3.

### The stored card

- **A card stores `state`, `step`, `stability`, `difficulty`,
  `lastReviewAt`, `lastRating`, `enteredAt` and `retainedAt`; nothing
  else, and nothing advances it.** `state` is `learning`, `review` or
  `relearning`; `step` is the learning or relearning step, null in
  `review`; `stability` (days), `difficulty` (1 to 10), `lastReviewAt`
  and `lastRating` are null until the first review; `enteredAt` is the
  instant the card entered with its lesson; `retainedAt` is the instant
  of the card's last review when that review was a recall rated Good at
  least 7 whole days after the review before it, and null after any
  other review (rule 7). Only a rating writes a card (N2, W7, ADR 005).
- **The tuple of §4.2, `(stability, difficulty, lastReviewAt, state)`,
  lacks `step`**, which the learning and relearning steps need to know
  which step comes next, **and lacks the last rating**, which the due
  instant needs at step 0: a Hard there waits the mean of the first two
  steps, or 1.5 times a single step, where an Again at the same state
  and step waits the first step (`fsrs/scheduler.py`, the Hard branch
  of `review_card`, lines 328 to 333 for `learning`). In `relearning`
  a Hard at step 0 waits 1.5 times the single relearning step, 15 min,
  where an Again waits the step, 10 min. In `learning` it waits
  5.5 min where an Again waits 1 min; the scheduler keeps that branch,
  as the file wins, though a recognition rates only Good or Again
  (rule 5) and never reaches it. ADR 035 already stores "the moment
  and the result of its last review"; `lastRating` is that result.
- **A pending review is a stored row of its own, keyed by player and
  word, separate from the card: `hintShown` and `nearMissAnswer`.** It
  exists only between a hint or a near-miss and the rating they lead
  to, which deletes it in the rating's transaction. It holds what
  rule 4 must remember across requests and never changes the card, so
  the card stays the FSRS state and nothing else. A hint is refused on
  a card that is not due and on a card reviewed by recognition, and
  writes nothing then.
- **Retrievability is derived on read**: 0 before the first review,
  otherwise `R = (1 + FACTOR × t / S)^DECAY`, with `DECAY = −w20`,
  `FACTOR = 0.9^(1 / DECAY) − 1` and `t` the whole days since
  `lastReviewAt`. At `t = S`, `R` is 0.90.
- **The due instant is derived on read**: `enteredAt` before the first
  review; in `review`, `lastReviewAt` plus the interval in days of the
  stored stability; in `learning` or `relearning`, `lastReviewAt` plus
  the step `step` names, except after a Hard at step 0 (above). A card
  is due when its due instant is at or before `now`.
- **Only a due card is reviewed** (§1.2). A review of a card not yet
  due is refused and changes nothing; there is no extra practice.

### The rules

1. **The card belongs to the player, not the fief, and is written in
   the transaction that holds the player's fiefs.** One card per player
   and word. A rating, a hint and a near-miss each run in one
   transaction that locks every fief of the player in ascending id, as
   ADR 024's two-fief mutation does (`mutateEveryFiefAfterResolve`):
   each fief is resolved at one instant, the latest of the clock and
   every locked `storedAt`, and that instant is the review's. The card,
   the pending review, the log and any skill earned are written there
   (ADR 013's rule). ADR 035's one-time reset keeps
   the cards, the review log and the earned skills, as it keeps the
   accounts: the memory is the learner's, not the medieval save's.
2. **A card in `learning` is reviewed by recognition; from `review` on,
   and in `relearning`, by recall, with a hint on request.**
   Recognition shows the English word and asks for its meaning among
   glosses; recall shows the scaffold gloss and asks the player to type
   the English. A card answered Good at each of its two learning steps,
   each at its due instant, enters `review` 10 min after it entered, so
   its first recall comes at its first due instant in `review`, days
   later.
3. **Recognition offers the word and the other words of its lesson, at
   most 5 in all, ordered by a stable hash of each word's id and the
   card's key instant.** The key instant is `lastReviewAt`, or
   `enteredAt` before the first review, so the order holds across
   re-reads and changes after every review. For a lesson of more than 5
   words, the 4 other words with the lowest hash are taken, then the 5
   ordered. A tie orders by word id. The hash is a 32-bit integer
   mixing with no `Math.random`, as `campOf`
   (`packages/domain/src/camp/campOf.ts`) places camps. Each choice
   carries a choice id, never its word id: the 8 hex digits of that
   same hash, re-mixed until no other choice of the card holds it, so
   it is unique within the card and changes with the key instant. The
   answer is the chosen choice's id; the server grades every answer by
   recomputing the card's choices at the answer, so grading never
   depends on the order, and refuses an id the card does not offer
   (`UnknownChoice`) rather than rating it, so a stale tab never costs
   a lapse. The choice ids are opaque and deterministic, not secret: a
   modified client can work the answers out from the public lesson
   content, the asked word's gloss on a recognition and the gloss
   mapped back to its word on a recall. That cheating hurts only the
   learner, since no reward one player takes from another rides on a
   review. The opaque ids exist so that a casual client bug, such as
   matching the card's own word id against its choices, cannot leak
   the answer (amended 2026-11-04, #713: the answer was the chosen
   word's id, which a recognition card's own word id gave away).
4. **A typed answer is compared after Unicode NFC, the typographic
   apostrophe ’ read as ', trimming, collapsing inner whitespace to one
   space, and lower-casing, against the word and any further form its
   content accepts.** A **near-miss** is an answer at
   optimal-string-alignment distance 1 (one letter inserted, deleted,
   changed, or two adjacent letters swapped) from an accepted form of 4
   letters or more, when the answer is not itself a word of the NGSL 1.2
   list. A
   near-miss is not rated: the server stores it as the pending review's
   `nearMissAnswer` and answers "check the spelling", and the next
   answer rates. A **hint** is requested from the server, which sets the
   pending review's `hintShown` and answers the word's first letter and
   its letter count. The rating the two lead to deletes the pending
   review. The NGSL 1.2 headword list (Browne, Culligan and Phillips,
   CC BY-SA 4.0, 2 809 words with their ranks) is api content beside the
   lessons, read through the lesson port; the S39 tickets are amended
   to add it with lesson 1's file (#713), and ADR 037's curriculum reads
   the same file.
5. **The rating: a wrong answer is Again; a correct answer after a hint
   or after a near-miss is Hard; a correct answer otherwise is Good;
   Easy is never inferred.** A recognition is Good when the right
   meaning is chosen and Again otherwise. Every Again shows the correct
   form beside the player's answer (§6.1). No rating pays or costs a
   resource (§6.3). §6.1's "the item comes back once more before the
   Report closes" is the step an Again sets: the card is due again 1 min
   later in `learning` and 10 min later in `relearning`, so a player who
   stays meets it again in the same sitting, and one who leaves finds it
   waiting (§1.6). No other re-queue exists, since only a due card is
   reviewed.
6. **Lesson 1 takes the library's study slot like an art: it costs
   nothing, lasts 300 content seconds, needs library level 1, and its
   cards enter at its finish.** Its duration is shortened by the built
   library level and the season's study percent like any study
   (`deriveStudyDurationSeconds`, ADR 012, ADR 017): 150 s at library 1
   and a study percent of 100. It cancels like a study, refunding
   nothing and entering no card. The resolve that applies its finish
   enters its words' cards with `enteredAt` at that finish, due there,
   in the transaction of the read that resolves it, and the chronicle
   records the lesson as it records an art learned. A lesson is studied
   once per player: a start locks all of the player's fiefs in
   ascending id (rule 1, ADR 024) and is refused when the player holds
   its cards or when the study slot of any of those fiefs is studying
   it, and a finish that finds the cards enters none.
7. **The skill is the player's: its level is earned at the review after
   which every word of its lesson holds both a stability of 7 days or
   more and a `retainedAt`, stored with that instant, and never taken
   back.** A word holds a `retainedAt` when its last review was a recall
   rated Good, so with no hint and no near-miss, at least 7 whole days
   after the review before it. The stability is the floor; the
   `retainedAt` is the proof: the word was produced from its gloss,
   unaided, after a week without practice. A Hard never earns it. Both
   change only at a review, so that review is the only instant the
   condition can be met; it is checked there, never on a read. A later
   lapse,
   ADR 035's reset or a missed review never revokes it (§1.6). Lesson 1
   earns level 1 of the food skill, +5 %, the percent an art's level 1
   gives today. The earned levels live in the domain beside
   `FiefArtLevels`, as the player's skill levels, each with its
   `earnedAt`; the fief read loads them with the fief in its one round
   trip (N2), and `deriveResourceRates` multiplies each one's resource
   with the art percents, before the season, as one more whole percent
   of the same product. Earning a level re-bases the stocks of every
   fief the player holds at the earn instant, in the review's
   transaction under ADR 024's lock order (rule 1), as any rate change
   does (ADR 005); the accrual is never split at `earnedAt`.
8. **The review log is append-only: one row per rating, holding the
   player, the word, the instant, the format, the raw answer, the
   near-miss before it if any, whether a hint was shown, the rating,
   the elapsed whole days (null on a first review), and the card before
   and after.** It is written in the review's transaction (rule 1,
   ADR 013), never updated and never pruned. The domain writes it
   through a port and never reads it, as with the chronicle.
9. **The first slice ships on Android as well as on the web, the
   Android screen after the web one, on the same api and contract.**
   The slice is done when both draw lesson 1 and its reviews; this ADR
   overrides decisions.md §14, which left Android out. The recall field
   on Android turns autocorrect and auto-capitalization off, so the
   keyboard never fixes a misspelling the server would have called a
   near-miss, nor types a correct answer the player did not.

### Worked examples

All instants UTC, every rating at its due instant unless said. Each
figure was checked against the formulas of `fsrs/scheduler.py` at the
pinned commit, with the parameters above and no fuzz.

- **Lesson 1 to its skill.** The library is at level 1 and the study
  percent at 100: lesson 1 starts at 08:57:30 and finishes at
  2026-11-10 09:00:00, 150 s later (rule 6). The card of *school*
  enters then, due at once.
  - 09:00, recognition, the right choice's id, Good: `learning`,
    step 1, S 2.3065, D 2.1181, due 09:10 (the second learning step).
  - 09:10, recognition, the right choice's id, Good: `review`,
    S 2.3065 (a same-day Good never lowers stability, and its
    short-term factor here is clamped to 1), D 2.1112, due in
    round(2.3065) = 2 days, 2026-11-12 09:10.
  - 2026-11-12 09:10, recall, *school* typed, Good: S 10.9710, D 2.1043,
    due in 11 days, 2026-11-23 09:10. S is at least 7, but the review
    came 2 days after the one before it: `retainedAt` stays null and
    no skill is earned.
  - 2026-11-23 09:10, recall, *school* typed, Good, 11 days after the
    review before it: S 46.3169, D 2.0975, due 2027-01-08 09:10,
    `retainedAt` 2026-11-23 09:10. If the other four words of lesson 1
    already hold a `retainedAt` and a stability of 7 or more, the food
    skill level 1 is earned at 2026-11-23 09:10, 13 days after the
    lesson (rule 7).
  - The 2026-11-12 recall after a hint instead, Hard: S 7.5174, due in
    8 days, 2026-11-20 09:10, no `retainedAt`. At 2026-11-20 09:10,
    typed with no hint, Good, 8 days after the review before it:
    S 26.4271, due 2026-12-16 09:10, `retainedAt` set.
  - The 2026-11-12 recall wrong, Again: `relearning`, step 0, S 0.6077,
    due 09:20 (the relearning step). A skill already earned stays.
- **Why the last rating is stored.** The relearning card above,
  reviewed at 09:20: typed after a hint, Hard, it stays at step 0 with
  S 0.6077 and is due at 09:35; typed wrong, Again, it stays at step 0
  with S 0.2229 and is due at 09:30. Same state, same step, two due
  instants.
- **Retrievability on read.** The card at S 10.9710 reviewed at
  2026-11-12 09:10 reads R 0.9062 at 2026-11-22 09:10 (10 days), still
  0.9062 at 2026-11-23 09:09 (10 days, floored), and 0.8998 at
  2026-11-23 09:10 (11 days). No process wrote anything in between.
- **Typed answers for *school*.** "  School " is *school*, Good.
  "scool" (a letter deleted) and "shcool" (two letters swapped) are
  near-misses: no rating, a prompt, and the next answer rates, Hard if
  it is right. For *food*, "fod" is a near-miss; "foot" is Again when
  *foot* is an NGSL 1.2 word, a different word and not a slip.

## Considered options

- **The card on the fief** (§4.3 read literally). Rejected for rule 1:
  ADR 035's reset empties every table hanging from a fief, which would
  erase what the learner retained; and with a second fief, one word
  would carry two memories.
- **Recall from the first review.** Rejected for rule 2: typing a word
  seen once mostly fails, and an Again loop on a new word is the
  frustration the A1 learner quits on. Recognition is the on-ramp
  `research.md` §2 allows; recall formats give the larger testing
  effect (Rowland 2014), so recall takes over once the card leaves the
  learning steps.
- **A hint in relearning only** (the starting recommendation). Changed
  in rule 2: the first recall comes days after two recognitions, and an
  A1 learner who cannot start the word is better served by a prompt that
  keeps it a retrieval, rated Hard, than by a failure rated Again.
  Prompts that push self-correction beat reformulations (Lyster and
  Saito 2010, `research.md` §7).
- **Recognition order by a hash of the item and its review count** (the
  starting recommendation). Changed in rule 3: the card stores no count,
  and counting the log would make the domain read it. The key instant
  is on the card already, varies after every review and holds across
  re-reads.
- **A near-miss rated Hard at once, with the correct spelling shown**
  (the starting recommendation). Changed in rule 4: it is a recast, the
  feedback the evidence ranks below a prompt (`research.md` §7, Lyster
  and Saito 2010; Ellis, Loewen and Erlam 2006), and §6.2 asks for one
  prompt before the answer. One retry costs one stored mark on the
  pending review the hint needs anyway. A distance-1 answer that is
  itself an NGSL 1.2 word is a different word, not a slip, and is Again.
- **A near-miss judged against the content's words only.** Rejected for
  rule 4: lesson 1 holds five words, so "foot" for *food* would pass as
  a slip while it is a word the learner may well have meant. The NGSL
  1.2 list is the curriculum's source anyway (ADR 035), small enough to
  ship as content, and open to ship (CC BY-SA 4.0); a full English
  dictionary would call nearly every short typo a word.
- **The hint and the near-miss stored on the card.** Rejected for the
  pending review: they are not FSRS state, they live only until the
  rating, and a card that carried them would change between ratings,
  which the stored card's rule forbids.
- **Store the due instant**, as py-fsrs's `Card` does. Rejected: with no
  fuzz it follows from the card and the last rating, and storing it
  would keep two answers to one question. A future change of the
  desired retention or of the steps then moves every due instant at
  once. A change of the parameters alone does not: at retention 0.90
  the interval is the stability rounded, whatever `w20`.
- **The skill at a stability of 7 days alone** (the first draft of this
  ADR, and §1.1's wording). Rejected for rule 7: with the defaults a
  single cued recall two days after the lesson crosses it, even a Hard
  after a hint, which rewards short-term recall, not retention.
  Delayed form recall falls far below immediate form recall, 25.1 %
  against 58.5 % after intentional word study (Webb, Yanagisawa and
  Uchihara 2020, `research.md` §10), and longer gaps win on delayed
  tests (Kim and Webb 2022, §1). An unaided recall after 7 days without
  practice tests the delayed retention the skill claims; with the
  defaults it comes at the second recall, about 13 days after the
  lesson.
- **Split the accrual at `earnedAt`** instead of re-basing every fief.
  Rejected for rule 7: a re-base at the instant of the rate change is
  ADR 005's rule for every mutation, and ADR 024's lock already holds
  every fief of the player; a split would add a second kind of
  boundary to the walk for one event.
- **A wrong word queued again before the Report closes**, apart from
  FSRS (§6.1 read literally). Rejected for rule 5: the step an Again
  sets already brings the word back within minutes, and a separate
  queue would review a card that is not due (§1.2).
- **Fuzz on**, py-fsrs's default. Rejected: it exists to spread a large
  Anki collection's load across days; here it would make a review
  non-deterministic and put a random draw in the domain.
- **Earn the skill on read** (§14.2's wording). Rejected for rule 7:
  stability does not move with time, so a read can only find what the
  last review already decided. Earning at the review stamps the true
  instant and lets the rate change re-base the stocks there.
- **A higher stability floor, 21 or 30 days.** Not taken: the
  `retainedAt` proof already asks for an unaided recall after a week,
  which with the defaults leaves the stability far above 21 (46.3 in
  the worked example), and the floor is a design choice either way
  (§7.1: no L2 study gives one). The owner's calibration (§8.2) can
  move either number with evidence.
- **A lesson paid in resources.** Rejected for rule 6: a toll on
  learning, the pattern ADR 035 rejects (Deci, Koestner and Ryan 1999).
  The economy pays for the library's levels, which gate and shorten the
  lessons.
- **Easy inferred from a fast answer.** Rejected for rule 5: the server
  cannot time a review reliably, and a client-sent timing is a
  client-written score (N1).
- **The first slice on the web only** (decisions.md §14, which lists
  Android out of the slice and fourth in the order after it). Rejected
  for rule 9. What the slice must prove is the learning loop and FSRS on
  real use, and its evidence is the review log of reviews answered on
  their due days. The owner plays on an Android phone (ADR 034's first
  goal), so a review falling due on day 2 meets the owner on the phone;
  a web-only slice either leaves it unanswered or moves the owner to a
  desktop the game is not played on, and the log then measures the
  detour, not the loop. The cost is one wave: the api, its grading and
  the contract are the same, the client only draws what the api answers
  (`.claude/rules/android-architecture.md`), and the price is a
  regenerated OpenAPI client, one review screen in `feature:fief` and
  the emulator verification row. ADR 034's parity rule owes that screen
  anyway once the web ships the slice, so deferring it moves the cost
  without saving it. The risk it carries, a phone keyboard that corrects
  a typed answer before the server sees it, is closed by rule 9 itself.
  Shipping Android first was not weighed further: the web screen is the
  quicker check of the contract, and the Android one follows it.
- **SM-2, fixed equal intervals, HLR** (§4.1). Rejected there: SM-2 is
  an unvalidated heuristic; equal intervals are defensible on Kim and
  Webb (2022) but blind to item difficulty; HLR is peer-reviewed but
  ranks below FSRS in the benchmark.

- **A server secret in the choice hash.** Rejected (#713): a secret
  mixed into the hash would hide the right choice from a client that
  reads the card alone, but not from one that reads the public lesson
  content, which pairs each word with its gloss, and a recall cannot
  be hidden that way at all. It would add a secret to manage and
  rotate for cheating that hurts only the cheater, since no reward one
  player takes from another rides on a review. Opaque, deterministic
  ids guard against the casual leak, which is the risk worth paying
  for.

## Consequences

- `packages/domain` gains the FSRS step and the derivations of
  retrievability and due, tested against fixtures computed from
  py-fsrs 6.3.2 with the pinned parameters and no fuzz. Parity needs
  `Math.E ** x` where Python writes `math.e ** x`, never `Math.exp`,
  and Python's round half to even for the interval; floating point may
  still differ in the last digits between CPython and V8, so stability
  and difficulty match to a relative 1e-9 and intervals exactly.
- Known gap: a card stored at a learning or relearning step that the
  terms later drop has no due instant, and the domain answers
  `UnknownMemoryStep` for it, where py-fsrs moves it to `review` at its
  next rating. The steps are fixed in S39, so no stored card can reach
  it; the fix waits for the first change of the steps.
- Postgres gains the cards, the pending reviews, the review log and the
  player's skill levels, keyed by the player, each a migration; the S39
  tickets are amended so that #712's schema carries all four. ADR 035's reset migration keeps them.
- A word's card enters only through a lesson finish. The cap on words in
  learning by the school's level (ADR 035) is not needed while lesson 1
  is the only lesson; it enters with lesson 2.
- With the defaults, a lesson answered Good throughout earns its skill
  at its second recall, about 13 days after it enters; a word recalled
  after a hint at day 2 can earn it at day 10, on its next unaided
  recall. A word whose last review was a Hard, or a recall within 7 days
  of the one before it, holds the skill back until its next unaided
  recall a week or more after its last review.
- FSRS's default parameters were fitted on single-format Anki reviews.
  Here a card's first reviews are recognitions, easier than its recalls,
  so early stability is likely optimistic. The owner's calibration
  (§8.2) reads the predicted against the true recall rate on recall
  reviews; per-player fitting (§4.4) corrects it with the log this ADR
  keeps.
- A player who holds two fiefs today earns a skill for both; ADR 035
  cuts the second fief, after which the player and the town are one.
- S39 serves the `es` gloss only; recognition and recall for the
  scaffold `none` are ADR 038's. The curriculum, lessons after lesson 1,
  the holdout and the content gate are ADR 037's, the gate's CI check
  included.
- The slice owes the Android verification row of
  `.claude/rules/verification.md` for its review screen, and its
  OpenAPI client is regenerated from the review routes.
- The PRD's acceptance criterion gains the review that falls due while
  the browser is closed when S39's slice ships (decisions.md §14.6).

## References

- py-fsrs 6.3.2, `fsrs/scheduler.py`, commit
  `9446cb06605c597a063aeee49f7d188d42e34dc2`, MIT:
  https://github.com/open-spaced-repetition/py-fsrs/blob/9446cb06605c597a063aeee49f7d188d42e34dc2/fsrs/scheduler.py
- The srs-benchmark, community-run and not peer-reviewed:
  https://github.com/open-spaced-repetition/srs-benchmark
- `docs/research/english-pivot/decisions.md` §1.1, §1.2, §1.6, §2.1, §4,
  §5.1, §6, §7.1, §8.2 to §8.4, §14, and `research.md` §1, §2, §7, §10
  (Webb, Yanagisawa and Uchihara 2020), §12, §14.
