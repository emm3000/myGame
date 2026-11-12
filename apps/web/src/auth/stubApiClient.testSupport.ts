import type { Player, RegionMap, TownOverview } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'

export const knownPlayer: Player = {
  id: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  email: 'aldonza@example.com',
  emailVerified: true,
}

const placeAtLevel = (level: number): TownOverview['buildings']['farm'] => ({
  level,
  nextLevel: {
    level: level + 1,
    cost: { money: 60, food: 40, power: 0, material: 80 },
    durationSeconds: 300,
    people: 2,
  },
})

export const knownTown: TownOverview = {
  name: 'Maple Falls',
  label: 'town',
  site: { region: 1, area: 1, site: 1 },
  terrain: 'fields',
  season: null,
  stocks: {
    money: { amount: 500, ratePerHour: 60, capacity: 5000, fullAt: null },
    food: { amount: 400, ratePerHour: 120, capacity: 5000, fullAt: null },
    power: { amount: 300, ratePerHour: 20, capacity: 5000, fullAt: null },
    material: { amount: 600, ratePerHour: 90, capacity: 5000, fullAt: null },
  },
  people: { supplied: 120, free: 24, atWork: 96 },
  buildings: {
    homes: placeAtLevel(1),
    farm: placeAtLevel(0),
    factory: placeAtLevel(0),
    powerStation: placeAtLevel(0),
    storage: placeAtLevel(0),
    school: placeAtLevel(1),
    office: placeAtLevel(0),
  },
  work: { slot: null, waitingList: [], cap: 2 },
  hiring: {
    order: null,
    hires: { worker: 0, truck: 0 },
    terms: {
      worker: {
        cost: { money: 40, food: 0, power: 0, material: 0 },
        secondsPerHire: 60,
        people: 1,
        requiredOfficeLevel: 1,
      },
      truck: {
        cost: { money: 80, food: 40, power: 40, material: 60 },
        secondsPerHire: 180,
        people: 1,
        requiredOfficeLevel: 3,
      },
    },
  },
  job: null,
  lessons: [],
  skills: [],
  lessonSlot: null,
  learning: { cap: 15, inLearning: 0, retainedWords: null },
  nextStep: { kind: 'caughtUp', goal: null },
  tip: null,
  nextDueAt: null,
  readAt: '2026-11-10T09:00:00.000Z',
}

export const knownAreaMap: RegionMap = {
  region: 1,
  area: 1,
  lastArea: 2,
  terrain: 'fields',
  sites: [
    { site: 1, town: { name: 'Maple Falls', isOwn: true }, waste: null },
    { site: 2, town: null, waste: null },
    { site: 3, town: { name: 'Cedar Creek', isOwn: false }, waste: null },
  ],
}

export const stubApiClient = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  signUp: async () => ({ ok: true, value: knownPlayer }),
  signIn: async () => ({ ok: true, value: knownPlayer }),
  signOut: async () => ({ ok: true, value: undefined }),
  currentPlayer: async () => undefined,
  town: async () => ({ ok: true, value: knownTown }),
  townNews: async () => ({ ok: true, value: { items: [] } }),
  foundTown: async () => ({ ok: true, value: knownTown }),
  startBuildingWork: async () => ({ ok: true, value: knownTown }),
  stopBuildingWork: async () => ({ ok: true, value: knownTown }),
  placeHiringOrder: async () => ({ ok: true, value: knownTown }),
  stopHiringOrder: async () => ({ ok: true, value: knownTown }),
  regionMap: async () => ({ ok: true, value: knownAreaMap }),
  quoteJob: async () => ({
    ok: true,
    value: { pay: { money: 0, food: 0, power: 0, material: 0 } },
  }),
  sendJob: async () => ({ ok: true, value: knownTown }),
  callJobBack: async () => ({ ok: true, value: knownTown }),
  quoteCleanUp: async () => ({
    ok: true,
    value: {
      strength: 1,
      waste: 1,
      pay: { money: 0, food: 0, power: 0, material: 0 },
      covers: true,
    },
  }),
  sendCleanUp: async () => ({ ok: true, value: knownTown }),
  startLesson: async () => ({ ok: true, value: knownTown }),
  stopLesson: async () => ({ ok: true, value: knownTown }),
  reviews: async () => ({
    ok: true,
    value: { due: [], readFirst: [], nextDueAt: null, readAt: '2026-09-22T12:00:00.000Z' },
  }),
  reviewHint: async () => ({ ok: true, value: { words: [{ firstLetter: 's', letterCount: 6 }] } }),
  answerReview: async () => ({ ok: true, value: { verdict: { kind: 'nearMiss' } } }),
  report: async () => ({
    ok: true,
    value: { dueCount: 0, due: [], readFirst: [], nextDueAt: null, news: [] },
  }),
  closeReport: async () => undefined,
  markTipSeen: async () => undefined,
  dismissGuidance: async () => undefined,
  verifyEmail: async () => undefined,
  resendVerification: async () => undefined,
  forgotPassword: async () => undefined,
  resetPassword: async () => undefined,
  ...overrides,
})
