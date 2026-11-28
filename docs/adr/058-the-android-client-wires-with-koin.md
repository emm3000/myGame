---
status: accepted
date: 2026-11-27
---
# The Android client wires with Koin

## Context

ADR 032 chose Koin for a Compose Multiplatform client (line 49). ADR 034
superseded it with a native client per platform and names no way to wire
one. ADR 056 found the client with *no injection framework* and added
none (lines 85-86). So the choice is open. The owner wants Koin, and
#2198 records one reason beside that: Koin is multiplatform and Hilt is
not, while the multiplatform client stays parked (ADR 034).

No defect drives this. The compiler checks every line of the hand-built
root. What that root costs is threading: every port travels from the
application object through `app`'s navigation into a route's
parameters.

What trunk holds, checked at `9bb0969ae`:

- **One interface carries everything.** `AppDependencies` declares 15
  properties (`AppDependencies.kt`, 51 lines): the clock, `SessionEnds`,
  two `StateFlow`s of the player's language, eight repositories and
  three ports of the phone: the study reminder, its notifications and
  the theme.
- **It has three implementations.** `MyGameApplication` (137 lines)
  builds the real one, `dependenciesOf` (`AppDependenciesFixtures.kt`,
  65 lines) and `ReminderTapApplication` (64 lines) the two of the
  tests.
- **`app` reads it 51 times**, on 49 lines of 12 files: `MainActivity`,
  `AppNavigation`, `SignedInFrame` and the nine `*Entries.kt`, which
  hold 18 entries.
- **A route takes its ports as parameters.** 22 composables of the
  feature modules, the 20 `*Route.kt`, `FramedScreen` and
  `RetainedWordsRing`, declare 33 parameters that are a port, the clock
  or a bundle of ports (`SettingsSources`, six of them).
- **A ViewModel is built in a `viewModel { }` lambda.** 23 ViewModels,
  21 in the feature modules and 2 in `app`, at 24 call sites
  (`PlayerLanguageViewModel` at two: `AppNavigation.kt:50`,
  `SignedInFrame.kt:22`). No `ViewModelProvider.Factory` exists.
- **`app` may not name a feature's ViewModel.** `checkStructure` fails
  an `app` production file that imports one (`BoundaryChecks.kt:3-4`).
- **Eight ViewModels take a value no port holds:**

  | ViewModel | The value | Where it comes from |
  |---|---|---|
  | `SignInViewModel` | `isSessionEnded: Boolean` | the destination |
  | `SignUpViewModel` | `phoneScaffold: PlayerScaffold` | the phone's language (`SignUpRoute.kt:41`) |
  | `ResetPasswordViewModel` | `token: PasswordResetToken?` | the destination |
  | `VerifyEmailViewModel` | `token: EmailVerificationToken?` | the destination |
  | `HoldoutCheckViewModel` | `band: PlacementBand`, `week: HoldoutCheckWeek` | the destination |
  | `SchoolTextViewModel` | `text: TextId` | the destination |
  | `LessonWordsViewModel` | `walk: LessonWalk` | the destination |
  | `RetainedWordsViewModel` | `doesScreenReadTown: Boolean` | the entry that draws the ring |

  `SignUpViewModel` and `VerifyEmailViewModel` also take a
  `SavedStateHandle`.
- **Two ViewModels take a generic type:** `PlayerLanguageViewModel`
  reads a `StateFlow<PlayerLanguage?>` (`PlayerLanguageViewModel.kt:12`)
  and `SettingsViewModel` a `StateFlow<PlayerScaffold?>`
  (`SettingsViewModel.kt:25`).
- **Four ViewModels ask for a narrower port than the one built.**
  `ReviewViewModel`, `LessonWordsViewModel` and `RetainedWordsViewModel`
  take a `TownReader`, `MapViewModel` a `TownRegionRepository`. One
  `ApiTownRepository` answers all of them, because `TownRepository`
  extends both, `TownReader` through `TownRegionRepository`
  (`TownRepository.kt:10-15`, `TownRegionRepository.kt:5-7`).
