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
- One schema per file under `src/`, named after its wire noun (`FiefOverview.ts`); `src/index.ts` only re-exports. Shared primitives (instants, whole-second durations, counts) live in `src/Wire.ts` and are not exported from the entry.
- Instants are ISO 8601 strings (`z.iso.datetime()`), durations are whole seconds; no `Date` crosses the wire.
- Wire identifiers are camelCase (`ironMine`); the Postgres enum spells it `iron_mine`, so the api adapter maps between them.
- `BuildingContentSchema` is a discriminated union by `building`; the `library` variant has levels without `effect`, every other variant carries the effect its building produces.
- `StartStudyRequestSchema` is `{ art }`. `FiefOverview.study` mirrors `slot` with `art` in place of `building`; `FiefOverview.arts` is a record over `ArtKind` of `{ level, resource, ratePercent, nextLevel }`, `resource` the `ResourceKind` the art raises, `nextLevel` null at the top.
- `FiefOverview.season` is `null` before the calendar's epoch, otherwise a strict `{ kind, year, endsAt, multiplierPercent, durationPercent }`: `kind` a `SeasonKind`, `year` a whole number from 1, `endsAt` the ISO instant the season ends (excluded), `multiplierPercent` a record over the five `ResourceKind`s of the whole percent from 1 the season applies to each rate, `durationPercent` a strict `{ build, study }` of the whole percents from 1 the season applies to build and study durations. `SeasonDurationPercent.ts` holds that `{ build, study }` schema, shared by `FiefOverview.season` and `FiefContent.seasons.durationPercent` and not exported from the entry.
- `CancelStudyRequestSchema` is the path `{ art, targetLevel }`, `targetLevel` a whole count from 1.
- `FiefEventSchema` is a discriminated union on `kind` (`upgradeFinished`, `artLearned`, `upgradeCancelled`, `studyCancelled`) of `z.strictObject` variants: `building` or `art`, `level`, `occurredAt`, and `refund` only on the two cancels. Strict objects make an extra key fail to parse instead of being stripped. `FiefChronicleSchema` is `{ events }`, at most 100.
- `ProvinceMap.ts` holds `ProvinceMapSchema`, a strict `{ kingdom, province, lastProvince, terrain, plots }`; each plot is a strict `{ plot, fief }` where `fief` is `null` on a free plot or a strict `{ name, isOwn }`, and no player id crosses the wire. `ProvinceMapRequest.ts` parses the path `{ province }` as a whole number from 1. `ApiErrorKind` includes `ProvinceNotFound`.
- `PlayerSchema` is `{ id, email, emailVerified }`. `VerifyEmailRequest.ts` holds `VerifyEmailRequestSchema`, a strict `{ token }` with a non-empty string. `ApiErrorKind` includes `TokenInvalid` and `MailNotSent`.
- `ForgotPasswordRequest.ts` holds `ForgotPasswordRequestSchema`, a strict `{ email }`. `ResetPasswordRequest.ts` holds `ResetPasswordRequestSchema`, a strict `{ token, password }` with a non-empty token and the 8-character password rule of sign-up.
