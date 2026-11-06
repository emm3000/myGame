import type { ArtTag } from './ArtTag'

function numberOf(tag: ArtTag, name: string): number {
  return Number(tag.attributes[name] ?? 0)
}

function written(value: number): string {
  return String(Number(value.toFixed(3)))
}

function roundedRectOf(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = written(radius)
  const across = written(width - 2 * radius)
  const down = written(height - 2 * radius)
  const corner = (dx: number, dy: number): string =>
    `a${r} ${r} 0 0 1 ${written(dx)} ${written(dy)}`
  return [
    `M${written(x + radius)} ${written(y)}h${across}`,
    corner(radius, radius),
    `v${down}`,
    corner(-radius, radius),
    `h-${across}`,
    corner(-radius, -radius),
    `v-${down}`,
    corner(radius, -radius),
    'z',
  ].join('')
}

function rectOf(tag: ArtTag): string {
  const x = numberOf(tag, 'x')
  const y = numberOf(tag, 'y')
  const width = numberOf(tag, 'width')
  const height = numberOf(tag, 'height')
  const radius = Math.min(numberOf(tag, 'rx'), width / 2, height / 2)
  if (radius > 0) {
    return roundedRectOf(x, y, width, height, radius)
  }
  return `M${written(x)} ${written(y)}h${written(width)}v${written(height)}h-${written(width)}z`
}

function circleOf(tag: ArtTag): string {
  const cx = numberOf(tag, 'cx')
  const cy = numberOf(tag, 'cy')
  const r = numberOf(tag, 'r')
  const radii = `${written(r)} ${written(r)}`
  return `M${written(cx - r)} ${written(cy)}a${radii} 0 1 0 ${written(2 * r)} 0a${radii} 0 1 0 -${written(2 * r)} 0z`
}

function polygonOf(tag: ArtTag): string {
  const pairs = (tag.attributes.points ?? '').trim().split(/\s+/)
  return `M${pairs.join('L')}z`
}

export function pathDataOf(tag: ArtTag): string {
  switch (tag.name) {
    case 'rect':
      return rectOf(tag)
    case 'circle':
      return circleOf(tag)
    default:
      return polygonOf(tag)
  }
}
