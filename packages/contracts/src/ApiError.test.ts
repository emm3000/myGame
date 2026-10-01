import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from './index'

describe('ApiErrorSchema', () => {
  it('parses an error with a known kind', () => {
    const queueFullError = { kind: 'QueueFull', message: 'Tu cola de obras está llena.' }

    expect(ApiErrorSchema.parse(queueFullError)).toEqual(queueFullError)
  })

  it('parses the refusal of a blank fief name', () => {
    const blankFiefNameError = { kind: 'BlankFiefName', message: 'Tu feudo necesita un nombre.' }

    expect(ApiErrorSchema.parse(blankFiefNameError)).toEqual(blankFiefNameError)
  })

  it('parses the refusal of a party short at home', () => {
    const unitsShortError = {
      kind: 'NotEnoughUnitsAtHome',
      message: 'Necesitas 6 jinetes en casa y tienes 2. Ajusta la marcha.',
    }

    expect(ApiErrorSchema.parse(unitsShortError)).toEqual(unitsShortError)
  })

  it('rejects the infantry-only refusal of the single-kind wire', () => {
    const infantryShortError = {
      kind: 'NotEnoughInfantryAtHome',
      message: 'No tienes infantes en casa suficientes para esa marcha.',
    }

    expect(ApiErrorSchema.safeParse(infantryShortError).success).toBe(false)
  })

  it('rejects a fief overview with an unknown error kind', () => {
    const queueBusyError = { kind: 'QueueBusy', message: 'La obra ya está en marcha.' }

    expect(ApiErrorSchema.safeParse(queueBusyError).success).toBe(false)
  })
})
