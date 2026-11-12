import { bandOfRank } from '../adapters/json/bandOfRank'
import type { LessonOfFiles, LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { isUnit } from './isUnit'
import { isUnitLesson } from './isUnitLesson'
import { lemmaWordsOf } from './lemmaWordsOf'

const windowSize = 30

const lessonSize = 5

const lastLessonLimit = 10

const fewestUnits = 5

const mostUnits = 9

const unitLessonSpacing = 4

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

type UnitTerms = {
  readonly taught: ReadonlySet<string>
  readonly admittedAt: ReadonlyMap<string, number>
}

const readinessFailures = (
  lessonId: string,
  position: number,
  { lemma }: LexiconEntry,
  { taught, admittedAt }: UnitTerms,
): ReadonlyArray<string> =>
  lemmaWordsOf(lemma).flatMap((word) => {
    const admission = admittedAt.get(word)
    if (admission !== undefined) {
      return admission > 0 && admission <= position
        ? []
        : [`${lessonId}: ${lemma} holds ${word}, a frame word admitted after ${lessonId}`]
    }
    return taught.has(word)
      ? []
      : [`${lessonId}: ${lemma} holds ${word}, a word no earlier lesson teaches`]
  })

const sharedVerbFailures = (
  lessonId: string,
  words: ReadonlyArray<LexiconEntry>,
): ReadonlyArray<string> => {
  const phrasalVerbs = new Map<string, ReadonlyArray<string>>()
  for (const { lemma } of words.filter(({ source }) => source === 'phave')) {
    const [verb = lemma] = lemmaWordsOf(lemma)
    phrasalVerbs.set(verb, [...(phrasalVerbs.get(verb) ?? []), lemma])
  }
  return [...phrasalVerbs]
    .filter(([, lemmas]) => lemmas.length > 1)
    .map(
      ([verb, lemmas]) =>
        `${lessonId}: the phrasal verbs ${lemmas.join(' and ')} share their verb ${verb}`,
    )
}

const unitLessonFailures = (
  { content, words }: LessonOfFiles,
  position: number,
  terms: UnitTerms,
): ReadonlyArray<string> => [
  ...(words.length >= fewestUnits && words.length <= mostUnits
    ? []
    : [`${content.id}: teaches ${words.length} units, not ${fewestUnits} to ${mostUnits}`]),
  ...words.flatMap((entry) => readinessFailures(content.id, position, entry, terms)),
  ...sharedVerbFailures(content.id, words),
]

const chromeLessonFailures = ({ content, words }: LessonOfFiles): ReadonlyArray<string> =>
  words
    .filter(isUnit)
    .map(
      ({ lemma }) =>
        `${content.id}: teaches the multi-word unit ${lemma}, which no chrome lesson teaches`,
    )

const spacingFailures = ({ lessons, curriculum }: GateContent): ReadonlyArray<string> => {
  const unitLessons = lessons.flatMap((lesson, index) =>
    index >= curriculum.chromeLessonCount && isUnitLesson(lesson)
      ? [{ id: lesson.content.id, index }]
      : [],
  )
  return unitLessons.slice(1).flatMap((later, previous) => {
    const earlier = unitLessons[previous]
    if (earlier === undefined) {
      return []
    }
    const between = later.index - earlier.index - 1
    return between >= unitLessonSpacing
      ? []
      : [
          `${later.id}: comes ${between} band lessons after the unit lesson ${earlier.id}, not at least ${unitLessonSpacing}`,
        ]
  })
}

const lessonFailures = (
  lesson: LessonOfFiles,
  index: number,
  current: Band | undefined,
  terms: UnitTerms,
  { curriculum }: GateContent,
): ReadonlyArray<string> => {
  if (index < curriculum.chromeLessonCount) {
    return chromeLessonFailures(lesson)
  }
  if (isUnitLesson(lesson)) {
    return unitLessonFailures(lesson, index + 1, terms)
  }
  if (lesson.words.some(isUnit)) {
    return [`${lesson.content.id}: mixes multi-word units with single words`]
  }
  return current === undefined
    ? [`${lesson.content.id}: comes after every band is taught`]
    : bandLessonFailures(lesson, current)
}

export const checkOrder = (content: GateContent): ReadonlyArray<string> => {
  const bands = bandsOf(content)
  const admittedAt = frameWordAdmissionsOf(content)
  const taught = new Set<string>()
  const failures = content.lessons.flatMap((lesson, index) => {
    const found = lessonFailures(
      lesson,
      index,
      currentBand(bands, taught),
      { taught, admittedAt },
      content,
    )
    for (const { lemma } of lesson.words) {
      taught.add(lemma.toLowerCase())
    }
    return found
  })
  return [...chromeCountFailures(content), ...failures, ...spacingFailures(content)]
}
