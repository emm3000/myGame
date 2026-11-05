import { expect, it } from 'vitest'
import { type ColorToken, palette, type Theme } from './tokens'

type PairKind = 'text' | 'boundary' | 'graphic'

type Exemption = 'inactive component, WCAG 1.4.3'

interface Pair {
  readonly kind: PairKind
  readonly foreground: ColorToken
  readonly background: ColorToken
  readonly usedBy: string
  readonly exemption?: Exemption
}

const minimumOf: Readonly<Record<PairKind, number>> = { text: 4.5, boundary: 3, graphic: 3 }

const themes: ReadonlyArray<Theme> = ['light', 'dark']

const resourceLabel = 'ResourceBar label'

const resourceIcon = 'resource icon in ResourceBar, CostList, ArtCard and FiefSwitcher chip'

const resourceTrack = 'ResourceBar track'

const controlBoundary = 'border of every Button, TextField, NumberField and recognition choice'

const focusRing = 'focus ring, 3 px at a 2 px offset'

const pairs: ReadonlyArray<Pair> = [
  { kind: 'text', foreground: 'ink', background: 'surface', usedBy: 'running text' },
  { kind: 'text', foreground: 'ink', background: 'surface-raised', usedBy: 'card text' },
  {
    kind: 'text',
    foreground: 'ink',
    background: 'surface-sunken',
    usedBy: 'CardHeader, BuildSlot and WaitingUpgrades level badges, NoticeBanner line',
  },
  {
    kind: 'text',
    foreground: 'ink',
    background: 'right-soft',
    usedBy: 'MarchSent, NoticeBanner sent outcome, right verdict',
  },
  { kind: 'text', foreground: 'ink', background: 'miss-soft', usedBy: 'FormAlert, missed verdict' },
  { kind: 'text', foreground: 'ink', background: 'hint-soft', usedBy: 'near-miss prompt' },
  { kind: 'text', foreground: 'ink-muted', background: 'surface', usedBy: 'captions on the page' },
  {
    kind: 'text',
    foreground: 'ink-muted',
    background: 'surface-raised',
    usedBy: 'captions in a card',
  },
  {
    kind: 'text',
    foreground: 'ink-muted',
    background: 'surface-sunken',
    usedBy: 'waiting Button label',
  },
  {
    kind: 'text',
    foreground: 'ink-faint',
    background: 'surface',
    usedBy: 'idle BuildSlot, RecruitSlot and MarchSlot, free PlotTile, empty chronicle',
  },
  {
    kind: 'text',
    foreground: 'ink-faint',
    background: 'surface-raised',
    usedBy: 'free PlotTile with an action open',
  },
  {
    kind: 'text',
    foreground: 'line-strong',
    background: 'surface-sunken',
    usedBy: 'disabled Button and NumberField',
    exemption: 'inactive component, WCAG 1.4.3',
  },
  {
    kind: 'text',
    foreground: 'action',
    background: 'surface',
    usedBy: 'SlotsStrip idle cell, FiefSwitcher other fief',
  },
  {
    kind: 'text',
    foreground: 'action',
    background: 'surface-raised',
    usedBy: 'AppShell title and current link, AuthPanel title, TextLink, FiefScreen address',
  },
  {
    kind: 'text',
    foreground: 'on-action',
    background: 'action',
    usedBy: 'primary Button, PlotTile marker',
  },
  {
    kind: 'text',
    foreground: 'right',
    background: 'surface',
    usedBy: 'Countdown at zero in WaitingUpgrades',
  },
  {
    kind: 'text',
    foreground: 'right',
    background: 'surface-raised',
    usedBy: 'Countdown at zero in BuildSlot, just-finished BuildSlot badge',
  },
  {
    kind: 'text',
    foreground: 'right',
    background: 'right-soft',
    usedBy: 'just-finished BuildSlot, CardHeader max-level badge',
  },
  {
    kind: 'text',
    foreground: 'miss',
    background: 'surface',
    usedBy: 'LockedUnitCard requirement and reason',
  },
  {
    kind: 'text',
    foreground: 'miss',
    background: 'surface-raised',
    usedBy:
      'CostList short line, ArtCard requirement, CardAction reason, TextField error, full store rate',
  },
  { kind: 'text', foreground: 'money', background: 'surface-raised', usedBy: resourceLabel },
  { kind: 'text', foreground: 'food', background: 'surface-raised', usedBy: resourceLabel },
  { kind: 'text', foreground: 'material', background: 'surface-raised', usedBy: resourceLabel },
  { kind: 'text', foreground: 'power', background: 'surface-raised', usedBy: resourceLabel },
  { kind: 'text', foreground: 'people', background: 'surface-raised', usedBy: resourceLabel },
  { kind: 'boundary', foreground: 'line-strong', background: 'surface', usedBy: controlBoundary },
  {
    kind: 'boundary',
    foreground: 'line-strong',
    background: 'surface-raised',
    usedBy: controlBoundary,
  },
  {
    kind: 'boundary',
    foreground: 'line-strong',
    background: 'surface-sunken',
    usedBy: 'disabled and waiting Button border, NoticeToggle off thumb',
  },
  {
    kind: 'boundary',
    foreground: 'action',
    background: 'surface',
    usedBy: 'checked recognition choice, own PlotTile frame against the map',
  },
  {
    kind: 'boundary',
    foreground: 'action',
    background: 'surface-raised',
    usedBy: 'primary Button, NoticeToggle on, own PlotTile frame, FiefSwitcher current entry',
  },
  {
    kind: 'boundary',
    foreground: 'on-action',
    background: 'action',
    usedBy: 'NoticeToggle on thumb',
  },
  { kind: 'boundary', foreground: 'focus', background: 'surface', usedBy: focusRing },
  { kind: 'boundary', foreground: 'focus', background: 'surface-raised', usedBy: focusRing },
  { kind: 'boundary', foreground: 'focus', background: 'surface-sunken', usedBy: focusRing },
  { kind: 'graphic', foreground: 'money', background: 'surface-raised', usedBy: resourceIcon },
  { kind: 'graphic', foreground: 'food', background: 'surface-raised', usedBy: resourceIcon },
  { kind: 'graphic', foreground: 'material', background: 'surface-raised', usedBy: resourceIcon },
  { kind: 'graphic', foreground: 'power', background: 'surface-raised', usedBy: resourceIcon },
  { kind: 'graphic', foreground: 'people', background: 'surface-raised', usedBy: resourceIcon },
  { kind: 'graphic', foreground: 'money', background: 'surface-sunken', usedBy: resourceTrack },
  { kind: 'graphic', foreground: 'food', background: 'surface-sunken', usedBy: resourceTrack },
  { kind: 'graphic', foreground: 'material', background: 'surface-sunken', usedBy: resourceTrack },
  { kind: 'graphic', foreground: 'power', background: 'surface-sunken', usedBy: resourceTrack },
  {
    kind: 'graphic',
    foreground: 'miss',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track of a full store',
  },
  {
    kind: 'graphic',
    foreground: 'action',
    background: 'surface-sunken',
    usedBy: 'BuildSlot, RecruitSlot, MarchSlot, CargoCard and SlotsStrip track',
  },
  {
    kind: 'graphic',
    foreground: 'right',
    background: 'right-soft',
    usedBy: 'MarchSent, NoticeBanner outcome, BuildSlot and right verdict frames',
  },
  {
    kind: 'graphic',
    foreground: 'miss',
    background: 'miss-soft',
    usedBy: 'FormAlert and missed verdict frames',
  },
  {
    kind: 'graphic',
    foreground: 'hint',
    background: 'hint-soft',
    usedBy: 'near-miss prompt frame',
  },
  {
    kind: 'graphic',
    foreground: 'ink-muted',
    background: 'surface',
    usedBy: 'PlotTile camp icon',
  },
  {
    kind: 'graphic',
    foreground: 'ink',
    background: 'surface-sunken',
    usedBy: 'NoticeBanner mail icon',
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

function ratioOf(pair: Pair, theme: Theme): number {
  return contrast(palette[pair.foreground][theme], palette[pair.background][theme])
}

function labelOf(pair: Pair, theme: Theme): string {
  return `${theme} ${pair.foreground} on ${pair.background} (${pair.usedBy}): ${ratioOf(pair, theme).toFixed(2)}`
}

function checkedPairsUnderMinimum(kind: PairKind): ReadonlyArray<string> {
  return themes.flatMap((theme) =>
    pairs
      .filter((pair) => pair.kind === kind && pair.exemption === undefined)
      .filter((pair) => ratioOf(pair, theme) < minimumOf[kind])
      .map((pair) => labelOf(pair, theme)),
  )
}

it('measures black on white at 21:1', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
})

it('keeps every text pair at 4.5:1 in both themes', () => {
  expect(checkedPairsUnderMinimum('text')).toEqual([])
})

it('keeps every control boundary at 3:1', () => {
  expect(checkedPairsUnderMinimum('boundary')).toEqual([])
})

it('keeps every graphic at 3:1 in both themes', () => {
  expect(checkedPairsUnderMinimum('graphic')).toEqual([])
})

it('exempts only a pair that falls under its minimum in some theme', () => {
  const needlessExemptions = pairs
    .filter((pair) => pair.exemption !== undefined)
    .filter((pair) => themes.every((theme) => ratioOf(pair, theme) >= minimumOf[pair.kind]))
    .map((pair) => `${pair.foreground} on ${pair.background} (${pair.usedBy})`)

  expect(needlessExemptions).toEqual([])
})
