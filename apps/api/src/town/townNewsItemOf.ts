import type { TownNewsItem } from '@mygame/contracts/town'
import type { TownEvent } from '@mygame/domain/town'
import { isoOf } from '../http/isoOf'

export const townNewsItemOf = (event: TownEvent): TownNewsItem => {
  const occurredAt = isoOf(event.occurredAt)
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
    case 'becameCity':
      return { kind: event.kind, occurredAt }
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}
