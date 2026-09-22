---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/vitest.config.*"
---
# Testing

Vitest in every package. The gate runs `pnpm -r test`; a package without a `test` script breaks the gate.

## What a test is

- A test names a rule in a sentence: `it('caps accrued wood at the warehouse capacity')`. The suite reads as the spec of the module.
- Behavior over structure: assert what the caller observes (the `Result`, the stored state, the response body), never a private call sequence.
- One rule per test. A test that needs "and" in its name is two tests.
- Fixture locals are named by role (`emptyFief`, `busyQueue`, `frozenClock`), built by small factory functions beside the test, never a shared mutable fixture.

## Domain tests

- Pure: a fixed `Clock`, in-memory ports, no I/O. They run in milliseconds and are the bulk of the suite.
- Every `DomainError` member has at least one test that produces it.
- Every use case has a test for the happy path and one per failure branch.
- Lazy evaluation is tested by advancing the fixed clock, never by sleeping.

## Adapter tests

- Every port has one contract test suite that runs against every adapter, the in-memory one included. A new adapter passes the same suite before it is wired.
- Database adapters test against a real database in CI (a service container), not a mock of the driver.

## Api tests

- Hono routes are tested through `app.request()` with the in-memory adapters. Assert status, body parsed by the contract schema, and the persisted change.

## Web tests

- Components are tested by behavior through Testing Library queries by role and text, never by class name or DOM structure.
- No snapshot tests of markup. A snapshot that changes on every restyle proves nothing.
- Visual verification is a screenshot in the PR, not a test.

## Rejected

- Mocking a module you own. Pass a port instead.
- `setTimeout` or `await sleep` in a test. Advance the clock.
- A test that passes when the function body is deleted.
- Testing a type: if the compiler enforces it, there is no test to write.
