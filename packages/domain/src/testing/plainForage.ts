import type { FiefSettings } from '../ports/BuildingCatalog'

const noYield = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

export const plainForage: FiefSettings['forage'] = {
  secondsPerProvince: 600,
  secondsPerPlot: 60,
  carryPerInfantry: 48,
  maxStayHours: 8,
  yieldPerHour: {
    lowlands: { ...noYield, food: 3, wood: 3 },
    uplands: { ...noYield, wood: 3, stone: 3 },
    ridges: { ...noYield, stone: 3, iron: 3 },
  },
}
