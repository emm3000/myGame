---
status: proposed
date: 2026-11-12
---
# Multi-word units and later frames

## Context

The owner wants to come out of Townword able to use English, not only
to recognise single words (#1001). The curriculum teaches none of the
multi-word vocabulary that use needs: no *find out*, no *of course*.
Each word also carries one example sentence. Audio and production
(typing or saying an answer outside a recall) are out of scope; the
owner decides them separately. The owner delegated every branch. Each
rule below is decided on evidence, and the option it rejected is under
Considered options.

What trunk holds, checked at `e8d0a718`:

- **One lexicon entry, one lemma, one frame.** `LexiconEntrySchema`
  (`packages/contracts/src/LexiconContent.ts`) holds `lemma`,
  `partOfSpeech` (noun, verb, adjective or adverb), `frame`,
  `gappedFrame`, `gloss`, `definition`, `acceptedForms`, `homographs`
  and `isOffList`. `words.json` holds 130 entries across the 26 lessons
  of `curriculum.json`, 16 of them chrome lessons.
- **The gate reads one token per lemma.** `tokensOf`
  (`apps/api/src/contentGate/tokensOf.ts`) splits a text on `[a-z]+`,
  and `checkFrames` fails a frame unless exactly one token is the
  lemma, so a lemma of two words fails check 3. `checkLexicon` fails a
  lemma that is neither an NGSL headword nor marked off-list.
- **A lesson's band is its lowest NGSL rank.** `bandOfTaughtLesson`
  (`apps/api/src/adapters/json/JsonLessonCatalog.ts`) throws at
  start-up for a lesson after the chrome lessons that teaches no NGSL
  word. `bandOfLesson` answers `undefined` for a chrome lesson, and
  `startSchoolLesson` draws no holdout then. The holdout draws
  `Headword`s from `wordsOfBand`, which lists the NGSL file's headwords
  only.
- **The near-miss and the hint read the whole answer.**
  `gradeTypedAnswer` (`packages/domain/src/learning/gradeTypedAnswer.ts`)
  takes an answer at optimal-string-alignment distance 1 from a form of
  4 characters or more as a near-miss, unless the answer is an NGSL
  headword. `requestHint` answers `{ firstLetter, letterCount }` over
  the normalised form, a space included (`ReviewHintSchema`).
- **The wire carries one frame.** `DueReviewSchema`
  (`packages/contracts/src/DueReview.ts`) sends a recognition's `word`
  and `frame` and a recall's `gloss` and `gappedFrame`. The reading of
  ADR 042 sends `{ word, gloss, frame }`. The review log
  (`ReviewLogEntry`) records no frame.
- **The grammar inventory already admits two particles.** Its structure
  *Particles of phrasal verbs* (CEFR-J item 55) admits *up* and *out*
  as frame words from lesson 1. *on*, *in* and *over* are frame words
  too, as prepositions. *back* (rank 94) is a card word of lesson 11,
  and *down* (109), *off* (150), *around* (170) and *away* (234) are
  untaught card words.
- **The chrome already holds units.** `packages/catalog/en.json`
  writes *come back* in four forms (*come*, *comes*, *came*, *coming
  back*, 14 times in all), *at least* twice and *no longer* twice, each
  read by check 9 as its separate words.
- **Lessons start in any order.** `startSchoolLesson` refuses a lesson
  already studied or under study, never one whose predecessor is
  unstudied. The next step offers the first lesson it admits, in
  curriculum order (`nextStepOf`).

The evidence (`docs/research/multi-word-units.md`):

- **The two lists.** The PHRASE List (Martinez and Schmitt 2012): 505
  non-compositional expressions from the British National Corpus, each
  at least as frequent as the 5 000th BNC word family (787 per 100
  million), placed in the 1K to 5K band it matches, with no meanings.
  It holds phrasal verbs too, about 80 by the brief's count. The
  authors call it of very limited use for spoken American English. The
  PHaVE List (Garnier and Schmitt 2015): Liu's (2011) 150 phrasal verbs
  (at least 10 per million in COCA or the BNC, 62.95 % of the BNC's
  phrasal-verb occurrences) with 288 senses from COCA. Each sense has
  its share of uses, a definition and one example sentence written by
  the authors. It is American.
- **Neither list carries a licence.** No licence is stated on the
  authors' page. The PHRASE article is © Oxford University Press 2012,
  the PHaVE article © The Author(s) 2014, published by SAGE. The files,
  their definitions and their examples cannot enter a CC BY-SA 4.0
  directory. No licensed American alternative
  exists: the NGSL site publishes no multi-word list, and COCA's
  n-grams are paid data with no stated terms.
- **Why units matter.** Adult learners reading texts made of the top
  2 000 words understood significantly less when the words formed
  expressions (*by and large*), and overestimated what they understood
  (Martinez and Murphy 2011, Portuguese speakers). Formulaic sequences
  are read faster than matched free phrases by native and non-native
  readers (Conklin and Schmitt 2008). Students on BA English or TEFL
  courses knew about 40 % of PHaVE's senses (Garnier and Schmitt
  2016). No avoidance study tests Spanish speakers. Spanish has no
  phrasal verbs, and learner corpora show Spanish writers using fewer
  *out* verbs (Alejo-González 2010), so underuse is the expected risk.