- **The root breaks its own cycles by hand.** The study answers need the
  reminder's sink, the sink needs the town, the town's repository needs
  the study answers. `MyGameApplication` cuts the loop with a lambda and
  a `Lazy` (`MyGameApplication.kt:51`, `:60`, `:81`).
- **`core:network` exports one constructor.** Every `Api*` adapter is
  `internal`; `ApiRepositories` builds the eight repositories from four
  differently configured clients of one generated type, `DefaultApi`
  (`ApiRepositories.kt:68-167`).
- **Robolectric builds the application again for every test.** 45 test
  files of `app` run under Robolectric: 6 name `ReminderTapApplication`,
  the other 39 start `MyGameApplication`. `MyGameApplicationTest` builds
  a second `MyGameApplication` in the same JVM and calls its `onCreate`
  (`MyGameApplicationTest.kt:53`, `:74-83`).
- **Tests pass fakes by hand.** 13 files of `app`'s tests call
  `dependenciesOf`; 7 route tests of the feature modules pass a fake as
  a route's parameter; the 53 `*ViewModelTest.kt` files open no
  composition and build a ViewModel by hand.
- **A new port costs seven wiring files.** `40a3d38ba` added
  `KeepGoingRepository`: beside the port, its adapter and its fake, it
  edited `AppDependencies.kt`, `MyGameApplication.kt`,
  `ApiRepositories.kt`, `TodayEntries.kt`, `TodayRoute.kt`,
  `AppDependenciesFixtures.kt` and `ReminderTapApplication.kt`.
- **`checkModuleBoundaries` reads project edges only**
  (`ModuleChecksConventionPlugin.kt:80`). A library a module depends on
  is held by no check today.
- **The stack:** Kotlin 2.4.21, AGP 9.5.1 with its built-in Kotlin, the
  configuration cache on, lifecycle 2.11.0, Navigation 3 1.2.0,
  Robolectric 4.17, R8 off.

What a spike measured on that trunk with Koin 4.2.2, in a JVM test of
`core:projection` and a Robolectric test of `app`, both deleted after:

1. **`verify()` names a missing binding.** On a root that `includes`
   other modules it throws `MissingKoinDefinitionException: Missing
   definition for '[field:'clock' ...]'`. Run on a feature's module
   alone it fails on every port, so only the root can be verified.
2. **A supertype is not found unless it is bound.** A class asking for a
   `TownReader`-like interface, with only its subtype bound, fails
   `verify()`, and at run time throws `InstanceCreationException`.
   `binds arrayOf(...)` on the definition satisfies both.
3. **Type arguments are not part of a key.** Two `single`s of
   `StateFlow` with different arguments are one binding. In one module
   the last wins without a word, a class asking for the first is handed
   the second, and `verify()` passes. Across two modules
   `allowOverride(false)` throws `DefinitionOverrideException` when the
   graph starts. Inside one module it does not, and the same class bound
   twice in one module starts too.
4. **`verify()` reads the bound class's constructor, not the lambda.** A
   value given at the call must be declared, `injections =
   injectedParameters(definition<T>(X::class))`. A `SavedStateHandle`, a
   function type and a `CoroutineScope` must be listed as `extraTypes`.
   A `Lazy<T>` is unwrapped to `T`. `String` passes undeclared;
   `Boolean` does not.
5. **A value given at the call is matched when the instance is asked
   for.** `parametersOf(null)` reaches a nullable parameter a lambda
   definition destructures, and throws `InstanceCreationException`
   against the constructor form, `viewModelOf`. A value of the wrong
   type, or none, throws the same.
6. **A second `startKoin` in one JVM throws**
   `KoinApplicationAlreadyStartedException`. Two `koinApplication { }`
   hold separate instances.
7. **A graph the application object holds works with Navigation 3.**
   Inside `KoinIsolatedContext`, `koinViewModel()` in an entry decorated
   by `rememberViewModelStoreNavEntryDecorator()` gives one instance per
   entry and the same one on a second call, a `SavedStateHandle` with no
   declaration, and the graph's one repository. With no context it
   throws `IllegalStateException: KoinApplication has not been started`.

What the libraries' own sources say, read on 2026-11-27:

