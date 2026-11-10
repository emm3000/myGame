import { expect, it } from 'vitest'
import { refusalLineOf } from './refusalLineOf'

it('reads a refusal the api did not answer as a failed exchange', () => {
  expect(refusalLineOf('Unexpected', undefined)).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})

it('reads a kind that owes params but carries none as a failed exchange', () => {
  expect(refusalLineOf('WaitingListFull')).toBe(
    'No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.',
  )
})

it('renders a full waiting list from its cap', () => {
  expect(refusalLineOf('WaitingListFull', { kind: 'WaitingListFull', params: { cap: 4 } })).toBe(
    'La lista de espera ya tiene 4 obras. Espera a que termine alguna.',
  )
})

it('renders too few free people from the people the work needs and the free ones', () => {
  expect(
    refusalLineOf('NotEnoughPeople', {
      kind: 'NotEnoughPeople',
      params: { requiredPeople: 1, freePeople: 0 },
    }),
  ).toBe('Esta obra necesita 1 persona libre y tienes 0. Sube el nivel de tus hogares.')
})

it('renders a town shortfall as its line', () => {
  expect(
    refusalLineOf('NotEnoughResources', {
      kind: 'NotEnoughResources',
      params: { missing: { money: 40, food: 0, power: 0, material: 0 } },
    }),
  ).toBe('No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas.')
})

it('renders a top level from its level', () => {
  expect(
    refusalLineOf('TopLevelReached', {
      kind: 'TopLevelReached',
      params: { building: 'farm', level: 10 },
    }),
  ).toBe('Este edificio ya está en su nivel más alto, el 10.')
})

it('renders work that is not there from its level', () => {
  expect(
    refusalLineOf('BuildingWorkNotFound', {
      kind: 'BuildingWorkNotFound',
      params: { building: 'farm', level: 2 },
    }),
  ).toBe('La obra del nivel 2 ya no está en la lista. Quizá ya terminó.')
})

it('renders a second town from its line', () => {
  expect(refusalLineOf('PlayerAlreadyHoldsTown', { kind: 'PlayerAlreadyHoldsTown' })).toBe(
    'Ya tienes un pueblo. Solo puedes tener uno.',
  )
})
