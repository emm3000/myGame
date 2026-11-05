import { describe, expect, it } from 'vitest'
import { palette } from '../design/tokens'
import { artFramingOf, sceneShapeCount } from './artFramingOf'

const sky = palette['scene-sky'].light
const brick = palette['scene-brick'].light

const sceneOf = (): string =>
  Array.from(
    { length: sceneShapeCount },
    () => `<rect x="0" y="0" width="200" height="200" fill="${sky}"/>`,
  ).join('')

const drawingOf = (subject: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${sceneOf()}${subject}</svg>`

describe('artFramingOf', () => {
  it('measures the subject alone, leaving the scene out', () => {
    const framing = artFramingOf(
      drawingOf(`<rect x="50" y="20" width="100" height="160" fill="${brick}"/>`),
    )

    expect([framing.widthShare, framing.heightShare]).toEqual([0.5, 0.8])
  })

  it('places the subject by the center of everything it draws', () => {
    const framing = artFramingOf(
      drawingOf(
        `<circle cx="40" cy="100" r="20" fill="${brick}"/><polygon points="140,60 180,140 140,140" fill="${brick}"/>`,
      ),
    )

    expect([framing.centerXShare, framing.centerYShare]).toEqual([0.5, 0.5])
  })

  it('counts the share of the frame the subject covers', () => {
    const framing = artFramingOf(
      drawingOf(`<rect x="0" y="100" width="200" height="100" fill="${brick}"/>`),
    )

    expect(framing.coverageShare).toBe(0.5)
  })

  it('counts an overlap once', () => {
    const overlapping = drawingOf(
      `<rect x="0" y="100" width="200" height="100" fill="${brick}"/><rect x="0" y="150" width="200" height="50" fill="${brick}"/>`,
    )

    expect(artFramingOf(overlapping).coverageShare).toBe(0.5)
  })
})
