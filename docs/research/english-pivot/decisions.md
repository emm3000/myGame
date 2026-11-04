# English pivot: the design tree, every branch settled

Status: settled by the owner's grilling on 2026-11-04 and recorded in ADR 035, which wins wherever the two differ. The tree was first decided under the owner's delegation and revised the same day for the owner's change of setting: a present-day town the player grows into a city, named Townword, replacing medieval Vadoalto, with the visual design rebuilt. Evidence: `research.md` beside this file; a citation below names its section there (§n). Repo facts are checked against `trunk` at `54a3aa60`.

Each decision is one line: **the choice**, *why* (evidence), and *rejected* (the main alternative).

## 0. The core idea in two lines

What the mayor keeps in memory is what the town can do: words learned at the school and retained under spaced, server-graded retrieval earn the skills that multiply production, and the economy pays for the school that admits more words.
Every building, lesson, job and season writes the Town News in graded English at 95–98 % known-word coverage, so playing the town builder is reading comprehensible everyday English, and the return visit the game already asks for is when the due reviews are waiting.

## 1. Core loop

| # | Decision | Why | Rejected |
|---|---|---|---|
| 1.1 | **Retained words are capability, never currency.** No review, lesson or correct answer pays resources. A skill level is earned when the items of its lesson reach a retention threshold (7-day FSRS stability), and multiplies one resource's rate by a content percent, as an art does today. | Engagement- and completion-contingent rewards lowered free-choice intrinsic motivation (d = −0.40, −0.36), while positive feedback raised it (d = 0.33) (§12, Deci et al. 1999); a skill earned by retention is competence made visible and unlocks capability (§12). Residual risk: a level earned by retention is still performance-contingent (d = −0.28 in the lab); whether in-game effects act like the lab's tangible rewards is untested, my inference. | A payout per completed review (my first draft): it is exactly the completion-contingent pattern; and a quiz toll before each build, which makes learning a tax. |
| 1.2 | **Only due items are reviewable**; there is no extra-practice button that changes a card. | Massed cramming is the condition spaced practice beats (§1); honours the refused *Grinding* hook (W10, ADR 028). | Unlimited practice: massing, and a reason to grind. |
| 1.3 | **The game's text is the input.** Town News items, the Report, building and skill cards, job notices and the season's weather news are English written to the player's curriculum stage. | Comprehension and incidental vocabulary gain need high lexical coverage (§4) and many meetings with a word (§5, Uchihara et al. 2019); a game rereads the same frames constantly, which is the repetition graded readers buy. | A separate lesson screen beside the game: the strategy and the learning stop reinforcing each other, and the classic edutainment split appears. |
| 1.4 | **Decisions are comprehension tasks.** A job notice and a clean-up request carry the information the player needs to choose, in English only (with per-item glosses, §7 below). | TBLT's meaning-first, outcome-driven task (§8) and the interaction literature's information gap (§6): the language is the means, the game outcome the goal. | Multiple-choice comprehension questions after a text: a test about the text instead of a use of it. |
| 1.5 | **New words enter through the school's lesson slot**: a study introduces one *lesson* of new items, studied blocked (together, not mixed with other lessons), and the school's built level raises how many items may be *in learning* at once. The economy funds the school, so the strategy layer buys learning capacity. | Keeps the slot grammar (ADR 012) and bounds the review load each new item adds later (design reasoning, no study); blocking beat interleaving for words (g = −0.39 for interleaving, §3). | Unbounded new words per day: the review load explodes a week later and the player quits. |
| 1.6 | **Absence never costs.** A week away leaves the stocks accruing and the reviews waiting, overdue but never lost; a skill once earned is never taken back when retrievability falls. FSRS schedules an overdue item from its actual elapsed time. | W10 and `docs/research/engaging-strategy-ui.md` (no punished absence, no streaks); longer gaps help delayed retention (§1, Kim & Webb 2022), so a late review is not a wasted one. | Duolingo-style streaks: they raise short-term return (Silverman & Barasch 2022, cited in the repo note) but are the refused hook. |

