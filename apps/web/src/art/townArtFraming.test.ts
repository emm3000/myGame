import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { artFramingOf } from './artFramingOf'
import { townArtOf } from './townDrawablesOf'

const drawings = townArtOf().map(({ sourcePath, svg, family }) => ({
  name: basename(sourcePath, '.svg'),
  svg,
  family,
}))

const places = drawings.filter(({ family }) => family === 'places')

const wastes = drawings.filter(({ family }) => family === 'waste')

describe('the town art framing', () => {
  it('draws the seven places', () => {
    expect(places.map(({ name }) => name).sort()).toEqual([
      'factory',
      'farm',
      'homes',
      'office',
      'powerStation',
      'school',
      'storage',
    ])
  })

  for (const drawing of places) {
    const framing = artFramingOf(drawing.svg, 'places')

    it(`stands ${drawing.name} on the base line at y 140`, () => {
      expect(framing.baseLine).toBe(140)
    })

    it(`keeps ${drawing.name} over half of the frame's width`, () => {
      expect(framing.widthShare).toBeGreaterThan(0.5)
    })

    it(`keeps every window of ${drawing.name} on its silhouette`, () => {
      expect(framing.windowsOffSilhouette).toBe(0)
    })

    it(`keeps every window of ${drawing.name} clear of the others`, () => {
      expect(framing.overlappingWindows).toBe(0)
    })
  }
})

describe('the waste art framing', () => {
  it('draws the three waste sizes', () => {
    expect(wastes.map(({ name }) => name)).toEqual(['waste-1', 'waste-2', 'waste-3'])
  })

  for (const drawing of wastes) {
    it(`stands ${drawing.name} on the base line at y 140`, () => {
      expect(artFramingOf(drawing.svg, 'waste').baseLine).toBe(140)
    })
  }

  it('draws each waste size wider and taller than the one before', () => {
    const framings = wastes.map(({ svg }) => artFramingOf(svg, 'waste'))
    const isGrowing = framings.every(
      (framing, index) =>
        index === 0 ||
        (framing.widthShare > (framings[index - 1]?.widthShare ?? 1) &&
          framing.heightShare > (framings[index - 1]?.heightShare ?? 1)),
    )

    expect(isGrowing).toBe(true)
  })
})
