---
paths:
  - ".github/**"
---
# GitHub workflows

## The gate

CI runs exactly `pnpm gate`, whose definition is the `gate` script in the root `package.json`. The workflow never lists the gate's steps by hand; when the gate changes, `package.json` changes and CI follows. The one step outside the gate is the api build-and-probe, which needs a built bundle, so it lives in the workflow. Local and CI run the same command on the same Node major (`.node-version`).

## `ci.yml`

- Triggers: `pull_request` on any branch, `push` to `trunk`.
- Steps: checkout, `pnpm/action-setup` (reads `packageManager` from `package.json`, so no version is repeated), `actions/setup-node` with `node-version-file: .node-version` and `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm gate`, then the api build-and-probe: `pnpm -r build`, then `node --input-type=module --eval` imports `apps/api/dist/index.js`, the bundle Vercel runs, and asks its default export's `fetch` for `/health`; anything but 200, or a bundle that fails to compose, fails the job.
- The workflow's `permissions` are `contents: read`; a job widens them only for what it does.
- The `gate` job runs Postgres (`postgres:18`) and Mailpit (`axllent/mailpit` at an exact tag) as service containers with health checks, and passes `DATABASE_URL`, `SMTP_URL`, `MAILPIT_URL`, `MAIL_FROM` and `WEB_URL` to the gate. A new service joins that job, never a second workflow.
- The `android` job is the Android leg of the gate (ADR 034), beside `gate` in the same workflow: checkout, `actions/setup-java` (Temurin 17), `gradle/actions/setup-gradle` (Gradle cache and wrapper validation; the wrapper itself pins the Gradle version and its `distributionSha256Sum`), then in `apps/android` exactly `./gradlew detekt checkModuleBoundaries checkComposeFreeViewModels testDebugUnitTest assembleDebug`, the command `verification.md`'s `apps/android` row names. It uses the runner's preinstalled Android SDK and needs no service. Branch protection requires only `gate`, so a red `android` job does not block a merge on its own; review reads it.
- The `vercel` job runs on `pull_request` only (on `push` to `trunk`, `deploy.yml` builds the same projects with `--prod`). It catches what the gate cannot see: Vercel's Hono detection, which needs the plain `Hono` value import in `apps/api/src/index.ts`, its type check of a TypeScript entry, and Nitro's Vercel output (ADR 031). Steps: a check that `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_API_PROJECT_ID` and `VERCEL_WEB_PROJECT_ID` are readable, failing with their names and never their values; checkout without persisted credentials, `pnpm install --frozen-lockfile`, then per project `vercel pull --yes --environment=preview` and `vercel build`, the api first and the web second with `NITRO_PRESET=vercel`, `.vercel/` removed between them. The CLI is the same `pnpm dlx vercel@<exact version>` as `deploy.yml`. It never runs `vercel deploy` and never `--prod`, holds no `environment`, so it records no deployment, and needs no service. A pull request from a fork gets no secrets, so its `vercel` job fails at the check; the repo takes none. Branch protection does not require it.

## `deploy.yml`

