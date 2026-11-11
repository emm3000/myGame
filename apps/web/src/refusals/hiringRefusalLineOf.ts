import { refusalHiringNotEnoughPeople, refusalHiringNotEnoughResources } from '@mygame/catalog'
import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'
import { refusalLineOf } from './refusalLineOf'

export function hiringRefusalLineOf(refusal: ApiRefusal, error?: ApiError): string {
  if (error?.kind === 'NotEnoughPeople') {
    return refusalHiringNotEnoughPeople(error.params)
  }
  if (error?.kind === 'NotEnoughResources') {
    return refusalHiringNotEnoughResources()
  }
  return refusalLineOf(refusal, error)
}
