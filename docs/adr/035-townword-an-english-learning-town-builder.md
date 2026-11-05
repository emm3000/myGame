---
status: accepted, holdout narrowed by ADR 037, reset shaped by ADR 040, PRD rows amended by ADR 041
date: 2026-11-04
---
# Townword, an English-learning town builder

## Context

ADR 003 put a medieval world over OGame's mechanics: a fief with wood,
stone, iron, gold and food, peasants as the workforce, a library with
arts, a barracks, marches on a `kingdom:province:plot` map, seasons and
a chronicle. The lore names the game Vadoalto (`docs/lore/world.md`).
Every name a player reads is Spanish copy in one layer, addressed as tú
(PRD N6, ADR 010): `apps/web/src/copy.ts` on the web and a
`strings.xml` per module on Android. The api writes two Spanish files
of its own, `apps/api/src/http/answerRefusal.ts` and
`apps/api/src/mail/mailCopy.ts`, and the wire carries a Spanish
`message` on every `ApiError` (`packages/contracts/src/ApiError.ts`).

On 2026-11-04 the owner changed the product's goal: the game exists to
teach English, with methods the evidence supports. The owner then moved
the setting to the present day, because everyday high-frequency
vocabulary transfers to real English, opened the visual design to a
rebuild, and named the game Townword. The decisions below come from the
owner's grilling of that day and are final. The evidence brief and the
full design tree behind them are under `docs/research/english-pivot/`
(see References).

## Decision

- **The goal is learning English; the strategy game is how.** OGame's
  loop stays (produce, spend, wait, return), and so do server authority
  (N1) and lazy evaluation (ADR 005). Every mechanic either carries that
  loop or serves learning; a new mechanic enters only for learning.
- **The game is Townword.** It is the only name a player reads for the
  game. The repo, the packages and every identifier keep `myGame`.
- **The setting is a present-day town.** The player is its new mayor
  and grows it into a city, in a neutral English-speaking country with
  no real places, brands, politics or people, and no magic. Vadoalto
  and the medieval world go. `docs/lore/` is replaced by
  `docs/setting/`, not adapted.
- **The target is American English.** Spelling, words and usage are
  American. The season is *fall*, glossed until retained; *autumn*
  enters later as its synonym.
- **Names come from the NGSL.** Every name a player reads is a word of
  the NGSL 1.2 (Browne, Culligan and Phillips, CC BY-SA 4.0) where one
  exists, with its rank recorded beside it in `docs/setting/`. *Mayor*
  (rank 2779), *storage* (2707) and *truck* (2113) lie in the list's
  late bands, past what the curriculum teaches first; they are accepted
  as game vocabulary and taught as game nouns, never counted toward
  progress.

  | Today | Becomes |
  |---|---|
  | fief | town, labelled city past a people count in content |
  | lord | mayor |
  | wood, stone, iron, gold, food | material, power, money, food |
  | peasants, supplied by the fief and the farm | people, supplied by homes |
  | sawmill, quarry, iron mine, farm, warehouse | factory, power station, farm, storage, homes |
  | library, study, arts | school, lesson, skills |
  | barracks, recruit order | office, hiring |
  | infantry, cavalry | workers, trucks |
  | archers, settler, founding, transport, second fief | cut |
  | forage march | job |
  | bandit camp, attack, battle | waste site, clean-up, no losses |
  | kingdom : province : plot; lowlands, uplands, ridges | region : area : site; fields, river, hills |
  | spring, summer, autumn, winter | spring, summer, fall, winter |
  | chronicle | Town News |
  | digest | the Report |

- **Retention earns skills, never currency.** The school's lesson slot
  brings in a lesson of new words, and the school's level caps how many
  are in learning at once. The Report shows the reviews due, and the
  server grades every answer. A skill level is earned when every word
  of its lesson is retained past a stability threshold; it multiplies
  one resource's rate, as an art does today, and it is never taken
  back. No review, lesson or correct answer pays resources.
