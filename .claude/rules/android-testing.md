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
- `runTest` with the `TestClock` from `core:testing`, which reads the scheduler's virtual time, so `advanceTimeBy` advances it. Never `Thread.sleep`, never real time.
- A ViewModel that loops on the clock (`while (true) { delay(...) }`) never lets `runTest` finish: cancel its `viewModelScope` from a `backgroundScope.launch(start = CoroutineStart.UNDISPATCHED)` that awaits cancellation.
- Collaborators are the fakes in `core:testing`; no mocking library until a ticket proves the need. A fake that needs a stub per test is a sign the interface is too wide.

## Projection tests

`core:projection`'s test reads every case of the shared projection fixture, `packages/domain/src/resources/projection-cases.json` (ADR 034, #577), which `packages/domain`'s `projectionCases.test.ts` reads too. A case either side cannot read fails its test. A new projection rule is a new case in that fixture first, never a case only Android has.

## UI tests

- Query by what the player perceives: text, content description, role. A `testTag` only where no semantic handle exists.
- Screenshot tests exist only if the gate runs them. Otherwise visual verification is a screenshot in the PR.

## Rejected

- A mock of an interface you own. Pass a fake.
- A test that passes when the function body is deleted.
- Testing a type the compiler already enforces.
