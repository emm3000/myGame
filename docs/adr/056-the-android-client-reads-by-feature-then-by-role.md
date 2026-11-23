---
status: proposed
date: 2026-11-22
---
# The Android client reads by feature, then by role

## Context

The owner wants a client a human can keep working on with no AI, by
Clean Code, Clean Architecture's dependency rule, SOLID, Screaming
Architecture and the Android conventions the repo already chose:
Gradle modules, MVI, a stateful route over a stateless screen. ADR 052
answered the same question for the backend, ADR 054 gave its layers
their three words and ADR 055 said where its feature order binds. This
ADR is their twin for `apps/android`.

An audit of the client, posted as the first comment of #1744, found
the shape the backend's audit found: the code inside a file meets the
bar and the structure around the files does not. Its findings,
recounted on trunk for this ADR:

- **A module's name does not say what is in it.** `core:network` is
  158 files, 127 of which name neither the generated client nor an
  HTTP library: it is the client's model, and 69 of the 98 files of
  `app` and the features that hold a composable import it.
  `feature:signin` holds 8 of the 23 ViewModels, the settings' among
  them. `feature:placement` holds the holdout check, 12 of its 30
  files. `feature:town` holds the status line and the dock of every
  other screen, 10 files and 833 lines. The names are not the
  backend's: `signin` for `account`, `review` for `learning`, `map`
  for `town/jobs`.
- **A package says nothing.** 513 production files sit in 13 packages,
  one per module, with no sub-package anywhere.
- **The signed-in shell has no home.** Its frame is in `app`
  (`app/FramedScreen.kt`), its ViewModel in `feature:town`
  (`feature/town/TownStatusViewModel.kt`), its channel in `core:ui`
  (`core/ui/TaskDockHook.kt`). 50 production files in 10 modules
  mention the dock. `app` builds `TownViewModel`
  (`app/AppNavigation.kt:226`) and `SchoolViewModel` (`:268`) to read
  their state for the frame, and imports a ViewModel, a `UiState` or
  an `Intent` of a feature in 11 lines. Among the last 400 commits
  that touched `apps/android`, 237 are a `feat` or a `fix` that
  changed its production Kotlin; 5 of them touched 7 modules, and
  three of the five are the dock.
- **Outside the six MVI names, a file name does not say a role.**
  `feature/town/TownContent.kt` and `feature/school/SchoolContent.kt`
  are state mappings (`TownSnapshot.contentAt`), while the composable
  named `SchoolContent` is private in `feature/school/SchoolScreen.kt`
  (`:146`). `feature/town/TownStatusScreen.kt` is a sealed interface.
  `*Dock.kt` is the dock's composable, a mapping to its state, a data
  class and four composables that draw nothing. 67 production files
  declare nothing of their own name; 15 of them are the consistent
  `*Mapping.kt` of `core:network`.
- **Nineteen files pass 250 lines**, 5,948 lines of the client's
  28,693. Previews and the fixtures they build stand at the foot of 63
  files, 2,181 lines; 1,154 of them are in 17 screen files, and they
  are 23 % to 43 % of the six largest. Seven ViewModels keep five to
  twelve private `var`s beside their `UiState`.
- **Knowledge is written three to seven times** because the module
  graph leaves it no home. The projection's gap is written in seven
  files, `failedReadRetry` is declared in five, the season's icon in
  three modules. Two production file names are in two modules each,
  `FramePieces.kt` and `SeasonLabels.kt`, and two test helpers are
  copied from module to module, `NavRowMatcher.kt` and
  `TextStyleLookup.kt`. `core:ui`, the module for what features share,
  may not import the model, and a feature may not import a feature.
- **No limit above the function is a check, and there is no map.**
  The pinned detekt has no rule for the length of a file, and nothing
  counts a package. `apps/android/CLAUDE.md` holds commands and traps.
  Four of the seven rows of the module table of
  `.claude/rules/android-architecture.md` no longer describe the code:
  `app` (it also holds two MVI sets, the frame and the study
  reminder), `feature:<name>` ("one game screen", false for five of
  the seven), `core:network` (four files in five are not the wire) and
  `core:ui` ("read the game's models", which its allowed edges
  forbid).

What already holds and is not reopened here: the native client as a
renderer of the api, the generated contract and the bearer session
(ADR 034); the six MVI names, exact in all 23 sets; effects on a
buffered `Channel`; no feature-to-feature edge, held by
`checkModuleBoundaries`; the design system as the only toolkit; copy
only from the catalog (ADR 038); the lazy projection and its shared
fixture (ADR 005); the dock's behavior (ADR 047, ADR 051); no
comments; injected time; tests as sentences with fakes. The client has
no injection framework and this ADR adds none.

### How the counts were taken

Every count is a command run on trunk at `c5c3bf37`, from a snapshot
and never from a checkout:

```
git archive origin/trunk apps/android .claude/rules docs/adr CONTEXT.md ARCHITECTURE.md packages/catalog apps/api/src packages/domain/src packages/contracts/src | tar -x -C snapshot
```

Unless a row says otherwise its command runs from `snapshot/`. The
pull request that files this ADR lists each command with its output.
Four definitions hold throughout:

- **A production file** is a `.kt` file under a `src/main/` directory,
  `build-logic` left out: its 13 files hold 346 lines and none of the
  findings. `P` in a command stands for
  `-g '*.kt' -g '!**/src/test/**'`.
- **A path** is written without its middle: `feature/town/TownScreen.kt`
  is
  `apps/android/feature/town/src/main/kotlin/com/emm/mygame/feature/town/TownScreen.kt`,
  and `app/Navigator.kt` is
  `apps/android/app/src/main/kotlin/com/emm/mygame/Navigator.kt`. A
  path that starts at `apps/`, `packages/`, `docs/` or `.claude/` is
  written whole. Every path this ADR cites as trunk's resolves with
  `git ls-tree -r --name-only origin/trunk`.
- **A size** is what the rule that will enforce it counts, as in ADR
  052. A file's lines are `wc -l`. A function's lines are detekt's, and
  no script's estimate of them is in this ADR.
- **The target's names** do not exist on trunk and are born by their
  step: the modules `core:model` (`apps/android/core/model`),
  `feature:account`, `feature:jobs`, `feature:learning`,
  `feature:holdout` and `feature:shell`, the task
  `checkStructure`, the class `ApiRepositories`, the type
  `ShownScreen`, the composable `FillReviewDock`, the files
  `apps/android/ARCHITECTURE.md`,
  `apps/android/config/structure/baseline.txt`, `TownUiStateMapping.kt`,
  `SchoolUiStateMapping.kt`, `TownScreenPreview.kt`,
  `PlacementOfferRoute.kt` and `HoldoutCheckRowsRoute.kt`, and every
  name written with a `<placeholder>`.

