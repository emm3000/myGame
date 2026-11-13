import type { LessonOfFiles, LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'
import { isUnitLesson } from './isUnitLesson'

export type LessonFrame = {
  readonly entry: LexiconEntry
  readonly frame: string
  readonly gappedFrame: string
  readonly lessonId: string
  readonly position: number
  readonly label: string
  readonly noCardSense: ReadonlyArray<string>
}

export type FramePlacements = {
  readonly frames: ReadonlyArray<LessonFrame>
  readonly failures: ReadonlyArray<string>
}

type Placement =
  | { readonly kind: 'placed'; readonly frame: LessonFrame }
  | { readonly kind: 'misplaced'; readonly failure: string }

type LexiconFrame = Extract<LexiconEntry['frames'][number], { readonly fromLessonId: string }>

type TaughtWord = {
  readonly entry: LexiconEntry
  readonly lessonId: string
  readonly position: number
}

const laterPlacementOf = (
  { entry, lessonId: ownLessonId, position: ownPosition }: TaughtWord,
  { frame, gappedFrame, fromLessonId, noCardSense = [] }: LexiconFrame,
  lessons: ReadonlyArray<LessonOfFiles>,
): Placement => {
  const naming = `${entry.id}: later frame names ${fromLessonId}`
  const index = lessons.findIndex(({ content }) => content.id === fromLessonId)
  const lesson = lessons[index]
  if (lesson === undefined) {
    return { kind: 'misplaced', failure: `${naming}, a lesson the curriculum does not list` }
  }
  if (isUnitLesson(lesson)) {
    return { kind: 'misplaced', failure: `${naming}, a unit lesson` }
  }
  if (index + 1 <= ownPosition) {
    return { kind: 'misplaced', failure: `${naming}, which is not after its own ${ownLessonId}` }
  }
  return {
    kind: 'placed',
    frame: {
      entry,
      frame,
      gappedFrame,
      lessonId: fromLessonId,
      position: index + 1,
      label: `${entry.id}, later frame for ${fromLessonId}`,
      noCardSense,
    },
  }
}

const placementsOf = (
  word: TaughtWord,
  lessons: ReadonlyArray<LessonOfFiles>,
): ReadonlyArray<Placement> => {
  const [{ frame, gappedFrame, noCardSense = [] }, ...laterFrames] = word.entry.frames
  return [
    {
      kind: 'placed',
      frame: { ...word, frame, gappedFrame, noCardSense, label: word.entry.id },
    },
    ...laterFrames.map((later) => laterPlacementOf(word, later, lessons)),
  ]
}

export const framePlacementsOf = ({ lessons }: GateContent): FramePlacements => {
  const placements = lessons.flatMap(({ content, words }, index) =>
    words.flatMap((entry) =>
      placementsOf({ entry, lessonId: content.id, position: index + 1 }, lessons),
    ),
  )
  return {
    frames: placements.flatMap((placement) =>
      placement.kind === 'placed' ? [placement.frame] : [],
    ),
    failures: placements.flatMap((placement) =>
      placement.kind === 'misplaced' ? [placement.failure] : [],
    ),
  }
}
