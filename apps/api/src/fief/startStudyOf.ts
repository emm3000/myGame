import {
  type ArtKind,
  type BuildingCatalog,
  type Clock,
  type DomainError,
  type Fief,
  type PlayerId,
  type Result,
  resolveUpgrade,
  startStudy,
} from '@mygame/domain'
import type { Transaction } from '../adapters/postgres/postgresTransaction'
import { laterOf } from './laterOf'

export type StartStudyDependencies = {
  readonly inTransaction: Transaction
  readonly buildingCatalog: BuildingCatalog
  readonly clock: Clock
}

export const startStudyOf = async (
  playerId: PlayerId,
  art: ArtKind,
  { inTransaction, buildingCatalog, clock }: StartStudyDependencies,
): Promise<Result<Fief, DomainError>> =>
  inTransaction(async ({ fiefs }) => {
    const locked = await fiefs.fiefOf(playerId)
    if (!locked.ok) {
      return locked
    }
    const now = clock.now()
    const startedAt = locked.value === undefined ? now : laterOf(now, locked.value.storedAt)
    const studyClock: Clock = { now: () => startedAt }
    const resolved = await resolveUpgrade(
      { playerId },
      { fiefs, catalog: buildingCatalog, clock: studyClock },
    )
    if (!resolved.ok) {
      return resolved
    }
    return startStudy({ playerId, art }, { fiefs, catalog: buildingCatalog, clock: studyClock })
  })
