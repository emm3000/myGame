---
status: proposed, fixed copy widened to the review card by ADR 040, a frame's support settled by its amendment of 2026-11-12
date: 2026-11-04
---
# Scaffold languages and a wire without prose

## Context

ADR 035 makes English the target and a scaffold language a player
setting, `es` or `none` at launch, whose glosses fade per word as the
word is retained, and defers here the languages: the setting, the
fading, one message catalog per language, refusals on the wire without
prose, and mail per language. ADR 036 left recognition and recall under
`none` to this ADR. The owner delegated every branch on 2026-11-04 and
signs off from the pull request.

What trunk holds today, checked at `958d6586`:

- **Three Spanish layers say the same things.** The web's
  `apps/web/src/copy.ts` (689 lines) holds every string the web shows;
  Android holds its own in five `strings.xml` files (`app` and the
  `chronicle`, `fief`, `map` and `signin` features); the api writes
  `apps/api/src/http/answerRefusal.ts` and
  `apps/api/src/mail/mailCopy.ts`. The refusal lines are written twice,
  word for word: *El correo o la contraseña no son correctos.* is in
  both `answerRefusal.ts` and `copy.ts`.
- **The wire carries Spanish.** `ApiErrorSchema` is
  `{ kind, message }` (`packages/contracts/src/ApiError.ts`), and
  `answerRefusal` fills `message` for every kind it answers with a body.
  Five kinds build their line from the refusal's fields:
  `NotEnoughUnitsAtHome` (`unit`, `count`, `atHome`), `BarracksTooLow`
  (`unit`, `requiredBarracksLevel`), `FiefCapReached` (`cap`),
  `CargoAboveCarry` (`cargo`, `carry`) and `StayOutOfRange`
  (`maxStayHours`). The fields never reach the wire; only the sentence
  does.
- **Most screens ignore `message`; the map does not.** The web shows a
  refusal by its kind from `copy.refusals`, except the map, which reads
  the api's `message` for every march refusal (`marchRefusalLineOf`,
  #545); Android's map keeps it as `RefusedWithApiLine`. Those are the
  only readers.
- **Language is fixed.** The web's root is `<html lang="es">`; the
  review cards mark the English with `lang="en"`. No player field names
  a language; S39 serves the `es` gloss alone (ADR 036).
- Android's `minSdk` is 26, so `android.icu.text.MessageFormat`
  (API 24) is available on every supported phone.

The evidence (`docs/research/english-pivot/research.md` §10): glossed
reading roughly doubled the words learned, 45.3 % against 26.6 %
immediately; L1 glosses beat L2 glosses (Yanagisawa, Webb and Uchihara
2020); guidance that helps novices becomes redundant as expertise grows
(Kalyuga et al. 2003), which argues for fading by measured mastery. No
L2 study gives the fade point.

## Decision

### The setting

- **`scaffold` is a player field, `es` or `none`, stored by the server**
  (§11.1). Sign-up asks for it first, preselected `es` when the
  browser's or the phone's language is Spanish and `none` otherwise.
  The player changes it any time in the settings; a change writes the
  field alone and never touches a card.
- **`none` is for a learner who wants no translation**, and in practice
  for a learner whose language Townword does not offer yet (§7.4). It is
  the weaker scaffold on the evidence, since L1 glosses beat L2 glosses;
  it is offered for autonomy, not recommended.

### What each scaffold shows of a word

| | `es` | `none` |
|---|---|---|
| Recognition (ADR 036, rule 2) | the word and its frame; choices are the lesson's Spanish glosses | the word and its frame; choices are the lesson's English definitions |
| Recall | the Spanish gloss and the gapped frame | the English definition and the gapped frame |
| A word in game text, stability under 7 days or no card (except a placed-out word, ADR 037, read as at 7 days) | marked, its gloss shown beside it on first sight | marked, its definition shown beside it on first sight |
| Stability 7 days or more | the gloss on tap | the definition on tap |
| Stability 30 days or more | the English definition on tap | the definition on tap |