- **Varied example sentences.** A meta-analysis of 20 studies finds a
  benefit of contextual diversity on word learning, d = 0.44, with an
  L2 subgroup of 4 studies (Chen, Miller and Ke 2026). Preregistered
  studies find no effect of diversity on learning a word's form, a
  benefit for meaning in new contexts, and an advantage for one
  consistent context in familiar ones (Norman et al. 2023, Li et al.
  2024). Most of this is first-language reading of pseudowords. No
  study gives a number of sentences; designs used 4, 6 or 10.

## Decision

### Two kinds of unit

- **A multi-word unit (a unit) is a card word of two or more words**,
  a lexicon entry like any other, with one opaque id, one card per
  player, recognition then recall, and a skill through its lesson. Its
  `lemma` is its words in base form, separated by single spaces:
  `find out`, `of course`. It keeps every id rule of ADR 037, and it
  needs no new entity, table or wire field: a card, a review and the
  log key on the word id, never on its length.
- **A phrasal verb is a unit of the PHaVE List**: a lexical verb and an
  adverb particle, taught in one sense, the list's most frequent one.
  The PHaVE List is the source for this kind: it is the one list built
  for teaching, it is American, and it ranks senses by share of use.
- **A phrase is a unit of the PHRASE List that is not a phrasal verb
  of the PHaVE List**, taught in one sense. The PHRASE List is the
  source for this kind: no American list of non-compositional
  expressions exists. An item that is only British in use is left out.
  A PHRASE item that is a phrasal verb enters only as PHaVE's, so no
  unit is taught twice. A sense the PHRASE List tags (*get to*,
  'arrive at') is the one taught.
- **A unit's every word is an NGSL headword or a frame word**, so the
  bands can teach it. A unit with any other word stays out.
- **An entry says which list names it**: `source` is `phave` or
  `phrase`, absent on a single word. The gate reads it, and the owner
  checks it against the authors' list in the pull request (check 7).
  The lexicon copies no list file, no rank, no definition and no
  example from either list. Townword writes its own gloss, definition
  and frames for every unit, under the directory's CC BY-SA 4.0 like
  every other entry (ADR 037). The lists are cited as the evidence that
  each unit is frequent.

### Unit lessons and their order

- **A unit lesson teaches 5 units under one theme**, never a semantic
  set, and holds no word of one word, so a lesson whose words are all
  units is a unit lesson and every other lesson is not; no field marks
  it. The last unit lesson the curriculum ever needs may take 5 to 9,
  as a band's last lesson does; with no inventory the gate cannot tell
  the last one, so it accepts 5 to 9 units in any unit lesson. A chrome lesson and a band lesson teach
  no unit.
