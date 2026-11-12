import { describe, expect, it } from 'vitest'
import { type ArtFraming, artFramingOf } from './artFramingOf'

const placeFramingOf = (svg: string): ArtFraming => artFramingOf(svg, 'places')

const peach = '#f5c9a8'
const onBlock = '#15141a'

const windowAt = (x: number, y: number): string =>
  `<rect x="${x}" y="${y}" width="7" height="9" fill="${onBlock}"/>`

const windowsOnWall = Array.from({ length: 10 }, (_, index) => windowAt(10 + index * 8, 60)).join(
  '',
)

const drawingOf = (silhouette: string, windows = windowsOnWall): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 142">${silhouette}${windows}</svg>`

const wall = `<rect x="0" y="71" width="100" height="71" fill="${peach}"/>`

describe('artFramingOf', () => {
  it('measures the silhouette alone, leaving its windows out', () => {
    const framing = placeFramingOf(
      drawingOf(`<rect x="25" y="71" width="50" height="69" fill="${peach}"/>`, windowsOnWall),
    )

    expect([framing.widthShare, framing.heightShare]).toEqual([0.5, 69 / 142])
  })

  it('reads the base line of the silhouette', () => {
    const framing = placeFramingOf(
      drawingOf(
        `<circle cx="20" cy="100" r="20" fill="${peach}"/><polygon points="60,60 90,140 60,140" fill="${peach}"/>`,
      ),
    )

    expect(framing.baseLine).toBe(140)
  })

  it('counts the share of the frame the silhouette covers', () => {
    expect(placeFramingOf(drawingOf(wall)).coverageShare).toBeCloseTo(0.5, 1)
  })

  it('counts an overlap once', () => {
    const overlapping = `${wall}<rect x="0" y="100" width="100" height="42" fill="${peach}"/>`

    expect(placeFramingOf(drawingOf(overlapping)).coverageShare).toBeCloseTo(0.5, 1)
  })

  it('counts no window off the silhouette when all ten sit on it', () => {
    const tallWall = `<rect x="0" y="40" width="100" height="100" fill="${peach}"/>`

    expect(placeFramingOf(drawingOf(tallWall)).windowsOffSilhouette).toBe(0)
  })

  it('counts a window that leaves the silhouette, which on-block would lose in dark', () => {
    const tallWall = `<rect x="0" y="40" width="100" height="100" fill="${peach}"/>`
    const oneOff = Array.from({ length: 9 }, (_, index) => windowAt(10 + index * 8, 60)).join('')

    expect(
      placeFramingOf(drawingOf(tallWall, `${oneOff}${windowAt(50, 36)}`)).windowsOffSilhouette,
    ).toBe(1)
  })

  it('counts no overlap when the ten windows stand apart', () => {
    expect(placeFramingOf(drawingOf(wall)).overlappingWindows).toBe(0)
  })

  it('counts no overlap for two windows that only touch', () => {
    const nine = Array.from({ length: 9 }, (_, index) => windowAt(10 + index * 8, 80)).join('')

    expect(placeFramingOf(drawingOf(wall, `${nine}${windowAt(10, 89)}`)).overlappingWindows).toBe(0)
  })

  it('counts each window that lands on an earlier one, since its level would change nothing', () => {
    const stacked = Array.from({ length: 10 }, () => windowAt(10, 80)).join('')

    expect(placeFramingOf(drawingOf(wall, stacked)).overlappingWindows).toBe(9)
  })
})

describe('artFramingOf a waste file', () => {
  it('measures every shape of a waste file as its silhouette', () => {
    const heap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 142"><polygon points="25,140 50,100 75,140" fill="${onBlock}"/><circle cx="50" cy="100" r="5" fill="${onBlock}"/></svg>`
    const framing = artFramingOf(heap, 'waste')

    expect([framing.widthShare, framing.baseLine, framing.windowsOffSilhouette]).toEqual([
      0.5, 140, 0,
    ])
  })
})
