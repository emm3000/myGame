# Lessons

Status: proposal. Every fact below is a proposal until the author accepts it; the frames and the es glosses wait on the owner's review (`docs/research/english-pivot/decisions.md` §3.6). The rules each line relies on are ADR 036's; the Spanish lines a player reads around a lesson are in `docs/lore/names.md`, The review.

A **lesson** brings a set of new words in through the library's study slot (ADR 036, rule 6), grouped by a theme, never by a semantic set (§3.2). Each **item** is one word: its lemma, its part of speech, its NGSL 1.2 rank, one US-English example frame, the frame's gapped form for recall, and one gloss per scaffold language (§3.4). The target is American English (ADR 035); S39 serves the `es` gloss only, addressed as tú where a gloss addresses anyone (ADR 036, Consequences).

## The word list

Every rank on this page is the `SFI Rank` of `NGSL_12_stats.csv`, the NGSL 1.2 (Browne, Culligan and Phillips, CC BY-SA 4.0), 2 809 lemmas, downloaded on 2026-11-04 from `https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv` (SHA-256 `2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44`). The api ships the same list beside the lessons (ADR 036, rule 4; #713).

## Lesson 1

**Theme:** *A day in town*, es *Un día en el pueblo*. The five words name the places and things of an ordinary day, where the player lives, studies, works, pays and eats, not five members of one category (§3.2, `decisions.md` §14.1). Lesson 1 is the first chrome lesson (ADR 037): its five words name the town's homes, school, work, money and food.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| home | noun | 161 | This is my home. | This is my ____. | hogar |
| school | noun | 146 | We are at school. | We are at ____. | escuela |
| work | verb | 67 | They work for us. | They ____ for us. | trabajar |
| money | noun | 201 | I do not have much money. | I do not have much ____. | dinero |
| food | noun | 367 | We have food for you. | We have ____ for you. | comida |

All five lemmas lie within the first 1 000; the highest rank is *food*'s, 367.

- **The frame** writes its lemma in the lemma's own form, never inflected, so the gapped form's answer is the lemma itself and the typed answer is compared against it alone (ADR 036, rule 4). No frame holds another word of the lesson, so neither a recognition nor a gapped frame gives a second answer away. Every other word of a frame is a frame word (`grammar.json`), since no lesson comes before lesson 1: this is ADR 037's frame rule, which the content gate checks. *I do not have much money.* is the one frame kept from the first draft; the other four held words no earlier lesson teaches (*new*, *town*, *walk*, *every*, *day*, *big*, *office*, *buy*, *week*) and were rewritten. The cards keep their word ids.
- **The gloss** of *home* is *hogar*, not *casa*: *casa* is the first gloss of *house* (NGSL 1.2 rank 165), and a recall cued by *casa* would ask for either. *Work* is glossed as the verb, *trabajar*, as its frame uses it.
- **Recognition** shows the lemma and its frame, and offers the five glosses as its choices, ordered as rule 3 orders them. **Recall** shows the gloss and the gapped form, and the player types the lemma (ADR 036, rule 2).
- Every frame has no contraction, no number and no proper name, so every token is a form of a headword as the NGSL teaching list lemmatizes it (*is* and *are* of *be*, *my* of *I*, *us* of *we*).

### Every word of every frame

Each word of the five frames, with its NGSL 1.2 rank, the headword its form belongs to, and the lemma whose frame holds it. Every word but the lemmas is a frame word admitted from lesson 1.

| Word | Headword | Rank | Read in |
|---|---|---|---|
| is, are | be | 2 | home, school |
| have | have | 8 | money, food |
| you | you | 10 | food |
| for | for | 12 | work, food |
| they | they | 13 | work |
| not | not | 14 | money |
| we, us | we | 16 | school, work, food |
| this | this | 19 | home |
| I, my | I | 20 | home, money |
| do | do | 21 | money |
| at | at | 23 | school |
| work | work | 67 | work |
| much | much | 91 | money |
| school | school | 146 | school |
| home | home | 161 | home |
| money | money | 201 | money |
| food | food | 367 | food |

### The near-miss against this lesson

Worked against ADR 036, rule 4, each with the NGSL 1.2 list above. *Wok* for *work* (a letter dropped) and *scool* for *school* are near-misses: neither is a headword, and both words have 4 letters or more. *Foot* for *food* (rank 576) and *house* for *home* (rank 165) are headwords, so each is Again with the correct form shown. All five lemmas have 4 letters or more, so every one of them admits a near-miss.

## Open questions

- Whether *A day in town* is read on screen before the town rebuild names the holding a town: the medieval fief still calls it *feudo* (`docs/lore/names.md`, The fief).