- **The support level of each word is the server's answer**, derived on
  read from the card's stability and the player's scaffold, so no
  client computes it (N1). The 7- and 30-day points are §7.1's design
  choices; no study gives them.
- **A tap on a word past 30 days** is recorded for the owner's
  statistics when glossed text ships; it never changes a card (only a
  rating does, ADR 036).
- **The definition is content** (ADR 037): every card word carries one,
  in the defining vocabulary of frame words and band 1, so `none` ships
  only when every listed lesson's words have theirs.

### The chrome and the copy that never fades

- **The catalog has two kinds of message.** *Chrome* is the game's
  screens: labels, buttons, headings, the Town News frame, the goals.
  *Fixed copy* is the account and sign-in screens, every refusal, every
  review verdict and hint line, and every mail. Fixed copy is always in
  the scaffold language: Spanish for `es`, English for `none`. A
  misread refusal, reset mail or correction is a usability failure, not
  a learning moment (§7.3), and a correction misread teaches the error
  (§6.1).
- **Under `es`, the chrome passes three phases, globally**, never word
  by word, so a button never changes language under the player's
  finger (§7.2):
  1. **Spanish** until every chrome lesson (ADR 037) is studied;
  2. **both**, the English label with the Spanish under it, until every
     chrome lesson's skill is earned;
  3. **English** after.

  The phase is derived on read from what the player studied and earned,
  and both only ever grow (ADR 036, rules 6 and 7), so the chrome never
  goes back. The server answers the phase; the client draws it. Under
  `none` the chrome is English from the start. Were lesson 1 the only
  chrome lesson, ADR 036's worked example would turn the chrome to both
  at 2026-11-10 09:00, when lesson 1 finishes, and to English at
  2026-11-23 09:10, when its skill is earned.
- **The English chrome uses only words the chrome lessons teach**,
  besides frame words: ADR 037's check 9 reads every English chrome
  message and fails a card word no chrome lesson teaches. Fixed copy is
  exempt, since it is read before any lesson (*password* is no NGSL
  word, and sign-in needs it).
- **Before sign-in**, the account screens follow the browser's or the
  phone's language, Spanish for `es*` and English otherwise, with a
  visible switch the web keeps in browser storage.

### One message catalog per language

- **`packages/catalog` holds `en.json` and `es.json`, ICU MessageFormat,
  one key set** (§11.3). It is the single source of every string a
  client or the api's mail shows. Its test refuses a key in one
  language and not the other (one way only until step 4, below), a
  message that does not parse, two
  languages naming different arguments for one key, and, in `es`, a
  denylist of voseo forms (*vos*, *sos*, *tenés*, *podés*, *querés*,
  *sabés* and their kin); the owner's review is the guarantee, the
  denylist the tripwire.
- **It generates what the clients read.** The web and the api import
  typed functions from `@mygame/catalog`, one per key and language, the
  ICU parsed at generation, so no ICU runtime ships to the browser;
  Android receives one `strings.xml` per module, `values/` for English
  and `values-es/` for Spanish, written by the generator from the key
  prefixes each module owns, each string the ICU pattern itself,
  formatted by `android.icu.text.MessageFormat`. Generated files are
  committed, and the test regenerates them and fails on a difference,
  as `db:generate` must write no new file.
- **The workspace gains one package and two edges**:
  `apps/web -> packages/catalog`, `apps/api -> packages/catalog`, and
  `packages/catalog -> nothing`. `apps/android` stays outside the
  workspace and reads only generated files.
- **The language each screen draws in is the client's choice from the
  server's answer**: the phase for chrome, the scaffold for fixed copy.
  On Android, a module reads the other language's strings through a
  configuration context with that locale, so the both-languages phase
  needs no second set of resources.

### Refusals without prose

- **`ApiError` is `{ kind, params }`**, a union on `kind`, `params` the
  kind's typed fields and absent for a kind with none; `message` is
  removed (§11.4). The api maps a kind to its status and copies the
  refusal's fields, nothing else; `answerRefusal.ts` loses every
  Spanish line and its unit labels.
