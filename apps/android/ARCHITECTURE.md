# Android architecture

The map of the Android client, `apps/android`. The decision and its reasons are ADR 056 (`docs/adr/056-the-android-client-reads-by-feature-then-by-role.md`), the shell's are ADR 057; the laws are `.claude/rules/android-architecture.md`, the commands and traps `apps/android/CLAUDE.md`. This file holds the layout only. The tree is the inventory.

## The modules

One row for each module of `apps/android/settings.gradle.kts`. A new module adds its row in the same commit: `checkStructure` fails when this table and the settings name different modules.

| Module | What it holds |
|---|---|
| `app` | The composition root: five files at the root (`MainActivity`, `MyGameApplication`, `StudyReminderReceiver`, `Destination`, `AppDependencies`), the entry points the system starts and `Destination`, which the back stack saves, and four packages: `navigation` (`AppNavigation`, `Navigator`, one `*Entries` file per feature module with destinations, and `TownFollowIntent` and `TownFollowViewModel`, which only `AppNavigation` drives), `account` (the player's language around every screen), `reminder` (the study reminder's alarm, store, sink and notifications) and `theme` (the picked theme and its store) |
| `core:model` | Pure Kotlin, JVM only: one package per feature, holding its types, the `*Result` and `*Refusal` an api answer is read into, and its ports (`TownRepository`, `ReportRepository`) |
| `core:network` | The client generated from `apps/api/openapi.json`, in its build directory; one package per feature, named as in `core:model`, holding the `Api*` adapters that implement its ports and their `*Mapping` files; and `platform`, what names no game word: the endpoint, the bearer, the token store and `ApiRepositories`, which builds every adapter |
| `core:projection` | Pure Kotlin, JVM only: the lazy projection and the values it reads |
| `core:designsystem` | The tokens and components of `.claude/rules/ui-components.md`, in `art`, `control`, `frame`, `navigation`, `text` and `theme` |
| `core:ui` | Composables shared by features that read the model, and the copy they draw (`android.ui.*`); its `testFixtures` hold the matchers task screens' tests share |
| `core:testing` | Pure Kotlin, JVM only: the `Fake*` of every port, the `*Fixtures` and the test clock |
| `core:uitesting` | Android, read only by a test configuration: the Compose test helpers features' tests share |
| `feature:account` | Sign in, sign up, the password reset, the verification and the settings, one package each, with `auth` and `scaffold` for what several draw |
| `feature:holdout` | The holdout check |
| `feature:jobs` | The jobs screen, flat, its screen's set still named `Map*`, after the old map screen |
| `feature:learning` | The due reviews, in `reviews` |
| `feature:placement` | The placement offer and its run |
| `feature:report` | Town News, in `news` |
| `feature:school` | The school at its root, the lesson's words in `words`, a text in `text` |
| `feature:shell` | What signed-in screens are drawn in: the frame at its root, the navigation bar in `bar`, the retained-words ring in `ring`; only `app` reads it |
| `feature:today` | The Today tab: the first card, Keep going and While you were away |
| `feature:town` | The town at its root, with `building` (and its `work`), `hiring`, `guidance` and `naming` |

The arrows, held by `checkModuleBoundaries` as `allowedCoreEdges` and `allowedFeatureEdges` in `apps/android/build-logic/convention/src/main/kotlin/com/emm/mygame/buildlogic/ModuleChecksConventionPlugin.kt`:

```
app               -> feature:*, core:*
feature:*         -> core:model, core:projection, core:ui, core:designsystem
core:ui           -> core:model, core:projection, core:designsystem
core:testing      -> core:model, core:projection
core:uitesting    -> core:designsystem
core:network      -> core:model
core:projection   -> core:model
core:model        -> nothing in the project
core:designsystem -> nothing in the project
```

## The features

A feature's word is its directory under `apps/api/src`, the same in every column (ADR 056, section 3).

