---
status: proposed
date: 2026-11-22
---
# The feature order binds `application/`, not `domain/`

## Context

ADR 052 (section 2) drew one feature order and gave it to the api
only:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

A feature of `apps/api/src` imports only from a feature to its left,
and Biome's `feature_graph` overrides hold it. ADR 052 left the domain
package unordered on purpose: "the town reads what was learned", and
learning names the town back.

ADR 054 then moved every `application/` folder of the api into the
domain package, and said what that cost in one sentence of its section
12: "The application files that leave the api leave its feature graph:
the domain package has none." Before it, `feature_graph` bound the 64
production files the api held under `application/` (`git ls-tree -r
a618fd95 apps/api/src`). After it, nothing but
`suspicious/noImportCycles` binds an import inside
`packages/domain/src`.

The review of #1831 asked whether the domain package should get the
api's check, and #1855 recorded the question with a count: 118 import
lines against the api's order. This ADR answers it.

What trunk holds, counted at `707869c1`:

- **The count of #1855 stands.** Outside tests and `testing/`, 118
  import lines in 46 files of `packages/domain/src` name a feature to
  the right of their own, every one through a `#<feature>/` subpath:

  | From | To | Lines | Of them `import type` |
  |---|---|---|---|
  | `town` | `learning` | 56 | 43 |
  | `town` | `holdout` | 18 | 12 |
  | `holdout` | `placement` | 11 | 8 |
  | `account` | `learning` | 9 | 8 |
  | `placement` | `holdout` | 6 | 6 |
  | `content` | `learning` | 5 | 5 |
  | `town` | `placement` | 5 | 3 |
  | `learning` | `placement` | 3 | 1 |
  | `learning` | `holdout` | 3 | 2 |
  | `content` | `placement` | 1 | 1 |
  | `account` | `town` | 1 | 0 |

  89 of the 118 import only types. The tests and the `testing/`
  folders add 92 lines in 34 files.
- **Every one of the 118 names a `domain/` folder.** 66 are written in
  a `domain/` file (28 files) and 52 in an `application/` file (18
  files). None names an `application/` folder.
- **The `application/` folders already follow the api's order.** 21
  import lines in 14 production files name the `application/` folder
  of another feature, and all 21 name a feature to the left:

  | Step named | Feature | Named from | Lines |
  |---|---|---|---|
  | `readScaffold` | `account` | `holdout` 4, `placement` 4, `learning` 2 | 10 |
  | `mutateTown` | `town` | `placement` 4, `learning` 3, `holdout` 1 | 8 |
  | `saveChangedTown` | `town` | `learning` (`answerReview.ts:11`) | 1 |
  | `resolveTownReading` | `town` | `report` (`ServeReport.ts:11`) | 1 |
  | `readDueReviews` | `learning` | `report` (`ServeReport.ts:2`) | 1 |

  Two test lines do the same, naming the town
  (`holdout/domain/releasedLessonsOf.test.ts:14-15`). No file of
  `account` or `town` names an `application/` folder to its right,
  and `placement`, `holdout` and `report` name none of each other's.
