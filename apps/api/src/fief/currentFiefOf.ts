import {
  type BuildingCatalog,
  type Clock,
  type DomainError,
  type Fief,
  type FiefRepository,
  ok,
  type PlayerId,
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

const dryRunOver = (fiefs: FiefReader): FiefRepository => ({
  occupiedPlots: () => fiefs.occupiedPlots(),
  holdsFief: (playerId) => fiefs.holdsFief(playerId),
  fiefOf: (playerId) => fiefs.fiefOf(playerId),
  save: async () => ok(undefined),
})

export const currentFiefOf = async (
  playerId: PlayerId,
  { fiefs, inTransaction, buildingCatalog, clock }: CurrentFiefDependencies,
): Promise<Result<Fief, DomainError>> => {
  const now = clock.now()
  const readClock: Clock = { now: () => now }
  const preview = await resolveUpgrade(
    { playerId },
    { fiefs: dryRunOver(fiefs), catalog: buildingCatalog, clock: readClock },
  )
  const resolved =
    preview.ok && preview.value.hasChanged
      ? await inTransaction((stores) =>
          resolveUpgrade(
            { playerId },
            { fiefs: stores.fiefs, catalog: buildingCatalog, clock: readClock },
          ),
        )
      : preview
  if (!resolved.ok) {
    return resolved
  }
  const { fief } = resolved.value
  return fief.accruedTo(buildingCatalog, laterOf(now, fief.storedAt))
}