- **Each client renders `refusal.<Kind>` from the catalog** with those
  params. The map renders from params instead of `message`, which
  closes #545's exception on both clients.
- **Today's five slotted kinds** carry their fields on the wire:

  ```json
  { "kind": "StayOutOfRange", "params": { "maxStayHours": 8 } }
  ```

  which `es` renders as today's api line, *Una marcha forrajea de 1 a 8
  horas enteras. Ajusta las horas.*, and `{ "kind":
  "InsufficientResources" }`, with no params, as *No tienes recursos
  suficientes.* The town rebuild cuts `FiefCapReached` and
  `CargoAboveCarry` with the second fief.
- **Mail is per language.** The api renders a mail from the catalog in
  the player's scaffold: Spanish for `es`, English for `none`. ADR 015
  is amended so: its links, lifetimes and rules stand.

### Spanish addresses the reader as tú

Every Spanish message and gloss addresses the reader as tú, never vos
(ADR 035, N6), checked by the owner's review and the catalog's
denylist. A gloss that is a verb is glossed in the infinitive, as
*trabajar* is for *work*, so it addresses no one.

### The migration from today's Spanish chrome

1. **Refusals without prose.** Contracts, the api, both maps, the
   regenerated OpenAPI client, and the Android row. Independent of the
   rest, and it ends the api's Spanish.
2. **The catalog, `es` only**, generated from today's `copy.ts`,
   `strings.xml` files and `mailCopy.ts`. Strings move; none is
   reworded. `copy.ts` and the hand-written `strings.xml` are deleted,
   replaced by generated output, and the drift between them ends. On
   Android the generator writes Spanish into each module's `values/`,
   the default locale, and writes no `values-es/`, since a string
   missing from `values/` fails Android lint's
   `MissingDefaultResource`; `values/` turns English and Spanish moves
   to `values-es/` in step 4. Until step 4 the key check runs one way:
   every key of `en.json` must be in `es.json`.
3. **The town rebuild writes its copy into the catalog in English and
   Spanish together**, screen by screen, so no medieval English copy is
   ever written to be thrown away.
4. **The scaffold field, the sign-up and settings choice, the chrome
   phases and `none`**, once the English catalog holds every key (the
   key check then runs both ways), the
   chrome lessons exist, and every listed lesson's words have their
   definitions. Until then every player is `es` and the chrome is
   Spanish, as S39 ships it.

### The PRD

- **M1** gains, from step 4: *sign-up also picks a scaffold language,
  `es` or `none`*.
- **S7** gains, from step 4: *each mail in the player's scaffold
  language*.
- **N5** and **N6** are rewritten in `docs/PRODUCT_REQUIREMENTS.md`
  with this ADR and ADR 037.

## Considered options

- **Fade the chrome word by word**, as the glosses fade. A label would
  change language while another beside it stays, and the layout would
  shift under the player's finger (§7.2). Rejected for global phases.
- **Chrome by a CEFR level or a count of known words.** A level is not
  measured, and a count would cross back below its threshold as
  retrievability falls. Rejected for phases tied to studied lessons and
  earned skills, which never go back.
- **A manual chrome switch** in the settings. Autonomy argues for it
  (§12), but it is one more stored field, and `none` already serves the
  learner who wants English throughout. Deferred until a player asks.
- **Everything in English, refusals and mail included** (§7.3's
  rejected option). A misread reset mail locks a player out. Rejected.
- **Two scaffold-specific review formats under `none`**, a cloze with
  the word's lesson as choices, or images only. A cloze recognition
  tests the frame, not the word's meaning; images cover concrete nouns
  only, and come with listening (§5.2). Rejected for definitions in a
  defining vocabulary.
- **Spanish as the only scaffold at launch**, `none` later. `none` costs
  definitions and an English catalog, both needed anyway (the English
  definition is `es`'s 30-day support; the English chrome is the third
  phase). Kept in step 4, after `es` has every piece.
