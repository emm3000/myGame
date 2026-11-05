import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { palette } from '../design/tokens'
import { artFramingOf, sceneShapeCount } from './artFramingOf'
import { artTagsOf } from './artTagsOf'
import { townDrawablesOf } from './townDrawablesOf'

const drawings = townDrawablesOf().map((drawable) => ({
  name: basename(drawable.sourcePath, '.svg'),
  svg: drawable.svg,
}))

const sceneTagsOf = (svg: string): string =>
  JSON.stringify(artTagsOf(svg).slice(1, sceneShapeCount))

const familyOf = (name: string): string => name.replace(/-\d+$/, '')
const stepOf = (name: string): number => Number(name.replace(/^.*-/, ''))
const families = [...new Set(drawings.map((drawing) => familyOf(drawing.name)))]

describe('the town art framing', () => {
  for (const drawing of drawings) {
    const framing = artFramingOf(drawing.svg)

    it(`spans 62 to 96 % of the frame on the longer side of ${drawing.name}`, () => {
      const largerSide = Math.max(framing.widthShare, framing.heightShare)

      expect(largerSide >= 0.62 && largerSide <= 0.96).toBe(true)
    })

    it(`centers ${drawing.name} across the frame`, () => {
      expect(Math.abs(framing.centerXShare - 0.5)).toBeLessThanOrEqual(0.06)
    })

    it(`raises ${drawing.name} off the horizon, its middle in the middle band of the frame`, () => {
      expect(Math.abs(framing.centerYShare - 0.5)).toBeLessThanOrEqual(0.14)
    })

    it(`leaves at most 45 % of the frame as empty sky above ${drawing.name}`, () => {
      expect(framing.centerYShare - framing.heightShare / 2).toBeLessThanOrEqual(0.45)
    })

    it(`draws ${drawing.name} over the shared sky, clouds, ground band and ground shadow`, () => {
      const shadow = artTagsOf(drawing.svg)[sceneShapeCount]

      expect([sceneTagsOf(drawing.svg), shadow?.name, shadow?.attributes.fill]).toEqual([
        sceneTagsOf(drawings[0]?.svg ?? ''),
        'ellipse',
        palette['scene-grass-deep'].light,
      ])
    })
  }

  for (const family of families) {
    it(`never covers less of the frame at a higher step of ${family}`, () => {
      const coverages = drawings
        .filter((drawing) => familyOf(drawing.name) === family)
        .sort((first, second) => stepOf(first.name) - stepOf(second.name))
        .map((drawing) => artFramingOf(drawing.svg).coverageShare)

      expect(coverages).toEqual([...coverages].sort((first, second) => first - second))
    })
  }
})
