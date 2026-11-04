import { expect, it } from 'vitest'
import { marchRefusalLineOf } from './marchRefusalLineOf'

it('renders a party short at home from its unit and both counts', () => {
  expect(
    marchRefusalLineOf('NotEnoughUnitsAtHome', {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'cavalry', count: 7, atHome: 6 },
    }),
  ).toBe('Necesitas 7 jinetes en casa y tienes 6. Ajusta la marcha.')
})

it('agrees the unit label with a count of one', () => {
  expect(
    marchRefusalLineOf('NotEnoughUnitsAtHome', {
      kind: 'NotEnoughUnitsAtHome',
      params: { unit: 'settler', count: 1, atHome: 0 },
    }),
  ).toBe('Necesitas 1 colono en casa y tienes 0. Ajusta la marcha.')
})

it('renders a stay out of range from its maxStayHours', () => {
  expect(
    marchRefusalLineOf('StayOutOfRange', {
      kind: 'StayOutOfRange',
      params: { maxStayHours: 6 },
    }),
  ).toBe('Una marcha forrajea de 1 a 6 horas enteras. Ajusta las horas.')
})

it('renders a barracks too low from its unit and required level', () => {
  expect(
    marchRefusalLineOf('BarracksTooLow', {
      kind: 'BarracksTooLow',
      params: { unit: 'settler', requiredBarracksLevel: 5 },
    }),
  ).toBe('Tu cuartel aún no llega al nivel 5 que piden los colonos. Mejóralo primero.')
})

it('renders the fief cap from its cap', () => {
  expect(marchRefusalLineOf('FiefCapReached', { kind: 'FiefCapReached', params: { cap: 3 } })).toBe(
    'Solo puedes tener 3 feudos. Deja al colono en casa.',
  )
})

it('renders a cargo above the carry from both amounts', () => {
  expect(
    marchRefusalLineOf('CargoAboveCarry', {
      kind: 'CargoAboveCarry',
      params: { cargo: 721, carry: 720 },
    }),
  ).toBe('La carga suma 721 y tus hombres llevan hasta 720. Quita carga o envía más hombres.')
})

it('renders a kind without params from its line', () => {
  expect(marchRefusalLineOf('PlotHeld', { kind: 'PlotHeld' })).toBe(
    'Esa parcela ya tiene feudo. Elige una libre.',
  )
})

it('reads a refusal the api did not answer as a failed exchange', () => {
  expect(marchRefusalLineOf('Unexpected', undefined)).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})
