import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { cardWordEndingOf } from './cardWordEndingOf'
import { framePlacementsOf } from './framePlacementsOf'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import type { GateContent } from './GateContent'
import { inventoryFailuresOf } from './inventoryFailuresOf'
import { readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'
import { textPlacementsOf } from './textPlacementsOf'
import { tokensOf } from './tokensOf'

type Passage = {
  readonly kind: 'frame' | 'text'
  readonly label: string
  readonly lessonId: string
  readonly position: number
  readonly homographs: LexiconEntry['homographs']
  readonly tokens: ReadonlyArray<string>
}

type GrammarTerms = {
  readonly reading: ReadingTerms
  readonly frameWordsAdmittedAt: ReadonlyMap<string, number>
  readonly inflectionsAdmittedAt: ReadonlyMap<string, number>
  readonly cardWords: ReadonlyMap<string, LexiconEntry>
}

const termsOf = (content: GateContent): GrammarTerms => {
  const positionOf = (lessonId: string): number =>
    content.curriculum.lessonIds.indexOf(lessonId) + 1
  return {
    reading: readingTermsOf(content),
    frameWordsAdmittedAt: frameWordAdmissionsOf(content),
    inflectionsAdmittedAt: new Map(
      content.grammar.structures.flatMap(({ inflections, admittingLessonId }) =>
        inflections.map((inflection) => [inflection, positionOf(admittingLessonId)] as const),
      ),
    ),
    cardWords: new Map(content.lexicon.map((entry) => [entry.lemma, entry])),
  }
}

const isAdmittedBy = (admittedAt: number | undefined, { position }: Passage): boolean =>
  admittedAt !== undefined && admittedAt <= position

const inflectionFailures = (
  token: string,
  inflection: string,
  passage: Passage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.inflectionsAdmittedAt.get(inflection)
  if (isAdmittedBy(admittedAt, passage)) {
    return []
  }
  const label = inflection === token ? 'an inflection' : `an ${inflection} inflection`
  const holding = `${passage.label}: ${passage.kind} holds ${token}, ${label}`
  return admittedAt === undefined
    ? [`${holding} no structure admits`]
    : [`${holding} admitted after ${passage.lessonId}`]
}

const frameWordFormFailures = (
  token: string,
  word: string,
  passage: Passage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  if (token !== word) {
    return inflectionFailures(token, token, passage, terms)
  }
  return isAdmittedBy(terms.frameWordsAdmittedAt.get(word), passage)
    ? []
    : [
        `${passage.label}: ${passage.kind} holds ${token}, a frame word admitted after ${passage.lessonId}`,
      ]
}

const cardWordFailures = (
  token: string,
  entry: LexiconEntry,
  passage: Passage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const ending = cardWordEndingOf(token, entry)
  return ending === undefined ? [] : inflectionFailures(token, ending, passage, terms)
}

const tokenFailures = (
  token: string,
  passage: Passage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const reading = readingOf(token, passage, terms.reading)
  if (reading.kind !== 'word') {
    return []
  }
  if (terms.frameWordsAdmittedAt.has(reading.word)) {
    return frameWordFormFailures(token, reading.word, passage, terms)
  }
  const cardWord = terms.cardWords.get(reading.word)
  return cardWord === undefined ? [] : cardWordFailures(token, cardWord, passage, terms)
}

const passagesOf = (content: GateContent): ReadonlyArray<Passage> => [
  ...framePlacementsOf(content).frames.map(
    ({ label, lessonId, position, entry, frame }): Passage => ({
      kind: 'frame',
      label,
      lessonId,
      position,
      homographs: entry.homographs,
      tokens: tokensOf(frame),
    }),
  ),
  ...textPlacementsOf(content).texts.map(
    ({ label, lessonId, position, text, tokens }): Passage => ({
      kind: 'text',
      label,
      lessonId,
      position,
      homographs: text.homographs,
      tokens,
    }),
  ),
]

const passageFailures = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return passagesOf(content).flatMap((passage) =>
    passage.tokens.flatMap((token) => tokenFailures(token, passage, terms)),
  )
}

export const checkGrammar = (content: GateContent): ReadonlyArray<string> => [
  ...inventoryFailuresOf(content),
  ...passageFailures(content),
]