| Count | Command |
|---|---|
| 513 production files, 28,693 lines | `fd -e kt -p '/src/main/' apps/android -E build-logic \| wc -l`; the same with `-x bat -pp` piped to `wc -l` |
| 13 packages, one per module: `core/network` 158, `core/designsystem` 71, `feature/signin` 51, `feature/town` 42, `feature/school` 40, `feature/placement` and `app` 30, `core/ui` and `core/testing` 20, `feature/map` 17, `feature/report` 15, `feature/review` 11, `core/projection` 8 | `fd -e kt -p '/src/main/' apps/android -E build-logic -x dirname \| sort \| uniq -c \| sort -rn` |
| 13 files and 346 lines of `build-logic` | `fd -e kt . apps/android/build-logic \| wc -l`; the same with `-x bat -pp` piped to `wc -l` |
| 127 of `core:network`'s 158 files name no wire | `rg --files-without-match 'core\.network\.generated\|^import (retrofit2\|okhttp3)' apps/android/core/network/src/main \| wc -l` |
| 98 files with a composable in `app` and the features, 69 importing `core.network` | `rg -l '@Composable' apps/android/feature apps/android/app -g '!**/src/test/**' \| wc -l`; the same piped to `xargs rg -l '^import com\.emm\.mygame\.core\.network\.' \| wc -l` |
| 23 ViewModels: `feature/signin` 8, `feature/school` 4, `feature/placement` 3, `feature/town`, `feature/report` and `app` 2, `feature/review` and `feature/map` 1; so five of the seven feature modules hold more than one | `fd -p -g '**/src/main/**/*ViewModel.kt' apps/android \| rg -o 'android/(app\|feature/\w+)' -r '$1' \| sort \| uniq -c` |
| 23 `*ViewModel.kt`, 23 `*UiState.kt`, 23 `*Intent.kt`, 12 `*Effect.kt`, 18 `*Route.kt`, 20 `*Screen.kt` | `fd -p -g '**/src/main/**/*<suffix>.kt' apps/android \| wc -l`, once per suffix |
| 12 `HoldoutCheck*` files of `feature:placement`'s 30; 5 `HoldoutCheckRow*` files in `feature:school` | `fd -p -g '**/src/main/**/HoldoutCheck*.kt' apps/android/feature/placement \| wc -l`; `fd -p -g '**/src/main/**/HoldoutCheckRow*.kt' apps/android/feature/school \| wc -l` |
| 10 files and 833 lines of status line and dock in `feature:town` | `fd -e kt -p '/src/main/' apps/android/feature/town \| rg '/(TownStatus\|TownDock\|TownNotice\|TownReportRow)' \| wc -l`; the same piped to `xargs bat -pp \| wc -l` |
| 50 production files in 10 modules mention the dock | `rg -l -i 'dock' P apps/android \| wc -l`; the same piped to `rg -o 'android/(app\|feature/\w+\|core/\w+)' -r '$1' \| sort -u \| wc -l` |
| `app` builds `TownViewModel` at `:226` and `SchoolViewModel` at `:268` | `rg -n '(TownViewModel\|SchoolViewModel)\(' P apps/android` |
| 11 import lines of a feature's ViewModel, `UiState` or `Intent` in `app` | the second check of section 7 |
| 237 commits, 5 on 7 modules, three of them the dock (`f69f96a8`, `92efcef8`, `2eb2d256`) | on the repository, not the snapshot: `git log origin/trunk -400 --format='@%h %s' --name-only -- apps/android`, grouped per commit by module over production `.kt` paths, subjects that start with `feat` or `fix`; the pull request holds the `awk` program |
| 67 files that declare nothing of their own name, 15 of them `*Mapping.kt` | the script `unnamed.py` in the pull request: a production file with no `class`, `interface`, `object`, `typealias`, `fun`, `val` or `var` named as the file |
| 15 `*Mapping.kt`, all in `core:network` | `fd -p -g '**/src/main/**/*Mapping.kt' apps/android \| wc -l`; the same on `apps/android/core/network` |
| 7 `*Labels.kt`, 10 `*Dock.kt` | `fd -p -g '**/src/main/**/*Labels.kt' apps/android`; the same for `*Dock.kt` |
| 19 files over 250 lines, 5,948 lines | `fd -e kt -p '/src/main/' apps/android -x wc -l \| awk '$1 > 250 { n++; s += $1 } END { print n, s }'` |
| 2,181 lines of previews at the foot of 63 files, 1,154 of them in 17 `*Screen.kt` files; 223 of 530 in `SchoolScreen.kt`, 152 of 379 in `TownScreen.kt`, 130 of 315 in `MapScreen.kt`, 129 of 299 in `ReviewScreen.kt`, 109 of 392 in `LessonWordsScreen.kt`, 67 of 285 in `ReportScreen.kt` | per production file, from its first top-level declaration named `preview…` or `…Preview…`, or its first `@Preview…` line, to its last line: `fd -e kt -p '/src/main/' apps/android -E build-logic -x awk 'FNR==1{s=0} s==0 && /^(@Preview\|(private \|internal )?(val\|fun\|class\|object) (preview[A-Z]\|[A-Za-z]*Preview))/{s=FNR} END{ if (s>0) print FNR-s+1, FNR, FILENAME }' {}`, summed; the same lines filtered by `rg 'Screen\.kt$'` |
| Private `var`s per ViewModel: 12, 11, 7, 6, 6, 6, 5 | `rg -c '^\s+private var ' -g '*ViewModel.kt' apps/android` |
| The gap in 7 files | `rg -l 'readAt - clock\.now\(\)\|fun serverNow' P apps/android \| wc -l` |
| `failedReadRetry` declared 5 times; the season's icon 3 times | `rg -n 'val failedReadRetry' P apps/android`; `rg -n 'fun seasonIconOf' P apps/android` |
| Two production names and two test names twice | the fourth and fifth checks of section 7 |
| 18 test files over 500 lines, 12 over 600, 7 over 800 | `fd -e kt -p '/src/test/' apps/android -x wc -l \| awk '$1>500{a++} $1>600{b++} $1>800{c++} END {print a,b,c}'` |
| `core:ui` imports nothing of `core.network` | `rg -n '^import com\.emm\.mygame\.core\.network' apps/android/core/ui/src/main` prints nothing |
| 7 factory functions named as the interface they return | `rg -n '^fun [A-Z]\w+\(' apps/android/core/network/src/main` |
| 16 destinations; 10 `*Entry` functions and 16 `entry<…>` calls in the 515 lines of `app/AppNavigation.kt` | `rg -c 'data (object\|class) '` on `app/Destination.kt`; `rg -c 'EntryProviderScope<NavKey>\.\w+Entry\('` and `rg -c 'entry<Destination'` on `app/AppNavigation.kt`, `wc -l` for its lines |
| 30 files in `app`, 4 of them `RetainedWords*` | `fd -e kt -p '/src/main/' apps/android/app -x basename`; `fd -p -g '**/src/main/**/RetainedWords*.kt' apps/android/app \| wc -l` |
| 13 modules | `rg -c '^include\(' apps/android/settings.gradle.kts` |
| The api's features and the town's six sub-areas | `fd -t d -d 1 . apps/api/src -x basename`; the same on `apps/api/src/town`, `infrastructure` left out |
| The Android leg's command is written in 4 files | on the repository: `git grep -l 'checkComposeFreeViewModels testDebugUnitTest' origin/trunk -- . ':!docs'` |
| 522 Android keys: `town` 156, `signin` 82, `school` 74, `map` 70, `report` 49, `review` 45, `placement` 36, `app` 10 | `rg -o '"android\.(\w+)\.' -r '$1' packages/catalog/en.json \| sort \| uniq -c` |
| 213 Android keys of fixed copy | `rg -c 'android\.' packages/catalog/src/fixedCopyKeys.ts` |
| 15 keys with `holdout` in their name, 12 in `placement` and 3 in `school` | `rg -o '"android\.(placement\|school)\.(\w*holdout\w*)"' -r '$1' packages/catalog/en.json \| sort \| uniq -c` |
| 23 string names read by the ten status and dock files | the ten files of the row above, piped to `xargs rg -o --no-filename 'R\.string\.\w+' \| sort -u \| wc -l` |
| 70 feature files read `R.`; no wildcard import | `rg -l '\bR\.(string\|drawable)\b' apps/android/feature P \| wc -l`; `rg -n '^import .*\.\*$' apps/android -g '*.kt' \| wc -l` |
| 1,052 lines naming `core.network.` in the features and `core:ui`, 466 of them production | `rg -n 'core\.network\.' apps/android/feature apps/android/core/ui -g '*.kt' \| wc -l`; the same with `P` |
| 594 production and 221 test import lines of the design system | `rg -n '^import com\.emm\.mygame\.core\.designsystem\.' apps/android P \| wc -l`; the same with `-g '**/src/test/**'` |
| detekt 1.23.8: `LargeClass` 600, `CognitiveComplexMethod` off at 15, `InvalidPackageDeclaration` on, no rule named for a file's length | `apps/android/gradle/libs.versions.toml:6`; in the Gradle cache, `unzip -p detekt-core-1.23.8.jar default-detekt-config.yml` |
| `LongMethod` 60, `TooManyFunctions` 20 a file and 10 an interface | `apps/android/config/detekt/detekt.yml` |

