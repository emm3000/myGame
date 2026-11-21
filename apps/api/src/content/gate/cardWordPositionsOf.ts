import type { GateContent } from './GateContent'
import { lessonPositionOf } from './lessonPositionOf'

export const cardWordPositionsOf = ({
  curriculum,
  lessons,
}: GateContent): ReadonlyMap<string, number> =>
  new Map(
    lessons.flatMap(({ content, words }) =>
      words.map(
        ({ lemma }) => [lemma.toLowerCase(), lessonPositionOf(curriculum, content.id)] as const,
      ),
    ),
  )
