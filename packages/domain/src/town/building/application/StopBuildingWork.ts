import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'
import { accrueTown } from '../../resources/domain/accrueTown'
import { rebaseFullSince } from '../../resources/domain/rebaseFullSince'
import type { WorkTarget } from '../domain/BuildingWork'

export type StopBuildingWorkCommand = WorkTarget & {
  readonly playerId: PlayerId
}

export type StopBuildingWorkDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

export class StopBuildingWork {
  constructor(private readonly dependencies: StopBuildingWorkDependencies) {}

  async execute({
    playerId,
    building,
    level,
  }: StopBuildingWorkCommand): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      playerId,
      async ({ towns, townNews }, clock) => {
        const now = clock.now()
        const resolved = await resolveStoredTown(playerId, towns, townCatalog, now)
        if (!resolved.ok) {
          return resolved
        }
        const town = resolved.value.town
        const accrual = accrueTown(town, townCatalog, now)
        if (!accrual.ok) {
          return accrual
        }
        const stopped = town.buildingWork.stop(
          { building, level },
          accrual.value.stocks,
          now,
          townCatalog,
        )
        if (!stopped.ok) {
          return stopped
        }
        const rebased = rebaseFullSince(
          accrual.value.fullSince,
          town.changedBy(stopped.value.state),
          townCatalog,
        )
        if (!rebased.ok) {
          return rebased
        }
        const change = {
          town: rebased.value,
          events: [...resolved.value.events, ...stopped.value.events],
        }
        const saved = await saveChangedTown(change, towns, townNews)
        return saved.ok ? ok(change.town.storedAt) : saved
      },
      this.dependencies,
    )
  }
}
