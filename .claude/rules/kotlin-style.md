---
paths:
  - "apps/android/**/*.kt"
  - "apps/android/**/*.kts"
---
# Kotlin style

## Comments

None. No KDoc, no `//`, no `/* */`, no commented-out code, no `// region` banners. A name carries the meaning or the code is restructured until it does. Three exceptions, each one line, each stating a constraint the reader cannot derive from the code:

1. A link to the external spec or issue a workaround exists for.
2. A `@Suppress("<detekt rule>")` with its reason on the line above.
3. A `TODO(#issue)` that names an open GitHub issue.

## Types

- Return type on every function, single-expression ones included: `fun capacityOf(level: Int): Int = ...`.
- Type on every property and every local `val` / `var`: `val remaining: Int = queue.slotsLeft()`.
- Declare the supertype the caller should depend on: `val state: StateFlow<TownUiState>`, never the `MutableStateFlow` behind it; `List` over `MutableList`.
- Omit the type only where it is noise: a constructor call that already names it (`val request = EnqueueBuildingRequest(...)`), a delegated property (`by viewModels()`, `by remember`), a lambda parameter fixed by its receiver.

## Idioms

- `val` everywhere; `var` only when reassignment is the point.
- A closed set of states or errors is a `sealed interface`; `when` over it is exhaustive with no `else`.
- Identifiers and constrained values are value classes (`TownId`), validated in `init` with `require`.
- Dependencies are constructor parameters with no default value. A default lets a forgotten argument compile silently against the real dependency.
- Extension functions over `object` holders and utility classes.
- One public top-level type per `.kt` file, named after the file. Private helpers used only by that type may share it.
- Every catch-all owes a `CancellationException` arm first: rethrow it, then catch `Exception`. `runCatching` and a bare `catch (e: Exception)` swallow cancellation, and a cancelled load overwrites the winner; a `Flow.catch` owes the arm too.
- A function reference where it fits, `map(::toRow)` over `map { toRow(it) }`: a style preference, since no detekt rule checks it.
- `return if (...) a else b` is the idiomatic two-way choice; Flat control flow in `principles.md` targets a statement `else` after a branch that already returned.
- A composable tree too deep to read is flattened by extracting a named composable; composable nesting has no limit to satisfy.
- Forbidden in production code: `!!`, `lateinit var`, `GlobalScope`, `runBlocking`, a dependency instantiated inside the class that uses it.

## Names

- `PascalCase` types, `camelCase` functions and properties, `SCREAMING_SNAKE_CASE` constants, lowercase packages.
- A backing property is `_state` behind `state`. An exposed flow carries no `Flow` suffix. A `suspend fun` is named as if it were synchronous.
- Composable callbacks start with `on`: `onIntent`, `onDismiss`.
- The MVI type names live in `android-architecture.md`.

## Previews

- Every public `core:designsystem` component and every stateless `<Feature>Screen` carries a `private` preview in its own file, named `<Composable>Preview` (or `<Composable><Variant>Preview` for a second one, `MyGameOutlinedButtonBadgePreview`), annotated `@PreviewMyGame` and wrapped in `MyGamePreviewSurface`. `@PreviewMyGame` is the one multipreview, in `core:designsystem`: Day and Night at phone width, and Day at the large (1.5) and the largest (2.0) font scales. `MyGamePreviewSurface` applies `MyGameTheme` on the `surface` ground.
- A preview is fed by fixed values: a literal component state, a `UiState` built by hand, a fixed `Instant`, `onIntent = {}`. A component with a list of states takes them through `@PreviewParameter` over a `private` `PreviewParameterProvider`, or an `internal` one beside the shared composable when previews of several components in one module read the same states (`MyGamePillStates` in `MyGamePill.kt`). A preview builds without a ViewModel, a repository, a `Context` lookup or `Clock.System`, so Studio renders it.
- A preview's sample text is a fixture, not UI copy: it stays in the preview, outside `packages/catalog`.
- The names are what detekt reads: the Compose rules want a multipreview named with the `Preview` prefix, and `UnusedPrivateMember` spares a preview by its `Preview` suffix, since its `ignoreAnnotated` matches `@Preview` and not `@PreviewMyGame`.

## detekt

detekt with the Compose rules is the Android leg's linter. Its thresholds live only in `apps/android/config/detekt/detekt.yml`; this file never copies a number. Guard clauses are the default shape of every function (Flat control flow in `principles.md`), and `ReturnCount` does not count them. When a function trips a complexity rule, the fix is shape, never a suppression: a guard clause instead of a nested `if`, a `when` instead of an `else if` chain, a named step instead of nested `let` / `also` / `apply` / `run`.