- **No two phrasal verbs of one unit lesson share their verb.** *go
  on*, *go out* and *go back* differ in one particle. ADR 037 keeps
  semantic sets out of a lesson for the interference between items
  learned together (Nakata and Suzuki 2019), and forms this close are
  read here as the same risk; no study in the brief measures it.
  Recognition offers the lesson's other units as its choices (ADR 036,
  rule 3), so a lesson of three *go* verbs would test the particles
  against each other on day one.
- **A unit is ready once every word of it is a frame word admitted at
  or before the lesson, or a card word an earlier lesson teaches.** A
  unit lesson teaches only ready units, so no unit is read before its
  words.
- **No unit inventory ships, so the order among ready units is the
  drafter's.** A gate rule like ADR 037's window needs the list of
  units not yet taught, and that list is the lists' contents, which the
  repository may not hold (below, The inventory). The drafting session
  takes, among the ready units, the most frequent first by the lists it
  reads outside the repository, and the owner's review (check 7) reads
  each unit lesson against them. No rule merges the two lists, since
  they count different corpora: which of a ready phrasal verb and a
  ready phrase comes first is the drafter's call, judged by the owner. The gate checks only what the shipped
  content holds: readiness, the lesson's size, the shared verb and the
  spacing below.
- **From the curriculum's first unit lesson on, a unit lesson comes
  after every 4 band lessons while ready units remain untaught**, so
  one lesson in 5 teaches units. The gate checks the lower bound, at
  least 4 band lessons between two unit lessons, since the upper one
  needs the inventory; the drafter keeps the cadence. The first unit
  lesson is appended after the last lesson shipped when it ships, and
  no shipped lesson moves, since a lesson's skill follows from its
  position in the cycle (ADR 039).
- **A unit lesson belongs to no band.** `bandOfLesson` answers
  `undefined` for it, as for a chrome lesson. It starts no band, it
  draws no holdout and it is never placed out.
- **The inventory.** A shipped list of the lists' units with their
  ranks would let the gate check the order as ADR 037's window does.
  Bare facts such as which phrase occurs how often carry no copyright
  in the US (*Feist v. Rural*, 1991), but the lists were built with
  substantial work (PHRASE hand-checked about 15 000 candidates; PHaVE
  coded 200 concordance lines per verb), and the lists are published
  from the UK, where the database right may cover extracting a
  substantial part of such a database. This ADR does not settle that; it is a legal
  question and the owner's, and asking the authors is outward-facing.
  So no inventory ships, nothing here depends on one, and the lexicon
  adds a unit only when a unit lesson teaches it.
- **The stage skips unit lessons.** A unit lesson adds no token that a
  frame or a text may hold, since its words were known before it. So it
  never widens what the player reads, and an unstudied one must not cut
  the prefix. The stage is the prefix of band and chrome lessons
  studied or placed out of, with every unit lesson left out of it.
- **A unit lesson earns its skill like any lesson**, by its position in
  the cycle (ADR 039).

With the content of trunk, the first unit lesson goes at position 27,
after `lesson-26`. Its skill is power, because cycle index
(27 − 1) mod 4 = 2 names `power`. Band lessons take positions 28 to 31,
and the next unit lesson takes 32. A unit's readiness, read from trunk's
lessons: *go* is taught by `lesson-2` and *on* is admitted at `lesson-1`,
so *go on* is ready from position 3. *find* is taught by `lesson-22`, so
*find out* is ready from position 23. *give* is taught by `lesson-25`,
so *give up* is ready from position 26. *pick* (rank 583) is taught by
no lesson yet, so *pick up* is not ready.

### The measures

- **A unit counts in no band measure**, as an off-list word counts in
  none (ADR 037). It has no NGSL rank, and the bands are the UVLT's
  1 000-word levels over single lemmas.
