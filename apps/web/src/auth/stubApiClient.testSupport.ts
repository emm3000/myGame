import type { FiefList, FiefOverview, Player, ProvinceMap } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'

export const knownPlayer: Player = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldonza@example.com',
  emailVerified: true,
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
  id: '9c2b7e1a-5d3f-4a8c-b6e0-1f2d3c4b5a69',
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
    library: buildingAtLevel(0),
    barracks: buildingAtLevel(0),
  },
  peasants: {
    supplied: 12,
    occupied: 4,
    free: 8,
    projectedSupplied: 12,
    projectedOccupied: 4,
    projectedFree: 8,
    lowestFree: 8,
  },
  slot: { kind: 'idle' },
  queue: { entries: [], cap: 4 },
  study: { kind: 'idle' },
  arts: {
    smithing: {
      level: 0,
      resource: 'iron',
      ratePercent: 0,
      nextLevel: {
        level: 1,
        cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
        durationSeconds: 1800,
        requiredLibraryLevel: 1,
        ratePercent: 5,
      },
    },
    masonry: {
      level: 0,
      resource: 'stone',
      ratePercent: 0,
      nextLevel: {
        level: 1,
        cost: { wood: 150, stone: 150, iron: 60, gold: 60, food: 0 },
        durationSeconds: 1800,
        requiredLibraryLevel: 1,
        ratePercent: 5,
      },
    },
  },
  season: null,
  units: { infantry: 0, cavalry: 0, settler: 0 },
  recruitOrder: null,
  recruitTerms: {
    infantry: {
      cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
      peasants: 1,
      perUnitSeconds: 90,
    },
    cavalry: {
      cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
      peasants: 2,
      perUnitSeconds: 300,
    },
    settler: {
      cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
      peasants: 4,
      perUnitSeconds: 7200,
    },
  },
  unitTerms: {
    infantry: { strength: 1, carry: 48, roadPercent: 100, barracksLevel: 1 },
    cavalry: { strength: 2, carry: 120, roadPercent: 50, barracksLevel: 3 },
    settler: { strength: 0, carry: 0, roadPercent: 100, barracksLevel: 5 },
  },
  march: null,
  forageTerms: {
    secondsPerProvince: 600,
    secondsPerPlot: 60,
    maxStayHours: 8,
    yieldPerHour: {
      lowlands: { wood: 3, stone: 0, iron: 0, gold: 0, food: 3 },
      uplands: { wood: 3, stone: 3, iron: 0, gold: 0, food: 0 },
      ridges: { wood: 0, stone: 3, iron: 3, gold: 0, food: 0 },
    },
  },
  combatTerms: {
    lootPerStrength: 60,
    tiers: {
      1: { maxStrength: 6, regrowHours: 6 },
      2: { maxStrength: 15, regrowHours: 12 },
      3: { maxStrength: 40, regrowHours: 24 },
    },
  },
  incomingCargo: null,
  readAt: '2026-09-22T12:00:00.000Z',
}

const heldPlots: Readonly<Record<number, string>> = {
  1: 'Sotoverde',
  3: 'Penalba',
  7: 'Castrofrio',
  12: 'Fuenteclara',
}

export const knownFiefPath = `/feudo/${knownFief.id}`

export const knownFiefList: FiefList = {
  fiefs: [{ id: knownFief.id, name: knownFief.name, coordinates: knownFief.coordinates }],
}

export const knownProvinceMap: ProvinceMap = {
  kingdom: 1,
  province: 3,
  lastProvince: 4,
  terrain: 'ridges',
  plots: Array.from({ length: 15 }, (_, index) => {
    const plot = index + 1
    const name = heldPlots[plot]
    return {
      plot,
      fief: name === undefined ? null : { name, isOwn: plot === 12 },
      camp: null,
      reservation: null,
    }
  }),
}

export const stubApiClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  signUp: async () => ({ ok: true, value: knownPlayer }),
  signIn: async () => ({ ok: true, value: knownPlayer }),
  signOut: async () => ({ ok: true, value: undefined }),
  currentPlayer: async () => undefined,
  fiefs: async () => ({ ok: true, value: knownFiefList }),
  fief: async () => ({ ok: true, value: knownFief }),
  enqueueUpgrade: async () => ({ ok: true, value: knownFief }),
  cancelUpgrade: async () => ({ ok: true, value: knownFief }),
  startStudy: async () => ({ ok: true, value: knownFief }),
  cancelStudy: async () => ({ ok: true, value: knownFief }),
  placeRecruitOrder: async () => ({ ok: true, value: knownFief }),
  cancelRecruitOrder: async () => ({ ok: true, value: knownFief }),
  dispatchMarch: async () => ({ ok: true, value: knownFief }),
  dispatchAttack: async () => ({ ok: true, value: knownFief }),
  dispatchFounding: async () => ({ ok: true, value: knownFief }),
  recallMarch: async () => ({ ok: true, value: knownFief }),
  chronicle: async () => ({ ok: true, value: { events: [] } }),
  provinceMap: async () => ({ ok: true, value: knownProvinceMap }),
  verifyEmail: async () => undefined,
  resendVerification: async () => undefined,
  forgotPassword: async () => undefined,
  resetPassword: async () => undefined,
  ...overrides,
})
