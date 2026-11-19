---
status: accepted
date: 2026-11-18
---
# Content batches and texts

## Context

An audit on 2026-11-18 found that the learning content ends where it
begins. The owner, playing as a learner, finds the readings too simple
and sees no progress, and wants to come out able to use English:
phrases, phrasal verbs and usage included (ADR 044). Audio and
production stay out; the owner decides them separately. No issue holds
this decision; the pull request is its record.

ADR 048 lowered the learning cap's line from 7 days to 4, after this
audit was drafted. The *lessons run out on day 16* bullet and the
*What a batch buys* table below assume the 7-day cap, and ADR 048's
cap frees slots sooner, so both read as upper bounds on the days. The
first batch (lessons 28 to 47) merged on 2026-11-18 (#1285); the counts
below are those of lessons 1 to 27, the content the audit read.

What trunk held, checked at `8d895101`:

- **135 lexicon entries in 27 lessons.** The 16 chrome lessons teach 80
  words. Lessons 17 to 26 teach 50 band 1 words, ranks 30 to 123.
  Lesson 27 is a unit lesson of 5 units, in no band. ADR 045 and the
  audit counted band 1 at 55 in 11 lessons; the content holds 50 in 10,
  and ADR 045 now says so.
- **What is left.** Band 1 holds 941 card words, 875 of them outside
  the chrome lessons (`JsonLessonCatalog.test.ts`), so 825 are untaught:
  165 lessons. Bands 2 and 3 hold 989 and 806 outside the chrome: 197
  and 161 lessons. That is 2 620 words in 523 band lessons, before the
  unit lessons.
- **The bands ship in order.** `checkOrder` takes a lesson's band to be
  the first band with an untaught card word, so no band 2 lesson passes
  the gate until band 1 is taught.
- **Placement ships, and leads nowhere.** The api and Android serve it.
  A player placed out of band 1 meets the 16 chrome lessons, lesson 27,
  and then `caughtUp` with the reason `lessonsDone`.
- **The lessons run out on day 16** under the 7-day cap, before ADR 048. A school at level 1 holds 15 words
  in learning, three lessons. A word leaves learning at its first
  recall, 2 days and 10 minutes after its lesson. So a learner on time
  starts three lessons every 2 days, and the ninth and last trio on day
  16. From then on the school offers recalls only, about 13 and 59 days
  after a word enters (ADR 036).
- **Frames are short, and nothing asks them to grow.** The 135 anchor
  frames average 5.87 tokens as the gate counts them, and band 1's 50
  average 5.34, the longest holding 8. All 41 structures of
  `grammar.json`, A1.1 to B2.2, are admitted by lesson 16, so the
  grammar holds no frame back.
- **A taught word is seldom met again.** 8 of band 1's 50 anchor frames
  hold another band 1 word, and 15 of its 50 words stand in no other
  word's frame. The 160 later frames all belong to the 80 chrome words;
  the 50 band 1 words and the 5 units have one frame each.
- **No running text ships.** There is no text file under
  `apps/api/content/`, no schema, no route and no check 4. Town News is
  chrome templates (PRD S3), and the chrome's word list is closed at 80
  (`docs/setting/chrome.md`).
- **A word reading writes nothing** (ADR 042): no route takes it, and
  both clients keep the word on screen as local state. A review is a
  recognition or a recall (`ReviewFormat`); there is no third format.
- **Authoring so far.** #974 added ten lessons, 50 entries, in one
  commit, merged 2 h 27 min after it opened. #1043 added the 160 later
  frames in one commit, merged in 11 minutes. #1034 added lesson 27.
  Check 7 is delegated to an opus:high reviewer
  (`docs/agents/multi-session.md`). `.claude/skills/wave/SKILL.md`
  names no content ticket; Sonnet 5.5 drafted #974 and Opus 5.5 #1034
  (`docs/setting/lessons.md`).

## Decision

### Content grows in batches, one at a time

- **A batch is one pull request that appends 16 band lessons** in ADR
  037's order, with what belongs to them:
  - the unit lessons ADR 044's cadence puts among them, one after every
    4 band lessons while 5 ready units remain, so up to 4;
  - one text for every fourth band lesson, so 4 (below);
  - one later frame for every word and unit the batch before it taught,
    written for one of this batch's band lessons.
- **A batch is at most 100 cards**: 80 words and up to 20 units,
  twice #974. Its frames, anchor and later, are 155 in the first batch
  and up to 200 after it, against #1043's 160. The bound is what one
  reviewer reads in full, not what a drafter can write.
- **One batch is open at a time**, and the next ticket is filed when
  one merges. Two batches cannot be drafted side by side: each lesson's
  window is what the lessons before it left (check 2), each frame may
  hold only earlier words (check 3), and both write `words.json` and
  `curriculum.json`.
- **The band order stays** (ADR 037). Band 1's 825 words are 10 batches
  and a last one of 5 lessons; the three bands are 33 batches.
- **The drafter is a Claude Code authoring session** (ADR 037,
  Generation), which reads the PHaVE and PHRASE lists outside the
  repository (ADR 044) and names its model in the pull request body.
- **The first batch is lessons 28 to 47.** Band lessons 28 to 31, 33 to
  36, 38 to 41 and 43 to 46; unit lessons 32, 37, 42 and 47; texts for
  lessons 31, 36, 41 and 46; a later frame for each of the 55 entries
  of lessons 17 to 27. Its first lesson holds *through* (108), the head
  of band 1's window today.

### Who validates a batch

1. **The gate**, mechanically: checks 1, 2, 3, 5 and 6 as they stand,
   and check 4 and the text rule below.
2. **The delegated reviewer** (check 7, opus:high), in a session that
   did not draft the batch, reads every row and every text, never a
   sample. The pull request's table lists each entry's lemma, source,
   part of speech, frames, gloss and definition. The reviewer judges
   what the gate cannot: natural American English, that gloss, frame
   and definition name one sense, the tú rule, each `homographs` and
   `noCardSense` entry, each unit against its list, and that no text
   leans on a unit not yet taught.
3. **The learner**, after the merge. A wrong gloss or an odd sentence is
   an issue, as #1105 is, and is corrected in place: a card is keyed by
   the word's id, never its text (ADR 037, ADR 044). Check 8 is not
   built.

The owner keeps what ADR 037 and ADR 044 leave to the owner: the
models, and the lists' licence, due before the unit lessons pass a
list's first hundred units, which no batch before the fifth can reach.

### Texts

- **A text is a running English text of several sentences**, written
  for one band lesson, its `fromLessonId`, and shown at the school from
  the moment the player's stage reaches that lesson (ADR 037). It is the
  first kind of text to ship. It never replaces an earlier text: every
  text the stage has reached stays readable.
- **One text closes every four band lessons**, from lesson 31 on, and
  **holds every card word of those four lessons at least once**, in any
  form the grammar admits. So each band word is met again in running
  English within four lessons of its own, in a sentence nobody wrote to
  teach it.
- **A text holds no unknown token.** Every token is a frame word or an
  inflection admitted at or before its lesson, or a card word taught at
  or before it. Check 4 ships at zero, stricter than ADR 037's 5 %: the
  lexicon holds taught words only, so an unknown token would have no
  gloss to show, and this text is where known words are used, not where
  new ones arrive.
- **Lessons 17 to 26 get no text of their own**, because texts start
  at lesson 31. A text for them is the fourth open question.
- **It runs 80 to 150 tokens in band 1.** No study gives the length; the
  floor is what 20 words need. Bands 2 and 3 each set their own with
  their first batch.
- **It uses units as English does**: a unit an earlier unit lesson
  taught may be inflected, as *came back* is, or split around its
  object, which a frame never shows (ADR 044).
- **It names no one.** Its voices are `docs/setting/town.md`'s, by role.
- **It is content**, in `apps/api/content/lessons/texts.json` under the
  directory's licence: `{ id, fromLessonId, title, sentences }`, with
  the `homographs` and `noCardSense` a frame carries (ADR 038). The
  title follows the same token rule.
- **The wire sends it as spans**, each card-word token with its own
  support (ADR 038, amendment of 2026-11-12): beside the word under 7
  days of stability, on tap from 7, the English definition on tap from
  30. A held-out word is glossed beside, as a word with no card is
  (ADR 037).
- **The school lists the texts the stage has reached, newest first.**
  The next step's `caughtUp` and `lessonRunning` carry the newest one as
  a line, as they carry the building goal (ADR 042, ADR 045): a player
  with a full cap or a running lesson has something to read. The
  chrome's label comes from the 80 words, which hold *read* and *news*.

### What a read advances

**Nothing the server stores.** A text opens because the stage grew, and
reading it pays no resource, moves no card and earns no skill.

- The server cannot know a text was read (ADR 042), so a paid read is
  a paid tap.
- A reward for reading is the completion-contingent reward ADR 035
  refuses: retention earns skills, never currency.
- Questions after a text are a test about the text
  (`decisions.md` §1.4), and one that moved a card would review words
  that are not due (§1.2).

What moves the town is what moved it before: a due review turns a word
stable or retained, which opens building levels (ADR 045) and earns the
lesson's skill. A batch gives that loop 100 more cards. The text is
what the player can now do with the words.

### How difficulty is felt

Each is derived from the player's own memory; none is a setting.

- **Where the words start.** Placement puts a band out, as shipped.
  Unit lessons and texts are never placed out, so a player placed out
  of band 1 gets from every batch up to 20 units to learn and 4 texts,
  open at once.
- **The help goes away.** The same text shows its newest words glossed
  beside them on the day of the lesson, on tap after the first recall,
  and by an English definition once a word's stability passes 30 days
  (ADR 038).
- **The recall's sentence moves.** Every word gains a later frame one
  batch after its own, so a recall stops showing the sentence the word
  was taught in once the stage passes it (ADR 044).
- **The road is shown.** The school shows, for each band the player has
  started, the words the player holds of the band's card words outside
  the chrome lessons: at most 50 of 875 today, at most 130 after the
  first batch.

## Open questions

Four calls are the owner's:

1. **The PHaVE and PHRASE licence**, due before batch 5, the first
   that can pass a list's first hundred units.
2. **The `.claude/skills/wave/SKILL.md` row a batch takes**: its model
   and effort.
3. **Whether a read moves the town**, which reopens ADR 035's rule
   (*What a read advances*).
4. **A text for lessons 17 to 26**, which the one-in-four rule from
   lesson 31 leaves without one.

## Worked examples

Each is checked with the gate's own `tokensOf`, form list, frame-word
admissions, inflection admissions and `cardWordEndingOf`, on trunk's
content.

**A text within trunk's words.** Written for lesson 26, it holds all 20
card words of lessons 23 to 26: 114 tokens, 11 sentences, 70 distinct
forms, no unknown token.

> I work for a company in the city. I just started here, and I still
> have a lot to learn. The days are long, but I feel good. The people
> here are really good to me. Today the mayor came to the office before
> work. She wants to know how we use power, and she also wants a report.
> I did not know what to write, so a worker had to tell me what she
> means. Then he gave me a list. Even the mayor writes the same report,
> year after year, he says. It is too long to read in one day, but I
> will try. I think I will do well here.

The 20 anchor frames of those lessons hold 109 tokens between them, in
20 sentences that share no thread.

**What a batch buys.**

| Player | Cards in learning at once | A batch of 100 cards lasts |
|---|---|---|
| School level 1, on time | 15 | about 13 days |
| School level 4, on time | 30 | about 7 days |
| School level 10, on time | 60 | about 3 days |
| Placed out of band 1 | any | up to 20 cards and 4 texts |

Each row is 100 cards at the cap every 2 days (`school.json`). Band 1
at the first row's pace is 825 words in 110 days.

**The word need after the first batch.** Check 11 counts the chrome's
80 words plus a band's shipped words beyond its draw of 87
(`countedWordsOf`): 80 + max(0, 50 − 87) = 80 today, and
80 + (130 − 87) = 123 after lessons 28 to 47.

## Considered options

- **A bulk drafting script** (Groq, ADR 037's reserve), a band at a
  time. The drafter is not the constraint: #974 drafted ten lessons in
  one commit. The reviewer's full read is, and a script moves no row
  off it. Rejected; ADR 037's condition, volume outgrowing authoring
  sessions, has not been met.
- **Batches of 10 lessons**, as #974. Twice the pull requests, and a
  learner at school level 4 finishes one in under 4 days. Rejected.
- **A whole band in one pull request.** Over 800 entries in one table
  is a sample read, not a review, and one wrong frame holds the band
  back. Rejected.
- **Band 2 lessons now, for the placed player.** It needs check 2
  rewritten, and a band 2 frame written today could use 130 card words
  and none of band 1's other 825. What a placed player lacks is units
  and running text, which every batch brings. Rejected.
- **Units ahead of their cadence**, a unit lesson after every band
  lesson. ADR 044 set one lesson in five to spread the lists over the
  bands, check 2 holds its lower bound, and no inventory says how many
  units are ready. Rejected; a placed player still gets every unit
  lesson as soon as it ships.
- **A text per lesson.** 165 texts for band 1, each made to hold 5 new
  words: either short and thin, or four times the reading for the
  reviewer. Rejected for one text per four lessons.
- **A text that replaces the word reading**, the five new words met in
  a passage. First meetings keep one plain sentence each, where one
  context helps meaning most (ADR 044); five new words in 100 tokens is
  also check 4's whole 5 %. Rejected: the word reading stays as ADR 042
  has it.
- **Check 4 at ADR 037's 5 %.** An unknown token needs a lexicon entry
  that no lesson teaches yet, written a batch early and matched later.
  Rejected until a text exists to bring new words in.
- **A text opened by stable words**, not by the stage, so the day-2
  recall opens it. The player would first read it with the glosses on
  tap, a truer reading. But a lapse would close it again, or its
  opening would be stored per player and text, and a placed-out band
  would need its own rule. Rejected for the stage, which only grows;
  the fading support gives the same text both readings.
- **A read that pays, or a question that gates.** Refused under *What a
  read advances*.
- **The text's sentences as the words' later frames**, one sentence
  written once. A later frame holds its lemma once, in its own form,
  and stands alone, which a running text should not have to do; and a
  recall in a sentence already read is less of a new context, the gain
  later frames exist for (ADR 044). Rejected.
- **Job notices and requests as reading tasks**
  (`decisions.md` §1.4). They change what the map shows, and a notice
  is a few templates that do not grow with the bands. Not taken here;
  ADR 035's direction stands.
- **A stored mark of the texts read.** It would let the school say
  which are new. The newest text changes only when the stage grows, so
  the next step's line is new when it changes. Rejected until a screen
  needs more.
- **A difficulty setting.** FSRS, the support level and placement
  already answer per word. Rejected.

## Consequences

- Content tickets become a standing lane, one batch at a time, each
  about a week of lessons for a school at level 4.
- `packages/contracts` gains the text's content schema and its wire
  shape; `TownOverview` gains the open texts and the band line, and
  `NextStep` the text line. The OpenAPI client is regenerated, so the
  Android row of `.claude/rules/verification.md` is owed.
- `apps/api` loads `texts.json`, resolves its tokens as it resolves a
  frame's, and the gate gains check 4 at zero, check 6 over texts and
  the rule that a text holds its four lessons' words.
- No migration: a text's opening is the stage, derived on read.
- The holdout's reading-alone arm gains real reading: a held-out word
  now stands in texts, glossed.
- Past 80 retained words the town still asks for none (ADR 045). The
  first batch lifts check 11's count to 123, which is the moment ADR
  045 names to revisit the curve, in its own ADR.
- Every lesson's skill adds 5 % of the tax of 20, 1 money per hour
  (`town.json`, ADR 045), so a batch adds up to 20. The economy past
  lesson 27 is not sized here.
- The web is parked: its texts are their own tickets.
- A read still moves nothing in the town. If the owner wants it to,
  that reopens ADR 035's rule and is the owner's call.

## Slices, in order

1. **The first batch**, content only: lessons 28 to 47 and a later
   frame for each entry of lessons 17 to 27. The player sees 20 more
   lessons, 20 units among them, and band 1 recalls in new sentences.
2. **The first text, end to end on Android**: `texts.json` with the
   text for lesson 31, its schema, check 4, the school's list and the
   text's screen.
3. **The first batch's other texts**, for lessons 36, 41 and 46, with
   the gate's rule that a text holds its four lessons' words.
4. **The next step carries the newest text** on `caughtUp` and
   `lessonRunning`.
5. **The band line** on the school.
6. **The second batch**, texts included, and one batch per ticket
   after it.

## Follow-ups

Edits this pull request does not make:

- `CONTEXT.md`: add **Batch** and **Text**. **Content gate** and
  **Next step** gain the text.
- ADR 037: the *Texts* paragraph; check 7's table.
- ADR 036: a note for ADR 048, that a card in learning is one under 4
  days while rule 7's skill floor keeps 7.
- ADR 044: one later frame per entry, a batch after its own.
- `045-stable-words-open-the-town.test.ts`: 35 of its 46 tests fail on
  trunk, since they read the skill cycle that ADR removed.
- ADR 039: its estimate of 57 frame words and 877 band 1 words;
  `grammar.json` holds 59, so 875.
- ADR 042: the next step's table gains the text line.
- `docs/setting/lessons.md` records each batch; `docs/setting/town.md`
  says no character has a text yet.
- `docs/agents/multi-session.md`: the content lane. Which row of
  `.claude/skills/wave/SKILL.md` a batch takes is the owner's.

## References

- ADR 035, ADR 036, ADR 037 (the order, checks 4 and 7, Generation),
  ADR 038 (the support level, the amendment of 2026-11-12), ADR 039,
  ADR 042 (the word reading, the next step), ADR 044, ADR 045.
- `apps/api/content/lessons/` (`curriculum.json`, `words.json`,
  `grammar.json`, `lesson-17.json` to `lesson-27.json`),
  `apps/api/content/town/school.json`.
- `apps/api/src/contentGate/checkOrder.ts`, `checkFrames.ts`,
  `checkGrammar.ts`, `countedWordsOf.ts`, `tokensOf.ts`;
  `apps/api/src/adapters/json/JsonLessonCatalog.test.ts`.
- `packages/domain/src/learning/stageOf.ts`, `readableWordsOf.ts`,
  `ReviewFormat.ts`; `packages/domain/src/town/nextStepOf.ts`;
  `packages/contracts/src/LessonState.ts`, `FrameSpan.ts`,
  `NextStep.ts`.
- `docs/research/english-pivot/decisions.md` §1.1, §1.2, §1.4, §3.6;
  `research.md` §5; `docs/setting/chrome.md`, `docs/setting/town.md`.
- #974, #1034, #1043, #1105; PRD S3, S23, S24, N5, W10.