| Feature | `core:model` and `core:network` | Drawn in |
|---|---|---|
| `account` | `account` | `feature:account`; the player's language in `app`'s `account` |
| `town` | `town`, and `town.building`, `town.guidance`, `town.hiring` | `feature:town` |
| `town/jobs` | `town.jobs` | `feature:jobs` |
| `town/school` | `town.school` | `feature:school` |
| `town/news` | `town.news` | `feature:report`, `news` |
| `learning` | `learning` | `feature:learning`; Keep going in `feature:today` |
| `placement` | `placement` | `feature:placement` |
| `holdout` | `holdout` | `feature:holdout` |
| `report` | `report` | `feature:report`; While you were away in `feature:today` |
| `platform` | `core:network` only | `app`: the composition root and `navigation` |
| `shell`, `today` | none: no api directory | `feature:shell`, `feature:today`, each composing the features above |
| `reminder`, `theme` | `reminder` in both, `theme` in `core:model` only | `app`'s `reminder` and `theme`; their rows in `feature:account`'s settings |

## The grammars

A feature module: the package names a screen or a sub-area, the file's suffix the role. The screen a module is named for sits at its root; another screen, or a sub-area drawn inside a screen, is a package. A piece two screens draw sits in a package named for what it draws, never in a third screen's.

```
feature/school/src/main/kotlin/com/emm/mygame/feature/school/
  SchoolRoute.kt  SchoolScreen.kt  SchoolViewModel.kt  SchoolUiState.kt   the root screen's set
  SchoolIntent.kt  SchoolEffect.kt  SchoolUiStateMapping.kt  SchoolScreenPreview.kt
  LessonRows.kt  ShownLesson.kt                                         a composable, named for it
  words/  text/                                                         another screen, its own set
```

`core:model` and `core:network` hold `<feature>/` and `<feature>/<sub-area>/`, a port beside what it reads; no `ports/`, `common` or `shared` package anywhere.

A file is named for the one declaration it holds, or carries a suffix (ADR 056, section 5):

| Suffix | Role |
|---|---|
| `Route`, `Screen`, `ViewModel`, `UiState`, `Intent`, `Effect` | the MVI set of `.claude/rules/android-architecture.md` |
| `ScreenPreview` | a screen's previews and the states they build by hand |
| `UiStateMapping` | pure functions from the model and the clock to a `UiState` |
| `Mapping`, in `core:network` | pure functions from a wire shape to the model |
| `Copy` | functions that choose a catalog string |
| `Requests` | what a ViewModel remembers of its requests in flight |
| `Entries`, in `app`'s `navigation` | one feature module's navigation entries |
| `Fixtures`, and the `Fake` prefix, in `core:testing` | test data and the fakes of ports |

## One intent, end to end

Starting a lesson:

1. `apps/android/feature/school/src/main/kotlin/com/emm/mygame/feature/school/SchoolScreen.kt` draws `LessonRows.kt`, whose Study button sends `SchoolIntent.StudyTapped` through the `onIntent` that `SchoolRoute.kt` hands it.
2. `apps/android/feature/school/src/main/kotlin/com/emm/mygame/feature/school/SchoolViewModel.kt` marks the start waiting and asks the port `startLesson` of `apps/android/core/model/src/main/kotlin/com/emm/mygame/core/model/town/TownRepository.kt`.
3. `apps/android/core/network/src/main/kotlin/com/emm/mygame/core/network/town/ApiTownRepository.kt`, built once by `ApiRepositories` from `MyGameApplication`, posts a `StartLessonRequest` through the generated client, off the main thread.
4. The `TownOverview` it answers passes `apps/android/core/network/src/main/kotlin/com/emm/mygame/core/network/town/TownMapping.kt` into a `TownSnapshot`, held as the `HeldTown` every screen that reads `towns.town` sees, and `apps/android/core/network/src/main/kotlin/com/emm/mygame/core/network/town/school/TownLessonMapping.kt` into a `TownLessonResult`: answered, refused or unreachable.
5. The ViewModel restarts the projection from the answered town and draws it through `apps/android/feature/school/src/main/kotlin/com/emm/mygame/feature/school/SchoolUiStateMapping.kt` into a `SchoolUiState`, then sends `SchoolEffect.LessonStarted`, which `SchoolRoute.kt` hands to `app` as `onLessonStart`.

