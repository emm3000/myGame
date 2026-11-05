---
status: proposed, rule 6 and the chrome count amended by ADR 040
date: 2026-11-04
---
# The skill curve

## Context

ADR 035 makes retention the game's progress: a skill level is earned when
every word of its lesson is retained, and it multiplies one resource's
rate, as an art does today. ADR 036 (rule 7) pinned lesson 1's skill,
food +5 %, and how it enters the rate. ADR 037 set the curriculum over the
NGSL 1.2, some 549 lessons by the count below, and left open what a skill is worth across
all of them: which resource each lesson raises and by what percent
(Consequences). Every lesson after lesson 1 needs that rule before it can
be written. The owner delegated every branch; each is decided on evidence
below, with the option it rejected under Considered options.

The learner is an adult at A1 to A2, a Spanish speaker learning American
English (`docs/research/english-pivot/decisions.md` §2.1). The design
tree fixes the direction: retained words are capability, never currency
(§1.1); a skill once earned is never taken back (§1.6); the strategy
game is how, not a toll (ADR 035).

What trunk holds, checked at `1f0b1c41`:

- **A lesson names its skill.** `apps/api/content/lessons/lesson-1.json`
  holds `"skill": { "resource": "food", "ratePercent": 5 }`, parsed by
  `LessonContentSchema` (`packages/contracts/src/LessonContent.ts`) into
  the domain's `LessonSkill` (`packages/domain/src/learning/Lesson.ts`).
- **An earned level is a stored copy.** At the review that earns it,
  `answerReview` writes an `EarnedSkill`, `{ lessonId, resource,
  ratePercent, earnedAt }`, copied from the lesson, to `player_skills`,
  keyed by player and lesson, with `rate_percent >= 1`
  (`apps/api/src/adapters/postgres/schema.ts`). A resource's skill level
  is the count of its earned lessons (`skillLevelOf`).
