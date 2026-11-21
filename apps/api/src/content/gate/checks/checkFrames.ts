import { lemmaWordsOf } from '@mygame/domain'
import { readingOf } from '../../infrastructure/json/readingOf'
import { type ReadingTerms, readingTermsOf } from '../../infrastructure/json/readingTermsOf'
import { cardWordPositionsOf } from '../cardWordPositionsOf'
import { framePlacementsOf, type LessonFrame } from '../framePlacementsOf'
import { frameWordAdmissionsOf } from '../frameWordAdmissionsOf'
import type { GateContent } from '../GateContent'
import { readingFailuresOf } from '../readingFailuresOf'
import { tokensOf } from '../tokensOf'

const gap = '____'

type FrameTerms = {
  readonly reading: ReadingTerms
  readonly admittedAt: ReadonlyMap<string, number>
  readonly taughtAt: ReadonlyMap<string, number>
}

const termsOf = (content: GateContent): FrameTerms => ({
  reading: readingTermsOf(content),
  admittedAt: frameWordAdmissionsOf(content),
  taughtAt: cardWordPositionsOf(content),
})

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
      : [`${frame.label}: frame holds ${token}, a frame word admitted after ${frame.lessonId}`]
  }
  const taughtAt = terms.taughtAt.get(word)
  return taughtAt !== undefined && taughtAt < frame.position
    ? []
    : [`${frame.label}: frame holds ${token}, a word no earlier lesson teaches`]
}

const lemmaFailures = (
  occurrences: ReadonlyArray<string>,
  { entry, frame, gappedFrame, label }: LessonFrame,
): ReadonlyArray<string> => {
  const words = lemmaWordsOf(entry.lemma)
  const [held, ...others] = occurrences
  if (held === undefined || others.length > 0) {
    return [`${label}: frame holds ${entry.lemma} ${occurrences.length} times, not once`]
  }
  if (held !== words.join(' ')) {
    return [`${label}: frame holds ${entry.lemma} as ${held}, not in its own form`]
  }
  const together = new RegExp(`\\b${words.join('\\s+')}\\b`, 'i')
  if (!together.test(frame)) {
    return [`${label}: frame holds ${entry.lemma} with its words apart, not together`]
  }
  const gaps = words.map(() => gap).join(' ')
  return frame.replace(together, gaps) === gappedFrame
    ? []
    : [`${label}: gapped frame is not its frame with ${entry.lemma} replaced by ${gaps}`]
}

const noCardSenseFailures = ({ frame, noCardSense, label }: LessonFrame): ReadonlyArray<string> => {
  const tokens = tokensOf(frame)
  return noCardSense
    .filter((form) => !tokens.includes(form))
    .map((form) => `${label}: names ${form} in no card sense, a token its frame does not hold`)
}

const frameFailures = (frame: LessonFrame, terms: FrameTerms): ReadonlyArray<string> => {
  const words = lemmaWordsOf(frame.entry.lemma)
  const readings = tokensOf(frame.frame).map((token) => ({
    token,
    reading: readingOf(token, frame.entry, terms.reading),
  }))
  const starts = readings.flatMap((_, start) =>
    words.every((word, offset) => {
      const reading = readings[start + offset]?.reading
      return reading?.kind === 'word' && reading.word === word
    })
      ? [start]
      : [],
  )
  const held = new Set(starts.flatMap((start) => words.map((_, offset) => start + offset)))
  const failures = readings.flatMap(({ token, reading }, index) => {
    if (reading.kind !== 'word') {
      return readingFailuresOf(token, reading, { label: frame.label, kind: 'frame' })
    }
    return held.has(index) ? [] : otherWordFailures(token, reading.word, frame, terms)
  })
  const occurrences = starts.map((start) =>
    readings
      .slice(start, start + words.length)
      .map(({ token }) => token)
      .join(' '),
  )
  return [...failures, ...lemmaFailures(occurrences, frame), ...noCardSenseFailures(frame)]
}

export const checkFrames = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  const { frames, failures } = framePlacementsOf(content)
  return [...failures, ...frames.flatMap((frame) => frameFailures(frame, terms))]
}