- **Placement never samples a unit.** Its format is meaning recognition
  of single words after the UVLT (ADR 037). A band passed proves its
  words, not the units built from them. Its unit lessons, belonging to
  no band, stay in the curriculum for the placed player. As trunk
  ships it, the next lesson is the first one the player has neither
  studied nor placed out of: `nextStepOf` passes over the lessons of a
  placed-out band only, so an unstudied chrome lesson, never placed
  out, still comes first, and the chrome stays Spanish until every
  chrome lesson is studied (ADR 038). A unit lesson belongs to no band,
  so it is never passed over: a player placed out of band 1 meets the
  unit lessons before band 2's first lesson. `nextStepOf` needs no
  change for this; ADR 037's rule gains that clarification. Students on BA English or TEFL courses knew about
  40 % of PHaVE's senses (Garnier and Schmitt 2016).
- **The holdout never draws a unit, and holds back a unit with a
  held-out word.** The draw takes the band's NGSL headwords
  (`wordsOfBand`), and a unit is none. But the recall of *give up*
  retrieves *give*, so a card of it would practise a word the player
  must only read. A unit any of whose words is held out for the player
  enters no card, as a held-out word enters none (`wordsEnteringOf`),
  and its gloss is not among that player's recognition choices; the
  lesson's skill waits on the units the player holds, and on at least
  one (ADR 037). It enters with the release of its last held-out word
  (#804), in that word's released lesson, earning no skill. The other
  way round, a player who studies a unit lesson ahead of a band's first
  lesson, which `startSchoolLesson` allows, holds unit cards on that
  band's words before its draw: the draw skips every word an entered
  unit card of the player holds, so no held-out word is already
  practised.

### The card of a unit

- **Recognition shows the unit and its anchor frame.** It offers the
  unit lesson's glosses, or its definitions under `none` (ADR 036,
  rule 3; ADR 038). **Recall shows the unit's gloss and a gapped
  frame**, and the player types the whole unit.
- **A frame holds its unit once, its words together and in their own
  form.** The gapped frame replaces each word of the unit with `____`,
  so the gaps say how many words to type, as one gap says one: *She
  will not give up.* is gapped *She will not ____ ____.* A phrasal
  verb is never split around its object in a frame, since the recall
  types it as one answer.
- **The typed answer is compared as today** (ADR 036, rule 4): NFC,
  ’ read as ', trimmed, inner spaces collapsed, lower case, against
  the lemma and any accepted form.
- **A near-miss of a unit is a slip inside one of its words.** The
  answer has the unit's words, all equal but one, and that one is a
  near-miss of its counterpart by ADR 036's rule: distance 1, a
  counterpart of 4 letters or more, and the answer's word itself no
  NGSL headword. The unit typed with one space dropped is a near-miss
  too. A slip in a particle of 2 or 3 letters (*up*, *on*, *in*, *out*,
  *off*) is never one, by the 4-letter floor, so swapping one short
  particle for another is Again: the particle is the meaning. A slip in
  a longer one is a near-miss under the same rule: *go bakc* for *go
  back*. For a single word the rule is ADR 036's, unchanged.
- **A hint answers each word's first letter and letter count**, in
  order. `ReviewHint` becomes `{ words: [{ firstLetter, letterCount }] }`,
  one element for a single word. That is a contract change, and the
  OpenAPI client and both clients follow.
- **The scaffold fades for a unit on its own card only**: its reading,
  its reviews and its lesson's words follow its card's stability under
  ADR 038's table, the gloss beside it under 7 days, on tap from 7, the
  English definition on tap from 30, the definition throughout under
  `none`. Game text marks support per token, as ADR 038 has it, and
  never matches a unit across tokens: a span would have to read
  inflected forms (*came back*) and split ones (*give it up*), and no
  running text ships yet to need it.
- **A unit's definition holds none of the unit's card words in any
  form**, besides ADR 037's defining vocabulary of frame words and
  band 1. Under `none` the definition is the recall's cue, and a
  definition holding *find* would give half of *find out* away.

