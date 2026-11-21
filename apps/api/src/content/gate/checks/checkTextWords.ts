import { isUnitLesson } from '../../infrastructure/json/isUnitLesson'
import { readingOf } from '../../infrastructure/json/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../infrastructure/json/readingTermsOf'
import type { LessonOfFiles } from '../../infrastructure/json/readLessonContentFiles'
import type { GateContent } from '../GateContent'
import { type LessonText, textPlacementsOf } from '../textPlacementsOf'

const lessonsPerText = 4

const bandLessonsUpTo = (
  { position }: LessonText,
  { lessons, curriculum }: GateContent,
): ReadonlyArray<LessonOfFiles> =>
  lessons
    .slice(curriculum.chromeLessonCount, position)
    .filter((lesson) => !isUnitLesson(lesson))
    .slice(-lessonsPerText)

const heldWordsOf = ({ text, tokens }: LessonText, terms: ReadingTerms): ReadonlySet<string> => {
  const noCardSense = new Set(text.noCardSense ?? [])
  return new Set(
    tokens
      .filter((token) => !noCardSense.has(token))
      .flatMap((token) => {
        const reading = readingOf(token, text, terms)
        return reading.kind === 'word' ? [reading.word] : []
      }),
  )
}

const textFailures = (
  text: LessonText,
  content: GateContent,
  terms: ReadingTerms,
): ReadonlyArray<string> => {
  const heldWords = heldWordsOf(text, terms)
  return bandLessonsUpTo(text, content).flatMap(({ content: lesson, words }) =>
    words
      .filter(({ lemma }) => !heldWords.has(lemma.toLowerCase()))
      .map(
        ({ lemma }) => `${text.label}: text holds no form of ${lemma}, a card word of ${lesson.id}`,
      ),
  )
}

export const checkTextWords = (content: GateContent): ReadonlyArray<string> => {
  const terms = readingTermsOf(content)
  return textPlacementsOf(content).texts.flatMap((text) => textFailures(text, content, terms))
}
