---
status: proposed
date: 2026-11-05
---
# The first session

## Context

The owner played the MVP on production and could not find the English:
*en qué momento aprendo inglés*, *tiene que ser intuitivo todo, que el
usuario nuevo sepa a dónde ir*. Issue #829 designed the path from
sign-up to the first skill. On 2026-11-05 the owner accepted its four
recommendations (*dale vamos con eso*): a lesson's minutes teach its
words, food buys something, the 7-day retention rule stays, and English
word tags on the town wait for #745. This ADR records them, and the
card that tells a player where to go.

What trunk holds, checked at `ceb2bd4c`:

- **A lesson is a timer.** `LessonStateSchema`'s words are
  `{ wordId, isRetained }`, and a test refuses a lemma there (*rejects a
  lesson word that carries its lemma*). No screen shows a word before
  its first review, so the first contact is a recognition among five
  glosses, a guess.
- **Word content already travels.** `DueReviewSchema` carries `word`,
  `frame`, `gloss` and `gappedFrame`, and `LessonStateSchema` the
  `theme`. `ApiError` carries `{ kind, params }`, with no line.
- **The stored card separates what the path needs.** An unreviewed card
  has `lastReviewAt` and `stability` null (`MemoryCard.entered`).
  `isWordRetained` needs a `retainedAt` and a stability of 7 or more.
  `cardsInLearningOf` counts cards with no stability or one under 7.
- **Food buys nothing.** All 70 levels of the seven buildings in
  `apps/api/content/town/` cost `food: 0`. A town starts with 300 food
  (`town.json`) and homes and the school at level 1. Food accrues at the
  farm's rate, plus 5 per hour on fields; on river and hills a town
  without a farm makes none.
- **Cost columns exist.** `towns.work_cost_food` and
  `town_waiting_work.cost_food` are in `schema.ts`, and `Town.startWork`
  checks every resource of a cost alike.
- **Nothing says where to go.** The town home lists the seven places in
  `BuildingKindSchema` order, the school sixth. The school has no link
  to `/reviews`. The review screen's `nothingDue` state offers no way
  out. `TownOverview` holds neither a due count nor a next due instant:
  `GET /report` answers `dueCount`, `GET /reviews` answers `nextDueAt`.

## Decision

### A lesson's minutes teach its words

- **While a lesson runs, the player reads its words**: each word, its
  gloss and its frame, one at a time, with the place's art where the
  word names one. Lesson 1 runs 300 s at school level 1, 225 s in
  winter.
- **A word can be read from its lesson's start until its first
  review.** That span outlives the timer, so a player who leaves finds
  the words waiting, however short a high school level makes the
  lesson. After the first review a word cannot be read: the review
  asks, and the answer is no longer on the page.
- **Every door to the reviews goes through unread words first.** While
  due cards can still be read, the next step, the Report, the school's
  link and the finish notice open the first such lesson's words, at
  `/school/$lessonId`. Each lesson's way on goes to the next such
  lesson, in curriculum order, and after the last to `/reviews`, so a
  player who left never lands on the guess, however many lessons
  finished unread. The server cannot know what was read, so each word
  offers the way on once its lesson has finished, and a player who read
  them skips the rest.
- **Reading changes nothing.** It writes no rating, no card and no log
  row, and pays nothing (ADR 036, rule 5). The lesson finishes on its
  timer, read or not. Which word is on screen is client state.
- **A held-out word is never shown.** Showing it would break the
  comparison of cards plus reading against reading alone (ADR 037), so
  only `wordsEnteringOf` words can be read. Chrome lessons hold none.
- **A stopped lesson shows nothing**, as it enters no card (ADR 036,
  rule 6).

**The contract.** Each word of `LessonStateSchema` becomes:

```ts
{
  wordId: string,
  standing: 'notStarted' | 'recognize' | 'recall' | 'hold' | 'retained',
  reading: { word: string, gloss: string, frame: string } | null,
}
```

`reading` is non-null when the word is not held out and either its
lesson holds the lesson slot or its card exists and has no
`lastReviewAt`. A word with no card and no running lesson has none, so
a stopped lesson and an unstudied one show nothing. `word`
is `acceptedForms[0]`, as a recognition's is. `gloss` is the word's
support in the player's scaffold, so under `none` it is the definition,
as a recall's cue is (ADR 038, step 4). `isRetained` goes, replaced by
`standing: 'retained'`: no screen reads it today, and two fields would
say one thing.

