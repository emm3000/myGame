import { describe, expect, it } from 'vitest'
import { FiefListSchema } from './index'

const vadoGris = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  name: 'Vado Gris',
  coordinates: { kingdom: 1, province: 3, plot: 12 },
}

describe('FiefListSchema', () => {
  it('parses the fiefs of a lord', () => {
    expect(FiefListSchema.parse({ fiefs: [vadoGris] })).toEqual({ fiefs: [vadoGris] })
  })

  it('rejects a fief list entry without an id', () => {
    const withoutId = { name: vadoGris.name, coordinates: vadoGris.coordinates }

    expect(FiefListSchema.safeParse({ fiefs: [withoutId] }).success).toBe(false)
  })

  it('rejects a fief list entry that carries its player id', () => {
    const withPlayerId = { ...vadoGris, playerId: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e' }

    expect(FiefListSchema.safeParse({ fiefs: [withPlayerId] }).success).toBe(false)
  })
})
