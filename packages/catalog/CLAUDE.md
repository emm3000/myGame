# packages/catalog

The message catalog: every line of copy a player reads, per language, as ICU MessageFormat (ADR 038). It is the only source of copy; a client or the api never writes a player-facing string of its own.

## Commands

- `pnpm --filter @mygame/catalog generate` — `tsx src/generate.ts`: writes every generated file from `en.json` and `es.json`. Run it after any edit of either and commit what it writes.
- `pnpm --filter @mygame/catalog test` — Vitest, `src/**/*.test.ts`: the checks, the generators and the drift test.
- `pnpm --filter @mygame/catalog typecheck` — `tsc --noEmit` over `src` and the Vitest config.

## Files

- `es.json`, `en.json` — one flat object per language, key to ICU string, keys sorted, one key set: every key is in both (ADR 038 step 4, #745). Only `es.json` generates the TypeScript.
- `src/index.ts` — the only entry; it re-exports `src/generated/es.ts`. Consumers (`apps/api`, `apps/web`) import from `@mygame/catalog`, never a path under `src/`.
- `src/generated/es.ts` — generated, committed, excluded from Biome in `biome.json`. Never edit it by hand.
- `apps/android/<module>/src/main/res/values/strings.xml` and `values-es/strings.xml` — generated for every module holding an `android.<module>.*` key, `values/` from `en.json` (Android's default locale) and `values-es/` from `es.json`; the whole file is generated, so no `strings.xml` is hand-written. All eight modules (`app`, `map`, `placement`, `report`, `review`, `school`, `signin`, `town`) hold keys. The app draws in the player's scaffold language through a configuration context (`MainActivity`), never by the phone's locale alone, so every player, all `es` until the scaffold reaches the client, reads `values-es/` (ADR 038).

## Key shape

- Dot-separated segments. A web or api key is `[a-z][a-zA-Z0-9]*` then segments of `[a-zA-Z][a-zA-Z0-9]*` (`town.loading`, `refusal.InvalidCredentials`, `mail.reset.text`); a key of any other shape fails generation.
- An Android key is `android.<module>.<resource_name>`, `<module>` one of `app`, `map`, `placement`, `report`, `review`, `school`, `signin`, `town` (`app` is `apps/android/app`, the others `apps/android/feature/<module>`), `<resource_name>` the Android resource name verbatim, snake_case, so every `R.string.<name>` id stays. A `<plurals>` becomes one string key holding an ICU plural. Android keys never reach the TypeScript output.
- Fixed copy (ADR 038, ADR 040) is listed key by key in `apps/api/src/contentGate/fixedCopyKeys.ts`: the account and sign-in keys, every refusal (the web's `refusal.*`, each Android `*refusal*` key and each Android `*_unreachable` key, the unexpected refusal of a module), the review card (its prompts, answer field, hint line and verdicts, on the web and on Android), every mail and sign-out. Every other key is chrome, the count of reviews due, the next review, the earned skill and the review screen's title and states among them (ADR 040). Check 9 of `apps/api`'s content gate (`src/contentGate/checkChrome.ts`) holds every chrome key of `en.json` to the chrome lessons' words; a new fixed-copy key joins that list in the change that adds it, or check 9 reads it as chrome.
- A key becomes one exported function named by the camelCase join of its segments: `mail.verification.text` is `mailVerificationText`, `refusal.InvalidCredentials` is `refusalInvalidCredentials`, each returning `string`.

```ts
import { mailVerificationText } from '@mygame/catalog'

mailVerificationText({ link })
```

## ICU subset

The generated TypeScript imports nothing and formats nothing at runtime, so it accepts only:

- `{x}`, typed `x: string | number`, rendered with `String(x)`.
- `{n, plural, =0 {...} =1 {...} other {...}}`, typed `n: number`: only exact `=N` selectors and `other`, never `one`, `few` or `many`, which need runtime plural rules; no offset, no `selectordinal`. `#` renders `String(n)`, never a locale-formatted number.
- `{k, select, a {...} b {...} other {...}}`, typed `k: 'a' | 'b'`, the explicit keys.

A number, date or time argument, a tag, or one argument in two roles (`{n}` beside `{n, plural, ...}`) fails generation with the key named. A message without arguments is a function of none. ICU quoting applies: `'{'` is a literal brace, `''` a literal apostrophe.

Android strings are written as the ICU pattern, XML- and Android-escaped (`\`, `&`, `<`, `'`, `"`, newline, a leading `@` or `?`), with `formatted="false"` on any string holding `%`; the client formats them with `android.icu.text.MessageFormat`. An Android plural writes its count as `{n, number,0}`, a DecimalFormat pattern without grouping and with no space before it, since ICU keeps a style's leading space as a literal prefix, never `#`, which ICU's Spanish format groups (`10.000`); `androidPlurals.test.ts` fails on a `#` in an Android key of either language. The number argument is allowed there because Android keys never reach the TypeScript generator.

## Checks

`catalogProblemsOf({ en, es })` answers every problem, and `catalogProblemsOf.test.ts` fails unless the shipped catalogs answer none:

1. `missingFromEs` — a key of `en.json` missing from `es.json`; `missingFromEn` — a key of `es.json` missing from `en.json`.
2. `unparsable` — a message, in either language, that does not parse.
3. `argumentsDiffer` — the two languages name different arguments for one key.
4. `voseo` — a voseo form in `es` (`vos`, `sos`, `tenés`, `podés`, `querés`, `sabés`, `mirá` and the rest of the list in `catalogProblemsOf.ts`), matched as a whole word with Unicode letter lookarounds, case-insensitive. JavaScript's `\b` breaks on accented letters, so never rewrite it with `\b`. The list leaves out voseo imperatives that are also standard first-person preterites (`salí`, `elegí`, `escribí`), which a tú line may use.

## Drift test

`src/generatedFiles.test.ts` regenerates every file in memory and fails on any difference with the committed copy, the TypeScript and every generated `strings.xml`. An `en.json` or `es.json` edit without `generate` turns `pnpm gate` red.

## Gotchas

- Every string moved here is byte-identical to the text it replaced; a move never rewords.
- `@formatjs/icu-messageformat-parser` is a devDependency used only by the generator, the checks and the tests; the package has no runtime dependency, and `intl-messageformat` is not used anywhere.
- `typescript`, `vitest`, `tsx`, `@types/node` and the parser come from `catalog:`; `apps/api`'s content gate parses `en.json` with the same parser.