**Against ADR 038's wire without prose.** There is no conflict. ADR 038
takes the game's own copy off the wire: refusals are `{ kind, params }`,
and "copy is not on the wire". A word, its gloss and its frame are
content (ADR 037): they live in the lexicon, never in the catalog, and
already travel on `DueReview`. The server picks them by scaffold, as
ADR 038 has it answer every word's support. The new field adds no
sentence of the game's.

**Against the lemma rule.** The test that refuses a lemma on a lesson
word goes, replaced by a narrower one. A recall holds no lemma, so its
answer is not on the wire. That holds: `reading` is null from a card's
first review, and a recall comes at least two reviews later.

### Food buys something

**Raising the homes costs food, from level 2.** The food to reach level
*n* is the money of level *n* − 1, about two thirds of level *n*'s
money, on the column's own 1.5 curve. Level 1 stays at 0, since a town
starts there and never pays it.

| Homes level | Money | Material | Food (new) | People supplied |
|---|---|---|---|---|
| 2 | 90 | 120 | 60 | 30 |
| 3 | 135 | 180 | 90 | 40 |
| 4 | 202 | 270 | 135 | 50 |
| 5 | 304 | 405 | 202 | 60 |
| 6 | 456 | 608 | 304 | 70 |
| 7 | 683 | 911 | 456 | 80, a city |
| 8 | 1 025 | 1 367 | 683 | 90 |
| 9 | 1 538 | 2 050 | 1 025 | 100 |
| 10 | 2 307 | 3 075 | 1 538 | 110 |

Food to the top is 4 493; to the city, 1 247. Why these numbers:

- **A new player needs no food skill and no farm for the first levels.**
  A founded town supplies 20 people and occupies 1. Farm, factory, power
  station, storage, school and office all at level 3 occupy 18, so no
  homes raise is needed until two of them pass to level 4 and a third
  follows. The 300 starting food pays homes levels 2, 3 and 4 (285),
  which supplies 50 people and leaves 15.
- **A new town can pay level 2 at once**: 400 money, 300 food, 200 power
  and 500 material become 310, 240, 200 and 380.
- **Food binds only until a farm stands.** With no farm, level 5 is
  refused, 187 food short, `NotEnoughResources`, so what food buys at
  this share is the first farm. With one, money binds: it is a flat 20
  per hour and food about two thirds of it, so food binds only under
  13.3 per hour, and any farm makes 25 or more. Farm, factory, then the
  homes, level 5 is paid at 22.05 hours with this food column or
  without it.
- **Storage binds no earlier than today.** Material already needs more
  than the base 1 000 from homes level 8, where food does not until
  level 9; at level 10 material's 3 075 needs storage level 3, food's
  1 538 storage level 2.
- **Food adds one dead end, far away.** The farm costs no food, so food
  alone never blocks it. On river or hills, with no farm, homes at level
  4 and the other five buildings at level 10, the town holds 15 food,
  makes none and has no free person: 50 people of 50.
- **Material holds a nearer dead end, shipped today and not caused
  here.** The farm costs 70 material, and only a factory or hills make
  any. On fields or river, farm 1, farm 2, homes 2 and homes 3 spend 475
  of the 500 and leave 25: the factory is 35 short, the power station
  55, storage 125, and the rate is 0, for good. It is the same on trunk
  with no food column. That is not acceptable for a new player; see
  *Open for the owner*.

**What the skill is worth.** In time, nothing at this share. Lesson 1's
+5 % takes a level 2 farm on fields from 60 to 63 per hour, which the
verdict can show, but money sets when a homes level is paid, so the
level comes at the same hour with or without it. This undercuts the
reason for the decision; see *Open for the owner*.

**Existing towns.** This is content, `homes.json` alone: no schema
change, no migration, no reset. A town keeps its levels and stocks, and
pays food from its next homes raise. Work in the slot or on the waiting
list was charged at the enqueue and keeps its stored cost, food 0, and a
stop refunds that stored cost (ADR 011). A town past level 2 has paid
nothing for what it holds and owes nothing.

### The 7-day rule stays, and the school path shows it

**ADR 036's rule 7 does not change.** The skill stays a proof of memory
a week after the review before it, so it cannot fit in the first
session. What the first session earns is the words.

