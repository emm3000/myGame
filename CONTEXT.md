# CONTEXT.md

Glossary of the game's domain. One line per term, the term as code and docs use it, and the OGame concept it replaces where one exists. Names a player sees come from `docs/setting/` and enter here second. Decisions behind the terms: `docs/adr/`.

The game is Townword, a present-day town the player grows into a city (ADR 035). This file holds one vocabulary, the town's. A term that names something the code does not do yet says so in its entry; ADR 041 orders what ships after the cutover.

## Holdings

- **Player** — an account; holds one town. Identified by `PlayerId`.
- **Town** — the one holding a player develops, named by the player on the first signed-in visit and founded at the lowest free site; labelled **city** once its supplied people reach the content's count. Replaces *planet* (ADR 035, ADR 040).
- **Address** — `region:area:site`, the town's place on the map. A town takes the lowest site of the first region that no town holds (ADR 040).
- **Region** — the great area a town lies in, a number in the data. Areas and sites inside it are numbered. Replaces *galaxy*.
- **Area** — a numbered part of a region with the content's `sitesPerArea` sites and one terrain, shared by every site in it. Replaces *system*.
- **Site** — the numbered place in an area that one town holds; free until a town is founded on it.
- **Region map** — one area of the viewer's region at a time, its sites free or holding a town, the town's own area first, browsable from area 1 to one past the last area holding a town (ADR 014).
- **Terrain** — what an area is made of: fields, river or hills. It adds the content's `terrainBonusPerHour` to the rate of the resource it favours (fields food, river power, hills material), on top of the producers, and forbids nothing.

## Resources

- **Resource** — one of money, food, power, material. Each has an amount, a rate per hour and a capacity on a town.
- **Money** — the currency, accruing from the town's tax at the content's base rate; no building produces it.
- **Food** — a stock like the others, produced by the farm; the homes pay for it from level 2 (ADR 042).
- **Power** — a stock like the others, produced by the power station.
- **Material** — the building material, produced by the factory.
- **People** — the town's workforce, derived and never stored: supplied by a base count and the homes, occupied by building levels and, when the office ships, by hires; **free** or **at work** (ADR 007, ADR 040).
- **Storage** — the building that sets the capacity of all four stocks at once.
- **Tax** — the money rate every town earns from founding, with no building.
- **Accrual** — the amount a resource holds at a later instant, computed on read segment by segment: the span since the stored instant is split at every season boundary it crosses, and each segment accrues at the rates in force at its start as `max(amount, min(capacity, amount + rate × elapsed))`, floored on its own. A stock under the capacity fills up to it, a stock above it (after a refund) freezes, neither accruing nor clamped (ADR 005, ADR 016).

## Buildings

- **Building** — a structure on a town with a level; each level has a cost, a build duration, people and an effect. Seven kinds: homes, farm, factory, power station, storage, school and office (ADR 040).
- **Homes** — supply people.
- **Farm / Factory / Power station** — the producers of food, material and power.
- **School** — the building where lessons are studied, one at a time in its lesson slot. Its built level, never the projected one, shortens a lesson and sets the learning cap (ADR 040).
- **Office** — the building where workers and trucks are hired.
- **Build slot** — the single place on a town where the building work in progress builds; one at a time. A slot with work in progress is **busy**.
- **Building work** — raising one building one level, charged at its start. The **waiting list** holds the work queued behind the busy slot, at most the content's cap; each entry keeps the building, the target level, the cost it charged and the duration fixed when it was queued, and starts the instant the slot frees (ADR 011, ADR 040).
- **Stop** — the single atomic mutation that removes one building work, the one in the busy slot or one waiting, and refunds its cost in full (ADR 011, ADR 040).
- **Resolve** — applying the finished building work and the finished lesson to the town, on read, in the order they finished, each written to Town News in the same transaction (ADR 005, ADR 013).

## Hires and jobs

