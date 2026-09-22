---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# TypeScript style

## Comments

None. No JSDoc, no `//`, no `/* */`, no commented-out code, no section banners. A name carries the meaning or the code is restructured until it does. Three exceptions, each one line, each stating a constraint the reader cannot derive from the code:

1. A link to the external spec or issue a workaround exists for.
2. A Biome or TypeScript directive (`biome-ignore`, `@ts-expect-error`) with its reason on the same line.
3. A `TODO(#issue)` that names an open GitHub issue.

## Types

- Explicit return type on every exported function, method and arrow assigned to an exported `const`. Locals and callbacks infer.
- `interface` for object shapes that adapters implement (ports); `type` for unions, tuples, mapped and inferred types.
- No `any`, no non-null assertion, no `as` outside a test fixture. Narrow with a type guard or parse with zod.
- `readonly` on every property of an entity or value object, and `ReadonlyArray` for collections they expose.
- Discriminated unions with a `kind` field for every closed set of states or errors. `switch` over `kind` with an exhaustive `never` default.

## Idioms

- `const` everywhere; `let` only when reassignment is the point.
- Named exports only. A file exports one primary thing whose name matches the file.
- No default parameters that hide a dependency (a clock, an id generator, a repository). Dependencies are passed.
- Pure functions in `packages/domain`; a function that reads a port is a use case and is named as one.
- Early return over nested `if`. A function longer than about 30 lines or nested deeper than 3 levels is split.
- Prefer `Result<T, E>` over exceptions across every boundary the domain touches. Exceptions are for programmer errors and are never caught for control flow.

## Modules

- ESM only, `verbatimModuleSyntax`, `import type` for type-only imports.
- A package exposes one entry (`src/index.ts`) and consumers import only from it.
- No barrel files inside a package beyond that single entry.

## Formatting

Biome owns formatting. Never hand-format; run `pnpm format`.
