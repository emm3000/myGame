---
paths:
  - ".github/**"
---
# GitHub workflows

The YAML under `.github/workflows/` holds every trigger, step and flag; this rule holds only the reasons it cannot say.

## Every workflow

- **Pinning.** Third-party actions are pinned to a full commit SHA with the version tag in a trailing comment. Never `@main` or a tag alone, not even a major. A CLI is pinned to an exact version the same way: Vercel's through `.github/vercel-cli/package-lock.json`, `firebase-tools` in its `npx` line, at least two weeks old when chosen.
- **Permissions.** A workflow's `permissions` are `contents: read`; a job widens them only for what it does.
- **Secrets.** A secret reaches only the step that needs it, through `env`, never echoed, and a missing one fails its step with its name, never its value. No step holds a Vercel token while code from the repo or a dependency's install script can run.
- **Not runnable from a PR.** `deploy.yml`, `health.yml` and `app-distribution.yml` never run on `pull_request`: `actionlint` is their check before merge.

## `ci.yml`

- `gate` runs exactly `pnpm gate`, the script in the root `package.json`, never the gate's steps by hand. The one step outside the gate is the api build-and-probe, which needs a built bundle. A new service joins the `gate` job, never a second workflow.
- `android` is the Android leg of the gate (ADR 034): the command in `verification.md`'s `apps/android` row. It runs only when `changes` prints `true`.
- `vercel` runs on `pull_request` only and catches what the gate cannot see: Vercel's Hono detection, which needs the plain `Hono` value import in `apps/api/src/index.ts`, its type check of a TypeScript entry, and Nitro's Vercel output (ADR 031). It pulls and builds, never deploys, never `--prod`, and holds no `environment`.

## `deploy.yml`

- It runs after a green `ci` run of a `push` to `trunk`, and only while `vars.DEPLOY_ENABLED == 'true'`; otherwise every job is skipped, not failed.
- Tip guard: it deploys `github.event.workflow_run.head_sha`, and only while that equals `github.sha`. GitHub records the `production` deployment with `github.sha`, so the record always names the commit that ran. Without it, code push C lands before green A's deploy run is created and docs push D cancels C's `ci`: the record names C while production runs A, C-to-D is docs-only, and C never ships. Nor can re-running an old `ci` run roll production back.
- Docs-only rule: `.github/scripts/needs-deploy.sh` skips a diff that holds only `docs/`, `apps/android/` and `.md` files; a workflow file counts as code. It diffs against the last successful `production` deployment, never `github.event.before`, so a code push whose `ci` run was cancelled still ships with the docs push after it. Only the `deploy` job records a deployment: `pull` and `migrate` declare the environment with `deployment: false`, which relies on `deploy.yml` triggering only from `trunk`.
- `pull`, `build`, `migrate` and `deploy` are chained by `needs:`, so a broken build migrates nothing and a broken migration deploys nothing. `pull` and `deploy` never check out the repo; `build` holds no secret and sets `NITRO_PRESET=vercel` for the web, because Nitro matches `GITHUB_ACTIONS` before `VERCEL`; `deploy` unpacks only `.vercel/output` and `vercel.json` from `build`'s artifact, because the CLI executes any other config file with the token in reach.
- Its concurrency group is `deploy` with `cancel-in-progress: false`: a newer run waits and never cancels a deploy halfway.
- One Vercel token per project and per use, always read as `VERCEL_TOKEN`: `VERCEL_API_TOKEN` and `VERCEL_WEB_TOKEN` are secrets of the `production` environment, which deploys only from `trunk`; `VERCEL_PREVIEW_API_TOKEN` and `VERCEL_PREVIEW_WEB_TOKEN` are repo secrets. `DIRECT_DATABASE_URL`, Neon's unpooled URL, is set only in `migrate`'s step: migrations are repo code.

## `android-changed.sh`

The one list of Android inputs, read by `ci.yml` and `app-distribution.yml`. A new input from outside `apps/android` joins this list, never a `paths:` filter, which would be a second copy. In doubt it prints `true`: a missed Android build costs more than an extra one. Both callers check out full history: in a shallow clone every base is unknown.

## `health.yml`

- One daily `curl` of the production `/api/health` through the web's domain, so it checks the web, the rewrite and the api together; GitHub's failed-run mail is the alert.
- No `environment`: `environment: production` would record a deployment that the docs-only rule reads as the last deploy.
- Its own concurrency group, `health`: in the `deploy` group a queued health run could cancel a queued deploy.
- GitHub disables the schedule after 60 days without repo activity; `gh workflow enable health.yml` restores it.

## `app-distribution.yml`

- It builds the Android release on a `trunk` push that changes an Android input and sends it to Firebase App Distribution.
- Concurrency sits on the `build` job with the decision in the group name, never on the workflow: a workflow-level group would let a web-only push cancel an Android build and then skip its own. `distribute` uploads one at a time, never cancelled halfway.
- A failed `build` is dispatched again, never re-run: a re-run keeps the old `run_number`, which sets `MYGAME_VERSION_CODE`, and can upload a lower `versionCode`.
- `build` holds no secret; `distribute` runs no repo code and holds the signing and Firebase secrets.
- A commit message is free text: the release notes reach the CLI through the `RELEASE_NOTES` env var, never interpolated into the script.

## Branch protection

`trunk` requires the `gate` check, a linear history and rebase merges only. Force pushes to `trunk` are refused by GitHub and by `.claude/settings.json`. `android` and `vercel` are not required: review reads a red one, and a skipped `android` is not a failure.

## What CI does not do

CI publishes nothing: no image, no release, no tag, no package.
