import type { Instant } from '@mygame/domain'
import type { TownWithSchool } from './application/ports/TownReader'

export type TownReading = TownWithSchool & {
  readonly at: Instant
}
