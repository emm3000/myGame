# Lessons

Status: proposal. Every fact below is a proposal until the author accepts it; the frames and the es glosses wait on the owner's review (`docs/research/english-pivot/decisions.md` §3.6). The rules each line relies on are ADR 036's; the Spanish lines a player reads around a lesson are in `docs/lore/names.md`, The review.

A **lesson** brings a set of new words in through the library's study slot (ADR 036, rule 6), grouped by a theme, never by a semantic set (§3.2). Each **item** is one word: its lemma, its part of speech, its NGSL 1.2 rank, one US-English example frame, the frame's gapped form for recall, and one gloss per scaffold language (§3.4). The target is American English (ADR 035); S39 serves the `es` gloss only, addressed as tú where a gloss addresses anyone (ADR 036, Consequences).

## The word list

Every rank on this page is the `SFI Rank` of `NGSL_12_stats.csv`, the NGSL 1.2 (Browne, Culligan and Phillips, CC BY-SA 4.0), 2 809 lemmas, downloaded on 2026-11-04 from `https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv` (SHA-256 `2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44`). The api ships the same list beside the lessons (ADR 036, rule 4; #713).

## Lesson 1

**Theme:** *A day in town*, es *Un día en el pueblo*. The five words name the places and things of an ordinary day, where the player lives, studies, works, pays and eats, not five members of one category (§3.2, `decisions.md` §14.1). Lesson 1 is the first chrome lesson (ADR 037): its five words name the town's homes, school, work, money and food.

| Lemma | Part of speech | NGSL 1.2 rank | Frame | Gapped form | es gloss |
|---|---|---|---|---|---|
| home | noun | 161 | We have a new home in this town. | We have a new ____ in this town. | hogar |
| school | noun | 146 | I walk to school every day. | I walk to ____ every day. | escuela |
| work | verb | 67 | They work in a big office. | They ____ in a big office. | trabajar |
| money | noun | 201 | I do not have much money. | I do not have much ____. | dinero |
| food | noun | 367 | We buy food for the week. | We buy ____ for the week. | comida |

All five lemmas lie within the first 1 000; the highest rank is *food*'s, 367.

- **The frame** writes its lemma in the lemma's own form, never inflected, so the gapped form's answer is the lemma itself and the typed answer is compared against it alone (ADR 036, rule 4). No frame holds another word of the lesson, so neither a recognition nor a gapped frame gives a second answer away.
- **The gloss** of *home* is *hogar*, not *casa*: *casa* is the first gloss of *house* (NGSL 1.2 rank 165), and a recall cued by *casa* would ask for either. *Work* is glossed as the verb, *trabajar*, as its frame uses it.
- **Recognition** shows the lemma and its frame, and offers the five glosses as its choices, ordered as rule 3 orders them. **Recall** shows the gloss and the gapped form, and the player types the lemma (ADR 036, rule 2).
- Every frame has no contraction, no number and no proper name, so every token is a headword as written.

### Every word of every frame

Each word of the theme and of the five frames, with its NGSL 1.2 rank; *Read in* names the theme or the lemma whose frame holds it. Every one is a headword in the form the frame writes it, and every rank is within the first 1 000.

| Word | Rank | Read in |
|---|---|---|
| the | 1 | food |
| to | 5 | school |
| a | 6 | theme, home, work |
| in | 7 | theme, home, work |
| have | 8 | home, money |
| for | 12 | food |
| they | 13 | work |
| not | 14 | money |
| we | 16 | home, food |
| this | 19 | home |
| I | 20 | school, money |
| do | 21 | money |
| work | 67 | work |
| new | 79 | home |
| day | 85 | theme, school |
| much | 91 | money |
| school | 146 | school |
| week | 157 | food |
| home | 161 | home |
| every | 180 | school |
| big | 184 | work |
| money | 201 | money |
| buy | 242 | food |
| walk | 339 | school |
| office | 343 | work |
| town | 364 | theme, home |
| food | 367 | food |

### The near-miss against this lesson

Worked against ADR 036, rule 4, each with the NGSL 1.2 list above. *Wok* for *work* (a letter dropped) and *scool* for *school* are near-misses: neither is a headword, and both words have 4 letters or more. *Foot* for *food* (rank 576) and *house* for *home* (rank 165) are headwords, so each is Again with the correct form shown. All five lemmas have 4 letters or more, so every one of them admits a near-miss.

## Open questions

- Whether the owner accepts the five frames and the five es glosses (§3.6), *hogar* above all. Under ADR 037's frame rule four of the five frames fail, each holding words no earlier lesson teaches (*new*, *town*, *walk*, *every*, *day*, *big*, *office*, *buy*, *week*); only *I do not have much money.* passes. They are rewritten when lesson 1 moves into the lexicon; its cards keep their word ids.
- Whether *A day in town* is read on screen before the town rebuild names the holding a town: the medieval fief still calls it *feudo* (`docs/lore/names.md`, The fief).
