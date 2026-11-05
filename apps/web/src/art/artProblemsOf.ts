import type { ArtTag } from './ArtTag'
import { artPalette } from './artPalette'
import { artTagsOf } from './artTagsOf'

export const maxArtBytes = 12 * 1024

const allowedAttributes: Readonly<Record<string, ReadonlyArray<string>>> = {
  svg: ['xmlns', 'viewBox'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'fill'],
  circle: ['cx', 'cy', 'r', 'fill'],
  ellipse: ['cx', 'cy', 'rx', 'ry', 'fill'],
  polygon: ['points', 'fill'],
  path: ['d', 'fill'],
}

function viewBoxProblemsOf(root: ArtTag | undefined): ReadonlyArray<string> {
  if (root?.name !== 'svg') {
    return ['the file does not open with <svg>']
  }
  const [minX, minY, width, height] = (root.attributes.viewBox ?? '').split(/\s+/).map(Number)
  if (minX !== 0 || minY !== 0 || width === undefined || width <= 0 || width !== height) {
    return [`the viewBox "${root.attributes.viewBox ?? ''}" is not a square from 0 0`]
  }
  return []
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
    : [...strayAttributes, `fill ${fill} is off the palette`]
}

export function artProblemsOf(svg: string): ReadonlyArray<string> {
  const tags = artTagsOf(svg)
  const bytes = new TextEncoder().encode(svg).length
  const sizeProblems = bytes > maxArtBytes ? [`${bytes} bytes is above ${maxArtBytes}`] : []
  return [
    ...viewBoxProblemsOf(tags[0]),
    ...tags.flatMap((tag, index) => tagProblemsOf(tag, index)),
    ...sizeProblems,
  ]
}
