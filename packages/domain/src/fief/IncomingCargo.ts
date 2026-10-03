import type { Instant } from '../time/Instant'
import type { Stocks } from './Fief'
import type { FiefId } from './FiefId'

export type IncomingCargo = {
  readonly fromFiefId: FiefId
  readonly name: string
  readonly province: number
  readonly plot: number
  readonly cargo: Stocks
  readonly arrivesAt: Instant
}
