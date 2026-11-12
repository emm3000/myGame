import type { ArtFamily } from './ArtFamily'
import type { ArtTag } from './ArtTag'
import { artPalette, blockFills, windowFill } from './artPalette'
import { artTagsOf } from './artTagsOf'
import { placeShapesOf, placeViewBox } from './placeShapesOf'

export const maxArtBytes = 12 * 1024

const allowedAttributes: Readonly<Record<string, ReadonlyArray<string>>> = {
  svg: ['xmlns', 'viewBox'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'fill'],
  circle: ['cx', 'cy', 'r', 'fill'],
  polygon: ['points', 'fill'],
}

function viewBoxProblemsOf(root: ArtTag | undefined): ReadonlyArray<string> {
  if (root?.name !== 'svg') {
    return ['the file does not open with <svg>']
  }
  const viewBox = root.attributes.viewBox ?? ''
  return viewBox === placeViewBox ? [] : [`the viewBox "${viewBox}" is not ${placeViewBox}`]
}

function tagProblemsOf(tag: ArtTag, index: number): ReadonlyArray<string> {
  const allowed = allowedAttributes[tag.name]
  if (allowed === undefined || (tag.name === 'svg') !== (index === 0)) {
    return [`<${tag.name}> is not allowed`]
  }
  const strayAttributes = Object.keys(tag.attributes)
    .filter((name) => !allowed.includes(name))
    .map((name) => `<${tag.name}> carries ${name}`)
  if (tag.name === 'svg') {
    return strayAttributes
  }
  const fill = tag.attributes.fill
  if (fill === undefined) {
    return [...strayAttributes, `<${tag.name}> has no fill`]
  }
  return artPalette.has(fill)
    ? strayAttributes
    : [...strayAttributes, `fill ${fill} is off the blocks`]
}

const paletteFillsOf = (shapes: ReadonlyArray<ArtTag>): ReadonlyArray<string> => [
  ...new Set(
    shapes.flatMap(({ attributes: { fill } }) => (fill && artPalette.has(fill) ? [fill] : [])),
  ),
]

function placeProblemsOf(svg: string): ReadonlyArray<string> {
  const { silhouette, windows } = placeShapesOf(svg)
  if (silhouette.length === 0) {
    return ['the file holds no silhouette']
  }
  const hues = paletteFillsOf(silhouette)
  return [
    ...hues
      .filter((fill) => !blockFills.has(fill))
      .map((fill) => `the silhouette fill ${fill} is not a block`),
    ...(hues.length > 1 ? [`the silhouette takes ${hues.length} hues, not one`] : []),
    ...paletteFillsOf(windows)
      .filter((fill) => fill !== windowFill)
      .map((fill) => `the window fill ${fill} is not on-block`),
  ]
}

function wasteProblemsOf(svg: string): ReadonlyArray<string> {
  const [, ...shapes] = artTagsOf(svg)
  if (shapes.length === 0) {
    return ['the file holds no silhouette']
  }
  const fills = paletteFillsOf(shapes)
  return fills.length > 1 ? [`the silhouette takes ${fills.length} fills, not one`] : []
}

const familyProblemsOf: Readonly<Record<ArtFamily, (svg: string) => ReadonlyArray<string>>> = {
  places: placeProblemsOf,
  waste: wasteProblemsOf,
}

export function artProblemsOf(svg: string, family: ArtFamily): ReadonlyArray<string> {
  const tags = artTagsOf(svg)
  const bytes = new TextEncoder().encode(svg).length
  const sizeProblems = bytes > maxArtBytes ? [`${bytes} bytes is above ${maxArtBytes}`] : []
  return [
    ...viewBoxProblemsOf(tags[0]),
    ...tags.flatMap((tag, index) => tagProblemsOf(tag, index)),
    ...familyProblemsOf[family](svg),
    ...sizeProblems,
  ]
}
