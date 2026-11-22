import type { Instant, TownEvent, TownId } from '@mygame/domain'
import { keptEventsPerTown, type TownNewsReader } from '../../application/ports/TownNewsReader'

type RecordedEvent = {
  readonly position: number
  readonly event: TownEvent
}

const newestFirst = (left: RecordedEvent, right: RecordedEvent): number =>
  right.event.occurredAt.epochMilliseconds - left.event.occurredAt.epochMilliseconds ||
  right.position - left.position

export class MemoryTownNewsReader implements TownNewsReader {
  constructor(private readonly recordedEventsOf: (townId: TownId) => ReadonlyArray<TownEvent>) {}

  async newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>> {
    return this.recordedEventsOf(townId)
      .map((event, position) => ({ position, event }))
      .sort(newestFirst)
      .slice(0, keptEventsPerTown)
      .map(({ event }) => event)
  }

  async newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>> {
    return (await this.newsOf(townId)).filter(
      ({ occurredAt }) => occurredAt.epochMilliseconds > after.epochMilliseconds,
    )
  }
}
