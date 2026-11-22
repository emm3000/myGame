import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { changeTown } from '../../application/changeTown'
import type { MutateTownDependencies } from '../../application/mutateTown'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownReading } from '../../domain/TownReading'

export type CallJobBackCommand = {
  readonly playerId: PlayerId
  readonly sentAt: Instant
}

export type CallJobBackDependencies = MutateTownDependencies & {
  readonly townCatalog: TownCatalog
}

export class CallJobBack {
  constructor(private readonly dependencies: CallJobBackDependencies) {}

  async execute({
    playerId,
    sentAt,
  }: CallJobBackCommand): Promise<Result<TownReading, DomainError>> {
    const { townCatalog } = this.dependencies
    return changeTown(
      playerId,
      async ({ towns, cleanUps, townNews }, clock) => {
        const now = clock.now()
        const resolved = await resolveStoredTown(playerId, towns, townCatalog, now)
        if (!resolved.ok) {
          return resolved
        }
        const town = resolved.value.town
        const called = town.jobs.callBack(sentAt, now, townCatalog)
        if (!called.ok) {
          return called
        }
        const calledBack = town.changedBy(called.value)
        const saved = await saveChangedTown(
          { town: calledBack, events: resolved.value.events },
          towns,
          townNews,
        )
        if (!saved.ok) {
          return saved
        }
        const cancelled = await cleanUps.cancel(calledBack.id, sentAt)
        return cancelled.ok ? ok(clock.now()) : cancelled
      },
      this.dependencies,
    )
  }
}
