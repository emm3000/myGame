import type { MarchTerms, Stocks } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { Terrain } from '../fief/Terrain'
import { forageLootOfMilliseconds } from './forageLootOfMilliseconds'

const MILLISECONDS_PER_HOUR = 3_600_000

export const forageLootOf = (
  terrain: Terrain,
  units: UnitCountsByKind,
  stayHours: number,
  terms: MarchTerms,
): Stocks => forageLootOfMilliseconds(terrain, units, stayHours * MILLISECONDS_PER_HOUR, terms)