- **Hire** — a worker or a truck, hired at the office in one hiring order at a time, occupying people and eating nothing. A **team** is the hires sent out together (ADR 018, ADR 021, ADR 040).
- **Job** — a team's trip to a free site for whole hours, coming back with **pay** fixed at dispatch from the site's terrain, never money; **called back** before it ends, it returns with the partial pay. One team out at a time; its hires stay counted and occupied while away (ADR 019, ADR 040).
- **Waste site** — a free site holding waste of one of three **sizes**, placed by a hash of its address on the content's fraction of the free sites; its **waste** regrows from 0 at its last clean-up up to the size's most, and a site never cleaned holds the most (ADR 020, ADR 040).
- **Clean-up** — a team's trip to a waste site with no hours there; the waste and the team's **strength** (the sum of each hire's strength) are fixed at dispatch. A team whose strength covers the waste cleans it at the arrival, the site's waste starting again from 0, and comes back with money and material per point of waste, capped by the carry; a smaller team comes back with nothing. Nobody is lost. Called back on the way out, it cleans nothing (ADR 020, ADR 040).

## Lessons and skills

- **Lesson slot** — the school's single place for the lesson in progress; one lesson at a time, no queue. A slot with a lesson in progress is **busy**.
- **Skill** — what the player knows at a level, earned by retention and never bought: a level is earned at the review after which every word of its lesson the player holds a card for, and at least one, stands at 7 days of stability or more and was last recalled unaided, rated Good, at least 7 days after the review before it; stored with that instant and never taken back. Every lesson of the curriculum earns one level, +5 %, of the resource its place in the **skill cycle** names, and nothing else earns one: not a review, not placement, not a released lesson. One resource's levels add up into one percent, so food at level 48 runs at 3.4 times its rate without skills, in every town the player holds. Replaces OGame's *technology* (ADR 035, ADR 036, ADR 039).
- **Skill cycle** — the game's resources in a fixed order, food first, that the curriculum's lessons raise in turn: lesson 1 food, lesson 2 the next, and so on round the cycle, so any run of as many lessons as there are resources raises each once (ADR 039).

## The account

- **Verified email** — a player's email once proven to receive mail, by following the verify link sent to it. It gates only a password reset, never sign-in or play; until then the signed-in shell shows a banner that resends the link (ADR 015).
- **Account token** — a single-use link token of kind `verify` or `reset`, mailed to a player and stored as a digest, never in clear. A verify token lives 24 hours, a reset token 1 hour; issuing one retires the player's earlier token of that kind, and one unknown, expired, used or of the other kind is refused as `TokenInvalid` (ADR 015).

## Time

- **Instant** — a point in time from the `Clock` port; the domain never reads the wall clock.
- **Duration** — a length of time in seconds; build times and lesson times are durations. A build or lesson duration is fixed once, when the work starts, from the content's seconds and the percents in force at that instant, the season's for both and the school's built level for a lesson, rounded up to whole seconds in one step; it never changes while the work waits or runs (ADR 011, ADR 012, ADR 017).
- **Season** — one of spring, summer, fall, winter, in force over the whole world at once for a fixed number of days set by the content's calendar, from its start, included, to the instant it ends, excluded. Each season scales every resource's rate by a whole percent from content, applied last (summer raises food, winter lowers power), and scales build and lesson durations by a build and a study percent from content, fixed when the work starts (summer shortens building, winter shortens lessons); there is no season before the calendar's epoch, and every percent reads 100 until then (ADR 016, ADR 017).
- **Year** — four seasons, counted from the first spring at the calendar's epoch: year 1 is the first. There is no named calendar and no era (ADR 016).

## Learning

- **Word** — one entry of the **lexicon**, the curriculum's list of card words: its lemma, its part of speech, its one to three **frames** (ADR 044), one gloss per scaffold language and an English **definition**, under an opaque id that never changes and is never the lemma. An NGSL word's 1.2 rank is read from the NGSL file, never copied; an off-list word and a unit have none. A **frame word** is a closed-class word among the NGSL's first 100 ranks (*the*, *of*, *do*), listed in the grammar inventory alone, in the one structure that admits it, never in the lexicon and never a card; a **card word** is every other word, taught by exactly one lesson (ADR 035, ADR 037).
- **Grammar inventory** — `grammar.json`, the structures in curriculum order, each with its CEFR-J level, the frame words and the inflections it admits and the lesson that admits it; an inflection is a form of a frame word (*is*, *my*, *was*) or a card word's ending (*-s*, *-ed*, *-ing*, *-er*, *-est*). A frame uses no frame word or inflection its lesson does not admit (ADR 037, check 6).
- **Band** — one of three slices of the NGSL 1.2 by rank: 1 to 1 000, 1 001 to 2 000, 2 001 to 2 809. Progress, placement and the holdout are counted per band; a unit counts in none (ADR 037, ADR 044).
- **Multi-word unit** (**unit**) — a card word of two or more words with a meaning of its own, its lemma the words in base form: a **phrasal verb**, a verb and particle of the PHaVE List taught in its most frequent sense, or a **phrase**, an item of the PHRASE List that is no PHaVE phrasal verb. Every word of it is an NGSL headword or a frame word, and it is **ready** once an earlier lesson teaches or admits each of them; a unit with a held-out word enters no card until that word is released. Not yet shipped (ADR 044).
- **Frame** — an English sentence that shows a card word in use, holding its lemma once in the lemma's own form and otherwise only frame words admitted by the lesson it is written for and card words of earlier lessons; its gapped form replaces each word of the lemma with a blank for recall. The **anchor frame** is written for the word's own lesson and is what a word reading and a recognition show; up to two **later frames** are each written for a later lesson and shown in a recall once the stage reaches it, the one chosen by a hash of the word, the frame's position and the card's last review. A due review keeps the frame it first showed until it is rated. The lexicon holds no later frame yet (ADR 036, ADR 037, ADR 044).
- **Lesson** — five new card words, five to nine in a band's last lesson, grouped by a theme, never by a semantic set, brought in through the school's lesson slot, costing nothing; its words' cards enter at its finish, once per player; the school's built level caps how many words are in learning at once. Replaces nothing in OGame (ADR 035, ADR 036, ADR 037).
- **Unit lesson** — a lesson of five ready units, five to nine in the last, following every four band lessons from the first unit lesson on; it belongs to no band, is never placed out, and the stage skips it. Not yet shipped (ADR 044).
- **Chrome lesson** — one of the first lessons, which teach every card word the English chrome uses, the game nouns included, whatever their band; never placed out, and their words count in no measure (ADR 037, ADR 038).
- **Stage** — the curriculum's lessons from the first up to the first one a player has neither studied nor placed out of, unit lessons skipped; a text or a later frame written for a lesson is shown only to a player whose stage reaches it (ADR 037, ADR 044).
- **Content gate** — the test over the shipped learning content, run by `pnpm gate`: the lexicon, the lessons' order, the frame rule, a running text's coverage, the glosses of every shipped scaffold, the grammar inventory and the skill curve; with the owner's review and merge of every gloss, frame, definition and text (ADR 037, ADR 039).
- **Placement** — the optional check at the first sign-in: per band, 30 words to recognise; a band passed at 29 of 30 is **placed out**, its lessons counted in the stage and still open to study (ADR 037).
- **Card** — one player's memory of one word, the player's and never the town's: its state (learning, review or relearning), its step, its stability, its difficulty, the instant and the rating of its last review, the instant it entered, and the instant its last review proved it retained, if it did. The frame a due review first showed, a hint and a near-miss wait on a **pending review** beside it until the rating. Its retrievability and its due instant are derived on read, never advanced by a process, by FSRS as ADR 036 pins it. Replaces nothing in OGame (ADR 035, ADR 036).
- **Review** — one answer to a due card, graded by the server: a **recognition** (choose the meaning among the lesson's words) while the card is learning, a **recall** (type the English from the gloss, with a hint on request) from then on. Rated Again when wrong, Hard when right after a hint or a near-miss, Good when right, never Easy; it updates the card, pays nothing, and is recorded in the **review log**, the append-only record of every review, with the frame it showed. Only a due card is reviewed. Replaces nothing in OGame (ADR 035, ADR 036).
- **Near-miss** — a typed answer one edit away (a letter added, dropped or changed, or two neighbours swapped) from a word of 4 letters or more, and no NGSL 1.2 word itself; for a unit, that slip inside one of its words, or the unit with one space dropped. It is not rated, but prompts one more answer (ADR 036, ADR 044).
- **Stability** — the days a card holds before its chance of recall falls to the desired retention. A 7-day stability is the floor a skill level needs; the unaided recall a week after the review before it is the other condition, under Skill (ADR 035, ADR 036).
- **Scaffold language** — the language a player picks to support the English: `es` or `none` at launch, a player field changed any time. Under `es` a word is supported by its Spanish gloss, under `none` by its English definition; the support fades with the word's stability: the **support level**, the server's answer per word, shows the help beside a word under 7 days of stability or with no card, on tap from 7 days, and under `es` the English definition on tap from 30 days; a placed-out word with no card reads as at 7 days. English is always the target, never a scaffold (ADR 035, ADR 038).
- **Chrome** — the copy of the game's screens. Under `es` it is Spanish until every chrome lesson is studied, both languages until their skills are earned, English after: the **chrome phase**, derived on read and never going back. **Fixed copy**, the account screens, refusals, review verdicts and mail, is always in the scaffold language (ADR 038).
- **Message catalog** — one ICU MessageFormat file per language with one key set, the single source of every string a client or a mail shows, generating the web's copy and Android's `strings.xml` (ADR 038).
- **Holdout** — the 10 % of a band's card words, outside the chrome lessons, drawn and stored per player when the player starts the band, skipping any word an entered unit card holds (ADR 044), never entered as cards and tested in the band's external check 8 and 24 weeks after its start against practised words of the same lessons, so practised against withheld is a comparison within one player; released after that band's 24-week check (ADR 035, ADR 037).
- **In learning** — a card whose stability is under 7 days; not the card's FSRS learning state, which lasts minutes. The **learning cap**, set by the school's level, bounds how many cards are in learning once a lesson's words enter, so a lesson start past it is refused (ADR 040).
- **Word reading** — a word shown with its gloss and frame, from its lesson's start until its first review, never for a held-out word. It teaches the word, and changes no card (ADR 042).
- **School path** — a lesson's words on the way to its skill, counted by each word's **standing**: not started, recognize, recall, hold, retained. A standing is derived from the card, so a lapse moves it back, and so does a Hard on a retained word (ADR 042).
- **Next step** — the card first on every town home, the one place the player goes next: reviews, a running lesson, a lesson to study, or caught up, the first that holds, answered by the server. Only caught up shows a goal, a building's. Its screen title is *What is next* (ADR 042).

## The Report and Town News

- **The Report** — the screen of the reviews due, then the Town News since the player last closed it (ADR 027, ADR 040).
- **Town News** — the town's events, each with its instant, written in the transaction that applies them (ADR 013, ADR 040).
- **Tip** — one dismissible line shown the first time a concept matters, seen tips stored per player (ADR 027, ADR 040).

## Society

- **House** — a group of players under one banner. Replaces *alliance*. Not in this phase (W2).

## Avoided words

`planet`, `colony`, `colonist`, `colony ship`, `galaxy`, `galaxy view`, `metal`, `crystal`, `deuterium`, `energy` (say power), `fleet`, `ship`, `shipyard`, `alliance`, `tech`, `technology`, `research` (say lesson), `tick` (there is no tick), `population` (people are derived, never grown), `log` alone, `history`, `feed` (say Town News; the review log is its own term), `confirmed email` (say verified email), `recovery` (say reset), `flashcard`, `deck` (say card), `quiz` (say review), `chunk`, `expression`, `formulaic sequence`, `collocation` (say unit, phrase or phrasal verb), `native language`, `L1` (say scaffold language), `XP`, `streak` (retention is the progress; ADR 028 refuses streaks).