- Koin 4.2.2 (2026-06-15) is the latest stable; 4.3.0 is in beta. It is
  built with Kotlin 2.3.20 against lifecycle 2.10.0 and Navigation 3
  1.0.1. No first-party statement covers trunk's versions; the spike is
  the evidence that they work together.
- `checkModules()` is deprecated for `verify()`, which lives in
  `koin-test` and brings `kotlin-reflect`.
- Koin's Navigation 3 artifact, `koin-compose-navigation3`, marks every
  public API `@KoinExperimentalAPI`.
- `koin-android` exposes `appcompat` and `fragment` to its consumers.
- Koin calls no reflection on a constructor at run time (`singleOf` is
  an inline call of the constructor) and needs no R8 keep rule.
- The Koin Compiler Plugin 1.2.3 validates a graph at compile time. Its
  verified Kotlin versions stop at 2.4.20, and its README does not
  assume another patch compatible.
- Dagger and Hilt 2.60.1 support AGP 9 and its built-in Kotlin through
  KSP. A Hilt test must run on `HiltTestApplication`, and since 2.58 an
  `@AndroidEntryPoint` activity fails at run time on any other
  application.

## Decision

**The Android client wires its dependencies with Koin: a graph the
application object holds, bindings declared by the module that owns
what they build, and a test that verifies the root.**

### The words

*Module* keeps meaning a Gradle module, as in `ARCHITECTURE.md`. Koin's
own `Module` gets another word, so no sentence about the client means
two things by one.

- **Bindings**: one Koin `Module`, a `val` named `<name>Bindings` in a
  file `<Name>Bindings.kt`. `Bindings` joins the map's suffixes. The
  name check needs no edit: it already accepts a file that declares its
  own name with a lower-case first letter (`NameChecks.kt:66-72`).
- **The graph**: the `KoinApplication` an application object builds
  from bindings.
- **Call value**: a value a ViewModel takes that no binding holds, the
  eight rows of the table above.

No `CONTEXT.md` term enters: these name the client's code, not what it
draws.

### 1. The application object holds the graph

**`MyGameApplication` builds one graph with `koinApplication { }` and
holds it. Nothing calls `startKoin`, and no global Koin exists.**

- `AppGraph` replaces `AppDependencies`: an interface with one member,
  the graph. `MyGameApplication` and the tests' application implement
  it.
- `MainActivity` draws `AppNavigation` inside `KoinIsolatedContext`,
  given the graph of its application.
- The graph is built with `allowOverride(false)`, so two bindings of one
  type in two files stop the application at its start (spike 3), which
  `MyGameApplicationTest` already exercises.
- Each application object has its own graph, as each has its own lazy
  values today. A second `MyGameApplication` in one JVM, which
  Robolectric builds for every test, is then no special case (spike 6).

### 2. Where the bindings live

**A binding is declared in the module that owns the class it builds.**
`app` may not name a feature's ViewModel, so a feature declares its own;
`core:network` keeps its adapters `internal`, so `app` binds what
`ApiRepositories` exposes.

| Module | File | What it binds |
|---|---|---|
| `app` | `AppBindings.kt` | the root: it includes the three below and binds the clock, the session's token store, `SessionEnds`, the player's languages, `ApiRepositories` and the eight repositories it builds |
| `app` | `navigation/ScreenBindings.kt` | every ViewModel: it includes the ten features' bindings and binds `TownFollowViewModel` and `PlayerLanguageViewModel` |
| `app` | `reminder/ReminderBindings.kt` | the alarm, the store, the sink, the study answers and the notifications |
| `app` | `theme/ThemeBindings.kt` | the theme store |
| each of the ten `feature:*` modules | `<Feature>Bindings.kt`, at the module's root package | its ViewModels |
| `core:*` | none | nothing: no `core` module depends on Koin |

- The ten are `AccountBindings`, `HoldoutBindings`, `JobsBindings`,
  `LearningBindings`, `PlacementBindings`, `ReportBindings`,
  `SchoolBindings`, `ShellBindings`, `TodayBindings` and `TownBindings`.
  No two production files share a name, which `checkStructure` holds.