**When the skill lands.** The owner kept rule 7 unchanged on 2026-11-05,
knowing what it allows. A player who answers every review on time, all
Good, earns the skill on day 13: that is the on-time date. Rule 7 counts
7 whole days after the review before, so the floor is day 7: a player
who skips the day 2 recall and answers Good 7 days and 10 minutes after
the lesson earns it then, 6 days sooner than one who reviews on time,
and a hint on day 2 lands it on day 10. **No screen promises a date**,
and no line of copy states one.

**The school path** shows a lesson's words moving, so a player sees
progress at every visit, long before the skill. Each word has one
**standing**, derived on read by a new domain function beside
`isWordRetained`, with no new column:

| `standing` | The card | What the player is doing |
|---|---|---|
| `notStarted` | none | the lesson is not finished |
| `recognize` | state `learning` | choosing the meaning |
| `recall` | past `learning`, stability under 7 | typing the word |
| `hold` | stability 7 or more, not retained | waiting for the recall a week on |
| `retained` | `isWordRetained` | done |

The path counts the words past each standing, *5 of 5*, among the words
the player holds: a held-out word stays `notStarted` and is not counted,
as the skill does not wait on it (ADR 039). Four facts follow from
deriving it:

- A wrong recall moves a word back, from `hold` to `recall`, because its
  stability falls. The path is honest and costs nothing; a skill already
  earned is never taken back (ADR 036, rule 7).
- A later Hard or Again clears `retainedAt`, a right answer after a hint
  included, so a word moves back from `retained`. A level already earned
  stays; a lesson still unearned waits on that word again.
- A player who comes back late can skip `hold`.
- The path shows standings and counts, never days away and never a run
  of days (PRD W10).

### Word tags stay out, for now

English word tags on the town (*home* beside *Hogares*) do not ship
here. They sit near ADR 038's rejection of a chrome that fades word by
word, so they are decided with #745, which owns the chrome phases. ADR
038 is unchanged.

### The next step

**Every town home shows one card first, the next step.** Its English
title is *What is next*: *step* is not among the chrome's 80 words, and
check 9 would refuse it (`docs/setting/chrome.md`). Its Spanish title is
*Tu siguiente paso*.

**The server answers it.** `TownOverview` gains `nextStep`, a union on
`kind`, computed by a domain function over what the read already holds,
so the web and Android draw it and neither decides it (N1). The first
state that holds wins:

| Priority | `kind` | When | The button goes to | It also says |
|---|---|---|---|---|
| 1 | `reviews` | a card is due | the first lesson of `readFirst`, else `/reviews` | how many; a running lesson's time |
| 2 | `lessonRunning` | the lesson slot is busy | the lesson's words | the producer to build, if any |
| 3 | `lessonToStudy` | the next lesson can start | the school | when the next review is due |
| 4 | `caughtUp` | none of the above | the Report | when the next review is due |

- **`reviews` wins over a running lesson**: the words are due now, and
  the lesson runs on its own.
- **A finished lesson is `reviews`**, since its cards enter due at its
  finish. `reviews` carries `readFirst`, every lesson holding a due card
  with no `lastReviewAt`, in curriculum order, empty when none, and
  `ReportSchema` carries the same list, so each door follows the rule
  above. It has to be a list: `admitSchoolLesson` ignores due cards, so
  two lessons can finish unread, and reading writes nothing, so a single
  lesson read again after its words would name the same lesson for
  ever.
- **`lessonRunning` names a producer** while the building that makes the
  lesson's skill resource stands at level 0 and no work is raising it:
  the farm for food, the factory for material, the power station for
  power, none for money. It gives the lesson's minutes a job, and a
  skill on a rate of 0 raises nothing.
- **`lessonToStudy` is the first unstudied lesson in `curriculum.json`
  order** that the school's level and the learning cap admit. It names
  the next review's instant so the player knows they can stop.
- **`caughtUp` means the player cannot start a lesson**: the cap is
  full, the school's level is too low or the lessons are done. At school
  level 1 the cap of 15 holds three lessons, until recalls lift words
  past stability 7.
- **`nextDueAt` joins it**, from `reviewsOf`'s logic, nullable as
  `Reviews.nextDueAt` is. A client that holds the page open re-reads at
  `lessonSlot.finishesAt` and at `nextDueAt`; no timer advances state
  (ADR 005).
- **The Report stays**: the reviews due, then the Town News (ADR 040).
  The card says where to go, the Report what happened.
- **A return visit shows the same card**: no greeting, no count of days
  away, no streak (ADR 027, PRD W10). A closed tab tells the player
  nothing; push stays out (PRD W6).

### What differs from the shipped screens

