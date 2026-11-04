---
status: proposed
date: 2026-11-04
---
# The town rebuild

## Context

ADR 035 turns the medieval fief into Townword's present-day town and
maps every medieval term to its successor, but leaves the rebuild
itself open: what each mechanic becomes in detail, how the code and the
schema move, how an account receives its town after the signed reset,
and in what order. ADR 038 adds that the rebuild writes its copy into
the message catalog in English and Spanish together (its step 3), and
ADR 037 runs its gate check 9 against the English chrome the rebuild
writes. Two tickets wait on this: #741 (the chrome lessons and check 9)
cannot derive its word list, and #745 (the scaffold and the chrome
phases) needs an English catalog that holds every key. The owner
delegated every branch on 2026-11-04 and signs off from the pull
request.

What trunk holds, checked at `1f0b1c41`:

- **The holding.** `fiefs` (`apps/api/src/adapters/postgres/schema.ts`)
  holds coordinates, the five stocks and their `full_since_*`, the
  build slot and the study slot, a lesson included. Eight tables hang
  from it: `fief_buildings`, `fief_queue_entries`, `fief_arts`,
  `fief_units`, `fief_recruit_orders`, `fief_marches`,
  `fief_incoming_cargo`, `fief_events`; `camp_battles` is keyed by plot,
  `player_seen_hints` by player. A player holds up to two fiefs since
  migration `0023_second_fief.sql` dropped `fiefs_player_unique`.
- **The learning is the player's.** `cards`, `pending_reviews`,
  `review_log` and `player_skills` are keyed by `player_id`, never by a
  fief. `startLesson` and `answerReview` read every fief of the player
  (`FiefRepository.fiefsOf`), a lesson runs in a fief's study slot gated
  by `requiredLibraryLevel` (`packages/domain/src/learning/Lesson.ts`,
  refused as `LessonLibraryTooLow`), and an earned skill enters
  `deriveResourceRates` beside the art percents.
- **Setting-neutral code.** `packages/domain/src/memory/` (FSRS),
  `learning/` (grading, retention) apart from the library gate and the
  skill's `ResourceKind`, `hash/`, `time/` and the season calendar's
  arithmetic name no medieval term.
- **Sign-up founds the fief.** `SignUpRequest.fiefName` is required;
  `signUp` calls `foundFiefOnFreePlot` (`apps/api/src/auth/`). A
  signed-in account with no fief lands on a `FiefNotFound` alert
  (`apps/web/src/routes/_signedIn/index.tsx`).
- **Size.** About 555 TypeScript and Kotlin files under `packages/` and
  `apps/` name *fief*; `packages/domain/src` alone holds 229 files and
  70 `DomainError` members.
