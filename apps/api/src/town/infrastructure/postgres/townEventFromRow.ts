import {
  type BuildingKind,
  Instant,
  type ResourceKind,
  type SiteAddress,
  type Stocks,
  type TownEvent,
} from '@mygame/domain'
import type { townEvents } from './newsTables'

type StoredTownBuilding = (typeof townEvents.building.enumValues)[number]

type EventRow = typeof townEvents.$inferSelect

type StoredEventKind = EventRow['kind']

type BuildingEventKind = Extract<
  StoredEventKind,
  'building_work_finished' | 'building_work_stopped'
>

type SchoolEventKind = Extract<
  StoredEventKind,
  'lesson_studied' | 'lesson_stopped' | 'skill_earned'
>

type HiringEventKind = Extract<StoredEventKind, 'hiring_delivered' | 'hiring_stopped'>

type JobsEventKind = Extract<
  StoredEventKind,
  'job_back' | 'job_called_back' | 'clean_up_done' | 'clean_up_failed'
>

const buildingKindOf: Readonly<Record<StoredTownBuilding, BuildingKind>> = {
  homes: 'homes',
  farm: 'farm',
  factory: 'factory',
  power_station: 'powerStation',
  storage: 'storage',
  school: 'school',
  office: 'office',
}

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

const buildingEventFromRow = (
  row: EventRow,
  kind: BuildingEventKind,
  occurredAt: Instant,
): TownEvent => {
  switch (kind) {
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
  }
}

const schoolEventFromRow = (
  row: EventRow,
  kind: SchoolEventKind,
  occurredAt: Instant,
): TownEvent => {
  switch (kind) {
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
  }
}

const hiringEventFromRow = (
  row: EventRow,
  kind: HiringEventKind,
  occurredAt: Instant,
): TownEvent => {
  switch (kind) {
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
  }
}

const jobsEventFromRow = (row: EventRow, kind: JobsEventKind, occurredAt: Instant): TownEvent => {
  switch (kind) {
    case 'job_back':
      return { kind: 'jobBack', site: siteFrom(row), pay: amountsFrom(row), occurredAt }
    case 'job_called_back':
      return { kind: 'jobCalledBack', site: siteFrom(row), pay: amountsFrom(row), occurredAt }
    case 'clean_up_done':
      return { kind: 'cleanUpDone', site: siteFrom(row), reward: amountsFrom(row), occurredAt }
    case 'clean_up_failed':
      return { kind: 'cleanUpFailed', site: siteFrom(row), occurredAt }
  }
}

export const townEventFromRow = (row: EventRow): TownEvent => {
  const occurredAt = Instant.fromEpochMilliseconds(row.occurredAt.getTime())
  const { kind } = row
  switch (kind) {
    case 'building_work_finished':
    case 'building_work_stopped':
      return buildingEventFromRow(row, kind, occurredAt)
    case 'lesson_studied':
    case 'lesson_stopped':
    case 'skill_earned':
      return schoolEventFromRow(row, kind, occurredAt)
    case 'hiring_delivered':
    case 'hiring_stopped':
      return hiringEventFromRow(row, kind, occurredAt)
    case 'job_back':
    case 'job_called_back':
    case 'clean_up_done':
    case 'clean_up_failed':
      return jobsEventFromRow(row, kind, occurredAt)
    case 'became_city':
      return { kind: 'becameCity', occurredAt }
    default: {
      const unreachable: never = kind
      return unreachable
    }
  }
}
