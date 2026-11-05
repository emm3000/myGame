import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { type Reading, readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'
import { tokensOf } from './tokensOf'

const gap = '____'

type LessonFrame = {
  readonly entry: LexiconEntry
  readonly lessonId: string
  readonly position: number
}

type FrameTerms = {
  readonly reading: ReadingTerms
  readonly admittedAt: ReadonlyMap<string, number>
  readonly taughtAt: ReadonlyMap<string, number>
}

const termsOf = (content: GateContent): FrameTerms => {
  const { grammar, curriculum, lessons } = content
  const positionOf = (lessonId: string): number => curriculum.lessonIds.indexOf(lessonId) + 1
  return {
    reading: readingTermsOf(content),
    admittedAt: new Map(
      [...frameWordsOf(grammar)].map(([word, lessonId]) => [word, positionOf(lessonId)]),
    ),
    taughtAt: new Map(
      lessons.flatMap(({ content, words }) =>
        words.map(({ lemma }) => [lemma.toLowerCase(), positionOf(content.id)] as const),
      ),
    ),
  }
}

const readingFailures = (
  token: string,
  reading: Reading,
  { id }: LexiconEntry,
): ReadonlyArray<string> => {
  switch (reading.kind) {
    case 'word':
      return []
    case 'unknownForm':
      return [`${id}: frame holds ${token}, which no NGSL form or off-list word spells`]
    case 'unnamedHomograph':
      return [`${id}: frame holds the homograph ${token} and names no word for it`]
    case 'impossibleHomograph':
      return [`${id}: names ${reading.named} for ${token}, which ${token} cannot mean`]
    default: {
      const unreachable: never = reading
      return unreachable
    }
  }
}

const otherWordFailures = (
  token: string,
  word: string,
  frame: LessonFrame,
  terms: FrameTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.admittedAt.get(word)
  if (admittedAt !== undefined) {
    return admittedAt > 0 && admittedAt <= frame.position
      ? []
      : [`${frame.entry.id}: frame holds ${token}, a frame word admitted after ${frame.lessonId}`]
  }
  const taughtAt = terms.taughtAt.get(word)
  return taughtAt !== undefined && taughtAt < frame.position
    ? []
    : [`${frame.entry.id}: frame holds ${token}, a word no earlier lesson teaches`]
}

const lemmaFailures = (
  lemmaTokens: ReadonlyArray<string>,
  { entry }: LessonFrame,
): ReadonlyArray<string> => {
  const lemma = entry.lemma.toLowerCase()
  const [token, ...others] = lemmaTokens
  if (token === undefined || others.length > 0) {
    return [`${entry.id}: frame holds ${entry.lemma} ${lemmaTokens.length} times, not once`]
  }
  if (token !== lemma) {
    return [`${entry.id}: frame holds ${entry.lemma} as ${token}, not in its own form`]
  }
  const gapped = entry.frame.replace(new RegExp(`\\b${entry.lemma}\\b`, 'i'), gap)
  return gapped === entry.gappedFrame
    ? []
    : [`${entry.id}: gapped frame is not its frame with ${entry.lemma} replaced by ${gap}`]
}

const frameFailures = (frame: LessonFrame, terms: FrameTerms): ReadonlyArray<string> => {
  const lemma = frame.entry.lemma.toLowerCase()
  const lemmaTokens: Array<string> = []
  const failures = tokensOf(frame.entry.frame).flatMap((token) => {
    const reading = readingOf(token, frame.entry, terms.reading)
    if (reading.kind !== 'word') {
      return readingFailures(token, reading, frame.entry)
    }
    if (reading.word === lemma) {
      lemmaTokens.push(token)
      return []
    }
    return otherWordFailures(token, reading.word, frame, terms)
  })
  return [...failures, ...lemmaFailures(lemmaTokens, frame)]
}

export const checkFrames = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return content.lessons.flatMap(({ content: lesson, words }) =>
    words.flatMap((entry) =>
      frameFailures(
        {
          entry,
          lessonId: lesson.id,
          position: content.curriculum.lessonIds.indexOf(lesson.id) + 1,
        },
        terms,
      ),
    ),
  )
}
