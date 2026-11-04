import type { DomainError } from '../DomainError'
import type { ReviewLogEntry } from '../learning/ReviewLogEntry'
import type { Result } from '../Result'

export interface ReviewLog {
  append(entry: ReviewLogEntry): Promise<Result<void, DomainError>>
}