## The shell

- `FramedScreen`, in `feature:shell`, draws every signed-in screen in a `FrameKind`: `Home`, a tab's root, with no header; `Place`, a header with the retained-words ring; `Door` and `Task`, the header alone.
- The header's back link returns to the root of the tab underneath (`ShellNavigation.tabUnder`), and is gone on a tab's root.
- `app`'s `apps/android/app/src/main/kotlin/com/emm/mygame/navigation/SignedInFrame.kt` wraps the frame in the player's language and builds its `ShellNavigation` from `Navigator`.
- `AppNavigationBar`, in `bar`, draws the four `Tab`s (Today, Town, Learn, Me) under the screens while a tab is open; `OpenTab.kt` names each tab's root destination.
- The ring and the bar read the held town, never a screen's state.
- The one channel from a task screen: its answer calls `onTaskAnswer` (a lesson started, a review answered, a placement or a holdout check ended), which `AppNavigation` sends to `TownFollowViewModel` as `TaskAnswered`.
- `TownFollowViewModel` reads the town anew, so the ring and the bar redraw; it also reads at a lesson's finish while the screen shown follows it.

## Where a new thing goes

A new thing goes in its feature's package of the module for its role. A new feature word is a new package in every module that holds the feature.

A new signed-in screen adds, in order:

1. Its `UiState`, `Intent`, `Effect`, `ViewModel` and their test, in its feature's package.
2. Its `UiStateMapping` beside them, when it maps the model.
3. Its `Screen`, `ScreenPreview` and `Route`, beside them.
4. Its strings under `android.<module>.*` in `packages/catalog/en.json` and `packages/catalog/es.json`, then `pnpm --filter @mygame/catalog generate`.
5. Its member of `apps/android/app/src/main/kotlin/com/emm/mygame/Destination.kt`, pinned in `apps/android/app/src/test/kotlin/com/emm/mygame/DestinationTest.kt`.
6. Its entry in its feature's `*Entries.kt`, in a `SignedInFrame` of its `FrameKind`.
7. The way to open it, in `apps/android/app/src/main/kotlin/com/emm/mygame/navigation/Navigator.kt`.

A new feature module also adds its `include` to `settings.gradle.kts`, its row above and its `robolectric.properties`.

A new field of the api touches, in order:

1. `apps/api/openapi.json`, written by `pnpm --filter @mygame/api openapi:write`; `core:network`'s `openApiGenerate` task regenerates the client from it on the next build.
2. The field's type, in its feature's package of `core:model`.
3. The `*Mapping.kt` of `core:network` that reads it.
4. The `*Fixtures.kt` of `core:testing` that build the type.
5. The `UiStateMapping`, `UiState` and screen that draw it.

## The checks

The Android leg of the gate runs them; its command is in `apps/android/CLAUDE.md`. None has a baseline: a finding is fixed by shape.

- `detekt`: formatting, the Compose rules and the complexity limits, its thresholds in `apps/android/config/detekt/detekt.yml`.
- `checkModuleBoundaries`: the arrows above; `core:testing`, `core:uitesting` and a `testFixtures` only through a test configuration; a JVM-only module applies no Android plugin.
- `checkComposeFreeViewModels`: no `*ViewModel.kt` or `*UiState.kt` names `androidx.compose`.
- `checkStructure`: the limits of `apps/android/build-logic/convention/src/main/kotlin/com/emm/mygame/buildlogic/StructureLimits.kt` on a file's lines, a test's lines, a package's files and a class's private `var`s; `app` imports no feature's ViewModel or state; the projection's gap is written in one file; no two production files, and no two test files, share a name; a `*Screen.kt` declares its screen; a file is named for a declaration or carries a suffix above; and the module table above names the modules of `settings.gradle.kts`.
- `testDebugUnitTest` and `assembleDebug`: every module's tests, and the app builds.