- **No production `domain/` file imports an `application/` file**, of
  its own feature or another's: `rg -n "from '(#|\.).*/application/"
  packages/domain/src -g '**/src/**/domain/**' -g '!*.test.ts'` is
  empty. Without the last glob it prints the two test lines above.
- **The `domain/` folders follow no order at all.** Counting only the
  lines a `domain/` file writes about another feature's `domain/`
  folder (157), six pairs of features are named both ways:

  | Pair | One way | Back |
  |---|---|---|
  | `town` and `learning` | 35 | 8 |
  | `holdout` and `learning` | 28 | 1 |
  | `placement` and `learning` | 18 | 1 |
  | `town` and `holdout` | 9 | 1 |
  | `holdout` and `placement` | 5 | 3 |
  | `account` and `learning` | 4 | 1 |

  The best order any arrangement of the features allows leaves 15 of
  those lines against it, in 11 files, and that order is `learning <-
  account <- placement <- holdout <- town`: the api's order with the
  town and learning the other way round. For whole features, both
  layers together, the best order leaves 49 lines in 25 files.
- **The lines that go back are the product.**
  `learning/domain/LessonSkill.ts:1` types a lesson's skill by the
  town's `ResourceKind`: a retained word earns the skill that raises a
  town resource. `town/domain/TownStores.ts:1-6` lists the learner's
  `CardRepository`, `PendingReviewRepository` and `ReviewLog`, the
  holdout's `BandStartRepository` and the placement's
  `PlacementRepository`, because a town mutation settles the school
  lesson. `learning/reviews/domain/AnsweredReview.ts:3` calls the
  town's `openedLevelOf`: a review can open a building level.
  `placement/domain/isPlacementOffered.ts:1` reads the holdout's
  `BandStart`, and seven files of `holdout` read the placement's
  `PlacementWordCatalog`.
- **A root file names three features.** `DomainError.ts:1-12` imports
  types of `holdout` (1 line), `learning` (1) and `town` (7), and
  every feature imports `DomainError`. It is a file of the `src/`
  root, in no feature folder.
- **Every import across features is a `#` subpath.** No relative
  import leaves its top-level folder, and
  `subpath_import_inside_folder` refuses a `#` import that stays
  inside one, with an empty baseline. So `from '#<feature>/` inside
  another feature's folder is a crossing, and `rg` can count it.

What is not reopened: the api's order and its schema exemption (ADR
052, section 2), the three layers and where each lives (ADR 054,
section 1), `noImportCycles` with `ignoreTypes: false` over the
backend, and the rule that a use case never imports another use case
(`use_case_imports_use_case`).

### How the numbers were taken

Every count is a command run on trunk at `707869c1`; the pull request
that files this ADR lists each with its output. A production file is
ADR 052's: a `.ts` file that is not `*.test.ts` and not under a
`testing/` folder. An import line is one `from '…'`, so an import
written over several lines counts once. The pairs were counted twice,
by `rg` alone and by a script that resolves every import to its file,
and the two agree. "The best order" is the exact minimum over every
arrangement of the features, not an estimate. Section 3 says what the
prototype covered and what it printed.

## Decision

### 1. The api's order holds in the domain package for `application/`

Inside `packages/domain/src`, a file of a feature imports a file under
another feature's `application/` folder only when that feature is to
its left:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

It is the api's order, not a second one. The rule binds what is
imported, not who imports it: a `domain/` file, a test and a fake of
`holdout` are refused the `application/` of `placement` as a use case
of `holdout` is. A sub-area follows its feature
(`#learning/reviews/application/readDueReviews` is the `application/`
of `learning`), and inside one feature the sub-areas import one
another as before (ADR 052, section 3).

`memory` and `season`, which the api does not hold, stand with
`platform` at the left: each has only a `domain/` folder, and neither
imports a feature (`memory` reads `time/` and the root's `Result` and
`DomainError`, `season` reads `time/`). The kernel folders `player`,
`time`, `hash` and `grid` and the root files are outside the order, as
they are outside every feature.

Why the order belongs to this layer:

- **The order is a fact about calls.** ADR 052 gave its reason: "every
  write runs inside the town's transaction". That transaction is now
  opened in the domain package, by
  `town/application/mutateTown.ts`, and the steps a feature shares are
  the files the 21 lines name. Learning, the placement and the holdout
  call the town's mutation and the account's `readScaffold`; the town
  and the account call none of theirs.
- **It is the check ADR 054 took away, put back where the files
  went.** The api's `application/` was under `feature_graph` until it
  moved. The files kept the order without a check; this makes the
  order a rule again.
- **It costs nothing to adopt.** No line on trunk is against it, so no
  baseline is written and no ticket fixes a crossing.
