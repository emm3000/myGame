import { frameWordsOf } from '../infrastructure/json/frameWordsOf'
import type { GateContent } from './GateContent'
import { lessonPositionOf } from './lessonPositionOf'

export const frameWordAdmissionsOf = ({
  grammar,
  curriculum,
}: GateContent): ReadonlyMap<string, number> =>
  new Map(
    [...frameWordsOf(grammar)].map(([word, lessonId]) => [
      word,
      lessonPositionOf(curriculum, lessonId),
    ]),
  )
