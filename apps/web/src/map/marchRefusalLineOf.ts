import type { ApiError } from '@mygame/contracts'
import type { ApiRefusal } from '../api/apiClient'
import { copy, type RefusalWithParams } from '../copy'

const hasParams = (error: ApiError): error is RefusalWithParams => 'params' in error

const lineWithParamsOf = (error: RefusalWithParams): string => {
  switch (error.kind) {
    case 'NotEnoughUnitsAtHome':
      return copy.refusalsWithParams.NotEnoughUnitsAtHome(error.params)
    case 'BarracksTooLow':
      return copy.refusalsWithParams.BarracksTooLow(error.params)
    case 'FiefCapReached':
      return copy.refusalsWithParams.FiefCapReached(error.params)
    case 'CargoAboveCarry':
      return copy.refusalsWithParams.CargoAboveCarry(error.params)
    case 'StayOutOfRange':
      return copy.refusalsWithParams.StayOutOfRange(error.params)
  }
}

export function marchRefusalLineOf(refusal: ApiRefusal, error: ApiError | undefined): string {
  if (error === undefined || !hasParams(error)) {
    return copy.refusals[refusal]
  }
  return lineWithParamsOf(error)
}
