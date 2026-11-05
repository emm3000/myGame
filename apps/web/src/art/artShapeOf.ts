import type { ArtShape } from './ArtShape'
import type { ArtTag } from './ArtTag'

function numberOf(tag: ArtTag, name: string): number {
  return Number(tag.attributes[name] ?? 0)
}

function pointsOf(tag: ArtTag): ReadonlyArray<readonly [number, number]> {
  return (tag.attributes.points ?? '')
    .trim()
    .split(/\s+/)
    .map((pair): readonly [number, number] => {
      const [x, y] = pair.split(',').map(Number)
      return [x ?? 0, y ?? 0]
    })
}

export function artShapeOf(tag: ArtTag): ArtShape {
  switch (tag.name) {
    case 'rect': {
      const left = numberOf(tag, 'x')
      const top = numberOf(tag, 'y')
      return {
        kind: 'box',
        left,
        top,
        right: left + numberOf(tag, 'width'),
        bottom: top + numberOf(tag, 'height'),
      }
    }
    case 'circle':
      return {
        kind: 'oval',
        centerX: numberOf(tag, 'cx'),
        centerY: numberOf(tag, 'cy'),
        radiusX: numberOf(tag, 'r'),
        radiusY: numberOf(tag, 'r'),
      }
    case 'ellipse':
      return {
        kind: 'oval',
        centerX: numberOf(tag, 'cx'),
        centerY: numberOf(tag, 'cy'),
        radiusX: numberOf(tag, 'rx'),
        radiusY: numberOf(tag, 'ry'),
      }
    default:
      return { kind: 'polygon', points: pointsOf(tag) }
  }
}