## Decision

### 1. Feature first, role second, in every module

A Gradle module is a boundary, as a package is in the backend. Inside
every module the first cut is a feature and the second is a role:

- in a feature module, the package names a screen or a sub-area and
  the file's suffix names the role;
- in `core:model` and `core:network`, the package names the feature.

The same feature has the same word in `packages/domain`, `apps/api`,
`packages/contracts`, `core:model`, `core:network` and `feature:*`, so
a reader who knows the word knows every path (ADR 052, section 2).

The arrows, all held by `checkModuleBoundaries`:

```
app           -> feature:*, core:*
feature:*     -> core:model, core:projection, core:ui, core:designsystem
core:network  -> core:model
core:ui       -> core:model, core:projection, core:designsystem
core:testing  -> core:model, core:projection
core:model, core:projection, core:designsystem -> nothing in the project
```

Two arrows change. A feature no longer sees `core:network` at all, so
"read only by `core:network`", which `android-architecture.md` says of
the session token, becomes a fact of the build instead of a habit:
`TokenStore`, `KeystoreTokenCipher`, `PlayerLanguages`, `StudyAnswers`
and `SessionEnds` are public classes on every feature's classpath
today. And `core:ui` may read the model, which is what its row in the
rule already says it does: the season's icon, `DurationMark` and the
frame pieces get one home.

### 2. The layers of ADR 054 and the order of ADR 055

ADR 054 writes three words in the backend's tree. The client has the
same three layers and writes them as modules, not as folders:

| Layer of ADR 054 | In the backend | In the client |
|---|---|---|
| Domain: entities, values, pure rules, and the port interfaces beside what they store | `packages/domain/src/<feature>/domain/` | `core:model`, Kotlin with no Android: per feature, the types an answer of the api is read into, its `*Result` and `*Refusal`, the pure rules over them (`nextStepCard`, `registeredBetween`) and the ports (`*Repository`, `*Settings`). Beside it `core:projection`, the lazy projection of ADR 005 |
| Application: the use cases, which open a unit of work and read ports | `packages/domain/src/<feature>/application/` | none. The api holds every use case, and the client is its renderer (ADR 034): "a use case exists only where there is client-side logic" (`android-architecture.md`), which is `core:projection`: the lazy projection and the study reminder's rule. A ViewModel reads a port of `core:model` and holds no rule of the game |
| Infrastructure: what talks to HTTP, a database, a file | `apps/api/src/<feature>/infrastructure/` | `core:network`, the adapters of the wire (`Api*`, `*Mapping`), and `app`, the adapters of the phone (preferences, alarms, notifications) and the composition root |

The screens are the fourth thing, and the backend has its like: a
feature module drives the ports as a controller of
`infrastructure/http/` drives a use case (ADR 054, section 6). This
ADR calls it presentation, the Android word, because a ViewModel holds
state and a controller holds none: `feature:*`, `core:ui` and
`core:designsystem`.

The three words are not folders here, for two reasons. The backend
needs them because one package, `packages/domain`, holds two layers;
in the client each layer is a module and the build refuses a wrong
arrow before any check reads a folder name. And the application layer
is empty, so `domain/`, `application/` and `infrastructure/` inside a
feature module would be one full folder and two that never fill
(option B).

ADR 055 binds the api's order to `application/`:

```
platform <- content <- account <- town <- learning <- placement, holdout, report
```

- **The client holds no `application/`, so the order binds nothing in
  it.** No use case of the client calls another feature's step.
- **Between feature modules the rule is stricter than an order.** No
  feature module imports another, to its left or to its right
  (`allowedFeatureEdges` in `ModuleChecksConventionPlugin.kt`). What
  `learning` takes from `town` by an import in the api, a client
  feature receives from `app` as a slot.