Worked examples, each checked against `gradeTypedAnswer`,
`alignmentDistanceOf` and `requestHint` as trunk writes them and the
rule above:

| Unit | Answer | Today | This ADR |
|---|---|---|---|
| give up | `give up` | correct | correct |
| give up | `gve up` | near-miss (distance 1) | near-miss: *gve* is one deletion from *give*, 4 letters, no headword |
| give up | `giveup` | near-miss (the space deleted) | near-miss: one space dropped |
| go on | `go in` | near-miss: distance 1 from a form of 5 characters | Again: *in* against *on*, a counterpart of 2 letters |
| give up | `give in` | wrong (distance 2) | Again |
| pick up | `pack up` | near-miss: distance 1, and *pack up* is no headword | Again: *pack* is an NGSL headword (rank 1387) |

For *give up*, `requestHint` answers `{ firstLetter: 'g',
letterCount: 7 }` today, the space counted. This ADR answers
`{ words: [{ firstLetter: 'g', letterCount: 4 }, { firstLetter: 'u',
letterCount: 2 }] }`.

### The content gate

The checks of ADR 037 extend as follows. Each extension ships in the
ticket that first needs it.

1. **The lexicon holds** (check 1): a lemma of more than one word
   carries a `source`, and a single word carries none. Every word of a
   unit is an NGSL headword or a frame word. No unit is marked
   off-list.
2. **The order holds** (check 2): chrome and band lessons teach no
   unit. A unit lesson teaches 5 to 9 ready units and no single word.
   Its phrasal verbs share no verb. At least 4 band lessons separate
   two unit lessons.
3. **The frame rule** (check 3) reads a unit's words as one lemma that
   is held once, together, in their own form, with one `____` per word
   in the gapped frame. Every other token follows ADR 037's rule.
4. **Glossary completeness** (check 5): a unit's definition holds none
   of its card words.
5. **The chrome's words** (check 9) are unchanged. A chrome lesson
   teaches no unit, and check 9 reads tokens, so a unit neither passes
   nor fails it. *come back* in the chrome is read as two known words,
   and it is literal. *at least* and *no longer* are not, and the gate
   cannot tell the two kinds apart without an inventory, so the owner's
   review (check 7) judges chrome copy that leans on an opaque unit.
6. **The owner's review** (check 7) lists every unit with its source
   list, and every ready item of the lists, more frequent than the
   units taught, that the pull request leaves out, with the reason: British only, a structure of the
   grammar inventory (*going to*), already taught by a word's frame
   (*a lot of*, by *lot*).

### Frames: one anchor and up to two later frames

- **Every word and every unit carries 1 to 3 frames.** The **anchor
  frame** is written for its lesson and checked by ADR 037's frame rule
  at that lesson. Up to 2 **later frames** each name a later band or
  chrome lesson they are written for, `fromLessonId`, and are checked by
  the same rule at that lesson: frame words admitted at or before it,
  card words taught before it. Neither a unit lesson nor any lesson at
  or before the word's own can be named.
- **The anchor frame is what a word reading and a recognition show**
  (ADR 042, ADR 036, rule 2). The first meetings keep one consistent
  sentence, where one context helps meaning most (Norman et al. 2023,
  Li et al. 2024).
- **A recall shows a later frame once the player's stage reaches its
  lesson, and the anchor frame while none does.** Among the later
  frames the stage admits, the recall takes the one with the lowest
  hash of the word id, the frame's position and the card's key instant
  (`lastReviewAt`), mixed by `mixed32`, as recognition orders its
  choices (ADR 036, rule 3). The choice holds across re-reads and
  changes after every review. A recall is where a varied sentence
  pays: it asks for the meaning to carry the retrieval in a new
  context, the gain the evidence finds, while diversity is not claimed
  to help form.
