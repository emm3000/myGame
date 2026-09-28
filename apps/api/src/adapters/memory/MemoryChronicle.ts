import {
  type ChronicleWriter,
  type DomainError,
  type FiefEvent,
  type FiefId,
  ok,
  type Result,
} from '@mygame/domain'
import { type ChronicleReader, keptEventsPerFief } from '../../fief/ChronicleReader'

type NumberedEvent = {
  readonly id: number
  readonly event: FiefEvent
}

const newestFirst = (left: NumberedEvent, right: NumberedEvent): number =>
  right.event.occurredAt.epochMilliseconds - left.event.occurredAt.epochMilliseconds ||
  right.id - left.id

export class MemoryChronicle implements ChronicleWriter, ChronicleReader {
  private readonly events = new Map<FiefId, ReadonlyArray<NumberedEvent>>()
  private lastId = 0

  async record(
    fiefId: FiefId,
    events: ReadonlyArray<FiefEvent>,
  ): Promise<Result<void, DomainError>> {
    const numbered = events.map((event) => {
      this.lastId += 1
      return { id: this.lastId, event }
    })
    const kept = [...(this.events.get(fiefId) ?? []), ...numbered]
      .sort(newestFirst)
      .slice(0, keptEventsPerFief)
    this.events.set(fiefId, kept)
    return ok(undefined)
  }

  async eventsOf(fiefId: FiefId): Promise<ReadonlyArray<FiefEvent>> {
    return (this.events.get(fiefId) ?? []).map(({ event }) => event)
  }
}
