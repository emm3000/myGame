import { describe, expect, it } from 'vitest'
import { placeAtLevelOf } from './placeAtLevelOf'
import { placeShapesOf } from './placeShapesOf'

const windows = Array.from(
  { length: 10 },
  (_, index) => `  <rect x="${index}" y="50" width="7" height="9" fill="#15141a"/>`,
).join('\n')

const place = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 142">
  <polygon points="0,0 9,9 0,9" fill="#c6d3f5"/>
  <circle cx="9" cy="9" r="4" fill="#c6d3f5"/>
${windows}
</svg>
`

const shapesAt = (level: number): number =>
  [...placeAtLevelOf(place, level).matchAll(/<(rect|circle|polygon)/g)].length

describe('placeAtLevelOf', () => {
  it('keeps the silhouette alone at level 0', () => {
    expect(shapesAt(0)).toBe(2)
  })

  it('keeps the first window at level 1', () => {
    const [firstWindow] = placeShapesOf(place).windows

    expect(placeAtLevelOf(place, 1)).toContain(`x="${firstWindow?.attributes.x}"`)
    expect(shapesAt(1)).toBe(3)
  })

  it('keeps the whole file at level 10', () => {
    expect(placeAtLevelOf(place, 10)).toBe(place)
  })

  it('closes the file it cuts', () => {
    expect(placeAtLevelOf(place, 3).endsWith('</svg>\n')).toBe(true)
  })
})
