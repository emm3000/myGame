import type { ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'

export function marchRefusalLineOf(refusal: ApiRefusal, message: string | undefined): string {
  return message ?? copy.refusals[refusal]
}
