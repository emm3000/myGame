# packages/contracts

The wire vocabulary `apps/web` and `apps/api` share: zod schemas and the types inferred from them, one schema per file under `src/<feature>/`, the feature names of ADR 052. The api's OpenAPI document is generated from these schemas, and the Android client from that document with no rewrite (#590).

The rules: `.claude/rules/architecture.md`, `typescript-style.md`, `testing.md`, `verification.md`. The map is `ARCHITECTURE.md` at the repo root: this file holds only the commands and the traps nothing else catches.

## Commands

- `pnpm --filter @mygame/contracts test` — Vitest, `src/**/*.test.ts`.
- `pnpm --filter @mygame/contracts typecheck` — `tsc --noEmit` against `tsconfig.base.json`.
- `pnpm gate` from the repo root before every push.

## Gotchas

- After a schema change, run `pnpm --filter @mygame/api openapi:write` and commit `apps/api/openapi.json`: `apps/api/src/openApi.test.ts` fails the gate while it differs, and the change owes the Android row of `verification.md`, since the generated client changes.
- A whole number the api serves is `z.number().int()` or a `src/platform/Wire.ts` primitive, never a number `z.literal`, which the document writes as `type: number`, and `z.literal([1, 2, 3])` with its first value alone. A fixed zero is `WholeCountSchema.max(0)`; a closed set of whole numbers is a numeric `z.enum`.
- A union and each of its members carry `.meta({ id })`: the generator writes a `discriminator` only when every member is a named component. `openApi.test.ts` pins the discriminators union by union, so a new union joins that test.
- A nullable union is `z.lazy(() => Union).nullable()`: a plain `Union.nullable()` names the nullable copy as the component and drops its discriminator.
- A `z.record` over an enum carries `.meta({ required: <KeySchema>.options })`: the parse needs every key, but the generator writes an object of optional properties. The meta changes the document only, never the parse (#633).

A PR adds a gotcha here only when it is a trap no code, rule or test catches, in one line, and never narrates its schemas.
