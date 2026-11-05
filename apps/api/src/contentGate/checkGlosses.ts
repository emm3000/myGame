import type { GateContent } from './GateContent'

export const checkGlosses = ({ lessons }: GateContent): ReadonlyArray<string> =>
  lessons.flatMap(({ content, words }) =>
    words
      .filter(({ gloss }) => gloss.es === undefined)
      .map(({ id, lemma }) => `${id}: ${lemma} is taught by ${content.id} without an es gloss`),
  )