The tickets close each row. Web first; `apps/android/feature/town` takes
the town rows, and #771 and #775 take the school and the Report.

| Screen | Today | After |
|---|---|---|
| Sign-up, sign-in | *Funda tu feudo*, *Entra en tu feudo*, a `fiefName` field (#793) | no medieval word, no second name, one line saying what the game is |
| Shell | `shell.title` is *Vadoalto* | *Townword* |
| Shell | a running lesson shows at the school alone; no due count | the lesson's time on every signed-in screen; the due count on *Report*; a notice at a lesson's finish |
| Naming | form alone | the homes' and the school's art |
| Town home | no card; the school sixth; every place card with its own strong button | the next step first; the school first; the next step holds the one strong button; a place not built drawn with its art |
| School | every lesson listed, each with its button; the slot first on a phone; no link to `/reviews` | the next lesson first; its reward as one line, words to skill to rate; the school path; a link to the reviews when any is due |
| Lesson | no screen | `/school/$lessonId`: the words, one at a time, from `reading`, with the way on through `readFirst` once finished |
| Review, end | `nothingDue`, no way out | the next review, the school path, a way back to the town |
| Review, skill verdict | level and percent, no rates | `ratePerHourBefore` and `ratePerHourAfter`, already on the wire, and the lesson's words |
| Town stocks | no skill mark | the earned skill beside its resource |
| Report | *No tienes repasos pendientes ahora.* alone; its button always goes to `/reviews` | the next review's instant, and unread words first, so `ReportSchema` gains `nextDueAt` and `readFirst` |

Lesson order is not enforced: `admitSchoolLesson` admits any unstudied
lesson. The card and the school lead to the next one, and refusing the
others is left out here, since no owner decision covers it.

### Open for the owner

1. **The next step and the goals.** ADR 040 keeps ADR 027's *one next
   goal*, learning goals among them (*Study lesson 2*), and #791 puts it
   on the town home. `lessonToStudy` says the same thing, and two cards
   would each claim to be next. This ADR does not settle which yields.
2. **Food's share of the homes, and what the skill is for.** The owner
   accepted food so that lesson 1's skill would matter. With a farm
   standing it does not: timings match trunk's, and the +5 % saves 0
   minutes. A share *s* of the money makes food bind only under 20 × *s*
   per hour. Farm, factory, then the homes on fields, buying the moment
   stocks allow, with the +5 % held from the first hour, which no player
   has:

   | Share | Homes 2, 3, 4 food | The 300 pays | Food binds under | Farm 1: level 5 paid, saved | Farm 2 | Farm 3 |
   |---|---|---|---|---|---|---|
   | 2/3 (above) | 60, 90, 135 | three raises | 13.3 / h | 22.1 h, 0 min | 0 min | 0 min |
   | 1.5 | 135, 203, 303 | one | 30 / h | 26.6 h, 76 min | 0 min | 0 min |
   | 2 | 180, 270, 404 | one | 40 / h | 38.8 h, 111 min | 0 min | 0 min |
   | 3 | 270, 405, 606 | one | 60 / h | 63.1 h, 181 min | 91 min | 0 min |

   - **No share makes one level felt.** It shortens a wait on food by
     4.8 % at most, and a level 2 or 3 farm, 75 or 112 money, shrinks or
     removes the wait. The skill also lands late: from day 7 or day 13 it saves
     0 minutes at level 5 on every row, because those levels are paid
     by then. The first gain is at level 7, 26 minutes, share 3, farm 1,
     landing on day 7; level 10 at share 2 gains 13 hours or 6.
   - **Stacked, it is felt late, and only with a level 1 farm.** Rates
     sum, and food recurs at lessons 1, 5, 9 and 13, so the 16 shipped
     lessons give +20 %. At 2/3 that saves 0 at every homes level, even
     held from the first hour. Earned on time, on days 13, 15, 17 and 21,
     with farm 1 on fields, level 10 gains 10.4 hours instead of 6.1 at
     share 2, and 44.7 instead of 16.8 at share 3, and level 7 gains
     nothing. With farm 2 on fields it gains 0.
   - **A higher share costs a new player.** From 1.5 up the 300 pays
     one raise, not three, so homes level 3 waits on a farm: 1.3 hours
     at 1.5, 5 at 2, 12.5 at 3. The no-farm dead end falls from 50
     people to 30.
   - **Money binds, and no money skill rescues this.** Level 5 moves
     from 22.05 to 21 hours and level 10 from 346 to 330 only with the
     +5 % held from the first hour. Lesson 4 lands about day 15 on time,
     and this run pays level 10 at 14.4 days, so it saves 0 here. Even
     lesson 1 on money would save about 1.6 hours from day 13, at the
     price of ADR 039's *food first*.
   - **These are floors.** The run buys the moment stocks allow; a
     slower player still has more levels to pay when a skill lands.

   Recommendation: keep 2/3 and stop claiming a speed-up. It costs a
   new player nothing, and it makes the first farm necessary. Food's
   skill then shows as a rate on the verdict, not as a level sooner. No
   lever weighed here makes the first skill felt in time.
3. **The material dead end.** Shipped, and independent of food, but a
   new player can reach it by following the strong buttons. Recommended,
   content only: factory level 1 costs money alone, 60, so tax always
   reaches it. Then material flows, the farm follows, and only *no free
   person* is left.

## Worked examples

Each figure was computed with the domain's own functions on trunk's
content: `reviewMemoryCard`, `dueInstantOf`, `isWordRetained`,
`cardsInLearningOf`, `derivePeople`, `deriveResourceRates`,
`deriveLessonDurationSeconds`, `townLabelOf` and `Town.startWork`, the
last two with the homes' food column above applied to the catalog. All
instants UTC.

**A word's path.** Lesson 1 starts at 2026-11-10 08:55, a study percent
of 100, and finishes at 09:00. Its word can be read from 08:55 until
09:00 or later, when its first review is answered.

| Instant | Review | Stability | Due next | `standing` after |
|---|---|---|---|---|
| 11-10 09:00 | recognition, Good | 2.3065 | 11-10 09:10 | `recognize` |
| 11-10 09:10 | recognition, Good | 2.3065 | 11-12 09:10 | `recall` |
| 11-12 09:10 | recall, Good | 10.9710 | 11-23 09:10 | `hold` |
| 11-23 09:10 | recall, Good | 46.3169 | 2027-01-08 09:10 | `retained` |

Other paths from the 11-10 09:10 review:

- **A hint on 11-12**, Hard: stability 7.5174, `hold`, due 11-20 09:10.
  Good then: 26.4271, `retained`, day 10.
- **Wrong on 11-12**, Again: stability 0.6077, `recall`, due 09:20.
  Good then: 0.6598, due 11-13 09:20.
- **No review until 11-17 09:10**, Good: stability 21.4262, `retained`,
  7 days after the review before it. At 09:09 the same answer gives
  19.9057 and no `retainedAt`, at 6 whole days. Hard at 09:10 gives
  13.8051 and no `retainedAt`.

An exhaustive walk of recognition and recall ratings, each review at
its due instant or 7 days after the last, finds no retained word before
2026-11-17 09:10.

**The learning cap.** The word above counts as in learning until the
11-12 recall (stability 2.3065, then 10.9710), so at a cap of 15 a
fourth lesson is refused on day 0 and `caughtUp` shows.

**The food rate**, `deriveResourceRates` at 2026-11-23, food at 100 %:

| Terrain | No farm | Farm 1 | Farm 1, skill | Farm 2 | Farm 2, skill |
|---|---|---|---|---|---|
| fields | 5 | 30 | 31.5 | 60 | 63 |
| river, hills | 0 | 25 | 26.25 | 55 | 57.75 |

**Paying the homes.** The hours in this ADR come from a throwaway loop
in 30-second steps over `deriveResourceRates`, `deriveStorageCapacity`
and the content's costs, no season: farm 1, factory 1, then the homes,
with storage when a cost passes capacity, each paid the moment stocks
allow, with no other building, a power station added for share 3's level
10. Real players buy later. Stacked skills land on days 13, 15, 17 and
21: the cap takes three lessons every 2 days on time, so lessons 1, 5, 9
and 13 start on days 0, 2, 4 and 8. By hand, level 5
at a share too low to bind: 290 money after the farm and the factory, 65
after levels 2 and 3, 6.85 hours to level 4's 202, 15.2 to level 5's
304, 22.05 hours.

**The material dead end**, through `Town.startWork` with money set
aside, on trunk's content and with the food column alike: 500 material
falls to 25 after farm 1, farm 2, homes 2 and homes 3. The factory is
then refused 35 short, the power station 55, storage 125, farm 3 133.
`deriveResourceRates` at those levels gives material 0 on fields and
river, 5 on hills.

**The homes from 300 food**, money and material set aside: level 2
leaves 240, level 3 150, level 4 15; level 5 is refused, `food: 187`
missing. `derivePeople` supplies 30, 40, 50 and 60 at levels 2 to 5.
`townLabelOf` answers *town* at level 6, 70 people, and *city* at level
7, 80.

## Considered options

- **Keep the lesson a timer and teach through the first review.** A
  recognition with no prior exposure is a guess among five, and the
  owner could not find the English. Rejected.
- **Words readable at any time.** It would serve as a dictionary, but a
  word on hand before its review weakens the retrieval that the review
  exists for (ADR 036). Rejected for now; a screen can open them later
  without touching a card.
- **A separate lesson-words route** instead of a field on
  `LessonState`. A second read and a second shape for what the school
  already loads. Rejected.
- **A stored standing per word**, which would never move back. It needs a
  column and a write on every review for a value the card already
  holds. Rejected for derivation.
- **Reuse the word *stage*.** `CONTEXT.md` defines Stage as the lessons a
  player has studied. Rejected. *Path stop* collides the same way with
  **stop**, what ends building work, so the term is *standing*.
- **A progress bar of retained words, 0 of 5.** All five words become
  retained at about the same review, so it would sit at 0 for days and
  jump. Rejected.
- **Food on every building.** A larger sink, but a new town's first
  farm would cost the food it exists to make, and the seven cost curves
  would move at once. Rejected for the homes.
- **Food only through hires** (#777). Hires are not in the content, so
  lesson 1's skill would stay worth nothing until then. Rejected.
- **A cycle that starts with material.** It breaks *food first* (ADR
  039) and moves every lesson's skill. Rejected.
- **A larger food share.** See *Open for the owner*, question 2.
- **A next step computed by each client.** Two copies of one priority
  rule, on two clients. Rejected for the server's answer.
- **The card on every screen.** The town home is where a player decides;
  the shell's lesson time and due count serve the other screens.
  Rejected.
- **Word tags now.** See *Word tags stay out*; the owner sent them to
  #745.

## Consequences

- `packages/domain`: the standing function, the next step function, and
  the mapping from a skill's resource to its producer.
- `packages/contracts`: `LessonStateSchema`'s words as above;
  `TownOverview` gains `nextStep` and `nextDueAt`; `ReportSchema` gains
  `nextDueAt` and `readFirst`. The union carries `.meta({ id })`. The OpenAPI client is
  regenerated, so the Android row of `.claude/rules/verification.md` is
  owed.
- `apps/api`: `TownReading` gains the player's held-out words, which
  `schoolOverviewOf` needs and today does not load.
  `packages/contracts/CLAUDE.md` and `apps/api/CLAUDE.md` lose "never the
  lemma" for the narrower rule.
- `apps/api/content/town/homes.json` gains the food column; no
  migration. The web's `placeCardOf` and Android's cost lines show a food
  cost once it is above 0, with no new code.
- #777 re-runs the dead-end checks: hires occupy people, so they can
  reach *no free person* far below level 10.
- The homes' food column waits on question 2, and any fix of the
  material dead end on question 3.
- After homes level 10, food buys nothing again until hires or another
  sink exist. A town at the top holds it to no use.
- #745 owns the word tags, the `none` reading and the English of every
  new line. Each line passes check 9 in its ticket.
- ADR 040 and ADR 041 are amended, each passage marked inline: food's
  row, the lesson slot and the review door. ADR 036, ADR 037, ADR 038 and
  ADR 039 stand.

## References

- Issue #829 and the owner's decision comment on it.
- ADR 005, ADR 011, ADR 027, ADR 035, ADR 036 (rules 2, 5, 6, 7), ADR
  037 (the holdout, check 9), ADR 038, ADR 039, ADR 040, ADR 041.
- `packages/contracts/src/LessonState.ts`, `DueReview.ts`, `Reviews.ts`,
  `town/Report.ts`; `packages/domain/src/memory/reviewMemoryCard.ts`,
  `learning/isWordRetained.ts`, `learning/cardsInLearningOf.ts`,
  `learning/wordsEnteringOf.ts`, `town/derivePeople.ts`,
  `town/deriveResourceRates.ts`, `town/startSchoolLesson.ts`;
  `apps/api/src/learning/schoolOverviewOf.ts`, `reviewsOf.ts`;
  `apps/api/content/town/`; `docs/setting/chrome.md`.
- PRD W6, W10.
