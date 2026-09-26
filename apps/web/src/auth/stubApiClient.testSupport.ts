import type { FiefOverview, Player } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'

export const knownPlayer: Player = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldonza@example.com',
}

const resource = (amount: number): FiefOverview['resources']['wood'] => ({
  amount,
  ratePerHour: 360,
  capacity: 20000,
})

const buildingAtLevel = (level: number): FiefOverview['buildings']['sawmill'] => ({
  level,
  nextLevel: {
    level: level + 1,
    cost: { wood: 90, stone: 23, iron: 0, gold: 0, food: 0 },
    durationSeconds: 192,
    peasants: 1,
  },
})

export const knownFief: FiefOverview = {
  name: 'Fuenteclara',
  coordinates: { kingdom: 1, province: 3, plot: 12 },
  terrain: 'uplands',
  resources: {
    wood: resource(1000),
    stone: resource(800),
    iron: resource(300),
    gold: resource(120),
    food: resource(600),
  },
  buildings: {
    sawmill: buildingAtLevel(1),
    quarry: buildingAtLevel(1),
    ironMine: buildingAtLevel(0),
    farm: buildingAtLevel(1),
    warehouse: buildingAtLevel(0),
  },
  peasants: {
    supplied: 12,
    occupied: 4,
    free: 8,
    projectedSupplied: 12,
    projectedOccupied: 4,
    projectedFree: 8,
  },
  slot: { kind: 'idle' },
  queue: { entries: [], cap: 4 },
  readAt: '2026-09-22T12:00:00.000Z',
}

export const stubApiClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  signUp: async () => ({ ok: true, value: knownPlayer }),
  signIn: async () => ({ ok: true, value: knownPlayer }),
  signOut: async () => ({ ok: true, value: undefined }),
  currentPlayer: async () => undefined,
  fief: async () => ({ ok: true, value: knownFief }),
  enqueueUpgrade: async () => ({ ok: true, value: knownFief }),
  cancelUpgrade: async () => ({ ok: true, value: knownFief }),
  ...overrides,
})
