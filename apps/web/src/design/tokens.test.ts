import { expect, it } from 'vitest'
import { type ColorToken, palette, type Theme } from './tokens'

type PairKind = 'text' | 'boundary'

type WcagClause = 'WCAG 1.4.3' | 'WCAG 1.4.11'

interface Pair {
  readonly kind: PairKind
  readonly foreground: ColorToken
  readonly background: ColorToken
  readonly usedAs: string
}

interface Exemption {
  readonly clause: WcagClause
  readonly kind: PairKind
  readonly foregrounds: ReadonlyArray<ColorToken>
  readonly backgrounds: ReadonlyArray<ColorToken>
  readonly reason: string
}

const minimumOf: Readonly<Record<PairKind, number>> = { text: 4.5, boundary: 3 }

const themes: ReadonlyArray<Theme> = ['light', 'dark']

const blocks: ReadonlyArray<ColorToken> = [
  'block-peach',
  'block-mint',
  'block-periwinkle',
  'block-lavender',
]

const surfaces: ReadonlyArray<ColorToken> = ['surface', 'surface-raised', 'surface-sunken']

const onBlockUse = 'text, a window, focus on a block'

const pairs: ReadonlyArray<Pair> = [
  { kind: 'text', foreground: 'ink', background: 'surface', usedAs: 'text' },
  { kind: 'text', foreground: 'ink', background: 'surface-raised', usedAs: 'text' },
  {
    kind: 'text',
    foreground: 'ink',
    background: 'surface-sunken',
    usedAs: "text, the ring's fill on its track",
  },
  { kind: 'text', foreground: 'ink-muted', background: 'surface', usedAs: 'text' },
  { kind: 'text', foreground: 'ink-muted', background: 'surface-raised', usedAs: 'text' },
  {
    kind: 'text',
    foreground: 'ink-muted',
    background: 'surface-sunken',
    usedAs: 'text, the track',
  },
  { kind: 'text', foreground: 'on-action', background: 'action', usedAs: 'text' },
  ...blocks.map(
    (block): Pair => ({
      kind: 'text',
      foreground: 'on-block',
      background: block,
      usedAs: onBlockUse,
    }),
  ),
  ...blocks.map(
    (block): Pair => ({
      kind: 'text',
      foreground: 'on-block-muted',
      background: block,
      usedAs: 'text',
    }),
  ),
  { kind: 'text', foreground: 'warning-ink', background: 'surface', usedAs: 'text' },
  { kind: 'text', foreground: 'warning-ink', background: 'surface-raised', usedAs: 'text' },
  { kind: 'text', foreground: 'warning-ink', background: 'warning-soft', usedAs: 'text' },
  { kind: 'text', foreground: 'destructive-ink', background: 'surface', usedAs: 'text' },
  { kind: 'text', foreground: 'destructive-ink', background: 'surface-raised', usedAs: 'text' },
  { kind: 'text', foreground: 'destructive-ink', background: 'destructive-soft', usedAs: 'text' },
  { kind: 'boundary', foreground: 'action', background: 'surface', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'line-strong', background: 'surface', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'line-strong', background: 'surface-raised', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'line-strong', background: 'surface-sunken', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'focus', background: 'surface', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'focus', background: 'surface-raised', usedAs: 'boundary' },
  { kind: 'boundary', foreground: 'focus', background: 'surface-sunken', usedAs: 'boundary' },
]

const exemptions: ReadonlyArray<Exemption> = [
  {
    clause: 'WCAG 1.4.11',
    kind: 'boundary',
    foregrounds: ['line'],
    backgrounds: surfaces,
    reason: "a divider, never a control's boundary",
  },
  {
    clause: 'WCAG 1.4.11',
    kind: 'boundary',
    foregrounds: blocks,
    backgrounds: ['surface'],
    reason: 'a ground, and the text on it is measured',
  },
  {
    clause: 'WCAG 1.4.11',
    kind: 'boundary',
    foregrounds: ['surface-sunken'],
    backgrounds: ['surface'],
    reason: 'a silhouette not built yet, decorative, its level always written beside it',
  },
  {
    clause: 'WCAG 1.4.3',
    kind: 'text',
    foregrounds: ['line-strong'],
    backgrounds: ['surface-sunken'],
    reason: 'the label of a disabled control',
  },
]

