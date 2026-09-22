---
description: Run the gate and report failures grouped by package.
allowed-tools: Bash(pnpm:*)
---

Run `pnpm gate` once, from the repo root, in the background with a 10 minute bound.

When it finishes:

- Green: reply with one line, `gate green`, and the wall time.
- Red: group the failures by package (`pnpm -r` prefixes each line with the package name; Biome prints the path). For each package list the failing test names or the first error line per file, at most 10 lines per package. Quote error text exactly. Do not propose fixes unless asked.

Never rerun the gate to "see if it passes again". A flaky result is a finding, not a retry.