- **`noImportCycles` is not the same rule.** It refuses a loop once it
  closes, file to file. The order refuses the first import: a step of
  the town that names a step of learning is refused before anything
  of learning names it back.

### 2. The `domain/` folders are not ordered among features

A file may import the `domain/` folder of any feature. Between the
`domain/` folders of two features, `noImportCycles` is the only import
rule, as ADR 052 decided for the whole package.

- **No order fits them.** The api's order leaves 118 lines against it,
  and the best order of their own leaves 15, with the town and
  learning reversed. A reader would hold two orders for one list of
  feature names.
- **What they share is vocabulary.** 89 of the 118 lines import types.
  A `domain/` folder holds entities, values, pure rules and port
  interfaces (ADR 054, section 2); none of them reads a port, opens a
  unit of work or holds a lock. A type that names a type of another
  feature is not a call an order can direct.
- **The two-way lines say what the game is.** A lesson earns a skill
  of the town, the school teaches a lesson of the learner, a review
  opens a building level. Removing them means a home to the left of
  both for the words they share, which ADR 052 already called "a
  change to the model, not a move of files". Options B and C price
  it.

The files are still free of cycles: `noImportCycles` reads type-only
imports as well, and finds none on trunk.

### 3. The check

`feature_graph` gains eight Biome overrides, one per feature of the
order, after the fifteen of the api. Each is the api's override with
two changes: it includes `packages/domain/src/<feature>/**`, and every
pattern ends in `/application/**`. For the town:

```json
{
  "includes": ["packages/domain/src/town/**"],
  "linter": {
    "rules": {
      "style": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "patterns": [
              {
                "group": [
                  "**/learning/**/application/**",
                  "#learning/**/application/**",
                  "**/placement/**/application/**",
                  "#placement/**/application/**",
                  "**/holdout/**/application/**",
                  "#holdout/**/application/**",
                  "**/report/**/application/**",
                  "#report/**/application/**"
                ],
                "message": "ADR 055: town imports an application/ folder only of a feature to its left: platform <- content <- account <- town <- learning <- placement, holdout, report."
              }
            ]
          }
        }
      }
    }
  }
}
```

- The override of `platform` also includes
  `packages/domain/src/memory/**` and `packages/domain/src/season/**`.
- `placement`, `holdout` and `report` each refuse the other two, as in
  the api.
- There is no exemption to write: the schema exemption of the api is
  about `infrastructure/persistence/`, which the domain package does
  not hold.
- Tests and `testing/` folders are inside the `includes`, as the api's
  tests are inside its overrides.

The same rule as a line a reader or a ticket can run, expected to
print only imports that name a feature to the left:

```
rg -n "from '#\w+/(\w+/)?application/" packages/domain/src -g '*.ts' -g '!index.ts' -g '!testing.ts'
```

It prints 23 lines on trunk, the 21 and the two of the test.

**The prototype.** The eight overrides were not applied to the
repository. They were added to a copy of `biome.json` beside a copy of
`packages/domain/src` in a scratch folder, with the `vcs` block turned
off because the copy is not a git checkout, and run with the pinned
Biome 2.5.14:

| Config | `biome lint packages/domain/src` |
|---|---|
| trunk's | exit 0, 505 files, no diagnostic |
| with the eight overrides | exit 0, 505 files, no diagnostic |
| with the order reversed, each feature refusing the `application/` of the features to its left | exit 1, 23 `noRestrictedImports` diagnostics: the 21 lines and the two of the test |

The third run is the proof that the patterns read what they claim:
they match a feature's own `application/`
(`#town/application/mutateTown`) and a sub-area's
(`#learning/reviews/application/readDueReviews`), and they leave every
`#<feature>/…/domain/…` import alone.

### 4. The rule and doc edits

Named here, not applied. All of them land in one pull request, with
the overrides, so that no rule names a check that does not run
(`verification.md`, the `.claude/**` row).