- **Memory is lazily evaluated.** A word's memory state is stored as the
  moment and the result of its last review, and what is due is derived
  on read, as a resource is under ADR 005. No process advances it (N2,
  W7). The scheduler is FSRS.
- **Content passes an offline gate.** The curriculum follows the NGSL
  by frequency band. Its texts are generated offline, reviewed and
  committed behind a CI gate on known-word coverage, never generated at
  runtime.
- **Learning is measured against a holdout.** A random 10 % of each
  band's words is withheld from practice per player and tested in the
  external check, so practised against withheld is a comparison within
  each player.
- **Absence never costs.** ADR 028's refused hooks hold: no streak, no
  daily quest and no season-only reward. A review waits as long as the
  player is away.
- **The player picks a scaffold language.** English is always the
  target. The scaffold is a player setting, `es` or `none` at launch;
  its glosses fade per word as that word is retained. Spanish scaffold
  copy addresses the reader as tú, never vos.
- **The visual design is replaced.** The direction is flat, bright
  illustration of everyday places, with one highly legible sans-serif
  family set for long reading. The art bible and its catalogue are
  rewritten and the medieval images retired; N7 stays. The token
  mechanism of ADR 009 and the WCAG 2.2 AA floor (N8) stay. The palette's
  light and dark schemes, Parchment and Ledger (ADR 009), and the
  Cormorant Garamond display face of `apps/web/src/design/tokens.ts` go.
  The design itself is its own ticket.

### A one-time reset, signed

CLAUDE.md rules that a schema change is a migration and never a reset.
The owner signs one exception, for this pivot alone, on 2026-11-04: the
production game state is reset once, because the owner's medieval save
has no counterpart for its second fief, its archers, its settlers or
three of its five resources, and a mapping migration would be the shim
"rebuild, never adapt" refuses.

- **Accounts survive.** `players` keeps its ids, emails, password
  hashes and verifications; `sessions` and `account_tokens` stay. Each
  player's `digest_acknowledged_at`, a column that admits no null, is
  set to the reset instant, as a new player's is set to the sign-up
  instant (ADR 027), so no event before the reset is ever told.
  (Amended by ADR 040: no instant is reset, since Town News holds no
  medieval event.)
- **The game state goes.** The fiefs and every table that hangs from
  them, `camp_battles` and `player_seen_hints` are emptied. How an
  account without a holding receives its town is the town rebuild's
  ticket. (Settled by ADR 040: the tables are dropped at the rebuild's
  cutover, and an account names its town on its first signed-in visit.)
- **The reset is a migration.** It runs once, through the migrations
  like any schema change, in the town rebuild; never a manual statement
  against Neon.
- **The exception closes with it.** After the reset, every schema change
  is a migration again, with no further exception.

### Superseded and amended

- **Superseded by this ADR:**
  - **003**, the medieval setting; OGame's mechanics stay, under this
    ADR;
  - **010**, display names as copy; its own last line names this exit,
    "names move into content";
  - **020**, attacks on bandit camps, replaced by clean-ups with no
    battle and no losses;
  - **023**, a second fief and the settler, cut;
  - **024**, transport between a lord's fiefs, cut with the second fief;
  - **025**, archers, cut;
  - **029**, the visual layer;
  - **030**, art in the first viewport, already amended by ADR 034.
- **Amended by this ADR,** the mechanism kept and its names and texts
  changed:
  - **007**: homes supply the people;
  - **012**: the school, lessons and skills earned by retention, with
    ADR 036;
  - **013**: Town News, without the founding and transport events;
  - **014**: region, area and site, without the founding and transport
    orders;
  - **015**: mail copy per language, with ADR 038;
  - **016**, **017** and **022**: seasons re-themed, autumn named fall;
    the forage loot percent becomes the job's pay percent;
  - **018**: office and hiring;
  - **019**: jobs;
  - **021**: trucks;
  - **027**: the Report replaces the digest, and the fief switcher goes.
