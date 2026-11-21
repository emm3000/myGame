import type { TownOverview } from '@mygame/contracts'
import type { DomainError, MemoryTerms, Result, TownCatalog } from '@mygame/domain'
import type { Context } from 'hono'
import type { LessonLibrary } from '../../../content/application/ports/LessonLibrary'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import type { TownReading } from '../../application/TownReading'
import { presentTownOverview } from './presentTownOverview'

export type AnswerTownReadingDependencies = {
  readonly townCatalog: TownCatalog
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

export const answerTownReading = (
  c: Context,
  reading: Result<TownReading, DomainError>,
  { townCatalog, lessons, memoryTerms }: AnswerTownReadingDependencies,
): Response => {
  if (!reading.ok) {
    return answerRefusal(c, reading.error)
  }
  const overview = presentTownOverview(reading.value, townCatalog, lessons, memoryTerms)
  if (!overview.ok) {
    return answerRefusal(c, overview.error)
  }
  const body: TownOverview = overview.value
  return c.json(body)
}
