import {
  type BandStart,
  type BandStartRepository,
  type DomainError,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'

export class MemoryBandStarts implements BandStartRepository {
  private readonly starts = new Map<PlayerId, ReadonlyArray<BandStart>>()

  async bandStartsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<BandStart>, DomainError>> {
    return ok([...(this.starts.get(playerId) ?? [])].sort((left, right) => left.band - right.band))
  }

  async save(playerId: PlayerId, start: BandStart): Promise<Result<void, DomainError>> {
    const started = this.starts.get(playerId) ?? []
    if (!started.some(({ band }) => band === start.band)) {
      const heldOutWords = [...start.heldOutWords].sort()
      this.starts.set(playerId, [...started, { ...start, heldOutWords }])
    }
    return ok(undefined)
  }
}
