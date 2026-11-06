import { numberBefore } from '../design/android/numberBefore'
import { sizes } from '../design/tokens'
import type { ArtTag } from './ArtTag'
import { artTagsOf } from './artTagsOf'
import { placeViewBox } from './placeShapesOf'
import { vectorPathOf } from './vectorDrawableOf'

type Bounds = {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

function numberOf(tag: ArtTag, name: string): number {
  return Number(tag.attributes[name] ?? 0)
}

function written(value: number): string {
  return String(Number(value.toFixed(3)))
}

function rectBoundsOf(tag: ArtTag): Bounds {
  const left = numberOf(tag, 'x')
  const top = numberOf(tag, 'y')
  return {
    left,
    top,
    right: left + numberOf(tag, 'width'),
    bottom: top + numberOf(tag, 'height'),
  }
}

function circleBoundsOf(tag: ArtTag): Bounds {
  const cx = numberOf(tag, 'cx')
  const cy = numberOf(tag, 'cy')
  const r = numberOf(tag, 'r')
  return { left: cx - r, top: cy - r, right: cx + r, bottom: cy + r }
}

function polygonBoundsOf(tag: ArtTag): Bounds {
  const points = (tag.attributes.points ?? '')
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
  const xs = points.map(([x = 0]) => x)
  const ys = points.map(([, y = 0]) => y)
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  }
}

function boundsOf(tag: ArtTag): Bounds {
  switch (tag.name) {
    case 'rect':
      return rectBoundsOf(tag)
    case 'circle':
      return circleBoundsOf(tag)
    default:
      return polygonBoundsOf(tag)
  }
}

function placeCardScale(): number {
  const [, , , height = '1'] = placeViewBox.split(/\s+/)
  return numberBefore('px', sizes['place-card']) / Number(height)
}

export function wordDrawableOf(svg: string): string {
  const [, ...shapes] = artTagsOf(svg)
  const bounds = shapes.map(boundsOf)
  const left = Math.min(...bounds.map((shape) => shape.left))
  const top = Math.min(...bounds.map((shape) => shape.top))
  const width = Math.max(...bounds.map((shape) => shape.right)) - left
  const height = Math.max(...bounds.map((shape) => shape.bottom)) - top
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
    `    android:width="${written(width * placeCardScale())}dp"`,
    `    android:height="${written(height * placeCardScale())}dp"`,
    `    android:viewportWidth="${written(width)}"`,
    `    android:viewportHeight="${written(height)}">`,
    `    <group android:translateX="${written(-left)}" android:translateY="${written(-top)}">`,
    ...shapes.map(vectorPathOf),
    '    </group>',
    '</vector>',
    '',
  ].join('\n')
}