- **Each earned level is its own factor.** `deriveResourceRates`
  (`packages/domain/src/fief/deriveResourceRates.ts`) computes a rate as
  `(base + producer + terrain) × Π (100 + p) / 100`, where the product
  runs over one factor per art in force, then **one factor per earned
  skill** of that resource (`withSkillPercents` pushes `100 + ratePercent`
  for each), then the season's percent. Its test pins it: two food skills
  of 5 and 10 on a rate of 10 give 11.55, which is 10 × 1.05 × 1.10
  (`deriveResourceRates.test.ts`, "multiplies two earned skills on one
  resource into one product").
- **An art is one factor at its level.** `withArtPercents` pushes one
  `100 + ratePercent` per art, the percent of the level in force, and the
  content sets level *n* to 5 × *n*: masonry and smithing give 5 % at
  level 1 and 50 % at level 10 (`apps/api/content/arts/`). So an art's
  levels add up; trunk's skills compound.
- **The food rate at its ceiling** is 604 per hour: base 10
  (`fief.json`), farm level 10 at 589 (`farm.json`, its last level), and
  lowlands' 5. No art raises food. Summer's percent is 100, winter's 75.

## Decision

### The rule

1. **Every lesson of the curriculum earns one skill level, +5 %, and
   nothing else does.** The percent is the same for every lesson, lesson
   1's and an art level's today.
2. **The lesson at position *n* of `curriculum.json` raises
   `cycle[(n − 1) mod k]`**, where the cycle is the game's *k* resources
   in a fixed order, food first. Lesson 1, at position 1, raises food, as
   it does today. Any *k* consecutive lessons raise every resource once.
3. **The skill is derived, never written in a lesson file.**
   `curriculum.json` holds the curve once:
   `"skill": { "cycle": [...], "ratePercent": 5 }`. The adapter gives
   each lesson its `LessonSkill` from its position, so the domain's
   `Lesson` keeps `skill` unchanged and `lesson-<n>.json` loses it, lesson
   1's included, in the lexicon ticket that moves its words (ADR 037).
   This is ADR 037's rule for the rank applied to the skill: one source
   for one number.
4. **The levels of one resource add up into one factor**:
   `rate = (base + producer + terrain) × Π arts × (100 + Σ p) / 100 ×
   season / 100`, where `Σ p` is the sum of the stored `ratePercent` of
   the player's earned levels of that resource. At level *L*, all of them
   at 5, the factor is `1 + 0.05 L`. This is how an art's levels already
   combine; it amends trunk's one factor per level (ADR 036, rule 7).
5. **An earned level keeps what it stored.** The `player_skills` row is
   the level; a later change of the cycle, of a lesson's position or of
   the percent never moves a level already earned. It moves only what an
   unearned lesson will pay.
6. **The town's resources are a parameter.** Until the town rebuild
   changes `ResourceKind`, the cycle is the five medieval resources,
   `food, wood, stone, iron, gold`; the rebuild writes the town's four,
   `food, material, power, money`, and its migration maps stored levels
   as it maps every resource column (wood, stone and iron to material,
   gold to money). The rule, the percent and the sum do not depend on the
   rebuild; the cycle's members and their order after food do.
   (Amended by ADR 040: no stored level is mapped. No lesson after
   lesson 1 ships before the slice that moves lessons to the school, so
   every stored level is food; that slice writes the town's cycle in
   `curriculum.json` and copies the levels, food to food, into the
   town's `earned_skills`, failing on any other resource. The reset
   maps no resource column, since the town's stocks start from
   content.)

### Which lessons earn

- **Chrome lessons earn as any lesson.** They are lessons of the
  curriculum, retained by the same rule (ADR 036, rule 7); they count in
  no measure because the screens practise their words (ADR 037), which
  says nothing about whether the learner retained them. Lesson 1 is one.
- **A placed-out lesson earns as any lesson, when it is studied and
  retained.** Placement puts it in the stage, never grants its level
  (ADR 037), so a placed learner and a beginner can each earn the same
  levels and failing the check on purpose buys nothing.
- **A released lesson of the holdout earns nothing** (ADR 037). It is
  not in `curriculum.json`, so it has no position and no skill. Its words
  already count for the lesson that taught them: a lesson's level waits
  on **every word of the lesson the player holds a card for, and on at
  least one**. A lesson with held-out words earns on the others; a lesson
  whose every word was held out, which a 10 % draw allows (each word held
  out with chance 0.1, so about 1 in 100 000 for one lesson of 5), earns
  once its words are released and retained, at the review that retains
  the last of them. This makes ADR 037's "the words the player holds"
  exact for the lesson that holds none.
- So **every player can earn exactly one level per curriculum lesson**,
  whatever the placement or the holdout: no path earns more, no path
  loses one.

### The gate check

ADR 037's content gate gains **check 10, the skill**: `curriculum.json`'s
`skill` names every resource of `ResourceKind` exactly once, food first,
and `ratePercent` is 5; no lesson file names a skill (the strict schema
refuses the field). Since the skill of lesson *n* is derived from the
position, no per-lesson check can drift from rule 2; the adapter's test
pins the derivation (positions 1, 2 and *k* + 1, and lesson 1 at food 5).
Check 10 ships with `curriculum.json`, in the lexicon ticket.

### Worked examples

Each figure below is computed, never estimated, from the rule and
trunk's content: food at its ceiling, 604 per hour (above), in summer,
and at farm level 1 too, 10 + 25 + 5 = 40 per hour. Both rates come
from the medieval content, so the rates are indicative until the town
rebuild's economy exists; the levels and the factors are not. The cycle is the
town's, *k* = 4, so food is at positions 1, 5, 9…, and after *n* lessons
the food level is ⌈*n* / 4⌉.

**The lesson counts.** A lesson holds 5 card words, a band's last 5 to 9
(ADR 037), so a band of *W* card words left after the chrome is
⌊*W* / 5⌋ lessons; a frame word is never a card, and only band 1 holds
frame words, all within ranks 1 to 100.

- **Frame words, an estimate until `grammar.json` ships: 57, between 52
  and 62.** Ranks 1 to 29 are all frame words (ADR 037), and 23 more
  among ranks 30 to 100 are closed-class by ADR 037's kinds: *all*, *if*,
  *would*, *about*, *can*, *which*, *more*, *who*, *what*, *some*, *no*,
  *because*, *could*, *than*, *into*, *any*, *after*, *over*, *most*,
  *should*, *much*, *may*, *many*: 52. Ten are open to the inventory's
  call: *so*, *one*, *there*, *when*, *up*, *other*, *out*, *where*,
  *how*, *such*.
- **Chrome words: 80, 16 lessons**, the closed list of ADR 040
  (`docs/setting/chrome.md`). 11 are of band 2 (*farm* 1083, *river*
  1176, *map* 1212, *lesson* 1234, *waste* 1246, *winter* 1328, *spring*
  1332, *hire* 1514, *factory* 1530, *tip* 1659, *hill* 1670), 3 of band
  3 (*truck* 2113, *storage* 2707, *mayor* 2779) and none off the list;
  the other 66 are of band 1.

| Lessons | Card words | Count |
|---|---|---|
| Chrome | 66 + 11 + 3 | 16 |
| Band 1 | 1 000 − 57 − 66 = 877 | 175 |
| Band 2 | 1 000 − 11 = 989 | 197 |
| Band 3 | 809 − 3 = 806 | 161 |
| All | | 549 |

The last band 1 lesson is at position 16 + 175 = 191; the last lesson
of band 3 at 549. Across 52 to 62 frame words, the first lies between
190 and 192 and the second between 548 and 550, so the food level there
is 48 after band 1 and 137 or 138 after band 3: food at 604 ends at
4 741.4 at level 137 and 4 771.6 at level 138.

| After | Position | Food level | Factor | Food at 604 | Food at 40 | Trunk's compounding, at 604 |
|---|---|---|---|---|---|---|
| Lesson 1 | 1 | 1 | 1.05 | 634.2 | 42 | 634.2 |
| The last band 1 lesson | 191 | 48 | 3.40 | 2 053.6 | 136 | 6 282.4 (1.05⁴⁸ = 10.40) |
| The last lesson of band 3 | 549 | 138 | 7.90 | 4 771.6 | 316 | 507 177.8 (1.05¹³⁸ = 839.70) |

In winter each rate is three quarters of these: 475.65, 1 540.2 and
3 578.7 at 604. After lesson 549 the four resources stand at levels 138,
137, 137 and 137, since 549 = 4 × 137 + 1. Each lesson adds the same
amount, 5 % of the rate without skills, 30.2 per hour at 604; what it
adds relative to the rate already reached falls, from 5 % at level 1 to
1.5 % at level 48 (3.45 / 3.40) and 0.6 % at level 138 (7.95 / 7.90), as
each level of a building or an art adds less of what it already gives.

## Considered options

- **Compounding, one factor per level (trunk).** Each lesson adds 5 %
  of the rate already reached, so production grows exponentially with the
  curriculum: 10.4 times after band 1 and 840 times after band 3, against
  a farm whose last level gives 589. Any cost the economy sets is trivial
  long before band 3, and a curriculum that later grows past the NGSL
  makes it worse. It also breaks ADR 035's "as an art does today": an
  art's levels add up. Rejected for the sum.
- **A theme decides the resource** (a lesson about meals raises food).
  The tie between word and reward is pleasant, but a theme is free text
  no check can read, most themes (family, time, feelings) name no
  resource, and the window of 30 (ADR 037) already constrains which
  themes a lesson can draw. The resources would end unbalanced by
  accident. Rejected.
- **The player picks the resource.** Autonomy supports internalised
  motivation (`research.md` §12, Ryan and Deci 2000), but the choice falls
  at the lesson's start about a level paid about 13 days later (ADR 036,
  Consequences), it is a new mechanic that serves the economy rather than
  learning (ADR 035: a new mechanic enters only for learning), and it
  needs storage on the study and a screen. Rejected; an A/B of the skills
  link (`decisions.md` §13) can test it later.
