import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'
import type { FixedCopyCatalog } from '../copy/PlayerCopy'
import { refusalLineOf } from './refusalLineOf'

export function hiringRefusalLineOf(
  catalog: FixedCopyCatalog,
  refusal: ApiRefusal,
  error?: ApiError,
): string {
  if (error?.kind === 'NotEnoughPeople') {
    return catalog.refusalHiringNotEnoughPeople(error.params)
  }
  if (error?.kind === 'NotEnoughResources') {
    return catalog.refusalHiringNotEnoughResources()
  }
  return refusalLineOf(catalog, refusal, error)
}