- **The packages of `core:model` are not ordered among features**, as
  the `domain/` folders are not (ADR 055, section 2), and for the same
  reason: what they share is vocabulary. The town's `TownSnapshot`
  names the placement's `PlacementBand`, the holdout's
  `HoldoutCheckWeek` and the learner's `LessonId`
  (`core/network/TownSnapshot.kt:95`, `:103`), and the learner's
  `RaisedSkill` names the town's `TownResourceKind`
  (`core/network/RaisedSkill.kt:4`).
- **The packages of `core:network` are not ordered either.** They map
  the shapes of `packages/contracts`, which ADR 052 leaves out of the
  order: the town's overview carries a band and a check week, so
  `core/network/TownMapping.kt:65-66` calls the placement's `toBand`
  and the holdout's `toWeek`.

### 3. The features

A feature name is the api's directory under `apps/api/src`, the same
word in every column:

| Feature | `core:model` | `core:network` | Presentation |
|---|---|---|---|
| `account` | `account` | `account` | `feature:account`: `signin`, `signup`, `password`, `verification`, `settings`; in `app`, `account`: the player's language around every screen |
| `town` | `town` | `town` | `feature:town`, its root package |
| `town/building` | `town.building` | `town` | `feature:town`: `building` |
| `town/hiring` | `town.hiring` | `town` | `feature:town`: `hiring` |
| `town/guidance` | `town.guidance` | `town` | `feature:town`: `guidance`; the dock's line in `feature:shell` |
| `town/jobs` | `town.jobs` | `town` | `feature:jobs` |
| `town/school` | `town.school` | `town` | `feature:school`: its root, `words`, `text` |
| `town/news` | `town.news` | `town` | `feature:report`: `news` |
| `learning` | `learning` | `learning` | `feature:learning`: `reviews` |
| `placement` | `placement` | `placement` | `feature:placement` |
| `holdout` | `holdout` | `holdout` | `feature:holdout` |
| `report` | `report` | `report` | `feature:report`, its root package |
| `platform` | none | `platform` | `app`: the composition root and `navigation` |
| `shell` | none | none | `feature:shell`: the frame, the status line, the dock, the ring |
| `reminder`, `theme` | `reminder`, `theme` | none | `app`: `reminder`, `theme`; their settings rows in `feature:account` |

Where a name is not the api's directory, and why:

- **`shell`, `reminder` and `theme` have no directory in the api,**
  because the api holds no part of them. The shell is what the signed-in
  screens are drawn in. The study reminder "is never pushed by the
  server" (`CONTEXT.md`, Study reminder; ADR 046). The theme is a
  choice kept on the phone (`app/ThemeStore.kt`). `CONTEXT.md` gains
  **Shell** and **Theme** with this ADR, so that every feature word of
  the table is a word of the glossary.
- **`content` has no package in the client.** It is the api's JSON
  catalogs and the content gate; the client holds neither.
- **`town/resources` is the domain's alone** (ADR 052, section 2). The
  api has no such directory and the client follows the api: a stock's
  types sit in `core:model`'s `town`.
- **A module's name has one word after `feature:`.** `town/jobs` and
  `town/school` are screens of their own, so each is a module:
  `feature:jobs` and `feature:school`. Their full path stays in
  `core:model` (`town.jobs`, `town.school`), where a package is free.
- **Town News is drawn in `feature:report`**, package `news`: "the
  Report" is "the screen of the reviews due, then the Town News"
  (`CONTEXT.md`). Its types are the town's, `town.news`, as in the api.
- **`reviews` is the domain's sub-area** of `learning`
  (`packages/domain/src/learning/reviews/`); the api has not cut
  `learning` yet. The other sub-areas of the domain (`curriculum`,
  `frames`, `retention`, `scaffold`) have no screen.
- **`core:designsystem`, `core:projection` and `core:testing` carry no
  feature word** and are cut by none: they hold no game word, as the
  domain's kernel folders hold none.

What moves:

- **`core:model` is born** from the files of `core:network` that hold
  no wire: about 120. That is the 127, less eight that are
  infrastructure with no HTTP type in them and stay (`TokenStore`,
  `TokenCipher`, `KeystoreTokenCipher`, `PlayerLanguages`,
  `StudyAnswers`, `SessionEnds`, `TownReadFlight`,
  `InstantMapping.kt`), and with the `TownRepository` interface, whose
  file names the wire only for its factory. The tickets of Track M
  settle each file. It is a JVM module beside `core:projection`, in
  `jvmOnlyModules`.
- **`core:network` keeps the wire**: the `Api*` adapters, the
  `*Mapping` files, the interceptor, the converters, the token store.
  About 38 files, the 158 less those, in `platform` and one package
  per feature. Its seven
  factory functions named as the interface they return become one
  public class, `ApiRepositories`, built once by `MyGameApplication`
  from the arguments the seven calls repeat today
  (`app/MyGameApplication.kt:89-149`).
- **`feature:signin` becomes `feature:account`**, `feature:review`
  becomes `feature:learning`, `feature:map` becomes `feature:jobs`.
- **`feature:holdout` is born** from the 12 `HoldoutCheck*` files of
  `feature:placement` and the 5 `HoldoutCheckRow*` files of
  `feature:school`, which `app` already hands to the school as a slot.
- **`feature:shell` is born** from the frame in `app` (6 files:
  `FramedScreen`, `ScreenFrame`, `SignedInChrome`, `FrameKind`,
  `AboveKeyboard`, `DockMove`), the ring in `app` (the 4
  `RetainedWords*` files) and the status line and the dock in
  `feature:town` (10 files, 833 lines).

A town sub-area that is a screen of its own (`jobs`, `school`) is a
module, because a module is what keeps a screen's ViewModel out of
another screen. A sub-area drawn inside the town's screen (`building`,
`hiring`, `guidance`) is a package of `feature:town`.

The rule's row "`feature:<name>`: one game screen" is replaced by "one
feature, its screens in packages".

### 4. The package grammar

`feature/<name>/src/main/kotlin/com/emm/mygame/feature/<name>/`:

```
TownRoute.kt  TownScreen.kt  TownViewModel.kt     the root: the screen the module is
TownUiState.kt  TownIntent.kt  TownEffect.kt      named for, when there is one
TownUiStateMapping.kt  TownScreenPreview.kt
building/                                         a sub-area drawn in that screen
hiring/
words/                                            or another screen of the feature,
                                                  with its own six files
```

`feature:account` and `feature:learning` are named for no single
screen, so their root package is empty and every screen has a package.

`core/model/.../core/model/<feature>/` holds the types, the answers
(`*Result`, `*Refusal`) and the ports (`*Repository`, `*Settings`) of
one feature, a port beside what it reads, as ADR 054 (section 2) puts
a port in `domain/` and keeps no `ports/` folder.
`core/network/.../core/network/<feature>/` holds that feature's `Api*`
adapter and its `*Mapping` files; `core/network/.../platform/` holds
what names no game word.

