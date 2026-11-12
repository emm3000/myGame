---
status: proposed, the skill amended by ADR 039, chrome examples changed by ADR 040, the item data, the order, the frame rule, the stage and the holdout widened for units and later frames, and the next lesson after placement clarified, by ADR 044
date: 2026-11-04
---
# The NGSL curriculum and the content gate

## Context

ADR 035 makes the NGSL 1.2 the curriculum's order, groups lessons by
theme, puts learning content behind an offline gate, and defers here the
bands, the gate and its human review, the placement check and the
holdout. ADR 036 pinned lesson 1 and its reviews; it left lessons after
lesson 1, the holdout and the gate's CI check to this ADR. The owner
delegated every branch on 2026-11-04 and signs off from the pull
request: each rule below is decided on evidence, with the option it
rejected under Considered options.

The learner is an adult at A1 to A2, a Spanish speaker learning
American English (`docs/research/english-pivot/decisions.md` §2.1).
The design tree settles the direction: frequency order (§3.1), themes
never semantic sets (§3.2), a CEFR-aligned grammar order (§3.3), items
as data behind a port (§3.4), offline generation (§3.5), a gate on
coverage, grammar and glosses with a human review (§3.6), placement in
the UVLT's format (§8.1) and a within-player holdout (§8.3).

What trunk holds today, checked at `958d6586`:

- `apps/api/content/lessons/lesson-1.json`: one lesson of five words,
  each `{ id, lemma, frame, gappedFrame, gloss: { es } }`, parsed by
  `LessonContentSchema` (`packages/contracts`). No part of speech, no
  rank, no definition. Word ids are opaque, `lesson-1-1` to
  `lesson-1-5`, never the lemma, because the recall's path carries the
  id (`POST /fiefs/:fiefId/reviews/:wordId/answer`, #713) and a lemma
  there would give the answer away.
- `apps/api/content/lessons/ngsl-1.2.csv`: `NGSL_12_stats.csv`
  unchanged, 2 809 lemmas with their `SFI Rank`, CC BY-SA 4.0, its
  hash asserted by `JsonLessonCatalog.test.ts`. The adapter reads it as
  the set of headwords for the near-miss rule (ADR 036, rule 4).
- `JsonLessonCatalog` (`apps/api/src/adapters/json/`) loads a
  hard-coded list of lesson files and flattens each gloss to `gloss.es`.
- The repository is public (`emm3000/myGame`) and carries no licence
  file, so everything in it is all rights reserved except the NGSL
  file.

Two facts from the NGSL's own site bear on the gate. The authors
publish `NGSL_12_lemmatized_for_teaching.csv`, CC BY-SA 4.0: one row per
headword with its inflected forms (`go,goes,went,going,gone,goin,gonna`;
`i,me,my,mine`), US spelling as the headword and UK variants among the
forms (`color,…,colour,colours`), derived forms left out, and five
homographs named in its header: *found*, *left*, *mine*, *rose*,
*wound*. And CC BY-SA 4.0 makes a database holding a substantial part of
the list Adapted Material (§4(b) of the legal code), shared only under
the same licence (§3(b)).

## Decision

### Bands and kinds of word

- **Three bands by NGSL 1.2 `SFI Rank`**: band 1 is ranks 1 to 1 000,
  band 2 is 1 001 to 2 000, band 3 is 2 001 to 2 809. The bands match
  the 1 000-word levels of the Updated Vocabulary Levels Test that
  placement follows (Webb, Sasao and Ballance 2017) and the first
  1 000 and 2 000 headwords where the NGSL leads other lists (Dang and
  Webb 2016, `research.md` §4).
- **A frame word is never a card.** It is a closed-class word among the
  NGSL's first 100 ranks: an article, a pronoun or possessive, a
  demonstrative or quantifier, *be*, *have* and *do*, a modal, a
  preposition, a conjunction, *not*. They live in `grammar.json` alone,
  each with the lesson that admits it (below); Townword assumes
  an A1 reader reads them, which is §2.1's entry level. They carry no
  stable scaffold gloss to recall from (*of*, *the*, the auxiliary
  *do*), so a card would drill nothing.
- **A card word is every other word a lesson teaches**: every NGSL word
  that is not a frame word, and the few words outside the list that the
  chrome needs (*upgrade* and *password* are not NGSL words). Each card
  word is taught by exactly one lesson.
- **The chrome lessons come first.** They teach every card word the
  English chrome uses (ADR 038), the game nouns of ADR 035 among them,
  whatever their band: *home* (161), *money* (201), *mayor* (2779),
  *cancel* (2390). Lesson 1 is the first of them: *home*, *school*,
  *work*, *money* and *food* name the town's homes, its school, its
  people at work, its money and its food. A word the player reads on
  every screen is read hundreds of times, so a frequent one pays twice
  (§10.3).
- **A chrome lesson's words never count in a measure**: not in the
  progress per band, not in the holdout's draw, not in the placement's
  sample. The player meets them on every screen, so practised and
  withheld would not differ by practice alone. This extends ADR 035's
  rule for *mayor*, *storage* and *truck* to every chrome word, for the
  same reason. They still count as known when a text is checked.

### Lessons and their order

- **A lesson teaches 5 card words** under one theme, never a semantic
  set (§3.2; Nakata and Suzuki 2019). Five keeps ADR 036's recognition
  choices to the lesson itself and keeps the skill, which waits on every
  word of the lesson, within reach. A band's last lesson is the one
  exception: once fewer than 10 of the band's card words remain
  untaught, the next lesson takes them all, 5 to 9, so no band ends on
  a lesson of 1 to 4; ADR 036's rule 3 already offers 5 choices from a
  larger lesson.
- **After the chrome lessons, the bands are taught in order, and every
  lesson holds the lowest-ranked untaught card word of its band and
  draws its other four from the 30 lowest-ranked untaught card words of
  that band.** The head word is always taken, so a word at place k of
  the window, the head at place 1, is taught by the k-th lesson at the
  latest, counting the current one: no word waits more than 29 lessons
  after it enters the window, and the theme still has 30 words to choose
  5 from. Every rank below 30 in the list is a frame word, so, unless a
  chrome lesson teaches it, the first band lesson holds *say* (30).
- **A lesson's frames use only what the player is taken to know at that
  lesson** (the frame rule, below). That ties the order to the text:
  each lesson widens what the next lesson's frames may say.
- **The stage of a player is the prefix of lessons the player has
  studied or placed out of.** A text written for lesson *n* is shown
  only to a player whose stage reaches *n*. (Amended by ADR 044: the
  stage skips unit lessons, which add no token a frame or a text may
  hold, and a later frame is shown, as a text is, once the stage
  reaches its lesson.)

### The item data

The content keeps one shape, in `apps/api/content/lessons/`, read
through the domain's `LessonCatalog` port (ADR 008's pattern, N5):

