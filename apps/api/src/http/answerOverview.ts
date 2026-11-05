import type { FiefOverview } from '@mygame/contracts'
import type { BuildingCatalog, DomainError, Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { FiefReading } from '../fief/FiefReading'
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import { answerRefusal } from './answerRefusal'

export const answerOverview = (
  c: Context,
  reading: Result<FiefReading, DomainError>,
  catalog: BuildingCatalog,
): Response => {
  if (!reading.ok) {
    return answerRefusal(c, reading.error)
  }
  const overview = fiefOverviewOf(reading.value, catalog)
  if (!overview.ok) {
    return answerRefusal(c, overview.error)
  }
  const body: FiefOverview = overview.value
  return c.json(body)
}