- **The skill written in each lesson file, with a check that it follows
  the cycle.** Two sources for one fact, which ADR 037 rejected for the
  rank. A lesson inserted among others then fails the check until every
  later file is rewritten, which ends where the derived rule starts.
  Rejected for derivation.
- **A percent that follows coverage.** Band 1 carries 90.7 % of the
  NGSL's own tokens, band 2 6.7 % and band 3 2.5 % (`ngsl-1.2.csv`'s
  adjusted frequency, summed per band), so a band 3 lesson would be worth
  about a thirtieth of a band 1 lesson. The percent is a whole number of
  at least 1 (`EarnedSkillSchema`, the `player_skills` check), so band 3
  at 1 % would put band 1 near 30 % a lesson. The learner's effort per
  lesson is the same five words under the same rule, and a reward that
  shrinks to nothing in band 3 tells the learner the late words do not
  matter, where every lesson's words still have to be retained. Rejected
  for one percent.
- **A percent that rises with difficulty**, since rarer words are harder
  to retain. No measure of a lesson's difficulty exists until the review
  log has one (ADR 037, check 8). Rejected until then.
- **A smaller percent, 1 to 4.** Totals fall (+138 % for food at 1 %),
  but at a farm of level 1 a lesson at 1 % adds 0.4 food per hour, too
  little to see on the verdict that shows the rate before and after
  (`RaisedSkill`), while novelty and attrition are the main threats to
  an app learner (`research.md` §11). 5 % keeps lesson 1, the art step and every
  lesson on one number. Rejected.