| File | Edit |
|---|---|
| `biome.json` | The eight overrides of section 3 |
| `.claude/rules/architecture.md` | After "`feature_graph` is enforced by Biome, not the script": "It binds every import between two features of `apps/api/src`, and in `packages/domain/src` every import that names another feature's `application/` folder. The `domain/` folders of the domain package are not ordered among features: `noImportCycles` is their only import rule (ADR 055)." |
| `.claude/rules/architecture.md` | In `packages/domain`, the Use cases bullet gains: "A step is imported across features only from a feature to its right in the api's order." |
| `ARCHITECTURE.md` | After the sentence on the schema exemption: "In `packages/domain`, the same order holds for `application/`: a file imports another feature's `application/` folder only from a feature to its left, with `memory` and `season` beside `platform`. The `domain/` folders are not ordered among features (ADR 055)." |
| `ARCHITECTURE.md` | The checks: "`feature_graph` (Biome): a feature imports only from its left" becomes "`feature_graph` (Biome): in the api a feature imports only from its left; in the domain package an `application/` folder is imported only from its right." |
| `docs/adr/052-…md` | Under "The feature graph is the api's": "Amended by ADR 055: the order also binds the `application/` folders of the domain package." |
| `docs/adr/054-…md` | Under section 12's last paragraph: "Amended by ADR 055." |
| This ADR | `status: accepted` |

### 5. What this amends

| ADR | Sentence | Fate |
|---|---|---|
| 052, section 2 | "The domain and the contracts are not ordered by this graph" | kept for the contracts and for the `domain/` folders; the `application/` folders of the domain package are ordered |
| 052, section 7 | "The domain and the contracts get no such override" | the domain gets eight, for `application/` only |
| 052, Consequences | "The domain's features stay unordered among themselves … no check pretends otherwise" | true of their `domain/` folders |
| 054, section 12 | "The application files that leave the api leave its feature graph" | they rejoin it |
| 054, Consequences | "The application leaves the api's feature graph. Only `noImportCycles` binds it there." | superseded by section 1 |

## The migration

One ticket, and no crossing to fix first:

| Ticket | Changes | Proof |
|---|---|---|
| The order on the domain's `application/` | the eight overrides, the edits of section 4, this ADR accepted | `pnpm gate` green with no baseline line; one import against the order, planted in a file of the town and removed, is refused with the message of section 3 |

It moves no file and changes no code, so `openapi.json`, the
migrations and Android stay as they are.

No ticket untangles the `domain/` folders. If the owner later wants an
order there, option C lists the six knots and their lines.

## Considered options

### A. The api's order, for `application/` only (chosen)

Sections 1 to 3. One ticket, no crossing.

### B. The api's order for the whole package

Option b of #1855: every file of a feature imports only from its left,
as in the api.

- For: one rule, the same in both packages, with no layer in its
  wording.
- Against: 118 lines in 46 files are against it, and they are not
  misplaced files. They name 43 files of `learning` (25), `placement`
  (9), `holdout` (8) and `town` (1), and those 43 import 26 more of
  the same features: 69 files would need a home to the left of the
  town, 42 of the 82 production files of learning's `domain/`
  folders, 15 of the holdout's 20 and 11 of the placement's 14. That
  is not a move inside the order, it is the order reversed for the
  vocabulary under another name. A feature has the same name in every
  package (ADR 052, section 2), so the new home would be a new
  feature in the map, or `content` grown to hold the learner's words
  in the domain while it holds JSON catalogs in the api.
- Cost: at least eight tickets, one per group of words that moves
  (the curriculum's `Lesson`, `Band` and catalogs; the cards and
  their repository; `BandStart` and its repository; the placement's
  repository and scores; `PlacementWordCatalog`; `Scaffold`;
  `LessonLibrary`; `isLessonFinishedBy`), each rewriting its
  importers in the domain package, and an ADR for the feature that
  receives them.

Refused. ADR 052 refused the same thing as "one feature graph for the
three packages", and the code has moved further from it since: the
town named learning in 39 lines then and names it in 56 now.

