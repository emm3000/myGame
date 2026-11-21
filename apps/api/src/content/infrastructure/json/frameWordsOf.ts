import type { GrammarContent } from '@mygame/contracts'
import { headwordOf } from '@mygame/domain'

export const frameWordsOf = (grammar: GrammarContent): ReadonlyMap<string, string> =>
  new Map(
    grammar.structures.flatMap(({ frameWords, admittingLessonId }) =>
      frameWords.map((word) => [headwordOf(word), admittingLessonId] as const),
    ),
  )