- **A cap on a resource's skill.** Every lesson past the cap would earn
  nothing, which tells the learner to stop. The sum is already linear in
  the lessons; the economy sizes costs against it. Rejected.
- **A level frozen at the lesson's start**, so an inserted lesson never
  moves an unearned one. It needs a stored skill on every study for a
  content change that ADR 037's order makes rare; and an unearned level
  is not yet the player's. Rejected.

## Consequences

- `packages/domain`: `deriveResourceRates` sums each resource's earned
  percents into one factor; its test's 11.55 becomes 11.5. `Lesson` and
  `EarnedSkill` are unchanged, and so is `player_skills`: no migration.
- `packages/contracts`: `LessonContentSchema` loses `skill`; a
  curriculum schema gains `skill: { cycle, ratePercent }`.
  `apps/api`'s `JsonLessonCatalog` derives each lesson's skill from its
  position.
- The skill's earn condition reads "every word of its lesson the player
  holds a card for, and at least one" once the holdout ships; ADR 036's
  rule 7 and ADR 037's holdout are amended, each marked.
- ADR 037 is amended: `lesson-<n>.json` names no skill, `curriculum.json`
  holds the curve, the gate gains check 10, and its Consequences line on
  the skill points here.
- The town rebuild owes the cycle of the town's four resources in
  `curriculum.json` and the mapping of stored levels in its reset
  migration. Lessons earned before it under the medieval cycle leave
  material ahead of power after the mapping; the owner is the one player,
  so the gap is a handful of levels and is left. (Amended by ADR 040:
  the cycle is written, and the levels copied food to food, in the slice
  that moves lessons to the school; no lesson after lesson 1 ships
  before it, so no level is mapped and no gap opens.)
- The economy that replaces the medieval content is sized against a
  skill factor that grows by 0.05 per level, to about 3.4 per resource
  after band 1 and 7.9 after band 3, not against trunk's compounding.
- Issue edits this ADR forces, made on merge: #738 drops `skill` from
  `lesson-1.json`, adds the `skill: { cycle, ratePercent }` schema of
  `curriculum.json` and the `LessonContentSchema` change, and ships
  check 10; #744's tests gain the "and at least one" rule and a lesson
  whose every word is held out; and a domain ticket sums one resource's
  percents in `deriveResourceRates`.
- The curve is per lesson, not per day: how fast a learner climbs it is
  the school's cap on words in learning (ADR 035), which is that
  ticket's.

## References

- `packages/domain/src/fief/deriveResourceRates.ts` and its test;
  `packages/domain/src/learning/skillLevelOf.ts`;
  `packages/domain/src/useCases/answerReview.ts`;
  `apps/api/content/fief.json`, `farm.json`, `arts/`,
  `lessons/lesson-1.json`, `lessons/ngsl-1.2.csv`.
- ADR 035, ADR 036 (rule 7, Consequences), ADR 037 (bands, chrome
  lessons, placement, the holdout, the gate, Consequences), ADR 040 (the
  school, the chrome word list).
- `docs/research/english-pivot/decisions.md` §1.1, §1.6, §2.1, §9, §13, and
  `research.md` §11, §12 (Deci, Koestner and Ryan 1999; Ryan and Deci
  2000).
