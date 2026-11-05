import type { GrammarContent } from '@mygame/contracts'

export const frameWordsOf = (grammar: GrammarContent): ReadonlyMap<string, string> =>
  new Map(
    grammar.frameWords.map(({ word, admittingLessonId }) => [
      word.toLowerCase(),
      admittingLessonId,
    ]),
  )