- `ApiRepositories` stays as it is. Its four clients are one type, which
  Koin could tell apart only by string qualifiers; a plain constructor
  call tells them apart by name and the compiler checks it.
- The module arrows of `ARCHITECTURE.md` do not move. Koin is a library,
  and `checkModuleBoundaries` reads project edges.
- Two artifacts are declared. `koin-compose-viewmodel`, in a feature
  and in `app`, brings `koin-compose`, `koin-android`, `koin-core` and
  the bindings DSL of `koin-core-viewmodel` (its POM at 4.2.2).
  `koin-test`, in `app`'s tests, brings `verify()`. Not
  `koin-compose-navigation3`. Each version is exact in
  `libs.versions.toml`.

### 3. A route opens its ViewModel from the graph

**A route's `viewModel` parameter defaults to `koinViewModel()`, and the
route takes no port.** The 33 port parameters go, and `SettingsSources`
with them. An entry passes a route what only navigation knows: its
callbacks and its call values.

A ViewModel stays what it is: a class whose constructor says what it
needs. It imports nothing of Koin, so `checkComposeFreeViewModels` is
untouched and a ViewModel test still builds it by hand.

**A constructor parameter of a ViewModel is a port, the clock, a
`SavedStateHandle` or a call value. It is never a generic type.**

A ViewModel with no call value is bound by its constructor. One with a
call value is bound by a lambda that names each, so the bindings file
shows which values the caller gives, and a nullable one arrives (spike
5):

```kotlin
val schoolBindings: Module = module {
    viewModelOf(::SchoolViewModel)
    viewModel { (text: TextId) -> SchoolTextViewModel(text = text, texts = get()) }
    viewModel { (walk: LessonWalk) ->
        LessonWordsViewModel(walk = walk, towns = get(), learning = get(), clock = get())
    }
}
```

```kotlin
@Composable
fun SchoolTextRoute(
    text: TextId,
    onNoTown: () -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SchoolTextViewModel = koinViewModel { parametersOf(text) },
)
```

The route loses one parameter, `texts: TownTextRepository`
(`SchoolTextRoute.kt:18`), and its entry stops passing it
(`SchoolEntries.kt:82`).

`koinViewModel()` reads the `ViewModelStoreOwner` of the entry, which
`rememberViewModelStoreNavEntryDecorator()` already provides
(`AppNavigation.kt:130`), so a ViewModel lives as long as its entry, as
today (spike 7). The entries stay in `app`'s `*Entries.kt`.

### 4. What a binding may be

- **No binding has a type argument.** Koin keeps none (spike 3). The two
  `StateFlow`s of the player's language become one port in
  `core:model`'s `account`, `PlayerLanguageReader`, named as
  `TownReader` and `RegionReader` are. `PlayerLanguages` implements it,
  and `PlayerLanguageViewModel` and `SettingsViewModel` take it.
- **A port asked for through a supertype is bound to it by name.** The
  town's repository is bound as `TownRepository` and, with `binds`, as
  `TownReader` and `TownRegionRepository`. Kotlin's subtyping gave this
  for nothing; Koin does not (spike 2).
- **One type is bound once in the client.** Two files are caught at the
  start by `allowOverride(false)`. Two lines of one file are not (spike
  3): a bindings file is short enough to read, and the review reads it.
- **An adapter is bound by a lambda with named arguments.** The compiler
  then still checks each constructor call. A value no other binding
  needs is written inline: the dispatcher, the application's scope, a
  file, a preferences file, a callback.
- **A cycle is cut where it is cut today**, by a lambda or a `Lazy` in
  the adapter's constructor, filled with `{ get() }` or `inject()`.

### 5. Where Koin may be named

| Where | What it may call |
|---|---|
| a `*Bindings.kt` | the module DSL |
| a composable that opens a ViewModel: a `*Route.kt`, `RetainedWordsRing`, `AppNavigation`, `SignedInFrame` | `koinViewModel` |
| `app`'s `navigation` composables | `koinInject`, for what they draw with no ViewModel: the session's ends and the held town |
| `MyGameApplication`, `MainActivity`, `StudyReminderReceiver` | the graph itself: the manifest starts them, so nothing can hand them a parameter |
| everything else | nothing |

