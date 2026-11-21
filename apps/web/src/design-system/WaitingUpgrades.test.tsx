import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'
import { WaitingUpgrades } from './WaitingUpgrades'

const waitingList: Label = {
  text: 'Waiting list',
  language: 'en',
  translation: { text: 'Lista de espera', language: 'es' },
}

it('names its list by the English line and then the Spanish one', () => {
  render(
    <WaitingUpgrades
      title={waitingList}
      emptiesAt="13:38"
      upgrades={[]}
      finishedLabel={lineLabelOf('Done', 'en')}
    />,
  )

  expect(screen.getByRole('list', { name: 'Waiting list Lista de espera' })).toBeDefined()
})
