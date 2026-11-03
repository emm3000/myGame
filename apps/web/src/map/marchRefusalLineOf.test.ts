import { ApiErrorKindSchema } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { marchRefusalLineOf } from './marchRefusalLineOf'

const serverLine = 'Una línea que solo el servidor escribe.'

const shippedLongestStay = 8

it('reads the server message for every march refusal that carries one', () => {
  const lines = ApiErrorKindSchema.options.map((refusal) =>
    marchRefusalLineOf(refusal, serverLine, shippedLongestStay),
  )

  expect(new Set(lines)).toEqual(new Set([serverLine]))
})

it('reads the line of the refusal when the server sends no message', () => {
  expect(marchRefusalLineOf('PlotHeld', undefined, shippedLongestStay)).toBe(
    'Esa parcela ya tiene feudo. Elige una libre.',
  )
})

it('names the longest stay of the forage terms when a stay refusal has no message', () => {
  expect(marchRefusalLineOf('StayOutOfRange', undefined, 6)).toBe(
    'Una marcha forrajea de 1 a 6 horas enteras. Ajusta las horas.',
  )
})

it('reads a cargo above the carry without a message as a failed exchange', () => {
  expect(marchRefusalLineOf('CargoAboveCarry', undefined, shippedLongestStay)).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})
