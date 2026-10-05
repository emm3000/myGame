import type { FiefSettings } from '../ports/BuildingCatalog'

export const plainUnits: FiefSettings['units'] = {
  infantry: {
    cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
    durationSeconds: 90,
    peasantOccupancy: 1,
    strength: 1,
    carry: 48,
    roadPercent: 100,
    barracksLevel: 1,
  },
  cavalry: {
    cost: { wood: 30, stone: 0, iron: 40, gold: 20, food: 80 },
    durationSeconds: 300,
    peasantOccupancy: 2,
    strength: 2,
    carry: 120,
    roadPercent: 50,
    barracksLevel: 3,
  },
  archer: {
    cost: { wood: 40, stone: 0, iron: 10, gold: 5, food: 40 },
    durationSeconds: 150,
    peasantOccupancy: 1,
    strength: 1,
    carry: 24,
    roadPercent: 100,
    barracksLevel: 2,
  },
  settler: {
    cost: { wood: 1000, stone: 1000, iron: 600, gold: 100, food: 1000 },
    durationSeconds: 7200,
    peasantOccupancy: 4,
    strength: 0,
    carry: 0,
    roadPercent: 100,
    barracksLevel: 5,
  },
}