- **Every frame stays inside the stage.** A later frame is shown only
  from its lesson, and the anchor frame's rule pins it to the lessons
  before its word's. A player who studies ahead of the order, which
  `startSchoolLesson` allows, meets an anchor frame past the stage.
  That happens today, and ADR 037's gloss for a token with no card
  covers it when glossed frames ship.
- **Three, not more.** Under the defaults a card answered Good meets
  its recalls about 2, 13 and 59 days after it enters (ADR 036's worked
  example: due 2026-11-12, 2026-11-23 and 2027-01-08 after a lesson on
  2026-11-10). Three recalls in two months cannot show more than three
  sentences, and the hash may show one twice, so a third later frame
  would most often stay unseen that long, while each frame is one more
  line for the owner to review (check 7). No study gives the number.
- **A word's frames keep their positions.** A frame may be corrected in
  place, never reordered or removed, so the hash keeps choosing the
  same sentence for the same review.
- **The review log records the frame shown**, as the player saw it:
  the gapped text for a recall, the full text for a recognition. Every
  row from the change on holds it (ADR 036, rule 8), so calibration
  and check 8 can tell a hard word from a hard sentence. Rows written
  before it hold none.
- **A due review keeps the frame it first showed.** The server stores
  that frame's text on the card's pending review (ADR 036) at the first
  read that shows the review, and every later read shows it again. A
  hint and a near-miss keep it, and the rating copies it into the log
  and deletes the pending review, so the next review chooses anew. The
  stage can grow between a read and its answer, when a lesson finishes
  or a band is placed out of, so a frame chosen again at the answer
  could be one the player never saw. A frame corrected in place
  reaches a due review only after its rating, since the log holds the
  text the player saw. An answer to a review no read has shown since
  this change logs no frame. ADR 027 (Decision 9) refuses a GET that
  writes, because a read in another tab, a prefetch or a reload would
  record an act the player never made. This write is safe from that:
  the stored frame is what every later read shows, so a read nobody
  looked at changes neither what the player then sees nor what the log
  then holds, and the storage itself keeps the first frame against any
  later write.
- **The lexicon entry's `frame` and `gappedFrame` become `frames`**, a
  list of 1 to 3 `{ frame, gappedFrame }`, each later one with its
  `fromLessonId`. The anchor frame comes first, and no other field
  keeps the old shape (rebuild, never adapt). The wire keeps one
  `frame` or `gappedFrame` per review, chosen by the server, so no
  client changes for later frames.

## Considered options

- **Units as a new entity beside words** (an *expression* with its own
  id space, table and routes). Every rule a card follows would be
  written twice, and the review log, the pending review and the hint
  route already key on a word id that says nothing of length. Rejected
  for a unit as a lexicon entry.
- **A shipped unit inventory with the lists' ranks.** It would let the
  gate check the order among units as ADR 037 checks words. Rejected
  until the owner settles whether it may ship (The inventory); nothing
  else depends on it.
- **A unit with a held-out word entered anyway**, its contamination
  accepted. Every such card would practise a withheld word, and the
  phrasal verbs are built on band 1's most frequent verbs, the ones the
  holdout draws from. Rejected for holding the unit back.
- **Units matched as spans in game text**, so a unit fades in text too.
  Rejected until a running text ships: it needs inflected and split
  forms matched, and every unit's words are known when it is met.
- **Units mixed into band lessons.** A band lesson of 4 words and 1
  unit breaks check 2's count of a band's words. It also puts a unit
  among a lesson's recognition choices against single words, which
  tests the form more than the meaning. Rejected for unit lessons.
- **Units ranked into the NGSL order** (the PHRASE List's integrated
  rank, or PHaVE's frequency per million matched against the NGSL's
  `Adjusted Frequency per Million (U)`). The ranks would have to be
  copied from lists with no licence. The two lists count different
  corpora, BNC families and COCA lemmas, and the NGSL counts neither.
  And a unit cannot be read before its words, so readiness binds
  first. Rejected for readiness order, with the lists deciding
  membership.
