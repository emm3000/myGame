import type { ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'

export function marchRefusalLineOf(refusal: ApiRefusal, message: string | undefined): string {
  return refusal === 'FiefCapReached' && message !== undefined ? message : copy.refusals[refusal]
}