`checkStructure` holds it. Each line is expected empty, and is empty on
trunk today:

```
rg -l 'org\.koin' apps/android/core -g '*.kt'
rg -l 'org\.koin' apps/android -g '*ViewModel.kt' -g '*UiState.kt' -g '*Screen.kt' -g '*UiStateMapping.kt' -g '!**/src/test/**'
rg -n 'koinInject|getKoin' apps/android/feature -g '*.kt' -g '!**/src/test/**'
rg -n 'KoinComponent|GlobalContext|startKoin' apps/android -g '*.kt' -g '!**/build-logic/**'
rg -n '(single|factory|viewModel)<[^>(]*<' apps/android -g '*Bindings.kt'
```

In order: the cores hold no Koin; a ViewModel, a state, a screen and a
mapping hold none; a feature never pulls from the graph by hand; no
global Koin and no class that locates its own dependencies; no binding
with a type argument.

### 6. Tests

**A test replaces a port by binding its fake, never by overriding a
binding and never with a mock.**

- **`ScreenBindings` holds no port.** The production graph is
  `appBindings`, which includes it. A test's graph is `screenBindings`
  and one `single` per fake. Nothing is overridden, so
  `allowOverride(false)` holds in tests too, and every screen a test
  opens is built by the binding that ships.
- **`fakePortBindings`** in `app`'s tests takes the fakes of
  `core:testing` as named arguments with defaults, as `dependenciesOf`
  does, and replaces it. The tests' application holds such a graph.
- **A route test of a feature** draws its route inside
  `KoinIsolatedContext`, over that feature's bindings and its fakes. A
  route drawn with no graph fails at once (spike 7).
- **A ViewModel test uses no Koin.** It calls the constructor.
- **A ViewModel with a call value has a test that opens its screen
  through its bindings**, since nothing else matches the values given to
  the ones the binding names (spike 5). The slice that moves it names
  that test in its pull request.

**`AppBindingsTest` verifies the root.** One test in
`app/src/test/kotlin/com/emm/mygame/`:

```kotlin
@Test
fun `every constructor parameter of a binding is bound or declared`() {
    appBindings.verify(
        extraTypes = unboundTypes,
        injections = injectedParameters(
            definition<ResetPasswordViewModel>(PasswordResetToken::class),
        ),
    )
}
```

- `injections` declares every call value of the table above, one
  `definition` per ViewModel.
- `unboundTypes` is one list in that file: `SavedStateHandle` and the
  types section 4 writes inline. Each entry is a type `verify()` no
  longer checks anywhere, so the list only grows with a reason in the
  pull request.
- `:app:testDebugUnitTest` runs it. The Android leg of the gate and
  CI's `android` job already run `testDebugUnitTest`, so no command
  changes.
- It is `verify()`, not the deprecated `checkModules()`.

### What this ADR amends

| Where | It says | It becomes |
|---|---|---|
| ADR 056, Context | the client has no injection framework | it wires with Koin |
| ADR 056, section 4 | `AppDependencies.kt` at `app`'s root | `AppGraph.kt` and `AppBindings.kt` |
| ADR 056, section 5 | the suffixes a file may carry | `Bindings` joins them |
| `ARCHITECTURE.md` | five files at `app`'s root; `ApiRepositories` built by `MyGameApplication`; seven steps for a new screen | six files; built by `AppBindings`; a step for the ViewModel's line in its feature's bindings |
| `android-architecture.md`, MVI | a route obtains the ViewModel | it obtains it with `koinViewModel()` and takes no port |
| `android-testing.md` | collaborators are the fakes of `core:testing` | the same, bound in a test's graph when a route is drawn |

ADR 056's order, by feature and then by role, its arrows and its limits
stand. Only `app` binds `Clock.System`, as before. The slice that makes
each row true edits it, and the last slice amends ADR 056's status line.

## The migration

One pull request per slice, in this order. K3 to K11 need only K2 and
may run side by side, except that K11 needs K10's port; each adds one
line to `ScreenBindings.kt` and its call values to `AppBindingsTest`.

