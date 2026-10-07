---
paths:
  - ".github/**"
---
# GitHub workflows

## The gate

CI runs exactly `pnpm gate`, whose definition is the `gate` script in the root `package.json`. The workflow never lists the gate's steps by hand; when the gate changes, `package.json` changes and CI follows. The one step outside the gate is the api build-and-probe, which needs a built bundle and a listening process, so it lives in the workflow. Local and CI run the same command on the same Node major (`.node-version`).

## `ci.yml`

- Triggers: `pull_request` on any branch, `push` to `trunk`.
- Steps: checkout, `pnpm/action-setup` (reads `packageManager` from `package.json`, so no version is repeated), `actions/setup-node` with `node-version-file: .node-version` and `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm gate`, then the api build-and-probe: `pnpm -r build`, `node apps/api/dist/server.js` in the background on `API_PORT=3199`, and a retried `curl -fsS` of `/health` that fails the job unless the bundle answers; an `EXIT` trap kills the server on success and on failure.
- The workflow's `permissions` are `contents: read`; a job widens them only for what it does.
- The `images` job `needs: gate` and builds three images for `linux/amd64` with buildx and a GHA cache scoped per image: the `api` and `migrate` targets of `apps/api/Dockerfile` and the image of `apps/web/Dockerfile`, each from the repo root with the `Dockerfile.dockerignore` beside it. On a pull request it builds and pushes nothing. On a push to `trunk` it logs in to GHCR with `GITHUB_TOKEN` and pushes `ghcr.io/emm3000/mygame-api`, `mygame-migrate` and `mygame-web`, each tagged with the full `github.sha`. It alone holds `packages: write`. The concurrency group cancels a superseded `trunk` run, which then pushes no image; the next green run pushes images that contain its commits.
- The `gate` job runs Postgres (`postgres:18`) and Mailpit (`axllent/mailpit` at an exact tag) as service containers with health checks, and passes `DATABASE_URL`, `SMTP_URL`, `MAILPIT_URL`, `MAIL_FROM` and `WEB_URL` to the gate. A new service joins that job, never a second workflow.

## `deploy.yml`

- Trigger: `workflow_run` of `ci`, `completed`, on `trunk`. The `changes` job runs only when `vars.DEPLOY_ENABLED == 'true'`, the run's `conclusion` is `success`, its `event` is `push` and its `head_branch` is `trunk`; a `ci` run on a pull request also completes with `success`, so the event check is what keeps it out. With the variable unset, both jobs are skipped and the run is not a failure. `workflow_run` reads `deploy.yml` from the default branch, so a PR cannot exercise its own change to it.
- It deploys `github.event.workflow_run.head_sha`, never `github.sha`, which on `workflow_run` is the default branch's tip at trigger time.
- Tip guard: `changes` also requires `head_sha == github.sha`, so a run deploys only while the `ci` run it follows is still `trunk`'s tip. GitHub records the `production` deployment with `github.sha`, so the guard keeps every record equal to the commit that ran. Without it, two scenarios break. First, `ci` for A goes green and code push C lands before the deploy run is created: the record says C while the server runs A, C's `ci` is then cancelled by docs push D (or fails), the C-to-D diff is docs-only, and C never ships. Second, re-running an old `trunk` `ci` run deploys an older commit, a silent rollback whose record names the tip, so later docs pushes are skipped. A superseded commit ships with the next green run, whose diff includes it.
- The workflow's concurrency group is `deploy` with `cancel-in-progress: false`: a newer green run waits for the running deploy and never cancels it halfway.
- Docs-only rule: `changes` reads the SHA of the newest `production` deployment that has a `success` status, then `.github/scripts/needs-deploy.sh <base> <head>` prints `false` only when every file in `git diff --no-renames --name-only <base> <head>` is under `docs/` or ends in `.md`. No earlier deployment, a base the clone does not know, or an empty diff (a re-run) prints `true`. Diffing against the last deployment, not `github.event.before`, means a code push whose `ci` run was cancelled still deploys with the docs-only push that follows it. A docs-only skip creates no deployment, because only the `deploy` job holds `environment: production`.
- The `deploy` job runs in `environment: production` and calls `ssh deploy@$DEPLOY_HOST /srv/infra/apps/mygame/deploy.sh <sha>`: that path and its one argument, a SHA here and `status` in `health.yml`, are the whole contract with `emm3000/infra`, whose key on the server is restricted by a forced command. `StrictHostKeyChecking=yes` against the pinned known hosts and `BatchMode=yes`; a non-zero exit from `deploy.sh` fails the job. Nothing names the provider.
- Secrets: `DEPLOY_HOST`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS`, passed through `env` and never echoed. Variable: `DEPLOY_ENABLED`. `changes` alone holds `deployments: read`.

## `health.yml`

- Triggers: `schedule` at `0 6 * * *` (06:00 UTC, after the 03:30 backup and the Sunday 04:30 restore drill) and `workflow_dispatch`. Both run the file on the default branch, so a PR cannot run its own change to it; `actionlint` is the check before merge.
- Guard: the one job, `status`, runs only while `vars.DEPLOY_ENABLED == 'true'`; otherwise it is skipped and the run is not a failure.
- Command: it installs the key exactly as `deploy.yml`'s first step does, then runs `ssh deploy@$DEPLOY_HOST /srv/infra/apps/mygame/deploy.sh status` with the same options and secrets. `status` is the second argument the CI key's forced command accepts (`emm3000/infra`, `apps/mygame/README.md`): a read-only report, one `status: ok|warn|FAIL` line per check, that exits non-zero when any check fails. That exit fails the job, and GitHub's failed-run mail is the alert. The report stays in the job log.
- No `environment`. `environment: production` would record a `production` deployment at `github.sha`, which `deploy.yml`'s docs-only rule reads as the last deploy: a code commit whose deploy failed would then be skipped by the next docs-only push. #454 set the secrets at repo level (`gh secret set -R`), which a job reads without an environment; agents cannot list them to confirm it, and environment-only secrets would fail the first run on an empty key.
- Its own concurrency group, `health`. In the `deploy` group, GitHub keeps one pending run per group and cancels the older, so a queued health run could cancel a queued deploy. A run during a deploy may report a container being replaced.
- `permissions: contents: read` and a 5-minute timeout. It checks nothing out and uses no action.
- GitHub disables a public repo's schedules after 60 days without activity; `gh workflow enable health.yml` turns it back on.

## Pinning

Third-party actions are pinned to a full commit SHA with the version tag in a trailing comment, updated deliberately. Never `@main`, never a tag alone, not even a major.

## Branch protection

`trunk` requires the `gate` check, a linear history and rebase merges only. Force pushes to `trunk` are refused by GitHub and by `.claude/settings.json`.

## What CI does not do

CI publishes images and nothing else: no release, no tag, no package outside GHCR. The SSH deploy is its own workflow, outside `ci.yml`'s concurrency group, so a newer push never cancels a deploy halfway (ADR 026).
