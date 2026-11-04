---
paths:
  - "**"
---
# Verification

Pick the evidence from the whole work unit: staged, unstaged and new files, or the commit range under review. Every changed area owes its row, on top of `pnpm gate`, which binds every commit.

| Changed area | Required evidence |
|---|---|
| `packages/domain` | `pnpm --filter @mygame/domain test`; the leak check in `architecture.md` is empty |
| `packages/contracts` | `pnpm --filter @mygame/contracts test`; `pnpm -r typecheck`, since the api and the web consume it |
| `apps/api` routes and adapters | `pnpm --filter @mygame/api test` with `DATABASE_URL` on the session's own Postgres container; once `apps/android` and the OpenAPI client exist, a route whose schema changed also owes the Android row, because the generated client changes |
| `apps/api/src/adapters/postgres/schema.ts`, `apps/api/migrations/` | `pnpm --filter @mygame/api db:generate` writes no new file; `pnpm --filter @mygame/api test`, whose migration test applies every migration on an empty database. Never against Neon |
| `apps/web` screens | `pnpm --filter @mygame/web test`; a screenshot of each changed screen in the PR, seeded after the gate (`apps/web/CLAUDE.md`) |
| `apps/android` | In `apps/android`: `taskpolicy -c utility ./gradlew detekt checkModuleBoundaries checkComposeFreeViewModels testDebugUnitTest assembleDebug`; for a screen, the flow exercised on an emulator with a screenshot in the PR |
| `.github/**` | `actionlint` on the changed workflow; a `workflow_run` or `schedule` workflow cannot run from its PR, so say so |
| `.claude/**`, `CLAUDE.md` | Frontmatter parses; every path, command and rule a file names exists |
| Docs only | Every fact checked against the code it describes; no runtime check solely for prose |

## Reporting

- Run the checks after the last edit. A result counts only while its inputs are unchanged.
- Report each command, its exit status and the decisive line. A command that did not start, a missing tool or an unavailable device is **not run**, never passed.
- A failure outside the change is reported as found, never silently fixed or used to shrink the scope.
- The change working, its evidence, the review and the permission to commit are separate facts; report each one.
