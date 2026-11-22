import type { HaveBefore } from './CardWordFormContext'
import { subjectPronouns } from './subjectPronouns'

export type SubjectWords = {
  readonly isNoun: (token: string) => boolean
  readonly isFrameWord: (token: string) => boolean
}

const haveForms: ReadonlyMap<string, HaveBefore> = new Map([
  ['have', 'have'],
  ['has', 'have'],
  ["'s", "'s"],
])

const perfectAdverbs: ReadonlySet<string> = new Set([
  'not',
  "n't",
  'never',
  'just',
  'already',
  'ever',
])

const isDeterminer = (token: string, { isFrameWord }: SubjectWords): boolean =>
  isFrameWord(token) && !haveForms.has(token)

const subjectSkipped = (
  latestFirst: ReadonlyArray<string>,
  subjectWords: SubjectWords,
): ReadonlyArray<string> => {
  const [last, ...earlier] = latestFirst
  if (last !== undefined && subjectPronouns.has(last)) {
    return earlier
  }
  if (last === undefined || !subjectWords.isNoun(last)) {
    return latestFirst
  }
  const [beforeNoun, ...earlierStill] = earlier
  return beforeNoun !== undefined && isDeterminer(beforeNoun, subjectWords) ? earlierStill : earlier
}

export const haveBeforeOf = (
  earlier: ReadonlyArray<string>,
  subjectWords: SubjectWords,
): HaveBefore => {
  const latestFirst = earlier.filter((token) => !perfectAdverbs.has(token)).toReversed()
  const [host] = subjectSkipped(latestFirst, subjectWords)
  return (host === undefined ? undefined : haveForms.get(host)) ?? 'none'
}
