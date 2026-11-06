import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { artFramingOf } from './artFramingOf'
import { townArtOf } from './townDrawablesOf'

const drawings = townArtOf().map(({ sourcePath, svg }) => ({
  name: basename(sourcePath, '.svg'),
  svg,
}))

describe('the town art framing', () => {
  it('draws the seven places', () => {
    expect(drawings.map(({ name }) => name).sort()).toEqual([
      'factory',
      'farm',
      'homes',
      'office',
      'powerStation',
      'school',
      'storage',
    ])
  })

  for (const drawing of drawings) {
    const framing = artFramingOf(drawing.svg)

    it(`stands ${drawing.name} on the base line at y 140`, () => {
      expect(framing.baseLine).toBe(140)
    })

    it(`keeps ${drawing.name} over half of the frame's width`, () => {
      expect(framing.widthShare).toBeGreaterThan(0.5)
    })

    it(`keeps every window of ${drawing.name} on its silhouette`, () => {
      expect(framing.windowsOffSilhouette).toBe(0)
    })
  }
})
