import { frameWordsOf } from './frameWordsOf'
import type { GateContent } from './GateContent'

const frameWordRankLimit = 100

const repeated = (values: ReadonlyArray<string>): ReadonlyArray<string> => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
]

const lemmaFailures = ({ lexicon, ranks, grammar }: GateContent): ReadonlyArray<string> => {
  const frameWords = frameWordsOf(grammar)
  return lexicon.flatMap(({ id, lemma, isOffList }) => {
    const word = lemma.toLowerCase()
    if (frameWords.has(word)) {
      return [`${id}: ${lemma} is a frame word, which never has a lexicon entry`]
    }
    if (ranks.has(word) && isOffList === true) {
      return [`${id}: ${lemma} is an NGSL headword marked off-list`]
    }
    if (!ranks.has(word) && isOffList !== true) {
      return [`${id}: ${lemma} is neither an NGSL headword nor marked off-list`]
    }
    return []
  })
}

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

const grammarFailures = ({ grammar, ranks, curriculum }: GateContent): ReadonlyArray<string> =>
  grammar.frameWords.flatMap(({ word, admittingLessonId }) => {
    const rank = ranks.get(word.toLowerCase())
    return [
      ...(rank !== undefined && rank <= frameWordRankLimit
        ? []
        : [`frame word ${word} is not among the first ${frameWordRankLimit} NGSL ranks`]),
      ...(curriculum.lessonIds.includes(admittingLessonId)
        ? []
        : [
            `frame word ${word} is admitted by ${admittingLessonId}, which the curriculum does not list`,
          ]),
    ]
  })

export const checkLexicon = (content: GateContent): ReadonlyArray<string> => [
  ...repeated(content.lexicon.map(({ id }) => id)).map(
    (id) => `word id ${id} is used more than once`,
  ),
  ...lemmaFailures(content),
  ...teachingFailures(content),
  ...repeated(content.grammar.frameWords.map(({ word }) => word.toLowerCase())).map(
    (word) => `frame word ${word} is listed more than once`,
  ),
  ...grammarFailures(content),
]
