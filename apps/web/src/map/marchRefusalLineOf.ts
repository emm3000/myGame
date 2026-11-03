import type { ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'

export function marchRefusalLineOf(
  refusal: ApiRefusal,
  message: string | undefined,
  maxStayHours: number,
): string {
  if (message !== undefined) {
    return message
  }
  return refusal === 'StayOutOfRange'
    ? copy.march.stayOutOfRange(maxStayHours)
    : copy.refusals[refusal]
}
