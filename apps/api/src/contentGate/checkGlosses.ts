import { lemmaWordsOf } from '@mygame/domain'
import { bandOfRank } from '../adapters/json/bandOfRank'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { tokensOf } from './tokensOf'

const definingBand = 1

const glossFailures = ({ lessons }: GateContent): ReadonlyArray<string> =>
  lessons.flatMap(({ content, words }) =>
    words
      .filter(({ gloss }) => gloss.es === undefined)
      .map(({ id, lemma }) => `${id}: ${lemma} is taught by ${content.id} without an es gloss`),
  )

const definitionFailures = ({ lessons }: GateContent): ReadonlyArray<string> =>
  lessons.flatMap(({ content, words }) =>
    words
      .filter(({ definition }) => definition === undefined)
      .map(({ id, lemma }) => `${id}: ${lemma} is taught by ${content.id} without a definition`),
  )

type FrameWords = ReadonlyMap<string, string>

const isDefiningToken = (
  token: string,
  { forms, ranks }: GateContent,
  frameWords: FrameWords,
): boolean =>
  [...(forms.get(token) ?? [])].some((headword) => {
    const rank = ranks.get(headword)
    return frameWords.has(headword) || (rank !== undefined && bandOfRank(rank) === definingBand)
  })

const vocabularyFailures = (
  { id, lemma, definition = '' }: LexiconEntry,
  content: GateContent,
  frameWords: FrameWords,
): ReadonlyArray<string> =>
  tokensOf(definition)
    .filter((token) => !isDefiningToken(token, content, frameWords))
    .map(
      (token) =>
        `${id}: the definition of ${lemma} holds ${token}, neither a frame word nor a band 1 word`,
    )

const ownWordFailures = (
  { id, lemma, definition = '' }: LexiconEntry,
  { forms }: GateContent,
  frameWords: FrameWords,
): ReadonlyArray<string> => {
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

const taughtEntriesOf = ({ lessons }: GateContent): ReadonlyArray<LexiconEntry> =>
  lessons.flatMap(({ words }) => words)

export const checkGlosses = (content: GateContent): ReadonlyArray<string> => {
  const frameWords = frameWordsOf(content.grammar)
  return [
    ...glossFailures(content),
    ...definitionFailures(content),
    ...taughtEntriesOf(content).flatMap((entry) => vocabularyFailures(entry, content, frameWords)),
    ...content.lexicon.flatMap((entry) => ownWordFailures(entry, content, frameWords)),
  ]
}
