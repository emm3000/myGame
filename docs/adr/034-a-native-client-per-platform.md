---
status: accepted, the token check shaped by ADR 043
date: 2026-11-02
---
# A native client per platform

## Context

ADR 032 admitted a Compose Multiplatform client and ADR 033 moved the
whole stack to Kotlin. Before any of it was built, the owner chose a
native client per platform instead: Jetpack Compose on Android, SwiftUI
on iOS and on macOS, and the web the game already has. The goals stay
the same: play on an Android phone, a portfolio and learning each
platform for real.

The game is server-authoritative (ADR 003): every rule runs in the api
and a client only draws what the api returns and asks for changes. So
Kotlin Multiplatform would share little across clients: the wire types,
an HTTP client and the lazy projection of resources (ADR 005). A
generated contract covers the first two; the projection is a few lines.

## Decision

- **One repo, one project per platform.** `apps/android` (Kotlin,
  Jetpack Compose, Android only), `apps/ios` (Swift, SwiftUI),
  `apps/desktop` (Swift, SwiftUI, macOS) and `apps/web` (TypeScript,
  the existing TanStack Start client). No Kotlin Multiplatform, no
  shared UI toolkit.
- **The server stays in TypeScript on Vercel.** `apps/api`,
  `packages/domain` and `packages/contracts` stay as ADR 031 runs them;
  ADR 033's Kotlin server is not built.
- **The contract is OpenAPI generated from zod.** The api's routes
  declare their zod schemas through `@hono/zod-openapi`; the spec it
  emits generates the Kotlin types of `apps/android` and the Swift types
  of the Apple clients. `apps/web` keeps importing
  `@mygame/contracts`. The gate fails when the spec or a client's
  generated code is stale.
- **Each client repeats the lazy projection, against one set of
  cases.** Between reads a client draws resource amounts from the
  `(amount, at, rate, capacity)` the api returned and its own clock. It
  never sends a derived amount. A fixture of projection cases, written
  once from the domain's own tests, is what every client's projection
  test reads, so four implementations cannot drift apart.
- **Native clients send the session token as a bearer.** The api reads
  `Authorization: Bearer <token>` when no session cookie is present;
  the token is the opaque one the cookie carries. A native client stores
  it in the platform's secure store: Keystore on Android, Keychain on
  Apple. The web keeps the cookie.
- **Android first.** `apps/android` reaches parity with the web before
  any Apple client starts; parity is the list of slices the web ships,
  not a feeling. The web stays the full game meanwhile. iOS follows,
  then macOS, sharing a Swift package for the network client.
- **One design system, implemented per platform.** The premium,
  minimal redesign is defined once as tokens (color, type, spacing,
  radius, motion) and each client implements them idiomatically; a
  check fails when a client's tokens drift from the source. (Amended by
  ADR 043: `tokens.ts` is the source, a generator writes the Android
  values and a test fails on a drift.)
- **The gate grows by platform.** `pnpm gate` keeps the TypeScript
  leg; the Android leg runs Gradle (detekt with the Compose rules, the
  unit tests, the build); the Apple legs join when their projects
  exist.
- **Out for now:** push notifications, offline play, Windows and Linux,
  and a store listing before parity.

ADR 032 and ADR 033 are superseded by this one; PRD row W6 points
here.

## Considered options

- **Compose Multiplatform for every client (ADR 032).** One UI for
  Android, desktop and web, but no SwiftUI and no idiomatic web, which
  is what the owner wants to show and learn. Rejected.
- **Kotlin Multiplatform for the logic, native UI on top.** What the
  owner's JustChill does. Here the logic lives on the server, so a
  shared module would hold little more than the wire types, and the web
  could not use it. Rejected.
- **A Kotlin server (ADR 033).** Its reason was a domain shared with
  Kotlin clients; with native clients and no shared module, it would be
  a rewrite of a working api for nothing. Rejected.
- **All four clients at once.** Every screen four times before any
  client is complete. Rejected for Android first.

## Consequences

- Every screen is built once per client; a new slice ships on the web
  and on Android, and on the Apple clients once they exist.
- Every route is touched once to declare its schemas for OpenAPI.
- The api grows a second auth path; a test proves both carriers on
  every authenticated route.
- CI needs a JDK job now and a macOS runner when the Apple clients
  arrive.
- `.claude/rules` grows Kotlin rules scoped to `apps/android`, and
  Swift rules for the Apple clients when they start.
