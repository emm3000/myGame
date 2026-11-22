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
- Discriminated unions with a `kind` field for every closed set of states or errors. `switch` over `kind` with an exhaustive `never` default, except when every case returns, the `switch` is the function's last statement, and the function declares a return type that excludes `undefined`, `void`, `unknown` and `any`: `strict` in `tsconfig.base.json` then refuses a missing case (TS2366), so the `switch` has no `default`.

## Idioms

- `const` everywhere; `let` only when reassignment is the point.
- Named exports only. A file exports one primary thing whose name matches the file.
- No default parameters that hide a dependency (a clock, an id generator, a repository). Dependencies are passed.
- Pure functions in `packages/domain`; a function that reads a port is a use case and is named as one.
- Control flow follows Flat control flow in `principles.md`; `biome.json` enforces part of it, and a finding is fixed by shape, never by a `biome-ignore`. A function longer than about 30 lines is split; the limits are in ADR 052, "The limits a check enforces": 250 lines a file, 50 a function, 30 production files a folder, 600 a test file, and the gate enforces them.
- A production file holds at most 5 exports and a class or interface at most 7 methods (ADR 052, "No god file, no god class"); `scripts/mygame-structure-check` enforces both (`file_over_export_cap`, `type_over_method_cap`), and the package entries (`src/index.ts`, the domain's `src/testing.ts`) and `*Tables.ts` files are exempt from the export cap.
- A callback is a function reference, `rows.map(toRow)`, only when the callee takes exactly one parameter; otherwise it is an arrow, `rows.map((row) => toRow(row))`. `map` passes the index and the array too, so `['1', '2'].map(parseInt)` returns `[1, NaN]`.
- Prefer `Result<T, E>` over exceptions across every boundary the domain touches. Exceptions are for programmer errors and are never caught for control flow.

## Modules

- ESM only, `verbatimModuleSyntax`, `import type` for type-only imports.
- A package exposes one entry (`src/index.ts`) and consumers import only from it. `@mygame/domain` has a second entry, `@mygame/domain/testing` (`src/testing.ts`), the in-memory port of each domain port that has a Drizzle adapter: a domain test reads the fake from its `testing/` folder, the api's contract suite proves it through that entry, and nothing else imports either (`production_imports_fakes`).
- In `apps/api` and `packages/domain`, an import that leaves its top-level folder under `src/` (a feature, `platform`, a domain kernel folder such as `ports`) is a Node subpath import named from the package root: `#town/useCases/sendJob`, `#DomainError`. So is an import from a file at the `src/` root that reaches a folder. The one mapping is `"imports": { "#*": "./src/*.ts" }` in the package's `package.json`. An import inside one top-level folder stays relative, `./` or `../`, never a subpath import, and so does an import between two root files (`./composeServer`).
- No barrel files inside a package beyond its entries.

## Naming by layer

| Thing | Pattern | Example |
|---|---|---|
| Entity | noun | `Town`, `BuildingWork` |
| Value object | noun, immutable | `Duration`, `SiteAddress`, `TownName` |
| Domain use case | verb phrase | `startBuildingWork`, `settleSchoolLesson` |
| Api use case | verb phrase, never a domain export's name | `resolveCurrentTown`, `serveReport` |
| Endpoint | use case + `Route` | `sendJobRoute` |
| Route list | area + `Routes` | `jobsRoutes` |
| Responder | `respond` + what it turns into a response | `respondTownChange` |
| Presenter | `present` + wire noun | `presentTownOverview` |
| Row mapper | noun + `FromRow`, noun + `Columns` | `workSlotFromRow`, `jobColumns` |
| Contract suite | port + `Contract.testSupport.ts` | `townRepositoryContract.testSupport.ts` |
| Port | noun + role | `TownRepository`, `Clock`, `IdGenerator` |
| Adapter | technology + port | `DrizzleTownRepository`, `SystemClock` |
| Domain error member | past or present participle of the failure | `SiteTaken`, `TopLevelReached` |
| Contract schema | wire noun + `Schema` | `TownOverviewSchema`, `StartBuildingWorkSchema` |
| Contract type | the schema's noun | `TownOverview`, `StartBuildingWork` |
| Web route | TanStack file route | `routes/school.$lessonId.tsx` |
| Component | noun, PascalCase | `Block`, `BuildSlot` |
| Hook | `use` + noun | `useTownOverview` |
| Test | `<subject>.test.ts` beside the subject | `startBuildingWork.test.ts` |

## File names

- camelCase for files that export a function or value, PascalCase for files that export a type, class or component.
- Directories are plural nouns for collections and singular for a single concern. Which folder holds which role is ADR 052, "The folder grammar"; the first folder is a feature, the second a role.
- `*Of` names a pure, synchronous derivation and nothing else: a function that returns a promise is named by a verb, and a function that writes is never named as a reading.

## Formatting

Biome owns formatting. Never hand-format; run `pnpm format`.
