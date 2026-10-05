import type { ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'

export function marchRefusalLineOf(refusal: ApiRefusal, message: string | undefined): string {
  if (refusal === 'InsufficientResources') {
    return copy.transport.insufficientResources
  }
  const isCountedByTheServer = refusal === 'FiefCapReached' || refusal === 'CargoAboveCarry'
  return isCountedByTheServer && message !== undefined ? message : copy.refusals[refusal]
}
