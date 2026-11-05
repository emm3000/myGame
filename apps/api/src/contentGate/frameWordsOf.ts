import type { GrammarContent } from '@mygame/contracts'

export const frameWordsOf = (grammar: GrammarContent): ReadonlyMap<string, string> =>
  new Map(
    grammar.structures.flatMap(({ frameWords, admittingLessonId }) =>
      frameWords.map((word) => [word.toLowerCase(), admittingLessonId] as const),
    ),
  )
