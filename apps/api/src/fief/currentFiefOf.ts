import {
  type BuildingCatalog,
  type CampRegistry,
  type ChronicleWriter,
  type Clock,
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  ok,
  type ResolveUpgradeDependencies,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import type { FiefReader } from './FiefReader'
import { laterOf } from './laterOf'

export type CurrentFiefDependencies = {
  readonly fiefs: FiefReader
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
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
  { fiefs, inTransaction, buildingCatalog, clock }: CurrentFiefDependencies,
): Promise<Result<Fief, DomainError>> => {
  const now = clock.now()
  const readClock: Clock = { now: () => now }
  const preview = await resolveUpgrade(fiefOfPlayer, {
    fiefs: dryRunOver(fiefs),
    chronicle: discardingChronicle,
    camps: discardingCamps,
    catalog: buildingCatalog,
    clock: readClock,
  })
  const resolved =
    preview.ok && preview.value.hasChanged
      ? await inTransaction((stores) =>
          resolveUpgrade(fiefOfPlayer, {
            fiefs: stores.fiefs,
            chronicle: stores.chronicle,
            camps: stores.camps,
            catalog: buildingCatalog,
            clock: readClock,
          }),
        )
      : preview
  if (!resolved.ok) {
    return resolved
  }
  const { fief } = resolved.value
  return fief.accruedTo(buildingCatalog, laterOf(now, fief.storedAt))
}