`app/src/main/kotlin/com/emm/mygame/`:

```
MainActivity.kt  MyGameApplication.kt       the names the system holds: the manifest's
StudyReminderReceiver.kt  Destination.kt    three components and the saved back stack's keys
AppDependencies.kt
navigation/    AppNavigation.kt, Navigator.kt, one <Feature>Entries.kt per feature module
reminder/      the alarm, the store, the feed, the notifications
theme/         the store and the picked theme
account/       the player's language, read by the banner and by the frame
```

Four files of the root never move: the manifest names `.MainActivity`,
`.MyGameApplication` and `.StudyReminderReceiver`, pending alarms hold
the receiver's class, and a back stack saved before an update names
each `Destination` by its class. `navigation/` names a role and no
feature: it is the composition root's, as `app.ts` and the `compose*`
files are the api's.

A package follows its directory (`InvalidPackageDeclaration`, on by
default in the pinned detekt). `internal` is per module in Kotlin, so
a move into a sub-package changes a `package` line and import lines
and no visibility.

A module is cut into packages when it holds more than one screen or
when a package would pass the limit of section 6, as a backend feature
is cut into sub-areas (ADR 052, section 2). A small module with one
screen stays flat (`feature:jobs`, 17 files).

### 5. The file-name grammar

The six MVI names stay as they are. Every other file is named for the
one declaration it holds, or carries one of these suffixes:

| File | Role | Today |
|---|---|---|
| `<Screen>Route.kt`, `<Screen>Screen.kt`, `<Screen>ViewModel.kt`, `<Screen>UiState.kt`, `<Screen>Intent.kt`, `<Screen>Effect.kt` | as `android-architecture.md` | 23 sets, exact |
| `<Screen>ScreenPreview.kt` | the previews of a screen and the `UiState` they build by hand | 1,154 lines at the foot of 17 screen files |
| `<Screen>UiStateMapping.kt` | pure functions from the model and the clock to a `UiState` | `TownContent.kt`, `SchoolContent.kt`, `MapContent.kt`, `OfficeContent.kt`, `TownStatusDock.kt` |
| `<Feature><Shape>Mapping.kt`, in `core:network` | pure functions from a wire shape to the model | 15 files, already exact |
| `<Area>Copy.kt` | functions that choose a catalog string | the string half of the 7 `*Labels.kt` |
| `<Area>Requests.kt` | what a ViewModel remembers of one sub-area's requests in flight | `TownMutations`, `SchoolMutations`, `TownHiring`, `TownGuidance` |
| `<Feature>Entries.kt`, in `app`'s `navigation` | the navigation entries of one feature module | the 16 entries of `AppNavigation.kt` |
| `<Thing>Fixtures.kt`, `Fake<Port>.kt`, in `core:testing` | as `android-testing.md` | exact |

`Mapping` means one thing in both places: a pure function from one
layer's shape to the next one's.

Rules the check of section 7 reads:

- A `*Screen.kt` declares the composable of its name.
  `TownStatusScreen`, a sealed interface of which screen is shown,
  becomes `ShownScreen` in `feature:shell`.
- A composable file is named for the composable it declares, a noun
  for what it draws (`NamingSection`, `JobOutCard`). A composable that
  draws nothing and runs an effect is a verb, as `FillTaskDock` and
  `FollowTownDock` already are: `ReviewDock` becomes `FillReviewDock`.
  `Content` goes back to its Compose meaning, a composable.
- A route lives in the file of its name: `PlacementOfferRoute`, in
  `feature/placement/PlacementOffer.kt` today, in
  `PlacementOfferRoute.kt`; `HoldoutCheckRowsRoute`, in
  `feature/school/HoldoutCheckRows.kt`, in `HoldoutCheckRowsRoute.kt`.
- No two production files share a name, and no two test files do.
- One sub-area, one word: the hiring is `Hiring*`, never `Office*` or
  `Hire*` in a type's name (`OfficeSection.kt`, `OfficeContent.kt`,
  `HireItem.kt` and `TownHiring.kt` today). The catalog's copy keeps
  "office", which is what the player reads.
- "Route" is the stateful composable. A member of `Destination` is a
  destination.

### 6. The limits a check enforces

| Limit | Value | Enforced by | Over it on trunk |
|---|---|---|---|
| Lines in a production file | 250 | `checkStructure` | 19 |
| Lines in a function | 50 | detekt `LongMethod`, 60 today | counted by detekt in its step, not here |
| Cognitive complexity | 15 | detekt `CognitiveComplexMethod`, off today | counted by the rule in step 0 |
| Production files in one package, previews not counted | 30 | `checkStructure` | 5: `core:network` 158, `core:designsystem` 71, `feature:signin` 51, `feature:town` 42, `feature:school` 40; `app` and `feature:placement` are at 30 |
| Lines in a test file | 600 | `checkStructure` | 12, seven of them over 800 |
| Private `var`s in one class | 5 | `checkStructure` | 6 ViewModels: 12, 11, 7, 6, 6, 6 |

The first five are the backend's, value for value (ADR 052, section
6). The last has no twin there: it is the measurable part of "the
`UiState` is the only screen state". A ViewModel that needs more than
five folds them into one named, immutable value it copies, which is
also what makes a tap readable.

The two caps of ADR 052 (section 9), exports per file and methods per
type, are not copied: `kotlin-style.md` already asks for one public
type per file, and detekt's `TooManyFunctions` already holds an
interface to 10 functions.

The pinned detekt has no rule for a file's length (`LargeClass` counts
a class, and most of this code is top-level functions), so the file,
package and test limits are a Gradle task. `CyclomaticComplexMethod`
10, `NestedBlockDepth` 4, `LongParameterList` 8 and `TooManyFunctions`
20 stay as they are.

No standing exemption. A preview file is a production file for the
line limit and is left out of the package count only.

Until its step lands, a file or package over a limit is one line of
`apps/android/config/structure/baseline.txt`. The step that fixes it
deletes the line; the last step lands with the file empty and deletes
it. The function limit takes no baseline: one step cuts the functions
detekt names at 50 and lowers the threshold in the same pull request.

### 7. The checks

`checkStructure` is a third task of the `mygame.module.checks` plugin
in `build-logic`, beside `checkModuleBoundaries` and
`checkComposeFreeViewModels`. It reads source files only, joins the
Android leg of the gate and CI's `android` job, and holds its numbers
as data the way `checkModuleBoundaries` holds its edges. A human
without Gradle runs the same checks by hand; each is expected empty:

