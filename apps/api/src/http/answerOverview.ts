import type { FiefOverview } from '@mygame/contracts'
import type { DomainError, PlayerId, Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { FiefReading } from '../fief/FiefReading'
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import type { CardReader } from '../learning/CardReader'
import type { LearnerTerms } from '../learning/learnerOverviewOf'
import { answerRefusal } from './answerRefusal'

export type OverviewDependencies = LearnerTerms & {
  readonly cards: CardReader
}

export const overviewOfPlayer = async (
  playerId: PlayerId,
  reading: FiefReading,
  dependencies: OverviewDependencies,
): Promise<Result<FiefOverview, DomainError>> => {
  const cards = await dependencies.cards.cardsOf(playerId)
  if (!cards.ok) {
    return cards
  }
  return fiefOverviewOf(reading, cards.value, dependencies)
}

export const answerOverview = async (
  c: Context,
  playerId: PlayerId,
  reading: Result<FiefReading, DomainError>,
  dependencies: OverviewDependencies,
): Promise<Response> => {
  if (!reading.ok) {
    return answerRefusal(c, reading.error)
  }
  const overview = await overviewOfPlayer(playerId, reading.value, dependencies)
  if (!overview.ok) {
    return answerRefusal(c, overview.error)
  }
  const body: FiefOverview = overview.value
  return c.json(body)
}
