import type { Instant } from '@mygame/domain'
import type { Town } from '@mygame/domain/town'

export type TownReading = {
  readonly town: Town
  readonly at: Instant
}
