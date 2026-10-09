import { ApiErrorKindSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { marchRefusalLineOf } from './marchRefusalLineOf'

const serverLine = 'Una línea que solo el servidor escribe.'

it('reads the server message for every march refusal that carries one', () => {
  const lines = ApiErrorKindSchema.options.map((refusal) => marchRefusalLineOf(refusal, serverLine))

  expect(new Set(lines)).toEqual(new Set([serverLine]))
})

it('reads the line of the refusal when the server sends no message', () => {
  expect(marchRefusalLineOf('PlotHeld', undefined)).toBe(
    'Esa parcela ya tiene feudo. Elige una libre.',
  )
})

it('reads a cargo above the carry without a message as a failed exchange', () => {
  expect(marchRefusalLineOf('CargoAboveCarry', undefined)).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})
