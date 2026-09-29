import type { Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import type { ForageTerms } from '../ports/BuildingCatalog'
import { forageLootOfSeconds } from './forageLootOfSeconds'

const SECONDS_PER_HOUR = 3_600

export const forageLootOf = (
  terrain: Terrain,
  infantry: number,
  stayHours: number,
  forage: ForageTerms,
): Stocks => forageLootOfSeconds(terrain, infantry, stayHours * SECONDS_PER_HOUR, forage)
