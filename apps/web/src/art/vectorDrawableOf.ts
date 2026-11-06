import type { ArtTag } from './ArtTag'
import { artTagsOf } from './artTagsOf'
import { pathDataOf } from './pathDataOf'

function vectorPathOf(tag: ArtTag): string {
  return [
    '    <path',
    `        android:fillColor="${tag.attributes.fill ?? ''}"`,
    `        android:pathData="${pathDataOf(tag)}" />`,
  ].join('\n')
}

export function vectorDrawableOf(svg: string): string {
  const [root, ...shapes] = artTagsOf(svg)
  const [, , width = '', height = ''] = (root?.attributes.viewBox ?? '').split(/\s+/)
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
    `    android:width="${width}dp"`,
    `    android:height="${height}dp"`,
    `    android:viewportWidth="${width}"`,
    `    android:viewportHeight="${height}">`,
    ...shapes.map(vectorPathOf),
    '</vector>',
    '',
  ].join('\n')
}
