import { BuildingKindSchema } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { palette } from '../design/tokens'
import { placeArtOf } from './placeArtOf'

const fillsOf = (place: Parameters<typeof placeArtOf>[0], level: number): ReadonlyArray<string> =>
  placeArtOf(place, level).map(({ attributes }) => attributes.fill ?? '')

const windowsIn = (fills: ReadonlyArray<string>): number =>
  fills.filter((fill) => fill === palette['on-block'].light).length

const silhouetteHueOf = (place: Parameters<typeof placeArtOf>[0]): string | undefined =>
  fillsOf(place, 1)[0]

describe('placeArtOf', () => {
  it('draws a place not built in surface-sunken with no windows', () => {
    expect([...new Set(fillsOf('homes', 0))]).toEqual(['var(--surface-sunken)'])
  })

  it('takes its hue and one window at level 1', () => {
    const fills = fillsOf('farm', 1)

    expect([fills[0], windowsIn(fills)]).toEqual([palette['block-mint'].light, 1])
  })

  it('draws ten windows at level 10', () => {
    expect(windowsIn(fillsOf('office', 10))).toBe(10)
  })

  it('adds one window per level', () => {
    expect([2, 3, 9].map((level) => windowsIn(fillsOf('factory', level)))).toEqual([2, 3, 9])
  })

  it("fixes the hue by the place's order", () => {
    const order = [
      'homes',
      'farm',
      'school',
      'office',
      'factory',
      'powerStation',
      'storage',
    ] as const

    expect(order.map(silhouetteHueOf)).toEqual(
      [
        'block-peach',
        'block-mint',
        'block-periwinkle',
        'block-lavender',
        'block-peach',
        'block-mint',
        'block-periwinkle',
      ].map((token) => palette[token as keyof typeof palette].light),
    )
  })

  it('draws every place of the contract', () => {
    expect(BuildingKindSchema.options.filter((place) => placeArtOf(place, 1).length < 2)).toEqual(
      [],
    )
  })
})
