import {
  type BuildingCatalog,
  type CampRegistry,
  type ChronicleWriter,
  type Clock,
  type DomainError,
  err,
  type Fief,
  type FiefOfPlayer,
  type HeldCard,
  type IdGenerator,
  type LessonCatalog,
  ok,
  type ResolveUpgradeDependencies,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { FiefReader, FiefWithCards } from './FiefReader'
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

export type CurrentFief = FiefReading & {
  readonly cards: ReadonlyArray<HeldCard>
}

const dryRunOver = (fiefs: FiefReader, read: Fief): ResolveUpgradeDependencies['fiefs'] => ({
  fiefOf: async (fiefId) => (fiefId === read.id ? ok(read) : fiefs.fiefOf(fiefId)),
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

const resolvedInTransaction = (
  fiefOfPlayer: FiefOfPlayer,
  readClock: Clock,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefWithCards, DomainError>> =>
  dependencies.inTransaction(async (stores) => {
    const resolved = await resolveFiefInTransaction(fiefOfPlayer, stores, readClock, dependencies)
    if (!resolved.ok) {
      return resolved
    }
    const cards = await stores.cards.cardsOf(fiefOfPlayer.playerId)
    if (!cards.ok) {
      return cards
    }
    return ok({ fief: resolved.value.fief, cards: cards.value })
  })

export const currentFiefOf = async (
  fiefOfPlayer: FiefOfPlayer,
  dependencies: CurrentFiefDependencies,
): Promise<Result<CurrentFief, DomainError>> => {
  const { fiefs, buildingCatalog, clock, ids } = dependencies
  const now = clock.now()
  const readClock: Clock = { now: () => now }
  const read = await fiefs.fiefWithCardsOf(fiefOfPlayer.fiefId)
  if (!read.ok) {
    return read
  }
  if (read.value === undefined) {
    return err({ kind: 'FiefNotFound', fiefId: fiefOfPlayer.fiefId })
  }
  const preview = await resolveUpgrade(fiefOfPlayer, {
    fiefs: dryRunOver(fiefs, read.value.fief),
    chronicle: discardingChronicle,
    camps: discardingCamps,
    catalog: buildingCatalog,
    clock: readClock,
    ids,
  })
  if (!preview.ok) {
    return preview
  }
  const resolved = preview.value.hasChanged
    ? await resolvedInTransaction(fiefOfPlayer, readClock, dependencies)
    : ok({ fief: preview.value.fief, cards: read.value.cards })
  if (!resolved.ok) {
    return resolved
  }
  const reading = fiefReadingAt(resolved.value.fief, buildingCatalog, now)
  if (!reading.ok) {
    return reading
  }
  return ok({ ...reading.value, cards: resolved.value.cards })
}
