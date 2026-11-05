import {
  type BuildingCatalog,
  type CampRegistry,
  type ChronicleWriter,
  type Clock,
  type DomainError,
  err,
  type Fief,
  type FiefOfPlayer,
  type IdGenerator,
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
  readonly clock: Clock
  readonly ids: IdGenerator
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
): Promise<Result<Fief, DomainError>> =>
  dependencies.inTransaction(async (stores) => {
    const resolved = await resolveFiefInTransaction(fiefOfPlayer, stores, readClock, dependencies)
    return resolved.ok ? ok(resolved.value.fief) : resolved
  })

export const currentFiefOf = async (
  fiefOfPlayer: FiefOfPlayer,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefReading, DomainError>> => {
  const { fiefs, buildingCatalog, clock, ids } = dependencies
  const now = clock.now()
  const readClock: Clock = { now: () => now }
  const read = await fiefs.fiefOf(fiefOfPlayer.fiefId)
  if (!read.ok) {
    return read
  }
  if (read.value === undefined) {
    return err({ kind: 'FiefNotFound', fiefId: fiefOfPlayer.fiefId })
  }
  const preview = await resolveUpgrade(fiefOfPlayer, {
    fiefs: dryRunOver(fiefs, read.value),
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
    : ok(preview.value.fief)
  if (!resolved.ok) {
    return resolved
  }
  return fiefReadingAt(resolved.value, buildingCatalog, now)
}
