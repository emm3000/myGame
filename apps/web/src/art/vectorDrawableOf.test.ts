import { describe, expect, it } from 'vitest'
import { palette } from '../design/tokens'
import { vectorDrawableOf } from './vectorDrawableOf'

const sky = palette['scene-sky'].light

const pathDataIn = (shape: string): string => {
  const drawable = vectorDrawableOf(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${shape}</svg>`,
  )
  return drawable.match(/android:pathData="([^"]*)"/)?.[1] ?? ''
}

describe('vectorDrawableOf', () => {
  it('sizes the vector to the square viewBox', () => {
    const drawable = vectorDrawableOf(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"></svg>',
    )

    expect(drawable).toContain('android:viewportWidth="240"')
  })

  it('keeps each shape as a path with its fill, in drawing order', () => {
    const drawable = vectorDrawableOf(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect x="0" y="0" width="9" height="9" fill="${sky}"/><path d="M0 0L9 9z" fill="${palette.food.light}"/></svg>`,
    )

    expect([...drawable.matchAll(/android:fillColor="([^"]*)"/g)].map(([, fill]) => fill)).toEqual([
      sky,
      palette.food.light,
    ])
  })

  it('draws a plain rect as a closed box', () => {
    expect(pathDataIn(`<rect x="2" y="3" width="10" height="5" fill="${sky}"/>`)).toBe(
      'M2 3h10v5h-10z',
    )
  })

  it('rounds a rect corner with its rx', () => {
    expect(pathDataIn(`<rect x="0" y="0" width="10" height="6" rx="2" fill="${sky}"/>`)).toBe(
      'M2 0h6a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z',
    )
  })

  it('draws a circle as two half arcs', () => {
    expect(pathDataIn(`<circle cx="10" cy="20" r="4" fill="${sky}"/>`)).toBe(
      'M6 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z',
    )
  })

  it('draws an ellipse as two half arcs with both radii', () => {
    expect(pathDataIn(`<ellipse cx="10" cy="20" rx="6" ry="3" fill="${sky}"/>`)).toBe(
      'M4 20a6 3 0 1 0 12 0a6 3 0 1 0 -12 0z',
    )
  })

  it('joins polygon points into a closed path', () => {
    expect(pathDataIn(`<polygon points="0,9 4.5,0 9,9" fill="${sky}"/>`)).toBe('M0,9L4.5,0L9,9z')
  })

  it('passes path data through unchanged', () => {
    expect(pathDataIn(`<path d="M0,9 Q4,0 9,9 z" fill="${sky}"/>`)).toBe('M0,9 Q4,0 9,9 z')
  })
})
