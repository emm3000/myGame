import { expect, it } from 'vitest'
import { type ColorToken, palette, type Theme } from './tokens'

type PairKind = 'text' | 'nonText'

type Exemption =
  | 'inactive component, WCAG 1.4.3'
  | 'decorative icon beside its text, WCAG 1.4.11'
  | 'decorative stripe, WCAG 1.4.11'

interface Pair {
  readonly kind: PairKind
  readonly foreground: ColorToken
  readonly background: ColorToken
  readonly usedBy: string
  readonly exemption?: Exemption
}

const minimumOf: Readonly<Record<PairKind, number>> = { text: 4.5, nonText: 3 }

const themes: ReadonlyArray<Theme> = ['light', 'dark']

const pairs: ReadonlyArray<Pair> = [
  {
    kind: 'text',
    foreground: 'umber',
    background: 'surface',
    usedBy: 'SlotsStrip idle cell, FiefSwitcher other fief',
  },
  {
    kind: 'text',
    foreground: 'umber',
    background: 'surface-raised',
    usedBy: 'AppShell title, AuthPanel title, TextLink, FiefScreen address',
  },
  {
    kind: 'text',
    foreground: 'peasants',
    background: 'surface-raised',
    usedBy: 'ResourceBar label',
  },
  { kind: 'text', foreground: 'wood', background: 'surface-raised', usedBy: 'ResourceBar label' },
  { kind: 'text', foreground: 'stone', background: 'surface-raised', usedBy: 'ResourceBar label' },
  { kind: 'text', foreground: 'iron', background: 'surface-raised', usedBy: 'ResourceBar label' },
  { kind: 'text', foreground: 'gold', background: 'surface-raised', usedBy: 'ResourceBar label' },
  { kind: 'text', foreground: 'food', background: 'surface-raised', usedBy: 'ResourceBar label' },
  {
    kind: 'text',
    foreground: 'on-umber',
    background: 'umber',
    usedBy: 'primary Button, CardHeader level pill, BuildSlot badge, PlotTile marker',
  },
  {
    kind: 'text',
    foreground: 'moss',
    background: 'surface',
    usedBy: 'Countdown at zero in WaitingUpgrades',
  },
  {
    kind: 'text',
    foreground: 'moss',
    background: 'surface-raised',
    usedBy: 'Countdown at zero in BuildSlot',
  },
  { kind: 'text', foreground: 'moss', background: 'moss-soft', usedBy: 'BuildSlot just finished' },
  {
    kind: 'text',
    foreground: 'on-moss',
    background: 'moss',
    usedBy: 'CardHeader max-level pill, BuildSlot just finished badge',
  },
  {
    kind: 'text',
    foreground: 'river',
    background: 'surface-raised',
    usedBy: 'AppShell current navigation link',
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
    foreground: 'ink-faint',
    background: 'surface-sunken',
    usedBy: 'disabled Button and NumberField',
    exemption: 'inactive component, WCAG 1.4.3',
  },
  {
    kind: 'nonText',
    foreground: 'moss',
    background: 'moss-soft',
    usedBy: 'MarchSent, NoticeBanner outcome and BuildSlot frames',
  },
  {
    kind: 'nonText',
    foreground: 'on-umber',
    background: 'umber',
    usedBy: 'NoticeToggle thumb when on',
  },
  {
    kind: 'nonText',
    foreground: 'river',
    background: 'surface',
    usedBy: 'own PlotTile frame against the map',
  },
  {
    kind: 'nonText',
    foreground: 'river',
    background: 'surface-raised',
    usedBy: 'own PlotTile frame, FiefSwitcher current entry frame',
  },
  {
    kind: 'nonText',
    foreground: 'wood',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'stone',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'iron',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'gold',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'food',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'peasants',
    background: 'surface-raised',
    usedBy: 'resource icon in CostList, ArtCard and FiefSwitcher chip',
  },
  {
    kind: 'nonText',
    foreground: 'wood',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track',
  },
  {
    kind: 'nonText',
    foreground: 'stone',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track',
  },
  {
    kind: 'nonText',
    foreground: 'iron',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track',
  },
  {
    kind: 'nonText',
    foreground: 'gold',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track',
  },
  {
    kind: 'nonText',
    foreground: 'food',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track',
  },
  {
    kind: 'nonText',
    foreground: 'rust',
    background: 'surface-sunken',
    usedBy: 'ResourceBar track of a full store',
  },
  {
    kind: 'nonText',
    foreground: 'slate',
    background: 'surface-sunken',
    usedBy: 'BuildSlot, RecruitSlot, MarchSlot and SlotsStrip track',
  },
  {
    kind: 'nonText',
    foreground: 'ochre',
    background: 'surface',
    usedBy: 'PlotTile camp icon',
    exemption: 'decorative icon beside its text, WCAG 1.4.11',
  },
  {
    kind: 'nonText',
    foreground: 'ochre',
    background: 'surface-raised',
    usedBy: 'NoticeBanner mail icon',
    exemption: 'decorative icon beside its text, WCAG 1.4.11',
  },
  {
    kind: 'nonText',
    foreground: 'ochre',
    background: 'surface',
    usedBy: 'NoticeBanner left stripe against the page',
    exemption: 'decorative stripe, WCAG 1.4.11',
  },
  {
    kind: 'nonText',
    foreground: 'ochre',
    background: 'surface-raised',
    usedBy: 'NoticeBanner left stripe against the banner',
    exemption: 'decorative stripe, WCAG 1.4.11',
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

it('keeps every declared text pair at 4.5:1 or more in both themes', () => {
  expect(checkedPairsUnderMinimum('text')).toEqual([])
})

it('keeps every declared non-text pair at 3:1 or more in both themes', () => {
  expect(checkedPairsUnderMinimum('nonText')).toEqual([])
})

it('exempts only a pair that falls under its minimum in some theme', () => {
  const needlessExemptions = pairs
    .filter((pair) => pair.exemption !== undefined)
    .filter((pair) => themes.every((theme) => ratioOf(pair, theme) >= minimumOf[pair.kind]))
    .map((pair) => `${pair.foreground} on ${pair.background} (${pair.usedBy})`)

  expect(needlessExemptions).toEqual([])
})