From K2 to K12, `AppDependencies` stays for the entries not yet moved,
read from the graph, and takes no new member. It is the migration's only
bridge, and K12 deletes it.

Every slice owes the Android leg green and, since a wiring mistake now
shows when a screen opens, its screens opened on an emulator against the
real api.

- **K1. The graph binds the phone.** Koin enters `libs.versions.toml`.
  `AppGraph`, `AppBindings`, `ReminderBindings` and `ThemeBindings` hold
  what `MyGameApplication` builds; the application builds the graph and
  keeps its two start-up calls; `StudyReminderReceiver` reads the graph.
  `AppBindingsTest` verifies the root. No route changes. Owed: the
  release APK's size before and after.
- **K2. Town News opens from the graph.** The first screen end to end:
  `ScreenBindings`, `ReportBindings`, `NewsRoute` on `koinViewModel()`,
  `MainActivity` inside `KoinIsolatedContext`, `fakePortBindings` in
  place of `dependenciesOf`, the tests' application on a graph, the five
  lines of section 5 in `checkStructure`, and the rows of the amendment
  table that are now true.
- **K3. `feature:placement`**: two ViewModels, no call value.
- **K4. `feature:jobs`**: the first narrower port,
  `TownRegionRepository`.
- **K5. `feature:town`.**
- **K6. `feature:today`.**
- **K7. `feature:learning`.**
- **K8. `feature:school`**: the first call values, `TextId` and
  `LessonWalk`.
- **K9. `feature:holdout`**: the first binding with two call values.
  The spike measured one; this slice's screen test is the proof for two.
- **K10. `feature:shell` and `app`'s two ViewModels**:
  `PlayerLanguageReader`, the `Boolean` call value, `FramedScreen` and
  `SignedInFrame` without a port.
- **K11. `feature:account`**: eight ViewModels, the two nullable tokens,
  the two `SavedStateHandle`s; `SettingsSources` is deleted.
- **K12. `AppDependencies` is deleted.** No entry takes `dependencies`;
  `ARCHITECTURE.md` and ADR 056's status line say what is true.

## Considered options

| | Who finds a missing binding | Build cost | Beyond Android | A fake in a test |
|---|---|---|---|---|
| The hand-built root | the compiler | none | yes, it is plain Kotlin | a constructor argument |
| **Koin (chosen)** | a test, `verify()` | two artifacts and what they bring, no code generation | yes | a binding in the test's graph |
| Hilt | the compiler | the plugin and KSP in the eleven modules that declare a ViewModel or an entry point | no | `@TestInstallIn` or `@BindValue`, on `HiltTestApplication` |

- **Keep the hand-built root.** The honest alternative: it is the only
  one with no library, and the compiler proves it whole. It loses on
  what it threads, 51 reads, 33 route parameters and three
  implementations of one interface, and on what the owner asked for.
  Had the owner not wanted Koin, the threading alone would not have
  justified a move.
- **Hilt.** It gives back the compile-time proof Koin gives up. It
  costs an annotation processor in eleven modules of a build that has
  none, and it is Android only, the one reason #2198 records against
  it. Its tests must
  run on `HiltTestApplication`, where six of `app`'s test files run on
  an application of their own today.
- **Koin started globally, with `startKoin`.** A second start in one
  JVM throws (spike 6), and Robolectric
  starts `MyGameApplication` again for each of 39 test files. Robolectric
  does call `Application.onTerminate()`, so a `stopKoin()` there would
  pass the tests, but no device ever calls it: production code written
  for the tests. One global graph is also the shared mutable fixture
  `android-testing.md` rejects.
- **Koin for the ports only.** A route keeps its `viewModel { }` lambda
  and reads each port with `koinInject()`. Every call value stays
  checked by the compiler, and no feature needs bindings. But `verify()`
  then sees no ViewModel, a route still lists every port, and a missing
  binding shows only when its screen opens.
- **Bind every adapter of `core:network` in Koin.** It would end
  `ApiRepositories` and need four string qualifiers for one type, and a
  Koin dependency in a `core` module.
