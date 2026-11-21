import type { Instant } from '@mygame/domain'
import type { TownWithSchool } from './ports/TownReader'

export type TownReading = TownWithSchool & {
  readonly at: Instant
}
