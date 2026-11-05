import { describe, expect, it } from 'vitest'
import { palette } from '../design/tokens'
import { artProblemsOf, maxArtBytes } from './artProblemsOf'

const sky = palette['scene-sky'].light
const food = palette.food.light

const drawingOf = (shapes: string, viewBox = '0 0 240 240'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  ${shapes}\n</svg>\n`

describe('artProblemsOf', () => {
  it('accepts flat shapes filled from the scene colors and the resource accents', () => {
    const cleanDrawing = drawingOf(
      `<rect x="0" y="0" width="240" height="240" fill="${sky}"/><circle cx="9" cy="9" r="4" fill="${food}"/>`,
    )

    expect(artProblemsOf(cleanDrawing)).toEqual([])
  })

  it('refuses a fill off the palette', () => {
    const offPalette = drawingOf('<rect x="0" y="0" width="9" height="9" fill="red"/>')

    expect(artProblemsOf(offPalette)).toEqual(['fill red is off the palette'])
  })

  it('refuses a dark-scheme accent, since the art keeps the light one in both schemes', () => {
    const darkAccent = drawingOf(
      `<rect x="0" y="0" width="9" height="9" fill="${palette.food.dark}"/>`,
    )

    expect(artProblemsOf(darkAccent)).toEqual([`fill ${palette.food.dark} is off the palette`])
  })

  it('refuses a shape without a fill', () => {
    expect(artProblemsOf(drawingOf('<rect x="0" y="0" width="9" height="9"/>'))).toEqual([
      '<rect> has no fill',
    ])
  })

  it('refuses a viewBox that is not square', () => {
    expect(artProblemsOf(drawingOf('', '0 0 240 180'))).toEqual([
      'the viewBox "0 0 240 180" is not a square from 0 0',
    ])
  })

  it('refuses text', () => {
    expect(artProblemsOf(drawingOf(`<text x="9" y="9" fill="${sky}">`))).toEqual([
      '<text> is not allowed',
    ])
  })

  it('refuses a gradient', () => {
    expect(artProblemsOf(drawingOf('<linearGradient x1="0">'))).toEqual([
      '<linearGradient> is not allowed',
    ])
  })

  it('refuses a filter', () => {
    expect(artProblemsOf(drawingOf('<filter x="0">'))).toEqual(['<filter> is not allowed'])
  })

  it('refuses a path, whose curves the framing check cannot measure', () => {
    expect(artProblemsOf(drawingOf(`<path d="M0 0L9 9z" fill="${sky}"/>`))).toEqual([
      '<path> is not allowed',
    ])
  })

  it('refuses a raster image', () => {
    expect(artProblemsOf(drawingOf('<image href="a.png"/>'))).toEqual(['<image> is not allowed'])
  })

  it('refuses a stroke, which only a fill may color', () => {
    const stroked = drawingOf(`<circle cx="9" cy="9" r="4" fill="${sky}" stroke="${food}"/>`)

    expect(artProblemsOf(stroked)).toEqual(['<circle> carries stroke'])
  })

  it('refuses a file that does not open with the svg element', () => {
    expect(artProblemsOf(`<rect x="0" y="0" width="9" height="9" fill="${sky}"/>`)).toContain(
      'the file does not open with <svg>',
    )
  })

  it('refuses a file above 12 KB', () => {
    const shape = `<rect x="0" y="0" width="9" height="9" fill="${sky}"/>`
    const heavy = drawingOf(shape.repeat(Math.ceil(maxArtBytes / shape.length)))

    expect(artProblemsOf(heavy)).toEqual([
      `${new TextEncoder().encode(heavy).length} bytes is above 12288`,
    ])
  })
})
