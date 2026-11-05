import type { ArtShape } from './ArtShape'
import { artShapeOf } from './artShapeOf'
import { artTagsOf } from './artTagsOf'

export const sceneShapeCount = 10

const sampleStep = 2

export type ArtFraming = {
  readonly widthShare: number
  readonly heightShare: number
  readonly centerXShare: number
  readonly centerYShare: number
  readonly coverageShare: number
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
    case 'oval':
      return {
        left: shape.centerX - shape.radiusX,
        top: shape.centerY - shape.radiusY,
        right: shape.centerX + shape.radiusX,
        bottom: shape.centerY + shape.radiusY,
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
    case 'oval':
      return (
        ((x - shape.centerX) / shape.radiusX) ** 2 + ((y - shape.centerY) / shape.radiusY) ** 2 <= 1
      )
    case 'polygon':
      return isInsidePolygon(shape.points, x, y)
    default:
      return shape satisfies never
  }
}

function coverageShareOf(shapes: ReadonlyArray<ArtShape>, side: number): number {
  let covered = 0
  let sampled = 0
  for (let y = sampleStep / 2; y < side; y += sampleStep) {
    for (let x = sampleStep / 2; x < side; x += sampleStep) {
      sampled += 1
      covered += shapes.some((shape) => covers(shape, x, y)) ? 1 : 0
    }
  }
  return covered / sampled
}

export function artFramingOf(svg: string): ArtFraming {
  const [root, ...tags] = artTagsOf(svg)
  const side = Number((root?.attributes.viewBox ?? '').split(/\s+/)[2])
  const subject = tags.slice(sceneShapeCount).map(artShapeOf)
  const bounds = subject.map(boundsOf)
  const left = Math.max(0, Math.min(...bounds.map((b) => b.left)))
  const top = Math.max(0, Math.min(...bounds.map((b) => b.top)))
  const right = Math.min(side, Math.max(...bounds.map((b) => b.right)))
  const bottom = Math.min(side, Math.max(...bounds.map((b) => b.bottom)))
  return {
    widthShare: (right - left) / side,
    heightShare: (bottom - top) / side,
    centerXShare: (left + right) / 2 / side,
    centerYShare: (top + bottom) / 2 / side,
    coverageShare: coverageShareOf(subject, side),
  }
}
