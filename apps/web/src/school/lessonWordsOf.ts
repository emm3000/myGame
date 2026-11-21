import type { TownOverview } from '@mygame/contracts'
import type { ArtTag } from '../art/ArtTag'
import { frameTextOf } from '../review/frameTextOf'
import { type LessonName, lessonNameOf } from '../town/lessonNameOf'
import type { LiveLesson, LiveTown } from '../town/liveTown'
import { wordArtOf } from './wordArtOf'

type LessonWordState = TownOverview['lessons'][number]['words'][number]

type WordReading = NonNullable<LessonWordState['reading']>

export type LessonWord = Omit<WordReading, 'frame'> & {
  readonly frame: string
  readonly art: ReadonlyArray<ArtTag> | undefined
  readonly support: LessonWordState['support']
}

export type RunningLesson = LiveLesson & { readonly at: Date }

export interface LessonWords {
  readonly name: LessonName
  readonly theme: string | null
  readonly words: readonly [LessonWord, ...ReadonlyArray<LessonWord>]
  readonly running: RunningLesson | null
}

interface OpenedLesson {
  readonly theme: string | null
  readonly words: ReadonlyArray<LessonWordState>
}

const openedLessonOf = (overview: TownOverview, lessonId: string): OpenedLesson | undefined => {
  const shelved = overview.lessons.find(({ id }) => id === lessonId)
  if (shelved !== undefined) {
    return shelved
  }
  const released = overview.releasedLessons.find(({ id }) => id === lessonId)
  return released === undefined ? undefined : { theme: null, words: released.words }
}

export function lessonWordsOf(town: LiveTown, lessonId: string): LessonWords | undefined {
  const { overview, lessonSlot, at } = town
  const lesson = openedLessonOf(overview, lessonId)
  const [first, ...rest] = (lesson?.words ?? []).flatMap(({ reading, support }) =>
    reading === null
      ? []
      : [
          {
            ...reading,
            frame: frameTextOf(reading.frame),
            art: wordArtOf(reading.word),
            support,
          },
        ],
  )
  if (lesson === undefined || first === undefined) {
    return undefined
  }
  return {
    name: lessonNameOf(lessonId, overview),
    theme: lesson.theme,
    words: [first, ...rest],
    running: lessonSlot?.lessonId === lessonId ? { ...lessonSlot, at } : null,
  }
}
