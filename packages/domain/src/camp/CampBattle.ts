import type { PlotAddress } from '../fief/PlotAddress'
import type { Instant } from '../time/Instant'

export type CampBattle = PlotAddress & {
  readonly strength: number
  readonly foughtAt: Instant
}
