import { lemmaWordsOf } from '@mygame/domain'
import { framePlacementsOf, type LessonFrame } from './framePlacementsOf'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import type { GateContent } from './GateContent'
import { type Reading, readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'
import { tokensOf } from './tokensOf'

const gap = '____'

type FrameTerms = {
  readonly reading: ReadingTerms
  readonly admittedAt: ReadonlyMap<string, number>
  readonly taughtAt: ReadonlyMap<string, number>
}

const termsOf = (content: GateContent): FrameTerms => {
  const { curriculum, lessons } = content
  const positionOf = (lessonId: string): number => curriculum.lessonIds.indexOf(lessonId) + 1
  return {
    reading: readingTermsOf(content),
    admittedAt: frameWordAdmissionsOf(content),
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
  { label }: LessonFrame,
): ReadonlyArray<string> => {
  switch (reading.kind) {
    case 'word':
      return []
    case 'unknownForm':
      return [`${label}: frame holds ${token}, which no NGSL form or off-list word spells`]
    case 'unnamedHomograph':
      return [`${label}: frame holds the homograph ${token} and names no word for it`]
    case 'impossibleHomograph':
      return [`${label}: names ${reading.named} for ${token}, which ${token} cannot mean`]
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
      return readingFailures(token, reading, frame)
    }
    return held.has(index) ? [] : otherWordFailures(token, reading.word, frame, terms)
  })
  const occurrences = starts.map((start) =>
    readings
      .slice(start, start + words.length)
      .map(({ token }) => token)
      .join(' '),
  )
  return [...failures, ...lemmaFailures(occurrences, frame)]
}

export const checkFrames = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  const { frames, failures } = framePlacementsOf(content)
  return [...failures, ...frames.flatMap((frame) => frameFailures(frame, terms))]
}
