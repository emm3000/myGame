import {
  type ChronicleWriter,
  type DomainError,
  type FiefEvent,
  type FiefId,
  Instant,
  ok,
  type Result,
  type Stocks,
} from '@mygame/domain'
import { and, desc, eq, notInArray } from 'drizzle-orm'
import { type ChronicleReader, keptEventsPerFief } from '../../fief/ChronicleReader'
import type { PostgresSession } from './connectPostgres'
import { fiefEvents } from './schema'
import { artKinds, buildingKinds, storedArts, storedBuildings } from './storedKinds'

type EventRow = typeof fiefEvents.$inferSelect

type NewEventRow = typeof fiefEvents.$inferInsert

const noRefund: Stocks = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const refundColumnsOf = (refund: Stocks) => ({
  refundWood: refund.wood,
  refundStone: refund.stone,
  refundIron: refund.iron,
  refundGold: refund.gold,
  refundFood: refund.food,
})

const refundOf = (row: EventRow): Stocks => ({
  wood: row.refundWood,
  stone: row.refundStone,
  iron: row.refundIron,
  gold: row.refundGold,
  food: row.refundFood,
})

const rowOf = (fiefId: FiefId, event: FiefEvent): NewEventRow => {
  const common = {
    fiefId,
    level: event.level,
    occurredAt: new Date(event.occurredAt.epochMilliseconds),
  }
  switch (event.kind) {
    case 'upgradeFinished':
      return {
        ...common,
        kind: 'upgrade_finished',
        building: storedBuildings[event.building],
        ...refundColumnsOf(noRefund),
      }
    case 'artLearned':
      return {
        ...common,
        kind: 'art_learned',
        art: storedArts[event.art],
        ...refundColumnsOf(noRefund),
      }
    case 'upgradeCancelled':
      return {
        ...common,
        kind: 'upgrade_cancelled',
        building: storedBuildings[event.building],
        ...refundColumnsOf(event.refund),
      }
    case 'studyCancelled':
      return {
        ...common,
        kind: 'study_cancelled',
        art: storedArts[event.art],
        ...refundColumnsOf(event.refund),
      }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

const buildingOf = (row: EventRow) => {
  if (row.building === null) {
    throw new Error(`Chronicle event ${row.id} of kind ${row.kind} names no building`)
  }
  return buildingKinds[row.building]
}

const artOf = (row: EventRow) => {
  if (row.art === null) {
    throw new Error(`Chronicle event ${row.id} of kind ${row.kind} names no art`)
  }
  return artKinds[row.art]
}

const eventOf = (row: EventRow): FiefEvent => {
  const occurredAt = Instant.fromEpochMilliseconds(row.occurredAt.getTime())
  switch (row.kind) {
    case 'upgrade_finished':
      return { kind: 'upgradeFinished', building: buildingOf(row), level: row.level, occurredAt }
    case 'art_learned':
      return { kind: 'artLearned', art: artOf(row), level: row.level, occurredAt }
    case 'upgrade_cancelled':
      return {
        kind: 'upgradeCancelled',
        building: buildingOf(row),
        level: row.level,
        occurredAt,
        refund: refundOf(row),
      }
    case 'study_cancelled':
      return {
        kind: 'studyCancelled',
        art: artOf(row),
        level: row.level,
        occurredAt,
        refund: refundOf(row),
      }
    default: {
      const unreachable: never = row.kind
      return unreachable
    }
  }
}

export class DrizzleChronicle implements ChronicleWriter, ChronicleReader {
  constructor(private readonly database: PostgresSession) {}

  async record(
    fiefId: FiefId,
    events: ReadonlyArray<FiefEvent>,
  ): Promise<Result<void, DomainError>> {
    if (events.length === 0) {
      return ok(undefined)
    }
    await this.database.insert(fiefEvents).values(events.map((event) => rowOf(fiefId, event)))
    const kept = this.database
      .select({ id: fiefEvents.id })
      .from(fiefEvents)
      .where(eq(fiefEvents.fiefId, fiefId))
      .orderBy(desc(fiefEvents.occurredAt), desc(fiefEvents.id))
      .limit(keptEventsPerFief)
    await this.database
      .delete(fiefEvents)
      .where(and(eq(fiefEvents.fiefId, fiefId), notInArray(fiefEvents.id, kept)))
    return ok(undefined)
  }

  async eventsOf(fiefId: FiefId): Promise<ReadonlyArray<FiefEvent>> {
    const rows = await this.database
      .select()
      .from(fiefEvents)
      .where(eq(fiefEvents.fiefId, fiefId))
      .orderBy(desc(fiefEvents.occurredAt), desc(fiefEvents.id))
      .limit(keptEventsPerFief)
    return rows.map(eventOf)
  }
}
