import type { Fief } from './Fief'
import type { FiefEvent } from './FiefEvent'

export type ChangedFief = {
  readonly fief: Fief
  readonly events: ReadonlyArray<FiefEvent>
}
