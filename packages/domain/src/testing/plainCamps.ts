import type { FiefSettings } from '../ports/BuildingCatalog'

export const plainCamps: FiefSettings['camps'] = {
  campFraction: 0.2,
  lootPerStrength: 60,
  tiers: {
    1: { maxStrength: 6, regrowHours: 6 },
    2: { maxStrength: 15, regrowHours: 12 },
    3: { maxStrength: 40, regrowHours: 24 },
  },
}
