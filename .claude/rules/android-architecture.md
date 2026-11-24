---
paths:
  - "apps/android/**"
---
# Android architecture

`apps/android` is a renderer (ADR 003, ADR 034). The api decides every game rule; the client draws what the api returned and asks for changes.

## The client never decides

- A request names what the player wants (`start building work on the farm`), never an amount, a finish time or a verdict the client derived. The api's response is the new state.
- The client never withholds a request on its own arithmetic. A projected amount may color a cost; the api's answer is the only verdict. One exception, as on the web: a recall card with an empty field sends nothing, since an empty answer is no attempt (#732).
- A refusal arrives as the error `kind` the contract declares and reaches the screen as that typed value.

## Modules

| Module | Holds |
|---|---|
| `app` | `MainActivity`, navigation, the one place that binds implementations to interfaces, and, until they move (ADR 056), the signed-in frame (`FramedScreen`), the retained-words ring (`RetainedWords*`) and the study reminder (`StudyReminderAlarm`, `StudyReminderStore`, `StudyReminderSink`, `StudyReminderReceiver`) |
| `feature:<name>` | One module, one feature, its screens in packages: each screen's ViewModel, `UiState`, `Intent`, `Effect`, route and screen |
| `core:model` | Pure Kotlin, JVM only, one package per feature (`account`, `holdout`, `learning`, `placement`, `reminder`, `report`, `theme`, `town` with `town.building`, `town.guidance`, `town.hiring`, `town.jobs`, `town.news` and `town.school`): the feature's types, the `*Result` and `*Refusal` an api answer is read into, and its ports (`SessionRepository`, `HoldoutCheckRepository`, `LearningRepository`, `PlacementRepository`, `ReminderNotifications`, `StudyAnswerSink`, `StudyReminderSettings`, `ReportRepository`, `ThemeSettings`, `TownRepository`, `TownTextRepository`, `TownGuidanceRepository`, `RegionReader`, `RegionRepository`) |
| `core:network` | The generated OpenAPI client, in its build directory; one package per feature, named as `core:model`'s (`account`, `town.jobs`), holding the `Api*` adapters that implement that feature's ports and their `*Mapping` files; and `platform`, holding what names no game word: the endpoint and the HTTP client builder it carries, the bearer, the token store, and `ApiRepositories`, which builds every `Api*` adapter |
| `core:projection` | Pure Kotlin, JVM only: the lazy projection and the value types it reads |
| `core:designsystem` | The design-system tokens and components (`ui-components.md`) |
| `core:ui` | Composables shared by features that read the game's models (a resource row, a countdown); its `testFixtures` hold the Compose test helpers the features' tests share (`navRowOf`, `TaskFrameStandIn`) |
| `core:testing` | Pure Kotlin, JVM only: fakes of the `core:model` interfaces, the test clock |

```
app               -> feature:*, core:*
feature:*         -> core:model, core:projection, core:ui, core:designsystem
core:ui           -> core:model, core:projection, core:designsystem
core:testing      -> core:model, core:projection
core:network      -> core:model
core:model        -> nothing in the project
core:projection   -> nothing in the project
core:designsystem -> nothing in the project
```

`./gradlew checkModuleBoundaries` fails on any other edge, a feature-to-feature edge included, and `core:testing` on any configuration but a test one. Before adding an edge, check the table; if a `core` module needs to reach outward, invert it with an interface in that module.

## The contract

- The api's OpenAPI spec generates the Kotlin types and client into `core:network`'s build directory. They are the only wire shapes: no hand-written DTO, no edit to a generated file, no raw HTTP call beside the client.
- A generated type stops at the `core:network` adapter that implements a port, or at the ViewModel's mapper; it never reaches a `UiState`, and a `UiState` never reaches the wire.
- A use case exists only where there is client-side logic, which here means the projection and, beside it, the study reminder's rule (ADR 046). A read goes from the ViewModel to the port.

## Session

The api's opaque session token travels as `Authorization: Bearer <token>`, added in one place in `core:network`. It is stored encrypted under an Android Keystore key, read only by `core:network`, and never logged, never in a `UiState`, never in plain `SharedPreferences`.

## Time and the lazy projection

