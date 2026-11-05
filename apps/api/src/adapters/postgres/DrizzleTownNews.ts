import { type DomainError, Instant, ok, type Result } from '@mygame/domain'
import type {
  BuildingKind,
  ResourceKind,
  SiteAddress,
  Stocks,
  TownEvent,
  TownId,
  TownNews,
} from '@mygame/domain/town'
import { and, desc, eq, gt } from 'drizzle-orm'
import type { TownNewsReader } from '../../town/TownNewsReader'
import type { PostgresSession } from './connectPostgres'
import { type townBuilding, townEvents } from './schema'

type StoredTownBuilding = (typeof townBuilding.enumValues)[number]

type EventRow = typeof townEvents.$inferSelect

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

const buildingKindOf: Readonly<Record<StoredTownBuilding, BuildingKind>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  power_station: 'powerStation',
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

const required = <T>(value: T | null, column: string, row: EventRow): T => {
  if (value === null) {
    throw new Error(`Town event ${row.id} of kind ${row.kind} stores no ${column}`)
  }
  return value
}

const amountsFrom = (row: EventRow): Stocks => ({
  money: row.amountMoney,
  food: row.amountFood,
  power: row.amountPower,
  material: row.amountMaterial,
})

const siteFrom = (row: EventRow): SiteAddress => ({
  region: required(row.region, 'region', row),
  area: required(row.area, 'area', row),
  site: required(row.site, 'site', row),
})

const buildingFrom = (row: EventRow): BuildingKind =>
  buildingKindOf[required(row.building, 'building', row)]

const resourceFrom = (row: EventRow): ResourceKind => required(row.resource, 'resource', row)

const eventOf = (row: EventRow): TownEvent => {
  const occurredAt = Instant.fromEpochMilliseconds(row.occurredAt.getTime())
  switch (row.kind) {
    case 'building_work_finished':
      return {
        kind: 'buildingWorkFinished',
        building: buildingFrom(row),
        level: required(row.level, 'level', row),
        occurredAt,
      }
    case 'building_work_stopped':
      return {
        kind: 'buildingWorkStopped',
        building: buildingFrom(row),
        level: required(row.level, 'level', row),
        refund: amountsFrom(row),
        occurredAt,
      }
    case 'lesson_studied':
      return { kind: 'lessonStudied', lessonId: required(row.lessonId, 'lesson', row), occurredAt }
    case 'lesson_stopped':
      return { kind: 'lessonStopped', lessonId: required(row.lessonId, 'lesson', row), occurredAt }
    case 'skill_earned':
      return {
        kind: 'skillEarned',
        lessonId: required(row.lessonId, 'lesson', row),
        resource: resourceFrom(row),
        ratePercent: required(row.ratePercent, 'rate percent', row),
        occurredAt,
      }
    case 'hiring_delivered':
      return {
        kind: 'hiringDelivered',
        hire: required(row.hire, 'hire', row),
        count: required(row.count, 'count', row),
        occurredAt,
      }
    case 'hiring_stopped':
      return {
        kind: 'hiringStopped',
        hire: required(row.hire, 'hire', row),
        delivered: required(row.count, 'count', row),
        stopped: required(row.stoppedCount, 'stopped count', row),
        refund: amountsFrom(row),
        occurredAt,
      }
    case 'job_back':
      return { kind: 'jobBack', site: siteFrom(row), pay: amountsFrom(row), occurredAt }
    case 'job_called_back':
      return { kind: 'jobCalledBack', site: siteFrom(row), pay: amountsFrom(row), occurredAt }
    case 'clean_up_done':
      return { kind: 'cleanUpDone', site: siteFrom(row), reward: amountsFrom(row), occurredAt }
    case 'clean_up_failed':
      return { kind: 'cleanUpFailed', site: siteFrom(row), occurredAt }
    case 'became_city':
      return { kind: 'becameCity', occurredAt }
    default: {
      const unreachable: never = row.kind
      return unreachable
    }
  }
}

export class DrizzleTownNews implements TownNews, TownNewsReader {
  constructor(private readonly database: PostgresSession) {}

  async record(
    townId: TownId,
    events: ReadonlyArray<TownEvent>,
  ): Promise<Result<void, DomainError>> {
    if (events.length > 0) {
      await this.database.insert(townEvents).values(events.map((event) => rowOf(townId, event)))
    }
    return ok(undefined)
  }

  async newsOf(townId: TownId): Promise<ReadonlyArray<TownEvent>> {
    const rows = await this.database
      .select()
      .from(townEvents)
      .where(eq(townEvents.townId, townId))
      .orderBy(desc(townEvents.occurredAt), desc(townEvents.id))
    return rows.map(eventOf)
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
    return rows.map(eventOf)
  }
}
