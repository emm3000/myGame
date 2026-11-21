import type { TownNewsItem } from '@mygame/contracts'
import type { TownEvent } from '@mygame/domain'
import { isoOf } from '../platform/infrastructure/http/isoOf'

type EventOf<Kind extends TownEvent['kind']> = Extract<TownEvent, { readonly kind: Kind }>

type BuildingEvent = EventOf<'buildingWorkFinished' | 'buildingWorkStopped'>

type SchoolEvent = EventOf<'lessonStudied' | 'lessonStopped' | 'skillEarned'>

type HiringEvent = EventOf<'hiringDelivered' | 'hiringStopped'>

type JobsEvent = EventOf<'jobBack' | 'jobCalledBack' | 'cleanUpDone' | 'cleanUpFailed'>

const buildingNewsItemOf = (event: BuildingEvent, occurredAt: string): TownNewsItem => {
  switch (event.kind) {
    case 'buildingWorkFinished':
      return {
        kind: event.kind,
        params: { building: event.building, level: event.level },
        occurredAt,
      }
    case 'buildingWorkStopped':
      return {
        kind: event.kind,
        params: { building: event.building, level: event.level, refund: { ...event.refund } },
        occurredAt,
      }
  }
}

const schoolNewsItemOf = (event: SchoolEvent, occurredAt: string): TownNewsItem => {
  switch (event.kind) {
    case 'lessonStudied':
    case 'lessonStopped':
      return { kind: event.kind, params: { lessonId: event.lessonId }, occurredAt }
    case 'skillEarned':
      return {
        kind: event.kind,
        params: {
          lessonId: event.lessonId,
          resource: event.resource,
          ratePercent: event.ratePercent,
        },
        occurredAt,
      }
  }
}

const hiringNewsItemOf = (event: HiringEvent, occurredAt: string): TownNewsItem => {
  switch (event.kind) {
    case 'hiringDelivered':
      return { kind: event.kind, params: { hire: event.hire, count: event.count }, occurredAt }
    case 'hiringStopped':
      return {
        kind: event.kind,
        params: {
          hire: event.hire,
          delivered: event.delivered,
          stopped: event.stopped,
          refund: { ...event.refund },
        },
        occurredAt,
      }
  }
}

const jobsNewsItemOf = (event: JobsEvent, occurredAt: string): TownNewsItem => {
  switch (event.kind) {
    case 'jobBack':
    case 'jobCalledBack':
      return {
        kind: event.kind,
        params: { site: { ...event.site }, pay: { ...event.pay } },
        occurredAt,
      }
    case 'cleanUpDone':
      return {
        kind: event.kind,
        params: { site: { ...event.site }, reward: { ...event.reward } },
        occurredAt,
      }
    case 'cleanUpFailed':
      return { kind: event.kind, params: { site: { ...event.site } }, occurredAt }
  }
}

export const townNewsItemOf = (event: TownEvent): TownNewsItem => {
  const occurredAt = isoOf(event.occurredAt)
  switch (event.kind) {
    case 'buildingWorkFinished':
    case 'buildingWorkStopped':
      return buildingNewsItemOf(event, occurredAt)
    case 'lessonStudied':
    case 'lessonStopped':
    case 'skillEarned':
      return schoolNewsItemOf(event, occurredAt)
    case 'hiringDelivered':
    case 'hiringStopped':
      return hiringNewsItemOf(event, occurredAt)
    case 'jobBack':
    case 'jobCalledBack':
    case 'cleanUpDone':
    case 'cleanUpFailed':
      return jobsNewsItemOf(event, occurredAt)
    case 'becameCity':
      return { kind: event.kind, occurredAt }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}
