import type { DomainError } from '../DomainError'
import type { FiefEvent } from '../fief/FiefEvent'
import type { FiefId } from '../fief/FiefId'
import type { Result } from '../Result'

export interface ChronicleWriter {
  record(fiefId: FiefId, events: ReadonlyArray<FiefEvent>): Promise<Result<void, DomainError>>
}
