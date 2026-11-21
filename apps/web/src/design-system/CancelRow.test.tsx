import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CancelRow } from './CancelRow'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'

const refund: Label = {
  text: 'You get back 40 food.',
  language: 'en',
  translation: { text: 'Recuperas 40 de comida.', language: 'es' },
}

it('draws its refund line in English and then in Spanish, each in its own language', () => {
  render(
    <CancelRow
      cancel={{
        label: lineLabelOf('Cancel', 'en'),
        accessibleName: lineLabelOf('Cancel the farm work', 'en'),
        isWaiting: false,
        onCancel: () => undefined,
      }}
      refund={refund}
    />,
  )

  expect([
    screen.getByText('You get back 40 food.').getAttribute('lang'),
    screen.getByText('Recuperas 40 de comida.').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
