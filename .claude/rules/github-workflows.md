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
- A database service container is added the day the first adapter test needs one, in the same job, never a second workflow.

## Pinning

Third-party actions are pinned to a full commit SHA with the version tag in a trailing comment, updated deliberately. Never `@main`, never a floating major once the repo has a release. Until then the major tag is tolerated and this rule is the reminder.

## Branch protection

`trunk` requires the `gate` check, a linear history and rebase merges only. Force pushes to `trunk` are refused by GitHub and by `.claude/settings.json`.

## What CI does not do

CI publishes images and nothing else: no release, no tag, no package outside GHCR. The SSH deploy is its own workflow, outside `ci.yml`'s concurrency group, so a newer push never cancels a deploy halfway (ADR 026).