- **Android resource qualifiers alone**, the device's locale choosing
  `values-es/`. The language is the player's setting and phase, not the
  phone's, and the middle phase needs both at once. Rejected for a
  configuration context per language.
- **Converting ICU plurals and selects to Android `plurals` and
  printf.** A second grammar to keep in step, where Android ships ICU
  since API 24 and the app's floor is 26. Rejected.
- **An ICU runtime in the browser** (`intl-messageformat`). Parsing at
  generation gives typed arguments and ships no parser. Rejected.
- **The catalog inside `packages/contracts`.** Contracts are the wire's
  vocabulary; copy is not on the wire. Rejected for its own package.
- **Keep `message` beside `params`** while the clients move. A
  compatibility shim, refused by "rebuild, never adapt"; step 1 moves
  both clients in one change. Rejected.
- **Today's copy reworded during the catalog move.** Mixes a mechanical
  move with copy review, and the town rebuild rewrites it anyway.
  Rejected: step 2 moves, step 3 rewrites.

## Consequences

- `packages/contracts` loses `ApiError.message` and gains each kind's
  params; the OpenAPI client is regenerated and the Android row of
  `.claude/rules/verification.md` is owed.
- `.claude/rules/architecture.md` (an adapter maps `kind` to "an HTTP
  status and a player-facing message") and CLAUDE.md's workspace graph
  change with steps 1 and 2.
- `copy.ts` and the hand-written `strings.xml` files stop being edited
  by hand once step 2 ships; `apps/web/CLAUDE.md` and
  `apps/android/CLAUDE.md` say so.
- The player projection gains the scaffold, the chrome phase and each
  shown word's support level; `players` gains `scaffold`, a migration.
- ADR 036's recognition and recall gain the `none` branch: the cue and
  the choices are definitions instead of glosses.
- ADR 015's mail is per language.
- `docs/lore/names.md` stays the Spanish source until step 2 moves it
  into `es.json`; `docs/setting/` names the English.

## Amendment (2026-11-12): a frame's support

Settled under the owner's delegation for #1062, judged first by the learner's goal of using real American English and second by the rule that a new player always knows where to go next. Checked at `23043d95`: `supportLevelOf(held, isPlacedOut, scaffold)` (`packages/domain`) answers `{ shown, help }` and `supportTextOf` its `{ text, language }`; `WordSupportSchema` (`packages/contracts`) is `{ shown: 'beside' | 'onTap', text, language }`, and only `LessonState.words[].support` carries it, for a lesson's entering words. `DueReview` sends a recognition's `frame` and a recall's `gappedFrame`, and `LessonState.words[].reading` its `frame`, as plain strings, so no wire says which token of a frame is which word, and Android draws no support yet.

The table above rules "a word in game text". A frame on a review or a word reading is the text a learner reads most, and the sentence is where a word is used, so this amendment applies the table to it.

- **Every card-word token of a frame is supported by its own word's level**, on a recognition, a recall and a word reading alike: beside it under 7 days or with no card, on tap from 7, the English definition on tap from 30 under `es`, the definition throughout under `none`, a placed-out word with no card read as at 7 days. A token whose word the player holds no card for, a held-out word or one met by studying ahead, is supported beside it, as ADR 037's holdout and ADR 044's later frames already read. A frame word is never supported: it is no card and the content holds no gloss for it.
- **A review never shows support that answers it.** No token of the reviewed or read word carries one, on a recognition, a recall and a word reading alike, and for a unit that is every word of it: the shipped unit lesson (lesson 27) would otherwise gloss *Can you find out what time the office closes?* with *encontrar* on *find*, *Things like this go on in many towns.* with *ir* on *go*, and *She is at the school, I mean, at the office.* with *significar* on *mean*. On a recognition, no token whose support text equals the text of one of the choices carries one either. On a recall, the gap carries none, nor does any token whose support text holds, as a whole word in any letter case, any NGSL form of any word of the answer, by the same lemmatization as below: under `none` or past 30 days a neighbour's definition could spell it. Shipped entries carry no `acceptedForms`, so the lemma alone would miss the inflected and derived forms; in the shipped lexicon *team*'s "a group of people who work together" answers *How many ____ are on your team?*, *school*'s "children" answers *child*, *station*'s "building" *build*, *power*'s "used" *use*, *word*'s "meaning" *mean*, *list*'s "written" *write* and *write*'s "words" *word*, and a definition holding *find* would give half of *find out* away. On a recall the gap already holds every word of the answer.
- **The wire carries the frame as spans.** A `FrameSpan` is `{ text, support: WordSupport | null }`, and a frame is a non-empty array of them whose `text`s, joined in order, are exactly the frame shown. A span with a support is exactly one token of one card word; every other character, a frame word, punctuation, a space, the gap, sits in a span without one. `RecognitionReview.frame`, `RecallReview.gappedFrame` and `LessonState.words[].reading.frame` become spans, replacing the strings (CLAUDE.md, rebuild, never adapt). `LessonState.words[].support` stays as it is, the support of the lesson's own word on its list.
- **The server resolves tokens, the client never does.** Each frame's tokens are resolved to card words once, when the api loads the content, by the NGSL lemmatization (`ngsl-1.2-lemmatized-for-teaching.csv`) and the entry's `homographs` that the content gate already reads (ADR 037); a token whose form names more than one card word and that `homographs` does not settle gets no support. `homographs` maps a form to a lemma and cannot say that a token means none of the cards, so a frame gains `noCardSense`, the token forms it uses in a sense no card word teaches, and those tokens get no support: *like* in *Things like this go on in many towns.* is a preposition, and its card, *word-91*, is the verb *gustar*. The shipped frames already hold more of them: *right* in *I am at the office right now.* (its card is *correcto*), *end* in *We close the office at the end of the day.* (*terminar*, a verb), *top* in *The school is at the top of the hill.* (*máximo*), and *work*, a noun, in *I have a lesson after work.*, *We clean the school after work.*, *We go to work in a truck.* and *The pay for this work is food.* (*trabajar*, a verb). The content gate cannot see a sense. So the lexicon's writer fills `noCardSense`, the pull request lists each entry in check 7's table, and the delegated opus:high content reviewer validates it (ADR 037, check 7 as amended). Before the wire ships, one pass reads every shipped frame for these, the cases above being the known ones. The support level is derived on every read from the player's cards and scaffold, by `supportLevelOf` and `supportTextOf`, so a review rated during a session fades its word's support on the next read (ADR 005). The stored frame, the pending review's and the review log's, stays the string it is; spans are derived from it, and a stored frame that matches no content frame, after a content edit, becomes one span with no support.
- **Per token, never across tokens**, as ADR 044 has game text: a unit's words in a frame are supported one by one, by their own cards.

Considered and rejected:

- **Support on the frame's other tokens only, never the word reading.** Rejected: the word reading is the first time a word is used in a sentence, and its neighbours are the earlier lessons' words a beginner holds under 7 days.
- **No support on a review at all.** Rejected: a recall's cue is the meaning, and a frame the learner cannot read carries no context; the exclusions above close what would give the answer away.
- **The frame string plus offsets of the supported tokens.** Rejected: an offset counts UTF-16 units in TypeScript and Kotlin alike only while every frame is ASCII, and a span list needs no counting at all.
- **The client matching tokens to lemmas.** Rejected by N1: it would need the lexicon, its forms and the homographs on the phone.

## References

- `docs/research/english-pivot/decisions.md` §6.1, §7, §11 and §13;
  `research.md` §10 and §12.
- ICU MessageFormat on Android, `android.icu.text.MessageFormat`
  (API level 24):
  https://developer.android.com/reference/android/icu/text/MessageFormat
- ADR 015 (mail), ADR 034 (a native client per platform), ADR 035,
  ADR 036, ADR 037.
