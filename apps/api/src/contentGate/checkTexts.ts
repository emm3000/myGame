import { cardWordPositionsOf } from './cardWordPositionsOf'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import type { GateContent } from './GateContent'
import { readingFailuresOf } from './readingFailuresOf'
import { readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'
import { type LessonText, textPlacementsOf } from './textPlacementsOf'

type TextTerms = {
  readonly reading: ReadingTerms
  readonly admittedAt: ReadonlyMap<string, number>
  readonly taughtAt: ReadonlyMap<string, number>
}

const termsOf = (content: GateContent): TextTerms => ({
  reading: readingTermsOf(content),
  admittedAt: frameWordAdmissionsOf(content),
  taughtAt: cardWordPositionsOf(content),
})

const unknownWordFailures = (
  token: string,
  word: string,
  { label, lessonId, position }: LessonText,
  terms: TextTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.admittedAt.get(word)
  if (admittedAt !== undefined) {
    return admittedAt > 0 && admittedAt <= position
      ? []
      : [`${label}: text holds ${token}, a frame word admitted after ${lessonId}`]
  }
  const taughtAt = terms.taughtAt.get(word)
  return taughtAt !== undefined && taughtAt <= position
    ? []
    : [`${label}: text holds ${token}, a word no lesson teaches at or before ${lessonId}`]
}

const noCardSenseFailures = ({ text, tokens, label }: LessonText): ReadonlyArray<string> =>
  (text.noCardSense ?? [])
    .filter((form) => !tokens.includes(form))
    .map((form) => `${label}: names ${form} in no card sense, a token its text does not hold`)

const textFailures = (text: LessonText, terms: TextTerms): ReadonlyArray<string> => [
  ...text.tokens.flatMap((token) => {
    const reading = readingOf(token, text.text, terms.reading)
    return reading.kind === 'word'
      ? unknownWordFailures(token, reading.word, text, terms)
      : readingFailuresOf(token, reading, { label: text.label, kind: 'text' })
  }),
  ...noCardSenseFailures(text),
]

export const checkTexts = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  const { texts, failures } = textPlacementsOf(content)
  return [...failures, ...texts.flatMap((text) => textFailures(text, terms))]
}
