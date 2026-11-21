import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import type { LessonName } from '../town/lessonNameOf'

export interface LessonLines {
  readonly title: Label
  readonly slotBusy: Label
  readonly stopOf: Label
}

export function lessonLinesOf(name: LessonName, { chrome, fixedCopy }: PlayerCopy): LessonLines {
  switch (name.kind) {
    case 'shelved': {
      const { number } = name
      return {
        title: chrome((catalog) => catalog.schoolLessonTitle({ number })),
        slotBusy: chrome((catalog) => catalog.schoolLessonSlotBusy({ number })),
        stopOf: chrome((catalog) => catalog.schoolSlotStopOf({ number })),
      }
    }
    case 'released': {
      const set = { band: name.band, number: name.set }
      return {
        title: fixedCopy((catalog) => catalog.schoolReleasedTitle(set)),
        slotBusy: fixedCopy((catalog) => catalog.schoolReleasedSlotBusy(set)),
        stopOf: fixedCopy((catalog) => catalog.schoolReleasedStopOf(set)),
      }
    }
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}
