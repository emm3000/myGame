# apps/android

The native Android client (ADR 034): Kotlin and Jetpack Compose, a renderer of what the api returns. A Gradle project of its own, outside the pnpm workspace. The rules: `.claude/rules/android-architecture.md`, `kotlin-style.md`, `android-testing.md`, `ui-components.md`.

## Commands

Run from `apps/android`.

- `./gradlew detekt checkModuleBoundaries checkComposeFreeViewModels testDebugUnitTest assembleDebug` — the Android leg of the gate, exactly what CI's `android` job runs. Green before every commit that touches `apps/android`, on top of `pnpm gate`.
- `./gradlew detekt` — detekt with the formatting (ktlint) and Compose rule sets, over every module and over `build-logic/convention/src/main/kotlin` (the root project's detekt source), never over `build/`, where the generated client lives. Thresholds live only in `config/detekt/detekt.yml`.
- `./gradlew checkModuleBoundaries` — fails on any project edge the Modules table of `android-architecture.md` does not allow, on `:core:testing` reached through a configuration whose name does not start with `test` or `androidTest`, on a module missing from the table, and on `:core:projection` applying an Android plugin. The table is `allowedCoreEdges` and `allowedFeatureEdges` in `build-logic/convention/.../ModuleChecksConventionPlugin.kt`; a new module is a new entry there and in the rule.
- `./gradlew checkComposeFreeViewModels` — fails on any line of a `*ViewModel.kt` or `*UiState.kt` under any module's `src/` that names `androidx.compose`.
- `./gradlew testDebugUnitTest` — the unit tests of every module. `:core:projection` is a JVM module, so its `testDebugUnitTest` is an alias of `test` that the `mygame.jvm.library` convention registers.
- `./gradlew assembleDebug`, then `adb install -r app/build/outputs/apk/debug/app-debug.apk` and `adb shell am start -n com.emm.mygame/.MainActivity` — the app on a running emulator.

## Layout

- `app` — `MainActivity`, and `MyGameApplication` as the composition root (base URL, Keystore cipher, token file, `Dispatchers.IO`); namespace and `applicationId` `com.emm.mygame`. `BuildConfig.API_BASE_URL`: debug `http://10.0.2.2:3141/` (the host's api from the emulator; cleartext allowed for that host only, by `src/debug`'s network security config), release `https://mygame.emm3000.com/api/` (the web's `/api` rewrite, ADR 031).
- `feature:signin` — sign-in and the signed-in placeholder (MVI). A new `feature:<name>` needs only `settings.gradle.kts`: `checkModuleBoundaries` admits every `:feature:` module with the feature edges.
- `core:network`, `core:testing` — Android libraries; `core:designsystem`, `core:ui` — Android libraries with Compose; `core:projection` — Kotlin JVM. Library namespaces are `com.emm.mygame` plus the module path (`com.emm.mygame.core.designsystem`).
- `build-logic/convention` — the convention plugins every module applies: `mygame.android.application`, `mygame.android.library`, `mygame.android.compose`, `mygame.jvm.library`, and `mygame.module.checks` on the root project. SDK levels (compile and target 37, min 26) and the JVM target (17) live in `ProjectDefaults.kt`.
- `gradle/libs.versions.toml` — every version, exact. `build-logic` reads the same catalog.
- `core:network` — `openApiGenerate` (openapi-generator Gradle plugin, `kotlin` generator, `jvm-retrofit2` with `kotlinx_serialization` and coroutines) generates the whole `../api/openapi.json` into `build/generate-resources/main`, wired into compilation by `addGeneratedSourceDirectory`; `openapi-generator-ignore` drops the generated `ApiClient`, auth and Gradle files, since `SessionRepository(...)` builds Retrofit itself. `number` maps to `kotlin.Double` and `enumUnknownDefaultCase` is on: the generator writes a single-value numeric enum (`z.literal(0)`) as a `BigDecimal` it cannot compile, and the unknown-case serializer is what decodes those enums by value. No generated type crosses the module's public API (the repository over them is `internal`); callers see `SessionRepository`, `SignInResult`, `RestoreResult`, `RefusalKind`, `SignedInPlayer`. `BearerInterceptor` is the one place the bearer is added. `TokenStore` keeps the token as AES/GCM ciphertext under the Keystore key of `KeystoreTokenCipher` in a file in `noBackupFilesDir`; its read and write are `internal`, and its `TokenCipher` is the seam a JVM test fakes.
- Tests: JUnit 4, Turbine, `kotlinx-coroutines-test` on every module's `testImplementation` (`UnitTests.kt` in the conventions); `core:network` tests the repository against OkHttp's `mockwebserver3`. `core:testing` holds `FakeSessionRepository` (answers queued per call), `FakeTokenCipher` and `MainDispatcherRule`.
- `core:designsystem` — the tokens, from the web's `apps/web/src/design/tokens.ts` until #572's token source replaces them, except the colors sign-in draws (`surface`, `surfaceRaised`, `surfaceSunken`, `line`, `lineStrong`, `ink`, `inkMuted`, `umber`, `onUmber`, `rust`, `rustSoft`), which carry #572's v29 values: `MyGameColors` (one field per `palette` token, kebab-case to camelCase, `lightColors` and `darkColors` with the same hex), `MyGameTypeFamilies`, `MyGameSpacing` (`step<n>` for `spacing[n]`), `MyGameRadii`, `MyGameTransitions`, `MyGameTypography`, `MyGameSizes`, `MyGameStrokeWidths`, `MyGameIcons`. Components: `MyGameText`, `MyGameButton` (busy state), `MyGameTextField`, `MyGameTextLink`, `MyGameInlineAlert`, `MyGameErrorBanner`, built on foundation, never Material3. `MyGameTheme { }` provides the colors for the system theme; `MyGameTheme.colors` reads them.

## Gotchas

- Never add a `package.json` here: pnpm takes every directory with one under `apps/*` as a workspace package.
- `local.properties` (`sdk.dir=...`) is gitignored and per machine; CI reads `ANDROID_HOME` from the runner instead.
- AGP 9 compiles Kotlin itself: no `org.jetbrains.kotlin.android` plugin. The Kotlin version comes from `kotlin-gradle-plugin` on `build-logic`'s classpath.
- detekt is 1.23.8 (stable, built against Kotlin 2.0) and runs beside Kotlin 2.4.21 because the `detekt` task parses sources without type resolution. Rules that need type resolution (`UnsafeCallOnNullableType`, for one) report nothing under `detekt`; review still catches `!!`.
- The Compose rules are `io.nlopez.compose.rules:detekt` 0.4.28, the last line built for detekt 1.23. From 0.5 on they target detekt 2.0 and load under 1.23 without error and without running a single rule; probe a new version with a public `@Composable` that emits a `Box` and has no `modifier` before trusting it.
- detekt 1.23.8 uses Gradle APIs deprecated for Gradle 10 (`ReportingExtension.file`, `Configuration.setVisible`); the build warns, nothing fails.
- The configuration cache is on (`gradle.properties`). A custom task reads only its declared inputs; both check tasks live in `build-logic/convention` (where detekt lints them; it never reads `.kts`), registered on the root project by `mygame.module.checks`, and gather their inputs in `gradle.projectsEvaluated`.
- `core:network`'s tests depend on `core:testing`, which depends on `core:network`; Gradle resolves it because only the test configuration closes the loop.
