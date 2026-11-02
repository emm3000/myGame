---
paths:
  - "apps/android/**/*Test.kt"
---
# Android testing

The Android leg of the gate runs the unit tests (`verification.md`); a test the gate does not run proves nothing.

## What a test is

- A test names a rule in a sentence: ``fun `caps the drawn wood at the warehouse capacity`()``. The suite reads as the spec of the module.
- Behavior over structure: assert what the caller observes (the emitted `UiState`, the `Effect`, the request the fake received), never a private call sequence.
- One rule per test. A name that needs "and" is two tests.
- Fixture locals are named by role (`fullWarehouse`, `busyQueue`, `frozenClock`), built by small factory functions beside the test or in `core:testing`, never a shared mutable fixture.

## ViewModel tests

- Drive `onIntent`, then assert `state` and `effects` with Turbine: `awaitItem()` for each expected emission, `expectNoEvents()` where nothing may follow.
- `runTest` with the fixed clock from `core:testing`, advanced by the test. Never `Thread.sleep`, never real time.
- A flow that loops on the clock exits when the clock did not advance; under a fixed clock a `while (true) { delay(...) }` hangs the test.
- Collaborators are the fakes in `core:testing`; no mocking library until a ticket proves the need. A fake that needs a stub per test is a sign the interface is too wide.

## Projection tests

`core:projection`'s test reads every case of the shared projection fixture (ADR 034), written once from `packages/domain`'s tests. A case it cannot read fails the test. A new projection rule is a new case in that fixture first, never a case only Android has.

## UI tests

- Query by what the player perceives: text, content description, role. A `testTag` only where no semantic handle exists.
- Screenshot tests exist only if the gate runs them. Otherwise visual verification is a screenshot in the PR.

## Rejected

- A mock of an interface you own. Pass a fake.
- A test that passes when the function body is deleted.
- Testing a type the compiler already enforces.
