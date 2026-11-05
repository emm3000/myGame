import { type DomainError, type Instant, ok, type Result } from '@mygame/domain'
import type { TownEvent, TownId, TownNews } from '@mygame/domain/town'
import { keptEventsPerTown, type TownNewsReader } from '../../town/TownNewsReader'

type NumberedEvent = {
  readonly id: number
  readonly townId: TownId
  readonly event: TownEvent
}

const newestFirst = (left: NumberedEvent, right: NumberedEvent): number =>
  right.event.occurredAt.epochMilliseconds - left.event.occurredAt.epochMilliseconds ||
  right.id - left.id

export class MemoryTownNews implements TownNews, TownNewsReader {
  constructor(private events: ReadonlyArray<NumberedEvent> = []) {}

  async record(
    townId: TownId,
    events: ReadonlyArray<TownEvent>,
  ): Promise<Result<void, DomainError>> {
    const lastId = this.events.reduce((highest, { id }) => Math.max(highest, id), 0)
    const recorded = [
      ...this.events,
      ...events.map((event, index) => ({ id: lastId + index + 1, townId, event })),
    ]
    const kept = new Set(
      recorded
        .filter((numbered) => numbered.townId === townId)
        .sort(newestFirst)
        .slice(0, keptEventsPerTown),
    )
    this.events = recorded.filter((numbered) => numbered.townId !== townId || kept.has(numbered))
    return ok(undefined)
  }

  async newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>> {
    return this.events
      .filter((numbered) => numbered.townId === townId)
      .sort(newestFirst)
      .map(({ event }) => event)
  }

  async newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>> {
    return (await this.newsOf(townId)).filter(
      ({ occurredAt }) => occurredAt.epochMilliseconds > after.epochMilliseconds,
    )
  }

  draft(): MemoryTownNews {
    return new MemoryTownNews(this.events)
  }
}
