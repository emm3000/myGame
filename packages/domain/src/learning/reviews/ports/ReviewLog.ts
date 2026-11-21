import type { DomainError } from '#DomainError'
import type { Result } from '#Result'
import type { ReviewLogEntry } from '../ReviewLogEntry'

export interface ReviewLog {
  append(entry: ReviewLogEntry): Promise<Result<void, DomainError>>
}
