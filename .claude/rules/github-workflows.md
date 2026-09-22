---
paths:
  - ".github/**"
---
# GitHub workflows

## The gate

CI runs exactly `pnpm gate`, whose definition is the `gate` script in the root `package.json`. The workflow never lists the steps by hand; when the gate changes, `package.json` changes and CI follows. Local and CI run the same command on the same Node major (`.node-version`).

## `ci.yml`

- Triggers: `pull_request` on any branch, `push` to `trunk`.
- Steps: checkout, `pnpm/action-setup` (reads `packageManager` from `package.json`, so no version is repeated), `actions/setup-node` with `node-version-file: .node-version` and `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm gate`.
- A database service container is added the day the first adapter test needs one, in the same job, never a second workflow.

## Pinning

Third-party actions are pinned to a full commit SHA with the version tag in a trailing comment, updated deliberately. Never `@main`, never a floating major once the repo has a release. Until then the major tag is tolerated and this rule is the reminder.

## Branch protection

`trunk` requires the `gate` check, a linear history and rebase merges only. Force pushes to `trunk` are refused by GitHub and by `.claude/settings.json`.

## What CI does not do

No deploy, no release, no publishing from CI in this phase. A release workflow is its own ADR.
