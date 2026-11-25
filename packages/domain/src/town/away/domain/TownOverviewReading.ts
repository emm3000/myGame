import type { TownReading } from '../../domain/TownReading'
import type { Stocks } from '../../resources/domain/Stocks'

export type TownOverviewReading = TownReading & {
  readonly away: Stocks | undefined
}
