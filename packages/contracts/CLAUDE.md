# packages/contracts

The wire vocabulary `apps/web` and `apps/api` share: zod schemas and the types inferred from them.

## Commands

- `pnpm --filter @mygame/contracts test` — Vitest, `src/**/*.test.ts`.
- `pnpm --filter @mygame/contracts typecheck` — `tsc --noEmit` against `tsconfig.base.json`.

## Gotchas

- Schemas only. No exported function, no behavior: `rg -n "^export (async )?function" packages/contracts/src` stays empty.
- One entry file. `src/index.ts` is the package's only export (`exports["."]`); consumers import `@mygame/contracts`, never a path under `src/`.
- A schema is named `<wire noun>Schema` (`HealthResponseSchema`); its type is the same noun without the suffix, inferred with `z.infer` (`HealthResponse`). Never hand-write a type that duplicates a schema.
- No dependency on the domain package until a slice needs a domain type on the wire; that slice adds it.
- `zod`, `typescript` and `vitest` versions live in the root catalog; write `catalog:` here, never a version.
