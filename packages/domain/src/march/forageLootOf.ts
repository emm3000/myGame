import type { Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import type { ForageTerms } from '../ports/BuildingCatalog'
import { forageLootOfMilliseconds } from './forageLootOfMilliseconds'

const MILLISECONDS_PER_HOUR = 3_600_000

export const forageLootOf = (
  terrain: Terrain,
  infantry: number,
  stayHours: number,
  forage: ForageTerms,
): Stocks => forageLootOfMilliseconds(terrain, infantry, stayHours * MILLISECONDS_PER_HOUR, forage)
