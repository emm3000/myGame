import { assert, describe, expect, it } from 'vitest'
import { FiefName } from './FiefName'

describe('FiefName', () => {
  it('trims the name the player chose', () => {
    const result = FiefName.create('  Vado Viejo  ')

    assert(result.ok)
    expect(result.value.value).toBe('Vado Viejo')
  })

  it('refuses an empty name', () => {
    expect(FiefName.create('')).toEqual({ ok: false, error: { kind: 'BlankFiefName' } })
  })

  it('refuses a name made only of whitespace', () => {
    expect(FiefName.create(' \t ')).toEqual({ ok: false, error: { kind: 'BlankFiefName' } })
  })
})
