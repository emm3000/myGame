import { expect, it } from 'vitest'
import { refusalLineOf } from './refusalLineOf'

it('renders a party short at home from its unit and both counts', () => {
  expect(
    refusalLineOf('NotEnoughUnitsAtHome', {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'cavalry', count: 7, atHome: 6 },
    }),
  ).toBe('Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha.')
})

it('agrees the unit label with a count of one', () => {
  expect(
    refusalLineOf('NotEnoughUnitsAtHome', {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'settler', count: 1, atHome: 0 },
    }),
  ).toBe('Necesitas 1 colono en casa y tienes 0. Ajusta la marcha.')
})

it('renders a stay out of range from its maxStayHours', () => {
  expect(
    refusalLineOf('StayOutOfRange', {
      kind: 'StayOutOfRange',
      params: { maxStayHours: 6 },
    }),
  ).toBe('Una marcha forrajea de 1 a 6 horas enteras. Ajusta las horas.')
})

it('renders a barracks too low from its unit and required level', () => {
  expect(
    refusalLineOf('BarracksTooLow', {
      kind: 'BarracksTooLow',
      params: { unit: 'settler', requiredBarracksLevel: 5 },
    }),
  ).toBe('Tu cuartel aún no llega al nivel 5 que piden los colonos. Mejóralo primero.')
})

it('renders the fief cap from its cap', () => {
  expect(refusalLineOf('FiefCapReached', { kind: 'FiefCapReached', params: { cap: 3 } })).toBe(
    'Solo puedes tener 3 feudos. Deja al colono en casa.',
  )
})

it('renders a cargo above the carry from both amounts', () => {
  expect(
    refusalLineOf('CargoAboveCarry', {
      kind: 'CargoAboveCarry',
      params: { cargo: 721, carry: 720 },
    }),
  ).toBe('La carga suma 721 y tus hombres llevan hasta 720. Quita carga o envía más hombres.')
})

it('renders a kind without params from its line', () => {
  expect(refusalLineOf('PlotHeld', { kind: 'PlotHeld' })).toBe(
    'Esa parcela ya tiene feudo. Elige una libre.',
  )
})

it('reads a refusal the api did not answer as a failed exchange', () => {
  expect(refusalLineOf('Unexpected', undefined)).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})

it('reads a kind that owes params but carries none as a failed exchange', () => {
  expect(refusalLineOf('BarracksTooLow')).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})

it('reads a march refusal that owes params but arrives without its error as a failed exchange', () => {
  expect(refusalLineOf('NotEnoughUnitsAtHome')).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})
