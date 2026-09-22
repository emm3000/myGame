---
status: accepted
date: 2026-09-21
---
# One pnpm workspace holds web, api and the shared packages

The game needs a browser client, a server that owns the truth, and a domain
model both must agree on. The question was whether these live in one
repository or in two (`mygame-web`, `mygame-api`).

## Decision

One repository, one pnpm workspace: `apps/web`, `apps/api`,
`packages/domain`, `packages/contracts`. Versions shared by more than one
package are written once in the `catalog` of `pnpm-workspace.yaml`. One gate
(`pnpm gate`), one CI workflow, one issue tracker, one wave at a time.

## Alternative considered

Two repositories. They win when two teams release on different cadences or
when the api serves clients the web team does not own. Neither holds here: one
author, one client, one release. Their cost is concrete: the wire contract is
either duplicated in both repos or published as a private npm package on every
change; a feature that touches both sides becomes two PRs that cannot be
reviewed or reverted together; every wave doubles its worktrees and its CI
runs.

## Consequences

- A contract change breaks web and api in the same PR, caught by one gate.
- A peer session's worktree covers both sides of a slice.
- Deploys are coupled by default; when that hurts, CI filters by changed path
  before this decision is revisited.
- The repo grows; `pnpm --filter` keeps local commands scoped.
