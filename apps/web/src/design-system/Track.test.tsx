import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Track } from './Track'

it('fills the track when the total is zero', () => {
  render(<Track value={0} total={0} fillClass="fill-wood" />)

  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
})

it('fills the track in proportion to the total', () => {
  render(<Track value={31} total={50} fillClass="fill-wood" />)

  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('62')
})
