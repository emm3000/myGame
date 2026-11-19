import type { TextsContent } from '@mygame/contracts'
import type { GateContent } from './GateContent'
import { isUnitLesson } from './isUnitLesson'
import { tokensOf } from './tokensOf'

type RunningText = TextsContent[number]

export type LessonText = {
  readonly text: RunningText
  readonly tokens: ReadonlyArray<string>
  readonly lessonId: string
  readonly position: number
  readonly label: string
}

export type TextPlacements = {
  readonly texts: ReadonlyArray<LessonText>
  readonly failures: ReadonlyArray<string>
}

type Placement =
  | { readonly kind: 'placed'; readonly text: LessonText }
  | { readonly kind: 'misplaced'; readonly failure: string }

const placementOf = (text: RunningText, { lessons }: GateContent): Placement => {
  const naming = `${text.id}: text names ${text.fromLessonId}`
  const index = lessons.findIndex(({ content }) => content.id === text.fromLessonId)
  const lesson = lessons[index]
  if (lesson === undefined) {
    return { kind: 'misplaced', failure: `${naming}, a lesson the curriculum does not list` }
  }
  if (isUnitLesson(lesson)) {
    return { kind: 'misplaced', failure: `${naming}, a unit lesson` }
  }
  return {
    kind: 'placed',
    text: {
      text,
      tokens: tokensOf([text.title, ...text.sentences].join(' ')),
      lessonId: text.fromLessonId,
      position: index + 1,
      label: text.id,
    },
  }
}

export const textPlacementsOf = (content: GateContent): TextPlacements => {
  const placements = content.texts.map((text) => placementOf(text, content))
  return {
    texts: placements.flatMap((placement) => (placement.kind === 'placed' ? [placement.text] : [])),
    failures: placements.flatMap((placement) =>
      placement.kind === 'misplaced' ? [placement.failure] : [],
    ),
  }
}
