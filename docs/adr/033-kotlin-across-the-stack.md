---
status: superseded by ADR 034
date: 2026-11-02
---
# Kotlin across the stack

## Context

ADR 032 admitted a native Compose Multiplatform client and kept the
api, the domain and the contracts in TypeScript. The owner then chose
to move the whole stack to Kotlin, as a way to learn Kotlin
Multiplatform end to end. Vercel, where the api runs (ADR 031), runs
OCI container images as functions through its Container Runtime, in
beta on every plan, so a JVM server does not force a change of host.

## Decision

- **One Gradle build at the repo root**, with the structure the
  Kotlin Multiplatform wizard generates for a client and a server:
  `core` (a multiplatform library: the domain and the wire types),
  `server` (Ktor on the JVM) and `app/shared`, `app/androidApp`,
  `app/desktopApp`, `app/webApp` (the Compose Multiplatform client).
  This replaces ADR 032's `apps/mobile` and `:composeApp`.
- **Web joins the targets, on Kotlin/Wasm.** Android, Desktop and web
  now, iOS later; this amends ADR 032's targets. Compose Multiplatform
  for web is in Beta, so Android sets parity: a slice is done when it
  works on Android, while Desktop and web must build in the gate and
  their visual defects do not block a slice. Every library the client
  takes must support `wasmJs`. If the Beta breaks the game, the web
  target is dropped and the other two are untouched.
- **The domain moves to `core`, unchanged in its rules.** It stays
  pure: no I/O, time through a `Clock` port, failures as a sealed type,
  never a thrown exception. The server decides with it and the client
  draws the lazy projection with the same code (ADR 005), so the two
  can never disagree on an amount.
- **The wire types are `@Serializable` classes in `core`**, shared by
  the server and the client. This replaces ADR 032's OpenAPI
  generation and its drift check.
- **The TypeScript tests are the specification.** Each slice is ported
  test-first: its Vitest cases become `kotlin.test` cases with the same
  sentences, then the code follows.
- **Persistence keeps the schema.** The server talks to the same Neon
  database with Exposed; Flyway takes over the migrations, with the
  existing schema as its baseline, so no data moves.
- **The server is a container on Vercel.** One project builds the
  server's image from a Dockerfile and serves the game's domain. The
  JVM's cold start is measured in the first slice; a GraalVM native
  image is the answer only if the measurement asks for it.
- **The mail links open the web client.** Email verification and
  password reset are screens of the client, served by its web target
  as static files on Vercel; the server renders no HTML.
- **Cutover, then removal.** The TypeScript api and web stay in
  production until the Kotlin stack reaches parity; the domain then
  points at the Kotlin server, and `apps/`, `packages/` and the pnpm
  workspace are deleted in one change. ADR 031's two Node projects end
  there.
- **One gate.** Until the cutover `pnpm gate` and the Gradle quality
  gate both run; after it, Gradle alone: detekt with the Compose rules,
  the unit tests, the server's tests against a Postgres container, and
  Roborazzi screenshot tests on Desktop.

ADR 032 still holds for the bearer session token, the client's MVI shape, the design
system and what stays out.

## Considered options

- **Keep the TypeScript backend (ADR 032 as written).** Less to
  rewrite, but two languages, a generated contract between them and a
  domain the client cannot reuse. Rejected for the learning goal and
  for one domain on both sides.
- **Leave Vercel for a JVM host (Cloud Run, Fly.io).** Mature
  container hosting, but a second provider for one owner. Rejected
  while Vercel's Container Runtime serves; it is the fallback if the
  beta fails the game.
- **Plain HTML from the server for the mail links.** A light page,
  but a second UI to keep, and no web client to practise Kotlin/Wasm
  on. Rejected.
- **No web target until it is stable.** No Beta risk, but every
  library picked meanwhile might lock web out later. Rejected.

## Consequences

- Every domain rule is rewritten; a slice is done only when its ported
  tests pass, and parity is the whole list of slices, not a feeling.
- The Container Runtime is beta: its limits and prices may change.
- `.claude/rules`, the agents and the commands move from TypeScript to
  Kotlin; until the cutover both sets apply, each scoped by path.
