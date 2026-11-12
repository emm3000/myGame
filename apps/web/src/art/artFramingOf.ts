import type { ArtFamily } from './ArtFamily'
import type { ArtShape } from './ArtShape'
import { artShapeOf } from './artShapeOf'
import { artTagsOf } from './artTagsOf'
import { type PlaceShapes, placeShapesOf } from './placeShapesOf'

const sampleStep = 2

export type ArtFraming = {
  readonly widthShare: number
  readonly heightShare: number
  readonly baseLine: number
  readonly coverageShare: number
  readonly windowsOffSilhouette: number
  readonly overlappingWindows: number
}

type Bounds = {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

function boundsOf(shape: ArtShape): Bounds {
  switch (shape.kind) {
    case 'box':
      return shape
    case 'circle':
      return {
        left: shape.centerX - shape.radius,
        top: shape.centerY - shape.radius,
        right: shape.centerX + shape.radius,
        bottom: shape.centerY + shape.radius,
      }
    case 'polygon': {
      const xs = shape.points.map(([x]) => x)
      const ys = shape.points.map(([, y]) => y)
      return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
      }
    }
    default:
      return shape satisfies never
  }
}

function isInsidePolygon(
  points: ReadonlyArray<readonly [number, number]>,
  x: number,
  y: number,
): boolean {
  let isInside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [ax, ay] = points[index] ?? [0, 0]
    const [bx, by] = points[previous] ?? [0, 0]
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) {
      isInside = !isInside
    }
  }
  return isInside
}

function covers(shape: ArtShape, x: number, y: number): boolean {
  switch (shape.kind) {
    case 'box':
      return x >= shape.left && x <= shape.right && y >= shape.top && y <= shape.bottom
    case 'circle':
      return (x - shape.centerX) ** 2 + (y - shape.centerY) ** 2 <= shape.radius ** 2
    case 'polygon':
      return isInsidePolygon(shape.points, x, y)
    default:
      return shape satisfies never
  }
}

function coverageShareOf(shapes: ReadonlyArray<ArtShape>, width: number, height: number): number {
  let covered = 0
  let sampled = 0
  for (let y = sampleStep / 2; y < height; y += sampleStep) {
    for (let x = sampleStep / 2; x < width; x += sampleStep) {
      sampled += 1
      covered += shapes.some((shape) => covers(shape, x, y)) ? 1 : 0
    }
  }
  return covered / sampled
}

function isOnSilhouette(window: Bounds, silhouette: ReadonlyArray<ArtShape>): boolean {
  const corners = [
    [window.left, window.top],
    [window.right, window.top],
    [window.left, window.bottom],
    [window.right, window.bottom],
  ] as const
  return corners.every(([x, y]) => silhouette.some((shape) => covers(shape, x, y)))
}

function overlaps(first: Bounds, second: Bounds): boolean {
  return (
    first.left < second.right &&
    second.left < first.right &&
    first.top < second.bottom &&
    second.top < first.bottom
  )
}

const wasteShapesOf = (svg: string): PlaceShapes => {
  const [, ...shapes] = artTagsOf(svg)
  return { silhouette: shapes, windows: [] }
}

const familyShapesOf: Readonly<Record<ArtFamily, (svg: string) => PlaceShapes>> = {
  places: placeShapesOf,
  waste: wasteShapesOf,
}

export function artFramingOf(svg: string, family: ArtFamily): ArtFraming {
  const [root] = artTagsOf(svg)
  const [, , width = 0, height = 0] = (root?.attributes.viewBox ?? '').split(/\s+/).map(Number)
  const { silhouette: silhouetteTags, windows } = familyShapesOf[family](svg)
  const silhouette = silhouetteTags.map(artShapeOf)
  const bounds = silhouette.map(boundsOf)
  const windowBounds = windows.map(artShapeOf).map(boundsOf)
  const left = Math.min(...bounds.map((b) => b.left))
  const top = Math.min(...bounds.map((b) => b.top))
  const right = Math.max(...bounds.map((b) => b.right))
  const bottom = Math.max(...bounds.map((b) => b.bottom))
  return {
    widthShare: (right - left) / width,
    heightShare: (bottom - top) / height,
    baseLine: bottom,
    coverageShare: coverageShareOf(silhouette, width, height),
    windowsOffSilhouette: windowBounds.filter((window) => !isOnSilhouette(window, silhouette))
      .length,
    overlappingWindows: windowBounds.filter((window, index) =>
      windowBounds.slice(0, index).some((earlier) => overlaps(window, earlier)),
    ).length,
  }
}