### C. An order of its own for the `domain/` folders

Option a of #1855, with what trunk allows: `learning <- account <-
placement <- holdout <- town` for imports that name a `domain/`
folder, beside the api's order for `application/`.

- For: it is the nearest thing to an order the vocabulary has, and 15
  lines are few.
- Against: no order is satisfied as the code stands, so "an order the
  code already satisfies" does not exist. The 15 lines are six knots,
  each a question about a word's home:

  | Knot | Lines |
  |---|---|
  | A lesson's skill names the town's `ResourceKind` | `learning/domain/LessonSkill.ts:1` |
  | Learning names `TownSkill` | `retainedWordsOf.ts:1`, `chromePhaseOf.ts:1`, `ReviewOutcome.ts:2`, `AnsweredReview.ts:5` |
  | A review's outcome reads the town | `ReviewOutcome.ts:1`, `AnsweredReview.ts:3-4` |
  | The learner's stores list an account port and a placement port | `learning/domain/LearnerStores.ts:1-2` |
  | `BandStart` lives in the holdout and is read to its left | `bandLinesOf.ts:1`, `isPlacementOffered.ts:1`, `placementViewOf.ts:1`, `askedSampleOf.ts:1` |
  | A released lesson is typed by the school's `SchoolLesson` | `holdout/domain/ReleasedLesson.ts:2` |

  And once they are cut, the package holds two orders over one list
  of names, opposite for the town and learning. A reader has to know
  which layer he is in before he knows which way the arrow points.
- Cost: five tickets for the knots (the two about `TownSkill` and the
  town's reading share `AnsweredReview.ts` and `ReviewOutcome.ts`), a
  sixth for a second set of overrides, and this ADR rewritten.

Refused for now. It is the option to reopen if a cycle of meaning
between two `domain/` folders ever costs a change, and its count is
here so that the question starts from numbers.

### D. No order in the domain package

`noImportCycles` only, as today.

- For: nothing to write, and trunk is already clean.
- Against: the 21 lines keep the api's order because the files came
  from under the api's check, and nothing holds them to it now. The
  first step of the town that names a step of learning passes the
  gate, and the review of #1831 is where such a line would be caught,
  by a person.

Refused: the check is eight blocks of configuration and no code
change, for a rule the code already keeps.

### E. Untangle first, check after

Option B's tickets or option C's, then the check.

Refused with them. It also leaves `application/` unchecked while the
tickets run, for no reason: section 1 depends on none of them.

## Consequences

- One order, in both packages, for the thing an order can direct: who
  calls whom. `mutateTown` and `readScaffold` are called from the
  right, never the reverse, and Biome says so.
- `biome.json` grows by eight overrides, about 200 lines, to 23
  feature overrides in all. A new feature adds its override in both
  packages.
- A reader of `town/school` still opens `learning`, and a reader of
  `AnsweredReview.ts` still opens `town`. ADR 052's sentence stands
  for the `domain/` folders, and no check pretends otherwise.
- The rule has a layer in its wording. A step that two features to
  the left and right both need cannot be imported from the right: it
  moves left, or its pure part moves to a `domain/` folder, which any
  feature may import.
- A use case of the town may still take a port of learning, the
  holdout or the placement in its stores, as `TownStores` does. The
  order binds the steps, not the ports.
- `DomainError.ts` keeps naming types of three features from the
  root. Whether a refusal's payload should name a feature's type is a
  separate question and no part of this order.
- Nothing moves: no file, no wire shape, no table, no line of copy.

## References

- Issue #1855; the review of pull request #1831, where the question
  was asked; issue #1825, which carried it to the close of ADR 054.
- ADR 052, section 2 ("The feature graph is the api's") and section 7
  (`feature_graph`); ADR 054, sections 1, 2 and 12.
- `biome.json`, the fifteen `feature_graph` overrides of the api.
- `.claude/rules/architecture.md`, `ARCHITECTURE.md`,
  `.claude/rules/verification.md`.