function channel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
}

function contrast(first: string, second: string): number {
  const luminances = [relativeLuminance(first), relativeLuminance(second)]
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}

function ratioOf(foreground: ColorToken, background: ColorToken, theme: Theme): number {
  return contrast(palette[foreground][theme], palette[background][theme])
}

function pairsUnderTheirFloor(theme: Theme): ReadonlyArray<string> {
  return pairs
    .filter((pair) => ratioOf(pair.foreground, pair.background, theme) < minimumOf[pair.kind])
    .map((pair) => `${theme} ${pair.foreground} on ${pair.background} (${pair.usedAs})`)
}

function exemptPairsOf(exemption: Exemption): ReadonlyArray<readonly [ColorToken, ColorToken]> {
  return exemption.foregrounds.flatMap((foreground) =>
    exemption.backgrounds.map((background) => [foreground, background] as const),
  )
}

function namesOf(pair: readonly [ColorToken, ColorToken]): string {
  return `${pair[0]} on ${pair[1]}`
}

function needlessPairsOf(checked: ReadonlyArray<Exemption>): ReadonlyArray<string> {
  return checked.flatMap((exemption) =>
    exemptPairsOf(exemption)
      .filter(([foreground, background]) =>
        themes.every(
          (theme) => ratioOf(foreground, background, theme) >= minimumOf[exemption.kind],
        ),
      )
      .map(namesOf),
  )
}

function exemptPairNamesUnder(clause: WcagClause): ReadonlyArray<string> {
  return exemptions
    .filter((exemption) => exemption.clause === clause)
    .flatMap(exemptPairsOf)
    .map(namesOf)
}

it('measures black on white at 21:1', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
})

it('declares the 28 pairs of ADR 043', () => {
  expect(pairs.map((pair) => namesOf([pair.foreground, pair.background]))).toEqual([
    'ink on surface',
    'ink on surface-raised',
    'ink on surface-sunken',
    'ink-muted on surface',
    'ink-muted on surface-raised',
    'ink-muted on surface-sunken',
    'on-action on action',
    'on-block on block-peach',
    'on-block on block-mint',
    'on-block on block-periwinkle',
    'on-block on block-lavender',
    'on-block-muted on block-peach',
    'on-block-muted on block-mint',
    'on-block-muted on block-periwinkle',
    'on-block-muted on block-lavender',
    'warning-ink on surface',
    'warning-ink on surface-raised',
    'warning-ink on warning-soft',
    'destructive-ink on surface',
    'destructive-ink on surface-raised',
    'destructive-ink on destructive-soft',
    'action on surface',
    'line-strong on surface',
    'line-strong on surface-raised',
    'line-strong on surface-sunken',
    'focus on surface',
    'focus on surface-raised',
    'focus on surface-sunken',
  ])
})

it('holds every pair at its floor in both themes', () => {
  expect(themes.flatMap(pairsUnderTheirFloor)).toEqual([])
})

it('keeps each block and on-block one value in both themes', () => {
  const shared: ReadonlyArray<ColorToken> = [...blocks, 'on-block', 'on-block-muted']

  expect(shared.filter((token) => palette[token].light !== palette[token].dark)).toEqual([])
})

it('exempts line, a block and a silhouette on a surface under WCAG 1.4.11', () => {
  expect(exemptPairNamesUnder('WCAG 1.4.11')).toEqual([
    'line on surface',
    'line on surface-raised',
    'line on surface-sunken',
    'block-peach on surface',
    'block-mint on surface',
    'block-periwinkle on surface',
    'block-lavender on surface',
    'surface-sunken on surface',
  ])
})

it('exempts the disabled line-strong label under WCAG 1.4.3', () => {
  expect(exemptPairNamesUnder('WCAG 1.4.3')).toEqual(['line-strong on surface-sunken'])
})

it('fails an exempt pair once it passes on its own', () => {
  const passing: Exemption = {
    clause: 'WCAG 1.4.3',
    kind: 'text',
    foregrounds: ['ink'],
    backgrounds: ['surface'],
    reason: 'a pair that needs no exemption',
  }

  expect(needlessPairsOf([passing])).toEqual(['ink on surface'])
  expect(needlessPairsOf(exemptions)).toEqual([])
})
