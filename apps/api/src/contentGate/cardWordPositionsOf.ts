import type { GateContent } from './GateContent'

export const cardWordPositionsOf = ({
  curriculum,
  lessons,
}: GateContent): ReadonlyMap<string, number> =>
  new Map(
    lessons.flatMap(({ content, words }) =>
      words.map(
        ({ lemma }) => [lemma.toLowerCase(), curriculum.lessonIds.indexOf(content.id) + 1] as const,
      ),
    ),
  )
