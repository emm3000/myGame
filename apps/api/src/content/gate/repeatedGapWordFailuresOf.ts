import type { LessonFrame } from './framePlacementsOf'

const gap = '____'

const wordsBeforeGap = 2

const wordsAfterGap = 1

type GapWords = {
  readonly frame: LessonFrame
  readonly words: string | undefined
}

const gapWordsOf = (frame: LessonFrame): GapWords => {
  const tokens: ReadonlyArray<string> =
    frame.gappedFrame.toLowerCase().match(/_{4}|[a-z]+(?:['’][a-z]+)?/g) ?? []
  const first = tokens.indexOf(gap)
  const last = tokens.lastIndexOf(gap) + 1
  const words =
    first < 0
      ? undefined
      : tokens.slice(Math.max(0, first - wordsBeforeGap), last + wordsAfterGap).join(' ')
  return { frame, words }
}

const repeatedFailures = (
  { frame, words }: GapWords,
  earlier: ReadonlyArray<GapWords>,
): ReadonlyArray<string> => {
  const repeated = earlier.find(
    (other) => other.frame.entry.id === frame.entry.id && other.words === words,
  )
  return words === undefined || repeated === undefined
    ? []
    : [
        `${frame.label}: frame repeats ${words}, the words around the gap of ${repeated.frame.label}`,
      ]
}

export const repeatedGapWordFailuresOf = (
  frames: ReadonlyArray<LessonFrame>,
): ReadonlyArray<string> => {
  const gapWords = frames.map((frame) => gapWordsOf(frame))
  return gapWords.flatMap((frameWords, index) =>
    repeatedFailures(frameWords, gapWords.slice(0, index)),
  )
}