- **Unchanged:** 001, 002, 004, 005, 006, 008, 009, 011, 028, 031 and
  034; ADR 038 settles the Android strings under 034.
- **PRD:** the opening sentence, N5, N6, W1 and W4 are amended here.
  The M and S rows describe the shipped medieval game, which the code
  still is; the town rebuild's tickets rewrite them by row id as each
  one ships, and cut S18, S19 and S20. (Amended by ADR 041: the cutover
  rewrites every row still medieval, marking each unshipped one *not
  yet shipped*.) W9 and W10 hold. The acceptance
  criterion gains a review that falls due while the browser is closed
  with ADR 036.

### Deferred

- **ADR 036, the scheduler.** FSRS as a pure function in
  `packages/domain`: the stored card, the derived retrievability and
  due date, the server's grading, the stability threshold and the
  review log. Its research basis is a community benchmark, not a
  peer-reviewed trial, which ADR 036 records.
- **ADR 037, the curriculum.** NGSL frequency bands; lessons grouped by
  theme, never by semantic set; the offline content gate and its human
  review; the placement check; the holdout's draw and its tests.
- **ADR 038, the languages.** Scaffold languages as a player setting;
  per-word gloss fading; one message catalog per language generating
  the web and Android copy; refusals on the wire as a kind plus
  parameters, with `ApiError.message` removed; mail per language.

## Considered options

- **Keep medieval Vadoalto and refocus its lore.** Its art and its
  world are kept, but its nouns (*tithe*, *levy*, *quarry*) are
  low-frequency and teach nothing outside the game. The owner rejected
  it.
- **A lesson app with the strategy game as its reward screen.** A
  learning toll in front of the game makes learning the tax.
  Engagement- and completion-contingent rewards lowered intrinsic
  motivation in Deci, Koestner and Ryan (1999). Rejected.
- **Pay resources for each review.** The same completion-contingent
  pattern. Rejected for skills earned by retention.
- **British English, autumn as the season's name.** The NGSL ranks
  *fall* at 320 and *autumn* at 2792, and one variety keeps spelling and
  usage consistent. Rejected for American English.
- **A mapping migration of the owner's save.** Gold to money, the three
  materials to material, the second fief closed into the first: a
  compatibility shim over a setting that no longer exists. Rejected for
  the signed one-time reset.
- **Keep the second fief, the transport and the army whole.** Each one
  multiplies screens or rules and teaches no word. Rejected: the town
  grows into a city instead of out into a second town.

## Consequences

- Every screen, content file, copy file and contract that names a
  medieval term is rebuilt: `apps/api/content/` (the building files and
  `arts/`), `packages/domain`'s `ResourceKind` and unit kinds, the
  contracts' enums, `copy.ts` and the Android `strings.xml`. Until each
  ticket ships, the code keeps the medieval terms and `CONTEXT.md`
  records both.
- The production game state is reset once, in the town rebuild; the
  accounts carry over.
- CLAUDE.md, `.claude/rules/naming.md` and
  `.claude/rules/architecture.md` follow this ADR. `docs/lore/` stays
  until `docs/setting/` replaces it, with a status line pointing here;
  `docs/art/` is rewritten in the design ticket.
- The first slice proves the learning loop on the existing fief and
  library before the town rebuild: one lesson, its spaced reviews and
  the skill they earn.
- Learning claims rest on item-level retention from the review log.
  Gains in proficiency need the external check and the holdout that
  ADR 037 sets.

## References

- `docs/research/english-pivot/decisions.md`: the design tree, every
  branch settled, with its evidence and the alternative it rejected.
  This ADR wins where the two differ.
- `docs/research/english-pivot/research.md`: the evidence brief on
  learning English as an L2, each source marked verified or unverified.
