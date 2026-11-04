import {
  type BuildingCatalog,
  type Clock,
  type DomainError,
  enterLessonCards,
  type FiefOfPlayer,
  type IdGenerator,
  type LessonCatalog,
  type ResolvedFief,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { TransactionStores } from '../adapters/postgres/postgresTransaction'

export type ResolveInTransactionDependencies = {
  readonly buildingCatalog: BuildingCatalog
  readonly lessons: Pick<LessonCatalog, 'lessonOf'>
  readonly ids: IdGenerator
}

export type ResolvingStores = Pick<TransactionStores, 'fiefs' | 'chronicle' | 'camps' | 'cards'>

export const resolveFiefInTransaction = async (
  fiefOfPlayer: FiefOfPlayer,
  { fiefs, chronicle, camps, cards }: ResolvingStores,
  clock: Clock,
  { buildingCatalog, lessons, ids }: ResolveInTransactionDependencies,
): Promise<Result<ResolvedFief, DomainError>> => {
  const resolved = await resolveUpgrade(fiefOfPlayer, {
    fiefs,
    chronicle,
    camps,
    catalog: buildingCatalog,
    clock,
    ids,
  })
  if (!resolved.ok) {
    return resolved
  }
  for (const event of resolved.value.events) {
    if (event.kind === 'lessonLearned') {
      const entered = await enterLessonCards(
        { playerId: fiefOfPlayer.playerId, lessonId: event.lessonId, enteredAt: event.occurredAt },
        { cards, lessons },
      )
      if (!entered.ok) {
        return entered
      }
    }
  }
  return resolved
}
