import type { TownOverview } from '@mygame/contracts'
import type { DomainError, MemoryTerms, Result, TownCatalog } from '@mygame/domain'
import type { Context } from 'hono'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { gatherTownView } from '../../application/gatherTownView'
import type { TownReading } from '../../application/TownReading'
import { presentTownOverview } from './presentTownOverview'

export type RespondTownReadingDependencies = {
  readonly townCatalog: TownCatalog
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

export const respondTownReading = (
  c: Context,
  reading: Result<TownReading, DomainError>,
  { townCatalog, lessons, memoryTerms }: RespondTownReadingDependencies,
): Response => {
  if (!reading.ok) {
    return respondRefusal(c, reading.error)
  }
  const view = gatherTownView(reading.value, townCatalog, lessons, memoryTerms)
  if (!view.ok) {
    return respondRefusal(c, view.error)
  }
  const body: TownOverview = presentTownOverview(reading.value, view.value, townCatalog)
  return c.json(body)
}
