import type { MarchTerms, Stocks } from '../fief/Fief'
import type { Terrain } from '../fief/Terrain'
import { forageLootOfMilliseconds } from './forageLootOfMilliseconds'

const MILLISECONDS_PER_HOUR = 3_600_000

export const forageLootOf = (
  terrain: Terrain,
  infantry: number,
  stayHours: number,
  terms: MarchTerms,
): Stocks => forageLootOfMilliseconds(terrain, infantry, stayHours * MILLISECONDS_PER_HOUR, terms)
