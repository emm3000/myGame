import { describe, expect, it } from 'vitest'
import { vectorDrawableOf } from './vectorDrawableOf'

const peach = '#f5c9a8'
const onBlock = '#15141a'

const drawingOf = (shapes: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 142">${shapes}</svg>`

const pathDataIn = (shape: string): string =>
  vectorDrawableOf(drawingOf(shape)).match(/android:pathData="([^"]*)"/)?.[1] ?? ''

describe('vectorDrawableOf', () => {
  it('sizes the vector to the width and the height of the viewBox', () => {
    const drawable = vectorDrawableOf(drawingOf(''))

    expect(
      ['width="100dp"', 'height="142dp"', 'viewportWidth="100"', 'viewportHeight="142"'].filter(
        (line) => !drawable.includes(`android:${line}`),
      ),
    ).toEqual([])
  })

  it('keeps each shape as a path with its fill, in drawing order', () => {
    const drawable = vectorDrawableOf(
      drawingOf(
        `<rect x="0" y="0" width="9" height="9" fill="${peach}"/><polygon points="0,0 9,9 0,9" fill="${onBlock}"/>`,
      ),
    )

    expect([...drawable.matchAll(/android:fillColor="([^"]*)"/g)].map(([, fill]) => fill)).toEqual([
      peach,
      onBlock,
    ])
  })

  it('draws a plain rect as a closed box', () => {
    expect(pathDataIn(`<rect x="2" y="3" width="10" height="5" fill="${peach}"/>`)).toBe(
      'M2 3h10v5h-10z',
    )
  })

  it('rounds a rect corner with its rx', () => {
    expect(pathDataIn(`<rect x="0" y="0" width="10" height="6" rx="2" fill="${peach}"/>`)).toBe(
      'M2 0h6a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z',
    )
  })

  it('draws a circle as two half arcs', () => {
    expect(pathDataIn(`<circle cx="10" cy="20" r="4" fill="${peach}"/>`)).toBe(
      'M6 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z',
    )
  })

  it('joins polygon points into a closed path', () => {
    expect(pathDataIn(`<polygon points="0,9 4.5,0 9,9" fill="${peach}"/>`)).toBe('M0,9L4.5,0L9,9z')
  })
})
