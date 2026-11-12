import type { Instant } from '@mygame/domain'
import type { TownWithSchool } from './TownReader'

export type TownReading = TownWithSchool & {
  readonly at: Instant
}
