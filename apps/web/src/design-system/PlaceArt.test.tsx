import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PlaceArt } from './PlaceArt'
import { placeArtOf } from './placeArtOf'

it('stays out of the accessibility tree, since the level is written beside it', () => {
  const { container } = render(<PlaceArt shapes={placeArtOf('homes', 3)} />)

  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})
