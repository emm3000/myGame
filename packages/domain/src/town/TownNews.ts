import type { DomainError } from '../DomainError'
import type { Result } from '../Result'
import type { TownEvent } from './TownEvent'
import type { TownId } from './TownId'

export interface TownNews {
  record(townId: TownId, events: ReadonlyArray<TownEvent>): Promise<Result<void, DomainError>>
}