- **The design.** The Townword Design System
  (https://claude.ai/artifact/BLNf2broSoGPHBKfCNd81f, #720) and the
  mockups (https://claude.ai/artifact/Vic8LoavdANzAvJbUSK8XT, #721) draw
  the town home, the school and the Report: navigation *Town*, *Report*,
  *News*; resources *Money*, *Food*, *Power*, *Material*, *People*;
  places *Homes*, *School*, *Farm*, *Factory*, *Power station*,
  *Storage*. No trunk code uses its tokens yet; the web still runs
  Parchment, Ledger and Cormorant Garamond.
- **The on-hold medieval tickets** #694–#697 and #700–#704 are already
  closed as not planned; #698 and #699 are merged pull requests.

## Decision

### How the code moves: the town is built beside the fief, then the fief is deleted

- **The town is new code in its own modules**, written in the town's
  vocabulary from its first line: `packages/domain/src/town/` and its
  siblings, `/town` routes in the api, new tables, new screens. Town
  code never imports a medieval module (`fief/`, `march/`, `camp/`,
  `kingdom/`); a setting-neutral module (`memory/`, `learning/`,
  `hash/`, `time/`, the season arithmetic) is imported as it is, and a
  medieval function the town needs unchanged is moved out of its
  medieval module under a neutral name, never wrapped. No code path
  reads both a fief and a town.
- **The fief keeps running until the cutover**, changed only where the
  town takes something from it: the season's rename, the lesson slot
  moving to the school, and the wire ids below. The cutover is the last
  slice, which deletes every medieval module, route, contract, screen
  and catalog key, and drops the medieval tables. That drop is ADR
  035's one-time reset.
- **Names that collide while both exist.** The town takes its final
  names. The domain and the contracts each gain a `./town` subpath
  export for the coexistence; the cutover folds it into the root index.
  Where a town wire schema's `.meta({ id })` equals a medieval one's
  (`ResourceKind`, `ResourceAmounts`, `BuildingKind`,
  `BuildingContent`, `Terrain`, `EnqueueBuildingRequest`,
  `CancelUpgradeRequest`), the slice that brings the town schema
  renames the medieval id with a `Fief` prefix, so the generated
  Android client keeps a final name for the town.
- **Why the coexistence is not a shim.** `.claude/rules/architecture.md`
  rejects "a shim that lets old and new coexist", and
  `.claude/rules/principles.md` rejects "feature flags to keep two paths
  alive". What they refuse is code that bridges the two: an adapter, a
  mapper, a flag choosing a path. Here no such code exists. No module
  reads both holdings, no flag picks one, nothing translates a fief into
  a town, and the medieval code is not kept for compatibility; it stays
  only until its replacement merges, and one scheduled ticket deletes
  it. The `./town` subpaths and the `Fief` prefixes are names, never
  behavior, and the cutover removes them.
- **One shared rename runs first: `autumn` becomes `fall`** across
  content, the domain's `SeasonKind`, the contracts, the api and both
  clients, so the season calendar both holdings read is already the
  town's.

### How an account receives its town

- **The account names its town on its first signed-in visit.** A
  signed-in account that holds no town sees one screen, *Name your
  town*, and its answer founds the town at the lowest free site of
  region 1, as `lowestFreeCoordinates` places a fief today; a second
  found is refused (`PlayerAlreadyHoldsTown`). The account created
  before the rebuild, the owner's, and every new account take the same
  path.
- **Sign-up founds nothing.** `SignUpRequest` loses `fiefName`, and the
  sign-up form loses its field, once both clients have the naming
  screen. Sign-up keeps to the account, which is fixed copy (ADR 038).
- **The player names the town**, a proper name shown as written in
  every language (`decisions.md` §10.4).

### The town and its economy

- **One town per player**, `towns.player_id` unique. It is labelled
  *city* once its supplied people reach the content's count, derived on
  read; nothing else changes with the label.
- **A new town starts with homes and the school at level 1**, its
  starting stocks and the storage's base capacity from content, so
  lesson 1 can start in the first minute: the learning loop is the
  product's goal (ADR 035), and the slice that proved it starts with
  lesson 1 (`decisions.md` §14).
- **Four resources, each a stock accrued lazily (ADR 005)**:

  | Resource | Produced by | Notes |
  |---|---|---|
  | money | tax, a base rate in content, no building | as gold is today |
  | food | the farm | |
  | power | the power station | a stock like the others |
  | material | the factory | |

  **People** are derived, never stored (ADR 007): supplied by a base
  count plus the homes' level, occupied by every building's level and
  by the office's hires. **Storage** caps all four stocks at once, as
  the warehouse does.
- **Seven buildings**, content ids `homes`, `farm`, `factory`,
  `powerStation`, `storage`, `school`, `office`, one JSON file each
  under `apps/api/content/town/`, each level with its cost, duration,
  people and effect (ADR 008). Homes supply people; the farm, the
  factory and the power station produce; storage holds; the school
  shortens a lesson and raises the learning cap; the office hires.
- **Building work and the waiting list keep ADR 011 as it is**: one
  slot, a waiting list up to the content's cap behind it, charged at
  the enqueue, a stop refunding in full. The chrome says *stop*, and
  so do the town's identifiers.
- **The terrain gives a bonus to the town's own site**, as today:
  fields food, river power, hills material.

### The school, lessons and skills

- **Arts are cut.** Smithing and masonry go with their content, table
  and routes; skills earned by retention are the only multiplier the
  player adds to a rate. An art buys a rate with slot time alone, so
  it would compete with lessons for the one slot that `decisions.md` §9
  names the main join between learning and the economy, and a player
  could raise production without retaining a word.
- **The school's lesson slot runs lessons only**, as ADR 036's rule 6
  runs lesson 1 today: a lesson costs nothing, its duration shortened by
  the school's level and the season's study percent, its cards entering
  at its finish. `requiredLibraryLevel` becomes `requiredSchoolLevel`.
  The slice that moves lessons to the school drops the fief's lesson
  slot in the same migration; a fief studying a lesson then is left
  idle with the lesson unstudied, as a stop leaves it, since a lesson
  costs nothing and enters no card before its finish.
- **The learning cap.** A card is *in learning* while its stability is
  under 7 days, the point where its gloss fades (ADR 038) and the floor
  a skill needs (ADR 036). A lesson start is refused
  (`LearningCapReached`) when the player's cards in learning plus the
  lesson's words would pass the cap the school's level sets in content.
  The cap is derived from stored stabilities, so no read and no clock
  moves it. It bounds the review load a week later (`decisions.md`
  §1.5, §13). The cap at school level 1 holds at least two lessons.
- **Skills keep ADR 036's rule 7**: the player's, earned at a review,
  never taken back, multiplying one of the four rates, re-basing the
  town at the earn. Which resource each lesson raises and by how much is
  #737's ADR; lesson 1's food +5 % stands, since food survives.

### The office, jobs and clean-ups

- **The office hires workers and trucks** (ADR 018, ADR 021), both kinds
  from the office's first slice: one hiring order at a time, paid and
  staffed at the order, delivered one by one on read, stopped keeping
  the delivered; workers from office level 1, trucks from level 3; each
  hire occupies people and eats nothing. A worker is the cheap, slow,
  small carrier; a truck carries more and travels faster.
- **The map is region : area : site**, one area at a time, browsable to
  one past the last area holding a town (ADR 014); an area's terrain is
  fields, river or hills, set by its number.
- **A job** (ADR 019) sends a team to a free site for a whole count of
  hours, 1 to the content's maximum, and back with **pay** fixed at
  dispatch from the site's terrain, the hours, the team and its carry,
  credited at the return even above storage. Money never comes from a
  job, as gold never comes from a forage. A job can be **called back**,
  with the partial pay of ADR 019 as amended. One team out at a time.
- **A clean-up** replaces the attack (ADR 020's placement, tiers and
  lazy regrowth kept): waste sites sit on a content fraction of the free
  sites, placed by a hash of the address, in three sizes, the waste
  regrowing from the last clean-up. A team whose strength covers the
  waste cleans it, returns with money and material per point of waste,
  and the site's waste starts again from 0; a team too small comes back
  with nothing. Nobody is lost, so the loss formula and the battle go.
- **Seasons keep ADR 016, 017 and 022**, with *fall*: each season keeps
  one production percent per resource and its build, study, hire and
  road percents, re-themed in content (summer helps the farm, winter
  costs power, fall shortens the road).

### Town News, the Report, goals and tips

- **Town News is the town's event stream (ADR 013)**: building work
  finished and stopped, a lesson studied and stopped, a skill earned, a
  hiring delivered and stopped, a job back or called back, a clean-up
  done or failed, the town becoming a city. The founding, the transport
  and the battle events go. Until graded reading ships (`decisions.md`
  §14, order 2), each item is a chrome template; the job notices and the
  neighbor's clean-up requests of `decisions.md` §1.4 are graded texts
  and wait for that work.
- **The Report is one screen**: the reviews due, then the Town News
  since the player last closed it (ADR 027's digest, re-shaped). The
  close stores the instant in `players.digest_acknowledged_at`, which
  the cutover renames `report_read_at`.
- **Goals and tips keep ADR 027's rules**: one next goal from the
  content's ordered list, learning goals among them (*Study lesson 2*),
  and one tip the first time each concept matters, seen tips per player
  in a new `player_seen_tips`.
- **Navigation is Town, Report, Map and News.** The school and the
  office open from the town. Web paths are English and need no id,
  since a player holds one town: `/`, `/school`, `/report`, `/map`,
  `/map/$area`, `/news`. The api serves the signed-in player's town at
  `/town`.

### The reset, at the cutover

- **The cutover migration drops** `fiefs`, every `fief_*` table,
  `camp_battles`, `player_seen_hints` and the medieval enums, and
  renames `digest_acknowledged_at` to `report_read_at`. It keeps
  `players`, `sessions`, `account_tokens`, `cards`, `pending_reviews`,
  `review_log`, `player_skills` and every town table. It runs once,
  through the migrations, never by hand against Neon (ADR 035).
- **No instant is reset.** ADR 035 set `digest_acknowledged_at` to the
  reset instant so no medieval event would be told; Town News holds no
  medieval event, since the town writes its own table from its
  founding, so the instant the player last closed the Report stands.
- **The owner's medieval save stays playable until that migration**, so
  the coexistence costs no progress. Reviews wait while a screen moves
  (ADR 035: absence never costs).

### The chrome and its words

- **The English chrome is a closed list**, `docs/setting/chrome.md`: 80
  card words, lesson 1's five among them, so 16 chrome lessons of 5. It
  is fixed before #741 drafts lessons 2 to 16, because a chrome word
  added after a player has started the bands has no lesson before that
  player's stage (ADR 037's stage is a prefix). A later screen writes
  its English from the list and frame words; a word outside it needs an
  ADR that appends a chrome lesson.
- **Words chosen for the list**: *stop* (347) over *cancel* (2390);
  *build level 3* over *upgrade*, no NGSL word; *close* (239) to dismiss
  a tip, a goal or the Report; *previous* (922) and *next* (151) to
  browse the map. No chrome word is off the NGSL; the late-band words
  are ADR 035's *mayor*, *storage* and *truck*.
- **Exempt from check 9, besides frame words**: numbers, the unit
  symbols `h`, `min`, `s` and `%`, the game's name *Townword*, and the
  name the player gives the town. #741 adds these to the check.
- **The review card is fixed copy, its prompts included** (*What does it
  mean?*, *Check*, *Next*): the first review comes right after lesson 1,
  before any chrome lesson is learned, and a misread task is a wrong
  rating (ADR 038's reason for verdicts). The Report's title, its count
  of reviews due and its news frame stay chrome.
- **Spanish chrome never names the player with a gendered noun**: no
  player field records one, so *alcalde* or *alcaldesa* is never
  written; *mayor* stays English and the Spanish lines address the
  reader as tú.

### The order

- **Before the town's screens**: #736 (refusals without prose), so every
  refusal the town adds is a kind and its params; #739 (the catalog), so
  every town screen writes `en.json` and `es.json` together (ADR 038,
  step 3); and the Townword tokens and type in both design layers, so no
  town screen is drawn twice. The domain and schema slices wait on none
  of them.
- **#741 waits on this ADR's word list, not on the screens.** Check 9
  then holds every town screen to the list as it lands.
- **#745 waits on the cutover**: the catalog's key check runs both ways
  only once the medieval keys are gone and every key left has its
  English.
- **#746 writes each mail in the town's words** in both languages; the
  shipped Spanish mail still says *feudo*.

## Considered options

- **Rename in place, then change meaning.** Rename fief to town across
  555 files, then turn five resources into four and cut what ADR 035
  cuts. Every step after the reset that changes a resource's meaning
  needs a mapping migration of the owner's new save, the shim ADR 035
  refused, and every cut before it destroys game state outside the one
  signed reset. Rejected for building beside and dropping once.
- **One pull request for the whole rebuild.** Five packages, both
  clients and the schema in one review that blocks every other ticket
  while it runs. Rejected for tracer-bullet slices.
- **Reset first, then rebuild on an empty game.** Accounts would hold
  nothing to play, and the lesson routes hang on a fief id, until the
  town core shipped. Rejected: the medieval save plays on until the
  town replaces it.
- **Seed each account's town in the reset migration.** SQL would copy
  the starting stocks and the placement rule out of content and the
  domain. Rejected for the naming screen, which founds through the
  domain like any later account.
- **Keep arts beside skills.** See *Arts are cut*.
- **Power as an energy balance**, production against use, throttling
  the producers as OGame's energy does. A new mechanic that teaches no
  word and adds a formula to read. Rejected for a stock.
- **Money from homes' tax per person.** It ties money to people, but
  `decisions.md` §9 settled tax as the base rate, and a second
  derivation of money is one more rule to read. Rejected.
- **A learning cap on cards in FSRS's `learning` state.** That state
  lasts minutes after a lesson, so the cap would never bind a week
  later. Rejected for stability under 7 days.
- **Ship workers first and trucks later.** ADR 021's two kinds share
  every rule but their terms; a second slice would reopen the office,
  the job and the clean-up. Rejected for both kinds in the office's
  first slice.
- **Cut the map, jobs and clean-ups to shrink the chrome.** ADR 035
  keeps them, and they are where the job notices and the neighbor's
  requests will become reading tasks. They cost 18 chrome words.
  Rejected.
- **Grow the chrome list screen by screen.** A word added after a
  player has started the bands cannot be taught before that player's
  stage. Rejected for a closed list now.
- **Chrome by today's Spanish keys translated.** It would write English
  for screens the cutover deletes (founding, transport, battle), the
  medieval English ADR 038's step 3 refuses. Rejected.

## Consequences

- The rebuild is 43 slices; the pull request that brings this ADR lists
  them with their dispatch rows and blocking edges.
- Until the cutover the domain, the contracts and the api carry two
  holdings and `CONTEXT.md` records both vocabularies; the cutover
  deletes the medieval one, `docs/lore/` and the *Superseded by ADR 035*
  table.
- The PRD's M and S rows are rewritten by row id as each slice ships;
  the cutover rewrites the acceptance criterion for the town.
- ADR 035's reset section is amended: its shape is the cutover's drop,
  and no instant is reset. ADR 036's rules 1, 6 and 7 read *the town*
  for *every fief* and *the school* for *the library* from the school's
  slice on. ADR 038's fixed copy gains the review card's prompts.
- `apps/web/public/art/` loses its medieval images at the cutover; the
  town's images are their own ticket under the rewritten art bible
  (N7).
- With 16 chrome lessons, the `es` chrome stays Spanish until the
  sixteenth is studied and bilingual until its skill is earned, longer
  than the under three weeks of ADR 038's one-lesson example; how much
  longer depends on the cap and the player's pace.

## References

- ADR 005, 007, 008, 011, 013, 014, 016–022, 027, 035, 036, 037, 038.
- `docs/research/english-pivot/decisions.md` §1.4, §1.5, §9, §10, §13,
  §14.
- `docs/setting/chrome.md`: the chrome's words with their NGSL 1.2
  ranks.
- The Townword Design System and mockups (URLs above).