```
rg -n '^import (android|androidx)\.' apps/android/core/model
rg -n '^import com\.emm\.mygame\.feature\.[\w.]+(ViewModel|UiState|Intent|Effect)$' apps/android/app/src/main
rg -l 'readAt - clock\.now\(\)|fun serverNow' apps/android -g '*.kt' -g '!**/src/test/**' | tail -n +2
fd -e kt -p '/src/main/' apps/android -x basename | sort | uniq -d
fd -e kt -p '/src/test/' apps/android -x basename | sort | uniq -d
fd -g '*Screen.kt' apps/android -E '**/src/test/**' -x sh -c 'rg -q "^(internal )?fun $(basename "$1" .kt)\(" "$1" || echo "$1"' sh {}
fd -e kt -p '/src/main/' apps/android -x wc -l | awk '$1 > 250'
fd -e kt -p '/src/test/' apps/android -x wc -l | awk '$1 > 600'
fd -e kt -p '/src/main/' apps/android -E build-logic -E '*Preview.kt' -x dirname | sort | uniq -c | awk '$1 > 30'
rg -c '^\s+private var ' apps/android -g '*.kt' -g '!**/src/test/**' | awk -F: '$2 > 5'
```

In order: the model knows no Android; `app` imports a feature's routes
and never its ViewModel or state; the projection's gap is written in
one file; no two production files and no two test files share a name;
a screen file declares its screen; the file, test and package limits;
the private state limit.

Run on trunk: the first has no target yet; the second lists 11 import
lines; the third 6 files beyond the first; the fourth `FramePieces.kt`
and `SeasonLabels.kt`; the fifth `NavRowMatcher.kt` and
`TextStyleLookup.kt`; the sixth `TownStatusScreen.kt`; then 19 files,
12 test files, 5 packages and 6 ViewModels.

Two checks have no one-line form and live in the task: a file is named
for a declaration inside it or carries a suffix of section 5 (67 files
declare nothing of their name today, and 15 of those are the
`*Mapping.kt` of `core:network`, which carry a suffix already), and
the map check below.

The module arrows of section 1 need no new check: they are the
`allowedCoreEdges` and `allowedFeatureEdges` tables of
`ModuleChecksConventionPlugin.kt`, edited.

### 8. The human map is `apps/android/ARCHITECTURE.md`

One file, at most 150 lines, linked in one line from the backend's
`ARCHITECTURE.md` at the repo root. It lands with the last step, Z,
written against the tree as it then is, not with this ADR. It holds
what the tree cannot say:

1. The modules and their arrows.
2. The feature table of section 3, one sentence each.
3. The package grammar and the file-name grammar.
4. One intent followed end to end with real paths: starting a lesson,
   from `SchoolScreen.kt` through `SchoolIntent`, `SchoolViewModel.kt`,
   the `TownRepository` port in `core:model`, `ApiTownRepository.kt`
   and the mappings its answer passes through in `core:network`, and
   back through `SchoolUiStateMapping.kt`.
5. The shell in ten lines: the frame, the dock, and the one channel a
   task screen fills the dock through.
6. "Where does a new thing go": the files a new screen adds, in order,
   and the files a new field of the api touches.
7. The checks and what each guards.

It holds no inventory of files. The map check fails the gate when the
table and the build part:

```
diff <(rg -o '^include\(":([\w:]+)"\)' -r '$1' apps/android/settings.gradle.kts | sort) <(rg -o '^\| `((app|core|feature)[\w:]*)` \|' -r '$1' apps/android/ARCHITECTURE.md | sort -u)
```

Each fact keeps one home. The map owns the layout.
`android-architecture.md` owns the laws and links to the map instead
of describing modules. `apps/android/CLAUDE.md` keeps commands and
traps. `CONTEXT.md` is the one glossary: the client's own words, which
today are defined only inside ADR 047 and ADR 051 (dock, frame,
street, place, ring, snapshot, held town, gap, fold), enter it under a
heading of their own, since a second glossary would drift. This ADR
adds the two that name a feature, **Shell** and **Theme**; the rest
wait for the owner's answer to question 6.

No per-module `README.md`, for the backend's reason (ADR 052, section
8).

### 9. The rule and doc edits

Named here, not applied, as ADR 055 names its own: the module table of
a rule describes trunk, and trunk's modules do not change with this
ADR. Each edit lands with the step its row names.

| File | Edit | Step |
|---|---|---|
| This ADR | `status: accepted` | 0 |
| `.claude/rules/android-architecture.md` | "`feature:<name>`: one game screen" becomes "one feature, its screens in packages"; the `app` row names the frame, the ring and the study reminder it holds until they move; "every navigation route" becomes "every destination" | 0 |
| `.claude/rules/kotlin-style.md` | Previews: a screen's previews live in `<Screen>ScreenPreview.kt`, not at the foot of the screen's file | 0 |
| `CLAUDE.md`, `apps/android/CLAUDE.md`, `.claude/rules/verification.md`, `.github/workflows/ci.yml` | The Android leg's command gains `checkStructure`, in the four files that write it | 0 |
| `.claude/rules/android-architecture.md` | The Modules table and its arrows gain or rename a row with the step that adds or renames the module, so that every row names a module of `apps/android/settings.gradle.kts` at every commit: `core:model` and the arrows of section 1 with Track M, a renamed feature with its step of Track N, `feature:shell` with Track X | M, N, X |
| `.claude/rules/android-architecture.md`, `ARCHITECTURE.md` | A link to `apps/android/ARCHITECTURE.md`, in place of the rule's description of modules and as one line of the root map | Z |

## The migration

Every step is one pull request. A move step moves files with `git mv`,
rewrites every importer in the same pull request and deletes the
directory it empties. No file exists in two places, no `typealias`
keeps an old name alive, no module re-exports another: nothing here is
a shim. A step that changes a path a doc names changes the doc.

Proofs at every step, reported as `verification.md` asks:

- The Android leg is green, run in `apps/android`: `taskpolicy -c
  utility ./gradlew detekt checkModuleBoundaries
  checkComposeFreeViewModels checkStructure testDebugUnitTest
  assembleDebug`.
- No assertion changes. For a move step this is empty:
  `git diff trunk... -- '*Test.kt' | rg '^[+-][^+-]' | rg -v
  '^[+-](package|import) '`. For a rename step the pull request gives
  the rename map, and the old test files passed through it equal the
  new ones.
- A move is a move: `git diff -M90% --name-status trunk...` shows `R`
  for every moved file, and the pull request lists the files that are
  not `R` and why (importers, build files).
- The copy does not change: `fd -g strings.xml apps/android -x rg -o
  'name="[^"]+">.*' | sort` gives the same lines before and after, and
  `pnpm --filter @mygame/catalog generate` writes nothing afterwards.
  A sub-package step touches no file under `packages/catalog` or
  `res/`.
