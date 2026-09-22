---
status: accepted
date: 2026-09-22
---
# Tailwind v4 styles the web, its theme derived from the design tokens

`apps/web/src/design/tokens.ts` mirrors the Design System artifact of issue #4
and is the only source of visual primitives. The first shell styled itself
with inline `style` objects reading those tokens as CSS custom properties, and
still wrote its spacing and type sizes as pixel literals. Every screen after
it would repeat that, and nothing stopped a literal from drifting off the
scale.

## Decision

`apps/web` styles with Tailwind CSS v4, a dependency of that package alone.
The theme is not written in CSS: `src/design/tailwindTheme.ts` is a Tailwind
plugin built from `tokens.ts`, loaded by `src/styles.css` with `@plugin`. It
emits the palette as `--<token>` variables for the light (Parchment) and dark
(Ledger) schemes, switched by `prefers-color-scheme`, and replaces Tailwind's
colours, spacing, font families and font sizes with the tokens:

- every palette token is a colour utility (`bg-surface`, `text-ink`), whose
  value is the token's variable;
- the spacing scale is the artifact's 4px grid, keyed by its step numbers
  (`p-4` is `space-4`, 16px); off-scale steps such as `p-5` do not exist;
- the type scale is the artifact's styles by name (`text-display-xl`,
  `text-caption`), each carrying its size, line height, weight and tracking.

Breakpoints stay Tailwind's defaults; the artifact names none.

Arbitrary values (`p-[13px]`, `bg-[#fff]`) fail the gate: Biome's
`noTailwindArbitraryValue` is set to `error`, and Biome parses the Tailwind
directives. A value the scale lacks is added to `tokens.ts` and the artifact,
never written inline.

## Considered options

- **Inline styles over plain CSS custom properties**, the state before this
  ADR. No dependency, but every component hand-writes its CSS, responsive
  rules need a stylesheet anyway, and no check keeps a literal on the scale.
- **CSS modules.** Scoped and dependency-free, but the scale is enforced only
  by review: a module can write any length, and each component carries a
  second file.
- **A CSS `@theme` block.** Tailwind's native form, but it retypes every token
  in CSS next to `tokens.ts`, two sources that drift.

## Consequences

- A new palette token, spacing step or type style is one edit to `tokens.ts`;
  the parity test `exposes a Tailwind colour for every palette token` fails if
  the theme stops deriving a colour.
- `tailwindTheme.ts` has a default export because `@plugin` loads a module's
  default export; it is the one exception to the named-exports rule.
- `noTailwindArbitraryValue` is a nursery rule of Biome 2.5; if a Biome
  upgrade renames or drops it, the guard is replaced by a test that greps
  `apps/web/src` for `-[` before the upgrade lands.
- Components are still tested by role and text, never by class name.
