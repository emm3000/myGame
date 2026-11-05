import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { cardWordEndingOf } from './cardWordEndingOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { inventoryFailuresOf } from './inventoryFailuresOf'
import { readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'
import { tokensOf } from './tokensOf'

type LessonFrame = {
  readonly entry: LexiconEntry
  readonly lessonId: string
  readonly position: number
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
    frameWordsAdmittedAt: new Map(
      [...frameWordsOf(content.grammar)].map(([word, lessonId]) => [word, positionOf(lessonId)]),
    ),
    inflectionsAdmittedAt: new Map(
      content.grammar.structures.flatMap(({ inflections, admittingLessonId }) =>
        inflections.map((inflection) => [inflection, positionOf(admittingLessonId)] as const),
      ),
    ),
    cardWords: new Map(content.lexicon.map((entry) => [entry.lemma, entry])),
  }
}

const isAdmittedBy = (admittedAt: number | undefined, { position }: LessonFrame): boolean =>
  admittedAt !== undefined && admittedAt <= position

const inflectionFailures = (
  token: string,
  inflection: string,
  frame: LessonFrame,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.inflectionsAdmittedAt.get(inflection)
  if (isAdmittedBy(admittedAt, frame)) {
    return []
  }
  const label = inflection === token ? 'an inflection' : `an ${inflection} inflection`
  const holding = `${frame.entry.id}: frame holds ${token}, ${label}`
  return admittedAt === undefined
    ? [`${holding} no structure admits`]
    : [`${holding} admitted after ${frame.lessonId}`]
}

const frameWordFormFailures = (
  token: string,
  word: string,
  frame: LessonFrame,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  if (token !== word) {
    return inflectionFailures(token, token, frame, terms)
  }
  return isAdmittedBy(terms.frameWordsAdmittedAt.get(word), frame)
    ? []
    : [`${frame.entry.id}: frame holds ${token}, a frame word admitted after ${frame.lessonId}`]
}

const cardWordFailures = (
  token: string,
  entry: LexiconEntry,
  frame: LessonFrame,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const ending = cardWordEndingOf(token, entry)
  return ending === undefined ? [] : inflectionFailures(token, ending, frame, terms)
}

const tokenFailures = (
  token: string,
  frame: LessonFrame,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const reading = readingOf(token, frame.entry, terms.reading)
  if (reading.kind !== 'word') {
    return []
  }
  if (terms.frameWordsAdmittedAt.has(reading.word)) {
    return frameWordFormFailures(token, reading.word, frame, terms)
  }
  const cardWord = terms.cardWords.get(reading.word)
  return cardWord === undefined ? [] : cardWordFailures(token, cardWord, frame, terms)
}

const frameFailures = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return content.lessons.flatMap(({ content: lesson, words }) =>
    words.flatMap((entry) => {
      const frame = {
        entry,
        lessonId: lesson.id,
        position: content.curriculum.lessonIds.indexOf(lesson.id) + 1,
      }
      return tokensOf(entry.frame).flatMap((token) => tokenFailures(token, frame, terms))
    }),
  )
}

export const checkGrammar = (content: GateContent): ReadonlyArray<string> => [
  ...inventoryFailuresOf(content),
  ...frameFailures(content),
]
