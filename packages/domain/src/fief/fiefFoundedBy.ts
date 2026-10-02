import type { DomainError } from '../DomainError'
import type { FoundingMarch } from '../march/March'
import { marchInstantsOf } from '../march/marchInstantsOf'
import { ok, type Result } from '../Result'
import { Coordinates } from './Coordinates'
import { Fief, type Stocks } from './Fief'
import type { FiefId } from './FiefId'
import { FiefName } from './FiefName'

export const fiefFoundedBy = (
  origin: Fief,
  founding: FoundingMarch,
  id: FiefId,
  startingStocks: Stocks,
): Result<Fief, DomainError> => {
  const name = FiefName.create(founding.name)
  if (!name.ok) {
    return name
  }
  const coordinates = Coordinates.create(
    origin.coordinates.kingdom,
    founding.province,
    founding.plot,
  )
  if (!coordinates.ok) {
    return coordinates
  }
  return ok(
    Fief.found({
      id,
      playerId: origin.playerId,
      name: name.value,
      coordinates: coordinates.value,
      startingStocks,
      at: marchInstantsOf(founding).arrivesAt,
    }),
  )
}