- **One unit lesson in 8 or 10**, spreading fewer units further. The
  lists hold up to some 575 units, 150 phrasal verbs and the PHRASE
  List's 505 less the phrasal verbs it shares, or at most about 115
  unit lessons once the component rule and the British items take their
  share; the bands hold 533 band lessons (ADR 039). One in 5 spreads
  that inventory over the bands, where a sparser cadence would leave
  the last units past band 3. The owner's goal, using English, also
  wants them early, and they are cheap early: their words are known.
  Rejected for one in 5.
- **Every sense of a phrasal verb** (PHaVE's 288). A card per sense
  would ask a recall from two glosses for one typed answer, and the
  senses past the first are each at most half the uses. Not taken now;
  a second sense is a later entry with its own id if the log shows the
  need.
- **Only the PHRASE List's first bands.** Its bands count BNC word
  families, which the NGSL does not count, so a cut by band draws a
  line the gate cannot check from shipped data, and it would need the
  list's band copied. The component rule already keeps out a phrase
  whose words the bands do not teach. Rejected.
- **Gardner and Davies (2007) or Liu (2011) as the phrasal-verb
  source.** Both exist only inside articles under copyright, and
  neither ranks senses. PHaVE carries Liu's 150 with senses. Rejected.
- **An untaught unit refused in every frame and text.** It would catch
  opaque units that known words hide (Martinez and Murphy 2011). But
  both lists hold literal units too, the chrome uses *come back*, and
  the gate cannot tell literal from opaque. Rejected for the owner's
  review.
- **Units in the holdout.** A second comparison, units practised
  against units read. It would need its own draw, its own checks and a
  sample of a few dozen per player. Rejected: every unit is practised.
- **Placing a band's units out with it.** That keeps the stage a plain
  prefix, but placement tests words, and a placed learner would skip
  the units the evidence says learners lack. Rejected for unit lessons
  in no band and a stage that skips them.
- **A near-miss over the whole answer**, today's rule. *go in* for *go
  on* would earn a second try, though the particle is the meaning.
  Rejected for the slip inside one word.
- **A mask hint** (`g___ u_`). One string is simpler on the wire, but a
  screen reader reads underscores as noise. Rejected for one first
  letter and count per word.
- **One frame per word**, today. It is the anchor, and it helps meaning
  in that sentence, but a recall from one gapped sentence for a year
  can be answered from the sentence instead of from the gloss. Rejected
  for later frames in recall.
- **Rotating frames in every review, recognition included.** A new
  word met in a new sentence each time is learned more slowly, and a
  consistent context anchors it first (Pagán and Nation 2019; Li et al.
  2024). Rejected for the anchor frame on reading and recognition.
- **A fixed rotation**, the frame after the last one shown. It needs the
  last frame on the card, and ADR 036 keeps the card FSRS state alone,
  or a read of the log, which the domain never reads. Rejected for the
  hash of the key instant, which may show one frame twice in a row.
- **The shown frame chosen again at the answer.** It needs no stored
  row, but the stage can grow between the read and the answer, and the
  log would then hold a frame the player never saw. Rejected.
- **The shown frame sent back by the client with the answer.** The
  client would name what the server chose, against N1, and the answer's
  wire shape would change for both clients. The answer already refuses
  a rating of its own. Rejected.
- **The shown frame derived from the stage at the card's due instant**,
  so the read and the answer compute the same one and nothing is
  stored. It needs the stage as of a past instant, and a content or
  terms change deployed between the read and the answer still moves
  the choice. Rejected for the frame kept on the pending review, which
  already carries the hint and the near-miss to the log.
- **Frames as stage-gated text variants** without a cap. Unbounded
  owner review, and frames no recall reaches for months. Rejected for
  three.
- **Ask the lists' authors for a licence.** It would let Townword ship
  the lists and their ranks, but it is the owner's outward-facing
  decision, and nothing above needs it. Left to the owner.

## Consequences

- `LexiconEntrySchema` gains `source` and replaces `frame` and
  `gappedFrame` with `frames`. `JsonLessonCatalog` answers
  `bandOfLesson` `undefined` for a unit lesson instead of throwing. The
  domain's `LessonWord` carries the frames, and the review derivation
  chooses one.
- `gradeTypedAnswer` and `requestHint` change for units;
  `ReviewHintSchema` changes shape, the OpenAPI client is regenerated,
  and Android's and the web's hint lines follow.
- The review log and the pending review each gain a column for the
  frame shown, one migration. A read of the reviews or of the Report
  writes a pending review the first time it shows a due card.
- ADR 036's rules 4 and 8, ADR 037's frame rule, order, stage,
  placement and holdout, and ADR 039's lesson counts read units and
  later frames as above. Their status lines say so.
- ADR 039's count of lessons, 549, gains the unit lessons: at most
  about 115, fewer by what the component rule and the British items
  leave out. Each
  earns a level like any lesson, and the levels still add up.
- A player placed out of band 1 meets the ready units before band 2.
- `docs/setting/lessons.md` records each unit lesson as it records a
  band lesson, with each unit's source.
- The lists carry no licence, so the repository never holds their files,
  ranks, definitions or examples, and no inventory of their units. A
  lexicon that teaches most of a list's units over the years holds most
  of its contents; whether that is permitted, and whether to ask the
  authors, is the owner's call before the unit lessons pass a list's
  first hundred units.
- PRD rows S23 (units) and S24 (later frames) are added, *not yet
  shipped (ADR 041)*.

## References

- `docs/research/multi-word-units.md`, the evidence brief for this ADR,
  with every source's verification status.
- Martinez, R., and Schmitt, N. (2012). A phrasal expressions list.
  *Applied Linguistics*, 33(3), 299–320.
  https://doi.org/10.1093/applin/ams010
- Garnier, M., and Schmitt, N. (2015). The PHaVE List. *Language
  Teaching Research*, 19(6), 645–666.
  https://doi.org/10.1177/1362168814559798
- Garnier, M., and Schmitt, N. (2016). Picking up polysemous phrasal
  verbs. *System*, 59, 29–44. https://doi.org/10.1016/j.system.2016.04.004
- Liu, D. (2011). The most frequently used English phrasal verbs in
  American and British English. *TESOL Quarterly*, 45(4), 661–688.
  https://doi.org/10.5054/tq.2011.247707
- Martinez, R., and Murphy, V. A. (2011). Effect of frequency and
  idiomaticity on second language reading comprehension. *TESOL
  Quarterly*, 45(2), 267–290. https://doi.org/10.5054/tq.2011.247708
- Conklin, K., and Schmitt, N. (2008). Formulaic sequences. *Applied
  Linguistics*, 29(1), 72–89. https://doi.org/10.1093/applin/amm022
- Chen, S., Miller, R. T., and Ke, S. (2026). The effect of contextual
  diversity on L1 and L2 word learning. *Applied Psycholinguistics*, 47,
  e26. https://doi.org/10.1017/S0142716426100691
- Norman, R., et al. (2023). Contextual diversity during word learning
  through reading benefits generalisation of learned meanings to new
  contexts. *QJEP*, 76(7), 1658–1671.
  https://doi.org/10.1177/17470218221126976
- Li, J., et al. (2024). Contextual diversity and anchoring.
  *QJEP*, 77(11), 2180–2198. https://doi.org/10.1177/17470218231218990
- Pagán, A., and Nation, K. (2019). Learning words via reading.
  *Cognitive Science*, 43(1). https://doi.org/10.1111/cogs.12705
- Alejo-González, R. (2010). Making sense of phrasal verbs. *AILA
  Review*, 23, 50–71. https://doi.org/10.1075/aila.23.04ale
- ADR 027, ADR 035, ADR 036, ADR 037, ADR 038, ADR 039, ADR 041,
  ADR 042, ADR 043.
