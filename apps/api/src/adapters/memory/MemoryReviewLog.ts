import {
  type DomainError,
  ok,
  type PlayerId,
  type Result,
  type ReviewLog,
  type ReviewLogEntry,
} from '@mygame/domain'

export class MemoryReviewLog implements ReviewLog {
  private readonly entries: Array<ReviewLogEntry> = []

  entriesOf(playerId: PlayerId): ReadonlyArray<ReviewLogEntry> {
    return this.entries.filter((entry) => entry.playerId === playerId)
  }

  async append(entry: ReviewLogEntry): Promise<Result<void, DomainError>> {
    this.entries.push(entry)
    return ok(undefined)
  }
}