## 2. Learner and first-release scope

| # | Decision | Why | Rejected |
|---|---|---|---|
| 2.1 | **Adults (16+), L1 Spanish, CEFR A1 to A2 at entry, aiming at B1.** | High-frequency bands give the most coverage per word learned (§4; the NGSL's ~92 % claim is the authors' own), so beginner to B1 is where a frequency-first design pays most; L1 glosses help most at low proficiency (§10); the owner can review Spanish glosses. Minors are out for data protection, not evidence. | Advanced learners: they need low-frequency and academic vocabulary the game's text cannot supply naturally. |
| 2.2 | **First release: one L1 scaffold (Spanish) plus an English-only mode, one curriculum track, reading and word retrieval, the strategy layer rebuilt as a present-day town (§9, §10).** | Smallest scope that runs the whole loop; every extra L1 multiplies gloss content (§3 below). | Launching five L1s: content cost without a single learner proving the loop. |

## 3. Content model

| # | Decision | Why | Rejected |
|---|---|---|---|
| 3.1 | **Vocabulary order: NGSL 1.2 by frequency band** (2 809 words), the game's own names chosen from it (§10.3), and the few that fall outside it taught on top and never counted toward progress. | Frequency predicts usefulness and coverage (§4); the NGSL leads at the top 1 000–2 000 headwords (Dang & Webb 2016) and is CC BY-SA 4.0, so it can ship in content. | BNC/COCA2000: better average coverage and rated more useful by teachers (§4), but its licence is unverified here; revisit if it is open. Oxford 3000 / EVP: proprietary. |
| 3.2 | **A lesson groups items thematically, never as a semantic set** (not "five tools", but "a day at the mill": *cut*, *heavy*, *carry*, *river*). | Semantically related words gave no lower scores but more interference errors (Nakata & Suzuki 2019, research.md addendum); a cheap hedge on mixed evidence. | Lessons by category (colours, animals, buildings). |
| 3.3 | **Grammar order: a CEFR-aligned inventory of structures** (Council of Europe descriptors, §15) as a pragmatic sequence for which structures a text may use. | No study in this brief establishes a teachable grammar order; aligning with CEFR at least matches placement. Weak, labelled so. | Building on a developmental-sequence theory (processability) as if it were settled. |
| 3.4 | **An item is data**: lemma, part of speech, NGSL rank, one or more English example frames, audio, and one gloss per scaffold language, under `apps/api/content/` behind a port (ADR 008's pattern). | N5: content changes without a code deploy; glosses per L1 are content, which ADR 010 itself foresaw ("names move into content"). | Items in client copy files: two clients would duplicate the curriculum. |
| 3.5 | **Texts are generated offline, reviewed, and committed; never generated at runtime.** | Determinism (server authority, reproducible tests), cost, and quality control. | Live LLM text per player: unreviewable, non-deterministic, a third-party dependency on every read. |
| 3.6 | **Quality gate for generated content, in CI:** a lemmatised coverage check (every text within its stage's vocabulary plus at most 5 % new tokens for assisted reading and 2 % for unassisted, each new token glossed), a grammar check against 3.3, a glossary check that every gloss exists for every shipped L1, then a human review (the owner for es) before merge; after launch, item statistics flag items whose error rate or FSRS difficulty is an outlier. | Coverage is the measurable proxy for comprehensibility (§4: 95 % minimal, 98 % optimal, both heuristics after Kremmel et al. 2023); a check makes it a gate, not a hope. | Trusting the generator's prompt to "use simple words". |

## 4. Scheduler

| # | Decision | Why | Rejected |
|---|---|---|---|
| 4.1 | **FSRS (default parameters, desired retention 0.90)**, a pure function in `packages/domain`. | Spacing across days is strong (§1); FSRS descends from the peer-reviewed SSP-MMC model (Ye et al. 2022) and is the best non-neural model in the community srs-benchmark, which measures recall *prediction*, not learning, and is not peer-reviewed (§14). Its predictions also give the calibration metric of 8.2. Kim & Webb found expanding and equal schedules equal in L2 (§1), so FSRS's claim is efficiency and measurement, not more learning. | SM-2: an unvalidated heuristic (§14); fixed equal intervals: defensible on Kim & Webb but blind to item difficulty; HLR: peer-reviewed, ranked below FSRS in the benchmark. |
| 4.2 | **Memory is lazily evaluated like a stock.** Stored per player and item: `(stability, difficulty, lastReviewAt, state)`; retrievability `R(now)` and `due` are derived on read; nothing advances a card. | It is ADR 005 applied to memory: the same `(stored, storedAt, now)` derivation, no cron (N2, W7). | A daily job that moves cards into a due list. |
| 4.3 | **The server grades.** The client sends the raw answer; the server holds the key, judges it, maps it to a rating (wrong → Again; correct after a hint → Hard; correct → Good; Easy never inferred), updates the card in the town's transaction (today the fief's) and answers the new projection. | N1: the server is the only source of truth; a client-graded review is a client-written score. | Client-side grading with a signed result. |
| 4.4 | **Per-player FSRS parameter fitting comes later**, once a player has hundreds of reviews. | Design reasoning: a fit on few reviews overfits; the benchmark ranks default-parameter FSRS above SM-2 (§14). | Fitting from day one. |
| 4.5 | **Rhythm: hours for the strategy, days for memory.** Reviews are due on FSRS's intervals; builds keep their content durations; the Report merges both on the return. | The best gap grows with the retention interval (§1, Cepeda et al. 2008), so memory spacing is days to weeks, not a build's minutes. | Forcing reviews onto build timers: intervals too short to space. |

## 5. Language skills

| # | Decision | Why | Rejected |
|---|---|---|---|
| 5.1 | **Ship first: reading (the game text) and word retrieval, receptive then productive**: a new item is first recognised (choose the meaning), then recalled (type the English from the L1 cue or a gapped frame). | Retrieval is strong, g = 0.73 with feedback and 0.59 for paired associates, the L1↔L2 pair format (§2, Rowland 2014); learning direction moderates form versus meaning recall (§10, Webb et al. 2020); reading supplies repetition in context (§5). | Flashcards in recognition only: easier, and leaves the learner unable to produce. |
| 5.2 | **Listening second**: audio for every item and report line, playable; images for concrete nouns; audio-only review cards in the next slice. | Multimodal glosses add g = 0.46 immediately, 0.28 delayed (§9, moderate); listening needs high coverage too (§4, Nation 2006). | Shipping listening first: needs audio QA at once. |
| 5.3 | **Writing third** (short typed replies to a visitor's request, graded against a set of accepted answers), **speaking last** (ASR scoring later, never a gate). | Output and interaction are moderately supported (§6); automatic scoring of open output is the least reliable part, and a wrong correction would teach an error (design reasoning). | Speech recognition at launch. |

## 6. Feedback

| # | Decision | Why | Rejected |
|---|---|---|---|
| 6.1 | **Every wrong retrieval gets immediate feedback with the correct form**, the learner's form beside it with the difference marked, and the item comes back once more before the Report closes. | Retrieval with feedback g = 0.73 vs 0.50 overall (§2, Rowland 2014); feedback works, durably (§7, Li 2010; Lyster & Saito 2010). | Silent right/wrong: the learner retains the error. |
| 6.2 | **A typed near-miss gets one prompt before the answer** (first letter, or a metalinguistic cue in the L1), then the correct form. | Prompts beat recasts (§7, Lyster & Saito 2010); explicit metalinguistic feedback beat recasts at delay (Ellis et al. 2006). Contested: Li 2010 found implicit feedback more durable. | Recast only (just showing the right form). |
| 6.3 | **Feedback is informational, never a loss.** No resource is taken for a wrong answer. | Positive feedback raised intrinsic motivation (d = 0.33), controlling contingencies lowered it (§12, Deci et al. 1999). | A penalty per error. |

## 7. Scaffold language

| # | Decision | Why | Rejected |
|---|---|---|---|
| 7.1 | **Per item, ruled by the item's own memory state.** In game text, an item new or in learning is marked and shows its L1 gloss in a margin pop-over on first sight; once its FSRS stability passes 7 days, the gloss is on tap only; past 30 days, an English definition or image on tap; a tap on a mastered item is logged as a lapse signal. | Glossed reading roughly doubled words learned, L1 glosses beat L2 glosses, and in-text glosses were among the least effective forms (§10, Yanagisawa et al. 2020); expertise reversal argues for fading by measured mastery (§10, Kalyuga et al. 2003). The 7- and 30-day points are design choices: no L2 study gives a fade point. | A global switch by level: one known word and one unknown get the same support. |
| 7.2 | **UI chrome fades globally by stage**: L1 at A1, bilingual labels once the learner's estimated known items reach the UI's word list, English beyond. | The chrome is a small closed set; per-word fading of buttons would make the layout jump under the player's fingers (usability, WCAG). | Per-item fading of every button label. |
| 7.3 | **Account, safety and payment-free legal copy is always in the L1** (sign-up, reset, refusals that block an action). | A misunderstood refusal or reset mail is a usability failure, not a learning moment. | Everything in English. |
| 7.4 | **"English only" is a scaffold choice like any L1**, for learners who want no translation. | Autonomy (§12). | Forcing a scaffold. |

## 8. Measurement

| # | Decision | Why | Rejected |
|---|---|---|---|
| 8.1 | **Placement: a short check sampled from NGSL bands, in the meaning-recognition format of the Updated Vocabulary Levels Test**, setting the starting band; items in known bands enter with an initial stability instead of as new. | The UVLT is validated for band-level knowledge (§15, Webb et al. 2017); the adaptive part is my extrapolation. LexTALE was built for advanced learners (Lemhöfer & Broersma 2012, addendum). | No placement: A2 learners redo 1 000 words they know. |
| 8.2 | **Progress the owner sees:** estimated known items now (Σ R(now) over items, lazily derived), items past 30 days' stability, reviews due, the true recall rate per review against FSRS's predicted rate (calibration), and per-band coverage. | All derived from stored review logs with no job (N2). | A single XP score: says nothing about retention. |
| 8.3 | **What the product's data proves: item-level retention of what was practised, and nothing more.** Proficiency gains need an external measure: the UVLT-format check again at 8 and 24 weeks, plus a **holdout**, a random 10 % of each band's items withheld from practice per player and tested in that check, so practised-versus-withheld is a within-player comparison; every figure is reported for all starters (intention to treat), never completers only. | App studies are vendor-funded, completers-only, without randomised controls, with 36 %+ attrition where reported (§11); a holdout gives the product its own causal comparison. | Claiming "users learn" from streaks and review counts. |
| 8.4 | **The review log is append-only**: every review stores item, instant, answer, rating, elapsed days and the card before and after. | Needed for FSRS fitting (4.4) and for 8.2–8.3; the chronicle's write-in-the-same-transaction rule (ADR 013) applies. | Keeping only the current card state. |

## 9. What the strategy layer becomes in a present-day town

The rule for this section: a mechanic stays when it carries the OGame loop (produce, spend, wait, return); a new thing enters only when it serves learning; what serves neither goes. NGSL 1.2 ranks (of 2 809, from `NGSL_12_stats.csv`, downloaded 2026-11-04) follow each name; **flag** marks a name outside the list or in its last band.

| Today (medieval) | Becomes | Verdict | Why |
|---|---|---|---|
| Fief | **Town** (364), grown into a **city** (269) | Rebuilt | The holding. *City* is a label the town earns at a people count in content, derived on read; no new mechanic. |
| Player, lord | **Mayor** (2779, **flag**: last band) | Renamed | No higher-frequency word names the role; *you* carries most lines. |
| Wood, stone, iron, gold, food (5) | **Money** (201), **food** (367), **power** (331), **material** (571) (4) | Rebuilt | Three medieval building materials collapse into one everyday word; fewer resources mean less to read on every screen; gold becomes money. |
| Peasants (supplied by the fief and the farm, ADR 007) | **People** (57), supplied by **homes** (161), employed by buildings (*free people*, *at work*) | Rebuilt | Keeps ADR 007's derived workforce; the supply moves from the farm to homes, so the farm only grows food. |
| Sawmill, quarry, iron mine | **Factory** (1530) for material, **power station** (331 + 709) for power | Rebuilt | Two producers for two resources. |
| Farm | **Farm** (1083) | Kept | Food only. |
| Warehouse | **Storage** (2707, **flag**: last band; *warehouse* is not in the NGSL) | Renamed | The capacity building. *Store* (617) was rejected because it means *shop* first. |
| Base gold rate (tolls and tithes) | Money from **tax** (787) | Renamed | Same base-rate mechanic. |
| Build slot and build queue (ADR 011) | **Building work** and the **waiting list** (*queue* is not in the NGSL) | Kept | The come-back rhythm. |
| Library, study slot, arts (ADR 012) | **School** (146), the **lesson** slot (1234), **skills** (685) | Rebuilt | A lesson brings in new words (1.5); a skill level is earned when the lesson's words are retained (1.1) and raises one resource's rate. This is the main join between learning and the economy. |
| Barracks, recruit order | **Office** (343), **hiring** (*hire* 1514) | Rebuilt | Hires the teams below; slot, order and cancel mechanics kept (ADR 018). |
| Infantry, cavalry | **Workers** (673) and **trucks** (2113, **flag**: late band) | Rebuilt | A worker forages and cleans; a truck carries more and travels faster, as cavalry did. |
| Archers, settler | **Cut** | Cut | Archers only mattered in battle. The settler only founded a second fief, which is cut below. |
| Kingdom : province : plot, terrain | **Region** (677) : **area** (204) : **site** (494); terrain **fields** (540), **river** (1176), **hills** (1670) | Renamed | *Lot* and *plot* were rejected: they are high-frequency only in other senses (*a lot of*, a story's plot). |
| Forage march (ADR 019) | A **job** (231): a team works at a free site for whole hours and comes back with **pay** (220) in what the terrain gives | Rebuilt | Same timed trip, fixed at dispatch, with recall kept (*call back*). It serves learning because the job is posted as a short English **notice** (664) and its return writes a news item. |
| Bandit camps, attack, battle (ADR 020) | A **clean-up** of a **waste** site (1246): waste sites sit where camps sat (hash-placed, three sizes) and grow back lazily; a team cleans one when its strength covers the waste and is paid money and material | Rebuilt | Keeps the hash placement, the tiers and the lazy regrowth, but nobody dies: a team too small comes back with nothing, and the loss formula goes. A neighbour's (1222) request describes the size in words, which is a reading task (1.4). |
| Second fief, founding (ADR 023), transport (ADR 024), fief switcher | **Cut** | Cut | A second holding multiplies every screen and teaches nothing. The town grows up into a city instead of out into a second town. |
| Seasons (ADR 016, 017, 022) | **Kept**: spring, summer, **fall** (320) and winter. The target is American English, so *fall* names the season, glossed until retained, and *autumn* (2792, last band) enters later as its synonym | Kept | The global lazy calendar stays, its percents re-themed (winter raises power use, summer helps farms). Each season brings one weather news item as reading. No season-only reward (W10). |
| Chronicle (ADR 013) | **Town News** (546) | Rebuilt | The same structured events, written in the same transaction, rendered as graded English news items with per-item glosses. This is the reading stream. |
| Digest, acknowledgement (ADR 027) | **The Report** (166): due reviews, then the news since the last visit | Rebuilt | The return visit is where spacing meets the game. |
| Goals, hints | **Goals** (856) and **tips** (1659; *hint* 2689 is a late band) | Kept | Goals include learning goals ("learn the words of lesson 3"). |
| Houses (W2), scouts (W1) | Out, as today | Out | |

**New, each because it serves learning:** the School's lessons (new words, 1.5), the Report (spaced retrieval, §4), Town News as graded input (1.3), job notices and clean-up requests as reading tasks (1.4), and a placement check (8.1). Later, a **visitor** (1398) who asks for something in English is the first place for writing and interaction (5.3). Nothing else is added.

## 10. Setting

| # | Decision | Why | Rejected |
|---|---|---|---|
| 10.1 | **The present day: the player is the new mayor of a small town in a neutral, unnamed English-speaking country and grows it into a city.** It is grounded and has no magic, as the lore had, with no real places, brands, politics or people. | Everyday high-frequency vocabulary (home, school, shop, job, bus, weather) is the vocabulary that transfers to real English (§4); the owner's choice. | Keeping medieval Vadoalto: its nouns (*tithe*, *levy*, *quarry*) are low-frequency and teach nothing outside the game. |
| 10.2 | **The lore is replaced, not refocused.** `docs/lore/` is rewritten as `docs/setting/`: the town, the region and the people in the news, written within the curriculum. Vadoalto, the crown, the bandits and the kingdoms go. | Every word a player reads must be within the curriculum's coverage (§4). | Adapting the medieval pages, which would be a shim over a story whose words don't fit. |
| 10.3 | **Every name a player reads is an NGSL word where one exists**, and its rank is recorded beside it in the setting docs. The flagged names in §9 (mayor, storage and truck, all in the NGSL's late bands) are the exceptions, accepted as game vocabulary and each taught as a game noun. | A game noun is read hundreds of times, so a frequent word pays twice. | Picking names for flavour. |
| 10.4 | **Proper names (the town, its people) are short, untranslated and the same in every language**; the player names the town. | One name per thing across languages. | Localised names. |
| 10.5 | **Characters exist only to carry language**: a neighbour who posts requests, a newspaper writer for the Town News, later a visitor. Each has a fixed voice and stays within the curriculum. | A recurring speaker gives repeated frames, the repetition incidental learning needs (§5, Uchihara et al. 2019). | A cast for story's sake. |

## 10b. Art and design direction

| # | Decision | Why |
|---|---|---|
| 10b.1 | **The art bible is rewritten for the present-day town; every medieval image is retired**: the images under `apps/web/public/art/` and the prompts in `docs/art/catalog.md`. N7 (each image ships with its prompt) stays. | The stylized 3D early-medieval style of `docs/art/art-bible.md` has nothing to depict any more. |
| 10b.2 | **The direction, chosen by the owner: a bright, flat, friendly illustration of everyday places, with one highly legible sans-serif family set for long reading** (generous line height, a comfortable line length, a clear mark for a glossed word), in place of Parchment and Cormorant Garamond. | Reading is now the main act, so text comfort comes before mood. Images of concrete nouns are dual coding (§9, moderate). The design itself is a later ticket. |
| 10b.3 | **The mechanism stays**: one token-defined design system feeding Tailwind (ADR 009) and the WCAG 2.2 AA floor (N8, `.claude/rules/ui-components.md`). Only the token values, fonts and components change. | The rules are setting-independent. |

## 11. i18n architecture

| # | Decision | Why |
|---|---|---|
| 11.1 | **Languages at launch: English (target, always), scaffolds `es` and `none`.** Language tags are BCP 47; the scaffold is a player field stored server-side and changeable any time. | Smallest set that proves the design. |
| 11.2 | **Learning content and game text live in api content** (items, frames, glosses, text templates), served through `packages/contracts` as structured text: tokens with item ids, so a client renders glosses from the player's projection. | Server authority over which item is known; one source for web and Android. |
| 11.3 | **UI chrome copy: one message catalog per language (ICU MessageFormat) as the single source**, generating `apps/web` copy and Android `strings.xml`. | Today `copy.ts` and `strings.xml` duplicate the Spanish; a second language would double the drift. |
| 11.4 | **Refusals go over the wire as `kind` plus typed parameters; the api stops writing Spanish.** `ApiErrorSchema.message` is replaced by `params`; `answerRefusal.ts` maps kind to status only; `mailCopy.ts` becomes per-language. | The wire must not carry one language; the map's reading of the api's `message` (#545) is replaced by params. Contracts change: OpenAPI regenerated, Android row owed. |

## 12. Repo rules and records to amend (when the owner orders the change)

Checked against `docs/adr/` on `trunk` at `54a3aa60`: 34 ADRs; 026, 032 and 033 already superseded, 030 amended by 034.

**Rules and docs**
- `CLAUDE.md`. The Mandatory state loses "in a medieval setting" and the Vadoalto sentence (the game's name is Townword). In Product, "Spanish UI addressed as tú" and the fief, the five buildings and the five resources give way to the town, the school and English as the target. In Non-negotiable rules, "Spanish only in user-facing copy" becomes "user-facing copy only in the message catalogs and content glosses; Spanish glosses address the reader as tú". The design and reference docs point at `docs/setting/` instead of `docs/lore/`.
- `.claude/rules/naming.md`, lines 8 and 18 (Spanish labels, names from `docs/lore/`), and `.claude/rules/architecture.md`, line 53 ("a Spanish message").
- `docs/PRODUCT_REQUIREMENTS.md` is rewritten. Its opening sentence and M2 to M8 change: town, four resources, people, seven buildings. S1 becomes the school. S13 to S20 become jobs, clean-ups, hiring and trucks. S18 and S19 are cut, and so is S20. N5 is extended to learning content. N6 is rewritten. W1 and W4 are re-cut. W10 is kept. The acceptance criterion gains the review of §14.
- `CONTEXT.md` is rewritten term by term (§9), with a "replaces" column pointing at OGame as today. Its Avoided words are rebuilt.
- `docs/lore/` (README, world, names, arts, chronicle) is **replaced** by `docs/setting/`. `docs/art/art-bible.md` and `docs/art/catalog.md` are rewritten.

**ADRs superseded by 035**
- **003**, the medieval setting over OGame's mechanics.
- **010**, display names as copy; its own last line names the exit, "names move into content".
- **020**, attacks on bandit camps, replaced by clean-ups with no battle and no losses.
- **023**, the second fief and the settler, which are cut.
- **024**, transport between fiefs: it needs a second fief.
- **025**, archers, which are cut.
- **029**, the visual layer.
- **030**, art in the first viewport (already amended by 034).

**ADRs amended by 035**, the mechanism kept and the names and texts changed
- **007**: people are supplied by homes, not the farm.
- **012**: the school, lessons and skills earned by retention, together with ADR 036.
- **013**: the chronicle becomes Town News; the founding and transport events go.
- **014**: the map becomes region : area : site; the founding and transport orders go.
- **016**, **017** and **022**: seasons re-themed; the forage loot percent becomes the job pay percent.
- **018**: office and hiring.
- **019**: jobs.
- **021**: trucks.
- **027**: the Report replaces the digest; the fief switcher goes; the strip's march cell becomes the job cell.
- **015**: mail copy per language, together with ADR 038.

**ADRs unchanged**
- 001, 002, 004, 005, 006, 008, 009, 011 and 031 are untouched.
- 028's refused hooks are reaffirmed.
- 034 is untouched except for the Android strings, which ADR 038 settles.

**New ADRs**
- 035: the pivot (`adr-035-draft.md`).
- 036: FSRS as lazily evaluated memory.
- 037: the NGSL curriculum and the content gate.
- 038: scaffold languages and a wire without prose.

**Owner decision, settled: the live save.** CLAUDE.md forbids a reset, but every resource, building and unit of the owner's medieval save changes meaning, and the save's second fief, archers and settlers have no counterpart. There were two ways:
- **(a)** A one-off mapping migration: gold → money, food → food, wood + stone + iron → material, iron mine → power station, sawmill → factory, quarry → dropped with a refund, the farm's people → homes, archers → workers, and the second fief closed with its stocks credited to the first.
- **(b)** An owner-signed one-time exception to "never a reset" for the pivot.

Decided: (b), signed by the owner on 2026-11-04 as a one-time reset of the game state, accounts kept (ADR 035). The save is one player's test data in a setting that no longer exists, and a mapping migration is the kind of compatibility shim the "rebuild, never adapt" rule refuses.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Motivation decays after the novelty weeks (§11, attrition in app studies). | Retention is the game's progress (skills earned by stability), no streak pressure, absence never punished. |
| Review debt: too many new items, then a wall of reviews. | School cap on items in learning (1.5); the Report shows the forecast. |
| Gamification makes learning shallow, or the skills' reward undermines interest (performance-contingent, d = −0.28 in the lab). | No per-answer payout; productive retrieval (typing) after the first meeting; positive informational feedback; the holdout and an A/B of the skills link measure it. |
| Content cost: frames, texts and glosses per L1. | Offline generation behind the CI coverage gate; one L1 at launch. |
| Generated content errors (wrong gloss, unnatural English). | Human review before merge; item statistics flag outliers. |
| The strategy layer outweighs the learning (players skip text). | Decisions need the text (1.4); the report is the return screen. |
| Evidence transfers from lab and classroom to a game: effect sizes will be smaller. | 8.3's holdout measures the product's own effect. |
| Schema change on a live database (the owner plays a medieval save). | Every resource, building and unit changes meaning; settled by the signed one-time reset (§12, ADR 035). |
| A present-day town builder is a crowded genre; it must still be fun as a builder. | The OGame loop stays intact; learning feeds it through skills, never a toll. |

## 14. First tracer-bullet slice

**One lesson at the School, its spaced reviews in the Report, and the skill it earns, end to end on web.** The setting change does not alter the slice's spine: it runs on the existing fief and its library ids, so it proves the learning loop before the town rebuild, which is a separate wave of renames and cuts (§9).

1. **Content:** lesson 1 is 5 NGSL items from the first band whose words also name the town (*home*, *school*, *work*, *money*, *food*), each with one example frame and an es gloss. The CI coverage gate (3.6) passes on the frames.
2. **Domain:** a pure FSRS step and the lazy derivation of `R(now)` and `due`, tested with the Clock port. A skill level is earned on read when every item of its lesson passes 7-day stability.
3. **Api:** a migration adds `cards` and `review_log`. The library's study slot starts lesson 1. The fief `GET` answers the due reviews. A `POST` of an answer is graded server-side, writes the log and updates the card in the fief's transaction.
4. **Contracts:** the review card schema and the answer schema. Refusals are untouched in this slice.
5. **Web:** a Report screen shows the due reviews, first as recognition cards, then as typed cards with a prompt and then the correct form on an error. It is in English with the es gloss.
6. **Acceptance:** a player studies lesson 1 and answers its first reviews, closes the browser, and returns after the due instant. The Report shows exactly those items due. The player answers them, and each card's next due equals FSRS's for the elapsed time, on a server that made no request to itself in between. With an injected clock, the lesson's skill level is earned once all 5 items reach 7-day stability, and the food rate rises by its percent.

**Out of the slice:** placement, Town News, the town rebuild and renames, Android, the catalog generator, the holdout, and the new design direction.

**Order after the slice:**
1. The town rebuild: renames and cuts, with the owner's save decision first.
2. Town News as graded reading with glosses.
3. Placement.
4. Android.
5. The new visual direction.