- **Koin's Navigation 3 entries.** Every API of that artifact is
  experimental in 4.2.2, and it would move the 18 entries out of `app`'s
  `*Entries.kt`, where ADR 056 put them.
- **The Koin Compiler Plugin.** It would turn `verify()` into a compile
  error. Its verified Kotlin versions stop one patch short of trunk's,
  and it ties every Kotlin upgrade to its release. It is the natural
  next step once it verifies the Kotlin the client runs, and it would
  not change where a binding lives.
- **Metro.** Compile-time and multiplatform, stable since April 2026.
  It is a compiler plugin with the same coupling, and it is not what the
  owner asked for.

## Consequences

- **A wiring mistake is found later than today.** The compiler found all
  of them. Now `AppBindingsTest` finds a ViewModel or an adapter whose
  constructor asks for something unbound, and the start of the
  application finds one type bound in two files. Four mistakes are found
  only by a test that opens the screen:
  - a ViewModel with no line in its bindings, or bindings not included;
  - call values that do not match the binding, in number, order or type;
  - a `koinInject` in `app` for a type nothing binds;
  - one type bound twice in one file.
- **`verify()` has blind spots.** It reads constructors, so every type
  in `unboundTypes` is trusted everywhere and a declared call value is
  trusted to be given. A binding declared as an interface has no
  constructor to read: that one is read in Koin's source at 4.2.2, not
  measured.
- **Adding a port touches three wiring files, not seven**:
  `ApiRepositories.kt`, `AppBindings.kt` and `fakePortBindings`. A port
  that already exists reaches one more ViewModel by its constructor
  alone.
- **The tests move with the wiring.** The 13 files that call
  `dependenciesOf`, the 6 on `ReminderTapApplication` and the 7 route
  tests draw inside a graph. The 53 ViewModel test files do not change,
  but for those of the two ViewModels that take `PlayerLanguageReader`.
- **The APK grows by Koin and by what `koin-android` brings**, `appcompat`
  and `fragment`, which R8 does not strip because it is off. K1 measures
  it.
- **The client runs Koin on versions Koin was not built against.** The
  spike compiled and ran on trunk's Kotlin, lifecycle and Navigation 3;
  a Koin upgrade is read against them again.
- **`verify()`'s two helpers are experimental.** `injectedParameters`
  and `definition` are `@KoinExperimentalAPI`. They are called from one
  test.
- **Leaving Koin stays cheap.** No `core` module, ViewModel, state or
  screen names it. A later move to another injector rewrites the 14
  bindings files, the 24 calls that open a ViewModel and `AppGraph`.
- **Compose Multiplatform stays parked.** This ADR does not reopen
  ADR 034; it only stops the wiring from being a reason against it.

## References

- ADR 032, the Compose Multiplatform client that chose Koin; ADR 034, a
  native client per platform; ADR 056, the Android client reads by
  feature, then by role; ADR 057, the shell.
- #2198, this decision.
- `apps/android/ARCHITECTURE.md`, the modules and their arrows;
  `.claude/rules/android-architecture.md`, MVI and the Compose-free
  ViewModel; `.claude/rules/android-testing.md`, fakes over mocks.
- `40a3d38ba`, the commit that added `KeepGoingRepository`.
- Koin 4.2.2: https://insert-koin.io/docs/reference/koin-test/verify,
  https://insert-koin.io/docs/reference/koin-compose/isolated-context,
  https://insert-koin.io/docs/reference/koin-compose/navigation3,
  https://github.com/InsertKoinIO/koin/releases/tag/4.2.2.
- The Koin Compiler Plugin's verified Kotlin versions:
  https://github.com/InsertKoinIO/koin-compiler-plugin/blob/1.2.3/supported-kotlin-versions.txt.
- Hilt: https://dagger.dev/hilt/gradle-setup,
  https://dagger.dev/hilt/robolectric-testing,
  https://github.com/google/dagger/releases.
- Metro: https://github.com/ZacSweers/metro/releases.
- Navigation 3's recipes, with a Hilt and a Koin sample of a ViewModel
  that takes its key: https://github.com/android/nav3-recipes.
