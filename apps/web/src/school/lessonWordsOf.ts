import { schoolLessonTitle } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import type { ArtTag } from '../art/ArtTag'
import { formatFinish } from '../time/formatFinish'
import type { LiveLesson, LiveTown } from '../town/liveTown'
import { lessonNumberOf } from './lessonCardOf'
import { wordArtOf } from './wordArtOf'

type WordReading = NonNullable<TownOverview['lessons'][number]['words'][number]['reading']>

export type LessonWord = WordReading & { readonly art: ReadonlyArray<ArtTag> | undefined }

export type RunningLesson = LiveLesson & { readonly time: string }

export interface LessonWords {
  readonly title: string
  readonly theme: string
  readonly words: readonly [LessonWord, ...ReadonlyArray<LessonWord>]
  readonly running: RunningLesson | null
}

export function lessonWordsOf(town: LiveTown, lessonId: string): LessonWords | undefined {
  const { overview, lessonSlot, at } = town
  const lesson = overview.lessons.find(({ id }) => id === lessonId)
  const [first, ...rest] = (lesson?.words ?? []).flatMap(({ reading }) =>
    reading === null ? [] : [{ ...reading, art: wordArtOf(reading.word) }],
  )
  if (lesson === undefined || first === undefined) {
    return undefined
  }
  return {
    title: schoolLessonTitle({ number: lessonNumberOf(lessonId, overview) }),
    theme: lesson.theme,
    words: [first, ...rest],
    running:
      lessonSlot?.lessonId === lessonId
        ? { ...lessonSlot, time: formatFinish(lessonSlot.remainingSeconds, at) }
        : null,
  }
}
