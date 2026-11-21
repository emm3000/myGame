import {
  schoolLessonSlotBusy,
  schoolLessonTitle,
  schoolReleasedSlotBusy,
  schoolReleasedStopOf,
  schoolReleasedTitle,
  schoolSlotStopOf,
} from '@mygame/catalog'
import type { LessonName } from '../town/lessonNameOf'

export interface LessonLines {
  readonly title: string
  readonly slotBusy: string
  readonly stopOf: string
}

export function lessonLinesOf(name: LessonName): LessonLines {
  switch (name.kind) {
    case 'shelved': {
      const { number } = name
      return {
        title: schoolLessonTitle({ number }),
        slotBusy: schoolLessonSlotBusy({ number }),
        stopOf: schoolSlotStopOf({ number }),
      }
    }
    case 'released': {
      const set = { band: name.band, number: name.set }
      return {
        title: schoolReleasedTitle(set),
        slotBusy: schoolReleasedSlotBusy(set),
        stopOf: schoolReleasedStopOf(set),
      }
    }
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}
