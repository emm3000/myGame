import type { Instant } from '#time/Instant'
import type { TownWithSchool } from './TownReader'

export type TownReading = TownWithSchool & {
  readonly at: Instant
}