- The system's names do not change: the manifest is untouched and
  `DestinationTest` is green with the literal names of step 0.
- No file outside `apps/android` and `packages/catalog` changes, so
  `apps/api/openapi.json` and the generated client are the same.

A move changes no screen, so it owes no emulator flow; the Robolectric
screen tests and `assembleDebug` are its evidence. The steps that
change how a screen is built say so below and owe the flow and its
screenshot.

Traps every move step meets, found by reading and not by running:

- A file in a sub-package that reads `R.` needs `import
  com.emm.mygame.feature.<module>.R`: 70 feature files read it today.
- A module's rename changes its namespace
  (`AndroidLibraryConventionPlugin.kt:15` derives it from the Gradle
  path), so its `R`, and changes the module segment of its catalog
  keys: `androidModules` in `packages/catalog/src/androidKeyOf.ts`,
  `packages/catalog/en.json`, `packages/catalog/es.json` and the 213
  Android keys of `packages/catalog/src/fixedCopyKeys.ts`.
- There is no wildcard import in the client, so every import rewrite
  is exact, one symbol to one new path, and can be generated.

### Phase 1, one peer at a time: the rails and the cuts every module feels

Each of these rewrites import lines across the client, so nothing else
is open while one is.

**Step 0, the rails.** Done when:

- this ADR is accepted;
- `checkStructure` exists with its baseline, joins the gate leg and
  CI, and the pull request shows it failing on a planted file of 251
  lines;
- `CognitiveComplexMethod` is on at 15, its findings fixed or, if more
  than five, listed for a step of their own;
- `DestinationTest` pins the serial name of each of the 16
  destinations as a literal, so a move that changes one fails;
- the edits section 9 gives to step 0 are applied.

**Step 1, the navigation.** `app`'s `navigation` package is born:
`AppNavigation` and `Navigator` move, and the entries leave
`AppNavigation.kt` for one `<Feature>Entries.kt` per feature module.
Done when `AppNavigation.kt` is off the baseline and each later track
edits only its own entries file in `app`. No screen changes.

**Track M, the model.** Five steps:

- M0. `ApiRepositories` replaces the seven factory functions; test
  set-up changes, assertions do not.
- M1. `core:model` exists with `account`, `reminder` and `theme`.
- M2. `learning`, `placement`, `holdout`, `report`.
- M3. `town` and its six sub-areas, with `nextStepCard` and
  `registeredBetween` in `town.guidance` and `town`.
- M4. `core:network` is cut into `platform` and its feature packages;
  the features, `core:ui` and `core:testing` drop their `core:network`
  dependency; the two edge tables take the arrows of section 1;
  `FakeTokenCipher` moves to `core:network`'s own tests, its only
  users.

Done when `rg -n 'core\.network\.' apps/android/feature
apps/android/core/ui` is empty (1,052 lines today, 466 of them
production) and `core:network` and `core:model` are off the baseline.

**Track N, the names.** One module rename each, serial because all
four edit the same catalog and build files:

- N1. `feature:signin` to `feature:account` (82 keys).
- N2. `feature:review` to `feature:learning` (45 keys; the stray
  `building_waiting`, read at `feature/review/ReviewDock.kt:74`,
  becomes a `review_` key).
- N3. `feature:map` to `feature:jobs` (70 keys).
- N4. `feature:holdout` out of `feature:placement` and
  `feature:school` (15 keys carry `holdout` in their name; the ticket
  counts the ones its files read).

### Phase 2, side by side: one track per module

After Phase 1 a track writes its own module and its own
`<Feature>Entries.kt`, and nothing else. Each track runs its steps in
order:

1. **Packages**: the `git mv` into the packages of section 3.
2. **Previews**: each screen's previews and fixtures to
   `<Screen>ScreenPreview.kt`. Four of the 19 files over 250 lines
   fall under it with this step alone: `TownScreen.kt`,
   `MapScreen.kt`, `ReviewScreen.kt` and `ReportScreen.kt`.
3. **Names**: the files that declare nothing of their name, renamed or
   split by section 5.
4. **Sizes**: what is still on the baseline for the module.

| Track | Module | Packages | Sizes after steps 1 to 3 |
|---|---|---|---|
| A | `feature:account` | `signin`, `signup`, `password`, `verification`, `settings` | none on the list |
| T | `feature:town` | `building`, `hiring`, `guidance`, `naming`, and `status` until Track X | `TownViewModel`; `TownUiState`, cut by sub-area; `PlaceStocks`, `PlaceBuildingWork` |
| S | `feature:school` | `words`, `text` | `SchoolScreen` (307 lines without its previews), `LessonWordsScreen` (283) |
| J | `feature:jobs` | flat | `MapViewModel`: 280 lines, 12 private `var`s |
| L | `feature:learning` | `reviews` | `ReviewViewModel`, `ReviewStepLine` |
| P | `feature:placement`, `feature:holdout` | flat | none on the list |
| R | `feature:report` | `news` | none on the list |

### Phase 3, one peer at a time: what crosses modules

- **U1. Shared drawing to `core:ui`**: `seasonIconOf`,
  `seasonSelectorOf`, `DurationMark`, `FramePieces`, two or three
  copies to one each.
- **U2. Shared test helpers**: `NavRowMatcher` and `TextStyleLookup`
  get one home, which needs a test-only module that may see Compose;
  its ticket names it.
- **U3. The projection's clock, once.** The gap and `serverNow()` are
  written in one file beside `HeldTown`, which already carries the
  gap, and the read loop of the ViewModels in one. Done when the third
  check of section 7 is empty and `failedReadRetry` is declared once.
  This step changes six ViewModels and no test assertion.
- **U4. Narrow ports.** A consumer takes the part of `TownRepository`
  it calls: `TownGuidance` takes `TownGuidanceRepository`, which
  exists; the ticket names the other cuts.
- **Track X, the shell.** `feature:shell` is born; `app` stops
  building `TownViewModel` and `SchoolViewModel`; the school reaches
  the dock through the same channel in `core:ui` every task screen
  uses, in place of the intent `app` sends for it
  (`app/AppNavigation.kt:272`). Done when the second check of section
  7 is empty and `rg -l -i dock apps/android/feature/town` lists only
  what the town itself draws. It changes how every signed-in screen is
  built, so it owes the emulator flow of each. It is a design ticket,
  not a move: it is grilled before it is cut into steps.
- **D. `core:designsystem` in packages** (`theme`, `text`, `control`,
  `street`, `dock`, `frame`, `art`), one pull request that rewrites
  594 production and 221 test import lines. The module's four files
  over 250 lines are cut here: `MyGamePill.kt`, `MyGameFrameText.kt`,
  `MyGameStreetStrip.kt` and `MyGameDock.kt`.
