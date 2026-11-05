import { bandOfRank } from '../adapters/json/bandOfRank'
import type { LessonOfFiles, LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'

const windowSize = 30

const lessonSize = 5

const lastLessonLimit = 10

type Band = { readonly band: number; readonly untaught: ReadonlyArray<string> }

const bandsOf = ({ ranks, grammar }: GateContent): ReadonlyArray<ReadonlyArray<string>> => {
  const frameWords = frameWordsOf(grammar)
  const cardWords = [...ranks]
    .filter(([lemma]) => !frameWords.has(lemma))
    .sort(([, a], [, b]) => a - b)
  const bandCount = Math.max(0, ...cardWords.map(([, rank]) => bandOfRank(rank)))
  return Array.from({ length: bandCount }, (_, index) =>
    cardWords.filter(([, rank]) => bandOfRank(rank) === index + 1).map(([lemma]) => lemma),
  )
}

const currentBand = (
  bands: ReadonlyArray<ReadonlyArray<string>>,
  taught: ReadonlySet<string>,
): Band | undefined =>
  bands
    .map((lemmas, index) => ({
      band: index + 1,
      untaught: lemmas.filter((lemma) => !taught.has(lemma)),
    }))
    .find(({ untaught }) => untaught.length > 0)

const wordFailures = (
  lessonId: string,
  { lemma, isOffList }: LexiconEntry,
  { band, untaught }: Band,
): ReadonlyArray<string> => {
  if (isOffList === true) {
    return [`${lessonId}: ${lemma} is off-list, which only a chrome lesson teaches`]
  }
  if (untaught.slice(0, windowSize).includes(lemma.toLowerCase())) {
    return []
  }
  return [
    `${lessonId}: ${lemma} is not among the ${windowSize} lowest-ranked untaught card words of band ${band}`,
  ]
}

const bandLessonFailures = (
  { content, words }: LessonOfFiles,
  current: Band,
): ReadonlyArray<string> => {
  const [head] = current.untaught
  const expectedCount =
    current.untaught.length < lastLessonLimit ? current.untaught.length : lessonSize
  const holdsHead = head === undefined || words.some(({ lemma }) => lemma.toLowerCase() === head)
  return [
    ...(holdsHead
      ? []
      : [
          `${content.id}: does not hold ${head}, the lowest-ranked untaught card word of band ${current.band}`,
        ]),
    ...words.flatMap((entry) => wordFailures(content.id, entry, current)),
    ...(words.length === expectedCount
      ? []
      : [`${content.id}: teaches ${words.length} card words, not ${expectedCount}`]),
  ]
}

const chromeCountFailures = ({ curriculum }: GateContent): ReadonlyArray<string> => {
  const { chromeLessonCount, lessonIds } = curriculum
  const lessonCount = `${lessonIds.length} lesson${lessonIds.length === 1 ? '' : 's'}`
  return chromeLessonCount <= lessonIds.length
    ? []
    : [`curriculum counts ${chromeLessonCount} chrome lessons but lists ${lessonCount}`]
}

export const checkOrder = (content: GateContent): ReadonlyArray<string> => {
  const bands = bandsOf(content)
  const taught = new Set<string>()
  const failures = content.lessons.flatMap((lesson, index) => {
    const current = currentBand(bands, taught)
    for (const { lemma } of lesson.words) {
      taught.add(lemma.toLowerCase())
    }
    if (index < content.curriculum.chromeLessonCount) {
      return []
    }
    return current === undefined
      ? [`${lesson.content.id}: comes after every band is taught`]
      : bandLessonFailures(lesson, current)
  })
  return [...chromeCountFailures(content), ...failures]
}
