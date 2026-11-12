import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'
import { isUnit } from './isUnit'
import { lemmaWordsOf } from './lemmaWordsOf'
import { repeated } from './repeated'

const frameWordRankLimit = 100

const unitFailures = (
  { id, lemma, isOffList, source }: LexiconEntry,
  { ranks, grammar }: GateContent,
): ReadonlyArray<string> => {
  const frameWords = frameWordsOf(grammar)
  return [
    ...(source === undefined ? [`${id}: ${lemma} is a multi-word unit that names no list`] : []),
    ...(isOffList === true ? [`${id}: ${lemma} is a multi-word unit marked off-list`] : []),
    ...lemmaWordsOf(lemma)
      .filter((word) => !ranks.has(word) && !frameWords.has(word))
      .map(
        (word) =>
          `${id}: ${lemma} holds ${word}, which is neither an NGSL headword nor a frame word`,
      ),
  ]
}

const singleWordFailures = (
  { id, lemma, isOffList, source }: LexiconEntry,
  { ranks, grammar }: GateContent,
): ReadonlyArray<string> => {
  const word = lemma.toLowerCase()
  if (frameWordsOf(grammar).has(word)) {
    return [`${id}: ${lemma} is a frame word, which never has a lexicon entry`]
  }
  if (source !== undefined) {
    return [`${id}: ${lemma} is a single word that names a unit list`]
  }
  if (ranks.has(word) && isOffList === true) {
    return [`${id}: ${lemma} is an NGSL headword marked off-list`]
  }
  if (!ranks.has(word) && isOffList !== true) {
    return [`${id}: ${lemma} is neither an NGSL headword nor marked off-list`]
  }
  return []
}

const lemmaFailures = (content: GateContent): ReadonlyArray<string> =>
  content.lexicon.flatMap((entry) =>
    isUnit(entry) ? unitFailures(entry, content) : singleWordFailures(entry, content),
  )

const teachingFailures = ({ lessons }: GateContent): ReadonlyArray<string> => {
  const teachers = new Map<string, { lemma: string; lessonIds: Array<string> }>()
  for (const { content, words } of lessons) {
    for (const { id, lemma } of words) {
      teachers.set(id, { lemma, lessonIds: [...(teachers.get(id)?.lessonIds ?? []), content.id] })
    }
  }
  return [...teachers]
    .filter(([, { lessonIds }]) => lessonIds.length > 1)
    .map(([id, { lemma, lessonIds }]) => `${id}: ${lemma} is taught by ${lessonIds.join(' and ')}`)
}

const rankFailures = ({ grammar, ranks }: GateContent): ReadonlyArray<string> =>
  [...frameWordsOf(grammar).keys()].flatMap((word) => {
    const rank = ranks.get(word)
    return rank !== undefined && rank <= frameWordRankLimit
      ? []
      : [`frame word ${word} is not among the first ${frameWordRankLimit} NGSL ranks`]
  })

export const checkLexicon = (content: GateContent): ReadonlyArray<string> => [
  ...repeated(content.lexicon.map(({ id }) => id)).map(
    (id) => `word id ${id} is used more than once`,
  ),
  ...lemmaFailures(content),
  ...teachingFailures(content),
  ...repeated(
    content.grammar.structures.flatMap(({ frameWords }) =>
      frameWords.map((word) => word.toLowerCase()),
    ),
  ).map((word) => `frame word ${word} is listed more than once`),
  ...rankFailures(content),
]
