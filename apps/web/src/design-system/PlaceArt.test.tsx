import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PlaceArt } from './PlaceArt'
import { placeArtOf } from './placeArtOf'

it('stays out of the accessibility tree, since the level is written beside it', () => {
  render(<PlaceArt shapes={placeArtOf('homes', 3)} />)

  expect(screen.queryByRole('img')).toBeNull()
})
