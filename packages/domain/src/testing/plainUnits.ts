import type { FiefSettings } from '../ports/BuildingCatalog'

export const plainUnits: FiefSettings['units'] = {
  infantry: {
    cost: { wood: 20, stone: 0, iron: 10, gold: 0, food: 30 },
    durationSeconds: 90,
    peasantOccupancy: 1,
  },
}
