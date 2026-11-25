import type { TownOverview } from '@mygame/contracts'
import type {
  DomainError,
  LessonLibrary,
  MemoryTerms,
  Result,
  Stocks,
  TownCatalog,
  TownOverviewReading,
  TownReading,
} from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { gatherTownView } from './gatherTownView'
import { presentTownOverview } from './presentTownOverview'

export type RespondTownReadingDependencies = {
  readonly townCatalog: TownCatalog
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

const respondOverview = (
  c: Context,
  reading: TownReading,
  away: Stocks | undefined,
  { townCatalog, lessons, memoryTerms }: RespondTownReadingDependencies,
): Response => {
  const view = gatherTownView(reading, townCatalog, lessons, memoryTerms)
  if (!view.ok) {
    return respondRefusal(c, view.error)
  }
  const body: TownOverview = presentTownOverview(reading, view.value, away, townCatalog)
  return c.json(body)
}

export const respondTownReading = (
  c: Context,
  reading: Result<TownReading, DomainError>,
  dependencies: RespondTownReadingDependencies,
): Response =>
  reading.ok
    ? respondOverview(c, reading.value, undefined, dependencies)
    : respondRefusal(c, reading.error)

export const respondTownOverview = (
  c: Context,
  reading: Result<TownOverviewReading, DomainError>,
  dependencies: RespondTownReadingDependencies,
): Response =>
  reading.ok
    ? respondOverview(c, reading.value, reading.value.away, dependencies)
    : respondRefusal(c, reading.error)
