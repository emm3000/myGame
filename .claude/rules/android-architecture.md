---
paths:
  - "apps/android/**"
---
# Android architecture

`apps/android` is a renderer (ADR 003, ADR 034). The api decides every game rule; the client draws what the api returned and asks for changes.

## The client never decides

- A request names what the player wants (`enqueue sawmill`), never an amount, a finish time or a verdict the client derived. The api's response is the new state.
- The client never withholds a request on its own arithmetic. A projected amount may color a cost; the api's answer is the only verdict.
- A refusal arrives as the error `kind` the contract declares and reaches the screen as that typed value.

## Modules

| Module | Holds |
|---|---|
| `app` | `MainActivity`, navigation, the one place that binds implementations to interfaces |
| `feature:<name>` | One game screen: its ViewModel, `UiState`, `Intent`, `Effect`, route and screen |
| `core:network` | The generated OpenAPI client, one interface per api resource (`FiefRepository`) implemented over it, the bearer, the token store |
| `core:projection` | Pure Kotlin, JVM only: the lazy projection and the value types it reads |
| `core:designsystem` | The design-system tokens and components (`ui-components.md`) |
| `core:ui` | Composables shared by features that read the game's models (a resource row, a countdown) |
| `core:testing` | Fakes of the `core:network` interfaces, the test clock |

```
app               -> feature:*, core:*
feature:*         -> core:network, core:projection, core:ui, core:designsystem
core:ui           -> core:projection, core:designsystem
core:testing      -> core:network, core:projection
core:network      -> nothing in the project
core:projection   -> nothing in the project
core:designsystem -> nothing in the project
```

`./gradlew checkModuleBoundaries` fails on any other edge, a feature-to-feature edge included, and `core:testing` on any configuration but a test one. Before adding an edge, check the table; if a `core` module needs to reach outward, invert it with an interface in that module.

## The contract

- The api's OpenAPI spec generates the Kotlin types and client into `core:network`'s build directory. They are the only wire shapes: no hand-written DTO, no edit to a generated file, no raw HTTP call beside the client.
- A generated type stops at `core:network`'s interfaces or the ViewModel's mapper; it never reaches a `UiState`, and a `UiState` never reaches the wire.
- A use case exists only where there is client-side logic, which here means the projection. A read goes from the ViewModel to the `core:network` interface.

## Session

The api's opaque session token travels as `Authorization: Bearer <token>`, added in one place in `core:network`. It is stored encrypted under an Android Keystore key, read only by `core:network`, and never logged, never in a `UiState`, never in plain `SharedPreferences`.

## Time and the lazy projection

- Only `app` binds `kotlin.time.Clock.System`. A ViewModel and the projection read `clock.now()`, never `System.currentTimeMillis()`.
- Between reads, `core:projection` derives the amount drawn from the state the api returned (each resource's `amount`, `ratePerHour` and `capacity`, and the overview's `readAt`) and `clock.now()`, by ADR 005 and its amendments. `fullAt` is not read: the server derives it from the same inputs, and the client computes the cap itself. The device clock is never compared with the server's raw: when an answer arrives the ViewModel stores the gap `readAt - clock.now()` and projects at `clock.now() + gap`, so a skewed device neither overdraws nor re-reads in a loop. The derived amount is for drawing only: it is never sent and never stored as truth.
- A mutation re-reads the api's answer; the projection restarts from it.

## MVI

- `<Feature>UiState`: a `data class` (or a `sealed interface` of data classes), every field `val`, immutable collections. The only screen state.
- `<Feature>Intent`: a `sealed interface` of what the player did (`BuildTapped`, `QueueCancelled`), never what the ViewModel should do.
- `<Feature>Effect`: a `sealed interface` of one-shot outcomes (`NavigateToFief`, `ShowRefusal`), sent through a buffered `Channel` exposed as `Flow`, never a `SharedFlow`, never stored in state. A replay-0 `SharedFlow` drops an effect no collector is there to take.
- The ViewModel exposes `state: StateFlow<<Feature>UiState>`, `effects: Flow<<Feature>Effect>` and `onIntent(intent: <Feature>Intent)`, nothing else.
- State stores what the player chose (a building id), never the resolved object; the resolved object is a getter over the catalog the same state holds.
- A visibility flag (a sheet, a dialog, a confirmation) lives in `UiState`. So does a refusal that stays beside the card that asked for it until the next read: it is state, not an `Effect`. `remember` holds only pure UI mechanics: scroll, focus, animation.
- A ViewModel never switches dispatcher: no `withContext`, no `Dispatchers.`; `core:network` owns its threading.
- A ViewModel never holds user-facing copy; it emits a typed value the screen resolves with `stringResource`.
- A ViewModel is Compose-free. `./gradlew checkComposeFreeViewModels` fails any `*ViewModel.kt` or `*UiState.kt` importing `androidx.compose`; review also runs, expecting nothing:

```
rg -e 'stringResource|painterResource' -e '\bR\.' -e 'BuildConfig' -e '@Preview' -g '*ViewModel.kt' -g '*UiState.kt' apps/android
```

- `<Feature>Route` obtains the ViewModel, collects state and effects, and hands `onIntent` to `<Feature>Screen`, which is stateless and never touches a repository.
- Every navigation route is `@Serializable`, fields included: the back stack restores routes by serializer after process death, and an unserializable one crashes only there.

## Copy

UI copy lives in `res/values/strings.xml`, never as a literal in Kotlin.