- **`words.json`, the lexicon**: one entry per card word any content
  uses, taught or not yet, keyed by an opaque, permanent id; no frame
  word has an entry. An entry holds the `lemma`, its `partOfSpeech`,
  its `frame` and `gappedFrame`, one `gloss` per
  scaffold language (`{ "es": "escuela" }`), an English `definition`,
  and any further accepted form of a typed answer (ADR 036, rule 4). An
  id never changes and is never reused; lesson 1's ids stay
  `lesson-1-1` to `lesson-1-5`, and a new word's id is `word-<n>`, the
  next free number, never the lemma.
- **The rank is never copied.** The adapter joins each lemma to its
  `SFI Rank` from `ngsl-1.2.csv` at start-up; a card word outside the
  list has none and counts in no band.
- **`lesson-<n>.json`**: the lesson's id, theme, duration, required
  library level (the school's after the town rebuild), and its word ids
  in order; never its skill, which follows from its position in
  `curriculum.json` (ADR 039). The words move out of the lesson file
  into the lexicon, lesson 1's included, in the lexicon ticket, before
  any lesson after lesson 1 ships; one shape, never two (rebuild, never
  adapt).
- **`curriculum.json`**: the lessons in order, the count of chrome
  lessons first, and the skill curve, `{ cycle, ratePercent }`, from
  which each lesson's skill follows (ADR 039). The adapter loads what it
  lists; nothing is read from a file name.
- **`grammar.json`, the grammar inventory**, the one home of the frame
  words: structures in order, each with its CEFR level, the frame words
  and the inflections it admits, and the lesson from which it is
  admitted. Its first form lists only the frame words, each with its
  admitting lesson, which checks 1 and 3 need; the structures, their
  inflections and levels come with check 6. Its levels follow the
  CEFR-J Grammar Profile (Tono Laboratory, TUFS), which its authors
  allow for commercial use with citation; the British Council and
  EAQUALS Core Inventory forbids reproduction without written
  permission, and the English Grammar Profile's terms could not be
  confirmed. The order itself is a pragmatic sequence, as §3.3 says: no
  study establishes a teachable grammar order.
- **`ngsl-1.2-lemmatized-for-teaching.csv`**, the authors' form list,
  shipped unchanged beside `ngsl-1.2.csv` with its source, date and
  SHA-256 in the attribution file, read by the gate only.
- **Texts** (Town News, notices, the Report's lines) come with their own
  tickets: each is a set of variants, each variant declaring the lesson
  from which it may be shown; the server answers the latest variant the
  player's stage reaches.
- **Licence.** `words.json` and the lesson files hold a substantial part
  of the NGSL's headwords, so the directory is Adapted Material and is
  shared under CC BY-SA 4.0: one `LICENSE.md` in
  `apps/api/content/lessons/` names the NGSL, its authors, the licence,
  and what Townword changed. Townword's glosses, frames and
  definitions share that licence: anyone may reuse the curriculum with
  attribution.

### The content gate

The gate is a Vitest suite in `apps/api` over the shipped content, so
`pnpm gate` and CI run it and a red check blocks the merge (§3.6). A
token is a word of the text as the NGSL teaching file lemmatises it; a
homograph form (*found*, *left*, *mine*, *rose*, *wound*) must carry the
word it means in the content, or the gate fails it.

1. **The lexicon holds.** Ids unique; every card word's lemma an NGSL
   headword or marked off-list; every card word taught by exactly one
   lesson; no lexicon entry is a frame word, and every frame word is
   in `grammar.json` with its admitting lesson.
2. **The order holds.** The chrome lessons first; after them, each
   lesson holds its band's lowest-ranked untaught card word and draws
   the rest from that band's 30 lowest-ranked untaught card words; it
   teaches 5 card words, except that a lesson starting with fewer than
   10 of its band's card words untaught takes them all, 5 to 9.
3. **The frame rule.** A frame holds its lemma once, in the lemma's own
   form, and the gapped frame is that frame with the lemma replaced by
   `____`. Every other token is a frame word admitted at or before the
   lesson, or a card word of an earlier lesson. A single sentence of 6
   to 10 tokens holding one unknown token is already at 83 to 90 %
   coverage, below any threshold of §4, so a frame admits none.
4. **Coverage of a running text.** A variant holds at most
   max(1, ⌊5 % of its tokens⌋) tokens unknown at its lesson, each one a
   lexicon word with every gloss the shipped scaffolds need: 1 in a text
   of up to 39 tokens, 2 in 40. That is §4's 95 % floor for assisted
   reading, a heuristic (Kremmel et al. 2023), and it holds from 20
   tokens up: a shorter text may still hold its one unknown token,
   glossed. Every Townword text is
   assisted, since every unknown token is glossed, so §3.6's 2 % for
   unassisted reading binds no text.
5. **Glossary completeness.** Every card word of a listed lesson has a
   gloss in every shipped scaffold language: `es` needs `gloss.es`;
   `none` needs the `definition` (ADR 038). A definition uses only frame
   words and band 1 words, as a learner's dictionary keeps a defining
   vocabulary, and never holds its own lemma in any form.
6. **Grammar.** No token is a frame word or an inflection the inventory
   admits after the lesson or the variant's lesson.
7. **The owner's review.** Every pull request that adds or changes a
   gloss, a frame, a definition or a text lists each one in a table in
   its body, and it is merged only after the owner approves it on the
   pull request; then the orchestrator merges it, as every pull request
   (`docs/agents/multi-session.md`). GitHub refuses an approving review
   from a pull request's own author, so the owner's approval is a
   comment saying so. The owner reads Spanish glosses for meaning and
   for the tú rule (ADR 038).
8. **After launch, item statistics.** A word whose Again rate or FSRS
   difficulty is an outlier in its band is listed for the owner from the
   review log (ADR 036, rule 8); it never changes a card.
9. **The chrome's words.** Every card word of an English chrome message
   in `packages/catalog` (ADR 038) is taught by a chrome lesson; fixed
   copy, read before any lesson, is exempt.
10. **The skill.** `curriculum.json`'s skill curve names every resource
    once, food first, at 5 %, and no lesson file names a skill
    (ADR 039).

**What ships first**: checks 1, 2, 3, 5 for `es` and 10, in the lexicon
ticket, with `grammar.json` in its first form (the frame words and
their admitting lessons), before any lesson after lesson 1. Check 4
ships with the first running text, check 6 with the inventory's
structures, check 5 for `none` with that scaffold (ADR 038), and
check 8 once players have reviews to measure, and check 9 in the
chrome-lessons ticket, against the English chrome the town rebuild has
written by then. Check 7 holds from the first content pull request.

**Lesson 1 fails the frame rule** as shipped, 4 frames of 5, and its
frames are rewritten in the lexicon ticket. Its cards and review log are
untouched, since a card is keyed by the word's id, never its frame:

| Frame | Unknown at lesson 1 |
|---|---|
| We have a new home in this town. | *new* (79), *town* (364) |
| I walk to school every day. | *walk* (339), *every* (180), *day* (85) |
| They work in a big office. | *big* (184), *office* (343) |
| I do not have much money. | none: *I*, *do*, *not*, *have* and *much* are frame words |
| We buy food for the week. | *buy* (242), *week* (157) |

A frame such as *This is my home.* passes: *this*, *is* (*be*) and *my*
(*I*) are frame words.

### Generation

- **Content is drafted offline and never at runtime.** The api and CI
  hold no model key and call no model; a text reaches a player only as
  a committed file that passed the gate and the owner's review (§3.5).
- **The drafter is a Claude Code authoring session**, dispatched as a
  content ticket like any other: it reads `docs/setting/` and this ADR,
  writes the lexicon and lesson files, runs the gate and fixes what it
  fails until it is green, and opens the pull request check 7 needs.
  The model's name goes in the pull request body. Anthropic's Consumer
  Terms assign the outputs to the user (§4) and its Commercial Terms
  leave them the customer's.
- **The free-provider chain of the owner's Hello repo is not reused.**
  Its pattern (`supabase/functions/_shared/providers.ts`: Groq, then
  Gemini Flash-Lite, then OpenRouter, with cooldowns, per-user credits
  and a response envelope) solves runtime availability for a player
  waiting on a request, which offline authoring does not have. Each
  link, as its terms read on 2026-11-04:

  | Link | Outputs | Training and retention | Verdict |
  |---|---|---|---|
  | Groq, `openai/gpt-oss-120b` | The customer's (Services Agreement §1, §8.1, June 2026); weights Apache 2.0 | Groq may not train on inputs or outputs (§4.2); logs kept up to 30 days for abuse only | Clean; the one link worth keeping in reserve |
  | Gemini API free tier, `gemini-3.1-flash-lite` | Google claims no ownership (terms of March 2026) | Unpaid use trains Google's products; human reviewers may read inputs and outputs | Usable for public content, no gain over the drafter; the paid-only rule for API clients in the EEA, UK and Switzerland is read here as not reaching offline authoring, unconfirmed |
  | OpenRouter, `minimax/minimax-m3:free` | Set by each model's terms | Some free models may store or train on inputs | Rejected: the id answers 404 on 2026-11-04, and MiniMax M3's Community License grants free use for non-commercial purposes only |

  If the volume ever outgrows authoring sessions, Groq alone is
  admitted as an offline drafting script outside `apps/`, under the same
  gate and review; that is a later ticket, not this ADR.

### Placement

- **Optional, once, at the first sign-in.** Skipped, the player starts
  at lesson 1.
- **Its format is meaning recognition, after the UVLT** (§8.1): a word,
  and its meaning chosen among 4, glosses for `es` and definitions for
  `none`. Per band, 30 card words drawn by the api from the band's
  words that no chrome lesson teaches; a band passes at 29 of 30, the
  cut Webb, Sasao and Ballance (2017) recommend for the 1 000, 2 000
  and 3 000 levels, read in the paper. The check stops at the first band
  failed. The UVLT samples BNC/COCA word families and matches three
  meanings to six words; sampling NGSL lemmas one at a time is an
  adaptation, not the validated test.
- **A passed band is placed out**: its lessons count in the player's
  stage, so texts and frames written for them are shown, and they stay
  open to study at any time, earning their skills as any lesson does.
  The next lesson is the first after the chrome lessons in the first
  band failed; the chrome lessons are never placed out. (Clarified by
  ADR 044: the unit lessons belong to no band and are never placed out,
  so a placed player meets them before the first lesson of the first
  band failed.) Since a placed
  learner loses no skill and a beginner gains none, failing on purpose
  buys nothing.
- **A placed-out word with no card is supported on tap only**, as a
  word at 7 days of stability is (ADR 038): the placement showed the
  learner reads it, at 29 of 30, and support shown beside a word the
  learner knows is the redundant guidance expertise reversal warns of
  (Kalyuga et al. 2003). Once the player studies its lesson, its card
  rules it like any other.
- **The result is stored**: per band, the score and the instant.

### The holdout

- **Drawn when the player starts a band's first lesson**, the band's
  start, never for a
  band placed out: ⌊10 %⌋ of the band's card words that no chrome lesson
  teaches, drawn by the api's random source, never the domain's, and
  stored per player and word. It never changes after the draw; were
  950 of band 1's words eligible, 95 would be held out. (Amended by
  ADR 044: the draw never takes a unit, and skips every word an entered
  unit card of the player holds; a unit with a held-out word enters no
  card until that word is released.)
- **A held-out word never enters as a card.** Its lesson enters only its
  non-held-out words as that player's cards, since a 10 % draw can put
  two or more held-out words in one lesson; its gloss is not among that
  player's recognition choices; and the lesson's skill waits on the
  words the player holds, and on at least one (ADR 036, rule 7, reads
  "every word of its lesson that the player holds" once the holdout
  ships), so a lesson whose every word is held out earns once they are
  released and retained (ADR 039).
- **It is read like any untaught word**: game text glosses it, and so
  does a later lesson's frame on a recognition or a recall, where any
  token whose word the player holds no card for is glossed, as
  ADR 038's "no card" row says for game text. The comparison is
  therefore cards plus reading against reading alone, which is the
  effect the reviews claim.
- **Each band's external check runs 8 and 24 weeks after that band's
  start**: every held-out word of the band's lessons the player has
  studied, and as many practised words drawn from the same lessons, in
  the placement's format. Every player who started the band is in its
  analysis, whether or not they took the check (intention to treat,
  §8.3).
- **A band's held-out words are released after its 24-week check**,
  taken or skipped: they enter as released lessons of 5, in rank order,
  through the lesson slot, earning no skill. The school tells the player
  that 1 word in 10 is kept for a later check and comes back after it.
- **This narrows ADR 035's holdout**, "a random 10 % of each band's
  words": the draw takes card words outside the chrome lessons only, at
  the band's start, and ends with the release.

## Considered options

- **BNC/COCA2000 instead of the NGSL.** Better average coverage and
  rated more useful by teachers (`research.md` §4), but its licence is
  unconfirmed; ADR 035 already ships the NGSL. Not reopened.
- **500-word bands.** Finer placement, but the UVLT's validated cut is
  per 1 000 words, and a holdout of 10 % of 500 is 50 words, a thin
  comparison. Rejected.
- **Every NGSL word as a card, *the* and *of* included.** A paired
  associate needs a cue to recall from (`research.md` §2); *of* has
  none. Rejected for frame words admitted by the grammar.
- **Strict rank order with no window.** Keeps frequency exactly, but
  five neighbours in rank rarely share a theme, so lessons turn into
  lists. Rejected for the window of 30 with the head word fixed.
- **Free choice of words within a band.** Themes become easy, but a
  word can wait forever and the gate cannot check order. Rejected.
- **The words nested in each lesson, as lesson 1 is.** A running text
  must gloss a word no lesson has taught yet, and lesson 300 is not
  written when the first Town News is. Rejected for one lexicon.
- **The lemma as the word's id.** Rejected: the recall's path carries
  the id (#713).
- **The rank copied into each entry.** Two sources for one number, and
  a copied column is one more adaptation of the list. Rejected for the
  join at start-up.
- **The 95 % coverage floor on frames too.** One unknown token in a
  sentence of 8 is 87.5 %; the percentage cannot be met by a single
  sentence with any unknown word, so it says nothing there. Rejected
  for the frame rule.
- **The 98 % threshold as a second gate.** Every Townword text is
  glossed, which is §4's assisted case. Rejected until a text ships
  without glosses.
- **Spanish–English cognates counted as known.** No verified source in
  `research.md`, false friends (*actually*, *embarrassed*), and a text
  is checked once for every scaffold, `none` included. Rejected.
- **A lemmatiser library** (`wink-lemmatizer` 3.0.4 and `compromise`
  14.19.0, both MIT). Rejected for the authors' own form list: it
  agrees with the NGSL's headwords by construction, names its
  homographs, and adds no dependency.
- **A grammar check by parser.** A part-of-speech tagger would catch
  structures, not only words and inflections, at the cost of a model in
  CI whose errors become gate failures. Rejected; the owner's review
  covers structure.
- **A review mark in the content.** A field an agent can set proves
  nothing, since every commit carries the owner's identity. Rejected
  for the owner's approval on the pull request.
- **Reuse Hello's provider chain as an offline authoring tool** (the
  dispatch's starting recommendation). Overridden on the evidence
  above: its third link no longer exists and its model's licence is
  non-commercial; its fallback, cooldowns and credits answer a runtime
  problem authoring does not have; three models write in three styles;
  and it adds three keys to manage, where an authoring session also
  runs the gate it must pass.
- **Placement that enters known words as cards with a starting
  stability** (§8.1's wording). A placed A2 learner would hold 1 000
  cards falling due together. Rejected for placing bands out, their
  lessons still open.
- **Placement that locks the placed-out lessons.** Their skills would
  be lost to the learner who placed, so failing on purpose would pay.
  Rejected.
- **A holdout derived from a hash of the player and the word.** No
  storage, but the set moves when the band's eligible words change,
  and a word must never move between practised and withheld mid-study.
  Rejected for a stored draw.
- **A holdout kept for good, or one the player can turn off.** Keeping
  it costs the learner 10 % of the words for good; an opt-out breaks
  intention to treat. Rejected for release after the 24-week check.

## Consequences

- `apps/api/content/lessons/` gains `words.json`, `curriculum.json`,
  `grammar.json`, the teaching form list and a `LICENSE.md`; lesson 1
  moves to the lexicon with new frames; `LessonContentSchema` and
  `JsonLessonCatalog` follow; the domain's `Lesson` changes only where
  ADR 038's `none` needs the definition. Stored cards and the review log keep their word ids.
- The gate is a test, so `pnpm gate` covers content with no new CI job.
- Content tickets are dispatched like docs tickets; their model comes
  from the budget tier's table, and their pull requests wait for the
  owner's approval on the pull request before the orchestrator merges
  them, a line `docs/agents/multi-session.md` now carries.
- ADR 035's holdout is narrowed and ADR 036's rule 7 amended, each
  marked in its status line.
- The learning content is CC BY-SA 4.0 in a repository otherwise all
  rights reserved.
- Placement, the holdout and its external check each need storage, a
  migration each, and screens. Placement also needs the lessons of
  bands 2 and 3 drafted, since a player placed out of band 1 starts in
  band 2.
- What a skill is worth across hundreds of lessons is ADR 039's: the
  lessons raise the resources in turn, food first, each by 5 %, and one
  resource's levels add up; no lesson file names its skill (amended by
  ADR 039).
- `docs/setting/lessons.md` records each lesson, its theme and its
  words with their ranks, as it does for lesson 1.

## References

- NGSL 1.2, Browne, Culligan and Phillips, CC BY-SA 4.0:
  https://www.newgeneralservicelist.com/new-general-service-list, and
  `NGSL_12_lemmatized_for_teaching.csv` there.
- CC BY-SA 4.0 legal code, §1, §3, §4:
  https://creativecommons.org/licenses/by-sa/4.0/legalcode.en
- Webb, S., Sasao, Y., and Ballance, O. (2017). The updated Vocabulary
  Levels Test. *ITL*, 168(1). https://doi.org/10.1075/itl.168.1.02web;
  the cut points read in https://www.lextutor.ca/tests/webb_sasao_ballance_2017.pdf
- CEFR-J Grammar Profile, Tono Laboratory, TUFS:
  https://github.com/openlanguageprofiles/olp-en-cefrj
- Groq Services Agreement and data page:
  https://console.groq.com/docs/legal/services-agreement,
  https://console.groq.com/docs/your-data
- Gemini API terms and models: https://aistudio.google.com/docs/terms,
  https://aistudio.google.com/docs/models
- OpenRouter terms and FAQ: https://openrouter.ai/terms,
  https://openrouter.ai/docs/faq; MiniMax M3 licence:
  https://huggingface.co/MiniMaxAI/MiniMax-M3
- Anthropic Consumer and Commercial Terms:
  https://www.anthropic.com/legal/consumer-terms,
  https://www.anthropic.com/legal/commercial-terms
- `docs/research/english-pivot/decisions.md` §2.1, §3, §8.1, §8.3, §10.3,
  and `research.md` §2, §4, §15 and the addendum.
