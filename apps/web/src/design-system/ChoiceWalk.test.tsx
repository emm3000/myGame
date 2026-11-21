import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ChoiceWalk, type ChoiceWalkLines } from './ChoiceWalk'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'

const send: Label = {
  text: 'Send',
  language: 'en',
  translation: { text: 'Enviar', language: 'es' },
}

const lines: ChoiceWalkLines = {
  heading: lineLabelOf('Band 1', 'en'),
  prompt: lineLabelOf('What does it mean?', 'en'),
  next: lineLabelOf('Next', 'en'),
  choose: lineLabelOf('Choose one.', 'en'),
  send,
  progressOf: (number, total) => lineLabelOf(`${number} of ${total}`, 'en'),
}

it('draws its send line as English over Spanish, each line marked with its language', () => {
  render(
    <ChoiceWalk
      items={[]}
      lines={lines}
      choiceLanguage="en"
      word={{ ref: () => undefined, focus: () => undefined }}
      isSending={false}
      onSend={() => undefined}
    />,
  )

  expect(screen.getByRole('button', { name: 'Send Enviar' })).toBeDefined()
  expect([
    screen.getByText('Send').getAttribute('lang'),
    screen.getByText('Enviar').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