- Only `app` binds `kotlin.time.Clock.System`. A ViewModel and the projection read `clock.now()`, never `System.currentTimeMillis()`.
- Between reads, `core:projection` derives the amount drawn from the state the api returned (each resource's `amount`, `ratePerHour` and `capacity`, and the overview's `readAt`) and `clock.now()`, by ADR 005 and its amendments. `fullAt` is read only for a store's fill hour within 8 h of `readAt` (`feature:town`'s `fillHourWindow`); the drawn amount and the cap are still projected, never taken from `fullAt`. The device clock is never compared with the server's raw: when a read arrives the ViewModel stores the gap `readAt - clock.now()` and projects at `clock.now() + gap`, so a skewed device neither overdraws nor re-reads in a loop. A mutation's answer keeps the gap of the last read: its `readAt` is the town's stored instant, which every mutation settles at the server's instant of the mutation. The derived amount is for drawing only: it is never sent and never stored as truth.
- A mutation re-reads the api's answer; the projection restarts from it.

## MVI

- `<Feature>UiState`: a `data class` (or a `sealed interface` of data classes), every field `val`, immutable collections. The only screen state.
- `<Feature>Intent`: a `sealed interface` of what the player did (`BuildTapped`, `QueueCancelled`), never what the ViewModel should do.
- `<Feature>Effect`: a `sealed interface` of one-shot outcomes (`NavigateToSchool`, `ShowRefusal`), sent through a buffered `Channel` exposed as `Flow`, never a `SharedFlow`, never stored in state. A replay-0 `SharedFlow` drops an effect no collector is there to take.
- The ViewModel exposes `state: StateFlow<<Feature>UiState>`, `effects: Flow<<Feature>Effect>` and `onIntent(intent: <Feature>Intent)`, nothing else.
- State stores what the player chose (a building id), never the resolved object; the resolved object is a getter over the catalog the same state holds.
- A visibility flag (a sheet, a dialog, a confirmation) lives in `UiState`. So does a refusal that stays beside the card that asked for it until the next read: it is state, not an `Effect`. `remember` holds only pure UI mechanics: scroll, focus, animation.
- A ViewModel never switches dispatcher: no `withContext`, no `Dispatchers.`; `core:network` owns its threading.
- A ViewModel never holds user-facing copy; it emits a typed value the screen resolves with `stringResource`. A refusal with fields reaches `UiState` as a typed value carrying the api's `params` (a `TownWorkRefusal` member with its fields), and the screen renders its line from `strings.xml` (ADR 038).
- A ViewModel is Compose-free. `./gradlew checkComposeFreeViewModels` fails any `*ViewModel.kt` or `*UiState.kt` importing `androidx.compose`; review also runs, expecting nothing:

```
rg -e 'stringResource|painterResource' -e '\bR\.' -e 'BuildConfig' -e '@Preview' -g '*ViewModel.kt' -g '*UiState.kt' apps/android
```

- `<Feature>Route` obtains the ViewModel, collects state and effects, and hands `onIntent` to `<Feature>Screen`, which is stateless and never touches a repository.
- Every destination is `@Serializable`, fields included. The back stack (`rememberNavBackStack`, whose `NavKeySerializer` writes `value::class.java.name`) saves each destination's JVM class name, `com.emm.mygame.Destination$Map`, and after process death restores it by `Class.forName` and that class's serializer, so an unserializable destination, or a class moved or renamed since the save, crashes only there; an `@SerialName` does not keep it. `DestinationTest` pins each destination's class name and serial name as literals, so a move or a rename that changes either fails.

## Copy

UI copy lives in `res/values/strings.xml`, never as a literal in Kotlin. Every `strings.xml` is generated from `packages/catalog`, `values/` from `en.json` and `values-es/` from `es.json`, and never edited by hand; its strings are ICU MessageFormat with named arguments (`apps/android/CLAUDE.md`, Gotchas).

- Every screen outside `feature:account` reads every string through `core:ui`'s `PlayerCopy` (`rememberPlayerCopy()`), which holds a `CopyReader` in American English and one in the scaffold language, the phone's language until the api names the player's. `CopyReader` is the one formatter: `text` formats a string's MessageFormat in the reader's own locale, as its days, times and lists are.
- A key `packages/catalog/src/fixedCopyKeys.ts` lists is fixed copy: `fixedCopy` or `fixedCopyResource` reads it in the scaffold language as a `String`.
- Every other key is chrome: `chrome` or `chromeResource` reads it by the `ChromePhase` as a `MyGameLabel`, the scaffold line alone, then English over the scaffold line in the both phase, then English alone. A component draws a chrome line through its `MyGameLabel` overload, which styles the scaffold line as the translation; a `String` slot, an accessible name or a busy description, takes the label's `spoken`.
- `feature:account` reads `stringResource` in the context `app` wraps around it: the phone's language before sign-in, the scaffold language in the settings. Its `VerificationBannerScreen`, drawn under every signed-in screen, reads `fixedCopyResource`.

A preview's sample text is a fixture, not UI copy, and stays in the preview (`kotlin-style.md`, Previews).
