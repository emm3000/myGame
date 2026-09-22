# CLAUDE.md

Operating manifest for this repo. Loaded in every session.

## Mandatory state

The product is a **server-authoritative** persistent browser game in a medieval setting, built on OGame's mechanics (ADR 003). The server is the only source of truth for every resource, queue and timer; the browser renders and asks. Resources accrue while the player is away by **lazy evaluation** (ADR 005): state is derived on read from stored timestamps and rates, never advanced by a background timer. The name is `myGame` until the lore names it.

No third-party users yet, but the author runs the game from day one, so a schema change is a migration and never a reset.

## Workspace

One pnpm workspace (ADR 001). Planned packages and the only allowed dependency direction:

```
apps/web           -> packages/contracts, packages/domain
apps/api           -> packages/contracts, packages/domain
packages/contracts -> packages/domain
packages/domain    -> nothing
```

- `packages/domain` — **pure TypeScript**, zero runtime dependencies: entities, value objects, use cases, the port interfaces, `DomainError`. No `node:` imports, no framework.
- `packages/contracts` — the wire vocabulary web and api share: zod schemas and the types inferred from them. Never a function with behavior.
- `apps/api` — Hono on Node: HTTP adapters, the persistence adapters that implement the domain ports, auth, the composition root.
- `apps/web` — TanStack Start: routes, the design system, the game screens. Reads the api through `packages/contracts`, never a raw `fetch` with an ad-hoc shape.

Every package defines `typecheck` and `test` scripts, because `pnpm -r` fails on a package that lacks the script it was asked to run. Versions shared by more than one package are written once in the `catalog` of `pnpm-workspace.yaml`, never repeated per package. Every version, in a `package.json` or in the catalog, is exact: no caret, no tilde, no range; `.npmrc` sets `save-exact` so `pnpm add` writes it that way.

All four packages exist; each carries its own `CLAUDE.md`.

## Product

One fief per player at first: wood, stone, iron, gold and food, peasants as the workforce, a build queue, five buildings, an account. Spanish UI addressed as tú. The Won't-have rows, the NFRs and the acceptance criterion: `docs/PRODUCT_REQUIREMENTS.md`. The lore is a living document under `docs/lore/`; game content names come from it (`docs/lore/README.md`).

## Non-negotiable rules

These bind on every change, including a new file created before any TypeScript has been read.

- **No comments.** No JSDoc, no `//`, no banners, no commented-out code. The code explains itself or it gets renamed. Narrow exceptions in `.claude/rules/typescript-style.md`.
- **Explicit return types on every exported function and method.** Locals infer.
- **`packages/domain` stays pure.** If it needs to reach outward, invert with a port interface in `packages/domain`. Failure modes are members of the sealed `DomainError` union, never a thrown `Error`.
- **Time is injected.** A use case takes a `Clock` port; nothing in `packages/domain` or a use case calls `Date.now()` or `new Date()`.
- **Lazy evaluation.** Resource amounts are computed from `(storedAmount, storedAt, rate, capacity, now)`. No cron, no `setInterval`, no worker advancing state.
- **Rebuild, never adapt.** When existing code, config or structure does not fit the target architecture, replace it with a clean implementation. No shims, wrappers or compatibility patches over legacy.
- **`pnpm gate` green** before every commit. Its definition is the `gate` script in the root `package.json`, never a prose copy.
- **English for every identifier, file name, commit and doc; Spanish only in user-facing copy**, addressing the reader as tú, never vos.
- **Never add `Co-Authored-By`** from Claude, Anthropic or any AI assistant to a commit message; a hook blocks it. Conventional commits, linear history. Never push `trunk` without being asked, with one exception: the orchestrator pushes the docs-only commits that close a wave (the dispatch log) on its own.

## Detailed rules

Path-scoped, loaded when matching files are touched:

| File | Covers |
|---|---|
| `.claude/rules/architecture.md` | Layer boundaries, ports and adapters, use-case admission, `DomainError`, the contracts boundary, the leak check |
| `.claude/rules/typescript-style.md` | Explicit return types, comment policy, idioms, complexity limits |
| `.claude/rules/naming.md` | Naming patterns by layer, file names, English identifiers |
| `.claude/rules/principles.md` | YAGNI, KISS, SOLID with its tests, DRY with its caveat, what is rejected |
| `.claude/rules/testing.md` | Vitest, behavior tests, fixtures, what a test may not do |
| `.claude/rules/github-workflows.md` | CI, the gate's definition, pinned actions |

Each package carries a `CLAUDE.md` with its build and test facts and its gotchas once it exists.

## Stack

TypeScript strict, pnpm workspaces, Node 24 (`.node-version`), Vitest, Biome. Web: TanStack Start. Api: Hono on Node. Persistence: Postgres with Drizzle, proposed and not yet grilled (ADR 006).

## Commands

- `pnpm gate` — the gate CI runs: `pnpm -r typecheck && pnpm -r test && pnpm biome check .`.
- `pnpm -r typecheck`, `pnpm -r test` — every package; `pnpm --filter <pkg> test` for one.
- `pnpm lint`, `pnpm format` — Biome check and write.
- `pnpm install --frozen-lockfile` — what CI runs; a lockfile drift fails there, not locally.

## Test stack

Vitest, plain assertions from `vitest`, no mocking library until a ticket proves the need. Test names are sentences naming the rule (`it('refuses a second build while the queue is busy')`). Fixture locals are named by role. A test that waits observes the transition, never samples the state. A getter whose deletion leaves the suite green is not covered. No snapshot tests of UI markup.

## Custom slash commands

- `/checks` — `pnpm gate`, failures grouped by package.
- `/agents-review` — review the pending diff against these rules.
- `/wave <issues>` — boot one peer session per ticket and dispatch.

## Final rule

If a doc contradicts the current code, the code wins and the doc gets updated afterwards.

## Agent skills

### Skill routing

The `mattpocock-skills` plugin is enabled for this repo (`.claude/settings.json`). One skill per kind of work, loaded before the work starts:

- `mattpocock-skills:grilling` stress-tests a plan or design before it is ticketed.
- `mattpocock-skills:to-tickets` splits a plan or spec into tracer-bullet tickets with their blocking edges.
- `mattpocock-skills:tdd` on every ticket that adds or changes behavior: red, green, refactor.
- `mattpocock-skills:code-review` inside `pr-reviewer`, for the Standards and Spec axes.
- `mattpocock-skills:domain-modeling` for `CONTEXT.md`, a new term or an ADR.
- `mattpocock-skills:diagnosing-bugs` first on any bug whose cause is unknown.
- `mattpocock-skills:research` for reading legwork against primary sources.
- `mattpocock-skills:writing-for-agents` when editing a skill, a rule, an agent or this file.

### Issue tracker

Issues and specs live in GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Design and reference docs

- `gh issue list --label ready-for-agent` — the committed work. No doc holds a work list.
- `docs/PRODUCT_REQUIREMENTS.md` — the Won't-have rows (ADRs amend them by row id), the NFRs, the acceptance criterion. Read before scoping a feature.
- `docs/lore/` — the world; read before naming anything a player sees. `docs/art/art-bible.md` before generating any image.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Multi-session orchestration

Playbook for the writer/reviewer loop and for dispatching to parallel peer sessions. Read it before dispatching any ticket. See `docs/agents/multi-session.md`.