- **Z. The end.** `LongMethod` at 50 with the functions it names cut;
  the baseline empty and deleted; the map written against the tree as
  it then is.

### Peers at once

Phase 1 and Phase 3 are one peer. Phase 2 allows seven tracks; the
machine allows fewer, since each peer runs its own Gradle daemon. Two
at once is the proposal, each with the `taskpolicy` prefix
`apps/android/CLAUDE.md` asks for. The migration starts with no
Android pull request open: every step before Phase 2 conflicts with
any other Android change.

About 40 pull requests: 11 in Phase 1 (two rails, five for the model,
four renames), about 20 in Phase 2 (seven tracks of up to four steps,
not every track owing every step) and about 9 in Phase 3.

## Considered options

### A. Feature first, role second, with a model module (chosen)

Good: one word per feature from the domain to the screen; a screen
stops importing "the network"; shared drawing gets a legal home; the
existing module check carries the new arrows; every step but the
shell's is a move a diff can prove.

Bad: about 235 of the catalog's 522 Android keys change their module
segment (197 for the three renames, the holdout's 15 and the 23 the
status and dock files read); every import of `core.network` is
rewritten; `git blame` needs `--follow`.

### B. Layer first: `domain`, `data`, `presentation`

The common Clean Architecture cut on Android, as global modules or as
three packages per feature, and the nearest thing to the three folders
of ADR 054.

Refused. The client is a renderer (ADR 034): it holds no use case to
put in an application layer, so `domain` would be the model under
another name and `data` the network under another (section 2). As the
first cut it repeats the finding it is meant to fix: a reader looking
for the holdout check would open three places. As three modules for
each of the nine feature modules of section 3 it is 27 modules for one
developer.

### C. Keep the modules, add packages and fix the names

Everything in sections 4 to 8, without `core:model` and without the
renames.

Refused as the whole answer, kept as its first half. It leaves 69
files that draw importing `core.network`, leaves `core:ui` unable to
read the model, so the copies of the season's icon and the frame
pieces stay, and leaves `signin`, `review` and `map` as words the
backend does not use. It is the cheapest stopping point if the owner
wants one: step 0, step 1 and Phase 2 stand without Track M.

### D. One module per screen, as the rule's row says

Refused. The 21 MVI sets of the features would be 21 modules, each
with a build file, a namespace and a catalog module, and the
feature-to-feature ban would push every shared piece of a feature into
a core module. A package does the same job inside a feature at no
cost.

### The shell: a module or a package of `app`

A `shell` package in `app` needs no new catalog module. It is refused
because `app` would then hold three MVI sets and the dock's 833 lines,
and its row says it binds and navigates. `feature:shell` costs one
catalog module and the keys its files read.

### The checks: a Gradle task or the backend's script

The backend's checks are in `scripts/mygame-structure-check`, run by
`pnpm gate` (ADR 052, section 7). The client's two existing checks are
Gradle tasks with their tables as data, CI's `android` job already
runs them, and `pnpm gate` runs no Gradle. A third task beside them is
the smaller surprise; the `rg` lines of section 7 stay in the map for
a human.

## Consequences

- A reader finds a thing by its feature word, the same one in six
  places, and a file's role by its suffix.
- `core:network` shrinks from 158 files to about 38 and means what it
  says. The token store leaves every feature's classpath.
- `app` loses the frame and the ring, 10 of its 30 files, and holds
  the composition root, the navigation and the phone's adapters, in
  packages that say which.
- Adding a signed-in screen edits `Destination.kt`, one entries file
  and `Navigator.kt`. Today it edits `AppNavigation.kt` in three
  places of its 515 lines: the entry, the list at `:194`-`:203` and
  the `when` at `:497`.
- The four rows of the rule's module table that are false today
  (`app`, `feature:<name>`, `core:network`, `core:ui`) are rewritten
  once, and the map check then holds the table to the build.
- The three words of ADR 054 are not in the client's tree. A reader
  who comes from the backend finds the layers in the module names and
  in the table of section 2, which the map repeats.
- The cost is about 40 pull requests in which no feature ships from
  the modules being moved, and a catalog diff of about 235 keys whose
  values do not change.
- Whoever has a build on a phone loses nothing: no stored name
  changes, and step 0 pins the ones that could.

### Open for the owner

Each is open until the owner answers it; the text above is the
proposal, not the answer.

1. `feature:map` to `feature:jobs`: the backend's word, at 70 renamed
   keys, or keep `map`, the word on the screen.
2. The shell: `feature:shell`, or a package of `app` with no new
   catalog module.
3. `core:model` as the name, with the ports inside it, or `core:game`.
4. `core:designsystem`: cut into packages (step D, 815 import lines),
   or exempt from the package limit as a flat list of `MyGame*`
   components.
5. The map: `apps/android/ARCHITECTURE.md`, or a section of the root
   file with its limit raised.
6. The client's words: into `CONTEXT.md`, or into the map.
7. The private `var` limit, which the backend has no twin of.
8. The function limit at 50 for composables too, or 60 as today.
9. A move pull request owing no emulator flow: confirm the reading of
   `verification.md`.
10. Two Android peers at once in Phase 2, or one.
11. Stopping after option C's half if the model module is not wanted.

## References

- Issue #1744: the audit (first comment) and the draft of this ADR
  (second comment). Issue #1885.
- ADR 052 (the backend's twin: sections 2, 6, 7, 8 and 9), ADR 054
  (sections 1, 2 and 6), ADR 055 (sections 1 and 2).
- ADR 005 (lazy evaluation), ADR 034 (the native client), ADR 038 (the
  catalog), ADR 046 (the study reminder), ADR 047 and ADR 051 (the
  dock).
- `.claude/rules/android-architecture.md`, `.claude/rules/kotlin-style.md`,
  `.claude/rules/android-testing.md`, `.claude/rules/naming.md`,
  `.claude/rules/principles.md`, `.claude/rules/verification.md`;
  `apps/android/CLAUDE.md`; `CONTEXT.md`; `ARCHITECTURE.md`.
- `apps/android/settings.gradle.kts`: the 13 modules.
- `apps/android/build-logic/convention/src/main/kotlin/com/emm/mygame/buildlogic/ModuleChecksConventionPlugin.kt`:
  the edges and the two existing checks;
  `apps/android/build-logic/convention/src/main/kotlin/com/emm/mygame/buildlogic/AndroidLibraryConventionPlugin.kt`:
  the namespace.
- `packages/catalog/src/androidKeyOf.ts`,
  `packages/catalog/src/fixedCopyKeys.ts`: the module segment of a key.
