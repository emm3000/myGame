import { describe, expect, it } from 'vitest'
import { DigestSchema } from './index'

const vadoGris = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  name: 'Vado Gris',
  events: [
    {
      kind: 'upgradeFinished',
      building: 'sawmill',
      level: 2,
      occurredAt: '2026-10-06T09:00:00.000Z',
    },
  ],
  stores: [{ resource: 'wood', fullSince: '2026-10-06T10:00:00.000Z' }],
}

const digest = {
  acknowledgedAt: '2026-10-06T08:00:00.000Z',
  isDue: true,
  fiefs: [vadoGris],
}

describe('DigestSchema', () => {
  it('parses what happened across the fiefs since the acknowledgement', () => {
    expect(DigestSchema.parse(digest)).toEqual(digest)
  })

  it('rejects a digest that carries its player id', () => {
    const withPlayerId = { ...digest, playerId: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e' }

    expect(DigestSchema.safeParse(withPlayerId).success).toBe(false)
  })

  it('rejects a fief entry without its stores', () => {
    const { stores: _, ...withoutStores } = vadoGris

    expect(DigestSchema.safeParse({ ...digest, fiefs: [withoutStores] }).success).toBe(false)
  })

  it('rejects a store without the instant it filled', () => {
    const fief = { ...vadoGris, stores: [{ resource: 'wood' }] }

    expect(DigestSchema.safeParse({ ...digest, fiefs: [fief] }).success).toBe(false)
  })

  it('rejects an event the chronicle does not know', () => {
    const fief = { ...vadoGris, events: [{ kind: 'harvest', occurredAt: digest.acknowledgedAt }] }

    expect(DigestSchema.safeParse({ ...digest, fiefs: [fief] }).success).toBe(false)
  })
})
