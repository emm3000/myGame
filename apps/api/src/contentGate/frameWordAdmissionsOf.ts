import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'

export const frameWordAdmissionsOf = ({
  grammar,
  curriculum,
}: GateContent): ReadonlyMap<string, number> =>
  new Map(
    [...frameWordsOf(grammar)].map(([word, lessonId]) => [
      word,
      curriculum.lessonIds.indexOf(lessonId) + 1,
    ]),
  )
