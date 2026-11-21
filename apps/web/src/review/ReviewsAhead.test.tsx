import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PlayerCopyContext } from '../copy/PlayerCopyContext'
import { playerCopyOf } from '../copy/playerCopyOf'
import type { Label } from '../design-system/Label'
import { ReviewsAhead } from './ReviewsAhead'

const noReviewsDue: Label = {
  text: 'No reviews due.',
  language: 'en',
  translation: { text: 'No hay repasos pendientes.', language: 'es' },
}

it('draws its line in English and then in Spanish, each in its own language', () => {
  render(
    <PlayerCopyContext.Provider value={playerCopyOf({ scaffold: 'es', chromePhase: 'both' })}>
      <ReviewsAhead line={noReviewsDue} nextReview={undefined} />
    </PlayerCopyContext.Provider>,
  )

  expect([
    screen.getByText('No reviews due.').getAttribute('lang'),
    screen.getByText('No hay repasos pendientes.').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
