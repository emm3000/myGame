import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { isUnit } from './isUnit'
import { lemmaWordsOf } from './lemmaWordsOf'
import { tokensOf } from './tokensOf'

const glossFailures = ({ lessons }: GateContent): ReadonlyArray<string> =>
  lessons.flatMap(({ content, words }) =>
    words
      .filter(({ gloss }) => gloss.es === undefined)
      .map(({ id, lemma }) => `${id}: ${lemma} is taught by ${content.id} without an es gloss`),
  )

const unitDefinitionFailures = (
  { id, lemma, definition = '' }: LexiconEntry,
  { grammar, forms }: GateContent,
): ReadonlyArray<string> => {
  const frameWords = frameWordsOf(grammar)
  const cardWords = lemmaWordsOf(lemma).filter((word) => !frameWords.has(word))
  return tokensOf(definition).flatMap((token) =>
    cardWords
      .filter((word) => forms.get(token)?.has(word) === true)
      .map(
        (word) =>
          `${id}: the definition of ${lemma} holds ${token}, a form of its card word ${word}`,
      ),
  )
}

export const checkGlosses = (content: GateContent): ReadonlyArray<string> => [
  ...glossFailures(content),
  ...content.lexicon.filter(isUnit).flatMap((entry) => unitDefinitionFailures(entry, content)),
]
