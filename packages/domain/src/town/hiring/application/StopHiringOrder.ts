import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'
import { accrueTown } from '../../resources/accrueTown'
import { rebaseFullSince } from '../../resources/rebaseFullSince'
import type { HiringTarget } from '../domain/HiringOrder'

export type StopHiringOrderCommand = HiringTarget & {
  readonly playerId: PlayerId
}

export type StopHiringOrderDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

export class StopHiringOrder {
  constructor(private readonly dependencies: StopHiringOrderDependencies) {}

  async execute({
    playerId,
    hire,
    startedAt,
  }: StopHiringOrderCommand): Promise<Result<TownReading, DomainError>> {
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
        const stopped = town.hiring.stop({ hire, startedAt }, accrual.value.stocks, now)
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