- Trigger: `workflow_run` of `ci`, `completed`, on `trunk`. The `changes` job runs only when `vars.DEPLOY_ENABLED == 'true'`, the run's `conclusion` is `success`, its `event` is `push` and its `head_branch` is `trunk`; a `ci` run on a pull request also completes with `success`, so the event check is what keeps it out. With the variable unset, both jobs are skipped and the run is not a failure. `workflow_run` reads `deploy.yml` from the default branch, so a PR cannot exercise its own change to it.
- It deploys `github.event.workflow_run.head_sha`, never `github.sha`, which on `workflow_run` is the default branch's tip at trigger time.
- Tip guard: `changes` also requires `head_sha == github.sha`, so a run deploys only while the `ci` run it follows is still `trunk`'s tip. GitHub records the `production` deployment with `github.sha`, so the guard keeps every record equal to the commit that ran. Without it, two scenarios break. First, `ci` for A goes green and code push C lands before the deploy run is created: the record says C while production runs A, C's `ci` is then cancelled by docs push D (or fails), the C-to-D diff is docs-only, and C never ships. Second, re-running an old `trunk` `ci` run deploys an older commit, a silent rollback whose record names the tip, so later docs pushes are skipped. A superseded commit ships with the next green run, whose diff includes it.
- The workflow's concurrency group is `deploy` with `cancel-in-progress: false`: a newer green run waits for the running deploy and never cancels it halfway.
- Docs-only rule: `changes` reads the SHA of the newest `production` deployment that has a `success` status, then `.github/scripts/needs-deploy.sh <base> <head>` prints `false` only when every file in `git diff --no-renames --name-only <base> <head>` is under `docs/` or `apps/android/`, or ends in `.md`: neither the api nor the web builds from those paths, so an Android-only merge deploys nothing. No earlier deployment, a base the clone does not know, or an empty diff (a re-run) prints `true`. Diffing against the last deployment, not `github.event.before`, means a code push whose `ci` run was cancelled still deploys with the docs-only push that follows it. A docs-only skip creates no deployment, because only the `deploy` job holds `environment: production`.
- The `deploy` job runs in `environment: production` (ADR 031): checkout of `head_sha`, `pnpm install --frozen-lockfile`, then `vercel pull --environment=production` and `vercel build --prod` for the api project, its `.vercel/` moved aside to `.vercel-api/`, the same for the web project into `.vercel-web/` with `NITRO_PRESET=vercel` (Nitro's provider detection matches `GITHUB_ACTIONS` before `VERCEL` and would otherwise build the Node preset into `.output/`), then `pnpm --filter @mygame/api db:migrate` with `DATABASE_URL` set to the direct Neon URL, then `vercel deploy --prebuilt --prod` for the api and last for the web, each with its `.vercel/` moved back. Both projects build before anything touches the database, so a broken build migrates nothing, and a broken migration deploys nothing. The CLI is `pnpm dlx vercel@<exact version>`; `VERCEL_PROJECT_ID` is set per step, since `vercel pull` and `vercel deploy` read it. A build runs on the runner's Linux x64, so the function ships the `@node-rs/argon2` binary it loads.
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_API_PROJECT_ID`, `VERCEL_WEB_PROJECT_ID` and `DIRECT_DATABASE_URL` (Neon's unpooled URL; the function reads the pooled one from Vercel's environment), passed through `env` and never echoed. Variable: `DEPLOY_ENABLED`. `changes` alone holds `deployments: read`.

## `health.yml`

- Triggers: `schedule` at `0 6 * * *` (06:00 UTC) and `workflow_dispatch`. Both run the file on the default branch, so a PR cannot run its own change to it; `actionlint` is the check before merge.
- Guard: the one job, `status`, runs only while `vars.DEPLOY_ENABLED == 'true'`; otherwise it is skipped and the run is not a failure.
- Command: one `curl --fail` of `https://mygame.emm3000.com/api/health`, through the web's domain and its rewrite, so it checks the web, the rewrite and the api together; three retries, a 30 s limit. Anything but 200 fails the job, and GitHub's failed-run mail is the alert. It reads no secret.
- No `environment`. `environment: production` would record a `production` deployment at `github.sha`, which `deploy.yml`'s docs-only rule reads as the last deploy: a code commit whose deploy failed would then be skipped by the next docs-only push.
- Its own concurrency group, `health`. In the `deploy` group, GitHub keeps one pending run per group and cancels the older, so a queued health run could cancel a queued deploy.
- A change to `health.yml` alone counts as code for `needs-deploy.sh`, so its merge runs a full deploy. It stays code on purpose: a deploy is cheap and the rule stays one line.
- `permissions: contents: read` and a 5-minute timeout. It checks nothing out and uses no action.
- GitHub disables a public repo's schedules after 60 days without activity; `gh workflow enable health.yml` turns it back on.

## Pinning

Third-party actions are pinned to a full commit SHA with the version tag in a trailing comment, updated deliberately. Never `@main`, never a tag alone, not even a major.

## Branch protection

`trunk` requires the `gate` check, a linear history and rebase merges only. Force pushes to `trunk` are refused by GitHub and by `.claude/settings.json`.

## What CI does not do

CI publishes nothing: no image, no release, no tag, no package; the `vercel` job builds and deploys nothing. The deploy to Vercel is its own workflow, outside `ci.yml`'s concurrency group, so a newer push never cancels a deploy halfway (ADR 031).
