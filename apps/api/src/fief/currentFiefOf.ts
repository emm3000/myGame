import {
  type BuildingCatalog,
  type CampRegistry,
  type ChronicleWriter,
  type Clock,
  type DomainError,
  type FiefOfPlayer,
  type IdGenerator,
  type LessonCatalog,
  ok,
  type ResolveUpgradeDependencies,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { FiefReader } from './FiefReader'
import type { FiefReading } from './FiefReading'
import { fiefReadingAt } from './fiefReadingAt'
import { resolveFiefInTransaction } from './resolveFiefInTransaction'

export type CurrentFiefDependencies = {
  readonly fiefs: FiefReader
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly lessons: Pick<LessonCatalog, 'lessonOf'>
  readonly clock: Clock
  readonly ids: IdGenerator
}

const dryRunOver = (fiefs: FiefReader): ResolveUpgradeDependencies['fiefs'] => ({
  fiefOf: (fiefId) => fiefs.fiefOf(fiefId),
  save: async () => ok(undefined),
})

const discardingChronicle: ChronicleWriter = {
  record: async () => ok(undefined),
}

const discardingCamps: CampRegistry = {
  lastBattleOf: async () => undefined,
  lastBattlesIn: async () => [],
  record: async () => ok(undefined),
}

export const currentFiefOf = async (
  fiefOfPlayer: FiefOfPlayer,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefReading, DomainError>> => {
  const { fiefs, inTransaction, buildingCatalog, clock, ids } = dependencies
  const now = clock.now()
  const readClock: Clock = { now: () => now }
  const preview = await resolveUpgrade(fiefOfPlayer, {
    fiefs: dryRunOver(fiefs),
    chronicle: discardingChronicle,
    camps: discardingCamps,
    catalog: buildingCatalog,
    clock: readClock,
    ids,
  })
  const resolved =
    preview.ok && preview.value.hasChanged
      ? await inTransaction((stores) =>
          resolveFiefInTransaction(fiefOfPlayer, stores, readClock, dependencies),
        )
      : preview
  if (!resolved.ok) {
    return resolved
  }
  return fiefReadingAt(resolved.value.fief, buildingCatalog, now)
}
