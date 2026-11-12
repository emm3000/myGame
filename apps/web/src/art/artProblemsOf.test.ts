import { describe, expect, it } from 'vitest'
import { artProblemsOf, maxArtBytes } from './artProblemsOf'

const placeArtProblemsOf = (svg: string): ReadonlyArray<string> => artProblemsOf(svg, 'places')

const wasteArtProblemsOf = (svg: string): ReadonlyArray<string> => artProblemsOf(svg, 'waste')

const peach = '#f5c9a8'
const mint = '#bfe3cb'
const onBlock = '#15141a'
const scheme = '#f4f3f1'

const silhouette = `<rect x="10" y="40" width="80" height="100" fill="${peach}"/>`

const windows = (fill = onBlock): string =>
  Array.from(
    { length: 10 },
    (_, index) => `<rect x="${12 + index * 7}" y="50" width="5" height="9" fill="${fill}"/>`,
  ).join('')

const drawingOf = (shapes: string, viewBox = '0 0 100 142'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  ${shapes}\n</svg>\n`

describe('artProblemsOf', () => {
  it('accepts a silhouette in one block and ten windows in on-block', () => {
    expect(placeArtProblemsOf(drawingOf(`${silhouette}${windows()}`))).toEqual([])
  })

  it('accepts a silhouette of rect, circle and polygon', () => {
    const shapes = `${silhouette}<circle cx="50" cy="30" r="9" fill="${peach}"/><polygon points="10,40 50,20 90,40" fill="${peach}"/>`

    expect(placeArtProblemsOf(drawingOf(`${shapes}${windows()}`))).toEqual([])
  })

  it('refuses a viewBox other than the silhouette frame', () => {
    expect(placeArtProblemsOf(drawingOf(`${silhouette}${windows()}`, '0 0 240 240'))).toEqual([
      'the viewBox "0 0 240 240" is not 0 0 100 142',
    ])
  })

  it('refuses a fill off the blocks', () => {
    const offPalette = `<rect x="0" y="0" width="9" height="9" fill="red"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(offPalette))).toEqual(['fill red is off the blocks'])
  })

  it('refuses a color that only one scheme holds', () => {
    const schemeColor = `<rect x="0" y="0" width="9" height="9" fill="${scheme}"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(schemeColor))).toEqual([`fill ${scheme} is off the blocks`])
  })

  it('refuses a silhouette in two hues', () => {
    const twoHues = `${silhouette}<circle cx="50" cy="30" r="9" fill="${mint}"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(twoHues))).toEqual(['the silhouette takes 2 hues, not one'])
  })

  it('refuses a silhouette in on-block', () => {
    const inked = `<rect x="10" y="40" width="80" height="100" fill="${onBlock}"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(inked))).toEqual([
      `the silhouette fill ${onBlock} is not a block`,
    ])
  })

  it('refuses a window that is not in on-block', () => {
    expect(placeArtProblemsOf(drawingOf(`${silhouette}${windows(peach)}`))).toContain(
      `the window fill ${peach} is not on-block`,
    )
  })

  it('refuses a file with no silhouette before its windows', () => {
    expect(placeArtProblemsOf(drawingOf(windows()))).toEqual(['the file holds no silhouette'])
  })

  it('refuses a file with fewer than ten windows', () => {
    const shortOfWindows = `${silhouette}<rect x="12" y="50" width="5" height="9" fill="${onBlock}"/>`

    expect(placeArtProblemsOf(drawingOf(shortOfWindows))).toEqual(['the file holds no silhouette'])
  })

  it('refuses a shape without a fill', () => {
    const unfilled = `<rect x="0" y="0" width="9" height="9"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(unfilled))).toEqual(['<rect> has no fill'])
  })

  it('refuses an ellipse', () => {
    const oval = `<ellipse cx="9" cy="9" rx="4" ry="2" fill="${peach}"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(oval))).toContain('<ellipse> is not allowed')
  })

  it('refuses text', () => {
    const lettered = `${silhouette}<text x="9" y="9" fill="${peach}">${windows()}`

    expect(placeArtProblemsOf(drawingOf(lettered))).toContain('<text> is not allowed')
  })

  it('refuses a gradient', () => {
    expect(placeArtProblemsOf(drawingOf(`<linearGradient x1="0">${windows()}`))).toContain(
      '<linearGradient> is not allowed',
    )
  })

  it('refuses a filter', () => {
    expect(placeArtProblemsOf(drawingOf(`<filter x="0">${windows()}`))).toContain(
      '<filter> is not allowed',
    )
  })

  it('refuses a path, whose curves the framing check cannot measure', () => {
    expect(
      placeArtProblemsOf(drawingOf(`<path d="M0 0L9 9z" fill="${peach}"/>${windows()}`)),
    ).toContain('<path> is not allowed')
  })

  it('refuses a raster image', () => {
    expect(placeArtProblemsOf(drawingOf(`<image href="a.png"/>${windows()}`))).toContain(
      '<image> is not allowed',
    )
  })

  it('refuses a stroke, which only a fill may color', () => {
    const stroked = `<circle cx="9" cy="9" r="4" fill="${peach}" stroke="${mint}"/>${windows()}`

    expect(placeArtProblemsOf(drawingOf(stroked))).toEqual(['<circle> carries stroke'])
  })

  it('refuses a file that does not open with the svg element', () => {
    expect(placeArtProblemsOf(`${silhouette}${windows()}`)).toContain(
      'the file does not open with <svg>',
    )
  })

  it('refuses a file above 12 KB', () => {
    const heavy = drawingOf(
      `${silhouette.repeat(Math.ceil(maxArtBytes / silhouette.length))}${windows()}`,
    )

    expect(placeArtProblemsOf(heavy)).toEqual([
      `${new TextEncoder().encode(heavy).length} bytes is above 12288`,
    ])
  })
})

describe('artProblemsOf a waste file', () => {
  const heap = `<polygon points="20,140 50,100 80,140" fill="${onBlock}"/>`

  it('accepts one silhouette in one fill, with no windows', () => {
    expect(
      wasteArtProblemsOf(drawingOf(`${heap}<circle cx="50" cy="100" r="6" fill="${onBlock}"/>`)),
    ).toEqual([])
  })

  it('refuses a waste file in two fills', () => {
    expect(
      wasteArtProblemsOf(drawingOf(`${heap}<circle cx="50" cy="100" r="6" fill="${peach}"/>`)),
    ).toEqual(['the silhouette takes 2 fills, not one'])
  })

  it('refuses a waste file with no shape', () => {
    expect(wasteArtProblemsOf(drawingOf(''))).toEqual(['the file holds no silhouette'])
  })

  it('holds a waste file to the frame and the palette of a place', () => {
    expect(
      wasteArtProblemsOf(
        drawingOf('<rect x="0" y="0" width="9" height="9" fill="red"/>', '0 0 9 9'),
      ),
    ).toEqual(['the viewBox "0 0 9 9" is not 0 0 100 142', 'fill red is off the blocks'])
  })
})
