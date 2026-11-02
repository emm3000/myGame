---
status: accepted
date: 2026-11-02
---
# A native Compose Multiplatform client

## Context

The owner plays the game on a phone and wants the project to show
native client work in a portfolio; the responsive web adds neither.
The owner also wants to learn Compose Multiplatform, and owns only
Android devices today. The game is server-authoritative (ADR 003): the
web imports `@mygame/contracts` and never `packages/domain`, so the
client is a renderer and replacing it leaves the api, the domain, Neon
and Vercel (ADR 031) as they are. PRD row W6 ruled native clients out
as "a separate product"; this ADR amends it.

## Decision

- **W6 is admitted.** A native client in Kotlin with Compose
  Multiplatform becomes the primary client.
- **Targets: Android and Desktop (JVM) now, iOS later.** Every screen
  lives in `commonMain`. Desktop runs the app and its UI tests without
  an emulator and keeps the code honestly multiplatform; iOS joins as
  one more target, without a rewrite.
- **Same repo, `apps/mobile`.** One Gradle build beside the pnpm
  workspace, so an api change and its client change land in one pull
  request and share the tickets, the ADRs and the gate.
- **The web freezes, then shrinks.** It stays playable until the
  native client reaches parity, then keeps only what the mail links
  open: sign-up, email verification and password reset. No App Links.
- **Auth sends the same session token as a bearer.** The api reads
  `Authorization: Bearer <token>` when no session cookie is present;
  the token is the opaque one the cookie carries today. The client
  stores it encrypted on the device. No JWT, no refresh token: the
  session already expires on the server.
- **The contract is OpenAPI generated from zod.** The api's routes
  declare their zod schemas through `@hono/zod-openapi`; the spec it
  emits generates the client's `@Serializable` types, and the gate
  fails when the generated code is stale. zod stays the single source
  of the wire vocabulary.
- **The client projects, never decides.** Between reads the client
  draws resource amounts from the `(amount, at, rate, capacity)` the
  api returned and its own clock (ADR 005). It never sends a derived
  amount; every decision is still the server's.
- **Client shape.** `:composeApp` is the entry point for each target;
  `:core:*` holds the generated contract, the network client, the
  design system and the shared UI; one `:feature:*` module per screen.
  MVI per screen, Koin for dependency injection, Ktor for HTTP,
  Navigation with `@Serializable` routes, Spanish copy addressed as tú
  in Compose resources. Versions are exact in `libs.versions.toml`.
- **One gate, two legs.** `pnpm gate` also runs the Gradle quality
  gate: detekt with the Compose rules, the unit tests, and Roborazzi
  screenshot tests on Desktop.
- **Out for now:** push notifications, offline play, iOS builds and a
  store listing before parity.

## Considered options

- **A separate repository for the client.** A cleaner Kotlin-only
  portfolio piece, but the contract would drift across repos and a
  wire change would need two pull requests. Rejected.
- **Delete the web and open the mail links through Android App
  Links.** Fully native, but iOS would need Universal Links later and
  the game would be unplayable until parity. Rejected.
- **Hand-written Kotlin types with contract tests.** Faster to start,
  but with forty-six schema files the drift is a matter of time.
  Rejected.
- **A cookie jar in the Ktor client.** No server change, but the
  cookie's `SameSite` and `Secure` attributes and the rewrite through
  the web's domain are browser concerns a native client should not
  emulate. Rejected.
- **Android-only Compose.** What the owner's other apps use, and
  JustChill rejected Compose Multiplatform for one maintainer. Here the
  native client replaces the web instead of sitting beside it, so a
  multiplatform UI is still one UI; and learning it is a goal.
  Rejected.

## Consequences

- The api grows a second auth path; every authenticated route must
  accept either carrier and a test proves both.
- Every route is touched once to declare its schemas for OpenAPI.
- CI needs a JDK job beside the Node one.
- Google's screenshot plugin does not support multiplatform modules,
  hence Roborazzi; detekt over multiplatform source sets is a known
  risk to settle in the first slice.
- `.claude/rules` grows Kotlin rules scoped to `apps/mobile`, and the
  TypeScript rules are scoped to the TypeScript packages.
