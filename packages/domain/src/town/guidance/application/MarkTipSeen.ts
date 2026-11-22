import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '../../application/mutateTown'
import type { TipKind } from '../domain/TipKind'

export type MarkTipSeenDependencies = MutateTownDependencies

export type MarkTipSeenCommand = {
  readonly playerId: PlayerId
  readonly tip: TipKind
}

export class MarkTipSeen {
  constructor(private readonly dependencies: MarkTipSeenDependencies) {}

  async execute(command: MarkTipSeenCommand): Promise<Result<void, DomainError>> {
    return mutateTown(
      command.playerId,
      async (stores) => {
        await stores.seenTips.markSeen(command.playerId, command.tip)
        return ok(undefined)
      },
      this.dependencies,
    )
  }
}
