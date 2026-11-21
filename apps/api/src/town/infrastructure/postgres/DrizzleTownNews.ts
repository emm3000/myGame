import {
  type BuildingKind,
  type DomainError,
  type Instant,
  ok,
  type Result,
  type SiteAddress,
  type Stocks,
  type TownEvent,
  type TownId,
  type TownNews,
} from '@mygame/domain'
import { and, desc, eq, gt, notInArray } from 'drizzle-orm'
import type { PostgresSession } from '../../../platform/infrastructure/postgres/connectPostgres'
import { keptEventsPerTown, type TownNewsReader } from '../../TownNewsReader'
import { townEvents } from './newsTables'
import { townEventFromRow } from './townEventFromRow'

type StoredTownBuilding = (typeof townEvents.building.enumValues)[number]

type NewEventRow = typeof townEvents.$inferInsert

const storedBuildings: Readonly<Record<BuildingKind, StoredTownBuilding>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  powerStation: 'power_station',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

const amountsOf = (stocks: Stocks): Partial<NewEventRow> => ({
  amountMoney: stocks.money,
  amountFood: stocks.food,
  amountPower: stocks.power,
  amountMaterial: stocks.material,
})

const siteColumnsOf = ({ region, area, site }: SiteAddress): Partial<NewEventRow> => ({
  region,
  area,
  site,
})

const payloadOf = (event: TownEvent): Omit<NewEventRow, 'townId' | 'occurredAt'> => {
  switch (event.kind) {
    case 'buildingWorkFinished':
      return {
        kind: 'building_work_finished',
        building: storedBuildings[event.building],
        level: event.level,
      }
    case 'buildingWorkStopped':
      return {
        kind: 'building_work_stopped',
        building: storedBuildings[event.building],
        level: event.level,
        ...amountsOf(event.refund),
      }
    case 'lessonStudied':
      return { kind: 'lesson_studied', lessonId: event.lessonId }
    case 'lessonStopped':
      return { kind: 'lesson_stopped', lessonId: event.lessonId }
    case 'skillEarned':
      return {
        kind: 'skill_earned',
        lessonId: event.lessonId,
        resource: event.resource,
        ratePercent: event.ratePercent,
      }
    case 'hiringDelivered':
      return { kind: 'hiring_delivered', hire: event.hire, count: event.count }
    case 'hiringStopped':
      return {
        kind: 'hiring_stopped',
        hire: event.hire,
        count: event.delivered,
        stoppedCount: event.stopped,
        ...amountsOf(event.refund),
      }
    case 'jobBack':
      return { kind: 'job_back', ...siteColumnsOf(event.site), ...amountsOf(event.pay) }
    case 'jobCalledBack':
      return { kind: 'job_called_back', ...siteColumnsOf(event.site), ...amountsOf(event.pay) }
    case 'cleanUpDone':
      return { kind: 'clean_up_done', ...siteColumnsOf(event.site), ...amountsOf(event.reward) }
    case 'cleanUpFailed':
      return { kind: 'clean_up_failed', ...siteColumnsOf(event.site) }
    case 'becameCity':
      return { kind: 'became_city' }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}

const rowOf = (townId: TownId, event: TownEvent): NewEventRow => ({
  townId,
  occurredAt: new Date(event.occurredAt.epochMilliseconds),
  ...payloadOf(event),
})

export class DrizzleTownNews implements TownNews, TownNewsReader {
  constructor(private readonly database: PostgresSession) {}

  async record(
    townId: TownId,
    events: ReadonlyArray<TownEvent>,
  ): Promise<Result<void, DomainError>> {
    if (events.length === 0) {
      return ok(undefined)
    }
    await this.database.insert(townEvents).values(events.map((event) => rowOf(townId, event)))
    const kept = this.database
      .select({ id: townEvents.id })
      .from(townEvents)
      .where(eq(townEvents.townId, townId))
      .orderBy(desc(townEvents.occurredAt), desc(townEvents.id))
      .limit(keptEventsPerTown)
    await this.database
      .delete(townEvents)
      .where(and(eq(townEvents.townId, townId), notInArray(townEvents.id, kept)))
    return ok(undefined)
  }

  async newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>> {
    const rows = await this.database
      .select()
      .from(townEvents)
      .where(eq(townEvents.townId, townId))
      .orderBy(desc(townEvents.occurredAt), desc(townEvents.id))
    return rows.map(townEventFromRow)
  }

  async newsAfter(townId: TownId, after: Instant): Promise<ReadonlyArray<TownEvent>> {
    const rows = await this.database
      .select()
      .from(townEvents)
      .where(
        and(
          eq(townEvents.townId, townId),
          gt(townEvents.occurredAt, new Date(after.epochMilliseconds)),
        ),
      )
      .orderBy(desc(townEvents.occurredAt), desc(townEvents.id))
    return rows.map(townEventFromRow)
  }
}
